import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import EventBusyRoundedIcon from '@mui/icons-material/EventBusyRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import api from '../api/axios';
import { fetchAll } from '../api/fetchAll';
import AddToCalendarButton from '../components/app/AddToCalendarButton';
import Eyebrow from '../components/app/Eyebrow';
import FlowStepper from '../components/app/FlowStepper';
import PageHeader from '../components/app/PageHeader';
import BookingPanel from '../components/booking/BookingPanel';
import BookingSummary from '../components/booking/BookingSummary';
import MobileBookingBar, { MOBILE_BOOKING_BAR_SPACE } from '../components/booking/MobileBookingBar';
import { focusRingSx, handleRadioKeys, reducedMotionSx } from '../components/booking/radioKeys';
import { CATEGORY_CHIPS, categoryOf } from '../components/booking/serviceCategories';
import StaffCard from '../components/booking/StaffCard';
import TimeSlotGrid, { SlotLegend } from '../components/booking/TimeSlotGrid';
import WeekDatePicker from '../components/booking/WeekDatePicker';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import IconBadge from '../components/IconBadge';
import MobileTopBar from '../components/mobile/MobileTopBar';
import PageLoader from '../components/PageLoader';
import ServiceCard from '../components/ServiceCard';
import { SoftChip } from '../components/StatusChip';
import useIsMobile from '../hooks/useIsMobile';
import useToast from '../hooks/useToast';
import { getErrorMessage } from '../utils/errors';
import { addDays, formatDate, formatDuration, parseDate, todayString } from '../utils/format';

const STEPS = ['Service', 'Specialist', 'Date & time', 'Confirm'];
const DAYS_AHEAD = 60; // matches the server's booking limit
const NOTES_MAX = 250;

