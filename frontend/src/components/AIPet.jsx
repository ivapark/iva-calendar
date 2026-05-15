import React, { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import './AIPet.css';

const GREETING = "Hi! I'm here to help you reflect and plan. What's on your mind?";

const CHIPS = [
  { label: 'Reflect', message: 'Help me reflect on my recent journal entries and thoughts.' },
  { label: 'Goals', message: 'How am I tracking on my goals? What should I focus on?' },
  { label: 'Question', message: null },
];

export default function AIPet({ chatIcon, currentDate, journals, goals, mindsets }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const wrapRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event) {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  async function send(text) {
    const trimmed = (text ?? input).trim();
    if (!trimmed || isLoading) return;

    setInput('');
    const nextMessages = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setIsLoading(true);

    try {
      const { reply } = await api.chatWithAI({
        message: trimmed,
        history: messages,
        context: {
          currentDate: currentDate?.toISOString?.() ?? String(currentDate),
          journals,
          goals,
          mindsets,
        },
      });
      setMessages([...nextMessages, { role: 'assistant', content: reply }]);
    } catch {
      setMessages([
        ...nextMessages,
        { role: 'assistant', content: "Sorry, I couldn't connect right now. Try again in a moment." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleChip(chip) {
    if (chip.message) {
      send(chip.message);
    } else {
      inputRef.current?.focus();
    }
  }

  const showChips = messages.length === 0 && !isLoading;

  return (
    <div className="aipet-wrap" ref={wrapRef}>
      <button
        className="iconbtn"
        onClick={() => setIsOpen((o) => !o)}
        title="Chat with IvaPet"
        aria-pressed={isOpen}
      >
        <img className="top-icon" src={chatIcon} alt="" />
      </button>

      {isOpen && (
        <div className="aipet-panel">
          <div className="aipet-header">
            <span className="aipet-title">
              <img src={chatIcon} className="aipet-title-icon" alt="" />
              Fig
            </span>
            <button
              className="aipet-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="aipet-messages">
            <div className="aipet-msg aipet-msg--assistant">{GREETING}</div>

            {messages.map((msg, index) => (
              <div key={index} className={`aipet-msg aipet-msg--${msg.role}`}>
                {msg.content}
              </div>
            ))}

            {isLoading && (
              <div className="aipet-msg aipet-msg--assistant aipet-msg--loading">
                Thinking...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {showChips && (
            <div className="aipet-chips">
              {CHIPS.map((chip) => (
                <button
                  key={chip.label}
                  className="aipet-chip"
                  onClick={() => handleChip(chip)}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}

          <div className="aipet-input-row">
            <input
              ref={inputRef}
              className="aipet-input"
              value={input}
              placeholder="Type a message..."
              disabled={isLoading}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <button
              className="aipet-send"
              onClick={() => send()}
              disabled={!input.trim() || isLoading}
              aria-label="Send"
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
