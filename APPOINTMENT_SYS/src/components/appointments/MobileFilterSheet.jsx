import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import MobileSheet from '../mobile/MobileSheet';
import { STATUS_META } from '../../utils/appointments';

// 16px text so iOS doesn't zoom into the field; 48px tall for easy tapping.
const FIELD_SX = { '& .MuiInputBase-input': { fontSize: 16, minHeight: 24, py: 1.5 } };

// Mobile: Scope / Status / Sort filters in a bottom sheet. Changes apply right away
// (they go straight into the URL like on desktop); "Done" just closes the sheet.
// Native selects: the phone's own picker, which fits the sheet better than a popover menu.
export default function MobileFilterSheet({ open, onClose, scopes, scope, onScopeChange, status, onStatusChange, showStatus, sort, onSortChange }) {
  return (
    <MobileSheet
      open={open}
      onClose={onClose}
      title="Filter"
      footer={
        <Button variant="contained" fullWidth onClick={onClose} sx={{ minHeight: 48 }}>
          Done
        </Button>
      }
    >
      <Stack spacing={2.5} sx={{ pt: 1.5 }}>
        <TextField
          select
          fullWidth
          label="Show"
          value={scope}
          onChange={(e) => onScopeChange(e.target.value)}
          sx={FIELD_SX}
          slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
        >
          {scopes.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </TextField>
        {showStatus && (
          <TextField
            select
            fullWidth
            label="Status"
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            sx={FIELD_SX}
            slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
          >
            <option value="">All statuses</option>
            {Object.entries(STATUS_META).map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.label}
              </option>
            ))}
          </TextField>
        )}
        <TextField
          select
          fullWidth
          label="Sort"
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          sx={FIELD_SX}
          slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
        >
          <option value="asc">Soonest first</option>
          <option value="desc">Latest first</option>
        </TextField>
      </Stack>
    </MobileSheet>
  );
}
