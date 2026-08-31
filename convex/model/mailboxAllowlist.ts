export function normalizeMailbox(value: string) {
  const bracketed = /<([^<>]+)>/u.exec(value)?.[1] ?? value;
  return bracketed.trim().toLocaleLowerCase('en-US');
}

export function canonicalSingleMailbox(value: string) {
  const normalized = value.trim().toLocaleLowerCase('en-US');
  const parts = normalized.split('@');
  const local = parts[0] ?? '';
  const domain = parts[1] ?? '';
  if (
    parts.length !== 2 ||
    local.length < 1 ||
    local.length > 64 ||
    domain.length < 3 ||
    domain.length > 253 ||
    !domain.includes('.') ||
    !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/u.test(local) ||
    !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/u.test(
      domain,
    )
  ) {
    throw new Error('Recipient must be one canonical single mailbox.');
  }
  return normalized;
}

export function parseSingleMailboxHeader(value: string) {
  const trimmed = value.trim();
  if (!trimmed || /[\r\n,;]/u.test(trimmed)) {
    throw new Error('Sender must contain exactly one single mailbox.');
  }
  if (!trimmed.includes('<') && !trimmed.includes('>')) {
    return canonicalSingleMailbox(trimmed);
  }
  const displayMailbox = /^(?:"[^"<>]*"|[^<>"\r\n]+)\s*<([^<>]+)>$/u.exec(trimmed);
  if (!displayMailbox) {
    throw new Error('Sender must contain exactly one single mailbox.');
  }
  return canonicalSingleMailbox(displayMailbox[1]!);
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
