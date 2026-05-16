import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { api } from './api.js';
import { dateKey } from './utils.js';


import { supabase } from './supabaseClient.js';
import Home from './components/Home.jsx';


import YearView from './components/YearView.jsx';
import MonthView from './components/MonthView.jsx';
import WeekView from './components/WeekView.jsx';
import DayView from './components/DayView.jsx';
import JournalView from './components/JournalView.jsx';
import AIPet from './components/AIPet.jsx';


import chatIcon from './assets/FigPet.svg';
import journalIcon from './assets/JournalIcon.svg';
import searchIcon from './assets/SearchIcon.svg';
import settingIcon from './assets/SettingIcon.svg';

import { Chrome } from '@uiw/react-color';
import './styles.css';

function App() {
  const [view, setView] = useState('year');
  const [today] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [session, setSession] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef(null);

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

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  function goToday() {
    setCurrentDate(new Date(today));
    setView('month');
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

  async function updateTodo(todo, nextText) {
    const updated = await api.updateTodo(todo.id, {
      text: nextText,
    });

    setTodos((prev) =>
      prev.map((item) =>
        item.id === todo.id ? { ...item, text: updated.text } : item
      )
    );
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

  const saveTimersRef = useRef({});

  function saveEntry(type, key, value) {
    if (type === 'journals') {
      setJournals((prev) => ({ ...prev, [key]: value }));
    }

    if (type === 'goals') {
      setGoals((prev) => ({ ...prev, [key]: value }));
    }

    if (type === 'mindsets') {
      setMindsets((prev) => ({ ...prev, [key]: value }));
    }

    const timerKey = `${type}:${key}`;
    clearTimeout(saveTimersRef.current[timerKey]);
    saveTimersRef.current[timerKey] = setTimeout(() => {
      api.saveEntry(type, key, value).catch((err) => setError(err.message));
    }, 600);
  }


  const recentColors = useMemo(() => {
    const seen = new Set();
    const colors = [];
    for (const ev of [...events].reverse()) {
      const c = ev.color?.trim();
      if (c && !seen.has(c)) {
        seen.add(c);
        colors.push(c);
        if (colors.length >= 9) break;
      }
    }
    return colors;
  }, [events]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setSearchOpen] = useState(false);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return [];

    const results = [];

    events.forEach((event) => {
      const haystack = `${event.title || ''} ${event.note || ''}`.toLowerCase();

      if (haystack.includes(query)) {
        results.push({
          id: `event-${event.id}`,
          type: 'Event',
          title: event.title || 'Untitled event',
          subtitle: event.date,
          date: event.date,
          view: 'day',
        });
      }
    });

    todos.forEach((todo) => {
      const haystack = `${todo.text || ''}`.toLowerCase();

      if (haystack.includes(query)) {
        results.push({
          id: `todo-${todo.id}`,
          type: 'Todo',
          title: todo.text || 'Untitled todo',
          subtitle: todo.date,
          date: todo.date,
          view: 'day',
        });
      }
    });

    Object.entries(journals).forEach(([key, value]) => {
      const haystack = `${value || ''}`.toLowerCase();

      if (haystack.includes(query)) {
        results.push({
          id: `journal-${key}`,
          type: 'Journal',
          title: getPreviewText(value),
          subtitle: key,
          key,
          view: guessViewFromKey(key),
        });
      }
    });

    Object.entries(goals).forEach(([key, value]) => {
      const matches = getGoalMatches(value, query);

      matches.forEach((match, index) => {
        results.push({
          id: `goal-${key}-${index}`,
          type: 'Goal',
          title: match,
          subtitle: key,
          key,
          view: guessViewFromKey(key),
        });
      });
    });

    Object.entries(mindsets).forEach(([key, value]) => {
      const haystack = `${value || ''}`.toLowerCase();

      if (haystack.includes(query)) {
        results.push({
          id: `mindset-${key}`,
          type: 'Mindset',
          title: value || 'Mindset',
          subtitle: key,
          key,
          view: guessViewFromKey(key),
        });
      }
    });

    return results.slice(0, 12);
  }, [searchQuery, events, todos, journals, goals, mindsets]);

  function openSearchResult(result) {
    if (result.date) {
      const parsedDate = parseDateString(result.date);

      if (parsedDate) {
        setCurrentDate(parsedDate);
        setView('day');
      }
    } else if (result.key) {
      const target = parseScopeKey(result.key);

      if (target) {
        setCurrentDate(target.date);
        setView(target.view);
      } else {
        setView(result.view || 'year');
      }
    }

    setSearchOpen(false);
    setSearchQuery('');
  }
  if (loading) {
    return <div className="loading">Loading calendar...</div>;
  }

  if (!session) {
    return <Home />;
  }

  return (
    <>
      <div className="topbar">
        <div />

        <div className="top-actions">
          <SearchBar
            query={searchQuery}
            setQuery={setSearchQuery}
            isOpen={isSearchOpen}
            setOpen={setSearchOpen}
            results={searchResults}
            onSelect={openSearchResult}
          />

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
              setView('journal');
            }}
            title="Journal"
          >
            <img className="top-icon" src={journalIcon} alt="" />
          </button>

          <AIPet
            chatIcon={chatIcon}
            currentDate={currentDate}
            journals={journals}
            goals={goals}
            mindsets={mindsets}
          />

          <div className="settings-wrap" ref={settingsRef}>
            <button
              className="iconbtn"
              onClick={() => setSettingsOpen((prev) => !prev)}
              title="Settings"
            >
              <img className="top-icon setting-icon" src={settingIcon} alt="" />
            </button>

            {settingsOpen && (
              <div className="settings-dropdown">
                <button
                  className="settings-signout"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    setSettingsOpen(false);
                  }}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>

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
              goals={goals}
              mindsets={mindsets}
              saveEntry={saveEntry}
            />
          )}

          {view === 'month' && (
            <MonthView
              currentDate={currentDate}
              eventsForDay={eventsForDay}
              isToday={isToday}
              openDay={openDay}
              navigate={navigate}
              goToday={goToday}
              goals={goals}
              mindsets={mindsets}
              saveEntry={saveEntry}
            />
          )}

          {view === 'week' && (
            <WeekView
              currentDate={currentDate}
              eventsForDay={eventsForDay}
              todosForDay={todosForDay}
              isToday={isToday}
              openDay={openDay}
              openEditEvent={openEditEvent}
              openAddEvent={openAddEvent}
              navigate={navigate}
              goToday={() => {
                setCurrentDate(new Date(today));
                setView('week');
              }}
              goals={goals}
              mindsets={mindsets}
              saveEntry={saveEntry}
              addTodo={addTodo}
              updateTodo={updateTodo}
              toggleTodo={toggleTodo}
              deleteTodo={deleteTodo}
            />
          )}

          {view === 'day' && (
            <DayView
              currentDate={currentDate}
              eventsForDay={eventsForDay}
              todosForDay={todosForDay}
              openEditEvent={openEditEvent}
              openAddEvent={openAddEvent}
              addTodo={addTodo}
              updateTodo={updateTodo}
              toggleTodo={toggleTodo}
              deleteTodo={deleteTodo}
              journals={journals}
              goals={goals}
              saveEntry={saveEntry}
              navigate={navigate}
              goToday={() => {
                setCurrentDate(new Date(today));
                setView('day');
              }}
            />
          )}

          {view === 'journal' && (
            <JournalView
              currentDate={currentDate}
              setCurrentDate={setCurrentDate}
              journals={journals}
              saveEntry={saveEntry}
              navigate={navigate}
              goToday={() => {
                const todayDate = new Date(today);
                setCurrentDate(todayDate);
                setView('journal');
              }}
            />
          )}
        </div>
      </div>
      
      {isModalOpen && (
        <EventModal
          event={modalEvent}
          defaults={modalDefaults}
          currentDate={currentDate}
          recentColors={recentColors}
          onClose={() => setModalOpen(false)}
          onSave={saveEvent}
          onDelete={deleteEvent}
        />
      )}
    </>
  );
}

