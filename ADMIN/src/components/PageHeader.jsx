import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// Big page title ("Appointments.") with a muted subtitle and actions on the right.
// `action` can be one element or several (wrap them in a fragment).
export default function PageHeader({ title, description, action }) {
  const heading = /[.!?]$/.test(title) ? title : `${title}.`;
  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={2}
      sx={{ justifyContent: 'space-between', alignItems: { md: 'flex-end' }, mb: 3.5 }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="h1"
          sx={{ fontSize: { xs: 34, md: 44 }, fontWeight: 800, letterSpacing: '-0.05em', lineHeight: 1, mb: description ? 1.25 : 0 }}
        >
          {heading}
        </Typography>
        {description && (
          <Typography color="text.secondary" sx={{ fontSize: 16 }}>
            {description}
          </Typography>
        )}
      </Box>
      {action && (
        <Stack direction="row" spacing={1.25} useFlexGap sx={{ flexWrap: 'wrap', flex: 'none' }}>
          {action}
        </Stack>
      )}
    </Stack>
  );
}
