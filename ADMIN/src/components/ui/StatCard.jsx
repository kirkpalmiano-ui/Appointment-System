import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// Icon tile colours by tone: [bg token, icon token].
const TILE = {
  primary: ['accent.main', 'accent.contrastText'],
  pending: ['pendingChip.light', 'pendingChip.main'],
  success: ['successChip.light', 'successChip.main'],
  info: ['infoChip.light', 'infoChip.main'],
  danger: ['dangerChip.light', 'dangerChip.main'],
  neutral: ['hover.main', 'text.secondary'],
};

export function IconTile({ icon: Icon, tone = 'primary', size = 40 }) {
  const [bg, ink] = TILE[tone] ?? TILE.primary;
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', flex: 'none', width: size, height: size, borderRadius: `${Math.round(size * 0.3)}px`, bgcolor: bg, color: ink }}>
      <Icon sx={{ fontSize: Math.round(size * 0.5) }} />
    </Box>
  );
}

/**
 * KPI card. variant="large": icon tile, label, big number (34px/800), sub-line.
 * variant="compact": one row — tile, label + value, optional chip on the right.
 * `highlight` (e.g. "pending") tints the border and number. `to` makes the whole card a link.
 * `value === undefined` shows a skeleton.
 */
export default function StatCard({ icon, tone = 'primary', label, value, sub, chip, highlight, to, variant = 'large', footer }) {
  const loading = value === undefined;
  const highlightSx =
    highlight &&
    ((theme) => ({
      borderColor: theme.vars.palette[`${highlight}Chip`]?.main ?? theme.vars.palette.divider,
      borderWidth: 1,
    }));
  const link = to ? { component: RouterLink, to } : {};

  if (variant === 'compact') {
    return (
      <Card {...link} sx={[{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5, height: '100%', textDecoration: 'none', color: 'inherit' }, highlightSx]}>
        <IconTile icon={icon} tone={tone} size={38} />
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          {/* Labels may wrap to a second line on narrow cards rather than being cut off. */}
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.3 }}>
            {label}
          </Typography>
          <Typography sx={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em', lineHeight: 1.25 }} noWrap>
            {loading ? <Skeleton width={48} /> : value}
          </Typography>
        </Box>
        {chip}
      </Card>
    );
  }

  return (
    <Card
      {...link}
      sx={[
        { p: 2.5, height: '100%', display: 'flex', flexDirection: 'column', textDecoration: 'none', color: 'inherit', transition: 'transform 160ms ease' },
        to && { '&:hover': { transform: 'translateY(-2px)' }, '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 } },
        highlightSx,
      ]}
    >
      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 2 }}>
        <IconTile icon={icon} tone={tone} />
        <Typography sx={{ fontWeight: 700, fontSize: 14 }} color="text.secondary">
          {label}
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        {chip}
      </Stack>
      <Typography
        sx={[
          { fontWeight: 800, fontSize: 34, letterSpacing: '-0.04em', lineHeight: 1 },
          highlight && { color: `${highlight}Chip.main` },
        ]}
      >
        {loading ? <Skeleton width={70} /> : value}
      </Typography>
      {sub && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }} component="div">
          {sub}
        </Typography>
      )}
      {footer}
    </Card>
  );
}
