import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import Eyebrow from '../app/Eyebrow';
import { formatDate, formatDuration, formatPrice, formatTimeRange } from '../../utils/format';

const PLACEHOLDER = 'Choose in next step';

// Dashed line between summary rows.
const dashedTopSx = { borderTop: '1px dashed', borderColor: 'divider' };

function Row({ icon: Icon, tone, label, value, detail }) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start', py: 1.75 }}>
      <Box aria-hidden sx={{ display: 'grid', placeItems: 'center', flex: 'none', width: 40, height: 40, borderRadius: 3, bgcolor: tone.bg, color: tone.fg }}>
        <Icon sx={{ fontSize: 20 }} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Eyebrow>{label}</Eyebrow>
        <Typography sx={{ fontWeight: value ? 700 : 500, color: value ? 'text.primary' : 'text.secondary', overflowWrap: 'anywhere' }}>
          {value || PLACEHOLDER}
        </Typography>
        {value && detail && (
          <Typography variant="body2" color="text.secondary">
            {detail}
          </Typography>
        )}
      </Box>
    </Stack>
  );
}

// The user's choices so far (service, specialist, date & time) with an optional total.
export default function BookingSummary({ service, staff, date, slot, showTotal = true }) {
  const when = date && formatDate(date, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
  return (
    <Box>
      <Box sx={{ '& > * + *': dashedTopSx }}>
        <Row
          icon={MedicalServicesOutlinedIcon}
          tone={{ bg: 'accent.main', fg: 'accent.contrastText' }}
          label="Service"
          value={service?.name}
          detail={service && formatDuration(service.durationMinutes)}
        />
        <Row
          icon={PersonOutlineRoundedIcon}
          tone={{ bg: 'successChip.light', fg: 'successChip.main' }}
          label="Specialist"
          value={staff?.name}
          detail={staff?.specialization}
        />
        <Row
          icon={CalendarMonthOutlinedIcon}
          tone={{ bg: 'infoChip.light', fg: 'infoChip.main' }}
          label="Date & time"
          value={when}
          detail={slot ? formatTimeRange(slot.startTime, slot.endTime) : 'Pick a time'}
        />
      </Box>
      {showTotal && (
        <Stack direction="row" sx={{ ...dashedTopSx, justifyContent: 'space-between', alignItems: 'baseline', pt: 2, mt: 0.5 }}>
          <Typography sx={{ fontWeight: 700 }}>Total</Typography>
          <Typography
            sx={{ fontWeight: 800, fontSize: 28, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', color: service ? 'text.primary' : 'text.secondary' }}
          >
            {service ? formatPrice(service.price) : '—'}
          </Typography>
        </Stack>
      )}
    </Box>
  );
}
