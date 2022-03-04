/**
 * This algorithm addresses the problem in which comparing localities normally
 * requires comparing each locality to all other localities at N^2 complexity.
 * The algorithm strives to minimize the number of regions for which localities
 * are cached at any given time, keeping only those that really need to be
 * compared to others already cached. It does this by restricting comparisons
 * to just adjacent localities and relevant containing or contained localities.
 */

import type { RegionAccess } from './region_access';
import { Region, RegionRank } from '../../shared/shared_geography';
import { TrackedRegionStatus, TrackedRegion } from './tracked_region';
import type { TrackedRegionRoster } from './region_roster';
import type { LocalityCache } from './locality_cache';
import { IntervalTicker } from './interval_ticker';

export interface Diagnostics {
  reportPrimaryState(
    primaryContext: string,
    newlyProcessedRegion?: TrackedRegion
  ): Promise<void>;

  reportSecondaryProcess(
    primaryContext: string,
    secondaryContext: string,
    forRegion: TrackedRegion
  ): Promise<void>;

  reportSecondaryState(
    primaryContext: string,
    secondaryContext: string,
    forRegion: TrackedRegion,
    aroundRegion: TrackedRegion
  ): Promise<void>;
}

export class AdjoiningRegionDriver {
  private _domainRegions?: Region[];
  private _overDomainIDLookup: Record<number, boolean> = {};
  private _localityCache: LocalityCache;
  private _initialGeographyID: number | null;

  _regionRoster: TrackedRegionRoster;
  _regionAccess: RegionAccess;
  _diagnostics: Diagnostics | null;
  _newlyCachedRegionNeighborVisitor: NewlyCachedRegionNeighborVisitor;
  _finishCachingAroundRegionVisitor: FinishCachingAroundRegionVisitor;
  _pendingNearDomainRegionVisitor: PendingNearDomainRegionVisitor;
  _ticker = new IntervalTicker(400, 4, 10);

  constructor(
    regionAccess: RegionAccess,
    domainRegions: Region[],
    regionRoster: TrackedRegionRoster,
    localityCache: LocalityCache,
    diagnostics?: Diagnostics,
    initialGeographyID?: number
  ) {
    this._domainRegions = domainRegions;
    this._regionRoster = regionRoster;
    this._regionAccess = regionAccess;
    this._localityCache = localityCache;
    this._diagnostics = diagnostics || null;
    this._initialGeographyID = initialGeographyID || null;

    this._newlyCachedRegionNeighborVisitor = new NewlyCachedRegionNeighborVisitor(this);
    this._finishCachingAroundRegionVisitor = new FinishCachingAroundRegionVisitor(this);
    this._pendingNearDomainRegionVisitor = new PendingNearDomainRegionVisitor(this);
  }

