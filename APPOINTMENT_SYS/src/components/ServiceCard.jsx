import { createElement } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import SelectCircle from './booking/SelectCircle';
import { selectableCardSx } from './booking/selectableCardSx';
import { serviceIcon, TILE_TONES } from './booking/serviceCategories';
import { formatDuration, formatPrice } from '../utils/format';

// One service in the list. Pass `onSelect` to make it a radio option (booking page);
// `index` rotates the icon tile colour.
// TODO(backend): "Most popular" / "Best for first visit" labels need booking stats or a flag on services.
export default function ServiceCard({ service, selected = false, onSelect, index = 0 }) {
  const tone = TILE_TONES[index % TILE_TONES.length];

  const content = (
    <Stack direction="row" spacing={{ xs: 1.5, sm: 2 }} sx={{ alignItems: 'flex-start', p: { xs: 2, sm: 2.5 } }}>
      {onSelect && (
        <Box sx={{ pt: 1.5 }}>
          <SelectCircle selected={selected} />
        </Box>
      )}
      <Box
        aria-hidden
        sx={{ display: 'grid', placeItems: 'center', flex: 'none', width: 48, height: 48, borderRadius: 3.5, bgcolor: tone.bg, color: tone.fg }}
      >
        {createElement(serviceIcon(service))}
      </Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 2 }} sx={{ flexGrow: 1, minWidth: 0 }}>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography component="h3" sx={{ fontWeight: 700, fontSize: 18, lineHeight: 1.35, overflowWrap: 'anywhere' }}>
            {service.name}
          </Typography>
          {service.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, overflowWrap: 'anywhere' }}>
              {service.description}
            </Typography>
          )}
        </Box>
        <Stack
          direction={{ xs: 'row', sm: 'column' }}
          spacing={{ xs: 1.5, sm: 0.25 }}
          sx={{ flex: 'none', alignItems: { xs: 'center', sm: 'flex-end' } }}
        >
          <Typography sx={{ fontWeight: 800, fontSize: 20, lineHeight: 1.3, fontVariantNumeric: 'tabular-nums' }}>
            {formatPrice(service.price)}
          </Typography>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color: 'text.secondary' }}>
            <ScheduleRoundedIcon sx={{ fontSize: 16 }} />
            <Typography variant="body2">{formatDuration(service.durationMinutes)}</Typography>
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );

  return (
    <Card sx={selectableCardSx(selected)}>
      {onSelect ? (
        <CardActionArea onClick={() => onSelect(service)} sx={{ height: '100%' }} role="radio" aria-checked={selected}>
          {content}
        </CardActionArea>
      ) : (
        content
      )}
    </Card>
  );
}
