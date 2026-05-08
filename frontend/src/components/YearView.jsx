import React from 'react';
import { MONTHS_SHORT } from '../utils.js';
import './YearView.css';

export default function YearView({ currentDate, eventsForDay, isToday, openDay, jumpMonth }) {
  const year = currentDate.getFullYear();
  const maxDays = 31;

  return (
    <div className="yv">
      <div className="mcol">
        {MONTHS_SHORT.map((month, index) => (
          <div key={month} className="mhdr" onClick={() => jumpMonth(index)}>
            {month}
          </div>
        ))}
      </div>

      <div className="dgrid">
        {Array.from({ length: 12 }, (_, month) => {
          const daysInMonth = new Date(year, month + 1, 0).getDate();

          return (
            <div className="mrow" key={month}>
              {Array.from({ length: maxDays }, (_, dayIndex) => {
                const day = dayIndex + 1;

                if (day > daysInMonth) {
                  return <div key={day} className="dc empty" />;
                }

                const hasEvent = eventsForDay(year, month, day).length > 0;

                return (
                  <div
                    key={day}
                    className={`dc ${isToday(year, month, day) ? 'td' : ''} ${hasEvent ? 'ev' : ''}`}
                    onClick={() => openDay(year, month, day)}
                  >
                    <span className="dn">{day}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}