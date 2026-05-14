import React from 'react';
import { MONTHS } from '../utils.js';
import './MonthView.css';

export default function MonthView({
  currentDate,
  eventsForDay,
  isToday,
  openDay,
  navigate,
  goToday,
  goals,
  mindsets,
  saveEntry,
}) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthGoalKey = `month-${year}-${month}`;
  const monthMindsetKey = `month-${year}-${month}-mindset`;

  const monthGoals = parseGoalList(goals[monthGoalKey]);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDaysInMonth = new Date(year, month, 0).getDate();

  function updateMonthGoal(index, field, value) {
    const nextGoals = [...monthGoals];

    nextGoals[index] = {
      ...nextGoals[index],
      [field]: value,
    };

    saveEntry('goals', monthGoalKey, JSON.stringify(nextGoals));
  }

  return (
    <div className="month-page">
      <section className="month-header">
        <div className="month-left">
          <div className="month-year">{year}</div>
          <div className="month-title">{MONTHS[month]} Goals</div>
        </div>

        <div className="month-goals-area">
          <div className="month-goals-prompt">
            What do you want to achieve this month?
          </div>

          <div className="month-goal-check-grid">
            {monthGoals.map((goal, index) => (
              <label key={index} className="month-goal-check">
                <input
                  type="checkbox"
                  checked={goal.done}
                  onChange={(event) =>
                    updateMonthGoal(index, 'done', event.target.checked)
                  }
                />

                <span className="month-fake-checkbox" />

                <textarea
                  className="month-goal-text-input"
                  value={goal.text}
                  placeholder="Goal"
                  rows={1}
                  onChange={(event) =>
                    updateMonthGoal(index, 'text', event.target.value)
                  }
                />
              </label>
            ))}
          </div>
        </div>

        <div className="month-mindset-title">This Month’s Mindset</div>

        <textarea
          className="month-mindset-input"
          value={mindsets[monthMindsetKey] || ''}
          placeholder="One word or phrase..."
          rows={1}
          onChange={(event) =>
            saveEntry('mindsets', monthMindsetKey, event.target.value)
          }
        />
      </section>

      <section className="month-calendar-section">
        <div className="month-nav">
          <button
            className="month-arrow month-arrow-left"
            onClick={() => navigate(-1)}
            aria-label="Previous month"
          >
            ◀
          </button>

          <span className="month-name-large">
            {MONTHS[month]} {year}
          </span>

          <button
            className="month-arrow month-arrow-right"
            onClick={() => navigate(1)}
            aria-label="Next month"
          >
            ▶
          </button>

          <button className="month-today-btn" onClick={goToday}>
            Today
          </button>
        </div>

        <div className="month-grid">
          {Array.from({ length: 42 }, (_, i) => {
            let day;
            let displayMonth = month;
            let displayYear = year;
            let outside = false;

            if (i < firstDay) {
              day = prevDaysInMonth - (firstDay - i - 1);
              displayMonth = month - 1;

              if (displayMonth < 0) {
                displayMonth = 11;
                displayYear -= 1;
              }

              outside = true;
            } else if (i - firstDay >= daysInMonth) {
              day = i - firstDay - daysInMonth + 1;
              displayMonth = month + 1;

              if (displayMonth > 11) {
                displayMonth = 0;
                displayYear += 1;
              }

              outside = true;
            } else {
              day = i - firstDay + 1;
            }

            const dayEvents = eventsForDay(displayYear, displayMonth, day);

            return (
              <button
                key={i}
                className={`month-cell ${outside ? 'outside-month' : ''} ${
                  isToday(displayYear, displayMonth, day) ? 'today-cell' : ''
                }`}
                onClick={() => openDay(displayYear, displayMonth, day)}
              >
                <span className="month-day-number">{day}</span>

                {dayEvents.slice(0, 2).map((event) => (
                  <span key={event.id} className="month-event">
                    {event.title}
                  </span>
                ))}
              </button>
            );
          })}
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