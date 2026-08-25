/** Whole days between now and the given date string (negative = past). */
export function daysUntil(dateStr, now = new Date()) {
  const due = new Date(dateStr);
  return Math.ceil((due - now) / (1000 * 60 * 60 * 24));
}

/** Hours/minutes remaining until end-of-day on the given date string. */
export function countdownParts(dateStr, now = new Date()) {
  // due_date comes back from the API as a full ISO datetime (has a "T"
  // already) for some endpoints and a plain "YYYY-MM-DD" for others —
  // appending a time component onto an already-full datetime produces an
  // invalid string, so only pad the plain-date form to end-of-day.
  const due = dateStr.includes('T') ? new Date(dateStr) : new Date(dateStr + 'T23:59:59');
  const diff = Math.max(0, due - now);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return { h, m };
}

export function formatDate(dateStr, options) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(
    'en-IN',
    options || { day: '2-digit', month: 'short', year: 'numeric' }
  );
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function relativeTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return formatDate(dateStr);
}

export function dueStatus(dueDateStr, now = new Date()) {
  const d = daysUntil(dueDateStr, now);
  if (d < 0) return { key: 'overdue', label: `${Math.abs(d)}d overdue`, tone: 'danger' };
  if (d === 0) return { key: 'today', label: 'Due today', tone: 'warning' };
  if (d <= 3) return { key: 'soon', label: `${d}d left`, tone: 'warning' };
  return { key: 'ok', label: `${d}d left`, tone: 'success' };
}

/** Groups items with a date field into the last N calendar months (oldest first). */
export function groupByMonth(items, dateField, monthsBack = 6, now = new Date()) {
  const buckets = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, m: d.toLocaleString('en-IN', { month: 'short' }), v: 0 });
  }
  const index = new Map(buckets.map((b) => [b.key, b]));
  for (const item of items) {
    const raw = item[dateField];
    if (!raw) continue;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const bucket = index.get(key);
    if (bucket) bucket.v += 1;
  }
  return buckets;
}
