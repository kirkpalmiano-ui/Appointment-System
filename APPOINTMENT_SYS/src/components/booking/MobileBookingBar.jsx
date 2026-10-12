import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { formatDate, formatPrice, formatTime } from '../../utils/format';

// Space the page must leave at the bottom so the fixed bar never covers content
// (12px + 52px button + 12px, plus a little breathing room and the iOS home indicator).
export const MOBILE_BOOKING_BAR_SPACE = 'calc(104px + env(safe-area-inset-bottom))';

// Mobile/tablet replacement for the "Your appointment" side panel: a frosted bar fixed to
// the bottom with a one-line summary, the total and the wizard's main action.
export default function MobileBookingBar({ service, date, slot, actionLabel, actionDisabled, onAction, submitting, final = false }) {
  const summary =
    date && slot
      ? `${formatDate(date, { weekday: 'short', month: 'short', day: 'numeric' })} · ${formatTime(slot.startTime)}`
      : (service?.name ?? 'Choose a service');

  return (
    <Box
      role="region"
      aria-label="Your appointment"
      sx={(theme) => ({
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: theme.zIndex.appBar,
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: `rgba(${theme.vars.palette.background.paperChannel} / 0.86)`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        pt: 1.5,
        px: { xs: '18px', sm: 3 },
        pb: 'calc(12px + env(safe-area-inset-bottom))',
      })}
    >
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', maxWidth: 640, mx: 'auto' }}>
        {/* The button keeps its full label; the summary shrinks (with an ellipsis) instead. */}
        <Box sx={{ minWidth: 0, flex: '0 1 auto' }}>
          <Typography
            noWrap
            sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'text.secondary', lineHeight: 1.4 }}
          >
            {summary}
          </Typography>
          <Typography
            noWrap
            sx={{
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              fontVariantNumeric: 'tabular-nums',
              color: service ? 'text.primary' : 'text.secondary',
            }}
          >
            {service ? formatPrice(service.price) : '—'}
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="large"
          onClick={onAction}
          disabled={actionDisabled}
          startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : undefined}
          endIcon={submitting || final ? undefined : <ArrowForwardRoundedIcon />}
          sx={{ flex: '1 0 auto', minHeight: 52, px: 2.5, whiteSpace: 'nowrap' }}
        >
          {actionLabel}
        </Button>
      </Stack>
    </Box>
  );
}
