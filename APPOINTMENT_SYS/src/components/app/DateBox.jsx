import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { parseDate } from '../../utils/format';

// Rounded date square for appointment rows: month, big day number, weekday.
// `tone="success"` tints it green (completed visits); `tone="muted"` greys it (cancelled).
export default function DateBox({ date, tone = 'accent', size = 64 }) {
  const d = parseDate(date);
  const colors = {
    accent: { bg: 'accent.main', fg: 'accent.contrastText' },
    success: { bg: 'successChip.light', fg: 'successChip.main' },
    muted: { bg: 'action.hover', fg: 'text.secondary' },
  }[tone];
  return (
    <Box
      aria-hidden
      sx={{
        width: size,
        height: size,
        flex: 'none',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: colors.bg,
        color: colors.fg,
      }}
    >
      <Typography sx={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', lineHeight: 1.2 }}>
        {d.toLocaleDateString('en-US', { month: 'short' })}
      </Typography>
      <Typography sx={{ fontSize: size * 0.38, fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.03em' }}>{d.getDate()}</Typography>
      <Typography sx={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', lineHeight: 1.2, opacity: 0.75 }}>
        {d.toLocaleDateString('en-US', { weekday: 'short' })}
      </Typography>
    </Box>
  );
}
