/** Turn an ISO 3166-1 alpha-2 code into its flag emoji (regional indicators). */
export function flagEmoji(iso2?: string): string {
  if (!iso2 || iso2.length !== 2 || !/^[A-Za-z]{2}$/.test(iso2)) return '🏳️';
  const base = 0x1f1e6;
  const cc = iso2.toUpperCase();
  return String.fromCodePoint(
    base + cc.charCodeAt(0) - 65,
    base + cc.charCodeAt(1) - 65,
  );
}
