import React, { useRef, useState } from 'react';
import leftArrow from '../assets/LeftArrow.svg';
import {
  MONTHS,
  dateKey,
  getScopeKey,
  getClickedTime,
  addMinutesToTime,
  hexToRgba,
} from '../utils.js';
import './DayView.css';

const PIXELS_PER_HOUR = 52;
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

function formatHour(hour) {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
}

function formatEventTime(time) {
  if (!time) return '';

  const [hourString, minuteString] = time.split(':');
  const hour = Number(hourString);
  const minute = Number(minuteString || 0);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${String(minute).padStart(2, '0')} ${suffix}`;
}

function TodosPanel({
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
    if (!text.trim()) return;

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
    <div className="day-todos-box">
      <div className="day-todos-list">
        {todos.map((todo) => (
          <div key={todo.id} className="day-todo-item">
            <button
              className={`day-todo-check ${todo.done ? 'is-done' : ''}`}
              onClick={() => toggleTodo(todo)}
              aria-label="Toggle todo"
            >
              {todo.done ? '✓' : ''}
            </button>

            {editingId === todo.id ? (
              <input
                className="day-todo-edit-input"
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
                className={`day-todo-text ${todo.done ? 'is-done' : ''}`}
                onClick={() => startEdit(todo)}
                title="Click to edit"
              >
                {todo.text}
              </button>
            )}

            <button
              className="day-todo-delete"
              onClick={() => deleteTodo(todo.id)}
              aria-label="Delete todo"
              title="Delete"
            >
              ×
            </button>
          </div>
        ))}

        <div className="day-todo-add">
          <span className="day-todo-add-plus">+</span>

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
    </div>
  );
}

export default function DayView({
  currentDate,
  eventsForDay,
  todosForDay,
  openEditEvent,
  openAddEvent,
  addTodo,
  updateTodo,
  toggleTodo,
  deleteTodo,
  journals,
  goals,
  saveEntry,
  navigate,
  goToday,
}) {
  const [todoHeight, setTodoHeight] = useState(120);
  const resizeStartRef = useRef(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const day = currentDate.getDate();

  const key = dateKey(year, month, day);
  const dayEvents = eventsForDay(year, month, day);
  const dayTodos = todosForDay(year, month, day);
  const dailyGoalTextKey = getScopeKey('day', currentDate);

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

    setTodoHeight(Math.min(Math.max(nextHeight, 72), 300));
  }

  function stopTodoResize() {
    resizeStartRef.current = null;

    window.removeEventListener('mousemove', resizeTodoBox);
    window.removeEventListener('mouseup', stopTodoResize);
  }

  return (
    <div className="day-page">
      <section className="day-header">
        <div className="day-nav">
          <button
            className="day-arrow"
            onClick={() => navigate(-1)}
            aria-label="Previous day"
          >
            <img src={leftArrow} alt="" />
          </button>

          <span className="day-date-title">
            {MONTHS[month]}, {day} {year}
          </span>

          <button
            className="day-arrow"
            onClick={() => navigate(1)}
            aria-label="Next day"
          >
            <img src={leftArrow} alt="" style={{ transform: 'scaleX(-1)' }} />
          </button>

          <button className="day-today-btn" onClick={goToday}>
            Today
          </button>
        </div>
      </section>

      <section className="day-content">
        <div className="day-left-section">
          <div className="day-left-label-row">
            <div className="day-time-gutter-spacer" />
            <div className="day-section-label">ToDos</div>
          </div>

          <div
            className="day-left-grid"
            style={{ gridTemplateRows: `${todoHeight}px minmax(0, 1fr)` }}
          >
            <div className="day-time-gutter-spacer" />

            <TodosPanel
              todos={dayTodos}
              date={key}
              addTodo={addTodo}
              updateTodo={updateTodo}
              toggleTodo={toggleTodo}
              deleteTodo={deleteTodo}
            />

            <div
              className="day-todo-resize-handle"
              onMouseDown={startTodoResize}
              role="separator"
              aria-orientation="horizontal"
              aria-label="Resize todo section"
            />

            <div className="day-scroll">
              <div className="day-timeline-grid">
                <div className="day-time-column">
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="day-time-label"
                      style={{ top: `${hour * PIXELS_PER_HOUR}px` }}
                    >
                      {formatHour(hour)}
                    </div>
                  ))}
                </div>

                <div
                  className="day-hours"
                  onClick={(event) => {
                    const startTime = getClickedTime(event, PIXELS_PER_HOUR);

                    openAddEvent({
                      date: key,
                      start: startTime,
                      end: addMinutesToTime(startTime, 60),
                    });
                  }}
                >
                  {HOURS.map((hour) => {
                    const startTime = `${String(hour).padStart(2, '0')}:00`;

                    return (
                      <button
                        key={`hover-${hour}`}
                        className="day-hour-hover-block"
                        style={{
                          top: `${hour * PIXELS_PER_HOUR}px`,
                          height: `${PIXELS_PER_HOUR}px`,
                        }}
                        onClick={(event) => {
                          event.stopPropagation();

                          openAddEvent({
                            date: key,
                            start: startTime,
                            end: addMinutesToTime(startTime, 60),
                          });
                        }}
                        aria-label={`Add event at ${formatHour(hour)}`}
                      />
                    );
                  })}

                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="day-hour-line"
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
                      ((startHour * 60 + startMinute) / 60) * PIXELS_PER_HOUR;

                    const height = Math.max(
                      ((endHour * 60 +
                        endMinute -
                        startHour * 60 -
                        startMinute) /
                        60) *
                        PIXELS_PER_HOUR,
                      48
                    );

                    const evColor = event.color || '#49b7ff';
                    return (
                      <div
                        key={event.id}
                        className="day-event"
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          borderLeftColor: evColor,
                          background: hexToRgba(evColor, 0.12),
                        }}
                        onClick={(clickEvent) => {
                          clickEvent.stopPropagation();
                          openEditEvent(event);
                        }}
                      >
                        <div className="day-event-time" style={{ color: evColor }}>
                          {formatEventTime(event.start)}
                        </div>
                        <div className="day-event-title" style={{ color: evColor }}>{event.title}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="day-right-section">
          <div className="daily-goal-block">
            <div className="day-panel-label">Daily Goal</div>

            <textarea
              className="daily-goal-textarea"
              value={goals[dailyGoalTextKey] || ''}
              onChange={(event) =>
                saveEntry('goals', dailyGoalTextKey, event.target.value)
              }
            />
          </div>

          <div className="journal-block">
            <div className="day-panel-label">Journal</div>

            <textarea
              className="journal-textarea"
              value={journals[key] || ''}
              onChange={(event) => saveEntry('journals', key, event.target.value)}
            />
          </div>
        </div>
      </section>
    </div>
  );
}