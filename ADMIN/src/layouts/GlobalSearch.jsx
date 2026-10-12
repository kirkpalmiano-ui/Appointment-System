import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import InputBase from '@mui/material/InputBase';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Typography from '@mui/material/Typography';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';

// Where a search can go. Every list page already reads `?q=` as its search filter.
// TODO(backend): a single global search endpoint could show matching records inline here.
const TARGETS = [
  { path: '/appointments', label: 'bookings', icon: EventNoteOutlinedIcon },
  { path: '/users', label: 'clients & users', icon: GroupOutlinedIcon },
  { path: '/staff', label: 'staff', icon: BadgeOutlinedIcon },
  { path: '/services', label: 'services', icon: MedicalServicesOutlinedIcon },
];

const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform);

// Top-bar search pill. Ctrl/Cmd+K focuses it; Enter searches bookings, or pick another list.
export default function GlobalSearch() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  // Callback ref (state) so the popup can size itself to the pill during render.
  const [anchorEl, setAnchorEl] = useState(null);
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const query = text.trim().slice(0, 50);
  const open = focused && query.length > 0;

  const go = (target) => {
    navigate(`${target.path}?q=${encodeURIComponent(query)}`);
    setText('');
    setFocused(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (e) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % TARGETS.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i - 1 + TARGETS.length) % TARGETS.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(TARGETS[active]);
    } else if (e.key === 'Escape') {
      setText('');
      inputRef.current?.blur();
    }
  };

  return (
    <ClickAwayListener onClickAway={() => setFocused(false)}>
      <Box ref={setAnchorEl} sx={{ width: { xs: '100%', sm: 380 }, maxWidth: '100%', minWidth: 0 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            height: 40,
            pl: 1.5,
            pr: 0.75,
            borderRadius: 999,
            border: '1px solid',
            borderColor: focused ? 'primary.main' : 'divider',
            bgcolor: 'field.main',
            boxShadow: focused ? (t) => `0 0 0 3px rgba(${t.vars.palette.primary.mainChannel} / 0.15)` : 'none',
            transition: 'border-color 150ms ease, box-shadow 150ms ease',
          }}
        >
          <SearchRoundedIcon sx={{ fontSize: 19, color: 'text.secondary' }} />
          <InputBase
            inputRef={inputRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setActive(0);
            }}
            onFocus={() => setFocused(true)}
            onKeyDown={onKeyDown}
            placeholder="Search clients, bookings, staff…"
            inputProps={{ 'aria-label': 'Search clients, bookings, staff', maxLength: 50, role: 'combobox', 'aria-expanded': open, 'aria-controls': 'global-search-list' }}
            sx={{ flexGrow: 1, fontSize: 14, minWidth: 0 }}
          />
          <Box
            component="kbd"
            sx={{ display: { xs: 'none', sm: 'inline-block' }, px: 0.75, borderRadius: '6px', border: '1px solid', borderColor: 'divider', bgcolor: 'hover.main', color: 'text.secondary', fontSize: 11, fontWeight: 700, fontFamily: 'inherit', lineHeight: '20px' }}
          >
            {isMac ? '⌘ K' : 'Ctrl K'}
          </Box>
        </Box>
        <Popper open={open} anchorEl={anchorEl} placement="bottom-start" sx={{ zIndex: 1300, width: anchorEl?.offsetWidth }}>
          <Paper sx={{ mt: 0.75, p: 0.5, border: 1, borderColor: 'divider', boxShadow: '0 20px 40px -20px rgba(15, 23, 42, 0.35)' }}>
            <MenuList id="global-search-list" role="listbox" dense>
              {TARGETS.map((t, i) => (
                <MenuItem key={t.path} role="option" selected={i === active} aria-selected={i === active} onMouseEnter={() => setActive(i)} onClick={() => go(t)} sx={{ gap: 1.25 }}>
                  <t.icon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography noWrap sx={{ fontSize: 14 }}>
                    Search {t.label} for <strong>“{query}”</strong>
                  </Typography>
                </MenuItem>
              ))}
            </MenuList>
          </Paper>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
}
