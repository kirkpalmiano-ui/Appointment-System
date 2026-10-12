import { useId, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { formatDate } from '../../utils/format';

const short = (d) => formatDate(d, { month: 'short', day: 'numeric' });

function rangeLabel(from, to) {
  if (from && to) return from === to ? short(from) : `${short(from)} – ${short(to)}`;
  if (from) return `From ${short(from)}`;
  if (to) return `Until ${short(to)}`;
  return 'Any';
}

/**
 * "Dates: Oct 1 – Oct 12 ▾" pill that opens a small popover with From / To inputs.
 * Values are YYYY-MM-DD strings; `reversed` flags a From later than To.
 */
export default function DateRangeButton({ from, to, reversed, onChange }) {
  const [anchor, setAnchor] = useState(null);
  const id = useId();
  const set = from || to;

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        onClick={(e) => setAnchor(e.currentTarget)}
        aria-haspopup="dialog"
        aria-expanded={Boolean(anchor)}
        aria-controls={anchor ? id : undefined}
        startIcon={<CalendarMonthRoundedIcon sx={{ color: set ? 'primary.main' : 'text.secondary' }} />}
        endIcon={<ExpandMoreRoundedIcon />}
        sx={{ minHeight: 40, fontWeight: 600, flex: 'none' }}
      >
        <Box component="span" sx={{ color: 'text.secondary', mr: 0.5 }}>
          Dates:
        </Box>
        {rangeLabel(from, to)}
      </Button>
      <Popover
        id={id}
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{ paper: { role: 'dialog', 'aria-label': 'Date range', sx: { p: 2, mt: 1, width: 280, borderRadius: '16px', border: 1, borderColor: 'divider' } } }}
      >
        <Stack spacing={1.5}>
          <TextField
            type="date"
            size="small"
            label="From"
            value={from}
            onChange={(e) => onChange({ from: e.target.value })}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: to || undefined } }}
          />
          <TextField
            type="date"
            size="small"
            label="To"
            value={to}
            onChange={(e) => onChange({ to: e.target.value })}
            error={reversed}
            helperText={reversed ? 'Earlier than From: showing the range in order' : undefined}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: from || undefined } }}
          />
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
            <Button size="small" color="inherit" disabled={!set} onClick={() => onChange({ from: '', to: '' })}>
              Clear dates
            </Button>
            <Button size="small" variant="contained" onClick={() => setAnchor(null)}>
              Done
            </Button>
          </Stack>
        </Stack>
      </Popover>
    </>
  );
}
