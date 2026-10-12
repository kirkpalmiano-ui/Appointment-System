import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';

// Numbered circles joined by lines (Service → Specialist → Date & time → Confirm).
// Completed steps show a check and a primary line; `canJump(i)` decides which steps are clickable.
export default function FlowStepper({ steps, active, isDone = () => false, canJump = () => false, onJump }) {
  return (
    <Box component="ol" aria-label="Booking progress" sx={{ display: 'flex', alignItems: 'flex-start', listStyle: 'none', m: 0, p: 0 }}>
      {steps.map((label, i) => {
        const done = isDone(i) && i !== active;
        const current = i === active;
        const clickable = canJump(i) && !current;
        return (
          <Box component="li" key={label} sx={{ flex: i < steps.length - 1 ? 1 : 'none', display: 'flex', alignItems: 'flex-start', minWidth: 0 }}>
            <ButtonBase
              disabled={!clickable}
              onClick={() => onJump?.(i)}
              aria-current={current ? 'step' : undefined}
              aria-label={`Step ${i + 1}: ${label}${done ? ' (done)' : ''}`}
              sx={{ flexDirection: 'column', gap: 0.75, borderRadius: 2, px: 0.5, flex: 'none' }}
            >
              <Box
                sx={{
                  display: 'grid',
                  placeItems: 'center',
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  fontWeight: 700,
                  fontSize: 14,
                  border: '1.5px solid',
                  borderColor: done || current ? 'primary.main' : 'divider',
                  bgcolor: done || current ? 'primary.main' : 'field.main',
                  color: done || current ? 'primary.contrastText' : 'text.secondary',
                  boxShadow: current ? (t) => `0 0 0 5px rgba(${t.vars.palette.primary.mainChannel} / 0.15)` : 'none',
                  transition: 'background-color 200ms, border-color 200ms',
                }}
              >
                {done ? <CheckRoundedIcon sx={{ fontSize: 18 }} /> : i + 1}
              </Box>
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: current ? 700 : 600,
                  color: current ? 'text.primary' : 'text.secondary',
                  display: { xs: current ? 'block' : 'none', sm: 'block' },
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </Typography>
            </ButtonBase>
            {i < steps.length - 1 && (
              <Box
                aria-hidden
                sx={{
                  flex: 1,
                  height: 2,
                  mt: '17px',
                  mx: 1,
                  borderRadius: 1,
                  bgcolor: isDone(i) && i < active ? 'primary.main' : 'divider',
                  transition: 'background-color 300ms',
                }}
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
}
