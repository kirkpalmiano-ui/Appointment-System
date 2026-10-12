import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import { profileCompleteness, profileGradientSx, scrollToSection } from './profileUtils';

// "Profile X% complete" label, gradient bar and a link to the first missing field.
// `onHint(section, focusSelector)` defaults to scrolling to that section (desktop).
export default function ProfileCompleteness({ user, onHint = scrollToSection, sx, linkSx }) {
  const { percent, next } = profileCompleteness(user);
  return (
    <Box sx={sx}>
      <Typography id="profile-complete-label" variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
        Profile {percent}% complete
      </Typography>
      <LinearProgress
        variant="determinate"
        value={percent}
        aria-labelledby="profile-complete-label"
        sx={(theme) => ({
          height: 8,
          borderRadius: 999,
          bgcolor: theme.vars.palette.action.hover,
          '& .MuiLinearProgress-bar': { borderRadius: 999, ...profileGradientSx(theme) },
        })}
      />
      {next ? (
        <Link
          component="button"
          type="button"
          variant="body2"
          underline="hover"
          onClick={() => onHint(next.section, next.focus)}
          sx={[{ mt: 1, fontWeight: 600, textAlign: 'left' }, ...(Array.isArray(linkSx) ? linkSx : [linkSx])]}
        >
          {next.hint} →
        </Link>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Your profile is complete
        </Typography>
      )}
    </Box>
  );
}
