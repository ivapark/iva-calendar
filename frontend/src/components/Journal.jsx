import React from 'react';
import './Journal.css';

export default function Journal({ dateKey, journals, saveEntry }) {
  return (
    <div className="jarea">
      <textarea
        className="jtx"
        placeholder="Write your thoughts for the day..."
        value={journals[dateKey] || ''}
        onChange={(e) => saveEntry('journals', dateKey, e.target.value)}
      />
    </div>
  );
}
