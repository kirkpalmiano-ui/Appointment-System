import { Link as RouterLink } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditCalendarRoundedIcon from '@mui/icons-material/EditCalendarRounded';
import AddToCalendarButton from '../app/AddToCalendarButton';
import Eyebrow from '../app/Eyebrow';
import StatusChip from '../StatusChip';
import { countdownLabel, formatDuration, formatTime, initials, parseDate } from '../../utils/format';
import StatusTracker from './StatusTracker';

// One small fact tile ("TIME / 10:30 AM"); `highlight` fills it with the brand colour.
function InfoTile({ label, value, highlight }) {
  return (
    <Box
      sx={{
        p: 1.75,
        borderRadius: '16px',
        border: 1,
        minWidth: 0,
        borderColor: highlight ? 'primary.main' : 'divider',
        bgcolor: highlight ? 'primary.main' : 'field.main',
        color: highlight ? 'primary.contrastText' : 'text.primary',
      }}
    >
      <Eyebrow sx={highlight ? { color: 'inherit', opacity: 0.85 } : undefined}>{label}</Eyebrow>
      <Typography sx={{ fontWeight: 800, fontSize: 17, mt: 0.25, letterSpacing: '-0.01em' }} noWrap>
        {value}
      </Typography>
    </Box>
  );
}

// Card frame with the soft lavender glow in the top-right corner.
function HeroFrame({ children }) {
  return (
    <Card sx={{ position: 'relative', overflow: 'hidden', height: '100%' }}>
      <Box
        aria-hidden
        sx={(theme) => ({
          position: 'absolute',
          top: -90,
          right: -90,
          width: 260,
          height: 260,
          borderRadius: '50%',
          bgcolor: 'primary.light',
          filter: 'blur(60px)',
          opacity: 0.3,
          pointerEvents: 'none',
          ...theme.applyStyles('dark', { opacity: 0.22 }),
        })}
      />
      <CardContent sx={{ position: 'relative', p: { xs: 2.5, sm: 3.5 }, '&:last-child': { pb: { xs: 2.5, sm: 3.5 } } }}>{children}</CardContent>
    </Card>
  );
}

// Hero card for the soonest active visit, with its progress and quick actions.
// `appointment` undefined = loading, null = nothing booked.
export default function NextVisitCard({ appointment, onReschedule, onCancel }) {
  if (appointment === undefined) {
    return (
      <HeroFrame>
        <Skeleton width={120} />
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', my: 3 }}>
          <Skeleton variant="circular" width={56} height={56} />
          <Box sx={{ flex: 1 }}>
            <Skeleton width="60%" height={36} />
            <Skeleton width="40%" />
          </Box>
        </Stack>
        <Skeleton variant="rounded" height={72} sx={{ borderRadius: '16px', mb: 3 }} />
        <Skeleton variant="rounded" height={46} sx={{ borderRadius: 999 }} />
      </HeroFrame>
    );
  }

  if (!appointment) {
    return (
      <HeroFrame>
        <Eyebrow>Your next visit</Eyebrow>
        <Box sx={{ py: { xs: 4, md: 6 }, textAlign: 'center' }}>
          <Typography component="h2" sx={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', mb: 1 }}>
            Nothing booked yet
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 380, mx: 'auto', mb: 3 }}>
            Pick a service and a time that suits you. Your upcoming visit will show up right here.
          </Typography>
          <Button component={RouterLink} to="/book" variant="contained" startIcon={<AddRoundedIcon />}>
            Book your first visit
          </Button>
        </Box>
      </HeroFrame>
    );
  }

  const { service, staff, status, date, startTime } = appointment;
  const d = parseDate(date);
  return (
    <HeroFrame>
      <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Eyebrow>Your next visit</Eyebrow>
        <StatusChip status={status} label={status === 'pending' ? 'Awaiting confirmation' : 'Confirmed'} />
      </Stack>

      {/* Service + specialist */}
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mt: 2.5, mb: 3 }}>
        <Avatar sx={{ width: 56, height: 56, bgcolor: 'accent.main', color: 'accent.contrastText', fontWeight: 800, fontSize: 19 }}>
          {initials(staff?.name)}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography component="h2" sx={{ fontSize: { xs: 22, sm: 26 }, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            {service?.name}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.25 }}>
            with {staff?.name}
            {staff?.specialization ? ` · ${staff.specialization}` : ''}
          </Typography>
        </Box>
      </Stack>

      {/* Date, time, duration, countdown */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' }, gap: 1.5, mb: 3.5 }}>
        <InfoTile
          highlight
          label={d.toLocaleDateString('en-US', { weekday: 'short' })}
          value={d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        />
        <InfoTile label="Time" value={formatTime(startTime)} />
        <InfoTile label="Duration" value={service?.durationMinutes ? formatDuration(service.durationMinutes) : '—'} />
        <InfoTile label="Starts" value={countdownLabel(date) || 'Today'} />
      </Box>

      <StatusTracker status={status} />

      {/* Actions */}
      <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: 1.25, mt: 3.5 }}>
        <AddToCalendarButton appointment={appointment} />
        <Button variant="outlined" startIcon={<EditCalendarRoundedIcon />} onClick={() => onReschedule(appointment)}>
          Reschedule
        </Button>
        <Button variant="outlined" color="error" onClick={() => onCancel(appointment)} sx={{ ml: 'auto' }}>
          Cancel
        </Button>
      </Stack>
    </HeroFrame>
  );
}
