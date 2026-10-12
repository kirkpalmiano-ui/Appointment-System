import { createTheme } from '@mui/material/styles';

// App-wide MUI theme, matching the client site: Plus Jakarta Sans, frosted cards, pill buttons.
// CSS variables + two colour schemes give us a light/dark toggle for free.
//
// Extra palette entries (read with theme.vars.palette.<name>):
//   accent        soft chip / active nav (bg = main, text = contrastText)
//   field         input and ghost-button background
//   hover         row hover / neutral chip background
//   card          frosted card surface (translucent)
//   pendingChip / successChip / infoChip / dangerChip   soft status chips (bg = light, text = main)
//
// Dashboard chart colours (same in both themes).
export const CHART_COLORS = { confirmed: '#22a55a', pending: '#f59e0b' };
export const CARD_SHADOW = '0 24px 50px -30px rgba(60, 50, 160, 0.28), 0 1px 2px rgba(15, 23, 42, 0.04)';
export const CARD_SHADOW_DARK = '0 24px 50px -28px rgba(0, 0, 0, 0.65)';

// Breakpoints follow the redesign: phones < 768 (tables become cards), < 1024 the sidebar
// becomes a drawer, < 1280 KPI grids go 2×2 and two-column dashboard rows stack.
const theme = createTheme({
  breakpoints: { values: { xs: 0, sm: 768, md: 1024, lg: 1280, xl: 1440 } },
  cssVariables: { colorSchemeSelector: 'class' },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#4f46e5', dark: '#4338ca', light: '#818cf8', contrastText: '#fff' },
        secondary: { main: '#0ea5e9' },
        error: { main: '#dc2626' },
        warning: { main: '#c2410c' },
        success: { main: '#15803d' },
        info: { main: '#0369a1' },
        accent: { main: '#eef0ff', contrastText: '#4338ca' },
        field: { main: '#ffffff' },
        hover: { main: '#f4f3fb' },
        card: { main: 'rgba(255, 255, 255, 0.86)' },
        pendingChip: { main: '#c2410c', light: '#fff1e6' },
        successChip: { main: '#15803d', light: '#e7f7ee' },
        infoChip: { main: '#0369a1', light: '#e3f3fc' },
        dangerChip: { main: '#dc2626', light: '#fdecec' },
        background: { default: '#f8f7fd', paper: '#ffffff' },
        text: { primary: '#0f1222', secondary: '#5b6078' },
        divider: '#e6e6f2',
      },
    },
    dark: {
      palette: {
        primary: { main: '#818cf8', dark: '#6366f1', light: '#a5b4fc', contrastText: '#0b1024' },
        secondary: { main: '#38bdf8' },
        error: { main: '#f87171' },
        warning: { main: '#fdba74' },
        success: { main: '#86efac' },
        info: { main: '#7dd3fc' },
        accent: { main: '#1a2147', contrastText: '#c7ccff' },
        field: { main: '#0f1530' },
        hover: { main: '#151c3d' },
        card: { main: 'rgba(20, 26, 54, 0.78)' },
        pendingChip: { main: '#fdba74', light: '#3a2412' },
        successChip: { main: '#86efac', light: '#12321f' },
        infoChip: { main: '#7dd3fc', light: '#0e2a3d' },
        dangerChip: { main: '#f87171', light: '#3a1518' },
        background: { default: '#0b1024', paper: '#141a36' },
        text: { primary: '#f3f4ff', secondary: '#a3a8c7' },
        divider: '#252c4d',
      },
    },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.05em' },
    h2: { fontWeight: 800, letterSpacing: '-0.04em' },
    h3: { fontWeight: 800, letterSpacing: '-0.03em' },
    h4: { fontWeight: 800, letterSpacing: '-0.02em' },
    h5: { fontWeight: 700, letterSpacing: '-0.01em' },
    h6: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 700 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '@media (prefers-reduced-motion: reduce)': {
          '*, *::before, *::after': { animationDuration: '0.01ms !important', transitionDuration: '0.01ms !important' },
        },
      },
    },
    // Pill buttons. Primary gets a soft coloured shadow; outlined = quiet "ghost" on the field colour.
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 999, paddingInline: 18, minHeight: 40, whiteSpace: 'nowrap' },
        sizeSmall: { minHeight: 34, paddingInline: 14, fontSize: 13 },
        sizeLarge: { minHeight: 48, paddingInline: 24 },
        containedPrimary: ({ theme }) => ({
          boxShadow: `0 10px 22px -12px rgba(${theme.vars.palette.primary.mainChannel} / 0.75)`,
          '&:hover': { boxShadow: `0 12px 26px -12px rgba(${theme.vars.palette.primary.mainChannel} / 0.85)` },
        }),
        outlined: ({ theme, ownerState }) =>
          ownerState.color === 'primary' || ownerState.color === 'inherit'
            ? {
                color: theme.vars.palette.text.primary,
                borderColor: theme.vars.palette.divider,
                backgroundColor: theme.vars.palette.field.main,
                '&:hover': { borderColor: theme.vars.palette.text.secondary, backgroundColor: theme.vars.palette.hover.main },
              }
            : { backgroundColor: theme.vars.palette.field.main },
      },
    },
    MuiIconButton: {
      styleOverrides: { root: { '&.Mui-focusVisible': { outline: '2px solid', outlineOffset: 2 } } },
    },
    // Frosted cards: translucent surface, blur, 1px border, 22px radius, soft tinted shadow.
    MuiCard: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 22,
          borderColor: theme.vars.palette.divider,
          backgroundColor: theme.vars.palette.card.main,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: CARD_SHADOW,
          ...theme.applyStyles('dark', { boxShadow: CARD_SHADOW_DARK }),
        }),
      },
    },
    MuiPaper: { styleOverrides: { rounded: { borderRadius: 16 } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 22, backgroundImage: 'none' } } },
    MuiMenu: { styleOverrides: { paper: ({ theme }) => ({ borderRadius: 14, border: `1px solid ${theme.vars.palette.divider}`, backgroundImage: 'none' }) } },
    MuiMenuItem: { styleOverrides: { root: { fontSize: 14, minHeight: 38, borderRadius: 8, marginInline: 6 } } },
    MuiPopover: { styleOverrides: { paper: { backgroundImage: 'none' } } },
    MuiTextField: { defaultProps: { fullWidth: true } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 12,
          backgroundColor: theme.vars.palette.field.main,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.vars.palette.divider },
          '&:hover:not(.Mui-focused):not(.Mui-error) .MuiOutlinedInput-notchedOutline': { borderColor: theme.vars.palette.text.secondary },
        }),
      },
    },
    MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
    // Tables: small uppercase muted headers, 14px row padding, subtle borders, hover bg.
    MuiTableCell: {
      styleOverrides: {
        root: ({ theme }) => ({ borderColor: theme.vars.palette.divider, paddingBlock: 14 }),
        head: ({ theme }) => ({
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          color: theme.vars.palette.text.secondary,
          paddingBlock: 12,
          whiteSpace: 'nowrap',
        }),
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: ({ theme }) => ({ '&.MuiTableRow-hover:hover': { backgroundColor: theme.vars.palette.hover.main } }),
      },
    },
    MuiAlert: { styleOverrides: { root: { borderRadius: 14 } } },
    MuiSnackbarContent: { styleOverrides: { root: { borderRadius: 14 } } },
    MuiAppBar: { defaultProps: { elevation: 0, color: 'inherit' } },
    MuiTooltip: { defaultProps: { arrow: true } },
    MuiTab: { styleOverrides: { root: { textTransform: 'none', fontWeight: 700, minHeight: 44 } } },
  },
});

export default theme;
