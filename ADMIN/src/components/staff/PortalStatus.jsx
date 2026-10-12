import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import SoftChip from '../ui/SoftChip';

// Small text-link style action under the status chip.
const linkSx = {
  minHeight: 0,
  minWidth: 0,
  px: '2px',
  py: 0,
  fontSize: 13,
  fontWeight: 700,
  borderRadius: '6px',
  '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
  '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
};

function LinkAction({ children, ...props }) {
  return (
    <Button size="small" disableRipple sx={linkSx} {...props}>
      {children}
    </Button>
  );
}

// Staff-portal status (none | invited | active) + the matching action (invite / resend / revoke).
// TODO(backend): "Sent 1 day ago" needs the invite timestamp (User.inviteSentAt is select:false
// and not included in GET /staff's `portal` object).
export default function PortalStatus({ member, busy, onInvite, onRevoke }) {
  const status = member.portal?.status ?? 'none';
  const lastLogin = member.portal?.lastLoginAt;

  return (
    <Stack spacing={0.5} sx={{ alignItems: 'flex-start' }}>
      {status === 'active' && (
        <>
          <Tooltip title={lastLogin ? `Last sign-in ${new Date(lastLogin).toLocaleString('en-US')}` : 'Has not signed in yet'}>
            <SoftChip tone="success" dot tabIndex={0}>
              Active
            </SoftChip>
          </Tooltip>
          <LinkAction color="error" onClick={() => onRevoke(member)} aria-label={`Revoke portal access for ${member.name}`}>
            Revoke access
          </LinkAction>
        </>
      )}
      {status === 'invited' && (
        <>
          <SoftChip tone="pending" icon={<MailOutlineRoundedIcon />}>
            Invited
          </SoftChip>
          <Stack direction="row" spacing={1.25}>
            <LinkAction onClick={() => onInvite(member)} disabled={busy} aria-label={`Resend invite to ${member.name}`}>
              Resend
            </LinkAction>
            <LinkAction color="error" onClick={() => onRevoke(member)} aria-label={`Cancel invite for ${member.name}`}>
              Cancel
            </LinkAction>
          </Stack>
        </>
      )}
      {status === 'none' && (
        <>
          <SoftChip tone="outlined">No access</SoftChip>
          <LinkAction onClick={() => onInvite(member)} disabled={busy} aria-label={`Send portal invite to ${member.name}`}>
            Send invite
          </LinkAction>
        </>
      )}
    </Stack>
  );
}
