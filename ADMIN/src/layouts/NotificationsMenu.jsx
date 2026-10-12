import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded';
import GppMaybeRoundedIcon from '@mui/icons-material/GppMaybeRounded';
import IconAction from '../components/ui/IconAction';
import { IconTile } from '../components/ui/StatCard';
import { relativeTime } from '../utils/time';

// Bell in the top bar. There is no notifications API, so it lists what needs attention
// right now (pending bookings, recent failed sign-ins); the red dot shows when either exists.
export default function NotificationsMenu({ pending, failedSignIns, failedLatest }) {
  const [anchor, setAnchor] = useState(null);
  const items = [
    pending > 0 && {
      to: '/appointments?status=pending',
      icon: PendingActionsRoundedIcon,
      tone: 'pending',
      title: `${pending} booking${pending === 1 ? '' : 's'} need${pending === 1 ? 's' : ''} confirmation`,
      detail: 'Review and confirm or decline them.',
    },
    failedSignIns > 0 && {
      to: '/audit-log?success=false',
      icon: GppMaybeRoundedIcon,
      tone: 'danger',
      title: `${failedSignIns} failed sign-in${failedSignIns === 1 ? '' : 's'} in 24 hours`,
      detail: failedLatest ? `Latest ${relativeTime(failedLatest.createdAt)}${failedLatest.ip ? ` from ${failedLatest.ip}` : ''}` : '',
    },
  ].filter(Boolean);

  return (
    <>
      <Badge variant="dot" color="error" invisible={!items.length} overlap="circular" sx={{ '& .MuiBadge-dot': { top: 6, right: 6 } }}>
        <IconAction
          label={items.length ? `Notifications (${items.length} new)` : 'Notifications'}
          size={38}
          sx={{ borderRadius: '12px' }}
          onClick={(e) => setAnchor(e.currentTarget)}
          aria-haspopup="dialog"
        >
          <NotificationsNoneRoundedIcon />
        </IconAction>
      </Badge>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { mt: 1, width: 340, maxWidth: 'calc(100vw - 24px)', border: 1, borderColor: 'divider', p: 1 } } }}
      >
        <Typography sx={{ fontWeight: 800, px: 1.25, pt: 0.75, pb: 1 }}>Notifications</Typography>
        {items.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ px: 1.25, pb: 1.5 }}>
            You&apos;re all caught up. 🎉
          </Typography>
        ) : (
          items.map((n) => (
            <MenuItem key={n.to} component={RouterLink} to={n.to} onClick={() => setAnchor(null)} sx={{ gap: 1.5, py: 1.25, alignItems: 'flex-start', whiteSpace: 'normal' }}>
              <IconTile icon={n.icon} tone={n.tone} size={34} />
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{n.title}</Typography>
                {n.detail && (
                  <Typography variant="body2" color="text.secondary">
                    {n.detail}
                  </Typography>
                )}
              </Box>
            </MenuItem>
          ))
        )}
      </Popover>
    </>
  );
}
