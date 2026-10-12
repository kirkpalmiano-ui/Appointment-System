import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import SoftChip from '../ui/SoftChip';

const label = (s) => (s.isActive ? s.name : `${s.name} (hidden)`);

// First service as an outlined chip + "+N more" with the rest in a tooltip.
export default function ServicesSummary({ services = [] }) {
  if (!services.length) {
    return (
      <Typography variant="body2" sx={{ color: 'pendingChip.main', fontWeight: 600 }}>
        No services: clients can&apos;t book
      </Typography>
    );
  }
  const [first, ...rest] = services;
  return (
    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', minWidth: 0 }}>
      <SoftChip tone="outlined" title={label(first)} sx={[{ minWidth: 0, flexShrink: 1, color: 'text.primary' }, !first.isActive && { opacity: 0.6 }]}>
        <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {first.name}
        </Box>
      </SoftChip>
      {rest.length > 0 && (
        <Tooltip
          title={
            <Box component="ul" sx={{ m: 0, pl: 2 }}>
              {rest.map((s) => (
                <li key={s._id}>{label(s)}</li>
              ))}
            </Box>
          }
        >
          <Box component="span" tabIndex={0} aria-label={`Also offers ${rest.map(label).join(', ')}`} sx={{ flex: 'none', borderRadius: 999, '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 } }}>
            <SoftChip tone="accent">+{rest.length} more</SoftChip>
          </Box>
        </Tooltip>
      )}
    </Stack>
  );
}
