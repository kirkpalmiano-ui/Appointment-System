import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import EventBusyOutlinedIcon from '@mui/icons-material/EventBusyOutlined';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import KeyRoundedIcon from '@mui/icons-material/KeyRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import PriorityHighRoundedIcon from '@mui/icons-material/PriorityHighRounded';

// Action-prefix filters understood by GET /admin/audit-logs?action=
export const CATEGORIES = [
  { value: '', label: 'All events' },
  { value: 'auth.', label: 'Sign-ins' },
  { value: 'appointment.', label: 'Appointments' },
  { value: 'service.', label: 'Services' },
  { value: 'staff.', label: 'Staff' },
  { value: 'timeoff.', label: 'Time off' },
  { value: 'user.', label: 'Users' },
  { value: 'account.', label: 'Own account' },
];

const LABELS = {
  'auth.admin_login': 'Signed in',
  'auth.admin_login_failed': 'Sign-in failed',
  'auth.admin_2fa_failed': 'Wrong sign-in code',
  'auth.admin_logout': 'Signed out',
  'auth.step_up_failed': 'Wrong password on confirm',
  'appointment.confirmed': 'Confirmed appointment',
  'appointment.completed': 'Completed appointment',
  'appointment.cancelled': 'Cancelled appointment',
  'appointment.pending': 'Reopened appointment',
  'appointment.reschedule': 'Rescheduled appointment',
  'appointment.delete': 'Deleted appointment',
  'service.create': 'Added service',
  'service.update': 'Updated service',
  'service.delete': 'Deleted service',
  'staff.create': 'Added staff',
  'staff.update': 'Updated staff',
  'staff.delete': 'Deleted staff',
  'staff.invite': 'Sent staff invite',
  'staff.revoke_access': 'Revoked staff access',
  'staff.appointment_confirmed': 'Staff confirmed appointment',
  'staff.appointment_completed': 'Staff completed appointment',
  'timeoff.create': 'Added time off',
  'timeoff.delete': 'Removed time off',
  'user.role_change': 'Changed role',
  'user.unlock': 'Unlocked account',
  'user.delete': 'Deleted user',
  'account.password_change': 'Password changed',
};

// Chip tone + icon per category (successful events).
const CATEGORY = {
  appointment: { tone: 'accent', icon: EventNoteOutlinedIcon },
  service: { tone: 'info', icon: MedicalServicesOutlinedIcon },
  staff: { tone: 'info', icon: BadgeOutlinedIcon },
  timeoff: { tone: 'info', icon: EventBusyOutlinedIcon },
  user: { tone: 'accent', icon: ManageAccountsOutlinedIcon },
  account: { tone: 'accent', icon: KeyRoundedIcon },
};

export const eventLabel = (entry) => LABELS[entry.action] ?? entry.action;

// { label, tone, Icon } for an entry's event chip.
export function eventMeta(entry) {
  const label = eventLabel(entry);
  if (!entry.success) return { label, tone: 'danger', Icon: PriorityHighRoundedIcon };
  if (entry.action === 'auth.admin_login') return { label, tone: 'success', Icon: CheckRoundedIcon };
  if (entry.action === 'auth.admin_logout') return { label, tone: 'neutral', Icon: LogoutRoundedIcon };
  const c = CATEGORY[entry.action.split('.')[0]] ?? { tone: 'info', icon: CheckRoundedIcon };
  return { label, tone: c.tone, Icon: c.icon };
}

// Failed sign-ins (same definition as the bell and sidebar badge: any failed auth.* event).
export const isFailedSignIn = (entry) => !entry.success && entry.action.startsWith('auth.');

// The email a failed sign-in was for: parsed from the summary ("Failed admin sign-in for x@y.z"), else the actor.
export function targetEmail(entry) {
  return entry?.summary?.match(/[^\s@]+@[^\s@]+\.[^\s@]+/)?.[0] ?? entry?.actorEmail ?? '';
}

const DAY_FMT = { month: 'short', day: 'numeric' };
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

// Local-day key and sticky header label: "TODAY · OCT 13", "YESTERDAY · OCT 12", "MON · OCT 6".
export const dayKey = (value) => startOfDay(new Date(value));

export function dayLabel(key) {
  const date = new Date(key);
  const today = startOfDay(new Date());
  const days = Math.round((today - key) / 86_400_000);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  const md = date.toLocaleDateString('en-US', sameYear ? DAY_FMT : { ...DAY_FMT, year: 'numeric' });
  const lead = days === 0 ? 'Today' : days === 1 ? 'Yesterday' : date.toLocaleDateString('en-US', { weekday: 'short' });
  return `${lead} · ${md}`.toUpperCase();
}

export const entryTime = (value) => new Date(value).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' });
