import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import EventBusyRoundedIcon from '@mui/icons-material/EventBusyRounded';

// Quiet "nothing here yet" message: a muted icon, a title, a line of help and an optional action.
export default function EmptyState({ icon: Icon = EventBusyRoundedIcon, title, description, action }) {
  return (
    <Box sx={{ textAlign: 'center', py: 7, px: 2 }}>
      <Icon sx={{ fontSize: 40, color: 'text.disabled', mb: 1.5 }} />
      <Typography variant="subtitle1" component="p" sx={{ fontWeight: 600, mb: 0.5 }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360, mx: 'auto', mb: action ? 3 : 0 }}>
          {description}
        </Typography>
      )}
      {action}
    </Box>
  );
}
