import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AlternateEmailRoundedIcon from '@mui/icons-material/AlternateEmailRounded';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import api from '../api/axios';
import { getErrorMessage, getFieldErrors } from '../utils/errors';
import { validateEmail } from '../utils/validation';
import OtpInput from './OtpInput';
import PasswordField from './PasswordField';
import ResendCode from './ResendCode';
import SubmitButton from './SubmitButton';
import { IconTile } from './ui/StatCard';

// When the Resend button unlocks (epoch ms).
const cooldownFrom = (seconds) => Date.now() + seconds * 1000;

// Admin email change. Two steps: new email + current password -> code sent to
// the new email. Only allowed from an admin-panel session (the server checks).
export default function ChangeEmailDialog({ open, currentEmail, onClose, onChanged }) {
  const [step, setStep] = useState(0);
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const email = newEmail.trim().toLowerCase();

  const reset = () => {
    setStep(0);
    setNewEmail('');
    setPassword('');
    setCode('');
    setErrors({});
    setError('');
    setNotice('');
  };

  // Back to the email step: the old code and its messages no longer apply.
  const goBack = () => {
    setStep(0);
    setCode('');
    setError('');
    setNotice('');
  };

  const close = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const fail = (err) => {
    setError(getErrorMessage(err));
    setErrors(getFieldErrors(err));
    const retryAfter = err.response?.data?.retryAfter;
    if (retryAfter) setCooldownUntil(cooldownFrom(retryAfter));
  };

  const requestCode = async (e) => {
    e.preventDefault();
    setError('');
    const nextErrors = {};
    const emailError = validateEmail(newEmail);
    if (emailError) nextErrors.newEmail = emailError;
    else if (email === currentEmail) nextErrors.newEmail = 'That is already your email address.';
    if (!password) nextErrors.currentPassword = 'Enter your current password.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setBusy(true);
    try {
      const { data } = await api.post('/users/me/email', { newEmail: email, currentPassword: password });
      setCooldownUntil(cooldownFrom(data.resendAvailableIn));
      setNotice(data.message);
      setStep(1);
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const verify = async (otp) => {
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      const { data } = await api.post('/users/me/email/verify', { newEmail: email, otp });
      setBusy(false);
      onChanged(data.user);
      reset();
      onClose();
    } catch (err) {
      fail(err);
      setCode('');
      setBusy(false);
    }
  };

  const resend = async () => {
    setError('');
    try {
      const { data } = await api.post('/users/me/email/resend', { newEmail: email });
      setCooldownUntil(cooldownFrom(data.resendAvailableIn));
      setCode('');
      setNotice('A new code is on its way. Earlier codes no longer work.');
    } catch (err) {
      fail(err);
    }
  };

  return (
    <Dialog open={open} onClose={close} maxWidth="xs" fullWidth aria-labelledby="change-email-title">
      <DialogContent sx={{ pt: 3 }}>
        <Stack direction="row" spacing={1.75} sx={{ alignItems: 'center', mb: 2.5 }}>
          <IconTile icon={step === 0 ? AlternateEmailRoundedIcon : MarkEmailReadOutlinedIcon} tone="primary" size={44} />
          <Box sx={{ minWidth: 0 }}>
            <Typography id="change-email-title" component="h2" sx={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em', lineHeight: 1.3 }}>
              {step === 0 ? 'Change email' : 'Check your inbox'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Step {step + 1} of 2
            </Typography>
          </Box>
        </Stack>

        {notice && !error && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {notice}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {step === 0 ? (
          <Box component="form" id="change-email-form" noValidate onSubmit={requestCode}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              We&apos;ll send a code to your new address to make sure it&apos;s yours.
            </Typography>
            <Stack spacing={2.25} sx={{ pt: 0.5 }}>
              <TextField
                label="New email"
                type="email"
                slotProps={{
                  htmlInput: { maxLength: 64 },
                  input: {
                    startAdornment: (
                      <InputAdornment position="start" sx={{ color: 'text.secondary', '& .MuiSvgIcon-root': { fontSize: 18 } }}>
                        <MailOutlineRoundedIcon />
                      </InputAdornment>
                    ),
                  },
                }}
                autoComplete="email"
                autoFocus
                value={newEmail}
                onChange={(e) => {
                  setNewEmail(e.target.value);
                  setErrors((prev) => ({ ...prev, newEmail: '' }));
                }}
                error={Boolean(errors.newEmail)}
                helperText={errors.newEmail}
              />
              <PasswordField
                label="Current password"
                startIcon={<LockOutlinedIcon />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.currentPassword}
              />
            </Stack>
          </Box>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Enter the 6-digit code sent to{' '}
              <Box component="span" sx={{ fontWeight: 600, color: 'text.primary', wordBreak: 'break-all' }}>
                {email}
              </Box>
              .
            </Typography>
            <OtpInput value={code} onChange={setCode} onComplete={verify} disabled={busy} invalid={Boolean(error)} />
            <Box sx={{ mt: 3 }}>
              <ResendCode cooldownUntil={cooldownUntil} onResend={resend} disabled={busy} />
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={step === 0 ? close : goBack} variant="outlined" disabled={busy}>
          {step === 0 ? 'Cancel' : 'Back'}
        </Button>
        {step === 0 ? (
          <SubmitButton form="change-email-form" busy={busy} busyText="Sending..." fullWidth={false} size="medium">
            Send code
          </SubmitButton>
        ) : (
          <SubmitButton
            type="button"
            onClick={() => verify(code.trim())}
            busy={busy}
            busyText="Verifying..."
            disabled={code.trim().length !== 6}
            fullWidth={false}
            size="medium"
          >
            Confirm
          </SubmitButton>
        )}
      </DialogActions>
    </Dialog>
  );
}
