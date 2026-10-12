import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { clockTime, relativeTime } from '../../utils/time';
import { targetEmail } from './events';

// Red alert above the audit table when sign-ins failed in the last 24 hours.
// `count` / `latest` come from the layout's counts (same numbers as the bell).
export default function FailedSignInBanner({ count, latest, active, onShowFailed }) {
  if (!count) return null;
  const email = targetEmail(latest);
  const detail = latest && [email && `Latest for ${email}`, latest.ip && `from ${latest.ip}`, `${clockTime(latest.createdAt)} (${relativeTime(latest.createdAt)})`].filter(Boolean).join(' · ');

  return (
    <Box
      role="alert"
      sx={{
        mb: 2.5,
        p: 2,
        pl: { xs: 2, sm: 2.25 },
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { sm: 'center' },
        gap: 1.75,
        borderRadius: '18px',
        border: '1px solid',
        borderColor: 'rgba(var(--mui-palette-error-mainChannel) / 0.35)',
        bgcolor: 'dangerChip.light',
      }}
    >
      <Stack direction="row" spacing={1.75} sx={{ alignItems: 'center', flexGrow: 1, minWidth: 0 }}>
        <Box sx={{ display: 'grid', placeItems: 'center', flex: 'none', width: 40, height: 40, borderRadius: '12px', bgcolor: 'error.main', color: 'common.white' }}>
          <WarningAmberRoundedIcon sx={{ fontSize: 22 }} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, color: 'dangerChip.main', letterSpacing: '-0.01em' }}>
            {count} failed sign-in attempt{count === 1 ? '' : 's'} in the last 24 hours
          </Typography>
          {detail && (
            <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
              {detail}
            </Typography>
          )}
        </Box>
      </Stack>
      {!active && (
        <Button variant="outlined" color="error" size="small" onClick={onShowFailed} sx={{ flex: 'none', alignSelf: { xs: 'flex-start', sm: 'center' } }}>
          Show failed only
        </Button>
      )}
    </Box>
  );
}
