import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import AddToCalendarButton from '../app/AddToCalendarButton';
import Eyebrow from '../app/Eyebrow';
import MobileSheet from '../mobile/MobileSheet';
import StatusChip from '../StatusChip';
import { isActive } from '../../utils/appointments';
import { formatDate, formatDuration, formatPrice, formatTimeRange, initials } from '../../utils/format';
import InfoTile from './InfoTile';
import { BEFORE_VISIT, bookAgainPath, refCode } from './appointmentUi';

const BIG_BUTTON = { minHeight: 48 };

// Mobile: the selected appointment in a bottom sheet (replaces the side panel / drawer).
export default function MobileAppointmentSheet({ appointment, onClose, onReschedule, onCancel, onDelete }) {
  // Keep showing the last appointment while the sheet slides away.
  const [shown, setShown] = useState(appointment);
  if (appointment && appointment !== shown) setShown(appointment);
  const appt = appointment ?? shown;

  if (!appt) return <MobileSheet open={false} onClose={onClose} ariaLabel="Appointment details" />;

  const active = isActive(appt);
  const staffName = appt.staff?.name ?? 'Staff removed';
  const serviceName = appt.service?.name ?? 'Service removed';

  const footer = active ? (
    <Stack spacing={1.25}>
      <AddToCalendarButton appointment={appt} fullWidth sx={BIG_BUTTON} />
      <Stack direction="row" spacing={1.25}>
        <Button variant="outlined" fullWidth onClick={() => onReschedule(appt)} sx={BIG_BUTTON}>
          Reschedule
        </Button>
        <Button variant="outlined" color="error" fullWidth onClick={() => onCancel(appt)} sx={BIG_BUTTON}>
          Cancel
        </Button>
      </Stack>
    </Stack>
  ) : (
    <Stack spacing={1.25}>
      <Button variant="contained" fullWidth component={RouterLink} to={bookAgainPath(appt)} sx={BIG_BUTTON}>
        Book again
      </Button>
      <Button variant="outlined" color="error" fullWidth onClick={() => onDelete(appt)} sx={BIG_BUTTON}>
        Remove from history
      </Button>
    </Stack>
  );

  return (
    <MobileSheet open={Boolean(appointment)} onClose={onClose} ariaLabel={`${serviceName} appointment details`} footer={footer}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', pt: 0.5 }}>
        <StatusChip status={appt.status} />
        <Typography variant="body2" color="text.secondary" sx={{ flex: 1, minWidth: 0, fontWeight: 600 }} noWrap>
          Ref {refCode(appt)}
        </Typography>
        <IconButton aria-label="Close details" onClick={onClose} edge="end" sx={{ width: 44, height: 44 }}>
          <CloseRoundedIcon />
        </IconButton>
      </Stack>

      <Typography
        component="h2"
        sx={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.2, mt: 1, overflowWrap: 'anywhere' }}
      >
        {serviceName}
      </Typography>

      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mt: 2 }}>
        <Avatar sx={{ width: 40, height: 40, bgcolor: 'accent.main', color: 'accent.contrastText', fontWeight: 700, fontSize: 14 }}>
          {initials(staffName)}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 600 }} noWrap>
            {staffName}
          </Typography>
          {appt.staff?.specialization && (
            <Typography variant="body2" color="text.secondary" noWrap>
              {appt.staff.specialization}
            </Typography>
          )}
        </Box>
      </Stack>

      {/* No "Where" tile: the app has no clinic location data (owner chose to skip it). */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.25, mt: 2.5 }}>
        <InfoTile label="Date">{formatDate(appt.date, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</InfoTile>
        <InfoTile label="Time">{formatTimeRange(appt.startTime, appt.endTime)}</InfoTile>
        <InfoTile label="Fee">{appt.service ? formatPrice(appt.service.price) : '—'}</InfoTile>
        <InfoTile label="Duration">{appt.service?.durationMinutes ? formatDuration(appt.service.durationMinutes) : '—'}</InfoTile>
      </Box>

      {appt.notes && (
        <Box sx={{ mt: 2.5 }}>
          <Eyebrow>Your notes</Eyebrow>
          <Typography variant="body2" sx={{ mt: 0.75, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
            {appt.notes}
          </Typography>
        </Box>
      )}

      {active && (
        <Box sx={{ mt: 2.5, p: 2, borderRadius: '16px', bgcolor: 'accent.main', color: 'accent.contrastText' }}>
          <Eyebrow sx={{ color: 'inherit' }}>Before your visit</Eyebrow>
          <Stack component="ul" spacing={1} sx={{ listStyle: 'none', p: 0, m: 0, mt: 1 }}>
            {BEFORE_VISIT.map((tip) => (
              <Stack component="li" key={tip} direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                <CheckCircleOutlineRoundedIcon aria-hidden sx={{ fontSize: 18, mt: '2px' }} />
                <Typography variant="body2" sx={{ color: 'inherit' }}>
                  {tip}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      )}

      {appt.createdAt && (
        <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 2, textAlign: 'center' }}>
          Booked on {new Date(appt.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
        </Typography>
      )}
    </MobileSheet>
  );
}
