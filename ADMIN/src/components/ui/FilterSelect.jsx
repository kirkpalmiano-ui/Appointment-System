import { useId, useState } from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';

/**
 * Toolbar dropdown shaped like a pill: "Specialist: All ▾".
 * options: [{ value, label }]. The current option's label is shown after the colon.
 */
export default function FilterSelect({ label, value, options, onChange, sx }) {
  const [anchor, setAnchor] = useState(null);
  const id = useId();
  const current = options.find((o) => o.value === value) ?? options[0];

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        onClick={(e) => setAnchor(e.currentTarget)}
        aria-haspopup="listbox"
        aria-expanded={Boolean(anchor)}
        aria-controls={anchor ? id : undefined}
        endIcon={<ExpandMoreRoundedIcon />}
        sx={[{ minHeight: 40, fontWeight: 600, flex: 'none' }, ...(Array.isArray(sx) ? sx : [sx])]}
      >
        <Box component="span" sx={{ color: 'text.secondary', mr: 0.5 }}>
          {label}:
        </Box>
        {current?.label}
      </Button>
      <Menu id={id} anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)} slotProps={{ list: { role: 'listbox', 'aria-label': label } }}>
        {options.map((o) => (
          <MenuItem
            key={o.value}
            role="option"
            selected={o.value === current?.value}
            aria-selected={o.value === current?.value}
            onClick={() => {
              setAnchor(null);
              if (o.value !== value) onChange(o.value);
            }}
            sx={{ gap: 1.5, justifyContent: 'space-between', minWidth: 180 }}
          >
            {o.label}
            {o.value === current?.value && <CheckRoundedIcon sx={{ fontSize: 16, color: 'primary.main' }} />}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
