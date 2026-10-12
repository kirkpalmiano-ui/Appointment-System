import { useState } from 'react';
import { NavLink, Link as RouterLink, useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import useScrollTrigger from '@mui/material/useScrollTrigger';
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';
import BeachAccessOutlinedIcon from '@mui/icons-material/BeachAccessOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import useAuth from '../hooks/useAuth';
import { initials } from '../utils/format';
import { homeFor } from '../utils/roles';
import Brand from './Brand';
import ColorModeToggle from './ColorModeToggle';
import GuestMenuDrawer from './landing/GuestMenuDrawer';
import { navPillSx } from './navPillSx';

const USER_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: DashboardOutlinedIcon },
  { to: '/book', label: 'Book', icon: AddCircleOutlineRoundedIcon },
  { to: '/appointments', label: 'My Appointments', icon: EventNoteOutlinedIcon },
];
const STAFF_LINKS = [
  { to: '/staff', label: 'My Schedule', icon: CalendarMonthOutlinedIcon, end: true },
  { to: '/staff/time-off', label: 'Time Off', icon: BeachAccessOutlinedIcon },
];
// Guests get in-page links to the landing page sections instead.
const GUEST_LINKS = [
  { to: '/#services', label: 'Services', icon: MedicalServicesOutlinedIcon },
  { to: '/#doctors', label: 'Doctors', icon: PeopleAltOutlinedIcon },
  { to: '/#how-it-works', label: 'How it Works', icon: HomeOutlinedIcon },
];

// Highlights the current page's link.
const activeLinkSx = {
  color: 'text.secondary',
  borderRadius: 999,
  px: 1.75,
  '&:hover': { color: 'text.primary' },
  '&.active': { color: 'primary.main' },
};

// Guests below md: 44px touch targets for the theme toggle and menu button.
const guestTouchSx = (theme) => ({ [theme.breakpoints.down('md')]: { width: 44, height: 44 } });

// Desktop links mark the current page with a soft chip background.
const desktopLinkSx = {
  ...activeLinkSx,
  '&.active': { color: 'accent.contrastText', bgcolor: 'accent.main' },
};

// Notification bell. There's no notifications API yet, so it opens an honest empty state.
// TODO(backend): load unread notifications and show a red dot on the bell when there are any.
function NotificationsButton() {
  const [anchor, setAnchor] = useState(null);
  return (
    <>
      <IconButton aria-label="Notifications" onClick={(e) => setAnchor(e.currentTarget)} sx={{ border: 1, borderColor: 'divider' }}>
        <NotificationsNoneRoundedIcon />
      </IconButton>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { mt: 1.5, width: 300, borderRadius: '20px', p: 3, textAlign: 'center' } } }}
      >
        <NotificationsNoneRoundedIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
        <Typography sx={{ fontWeight: 700 }}>No notifications yet</Typography>
        <Typography variant="body2" color="text.secondary">
          Booking updates will show up here.
        </Typography>
      </Popover>
    </>
  );
}

// The drawer keeps a soft highlight, which reads better in a vertical list.
const drawerLinkSx = {
  ...activeLinkSx,
  '&.active': {
    color: 'primary.main',
    bgcolor: (theme) => `rgba(${theme.vars.palette.primary.mainChannel} / 0.08)`,
  },
};

