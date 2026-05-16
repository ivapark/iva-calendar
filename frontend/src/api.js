import { supabase } from './supabaseClient.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(path, options = {}) {
  const headers = await authHeaders();

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Request failed');
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  getState: () => request('/api/state'),
  createEvent: (event) => request('/api/events', { method: 'POST', body: JSON.stringify(event) }),
  updateEvent: (id, event) => request(`/api/events/${id}`, { method: 'PUT', body: JSON.stringify(event) }),
  deleteEvent: (id) => request(`/api/events/${id}`, { method: 'DELETE' }),
  createTodo: (todo) => request('/api/todos', { method: 'POST', body: JSON.stringify(todo) }),
  updateTodo: (id, todo) => request(`/api/todos/${id}`, { method: 'PATCH', body: JSON.stringify(todo) }),
  deleteTodo: (id) => request(`/api/todos/${id}`, { method: 'DELETE' }),
  saveEntry: (type, key, value) => request(`/api/entries/${type}/${key}`, { method: 'PUT', body: JSON.stringify({ value }) }),
  chatWithAI: (body) => request('/api/ai/chat', { method: 'POST', body: JSON.stringify(body) })
};