export const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
export const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
export const COLORS = ['#534AB7','#0F6E56','#993C1D','#993556','#185FA5','#3B6D11','#854F0B','#5F5E5A'];

export function dateKey(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function weekStart(date) {
  const d = new Date(date);
  d.setDate(date.getDate() - date.getDay());
  return d;
}

export function clampHourMinute(totalMinutes) {
  const clamped = Math.max(0, Math.min(totalMinutes, 23 * 60 + 30));
  const hour = Math.floor(clamped / 60);
  const minute = clamped % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function addMinutesToTime(time, minutesToAdd) {
  const [hour, minute] = time.split(':').map(Number);
  const total = hour * 60 + minute + minutesToAdd;
  if (total >= 24 * 60) return '23:59';
  return clampHourMinute(total);
}

export function getClickedTime(e, pixelsPerHour) {
  const rect = e.currentTarget.getBoundingClientRect();
  const y = e.clientY - rect.top;
  const rawMinutes = (y / pixelsPerHour) * 60;
  return clampHourMinute(Math.floor(rawMinutes / 30) * 30);
}

export function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getScopeKey(view, date) {
  if (view === 'year') return `y${date.getFullYear()}`;
  if (view === 'month') return `m${date.getFullYear()}-${date.getMonth()}`;
  return `d${dateKey(date.getFullYear(), date.getMonth(), date.getDate())}`;
}
