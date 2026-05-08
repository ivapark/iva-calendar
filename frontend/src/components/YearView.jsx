import React from 'react';
import { MONTHS_SHORT } from '../utils.js';
import './YearView.css';

export default function YearView({ currentDate, eventsForDay, isToday, openDay, jumpMonth }) {
  const year = currentDate.getFullYear();
  const maxDays = 31;

  return (
    <div className="year-page">
      <section className="year-header">
        <div className="year-title-block">
          <div className="year-number">{year}</div>
          <div className="year-title">Yearly Goals</div>

          <div className="mindset-title">This Year’s Mindset</div>
        </div>

        <div className="goals-area">
          <div className="goals-prompt">What do you want to achieve this year?</div>

          <div className="goal-check-grid">
            {Array.from({ length: 10 }, (_, index) => (
              <label key={index} className="goal-check">
                <input type="checkbox" />
                <span />
              </label>
            ))}
          </div>

          <div className="mindset-line" />
        </div>
      </section>

      <section className="year-calendar">
        <div className="month-labels">
          {MONTHS_SHORT.map((month, index) => (
            <button
              key={month}
              className="month-label"
              onClick={() => jumpMonth(index)}
            >
              {month}
            </button>
          ))}
        </div>

        <div className="year-grid">
          {Array.from({ length: 12 }, (_, month) => {
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            return (
              <div className="year-row" key={month}>
                {Array.from({ length: maxDays }, (_, dayIndex) => {
                  const day = dayIndex + 1;

                  if (day > daysInMonth) {
                    return <div key={day} className="year-cell empty" />;
                  }

                  const hasEvent = eventsForDay(year, month, day).length > 0;

                  return (
                    <button
                      key={day}
                      className={`year-cell ${isToday(year, month, day) ? 'today' : ''} ${hasEvent ? 'has-event' : ''}`}
                      onClick={() => openDay(year, month, day)}
                    >
                      <span className="day-number">{day}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}