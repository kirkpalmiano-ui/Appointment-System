import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import { bookingLink } from './bookingLink';
import { DUO_PHOTO, displayName, mediaFor, nameWithoutTitle } from './specialistMedia';
import useNextAvailable from './useNextAvailable';
import { formatDate, formatTime, formatTimeRange, formatWorkingDays, initials, relativeDay, todayString } from '../../utils/format';

const FULL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
// Chip order in the cards: Monday first.
const WEEK = [1, 2, 3, 4, 5, 6, 0];

// Below 1024px the page stacks; below 768px it's a phone layout.
const tablet = (styles) => (theme) => ({ [theme.breakpoints.down('md')]: styles });
const phone = (styles) => (theme) => ({ [theme.breakpoints.down(768)]: styles });

// Same frosted surface as the app's cards (theme MuiCard).
const frostSx = (theme) => ({
  border: '1px solid',
  borderColor: 'divider',
  backgroundColor: 'rgba(255, 255, 255, 0.82)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  boxShadow: '0 24px 50px -28px rgba(60, 50, 160, 0.28)',
  ...theme.applyStyles('dark', { backgroundColor: 'rgba(20, 26, 54, 0.74)', boxShadow: '0 24px 50px -28px rgba(0, 0, 0, 0.65)' }),
});

// Role chip colours by specialist type: [light bg, light text, dark bg, dark text].
const ROLE_TONES = {
  counselor: ['#eef0ff', '#4338ca', 'rgba(129, 140, 248, 0.18)', '#c7ccff'],
  specialist: ['#e6fbf7', '#0f766e', 'rgba(45, 212, 191, 0.16)', '#5eead4'],
  'general practitioner': ['#fdf0f7', '#be185d', 'rgba(244, 114, 182, 0.16)', '#f9a8d4'],
};
const toneSx = ([bg, ink, darkBg, darkInk]) => (theme) => ({
  bgcolor: bg,
  color: ink,
  ...theme.applyStyles('dark', { bgcolor: darkBg, color: darkInk }),
});
const roleTone = (role = '') => ROLE_TONES[role.trim().toLowerCase()] ?? ROLE_TONES.counselor;

const GREEN = ['#e7f7ee', '#15803d', 'rgba(134, 239, 172, 0.14)', '#86efac'];
const AMBER = ['#fef3c7', '#b45309', 'rgba(251, 191, 36, 0.14)', '#fcd34d'];

// "8:00 AM" -> "8 AM" for the compact opening-hours stat.
const shortTime = (hhmm) => formatTime(hhmm).replace(':00', '');

// Clinic-wide days and hours, from everyone's schedules: "Mon–Sat", "Open 8 AM – 6 PM".
function openingHours(staff) {
  if (!staff?.length) return null;
  const days = [...new Set(staff.flatMap((s) => s.workingDays))].sort((a, b) => WEEK.indexOf(a) - WEEK.indexOf(b));
  const order = days.map((d) => WEEK.indexOf(d));
  const consecutive = days.length > 2 && order.every((o, i) => i === 0 || o === order[i - 1] + 1);
  const start = staff.map((s) => s.startTime).sort()[0];
  const end = staff.map((s) => s.endTime).sort().at(-1);
  return {
    days: consecutive ? `${SHORT_DAYS[days[0]]}–${SHORT_DAYS[days.at(-1)]}` : days.map((d) => SHORT_DAYS[d]).join(', '),
    hours: `Open ${shortTime(start)} – ${shortTime(end)}`,
  };
}

// Natural list: "Monday, Wednesday and Friday".
function listDays(days) {
  const names = WEEK.filter((d) => days.includes(d)).map((d) => FULL_DAYS[d]);
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : (names[0] ?? 'no days');
}

function Badge({ children }) {
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        px: 1.5,
        py: 0.5,
        mb: 3,
        borderRadius: 999,
        bgcolor: 'accent.main',
        color: 'accent.contrastText',
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main' }} />
      {children}
    </Box>
  );
}

