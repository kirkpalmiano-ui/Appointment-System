// Relative times for timestamps (ISO strings or Date): "Just now", "5 min ago", "3 hrs ago", "Yesterday", "4 days ago", "Oct 2".
export function relativeTime(value, { now = Date.now() } = {}) {
  if (!value) return '';
  const date = new Date(value);
  const seconds = Math.round((now - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(date.getFullYear() !== new Date(now).getFullYear() && { year: 'numeric' }) });
}

// Whole hours since a timestamp ("26h").
export const hoursSince = (value, now = Date.now()) => Math.max(0, Math.floor((now - new Date(value).getTime()) / 3_600_000));

// "1h 59m" / "12m" for a number of seconds.
export function formatDurationShort(totalSeconds) {
  const minutes = Math.ceil(totalSeconds / 60);
  if (minutes >= 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  return `${minutes}m`;
}

// "2:42 AM" for a timestamp (viewer's local time).
export const clockTime = (value) => new Date(value).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

// Good morning / afternoon / evening, by the viewer's local time.
export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}
