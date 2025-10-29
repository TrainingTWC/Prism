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

// Parse observed_period strings into Date objects. Supports YYYY-MM-DD, ISO, and YYYY-MM (returns last day of month).
export function parsePeriodDate(period: string): Date | null {
  if (!period) return null;
  // Try ISO/regular Date parse
  const d = new Date(period);
  if (!isNaN(d.getTime())) return d;
  // YYYY-MM -> return last day of that month
  const m = /^\s*(\d{4})-(\d{2})\s*$/.exec(period);
  if (m) {
    const y = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    return new Date(y, mm, 0);
  }
  return null;
}

// Compute per-store latest values up to cutoffNow and up to cutoffPrev (end of previous month).
// Returns averages (mean of one latest value per store) and optional per-store maps.
export function computePerStoreLatestAverages(rows: Row[], opts?: { cutoffNow?: Date; cutoffPrev?: Date; metricName?: string }) {
  const metric = (opts?.metricName || 'percentage').toLowerCase();
  const cutoffNow = opts?.cutoffNow ?? new Date();
  const cutoffPrev = opts?.cutoffPrev ?? new Date(cutoffNow.getFullYear(), cutoffNow.getMonth(), 0, 23, 59, 59, 999);

  const storeMap = new Map<string, { date: Date; value: number }[]>();
  for (const r of rows) {
    if (!r || !r.metric_name) continue;
    if ((r.metric_name || '').toLowerCase() !== metric) continue;
    const storeId = (r as any).store_id || (r as any).storeId || '';
    if (!storeId) continue;
    const date = parsePeriodDate((r as any).observed_period || (r as any).period || (r as any).submission_time_utc || '');
    if (!date) continue;
    const v = Number((r as any).metric_value ?? (r as any).metric_value) || 0;
    if (!storeMap.has(storeId)) storeMap.set(storeId, []);
    storeMap.get(storeId)!.push({ date, value: v });
  }

  const latestValues: Record<string, number> = {};
  const prevValues: Record<string, number> = {};

  for (const [storeId, arr] of storeMap.entries()) {
    const upToNow = arr.filter(x => x.date.getTime() <= cutoffNow.getTime()).sort((a, b) => a.date.getTime() - b.date.getTime());
    if (upToNow.length > 0) latestValues[storeId] = upToNow[upToNow.length - 1].value;

    const upToPrev = arr.filter(x => x.date.getTime() <= cutoffPrev.getTime()).sort((a, b) => a.date.getTime() - b.date.getTime());
    if (upToPrev.length > 0) prevValues[storeId] = upToPrev[upToPrev.length - 1].value;
  }

  const latestArr = Object.values(latestValues);
  const prevArr = Object.values(prevValues);

  const avgLatest = latestArr.length > 0 ? +(latestArr.reduce((s, x) => s + x, 0) / latestArr.length) : null;
  const avgPrev = prevArr.length > 0 ? +(prevArr.reduce((s, x) => s + x, 0) / prevArr.length) : null;

  return {
    avgLatest: avgLatest !== null ? Math.round(avgLatest) : null,
    avgPrev: avgPrev !== null ? Math.round(avgPrev) : null,
    latestValues,
    prevValues,
    storeCount: storeMap.size,
  };
}

// For each observed_period present in rows, compute the average of per-store latest
// values up to the end of that period. Returns array of { period, avg } sorted by period.
export function computePerPeriodLatestAverages(rows: Row[], metricName: string = 'percentage') {
  console.log('📊 computePerPeriodLatestAverages - input:', { rowsCount: rows.length, metricName });
  
  // Collect unique periods from rows
  const periods = Array.from(new Set(rows.map((r: any) => r.observed_period).filter(Boolean))).sort();
  console.log('📊 computePerPeriodLatestAverages - unique periods:', periods);
  
  const out: { period: string; avg: number | null }[] = [];
  for (const p of periods) {
    const cutoff = parsePeriodDate(p);
    console.log('📊 computePerPeriodLatestAverages - processing period:', p, 'cutoff:', cutoff);
    if (!cutoff) continue;
    const res = computePerStoreLatestAverages(rows, { cutoffNow: cutoff, metricName });
    console.log('📊 computePerPeriodLatestAverages - period', p, 'result:', res);
    out.push({ period: p, avg: res.avgLatest });
  }
  console.log('📊 computePerPeriodLatestAverages - final output:', out);
  return out;
}
