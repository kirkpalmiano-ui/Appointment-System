import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';

/**
 * Small segmented control ("Table | Calendar"). options: [{ value, label, icon?, disabled? }].
 * Rendered as a radiogroup so arrow-key users get the right semantics.
 */
export default function SegmentedToggle({ value, options, onChange, label }) {
  return (
    <Box role="radiogroup" aria-label={label} sx={{ display: 'inline-flex', p: '3px', gap: '2px', borderRadius: 999, bgcolor: 'hover.main', border: 1, borderColor: 'divider', flex: 'none' }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <ButtonBase
            key={o.value}
            role="radio"
            aria-checked={active}
            disabled={o.disabled}
            title={o.title}
            onClick={() => onChange(o.value)}
            sx={{
              gap: 0.75,
              px: 1.5,
              height: 30,
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 700,
              color: active ? 'text.primary' : 'text.secondary',
              bgcolor: active ? 'field.main' : 'transparent',
              boxShadow: active ? '0 1px 3px rgba(15, 23, 42, 0.12)' : 'none',
              '&.Mui-disabled': { opacity: 0.5 },
              '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'primary.main' },
              '& .MuiSvgIcon-root': { fontSize: 16 },
            }}
          >
            {o.icon}
            {o.label}
          </ButtonBase>
        );
      })}
    </Box>
  );
}
