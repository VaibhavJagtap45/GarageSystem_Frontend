import { COLORS } from './constants';

export const formatPrice = (price) => {
  if (!price || price === 0) return 'FREE';
  return `₹${Number(price).toLocaleString('en-IN')}`;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDueDate = (dateStr) => {
  if (!dateStr) return '—';
  const diff = Math.ceil((new Date(dateStr) - new Date()) / 86400000);
  if (diff < 0) return 'Overdue';
  if (diff === 0) return 'Due Today';
  if (diff === 1) return 'Due Tomorrow';
  if (diff <= 7) return `Due in ${diff} days`;
  return formatDate(dateStr);
};

export const getInitials = (name = '') =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

export const truncate = (str = '', len = 90) =>
  str.length > len ? str.slice(0, len) + '...' : str;

export const getProgressColor = (pct) => {
  if (pct >= 100) return COLORS.success;
  if (pct >= 60) return COLORS.primary;
  if (pct >= 30) return COLORS.warning;
  return COLORS.error;
};

export const getImageFallback = (id = '', title = '') => {
  const seed = id || title.replace(/\s+/g, '-').toLowerCase() || 'course';
  return `https://picsum.photos/seed/${seed}/600/400`;
};

export const getAvatarColor = (name = '') => {
  const colors = [
    COLORS.primary,
    COLORS.secondary,
    COLORS.success,
    COLORS.warning,
    '#63B3ED',
  ];
  return colors[name.charCodeAt(0) % colors.length];
};

