import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import MobileSheet from './MobileSheet';

// Notifications list for the mobile "Alerts" tab / bell.
// TODO(backend): there's no notifications API yet, so this shows an honest empty state.
export default function NotificationsSheet({ open, onClose }) {
  return (
    <MobileSheet open={open} onClose={onClose} title="Notifications">
      <Box sx={{ textAlign: 'center', py: 5 }}>
        <NotificationsNoneRoundedIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
        <Typography sx={{ fontWeight: 700 }}>No notifications yet</Typography>
        <Typography variant="body2" color="text.secondary">
          Booking updates will show up here.
        </Typography>
      </Box>
    </MobileSheet>
  );
}
