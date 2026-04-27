import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Edit2, Trash2, Save, X, RefreshCw, Search, AlertTriangle, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { UserRole } from '../../roleMapping';
import {
  fetchTATRecords,
  TAT_TRACKER_ENDPOINT,
  VacancyRecord,
} from '../../services/tatTrackerData';
import {
  submitTATVacancy,
  deleteTATVacancy,
  generateVacancyId,
  registerTATQueueListeners,
  getPendingTATCount,
} from '../../services/tatTrackerSubmit';

interface TATTrackerFormProps {
  userRole: UserRole;
  onStatsUpdate?: (stats: { completed: number; total: number; score: number }) => void;
  onBackToChecklists?: () => void;
}

type FormState = Partial<VacancyRecord> & { vacancyId: string };

const HRBP_LIST = ['Manasi', 'Abhishek', 'Siddhant', 'Swati', 'Domini', 'Sunil', 'Sumanjali', 'Monica'];
const POSITIONS = ['SM', 'ASM', 'SS', 'BT', 'Barista', 'Trainee Barista', 'Other'];
const SOURCES   = ['Internal', 'Referral', 'Naukri', 'LinkedIn', 'Walk-in', 'Campus', 'Agency', 'Other'];
const STORE_TYPES = ['Existing', 'NSO'];
const POSITION_TYPES = ['New', 'Repl.'];

const emptyForm = (): FormState => ({
  vacancyId: generateVacancyId(),
  intimationDate: new Date().toISOString().slice(0, 10),
  region: '', brand: 'TWC', storeType: 'Existing', category: 'Store',
  position: '', storeId: '', storeName: '',
  positionType: 'New', dropOutType: '', dropOutSerialNo: '', replacementECode: '',
  holdTime: '', holdReason: '',
  offerLetterDate: '', doj: '',
  nsoOpeningDate: '', nsoOpenedWith100Manpower: '',
  sourceOfHiring: '', candidateName: '', candidateDesignation: '',
  referrerName: '', referrerEmpId: '',
  mmRmName: '', hrbpId: '', hrbpName: '',
  remarks: '',
});

const toDateInput = (iso: string | undefined): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
};

