export function formatCurrency(amount) {
  const n = Number(amount) || 0;
  return `₹${n.toLocaleString('en-IN')}`;
}

export function formatNumber(n) {
  return (Number(n) || 0).toLocaleString('en-IN');
}

export function initials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');
}
