import Box from '@mui/material/Box';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { STATUS_META } from '../utils/appointments';

// Soft status chip ("● Pending", "✓ Completed"): tinted background, coloured text, never a solid fill.
// `tone` lets callers reuse the look for other labels (pending | success | info | neutral | danger).
const TONES = {
  pending: { bg: 'pendingChip.light', fg: 'pendingChip.main' },
  success: { bg: 'successChip.light', fg: 'successChip.main' },
  info: { bg: 'infoChip.light', fg: 'infoChip.main' },
  accent: { bg: 'accent.main', fg: 'accent.contrastText' },
  danger: { bg: (t) => `rgba(${t.vars.palette.error.mainChannel} / 0.12)`, fg: 'error.main' },
  neutral: { bg: 'action.hover', fg: 'text.secondary' },
};
const STATUS_TONE = { pending: 'pending', confirmed: 'success', completed: 'success', cancelled: 'danger' };

export function SoftChip({ tone = 'accent', icon = 'dot', size = 'small', children, sx }) {
  const { bg, fg } = TONES[tone] ?? TONES.neutral;
  return (
    <Box
      component="span"
      sx={[
        {
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.75,
          flex: 'none',
          px: size === 'small' ? 1.25 : 1.5,
          borderRadius: 999,
          fontSize: size === 'small' ? 12.5 : 13.5,
          fontWeight: 700,
          lineHeight: size === 'small' ? '26px' : '30px',
          whiteSpace: 'nowrap',
          bgcolor: bg,
          color: fg,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {icon === 'dot' && <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'currentColor' }} />}
      {icon === 'check' && <CheckRoundedIcon sx={{ fontSize: 15 }} />}
      {children}
    </Box>
  );
}

export default function StatusChip({ status, size = 'small', label, sx }) {
  const meta = STATUS_META[status] || { label: status };
  return (
    <SoftChip tone={STATUS_TONE[status] ?? 'neutral'} icon={status === 'completed' ? 'check' : 'dot'} size={size === 'medium' ? 'medium' : 'small'} sx={sx}>
      {label ?? meta.label}
    </SoftChip>
  );
}