const TATTrackerForm: React.FC<TATTrackerFormProps> = ({ userRole, onBackToChecklists }) => {
  const [records, setRecords] = useState<VacancyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [search, setSearch]   = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'breach' | 'closed'>('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => { registerTATQueueListeners(); }, []);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const rows = await fetchTATRecords();
      setRecords(rows);
    } catch (e: any) {
      setError(e?.message || 'Failed to load vacancies');
    } finally {
      setLoading(false);
      setPendingCount(getPendingTATCount());
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const showToast = (msg: string, type: 'ok' | 'err') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter(r => {
      if (statusFilter === 'open'   && r.isClosed) return false;
      if (statusFilter === 'closed' && !r.isClosed) return false;
      if (statusFilter === 'breach' && (r.isClosed || r.tatStatus !== 'Off-TAT')) return false;
      if (!q) return true;
      return [r.vacancyId, r.storeId, r.storeName, r.region, r.position, r.hrbpName, r.candidateName]
        .some(v => String(v || '').toLowerCase().includes(q));
    });
  }, [records, search, statusFilter]);

  const openNew = () => {
    setForm(emptyForm());
    setShowForm(true);
  };

  const openEdit = (r: VacancyRecord) => {
    setForm({
      ...r,
      intimationDate:   toDateInput(r.intimationDate),
      offerLetterDate:  toDateInput(r.offerLetterDate),
      doj:              toDateInput(r.doj),
      nsoOpeningDate:   toDateInput(r.nsoOpeningDate),
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.intimationDate) { showToast('Intimation Date is required', 'err'); return; }
    if (!form.position)       { showToast('Position is required', 'err'); return; }
    if (!form.storeId)        { showToast('Store ID is required', 'err'); return; }
    if (!form.hrbpName)       { showToast('HRBP is required', 'err'); return; }
    if (form.offerLetterDate && form.intimationDate &&
        new Date(form.offerLetterDate) < new Date(form.intimationDate)) {
      showToast('Offer Letter Date cannot be before Intimation Date', 'err');
      return;
    }

    setSubmitting(true);
    try {
      const body: Record<string, string> = {};
      Object.entries(form).forEach(([k, v]) => {
        if (v !== undefined && v !== null) body[k] = String(v);
      });
      const r = await submitTATVacancy(TAT_TRACKER_ENDPOINT, body);
      if (r.ok) {
        showToast(r.duplicate ? 'Vacancy updated' : 'Vacancy saved', 'ok');
        setShowForm(false);
        await refresh();
      } else if (r.queued) {
        showToast('Offline — saved to queue, will sync when back online', 'ok');
        setShowForm(false);
        setPendingCount(getPendingTATCount());
      } else {
        showToast('Save failed: ' + (r.error || 'unknown'), 'err');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (vacancyId: string) => {
    if (!confirm('Delete this vacancy permanently?')) return;
    const r = await deleteTATVacancy(TAT_TRACKER_ENDPOINT, vacancyId);
    if (r.ok) { showToast('Deleted', 'ok'); refresh(); }
    else      { showToast('Delete failed', 'err'); }
  };

  const stat = useMemo(() => {
    const open    = records.filter(r => !r.isClosed).length;
    const breach  = records.filter(r => !r.isClosed && r.tatStatus === 'Off-TAT').length;
    const closed  = records.filter(r => r.isClosed).length;
    return { total: records.length, open, breach, closed };
  }, [records]);

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-gray-50 dark:bg-slate-900 min-h-screen">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
          toast.type === 'ok' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">TAT Tracker</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            HRBP-wise vacancy closure tracker — SLA {30} days
            {pendingCount > 0 && <span className="ml-2 text-amber-600">• {pendingCount} pending sync</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={refresh} disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-50 disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button onClick={openNew}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4" /> New Vacancy
          </button>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile label="Total"  value={stat.total}  color="bg-slate-500" />
        <StatTile label="Open"   value={stat.open}   color="bg-blue-500" icon={<Clock className="w-5 h-5" />} />
        <StatTile label="Breach (Open Off-TAT)" value={stat.breach} color="bg-red-500" icon={<AlertTriangle className="w-5 h-5" />} />
        <StatTile label="Closed" value={stat.closed} color="bg-green-500" icon={<CheckCircle className="w-5 h-5" />} />
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-200 dark:border-slate-700">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by store, HRBP, candidate, vacancy ID…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100" />
        </div>
        <div className="flex gap-1">
          {(['all', 'open', 'breach', 'closed'] as const).map(k => (
            <button key={k} onClick={() => setStatusFilter(k)}
              className={`px-3 py-2 text-sm rounded-lg border ${
                statusFilter === k
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-200'
              }`}>
              {k === 'breach' ? 'Off-TAT' : k.charAt(0).toUpperCase() + k.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
          {error}. Make sure <code>TAT_TRACKER_ENDPOINT</code> is set in <code>services/tatTrackerData.ts</code>.
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-700 text-gray-700 dark:text-slate-200">
              <tr>
                {['Intimation', 'HRBP', 'Region', 'Store', 'Position', 'Type', 'Days', 'Status', 'Source', 'Candidate', ''].map(h =>
                  <th key={h} className="text-left px-3 py-2 font-medium whitespace-nowrap">{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={11} className="text-center py-10 text-gray-500">
                  <Loader2 className="w-5 h-5 inline mr-2 animate-spin" /> Loading…
                </td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={11} className="text-center py-10 text-gray-500">No vacancies match.</td></tr>
              )}
              {!loading && filtered.map(r => (
                <tr key={r.vacancyId} className="border-t border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                  <td className="px-3 py-2 whitespace-nowrap">{toDateInput(r.intimationDate) || '—'}</td>
                  <td className="px-3 py-2 whitespace-nowrap font-medium">{r.hrbpName || '—'}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{r.region || '—'}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="font-medium">{r.storeId}</div>
                    <div className="text-xs text-gray-500">{r.storeName}</div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{r.position}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {r.positionType ? (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.positionType === 'New' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'}`}>
                        {r.positionType}
                      </span>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-right tabular-nums">{r.positionTime}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(r.vacancyStatus)}`}>
                      {r.vacancyStatus || '—'}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{r.sourceOfHiring || '—'}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{r.candidateName || '—'}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-right">
                    <button onClick={() => openEdit(r)} className="text-blue-600 hover:text-blue-800 mr-2"><Edit2 className="w-4 h-4" /></button>
                    {(userRole === 'admin' || userRole === 'editor') && (
                      <button onClick={() => handleDelete(r.vacancyId)} className="text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-2 sm:p-4">
          <div className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-800 px-5 py-3 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {records.some(r => r.vacancyId === form.vacancyId) ? 'Edit Vacancy' : 'New Vacancy'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <Section title="Vacancy">
                <Field label="Intimation Date *" type="date" value={form.intimationDate || ''} onChange={v => setForm({ ...form, intimationDate: v })} />
                <Select label="Store Type *"   options={STORE_TYPES}    value={form.storeType || ''}    onChange={v => setForm({ ...form, storeType: v })} />
                <Select label="Position *"     options={POSITIONS}      value={form.position || ''}     onChange={v => setForm({ ...form, position: v })} />
                <Select label="Position Type"  options={POSITION_TYPES} value={form.positionType || ''} onChange={v => setForm({ ...form, positionType: v })} />
              </Section>

              <Section title="Store (Region/AM auto-fill from Store_Mapping on save)">
                <Field label="Store ID *" value={form.storeId || ''} onChange={v => setForm({ ...form, storeId: v.toUpperCase() })} />
                <Field label="Store Name" value={form.storeName || ''} onChange={v => setForm({ ...form, storeName: v })} />
                <Field label="Region"     value={form.region || ''}    onChange={v => setForm({ ...form, region: v })} />
                <Field label="MM/RM Name" value={form.mmRmName || ''}  onChange={v => setForm({ ...form, mmRmName: v })} />
              </Section>

              <Section title="HRBP">
                <Select label="HRBP Name *" options={HRBP_LIST} value={form.hrbpName || ''}
                        onChange={v => setForm({ ...form, hrbpName: v, hrbpId: form.hrbpId || v.toLowerCase() })} />
                <Field label="HRBP ID" value={form.hrbpId || ''} onChange={v => setForm({ ...form, hrbpId: v })} />
              </Section>

              <Section title="Replacement / Drop-out (if applicable)">
                <Field label="Drop-Out Sl. No"   value={String(form.dropOutSerialNo || '')} onChange={v => setForm({ ...form, dropOutSerialNo: v })} />
                <Field label="Drop-Out Type"     value={form.dropOutType || ''}             onChange={v => setForm({ ...form, dropOutType: v })} />
                <Field label="Repl. E-Code"      value={form.replacementECode || ''}        onChange={v => setForm({ ...form, replacementECode: v })} />
                <Field label="Hold Time (days)"  type="number" value={String(form.holdTime || '')} onChange={v => setForm({ ...form, holdTime: v })} />
                <Field label="Hold Reason"       value={form.holdReason || ''}              onChange={v => setForm({ ...form, holdReason: v })} className="sm:col-span-2" />
              </Section>

              <Section title="Closure">
                <Field label="Offer Letter Date" type="date" value={form.offerLetterDate || ''} onChange={v => setForm({ ...form, offerLetterDate: v })} />
                <Field label="DOJ"               type="date" value={form.doj || ''}             onChange={v => setForm({ ...form, doj: v })} />
                <Select label="Source of Hiring" options={SOURCES} value={form.sourceOfHiring || ''} onChange={v => setForm({ ...form, sourceOfHiring: v })} />
                <Field label="Candidate Name"    value={form.candidateName || ''}    onChange={v => setForm({ ...form, candidateName: v })} />
                <Field label="Candidate Designation" value={form.candidateDesignation || ''} onChange={v => setForm({ ...form, candidateDesignation: v })} />
                {form.sourceOfHiring === 'Referral' && (
                  <>
                    <Field label="Referrer Name"   value={form.referrerName || ''}  onChange={v => setForm({ ...form, referrerName: v })} />
                    <Field label="Referrer Emp ID" value={form.referrerEmpId || ''} onChange={v => setForm({ ...form, referrerEmpId: v })} />
                  </>
                )}
              </Section>

              <Section title="NSO (only if Store Type = NSO)">
                <Field label="NSO Opening Date" type="date" value={form.nsoOpeningDate || ''} onChange={v => setForm({ ...form, nsoOpeningDate: v })} />
                <Select label="NSO Opened with 100% Manpower" options={['', 'Yes', 'No']} value={form.nsoOpenedWith100Manpower || ''} onChange={v => setForm({ ...form, nsoOpenedWith100Manpower: v })} />
              </Section>

              <Section title="Remarks">
                <Field label="Remarks" value={form.remarks || ''} onChange={v => setForm({ ...form, remarks: v })} className="sm:col-span-2" />
              </Section>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-slate-700">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {onBackToChecklists && (
        <div className="text-center pt-4">
          <button onClick={onBackToChecklists} className="text-sm text-gray-500 hover:text-gray-700 dark:text-slate-400">← Back to Checklists</button>
        </div>
      )}
    </div>
  );
};

const StatTile: React.FC<{ label: string; value: number; color: string; icon?: React.ReactNode }> = ({ label, value, color, icon }) => (
  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
    <div className="flex items-center justify-between">
      <div>
        <div className="text-xs text-gray-500 dark:text-slate-400">{label}</div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
      </div>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white ${color}`}>{icon}</div>
    </div>
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400 mb-2">{title}</div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>
  </div>
);

const Field: React.FC<{ label: string; value: string; onChange: (v: string) => void; type?: string; className?: string }> =
  ({ label, value, onChange, type = 'text', className }) => (
  <label className={`block ${className || ''}`}>
    <span className="text-xs font-medium text-gray-700 dark:text-slate-300">{label}</span>
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100" />
  </label>
);

const Select: React.FC<{ label: string; options: string[]; value: string; onChange: (v: string) => void }> =
  ({ label, options, value, onChange }) => (
  <label className="block">
    <span className="text-xs font-medium text-gray-700 dark:text-slate-300">{label}</span>
    <select value={value} onChange={e => onChange(e.target.value)}
      className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100">
      <option value="">— Select —</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </label>
);

function statusColor(s: string): string {
  if (!s) return 'bg-gray-100 text-gray-600';
  if (s.includes('Closed On-TAT')) return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
  if (s.includes('Closed Off-TAT')) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
  if (s.includes('Open On-TAT')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
  if (s.includes('Open Off-TAT')) return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
  return 'bg-gray-100 text-gray-600';
}

export default TATTrackerForm;
