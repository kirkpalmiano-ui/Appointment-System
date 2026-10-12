import { useState } from 'react';
import Button from '@mui/material/Button';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import GoogleIcon from '@mui/icons-material/Google';
import { downloadIcs, googleCalendarUrl } from '../../utils/calendar';

// "Add to calendar" with a choice of Google Calendar or an .ics file (Apple, Outlook…).
export default function AddToCalendarButton({ appointment, size = 'medium', variant = 'contained', fullWidth, sx }) {
  const [anchor, setAnchor] = useState(null);
  return (
    <>
      <Button
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        startIcon={<EventRoundedIcon />}
        onClick={(e) => {
          e.stopPropagation();
          setAnchor(e.currentTarget);
        }}
        aria-haspopup="menu"
        sx={sx}
      >
        Add to calendar
      </Button>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)} onClick={(e) => e.stopPropagation()}>
        <MenuItem component="a" href={googleCalendarUrl(appointment)} target="_blank" rel="noopener noreferrer" onClick={() => setAnchor(null)}>
          <ListItemIcon>
            <GoogleIcon fontSize="small" />
          </ListItemIcon>
          Google Calendar
        </MenuItem>
        <MenuItem
          onClick={() => {
            downloadIcs(appointment);
            setAnchor(null);
          }}
        >
          <ListItemIcon>
            <DownloadRoundedIcon fontSize="small" />
          </ListItemIcon>
          Apple / Outlook (.ics)
        </MenuItem>
      </Menu>
    </>
  );
}
