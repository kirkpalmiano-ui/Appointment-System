import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import StatusChip from '../StatusChip';
import SoftChip from '../ui/SoftChip';
import UserAvatar from '../ui/UserAvatar';
import { formatDate, formatDuration, formatPhone, formatPrice, formatTimeRange } from '../../utils/format';
import { ACTIONS, availableActions, isToday } from './actions';

function Detail({ label, children }) {
  return (
    <Box>
      <Typography sx={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'text.secondary', mb: 0.5 }}>{label}</Typography>
      <Typography component="div">{children}</Typography>
    </Box>
  );
}

// Read-only view of one appointment (from the loaded row, no extra request) with its actions.
export default function AppointmentDetailsDialog({ appointment: details, onClose, onAction }) {
  return (
    <Dialog open={Boolean(details)} onClose={onClose} maxWidth="xs" fullWidth>
      {details && (
        <>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, fontWeight: 800, letterSpacing: '-0.02em' }}>
            Appointment
            <StatusChip status={details.status} />
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2.25}>
              <Detail label="When">
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                  <Box component="span" sx={{ fontWeight: 700 }}>
                    {formatDate(details.date, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </Box>
                  {isToday(details) && <SoftChip tone="accent">Today</SoftChip>}
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {formatTimeRange(details.startTime, details.endTime)}
                </Typography>
              </Detail>
              <Detail label="Client">
                <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                  <UserAvatar id={details.user?._id} name={details.user?.name} unknown={!details.user} size={34} />
                  <Box sx={{ minWidth: 0 }}>
                    <Box sx={{ fontWeight: 700 }}>{details.user?.name ?? 'Deleted user'}</Box>
                    <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                      {details.user?.email}
                      {details.user?.phone ? ` · ${formatPhone(details.user.phone)}` : ''}
                    </Typography>
                  </Box>
                </Stack>
              </Detail>
              <Detail label="Service">
                {details.service?.name ?? 'Service removed'}
                {details.service && (
                  <Typography variant="body2" color="text.secondary">
                    {formatDuration(details.service.durationMinutes)} · {formatPrice(details.service.price)}
                  </Typography>
                )}
              </Detail>
              <Detail label="Specialist">
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <UserAvatar id={details.staff?._id} name={details.staff?.name} unknown={!details.staff} size={26} />
                  <span>{details.staff?.name ?? 'Staff removed'}</span>
                </Stack>
              </Detail>
              <Divider />
              <Detail label="Client notes">
                <Typography sx={{ whiteSpace: 'pre-wrap', color: details.notes ? 'text.primary' : 'text.disabled' }}>{details.notes || 'No notes'}</Typography>
              </Detail>
              <Detail label="Staff notes (private, never shown to the client)">
                <Typography sx={{ whiteSpace: 'pre-wrap', color: details.staffNotes ? 'text.primary' : 'text.disabled' }}>{details.staffNotes || 'None'}</Typography>
              </Detail>
              <Typography variant="caption" color="text.secondary">
                Booked {new Date(details.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
              </Typography>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, flexWrap: 'wrap', gap: 1 }}>
            {availableActions(details)
              .filter((a) => a !== 'delete')
              .map((key) => (
                <Button key={key} size="small" onClick={() => onAction(key, details)} color={ACTIONS[key].color}>
                  {ACTIONS[key].label}
                </Button>
              ))}
            <Button size="small" onClick={onClose} variant="contained">
              Close
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
