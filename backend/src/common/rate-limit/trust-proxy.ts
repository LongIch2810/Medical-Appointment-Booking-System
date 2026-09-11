export function parseTrustProxyHops(value: unknown): number {
  if (value === undefined || value === null || value === '') {
    return 0;
  }

  const hops = Number(value);
  return Number.isInteger(hops) && hops >= 0 ? hops : 0;
}
