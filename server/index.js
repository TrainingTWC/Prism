const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true, useDefaults: true });

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '1mb' }));

const PORT = process.env.PORT || 4001;

// Load schema
const schemaPath = path.join(__dirname, 'schema', 'interpret-response.schema.json');
let interpretSchema = null;
try {
  interpretSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  ajv.addSchema(interpretSchema, 'interpretResponse');
} catch (e) {
  console.warn('Could not load interpret-response schema:', e.message || e);
}

// Load import-metrics schema
const importSchemaPath = path.join(__dirname, 'schema', 'import-metrics.schema.json');
let importSchema = null;
try {
  importSchema = JSON.parse(fs.readFileSync(importSchemaPath, 'utf8'));
  ajv.addSchema(importSchema, 'importMetrics');
} catch (e) {
  console.warn('Could not load import-metrics schema:', e.message || e);
}

// helper to read sheet snapshot (local file) — this is a lightweight stand-in for Google Sheets
const SHEET_SNAPSHOT_PATH = path.join(__dirname, 'data', 'sheet_snapshot.json');
function readSheetSnapshot() {
  try {
    const raw = fs.readFileSync(SHEET_SNAPSHOT_PATH, 'utf8');
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function writeSheetSnapshot(rows) {
  try {
    fs.writeFileSync(SHEET_SNAPSHOT_PATH, JSON.stringify(rows, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Failed to write sheet snapshot', e.message || e);
    return false;
  }
}

// Local rule-based parser for Training Materials (fallback)
const TM_KEYWORDS = [
  { id: 'TM_1', keywords: ['frm', 'f r m'] },
  { id: 'TM_2', keywords: ['brm', 'b r m'] },
  { id: 'TM_3', keywords: ['one-pager hot', 'hot cue', 'hot cue cards', 'one pager hot', 'one pager for hot'] },
  { id: 'TM_4', keywords: ['one-pager cold', 'cold cue', 'cold cue cards', 'one pager cold', 'one pager for cold'] },
  { id: 'TM_5', keywords: ['dial-in', 'dial in', 'dialin', 'dial in one-pager'] },
  { id: 'TM_6', keywords: ['new-launch', 'new launch', 'new-launch learning', 'new launch learning'] },
  { id: 'TM_7', keywords: ['coffee & hd', 'coffee and hd', 'playbook', 'hd playbook'] },
  { id: 'TM_8', keywords: ['msds', 'chemical chart', 'shelf life chart'] },
  { id: 'TM_9', keywords: ['career progression', 'reward poster', 'career progression chart'] }
];

function simpleLocalInterpret(transcript) {
  const cmd = (transcript || '').toLowerCase();
  const mentions = [];
  TM_KEYWORDS.forEach(entry => {
    for (const k of entry.keywords) {
      if (cmd.includes(k)) { mentions.push(entry.id); break; }
    }
  });

  const updates = {};
  if (/none of the other|no other|none of the other training|none of the other training materials/.test(cmd) && mentions.length>0) {
    const mentionSet = new Set(mentions);
    TM_KEYWORDS.forEach(entry => {
      updates[`TrainingMaterials_${entry.id}`] = mentionSet.has(entry.id) ? 'yes' : 'no';
    });
  } else if (/all .*available|all available|everything is available|all the training materials are available/.test(cmd)) {
    TM_KEYWORDS.forEach(entry => updates[`TrainingMaterials_${entry.id}`] = 'yes');
  } else if (/none of the training materials|all .*not available|all unavailable|nothing available/.test(cmd)) {
    TM_KEYWORDS.forEach(entry => updates[`TrainingMaterials_${entry.id}`] = 'no');
  } else {
    // default: mark mentioned as yes
    if (mentions.length>0) {
      TM_KEYWORDS.forEach(entry => {
        updates[`TrainingMaterials_${entry.id}`] = mentions.includes(entry.id) ? 'yes' : undefined;
      });
    }
  }

  // Convert to response schema
  const resp = {
    version: '1.0',
    wakeWordDetected: /hey prism/.test(cmd),
    rawTranscript: transcript,
    intent: 'training_materials_update',
    updates: Object.keys(updates).map(k => ({ questionId: k, value: updates[k] }))
  };
  return resp;
}

app.post('/api/interpret', async (req, res) => {
  const { transcript } = req.body || {};
  if (!transcript) return res.status(400).json({ error: 'missing transcript' });

  // If OPENAI_API_KEY present, try to call the LLM
  if (process.env.OPENAI_API_KEY) {
    try {
      // Helper: call LLM with given messages
      const callLLM = async (messages) => {
        const body = { model: 'gpt-4o-mini', messages, temperature: 0 };
        const r = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });
        const data = await r.json();
        return data?.choices?.[0]?.message?.content;
      };

      // Primary prompt (relaxed)
      const systemPrompt = `You are an assistant that maps auditor transcripts into checklist updates. Return JSON following the schema: version, wakeWordDetected (bool), rawTranscript, intent, updates (array of objects with questionId,value,confidence,reason,suggestedBy). Allowed values for updates.value: yes,no,na. ONLY return valid JSON — no explanatory text.`;
      const userPrompt = `Transcript: "${transcript.replace(/"/g,'\\"')}"\n\nChecklist items: ${TM_KEYWORDS.map(t=>t.id+':'+t.keywords[0]).join(', ')}\n\nRules: If user says 'none of the other', treat mentioned as yes and others no. If user says 'not applicable' mark na.`;

      let raw = await callLLM([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]);

      // Try parse and validate. If invalid, retry once with a very strict JSON-only prompt
      const tryParseValidate = (text) => {
        if (!text) return { parsed: null, valid: false, errors: ['empty'] };
        let parsed = null;
        try { parsed = JSON.parse(text); }
        catch (e) {
          const m = text.match(/\{[\s\S]*\}/);
          if (m) {
            try { parsed = JSON.parse(m[0]); } catch (ee) { parsed = null; }
          }
        }
        if (!parsed) return { parsed: null, valid: false, errors: ['parse_failed'] };
        if (!interpretSchema) return { parsed, valid: true, errors: [] };
        const valid = ajv.validate('interpretResponse', parsed);
        return { parsed, valid, errors: ajv.errors ? ajv.errors.map(x => x.message) : [] };
      };

      let { parsed, valid, errors } = tryParseValidate(raw);
      if (!valid) {
        // Retry with very strict instruction
        const strictSystem = `You are an assistant that MUST return only JSON that exactly matches the schema: version (string), wakeWordDetected (boolean), rawTranscript (string), intent (string), updates (array of {questionId:string,value:string,confidence:number,reason:string,suggestedBy:string}). Allowed values for value: yes,no,na. DO NOT RETURN ANY TEXT OTHER THAN JSON.`;
        const strictUser = `Transcript: "${transcript.replace(/"/g,'\\"')}"\nChecklist items: ${TM_KEYWORDS.map(t=>t.id+':'+t.keywords[0]).join(', ')}`;
        raw = await callLLM([
          { role: 'system', content: strictSystem },
          { role: 'user', content: strictUser }
        ]);
        const r2 = tryParseValidate(raw);
        parsed = r2.parsed; valid = r2.valid; errors = r2.errors;
      }

      if (valid && parsed) return res.json(parsed);
      // else fall through to local parser
    } catch (err) {
      console.error('LLM call failed', err.message || err);
      // fall through to local parse
    }
  }

  // fallback local parser
  const out = simpleLocalInterpret(transcript);
  return res.json(out);
});

// POST /api/import-metrics
app.post('/api/import-metrics', async (req, res) => {
  const body = req.body || {};
  // Validate request body against schema if available
  if (importSchema) {
    const valid = ajv.validate('importMetrics', body);
    if (!valid) {
      return res.status(400).json({ ok: false, error: 'validation_failed', details: ajv.errors });
    }
  }

  const rows = body.rows || [];
  const options = body.options || {};
  const dryRun = !!options.dryRun;
  const force = !!options.force;

  // Read current sheet snapshot
  const sheet = readSheetSnapshot();

  // Build an index of sheet rows by key (store_id|metric_name|observed_period)
  const keyOf = (r) => `${r.store_id}|||${r.metric_name}|||${r.observed_period}`;
  const sheetIndex = new Map();
  sheet.forEach(r => sheetIndex.set(keyOf(r), r));

  const report = { total_received: rows.length, accepted: [], conflicts: [], errors: [] };

  // Validate and merge
  rows.forEach((incoming, idx) => {
    // Basic per-row validation (extra safety)
    if (!incoming || !incoming.store_id || !incoming.metric_name || incoming.metric_value == null || !incoming.observed_period) {
      report.errors.push({ idx, reason: 'missing_required_fields', row: incoming });
      return;
    }
    const key = keyOf(incoming);
    const existing = sheetIndex.get(key);
    if (existing) {
      // Conflict: sheet wins by default
      if (force) {
        // overwrite
        report.conflicts.push({ key, action: 'overwritten', sheet_row: existing, incoming_row: incoming });
        if (!dryRun) {
          // replace in sheet array and index
          const pos = sheet.findIndex(r => keyOf(r) === key);
          if (pos >= 0) sheet[pos] = incoming;
          sheetIndex.set(key, incoming);
          report.accepted.push({ key, row: incoming });
        }
      } else {
        report.conflicts.push({ key, action: 'sheet_wins', sheet_row: existing, incoming_row: incoming });
      }
    } else {
      // No existing row — accept
      report.accepted.push({ key, row: incoming });
      if (!dryRun) {
        sheet.push(incoming);
        sheetIndex.set(key, incoming);
      }
    }
  });

  // Persist snapshot if not dryRun
  if (!dryRun) {
    const ok = writeSheetSnapshot(sheet);
    if (!ok) {
      return res.status(500).json({ ok: false, error: 'persist_failed' });
    }
  }

  const summary = {
    total_received: report.total_received,
    accepted_count: report.accepted.length,
    conflicts_count: report.conflicts.length,
    errors_count: report.errors.length
  };

  return res.json({ ok: true, summary, report, dryRun });
});

// Expose the current sheet snapshot for clients to fetch
app.get('/api/sheet-snapshot', (req, res) => {
  try {
    const sheet = readSheetSnapshot();
    return res.json({ ok: true, rows: sheet });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'read_failed' });
  }
});

app.listen(PORT, () => console.log(`Interpret API listening on http://localhost:${PORT}`));
