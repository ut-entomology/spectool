/**
 * Converts the Census Bureau's text format for adjacent county data
 * into a smaller binary file for reading at runtime.
 */

import 'source-map-support/register';
import { join } from 'path';

import {
  TextCountyAdjacencyFile,
  BinaryCountyAdjacencyFile,
  CountyAdjacenciesVerifier
} from '../kernel/util/county_adjacency';

async function convert(
  sourceTextPath: string,
  destBinaryPath: string,
  destTextPath: string
) {
  // Convert the Census Bureau text file into records.
  let textAdjacencyFile = new TextCountyAdjacencyFile(sourceTextPath);
  const textAdjacencies = await textAdjacencyFile.read();

  // Remove the extraneous adjacencies.
  const verifier = new CountyAdjacenciesVerifier(textAdjacencies);
  let missingPairs = verifier.getMissingPairs();
  // for (const missingPair of missingPairs) {
  //   const from = missingPair[0];
  //   const to = missingPair[1];
  //   console.log(
  //     `Missing ${from.countyName}, ${from.stateAbbr} to ${to.countyName}, ${to.stateAbbr}`
  //   );
  // }
  verifier.removeMissingPairs(missingPairs);
  missingPairs = verifier.getMissingPairs();
  if (missingPairs.length !== 0) {
    console.log(`Did not eliminate ${missingPairs.length} missing pairs`);
  }

  // Convert the records into a binary file.
  let binaryAdjacentyFile = new BinaryCountyAdjacencyFile(destBinaryPath);
  await binaryAdjacentyFile.write(textAdjacencies);
  binaryAdjacentyFile = new BinaryCountyAdjacencyFile(destBinaryPath);

  // Create a text file for verifying the binary file.
  const binaryAdjacencies = await binaryAdjacentyFile.read();
  textAdjacencyFile = new TextCountyAdjacencyFile(destTextPath);
  await textAdjacencyFile.write(binaryAdjacencies);
}

const args = process.argv;
if (args.length != 5) {
  console.log(
    'requires arguments <source-text-file> <dest-binary-file> <dest-text-file>'
  );
  process.exit(0);
}
(async () => {
  await convert(
    join(process.cwd(), args[2]),
    join(process.cwd(), args[3]),
    join(process.cwd(), args[4])
  );
})().catch((err) => console.log(err));
