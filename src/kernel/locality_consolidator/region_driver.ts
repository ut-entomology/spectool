/**
 * This algorithm addresses the problem in which comparing localities normally
 * requires comparing each locality to all other localities at N^2 complexity.
 * The algorithm strives to minimize the number of regions for which localities
 * are cached at any given time, keeping only those that really need to be
 * compared to others already cached. It does this by restricting comparisons
 * to just adjacent localities and relevant containing or contained localities.
 */

import { AdjoiningRegions } from './adjoining_regions';
import { Region, RegionRank } from '../../shared/shared_geography';
import { TrackedRegionStatus, TrackedRegion } from './tracked_region';
import { TrackedRegionRoster } from './region_roster';
import { LocalityCache } from './locality_cache';

export type ProcessRegionCallback = (region: TrackedRegion) => void;

export interface Diagnostics {
  reportPrimaryState(
    regionRoster: TrackedRegionRoster,
    primaryContext: string,
    newlyProcessedRegion?: TrackedRegion
  ): void;

  reportSecondaryProcess(
    primaryContext: string,
    secondaryContext: string,
    forRegion: TrackedRegion
  ): void;

  reportSecondaryState(
    regionRoster: TrackedRegionRoster,
    primaryContext: string,
    secondaryContext: string,
    forRegion: TrackedRegion,
    aroundRegion: TrackedRegion
  ): void;
}

export class AdjoiningRegionDriver {
  private _overDomainIDLookup: Record<number, boolean> = {};
  private _processRegionCallback: ProcessRegionCallback;
  private _localityCache: LocalityCache;
  private _initialGeographyID: number | null;

  _regionRoster: TrackedRegionRoster;
  _adjoiningRegions: AdjoiningRegions;
  _diagnostics: Diagnostics | null;
  _newlyCachedRegionNeighborVisitor: NewlyCachedRegionNeighborVisitor;
  _finishCachingAroundRegionVisitor: FinishCachingAroundRegionVisitor;
  _pendingNearDomainRegionVisitor: PendingNearDomainRegionVisitor;

