import snapshot from './chokepoint-traffic.json' with { type: 'json' };

export interface TrafficDay { date: string; vessels: number | null }
export const TRAFFIC = snapshot;
const DAY_MS = 86_400_000;

/** Missing observations must never look like zero traffic. Require a complete calendar window. */
export function trafficAverage(series: TrafficDay[], endDate: string, days: number): number | null {
  if (!Number.isInteger(days) || days < 1) return null;
  const byDate = new Map(series.map((row) => [row.date, row.vessels]));
  let total = 0;
  for (let offset = 0; offset < days; offset++) {
    const date = new Date(Date.parse(endDate) - offset * DAY_MS).toISOString().slice(0, 10);
    const count = byDate.get(date);
    if (count === undefined || count === null || !Number.isFinite(count) || count < 0) return null;
    total += count;
  }
  return total / days;
}

export function trafficSummary(series: TrafficDay[], endDate: string) {
  const previousEnd = new Date(Date.parse(endDate) - 30 * DAY_MS).toISOString().slice(0, 10);
  const current = trafficAverage(series, endDate, 30);
  const previous = trafficAverage(series, previousEnd, 30);
  return { current, previous,
    change: current !== null && previous !== null && previous > 0 ? (current / previous - 1) * 100 : null,
    latest: series.find((day) => day.date === endDate)?.vessels ?? null,
  };
}

export function trafficSeries(id: string): TrafficDay[] {
  return (snapshot.series as Record<string, TrafficDay[]>)[id] ?? [];
}

/** Break the line at gaps; horizontal position follows calendar days. */
export function trafficChart(series: TrafficDay[], startDate: string, endDate: string): string {
  const max = Math.max(1, ...series.map((row) => row.vessels ?? 0));
  const start = Date.parse(startDate);
  const span = Math.max(DAY_MS, Date.parse(endDate) - start);
  let previous = -Infinity;
  return [...series].sort((a, b) => a.date.localeCompare(b.date)).map((row) => {
    const time = Date.parse(row.date);
    if (row.vessels === null) { previous = -Infinity; return ''; }
    const command = time - previous === DAY_MS ? 'L' : 'M';
    previous = time;
    return `${command}${(10 + (time - start) / span * 380).toFixed(1)},${(105 - row.vessels / max * 90).toFixed(1)}`;
  }).join(' ');
}
