import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import EventBusyRoundedIcon from '@mui/icons-material/EventBusyRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import WavingHandRoundedIcon from '@mui/icons-material/WavingHandRounded';
import { formatDate } from '../../utils/format';

const TYPES = {
  pending: { title: 'Booking request sent', icon: SendRoundedIcon, tone: 'accent' },
  confirmed: { title: 'Appointment confirmed', icon: EventAvailableRoundedIcon, tone: 'success' },
  cancelled: { title: 'Appointment cancelled', icon: EventBusyRoundedIcon, tone: 'danger' },
  completed: { title: 'Visit completed', icon: TaskAltRoundedIcon, tone: 'info' },
};

// "Just now", "5m ago", "2h ago", "3d ago", then a short date.
export function timeAgo(iso) {
  const then = new Date(iso);
  const seconds = Math.max(0, (Date.now() - then.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 86400 * 30) return `${Math.floor(seconds / 86400)}d ago`;
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Turns appointments (+ the account's creation) into the newest 5 timeline events.
// Pending = when the request was made; other statuses = their last change.
// TODO(backend): a real per-appointment history (status-change log) would let us show every step, not just the latest.
export function buildActivity(appointments = [], user) {
  const items = appointments
    .filter((a) => TYPES[a.status])
    .map((a) => ({
      id: a._id,
      ...TYPES[a.status],
      at: a.status === 'pending' ? a.createdAt : a.updatedAt,
      detail: `${a.service?.name ?? 'Appointment'} with ${a.staff?.name ?? 'your specialist'} · ${formatDate(a.date, { month: 'short', day: 'numeric' })}`,
    }));
  if (user?.createdAt) {
    items.push({
      id: 'welcome',
      title: 'Welcome to CliniQuick',
      detail: 'Your account was created',
      icon: WavingHandRoundedIcon,
      tone: 'pending',
      at: user.createdAt,
    });
  }
  return items
    .filter((item) => item.at)
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 5);
}
