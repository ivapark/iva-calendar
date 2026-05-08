const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
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
  updateEvent: (id, event) => request(`/events/${id}`, { method: 'PUT', body: JSON.stringify(event) }),
  deleteEvent: (id) => request(`/events/${id}`, { method: 'DELETE' }),
  createTodo: (todo) => request('/todos', { method: 'POST', body: JSON.stringify(todo) }),
  updateTodo: (id, data) => request(`/todos/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTodo: (id) => request(`/todos/${id}`, { method: 'DELETE' }),
  saveEntry: (type, key, value) => request(`/entries/${type}/${encodeURIComponent(key)}`, { method: 'PUT', body: JSON.stringify({ value }) })
};
