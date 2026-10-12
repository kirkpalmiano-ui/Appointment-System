import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';
import { ADMIN_PASSWORD_RULES, passwordScore } from './passwordRules';

const LEVELS = [
  { label: 'Too weak', color: 'error.main' },
  { label: 'Weak', color: 'error.main' },
  { label: 'Fair', color: 'warning.main' },
  { label: 'Almost there', color: 'warning.main' },
  { label: 'Strong', color: 'success.main' },
];

// 4-segment meter + live checklist of the admin password rules.
export default function PasswordStrength({ password }) {
  const score = passwordScore(password);
  const level = LEVELS[score];

  return (
    <Box>
      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
        <Box
          role="meter"
          aria-label="Password strength"
          aria-valuemin={0}
          aria-valuemax={4}
          aria-valuenow={score}
          aria-valuetext={password ? level.label : 'Empty'}
          sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', flexGrow: 1 }}
        >
          {[1, 2, 3, 4].map((n) => (
            <Box key={n} sx={{ height: 6, borderRadius: 999, bgcolor: n <= score ? level.color : 'hover.main', transition: 'background-color 160ms ease' }} />
          ))}
        </Box>
        <Typography variant="caption" sx={{ minWidth: 84, textAlign: 'right', fontWeight: 700, color: password ? level.color : 'text.disabled' }}>
          {password ? level.label : ' '}
        </Typography>
      </Stack>

      <Box component="ul" aria-label="Password requirements" sx={{ listStyle: 'none', p: 0, m: 0, mt: 1.5, display: 'grid', gap: 0.75, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
        {ADMIN_PASSWORD_RULES.map((rule) => {
          const met = rule.test(password);
          return (
            <Box
              component="li"
              key={rule.id}
              sx={{ display: 'flex', alignItems: 'center', gap: 0.75, fontSize: 13, fontWeight: met ? 700 : 500, color: met ? 'successChip.main' : 'text.secondary', transition: 'color 160ms ease' }}
            >
              {met ? <CheckCircleRoundedIcon sx={{ fontSize: 16 }} /> : <RadioButtonUncheckedRoundedIcon sx={{ fontSize: 16, opacity: 0.6 }} />}
              {rule.label}
              <Box component="span" sx={visuallyHidden}>
                {met ? '(met)' : '(not met)'}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

const visuallyHidden = { position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' };
