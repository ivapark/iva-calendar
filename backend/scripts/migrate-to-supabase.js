// Run once to copy existing SQLite data into Supabase Postgres.
// Usage: node scripts/migrate-to-supabase.js <your-supabase-user-id>
//
// Find your user ID in the Supabase dashboard:
// Authentication → Users → copy the UUID next to your email

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const USER_ID = process.argv[2];
if (!USER_ID) {
  console.error('Usage: node scripts/migrate-to-supabase.js <your-supabase-user-id>');
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const dbFile = process.env.DATABASE_FILE || path.join(path.dirname(fileURLToPath(import.meta.url)), '../calendar.db');
const db = new sqlite3.Database(dbFile);

function allRows(sql) {
  return new Promise((resolve, reject) =>
    db.all(sql, [], (err, rows) => (err ? reject(err) : resolve(rows)))
  );
}

async function migrate() {
  console.log(`Migrating SQLite data to Supabase for user: ${USER_ID}\n`);

  // Events
  const events = await allRows('SELECT * FROM events');
  if (events.length) {
    const rows = events.map(({ id, title, date, start, end, note, color, created_at, updated_at }) => ({
      id, user_id: USER_ID, title, date,
      start: start || '', end: end || '', note: note || '', color: color || '',
      created_at, updated_at,
    }));
    const { error } = await supabase.from('events').upsert(rows, { onConflict: 'id' });
    if (error) console.error('  Events error:', error.message);
    else console.log(`  ✓ Migrated ${events.length} events`);
  } else {
    console.log('  No events to migrate');
  }

  // Todos
  const todos = await allRows('SELECT * FROM todos');
  if (todos.length) {
    const rows = todos.map(({ id, date, text, done, created_at, updated_at }) => ({
      id, user_id: USER_ID, date, text, done: Boolean(done), created_at, updated_at,
    }));
    const { error } = await supabase.from('todos').upsert(rows, { onConflict: 'id' });
    if (error) console.error('  Todos error:', error.message);
    else console.log(`  ✓ Migrated ${todos.length} todos`);
  } else {
    console.log('  No todos to migrate');
  }

  // Text entries (journals, goals, mindsets)
  const entries = await allRows('SELECT * FROM text_entries');
  if (entries.length) {
    const rows = entries.map(({ type, entry_key, value, updated_at }) => ({
      user_id: USER_ID, type, entry_key, value: value || '', updated_at,
    }));
    const { error } = await supabase.from('text_entries').upsert(rows, { onConflict: 'user_id,type,entry_key' });
    if (error) console.error('  Text entries error:', error.message);
    else console.log(`  ✓ Migrated ${entries.length} journal/goal/mindset entries`);
  } else {
    console.log('  No journal/goal entries to migrate');
  }

  db.close();
  console.log('\nMigration complete.');
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  db.close();
  process.exit(1);
});