function Dot({ tone }) {
  return <Box component="span" sx={[{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', flex: 'none' }, (theme) => ({ bgcolor: tone[1], ...theme.applyStyles('dark', { bgcolor: tone[3] }) })]} />;
}

// Round avatar: the person's photo on a soft gradient, or their initials.
function SpecialistAvatar({ person, size = 64 }) {
  const photo = mediaFor(person)?.photo;
  return (
    <Box
      sx={(theme) => ({
        flex: 'none',
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        display: 'grid',
        placeItems: 'center',
        background: 'linear-gradient(135deg, #e0e7ff 0%, #fce7f3 100%)',
        color: 'primary.dark',
        fontWeight: 800,
        fontSize: size * 0.34,
        boxShadow: '0 0 0 3px rgba(255, 255, 255, 0.9)',
        ...theme.applyStyles('dark', {
          background: 'linear-gradient(135deg, #312e81 0%, #5b1d4a 100%)',
          color: '#c7ccff',
          boxShadow: '0 0 0 3px rgba(20, 26, 54, 0.9)',
        }),
      })}
    >
      {photo ? (
        <Box component="img" src={photo} alt={`Photo of ${displayName(person)}`} width={size} height={size} loading="lazy" sx={{ width: size, height: size, objectFit: 'cover' }} />
      ) : (
        initials(nameWithoutTitle(person.name))
      )}
    </Box>
  );
}

// Floating frosted name tag on the photo stage (decorative; the cards below carry the same info).
function StageTag({ icon, title, subtitle, sx }) {
  return (
    <Stack
      direction="row"
      spacing={1.25}
      aria-hidden
      sx={[
        frostSx,
        { position: 'absolute', zIndex: 1, alignItems: 'center', px: 1.75, py: 1.25, borderRadius: '18px', whiteSpace: 'nowrap' },
        phone({ px: 1.25, py: 0.875, borderRadius: '14px', '& .cq-tag-icon': { width: 28, height: 28, fontSize: 11 }, '& .cq-tag-title': { fontSize: 12.5 }, '& .cq-tag-sub': { fontSize: 11 } }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {icon}
      <Box sx={{ minWidth: 0 }}>
        <Typography className="cq-tag-title" sx={{ fontWeight: 700, fontSize: 14, lineHeight: 1.25 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography className="cq-tag-sub" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 0.75, fontSize: 12.5, color: 'text.secondary', lineHeight: 1.4 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
    </Stack>
  );
}

function TagChip({ children, tone }) {
  return (
    <Box
      className="cq-tag-icon"
      sx={[{ display: 'grid', placeItems: 'center', flex: 'none', width: 34, height: 34, borderRadius: '10px', fontWeight: 800, fontSize: 12 }, toneSx(tone)]}
    >
      {children}
    </Box>
  );
}

// Right column: halo, the cut-out group photo, and three floating tags placed clear of both faces.
function Stage({ staff, next }) {
  const today = todayString();
  const left = staff?.find((s) => s._id === DUO_PHOTO.left);
  const right = staff?.find((s) => s._id === DUO_PHOTO.right);
  const rightNext = right && next?.[right._id];

  return (
    <Box sx={[{ position: 'relative', height: 600 }, tablet({ height: 420 })]}>
      {/* Halo behind the people, same as the hero's circle. */}
      <Box
        aria-hidden
        sx={[
          (theme) => ({
            position: 'absolute',
            top: 20,
            left: '50%',
            width: 560,
            height: 'auto',
            maxWidth: '100%',
            aspectRatio: '1',
            borderRadius: '50%',
            transform: 'translateX(-50%)',
            background: 'radial-gradient(circle, #d7ddff 0%, #e2e7ff 55%, #eceffe 68%, rgba(238,242,255,0) 71%)',
            ...theme.applyStyles('dark', {
              background: 'radial-gradient(circle, #2c3184 0%, #20246a 50%, rgba(32,36,106,0.55) 64%, rgba(11,16,36,0) 71%)',
            }),
          }),
          tablet({ width: 400, top: 10 }),
        ]}
      />
      <Box
        component="img"
        src={DUO_PHOTO.src}
        alt={left && right ? `${left.name} in a dark suit standing beside ${right.name} in a white coat` : 'Two of our specialists'}
        width={DUO_PHOTO.width}
        height={DUO_PHOTO.height}
        loading="lazy"
        sx={[
          {
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            height: 590,
            width: 'auto',
            maxWidth: 'none',
            // Melt the bottom edge into the page, like the hero photo.
            maskImage: 'linear-gradient(to bottom, #000 72%, transparent 98%)',
            WebkitMaskImage: 'linear-gradient(to bottom, #000 72%, transparent 98%)',
          },
          tablet({ height: 410 }),
        ]}
      />

      {left && (
        <StageTag
          icon={<TagChip tone={ROLE_TONES.counselor}>{initials(nameWithoutTitle(left.name))}</TagChip>}
          title={displayName(left)}
          subtitle={`${left.specialization || 'Specialist'} · ${formatWorkingDays(left.workingDays)}`}
          // Over his shoulder, below his chin.
          sx={[{ left: 0, top: 215 }, tablet({ top: 150 }), phone({ top: 145, '& .cq-tag-sub': { display: 'none' } })]}
        />
      )}
      {right && (
        <StageTag
          icon={<TagChip tone={ROLE_TONES['general practitioner']}>{initials(nameWithoutTitle(right.name))}</TagChip>}
          title={displayName(right)}
          subtitle={
            rightNext === undefined ? null : rightNext?.date === today ? (
              <>
                <Dot tone={GREEN} /> Available today
              </>
            ) : rightNext ? (
              <>
                <Dot tone={AMBER} /> Next available {formatDate(rightNext.date, { weekday: 'short' })}
              </>
            ) : (
              right.specialization || 'Specialist'
            )
          }
          // Beside her, below her chin.
          sx={[{ right: 0, top: 300 }, tablet({ top: 215 }), phone({ top: 210 })]}
        />
      )}
      <StageTag
        icon={
          <Box className="cq-tag-icon" sx={{ display: 'grid', placeItems: 'center', flex: 'none', width: 34, height: 34, borderRadius: '10px', bgcolor: 'success.main', color: '#fff' }}>
            <CheckRoundedIcon sx={{ fontSize: 18 }} />
          </Box>
        }
        title="Verified & licensed"
        subtitle="Every specialist is checked by our clinic"
        sx={[{ left: 0, top: 440 }, tablet({ top: 310 }), phone({ display: 'none' })]}
      />
    </Box>
  );
}

function SpecialistCard({ person, next, highlighted, canBook }) {
  const name = displayName(person);
  const today = todayString();
  const isToday = next?.date === today;
  const services = person.services ?? [];
  const role = person.specialization || 'Specialist';

  return (
    <Box
      sx={[
        frostSx,
        {
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          p: 2.5,
          borderRadius: '24px',
          transition: 'transform 200ms ease, border-color 200ms ease',
          '&:hover': { transform: 'translateY(-4px)' },
          '@media (prefers-reduced-motion: reduce)': { transition: 'none', '&:hover': { transform: 'none' } },
        },
        highlighted && ((theme) => ({ borderColor: `rgba(${theme.vars.palette.primary.mainChannel} / 0.55)`, boxShadow: `0 24px 50px -26px rgba(${theme.vars.palette.primary.mainChannel} / 0.55)` })),
        // Hover / keyboard focus: the outline takes the colour of their role chip.
        (theme) => {
          const [, ink, , darkInk] = roleTone(role);
          return {
            '&:hover, &:focus-within': { borderColor: ink },
            ...theme.applyStyles('dark', { '&:hover, &:focus-within': { borderColor: darkInk } }),
          };
        },
      ]}
    >
      {/* Header: avatar, name + verified, role chip; availability chip top-right. */}
      <Stack direction="row" spacing={1.75} sx={{ alignItems: 'center' }}>
        <SpecialistAvatar person={person} />
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            {/* The badge sits inline so it stays right after the name even when a long name wraps. */}
            <Typography component="h3" sx={{ fontWeight: 700, fontSize: 18, lineHeight: 1.25 }}>
              {name}
              <VerifiedRoundedIcon titleAccess="Verified" sx={{ fontSize: 17, color: 'primary.main', ml: 0.5, verticalAlign: '-2px' }} />
            </Typography>
          </Stack>
          <Box component="span" sx={[{ display: 'inline-block', mt: 0.75, px: 1.25, borderRadius: 999, fontSize: 12, fontWeight: 600, lineHeight: '24px', whiteSpace: 'nowrap' }, toneSx(roleTone(role))]}>
            {role}
          </Box>
        </Box>
        {next && (
          <Box
            sx={[
              { alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 0.75, flex: 'none', px: 1.25, borderRadius: 999, fontSize: 12, fontWeight: 700, lineHeight: '26px' },
              toneSx(isToday ? GREEN : AMBER),
            ]}
          >
            <Dot tone={isToday ? GREEN : AMBER} />
            {isToday ? 'Today' : formatDate(next.date, { weekday: 'short' })}
          </Box>
        )}
      </Stack>

      {/* Working days */}
      <Box role="img" aria-label={`Works ${listDays(person.workingDays)}`} sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.75, mt: 2.5 }}>
        {WEEK.map((d) => {
          const works = person.workingDays.includes(d);
          return (
            <Box
              key={d}
              aria-hidden
              sx={{
                textAlign: 'center',
                borderRadius: '10px',
                fontSize: 12,
                fontWeight: 700,
                lineHeight: '30px',
                bgcolor: works ? 'accent.main' : 'transparent',
                color: works ? 'primary.main' : 'text.disabled',
                border: '1px solid',
                borderColor: works ? 'transparent' : 'divider',
              }}
            >
              {SHORT_DAYS[d][0]}
            </Box>
          );
        })}
      </Box>

      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', color: 'text.secondary', mt: 1.75 }}>
        <ScheduleRoundedIcon sx={{ fontSize: 16 }} />
        <Typography variant="body2">{formatTimeRange(person.startTime, person.endTime)}</Typography>
      </Stack>

      {services.length > 0 && (
        <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: 0.75, mt: 1.75 }}>
          {services.slice(0, 2).map((s) => (
            <Box key={s._id} sx={{ px: 1.25, borderRadius: 999, border: 1, borderColor: 'divider', fontSize: 12, lineHeight: '24px', color: 'text.secondary' }}>
              {s.name}
            </Box>
          ))}
          {services.length > 2 && (
            <Box sx={{ px: 1.25, borderRadius: 999, border: 1, borderColor: 'divider', fontSize: 12, lineHeight: '24px', color: 'text.secondary' }}>
              +{services.length - 2} more
            </Box>
          )}
        </Stack>
      )}

      <Box sx={{ flexGrow: 1 }} />

      {/* Footer: next opening + Book */}
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'space-between', mt: 2.5, pt: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ minWidth: 0 }}>
          {next === undefined ? (
            <>
              <Skeleton width={80} height={16} />
              <Skeleton width={120} />
            </>
          ) : next ? (
            <>
              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', lineHeight: 1.3 }}>
                {next.live ? 'Next available' : 'Next opening'}
              </Typography>
              <Typography sx={[{ fontWeight: 700, fontSize: 14 }, isToday && toneSx([null, GREEN[1], null, GREEN[3]])]}>
                {relativeDay(next.date)} · {formatTime(next.time)}
              </Typography>
            </>
          ) : null}
        </Box>
        {canBook && (
          <Button
            component={RouterLink}
            to={bookingLink({ staff: person._id, date: next?.date })}
            variant={highlighted ? 'contained' : 'outlined'}
            aria-label={`Book with ${name}`}
            endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />}
            sx={{ flex: 'none', borderRadius: 999, px: 2.25, minHeight: 40 }}
          >
            Book
          </Button>
        )}
      </Stack>
    </Box>
  );
}

// "Meet the people behind your care": photo stage + one card per bookable specialist.
export default function SpecialistsSection({ staff, services, canBook, canSeeLive }) {
  const next = useNextAvailable(staff, canSeeLive);
  const hours = openingHours(staff);

  // The soonest opening gets the highlighted card.
  const soonest = next
    ? Object.entries(next)
        .filter(([, v]) => v)
        .sort(([, a], [, b]) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))[0]?.[0]
    : null;

  const scrollToCards = (event) => {
    event.preventDefault();
    document.getElementById('specialist-cards')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const stats = [
    staff && [staff.length, staff.length === 1 ? 'Specialist' : 'Specialists'],
    services && [services.length, services.length === 1 ? 'Service offered' : 'Services offered'],
    hours && [hours.days, hours.hours],
  ].filter(Boolean);

  return (
    <>
      <Box
        sx={[
          { display: 'grid', gridTemplateColumns: '1fr 1.05fr', gap: 6, alignItems: 'center' },
          tablet({ gridTemplateColumns: '1fr', gap: 4 }),
        ]}
      >
        <Box>
          <Badge>Our Doctors</Badge>
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: '2.5rem', sm: '3.25rem', md: '3.6rem', lg: '4.25rem' },
              fontWeight: 800,
              letterSpacing: '-0.055em',
              lineHeight: 0.98,
              mb: 2.5,
            }}
          >
            Meet the people behind your care.
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: { xs: '1.05rem', md: '1.1875rem' }, maxWidth: 500, mb: 3.5 }}>
            Licensed specialists with real, live schedules. Pick the one that fits you and book in under a minute.
          </Typography>

          {stats.length > 0 && (
            <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', rowGap: 2, mb: 4 }}>
              {stats.map(([value, label], i) => (
                <Box
                  key={label}
                  sx={[
                    { pr: 3, mr: 3, borderRight: i < stats.length - 1 ? 1 : 0, borderColor: 'divider' },
                    // Phones: the first two side by side, opening hours on their own row (no dangling divider).
                    phone(i === 2 ? { flexBasis: '100%', pr: 0, mr: 0 } : { pr: 2, mr: 2, borderRight: i === 0 ? 1 : 0, borderColor: 'divider' }),
                  ]}
                >
                  <Typography sx={{ fontWeight: 800, fontSize: { xs: 20, md: 24 }, letterSpacing: '-0.02em', lineHeight: 1.2 }}>{value}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {label}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}

          <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
            {canBook && (
              <Button
                component={RouterLink}
                to="/book"
                variant="contained"
                size="large"
                endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />}
                sx={[{ borderRadius: 999, px: 3.5 }, tablet({ minHeight: 52 })]}
              >
                Book a specialist
              </Button>
            )}
            <Button
              component="a"
              href="#specialist-cards"
              onClick={scrollToCards}
              size="large"
              color="inherit"
              sx={[{ borderRadius: 999, px: 3, border: 1, borderColor: 'divider' }, tablet({ minHeight: 52, bgcolor: 'field.main' })]}
            >
              View schedules
            </Button>
          </Stack>
        </Box>

        <Stage staff={staff} next={next} />
      </Box>

      {/* Cards, pulled up so they overlap the bottom of the photo. */}
      <Box
        id="specialist-cards"
        sx={[
          { position: 'relative', zIndex: 2, mt: '-30px', scrollMarginTop: 96, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' },
          tablet({ gridTemplateColumns: 'repeat(2, 1fr)' }),
          phone({ gridTemplateColumns: '1fr', mt: 3 }),
        ]}
      >
        {staff === null && [1, 2, 3].map((n) => <Skeleton key={n} variant="rounded" height={300} sx={{ borderRadius: '24px' }} />)}
        {staff?.length === 0 && <Typography color="text.secondary">Our specialists will appear here soon.</Typography>}
        {staff?.map((person) => (
          <SpecialistCard key={person._id} person={person} next={next === undefined ? undefined : next[person._id]} highlighted={person._id === soonest} canBook={canBook} />
        ))}
      </Box>
    </>
  );
}
