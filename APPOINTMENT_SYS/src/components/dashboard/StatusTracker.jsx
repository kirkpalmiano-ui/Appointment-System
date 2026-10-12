import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';

const STEPS = ['Requested', 'Clinic review', 'Confirmed', 'Visit'];

// Where a booking is in its journey: pending = waiting on clinic review, confirmed = ready for the visit.
export default function StatusTracker({ status }) {
  const current = status === 'confirmed' ? 3 : 1;
  return (
    <Box
      component="ol"
      role="list"
      aria-label="Booking progress"
      sx={{ display: 'grid', gridTemplateColumns: `repeat(${STEPS.length}, 1fr)`, listStyle: 'none', m: 0, p: 0 }}
    >
      {STEPS.map((label, i) => {
        const done = i < current;
        const isCurrent = i === current;
        const pendingStep = isCurrent && status === 'pending';
        return (
          <Box
            component="li"
            key={label}
            aria-current={isCurrent ? 'step' : undefined}
            aria-label={`${label}: ${done ? 'done' : isCurrent ? 'current step' : 'not yet'}`}
            sx={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75, minWidth: 0 }}
          >
            {i < STEPS.length - 1 && (
              <Box
                aria-hidden
                sx={{
                  position: 'absolute',
                  top: 13,
                  left: 'calc(50% + 20px)',
                  right: 'calc(-50% + 20px)',
                  height: 2,
                  borderRadius: 1,
                  bgcolor: done ? 'primary.main' : 'divider',
                }}
              />
            )}
            <Box
              aria-hidden
              sx={{
                display: 'grid',
                placeItems: 'center',
                width: 28,
                height: 28,
                borderRadius: '50%',
                fontSize: 12.5,
                fontWeight: 700,
                border: '2px solid',
                ...(done && { bgcolor: 'primary.main', borderColor: 'primary.main', color: 'primary.contrastText' }),
                ...(pendingStep && { bgcolor: 'pendingChip.light', borderColor: 'pendingChip.main', color: 'pendingChip.main' }),
                ...(isCurrent &&
                  !pendingStep && {
                    bgcolor: 'accent.main',
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    boxShadow: (t) => `0 0 0 4px rgba(${t.vars.palette.primary.mainChannel} / 0.15)`,
                  }),
                ...(!done && !isCurrent && { bgcolor: 'field.main', borderColor: 'divider', color: 'text.secondary' }),
              }}
            >
              {done ? <CheckRoundedIcon sx={{ fontSize: 16 }} /> : i + 1}
            </Box>
            <Typography
              sx={{
                fontSize: { xs: 11.5, sm: 12.5 },
                fontWeight: isCurrent ? 700 : 600,
                textAlign: 'center',
                lineHeight: 1.3,
                color: pendingStep ? 'pendingChip.main' : done || isCurrent ? 'text.primary' : 'text.secondary',
              }}
            >
              {label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
