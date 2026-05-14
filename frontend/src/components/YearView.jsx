import React from 'react';
import { MONTHS_SHORT } from '../utils.js';
import './YearView.css';

export default function YearView({
  currentDate,
  eventsForDay,
  isToday,
  openDay,
  jumpMonth,
  goals,
  mindsets,
  saveEntry,
}) {
  const year = currentDate.getFullYear();
  const maxDays = 31;

  const yearlyGoalsKey = `year-${year}-goal-list`;
  const yearlyMindsetKey = `year-${year}-mindset`;

  const yearlyGoals = parseGoalList(goals[yearlyGoalsKey]);

  function updateYearlyGoal(index, field, value) {
    const nextGoals = [...yearlyGoals];
    nextGoals[index] = {
      ...nextGoals[index],
      [field]: value,
    };

    saveEntry('goals', yearlyGoalsKey, JSON.stringify(nextGoals));
  }

  function getMonthlyFirstGoal(monthIndex) {
    const monthGoalKey = `month-${year}-${monthIndex}`;
    const rawValue = goals[monthGoalKey] || '';

    try {
      const parsed = JSON.parse(rawValue);

      if (Array.isArray(parsed)) {
        return parsed.find((item) => item?.text?.trim())?.text || '';
      }

      return rawValue;
    } catch {
      return rawValue;
    }
  }

  return (
    <div className="year-page">
      <section className="year-header">
        <div className="year-left">
          <div className="year-number">{year}</div>
          <div className="year-title">Goal Calendar</div>
        </div>

        <div className="year-right">
          <div className="mindset-row">
            <span className="mindset-title">This year’s Mindset:</span>

            <input
              className="mindset-input"
              value={mindsets[yearlyMindsetKey] || ''}
              placeholder="One word or phrase..."
              onChange={(event) => saveEntry('mindsets', yearlyMindsetKey, event.target.value)}
            />
          </div>

          <div className="goals-area">
            <div className="goals-prompt">What do you want to achieve this year?</div>

            <div className="goal-check-grid">
              {yearlyGoals.map((goal, index) => (
                <label key={index} className="goal-check">
                  <input
                    type="checkbox"
                    checked={goal.done}
                    onChange={(event) => updateYearlyGoal(index, 'done', event.target.checked)}
                  />

                  <span className="fake-checkbox" />

                  <textarea
                    className="goal-text-input"
                    value={goal.text}
                    placeholder="Goal"
                    rows={1}
                    onChange={(event) => updateYearlyGoal(index, 'text', event.target.value)}
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="year-calendar">
        <div className="month-labels">
          {MONTHS_SHORT.map((month, index) => {
            const firstGoal = getMonthlyFirstGoal(index);

            return (
              <button
                key={month}
                className="month-label"
                onClick={() => jumpMonth(index)}
              >
                <span className="month-name">{month}</span>
                <span className="month-goal-preview">
                  {firstGoal || ''}
                </span>
              </button>
            );
          })}
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

                  const dayEvents = eventsForDay(year, month, day);
                  const hasEvent = dayEvents.length > 0;

                  return (
                    <button
                      key={day}
                      className={`year-cell ${isToday(year, month, day) ? 'today' : ''} ${hasEvent ? 'has-event' : ''}`}
                      onClick={() => openDay(year, month, day)}
                    >
                      <span className="day-number">{day}</span>

                      {hasEvent && (
                        <div className="year-event-list">
                          {dayEvents.slice(0, 3).map((event) => (
                            <span key={event.id} className="year-event-chip">
                              {event.title}
                            </span>
                          ))}
                        </div>
                      )}
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

function parseGoalList(rawValue) {
  const emptyGoals = Array.from({ length: 10 }, () => ({
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