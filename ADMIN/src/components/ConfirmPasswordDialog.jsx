import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { getErrorMessage } from '../utils/errors';
import PasswordField from './PasswordField';
import { IconTile } from './ui/StatCard';

// Button colour -> icon tile tone.
const TONE = { error: 'danger', warning: 'pending', primary: 'primary', info: 'info', success: 'success' };

/**
 * Step-up confirmation for dangerous actions: the admin re-enters their password.
 * `onConfirm(password)` must return a promise; if it rejects, the error is shown here.
 */
export default function ConfirmPasswordDialog({ open, title, message, confirmText = 'Confirm', color = 'error', onConfirm, onClose }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const close = () => {
    if (busy) return;
    setPassword('');
    setError('');
    onClose();
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!password) {
      setError('Enter your password to continue.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onConfirm(password);
      setPassword('');
      setBusy(false);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
      setPassword('');
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={close} maxWidth="xs" fullWidth aria-labelledby="confirm-password-title">
      <Box component="form" noValidate onSubmit={submit}>
        <DialogContent sx={{ pt: 3 }}>
          <Stack direction="row" spacing={1.75} sx={{ alignItems: 'flex-start', mb: 2.5 }}>
            <IconTile icon={LockOutlinedIcon} tone={TONE[color] ?? 'primary'} size={44} />
            <Box sx={{ minWidth: 0 }}>
              <Typography id="confirm-password-title" component="h2" sx={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em', lineHeight: 1.3 }}>
                {title}
              </Typography>
              <Typography component="div" variant="body2" color="text.secondary" sx={{ mt: 0.75, overflowWrap: 'anywhere' }}>
                {message}
              </Typography>
            </Box>
          </Stack>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <PasswordField
            label="Your password"
            autoFocus
            startIcon={<LockOutlinedIcon />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            helperText="For security, confirm it's really you."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={close} variant="outlined" disabled={busy}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color={color}
            disabled={busy}
            startIcon={busy ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {confirmText}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
