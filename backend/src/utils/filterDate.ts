/** Convert an ISO date input into the first instant of the following local day. */
export function startOfNextDay(value: string): Date {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day + 1);
}
