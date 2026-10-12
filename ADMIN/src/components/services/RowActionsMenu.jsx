import { useId, useState } from 'react';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import IconAction from '../ui/IconAction';

/**
 * Kebab button + menu for row actions. items: [{ label, icon?, danger?, onClick }].
 * `name` goes into the button's aria-label ("More actions for Ana Cruz").
 */
export default function RowActionsMenu({ name, items }) {
  const [anchor, setAnchor] = useState(null);
  const id = useId();

  return (
    <>
      <IconAction
        label="More actions"
        aria-label={name ? `More actions for ${name}` : 'More actions'}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
        aria-controls={anchor ? id : undefined}
        onClick={(e) => setAnchor(e.currentTarget)}
      >
        <MoreVertRoundedIcon />
      </IconAction>
      <Menu
        id={id}
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {items.map((item) => (
          <MenuItem
            key={item.label}
            onClick={() => {
              setAnchor(null);
              item.onClick();
            }}
            sx={[{ minWidth: 160 }, item.danger && { color: 'error.main' }]}
          >
            {item.icon && <ListItemIcon sx={{ color: 'inherit', minWidth: '30px !important', '& .MuiSvgIcon-root': { fontSize: 18 } }}>{item.icon}</ListItemIcon>}
            <ListItemText slotProps={{ primary: { sx: { fontSize: 14, fontWeight: 600 } } }}>{item.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
