import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// Big page title ("My appointments.") with a muted subtitle and an optional action on the right.
export default function PageHeader({ title, subtitle, action, sx }) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      sx={[{ justifyContent: 'space-between', alignItems: { sm: 'flex-end' }, mb: { xs: 3, md: 4 } }, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="h1"
          sx={{ fontSize: { xs: '2.4rem', md: '3.5rem' }, fontWeight: 800, letterSpacing: '-0.05em', lineHeight: 1 }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography color="text.secondary" sx={{ fontSize: { xs: '1rem', md: '1.125rem' }, mt: 1.25 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {action && <Box sx={{ flex: 'none' }}>{action}</Box>}
    </Stack>
  );
}
