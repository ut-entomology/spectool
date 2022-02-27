// Code ported from the Specify 7 Python implementation.

import * as crypto from 'crypto';

const DES_ALGORITHM = 'des-cbc';
const ITERATION_COUNT = 1000;
const PADDING_BYTES = 8;

export function decrypt(text: string, password: string): string {
  const key = Buffer.from(password, 'utf-8');
  const fromHex = Buffer.from(text, 'hex');
  const salt = fromHex.slice(0, PADDING_BYTES);
  const ciphertext = fromHex.slice(PADDING_BYTES);

  const derivedKey = generateDerivedKey(key, salt);
  const desKey = derivedKey.slice(0, PADDING_BYTES);
  const iv = derivedKey.slice(PADDING_BYTES);

  const des = crypto.createDecipheriv(DES_ALGORITHM, desKey, iv);
  const padded = Buffer.concat([des.update(ciphertext), des.final()]);
  const paddingLen = padded[padded.length - 1];
  // Passwords in Specify don't seem to have been encrypted with
  // a properly working encryption algorithm. This test compensates.
  if (paddingLen === undefined || paddingLen >= PADDING_BYTES) {
    return padded.toString();
  }
  return padded.slice(0, padded.length - paddingLen).toString();
}

export function encrypt(text: string, password: string): string {
  const textEncoded = Buffer.from(text, 'utf-8');
  const paddingLen = PADDING_BYTES - (textEncoded.length % PADDING_BYTES);
  const padded = Buffer.concat([
    textEncoded,
    Buffer.from(Array(paddingLen).fill(paddingLen))
  ]);

  const key = Buffer.from(password, 'utf-8');
  const salt = makeSalt();

  const derivedKey = generateDerivedKey(key, salt);
  const desKey = derivedKey.slice(0, PADDING_BYTES);
  const iv = derivedKey.slice(PADDING_BYTES);

  const des = crypto.createCipheriv(DES_ALGORITHM, desKey, iv);
  const ciphertext = Buffer.concat([des.update(padded), des.final()]);
  const result = Buffer.concat([salt, ciphertext]);
  return result.toString('hex').toUpperCase();
}

function randByte(): number {
  return Math.floor(Math.random() * 256);
}

function makeSalt(): Buffer {
  const bytes: number[] = [];
  for (let i = 0; i < PADDING_BYTES; ++i) {
    bytes.push(randByte());
  }
  return Buffer.from(bytes);
}

function generateDerivedKey(
  key: Buffer,
  salt: Buffer,
  iterations = ITERATION_COUNT
): Buffer {
  let out = Buffer.concat([key, salt]);
  let md: crypto.Hash;
  for (let i = 0; i < iterations; ++i) {
    md = crypto.createHash('md5');
    md.update(out);
    out = md.digest();
  }
  return out;
}
