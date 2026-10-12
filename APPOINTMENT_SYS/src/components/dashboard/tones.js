// Soft colour pairs for the dashboard's icon tiles (bg = tinted wash, fg = icon/text colour).
export const TONES = {
  accent: { bg: 'accent.main', fg: 'accent.contrastText' },
  pending: { bg: 'pendingChip.light', fg: 'pendingChip.main' },
  success: { bg: 'successChip.light', fg: 'successChip.main' },
  info: { bg: 'infoChip.light', fg: 'infoChip.main' },
  danger: { bg: (t) => `rgba(${t.vars.palette.error.mainChannel} / 0.12)`, fg: 'error.main' },
};

