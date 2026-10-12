import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import { focusRing, reducedMotion } from './appointmentUi';

// Pill-shaped tabs ("Upcoming 3", "Past 12"…). Arrow keys move between tabs.
export default function ScopePills({ tabs, value, counts, onChange, panelId, idPrefix }) {
  const move = (e, index) => {
    const delta = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!delta) return;
    e.preventDefault();
    const next = tabs[(index + delta + tabs.length) % tabs.length];
    onChange(next.value);
    document.getElementById(`${idPrefix}-${next.value}`)?.focus();
  };

  return (
    <Box role="tablist" aria-label="Appointment filters" sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
      {tabs.map((tab, i) => {
        const selected = tab.value === value;
        const count = counts[tab.value];
        return (
          <ButtonBase
            key={tab.value}
            id={`${idPrefix}-${tab.value}`}
            role="tab"
            aria-selected={selected}
            aria-controls={panelId}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.value)}
            onKeyDown={(e) => move(e, i)}
            sx={[
              {
                gap: 0.75,
                px: 1.75,
                height: 38,
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 700,
                color: selected ? 'accent.contrastText' : 'text.secondary',
                bgcolor: selected ? 'accent.main' : 'transparent',
                transition: 'background-color 150ms, color 150ms',
                '&:hover': { bgcolor: selected ? 'accent.main' : 'action.hover' },
              },
              focusRing,
              reducedMotion,
            ]}
          >
            {tab.label}
            {count != null && (
              <Box
                component="span"
                sx={{
                  minWidth: 22,
                  px: 0.75,
                  borderRadius: 999,
                  fontSize: 12,
                  lineHeight: '20px',
                  textAlign: 'center',
                  bgcolor: selected ? 'field.main' : 'action.hover',
                  color: selected ? 'accent.contrastText' : 'text.secondary',
                }}
              >
                {count}
              </Box>
            )}
          </ButtonBase>
        );
      })}
    </Box>
  );
}
