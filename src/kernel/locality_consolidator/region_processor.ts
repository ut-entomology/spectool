import { Adjacencies } from '../util/adjacencies';
import { AdjoiningRegions } from './adjoining_regions';
import { CachedLocality } from './cached_locality';
import { LocalityCache } from './locality_cache';
import { Geography } from '../specify/geography';
import { PhoneticLocalityIndex } from './phonetic_locality_index';
import { TrackedRegionRoster } from './region_roster';
import { TrackedRegion } from './tracked_region';
import { ExcludedMatchesStore, containsCoords } from './excluded_matches';
import { LocalityMatch, PhoneticSubset } from '../../shared/shared_locality';

export class RegionProcessor {
  private _geography: Geography;
  private _adjacencies: Adjacencies;
  private _adjoiningRegions: AdjoiningRegions;
  private _localityCache: LocalityCache;
  private _phoneticLocalityIndex: PhoneticLocalityIndex;
  private _regionRoster: TrackedRegionRoster;
  private _excludedMatchesStore: ExcludedMatchesStore;

  constructor(
    geography: Geography,
    adjacencies: Adjacencies,
    adjoiningRegions: AdjoiningRegions,
    localityCache: LocalityCache,
    phoneticLocalityIndex: PhoneticLocalityIndex,
    regionRoster: TrackedRegionRoster,
    excludedMatchesStore: ExcludedMatchesStore
  ) {
    this._geography = geography;
    this._adjacencies = adjacencies;
    this._adjoiningRegions = adjoiningRegions;
    this._localityCache = localityCache;
    this._phoneticLocalityIndex = phoneticLocalityIndex;
    this._regionRoster = regionRoster;
    this._excludedMatchesStore = excludedMatchesStore;
  }

  async *run(
    baselineDate: Date | null,
    overallRegion: TrackedRegion
  ): AsyncGenerator<LocalityMatch, void, void> {
    // Cache information needed about overallRegion.

    const overallRegionID = overallRegion.id;
    const adjoiningRegionIDs = this._geography
      .getContainingRegions(overallRegionID)
      .slice()
      .concat(this._geography.getContainedRegions(overallRegionID))
      .concat(this._adjacencies.forID(overallRegionID))
      .map((region) => region.id);

    // Process the localities of all regions implied by overallRegion. If the
    // caller was able to filter subregions of this region for relevance, no
    // additional regions will be processed. If the caller was not able to do
    // so, all of its subregions must also be processed.

    for (const currentRegion of this._regionsToProcess(overallRegion)) {
      for await (const baseLocality of this._localityCache.localitiesOfRegion(
        currentRegion
      )) {
        // Skip localities that lack names.
        if (!baseLocality.words || !baseLocality.phonetics) {
          continue;
        }

        // Keeps algorithm from comparing the same localities more than once.
        const previouslyComparedIDs: Record<number, boolean> = {};

        // Look for other localities according to their related phonetic codes.

        for (const basePhoneticCode of baseLocality.phonetics) {
          // Check the localities having at least one phonetic code in common
          // with baseLocality for possible duplication of baseLocality.

          for (const testLocalityID of await this._phoneticLocalityIndex.getLocalityIDs(
            basePhoneticCode
          )) {
            if (!previouslyComparedIDs[testLocalityID]) {
              const localityMatch = await this._comparePhoneticallyRelatedLocalities(
                adjoiningRegionIDs,
                baselineDate,
                overallRegion,
                currentRegion,
                baseLocality,
                testLocalityID
              );
              if (localityMatch) {
                previouslyComparedIDs[testLocalityID] = true;
                yield localityMatch;
              }
            }
          }

          // Check the localities having at least one phonetic code in common
          // with any phonetic series that is synonymous with a phonetic series found
          // in baseLocality, checking them for possible duplication of baseLocality.

          const phoneticSeriesSynonyms =
            await this._phoneticLocalityIndex.getPhoneticSeriesSynonyms(
              basePhoneticCode
            );
          for (const synonymPhoneticCode of this._collectPhoneticCodesOf(
            baseLocality,
            phoneticSeriesSynonyms
          )) {
            for (const testLocalityID of await this._phoneticLocalityIndex.getLocalityIDs(
              synonymPhoneticCode
            )) {
              if (!previouslyComparedIDs[testLocalityID]) {
                const localityMatch = await this._compareSynonymouslyRelatedLocalities(
                  adjoiningRegionIDs,
                  baselineDate,
                  overallRegion,
                  currentRegion,
                  baseLocality,
                  testLocalityID
                );
                if (localityMatch) {
                  previouslyComparedIDs[testLocalityID] = true;
                  yield localityMatch;
                }
              }
            }
          }
        }
        // TODO: (+) Remove (L1)'s contribution to PhoneticLocalityIndex.
        // TODO: (+) Remove (L1) from LocalityCache.
      }
    }
  }