function SearchBar({ query, setQuery, isOpen, setOpen, results, onSelect }) {
  return (
    <div className="search-wrap">
      <img className="search-icon" src={searchIcon} alt="" />

      <input
        className="search-input"
        value={query}
        placeholder="Search"
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
      />

      {isOpen && query.trim() && (
        <div className="search-popover">
          {results.length > 0 ? (
            results.map((result) => (
              <button
                key={result.id}
                className="search-result"
                onMouseDown={(event) => {
                  event.preventDefault();
                  onSelect(result);
                }}
              >
                <span className="search-result-type">{result.type}</span>
                <span className="search-result-title">{result.title}</span>
                <span className="search-result-subtitle">{result.subtitle}</span>
              </button>
            ))
          ) : (
            <div className="search-empty">No results found</div>
          )}
        </div>
      )}
    </div>
  );
}

function getPreviewText(value) {
  const text = String(value || '').trim();

  if (!text) return 'Untitled';

  return text.length > 48 ? `${text.slice(0, 48)}...` : text;
}

function getGoalMatches(value, query) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);

    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => item?.text || '')
        .filter((text) => text.toLowerCase().includes(query));
    }
  } catch {
    // If value is not JSON, search it as plain text.
  }

  const text = String(value);

  return text.toLowerCase().includes(query) ? [getPreviewText(text)] : [];
}

