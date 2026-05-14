import React, { useRef, useState } from 'react';
import {
  DAYS,
  MONTHS,
  dateKey,
  weekStart,
  getClickedTime,
  addMinutesToTime,
} from '../utils.js';
import './WeekView.css';

const PIXELS_PER_HOUR = 42;
const HOURS = Array.from({ length: 24 }, (_, h) => h);
const DAY_LABEL_HEIGHT = 27;

function TimeLabel({ hour }) {
  const label =
    hour === 0
      ? '12 AM'
      : hour < 12
        ? `${hour} AM`
        : hour === 12
          ? '12 PM'
          : `${hour - 12} PM`;

  return (
    <div
      className="week-time-label"
      style={{ top: `${hour * PIXELS_PER_HOUR}px` }}
    >
      {label}
    </div>
  );
}



function WeekTodoList({
  todos,
  date,
  addTodo,
  updateTodo,
  toggleTodo,
  deleteTodo,
}) {
  const [text, setText] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const skipBlurSaveRef = useRef(false);

  async function submit() {
    if (!text.trim() || !addTodo) return;

    await addTodo(date, text.trim());
    setText('');
  }

  function startEdit(todo) {
    setEditingId(todo.id);
    setEditingText(todo.text);
    skipBlurSaveRef.current = false;
  }

  async function saveEdit(todo) {
    const nextText = editingText.trim();

    if (!nextText) {
      setEditingId(null);
      setEditingText('');
      return;
    }

    if (nextText !== todo.text && updateTodo) {
      await updateTodo(todo, nextText);
    }

    setEditingId(null);
    setEditingText('');
  }

  function cancelEdit() {
    skipBlurSaveRef.current = true;
    setEditingId(null);
    setEditingText('');
  }

  return (
    <div className="week-todo-list">
      {todos.map((todo) => (
        <div key={todo.id} className="week-todo-item">
          <button
            className={`week-todo-check ${todo.done ? 'is-done' : ''}`}
            onClick={() => toggleTodo && toggleTodo(todo)}
            aria-label="Toggle todo"
          >
            {todo.done ? '✓' : ''}
          </button>

          {editingId === todo.id ? (
            <input
              className="week-todo-edit-input"
              value={editingText}
              autoFocus
              onChange={(event) => setEditingText(event.target.value)}
              onBlur={() => {
                if (skipBlurSaveRef.current) {
                  skipBlurSaveRef.current = false;
                  return;
                }

                saveEdit(todo);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  skipBlurSaveRef.current = true;
                  saveEdit(todo);
                }

                if (event.key === 'Escape') {
                  event.preventDefault();
                  cancelEdit();
                }
              }}
            />
          ) : (
            <button
              className={`week-todo-text ${todo.done ? 'is-done' : ''}`}
              onClick={() => startEdit(todo)}
              title="Click to edit"
            >
              {todo.text}
            </button>
          )}

          <button
            className="week-todo-delete"
            onClick={() => deleteTodo && deleteTodo(todo.id)}
            aria-label="Delete todo"
            title="Delete"
          >
            ×
          </button>
        </div>
      ))}

      <div className="week-todo-add">
        <span className="week-todo-add-plus">+</span>

        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') submit();
          }}
          placeholder="Add todo..."
        />
      </div>
    </div>
  );
}