  /**
   * Determines whether a comparison satisfies the baseline date requirement.
   * Returns true if either the locality that is in the domain has been
   * modified since the baseline date, or true if there is no baseline date.
   */
  private _checkBaselineDate(
    baselineDate: Date | null,
    overallRegion: TrackedRegion,
    baseLocality: CachedLocality,
    testLocality: CachedLocality
  ) {
    if (baselineDate == null) return true;
    const baselineMillis = baselineDate.getTime();
    return (
      (overallRegion.inDomain && baseLocality.lastModified >= baselineMillis) ||
      (!overallRegion.inDomain && testLocality.lastModified >= baselineMillis)
    );
  }

  /**
   * Adds to the provide list of codes those phonetic codes in the provided phonetic
   * series that are not already in the list of codes.
   */
  private _collectPhoneticCodes(codes: string[], phoneticSeries: string[]): void {
    for (const code of phoneticSeries) {
      if (!codes.includes(code)) {
        codes.push(code);
      }
    }
  }

  /**
   * Returns a list of all phonetic codes found in those of the provide phonetic
   * series occur in the provided locality, irrespective of the order of the
   * phonetic codes within their series.
   */
  private _collectPhoneticCodesOf(
    locality: CachedLocality,
    phoneticSeriesSet: string[][]
  ): string[] {
    const codes: string[] = [];
    for (const phoneticSeries of phoneticSeriesSet) {
      if (locality.hasPhoneticSeries(phoneticSeries)) {
        this._collectPhoneticCodes(codes, phoneticSeries);
      }
    }
    return codes;
  }

