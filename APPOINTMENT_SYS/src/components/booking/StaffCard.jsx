import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import { formatTime, formatWorkingDays, initials } from '../../utils/format';
import { mediaFor } from '../landing/specialistMedia';
import SelectCircle from './SelectCircle';
import { selectableCardSx } from './selectableCardSx';

// The specialist's uploaded profile photo (or a bundled fallback); initials when there is none.
const photoOf = (staff) => mediaFor(staff)?.photo;
const avatarSx = { bgcolor: 'accent.main', color: 'accent.contrastText', fontWeight: 700 };

// A specialist as a radio option. `compact` is the slim version used on the date & time step.
// TODO(backend): "Next available" would need a slots request per specialist (or a summary endpoint).
export default function StaffCard({ staff, selected, onSelect, compact = false }) {
  const specialization = staff.specialization || 'Staff';

  if (compact) {
    return (
      <Card sx={selectableCardSx(selected)}>
        <CardActionArea onClick={() => onSelect(staff)} sx={{ height: '100%', p: 1.5 }} role="radio" aria-checked={selected}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Avatar src={photoOf(staff)} alt="" sx={{ ...avatarSx, width: 40, height: 40, fontSize: 15 }}>{initials(staff.name)}</Avatar>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 14.5 }} noWrap>
                {staff.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {specialization}
              </Typography>
            </Box>
            <SelectCircle selected={selected} />
          </Stack>
        </CardActionArea>
      </Card>
    );
  }

  return (
    <Card sx={selectableCardSx(selected)}>
      <CardActionArea onClick={() => onSelect(staff)} sx={{ height: '100%', p: 2.5 }} role="radio" aria-checked={selected}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Avatar src={photoOf(staff)} alt="" sx={{ ...avatarSx, width: 56, height: 56, fontSize: 19 }}>{initials(staff.name)}</Avatar>
          <SelectCircle selected={selected} />
        </Stack>
        <Typography component="h3" sx={{ fontWeight: 700, fontSize: 17, lineHeight: 1.3, overflowWrap: 'anywhere' }}>
          {staff.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {specialization}
        </Typography>
        <Stack spacing={0.75} sx={{ pt: 1.5, borderTop: 1, borderColor: 'divider', borderTopStyle: 'dashed', color: 'text.secondary' }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <CalendarTodayOutlinedIcon sx={{ fontSize: 16 }} />
            <Typography variant="body2">{formatWorkingDays(staff.workingDays)}</Typography>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <ScheduleRoundedIcon sx={{ fontSize: 16 }} />
            <Typography variant="body2">
              {formatTime(staff.startTime)} – {formatTime(staff.endTime)}
            </Typography>
          </Stack>
        </Stack>
      </CardActionArea>
    </Card>
  );
}
