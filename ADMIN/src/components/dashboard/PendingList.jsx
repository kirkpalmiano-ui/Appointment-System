import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import IconAction from '../ui/IconAction';
import UserAvatar from '../ui/UserAvatar';
import { formatTime, relativeDay } from '../../utils/format';

function Row({ appt, onConfirm, onDecline }) {
  const client = appt.user?.name ?? 'Deleted user';
  return (
    <Stack
      direction="row"
      spacing={1.5}
      sx={{ alignItems: 'center', px: 2.5, py: 1.5, borderTop: '1px solid', borderColor: 'divider', '&:hover': { bgcolor: 'hover.main' } }}
    >
      <Box sx={{ width: 78, flex: 'none' }}>
        <Typography noWrap sx={{ fontSize: 13, fontWeight: 700 }}>
          {relativeDay(appt.date)}
        </Typography>
        <Typography noWrap color="text.secondary" sx={{ fontSize: 12 }}>
          {formatTime(appt.startTime)}
        </Typography>
      </Box>
      <UserAvatar id={appt.user?._id} name={client} unknown={!appt.user} size={34} sx={{ display: { xs: 'none', sm: 'inline-grid' } }} />
      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <Typography noWrap sx={{ fontSize: 14, fontWeight: 700 }}>
          {client}
        </Typography>
        <Typography noWrap color="text.secondary" sx={{ fontSize: 12.5 }}>
          {appt.service?.name ?? '—'} · {appt.staff?.name ?? '—'}
        </Typography>
      </Box>
      <Stack direction="row" spacing={0.75} sx={{ flex: 'none', alignItems: 'center', whiteSpace: 'nowrap' }}>
        <Button
          size="small"
          onClick={() => onConfirm(appt)}
          startIcon={<CheckRoundedIcon sx={{ fontSize: '16px !important' }} />}
          aria-label={`Confirm ${client}'s booking`}
          sx={{
            bgcolor: 'successChip.light',
            color: 'successChip.main',
            px: 1.5,
            minWidth: 0,
            // Icon-only where the column is narrow (phones, and 1280–1439 beside the chart); the aria-label still names it.
            '& .MuiButton-startIcon': { mr: { xs: 0, sm: 0.75, lg: 0, xl: 0.75 }, ml: { xs: 0, sm: -0.5, lg: 0, xl: -0.5 } },
            '&:hover': { bgcolor: 'successChip.light', filter: 'brightness(0.96)' },
            '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'successChip.main', outlineOffset: 2 },
          }}
        >
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline', lg: 'none', xl: 'inline' } }}>
            Confirm
          </Box>
        </Button>
        <IconAction label={`Decline ${client}'s booking`} tone="danger" onClick={() => onDecline(appt)}>
          <CloseRoundedIcon />
        </IconAction>
      </Stack>
    </Stack>
  );
}

/** Pending upcoming bookings with Confirm / Decline. `items === null` shows skeleton rows. */
export default function PendingList({ items, onConfirm, onDecline }) {
  if (items === null) {
    return (
      <Box sx={{ px: 2.5, pb: 2 }}>
        {[1, 2, 3, 4].map((n) => (
          <Skeleton key={n} variant="rounded" height={44} sx={{ mt: 1.5, borderRadius: '12px' }} />
        ))}
      </Box>
    );
  }
  if (items.length === 0) {
    return (
      <Stack sx={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', py: 6, px: 2, height: '100%' }}>
        <Typography sx={{ fontSize: 28, mb: 1 }} aria-hidden>
          🎉
        </Typography>
        <Typography sx={{ fontWeight: 800 }}>No pending bookings</Typography>
        <Typography variant="body2" color="text.secondary">
          New requests will show up here.
        </Typography>
      </Stack>
    );
  }
  return (
    <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }} aria-label="Bookings awaiting confirmation">
      {items.map((appt) => (
        <Box component="li" key={appt._id}>
          <Row appt={appt} onConfirm={onConfirm} onDecline={onDecline} />
        </Box>
      ))}
    </Box>
  );
}
