import { Link as RouterLink, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import useAuth from '../hooks/useAuth';
import Brand from './Brand';

// Clinic details come from .env (VITE_CLINIC_*) so real information is never hard-coded;
// anything left blank is simply not shown.
const CLINIC = [
  { icon: PlaceOutlinedIcon, value: import.meta.env.VITE_CLINIC_ADDRESS },
  { icon: PhoneOutlinedIcon, value: import.meta.env.VITE_CLINIC_PHONE, href: (v) => `tel:${v.replace(/[^\d+]/g, '')}` },
  { icon: MailOutlineRoundedIcon, value: import.meta.env.VITE_CLINIC_EMAIL, href: (v) => `mailto:${v}` },
  { icon: ScheduleRoundedIcon, value: import.meta.env.VITE_CLINIC_HOURS },
].filter((item) => item.value?.trim());

function Column({ title, children }) {
  return (
    <Box>
      <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: '0.08em' }}>
        {title}
      </Typography>
      <Stack spacing={1.25} sx={{ mt: 1 }}>
        {children}
      </Stack>
    </Box>
  );
}

const linkSx = { color: 'text.secondary', textDecoration: 'none', fontSize: 14, '&:hover': { color: 'primary.main' } };

const copyright = (
  <Typography variant="body2" color="text.secondary">
    © {new Date().getFullYear()} CliniQuick · Online Appointment System
  </Typography>
);

// Full footer on the landing page; app pages (dashboard, booking…) keep a single copyright line.
export default function SiteFooter() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const isStaff = user?.role === 'staff';

  if (pathname !== '/') {
    return (
      <Box component="footer" sx={{ borderTop: 1, borderColor: 'divider' }}>
        <Container sx={{ py: 2.5 }}>{copyright}</Container>
      </Box>
    );
  }

  const explore = [
    { to: '/#services', label: 'Services' },
    { to: '/#doctors', label: 'Doctors' },
    { to: '/#how-it-works', label: 'How it works' },
  ];
  const account = !user
    ? [
        { to: '/book', label: 'Book an appointment' },
        { to: '/login', label: 'Log in' },
        { to: '/register', label: 'Create an account' },
      ]
    : isStaff
      ? [
          { to: '/staff', label: 'My schedule' },
          { to: '/staff/time-off', label: 'Time off' },
          { to: '/profile', label: 'My profile' },
        ]
      : [
          { to: '/book', label: 'Book an appointment' },
          { to: '/appointments', label: 'My appointments' },
          { to: '/profile', label: 'My profile' },
        ];

  return (
    <Box component="footer" sx={{ borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
      <Container sx={{ pt: { xs: 6, md: 7 }, pb: 3 }}>
        <Grid container spacing={{ xs: 4, md: 6 }}>
          <Grid size={{ xs: 12, md: CLINIC.length ? 4 : 6 }}>
            <Brand />
            <Typography color="text.secondary" sx={{ mt: 2, maxWidth: 320, fontSize: 14 }}>
              Book, reschedule and manage your clinic appointments online, any time of day.
            </Typography>
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <Column title="Explore">
              {explore.map((l) => (
                <Link key={l.to} component={RouterLink} to={l.to} sx={linkSx}>
                  {l.label}
                </Link>
              ))}
            </Column>
          </Grid>
          <Grid size={{ xs: 6, md: CLINIC.length ? 2 : 4 }}>
            <Column title={user ? 'Your account' : 'Get started'}>
              {account.map((l) => (
                <Link key={l.to} component={RouterLink} to={l.to} sx={linkSx}>
                  {l.label}
                </Link>
              ))}
            </Column>
          </Grid>
          {CLINIC.length > 0 && (
            <Grid size={{ xs: 12, md: 4 }}>
              <Column title="Visit us">
                {CLINIC.map(({ icon: Icon, value, href }) => (
                  <Stack key={value} direction="row" spacing={1.25} sx={{ alignItems: 'flex-start', color: 'text.secondary' }}>
                    <Box sx={{ display: 'flex', mt: '2px', flex: 'none' }}>
                      <Icon sx={{ fontSize: 16 }} />
                    </Box>
                    {href ? (
                      <Link href={href(value)} sx={linkSx}>
                        {value}
                      </Link>
                    ) : (
                      <Typography sx={{ fontSize: 14 }}>{value}</Typography>
                    )}
                  </Stack>
                ))}
              </Column>
            </Grid>
          )}
        </Grid>

        <Box sx={{ mt: { xs: 5, md: 6 }, pt: 2.5, borderTop: 1, borderColor: 'divider' }}>{copyright}</Box>
      </Container>
    </Box>
  );
}
