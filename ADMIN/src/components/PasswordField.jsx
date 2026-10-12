import { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

// Password TextField with a show/hide toggle; `error` is the message to show.
// `startIcon` (e.g. a lock) is drawn muted at the start of the input.
// Capped at 32 characters (the server enforces the same).
export default function PasswordField({ error, helperText, autoComplete = 'current-password', startIcon, ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      type={visible ? 'text' : 'password'}
      autoComplete={autoComplete}
      error={Boolean(error)}
      helperText={error || helperText}
      {...props}
      slotProps={{
        htmlInput: { maxLength: 32 },
        input: {
          startAdornment: startIcon && (
            <InputAdornment position="start" sx={{ color: 'text.secondary', '& .MuiSvgIcon-root': { fontSize: 18 } }}>
              {startIcon}
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setVisible((v) => !v)}
                edge="end"
                size="small"
                aria-label={visible ? 'Hide password' : 'Show password'}
                sx={{ color: 'text.secondary', mr: '-2px', '& .MuiSvgIcon-root': { fontSize: 19 } }}
              >
                {visible ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
