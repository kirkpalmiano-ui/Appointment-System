import { Link as RouterLink } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import AddToCalendarButton from '../app/AddToCalendarButton';
import Eyebrow from '../app/Eyebrow';
import StatusChip from '../StatusChip';
import { countdownLabel, formatTime, initials, parseDate } from '../../utils/format';

const STEPS = ['Requested', 'Clinic review', 'Confirmed', 'Visit'];

// Mobile card frame: 22px radius, 16px padding.
function Frame({ children }) {
  return <Card sx={{ borderRadius: '22px', p: 2 }}>{children}</Card>;
}

// Compact fact tile; `highlight` fills it with the brand colour.
function Tile({ label, value, highlight }) {
  return (
    <Box
      sx={{
        minWidth: 0,
        p: 1.25,
        borderRadius: '14px',
        border: 1,
        borderColor: highlight ? 'primary.main' : 'divider',
        bgcolor: highlight ? 'primary.main' : 'field.main',
        color: highlight ? 'primary.contrastText' : 'text.primary',
      }}
    >
      <Eyebrow sx={[{ fontSize: 10.5 }, highlight && { color: 'inherit', opacity: 0.85 }]}>{label}</Eyebrow>
      <Typography sx={{ fontWeight: 800, fontSize: { xs: 14.5, sm: 16 }, lineHeight: 1.2, mt: 0.25, letterSpacing: '-0.01em', overflowWrap: 'anywhere' }}>
        {value}
      </Typography>
    </Box>
  );
}

// Four labels above a 4-segment progress bar: done = brand, current = amber, future = divider.
function CompactTracker({ status }) {
  const current = status === 'confirmed' ? 3 : 1;
  return (
    <Box
      component="ol"
      role="list"
      aria-label="Booking progress"
      sx={{ display: 'grid', gridTemplateColumns: `repeat(${STEPS.length}, minmax(0, 1fr))`, columnGap: 0.75, listStyle: 'none', m: 0, p: 0 }}
    >
      {STEPS.map((label, i) => {
        const done = i < current;
        const isCurrent = i === current;
        return (
          <Box
            component="li"
            key={label}
            aria-current={isCurrent ? 'step' : undefined}
            aria-label={`${label}: ${done ? 'done' : isCurrent ? 'current step' : 'not yet'}`}
            sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 0.75, minWidth: 0 }}
          >
            <Typography
              aria-hidden
              sx={{
                fontSize: 11,
                lineHeight: 1.25,
                fontWeight: isCurrent ? 800 : 600,
                color: done || isCurrent ? 'text.primary' : 'text.secondary',
              }}
            >
              {label}
            </Typography>
            <Box
              aria-hidden
              sx={{
                height: 6,
                borderRadius: 999,
                bgcolor: done ? 'primary.main' : isCurrent ? 'pendingChip.main' : 'divider',
              }}
            />
          </Box>
        );
      })}
    </Box>
  );
}

// Mobile "Your next visit" card. `appointment` undefined = loading, null = nothing booked.
export default function MobileNextVisitCard({ appointment, onReschedule, onCancel }) {
  if (appointment === undefined) {
    return (
      <Frame>
        <Skeleton width={110} />
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', my: 2 }}>
          <Skeleton variant="circular" width={44} height={44} />
          <Box sx={{ flex: 1 }}>
            <Skeleton width="65%" height={28} />
            <Skeleton width="45%" />
          </Box>
        </Stack>
        <Skeleton variant="rounded" height={58} sx={{ borderRadius: '14px', mb: 2 }} />
        <Skeleton variant="rounded" height={44} sx={{ borderRadius: 999 }} />
      </Frame>
    );
  }

  if (!appointment) {
    return (
      <Frame>
        <Eyebrow>Your next visit</Eyebrow>
        <Box sx={{ py: 3, textAlign: 'center' }}>
          <Typography component="h2" sx={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', mb: 0.75 }}>
            Nothing booked yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 320, mx: 'auto', mb: 2.5 }}>
            Pick a service and a time that suits you. Your upcoming visit will show up right here.
          </Typography>
          <Button component={RouterLink} to="/book" variant="contained" startIcon={<AddRoundedIcon />} sx={{ minHeight: 44 }}>
            Book your first visit
          </Button>
        </Box>
      </Frame>
    );
  }

  const { service, staff, status, date, startTime } = appointment;
  const d = parseDate(date);
  return (
    <Frame>
      <Stack direction="row" useFlexGap sx={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Eyebrow>Your next visit</Eyebrow>
        <StatusChip status={status} label={status === 'pending' ? 'Awaiting confirmation' : 'Confirmed'} />
      </Stack>

      {/* Service + specialist */}
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mt: 1.75, mb: 2 }}>
        <Avatar sx={{ width: 44, height: 44, bgcolor: 'accent.main', color: 'accent.contrastText', fontWeight: 800, fontSize: 15 }}>
          {initials(staff?.name)}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography component="h2" sx={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            {service?.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            with {staff?.name}
            {staff?.specialization ? ` · ${staff.specialization}` : ''}
          </Typography>
        </Box>
      </Stack>

      {/* Date, time, countdown */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1, mb: 2 }}>
        <Tile
          highlight
          label={d.toLocaleDateString('en-US', { weekday: 'short' })}
          value={d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        />
        <Tile label="Time" value={formatTime(startTime)} />
        <Tile label="Starts" value={countdownLabel(date) || 'Today'} />
      </Box>

      <CompactTracker status={status} />

      {/* Actions */}
      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
        <AddToCalendarButton appointment={appointment} sx={{ flex: 1, minWidth: 0, px: 1.75, whiteSpace: 'nowrap' }} />
        <Button variant="outlined" onClick={() => onReschedule(appointment)} sx={{ flex: 'none', px: 1.75 }}>
          Reschedule
        </Button>
      </Stack>
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
        <Button color="error" size="small" onClick={() => onCancel(appointment)} sx={{ minHeight: 44, px: 2 }}>
          Cancel appointment
        </Button>
      </Box>
    </Frame>
  );
}
