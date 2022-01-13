/**
 * This algorithm addresses the problem in which comparing localities normally
 * requires comparing each locality to all other localities at N^2 complexity.
 * The algorithm strives to minimize the number of regions for which localities
 * are cached at any given time, keeping only those that really need to be
 * compared to others already cached. It does this by restricting comparisons
 * to just adjacent localities and relevant containing or contained localities.
 */

import { AdjoiningRegions } from './adjoining_regions';
import { Region, RegionRank } from '../../shared/region';
import { TrackedRegionStatus, TrackedRegion } from './tracked_region';
import { RegionRoster } from './region_roster';
import { LocalityCache } from './locality_cache';

export type ProcessRegionCallback = (region: TrackedRegion) => void;

export class LocalityConsolidator {
  private _overDomainIDLookup: Record<number, boolean> = {};
  private _processRegionCallback: ProcessRegionCallback;
  private _localityCache: LocalityCache;

  _regionRoster: RegionRoster;
  _adjoiningRegions: AdjoiningRegions;
  _newlyCachedRegionNeighborVisitor: NewlyCachedRegionNeighborVisitor;
  _finishCachingAroundRegionVisitor: FinishCachingAroundRegionVisitor;
  _pendingNearDomainRegionVisitor: PendingNearDomainRegionVisitor;

  constructor(
    adjoiningRegions: AdjoiningRegions,
    domainRegions: Region[],
    localityCache: LocalityCache,
    processRegionCallback: ProcessRegionCallback
  ) {
    this._regionRoster = new RegionRoster();
    this._adjoiningRegions = adjoiningRegions;
    this._localityCache = localityCache;
    this._processRegionCallback = processRegionCallback;
    this._newlyCachedRegionNeighborVisitor = new NewlyCachedRegionNeighborVisitor(this);
    this._finishCachingAroundRegionVisitor = new FinishCachingAroundRegionVisitor(this);
    this._pendingNearDomainRegionVisitor = new PendingNearDomainRegionVisitor(this);

    // Generate the tracked regions used for consolidation.

    const domainsByID: Record<number, Region> = {};
    for (const domainRegion of domainRegions) {
      domainsByID[domainRegion.id] = domainRegion;
      this._regionRoster.add(new TrackedRegion(domainRegion, true, 0));
    }

    // Collect the over-domain geographic IDs for easy lookup. The over-domain consists
    // of the geographic regions immediately containing geographics regions of the
    // domain but not themselves in the domain.

    for (const domainRegion of domainRegions) {
      if (domainRegion.rank !== RegionRank.Earth) {
        if (domainsByID[domainRegion.parentID] === undefined) {
          this._overDomainIDLookup[domainRegion.parentID] = true;
        }
      }
    }
  }

  async run() {
    let currentRegion: TrackedRegion | null = this._regionRoster.getArbitraryRegion();
    await this._cachePendingRegion(currentRegion);

    // Loop
    while (currentRegion != null) {
      // Consolidate
      if (currentRegion.adjoiningPendingCount != 0) {
        await this._finishCachingAroundRegionVisitor.visitAroundRegion(currentRegion);
      }
      // also responsible for uncaching localities as each is processed
      this._processRegionCallback(currentRegion);
      currentRegion.status = TrackedRegionStatus.Complete;

      // Select next region
      let lowestUncachedCount = Infinity;
      currentRegion = null;
      for (const prospect of this._regionRoster) {
        if (
          prospect.status == TrackedRegionStatus.Cached &&
          prospect.adjoiningPendingCount < lowestUncachedCount
        ) {
          lowestUncachedCount = prospect.adjoiningPendingCount;
          currentRegion = prospect;
        }
      }
    }
  }

  /**
   * Fully caches the neighbors around a pending region.
   */

  async _cachePendingRegion(regionToCache: TrackedRegion): Promise<void> {
    this._localityCache.cacheRegionLocalities(regionToCache);
    regionToCache.status = TrackedRegionStatus.Cached;
    await this._newlyCachedRegionNeighborVisitor.visitAroundRegion(regionToCache);
  }

  _isInOverDomain(geographicID: number): boolean {
    return this._overDomainIDLookup[geographicID] || false;
  }

  _removeRegion(fromList: TrackedRegion[], region: TrackedRegion): void {
    const index = fromList.indexOf(region);
    if (index >= 0) {
      fromList.splice(index, 1);
    }
  }
}

/**
 * Visit regions around a target region for the purpose of incrementing or
 * decrementing the target region's adjoiningPendingCount. Handles visits to
 * domain and non-domain regions differently, so that non-domain regions
 * don't unecessarily visit other non-domain regions.
 */

abstract class RegionVisitor {
  visitorName: string;
  protected _consolidator: LocalityConsolidator;

  constructor(visitorName: string, consolidator: LocalityConsolidator) {
    this.visitorName = visitorName;
    this._consolidator = consolidator;
  }

