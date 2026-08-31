import {describe, expect, it} from 'vitest';
import {parseSingleMailboxHeader} from './mailboxAllowlist';

describe('parseSingleMailboxHeader', () => {
  it('accepts one plain or display-name mailbox and rejects ambiguous header material', () => {
    expect(parseSingleMailboxHeader('atlas-demo@example.test')).toBe('atlas-demo@example.test');
    expect(parseSingleMailboxHeader('"Atlas Demo" <atlas-demo@example.test>')).toBe(
      'atlas-demo@example.test',
    );
    expect(() =>
      parseSingleMailboxHeader('"Trusted <atlas-demo@example.test>" <attacker@evil.test>'),
    ).toThrow('single mailbox');
    expect(() =>
      parseSingleMailboxHeader('Atlas <atlas-demo@example.test>, attacker@evil.test'),
    ).toThrow('single mailbox');
    expect(() =>
      parseSingleMailboxHeader('atlas-demo@example.test\r\nBcc: attacker@evil.test'),
    ).toThrow('single mailbox');
  });
});
