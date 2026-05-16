import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import { initDb, all, get, run } from './db.js';
import eventsRouter from '../routes/events.js';

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

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());
app.use('/events', eventsRouter);

const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const allowedEntryTypes = new Set(['journals', 'goals', 'mindsets']);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/state', async (_req, res, next) => {
  try {
    const events = await all('SELECT id, title, date, start, end, note, color FROM events ORDER BY date, start');
    const todos = await all('SELECT id, date, text, done FROM todos ORDER BY created_at');
    const entries = await all('SELECT type, entry_key, value FROM text_entries');

    const state = {
      events,
      todos: todos.map((todo) => ({ ...todo, done: Boolean(todo.done) })),
      journals: {},
      goals: {},
      mindsets: {}
    };

    for (const entry of entries) {
      state[entry.type][entry.entry_key] = entry.value;
    }

    res.json(state);
  } catch (err) {
    next(err);
  }
});

app.post('/api/events', async (req, res, next) => {
  try {
    const { title, date, start = '', end = '', note = '', color = '' } = req.body;
    if (!title?.trim() || !date) {
      return res.status(400).json({ error: 'Event title and date are required.' });
    }

    const event = { id: makeId(), title: title.trim(), date, start, end, note, color };
    await run(
      'INSERT INTO events (id, title, date, start, end, note, color) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [event.id, event.title, event.date, event.start, event.end, event.note, event.color]
    );
    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
});

app.put('/api/events/:id', async (req, res, next) => {
  try {
    const { title, date, start = '', end = '', note = '', color = '' } = req.body;
    if (!title?.trim() || !date) {
      return res.status(400).json({ error: 'Event title and date are required.' });
    }

    const result = await run(
      `UPDATE events
       SET title = ?, date = ?, start = ?, end = ?, note = ?, color = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [title.trim(), date, start, end, note, color, req.params.id]
    );

    if (!result.changes) return res.status(404).json({ error: 'Event not found.' });
    res.json({ id: req.params.id, title: title.trim(), date, start, end, note, color });
  } catch (err) {
    next(err);
  }
});

app.delete('/api/events/:id', async (req, res, next) => {
  try {
    const result = await run('DELETE FROM events WHERE id = ?', [req.params.id]);
    if (!result.changes) return res.status(404).json({ error: 'Event not found.' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

app.post('/api/todos', async (req, res, next) => {
  try {
    const { date, text } = req.body;
    if (!date || !text?.trim()) {
      return res.status(400).json({ error: 'Todo date and text are required.' });
    }

    const todo = { id: makeId(), date, text: text.trim(), done: false };
    await run('INSERT INTO todos (id, date, text, done) VALUES (?, ?, ?, ?)', [todo.id, todo.date, todo.text, 0]);
    res.status(201).json(todo);
  } catch (err) {
    next(err);
  }
});

app.patch('/api/todos/:id', async (req, res, next) => {
  try {
    const existing = await get('SELECT id, date, text, done FROM todos WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Todo not found.' });

    const done = typeof req.body.done === 'boolean' ? req.body.done : Boolean(existing.done);
    const text = typeof req.body.text === 'string' && req.body.text.trim() ? req.body.text.trim() : existing.text;
    await run('UPDATE todos SET text = ?, done = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [text, done ? 1 : 0, req.params.id]);
    res.json({ ...existing, text, done });
  } catch (err) {
    next(err);
  }
});

app.delete('/api/todos/:id', async (req, res, next) => {
  try {
    const result = await run('DELETE FROM todos WHERE id = ?', [req.params.id]);
    if (!result.changes) return res.status(404).json({ error: 'Todo not found.' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

app.put('/api/entries/:type/:key', async (req, res, next) => {
  try {
    const { type, key } = req.params;
    if (!allowedEntryTypes.has(type)) {
      return res.status(400).json({ error: 'Invalid entry type.' });
    }

    const value = req.body.value ?? '';
    await run(
      `INSERT INTO text_entries (type, entry_key, value, updated_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(type, entry_key)
       DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
      [type, key, value]
    );
    res.json({ type, key, value });
  } catch (err) {
    next(err);
  }
});

app.post('/api/ai/chat', async (req, res, next) => {
    try {
    const { message, history = [], context = {} } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    if (!anthropic) {
      return res.status(503).json({ error: 'AI service is not configured. Add ANTHROPIC_API_KEY to .env.' });
    }

    const contextSummary = buildContextSummary(context);

    const claudeMessages = [
      ...history.map((m) => ({ role: m.role, content: m.content })),
      {
        role: 'user',
        content: `${message.trim()}\n\n---\nMy calendar context:\n${contextSummary}`,
      },
    ];

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: AI_SYSTEM_PROMPT,
      messages: claudeMessages,
    });

    const reply = response.content[0]?.text ?? "I had trouble thinking of a response. Try again?";
    res.json({ reply });
  } catch (err) {
    next(err);
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error.' });
});

await initDb();
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
