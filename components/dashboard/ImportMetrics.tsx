import React, { useState } from 'react';

export default function ImportMetrics() {
  const [text, setText] = useState('');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dryRun, setDryRun] = useState(true);
  const [force, setForce] = useState(false);
  const [error, setError] = useState('');

  const handlePreview = async () => {
    setError(''); setReport(null);
    let payload: any = null;
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        // allow either array-of-rows or { rows: [...] }
        if (parsed && parsed.rows) payload = { rows: parsed.rows, options: { dryRun } };
        else throw new Error('Expected an array of rows or { rows: [...] }');
      } else {
        payload = { rows: parsed, options: { dryRun } };
      }
    } catch (e:any) {
      setError('Invalid JSON: ' + (e.message || e));
      return;
    }
    payload.options = payload.options || {};
    payload.options.dryRun = dryRun;
    payload.options.force = force;
    setLoading(true);
    try {
      const r = await fetch('/api/import-metrics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Import failed');
      setReport(data);
    } catch (err:any) {
      setError(err.message || String(err));
    } finally { setLoading(false); }
  };

  const handleApply = async () => {
    setDryRun(false);
    await handlePreview();
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-3">Import Metrics (JSON)</h2>
      <p className="text-sm text-gray-600 mb-4">Paste an array of metric rows (or an object with a &quot;rows&quot; array). The Google Sheet is authoritative on conflicts unless you toggle &quot;Force overwrite&quot;.</p>
      <textarea value={text} onChange={e => setText(e.target.value)} rows={12} className="w-full p-3 border rounded mb-3" placeholder='[ { "store_id": "S123", "metric_name": "score", "metric_value": 82.5, "period_type": "monthly", "observed_period": "2025-07", "submission_time_utc": "2025-08-01T02:30:10Z" } ]' />
      <div className="flex items-center gap-4 mb-4">
        <label className="flex items-center gap-2"><input type="checkbox" checked={dryRun} onChange={e => setDryRun(e.target.checked)} /> Dry run (preview)</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={force} onChange={e => setForce(e.target.checked)} /> Force overwrite (if checked, incoming JSON overwrites sheet)</label>
        <button onClick={handlePreview} className="px-4 py-2 bg-blue-600 text-white rounded" disabled={loading}>{loading ? 'Working...' : 'Preview'}</button>
        <button onClick={handleApply} className="px-4 py-2 bg-green-600 text-white rounded" disabled={loading}>Apply (not dry run)</button>
      </div>
      {error && <div className="text-red-600 mb-3">{error}</div>}
      {report && (
        <div className="bg-white border rounded p-3">
          <h3 className="font-semibold">Import Report</h3>
          <pre className="text-xs overflow-auto max-h-64">{JSON.stringify(report, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
