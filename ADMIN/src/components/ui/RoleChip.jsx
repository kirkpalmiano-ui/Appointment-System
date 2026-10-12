import SoftChip from './SoftChip';

// Admin = solid dark, Staff = sky, Client = outlined neutral.
const ROLE = {
  admin: { tone: 'dark', label: 'Admin' },
  staff: { tone: 'info', label: 'Staff' },
  client: { tone: 'outlined', label: 'Client' },
};

export default function RoleChip({ role, sx }) {
  const r = ROLE[role] ?? { tone: 'outlined', label: role };
  return (
    <SoftChip tone={r.tone} sx={sx}>
      {r.label}
    </SoftChip>
  );
}
