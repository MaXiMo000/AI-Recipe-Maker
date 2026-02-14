/**
 * Format ISO date string to short readable form (e.g. "Feb 14, 2026")
 */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Format date range (e.g. "Feb 14 – 20, 2026")
 */
export function formatDateRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const sameYear = start.getFullYear() === end.getFullYear();
  const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return sameYear ? `${startStr} – ${endStr}, ${start.getFullYear()}` : `${startStr} – ${endStr}, ${end.getFullYear()}`;
}
