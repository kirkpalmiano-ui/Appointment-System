import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import DateBox from '../app/DateBox';
import StatusChip, { SoftChip } from '../StatusChip';
import { isActive } from '../../utils/appointments';
import { clickable } from '../../utils/a11y';
import { countdownLabel, formatDate, formatDuration, formatTime } from '../../utils/format';
import { bookAgainPath, dateTone, focusRing, isFinished, reducedMotion } from './appointmentUi';

// One appointment in the My appointments list. Clicking (or Enter/Space) selects it;
// the buttons on the right don't trigger the selection.
export default function AppointmentRow({ appointment: appt, selected, onSelect, onDelete }) {
  const stop = (fn) => (e) => {
    e.stopPropagation();
    fn(appt);
  };
  const countdown = isActive(appt) ? countdownLabel(appt.date) : '';
  const meta = [
    appt.staff?.name ?? 'Staff removed',
    formatTime(appt.startTime),
    appt.service?.durationMinutes ? formatDuration(appt.service.durationMinutes) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Box
      {...clickable(() => onSelect(appt))}
      aria-pressed={selected}
      aria-label={`${appt.service?.name ?? 'Appointment'} on ${formatDate(appt.date)} at ${formatTime(appt.startTime)}`}
      sx={[
        {
          display: 'flex',
          alignItems: 'center',
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
          gap: { xs: 1.5, sm: 2 },
          p: { xs: 1.5, sm: 2 },
          borderRadius: '20px',
          border: '2px solid',
          borderColor: selected ? 'primary.main' : 'divider',
          bgcolor: 'field.main',
          cursor: 'pointer',
          transition: 'border-color 150ms, box-shadow 150ms',
          '&:hover': { borderColor: selected ? 'primary.main' : 'text.disabled' },
        },
        selected && { boxShadow: (t) => `0 0 0 4px rgba(${t.vars.palette.primary.mainChannel} / 0.12)` },
        focusRing,
        reducedMotion,
      ]}
    >
      <DateBox date={appt.date} tone={dateTone(appt)} size={56} />

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 0.5 }}>
          <Typography
            sx={{
              fontWeight: 700,
              minWidth: 0,
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textDecoration: appt.status === 'cancelled' ? 'line-through' : 'none',
              textDecorationColor: 'currentColor',
            }}
          >
            {appt.service?.name ?? 'Service removed'}
          </Typography>
          <StatusChip status={appt.status} />
        </Stack>
        <Typography variant="body2" color="text.secondary" noWrap sx={{ mt: 0.5 }}>
          {meta}
        </Typography>
      </Box>

      {(countdown || isFinished(appt)) && (
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: 'center', flex: 'none', ml: { xs: '68px', sm: 0 }, width: { xs: 'calc(100% - 68px)', sm: 'auto' } }}
        >
          {countdown && <SoftChip tone="accent">{countdown}</SoftChip>}
          {appt.status === 'completed' && (
            <Button
              size="small"
              variant="outlined"
              component={RouterLink}
              to={bookAgainPath(appt)}
              onClick={(e) => e.stopPropagation()}
            >
              Book again
            </Button>
          )}
          {isFinished(appt) && onDelete && (
            <Button
              size="small"
              color="inherit"
              onClick={stop(onDelete)}
              aria-label={`Remove ${appt.service?.name ?? 'appointment'} on ${formatDate(appt.date)} from history`}
              sx={{ color: 'text.secondary' }}
            >
              Remove
            </Button>
          )}
          {/* TODO(backend): a "Receipt" action once payments/receipts exist. */}
        </Stack>
      )}
    </Box>
  );
}
