import { Link as RouterLink } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import AddToCalendarButton from '../app/AddToCalendarButton';
import Eyebrow from '../app/Eyebrow';
import StatusChip from '../StatusChip';
import { isActive } from '../../utils/appointments';
import { formatDate, formatPrice, formatTimeRange, initials } from '../../utils/format';
import InfoTile from './InfoTile';
import { BEFORE_VISIT, bookAgainPath, refNo } from './appointmentUi';

// Selected appointment: who/what/when, tips and the actions that apply.
// Rendered inside a sticky Card on large screens and inside a Drawer below that.
export default function AppointmentDetailsPanel({ appointment: appt, onClose, onReschedule, onCancel, onDelete, titleId }) {
  if (!appt) {
    return (
      <Box sx={{ textAlign: 'center', py: 8, px: 3 }}>
        <EventNoteRoundedIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1.5 }} />
        <Typography sx={{ fontWeight: 600 }}>No appointment selected</Typography>
        <Typography variant="body2" color="text.secondary">
          Pick an appointment from the list to see its details.
        </Typography>
      </Box>
    );
  }

  const active = isActive(appt);
  const staffName = appt.staff?.name ?? 'Staff removed';

  return (
    <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Eyebrow>Appointment details</Eyebrow>
        <IconButton aria-label="Close details" onClick={onClose} size="small" edge="end">
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </Stack>

      <Typography
        id={titleId}
        component="h2"
        sx={{ fontSize: { xs: 24, sm: 28 }, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15, overflowWrap: 'anywhere' }}
      >
        {appt.service?.name ?? 'Service removed'}
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
        <StatusChip status={appt.status} />
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.25, mt: 2.5 }}>
        <InfoTile label="Date">{formatDate(appt.date, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}</InfoTile>
        <InfoTile label="Time">{formatTimeRange(appt.startTime, appt.endTime)}</InfoTile>
        <InfoTile label="Fee">{appt.service ? formatPrice(appt.service.price) : '—'}</InfoTile>
        <InfoTile label="Ref no.">{refNo(appt)}</InfoTile>
      </Box>

      {appt.notes && (
        <Box sx={{ mt: 2.5 }}>
          <Eyebrow>Your notes</Eyebrow>
          <Typography variant="body2" sx={{ mt: 0.75, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
            {appt.notes}
          </Typography>
        </Box>
      )}

      {/* No map/location block: the app has no clinic location data (owner chose to skip it). TODO(backend) if added. */}
      {active && (
        <Box sx={{ mt: 2.5 }}>
          <Eyebrow>Before your visit</Eyebrow>
          <Stack component="ul" spacing={1} sx={{ listStyle: 'none', p: 0, m: 0, mt: 1 }}>
            {BEFORE_VISIT.map((tip) => (
              <Stack component="li" key={tip} direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                <CheckCircleOutlineRoundedIcon aria-hidden sx={{ fontSize: 18, color: 'primary.main', mt: '2px' }} />
                <Typography variant="body2">{tip}</Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      )}

      <Stack spacing={1.25} sx={{ mt: 3 }}>
        {active ? (
          <>
            <AddToCalendarButton appointment={appt} fullWidth />
            <Stack direction="row" spacing={1.25}>
              <Button variant="outlined" fullWidth onClick={() => onReschedule(appt)}>
                Reschedule
              </Button>
              <Button variant="outlined" color="error" fullWidth onClick={() => onCancel(appt)}>
                Cancel
              </Button>
            </Stack>
          </>
        ) : (
          <>
            <Button variant="contained" fullWidth component={RouterLink} to={bookAgainPath(appt)}>
              Book again
            </Button>
            <Button variant="outlined" color="error" fullWidth onClick={() => onDelete(appt)}>
              Remove from history
            </Button>
          </>
        )}
      </Stack>

      {appt.createdAt && (
        <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 2, textAlign: 'center' }}>
          Booked on {new Date(appt.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
        </Typography>
      )}
    </Box>
  );
}
