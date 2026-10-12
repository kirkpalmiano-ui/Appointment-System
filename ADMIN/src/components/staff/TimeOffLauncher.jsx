import { useId, useState } from 'react';
import Button from '@mui/material/Button';
import ListSubheader from '@mui/material/ListSubheader';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import EventBusyOutlinedIcon from '@mui/icons-material/EventBusyOutlined';
import UserAvatar from '../ui/UserAvatar';

// Footer link to the time-off feature. Time off is per person, so it first asks who.
export default function TimeOffLauncher({ staff = [], onPick }) {
  const [anchor, setAnchor] = useState(null);
  const id = useId();
  if (!staff.length) return null;

  return (
    <>
      <Button
        size="small"
        startIcon={<EventBusyOutlinedIcon />}
        onClick={(e) => setAnchor(e.currentTarget)}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
        aria-controls={anchor ? id : undefined}
        sx={{ minHeight: 30, px: 1 }}
      >
        Block time off (leave, holidays)
      </Button>
      <Menu id={id} anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)} slotProps={{ paper: { sx: { maxHeight: 360 } } }}>
        <ListSubheader sx={{ lineHeight: '32px', fontSize: 12, fontWeight: 700, bgcolor: 'transparent' }}>Block time off for…</ListSubheader>
        {staff.map((m) => (
          <MenuItem
            key={m._id}
            onClick={() => {
              setAnchor(null);
              onPick(m);
            }}
            sx={{ gap: 1.25, minWidth: 220 }}
          >
            <UserAvatar id={m._id} name={m.name} size={26} />
            {m.name}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