  async visitAroundRegion(aroundRegion: TrackedRegion) {
    if (aroundRegion.inDomain) {
      // Visit all regions adjoining a domain region
      for (const nearRegion of this._getAdjoiningRegions(aroundRegion)) {
        await this._visitAroundDomainRegion(nearRegion);
        if (this._visitationRestriction(nearRegion)) {
          await this._visitSubsetAroundDomainRegion(nearRegion, aroundRegion);
        }
      }
    } else {
      // Visit regions adjacenct to a non-domain region
      for (const nearRegion of this._getAdjacentRegions(aroundRegion)) {
        if (nearRegion.inDomain && this._visitationRestriction(nearRegion)) {
          await this._visitSubsetAroundNonDomainRegion(nearRegion, aroundRegion);
        }
      }
      if (this._consolidator._isInOverDomain(aroundRegion.id)) {
        // Visit child regions of a non-domain region
        for (const childRegion of this._getDescendantRegions(aroundRegion)) {
          if (!childRegion.inDomain) {
            throw Error(
              `Child region ID ${childRegion.id} of over domain region` +
                ` ID ${aroundRegion.id} is not in the domain`
            );
          }
          if (this._visitationRestriction(childRegion)) {
            await this._visitSubsetAroundNonDomainRegion(childRegion, aroundRegion);
          }
        }
      }
    }
  }

  protected abstract _visitationRestriction(nearRegion: TrackedRegion): boolean;

  protected _visitAroundDomainRegion(_nearRegion: TrackedRegion): Promise<void> {
    // do nothing by default
    return Promise.resolve();
  }

  protected abstract _visitSubsetAroundDomainRegion(
    nearRegion: TrackedRegion,
    aroundRegion: TrackedRegion
  ): Promise<void>;

  protected async _visitSubsetAroundNonDomainRegion(
    nearRegion: TrackedRegion,
    aroundRegion: TrackedRegion
  ): Promise<void> {
    await this._visitSubsetAroundDomainRegion(nearRegion, aroundRegion);
  }

  protected _getAdjacentRegions(toRegion: TrackedRegion): TrackedRegion[] {
    const regions = this._consolidator._adjoiningRegions.getAdjacentRegions(
      toRegion.id
    );
    return regions.map((region) => this._consolidator._regionRoster.getByID(region.id));
  }

  protected _getContainingRegions(aboveRegion: TrackedRegion): TrackedRegion[] {
    const ids = this._consolidator._adjoiningRegions.getContainingGeographyIDs(
      aboveRegion.id
    );
    return ids.map((id) => this._consolidator._regionRoster.getByID(id));
  }

  protected _getDescendantRegions(underRegion: TrackedRegion): TrackedRegion[] {
    const ids = this._consolidator._adjoiningRegions.getDescendantGeographyIDs(
      underRegion.id
    );
    return ids.map((id) => this._consolidator._regionRoster.getByID(id));
  }

  protected _getAdjoiningRegions(aroundRegion: TrackedRegion): TrackedRegion[] {
    // TODO: Experiment with whether it's more efficient to process
    // parent or child regions first.
    let regions = this._getAdjacentRegions(aroundRegion);
    regions = regions.concat(this._getDescendantRegions(aroundRegion));
    return regions.concat(this._getContainingRegions(aroundRegion));
  }
}

/**
 * Visitor of neighbors around a newly cached region.
 */

class NewlyCachedRegionNeighborVisitor extends RegionVisitor {
  constructor(consolidator: LocalityConsolidator) {
    super('cache single', consolidator);
  }

  protected _visitationRestriction(nearRegion: TrackedRegion) {
    return nearRegion.status == TrackedRegionStatus.Pending;
  }

  protected async _visitAroundDomainRegion(nearRegion: TrackedRegion) {
    if (!this._consolidator._regionRoster.includes(nearRegion)) {
      this._consolidator._regionRoster.add(nearRegion);
    }
  }

  protected async _visitSubsetAroundDomainRegion(
    nearRegion: TrackedRegion,
    aroundRegion: TrackedRegion
  ) {
    // Increment pending count due to adjoining pending region
    aroundRegion.adjoiningPendingCount += nearRegion.localityTotal;
  }
}

class PendingNearDomainRegionVisitor extends RegionVisitor {
  constructor(consolidator: LocalityConsolidator) {
    super('prep to remove', consolidator);
  }

  protected _visitationRestriction(nearRegion: TrackedRegion) {
    return nearRegion.status == TrackedRegionStatus.Cached;
  }

  protected async _visitSubsetAroundDomainRegion(
    nearRegion: TrackedRegion,
    aroundRegion: TrackedRegion
  ) {
    // Decrement pending count for newly cached region adjoining domain region
    nearRegion.adjoiningPendingCount -= aroundRegion.localityTotal;
  }
}

/**
 * Visits around a region to finish caching its neighbors so that the
 * region's localities can be processed.
 */

class FinishCachingAroundRegionVisitor extends RegionVisitor {
  constructor(consolidator: LocalityConsolidator) {
    super('cache around', consolidator);
  }

  protected _visitationRestriction(nearRegion: TrackedRegion) {
    return nearRegion.status == TrackedRegionStatus.Pending;
  }

  protected async _visitSubsetAroundDomainRegion(
    nearRegion: TrackedRegion,
    _aroundRegion: TrackedRegion
  ) {
    await this._consolidator._cachePendingRegion(nearRegion);
    await this._consolidator._pendingNearDomainRegionVisitor.visitAroundRegion(
      nearRegion
    );
  }

  protected async _visitSubsetAroundNonDomainRegion(
    nearRegion: TrackedRegion,
    _aroundRegion: TrackedRegion
  ): Promise<void> {
    await this._consolidator._cachePendingRegion(nearRegion);
    for (const aroundNearRegion of this._getAdjoiningRegions(nearRegion)) {
      if (aroundNearRegion.status == TrackedRegionStatus.Cached) {
        // Decrement pending count for newly cached region adjoining non-domain region
        aroundNearRegion.adjoiningPendingCount -= nearRegion.localityTotal;
      }
    }
  }
}
