import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';

// Dot colours for quick filters.
const DOT = {
  pending: 'pendingChip.main',
  success: 'successChip.main',
  info: 'infoChip.main',
  danger: 'dangerChip.main',
  neutral: 'text.secondary',
  primary: 'primary.main',
};

/**
 * Quick filter chips with an optional coloured dot and count: "● Pending 2".
 * options: [{ value, label, dot?, count? }]. The active chip is solid dark.
 */
export default function FilterChips({ value, options, onChange, label }) {
  return (
    <Box role="group" aria-label={label} sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <ButtonBase
            key={o.value}
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            sx={{
              gap: 0.75,
              px: 1.5,
              height: 32,
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 700,
              border: '1px solid',
              borderColor: active ? 'text.primary' : 'divider',
              bgcolor: active ? 'text.primary' : 'field.main',
              color: active ? 'background.default' : 'text.primary',
              '&:hover': { borderColor: active ? 'text.primary' : 'text.secondary' },
              '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
            }}
          >
            {o.dot && <Box component="span" aria-hidden sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: DOT[o.dot] ?? o.dot }} />}
            {o.label}
            {o.count !== undefined && o.count !== null && (
              <Box component="span" sx={{ fontWeight: 600, opacity: active ? 0.75 : 0.6 }}>
                {o.count}
              </Box>
            )}
          </ButtonBase>
        );
      })}
    </Box>
  );
}
