// @vitest-environment edge-runtime
/// <reference types="vite/client" />

import {afterEach, describe, expect, it, vi} from 'vitest';
import {fetchAgentMailInbox} from './controlledOutreach';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('AgentMail remote inbox verification', () => {
  it('loads bounded inbox metadata through the provider API without exposing the key', async () => {
    vi.stubEnv('AGENTMAIL_API_KEY', 'agentmail-test-key');
    const providerFetch = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response(
          JSON.stringify({
            inbox_id: 'inbox-test',
            email: 'maker@example.test',
            display_name: 'MakerMesh',
          }),
          {status: 200, headers: {'content-type': 'application/json'}},
        ),
    );
    vi.stubGlobal('fetch', providerFetch);

    await expect(fetchAgentMailInbox('inbox-test')).resolves.toMatchObject({
      inbox_id: 'inbox-test',
      email: 'maker@example.test',
      display_name: 'MakerMesh',
    });
    expect(providerFetch).toHaveBeenCalledOnce();
    const [, init] = providerFetch.mock.calls[0]!;
    expect(init?.headers).toEqual({Authorization: 'Bearer agentmail-test-key'});
    expect(init?.redirect).toBe('error');
  });

  it('fails closed on provider errors or unsafe credentials', async () => {
    vi.stubEnv('AGENTMAIL_API_KEY', 'agentmail-test-key');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', {status: 401})),
    );
    await expect(fetchAgentMailInbox('inbox-test')).rejects.toThrow('status 401');

    vi.stubEnv('AGENTMAIL_API_KEY', 'bad\nkey');
    await expect(fetchAgentMailInbox('inbox-test')).rejects.toThrow('not safely configured');
  });

  it('rejects unapproved origins before attaching credentials', async () => {
    vi.stubEnv('AGENTMAIL_API_KEY', 'agentmail-test-key');
    vi.stubEnv('AGENTMAIL_BASE_URL', 'http://127.0.0.1:8000/v0');
    const providerFetch = vi.fn();
    vi.stubGlobal('fetch', providerFetch);
    await expect(fetchAgentMailInbox('inbox-test')).rejects.toThrow(
      'not an approved provider origin',
    );
    expect(providerFetch).not.toHaveBeenCalled();
  });

  it('enforces the response limit before and during body streaming', async () => {
    vi.stubEnv('AGENTMAIL_API_KEY', 'agentmail-test-key');
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response('oversized', {
            status: 200,
            headers: {'content-length': '10001'},
          }),
      ),
    );
    await expect(fetchAgentMailInbox('inbox-test')).rejects.toThrow('safe limit');

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('x'.repeat(10_001), {status: 200})),
    );
    await expect(fetchAgentMailInbox('inbox-test')).rejects.toThrow('safe limit');
  });
});
