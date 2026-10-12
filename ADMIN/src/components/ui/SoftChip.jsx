import Box from '@mui/material/Box';

// Soft status pill: tinted background + coloured text, never a solid fill.
// tone: pending | success | info | danger | accent | neutral | dark (solid text-colour bg) | outlined
const TONES = {
  pending: { bgcolor: 'pendingChip.light', color: 'pendingChip.main' },
  success: { bgcolor: 'successChip.light', color: 'successChip.main' },
  info: { bgcolor: 'infoChip.light', color: 'infoChip.main' },
  danger: { bgcolor: 'dangerChip.light', color: 'dangerChip.main' },
  accent: { bgcolor: 'accent.main', color: 'accent.contrastText' },
  neutral: { bgcolor: 'hover.main', color: 'text.secondary' },
  dark: { bgcolor: 'text.primary', color: 'background.default' },
  outlined: { bgcolor: 'transparent', color: 'text.secondary', border: '1px solid', borderColor: 'divider' },
};

/**
 * <SoftChip tone="pending" dot>Pending</SoftChip>
 * <SoftChip tone="success" icon={<CheckRoundedIcon />}>Verified</SoftChip>
 * Set `outlinedTone` to draw a coloured outline instead of a fill (e.g. "⚠ 3 unverified").
 */
export default function SoftChip({ tone = 'neutral', dot = false, icon, size = 'small', outlinedTone = false, children, sx, ...rest }) {
  const t = TONES[tone] ?? TONES.neutral;
  const small = size === 'small';
  return (
    <Box
      component="span"
      {...rest}
      sx={[
        {
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.6,
          px: small ? 1.1 : 1.4,
          height: small ? 24 : 28,
          borderRadius: 999,
          fontSize: small ? 12 : 13,
          fontWeight: 700,
          lineHeight: 1,
          whiteSpace: 'nowrap',
          verticalAlign: 'middle',
          '& .MuiSvgIcon-root': { fontSize: small ? 14 : 16 },
          ...t,
        },
        outlinedTone && { bgcolor: 'transparent', border: '1px solid', borderColor: t.color },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {dot && <Box component="span" aria-hidden sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'currentColor', flex: 'none' }} />}
      {icon}
      {children}
    </Box>
  );
}
