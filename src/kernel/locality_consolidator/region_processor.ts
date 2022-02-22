import { Adjacencies } from '../util/adjacencies';
import { AdjoiningRegions } from './adjoining_regions';
import { CachedLocality } from './cached_locality';
import { LocalityCache } from './locality_cache';
import { Geography } from '../specify/geography';
import { PhoneticLocalityIndex } from './phonetic_locality_index';
import { TrackedRegionRoster } from './region_roster';
import { TrackedRegion } from './tracked_region';

export class RegionProcessor {
  private _geography: Geography;
  private _adjacencies: Adjacencies;
  private _adjoiningRegions: AdjoiningRegions;
  private _localityCache: LocalityCache;
  private _phoneticLocalityIndex: PhoneticLocalityIndex;
  private _regionRoster: TrackedRegionRoster;

  constructor(
    geography: Geography,
    adjacencies: Adjacencies,
    adjoiningRegions: AdjoiningRegions,
    localityCache: LocalityCache,
    phoneticLocalityIndex: PhoneticLocalityIndex,
    regionRoster: TrackedRegionRoster
  ) {
    this._geography = geography;
    this._adjacencies = adjacencies;
    this._adjoiningRegions = adjoiningRegions;
    this._localityCache = localityCache;
    this._phoneticLocalityIndex = phoneticLocalityIndex;
    this._regionRoster = regionRoster;
  }

  async *run(
    baselineDate: Date | null,
    overallRegion: TrackedRegion
  ): AsyncGenerator<void, void, void> {
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
            if (
              !previouslyComparedIDs[testLocalityID] &&
              (await this._comparePhoneticallyRelatedLocalities(
                adjoiningRegionIDs,
                baselineDate,
                overallRegion,
                currentRegion,
                baseLocality,
                testLocalityID
              ))
            ) {
              previouslyComparedIDs[testLocalityID] = true;
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
              if (
                !previouslyComparedIDs[testLocalityID] &&
                (await this._compareSynonymouslyRelatedLocalities(
                  adjoiningRegionIDs,
                  baselineDate,
                  overallRegion,
                  currentRegion,
                  baseLocality,
                  testLocalityID
                ))
              ) {
                previouslyComparedIDs[testLocalityID] = true;
              }
            }
          }
        }
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
  ): Promise<boolean> {
    // Make sure at least one of the localities fits the baseline date requirement.

    const testLocality = this._localityCache.getLocality(testLocalityID);
    if (
      !this._checkBaselineDate(baselineDate, overallRegion, baseLocality, testLocality)
    ) {
      return false;
    }

    // Make sure at least one of the regions associated with the localities
    // is in the domain, so that we're only examining requested regions.

    if (!currentRegion.inDomain) {
      const testRegion = this._regionRoster.getByID(testLocalityID)!;
      if (!testRegion.inDomain) {
        return false;
      }
    }

    // In order to avoid the N^2 complexity problem of comparing every locality to
    // every other locality, only examine the localities of adjoining regions.

    if (!adjoiningRegionIDs.includes(testLocality.regionID)) {
      return false;
    }

    // Collect all phonetic matches between the two localities. There will be at
    // least one, because only localities sharing a phonetic code are compared.

    const matches = baseLocality.findPhoneticMatches(testLocality);

    // If a match of either locality spans the entire locality name, indicate
    // that the localities need to be presented as possible duplicates. If there
    // is such a match, it is necessarily the first match for at least one of
    // the localities, since no other matches will follow for that locality.
    // Check word indexes rather than character offsets because some characters
    // might not correspond to any phonetic encodings.

    const firstMatch = matches[0];
    const firstBaseSubset = firstMatch.baseSubsets[0];
    const firstTestSubset = firstMatch.testSubsets[0];
    if (
      (firstBaseSubset.firstWordIndex == 0 &&
        firstBaseSubset.lastWordIndex == baseLocality.words!.length - 1) ||
      (firstTestSubset.firstWordIndex == 0 &&
        firstTestSubset.lastWordIndex == testLocality.words!.length - 1)
    ) {
      return true;
    }
  }

  private async _compareSynonymouslyRelatedLocalities(
    adjoiningRegionIDs: number[],
    baselineDate: Date | null,
    overallRegion: TrackedRegion,
    currentRegion: TrackedRegion,
    baseLocality: CachedLocality,
    testLocalityID: number
  ): Promise<boolean> {
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
