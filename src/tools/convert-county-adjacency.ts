/**
 * Converts the Census Bureau's text format for adjacent county data
 * into a smaller binary file for reading at runtime.
 */

import 'source-map-support/register';
import { join } from 'path';

import {
  TextCountyAdjacencyFile,
  BinaryCountyAdjacencyFile
} from '../kernel/util/county_adjacency';

async function convert(
  sourceTextPath: string,
  destBinaryPath: string,
  destTextPath: string
) {
  let textAdjacencyFile = new TextCountyAdjacencyFile(sourceTextPath);
  const textAdjacencies = await textAdjacencyFile.read();
  console.log('**** textAdjacencies', textAdjacencies.length);
  let binaryAdjacentyFile = new BinaryCountyAdjacencyFile(destBinaryPath);
  await binaryAdjacentyFile.write(textAdjacencies);
  console.log('**** wrote binary');
  binaryAdjacentyFile = new BinaryCountyAdjacencyFile(destBinaryPath);
  const binaryAdjacencies = await binaryAdjacentyFile.read();
  console.log('**** binaryAdjacencies', binaryAdjacencies.length);
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
