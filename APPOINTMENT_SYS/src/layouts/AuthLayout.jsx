import { Suspense } from 'react';
import { Link as RouterLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import Brand from '../components/Brand';
import ColorModeToggle from '../components/ColorModeToggle';
import FloatingGlow from '../components/FloatingGlow';
import MobileTopBar from '../components/mobile/MobileTopBar';
import { navPillSx } from '../components/navPillSx';
import PageLoader from '../components/PageLoader';
import useIsMobile from '../hooks/useIsMobile';
import { parallaxSx } from '../utils/parallax';
import { addDays, parseDate, todayString } from '../utils/format';

// Left-column copy and navbar call-to-action for each page that uses this layout.
const LOGIN_LINK = { prompt: 'Have an account?', label: 'Log in', to: '/login' };
const PAGES = {
  '/login': {
    headline: ['Welcome back.', 'Your visits are', 'waiting.'],
    // Shorter headline on phones/tablets (other pages run their lines together instead).
    mobileHeadline: ['Welcome back.'],
    nav: { prompt: 'New here?', label: 'Create account', to: '/register' },
    preview: true,
  },
  '/register': {
    headline: ['Book visits', 'without the', 'phone calls.'],
    lede: 'Sign up to book visits, get confirmations and manage every appointment in one place.',
    nav: LOGIN_LINK,
    preview: true,
  },
  '/verify-email': {
    headline: ['One last', 'step.'],
    lede: 'Enter the 6-digit code we emailed you to confirm your account.',
    nav: LOGIN_LINK,
  },
  '/forgot-password': {
    headline: ['Forgot your', 'password?'],
    lede: "No problem. We'll email you a code so you can set a new one.",
    nav: LOGIN_LINK,
  },
  '/staff/activate': {
    badge: 'Staff Portal',
    headline: ['Set up your', 'staff account.'],
    lede: 'Choose a password to start managing your schedule and appointments.',
    nav: LOGIN_LINK,
  },
};

// Near-white / navy base with large blurred blobs: shades of the logo's indigo in light mode,
// soft white in dark mode.
const BLOBS = [
  // [light colour, dark colour, position, size]
  ['#a5b4fc', '#ffffff', { top: '-12%', left: '-8%' }, 560],
  ['#c7d2fe', '#f4f6ff', { top: '-18%', left: '38%' }, 480],
  ['#b4adfb', '#fafbff', { top: '-10%', right: '-8%' }, 460],
  ['#818cf8', '#eef1ff', { bottom: '-16%', right: '4%' }, 520],
];

function Background() {
  return (
    <Box aria-hidden sx={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {BLOBS.map(([light, dark, pos, size], i) => (
        <FloatingGlow
          key={light}
          index={i}
          // Floats on its own and drifts as the page scrolls (sign-up is long enough to scroll).
          // Smaller, tighter blobs on phones/tablets.
          sx={{
            ...parallaxSx(i, { strength: 2.6 }),
            position: 'absolute',
            width: { xs: Math.min(size * 0.45, 300), sm: Math.round(size * 0.7), md: size },
            height: { xs: Math.min(size * 0.45, 300), sm: Math.round(size * 0.7), md: size },
            ...pos,
          }}
          blobSx={(theme) => ({
            bgcolor: light,
            filter: { xs: 'blur(60px)', sm: 'blur(75px)', md: 'blur(90px)' },
            opacity: 0.88,
            ...theme.applyStyles('dark', { bgcolor: dark, opacity: 0.2 }),
          })}
        />
      ))}
    </Box>
  );
}

// Styles that only apply below md (phones and tablets); desktop is untouched.
const mobileOnly = (styles) => (theme) => ({ [theme.breakpoints.down('md')]: styles });

// The next Monday after today, for the sample appointment ("Oct 12").
function nextMonday() {
  let day = addDays(todayString(), 1);
  while (parseDate(day).getDay() !== 1) day = addDays(day, 1);
  return parseDate(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const glassSx = (radius) => (theme) => ({
  borderRadius: radius,
  border: '1px solid #e4e4f0',
  bgcolor: 'rgba(255, 255, 255, 0.78)',
  backdropFilter: 'blur(16px) saturate(140%)',
  WebkitBackdropFilter: 'blur(16px) saturate(140%)',
  boxShadow: '0 24px 60px -30px rgba(31, 38, 135, 0.25), 0 1px 2px rgba(15, 23, 42, 0.04)',
  ...theme.applyStyles('dark', {
    borderColor: '#252c4d',
    bgcolor: 'rgba(20, 26, 54, 0.72)',
    boxShadow: '0 24px 60px -30px rgba(0, 0, 0, 0.6)',
  }),
});

// Decorative "upcoming appointment" card under the headline (sample content, hidden from screen readers).
function PreviewCard() {
  const tile = (label, value, highlight) => (
    <Box
      sx={(theme) => ({
        flex: 1,
        px: 1.5,
        py: 1.25,
        borderRadius: '12px',
        border: '1px solid',
        borderColor: highlight ? 'primary.main' : '#e4e4f0',
        bgcolor: highlight ? 'primary.main' : 'rgba(255,255,255,0.7)',
        color: highlight ? 'primary.contrastText' : 'text.primary',
        ...(!highlight && theme.applyStyles('dark', { borderColor: '#252c4d', bgcolor: 'rgba(15,21,48,0.7)' })),
      })}
    >
      <Typography sx={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', opacity: highlight ? 0.85 : 0.6 }}>{label}</Typography>
      <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{value}</Typography>
    </Box>
  );

  return (
    <Box aria-hidden sx={{ position: 'relative', maxWidth: 470, mt: 5 }}>
      <Box sx={[glassSx('24px'), { p: 2.5 }]}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ width: 42, height: 42, fontSize: 14, fontWeight: 700, bgcolor: 'accent.main', color: 'accent.contrastText' }}>
            DM
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700 }}>Dr. Maria Santos</Typography>
            <Typography variant="body2" color="text.secondary">
              General Consultation · 30 min
            </Typography>
          </Box>
          <Box sx={{ px: 1.25, borderRadius: 999, fontSize: 12, fontWeight: 700, lineHeight: '24px', bgcolor: 'accent.main', color: 'accent.contrastText' }}>
            Upcoming
          </Box>
        </Stack>
        <Stack direction="row" spacing={1}>
          {tile('MON', nextMonday(), true)}
          {tile('TIME', '10:30 AM')}
          {tile('ROOM', 'Clinic 2')}
        </Stack>
      </Box>

      {/* Toast overlapping the card's bottom-right corner */}
      <Stack
        direction="row"
        spacing={1.25}
        sx={[
          glassSx('14px'),
          { alignItems: 'center', position: 'absolute', right: -28, bottom: -30, px: 1.75, py: 1.25 },
        ]}
      >
        <Box sx={{ display: 'grid', placeItems: 'center', width: 32, height: 32, borderRadius: '9px', bgcolor: '#22a55a', color: '#fff' }}>
          <CheckRoundedIcon sx={{ fontSize: 18 }} />
        </Box>
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>Appointment confirmed</Typography>
          <Typography sx={{ fontSize: 12 }} color="text.secondary">
            See you on Monday
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

// Split-screen layout for the login, sign-up and password pages, styled like the landing page.
export default function AuthLayout() {
  const { pathname, key } = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const page = PAGES[pathname] ?? PAGES['/login'];
  const headline = isMobile ? (page.mobileHeadline ?? page.headline) : page.headline;

  // Back: previous page in this tab if there is one (the first entry's key is "default"), else home.
  const goBack = () => (key !== 'default' ? navigate(-1) : navigate('/'));

  return (
    <Box
      sx={(theme) => ({
        position: 'relative',
        minHeight: '100vh',
        bgcolor: '#fbfaff',
        ...theme.applyStyles('dark', { bgcolor: '#0b1024' }),
      })}
    >
      <Background />

      {isMobile ? (
        // Phones/tablets: compact top bar (back · logo · theme).
        <MobileTopBar
          left={
            <IconButton aria-label="Back" onClick={goBack} sx={{ width: 44, height: 44 }}>
              <ArrowBackRoundedIcon />
            </IconButton>
          }
          center={<Brand />}
          right={<ColorModeToggle sx={{ width: 44, height: 44 }} />}
        />
      ) : (
        // Navbar: same floating pill as the rest of the site
        <Container sx={{ position: 'relative', zIndex: 1, pt: { xs: 1, sm: 1.5 }, px: { xs: 1, sm: 2, md: 3 } }}>
          <Toolbar component="header" disableGutters sx={navPillSx(false)}>
            <Brand />
            <Box sx={{ flexGrow: 1 }} />
            <ColorModeToggle sx={{ border: 1, borderColor: 'divider' }} />
            <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' }, mx: 1 }}>
              {page.nav.prompt}
            </Typography>
            <Button
              component={RouterLink}
              to={page.nav.to}
              variant="outlined"
              sx={{ borderRadius: 999, px: { xs: 1.5, sm: 2.25 }, whiteSpace: 'nowrap', flex: 'none' }}
            >
              {page.nav.label}
            </Button>
          </Toolbar>
        </Container>
      )}

      <Container
        component="main"
        sx={[
          {
            position: 'relative',
            zIndex: 1,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.05fr 0.95fr' },
            columnGap: '72px',
            rowGap: 4,
            alignItems: 'center',
            minHeight: { md: 'calc(100vh - 84px)' },
            py: { xs: 5, md: 6 },
          },
          // Phones/tablets: one centred column (~640px on tablets), clear of the home indicator.
          mobileOnly({ maxWidth: 688, rowGap: 3, alignItems: 'start', pt: 2, pb: 'calc(32px + env(safe-area-inset-bottom))' }),
        ]}
      >
        {/* Headline column */}
        <Box
          sx={{
            '@keyframes cq-fade-up': { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'none' } },
            animation: 'cq-fade-up 500ms ease-out both',
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
          }}
        >
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              px: 1.5,
              py: 0.5,
              mb: { xs: 2, md: 3 },
              borderRadius: 999,
              bgcolor: 'accent.main',
              color: 'accent.contrastText',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main' }} />
            {page.badge ?? 'Patient Portal'}
          </Box>
          <Typography
            component="h2"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '2.5rem', sm: '3.2rem', md: '3.6rem', lg: '4.75rem' },
              lineHeight: { xs: 1, md: 0.98 },
              letterSpacing: '-0.055em',
              mb: { xs: 2, md: 3 },
            }}
          >
            {/* Desktop: one line per entry. Mobile: the lines run together and wrap naturally. */}
            {isMobile
              ? headline.join(' ')
              : headline.map((line) => (
                  <Box component="span" key={line} sx={{ display: 'block' }}>
                    {line}
                  </Box>
                ))}
          </Typography>
          {/* Optional: the login page goes straight from the headline to the form. */}
          {page.lede && (
            <Typography color="text.secondary" sx={{ fontSize: { xs: '1.05rem', md: '1.25rem' }, maxWidth: 470 }}>
              {page.lede}
            </Typography>
          )}
          {page.preview && (
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <PreviewCard />
            </Box>
          )}
        </Box>

        {/* Form card */}
        <Box
          sx={[
            glassSx('28px'),
            (theme) => ({
              width: '100%',
              maxWidth: 520,
              justifySelf: { md: 'end' },
              p: { xs: 3, sm: 5 },
              // Outlined fields like the landing page search bar: 60px tall, 1.5px border, soft focus ring.
              '& .MuiOutlinedInput-root': {
                borderRadius: '14px',
                bgcolor: '#fff',
                '& .MuiOutlinedInput-input:not(textarea)': { py: '18.5px' },
                '& .MuiOutlinedInput-notchedOutline': { borderWidth: '1.5px' },
                '&:not(.Mui-error):not(.Mui-focused) .MuiOutlinedInput-notchedOutline': { borderColor: '#e4e4f0' },
                '&:not(.Mui-error):not(.Mui-focused):hover .MuiOutlinedInput-notchedOutline': { borderColor: '#a5b4fc' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderWidth: '1.5px' },
                '&.Mui-focused:not(.Mui-error)': { boxShadow: `0 0 0 4px rgba(${theme.vars.palette.primary.mainChannel} / 0.15)` },
                '& .MuiInputAdornment-positionStart': { color: 'text.secondary' },
              },
              '& .MuiButton-root': { borderRadius: 999 },
              '& .MuiButton-containedPrimary': {
                minHeight: 56,
                fontSize: '1rem',
                boxShadow: `0 12px 24px -12px rgba(${theme.vars.palette.primary.mainChannel} / 0.7)`,
                '&:hover': { boxShadow: `0 14px 28px -12px rgba(${theme.vars.palette.primary.mainChannel} / 0.8)` },
              },
              // Phones/tablets: lighter frame, 16px inputs (stops iOS zooming on focus), 52px main button.
              [theme.breakpoints.down('md')]: {
                maxWidth: 'none',
                borderRadius: '22px',
                p: 2.5,
                '& .MuiOutlinedInput-input': { fontSize: 16 },
                '& .MuiButton-containedPrimary': { minHeight: 52 },
              },
              [theme.breakpoints.only('sm')]: { p: 4 },
              ...theme.applyStyles('dark', {
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#0f1530',
                  '&:not(.Mui-error):not(.Mui-focused) .MuiOutlinedInput-notchedOutline': { borderColor: '#252c4d' },
                  '&:not(.Mui-error):not(.Mui-focused):hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(165, 180, 252, 0.6)' },
                },
              }),
            }),
          ]}
        >
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </Box>
      </Container>
    </Box>
  );
}
