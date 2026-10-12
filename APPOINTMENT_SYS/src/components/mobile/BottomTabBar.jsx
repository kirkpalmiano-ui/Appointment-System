import { useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import BeachAccessOutlinedIcon from '@mui/icons-material/BeachAccessOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import useAuth from '../../hooks/useAuth';
import NotificationsSheet from './NotificationsSheet';

// Height of the bar plus its gap above the safe area; pages pad their bottom by this much.
export const TAB_BAR_SPACE = 'calc(70px + 14px + 24px + env(safe-area-inset-bottom))';

const itemSx = (active) => ({
  flex: 1,
  minWidth: 0,
  height: '100%',
  flexDirection: 'column',
  gap: 0.25,
  borderRadius: '18px',
  color: active ? 'primary.main' : 'text.secondary',
  '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: -2 },
});

function TabItem({ to, label, icon: Icon, active, onClick }) {
  return (
    <ButtonBase
      component={to ? RouterLink : 'button'}
      to={to}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      sx={itemSx(active)}
    >
      <Icon sx={{ fontSize: 24 }} />
      <Typography component="span" sx={{ fontSize: 11, fontWeight: active ? 700 : 600, lineHeight: 1.2 }}>
        {label}
      </Typography>
    </ButtonBase>
  );
}

// Floating frosted tab bar for signed-in users on phones/tablets.
// Clients: Home · Visits · (raised Book) · Alerts · Profile. Staff: Schedule · Time off · Alerts · Profile.
export default function BottomTabBar() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [alertsOpen, setAlertsOpen] = useState(false);
  const isStaff = user?.role === 'staff';
  const is = (path, exact = false) => (exact ? pathname === path : pathname === path || pathname.startsWith(`${path}/`));

  const left = isStaff
    ? [
        { to: '/staff', label: 'Schedule', icon: CalendarMonthOutlinedIcon, active: is('/staff', true) },
        { to: '/staff/time-off', label: 'Time off', icon: BeachAccessOutlinedIcon, active: is('/staff/time-off') },
      ]
    : [
        { to: '/dashboard', label: 'Home', icon: HomeOutlinedIcon, active: is('/dashboard') },
        { to: '/appointments', label: 'Visits', icon: EventNoteOutlinedIcon, active: is('/appointments') },
      ];

  return (
    <>
      <Box
        component="nav"
        aria-label="Main"
        sx={(theme) => ({
          position: 'fixed',
          zIndex: theme.zIndex.appBar,
          left: 14,
          right: 14,
          bottom: 'calc(14px + env(safe-area-inset-bottom))',
          maxWidth: 612,
          mx: 'auto',
          height: 70,
          px: 1,
          display: 'flex',
          alignItems: 'center',
          borderRadius: '26px',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'rgba(255, 255, 255, 0.86)',
          backdropFilter: 'blur(18px) saturate(140%)',
          WebkitBackdropFilter: 'blur(18px) saturate(140%)',
          boxShadow: '0 18px 40px -18px rgba(40, 30, 120, 0.35)',
          ...theme.applyStyles('dark', { bgcolor: 'rgba(20, 26, 54, 0.88)', boxShadow: '0 18px 40px -18px rgba(0, 0, 0, 0.7)' }),
        })}
      >
        {left.map((item) => (
          <TabItem key={item.label} {...item} />
        ))}

        {!isStaff && (
          // Raised centre "Book" button.
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <ButtonBase
              component={RouterLink}
              to="/book"
              aria-label="Book an appointment"
              aria-current={is('/book') ? 'page' : undefined}
              sx={(theme) => ({
                width: 54,
                height: 54,
                mt: '-30px',
                borderRadius: '18px',
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                boxShadow: `0 14px 26px -10px rgba(${theme.vars.palette.primary.mainChannel} / 0.8)`,
                border: '4px solid',
                borderColor: 'background.default',
                '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
              })}
            >
              <AddRoundedIcon sx={{ fontSize: 28 }} />
            </ButtonBase>
          </Box>
        )}

        <TabItem label="Alerts" icon={NotificationsNoneRoundedIcon} onClick={() => setAlertsOpen(true)} />
        <TabItem to="/profile" label="Profile" icon={PersonOutlineRoundedIcon} active={is('/profile')} />
      </Box>
      <NotificationsSheet open={alertsOpen} onClose={() => setAlertsOpen(false)} />
    </>
  );
}
