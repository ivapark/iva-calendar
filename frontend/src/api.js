import { supabase } from './supabaseClient.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

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
  getState: () => request('/state'),
  createEvent: (event) => request('/events', { method: 'POST', body: JSON.stringify(event) }),
  updateEvent: (id, event) => request(`/events/${id}`, { method: 'PATCH', body: JSON.stringify(event) }),
  deleteEvent: (id) => request(`/events/${id}`, { method: 'DELETE' }),
  createTodo: (todo) => request('/todos', { method: 'POST', body: JSON.stringify(todo) }),
  updateTodo: (id, todo) => request(`/todos/${id}`, { method: 'PATCH', body: JSON.stringify(todo) }),
  deleteTodo: (id) => request(`/todos/${id}`, { method: 'DELETE' }),
  saveEntry: (type, key, value) => request('/entries', { method: 'POST', body: JSON.stringify({ type, key, value }) }),
  chatWithAI: (body) => request('/ai/chat', { method: 'POST', body: JSON.stringify(body) })
};
