/**
 * Third Rush Feedback — top-level form router.
 *
 * Hosts 3 sub-forms accessed from a tile-style landing page:
 *   1. Full Feedback Audit  (10 structured questions, computed readiness score)
 *   2. Miscellaneous Feedback (free-form observations)
 *   3. Store Team's Feedback (in-store self-feedback)
 */
import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Sparkles, Users2, ArrowRight, CheckCircle2 } from 'lucide-react';
import compStoreMapping from '../../../src/comprehensive_store_mapping.json';
import { submitThirdRush, ThirdRushFormKind } from '../../../services/thirdRushFeedbackData';

type Stats = { completed: number; total: number; score: number };

interface ThirdRushFeedbackProps {
  userRole?: any;
  onStatsUpdate?: (stats: Stats) => void;
  initialSection?: ThirdRushFormKind | null;
}

interface StoreInfo { 'Store ID': string; 'Store Name': string; }
// Third Rush feedback applies to only 4 pilot stores
const THIRD_RUSH_STORE_IDS = new Set(['S001', 'S002', 'S004', 'S069']);
const STORES = (compStoreMapping as StoreInfo[])
  .filter(s => THIRD_RUSH_STORE_IDS.has(s['Store ID']))
  .map(s => ({ id: s['Store ID'], name: s['Store Name'] }));

function getEmpId(): string {
  try {
    const u = new URLSearchParams(window.location.search);
    return u.get('EMPID') || u.get('id') || u.get('hrId') || '';
  } catch {
    return '';
  }
}

// ============================================================================
// Reusable inputs
// ============================================================================
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-5 ${className}`}>
    {children}
  </div>
);

const Label: React.FC<{ children: React.ReactNode; required?: boolean }> = ({ children, required }) => (
  <label className="block text-sm font-semibold text-gray-800 dark:text-slate-200 mb-2">
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </label>
);

const SectionTag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="text-[10px] uppercase tracking-wide font-semibold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-900/30 rounded-full px-2 py-0.5">
    {children}
  </span>
);

const StoreSelect: React.FC<{
  storeId: string;
  onChange: (id: string, name: string) => void;
}> = ({ storeId, onChange }) => {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    if (!search.trim()) return STORES.slice(0, 50);
    const q = search.trim().toLowerCase();
    return STORES.filter(s => s.id.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)).slice(0, 50);
  }, [search]);
  const selected = STORES.find(s => s.id === storeId);
  return (
    <div>
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search store by name or ID..."
        className="w-full px-3 py-2 mb-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
      />
      <select
        value={storeId}
        onChange={e => {
          const s = STORES.find(x => x.id === e.target.value);
          if (s) onChange(s.id, s.name);
        }}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
      >
        <option value="">— Select store —</option>
        {selected && !filtered.find(s => s.id === selected.id) && (
          <option value={selected.id}>{selected.id} — {selected.name}</option>
        )}
        {filtered.map(s => (
          <option key={s.id} value={s.id}>{s.id} — {s.name}</option>
        ))}
      </select>
    </div>
  );
};

const PillGroup: React.FC<{
  options: string[];
  value: string;
  onChange: (v: string) => void;
  intent?: 'positive' | 'neutral';
}> = ({ options, value, onChange }) => (
  <div className="flex flex-wrap gap-2">
    {options.map(opt => {
      const active = value === opt;
      return (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
            active
              ? 'bg-cyan-600 border-cyan-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:border-cyan-400'
          }`}
        >
          {opt}
        </button>
      );
    })}
  </div>
);

