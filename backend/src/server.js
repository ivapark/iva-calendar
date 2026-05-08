import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDb, all, get, run } from './db.js';

const app = express();
const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const allowedEntryTypes = new Set(['journals', 'goals', 'mindsets']);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/state', async (_req, res, next) => {
  try {
    const events = await all('SELECT id, title, date, start, end, note FROM events ORDER BY date, start');
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
    const { title, date, start = '', end = '', note = '' } = req.body;
    if (!title?.trim() || !date) {
      return res.status(400).json({ error: 'Event title and date are required.' });
    }

    const event = { id: makeId(), title: title.trim(), date, start, end, note };
    await run(
      'INSERT INTO events (id, title, date, start, end, note) VALUES (?, ?, ?, ?, ?, ?)',
      [event.id, event.title, event.date, event.start, event.end, event.note]
    );
    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
});

app.put('/api/events/:id', async (req, res, next) => {
  try {
    const { title, date, start = '', end = '', note = '' } = req.body;
    if (!title?.trim() || !date) {
      return res.status(400).json({ error: 'Event title and date are required.' });
    }

    const result = await run(
      `UPDATE events
       SET title = ?, date = ?, start = ?, end = ?, note = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [title.trim(), date, start, end, note, req.params.id]
    );

    if (!result.changes) return res.status(404).json({ error: 'Event not found.' });
    res.json({ id: req.params.id, title: title.trim(), date, start, end, note });
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
    await run('UPDATE todos SET done = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [done ? 1 : 0, req.params.id]);
    res.json({ ...existing, done });
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

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error.' });
});

await initDb();
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
