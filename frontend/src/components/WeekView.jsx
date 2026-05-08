import React from 'react';
import { DAYS, dateKey, weekStart, getClickedTime, addMinutesToTime } from '../utils.js';
import './WeekView.css';

const PIXELS_PER_HOUR = 64;
const HOURS = Array.from({ length: 24 }, (_, h) => h);

function TimeSlot({ hour }) {
  const label = hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`;
  return <div className="ts"><span className="tl2">{label}</span></div>;
}

export default function WeekView({ currentDate, eventsForDay, isToday, openDay, openEditEvent, openAddEvent }) {
  const start = weekStart(currentDate);

  return (
    <div className="wv">
      <div className="whdr">
        <div className="time-label">TIME</div>
        {Array.from({ length: 7 }, (_, index) => {
          const day = new Date(start);
          day.setDate(start.getDate() + index);
          const today = isToday(day.getFullYear(), day.getMonth(), day.getDate());
          return (
            <div key={index} className="wdh" onClick={() => openDay(day.getFullYear(), day.getMonth(), day.getDate())}>
              <div className="wdn">{DAYS[day.getDay()]}</div>
              <div className={`wdd ${today ? 'tn' : ''}`}>{day.getDate()}</div>
            </div>
          );
        })}
      </div>
      <div className="wbody">
        <div className="wgrid">
          <div className="tcol">
            {HOURS.map((hour) => <TimeSlot key={hour} hour={hour} />)}
          </div>
          {Array.from({ length: 7 }, (_, index) => {
            const day = new Date(start);
            day.setDate(start.getDate() + index);
            const key = dateKey(day.getFullYear(), day.getMonth(), day.getDate());
            const dayEvents = eventsForDay(day.getFullYear(), day.getMonth(), day.getDate());

            return (
              <div
                key={index}
                className="wdc"
                onClick={(e) => {
                  const startTime = getClickedTime(e, PIXELS_PER_HOUR);
                  openAddEvent({ date: key, start: startTime, end: addMinutesToTime(startTime, 60) });
                }}
              >
                {HOURS.map((hour) => (
                  <div key={hour} className="hl2" style={{ top: `${hour * PIXELS_PER_HOUR}px` }} />
                ))}
                {dayEvents.map((ev) => {
                  const [sh, sm] = (ev.start || '08:00').split(':').map(Number);
                  const [eh, em] = (ev.end || '09:00').split(':').map(Number);
                  const top = ((sh * 60 + sm) / 60) * PIXELS_PER_HOUR;
                  const height = Math.max(((eh * 60 + em - sh * 60 - sm) / 60) * PIXELS_PER_HOUR, 36);
                  return (
                    <div
                      key={ev.id}
                      className="wev"
                      style={{ top: `${top}px`, height: `${height}px` }}
                      onClick={(e) => { e.stopPropagation(); openEditEvent(ev); }}
                    >
                      <div className="wet">{ev.title}</div>
                      <div className="wet2">{ev.start}{ev.end ? ` – ${ev.end}` : ''}</div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
