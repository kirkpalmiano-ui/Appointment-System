import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import KeyRoundedIcon from '@mui/icons-material/KeyRounded';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import SectionCard from '../ui/SectionCard';
import SoftChip from '../ui/SoftChip';
import { IconTile } from '../ui/StatCard';
import { fullDateTime, signInLabel } from '../users/format';
import { relativeTime } from '../../utils/time';

function Row({ icon, tone, label, children, action }) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', py: 1.5, '& + &': { borderTop: '1px solid', borderColor: 'divider' } }}>
      <IconTile icon={icon} tone={tone} size={34} />
      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12.5 }}>
          {label}
        </Typography>
        <Box sx={{ fontWeight: 700, fontSize: 14, overflowWrap: 'anywhere' }}>{children}</Box>
      </Box>
      {action}
    </Stack>
  );
}

// "just now" / "yesterday" read better mid-sentence; dates ("Oct 2") keep their capital.
const lowerRelative = (value) => {
  const text = relativeTime(value);
  return text === 'Just now' || text === 'Yesterday' ? text.toLowerCase() : text;
};

const MONO ='ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

/**
 * Security rows for My account.
 * signIn: newest audited panel sign-in (undefined = loading, null = none found).
 * thisDevice: whether that sign-in started this browser's session.
 * passwordChange: newest audited password change (null = none on record, so that part is left out).
 * failed: failed sign-ins in the last 24 h (null = unknown).
 */
export default function SecurityOverview({ signIn, thisDevice, fallbackLastLogin, passwordChange, failed }) {
  const lastAt = signIn?.createdAt ?? fallbackLastLogin;

  return (
    <SectionCard title="Security overview">
      <Box sx={{ mt: -1.5, mb: -1.5 }}>
        <Row icon={VerifiedUserOutlinedIcon} tone="success" label="Sign-in protection" action={<SoftChip tone="success">On</SoftChip>}>
          Password + emailed code
        </Row>

        <Row icon={KeyRoundedIcon} tone="primary" label="Password">
          {passwordChange === undefined ? (
            <Skeleton width={140} />
          ) : passwordChange ? (
            <span title={fullDateTime(passwordChange.createdAt)}>Last changed {lowerRelative(passwordChange.createdAt)}</span>
          ) : (
            'Set'
          )}
        </Row>

        <Row icon={LoginRoundedIcon} tone="info" label="Last sign-in" action={thisDevice && <SoftChip tone="accent">This device</SoftChip>}>
          {signIn === undefined ? (
            <Skeleton width={160} />
          ) : lastAt ? (
            <span title={fullDateTime(lastAt)}>
              {signInLabel(lastAt)}
              {signIn?.ip && (
                <Box component="span" sx={{ fontFamily: MONO, fontWeight: 500, fontSize: 13, color: 'text.secondary' }}>
                  {' · '}
                  {signIn.ip}
                </Box>
              )}
            </span>
          ) : (
            '—'
          )}
        </Row>

        <Row
          icon={ErrorOutlineRoundedIcon}
          tone={failed ? 'danger' : 'neutral'}
          label="Failed attempts (24 hours)"
          action={
            <Button component={RouterLink} to="/audit-log?success=false" size="small" endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />} sx={{ minHeight: 30, px: 1 }}>
              Review
            </Button>
          }
        >
          <Box component="span" sx={{ color: failed ? 'dangerChip.main' : 'text.primary' }}>
            {failed === null || failed === undefined ? '—' : failed}
          </Box>
        </Row>
      </Box>
    </SectionCard>
  );
}
