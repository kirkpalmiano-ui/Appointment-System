import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { SoftChip } from '../StatusChip';
import ProfileSection from './ProfileSection';

// TODO(backend): self-service account deletion. Only admins can delete accounts today,
// so the button stays disabled (no fake confirm/delete modal).
export default function DangerZoneCard() {
  return (
    <ProfileSection
      id="danger-zone"
      title="Danger zone"
      action={<SoftChip tone="neutral">Coming soon</SoftChip>}
      sx={(theme) => ({
        border: `1px solid rgba(${theme.vars.palette.error.mainChannel} / 0.35)`,
        backgroundImage: `linear-gradient(rgba(${theme.vars.palette.error.mainChannel} / 0.04), rgba(${theme.vars.palette.error.mainChannel} / 0.04))`,
      })}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700 }}>Delete account</Typography>
          <Typography variant="body2" color="text.secondary">
            Permanently removes your account and appointment history. Self-service deletion is coming soon; until then, contact the
            clinic.
          </Typography>
        </Box>
        <Button variant="outlined" color="error" disabled sx={{ flex: 'none', alignSelf: { xs: 'flex-start', sm: 'center' } }}>
          Delete account
        </Button>
      </Stack>
    </ProfileSection>
  );
}
