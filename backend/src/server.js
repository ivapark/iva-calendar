import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import requireAuth from '../middleware/auth.js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const AI_SYSTEM_PROMPT = `You are a warm but practical reflection and goal-planning assistant inside a personal calendar and journal app. Help the user reflect on journal thoughts, notice patterns, clarify goals, and turn vague feelings into concrete next steps. Do not diagnose mental health conditions. Do not pretend to be a therapist. Ask thoughtful questions when useful. Keep responses concise and friendly — 2–4 sentences unless the user asks for more. You have access to the user's journal entries, goals, and mindsets as context. Reference them naturally when relevant, but never dump raw data back verbatim.`;

function buildContextSummary({ currentDate, journals = {}, goals = {}, mindsets = {} }) {
  const lines = [];
  if (currentDate) lines.push(`Today: ${currentDate}`);

  const recentJournals = Object.entries(journals)
    .filter(([, v]) => v?.trim())
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 5);
  if (recentJournals.length > 0) {
    lines.push('\nRecent journal entries:');
    for (const [key, value] of recentJournals) {
      const preview = value.trim().slice(0, 200);
      lines.push(`  [${key}]: ${preview}${value.trim().length > 200 ? '...' : ''}`);
    }
  }

  const relevantGoals = Object.entries(goals).filter(([, v]) => v?.trim()).slice(0, 4);
  for (const [key, value] of relevantGoals) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        const items = parsed.filter((g) => g.text).map((g) => `${g.done ? '✓' : '○'} ${g.text}`);
        if (items.length > 0) {
          lines.push(`\nGoals (${key}):`);
          items.forEach((item) => lines.push(`  ${item}`));
        }
      }
    } catch {
      lines.push(`\nGoal (${key}): ${value.trim().slice(0, 100)}`);
    }
  }

  const recentMindsets = Object.entries(mindsets).filter(([, v]) => v?.trim()).slice(0, 3);
  if (recentMindsets.length > 0) {
    lines.push('\nMindsets/intentions:');
    for (const [key, value] of recentMindsets) {
      lines.push(`  ${key}: "${value.trim()}"`);
    }
  }

  return lines.join('\n') || 'No context available yet.';
}

const app = express();
const PORT = process.env.PORT || 4000;
const allowedOrigins = [
  'http://localhost:5173',
  'https://iva-calendar-frontend.vercel.app',
];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const allowedEntryTypes = new Set(['journals', 'goals', 'mindsets']);

function dbErr(error) {
  throw new Error(error?.message || 'Database error');
}

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.get('/api/state', requireAuth, async (req, res, next) => {
  try {
    const uid = req.user.id;

    const [evRes, toRes, enRes] = await Promise.all([
      supabaseAdmin.from('events').select('id, title, date, start, end, note, color').eq('user_id', uid).order('date').order('start'),
      supabaseAdmin.from('todos').select('id, date, text, done').eq('user_id', uid).order('created_at'),
      supabaseAdmin.from('text_entries').select('type, entry_key, value').eq('user_id', uid),
    ]);

    if (evRes.error) dbErr(evRes.error);
    if (toRes.error) dbErr(toRes.error);
    if (enRes.error) dbErr(enRes.error);

    const state = {
      events: evRes.data || [],
      todos: (toRes.data || []).map((t) => ({ ...t, done: Boolean(t.done) })),
      journals: {},
      goals: {},
      mindsets: {},
    };
    for (const entry of enRes.data || []) {
      state[entry.type][entry.entry_key] = entry.value;
    }

    res.json(state);
  } catch (err) {
    next(err);
  }
});

app.post('/api/events', requireAuth, async (req, res, next) => {
  try {
    const uid = req.user.id;
    const { title, date, start = '', end = '', note = '', color = '' } = req.body;
    if (!title?.trim() || !date) return res.status(400).json({ error: 'Event title and date are required.' });

    const event = { id: makeId(), user_id: uid, title: title.trim(), date, start, end, note, color };
    const { data, error } = await supabaseAdmin.from('events').insert(event).select('id, title, date, start, end, note, color').single();
    if (error) dbErr(error);

    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

app.put('/api/events/:id', requireAuth, async (req, res, next) => {
  try {
    const uid = req.user.id;
    const { title, date, start = '', end = '', note = '', color = '' } = req.body;
    if (!title?.trim() || !date) return res.status(400).json({ error: 'Event title and date are required.' });

    const { data, error } = await supabaseAdmin
      .from('events')
      .update({ title: title.trim(), date, start, end, note, color, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('user_id', uid)
      .select('id, title, date, start, end, note, color')
      .single();

    if (error || !data) return res.status(404).json({ error: 'Event not found.' });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

app.delete('/api/events/:id', requireAuth, async (req, res, next) => {
  try {
    const { error, count } = await supabaseAdmin
      .from('events')
      .delete({ count: 'exact' })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) dbErr(error);
    if (count === 0) return res.status(404).json({ error: 'Event not found.' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

app.post('/api/todos', requireAuth, async (req, res, next) => {
  try {
    const uid = req.user.id;
    const { date, text } = req.body;
    if (!date || !text?.trim()) return res.status(400).json({ error: 'Todo date and text are required.' });

    const todo = { id: makeId(), user_id: uid, date, text: text.trim(), done: false };
    const { data, error } = await supabaseAdmin.from('todos').insert(todo).select('id, date, text, done').single();
    if (error) dbErr(error);

    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

app.patch('/api/todos/:id', requireAuth, async (req, res, next) => {
  try {
    const uid = req.user.id;
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from('todos')
      .select('id, date, text, done')
      .eq('id', req.params.id)
      .eq('user_id', uid)
      .single();

    if (fetchErr || !existing) return res.status(404).json({ error: 'Todo not found.' });

    const done = typeof req.body.done === 'boolean' ? req.body.done : Boolean(existing.done);
    const text = typeof req.body.text === 'string' && req.body.text.trim() ? req.body.text.trim() : existing.text;

    const { data, error } = await supabaseAdmin
      .from('todos')
      .update({ text, done, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('user_id', uid)
      .select('id, date, text, done')
      .single();

    if (error) dbErr(error);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

app.delete('/api/todos/:id', requireAuth, async (req, res, next) => {
  try {
    const { error, count } = await supabaseAdmin
      .from('todos')
      .delete({ count: 'exact' })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) dbErr(error);
    if (count === 0) return res.status(404).json({ error: 'Todo not found.' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

app.put('/api/entries/:type/:key', requireAuth, async (req, res, next) => {
  try {
    const uid = req.user.id;
    const { type, key } = req.params;
    if (!allowedEntryTypes.has(type)) return res.status(400).json({ error: 'Invalid entry type.' });

    const value = req.body.value ?? '';
    const { error } = await supabaseAdmin
      .from('text_entries')
      .upsert(
        { user_id: uid, type, entry_key: key, value, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,type,entry_key' }
      );

    if (error) dbErr(error);
    res.json({ type, key, value });
  } catch (err) {
    next(err);
  }
});

app.post('/api/ai/chat', requireAuth, async (req, res, next) => {
  try {
    const { message, history = [], context = {} } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'Message is required.' });
    if (!anthropic) return res.status(503).json({ error: 'AI service is not configured. Add ANTHROPIC_API_KEY to .env.' });

    const contextSummary = buildContextSummary(context);
    const claudeMessages = [
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: `${message.trim()}\n\n---\nMy calendar context:\n${contextSummary}` },
    ];

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: AI_SYSTEM_PROMPT,
      messages: claudeMessages,
    });

    res.json({ reply: response.content[0]?.text ?? "I had trouble thinking of a response. Try again?" });
  } catch (err) {
    next(err);
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Server error.' });
});

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