// Booking wizard. With an :id in the URL it reschedules that appointment instead.
export default function BookAppointment() {
  const { id: rescheduleId } = useParams();
  const isReschedule = Boolean(rescheduleId);
  const navigate = useNavigate();
  const showToast = useToast();
  const isMobile = useIsMobile();
  const [leaveOpen, setLeaveOpen] = useState(false); // mobile "Leave booking?" confirm

  // Choices passed from the landing page ("/book?service=…&staff=…&date=…").
  const [searchParams] = useSearchParams();
  const [prefill] = useState(() => ({
    service: isReschedule ? '' : (searchParams.get('service') ?? ''),
    staff: isReschedule ? '' : (searchParams.get('staff') ?? ''),
    date: isReschedule ? '' : (searchParams.get('date') ?? ''),
  }));
  const [prefillPending, setPrefillPending] = useState(Boolean(prefill.service));

  const [step, setStep] = useState(prefill.service ? (prefill.staff ? 2 : 1) : 0);
  const [serviceId, setServiceId] = useState(prefill.service);
  const [staffId, setStaffId] = useState(prefill.service ? prefill.staff : '');
  const [date, setDate] = useState(prefill.date);
  const [slot, setSlot] = useState(null);
  const [notes, setNotes] = useState('');
  const [serviceQuery, setServiceQuery] = useState('');
  const [serviceCategory, setServiceCategory] = useState('all'); // service type filter chip

  // "Book with Dr. X" (a specialist but no service yet): list only their services,
  // then go straight to their dates once one is picked.
  const [preferredStaffId, setPreferredStaffId] = useState(prefill.service ? '' : prefill.staff);
  const [preferredStaff, setPreferredStaff] = useState({ key: null, staff: null });
  useEffect(() => {
    if (!preferredStaffId) return undefined;
    let active = true;
    api
      .get(`/staff/${preferredStaffId}`)
      .then(({ data }) => active && setPreferredStaff({ key: preferredStaffId, staff: data.staff }))
      .catch(() => active && setPreferredStaff({ key: preferredStaffId, staff: null }));
    return () => {
      active = false;
    };
  }, [preferredStaffId]);
  const preferred = preferredStaffId && preferredStaff.key === preferredStaffId ? preferredStaff.staff : null;

  const [services, setServices] = useState(null);
  // Results are stored with the key they were fetched for, so "loading" can be
  // derived (key mismatch) instead of toggled inside effects.
  const [staffData, setStaffData] = useState({ key: null, items: [] });
  const [slotsData, setSlotsData] = useState({ key: null, slots: [], message: '' });
  const [slotsRefresh, setSlotsRefresh] = useState(0);

  const [original, setOriginal] = useState(null); // appointment being rescheduled
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState(null);

  // ----- Data loading -----
  useEffect(() => {
    let active = true;
    fetchAll('/services')
      .then((items) => active && setServices(items))
      .catch((err) => active && setLoadError(getErrorMessage(err)));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!rescheduleId) return undefined;
    let active = true;
    api
      .get(`/appointments/${rescheduleId}`)
      .then(({ data }) => {
        if (!active) return;
        const appt = data.appointment;
        setOriginal(appt);
        setNotes(appt.notes ?? '');
        // The service was removed: start from choosing a service instead.
        if (!appt.service) {
          setError('The service for this appointment is no longer offered. Please choose another service.');
          setStep(0);
          return;
        }
        setServiceId(appt.service._id);
        setStaffId(appt.staff?._id ?? '');
        setDate(appt.date >= todayString() ? appt.date : '');
        setStep(appt.staff ? 2 : 1);
      })
      .catch((err) => active && setLoadError(getErrorMessage(err)));
    return () => {
      active = false;
    };
  }, [rescheduleId]);

  useEffect(() => {
    if (!serviceId) return undefined;
    let active = true;
    fetchAll('/staff', { service: serviceId })
      .then((items) => active && setStaffData({ key: serviceId, items }))
      .catch(() => active && setStaffData({ key: serviceId, items: [] }));
    return () => {
      active = false;
    };
  }, [serviceId]);

  const slotsKey = serviceId && staffId && date ? `${serviceId}|${staffId}|${date}|${rescheduleId ?? ''}|${slotsRefresh}` : null;
  useEffect(() => {
    if (!slotsKey) return undefined;
    let active = true;
    const params = { service: serviceId, staff: staffId, date, ...(rescheduleId && { exclude: rescheduleId }) };
    api
      .get('/appointments/available-slots', { params })
      .then(({ data }) => active && setSlotsData({ key: slotsKey, slots: data.slots, message: data.message || '' }))
      .catch((err) => active && setSlotsData({ key: slotsKey, slots: [], message: getErrorMessage(err) }));
    return () => {
      active = false;
    };
  }, [slotsKey, serviceId, staffId, date, rescheduleId]);

  // Full days the specialist is off (time off), so the calendar can grey them out.
  const [daysOff, setDaysOff] = useState({ key: null, dates: [] });
  useEffect(() => {
    if (!staffId) return undefined;
    let active = true;
    api
      .get(`/staff/${staffId}/unavailable`)
      .then(({ data }) => active && setDaysOff({ key: staffId, dates: data.dates }))
      .catch(() => active && setDaysOff({ key: staffId, dates: [] }));
    return () => {
      active = false;
    };
  }, [staffId]);

  // ----- Derived values -----
  const service = services?.find((s) => s._id === serviceId) ?? null;
  const needle = serviceQuery.trim().toLowerCase();
  const preferredOffers = preferred ? new Set(preferred.services.map((s) => s._id)) : null;
  const offeredServices = (services ?? []).filter((s) => !preferredOffers || preferredOffers.has(s._id));
  // Type chips (guessed from service names); only types that have services get a chip.
  const presentCategories = CATEGORY_CHIPS.filter((c) => offeredServices.some((s) => categoryOf(s)?.id === c.id));
  const activeCategory = presentCategories.some((c) => c.id === serviceCategory) ? serviceCategory : 'all';
  const showCategoryChips = offeredServices.length > 3 && presentCategories.length > 0;
  const shownServices = offeredServices.filter(
    (s) =>
      (activeCategory === 'all' || categoryOf(s)?.id === activeCategory) &&
      (!needle || s.name.toLowerCase().includes(needle) || s.description?.toLowerCase().includes(needle))
  );
  const staffLoading = Boolean(serviceId) && staffData.key !== serviceId;
  const staffList = staffLoading ? [] : staffData.items;
  const staff = staffList.find((s) => s._id === staffId) ?? null;
  const slotsLoading = Boolean(slotsKey) && slotsData.key !== slotsKey;

  const dates = useMemo(() => {
    const today = todayString();
    return Array.from({ length: DAYS_AHEAD + 1 }, (_, i) => addDays(today, i));
  }, []);
  const offDates = daysOff.key === staffId ? daysOff.dates : [];
  const worksOn = (dateStr) => Boolean(staff?.workingDays.includes(parseDate(dateStr).getDay())) && !offDates.includes(dateStr);

  const canContinue = [Boolean(service), Boolean(staff), Boolean(slot), true][step];

  // Check the pre-filled choices once the data is in; fall back to the right step if
  // something no longer fits (removed service, specialist who doesn't offer it, day off).
  if (prefillPending && services) {
    if (!services.some((s) => s._id === serviceId)) {
      setServiceId('');
      setStaffId('');
      setStep(0);
      setPrefillPending(false);
    } else if (!staffId) {
      setPrefillPending(false);
    } else if (!staffLoading) {
      const chosen = staffList.find((s) => s._id === staffId);
      const worksDay = (d) => dates.includes(d) && chosen.workingDays.includes(parseDate(d).getDay());
      if (!chosen) {
        setStaffId('');
        setStep(1);
      } else if (!worksDay(date)) {
        setDate(dates.find(worksDay) ?? '');
      }
      setPrefillPending(false);
    }
  }

  // Each step starts at the top of the page (matters on phones).
  useEffect(() => {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [step, booked]);

  // ----- Handlers -----
  const selectService = (s) => {
    // Came from "Book with Dr. X": keep that specialist and skip to their dates
    // (the pre-fill check above then picks their first working day).
    if (preferredOffers?.has(s._id)) {
      setServiceId(s._id);
      setStaffId(preferredStaffId);
      setDate('');
      setSlot(null);
      setPreferredStaffId('');
      setPrefillPending(true);
      setStep(2);
      return;
    }
    if (s._id !== serviceId) {
      setServiceId(s._id);
      setStaffId('');
      setDate('');
      setSlot(null);
    }
    setStep(1);
  };

  const selectStaff = (s) => {
    if (s._id !== staffId) {
      setStaffId(s._id);
      setSlot(null);
      // Keep an already-chosen day they work; otherwise jump to the first day this person works.
      const works = (d) => s.workingDays.includes(parseDate(d).getDay());
      setDate(date && dates.includes(date) && works(date) ? date : (dates.find(works) ?? ''));
    }
    setStep(2);
  };

  const selectDate = (d) => {
    setDate(d);
    setSlot(null);
  };

  const submit = async () => {
    setSubmitting(true);
    setError('');
    const payload = { service: serviceId, staff: staffId, date, startTime: slot.startTime, notes: notes.trim() };
    try {
      if (isReschedule) {
        await api.put(`/appointments/${rescheduleId}`, payload);
        showToast('Appointment rescheduled. It will be confirmed again by our staff.');
        navigate('/appointments');
      } else {
        const { data } = await api.post('/appointments', payload);
        setBooked(data.appointment);
      }
    } catch (err) {
      setError(getErrorMessage(err));
      // The slot was taken by someone else in the meantime: refresh and pick again.
      if (err.response?.status === 409) {
        setSlot(null);
        setSlotsRefresh((n) => n + 1);
        setStep(2);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resetWizard = () => {
    setBooked(null);
    setServiceId('');
    setStaffId('');
    setDate('');
    setSlot(null);
    setNotes('');
    setError('');
    setStep(0);
  };

  // ----- Render -----
  if (loadError) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Alert severity="error" action={<Button component={RouterLink} to="/appointments">Back</Button>}>
          {loadError}
        </Alert>
      </Container>
    );
  }
  if (!services || (isReschedule && !original)) return <PageLoader />;

  if (isReschedule && !['pending', 'confirmed'].includes(original.status)) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Alert severity="info" action={<Button component={RouterLink} to="/appointments">Back</Button>}>
          This appointment is {original.status} and can no longer be rescheduled.
        </Alert>
      </Container>
    );
  }

  if (booked) {
    return (
      <Container maxWidth="sm" sx={{ py: { xs: 4, md: 8 }, pb: { xs: 'calc(32px + env(safe-area-inset-bottom))', md: 8 } }}>
        <Card>
          <CardContent sx={{ p: { xs: 3, sm: 5 }, '&:last-child': { pb: { xs: 3, sm: 5 } } }}>
            <Box sx={{ textAlign: 'center' }}>
              <IconBadge icon={CheckCircleRoundedIcon} color="success" size={72} sx={{ mb: 2.5, borderRadius: 5, '& svg': { fontSize: 40 } }} />
              <Typography
                variant="h1"
                sx={{ fontSize: { xs: '2rem', sm: '2.5rem' }, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1, mb: 1.5 }}
              >
                Appointment requested!
              </Typography>
              <Typography color="text.secondary">
                Your booking is <strong>pending</strong>. We&apos;ll confirm it shortly. You can track it in My Appointments.
              </Typography>
            </Box>
            <Box sx={{ my: 3, px: { xs: 2, sm: 2.5 }, py: 1, borderRadius: 4, border: 1, borderColor: 'divider', bgcolor: 'field.main' }}>
              <BookingSummary service={service} staff={staff} date={booked.date} slot={booked} />
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} useFlexGap spacing={1.5} sx={{ justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button component={RouterLink} to="/appointments" variant="contained">
                View my appointments
              </Button>
              {/* The POST response is populated, but fall back to the chosen objects just in case. */}
              <AddToCalendarButton
                appointment={{ ...booked, service: service ?? booked.service, staff: staff ?? booked.staff }}
                variant="outlined"
              />
              <Button onClick={resetWizard} variant="outlined">
                Book another
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    );
  }

  const rescheduleSubtitle = 'Pick a new time. You can also change the service or specialist.';
  const titles = [isReschedule ? 'Reschedule appointment.' : 'Book an appointment.', 'Choose a specialist.', 'Pick a time.', 'Review & confirm.'];
  const subtitles = [
    isReschedule ? rescheduleSubtitle : 'Choose a service, a specialist and a time that works for you.',
    service ? `Everyone below offers ${service.name}.` : 'Pick who you would like to see.',
    isReschedule ? rescheduleSubtitle : `Live availability for the next ${DAYS_AHEAD} days.`,
    'Check the details, add a note if you like, then confirm.',
  ];
  const actionLabels = [
    'Continue to specialist',
    'Continue to date & time',
    'Review & confirm',
    submitting ? 'Saving...' : isReschedule ? 'Confirm new time' : 'Confirm booking',
  ];

  const actionDisabled = step < 3 ? !canContinue : submitting || !slot;
  const onAction = () => (step < 3 ? setStep(step + 1) : submit());
  const goBack = () => (step === 0 ? navigate(-1) : setStep(step - 1));

  // ----- Mobile-only values -----
  const mobileTitles = ['Choose a service.', 'Choose a specialist.', 'Pick a time.', 'Confirm.'];
  const serviceContext = service ? `${service.name} · ${formatDuration(service.durationMinutes)}` : '';
  const mobileSubtitles = [subtitles[0], serviceContext || subtitles[1], serviceContext || subtitles[2], subtitles[3]];
  const mobileActionLabels = ['Continue', 'Continue', 'Review & confirm', actionLabels[3]];
  const exitPath = isReschedule ? '/appointments' : '/dashboard';
  // Only ask before leaving when there is something to lose.
  const hasChoices = isReschedule
    ? Boolean(slot) || notes !== (original.notes ?? '')
    : Boolean(serviceId || staffId || slot || notes.trim());
  const closeBooking = () => (hasChoices ? setLeaveOpen(true) : navigate(exitPath));

  // Staff cards: a grid on desktop, a horizontally scrolling row on phones/tablets.
  const staffListSx = isMobile ? staffRowSx : staffGridSx;

  const dateTimeContent = staff && (
    <>
      <WeekDatePicker dates={dates} value={date} onChange={selectDate} isDisabled={(d) => !worksOn(d)} />

      <Box sx={{ borderTop: '1px dashed', borderColor: 'divider', mt: 3, pt: 3 }}>
        <Stack
          direction="row"
          useFlexGap
          sx={{ justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 2, mb: 2 }}
        >
          <Typography component="h2" sx={{ fontWeight: 800, fontSize: 18 }}>
            Available times
          </Typography>
          {date && (
            <Typography variant="body2" color="text.secondary">
              {formatDate(date, { weekday: 'long', month: 'long', day: 'numeric' })}
            </Typography>
          )}
        </Stack>
        {!date && <Typography color="text.secondary">Select a date to see available times.</Typography>}
        {date && !slotsLoading && slotsData.slots.length === 0 && (
          <Alert severity="info">{slotsData.message || 'No times available on this day.'}</Alert>
        )}
        {date && !slotsLoading && slotsData.slots.length > 0 && !slotsData.slots.some((s) => s.available) && (
          <Alert severity="warning" sx={{ mb: 2.5 }}>
            This day is fully booked. Please choose another date.
          </Alert>
        )}
        {date && (slotsLoading || slotsData.slots.length > 0) && (
          <>
            <TimeSlotGrid slots={slotsData.slots} loading={slotsLoading} value={slot?.startTime} onChange={setSlot} />
            <Box sx={{ borderTop: '1px dashed', borderColor: 'divider', mt: 3, pt: 2 }}>
              <SlotLegend />
            </Box>
          </>
        )}
      </Box>
    </>
  );

  const stepContent = (
    <>
      {/* Step 1: service */}
      {step === 0 &&
        (services.length === 0 ? (
          <Card>
            <EmptyState title="No services available" description="Please check back later." icon={EventBusyRoundedIcon} />
          </Card>
        ) : (
          <Stack spacing={2}>
            {preferred && (
              <Alert
                severity="info"
                icon={false}
                action={
                  <Button color="inherit" size="small" onClick={() => setPreferredStaffId('')}>
                    Show all
                  </Button>
                }
              >
                Showing services offered by <strong>{preferred.name}</strong>.
              </Alert>
            )}
            {services.length > 3 && (
              <TextField
                placeholder="Search services"
                value={serviceQuery}
                onChange={(e) => setServiceQuery(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRoundedIcon />
                      </InputAdornment>
                    ),
                  },
                  htmlInput: { 'aria-label': 'Search services', maxLength: 60 },
                }}
              />
            )}
            {showCategoryChips && (
              <Stack
                direction="row"
                useFlexGap
                role="radiogroup"
                aria-label="Filter services by type"
                onKeyDown={handleRadioKeys}
                sx={isMobile ? chipRowSx : { flexWrap: 'wrap', gap: 1 }}
              >
                {[{ id: 'all', label: 'All' }, ...presentCategories].map((c) => (
                  <FilterChip key={c.id} label={c.label} selected={activeCategory === c.id} onClick={() => setServiceCategory(c.id)} />
                ))}
              </Stack>
            )}
            {shownServices.length > 0 && (
              <Stack spacing={1.5} role="radiogroup" aria-label="Services" onKeyDown={handleRadioKeys}>
                {shownServices.map((s) => (
                  <ServiceCard
                    key={s._id}
                    service={s}
                    index={services.indexOf(s)}
                    selected={s._id === serviceId}
                    onSelect={selectService}
                  />
                ))}
              </Stack>
            )}
            {shownServices.length === 0 && (
              <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                {needle ? <>No services match &ldquo;{serviceQuery.trim()}&rdquo;.</> : 'No services of this type.'}
              </Typography>
            )}
          </Stack>
        ))}

      {/* Step 2: specialist */}
      {step === 1 && (
        <>
          {!staffLoading && staffList.length === 0 ? (
            <Card>
              <EmptyState
                title="No specialists available"
                description="Nobody offers this service right now. Please choose another service."
                icon={EventBusyRoundedIcon}
              />
            </Card>
          ) : (
            <Box role="radiogroup" aria-label="Specialists" onKeyDown={handleRadioKeys} sx={staffListSx}>
              {staffLoading && [1, 2].map((n) => <Skeleton key={n} variant="rounded" height={220} sx={{ borderRadius: 6 }} />)}
              {staffList.map((s) => (
                <StaffCard key={s._id} staff={s} selected={s._id === staffId} onSelect={selectStaff} />
              ))}
            </Box>
          )}
        </>
      )}

      {/* Step 3: date & time */}
      {step === 2 && (
        <Stack spacing={3}>
          {staffList.length > 0 && (
            <Box>
              <Eyebrow sx={{ mb: 1.25 }}>
                <span id="step2-specialist">Specialist</span>
              </Eyebrow>
              <Box role="radiogroup" aria-labelledby="step2-specialist" onKeyDown={handleRadioKeys} sx={staffListSx}>
                {staffList.map((s) => (
                  <StaffCard key={s._id} staff={s} compact selected={s._id === staffId} onSelect={selectStaff} />
                ))}
              </Box>
            </Box>
          )}
          {!staff && staffLoading && <Skeleton variant="rounded" height={320} sx={{ borderRadius: 6 }} />}
          {!staff && !staffLoading && (
            <Alert severity="warning" action={<Button onClick={() => setStep(1)}>Choose</Button>}>
              This specialist is no longer available. Please choose another one.
            </Alert>
          )}
          {/* Phones/tablets: laid out flat on the page so the 7 day chips get the full width. */}
          {staff &&
            (isMobile ? (
              <Box>{dateTimeContent}</Box>
            ) : (
              <Card>
                <CardContent sx={{ p: { xs: 2, sm: 3 }, '&:last-child': { pb: { xs: 2.5, sm: 3 } } }}>{dateTimeContent}</CardContent>
              </Card>
            ))}
        </Stack>
      )}

      {/* Step 4: confirm */}
      {/* Mobile has no side panel, so the full summary sits above the notes. */}
      {step === 3 && isMobile && (
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ p: 2.5, pt: 1, '&:last-child': { pb: 2.5 } }}>
            <BookingSummary service={service} staff={staff} date={date} slot={slot} />
          </CardContent>
        </Card>
      )}
      {step === 3 && (
        <Card>
          <CardContent sx={{ p: { xs: 2.5, sm: 3 }, '&:last-child': { pb: { xs: 2.5, sm: 3 } } }}>
            <Typography component="h2" sx={{ fontWeight: 800, fontSize: 18, mb: 2 }}>
              Anything we should know?
            </Typography>
            <TextField
              label="Notes for the specialist (optional)"
              placeholder="Anything we should know before your visit?"
              multiline
              minRows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, NOTES_MAX))}
              helperText={`${notes.length}/${NOTES_MAX}`}
              slotProps={{ formHelperText: { sx: { textAlign: 'right' } } }}
            />
            <SoftChip tone="info" sx={{ mt: 2, display: 'flex', alignItems: 'flex-start', whiteSpace: 'normal', lineHeight: 1.45, py: 1, borderRadius: 3, '& > span:first-of-type': { mt: '6px' } }}>
              {isReschedule
                ? 'Rescheduled appointments go back to pending until our staff confirms them.'
                : 'Your appointment will be pending until our staff confirms it.'}
            </SoftChip>
          </CardContent>
        </Card>
      )}
    </>
  );

  const errorAlert = error && (
    <Alert severity="error" onClose={() => setError('')} sx={{ mb: 3 }}>
      {error}
    </Alert>
  );

  // ----- Mobile & tablet: own top bar, progress segments and a sticky bottom action bar -----
  if (isMobile) {
    return (
      <>
        <MobileTopBar
          left={
            <IconButton aria-label="Back" onClick={goBack} disabled={submitting} sx={iconButtonSx}>
              <ArrowBackRoundedIcon />
            </IconButton>
          }
          center={
            <Typography component="p" sx={{ fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap' }}>
              Step {step + 1} of {STEPS.length}
            </Typography>
          }
          right={
            <IconButton aria-label="Close booking" onClick={closeBooking} disabled={submitting} sx={iconButtonSx}>
              <CloseRoundedIcon />
            </IconButton>
          }
        />

        <Box sx={{ maxWidth: 640, mx: 'auto', px: GUTTER, pt: 1, pb: MOBILE_BOOKING_BAR_SPACE }}>
          <StepProgress step={step} total={STEPS.length} label={STEPS[step]} />

          <Box sx={{ mt: 3, mb: 3 }}>
            <Typography variant="h1" sx={{ fontSize: { xs: 32, sm: 34 }, fontWeight: 800, letterSpacing: '-0.055em', lineHeight: 1 }}>
              {mobileTitles[step]}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1.25 }}>
              {mobileSubtitles[step]}
            </Typography>
          </Box>

          {errorAlert}

          <Box component="section" aria-label={STEPS[step]} sx={{ minWidth: 0 }}>
            {stepContent}
          </Box>
        </Box>

        <MobileBookingBar
          service={service}
          date={date}
          slot={slot}
          actionLabel={mobileActionLabels[step]}
          actionDisabled={actionDisabled}
          onAction={onAction}
          submitting={submitting}
          final={step === 3}
        />

        <ConfirmDialog
          open={leaveOpen}
          title="Leave booking?"
          message="Your choices won't be saved."
          confirmText="Leave"
          cancelText="Keep booking"
          color="primary"
          onConfirm={() => navigate(exitPath)}
          onClose={() => setLeaveOpen(false)}
        />
      </>
    );
  }

  return (
    <Container sx={{ py: { xs: 4, md: 6 } }}>
      <PageHeader title={titles[step]} subtitle={subtitles[step]} />

      <Card sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
        <FlowStepper
          steps={STEPS}
          active={step}
          isDone={(i) => [Boolean(service), Boolean(staff), Boolean(slot), false][i]}
          // Only allow jumping to steps whose earlier steps are complete.
          canJump={(i) => i === 0 || [service, staff, slot].slice(0, i).every(Boolean)}
          onJump={setStep}
        />
      </Card>

      {errorAlert}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1fr) 380px' },
          gap: 3,
          alignItems: 'start',
        }}
      >
        <Box component="section" aria-label={STEPS[step]} sx={{ minWidth: 0 }}>
          {stepContent}
        </Box>

        <BookingPanel
          service={service}
          staff={staff}
          date={date}
          slot={slot}
          actionLabel={actionLabels[step]}
          actionDisabled={actionDisabled}
          onAction={onAction}
          submitting={submitting}
          final={step === 3}
          onBack={goBack}
        />
      </Box>
    </Container>
  );
}

