import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import AppBackground from '../components/app/AppBackground';
import AppNavbar from '../components/AppNavbar';
import BottomTabBar, { TAB_BAR_SPACE } from '../components/mobile/BottomTabBar';
import PageLoader from '../components/PageLoader';
import SiteFooter from '../components/SiteFooter';
import useAuth from '../hooks/useAuth';
import useIsMobile from '../hooks/useIsMobile';

// Booking flow pages use their own sticky action bar on mobile instead of the tab bar.
const isBookingFlow = (path) => path === '/book' || /^\/appointments\/[^/]+\/reschedule$/.test(path);

export default function MainLayout() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  // The landing page draws its own section backgrounds; every other page gets the soft blob background.
  const isLanding = pathname === '/';
  // Signed-in phones/tablets: no top pill navbar; pages bring their own header and the tab bar sits at the bottom.
  const appMobile = isMobile && Boolean(user) && !isLanding;
  const showTabBar = appMobile && !isBookingFlow(pathname);

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        // (Mobile page headers pad themselves for the notch, so no top safe-area padding here.)
        ...(showTabBar && { pb: TAB_BAR_SPACE }),
      }}
    >
      {!isLanding && <AppBackground />}
      {!appMobile && <AppNavbar />}
      <Box component="main" sx={{ position: 'relative', zIndex: 1, flexGrow: 1 }}>
        {/* Pages are lazy-loaded; keep the navbar visible while one downloads. */}
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </Box>
      {/* On signed-in mobile pages the tab bar replaces the footer line. */}
      {!appMobile && (
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <SiteFooter />
        </Box>
      )}
      {showTabBar && <BottomTabBar />}
    </Box>
  );
}
