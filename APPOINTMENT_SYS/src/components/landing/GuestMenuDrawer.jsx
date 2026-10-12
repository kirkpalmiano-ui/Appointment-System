import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import Brand from '../Brand';

// Slide-down menu for signed-out visitors on phones/tablets: section links, Log in and Book.
// MUI's Modal traps focus while open, closes on Escape/backdrop and returns focus to the menu button.
export default function GuestMenuDrawer({ open, onClose, links }) {
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <Drawer
      anchor="top"
      open={open}
      onClose={onClose}
      transitionDuration={reduceMotion ? 0 : { enter: 240, exit: 200 }}
      slotProps={{
        paper: {
          'aria-label': 'Site menu',
          sx: (theme) => ({
            maxWidth: 640,
            mx: 'auto',
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
            pt: 'calc(8px + env(safe-area-inset-top))',
            pb: 2.5,
            px: 2,
            bgcolor: 'background.paper',
            backgroundImage: 'none',
            ...theme.applyStyles('dark', { bgcolor: '#141a36' }),
          }),
        },
      }}
    >
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', minHeight: 56, pl: 0.5 }}>
        <Box onClick={onClose}>
          <Brand />
        </Box>
        <IconButton aria-label="Close menu" onClick={onClose} sx={{ width: 44, height: 44 }}>
          <CloseRoundedIcon />
        </IconButton>
      </Stack>

      <List component="nav" aria-label="Sections" onClick={onClose} sx={{ py: 1 }}>
        {links.map(({ to, label, icon: Icon }) => (
          <ListItemButton key={to} component={RouterLink} to={to} sx={{ minHeight: 52, borderRadius: '14px' }}>
            <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
              <Icon />
            </ListItemIcon>
            <ListItemText primary={label} slotProps={{ primary: { sx: { fontWeight: 600 } } }} />
          </ListItemButton>
        ))}
      </List>

      <Stack spacing={1.25} onClick={onClose} sx={{ px: 0.5, pt: 1 }}>
        <Button component={RouterLink} to="/login" variant="outlined" fullWidth sx={{ minHeight: 52 }}>
          Log in
        </Button>
        <Button
          component={RouterLink}
          to="/book"
          variant="contained"
          fullWidth
          endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />}
          sx={{ minHeight: 52 }}
        >
          Book appointment
        </Button>
      </Stack>
    </Drawer>
  );
}
