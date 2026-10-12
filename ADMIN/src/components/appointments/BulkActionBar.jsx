import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import EditCalendarRoundedIcon from '@mui/icons-material/EditCalendarRounded';
import EventBusyRoundedIcon from '@mui/icons-material/EventBusyRounded';
import { isActive } from '../../utils/appointments';

/**
 * Accent-tinted bar above the table while rows are selected. Each action only
 * targets the selected rows it is valid for (e.g. Confirm → pending ones), and
 * says so when that is fewer than the whole selection.
 */
export default function BulkActionBar({ rows, busy, onConfirm, onReschedule, onCancel, onClear }) {
  const pending = rows.filter((a) => a.status === 'pending');
  const active = rows.filter(isActive);
  const partial = (list) => (list.length && list.length < rows.length ? ` (${list.length})` : '');

  return (
    <Box
      role="region"
      aria-label="Bulk actions"
      sx={{ mx: 2, mb: 1.5, px: 1.5, py: 1, borderRadius: '14px', bgcolor: 'accent.main', color: 'accent.contrastText' }}
    >
      <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography aria-live="polite" sx={{ fontWeight: 800, fontSize: 14, mr: 1, pl: 0.5 }}>
          {rows.length} selected
        </Typography>
        <Button size="small" variant="contained" startIcon={<CheckRoundedIcon />} disabled={busy || !pending.length} onClick={() => onConfirm(pending)}>
          Confirm selected{partial(pending)}
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<EditCalendarRoundedIcon />}
          disabled={busy || rows.length !== 1 || !active.length}
          title={rows.length !== 1 ? 'Select exactly one appointment to reschedule' : undefined}
          onClick={() => onReschedule(rows[0])}
        >
          Reschedule
        </Button>
        <Button size="small" variant="outlined" color="error" startIcon={<EventBusyRoundedIcon />} disabled={busy || !active.length} onClick={() => onCancel(active)}>
          Cancel selected{partial(active)}
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button size="small" color="inherit" startIcon={<CloseRoundedIcon />} onClick={onClear} disabled={busy}>
          Clear selection
        </Button>
      </Stack>
    </Box>
  );
}
