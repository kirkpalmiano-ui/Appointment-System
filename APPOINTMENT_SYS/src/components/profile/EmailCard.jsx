import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import { SoftChip } from '../StatusChip';
import ProfileSection from './ProfileSection';

// Current email + "Change email" (clients only; staff/admin emails are managed elsewhere).
export default function EmailCard({ user, isStaff, isAdmin, onChange }) {
  const canChange = !isStaff && !isAdmin;
  return (
    <ProfileSection id="email" title="Email address" subtitle="Used to log in and to receive verification codes.">
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={1.75} sx={{ alignItems: 'center', minWidth: 0 }}>
          <Box
            aria-hidden
            sx={{
              width: 44,
              height: 44,
              flex: 'none',
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              bgcolor: 'accent.main',
              color: 'accent.contrastText',
            }}
          >
            <MailOutlineRoundedIcon fontSize="small" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" useFlexGap sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>{user.email}</Typography>
              {user.isVerified && (
                <SoftChip tone="success" icon="check">
                  Verified
                </SoftChip>
              )}
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {isStaff
                ? 'Your work email is managed by an administrator.'
                : isAdmin
                  ? 'Administrators change their email in the admin panel (My account).'
                  : 'Changing it requires a code sent to the new address.'}
            </Typography>
          </Box>
        </Stack>
        {canChange && (
          <Button variant="outlined" onClick={onChange} sx={{ flex: 'none', alignSelf: { xs: 'flex-start', sm: 'center' } }}>
            Change email
          </Button>
        )}
      </Stack>
    </ProfileSection>
  );
}
