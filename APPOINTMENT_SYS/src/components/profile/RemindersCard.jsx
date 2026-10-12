import { useState } from 'react';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import api from '../../api/axios';
import useAuth from '../../hooks/useAuth';
import useToast from '../../hooks/useToast';
import { getErrorMessage } from '../../utils/errors';
import ProfileSection from './ProfileSection';
import { pillSwitchSx } from './profileUtils';

// Same defaults as the server (User.notificationPrefs) for accounts saved before this existed.
const DEFAULTS = { emailReminders: true, statusUpdates: true, healthTips: false };

const ROWS = [
  { id: 'emailReminders', title: 'Email reminder', description: 'An email about 24 hours before each appointment.' },
  {
    id: 'statusUpdates',
    title: 'Booking status updates',
    description: 'An email when the clinic confirms, reschedules or cancels your booking.',
  },
  {
    id: 'healthTips',
    title: 'Health tips & promos',
    description: "Occasional tips and offers from the clinic. We'll only email these if you turn this on.",
  },
];

// Email preferences, saved to the account as soon as a switch is flipped.
export default function RemindersCard() {
  const { user, updateUser } = useAuth();
  const showToast = useToast();
  const [saving, setSaving] = useState('');
  const prefs = { ...DEFAULTS, ...user.notificationPrefs };

  const toggle = async (key, value) => {
    const previous = user;
    setSaving(key);
    // Flip immediately; roll back if the server says no.
    updateUser({ ...user, notificationPrefs: { ...prefs, [key]: value } });
    try {
      const { data } = await api.put('/users/me', { [key]: value });
      updateUser(data.user);
      showToast(value ? 'Turned on.' : 'Turned off.');
    } catch (err) {
      updateUser(previous);
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSaving('');
    }
  };

  return (
    <ProfileSection id="reminders" title="Appointment reminders" subtitle="Choose which emails we send you about your visits.">
      <Stack divider={<Divider flexItem />}>
        {ROWS.map((row) => (
          <Stack key={row.id} direction="row" spacing={2} sx={{ py: 1.75, alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography id={`reminder-${row.id}`} sx={{ fontWeight: 700 }}>
                {row.title}
              </Typography>
              <Typography id={`reminder-${row.id}-desc`} variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                {row.description}
              </Typography>
            </Box>
            <Switch
              checked={prefs[row.id]}
              disabled={saving === row.id}
              onChange={(e) => toggle(row.id, e.target.checked)}
              disableRipple
              sx={pillSwitchSx}
              slotProps={{ input: { 'aria-labelledby': `reminder-${row.id}`, 'aria-describedby': `reminder-${row.id}-desc` } }}
            />
          </Stack>
        ))}
      </Stack>
    </ProfileSection>
  );
}
