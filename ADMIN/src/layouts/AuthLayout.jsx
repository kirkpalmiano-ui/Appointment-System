import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Brand from '../components/Brand';
import ColorModeToggle from '../components/ColorModeToggle';
import PageLoader from '../components/PageLoader';
import Background from '../components/ui/Background';

// Sign-in screen: same soft colour blobs as the panel, one frosted card in the middle.
export default function AuthLayout() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', px: 2, py: 4, position: 'relative' }}>
      <Background />
      <ColorModeToggle sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1 }} />
      <Box sx={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box sx={{ mb: 3 }}>
          <Brand to="/login" />
        </Box>
        <Card sx={{ width: '100%', maxWidth: 440, p: { xs: 3, sm: 5 } }}>
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </Card>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 0.75, textAlign: 'center', maxWidth: 400 }}>
          <LockOutlinedIcon sx={{ fontSize: 14 }} />
          Restricted area. Access is limited to authorized administrators and all activity is logged.
        </Typography>
      </Box>
    </Box>
  );
}
