import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import SoftChip from '../ui/SoftChip';
import UserAvatar from '../ui/UserAvatar';
import { formatPhone } from '../../utils/format';
import { fullDateTime, signInLabel } from './format';

// Avatar + name (+ "You") over "email · phone".
export function UserIdentity({ user, isMe, size = 36 }) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
      <UserAvatar id={user._id} name={user.name} size={size} />
      <Box sx={{ minWidth: 0 }}>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', minWidth: 0 }}>
          <Typography noWrap sx={{ fontWeight: 700, fontSize: 14.5 }}>
            {user.name}
          </Typography>
          {isMe && <SoftChip tone="accent">You</SoftChip>}
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13, overflowWrap: 'anywhere' }}>
          {user.email}
          {/* The phone number never breaks in the middle; it moves to the next line as a whole. */}
          {user.phone && (
            <>
              {' · '}
              <Box component="span" sx={{ whiteSpace: 'nowrap' }}>
                {formatPhone(user.phone)}
              </Box>
            </>
          )}
        </Typography>
      </Box>
    </Stack>
  );
}

// Verified / unverified, plus the lockout chip after too many wrong passwords.
// TODO(backend): a "Resend email" link needs an admin endpoint that re-sends a user's
// verification code (only the public /auth/resend-otp exists, meant for the user themself).
export function StatusChips({ user }) {
  return (
    <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap' }}>
      {user.isVerified === false ? (
        <SoftChip tone="pending" dot>
          Unverified
        </SoftChip>
      ) : (
        <SoftChip tone="success" icon={<CheckRoundedIcon />}>
          Verified
        </SoftChip>
      )}
      {user.locked && (
        <Tooltip title="Locked for 15 minutes after too many wrong passwords">
          <SoftChip tone="danger" icon={<LockRoundedIcon />} tabIndex={0}>
            Locked
          </SoftChip>
        </Tooltip>
      )}
    </Stack>
  );
}

// Booking count. Staff and admins without bookings show "—".
// TODO(backend): a per-status breakdown (e.g. "2 pending") needs listUsers to return it.
export function BookingsValue({ user }) {
  const count = user.appointmentCount ?? 0;
  if (user.role !== 'client' && count === 0) {
    return (
      <Typography component="span" color="text.disabled">
        —
      </Typography>
    );
  }
  return (
    <Typography component="span" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
      {count}
    </Typography>
  );
}

// "Today" / "3 days ago" / muted "Never", with an optional IP line underneath.
export function LastSignIn({ value, ip }) {
  const label = signInLabel(value);
  if (!label) {
    return (
      <Typography variant="body2" color="text.disabled">
        Never
      </Typography>
    );
  }
  return (
    <Box>
      <Tooltip title={fullDateTime(value)}>
        <Typography variant="body2" component="span" sx={{ whiteSpace: 'nowrap' }}>
          {label}
        </Typography>
      </Tooltip>
      {ip && (
        <Typography color="text.secondary" sx={{ fontSize: 12, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}>
          {ip}
        </Typography>
      )}
    </Box>
  );
}
