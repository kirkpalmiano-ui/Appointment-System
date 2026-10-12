// Floating, frosted pill used for the top navigation bar (site pages and the login/sign-up pages).
// `raised` gives a slightly stronger shadow and more solid background, e.g. once the page scrolls.
export const navPillSx = (raised = false) => (theme) => ({
  pointerEvents: 'auto',
  gap: 1,
  minHeight: { xs: 56, sm: 60 },
  pl: { xs: 2, sm: 2.5 },
  pr: { xs: 1, sm: 1.25 },
  borderRadius: 999,
  border: '1px solid',
  borderColor: 'divider',
  bgcolor: `rgba(${theme.vars.palette.background.paperChannel} / ${raised ? 0.88 : 0.72})`,
  backdropFilter: 'blur(14px) saturate(140%)',
  WebkitBackdropFilter: 'blur(14px) saturate(140%)',
  boxShadow: raised
    ? '0 10px 30px -12px rgba(15, 23, 42, 0.18), 0 1px 2px rgba(15, 23, 42, 0.04)'
    : '0 4px 16px -10px rgba(15, 23, 42, 0.12)',
  transition: 'box-shadow 200ms ease, background-color 200ms ease',
});
