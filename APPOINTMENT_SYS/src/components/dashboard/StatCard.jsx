import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconTile from './IconTile';

// Number card: soft icon tile + label, a big count and a muted helper line.
// `value == null` shows a skeleton; `valueColor` tints the number (e.g. pending > 0).
// `compact` = the smaller mobile version used in the 2x2 grid.
export default function StatCard({ icon, tone, label, value, helper, valueColor = 'text.primary', compact = false }) {
  return (
    <Card sx={[{ height: '100%' }, compact && { borderRadius: '18px' }]}>
      <CardContent sx={compact ? { p: 1.75, '&:last-child': { pb: 1.75 } } : { p: 3, '&:last-child': { pb: 3 } }}>
        <Stack direction="row" spacing={compact ? 1 : 1.5} sx={{ alignItems: 'center', mb: compact ? 1.25 : 2, minWidth: 0 }}>
          <IconTile icon={icon} tone={tone} size={compact ? 32 : 42} sx={compact ? { borderRadius: '10px' } : undefined} />
          <Typography component="h3" noWrap={compact} sx={{ fontWeight: 700, fontSize: compact ? 13.5 : 15 }}>
            {label}
          </Typography>
        </Stack>
        {value == null ? (
          <Skeleton width={compact ? 36 : 48} height={compact ? 36 : 48} />
        ) : (
          <Typography
            component="p"
            sx={{
              fontSize: compact ? 28 : 40,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              fontVariantNumeric: 'tabular-nums',
              color: valueColor,
            }}
          >
            {value}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary" sx={{ mt: compact ? 0.5 : 0.75, minHeight: '1.43em', ...(compact && { fontSize: 12.5, lineHeight: 1.35 }) }}>
          {helper}
        </Typography>
      </CardContent>
    </Card>
  );
}
