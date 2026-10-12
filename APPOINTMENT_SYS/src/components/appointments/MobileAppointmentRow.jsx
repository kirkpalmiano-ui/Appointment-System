import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import DateBox from '../app/DateBox';
import StatusChip, { SoftChip } from '../StatusChip';
import { isActive } from '../../utils/appointments';
import { countdownLabel, formatDate, formatTime } from '../../utils/format';
import { dateTone, focusRing, reducedMotion } from './appointmentUi';

// Mobile: one appointment as a tappable card. Opens the details sheet.
export default function MobileAppointmentRow({ appointment: appt, onSelect }) {
  const countdown = isActive(appt) ? countdownLabel(appt.date) : '';
  const serviceName = appt.service?.name ?? 'Service removed';

  return (
    <ButtonBase
      onClick={() => onSelect(appt)}
      aria-haspopup="dialog"
      aria-label={`${appt.service?.name ?? 'Appointment'} on ${formatDate(appt.date)} at ${formatTime(appt.startTime)}`}
      sx={[
        {
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: 1.5,
          p: 1.5,
          textAlign: 'left',
          borderRadius: '20px',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'field.main',
          transition: 'border-color 150ms',
          '&:hover': { borderColor: 'text.disabled' },
        },
        focusRing,
        reducedMotion,
      ]}
    >
      <DateBox date={appt.date} tone={dateTone(appt)} size={56} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          noWrap
          sx={{
            fontWeight: 700,
            fontSize: 15.5,
            textDecoration: appt.status === 'cancelled' ? 'line-through' : 'none',
            textDecorationColor: 'currentColor',
          }}
        >
          {serviceName}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap sx={{ mt: 0.25 }}>
          {appt.staff?.name ?? 'Staff removed'} · {formatTime(appt.startTime)}
        </Typography>
        <Stack direction="row" spacing={0.75} useFlexGap sx={{ mt: 0.75, flexWrap: 'wrap', rowGap: 0.5 }}>
          <StatusChip status={appt.status} />
          {countdown && <SoftChip tone="accent">{countdown}</SoftChip>}
        </Stack>
      </Box>
      <ChevronRightRoundedIcon aria-hidden sx={{ color: 'text.secondary', flex: 'none' }} />
    </ButtonBase>
  );
}