export default function AppNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const scrolled = useScrollTrigger({ disableHysteresis: true, threshold: 8 });

  const links = !user ? GUEST_LINKS : user.role === 'staff' ? STAFF_LINKS : USER_LINKS;
  // Section links all point at "/", so they'd all look active with NavLink.
  const LinkComponent = user ? NavLink : RouterLink;

  const handleLogout = () => {
    setMenuAnchor(null);
    setDrawerOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  return (
    // Transparent sticky strip holding a floating, frosted pill; its shadow deepens once the page scrolls.
    <AppBar
      position="sticky"
      sx={{
        bgcolor: 'transparent',
        boxShadow: 'none',
        // Guests on phones: clear the iOS notch.
        pt: user ? { xs: 1, sm: 1.5 } : { xs: 'calc(8px + env(safe-area-inset-top))', sm: 'calc(12px + env(safe-area-inset-top))', md: 1.5 },
        pointerEvents: 'none',
      }}
    >
      <Container sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
        <Toolbar disableGutters sx={navPillSx(scrolled)}>
          <Brand to={user ? homeFor(user) : '/'} />

          {/* Desktop links */}
          <Box component="nav" sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5, ml: 4, flexGrow: 1 }}>
            {links.map(({ to, label, end }) => (
              <Button key={to} component={LinkComponent} to={to} end={user ? end : undefined} sx={desktopLinkSx}>
                {label}
              </Button>
            ))}
          </Box>
          <Box sx={{ flexGrow: { xs: 1, md: 0 } }} />

          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            {user && <NotificationsButton />}
            <ColorModeToggle sx={user ? { border: 1, borderColor: 'divider' } : guestTouchSx} />
          </Stack>

          {user ? (
            <>
              {/* User pill: avatar + first name; opens Profile / Log out */}
              <Button
                onClick={(e) => setMenuAnchor(e.currentTarget)}
                color="inherit"
                sx={{
                  display: { xs: 'none', md: 'inline-flex' },
                  gap: 1,
                  ml: 0.5,
                  pl: 0.5,
                  pr: 1.75,
                  minHeight: 42,
                  borderRadius: 999,
                  border: 1,
                  borderColor: 'divider',
                  bgcolor: 'field.main',
                }}
                aria-controls={menuAnchor ? 'user-menu' : undefined}
                aria-haspopup="true"
                aria-label={`Account menu for ${user.name}`}
              >
                <Avatar sx={{ width: 32, height: 32, fontSize: 13, fontWeight: 700, bgcolor: 'accent.main', color: 'accent.contrastText' }}>
                  {initials(user.name)}
                </Avatar>
                {user.name.split(' ')[0]}
              </Button>
              <Menu
                id="user-menu"
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => setMenuAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{ paper: { sx: { minWidth: 220, mt: 1.5, borderRadius: '16px' } } }}
              >
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography sx={{ fontWeight: 600 }}>{user.name}</Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {user.email}
                  </Typography>
                </Box>
                <Divider />
                <MenuItem component={RouterLink} to="/profile" onClick={() => setMenuAnchor(null)}>
                  <ListItemIcon>
                    <PersonOutlineRoundedIcon fontSize="small" />
                  </ListItemIcon>
                  My profile
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutRoundedIcon fontSize="small" />
                  </ListItemIcon>
                  Log out
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
              <Button component={RouterLink} to="/login" color="inherit" sx={{ borderRadius: 999, px: 2 }}>
                Log in
              </Button>
              <Button component={RouterLink} to="/book" variant="contained" sx={{ borderRadius: 999, px: 2.5 }}>
                Book Appointment
              </Button>
            </Box>
          )}

          {/* Mobile menu */}
          <IconButton
            onClick={() => setDrawerOpen(true)}
            sx={user ? { display: { xs: 'inline-flex', md: 'none' } } : [{ display: { xs: 'inline-flex', md: 'none' } }, guestTouchSx]}
            aria-label="Open menu"
            aria-haspopup="dialog"
            aria-expanded={drawerOpen}
          >
            <MenuRoundedIcon />
          </IconButton>
        </Toolbar>
      </Container>

      {/* Guests (phones/tablets) get a slide-down menu; signed-in users keep the side drawer. */}
      {!user && <GuestMenuDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} links={GUEST_LINKS} />}
      <Drawer anchor="right" open={Boolean(user) && drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 280 }} role="presentation">
          {user && (
            <Box sx={{ p: 2, display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>{initials(user.name)}</Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 600 }} noWrap>
                  {user.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {user.email}
                </Typography>
              </Box>
            </Box>
          )}
          <Divider />
          <List onClick={() => setDrawerOpen(false)}>
            {links.map(({ to, label, icon: Icon, end }) => (
              <ListItemButton key={to} component={LinkComponent} to={to} end={user ? end : undefined} sx={drawerLinkSx}>
                <ListItemIcon sx={{ color: 'inherit' }}>
                  <Icon />
                </ListItemIcon>
                <ListItemText primary={label} />
              </ListItemButton>
            ))}
            {user ? (
              <>
                <ListItemButton component={NavLink} to="/profile" sx={drawerLinkSx}>
                  <ListItemIcon sx={{ color: 'inherit' }}>
                    <PersonOutlineRoundedIcon />
                  </ListItemIcon>
                  <ListItemText primary="My profile" />
                </ListItemButton>
                <Divider sx={{ my: 1 }} />
                <ListItemButton onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutRoundedIcon />
                  </ListItemIcon>
                  <ListItemText primary="Log out" />
                </ListItemButton>
              </>
            ) : (
              <Box sx={{ p: 2, display: 'grid', gap: 1 }}>
                <Button component={RouterLink} to="/login" variant="outlined">
                  Log in
                </Button>
                <Button component={RouterLink} to="/book" variant="contained">
                  Book Appointment
                </Button>
              </Box>
            )}
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
}