function parseDateString(dateString) {
  if (!dateString) return null;

  const parts = dateString.split('-').map(Number);

  if (parts.length !== 3) return null;

  const [year, month, day] = parts;

  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
}

function guessViewFromKey(key) {
  if (key.startsWith('year-')) return 'year';
  if (key.startsWith('month-')) return 'month';
  if (key.startsWith('week-')) return 'week';

  if (/^\d{4}-\d{2}-\d{2}/.test(key)) return 'day';

  return 'year';
}

function parseScopeKey(key) {
  if (key.startsWith('year-')) {
    const year = Number(key.split('-')[1]);

    if (!Number.isNaN(year)) {
      return {
        view: 'year',
        date: new Date(year, 0, 1),
      };
    }
  }

  if (key.startsWith('month-')) {
    const parts = key.split('-');
    const year = Number(parts[1]);
    const month = Number(parts[2]);

    if (!Number.isNaN(year) && !Number.isNaN(month)) {
      return {
        view: 'month',
        date: new Date(year, month, 1),
      };
    }
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(key)) {
    const date = parseDateString(key.slice(0, 10));

    if (date) {
      return {
        view: 'day',
        date,
      };
    }
  }

  return null;
}
function EventModal({ event, defaults = {}, currentDate, recentColors = [], onClose, onSave, onDelete }) {
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
  const [eventColor, setEventColor] = useState(
    event?.color || defaults.color || '#898A8D'
  );
  const [saving, setSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    if (!showPicker) return;
    function handleClick(e) {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showPicker]);

  async function submit() {
    if (!title.trim()) return;

    setSaving(true);
    await onSave({
      title,
      date,
      start,
      end,
      note,
      color: eventColor,
    });
    
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

        <div className="event-color-section" ref={pickerRef}>
          <div className="event-color-label">Event Color</div>

          <div className="event-color-picker-row">
            <div
              className="event-color-preview"
              style={{ backgroundColor: eventColor }}
            />

            <input
              className="event-color-hex-input"
              value={eventColor}
              onChange={(e) => {
                const v = e.target.value;
                if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setEventColor(v);
              }}
              placeholder="#898A8D"
            />

            <button
              className="event-color-wheel-btn"
              onClick={() => setShowPicker((v) => !v)}
              aria-label="Open color picker"
            >
              🎨
            </button>
          </div>

          {showPicker && (
            <div className="event-color-popup">
              <Chrome
                color={eventColor}
                onChange={(c) => setEventColor(c.hex)}
                style={{
                  boxShadow: 'none',
                  border: 'none',
                  borderRadius: '14px',
                  background: '#ffffff',
                  overflow: 'hidden',
                }}
              />
            </div>
          )}

          {recentColors.length > 0 && (
            <div className="recent-color-row">
              {recentColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`recent-color-dot ${eventColor === c ? 'selected' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setEventColor(c)}
                  aria-label={`Choose ${c}`}
                />
              ))}
            </div>
          )}
        </div>

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