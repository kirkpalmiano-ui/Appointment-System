// Shared look for pickable cards (services, specialists). Selected: 2px primary
// border (1px border + 1px inset shadow, so nothing shifts) and a soft primary ring.
export const selectableCardSx = (selected) => (theme) => ({
  height: '100%',
  borderColor: selected ? theme.vars.palette.primary.main : theme.vars.palette.divider,
  ...(selected && {
    boxShadow: `inset 0 0 0 1px ${theme.vars.palette.primary.main}, 0 0 0 4px rgba(${theme.vars.palette.primary.mainChannel} / 0.15)`,
  }),
  transition: 'border-color 150ms, box-shadow 150ms',
  '&:hover': { borderColor: theme.vars.palette.primary.main },
  '& .MuiCardActionArea-root': { borderRadius: 'inherit' },
  '& .MuiCardActionArea-root.Mui-focusVisible': {
    outline: `2px solid ${theme.vars.palette.primary.main}`,
    outlineOffset: -4,
  },
  '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
});
