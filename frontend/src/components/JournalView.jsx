import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MONTHS, dateKey } from '../utils.js';
import './JournalView.css';

function getDaysForYear(currentDate) {
  const year = currentDate.getFullYear();
  const days = [];

  const day = new Date(year, 0, 1);

  while (day.getFullYear() === year) {
    days.push(new Date(day));
    day.setDate(day.getDate() + 1);
  }

  return days;
}

function getPreview(text) {
  if (!text?.trim()) return '';
  return text.trim().length > 24 ? `${text.trim().slice(0, 24)}...` : text.trim();
}

export default function JournalView({
  currentDate,
  setCurrentDate,
  journals,
  saveEntry,
  goToday,
}) {
  const [selectedDate, setSelectedDate] = useState(currentDate);

  const [sidebarWidth, setSidebarWidth] = useState(176);


  const resizeStartRef = useRef(null);
  const selectedDateRef = useRef(null);

  function startSidebarResize(event) {
    event.preventDefault();

    resizeStartRef.current = {
        startX: event.clientX,
        startWidth: sidebarWidth,
    };

    window.addEventListener('mousemove', resizeSidebar);
    window.addEventListener('mouseup', stopSidebarResize);
    }

    function resizeSidebar(event) {
    if (!resizeStartRef.current) return;

  const deltaX = event.clientX - resizeStartRef.current.startX;
  const nextWidth = resizeStartRef.current.startWidth + deltaX;

    setSidebarWidth(Math.min(Math.max(nextWidth, 150), 360));
    }

  function stopSidebarResize() {
    resizeStartRef.current = null;

    window.removeEventListener('mousemove', resizeSidebar);
    window.removeEventListener('mouseup', stopSidebarResize);
    }




  const selectedKey = dateKey(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate()
  );

  useEffect(() => {
    setSelectedDate(currentDate);
  }, [currentDate]);

  useEffect(() => {
    selectedDateRef.current?.scrollIntoView({
      block: 'center',
    });
  }, [selectedKey]);

  const days = useMemo(
    () => getDaysForYear(selectedDate),
    [selectedDate]
  );

  function selectDate(day) {
    setSelectedDate(day);
    setCurrentDate(day);
  }

  function moveDay(amount) {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(selectedDate.getDate() + amount);
    setSelectedDate(nextDate);
    setCurrentDate(nextDate);
  }

  function handleToday() {
    const today = new Date();
    setSelectedDate(today);
    setCurrentDate(today);
    if (goToday) goToday();
  }

  return (
    <div className="journal-page">
      <section className="journal-top">
        <div className="journal-nav">
          <button
            className="journal-arrow"
            onClick={() => moveDay(-1)}
            aria-label="Previous day"
          >
            ◀
          </button>

          <span className="journal-date-title">
            {MONTHS[selectedDate.getMonth()]}, {selectedDate.getDate()} {selectedDate.getFullYear()}
          </span>

          <button
            className="journal-arrow"
            onClick={() => moveDay(1)}
            aria-label="Next day"
          >
            ▶
          </button>

          <button className="journal-today-btn" onClick={handleToday}>
            Today
          </button>
        </div>
      </section>

      <section
        className="journal-layout"
        style={{ gridTemplateColumns: `${sidebarWidth}px 8px minmax(0, 1fr)` }}
        >
        <aside className="journal-date-list">
          {days.map((day) => {
            const key = dateKey(
              day.getFullYear(),
              day.getMonth(),
              day.getDate()
            );

            const isSelected = key === selectedKey;
            const text = journals[key] || '';

            return (
              <button
                key={key}
                ref={isSelected ? selectedDateRef : null}
                className={`journal-date-item ${isSelected ? 'is-selected' : ''}`}
                onClick={() => selectDate(day)}
                >
                <span className="journal-date-label">
                  {MONTHS[day.getMonth()]} {day.getDate()}
                </span>

                {text.trim() && (
                  <span className="journal-date-preview">
                    {getPreview(text)}
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        <div
            className="journal-sidebar-resize-handle"
            onMouseDown={startSidebarResize}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize journal date sidebar"
            />
            
        <main className="journal-editor-panel">
          <textarea
            className="journal-main-textarea"
            value={journals[selectedKey] || ''}
            placeholder="Write your journal..."
            onChange={(event) =>
              saveEntry('journals', selectedKey, event.target.value)
            }
          />
        </main>
      </section>
    </div>
  );
}