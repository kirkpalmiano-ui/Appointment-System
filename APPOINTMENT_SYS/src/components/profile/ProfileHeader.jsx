import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { SoftChip } from '../StatusChip';
import { initials } from '../../utils/format';
import ProfileCompleteness from './ProfileCompleteness';
import { profileGradientSx, ROLE_LABEL } from './profileUtils';

// Banner + avatar + name, role/verified chips and the profile-completeness meter.
export default function ProfileHeader({ user }) {
  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';

  return (
    <Card sx={{ p: 0, overflow: 'hidden', mb: 3 }}>
      {/* Decorative banner (no text on it, so contrast is never an issue). */}
      <Box aria-hidden sx={[{ height: { xs: 110, md: 140 } }, profileGradientSx]} />

      <Box sx={{ px: { xs: 2.5, sm: 4 }, pb: { xs: 3, sm: 3.5 } }}>
        {/* TODO(backend): avatar upload (no endpoint yet), so initials only. */}
        <Avatar
          sx={(theme) => ({
            width: 112,
            height: 112,
            mt: '-56px',
            fontSize: 38,
            fontWeight: 800,
            bgcolor: 'accent.main',
            color: 'accent.contrastText',
            border: `5px solid ${theme.vars.palette.background.default}`,
            boxSizing: 'border-box',
          })}
        >
          {initials(user.name)}
        </Avatar>

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={{ xs: 3, md: 4 }}
          sx={{ mt: 2, justifyContent: 'space-between', alignItems: { md: 'flex-end' } }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              component="h1"
              sx={{ fontSize: { xs: 26, sm: 32 }, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15, overflowWrap: 'anywhere' }}
            >
              {user.name}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5, overflowWrap: 'anywhere' }}>
              {user.email}
              {memberSince && ` · Member since ${memberSince}`}
            </Typography>
            <Stack direction="row" useFlexGap sx={{ mt: 1.5, gap: 1, flexWrap: 'wrap' }}>
              <SoftChip tone="accent">{ROLE_LABEL[user.role] ?? 'Client'}</SoftChip>
              {user.isVerified && (
                <SoftChip tone="success" icon="check">
                  Email verified
                </SoftChip>
              )}
            </Stack>
          </Box>

          <ProfileCompleteness user={user} sx={{ width: { xs: '100%', md: 280 }, flex: 'none' }} />
        </Stack>
      </Box>
    </Card>
  );
}
