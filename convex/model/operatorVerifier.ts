const VERIFIER_PREFIX = 'pbkdf2-sha256';
const MIN_ITERATIONS = 100_000;
const MAX_ITERATIONS = 1_000_000;

interface ParsedVerifier {
  iterations: number;
  salt: Uint8Array;
  expected: Uint8Array;
}

function decodeBase64(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function parseOperatorVerifier(encoded: string): ParsedVerifier {
  const [prefix, rawIterations, rawSalt, rawExpected] = encoded.split('$');
  const iterations = Number(rawIterations);
  if (
    prefix !== VERIFIER_PREFIX ||
    !Number.isInteger(iterations) ||
    iterations < MIN_ITERATIONS ||
    iterations > MAX_ITERATIONS ||
    !rawSalt ||
    !rawExpected
  ) {
    throw new Error('Operator verifier configuration is invalid.');
  }

  const salt = decodeBase64(rawSalt);
  const expected = decodeBase64(rawExpected);
  if (salt.byteLength < 16 || expected.byteLength !== 32) {
    throw new Error('Operator verifier configuration is invalid.');
  }

  return {iterations, salt, expected};
}

export async function verifyOperatorCode(code: string, encoded: string) {
  const verifier = parseOperatorVerifier(encoded);
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(code),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const derived = new Uint8Array(
    await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        hash: 'SHA-256',
        salt: Uint8Array.from(verifier.salt).buffer,
        iterations: verifier.iterations,
      },
      key,
      256,
    ),
  );

  let difference = 0;
  for (let index = 0; index < derived.length; index += 1) {
    difference |= derived[index]! ^ verifier.expected[index]!;
  }
  return difference === 0;
}
