/**
 * Verifies that each state adjacent to another is itself an adjacent state
 * of the other state. Helps to confirm that the adjacencies are correct.
 */

import 'source-map-support/register';

import { stateAdjacencies } from '../kernel/util/adjacency_data';

for (const state in stateAdjacencies) {
  const adjacentStates = stateAdjacencies[state];
  for (const adjacentState of adjacentStates) {
    const adjacentStateAdjacencies = stateAdjacencies[adjacentState];
    if (!adjacentStateAdjacencies) {
      console.log(`State '${adjacentState}' not found`);
    } else if (!stateAdjacencies[adjacentState].includes(state)) {
      console.log(`State '${adjacentState}' is missing '${state}`);
    }
  }
}