  async *run(): AsyncGenerator<TrackedRegion | null, void, void> {
    this._ticker.start();

    // Generate the tracked regions used for consolidation.

    const domainsByID: Record<number, Region> = {};
    for (const domainRegion of this._domainRegions!) {
      if (this._ticker.interval()) yield null;
      domainsByID[domainRegion.id] = domainRegion;
      this._regionRoster.add(new TrackedRegion(domainRegion, true));
    }

    // Collect the over-domain geographic IDs for easy lookup. The over-domain consists
    // of the geographic regions immediately containing geographics regions of the
    // domain but not themselves in the domain.

    for (const domainRegion of this._domainRegions!) {
      if (domainRegion.rank !== RegionRank.Earth) {
        if (domainsByID[domainRegion.parentID] === undefined) {
          if (this._ticker.interval()) yield null;
          this._overDomainIDLookup[domainRegion.parentID] = true;
        }
      }
    }
    if (this._diagnostics) {
      await this._diagnostics.reportPrimaryState('After initialization');
    }

    // Select and cache the initial region.
    let currentRegion: TrackedRegion | null =
      await this._regionRoster.getArbitraryRegion();
    if (this._initialGeographyID !== null) {
      currentRegion = await this._regionRoster.getByID(this._initialGeographyID)!;
    }
    for await (const _ of this._cachePendingRegion(currentRegion!)) yield null;

    // Loop
    while (currentRegion != null) {
      if (this._ticker.interval()) yield null;
      if (this._diagnostics) {
        await this._diagnostics.reportPrimaryState('Top of loop', currentRegion);
      }

      // Consolidate
      if (currentRegion.adjoiningPendingCount != 0) {
        const visits =
          this._finishCachingAroundRegionVisitor.visitAroundRegion(currentRegion);
        for await (const _ of visits) yield null;
      }
      // yield for processing region and uncaching its localities
      yield currentRegion;
      // have region treated as no longer pending or cached
      currentRegion.status = TrackedRegionStatus.Complete;

      // Select next region
      let lowestUncachedCount = Infinity;
      currentRegion = null;
      for await (const prospect of this._regionRoster.allRegions()) {
        if (this._ticker.interval()) yield null;
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
      await this._diagnostics.reportPrimaryState('Completed');
    }
  }

  /**
   * Fully caches the neighbors around a pending region.
   */

  async *_cachePendingRegion(
    regionToCache: TrackedRegion
  ): AsyncGenerator<void, void, void> {
    this._localityCache.cacheRegionLocalities(regionToCache);
    regionToCache.status = TrackedRegionStatus.Cached;
    const visits =
      this._newlyCachedRegionNeighborVisitor.visitAroundRegion(regionToCache);
    for await (const _ of visits) yield;
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

  async *visitAroundRegion(
    aroundRegion: TrackedRegion
  ): AsyncGenerator<void, void, void> {
    if (aroundRegion.inDomain) {
      // Visit all regions adjoining a domain region
      await this._reportSecondaryProcess(
        'visiting all regions adjoining a domain region',
        aroundRegion
      );
      for (const nearRegion of await this._getAdjoiningRegions(aroundRegion)) {
        if (this._interval()) yield;
        await this._visitAroundDomainRegion(nearRegion);
        if (this._visitationRestriction(nearRegion)) {
          if (this._interval()) yield;
          const visits = this._visitSubsetAroundDomainRegion(nearRegion, aroundRegion);
          for await (const _ of visits) yield;
          //this._showState('after in-domain all', nearRegion, aroundRegion);
        }
      }
    } else {
      // Visit regions adjacent to a non-domain region
      await this._reportSecondaryProcess(
        'visiting regions adjacent to a non-domain region',
        aroundRegion
      );
      for (const nearRegion of await this._getAdjacentRegions(aroundRegion)) {
        if (nearRegion.inDomain && this._visitationRestriction(nearRegion)) {
          if (this._interval()) yield;
          const visits = this._visitSubsetAroundNonDomainRegion(
            nearRegion,
            aroundRegion
          );
          for await (const _ of visits) yield;
          //this._showState('after non-domain adjacent', nearRegion, aroundRegion);
        }
      }
      if (this._regionDriver._isInOverDomain(aroundRegion.id)) {
        // Visit child regions of a non-domain region
        await this._reportSecondaryProcess(
          'visiting child regions of a non-domain region',
          aroundRegion
        );
        for (const childRegion of await this._getContainedRegions(aroundRegion)) {
          // Not every child of an over-domain region need be in the domain.
          if (childRegion.inDomain && this._visitationRestriction(childRegion)) {
            if (this._interval()) yield;
            const visits = this._visitSubsetAroundNonDomainRegion(
              childRegion,
              aroundRegion
            );
            for await (const _ of visits) yield;
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
      forExactRegion.localityTotal = this._regionDriver._regionAccess.getLocalityCount(
        forExactRegion.id
      );
    }
    return forExactRegion.localityTotal;
  }

  protected async _getAdjacentRegions(
    toRegion: TrackedRegion
  ): Promise<TrackedRegion[]> {
    const regions = this._regionDriver._regionAccess.getAdjacentRegions(toRegion.id);
    const adjacentRegions: TrackedRegion[] = [];
    for (const region of regions) {
      adjacentRegions.push(await this._getTrackedRegion(region));
    }
    return adjacentRegions;
  }

  protected async _getAdjoiningRegions(
    aroundRegion: TrackedRegion
  ): Promise<TrackedRegion[]> {
    // TODO: Experiment with whether it's more efficient to process
    // parent or child regions first.
    let regions = await this._getAdjacentRegions(aroundRegion);
    regions = regions.concat(await this._getContainedRegions(aroundRegion));
    return regions.concat(await this._getContainingRegions(aroundRegion));
  }

  protected async _getContainingRegions(
    aboveRegion: TrackedRegion
  ): Promise<TrackedRegion[]> {
    const regions = this._regionDriver._regionAccess.getContainingRegions(
      aboveRegion.id
    );
    const containingRegions: TrackedRegion[] = [];
    for (const region of regions) {
      containingRegions.push(await this._getTrackedRegion(region));
    }
    return containingRegions;
  }

  protected async _getContainedRegions(
    underRegion: TrackedRegion
  ): Promise<TrackedRegion[]> {
    const regions = this._regionDriver._regionAccess.getContainedRegions(
      underRegion.id
    );
    const containedRegions: TrackedRegion[] = [];
    for (const region of regions) {
      containedRegions.push(await this._getTrackedRegion(region));
    }
    return containedRegions;
  }

  protected async _getTrackedRegion(region: Region): Promise<TrackedRegion> {
    let trackedRegion = await this._regionDriver._regionRoster.getByID(region.id);
    if (!trackedRegion) {
      trackedRegion = new TrackedRegion(region, false);
      this._regionDriver._regionRoster.add(trackedRegion);
    }
    return trackedRegion;
  }

  protected _interval(): boolean {
    return this._regionDriver._ticker.interval();
  }

  protected _visitAroundDomainRegion(_nearRegion: TrackedRegion): Promise<void> {
    // do nothing by default
    return Promise.resolve();
  }

  protected abstract _visitationRestriction(nearRegion: TrackedRegion): boolean;

  protected abstract _visitSubsetAroundDomainRegion(
    nearRegion: TrackedRegion,
    aroundRegion: TrackedRegion
  ): AsyncGenerator<void, void, void>;

  protected async *_visitSubsetAroundNonDomainRegion(
    nearRegion: TrackedRegion,
    aroundRegion: TrackedRegion
  ): AsyncGenerator<void, void, void> {
    const visits = this._visitSubsetAroundDomainRegion(nearRegion, aroundRegion);
    for await (const _ of visits) yield;
  }

  protected async _reportSecondaryProcess(
    secondaryContext: string,
    forRegion: TrackedRegion
  ): Promise<void> {
    if (this._regionDriver._diagnostics) {
      await this._regionDriver._diagnostics.reportSecondaryProcess(
        this.visitorName,
        secondaryContext,
        forRegion
      );
    }
  }

  protected async _reportSecondaryState(
    secondaryContext: string,
    forRegion: TrackedRegion,
    aroundRegion: TrackedRegion
  ): Promise<void> {
    if (this._regionDriver._diagnostics) {
      await this._regionDriver._diagnostics.reportSecondaryState(
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

  protected async *_visitSubsetAroundDomainRegion(
    nearRegion: TrackedRegion,
    aroundRegion: TrackedRegion
  ): AsyncGenerator<void, void, void> {
    // Increment pending count due to adjoining pending region
    aroundRegion.adjoiningPendingCount += this._computeLocalityCount(nearRegion);
    await this._reportSecondaryState(
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

  protected async *_visitSubsetAroundDomainRegion(
    nearRegion: TrackedRegion,
    aroundRegion: TrackedRegion
  ): AsyncGenerator<void, void, void> {
    // Decrement pending count for newly cached region adjoining domain region
    nearRegion.adjoiningPendingCount -= this._computeLocalityCount(aroundRegion);
    await this._reportSecondaryState(
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

  protected async *_visitSubsetAroundDomainRegion(
    nearRegion: TrackedRegion,
    _aroundRegion: TrackedRegion
  ): AsyncGenerator<void, void, void> {
    for await (const _ of this._regionDriver._cachePendingRegion(nearRegion)) yield;
    if (this._computeLocalityCount(nearRegion) > 0) {
      const visits =
        this._regionDriver._pendingNearDomainRegionVisitor.visitAroundRegion(
          nearRegion
        );
      for await (const _ of visits) yield;
    }
  }

  protected async *_visitSubsetAroundNonDomainRegion(
    nearRegion: TrackedRegion,
    _aroundRegion: TrackedRegion
  ): AsyncGenerator<void, void, void> {
    for await (const _ of this._regionDriver._cachePendingRegion(nearRegion)) yield;
    if (this._computeLocalityCount(nearRegion) > 0) {
      for (const aroundNearRegion of await this._getAdjoiningRegions(nearRegion)) {
        if (aroundNearRegion.status == TrackedRegionStatus.Cached) {
          // Decrement pending count for newly cached region adjoining non-domain region
          aroundNearRegion.adjoiningPendingCount -=
            this._computeLocalityCount(nearRegion);
          await this._reportSecondaryState(
            'decrement pending count for newly cached region adjoining non-domain region',
            aroundNearRegion,
            nearRegion
          );
        }
      }
    }
  }
}
