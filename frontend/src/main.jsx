import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { api } from './api.js';
import { dateKey } from './utils.js';

import YearView from './components/YearView.jsx';
import MonthView from './components/MonthView.jsx';
import WeekView from './components/WeekView.jsx';
import DayView from './components/DayView.jsx';

import './styles.css';

function App() {
  const [view, setView] = useState('year');
  const [today] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());

  const [events, setEvents] = useState([]);
  const [todos, setTodos] = useState([]);
  const [journals, setJournals] = useState({});
  const [goals, setGoals] = useState({});
  const [mindsets, setMindsets] = useState({});

  const [color] = useState('#534AB7');
  const [panel, setPanel] = useState('todos');

  const [modalEvent, setModalEvent] = useState(null);
  const [modalDefaults, setModalDefaults] = useState({});
  const [isModalOpen, setModalOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getState()
      .then((state) => {
        setEvents(state.events || []);
        setTodos(state.todos || []);
        setJournals(state.journals || {});
        setGoals(state.goals || {});
        setMindsets(state.mindsets || {});
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--ev', color);

    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);

    document.documentElement.style.setProperty('--ev-bg', `rgba(${r},${g},${b},0.1)`);
  }, [color]);

  const isToday = (y, m, d) => {
    return (
      today.getFullYear() === y &&
      today.getMonth() === m &&
      today.getDate() === d
    );
  };

  const eventsForDay = (y, m, d) => {
    return events.filter((ev) => ev.date === dateKey(y, m, d));
  };

  const todosForDay = (y, m, d) => {
    return todos.filter((todo) => todo.date === dateKey(y, m, d));
  };

  function navigate(direction) {
    const d = new Date(currentDate);

    if (view === 'year') {
      setCurrentDate(new Date(d.getFullYear() + direction, 0, 1));
    }

    if (view === 'month') {
      setCurrentDate(new Date(d.getFullYear(), d.getMonth() + direction, 1));
    }

    if (view === 'week') {
      d.setDate(d.getDate() + direction * 7);
      setCurrentDate(d);
    }

    if (view === 'day') {
      d.setDate(d.getDate() + direction);
      setCurrentDate(d);
    }
  }

  function jumpMonth(monthIndex) {
    setCurrentDate(new Date(currentDate.getFullYear(), monthIndex, 1));
    setView('month');
  }

  function openDay(y, m, d) {
    setCurrentDate(new Date(y, m, d));
    setView('day');
  }

  function openAddEvent(defaults = {}) {
    setModalEvent(null);
    setModalDefaults(defaults);
    setModalOpen(true);
  }

  function openEditEvent(event) {
    setModalDefaults({});
    setModalEvent(event);
    setModalOpen(true);
  }

  async function saveEvent(form) {
    if (modalEvent) {
      const updated = await api.updateEvent(modalEvent.id, form);

      setEvents((prev) =>
        prev.map((event) => (event.id === updated.id ? updated : event))
      );
    } else {
      const created = await api.createEvent(form);
      setEvents((prev) => [...prev, created]);
    }

    setModalOpen(false);
  }

  async function deleteEvent(id) {
    await api.deleteEvent(id);

    setEvents((prev) => prev.filter((event) => event.id !== id));
    setModalOpen(false);
  }

  async function addTodo(date, text) {
    const created = await api.createTodo({ date, text });
    setTodos((prev) => [...prev, created]);
  }

  async function toggleTodo(todo) {
    const updated = await api.updateTodo(todo.id, { done: !todo.done });

    setTodos((prev) =>
      prev.map((item) =>
        item.id === todo.id ? { ...item, done: updated.done } : item
      )
    );
  }

  async function deleteTodo(id) {
    await api.deleteTodo(id);
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  }

  async function saveEntry(type, key, value) {
    if (type === 'journals') {
      setJournals((prev) => ({ ...prev, [key]: value }));
    }

    if (type === 'goals') {
      setGoals((prev) => ({ ...prev, [key]: value }));
    }

    if (type === 'mindsets') {
      setMindsets((prev) => ({ ...prev, [key]: value }));
    }

    await api.saveEntry(type, key, value);
  }

  if (loading) {
    return <div className="loading">Loading calendar...</div>;
  }

  return (
    <>
      <div className="topbar">
        <div />

        <div className="top-actions">
          <button
            className="todaybtn"
            onClick={() => setCurrentDate(new Date(today))}
          >
            Today
          </button>

          <button
            className="iconbtn"
            onClick={openAddEvent}
            title="Add event"
          >
            +
          </button>

          <button
            className="iconbtn"
            onClick={() => {
              setView('day');
              setPanel('journal');
            }}
            title="Journal"
          >
            📝
          </button>

          <button
            className="iconbtn"
            title="Chat"
          >
            💬
          </button>

          <button
            className="iconbtn"
            onClick={() => alert('Settings coming soon!')}
            title="Settings"
          >
            ⚙
          </button>

          <div className="view-tabs">
            {['year', 'month', 'week', 'day'].map((item) => (
              <button
                key={item}
                className={`view-tab ${view === item ? 'active' : ''}`}
                onClick={() => setView(item)}
              >
                {item[0].toUpperCase() + item.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="main">
        <div className="content">
          {view === 'year' && (
            <YearView
              currentDate={currentDate}
              eventsForDay={eventsForDay}
              isToday={isToday}
              openDay={openDay}
              jumpMonth={jumpMonth}
            />
          )}

          {view === 'month' && (
            <MonthView
              currentDate={currentDate}
              eventsForDay={eventsForDay}
              isToday={isToday}
              openDay={openDay}
              navigate={navigate}
            />
          )}

          {view === 'week' && (
            <WeekView
              currentDate={currentDate}
              eventsForDay={eventsForDay}
              isToday={isToday}
              openDay={openDay}
              openEditEvent={openEditEvent}
              openAddEvent={openAddEvent}
            />
          )}

          {view === 'day' && (
            <DayView
              currentDate={currentDate}
              eventsForDay={eventsForDay}
              todosForDay={todosForDay}
              panel={panel}
              setPanel={setPanel}
              openEditEvent={openEditEvent}
              openAddEvent={openAddEvent}
              addTodo={addTodo}
              toggleTodo={toggleTodo}
              deleteTodo={deleteTodo}
              journals={journals}
              goals={goals}
              saveEntry={saveEntry}
            />
          )}
        </div>
      </div>

      {isModalOpen && (
        <EventModal
          event={modalEvent}
          defaults={modalDefaults}
          currentDate={currentDate}
          onClose={() => setModalOpen(false)}
          onSave={saveEvent}
          onDelete={deleteEvent}
        />
      )}
    </>
  );
}

function EventModal({ event, defaults = {}, currentDate, onClose, onSave, onDelete }) {
  const defaultDate = dateKey(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate()
  );

  const [title, setTitle] = useState(event?.title || defaults.title || '');
  const [date, setDate] = useState(event?.date || defaults.date || defaultDate);
  const [start, setStart] = useState(event?.start || defaults.start || '09:00');
  const [end, setEnd] = useState(event?.end || defaults.end || '10:00');
  const [note, setNote] = useState(event?.note || defaults.note || '');
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!title.trim()) return;

    setSaving(true);
    await onSave({ title, date, start, end, note });
    setSaving(false);
  }

  return (
    <div
      className="mo"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="md">
        <h3>{event ? 'Edit Event' : 'Add Event'}</h3>

        <input
          type="text"
          value={title}
          placeholder="Title"
          onChange={(event) => setTitle(event.target.value)}
        />

        <input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />

        <div className="time-grid">
          <input
            type="time"
            value={start}
            onChange={(event) => setStart(event.target.value)}
          />

          <input
            type="time"
            value={end}
            onChange={(event) => setEnd(event.target.value)}
          />
        </div>

        <textarea
          value={note}
          placeholder="Notes optional"
          onChange={(event) => setNote(event.target.value)}
        />

        <div className="mact">
          {event && (
            <button
              className="bdl"
              onClick={() => onDelete(event.id)}
            >
              Delete
            </button>
          )}

          <button className="bcn" onClick={onClose}>
            Cancel
          </button>

          <button className="bsv" onClick={submit} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);