export default function WeekView({
  currentDate,
  eventsForDay,
  todosForDay,
  isToday,
  openDay,
  openEditEvent,
  openAddEvent,
  navigate,
  goToday,
  goals,
  mindsets,
  saveEntry,
  addTodo,
  updateTodo,
  toggleTodo,
  deleteTodo,
}) {
  const [todoHeight, setTodoHeight] = useState(62);
  const resizeStartRef = useRef(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const start = weekStart(currentDate);
  const weekKey = dateKey(
    start.getFullYear(),
    start.getMonth(),
    start.getDate()
  );

  const weekGoalKey = `week-${weekKey}-goal-list`;
  const weekMindsetKey = `week-${weekKey}-mindset`;

  const weekGoals = parseGoalList(goals?.[weekGoalKey]);

  function updateWeekGoal(index, field, value) {
    const nextGoals = [...weekGoals];

    nextGoals[index] = {
      ...nextGoals[index],
      [field]: value,
    };

    saveEntry('goals', weekGoalKey, JSON.stringify(nextGoals));
  }

  function startTodoResize(event) {
    event.preventDefault();

    resizeStartRef.current = {
      startY: event.clientY,
      startHeight: todoHeight,
    };

    window.addEventListener('mousemove', resizeTodoBox);
    window.addEventListener('mouseup', stopTodoResize);
  }

  function resizeTodoBox(event) {
    if (!resizeStartRef.current) return;

    const deltaY = event.clientY - resizeStartRef.current.startY;
    const nextHeight = resizeStartRef.current.startHeight + deltaY;

    setTodoHeight(Math.min(Math.max(nextHeight, 56), 220));
  }

  function stopTodoResize() {
    resizeStartRef.current = null;

    window.removeEventListener('mousemove', resizeTodoBox);
    window.removeEventListener('mouseup', stopTodoResize);
  }

  return (
    <div className="week-page">
      <section className="week-header">
        <div className="week-left">
          <div className="week-year">{year}</div>
          <div className="week-title">{MONTHS[month]} Goals</div>
        </div>

        <div className="week-goals-area">
          <div className="week-goals-prompt">
            What do you want to achieve this week?
          </div>

          <div className="week-goal-check-grid">
            {weekGoals.map((goal, index) => (
              <label key={index} className="week-goal-check">
                <input
                  type="checkbox"
                  checked={goal.done}
                  onChange={(event) =>
                    updateWeekGoal(index, 'done', event.target.checked)
                  }
                />

                <span className="week-fake-checkbox" />

                <textarea
                  className="week-goal-text-input"
                  value={goal.text}
                  placeholder="Goal"
                  rows={1}
                  onChange={(event) =>
                    updateWeekGoal(index, 'text', event.target.value)
                  }
                />
              </label>
            ))}
          </div>
        </div>

        <div className="week-mindset-title">This Week’s Mindset</div>

        <textarea
          className="week-mindset-input"
          value={mindsets?.[weekMindsetKey] || ''}
          placeholder="One word or phrase..."
          rows={1}
          onChange={(event) =>
            saveEntry('mindsets', weekMindsetKey, event.target.value)
          }
        />
      </section>

      <section
        className="week-calendar-section"
        style={{
          gridTemplateRows: `${DAY_LABEL_HEIGHT + todoHeight}px minmax(0, 1fr)`,
        }}
      >
        <div className="week-nav">
          <button
            className="week-arrow week-arrow-left"
            onClick={() => navigate(-1)}
            aria-label="Previous week"
          >
            ◀
          </button>

          <span className="week-month-name">
            {MONTHS[month]} {year}
          </span>

          <button
            className="week-arrow week-arrow-right"
            onClick={() => navigate(1)}
            aria-label="Next week"
          >
            ▶
          </button>

          <button className="week-today-btn" onClick={goToday}>
            Today
          </button>
        </div>

        <div
          className="week-fixed-header"
          style={{
            gridTemplateRows: `${DAY_LABEL_HEIGHT}px ${todoHeight}px`,
          }}
        >
          <div className="week-time-spacer" />

          {Array.from({ length: 7 }, (_, index) => {
            const day = new Date(start);
            day.setDate(start.getDate() + index);

            const today = isToday(
              day.getFullYear(),
              day.getMonth(),
              day.getDate()
            );

            const dayKey = dateKey(
              day.getFullYear(),
              day.getMonth(),
              day.getDate()
            );

            const dayTodos = todosForDay
              ? todosForDay(day.getFullYear(), day.getMonth(), day.getDate())
              : [];

            return (
              <div
                key={index}
                className="week-fixed-day"
                style={{
                  gridTemplateRows: `${DAY_LABEL_HEIGHT}px ${todoHeight}px`,
                }}
              >
                <button
                  className={`week-day-heading ${today ? 'is-today' : ''}`}
                  onClick={() =>
                    openDay(day.getFullYear(), day.getMonth(), day.getDate())
                  }
                >
                  {DAYS[day.getDay()]} {day.getDate()}
                </button>

                <div className="week-todo-box">
                  <div className="week-todo-title">ToDos</div>

                  <WeekTodoList
                    todos={dayTodos}
                    date={dayKey}
                    addTodo={addTodo}
                    updateTodo={updateTodo}
                    toggleTodo={toggleTodo}
                    deleteTodo={deleteTodo}
                  />
                </div>
              </div>
            );
          })}

          <div
            className="week-todo-resize-handle"
            onMouseDown={startTodoResize}
            role="separator"
            aria-orientation="horizontal"
            aria-label="Resize weekly todo section"
          />
        </div>

        <div className="week-scroll">
          <div className="week-grid">
            <div className="week-time-column">
              {HOURS.map((hour) => (
                <TimeLabel key={hour} hour={hour} />
              ))}
            </div>

            {Array.from({ length: 7 }, (_, index) => {
              const day = new Date(start);
              day.setDate(start.getDate() + index);

              const key = dateKey(
                day.getFullYear(),
                day.getMonth(),
                day.getDate()
              );

              const dayEvents = eventsForDay(
                day.getFullYear(),
                day.getMonth(),
                day.getDate()
              );

              return (
                <div
                  key={index}
                  className={`week-day-column ${index === 0 ? 'first' : ''} ${
                    index === 6 ? 'last' : ''
                  }`}
                  onClick={(event) => {
                    const startTime = getClickedTime(event, PIXELS_PER_HOUR);
                    openAddEvent({
                      date: key,
                      start: startTime,
                      end: addMinutesToTime(startTime, 60),
                    });
                  }}
                >
                  <div className="week-hour-area">
                    {HOURS.map((hour) => (
                      <div
                        key={hour}
                        className="week-hour-line"
                        style={{ top: `${hour * PIXELS_PER_HOUR}px` }}
                      />
                    ))}

                    {dayEvents.map((event) => {
                      const [startHour, startMinute] = (event.start || '08:00')
                        .split(':')
                        .map(Number);

                      const [endHour, endMinute] = (event.end || '09:00')
                        .split(':')
                        .map(Number);

                      const top =
                        ((startHour * 60 + startMinute) / 60) *
                        PIXELS_PER_HOUR;

                      const height = Math.max(
                        ((endHour * 60 +
                          endMinute -
                          startHour * 60 -
                          startMinute) /
                          60) *
                          PIXELS_PER_HOUR,
                        36
                      );

                      return (
                        <div
                          key={event.id}
                          className="week-event"
                          style={{
                            top: `${top}px`,
                            height: `${height}px`,
                          }}
                          onClick={(clickEvent) => {
                            clickEvent.stopPropagation();
                            openEditEvent(event);
                          }}
                        >
                          <div className="week-event-time">
                            {formatTime(event.start)}
                          </div>
                          <div className="week-event-title">{event.title}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

function parseGoalList(rawValue) {
  const emptyGoals = Array.from({ length: 8 }, () => ({
    done: false,
    text: '',
  }));

  if (!rawValue) return emptyGoals;

  try {
    const parsed = JSON.parse(rawValue);

    if (!Array.isArray(parsed)) return emptyGoals;

    return emptyGoals.map((fallbackGoal, index) => ({
      ...fallbackGoal,
      ...parsed[index],
    }));
  } catch {
    return emptyGoals;
  }
}

function formatTime(time) {
  if (!time) return '';

  const [hourString, minuteString] = time.split(':');
  const hour = Number(hourString);
  const minute = Number(minuteString || 0);

  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${String(minute).padStart(2, '0')} ${suffix}`;
}