import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Eyebrow from '../app/Eyebrow';
import { BUSINESS_TIMEZONE, formatTime } from '../../utils/format';
import { focusRingSx, handleRadioKeys, reducedMotionSx } from './radioKeys';

const PERIODS = [
  { label: 'Morning', test: (h) => h < 12 },
  { label: 'Afternoon', test: (h) => h >= 12 && h < 17 },
  { label: 'Evening', test: (h) => h >= 17 },
];

const REASONS = { booked: 'Already booked', unavailable: 'Not available', past: 'This time has passed' };

// 3 columns on phones and tablets, 4 on desktop.
const gridSx = { display: 'grid', gridTemplateColumns: { xs: 'repeat(3, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' }, gap: 1 };

const TIMEZONE_LABEL = BUSINESS_TIMEZONE === 'Asia/Manila' ? 'Manila (GMT+8)' : BUSINESS_TIMEZONE;

const slotSx = (selected) => (theme) => ({
  flex: 1,
  minHeight: 44,
  px: 0.5,
  borderRadius: 3,
  fontSize: { xs: 13.5, sm: 14.5 },
  fontWeight: 700,
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
  border: '1.5px solid transparent',
  bgcolor: 'accent.main',
  color: 'accent.contrastText',
  transition: 'background-color 150ms, border-color 150ms',
  '&:hover': { borderColor: 'primary.main' },
  ...(selected && {
    bgcolor: 'primary.main',
    color: 'primary.contrastText',
    boxShadow: `0 10px 22px -12px rgba(${theme.vars.palette.primary.mainChannel} / 0.75)`,
  }),
  '&.Mui-disabled': {
    bgcolor: 'transparent',
    borderStyle: 'dashed',
    borderColor: 'divider',
    color: 'text.secondary',
    textDecoration: 'line-through',
  },
});

// Time slots grouped into morning / afternoon / evening. Taken or past slots are struck through and disabled.
export default function TimeSlotGrid({ slots, loading, value, onChange }) {
  if (loading) {
    return (
      <Box sx={gridSx}>
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} variant="rounded" height={44} sx={{ borderRadius: 3 }} />
        ))}
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      {PERIODS.map(({ label, test }) => {
        const group = slots.filter((s) => test(Number(s.startTime.slice(0, 2))));
        if (!group.length) return null;
        const id = `slots-${label.toLowerCase()}`;
        return (
          <Box key={label}>
            <Eyebrow sx={{ mb: 1.25 }}>
              <span id={id}>{label}</span>
            </Eyebrow>
            <Box role="radiogroup" aria-labelledby={id} onKeyDown={handleRadioKeys} sx={gridSx}>
              {group.map((slot) => {
                const selected = value === slot.startTime;
                const reason = slot.available ? undefined : (REASONS[slot.reason] ?? 'Not available');
                // The tooltip sits on the wrapper because disabled buttons get no mouse events.
                return (
                  <Box key={slot.startTime} title={reason} sx={{ minWidth: 0, display: 'flex' }}>
                    <ButtonBase
                      role="radio"
                      aria-checked={selected}
                      disabled={!slot.available}
                      aria-label={reason ? `${formatTime(slot.startTime)}, ${reason}` : formatTime(slot.startTime)}
                      onClick={() => onChange(slot)}
                      sx={[slotSx(selected), focusRingSx, reducedMotionSx]}
                    >
                      {formatTime(slot.startTime)}
                    </ButtonBase>
                  </Box>
                );
              })}
            </Box>
          </Box>
        );
      })}
    </Stack>
  );
}

// Key under the slots: what the two looks mean and which clock the times follow.
export function SlotLegend() {
  const swatch = { width: 14, height: 14, borderRadius: 1, flex: 'none' };
  return (
    <Stack direction="row" sx={{ flexWrap: 'wrap', columnGap: 2.5, rowGap: 1, alignItems: 'center', color: 'text.secondary' }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Box aria-hidden sx={{ ...swatch, bgcolor: 'accent.main', border: 1, borderColor: 'accent.contrastText' }} />
        <Typography variant="body2" component="span">
          Available
        </Typography>
      </Stack>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Box aria-hidden sx={{ ...swatch, border: '1.5px dashed', borderColor: 'text.secondary' }} />
        <Typography variant="body2" component="span">
          Booked
        </Typography>
      </Stack>
      <Typography variant="body2" component="span" sx={{ ml: { sm: 'auto' } }}>
        Times shown in {TIMEZONE_LABEL}
      </Typography>
    </Stack>
  );
}
