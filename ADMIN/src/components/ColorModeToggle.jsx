import { useColorScheme } from '@mui/material/styles';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import IconAction from './ui/IconAction';

// Light/dark switch. MUI remembers the choice in localStorage.
export default function ColorModeToggle({ sx, size = 38 }) {
  const { mode, systemMode, setMode } = useColorScheme();
  if (!mode) return null; // not resolved yet on first render

  const current = mode === 'system' ? systemMode : mode;
  const next = current === 'dark' ? 'light' : 'dark';

  return (
    <IconAction label={`Switch to ${next} mode`} onClick={() => setMode(next)} size={size} sx={[{ borderRadius: '12px' }, ...(Array.isArray(sx) ? sx : [sx])]}>
      {current === 'dark' ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
    </IconAction>
  );
}
