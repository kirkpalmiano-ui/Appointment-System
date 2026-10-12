import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import api from '../../api/axios';
import PasswordField from '../PasswordField';
import PasswordStrengthMeter from '../PasswordStrengthMeter';
import SubmitButton from '../SubmitButton';
import useAuth from '../../hooks/useAuth';
import useToast from '../../hooks/useToast';
import { getErrorMessage, getFieldErrors } from '../../utils/errors';
import { validatePassword } from '../../utils/validation';
import ProfileSection from './ProfileSection';

const EMPTY_PASSWORDS = { currentPassword: '', newPassword: '', confirmPassword: '' };

function PasswordForm() {
  const { user, saveSession } = useAuth();
  const showToast = useToast();
  const [form, setForm] = useState(EMPTY_PASSWORDS);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!form.currentPassword) nextErrors.currentPassword = 'Enter your current password.';
    const passwordError = validatePassword(form.newPassword);
    if (passwordError) nextErrors.newPassword = passwordError;
    else if (form.newPassword === form.currentPassword) nextErrors.newPassword = 'Choose a password different from your current one.';
    if (form.confirmPassword !== form.newPassword) nextErrors.confirmPassword = 'Passwords do not match.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setBusy(true);
    try {
      const { data } = await api.put('/users/me', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      // Older tokens stop working after a password change, so store the new one.
      saveSession(data.token, data.user ?? user);
      setForm(EMPTY_PASSWORDS);
      showToast('Password changed. Other devices have been logged out.');
    } catch (err) {
      const message = getErrorMessage(err);
      const fieldErrors = getFieldErrors(err);
      if (/current password/i.test(message)) fieldErrors.currentPassword = message;
      setErrors(fieldErrors);
      showToast(message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box component="form" noValidate onSubmit={submit}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
        <Box sx={{ gridColumn: '1 / -1', maxWidth: { sm: 'calc(50% - 10px)' } }}>
          <PasswordField
            label="Current password"
            name="currentPassword"
            value={form.currentPassword}
            onChange={handleChange}
            error={errors.currentPassword}
            fullWidth
          />
        </Box>
        <Box>
          <PasswordField
            label="New password"
            name="newPassword"
            autoComplete="new-password"
            value={form.newPassword}
            onChange={handleChange}
            error={errors.newPassword}
            helperText="8 to 32 characters, with a letter and a number"
            fullWidth
          />
          <PasswordStrengthMeter password={form.newPassword} />
        </Box>
        <PasswordField
          label="Confirm new password"
          name="confirmPassword"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          fullWidth
        />
      </Box>
      <Box sx={{ mt: 3 }}>
        <SubmitButton busy={busy} busyText="Updating..." fullWidth={false} size="medium">
          Update password
        </SubmitButton>
      </Box>
    </Box>
  );
}

// Password change. Admin passwords are only changed from the admin panel (2FA).
export default function SecurityCard({ isAdmin }) {
  return (
    <ProfileSection id="security" title="Security" subtitle="Changing your password logs you out on all other devices.">
      {isAdmin ? (
        <Typography color="text.secondary">For security, administrators change their password in the admin panel (My account).</Typography>
      ) : (
        <PasswordForm />
      )}
    </ProfileSection>
  );
}
