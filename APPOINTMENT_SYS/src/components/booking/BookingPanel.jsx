import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { SoftChip } from '../StatusChip';
import BookingSummary from './BookingSummary';

// "Your appointment" side panel: live summary, total and the wizard's next/back actions.
// Sticky beside the steps on desktop; sits below them on smaller screens.
export default function BookingPanel({ service, staff, date, slot, actionLabel, actionDisabled, onAction, submitting, final = false, onBack }) {
  return (
    <Card component="aside" aria-label="Your appointment" sx={{ alignSelf: 'start', position: { md: 'sticky' }, top: { md: 96 } }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 3 }, '&:last-child': { pb: { xs: 2.5, sm: 3 } } }}>
        <Typography component="h2" sx={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.01em', mb: 0.5 }}>
          Your appointment
        </Typography>
        <BookingSummary service={service} staff={staff} date={date} slot={slot} />

        <Button
          fullWidth
          size="large"
          variant="contained"
          onClick={onAction}
          disabled={actionDisabled}
          startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : undefined}
          endIcon={submitting || final ? undefined : <ArrowForwardRoundedIcon />}
          sx={{ mt: 3 }}
        >
          {actionLabel}
        </Button>
        <Stack direction="row" sx={{ justifyContent: 'center', mt: 1 }}>
          <Button onClick={onBack} color="inherit" startIcon={<ArrowBackRoundedIcon />} sx={{ color: 'text.secondary' }}>
            Back
          </Button>
        </Stack>

        <SoftChip
          tone="success"
          icon="check"
          sx={{ mt: 2, display: 'flex', width: '100%', justifyContent: 'center', whiteSpace: 'normal', lineHeight: 1.4, py: 0.75, textAlign: 'center' }}
        >
          Reschedule or cancel anytime before your visit
        </SoftChip>
      </CardContent>
    </Card>
  );
}
