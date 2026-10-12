import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { IconTile } from '../ui/StatCard';
import { ErrorState } from '../ui/TableStates';
import { relativeTime } from '../../utils/time';

const MAX_ITEMS = 6;

// Friendly titles for audit actions (same wording as the Audit log page).
const LABELS = {
  'auth.admin_login': 'Signed in',
  'auth.admin_login_failed': 'Failed sign-in',
  'auth.admin_2fa_failed': 'Wrong sign-in code',
  'auth.admin_logout': 'Signed out',
  'auth.step_up_failed': 'Wrong password on confirm',
  'appointment.confirmed': 'Appointment confirmed',
  'appointment.completed': 'Appointment completed',
  'appointment.cancelled': 'Appointment cancelled',
  'appointment.pending': 'Appointment reopened',
  'appointment.reschedule': 'Appointment rescheduled',
  'appointment.delete': 'Appointment deleted',
  'service.create': 'Service added',
  'service.update': 'Service updated',
  'service.delete': 'Service deleted',
  'staff.create': 'Staff added',
  'staff.update': 'Staff updated',
  'staff.delete': 'Staff removed',
  'staff.invite': 'Staff invite sent',
  'staff.revoke_access': 'Staff access revoked',
  'staff.appointment_confirmed': 'Staff confirmed a booking',
  'staff.appointment_completed': 'Staff completed a booking',
  'timeoff.create': 'Time off added',
  'timeoff.delete': 'Time off removed',
  'user.role_change': 'Role changed',
  'user.unlock': 'Account unlocked',
  'user.delete': 'User deleted',
  'account.password_change': 'Password changed',
};

// Icon + tone for an audit entry.
function look(entry) {
  if (!entry.success) return [WarningAmberRoundedIcon, 'danger'];
  const [group] = entry.action.split('.');
  if (entry.action === 'staff.invite') return [MailOutlineRoundedIcon, 'info'];
  if (group === 'auth') return [LoginRoundedIcon, 'neutral'];
  if (group === 'appointment') return [EventRoundedIcon, 'primary'];
  if (group === 'service') return [MedicalServicesOutlinedIcon, 'primary'];
  if (group === 'staff' || group === 'timeoff') return [BadgeOutlinedIcon, 'info'];
  if (group === 'account') return [LockOutlinedIcon, 'neutral'];
  return [PersonOutlineRoundedIcon, 'neutral'];
}

function fromAudit(e) {
  const [icon, tone] = look(e);
  const title = LABELS[e.action] ?? e.action;
  const detail = !e.success && e.action.startsWith('auth.') ? [e.actorEmail, e.ip].filter(Boolean).join(' · ') : e.summary || e.actorEmail;
  return { key: e._id ?? `${e.action}-${e.createdAt}`, icon, tone, title, detail, at: e.createdAt };
}

function fromBooking(a) {
  return {
    key: `booking-${a._id}`,
    icon: EventNoteRoundedIcon,
    tone: 'pending',
    title: 'New booking request',
    detail: `${a.user?.name ?? 'Deleted user'} · ${a.service?.name ?? '—'}`,
    at: a.createdAt,
  };
}

/**
 * Newest audit-log events merged with new booking requests (pending list createdAt).
 * `logs` / `pending` are arrays, or null while loading. `now` (ms) keeps relative times fresh.
 */
export default function RecentActivity({ logs, pending, error, onRetry, now }) {
  if (error) return <ErrorState message={error} onRetry={onRetry} sx={{ m: 0 }} />;
  if (logs === null) {
    return (
      <Stack spacing={1.75}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Stack key={n} direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Skeleton variant="rounded" width={36} height={36} sx={{ borderRadius: '11px' }} />
            <Box sx={{ flexGrow: 1 }}>
              <Skeleton width="60%" />
              <Skeleton width="40%" />
            </Box>
          </Stack>
        ))}
      </Stack>
    );
  }

  const items = [...logs.map(fromAudit), ...(pending ?? []).filter((a) => a.createdAt).map(fromBooking)]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, MAX_ITEMS);

  if (items.length === 0) {
    return (
      <Stack sx={{ alignItems: 'center', textAlign: 'center', py: 4, gap: 1 }}>
        <IconTile icon={HistoryRoundedIcon} tone="neutral" />
        <Typography variant="body2" color="text.secondary">
          No recent activity yet.
        </Typography>
      </Stack>
    );
  }

  return (
    <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 1.75 }}>
      {items.map((item) => (
        <Stack component="li" key={item.key} direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
          <IconTile icon={item.icon} tone={item.tone} size={36} />
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography noWrap sx={{ fontSize: 14, fontWeight: 700, color: item.tone === 'danger' ? 'dangerChip.main' : 'text.primary' }}>
              {item.title}
            </Typography>
            <Typography noWrap color="text.secondary" sx={{ fontSize: 12.5 }}>
              {item.detail}
            </Typography>
          </Box>
          <Typography component="time" dateTime={item.at} color="text.secondary" sx={{ fontSize: 12, flex: 'none', whiteSpace: 'nowrap' }}>
            {relativeTime(item.at, { now })}
          </Typography>
        </Stack>
      ))}
    </Box>
  );
}
