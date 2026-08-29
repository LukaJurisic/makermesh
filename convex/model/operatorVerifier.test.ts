// @vitest-environment edge-runtime

import {describe, expect, it} from 'vitest';
import {parseOperatorVerifier, verifyOperatorCode} from './operatorVerifier';

function encodeBase64(value: Uint8Array) {
  return btoa(String.fromCharCode(...value));
}

async function makeVerifier(code: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(code),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const derived = new Uint8Array(
    await crypto.subtle.deriveBits(
      {name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100_000},
      key,
      256,
    ),
  );
  return `pbkdf2-sha256$100000$${encodeBase64(salt)}$${encodeBase64(derived)}`;
}

describe('operator verifier', () => {
  it('accepts the configured code and rejects a different one', async () => {
    const verifier = await makeVerifier('correct-horse-battery-staple');
    await expect(verifyOperatorCode('correct-horse-battery-staple', verifier)).resolves.toBe(true);
    await expect(verifyOperatorCode('incorrect-operator-code', verifier)).resolves.toBe(false);
  });

  it('rejects weak or malformed verifier configuration', () => {
    expect(() => parseOperatorVerifier('pbkdf2-sha256$1000$bad$bad')).toThrow(
      'configuration is invalid',
    );
  });
});
