import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import LinkOffRoundedIcon from '@mui/icons-material/LinkOffRounded';
import api from '../api/axios';
import IconBadge from '../components/IconBadge';
import PageLoader from '../components/PageLoader';
import PasswordField from '../components/PasswordField';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import SubmitButton from '../components/SubmitButton';
import useAuth from '../hooks/useAuth';
import { getErrorMessage, getFieldErrors } from '../utils/errors';
import { validatePassword } from '../utils/validation';

// The activation link looks like /staff/activate#token=<64 hex chars>. The token
// is in the fragment (#), which browsers never send to the web server.
function readTokenFromLink() {
  const match = window.location.hash.match(/token=([a-f0-9]{64})/);
  return match ? match[1] : '';
}

// Staff open this page from the link in their invite email and choose a password.
export default function StaffActivate() {
  const { saveSession } = useAuth();
  const navigate = useNavigate();

  const [token] = useState(readTokenFromLink);
  // checking -> ready (show the form) | invalid (expired/used/missing link)
  const [invite, setInvite] = useState(() => (token ? { status: 'checking' } : { status: 'invalid' }));
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return undefined;
    // Remove the secret from the address bar (and browser history) right away.
    window.history.replaceState(null, '', window.location.pathname);
    let active = true;
    api
      .post('/auth/staff/invite', { token })
      .then(({ data }) => active && setInvite({ status: 'ready', name: data.name, email: data.email }))
      .catch((err) => active && setInvite({ status: 'invalid', message: getErrorMessage(err) }));
    return () => {
      active = false;
    };
  }, [token]);

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const next = {};
    const passwordError = validatePassword(form.password);
    if (passwordError) next.password = passwordError;
    if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      const { data } = await api.post('/auth/staff/activate', { token, password: form.password });
      saveSession(data.token, data.user);
      navigate('/staff', { replace: true });
    } catch (err) {
      if (err.response?.data?.code === 'INVITE_INVALID') {
        setInvite({ status: 'invalid', message: getErrorMessage(err) });
      } else {
        setErrors(getFieldErrors(err));
        setError(getErrorMessage(err));
      }
      setBusy(false);
    }
  };

  if (invite.status === 'checking') return <PageLoader label="Checking your activation link..." />;

  if (invite.status === 'invalid') {
    return (
      <>
        <IconBadge icon={LinkOffRoundedIcon} color="warning" size={52} sx={{ mb: 2 }} />
        <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
          This link can&apos;t be used
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {invite.message ||
            'Staff accounts are activated from the link in your invite email. Please open the link from the email you received.'}
        </Typography>
        <Alert severity="info" sx={{ mb: 3 }}>
          Activation links expire after 24 hours and work only once. If yours has expired, ask an administrator to send you a new invite.
        </Alert>
        <Button component={RouterLink} to="/login" variant="outlined" fullWidth>
          Go to log in
        </Button>
      </>
    );
  }

  return (
    <>
      <IconBadge icon={BadgeOutlinedIcon} size={52} sx={{ mb: 2 }} />
      <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
        Activate your staff account
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Welcome, {invite.name}. Choose a password to finish setting up your account.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" noValidate onSubmit={submit}>
        <Stack spacing={2.5}>
          {/* Shown read-only; also helps password managers save the right login. */}
          <TextField label="Work email" type="email" value={invite.email} autoComplete="username" disabled helperText="This is your login" />
          <Box>
            <PasswordField
              label="New password"
              autoComplete="new-password"
              autoFocus
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              error={errors.password}
              helperText="8 to 32 characters, with a letter and a number"
            />
            <PasswordStrengthMeter password={form.password} />
          </Box>
          <PasswordField
            label="Confirm password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={(e) => set('confirmPassword', e.target.value)}
            error={errors.confirmPassword}
          />
          <SubmitButton busy={busy} busyText="Activating...">
            Activate account
          </SubmitButton>
        </Stack>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 3 }}>
        Already activated?{' '}
        <Link component={RouterLink} to="/login">
          Log in
        </Link>
      </Typography>
    </>
  );
}
