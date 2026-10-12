import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AlternateEmailRoundedIcon from '@mui/icons-material/AlternateEmailRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import api from '../api/axios';
import ChangeEmailDialog from '../components/ChangeEmailDialog';
import PageHeader from '../components/PageHeader';
import PasswordField from '../components/PasswordField';
import SubmitButton from '../components/SubmitButton';
import AvatarEditor from '../components/account/AvatarEditor';
import PasswordStrength from '../components/account/PasswordStrength';
import SecurityOverview from '../components/account/SecurityOverview';
import SessionCard from '../components/account/SessionCard';
import { validateAdminPassword } from '../components/account/passwordRules';
import useMyAuditEvents from '../components/account/useMyAuditEvents';
import RoleChip from '../components/ui/RoleChip';
import SectionCard from '../components/ui/SectionCard';
import SoftChip from '../components/ui/SoftChip';
import useAuth from '../hooks/useAuth';
import useToast from '../hooks/useToast';
import { getErrorMessage, getFieldErrors } from '../utils/errors';
import { SESSION_SECONDS } from '../utils/session';

const EMPTY = { currentPassword: '', newPassword: '', confirmPassword: '' };

const BANNER_LIGHT = 'linear-gradient(110deg,#6d63f0,#a78bfa 45%,#f9a8d4 75%,#fde68a)';
const BANNER_DARK = 'linear-gradient(110deg,#312e81,#5b21b6 45%,#831843 80%,#78350f)';

export default function Account() {
  const { user, completeSession, sessionEndsAt, updateUser, logout } = useAuth();
  const { counts } = useOutletContext() ?? {};
  const navigate = useNavigate();
  const [emailDialog, setEmailDialog] = useState(false);
  const showToast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [auditTick, setAuditTick] = useState(0);
  const { signIn, passwordChange } = useMyAuditEvents(user.email, { refresh: auditTick });

  // The newest audited sign-in started this session if it happened when this token was issued.
  // (A password change re-issues the token, so after one this simply stays off.)
  const sessionStart = sessionEndsAt ? sessionEndsAt - SESSION_SECONDS * 1000 : null;
  const thisDevice = Boolean(signIn && sessionStart && Math.abs(new Date(signIn.createdAt).getTime() - sessionStart) < 2 * 60 * 1000);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const mismatch = Boolean(form.confirmPassword) && form.confirmPassword !== form.newPassword;
  const canSubmit = Boolean(form.currentPassword) && !validateAdminPassword(form.newPassword) && form.confirmPassword === form.newPassword;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const next = {};
    if (!form.currentPassword) next.currentPassword = 'Enter your current password.';
    const strength = validateAdminPassword(form.newPassword);
    if (strength) next.newPassword = strength;
    else if (form.newPassword === form.currentPassword) next.newPassword = 'Choose a different password.';
    if (form.confirmPassword !== form.newPassword) next.confirmPassword = 'Passwords do not match.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      const { data } = await api.put('/users/me', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      // The server ended every other session and gave this one a new admin token.
      completeSession(data.token, data.user);
      setForm(EMPTY);
      setAuditTick((n) => n + 1);
      showToast('Password changed. All other sessions were signed out.');
    } catch (err) {
      const message = getErrorMessage(err);
      setErrors({ ...getFieldErrors(err), ...(/current password/i.test(message) && { currentPassword: message }) });
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    setSigningOut(true);
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      <PageHeader title="My account" description="Your administrator profile and security." />

      {/* Profile */}
      <Card sx={{ mb: 3 }}>
        <Box
          aria-hidden
          sx={(theme) => ({ height: { xs: 96, sm: 120 }, background: BANNER_LIGHT, ...theme.applyStyles('dark', { background: BANNER_DARK }) })}
        />
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 1.5, sm: 2.5 }}
          sx={{ px: { xs: 2.5, sm: 3 }, pb: 3, alignItems: { sm: 'flex-end' } }}
        >
          <AvatarEditor
            size={84}
            sx={{ mt: '-42px' }}
            avatarSx={{ fontSize: 30, boxShadow: (t) => `0 0 0 4px ${t.vars.palette.background.paper}, 0 12px 24px -12px rgba(15, 23, 42, 0.35)` }}
          />
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography component="h2" sx={{ fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {user.name}
            </Typography>
            <Typography color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
              {user.email}
            </Typography>
            <Stack direction="row" spacing={0.75} useFlexGap sx={{ mt: 1.25, flexWrap: 'wrap' }}>
              <RoleChip role="admin" />
              {/* Admin panel sign-in always asks for an emailed code after the password (adminAuthController). */}
              <SoftChip tone="success" icon={<CheckRoundedIcon />}>
                2-step sign-in on
              </SoftChip>
            </Stack>
          </Box>
          <Button variant="outlined" startIcon={<AlternateEmailRoundedIcon />} onClick={() => setEmailDialog(true)} sx={{ alignSelf: { xs: 'flex-start', sm: 'flex-end' } }}>
            Change email
          </Button>
        </Stack>
      </Card>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Stack spacing={3}>
            <SessionCard sessionEndsAt={sessionEndsAt} onSignOut={signOut} signingOut={signingOut} />
            <SecurityOverview
              signIn={signIn}
              thisDevice={thisDevice}
              fallbackLastLogin={user.lastLoginAt}
              passwordChange={passwordChange}
              failed={counts?.failedSignIns}
            />
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <SectionCard title="Change password">
            <Typography variant="body2" color="text.secondary" sx={{ mt: -1, mb: 2.5 }}>
              Changing it signs you out on every other device.
            </Typography>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Box component="form" noValidate onSubmit={submit}>
              <Stack spacing={2.25}>
                <PasswordField
                  label="Current password"
                  name="currentPassword"
                  startIcon={<LockOutlinedIcon />}
                  value={form.currentPassword}
                  onChange={handleChange}
                  error={errors.currentPassword}
                />
                <Box>
                  <PasswordField
                    label="New password"
                    name="newPassword"
                    autoComplete="new-password"
                    startIcon={<LockOutlinedIcon />}
                    value={form.newPassword}
                    onChange={handleChange}
                    error={errors.newPassword}
                  />
                  <Box sx={{ mt: 1.5 }}>
                    <PasswordStrength password={form.newPassword} />
                  </Box>
                </Box>
                <PasswordField
                  label="Confirm new password"
                  name="confirmPassword"
                  autoComplete="new-password"
                  startIcon={<LockOutlinedIcon />}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  error={errors.confirmPassword || (mismatch ? 'Passwords do not match.' : '')}
                />
                <SubmitButton busy={busy} busyText="Updating..." disabled={!canSubmit}>
                  Update password
                </SubmitButton>
              </Stack>
            </Box>

            <Stack
              direction="row"
              spacing={1.25}
              sx={{ mt: 2.5, p: 1.75, borderRadius: '14px', bgcolor: 'infoChip.light', color: 'infoChip.main', alignItems: 'flex-start' }}
            >
              <InfoOutlinedIcon sx={{ fontSize: 18, mt: '2px' }} />
              <Typography variant="body2" sx={{ color: 'inherit', fontWeight: 500 }}>
                Name and phone are edited in the client app&apos;s profile. Email can only be changed here and must be confirmed with a code.
              </Typography>
            </Stack>
          </SectionCard>
        </Grid>
      </Grid>

      <ChangeEmailDialog
        open={emailDialog}
        currentEmail={user.email}
        onClose={() => setEmailDialog(false)}
        onChanged={(updated) => {
          updateUser(updated);
          showToast('Email address updated. Use it the next time you sign in.');
        }}
      />
    </>
  );
}
