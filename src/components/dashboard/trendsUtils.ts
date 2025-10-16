import { Filters } from '../../audit-dashboard/state';

export type Row = {
  store_id: string;
  store_name: string;
  metric_name: string;
  metric_value: number;
  observed_period: string; // YYYY-MM
  submission_time_utc?: string;
  trainer_id?: string;
  region_id?: string;
};

export function applyFilters(rows: Row[], filters?: Filters) {
  if (!filters) return rows;
  return rows.filter((r) => {
    if (filters.storeId && r.store_id !== filters.storeId) return false;
    if (filters.trainerId && r.trainer_id && r.trainer_id !== filters.trainerId) return false;
    if (filters.regionId && r.region_id && r.region_id !== filters.regionId) return false;
    if (filters.dateFrom) {
      if (r.observed_period) {
        if (r.observed_period < filters.dateFrom.slice(0, 7)) return false;
      } else if (r.submission_time_utc) {
        if (r.submission_time_utc < filters.dateFrom) return false;
      }
    }
    if (filters.dateTo) {
      if (r.observed_period) {
        if (r.observed_period > filters.dateTo.slice(0, 7)) return false;
      } else if (r.submission_time_utc) {
        if (r.submission_time_utc > filters.dateTo) return false;
      }
    }
    return true;
  });
}

export function aggregatePeriodAverages(rows: Row[], metric: string) {
  const byPeriod = new Map<string, { sum: number; count: number }>();
  for (const r of rows) {
    if (r.metric_name !== metric) continue;
    const p = r.observed_period;
    const cur = byPeriod.get(p) ?? { sum: 0, count: 0 };
    cur.sum += r.metric_value;
    cur.count += 1;
    byPeriod.set(p, cur);
  }
  const periods = Array.from(byPeriod.keys()).sort();
  return periods.map((p) => ({ period: p, avg: +(byPeriod.get(p)!.sum / byPeriod.get(p)!.count).toFixed(2) }));
}

export function computeStoreSeries(rows: Row[], metric: string) {
  const map = new Map<string, { name: string; series: Map<string, number> }>();
  for (const r of rows) {
    if (r.metric_name !== metric) continue;
    const sid = r.store_id;
    if (!map.has(sid)) map.set(sid, { name: r.store_name, series: new Map() });
    map.get(sid)!.series.set(r.observed_period, r.metric_value);
  }
  const out: { store_id: string; store_name: string; series: { period: string; value: number }[] }[] = [];
  for (const [store_id, v] of map.entries()) {
    const periods = Array.from(v.series.keys()).sort();
    const series = periods.map((p) => ({ period: p, value: v.series.get(p)! }));
    out.push({ store_id, store_name: v.name, series });
  }
  return out;
}

export function computeMoM(series: { period: string; value: number }[]) {
  if (series.length < 2) return null;
  const last = series[series.length - 1].value;
  const prev = series[series.length - 2].value;
  if (prev === 0) return null;
  return ((last - prev) / prev) * 100;
}
