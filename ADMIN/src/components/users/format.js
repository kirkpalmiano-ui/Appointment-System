import { relativeTime } from '../../utils/time';

const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// Last sign-in in a few words: "Just now", "12 min ago", "Today", "Yesterday", "3 days ago", "Oct 2". Null = never.
export function signInLabel(value) {
  if (!value) return null;
  const date = new Date(value);
  const now = new Date();
  if (now - date < 60 * 60 * 1000) return relativeTime(value);
  if (sameDay(date, now)) return 'Today';
  return relativeTime(value);
}

export const shortDate = (value) => (value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '');

export const fullDateTime = (value) =>
  value ? new Date(value).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