// Side padding of the mobile page (matches the theme's Container gutters).
const GUTTER = { xs: '18px', sm: '24px' };
const BLEED = { xs: '-18px', sm: '-24px' };

// 44px touch targets for the mobile top bar buttons.
const iconButtonSx = { width: 44, height: 44 };

// Hidden scrollbar for the swipeable rows (they still scroll by touch, wheel and keyboard focus).
const hiddenScrollbarSx = { scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } };

// Mobile: filter chips in one swipeable line, bleeding to the screen edges.
const chipRowSx = {
  flexWrap: 'nowrap',
  gap: 1,
  overflowX: 'auto',
  scrollSnapType: 'x proximity',
  scrollPaddingInline: GUTTER,
  mx: BLEED,
  px: GUTTER,
  py: 0.5,
  '& > *': { flex: 'none', scrollSnapAlign: 'start', whiteSpace: 'nowrap' },
  ...hiddenScrollbarSx,
};

// Mobile: specialist cards in a swipeable row (~220px each). Vertical padding keeps the
// selected card's focus ring from being clipped by the scroll container.
const staffRowSx = {
  display: 'flex',
  gap: 1.5,
  overflowX: 'auto',
  scrollSnapType: 'x mandatory',
  scrollPaddingInline: GUTTER,
  mx: BLEED,
  px: GUTTER,
  py: '6px',
  '& > *': { flex: '0 0 220px', minWidth: 0, scrollSnapAlign: 'start' },
  ...hiddenScrollbarSx,
};

