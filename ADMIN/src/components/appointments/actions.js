// Appointment row actions, shared by the table, cards, details dialog and bulk bar.
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditCalendarRoundedIcon from '@mui/icons-material/EditCalendarRounded';
import EventBusyRoundedIcon from '@mui/icons-material/EventBusyRounded';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import { hasStarted, isActive } from '../../utils/appointments';
import { formatDate, formatTimeRange, todayString } from '../../utils/format';
import { hoursSince, relativeTime } from '../../utils/time';

// What each action does, for the menu and the confirmation dialog.
export const ACTIONS = {
  confirmed: { label: 'Confirm', icon: CheckRoundedIcon, color: 'success', title: 'Confirm this appointment?', message: 'The client will see it as confirmed.' },
  completed: { label: 'Mark completed', icon: TaskAltRoundedIcon, color: 'primary', title: 'Mark as completed?', message: 'Use this once the visit has taken place.' },
  reschedule: { label: 'Reschedule', icon: EditCalendarRoundedIcon, color: 'primary' },
  reopen: {
    label: 'Reopen (not completed)',
    icon: ReplayRoundedIcon,
    color: 'warning',
    title: 'Reopen this appointment?',
    message: 'It goes back to confirmed. Use this if it was marked completed by mistake.',
  },
  cancelled: { label: 'Cancel', icon: EventBusyRoundedIcon, color: 'error', title: 'Cancel this appointment?', message: 'The time slot will be released for other clients.' },
  delete: { label: 'Delete', icon: DeleteOutlineRoundedIcon, color: 'error', title: 'Delete this appointment?', message: 'It will be permanently removed. This cannot be undone.' },
};

// Same rules as before the redesign: completing needs the visit to have started.
export function availableActions(appt) {
  const list = [];
  if (appt.status === 'pending') list.push('confirmed');
  if (isActive(appt) && hasStarted(appt)) list.push('completed');
  if (isActive(appt)) list.push('reschedule', 'cancelled');
  if (appt.status === 'completed') list.push('reopen');
  list.push('delete');
  return list;
}

export const isToday = (appt) => appt.date === todayString();

// "Requested 26h ago" for the first two days, then "Requested Oct 2".
export function requestedLabel(createdAt) {
  if (!createdAt) return '';
  const h = hoursSince(createdAt);
  if (h < 1) return `Requested ${relativeTime(createdAt).toLowerCase()}`;
  if (h < 48) return `Requested ${h}h ago`;
  return `Requested ${relativeTime(createdAt)}`;
}

// CSV text for a list of appointments (quoted fields, CRLF rows).
export function appointmentsCsv(rows) {
  const head = ['Date', 'Time', 'Client', 'Email', 'Phone', 'Service', 'Duration (min)', 'Price', 'Specialist', 'Status', 'Requested', 'Notes'];
  const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = rows.map((a) =>
    [
      a.date,
      formatTimeRange(a.startTime, a.endTime),
      a.user?.name ?? 'Deleted user',
      a.user?.email,
      a.user?.phone,
      a.service?.name ?? 'Service removed',
      a.service?.durationMinutes,
      a.service?.price,
      a.staff?.name ?? 'Staff removed',
      a.status,
      a.createdAt ? new Date(a.createdAt).toISOString() : '',
      a.notes,
    ]
      .map(cell)
      .join(',')
  );
  return [head.map(cell).join(','), ...lines].join('\r\n');
}

export const describeAppt = (appt) => `${formatDate(appt.date)}, ${formatTimeRange(appt.startTime, appt.endTime)}`;
