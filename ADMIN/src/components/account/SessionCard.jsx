import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import SectionCard from '../ui/SectionCard';
import useCountdown from '../../hooks/useCountdown';
import { IDLE_MINUTES, SESSION_SECONDS } from '../../utils/session';
import { clockTime, formatDurationShort } from '../../utils/time';

const RING = 116;

// Time left in this admin session as a ring, with the end time and a sign-out button.
// TODO(backend): an "Extend session" button needs a token-refresh endpoint (none exists; sessions are fixed at 2 hours).
export default function SessionCard({ sessionEndsAt, onSignOut, signingOut }) {
  const secondsLeft = useCountdown(sessionEndsAt);
  const pct = sessionEndsAt ? Math.min(100, (secondsLeft / SESSION_SECONDS) * 100) : 0;
  const low = secondsLeft > 0 && secondsLeft <= 10 * 60;

  return (
    <SectionCard title="Current session">
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} sx={{ alignItems: { sm: 'center' } }}>
        <Box
          role="progressbar"
          aria-label="Session time left"
          aria-valuemin={0}
          aria-valuemax={SESSION_SECONDS}
          aria-valuenow={secondsLeft}
          aria-valuetext={sessionEndsAt ? `${formatDurationShort(secondsLeft)} left` : 'Unknown'}
          sx={{ position: 'relative', width: RING, height: RING, flex: 'none' }}
        >
          {/* Track, then the remaining time on top. */}
          <CircularProgress variant="determinate" value={100} size={RING} thickness={4} sx={{ position: 'absolute', inset: 0, color: 'hover.main' }} aria-hidden />
          <CircularProgress
            variant="determinate"
            value={pct}
            size={RING}
            thickness={4}
            color={low ? 'warning' : 'primary'}
            sx={{ position: 'absolute', inset: 0, '& .MuiCircularProgress-circle': { strokeLinecap: 'round' } }}
            aria-hidden
          />
          <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeContent: 'center', textAlign: 'center' }}>
            <Typography sx={{ fontWeight: 800, fontSize: 22, letterSpacing: '-0.03em', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
              {sessionEndsAt ? formatDurationShort(secondsLeft) : '—'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              left
            </Typography>
          </Box>
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700 }}>Signed in on this device</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
            {sessionEndsAt ? `Ends at ${clockTime(sessionEndsAt)}, or after ${IDLE_MINUTES} minutes idle.` : `Ends after ${IDLE_MINUTES} minutes idle.`}
          </Typography>
          <Button variant="outlined" size="small" onClick={onSignOut} disabled={signingOut} startIcon={<LogoutRoundedIcon />}>
            {signingOut ? 'Signing out...' : 'Sign out'}
          </Button>
        </Box>
      </Stack>
    </SectionCard>
  );
}