  constructor(
    adjoiningRegions: AdjoiningRegions,
    domainRegions: Region[],
    localityCache: LocalityCache,
    processRegionCallback: ProcessRegionCallback,
    diagnostics?: Diagnostics,
    initialGeographyID?: number
  ) {
    this._regionRoster = new TrackedRegionRoster();
    this._adjoiningRegions = adjoiningRegions;
    this._localityCache = localityCache;
    this._processRegionCallback = processRegionCallback;
    this._diagnostics = diagnostics || null;
    this._initialGeographyID = initialGeographyID || null;

    this._newlyCachedRegionNeighborVisitor = new NewlyCachedRegionNeighborVisitor(this);
    this._finishCachingAroundRegionVisitor = new FinishCachingAroundRegionVisitor(this);
    this._pendingNearDomainRegionVisitor = new PendingNearDomainRegionVisitor(this);

    // Generate the tracked regions used for consolidation.

    const domainsByID: Record<number, Region> = {};
    for (const domainRegion of domainRegions) {
      domainsByID[domainRegion.id] = domainRegion;
      this._regionRoster.add(new TrackedRegion(domainRegion, true));
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
    if (this._diagnostics) {
      this._diagnostics.reportPrimaryState(this._regionRoster, 'After initialization');
    }

    let currentRegion: TrackedRegion | null = this._regionRoster.getArbitraryRegion();
    if (this._initialGeographyID !== null) {
      currentRegion = this._regionRoster.getByID(this._initialGeographyID)!;
    }
    await this._cachePendingRegion(currentRegion);

    // Loop
    while (currentRegion != null) {
      if (this._diagnostics) {
        this._diagnostics.reportPrimaryState(
          this._regionRoster,
          'Top of loop',
          currentRegion
        );
      }

      // Consolidate
      if (currentRegion.adjoiningPendingCount != 0) {
        await this._finishCachingAroundRegionVisitor.visitAroundRegion(currentRegion);
      }
      // also responsible for uncaching localities as each is processed
      this._processRegionCallback(currentRegion);
      // have region treated as no longer pending or cached
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
    if (this._diagnostics) {
      this._diagnostics.reportPrimaryState(this._regionRoster, 'Completed');
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
  protected visitorName: string;
  protected _regionDriver: AdjoiningRegionDriver;

  constructor(visitorName: string, regionDriver: AdjoiningRegionDriver) {
    this.visitorName = visitorName;
    this._regionDriver = regionDriver;
  }

  async visitAroundRegion(aroundRegion: TrackedRegion) {
    if (aroundRegion.inDomain) {
      // Visit all regions adjoining a domain region
      this._reportSecondaryProcess(
        'visiting all regions adjoining a domain region',
        aroundRegion
      );
      for (const nearRegion of this._getAdjoiningRegions(aroundRegion)) {
        await this._visitAroundDomainRegion(nearRegion);
        if (this._visitationRestriction(nearRegion)) {
          await this._visitSubsetAroundDomainRegion(nearRegion, aroundRegion);
          //this._showState('after in-domain all', nearRegion, aroundRegion);
        }
      }
    } else {
      // Visit regions adjacent to a non-domain region
      this._reportSecondaryProcess(
        'visiting regions adjacent to a non-domain region',
        aroundRegion
      );
      for (const nearRegion of this._getAdjacentRegions(aroundRegion)) {
        if (nearRegion.inDomain && this._visitationRestriction(nearRegion)) {
          await this._visitSubsetAroundNonDomainRegion(nearRegion, aroundRegion);
          //this._showState('after non-domain adjacent', nearRegion, aroundRegion);
        }
      }
      if (this._regionDriver._isInOverDomain(aroundRegion.id)) {
        // Visit child regions of a non-domain region
        this._reportSecondaryProcess(
          'visiting child regions of a non-domain region',
          aroundRegion
        );
        for (const childRegion of this._getDescendantRegions(aroundRegion)) {
          // Not every child of an over-domain region need be in the domain.
          if (childRegion.inDomain && this._visitationRestriction(childRegion)) {
            await this._visitSubsetAroundNonDomainRegion(childRegion, aroundRegion);
            //this._showState('after non-domain child', childRegion, aroundRegion);
          }
        }
      }
    }
  }

  /**
   * Returns the number of localities whose geographic IDs are exactly equal to
   * the geographic ID of the provided region. Does not include subregions.
   */

  protected _computeLocalityCount(forExactRegion: TrackedRegion): number {
    if (forExactRegion.localityTotal === null) {
      forExactRegion.localityTotal =
        this._regionDriver._adjoiningRegions.getLocalityCount(forExactRegion.id);
    }
    return forExactRegion.localityTotal;
  }

  protected _getAdjacentRegions(toRegion: TrackedRegion): TrackedRegion[] {
    const regions = this._regionDriver._adjoiningRegions.getAdjacentRegions(
      toRegion.id
    );
    return regions.map((region) => this._getTrackedRegion(region));
  }

  protected _getAdjoiningRegions(aroundRegion: TrackedRegion): TrackedRegion[] {
    // TODO: Experiment with whether it's more efficient to process
    // parent or child regions first.
    let regions = this._getAdjacentRegions(aroundRegion);
    regions = regions.concat(this._getDescendantRegions(aroundRegion));
    return regions.concat(this._getContainingRegions(aroundRegion));
  }

  protected _getContainingRegions(aboveRegion: TrackedRegion): TrackedRegion[] {
    const regions = this._regionDriver._adjoiningRegions.getContainingRegions(
      aboveRegion.id
    );
    return regions.map((region) => this._getTrackedRegion(region));
  }

  protected _getDescendantRegions(underRegion: TrackedRegion): TrackedRegion[] {
    const regions = this._regionDriver._adjoiningRegions.getDescendantRegions(
      underRegion.id
    );
    return regions.map((region) => this._getTrackedRegion(region));
  }

  protected _getTrackedRegion(region: Region): TrackedRegion {
    let trackedRegion = this._regionDriver._regionRoster.getByID(region.id);
    if (!trackedRegion) {
      trackedRegion = new TrackedRegion(region, false);
      this._regionDriver._regionRoster.add(trackedRegion);
    }
    return trackedRegion;
  }

  protected _visitAroundDomainRegion(_nearRegion: TrackedRegion): Promise<void> {
    // do nothing by default
    return Promise.resolve();
  }

  protected abstract _visitationRestriction(nearRegion: TrackedRegion): boolean;

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

  protected _reportSecondaryProcess(
    secondaryContext: string,
    forRegion: TrackedRegion
  ): void {
    if (this._regionDriver._diagnostics) {
      this._regionDriver._diagnostics.reportSecondaryProcess(
        this.visitorName,
        secondaryContext,
        forRegion
      );
    }
  }

  protected _reportSecondaryState(
    secondaryContext: string,
    forRegion: TrackedRegion,
    aroundRegion: TrackedRegion
  ): void {
    if (this._regionDriver._diagnostics) {
      this._regionDriver._diagnostics.reportSecondaryState(
        this._regionDriver._regionRoster,
        this.visitorName,
        secondaryContext,
        forRegion,
        aroundRegion
      );
    }
  }
}

/**
 * Visitor of neighbors around a newly cached region.
 */

class NewlyCachedRegionNeighborVisitor extends RegionVisitor {
  constructor(regionDriver: AdjoiningRegionDriver) {
    super('cache single', regionDriver);
  }

  protected _visitationRestriction(nearRegion: TrackedRegion) {
    return nearRegion.status == TrackedRegionStatus.Pending;
  }

  protected async _visitAroundDomainRegion(nearRegion: TrackedRegion) {
    if (!this._regionDriver._regionRoster.includes(nearRegion)) {
      this._regionDriver._regionRoster.add(nearRegion);
    }
  }

  protected async _visitSubsetAroundDomainRegion(
    nearRegion: TrackedRegion,
    aroundRegion: TrackedRegion
  ) {
    // Increment pending count due to adjoining pending region
    aroundRegion.adjoiningPendingCount += this._computeLocalityCount(nearRegion);
    this._reportSecondaryState(
      'increment pending count due to adjoining pending region',
      nearRegion,
      aroundRegion
    );
  }
}

class PendingNearDomainRegionVisitor extends RegionVisitor {
  constructor(regionDriver: AdjoiningRegionDriver) {
    super('prep to remove', regionDriver);
  }

  protected _visitationRestriction(nearRegion: TrackedRegion) {
    return nearRegion.status == TrackedRegionStatus.Cached;
  }

  protected async _visitSubsetAroundDomainRegion(
    nearRegion: TrackedRegion,
    aroundRegion: TrackedRegion
  ) {
    // Decrement pending count for newly cached region adjoining domain region
    nearRegion.adjoiningPendingCount -= this._computeLocalityCount(aroundRegion);
    this._reportSecondaryState(
      'decrement pending count for newly cached region adjoining domain region',
      nearRegion,
      aroundRegion
    );
  }
}

/**
 * Visits around a region to finish caching its neighbors so that the
 * region's localities can be processed.
 */

class FinishCachingAroundRegionVisitor extends RegionVisitor {
  constructor(regionDriver: AdjoiningRegionDriver) {
    super('cache around', regionDriver);
  }

  protected _visitationRestriction(nearRegion: TrackedRegion) {
    return nearRegion.status == TrackedRegionStatus.Pending;
  }

  protected async _visitSubsetAroundDomainRegion(
    nearRegion: TrackedRegion,
    _aroundRegion: TrackedRegion
  ) {
    await this._regionDriver._cachePendingRegion(nearRegion);
    await this._regionDriver._pendingNearDomainRegionVisitor.visitAroundRegion(
      nearRegion
    );
  }

  protected async _visitSubsetAroundNonDomainRegion(
    nearRegion: TrackedRegion,
    _aroundRegion: TrackedRegion
  ): Promise<void> {
    await this._regionDriver._cachePendingRegion(nearRegion);
    for (const aroundNearRegion of this._getAdjoiningRegions(nearRegion)) {
      if (aroundNearRegion.status == TrackedRegionStatus.Cached) {
        // Decrement pending count for newly cached region adjoining non-domain region
        aroundNearRegion.adjoiningPendingCount -=
          this._computeLocalityCount(nearRegion);
        this._reportSecondaryState(
          'decrement pending count for newly cached region adjoining non-domain region',
          aroundNearRegion,
          nearRegion
        );
      }
    }
  }
}
