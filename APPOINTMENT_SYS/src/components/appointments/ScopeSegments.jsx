import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import { focusRing, reducedMotion } from './appointmentUi';

// Mobile: full-width segmented pill control ("Upcoming 3 | Past 12 | Cancelled 1").
// Same tab semantics as ScopePills (arrow keys move between tabs). When the current value
// isn't one of the segments (e.g. "All", picked in the filter sheet) none is selected.
export default function ScopeSegments({ tabs, value, counts, onChange, panelId, idPrefix }) {
  const hasSelected = tabs.some((t) => t.value === value);

  const move = (e, index) => {
    const delta = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!delta) return;
    e.preventDefault();
    const next = tabs[(index + delta + tabs.length) % tabs.length];
    onChange(next.value);
    document.getElementById(`${idPrefix}-${next.value}`)?.focus();
  };

  return (
    <Box
      role="tablist"
      aria-label="Appointment filters"
      sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`,
        gap: 0.5,
        p: 0.5,
        borderRadius: 999,
        bgcolor: 'field.main',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
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
            tabIndex={selected || (!hasSelected && i === 0) ? 0 : -1}
            onClick={() => onChange(tab.value)}
            onKeyDown={(e) => move(e, i)}
            sx={[
              {
                minWidth: 0,
                minHeight: 44,
                gap: 0.5,
                px: 0.75,
                borderRadius: 999,
                fontSize: 13.5,
                fontWeight: 700,
                whiteSpace: 'nowrap',
                color: selected ? 'accent.contrastText' : 'text.secondary',
                bgcolor: selected ? 'accent.main' : 'transparent',
                transition: 'background-color 150ms, color 150ms',
                '&:hover': { bgcolor: selected ? 'accent.main' : 'action.hover' },
              },
              focusRing,
              reducedMotion,
            ]}
          >
            <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
              {tab.label}
            </Box>
            {count != null && (
              <Box
                component="span"
                sx={{
                  flex: 'none',
                  minWidth: 20,
                  px: 0.5,
                  borderRadius: 999,
                  fontSize: 11.5,
                  lineHeight: '18px',
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