const YesNo: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => (
  <div className="flex gap-3">
    {[
      { v: 'Yes', cls: 'bg-emerald-600 border-emerald-600 text-white' },
      { v: 'No',  cls: 'bg-red-500 border-red-500 text-white' }
    ].map(o => {
      const active = value === o.v;
      return (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
            active ? o.cls : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300'
          }`}
        >
          {o.v}
        </button>
      );
    })}
  </div>
);

// ============================================================================
// FULL FEEDBACK AUDIT
// ============================================================================
interface FullForm {
  storeId: string; storeName: string; auditorName: string;
  equipmentFunctional: string; posBillingSmooth: string;
  avgOrderTime: string; workflowEfficiency: string;
  staffUrgency: string; coffeeQuality: string;
  biggestBottleneck: string; overallReadiness: string;
}
const EMPTY_FULL: FullForm = {
  storeId: '', storeName: '', auditorName: '',
  equipmentFunctional: '', posBillingSmooth: '',
  avgOrderTime: '', workflowEfficiency: '',
  staffUrgency: '', coffeeQuality: '',
  biggestBottleneck: '', overallReadiness: ''
};

function readinessScore(f: FullForm): number {
  const map: number[] = [];
  if (f.equipmentFunctional) map.push(f.equipmentFunctional === 'Yes' ? 100 : 0);
  if (f.posBillingSmooth)    map.push(f.posBillingSmooth === 'Yes' ? 100 : 0);
  if (f.avgOrderTime) {
    const t = f.avgOrderTime;
    map.push(t.includes('Under 3') ? 100 : t.startsWith('3') ? 75 : t.startsWith('5') ? 40 : 0);
  }
  if (f.workflowEfficiency) map.push(f.workflowEfficiency === 'Smooth' ? 100 : f.workflowEfficiency === 'Minor delays' ? 50 : 0);
  if (f.staffUrgency)       map.push(f.staffUrgency === 'High' ? 100 : f.staffUrgency === 'Inconsistent' ? 50 : 0);
  if (f.coffeeQuality)      map.push(f.coffeeQuality === 'On point' ? 100 : f.coffeeQuality === 'Slight deviation' ? 50 : 0);
  if (!map.length) return 0;
  return Math.round(map.reduce((a, b) => a + b, 0) / map.length);
}

const FullAudit: React.FC<{ onBack: () => void; onStatsUpdate?: (s: Stats) => void }> = ({ onBack, onStatsUpdate }) => {
  const STORAGE = 'third_rush_full_v1_resp';
  const [form, setForm] = useState<FullForm>(() => {
    try { return { ...EMPTY_FULL, ...(JSON.parse(localStorage.getItem(STORAGE) || '{}')) }; } catch { return EMPTY_FULL; }
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => { localStorage.setItem(STORAGE, JSON.stringify(form)); }, [form]);

  const fields: (keyof FullForm)[] = [
    'storeId','auditorName','equipmentFunctional','posBillingSmooth','avgOrderTime',
    'workflowEfficiency','staffUrgency','coffeeQuality','biggestBottleneck','overallReadiness'
  ];
  const completed = fields.filter(k => String(form[k] || '').trim()).length;
  const score = readinessScore(form);
  useEffect(() => { onStatsUpdate?.({ completed, total: fields.length, score }); }, [completed, score]);

  const set = <K extends keyof FullForm>(k: K, v: FullForm[K]) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async () => {
    const missing = fields.filter(k => !String(form[k] || '').trim());
    if (missing.length) {
      alert('Please answer all questions before submitting.\nMissing: ' + missing.join(', '));
      return;
    }
    setSubmitting(true);
    const res = await submitThirdRush('full', { ...form, auditorEmpId: getEmpId() });
    setSubmitting(false);
    if (res.ok) {
      setSubmitted(true);
      localStorage.removeItem(STORAGE);
      setTimeout(() => onBack(), 1800);
    } else {
      alert('Submit failed. Please try again.');
    }
  };

  if (submitted) return (
    <Card className="text-center py-12">
      <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-3" />
      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Audit submitted</h3>
      <p className="text-gray-500 dark:text-slate-400 mt-1">Readiness Score: <strong>{score}</strong>/100</p>
    </Card>
  );

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between mb-1">
          <SectionTag>Basic Info</SectionTag>
          <span className="text-xs text-gray-500 dark:text-slate-400">{completed}/{fields.length} answered • Readiness {score}</span>
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 mt-2">Full Feedback Audit</h3>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label required>Store Name</Label>
            <StoreSelect storeId={form.storeId} onChange={(id, name) => { set('storeId', id); set('storeName', name); }} />
          </div>
          <div>
            <Label required>Auditor Name</Label>
            <input
              type="text"
              value={form.auditorName}
              onChange={e => set('auditorName', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
              placeholder="Your full name"
            />
          </div>
        </div>
      </Card>

      <Card>
        <SectionTag>Core Readiness</SectionTag>
        <div className="mt-4 space-y-5">
          <div><Label required>All equipment functional and tested?</Label>
            <YesNo value={form.equipmentFunctional} onChange={v => set('equipmentFunctional', v)} /></div>
          <div><Label required>POS &amp; billing working smoothly?</Label>
            <YesNo value={form.posBillingSmooth} onChange={v => set('posBillingSmooth', v)} /></div>
        </div>
      </Card>

      <Card>
        <SectionTag>Speed</SectionTag>
        <div className="mt-4">
          <Label required>Average order time (observed)</Label>
          <PillGroup
            options={['Under 3 mins', '3–5 mins', '5–8 mins', '8+ mins']}
            value={form.avgOrderTime}
            onChange={v => set('avgOrderTime', v)}
          />
        </div>
      </Card>

      <Card>
        <SectionTag>Operations</SectionTag>
        <div className="mt-4">
          <Label required>Workflow efficiency (team coordination)</Label>
          <PillGroup options={['Smooth', 'Minor delays', 'Disorganized']} value={form.workflowEfficiency}
            onChange={v => set('workflowEfficiency', v)} />
        </div>
      </Card>

      <Card>
        <SectionTag>Staff</SectionTag>
        <div className="mt-4">
          <Label required>Staff urgency &amp; energy level</Label>
          <PillGroup options={['High', 'Inconsistent', 'Low']} value={form.staffUrgency}
            onChange={v => set('staffUrgency', v)} />
        </div>
      </Card>

      <Card>
        <SectionTag>Product</SectionTag>
        <div className="mt-4">
          <Label required>Coffee quality (dial-in + taste check)</Label>
          <PillGroup options={['On point', 'Slight deviation', 'Poor']} value={form.coffeeQuality}
            onChange={v => set('coffeeQuality', v)} />
        </div>
      </Card>

      <Card>
        <SectionTag>Insight</SectionTag>
        <div className="mt-4">
          <Label required>Biggest bottleneck observed during service</Label>
          <textarea
            value={form.biggestBottleneck}
            onChange={e => set('biggestBottleneck', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
            placeholder="Describe what slowed the team down most..."
          />
        </div>
      </Card>

      <Card>
        <SectionTag>Final Call</SectionTag>
        <div className="mt-4">
          <Label required>Overall Readiness</Label>
          <PillGroup options={['Ready', 'Needs Fixes', 'Not Ready']} value={form.overallReadiness}
            onChange={v => set('overallReadiness', v)} />
        </div>
      </Card>

      <div className="flex gap-3 sticky bottom-0 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-slate-900 dark:via-slate-900/95 py-3">
        <button onClick={onBack} className="px-4 py-2 rounded-lg text-sm font-semibold border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300">
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold bg-cyan-600 hover:bg-cyan-700 text-white disabled:opacity-60"
        >
          {submitting ? 'Submitting…' : `Submit Audit (Readiness ${score}/100)`}
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// MISCELLANEOUS FEEDBACK
// ============================================================================
interface MiscForm {
  storeId: string; storeName: string; auditorName: string;
  category: string; observation: string; actionSuggested: string; severity: string;
}
const EMPTY_MISC: MiscForm = { storeId: '', storeName: '', auditorName: '', category: '', observation: '', actionSuggested: '', severity: '' };

const MiscFeedback: React.FC<{ onBack: () => void; onStatsUpdate?: (s: Stats) => void }> = ({ onBack, onStatsUpdate }) => {
  const STORAGE = 'third_rush_misc_v1_resp';
  const [form, setForm] = useState<MiscForm>(() => {
    try { return { ...EMPTY_MISC, ...(JSON.parse(localStorage.getItem(STORAGE) || '{}')) }; } catch { return EMPTY_MISC; }
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => { localStorage.setItem(STORAGE, JSON.stringify(form)); }, [form]);

  const fields: (keyof MiscForm)[] = ['storeId','auditorName','category','observation','severity'];
  const completed = fields.filter(k => String(form[k] || '').trim()).length;
  useEffect(() => { onStatsUpdate?.({ completed, total: fields.length, score: 0 }); }, [completed]);

  const set = <K extends keyof MiscForm>(k: K, v: MiscForm[K]) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async () => {
    const missing = fields.filter(k => !String(form[k] || '').trim());
    if (missing.length) { alert('Please complete: ' + missing.join(', ')); return; }
    setSubmitting(true);
    const res = await submitThirdRush('misc', { ...form, auditorEmpId: getEmpId() });
    setSubmitting(false);
    if (res.ok) {
      setSubmitted(true);
      localStorage.removeItem(STORAGE);
      setTimeout(() => onBack(), 1500);
    } else { alert('Submit failed. Please try again.'); }
  };

  if (submitted) return (
    <Card className="text-center py-10">
      <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Feedback noted</h3>
    </Card>
  );

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Miscellaneous Feedback</h3>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">Quick observation, ad-hoc note, or anything outside the structured audit.</p>
        <div className="grid md:grid-cols-2 gap-4">
          <div><Label required>Store</Label>
            <StoreSelect storeId={form.storeId} onChange={(id, name) => { set('storeId', id); set('storeName', name); }} /></div>
          <div><Label required>Your Name</Label>
            <input type="text" value={form.auditorName} onChange={e => set('auditorName', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm" /></div>
        </div>
      </Card>

      <Card>
        <Label required>Category</Label>
        <PillGroup options={['Service', 'Hygiene', 'Equipment', 'Stock', 'Customer', 'Other']}
          value={form.category} onChange={v => set('category', v)} />

        <div className="mt-5">
          <Label required>Observation</Label>
          <textarea rows={4} value={form.observation} onChange={e => set('observation', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
            placeholder="What did you notice?" />
        </div>

        <div className="mt-5">
          <Label>Action Suggested</Label>
          <textarea rows={3} value={form.actionSuggested} onChange={e => set('actionSuggested', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
            placeholder="Optional — what should happen next?" />
        </div>

        <div className="mt-5">
          <Label required>Severity</Label>
          <PillGroup options={['Low', 'Medium', 'High', 'Critical']}
            value={form.severity} onChange={v => set('severity', v)} />
        </div>
      </Card>

      <div className="flex gap-3">
        <button onClick={onBack} className="px-4 py-2 rounded-lg text-sm font-semibold border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300">Cancel</button>
        <button onClick={handleSubmit} disabled={submitting}
          className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold bg-cyan-600 hover:bg-cyan-700 text-white disabled:opacity-60">
          {submitting ? 'Submitting…' : 'Submit Feedback'}
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// STORE TEAM'S FEEDBACK
// ============================================================================
interface StaffForm {
  storeId: string; storeName: string; submittedBy: string; submitterRole: string;
  teamMorale: string; staffingAdequate: string;
  biggestChallenge: string; whatWentWell: string; suggestions: string;
}
const EMPTY_STAFF: StaffForm = {
  storeId: '', storeName: '', submittedBy: '', submitterRole: '',
  teamMorale: '', staffingAdequate: '',
  biggestChallenge: '', whatWentWell: '', suggestions: ''
};

const StoreTeamFeedback: React.FC<{ onBack: () => void; onStatsUpdate?: (s: Stats) => void }> = ({ onBack, onStatsUpdate }) => {
  const STORAGE = 'third_rush_staff_v1_resp';
  const [form, setForm] = useState<StaffForm>(() => {
    try { return { ...EMPTY_STAFF, ...(JSON.parse(localStorage.getItem(STORAGE) || '{}')) }; } catch { return EMPTY_STAFF; }
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => { localStorage.setItem(STORAGE, JSON.stringify(form)); }, [form]);

  const fields: (keyof StaffForm)[] = ['storeId','submittedBy','submitterRole','teamMorale','staffingAdequate','biggestChallenge','whatWentWell'];
  const completed = fields.filter(k => String(form[k] || '').trim()).length;
  useEffect(() => { onStatsUpdate?.({ completed, total: fields.length, score: 0 }); }, [completed]);

  const set = <K extends keyof StaffForm>(k: K, v: StaffForm[K]) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async () => {
    const missing = fields.filter(k => !String(form[k] || '').trim());
    if (missing.length) { alert('Please complete: ' + missing.join(', ')); return; }
    setSubmitting(true);
    const res = await submitThirdRush('staff', { ...form, auditorEmpId: getEmpId() });
    setSubmitting(false);
    if (res.ok) {
      setSubmitted(true);
      localStorage.removeItem(STORAGE);
      setTimeout(() => onBack(), 1500);
    } else { alert('Submit failed. Please try again.'); }
  };

  if (submitted) return (
    <Card className="text-center py-10">
      <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Thanks for sharing!</h3>
    </Card>
  );

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Store Team's Feedback</h3>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">In-store self-feedback — how the rush actually felt to the team.</p>
        <div className="grid md:grid-cols-2 gap-4">
          <div><Label required>Store</Label>
            <StoreSelect storeId={form.storeId} onChange={(id, name) => { set('storeId', id); set('storeName', name); }} /></div>
          <div><Label required>Submitted By</Label>
            <input type="text" value={form.submittedBy} onChange={e => set('submittedBy', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm" /></div>
          <div className="md:col-span-2"><Label required>Role</Label>
            <PillGroup options={['Store Manager', 'Asst. Manager', 'Buddy Trainer', 'Barista', 'Other']}
              value={form.submitterRole} onChange={v => set('submitterRole', v)} /></div>
        </div>
      </Card>

      <Card>
        <Label required>Team morale during the rush</Label>
        <PillGroup options={['High', 'Okay', 'Low']} value={form.teamMorale} onChange={v => set('teamMorale', v)} />

        <div className="mt-5"><Label required>Was staffing adequate?</Label>
          <YesNo value={form.staffingAdequate} onChange={v => set('staffingAdequate', v)} /></div>

        <div className="mt-5"><Label required>Biggest challenge faced</Label>
          <textarea rows={3} value={form.biggestChallenge} onChange={e => set('biggestChallenge', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm" /></div>

        <div className="mt-5"><Label required>What went well</Label>
          <textarea rows={3} value={form.whatWentWell} onChange={e => set('whatWentWell', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm" /></div>

        <div className="mt-5"><Label>Suggestions for next rush</Label>
          <textarea rows={3} value={form.suggestions} onChange={e => set('suggestions', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm" /></div>
      </Card>

      <div className="flex gap-3">
        <button onClick={onBack} className="px-4 py-2 rounded-lg text-sm font-semibold border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300">Cancel</button>
        <button onClick={handleSubmit} disabled={submitting}
          className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold bg-cyan-600 hover:bg-cyan-700 text-white disabled:opacity-60">
          {submitting ? 'Submitting…' : 'Share Feedback'}
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// LANDING + ROUTER
// ============================================================================
const ThirdRushFeedback: React.FC<ThirdRushFeedbackProps> = ({ onStatsUpdate, initialSection = null }) => {
  const [section, setSection] = useState<ThirdRushFormKind | null>(initialSection);

  if (section === 'full')  return <FullAudit         onBack={() => setSection(null)} onStatsUpdate={onStatsUpdate} />;
  if (section === 'misc')  return <MiscFeedback      onBack={() => setSection(null)} onStatsUpdate={onStatsUpdate} />;
  if (section === 'staff') return <StoreTeamFeedback onBack={() => setSection(null)} onStatsUpdate={onStatsUpdate} />;

  const tiles: { id: ThirdRushFormKind; title: string; desc: string; icon: React.ReactNode; color: string; }[] = [
    { id: 'full',  title: 'Full Feedback Audit',     desc: '10-question structured audit with readiness score', icon: <ClipboardList className="w-6 h-6" />, color: 'from-cyan-500 to-sky-600' },
    { id: 'misc',  title: 'Miscellaneous Feedback',  desc: 'Quick ad-hoc observations and notes',               icon: <Sparkles className="w-6 h-6" />,      color: 'from-violet-500 to-fuchsia-600' },
    { id: 'staff', title: "Store Team's Feedback",   desc: 'In-store self-feedback from the team',              icon: <Users2 className="w-6 h-6" />,        color: 'from-emerald-500 to-teal-600' }
  ];

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Third Rush Feedback</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
          Choose a feedback type to begin. Drafts are auto-saved on this device.
        </p>
      </Card>
      <div className="grid md:grid-cols-3 gap-4">
        {tiles.map(t => (
          <button
            key={t.id}
            onClick={() => setSection(t.id)}
            className="text-left bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 hover:border-cyan-400 dark:hover:border-cyan-500 shadow-sm hover:shadow-md transition-all p-5 group"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${t.color} text-white flex items-center justify-center mb-3`}>
              {t.icon}
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">{t.title}</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{t.desc}</p>
            <div className="mt-3 flex items-center gap-1 text-cyan-600 dark:text-cyan-400 text-sm font-medium">
              Open <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThirdRushFeedback;
