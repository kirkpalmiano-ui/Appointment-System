import { useId } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import Typography from '@mui/material/Typography';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

// Bottom sheet for phones: dimmed backdrop, 30px top radius, grab handle, max 85% of the
// screen tall with its own scrolling, safe-area padding. Closes on backdrop tap, swipe down
// and Escape. MUI's Modal traps focus while open and returns it to the trigger on close.
export default function MobileSheet({ open, onClose, title, children, footer, ariaLabel }) {
  const titleId = useId();
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
      disableSwipeToOpen
      transitionDuration={reduceMotion ? 0 : { enter: 240, exit: 200 }}
      slotProps={{
        paper: {
          role: 'dialog',
          'aria-modal': true,
          ...(title ? { 'aria-labelledby': titleId } : { 'aria-label': ariaLabel }),
          sx: (theme) => ({
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            maxHeight: '85vh',
            maxWidth: 640,
            mx: 'auto',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.paper',
            backgroundImage: 'none',
            ...theme.applyStyles('dark', { bgcolor: '#141a36' }),
          }),
        },
      }}
    >
      {/* Grab handle */}
      <Box aria-hidden sx={{ display: 'flex', justifyContent: 'center', pt: 1.25, pb: 0.5, flex: 'none' }}>
        <Box sx={{ width: 42, height: 5, borderRadius: 999, bgcolor: 'divider' }} />
      </Box>
      {title && (
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', px: 2.5, pt: 0.5, pb: 1, flex: 'none' }}>
          <Typography id={titleId} component="h2" sx={{ fontWeight: 800, fontSize: 18 }}>
            {title}
          </Typography>
          <IconButton aria-label="Close" onClick={onClose} edge="end">
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
      )}
      <Box sx={{ overflowY: 'auto', px: 2.5, pb: footer ? 2 : 'calc(20px + env(safe-area-inset-bottom))', flexGrow: 1 }}>{children}</Box>
      {footer && (
        <Box sx={{ flex: 'none', px: 2.5, pt: 1.5, pb: 'calc(16px + env(safe-area-inset-bottom))', borderTop: 1, borderColor: 'divider' }}>
          {footer}
        </Box>
      )}
    </SwipeableDrawer>
  );
}
