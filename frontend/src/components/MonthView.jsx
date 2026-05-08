import React from 'react';
import { MONTHS, DAYS } from '../utils.js';
import './MonthView.css';

export default function MonthView({ currentDate, eventsForDay, isToday, openDay, navigate }) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDaysInMonth = new Date(year, month, 0).getDate();

  return (
    <div className="mv">
      <div className="mnav">
        <button className="arr" onClick={() => navigate(-1)}>←</button>
        <span className="mname">{MONTHS[month]} {year}</span>
        <button className="arr" onClick={() => navigate(1)}>→</button>
      </div>
      <div className="wdrow">
        {DAYS.map((day) => <div key={day} className="wd">{day}</div>)}
      </div>
      <div className="mgrid">
        {Array.from({ length: 42 }, (_, i) => {
          let day, displayMonth = month, displayYear = year, outside = false;

          if (i < firstDay) {
            day = prevDaysInMonth - (firstDay - i - 1);
            displayMonth = month - 1;
            if (displayMonth < 0) { displayMonth = 11; displayYear -= 1; }
            outside = true;
          } else if (i - firstDay >= daysInMonth) {
            day = i - firstDay - daysInMonth + 1;
            displayMonth = month + 1;
            if (displayMonth > 11) { displayMonth = 0; displayYear += 1; }
            outside = true;
          } else {
            day = i - firstDay + 1;
          }

          const dayEvents = eventsForDay(displayYear, displayMonth, day);
          return (
            <div
              key={i}
              className={`mc ${outside ? 'om' : ''} ${isToday(displayYear, displayMonth, day) ? 'tc' : ''}`}
              onClick={() => openDay(displayYear, displayMonth, day)}
            >
              <div className="mdn"><span>{day}</span></div>
              {dayEvents.slice(0, 2).map((ev) => (
                <div key={ev.id} className="mev">{ev.title}</div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
