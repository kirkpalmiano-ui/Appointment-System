import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import EventBusyRoundedIcon from '@mui/icons-material/EventBusyRounded';

export default function EmptyState({ icon: Icon = EventBusyRoundedIcon, title, description, action }) {
  return (
    <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
      <Box
        sx={{
          display: 'inline-grid',
          placeItems: 'center',
          width: 56,
          height: 56,
          borderRadius: '16px',
          mb: 2,
          color: 'accent.contrastText',
          bgcolor: 'accent.main',
        }}
      >
        <Icon />
      </Box>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360, mx: 'auto', mb: action ? 2.5 : 0 }}>
          {description}
        </Typography>
      )}
      {action}
    </Box>
  );
}