  private async _comparePhoneticallyRelatedLocalities(
    adjoiningRegionIDs: number[],
    baselineDate: Date | null,
    overallRegion: TrackedRegion,
    currentRegion: TrackedRegion,
    baseLocality: CachedLocality,
    testLocalityID: number
  ): Promise<LocalityMatch | null> {
    // Make sure at least one of the localities fits the baseline date requirement.

    const testLocality = this._localityCache.getLocality(testLocalityID);
    if (
      !this._checkBaselineDate(baselineDate, overallRegion, baseLocality, testLocality)
    ) {
      return null;
    }

    // Make sure at least one of the regions associated with the localities
    // is in the domain, so that we're only examining requested regions.

    if (!currentRegion.inDomain) {
      const testRegion = this._regionRoster.getByID(testLocalityID)!;
      if (!testRegion.inDomain) {
        return null;
      }
    }

    // In order to avoid the N^2 complexity problem of comparing every locality to
    // every other locality, only examine the localities of adjoining regions.

    if (!adjoiningRegionIDs.includes(testLocality.regionID)) {
      return null;
    }

    // Collect all phonetic matches between the two localities. There will be at
    // least one, because only localities sharing a phonetic code are compared.
    // (`matches` actually contains at least two entries, because the last entry
    // indicates leftover subsets of unmatched for being subsumed by other,
    // longer subsets in the other locality, even if there are no leftovers.)

    const matches = baseLocality.findPhoneticMatches(testLocality);

    // Skip over localities having known to have identical names but be in
    // different regions or at different coordinates. Localities in different
    // regions having the same coordinates won't be skipped.

    const baseNameSeries = baseLocality.getEntireWordSeries();
    const testNameSeries = testLocality.getEntireWordSeries();
    if (baseNameSeries == testNameSeries) {
      const exclusions = this._excludedMatchesStore.getExcludedMatches(baseNameSeries);
      if (exclusions) {
        const testRegion = this._regionRoster.getByID(testLocalityID)!;
        if (currentRegion.id == testRegion.id) {
          // Skip localities expected to have identical names at different coordinates.
          if (
            containsCoords(exclusions.nonmatchingCoordinates, [
              baseLocality.latitude,
              baseLocality.longitude
            ]) &&
            containsCoords(exclusions.nonmatchingCoordinates, [
              testLocality.latitude,
              testLocality.longitude
            ])
          ) {
            return null;
          }
        } else {
          // Skip localities expected to have identical names in different regions.
          if (
            exclusions &&
            exclusions.nonmatchingRegionIDs.length != 0 /*short-circuits*/ &&
            exclusions.nonmatchingRegionIDs.includes(currentRegion.id) &&
            exclusions.nonmatchingRegionIDs.includes(testRegion.id)
          ) {
            return null;
          }
        }
      }
    }

    // Before presenting the possible duplicate to the user, make sure that the
    // word matches actually aren't all excluded. Keep track of subsets rejected
    // for having excluded word series, so that they can be presented to the user
    // as such, in case it confuses the user to see matching words not highlighted.

    const excludedSubsetPairs: PhoneticSubset[][] = [];
    let isPossibleDuplicate = false;
    for (let i = 0; i < matches.length; ++i) {
      const match = matches[i];
      const baseSubsets = match.baseSubsets;
      for (let j = 0; j < baseSubsets.length; ++j) {
        const baseSubset = baseSubsets[j];
        const baseWordSeries = baseLocality.getWordSeries(baseSubset);
        const exclusions =
          this._excludedMatchesStore.getExcludedMatches(baseWordSeries);
        if (exclusions) {
          const testSubsets = match.testSubsets;
          for (let k = 0; k < testSubsets.length; ++k) {
            const testSubset = testSubsets[k];
            const testWordSeries = testLocality.getWordSeries(testSubset);
            if (exclusions.nonmatchingWords.includes(testWordSeries)) {
              excludedSubsetPairs.push([baseSubset, testSubset]);
            } else {
              // Allow excludedSubsetPairs to finish collecting for the presentation.
              // No need to short-circuit; about to require user interaction.
              isPossibleDuplicate = true;
            }
          }
        }
        // Note: There's no need to also test all test word series against base
        // word series because ExcludedMatchesStore is symmetric on word series.
      }
    }
    if (!isPossibleDuplicate) return null;

    // The localities meet all the matching requirements, so return the match.

    return {
      baseLocality,
      testLocality,
      matches,
      excludedSubsetPairs
    };
  }

  private async _compareSynonymouslyRelatedLocalities(
    adjoiningRegionIDs: number[],
    baselineDate: Date | null,
    overallRegion: TrackedRegion,
    currentRegion: TrackedRegion,
    baseLocality: CachedLocality,
    testLocalityID: number
  ): Promise<LocalityMatch | null> {
    //
  }

  /**
   * Yield each region implied for processing by the provided region.
   */
  private *_regionsToProcess(
    region: TrackedRegion
  ): Generator<TrackedRegion, void, void> {
    yield region;
    if (region.processSubregions) {
      for (const descendant of this._adjoiningRegions.getDescendantRegions(region.id)) {
        let subregion = this._regionRoster.getByID(descendant.id);
        if (subregion == null) {
          subregion = new TrackedRegion(descendant, region.inDomain);
          this._regionRoster.add(subregion);
        }
        yield subregion;
      }
    }
  }
}
