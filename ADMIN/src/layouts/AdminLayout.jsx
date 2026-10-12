import { Suspense, useCallback, useState } from 'react';
import { Link as RouterLink, NavLink, Outlet, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Drawer from '@mui/material/Drawer';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import Brand from '../components/Brand';
import ColorModeToggle from '../components/ColorModeToggle';
import PageLoader from '../components/PageLoader';
import Background from '../components/ui/Background';
import IconAction from '../components/ui/IconAction';
import UserAvatar from '../components/ui/UserAvatar';
import useAdminCounts from '../hooks/useAdminCounts';
import useAuth from '../hooks/useAuth';
import useCountdown from '../hooks/useCountdown';
import useIdleTimeout from '../hooks/useIdleTimeout';
import { IDLE_MINUTES, SESSION_SECONDS } from '../utils/session';
import { clockTime, formatDurationShort } from '../utils/time';
import GlobalSearch from './GlobalSearch';
import NotificationsMenu from './NotificationsMenu';

const SIDEBAR_WIDTH = 256;

const NAV = [
  {
    group: 'Overview',
    items: [
      { to: '/', label: 'Dashboard', icon: DashboardOutlinedIcon, end: true },
      { to: '/appointments', label: 'Appointments', icon: EventNoteOutlinedIcon, badge: 'pending' },
    ],
  },
  {
    group: 'Manage',
    items: [
      { to: '/services', label: 'Services', icon: MedicalServicesOutlinedIcon },
      { to: '/staff', label: 'Staff', icon: BadgeOutlinedIcon },
      { to: '/users', label: 'Users', icon: GroupOutlinedIcon },
    ],
  },
  {
    group: 'Security',
    items: [
      { to: '/audit-log', label: 'Audit log', icon: HistoryRoundedIcon, badge: 'failedSignIns' },
      { to: '/account', label: 'My account', icon: ManageAccountsOutlinedIcon },
    ],
  },
];

const BADGE_TONE = { pending: ['pendingChip.light', 'pendingChip.main'], failedSignIns: ['dangerChip.light', 'dangerChip.main'] };
const BADGE_LABEL = { pending: 'pending', failedSignIns: 'failed sign-ins' };

function NavItem({ to, label, icon: Icon, end, count, badge, onNavigate }) {
  return (
    <ButtonBase
      component={NavLink}
      to={to}
      end={end}
      onClick={onNavigate}
      sx={{
        width: '100%',
        justifyContent: 'flex-start',
        gap: 1.5,
        px: 1.5,
        height: 42,
        mb: 0.25,
        borderRadius: '12px',
        color: 'text.secondary',
        fontSize: 14,
        fontWeight: 600,
        '&:hover': { bgcolor: 'hover.main', color: 'text.primary' },
        '&.active': { bgcolor: 'accent.main', color: 'accent.contrastText', fontWeight: 700 },
        '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 1 },
      }}
    >
      <Icon sx={{ fontSize: 20 }} />
      <Box component="span" sx={{ flexGrow: 1, textAlign: 'left' }}>
        {label}
      </Box>
      {count > 0 && (
        <Box
          component="span"
          aria-label={`${count} ${BADGE_LABEL[badge]}`}
          sx={{ minWidth: 22, px: 0.75, borderRadius: 999, fontSize: 11.5, fontWeight: 800, lineHeight: '20px', textAlign: 'center', bgcolor: BADGE_TONE[badge][0], color: BADGE_TONE[badge][1] }}
        >
          {count > 99 ? '99+' : count}
        </Box>
      )}
    </ButtonBase>
  );
}

// Remaining session time, a gradient bar, and when it ends; then who is signed in + sign out.
function SessionCard({ user, onSignOut }) {
  const { sessionEndsAt } = useAuth();
  const secondsLeft = useCountdown(sessionEndsAt);
  const ratio = sessionEndsAt ? Math.min(1, secondsLeft / SESSION_SECONDS) : 0;
  const low = sessionEndsAt && secondsLeft <= 10 * 60;

  return (
    <Box sx={{ px: 1.5, pb: 1.5 }}>
      {sessionEndsAt && (
        <Box sx={{ p: 1.75, mb: 1.25, borderRadius: '16px', border: 1, borderColor: 'divider', bgcolor: 'card.main' }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.25 }}>
            <ScheduleRoundedIcon sx={{ fontSize: 18, color: low ? 'pendingChip.main' : 'primary.main' }} />
            <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Session</Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Typography sx={{ fontSize: 13, fontWeight: 800, color: low ? 'pendingChip.main' : 'text.primary' }}>{formatDurationShort(secondsLeft)} left</Typography>
          </Stack>
          <Box
            role="progressbar"
            aria-label="Session time left"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(ratio * 100)}
            sx={{ height: 6, borderRadius: 999, bgcolor: 'hover.main', overflow: 'hidden' }}
          >
            <Box
              sx={{
                height: '100%',
                width: `${ratio * 100}%`,
                borderRadius: 999,
                background: low ? 'linear-gradient(90deg, #f59e0b, #f97316)' : 'linear-gradient(90deg, #6d63f0, #a78bfa 55%, #f9a8d4)',
                transition: 'width 1s linear',
              }}
            />
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Ends {clockTime(sessionEndsAt)} · or {IDLE_MINUTES} min idle
          </Typography>
        </Box>
      )}
      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', px: 0.5 }}>
        <UserAvatar id={user._id} name={user.name} size={36} />
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography noWrap sx={{ fontSize: 14, fontWeight: 700 }}>
            {user.name}
          </Typography>
          <Typography noWrap variant="caption" color="text.secondary" component="div" title={user.email}>
            {user.email}
          </Typography>
        </Box>
        <IconAction label="Sign out" onClick={onSignOut}>
          <LogoutRoundedIcon />
        </IconAction>
      </Stack>
    </Box>
  );
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const counts = useAdminCounts();

  const handleIdle = useCallback(async () => {
    // Wait for the sign-out so the login page doesn't still see a user and bounce back.
    await logout(`You were signed out after ${IDLE_MINUTES} minutes of inactivity.`);
    navigate('/login', { replace: true });
  }, [logout, navigate]);
  const { warning, secondsLeft, stayActive } = useIdleTimeout({ timeoutMs: IDLE_MINUTES * 60_000, onTimeout: handleIdle });

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const sidebar = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ px: 2.5, height: 72, display: 'flex', alignItems: 'center' }}>
        <Brand />
      </Box>
      <Box component="nav" aria-label="Admin sections" sx={{ flexGrow: 1, overflowY: 'auto', px: 1.5, pt: 1 }}>
        {NAV.map(({ group, items }) => (
          <Box key={group} sx={{ mb: 2 }}>
            <Typography component="div" sx={{ px: 1.5, mb: 0.75, fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'text.secondary', opacity: 0.8 }}>
              {group}
            </Typography>
            {items.map((item) => (
              <NavItem key={item.to} {...item} count={item.badge ? counts[item.badge] : 0} onNavigate={() => setMobileOpen(false)} />
            ))}
          </Box>
        ))}
      </Box>
      <SessionCard user={user} onSignOut={handleLogout} />
    </Box>
  );

  const paperSx = (theme) => ({
    width: SIDEBAR_WIDTH,
    boxSizing: 'border-box',
    borderRight: `1px solid ${theme.vars.palette.divider}`,
    bgcolor: 'rgba(255, 255, 255, 0.72)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    backgroundImage: 'none',
    ...theme.applyStyles('dark', { bgcolor: 'rgba(14, 19, 44, 0.78)' }),
  });

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Background />

      <Box sx={{ width: { md: SIDEBAR_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': paperSx }}>
          {sidebar}
        </Drawer>
        <Drawer variant="permanent" open sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': paperSx }}>
          {sidebar}
        </Drawer>
      </Box>

      <Box sx={{ position: 'relative', zIndex: 1, flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <Box
          component="header"
          sx={(theme) => ({
            position: 'sticky',
            top: 0,
            zIndex: theme.zIndex.appBar,
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            height: 72,
            px: { xs: 2, sm: 3, lg: 4 },
            borderBottom: `1px solid ${theme.vars.palette.divider}`,
            bgcolor: 'rgba(248, 247, 253, 0.72)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            ...theme.applyStyles('dark', { bgcolor: 'rgba(11, 16, 36, 0.72)' }),
          })}
        >
          <IconAction label="Open menu" size={38} onClick={() => setMobileOpen(true)} sx={{ display: { md: 'none' }, borderRadius: '12px' }}>
            <MenuRoundedIcon />
          </IconAction>
          <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex' }}>
            <GlobalSearch />
          </Box>
          <NotificationsMenu pending={counts.pending} failedSignIns={counts.failedSignIns} failedLatest={counts.failedLatest} />
          <ColorModeToggle />
          <ButtonBase
            component={RouterLink}
            to="/account"
            aria-label={`My account (${user.name})`}
            sx={{
              display: { xs: 'none', sm: 'inline-flex' },
              gap: 1,
              pl: 0.5,
              pr: 1.5,
              height: 40,
              borderRadius: 999,
              border: 1,
              borderColor: 'divider',
              bgcolor: 'field.main',
              fontWeight: 700,
              fontSize: 14,
              '&:hover': { bgcolor: 'hover.main' },
              '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
            }}
          >
            <UserAvatar id={user._id} name={user.name} size={30} />
            {user.name.split(' ')[0]}
          </ButtonBase>
        </Box>

        <Box component="main" sx={{ flexGrow: 1, minWidth: 0, px: { xs: 2, sm: 3, lg: 4 }, py: { xs: 3, md: 4 }, maxWidth: 1600, width: '100%', mx: 'auto' }}>
          <Suspense fallback={<PageLoader />}>
            {/* Pages can read { counts, refreshCounts } with useOutletContext() to keep badges in sync. */}
            <Outlet context={{ counts, refreshCounts: counts.refresh }} />
          </Suspense>
        </Box>
      </Box>

      <Dialog open={warning} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Are you still there?</DialogTitle>
        <DialogContent>
          <Typography>
            For security, you&apos;ll be signed out in <strong>{secondsLeft}s</strong> because of inactivity.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={handleLogout} variant="outlined">
            Sign out now
          </Button>
          <Button onClick={stayActive} variant="contained" autoFocus>
            Stay signed in
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
