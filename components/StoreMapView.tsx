import React, { useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { STORE_COORDINATES, StoreCoordinate } from '../src/config/storeCoordinates';
import { Submission } from '../types';
import { AMOperationsSubmission, TrainingAuditSubmission, QASubmission, FinanceSubmission } from '../services/dataService';
import { SHLPSubmission } from '../services/shlpDataService';
import { MapPin, Filter, BarChart3, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';

/* ───────────────────────────── types ───────────────────────────── */

interface StoreMapViewProps {
  allStores: { id: string; name: string; region?: string }[];
  hrData: Submission[];
  operationsData: AMOperationsSubmission[];
  trainingData: TrainingAuditSubmission[];
  qaData: QASubmission[];
  financeData: FinanceSubmission[];
  shlpData: SHLPSubmission[];
}

interface StoreScoreData {
  storeId: string;
  storeName: string;
  region: string;
  coord: StoreCoordinate | null;
  hasCoordinates: boolean;
  hr: { count: number; avgScore: number };
  operations: { count: number; avgScore: number };
  training: { count: number; avgScore: number };
  qa: { count: number; avgScore: number };
  finance: { count: number; avgScore: number };
  shlp: { count: number; avgScore: number };
  overallAvg: number;
  totalSubmissions: number;
}

type ColorMetric = 'overall' | 'hr' | 'operations' | 'training' | 'qa' | 'finance' | 'shlp';
type RegionFilter = 'all' | 'South' | 'North' | 'West' | 'East';

/* ─────────────────────── colour helpers ────────────────────────── */

function scoreToColor(score: number, hasData: boolean): string {
  if (!hasData) return '#94a3b8'; // slate-400 — no data
  if (score >= 85) return '#22c55e'; // green-500
  if (score >= 70) return '#84cc16'; // lime-500
  if (score >= 55) return '#eab308'; // yellow-500
  if (score >= 40) return '#f97316'; // orange-500
  return '#ef4444'; // red-500
}

function scoreToLabel(score: number, hasData: boolean): string {
  if (!hasData) return 'No Data';
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 55) return 'Average';
  if (score >= 40) return 'Below Avg';
  return 'Needs Attention';
}

function scoreToTailwind(score: number, hasData: boolean): string {
  if (!hasData) return 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400';
  if (score >= 85) return 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400';
  if (score >= 70) return 'bg-lime-100 dark:bg-lime-900/40 text-lime-700 dark:text-lime-400';
  if (score >= 55) return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400';
  if (score >= 40) return 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400';
  return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400';
}

/* ────────── little "fly-to" helper inside the map context ──────── */
function FlyToButton({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  return (
    <button
      className="text-xs text-blue-500 underline"
      onClick={() => map.flyTo([lat, lng], 14, { duration: 1.2 })}
    >
      Zoom here
    </button>
  );
}

/* ═══════════════════════ MAIN COMPONENT ════════════════════════ */

const StoreMapView: React.FC<StoreMapViewProps> = ({
  allStores,
  hrData,
  operationsData,
  trainingData,
  qaData,
  financeData,
  shlpData,
}) => {
  const [colorMetric, setColorMetric] = useState<ColorMetric>('overall');
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('all');
  const [showUnconfigured, setShowUnconfigured] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  /* ─────── aggregate per-store score data ─────── */
  const storeScores: StoreScoreData[] = useMemo(() => {
    const map = new Map<string, StoreScoreData>();

    // Seed from allStores list
    allStores.forEach((s) => {
      const coord = STORE_COORDINATES[s.id] || null;
      const hasCoord = coord ? coord.lat !== 0 || coord.lng !== 0 : false;
      map.set(s.id, {
        storeId: s.id,
        storeName: coord?.name || s.name || s.id,
        region: s.region || inferRegion(s.id),
        coord,
        hasCoordinates: hasCoord,
        hr: { count: 0, avgScore: 0 },
        operations: { count: 0, avgScore: 0 },
        training: { count: 0, avgScore: 0 },
        qa: { count: 0, avgScore: 0 },
        finance: { count: 0, avgScore: 0 },
        shlp: { count: 0, avgScore: 0 },
        overallAvg: 0,
        totalSubmissions: 0,
      });
    });

    // Also seed from STORE_COORDINATES so stores without submissions still show
    Object.entries(STORE_COORDINATES).forEach(([id, coord]) => {
      if (!map.has(id)) {
        map.set(id, {
          storeId: id,
          storeName: coord.name,
          region: inferRegion(id),
          coord,
          hasCoordinates: coord.lat !== 0 || coord.lng !== 0,
          hr: { count: 0, avgScore: 0 },
          operations: { count: 0, avgScore: 0 },
          training: { count: 0, avgScore: 0 },
          qa: { count: 0, avgScore: 0 },
          finance: { count: 0, avgScore: 0 },
          shlp: { count: 0, avgScore: 0 },
          overallAvg: 0,
          totalSubmissions: 0,
        });
      }
    });

    // Helper: accumulate scores
    const acc = (storeId: string, cat: 'hr' | 'operations' | 'training' | 'qa' | 'finance' | 'shlp', score: number) => {
      const entry = map.get(storeId);
      if (!entry) return;
      const prev = entry[cat];
      const newCount = prev.count + 1;
      entry[cat] = { count: newCount, avgScore: (prev.avgScore * prev.count + score) / newCount };
    };

    // HR
    hrData.forEach((s) => acc(s.storeID, 'hr', s.percent));
    // Operations
    operationsData.forEach((s) => acc(s.storeId, 'operations', parseFloat(s.percentageScore || '0')));
    // Training
    trainingData.forEach((s) => acc(s.storeId, 'training', parseFloat(s.percentageScore || '0')));
    // QA
    qaData.forEach((s) => acc(s.storeId, 'qa', parseFloat(s.scorePercentage || '0')));
    // Finance
    financeData.forEach((s) => acc(s.storeId, 'finance', parseFloat(s.scorePercentage || '0')));
    // SHLP
    shlpData.forEach((s) => acc(s.Store, 'shlp', parseFloat(String(s.Overall_Percentage || '0'))));

    // Compute overall average and total submissions
    map.forEach((entry) => {
      const cats = [entry.hr, entry.operations, entry.training, entry.qa, entry.finance, entry.shlp];
      const withData = cats.filter((c) => c.count > 0);
      entry.overallAvg = withData.length > 0 ? withData.reduce((a, c) => a + c.avgScore, 0) / withData.length : 0;
      entry.totalSubmissions = cats.reduce((a, c) => a + c.count, 0);
    });

    return Array.from(map.values());
  }, [allStores, hrData, operationsData, trainingData, qaData, financeData, shlpData]);

  /* ─────── derived subsets ─────── */
  const filtered = useMemo(() => {
    let result = storeScores;
    if (regionFilter !== 'all') {
      result = result.filter((s) => s.region === regionFilter);
    }
    if (searchTerm) {
      const term = searchTerm.toUpperCase();
      result = result.filter(
        (s) => s.storeId.toUpperCase().includes(term) || s.storeName.toUpperCase().includes(term),
      );
    }
    return result;
  }, [storeScores, regionFilter, searchTerm]);

  const mappedStores = useMemo(() => filtered.filter((s) => s.hasCoordinates), [filtered]);
  const unmappedStores = useMemo(() => filtered.filter((s) => !s.hasCoordinates), [filtered]);

  /* ─────── stats summary ─────── */
  const summaryStats = useMemo(() => {
    const totalStores = storeScores.length;
    const withCoords = storeScores.filter((s) => s.hasCoordinates).length;
    const withData = storeScores.filter((s) => s.totalSubmissions > 0).length;
    const avgOverall = storeScores.filter(s => s.totalSubmissions > 0).length > 0
      ? storeScores.filter(s => s.totalSubmissions > 0).reduce((a, s) => a + s.overallAvg, 0) / storeScores.filter(s => s.totalSubmissions > 0).length
      : 0;
    return { totalStores, withCoords, withData, avgOverall };
  }, [storeScores]);

  /* ─────── metric selector helper ─────── */
  function getMetricScore(store: StoreScoreData): { score: number; hasData: boolean } {
    if (colorMetric === 'overall') return { score: store.overallAvg, hasData: store.totalSubmissions > 0 };
    const cat = store[colorMetric];
    return { score: cat.avgScore, hasData: cat.count > 0 };
  }

  /* ─────── region inferring from store ID ─────── */
  function inferRegion(storeId: string): string {
    // Hard-coded region assignment based on storeCoordinates.ts groupings
    const SOUTH = new Set(['S001','S002','S003','S004','S005','S006','S007','S008','S009','S011','S012','S014','S015','S016','S017','S018','S019','S020','S021','S022','S023','S030','S031','S032','S033','S034','S050','S051','S053','S063','S065','S067','S068','S069','S070','S082','S091','S092','S094','S095','S114','S115','S119','S125','S131','S133','S134','S139','S140','S146','S149','S152','S156','S158','S159','S184','S185','S189','S190','S191','S193','S199','S201','S206','S211','S217','S232','S233','S247']);
    const NORTH = new Set(['S024','S025','S026','S027','S028','S035','S036','S037','S038','S039','S040','S041','S042','S049','S055','S056','S062','S072','S073','S099','S100','S101','S102','S112','S113','S120','S121','S122','S126','S129','S141','S142','S148','S150','S153','S154','S155','S164','S166','S167','S171','S172','S173','S174','S176','S182','S187','S188','S192','S195','S197','S198','S200','S202','S223','S229','S235','S236','S241','S242']);
    const WEST = new Set(['S043','S044','S045','S047','S048','S057','S058','S059','S060','S061','S074','S075','S076','S077','S078','S080','S087','S088','S089','S090','S096','S097','S103','S104','S105','S106','S107','S109','S110','S111','S116','S117','S118','S127','S128','S130','S132','S135','S136','S137','S138','S147','S161','S162','S163','S165','S168','S170','S177','S180','S186','S204','S205','S210','S216','S219','S237','S240']);
    const EAST = new Set(['S066','S081','S083','S084','S085','S086','S108','S123','S143','S144','S145','S157','S160','S169','S175','S178','S194','S215','S234','S239']);
    if (SOUTH.has(storeId)) return 'South';
    if (NORTH.has(storeId)) return 'North';
    if (WEST.has(storeId)) return 'West';
    if (EAST.has(storeId)) return 'East';
    return 'Unknown';
  }

  const METRIC_OPTIONS: { value: ColorMetric; label: string; color: string }[] = [
    { value: 'overall', label: 'Overall', color: 'bg-slate-600' },
    { value: 'hr', label: 'HR', color: 'bg-blue-600' },
    { value: 'operations', label: 'Operations', color: 'bg-orange-600' },
    { value: 'training', label: 'Training', color: 'bg-purple-600' },
    { value: 'qa', label: 'QA', color: 'bg-red-600' },
    { value: 'finance', label: 'Finance', color: 'bg-green-600' },
    { value: 'shlp', label: 'SHLP', color: 'bg-emerald-600' },
  ];

  const LEGEND_ITEMS = [
    { label: 'Excellent (85%+)', color: '#22c55e' },
    { label: 'Good (70-84%)', color: '#84cc16' },
    { label: 'Average (55-69%)', color: '#eab308' },
    { label: 'Below Avg (40-54%)', color: '#f97316' },
    { label: 'Needs Attention (<40%)', color: '#ef4444' },
    { label: 'No Data', color: '#94a3b8' },
  ];

  /* ═══════════════════════ RENDER ═══════════════════════════ */
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 rounded-2xl shadow-lg p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Store Map View</h2>
            <p className="text-indigo-100 text-sm">Interactive map of all stores with performance metrics</p>
          </div>
        </div>

        {/* Summary pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="bg-white/15 backdrop-blur rounded-lg px-3 py-2 text-center">
            <p className="text-2xl font-bold text-white">{summaryStats.totalStores}</p>
            <p className="text-xs text-indigo-100">Total Stores</p>
          </div>
          <div className="bg-white/15 backdrop-blur rounded-lg px-3 py-2 text-center">
            <p className="text-2xl font-bold text-white">{summaryStats.withCoords}</p>
            <p className="text-xs text-indigo-100">On Map</p>
          </div>
          <div className="bg-white/15 backdrop-blur rounded-lg px-3 py-2 text-center">
            <p className="text-2xl font-bold text-white">{summaryStats.withData}</p>
            <p className="text-xs text-indigo-100">With Data</p>
          </div>
          <div className="bg-white/15 backdrop-blur rounded-lg px-3 py-2 text-center">
            <p className="text-2xl font-bold text-white">{Math.round(summaryStats.avgOverall)}%</p>
            <p className="text-xs text-indigo-100">Avg Score</p>
          </div>
        </div>
      </div>

      {/* ── Controls Row ── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          {/* Metric selector */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
              <BarChart3 className="w-3 h-3 inline mr-1" />Color By
            </label>
            <div className="flex flex-wrap gap-1.5">
              {METRIC_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setColorMetric(opt.value)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    colorMetric === opt.value
                      ? `${opt.color} text-white shadow`
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Region filter */}
          <div className="min-w-[140px]">
            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
              <Filter className="w-3 h-3 inline mr-1" />Region
            </label>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value as RegionFilter)}
              className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-700 dark:text-slate-200"
            >
              <option value="all">All Regions</option>
              <option value="South">South</option>
              <option value="North">North</option>
              <option value="West">West</option>
              <option value="East">East</option>
            </select>
          </div>

          {/* Search */}
          <div className="min-w-[180px]">
            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Search Store</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="e.g. S002 or Indira Nagar"
              className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-700 dark:text-slate-200 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
          {LEGEND_ITEMS.map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-gray-600 dark:text-slate-400">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Map ── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden" style={{ height: 520 }}>
        {mappedStores.length > 0 ? (
          <MapContainer
            center={[20.5937, 78.9629]}
            zoom={5}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {mappedStores.map((store) => {
              const { score, hasData } = getMetricScore(store);
              const color = scoreToColor(score, hasData);
              const label = scoreToLabel(score, hasData);
              const radius = hasData ? Math.max(8, Math.min(16, store.totalSubmissions * 1.5 + 6)) : 6;

              return (
                <CircleMarker
                  key={store.storeId}
                  center={[store.coord!.lat, store.coord!.lng]}
                  radius={radius}
                  pathOptions={{
                    fillColor: color,
                    fillOpacity: 0.85,
                    color: '#fff',
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div className="min-w-[220px] text-sm">
                      <div className="font-bold text-base mb-1">{store.storeId} – {store.storeName}</div>
                      <div className="text-gray-500 text-xs mb-2">{store.region} Region</div>

                      <div className="space-y-1.5">
                        <ScorePill label="Overall" score={store.overallAvg} count={store.totalSubmissions} />
                        <ScorePill label="HR" score={store.hr.avgScore} count={store.hr.count} colorClass="text-blue-600" />
                        <ScorePill label="Operations" score={store.operations.avgScore} count={store.operations.count} colorClass="text-orange-600" />
                        <ScorePill label="Training" score={store.training.avgScore} count={store.training.count} colorClass="text-purple-600" />
                        <ScorePill label="QA" score={store.qa.avgScore} count={store.qa.count} colorClass="text-red-600" />
                        <ScorePill label="Finance" score={store.finance.avgScore} count={store.finance.count} colorClass="text-green-600" />
                        <ScorePill label="SHLP" score={store.shlp.avgScore} count={store.shlp.count} colorClass="text-emerald-600" />
                      </div>

                      <div className={`mt-2 px-2 py-1 rounded text-xs font-semibold text-center`} style={{ backgroundColor: color + '30', color }}>
                        {label} — {Math.round(score)}%
                      </div>

                      <FlyToButton lat={store.coord!.lat} lng={store.coord!.lng} />
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-slate-500">
            <MapPin className="w-16 h-16 mb-3" />
            <p className="text-lg font-medium">No stores with GPS coordinates{regionFilter !== 'all' ? ` in ${regionFilter} region` : ''}</p>
            <p className="text-sm mt-1">Add lat/lng in <code className="bg-gray-100 dark:bg-slate-700 px-1 rounded">storeCoordinates.ts</code> to see stores on the map</p>
          </div>
        )}
      </div>

      {/* ── Store Score Table (all stores, sortable) ── */}
      <StoreScoreTable
        stores={filtered}
        colorMetric={colorMetric}
        getMetricScore={getMetricScore}
      />

      {/* ── Unconfigured Stores ── */}
      {unmappedStores.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
          <button
            onClick={() => setShowUnconfigured(!showUnconfigured)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              {showUnconfigured ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
              <span className="font-semibold text-gray-700 dark:text-slate-200">
                Stores Without GPS Coordinates ({unmappedStores.length})
              </span>
            </div>
            {showUnconfigured ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          {showUnconfigured && (
            <div className="px-5 pb-4">
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">
                These stores are not plotted on the map because they still have placeholder (0, 0) coordinates. Update <code className="bg-gray-100 dark:bg-slate-700 px-1 rounded">storeCoordinates.ts</code> with real GPS values.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {unmappedStores.map((store) => {
                  const { score, hasData } = getMetricScore(store);
                  return (
                    <div
                      key={store.storeId}
                      className="flex items-center justify-between bg-gray-50 dark:bg-slate-700/50 rounded-lg px-3 py-2"
                    >
                      <div className="min-w-0">
                        <span className="font-mono text-xs text-gray-500 dark:text-slate-400">{store.storeId}</span>
                        <span className="ml-1.5 text-sm text-gray-700 dark:text-slate-200 truncate">{store.storeName}</span>
                      </div>
                      <span
                        className={`ml-2 flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${scoreToTailwind(score, hasData)}`}
                      >
                        {hasData ? `${Math.round(score)}%` : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ──────────────────── Score Pill (popup) ──────────────────── */

function ScorePill({ label, score, count, colorClass = 'text-gray-700' }: { label: string; score: number; count: number; colorClass?: string }) {
  if (count === 0) return (
    <div className="flex items-center justify-between text-xs text-gray-400">
      <span className={colorClass}>{label}</span>
      <span>—</span>
    </div>
  );
  return (
    <div className="flex items-center justify-between text-xs">
      <span className={`font-medium ${colorClass}`}>{label}</span>
      <span className="font-semibold">{Math.round(score)}% <span className="text-gray-400">({count})</span></span>
    </div>
  );
}

/* ──────────────────── Store Score Table ──────────────────── */

function StoreScoreTable({
  stores,
  colorMetric,
  getMetricScore,
}: {
  stores: StoreScoreData[];
  colorMetric: ColorMetric;
  getMetricScore: (s: StoreScoreData) => { score: number; hasData: boolean };
}) {
  const [sortKey, setSortKey] = useState<'storeId' | 'storeName' | 'score' | 'submissions'>('score');
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const sorted = useMemo(() => {
    const arr = [...stores];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'storeId':
          cmp = a.storeId.localeCompare(b.storeId);
          break;
        case 'storeName':
          cmp = a.storeName.localeCompare(b.storeName);
          break;
        case 'score': {
          const sa = getMetricScore(a);
          const sb = getMetricScore(b);
          // push no-data to the end always
          if (!sa.hasData && !sb.hasData) cmp = 0;
          else if (!sa.hasData) cmp = 1;
          else if (!sb.hasData) cmp = -1;
          else cmp = sa.score - sb.score;
          break;
        }
        case 'submissions':
          cmp = a.totalSubmissions - b.totalSubmissions;
          break;
      }
      return sortAsc ? cmp : -cmp;
    });
    return arr;
  }, [stores, sortKey, sortAsc, getMetricScore]);

  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(key === 'storeId' || key === 'storeName'); }
  };

  const SortIcon = ({ active, asc }: { active: boolean; asc: boolean }) => (
    <span className={`ml-0.5 inline-block transition-transform ${active ? 'text-indigo-500' : 'text-gray-300 dark:text-slate-600'}`}>
      {asc ? '▲' : '▼'}
    </span>
  );

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700">
        <h3 className="font-semibold text-gray-800 dark:text-slate-200 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" /> Store Score Breakdown
          <span className="text-xs font-normal text-gray-400 dark:text-slate-500">({stores.length} stores)</span>
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-700/60 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              <th className="px-4 py-3 cursor-pointer" onClick={() => toggleSort('storeId')}>Store <SortIcon active={sortKey === 'storeId'} asc={sortAsc} /></th>
              <th className="px-4 py-3 hidden sm:table-cell cursor-pointer" onClick={() => toggleSort('storeName')}>Name <SortIcon active={sortKey === 'storeName'} asc={sortAsc} /></th>
              <th className="px-4 py-3 hidden lg:table-cell">Region</th>
              <th className="px-3 py-3 text-center">HR</th>
              <th className="px-3 py-3 text-center">Ops</th>
              <th className="px-3 py-3 text-center">Train</th>
              <th className="px-3 py-3 text-center">QA</th>
              <th className="px-3 py-3 text-center">Finance</th>
              <th className="px-3 py-3 text-center">SHLP</th>
              <th className="px-3 py-3 text-center cursor-pointer" onClick={() => toggleSort('score')}>
                {colorMetric === 'overall' ? 'Overall' : METRIC_OPTIONS_LABELS[colorMetric]}
                <SortIcon active={sortKey === 'score'} asc={sortAsc} />
              </th>
              <th className="px-3 py-3 text-center cursor-pointer" onClick={() => toggleSort('submissions')}># <SortIcon active={sortKey === 'submissions'} asc={sortAsc} /></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
            {paginated.map((store) => {
              const { score, hasData } = getMetricScore(store);
              return (
                <tr key={store.storeId} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{store.storeId}</span>
                    <span className="sm:hidden ml-1.5 text-gray-600 dark:text-slate-300 text-xs">{store.storeName}</span>
                  </td>
                  <td className="px-4 py-2.5 hidden sm:table-cell text-gray-700 dark:text-slate-300">{store.storeName}</td>
                  <td className="px-4 py-2.5 hidden lg:table-cell">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400">{store.region || '—'}</span>
                  </td>
                  <CatCell score={store.hr.avgScore} count={store.hr.count} />
                  <CatCell score={store.operations.avgScore} count={store.operations.count} />
                  <CatCell score={store.training.avgScore} count={store.training.count} />
                  <CatCell score={store.qa.avgScore} count={store.qa.count} />
                  <CatCell score={store.finance.avgScore} count={store.finance.count} />
                  <CatCell score={store.shlp.avgScore} count={store.shlp.count} />
                  <td className="px-3 py-2.5 text-center">
                    <span
                      className={`inline-block min-w-[48px] text-xs font-bold px-2 py-1 rounded-lg ${scoreToTailwind(score, hasData)}`}
                    >
                      {hasData ? `${Math.round(score)}%` : '—'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center text-xs text-gray-500 dark:text-slate-400 font-medium">{store.totalSubmissions || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-slate-700">
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} of {sorted.length}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 disabled:opacity-40"
            >
              Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = page < 3 ? i : page - 2 + i;
              if (p >= totalPages) return null;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${p === page ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300'}`}
                >
                  {p + 1}
                </button>
              );
            })}
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const METRIC_OPTIONS_LABELS: Record<string, string> = {
  overall: 'Overall',
  hr: 'HR',
  operations: 'Ops',
  training: 'Train',
  qa: 'QA',
  finance: 'Finance',
  shlp: 'SHLP',
};

/* ──────────────────── Category cell ──────────────────── */

function CatCell({ score, count }: { score: number; count: number }) {
  if (count === 0) return <td className="px-3 py-2.5 text-center text-xs text-gray-300 dark:text-slate-600">—</td>;
  const color = scoreToColor(score, true);
  return (
    <td className="px-3 py-2.5 text-center">
      <span
        className="inline-block w-8 h-8 leading-8 rounded-lg text-xs font-bold text-white"
        style={{ backgroundColor: color }}
        title={`${Math.round(score)}% (${count} submissions)`}
      >
        {Math.round(score)}
      </span>
    </td>
  );
}

export default StoreMapView;
