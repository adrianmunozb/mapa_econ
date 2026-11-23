import { useEffect, useState } from 'react';
import type { MetricHistory, TimeseriesIndex } from '../types';
import { cachedLoader } from './loader';

const loadHistory = cachedLoader<MetricHistory>('timeseries', (id) => `/data/timeseries/${id}.json`);

/**
 * Loads the yearly history of `metricId` on demand and keeps every history loaded so
 * far, so switching back to a metric is instant. Metrics without a history file
 * (e.g. the latest-only policy rate) are never requested.
 */
export function useMetricHistories(
  metricId: string | undefined,
  index: TimeseriesIndex | null,
): Record<string, MetricHistory> {
  const [histories, setHistories] = useState<Record<string, MetricHistory>>({});

  useEffect(() => {
    if (!metricId || !index?.metrics.includes(metricId)) return;
    loadHistory(metricId)
      .then((h) => setHistories((prev) => (prev[metricId] ? prev : { ...prev, [metricId]: h })))
      .catch(() => {}); // history is optional: the map still works from the snapshot
  }, [metricId, index]);

  return histories;
}
