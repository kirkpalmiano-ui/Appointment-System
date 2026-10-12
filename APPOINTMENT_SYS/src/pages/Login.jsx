import { useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import InputAdornment from '@mui/material/InputAdornment';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import api from '../api/axios';
import PasswordField from '../components/PasswordField';
import SubmitButton from '../components/SubmitButton';
import useAuth from '../hooks/useAuth';
import useIsMobile from '../hooks/useIsMobile';
import { getErrorMessage, getFieldErrors } from '../utils/errors';
import { setPendingEmail, startCooldown } from '../utils/otpSession';
import { homeFor } from '../utils/roles';
import { validateLogin } from '../utils/validation';

// Once the on-screen keyboard has opened, scroll the focused field to the middle of the screen.
const KEYBOARD_DELAY = 300;
function scrollFieldIntoView(e) {
  const field = e.target;
  if (field.tagName !== 'INPUT') return;
  const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.setTimeout(() => field.scrollIntoView({ block: 'center', behavior: smooth ? 'smooth' : 'auto' }), KEYBOARD_DELAY);
}

export default function Login() {
  const { login } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  // Where the user was trying to go before being sent to login (if anywhere).
  const from = location.state?.from;
  const redirectTo = from?.pathname ? `${from.pathname}${from.search ?? ''}` : '';

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // Correct password but the email was never verified: send a fresh code
  // (unless one was sent very recently) and go to the verification screen.
  const continueVerification = async (email) => {
    setPendingEmail(email);
    let notice = 'Your email is not verified yet. We sent you a new code.';
    try {
      const { data } = await api.post('/auth/resend-otp', { email, purpose: 'verify-email' });
      startCooldown('verify-email', email, data.resendAvailableIn);
    } catch (err) {
      const retryAfter = err.response?.data?.retryAfter;
      if (retryAfter) startCooldown('verify-email', email, retryAfter);
      notice = 'Your email is not verified yet. Enter the code we sent earlier, or request a new one.';
    }
    navigate('/verify-email', { state: { notice } });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const validationErrors = validateLogin(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) return;

    setSubmitting(true);
    try {
      const user = await login(form.email.trim(), form.password);
      // Staff go to their schedule, everyone else to their dashboard.
      navigate(redirectTo || homeFor(user), { replace: true });
    } catch (err) {
      if (err.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        await continueVerification(err.response.data.email);
        return;
      }
      setErrors(getFieldErrors(err));
      setServerError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <>
      <Typography
        component="h1"
        sx={(theme) => ({
          fontWeight: 800,
          fontSize: '2rem',
          letterSpacing: '-0.03em',
          lineHeight: 1.15,
          // Phones/tablets: the layout's big headline sits just above, so keep this one smaller.
          [theme.breakpoints.down('md')]: { fontSize: '1.6rem' },
        })}
      >
        Log in
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 0.5, mb: { xs: 3, md: 3.5 } }}>
        Good to see you again. Enter your details below.
      </Typography>

      {location.state?.message && !serverError && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {location.state.message}
        </Alert>
      )}
      {serverError && (
        <Alert severity="error" onClose={() => setServerError('')} sx={{ mb: 2 }}>
          {serverError}
        </Alert>
      )}

      <Box component="form" noValidate onSubmit={handleSubmit} onFocus={isMobile ? scrollFieldIntoView : undefined}>
        <Stack spacing={2.5}>
          <TextField
            label="Email"
            type="email"
            slotProps={{
              htmlInput: { maxLength: 64 },
              inputLabel: { shrink: true },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <MailOutlineRoundedIcon sx={{ fontSize: 18 }} />
                  </InputAdornment>
                ),
              },
            }}
            name="email"
            placeholder="you@example.com"
            autoComplete="email"
            // On phones, don't pop the keyboard over the page as soon as it opens.
            autoFocus={!isMobile}
            value={form.email}
            onChange={handleChange}
            error={Boolean(errors.email)}
            helperText={errors.email}
          />
          <Box>
            <PasswordField
              label="Password"
              name="password"
              placeholder="Enter your password"
              startIcon={<LockOutlinedIcon sx={{ fontSize: 18 }} />}
              value={form.password}
              onChange={handleChange}
              error={errors.password}
            />
            <Box sx={{ textAlign: 'right', mt: { xs: 0.5, md: 1.25 } }}>
              <Link
                component={RouterLink}
                to="/forgot-password"
                state={{ email: form.email.trim() }}
                variant="body2"
                aria-label="Forgot password?"
                // Phones/tablets: a 44px-tall tap area.
                sx={(theme) => ({ fontWeight: 600, [theme.breakpoints.down('md')]: { display: 'inline-flex', alignItems: 'center', minHeight: 44, px: 0.5 } })}
              >
                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                  Forgot?
                </Box>
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  Forgot password?
                </Box>
              </Link>
            </Box>
          </Box>
          <SubmitButton busy={submitting} busyText="Logging in..." endIcon={submitting ? undefined : <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />}>
            Log in
          </SubmitButton>
        </Stack>
      </Box>

      <Divider sx={{ my: 3, color: 'text.secondary', fontSize: 13 }}>or</Divider>

      {/* Booking needs an account, so guests can browse what's offered instead. */}
      <Button
        component={RouterLink}
        to="/#services"
        variant="outlined"
        fullWidth
        startIcon={<ScheduleRoundedIcon sx={{ fontSize: 18 }} />}
        sx={{ minHeight: 52 }}
      >
        Browse services as a guest
      </Button>

      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 3 }}>
        Don&apos;t have an account?{' '}
        <Link component={RouterLink} to="/register" sx={{ fontWeight: 600 }}>
          Sign up
        </Link>
      </Typography>
      <Typography variant="caption" component="p" color="text.secondary" sx={{ textAlign: 'center', mt: 1.5 }}>
        <VerifiedUserOutlinedIcon sx={{ fontSize: 14, verticalAlign: '-2px', mr: 0.5 }} />
        Passwords are securely hashed and never stored as plain text
      </Typography>
    </>
  );
}
