import { Adjacencies } from '../util/adjacencies';
import { AdjoiningRegions } from './adjoining_regions';
import { CachedLocality } from './cached_locality';
import { LocalityCache } from './locality_cache';
import { Geography } from '../specify/geography';
import { PhoneticLocalityIndex } from './phonetic_locality_index';
import { PotentialSynonymsStore, SeriesPair } from './potential_synonyms';
import { TrackedRegionRoster } from './region_roster';
import { TrackedRegion } from './tracked_region';
import { ExcludedMatchesStore, containsCoords } from './excluded_matches';
import { LocalityMatch, PhoneticSubset } from '../../shared/shared_locality';

interface SubsetEquivalence {
  baseSubset: PhoneticSubset,
  synonyms: SeriesPair[];
}

export class RegionProcessor {
  private _geography: Geography;
  private _adjacencies: Adjacencies;
  private _adjoiningRegions: AdjoiningRegions;
  private _localityCache: LocalityCache;
  private _potentialSynonymsStore: PotentialSynonymsStore;
  private _phoneticLocalityIndex: PhoneticLocalityIndex;
  private _regionRoster: TrackedRegionRoster;
  private _excludedMatchesStore: ExcludedMatchesStore;

  constructor(
    geography: Geography,
    adjacencies: Adjacencies,
    adjoiningRegions: AdjoiningRegions,
    localityCache: LocalityCache,
    potentialSynonymsStore: PotentialSynonymsStore,
    phoneticLocalityIndex: PhoneticLocalityIndex,
    regionRoster: TrackedRegionRoster,
    excludedMatchesStore: ExcludedMatchesStore
  ) {
    this._geography = geography;
    this._adjacencies = adjacencies;
    this._adjoiningRegions = adjoiningRegions;
    this._localityCache = localityCache;
    this._potentialSynonymsStore = potentialSynonymsStore;
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
        const previouslyComparedLocalityIDs: Record<number, boolean> = {};

        // Keeps algorithm from examining the same the same word series of the
        // base locality for synonyms more than once.
        const previouslyExaminedBaseWordSeries: Record<string, boolean> = {};

        // Look for other localities according to their related phonetic codes.

        for (const basePhoneticCode of baseLocality.phonetics) {
          // Check the localities having at least one phonetic code in common
          // with baseLocality for possible duplication of baseLocality.

          for (const testLocalityID of await this._phoneticLocalityIndex.getLocalityIDs(
            basePhoneticCode
          )) {
            if (!previouslyComparedLocalityIDs[testLocalityID]) {
              const localityMatch = this._comparePhoneticallyRelatedLocalities(
                adjoiningRegionIDs,
                baselineDate,
                overallRegion,
                currentRegion,
                baseLocality,
                this._localityCache.getLocality(testLocalityID)
              );
              if (localityMatch) {
                yield localityMatch;
                previouslyComparedLocalityIDs[testLocalityID] = true;
              }
            }
          }

          // Check the localities having at least one phonetic code in common
          // with any phonetic series that is synonymous with a phonetic series found
          // in baseLocality, checking them for possible duplication of baseLocality.

          const baseWordSeriesEquivalenceMap = await this._getSynonymsAssociatedWithPhoneticCode(
            baseLocality,
            basePhoneticCode,
            previouslyExaminedBaseWordSeries
          );
          if (baseWordSeriesEquivalenceMap !== null) {
            for (const synonymPhoneticCode of this._collectPhoneticCodesFromEquivalenceMap(
              baseWordSeriesEquivalenceMap
            )) {
              for (const testLocalityID of await this._phoneticLocalityIndex.getLocalityIDs(
                synonymPhoneticCode
              )) {
                if (!previouslyComparedLocalityIDs[testLocalityID]) {
                  const localityMatch = this._compareSynonymouslyRelatedLocalities(
                    adjoiningRegionIDs,
                    baselineDate,
                    overallRegion,
                    currentRegion,
                    baseLocality,
                    this._localityCache.getLocality(testLocalityID),
                    baseWordSeriesEquivalenceMap
                  );
                  if (localityMatch) {
                    yield localityMatch;
                    previouslyComparedLocalityIDs[testLocalityID] = true;
                  }
                }
              }
            }
          }
        }

        // There are no more comparisons to do with the base locality, so remove it
        // from the cache and the necessary indexes.

        this._phoneticLocalityIndex.removeLocality(baseLocality);
        this._localityCache.uncacheLocality(baseLocality.localityID);
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
   * Returns a list of all phonetic codes found in the provided series pairs.
   */
  private _collectPhoneticCodesFromEquivalenceMap(
    equivalenceMap: Record<string, SubsetEquivalence>
  ): string[] {
    const codes: string[] = [];
    for (const subsetEquivalance of Object.values(equivalenceMap)) {
      for (const seriesPair of subsetEquivalance.synonyms) {
        this._collectPhoneticCodes(codes, seriesPair.phoneticSeries.split(' '));
      }
    }
    return codes;
  }

  /**
   * Compares the phonetic similarity of the provided base and test localities,
   * returning a description of their similarities if they in scope and not
   * precluded from matching by the `ExcludedMatchesStore`, and null otherwise.
   */
  private _comparePhoneticallyRelatedLocalities(
    adjoiningRegionIDs: number[],
    baselineDate: Date | null,
    overallRegion: TrackedRegion,
    currentRegion: TrackedRegion,
    baseLocality: CachedLocality,
    testLocality: CachedLocality
  ): LocalityMatch | null {

    // Make sure the localities are spatially and temporally in scope.

    if (!this._localityIsInScope(
      adjoiningRegionIDs,
      baselineDate,
      overallRegion,
      currentRegion,
      baseLocality,
      testLocality
    )) {
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
        const testRegion = this._regionRoster.getByID(testLocality.regionID)!;
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

  /**
   * Compares the phonetic synonymies of the provided base and test localities,
   * returning a description of their synonymies if they in scope and not
   * precluded from matching by the `ExcludedMatchesStore`, and null otherwise.
   */
   private _compareSynonymouslyRelatedLocalities(
    adjoiningRegionIDs: number[],
    baselineDate: Date | null,
    overallRegion: TrackedRegion,
    currentRegion: TrackedRegion,
    baseLocality: CachedLocality,
    testLocality: CachedLocality,
    baseWordSeriesEquivalenceMap: Record<string, SubsetEquivalence>
  ): LocalityMatch | null {

    // Make sure the localities are spatially and temporally in scope.

    if (!this._localityIsInScope(
      adjoiningRegionIDs,
      baselineDate,
      overallRegion,
      currentRegion,
      baseLocality,
      testLocality
    )) {
      return null;
    }

    
  }

  /**
   * Returns a map of all series known to be synonymous with each series both found
   * in the provided locality and containing the provided phonetic code. This map
   * maps each word series of the locality having synonyms to a list of its synonyms.
   * Returns null if no series are synonymous with any series of locality that
   * contain the provided code. Because it's possible for this method to repeatedly
   * examine the same series on succesive calls, the method also takes a parameter
   * that tracks which have been examined so they aren't examined again.
   */
  private async _getSynonymsAssociatedWithPhoneticCode(
    baseLocality: CachedLocality,
    basePhoneticCode: string,
    previouslyExaminedBaseWordSeries: Record<string, boolean>
  ): Promise<Record<string, SubsetEquivalence> | null> {
    // Find all the synonyms that use the provided phonetic code. This list can
    // include series that are found in the locality and those that are not.

    const allBasePhoneticSeriesSynonymsUsingCode =
      await this._phoneticLocalityIndex.getPhoneticSeriesSynonyms(
        basePhoneticCode
      );
    if (allBasePhoneticSeriesSynonymsUsingCode.length == 0) {
      return null;
    }

    // Find the subset of the synonyms that actually appear in the locality. These
    // are the series found in the locality that actually do have synonyms.

    const basePhoneticSubsetSynonymsUsingCode =
        baseLocality.findPhoneticSubsets(allBasePhoneticSeriesSynonymsUsingCode);
    if (basePhoneticSubsetSynonymsUsingCode.length == 0) {
      return null;
    }

    // Generate a structure that maps each word series actually found in the locality
    // to a list of its synonymous series. It is possible that more than one series
    // of the locality will both contain the phonetic code and have a synonym.

    const baseWordSeriesEquivalenceMap: Record<string, SubsetEquivalence> = {};
    for (const baseSubset of basePhoneticSubsetSynonymsUsingCode) {
      const baseWordSeries = baseLocality.getWordSeries(baseSubset);

      // This method is called for each phonetic code in the locality, but phonetic
      // codes can be shared among synonymous series. It would be wasteful to repeat
      // the examination of a series, so guard against that.

      if (!previouslyExaminedBaseWordSeries[baseWordSeries]) {
        // Retrieve all synonyms of the word series currently under examination
        // from the locality. This will include the word series itself.

        const synonymMap = this._potentialSynonymsStore.getSynonymMap(baseSubset.phoneticSeries);
        const equivalentSeriesPairs = synonymMap[baseWordSeries];

        // Collect all the synonyms of the word series, excluding the word series
        // itself, filing them away in a map that indexes the synonyms by word series.

        if (equivalentSeriesPairs) {
          const synonymsOfBasePhoneticSubsets: SeriesPair[] = [];
          for (const seriesPair of equivalentSeriesPairs) {
            if (seriesPair.wordSeries != baseWordSeries) {
              synonymsOfBasePhoneticSubsets.push(seriesPair);
            }
          }
          baseWordSeriesEquivalenceMap[baseWordSeries] = {
            baseSubset,
            synonyms: synonymsOfBasePhoneticSubsets
          };
        }

        // Prevent this word series from being processed again for a different subset
        // of the locality for the phonetic code of another word in the series.

        previouslyExaminedBaseWordSeries[baseWordSeries] = true;
      }
    }

    // Return a structure mapping word series of the locality to their synonyms, or
    // return null if no word series of the locality were found to have any synonyms.

    if (Object.keys(baseWordSeriesEquivalenceMap).length == 0) {
      return null;
    }
    return baseWordSeriesEquivalenceMap;
  }

  /**
   * Determines whether the test locality is temporally and spatially in scope.
   */
  private _localityIsInScope(
    adjoiningRegionIDs: number[],
    baselineDate: Date | null,
    overallRegion: TrackedRegion,
    currentRegion: TrackedRegion,
    baseLocality: CachedLocality,
    testLocality: CachedLocality
  ): boolean {
    // Make sure at least one of the localities fits the baseline date requirement.

    if (
      !this._checkBaselineDate(baselineDate, overallRegion, baseLocality, testLocality)
    ) {
      return false;
    }

    // Make sure at least one of the regions associated with the localities
    // is in the domain, so that we're only examining requested regions.

    if (!currentRegion.inDomain) {
      const testRegion = this._regionRoster.getByID(testLocality.regionID)!;
      if (!testRegion.inDomain) {
        return false;
      }
    }

    // In order to avoid the N^2 complexity problem of comparing every locality to
    // every other locality, only examine the localities of adjoining regions.

    if (!adjoiningRegionIDs.includes(testLocality.regionID)) {
      return false;
    }

    return true; // locality is in scope
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
