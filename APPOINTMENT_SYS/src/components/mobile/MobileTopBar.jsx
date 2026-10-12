import Box from '@mui/material/Box';

// Sticky top bar for mobile page headers: three slots (left · centre · right), frosted
// background once content scrolls under it, padded for the iOS notch (safe-area-inset-top).
// Icon-only buttons placed in it must have aria-labels.
export default function MobileTopBar({ left, center, right, sx }) {
  return (
    <Box
      component="header"
      sx={[
        (theme) => ({
          position: 'sticky',
          top: 0,
          zIndex: theme.zIndex.appBar,
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: 1,
          minHeight: 60,
          px: 1.5,
          pt: 'env(safe-area-inset-top)',
          bgcolor: `rgba(${theme.vars.palette.background.defaultChannel} / 0.72)`,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>{left}</Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0 }}>{center}</Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, minWidth: 0 }}>{right}</Box>
    </Box>
  );
}
