import { EOL } from 'os';
import { parse } from '@fast-csv/parse';

const CSV_STRING = ['a,null,c', 'a1,b1,c1', 'a2,b2,'].join(EOL);

const stream = parse({ headers: transformHeaders })
  .on('error', (error) => console.error(error))
  .on('data', (row) => console.log(row))
  .on('end', (rowCount: number) => console.log(`Parsed ${rowCount} rows`));

stream.write(CSV_STRING);
stream.end();

function transformHeaders(headers: any[]): string[] {
  console.log(headers);
  return headers;
}
