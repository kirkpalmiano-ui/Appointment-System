import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DoneAllRoundedIcon from '@mui/icons-material/DoneAllRounded';
import SoftChip from './ui/SoftChip';
import { STATUS_META } from '../utils/appointments';

// Appointment status as a soft chip: ● Pending, ✓ Confirmed, ✓✓ Completed, ✕ Cancelled.
const LOOK = {
  pending: { tone: 'pending', dot: true },
  confirmed: { tone: 'success', icon: <CheckRoundedIcon /> },
  completed: { tone: 'neutral', icon: <DoneAllRoundedIcon /> },
  cancelled: { tone: 'danger', icon: <CloseRoundedIcon /> },
};

export default function StatusChip({ status, size = 'small', sx }) {
  const meta = STATUS_META[status] || { label: status };
  const look = LOOK[status] ?? { tone: 'neutral' };
  return (
    <SoftChip tone={look.tone} dot={look.dot} icon={look.icon} size={size} sx={sx}>
      {meta.label}
    </SoftChip>
  );
}