// Mobile progress: one rounded segment per step; done and current steps are filled.
function StepProgress({ step, total, label }) {
  return (
    <Box
      role="progressbar"
      aria-label="Booking progress"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={step + 1}
      aria-valuetext={`Step ${step + 1} of ${total}: ${label}`}
      sx={{ display: 'flex', gap: 0.75 }}
    >
      {Array.from({ length: total }, (_, i) => (
        <Box
          key={i}
          sx={{
            flex: 1,
            height: 4,
            borderRadius: 999,
            bgcolor: i <= step ? 'primary.main' : 'divider',
            transition: 'background-color 200ms',
            '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
          }}
        />
      ))}
    </Box>
  );
}

// Specialist cards: 1 column on phones, 2 on tablets, 3 on large screens.
const staffGridSx = {
  display: 'grid',
  gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' },
  gap: 2,
};

// Service type filter: the active one is filled dark, the rest are ghost chips.
function FilterChip({ label, selected, onClick }) {
  return (
    <ButtonBase
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      sx={[
        {
          px: 2,
          minHeight: { xs: 44, md: 38 }, // 44px touch target on phones/tablets
          borderRadius: 999,
          fontSize: 14,
          fontWeight: 700,
          border: '1.5px solid',
          borderColor: selected ? 'text.primary' : 'divider',
          bgcolor: selected ? 'text.primary' : 'field.main',
          color: selected ? 'background.paper' : 'text.primary',
          transition: 'background-color 150ms, border-color 150ms, color 150ms',
          '&:hover': selected ? undefined : { borderColor: 'primary.main' },
        },
        focusRingSx,
        reducedMotionSx,
      ]}
    >
      {label}
    </ButtonBase>
  );
}
