/**
 * Test-only network kill switch.
 *
 * Unit and integration tests must never reach an AI provider (or any other
 * external service).  Tests that need a model are required to stub the
 * LangChain runnable instead.  Loopback is left available for a test that
 * explicitly starts a local HTTP server.
 */
import net from 'node:net';
import tls from 'node:tls';

const loopbackHosts = new Set(['127.0.0.1', '::1', 'localhost']);

function isLoopback(hostname: string | undefined): boolean {
  return hostname === undefined || loopbackHosts.has(hostname.toLowerCase());
}

function blockedNetworkCall(): never {
  throw new Error(
    'External network is disabled while running tests. Mock the AI/provider client instead.',
  );
}

const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = input instanceof Request ? input.url : input.toString();
  const hostname = new URL(url).hostname;
  if (!isLoopback(hostname)) blockedNetworkCall();
  return originalFetch(input, init);
};

function guardConnect<T extends (...args: never[]) => unknown>(
  original: T,
): T {
  return ((...args: unknown[]) => {
    const options = args[0];
    const host =
      typeof options === 'string'
        ? options
        : typeof options === 'object' && options !== null && 'host' in options
          ? String((options as { host?: string }).host)
          : undefined;
    if (!isLoopback(host)) blockedNetworkCall();
    return original(...(args as never[]));
  }) as unknown as T;
}

net.connect = guardConnect(net.connect);
net.createConnection = guardConnect(net.createConnection);
tls.connect = guardConnect(tls.connect);
