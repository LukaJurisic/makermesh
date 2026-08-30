export function normalizeMailbox(value: string) {
  const bracketed = /<([^<>]+)>/u.exec(value)?.[1] ?? value;
  return bracketed.trim().toLocaleLowerCase('en-US');
}

export async function sha256Hex(value: string) {
  const digest = new Uint8Array(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)),
  );
  return [...digest].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function mailboxHash(value: string) {
  return sha256Hex(normalizeMailbox(value));
}

export function hashListIncludes(configured: string | undefined, digest: string) {
  if (!configured) return false;
  return configured
    .split(',')
    .map((value) => value.trim().toLocaleLowerCase('en-US'))
    .some((value) => value.length === 64 && value === digest);
}
