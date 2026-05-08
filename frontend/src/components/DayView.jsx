import React, { useState } from 'react';
import { MONTHS, dateKey, getScopeKey, getClickedTime, addMinutesToTime } from '../utils.js';
import Journal from './Journal.jsx';
import './DayView.css';

const PIXELS_PER_HOUR = 64;

function TodosPanel({ todos, date, addTodo, toggleTodo, deleteTodo }) {
  const [text, setText] = useState('');

  async function submit() {
    if (!text.trim()) return;
    await addTodo(date, text.trim());
    setText('');
  }

  return (
    <>
      <div className="tlist">
        {todos.length === 0 && <div className="empty-message">No todos yet.</div>}
        {todos.map((todo) => (
          <div key={todo.id} className="titem">
            <button className={`tck ${todo.done ? 'dn2' : ''}`} onClick={() => toggleTodo(todo)}>
              {todo.done ? '✓' : ''}
            </button>
            <span className={`ttx ${todo.done ? 'dt' : ''}`}>{todo.text}</span>
            <button className="xbtn" onClick={() => deleteTodo(todo.id)}>×</button>
          </div>
        ))}
      </div>
      <div className="addrow">
        <span>+</span>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          placeholder="Add a todo..."
        />
      </div>
    </>
  );
}

export default function DayView({ currentDate, eventsForDay, todosForDay, panel, setPanel, openEditEvent, openAddEvent, addTodo, toggleTodo, deleteTodo, journals, goals, saveEntry }) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const day = currentDate.getDate();
  const key = dateKey(year, month, day);
  const dayEvents = eventsForDay(year, month, day);
  const dayTodos = todosForDay(year, month, day);
  const goalKey = getScopeKey('day', currentDate);

  return (
    <div className="dv">
      <div className="dleft">
        <div className="dph">{MONTHS[month]} {day}, {year}</div>
        <div className="dbody">
          <div
            className="day-hours"
            onClick={(e) => {
              const startTime = getClickedTime(e, PIXELS_PER_HOUR);
              openAddEvent({ date: key, start: startTime, end: addMinutesToTime(startTime, 60) });
            }}
          >
            {Array.from({ length: 24 }, (_, hour) => (
              <div key={hour} className="dhour">
                <span className="dhl">
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </span>
              </div>
            ))}
            {dayEvents.map((ev) => {
              const [sh, sm] = (ev.start || '08:00').split(':').map(Number);
              const [eh, em] = (ev.end || '09:00').split(':').map(Number);
              const top = ((sh * 60 + sm) / 60) * PIXELS_PER_HOUR;
              const height = Math.max(((eh * 60 + em - sh * 60 - sm) / 60) * PIXELS_PER_HOUR, 40);
              return (
                <div
                  key={ev.id}
                  className="dev"
                  style={{ top: `${top}px`, height: `${height}px` }}
                  onClick={(e) => { e.stopPropagation(); openEditEvent(ev); }}
                >
                  <div className="devt">{ev.title}</div>
                  <div className="note-preview">{ev.notes}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="dright">
        <div className="ptabs">
          {['todos', 'journal', 'goals'].map((item) => (
            <div key={item} className={`ptab ${panel === item ? 'on' : ''}`} onClick={() => setPanel(item)}>
              {item[0].toUpperCase() + item.slice(1)}
            </div>
          ))}
        </div>
        <div className="panel-body">
          {panel === 'todos' && (
            <TodosPanel todos={dayTodos} date={key} addTodo={addTodo} toggleTodo={toggleTodo} deleteTodo={deleteTodo} />
          )}
          {panel === 'journal' && (
            <Journal dateKey={key} journals={journals} saveEntry={saveEntry} />
          )}
          {panel === 'goals' && (
            <div className="goal-panel">
              <div className="sb-label">Daily Goal</div>
              <textarea
                className="goal-textarea"
                placeholder="What do you want to achieve today?"
                value={goals[goalKey] || ''}
                onChange={(e) => saveEntry('goals', goalKey, e.target.value)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
