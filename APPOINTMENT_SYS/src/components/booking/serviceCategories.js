import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import EventRepeatOutlinedIcon from '@mui/icons-material/EventRepeatOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';

// Services have no category field, so they're grouped by keywords in their name.
// Checked in order: "Follow-up consultation" counts as a follow-up, not a consultation.
// TODO(backend): a real `category` on services would replace this guesswork.
export const SERVICE_CATEGORIES = [
  { id: 'follow-up', label: 'Follow-up', test: /follow/i, icon: EventRepeatOutlinedIcon },
  { id: 'counseling', label: 'Counseling', test: /counsel|therapy/i, icon: ForumOutlinedIcon },
  { id: 'assessment', label: 'Assessment', test: /check|exam|assess/i, icon: AssignmentTurnedInOutlinedIcon },
  { id: 'consultation', label: 'Consultation', test: /consult/i, icon: MedicalServicesOutlinedIcon },
];

// Order of the filter chips.
export const CATEGORY_CHIPS = ['consultation', 'assessment', 'counseling', 'follow-up'].map((id) =>
  SERVICE_CATEGORIES.find((c) => c.id === id)
);

export const categoryOf = (service) => SERVICE_CATEGORIES.find((c) => c.test.test(service.name)) ?? null;

export const serviceIcon = (service) => categoryOf(service)?.icon ?? MonitorHeartOutlinedIcon;

// Soft tile colours, rotated by list position.
export const TILE_TONES = [
  { bg: 'accent.main', fg: 'accent.contrastText' },
  { bg: 'successChip.light', fg: 'successChip.main' },
  { bg: 'pendingChip.light', fg: 'pendingChip.main' },
  { bg: 'infoChip.light', fg: 'infoChip.main' },
];
