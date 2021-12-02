/*
Proposed Locality Consolidation Algorithm

(+) Create a permanent (on disk) list X of excluded sets of phonetic word matches. Each entry in the list is a pair of sets of words. The phonetic codes of the words in each half of the pair are identical to those in the other half. X contains words that appear near each other in locality descriptions that are phonetically identical to words that appear near each other in at least one other locality description, listing the exact words from each. The appearance of a pairing in X indicates that the user declared the phonetically identical words to represent different localities. Perhaps the most efficient representation is a three-column table, the first column having a record ID, the second column having a sorted list of words, and the third column with a list of the record IDs of other sets of words for which the present set was deemed distinct. A record may point to itself to indicate that the series of words is not a distinctive indication of locality.
(+) Create a temporary (for the duration of the activity) index Y associating phonetic codes and integers each with a list of localities. Also associate each phonetic code with a count of the number of localities containing at least one instance of a word having that code. The index removes any phonetic word whose locality count drops to zero. Not yet populated.
(+) Create a temporary list Z of geographic regions (geographic IDs) whose localities have been indexed in Y. Not yet populated.

(+) The user selects a country or state or CSV file (or potentially even a single newly-entered record), establishing domain D. The code itself should probably allow for a set of domains, in case the UI later needs to expand to allow for selecting multiple domains.
(+) Identify the set C of the most specific geographic regions (geographic IDs) associated with all collecting localities in D.
(+) For each specific geographic region R in C, do the following. The first choice of R is random (e.g. first in C). When possible, each subsequent R is selected from Z so that it is adjacent to as many regions in Z as possible. This reduces memory usage by purging phonetic words from Y and cached localities as early as possible, before pulling in more localities and phonetic words. (TBD: How do I do this?)
  (+) Identify all geographic regions A adjacent to R (whether or not in C), doing so to the most specific adjacent geographic region available.
  (+) For each geographic region G in R union A but not in Z:
    (+) For each locality L in G:
      (+) For each word W of length 4+ characters, including 4+-digit integers:
        (+) Associate L in Y with the phonetic code for W.
    (+) Add G to Z.
  (+) For each phonetic code P in Y associated with more than one locality:
    (+) For each locality L1 in R associated with P (if any):
      (+) For each locality L2 associated with P other than L1:
        (+) Find each set of adjacent words of 4+ characters (ignoring order and intervening shorter words) common to both L1 and L2 according to their genetic codes, and collect them into corresponding pairs Q. These are pairs of sets of words actually found in L1 and L2 (not their phonetic codes), with the first member of the pair in L1 and the second in L2, such that a sort of the phonetic codes of each half of the pair is identical to that of the other half of the pair. (The sets use the actual words rather than the phonetic codes because each phonetic code can map to more than one word, but the user is only making the decision for the specific words shown.)
        (+) If at least one pairing of sets of words in Q in not in the excluded set list X (if at least one set of words in L1 is not pointing via X to a set of words in L2), ask the user whether the two locality entries are for the same locality.
          (+) If the user says they are the same locality, ask the user to select or edit one of the two localities. If both localities are in the DB, merge the other locality with the selected or newly-edited locality. If one locality is in a CSV file, either update the DB or update the CSV file, as appropriate (or if uploading from the CSV file, do both).
          (+) If the user says they are different localities, add all pairs of sets in Q to the excluded sets list X.
        (+) Remove L1 from Y. This probably means iterating over the phonetic codes for 4+-character words in L1 (as well as integers) and decrementing the locality count for each phonetic code in Y. Note that because the iteration is over regions R in C, the localities of geographic regions adjacent to those in C but not themselves in C are never disassociated from their phonetic codes in Y. (TODO: Look for a more efficient solution.)

NOTE: For purposes of determining phonetic (but NOT for determine word sets in X), first remove accents and diacretics.

NOTE: I'll need to experiment with phonetic algorithms. I'll do this by running the program on different algorithms. But this may require faking locality mergers so that I'm not correcting the database and preventing myself from running the same experiment with another algorithm. I'm punting on how to handle algorithms until then.

NOTE: This algorithm assumes geographic IDs are correct but that coordinates could be incorrect. Another tool or another pass might present localities at similar coordinates for possible merger. For this reason, the merger code needs to be shared between activities.

NOTE: When displaying localities for comparison and then for merger, I need to display geography and coordinates too to help the user make a decision; and then the user may need to update geography, coordinates, or locality text.

TODO: When am I caching localities? I need to compute phonetic codes early on and then decrement phonetic codes when the associated locality is completed. I could just keep a limited-size cache that the algorithm leverages. Walking adjacent geographic regions might help to better leverage the cache. Would the cache extend to disk? I could experiment with that later, if things are slow.
*/

export class Dummy {}

// export class PhoneticWord {
//   word: string;
//   phonetics: string;

//   constructor(word: string) {
//     this.word = word;
//   }
// }

// export class ConsolidationService {
//   static phoneticizeWords(text: string): PhoneticWord[] {
//     // TBD
//   }
// }
