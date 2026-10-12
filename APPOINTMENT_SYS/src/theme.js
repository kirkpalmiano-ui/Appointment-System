import { createTheme } from '@mui/material/styles';

// Soft, low shadow for plain containers on the landing page.
export const CARD_SHADOW = '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -12px rgba(15, 23, 42, 0.12)';
export const CARD_SHADOW_DARK = '0 1px 2px rgba(0, 0, 0, 0.3), 0 8px 24px -12px rgba(0, 0, 0, 0.5)';

// Frosted app cards (dashboard, booking, appointments, profile).
const APP_CARD_SHADOW = '0 24px 50px -28px rgba(60, 50, 160, 0.28)';
const APP_CARD_SHADOW_DARK = '0 24px 50px -28px rgba(0, 0, 0, 0.65)';

// App-wide MUI theme: brand colours, typography and component defaults.
// CSS variables + two colour schemes give us a light/dark toggle for free.
// Custom palette keys:
//   accent       soft chip (bg = main, text = contrastText)
//   field        input background
//   pendingChip / successChip / infoChip   soft status chips (bg = light, text = main)
const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'class' },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#4f46e5', dark: '#4338ca', light: '#818cf8', contrastText: '#fff' },
        secondary: { main: '#0ea5e9' },
        error: { main: '#dc2626' },
        accent: { main: '#eef0ff', contrastText: '#4338ca' },
        field: { main: '#ffffff' },
        pendingChip: { main: '#c2410c', light: '#fff1e6' },
        successChip: { main: '#15803d', light: '#e7f7ee' },
        infoChip: { main: '#0369a1', light: '#e3f3fc' },
        background: { default: '#fbfaff', paper: '#ffffff' },
        text: { primary: '#0f1222', secondary: '#5b6078' },
        divider: '#e6e6f2',
      },
    },
    dark: {
      palette: {
        primary: { main: '#818cf8', dark: '#6366f1', light: '#a5b4fc', contrastText: '#0b1024' },
        secondary: { main: '#38bdf8' },
        error: { main: '#f87171' },
        accent: { main: '#1a2147', contrastText: '#c7ccff' },
        field: { main: '#0f1530' },
        pendingChip: { main: '#fdba74', light: '#3a2412' },
        successChip: { main: '#86efac', light: '#12321f' },
        infoChip: { main: '#7dd3fc', light: '#0e2a3d' },
        background: { default: '#0b1024', paper: '#141a36' },
        text: { primary: '#f3f4ff', secondary: '#a3a8c7' },
        divider: '#252c4d',
      },
    },
  },
  // Mobile layout (bottom tab bar, sheets, stacked pages) is used below `md` (1024px);
  // desktop layouts start at 1024px. `sm` (600px+) keeps the mobile structure but wider.
  breakpoints: { values: { xs: 0, sm: 600, md: 1024, lg: 1200, xl: 1536 } },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontWeight: 700, letterSpacing: '-0.01em' },
    h4: { fontWeight: 700, letterSpacing: '-0.01em' },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 999 },
        // Pill heights: small 40px, regular 46px, large 50px (text buttons stay compact).
        contained: { paddingInline: 20 },
        outlined: { paddingInline: 20 },
        containedSizeSmall: { minHeight: 40, paddingInline: 16 },
        outlinedSizeSmall: { minHeight: 40, paddingInline: 16 },
        containedSizeMedium: { minHeight: 46 },
        outlinedSizeMedium: { minHeight: 46 },
        sizeLarge: { minHeight: 50, paddingBlock: 10 },
      },
      variants: [
        // Main actions: filled primary with a soft coloured shadow.
        {
          props: { variant: 'contained', color: 'primary' },
          style: ({ theme }) => ({
            boxShadow: `0 10px 22px -12px rgba(${theme.vars.palette.primary.mainChannel} / 0.75)`,
            '&:hover': { boxShadow: `0 12px 26px -12px rgba(${theme.vars.palette.primary.mainChannel} / 0.85)` },
          }),
        },
        // Secondary (outlined) buttons are quiet "ghost" buttons on the field colour.
        {
          props: { variant: 'outlined', color: 'primary' },
          style: ({ theme }) => ({
            color: theme.vars.palette.text.primary,
            borderColor: theme.vars.palette.divider,
            backgroundColor: theme.vars.palette.field.main,
            '&:hover': {
              borderColor: theme.vars.palette.primary.main,
              color: theme.vars.palette.primary.main,
              backgroundColor: theme.vars.palette.field.main,
            },
          }),
        },
        // Danger: outlined with red text.
        {
          props: { variant: 'outlined', color: 'error' },
          style: ({ theme }) => ({
            borderColor: theme.vars.palette.divider,
            backgroundColor: theme.vars.palette.field.main,
            '&:hover': { borderColor: theme.vars.palette.error.main, backgroundColor: theme.vars.palette.field.main },
          }),
        },
      ],
    },
    // Frosted cards: translucent surface, blur, 1px border, 24px radius, soft tinted shadow.
    MuiCard: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 24,
          borderColor: theme.vars.palette.divider,
          backgroundColor: 'rgba(255, 255, 255, 0.82)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: APP_CARD_SHADOW,
          ...theme.applyStyles('dark', { backgroundColor: 'rgba(20, 26, 54, 0.74)', boxShadow: APP_CARD_SHADOW_DARK }),
        }),
      },
    },
    // 18px side padding on phones.
    MuiContainer: {
      styleOverrides: { root: ({ theme }) => ({ [theme.breakpoints.down('sm')]: { paddingLeft: 18, paddingRight: 18 } }) },
    },
    MuiPaper: { styleOverrides: { rounded: { borderRadius: 14 } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 24 } } },
    MuiTextField: { defaultProps: { fullWidth: true } },
    // Inputs: 1.5px border, 14px radius, label notched into the top border, soft focus ring.
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 14,
          backgroundColor: theme.vars.palette.field.main,
          transition: 'box-shadow 150ms ease',
          '& .MuiOutlinedInput-notchedOutline': { borderWidth: 1.5, borderColor: theme.vars.palette.divider },
          '&:hover:not(.Mui-focused):not(.Mui-error):not(.Mui-disabled) .MuiOutlinedInput-notchedOutline': {
            borderColor: `rgba(${theme.vars.palette.primary.mainChannel} / 0.5)`,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderWidth: 1.5 },
          '&.Mui-focused:not(.Mui-error)': { boxShadow: `0 0 0 4px rgba(${theme.vars.palette.primary.mainChannel} / 0.15)` },
          '&.Mui-error .MuiOutlinedInput-notchedOutline': { borderColor: theme.vars.palette.error.main },
        }),
      },
    },
    MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
    MuiTableCell: {
      styleOverrides: {
        head: ({ theme }) => ({ fontWeight: 600, fontSize: '0.8rem', color: theme.vars.palette.text.secondary }),
      },
    },
    MuiTabs: { styleOverrides: { indicator: { height: 2 } } },
    MuiTab: { styleOverrides: { root: { minHeight: 52, fontWeight: 600, paddingInline: 4, marginRight: 20, minWidth: 0 } } },
    // Upcoming steps are pale outlined circles; only the current/completed ones use the brand colour.
    MuiStepIcon: {
      styleOverrides: {
        root: ({ theme }) => ({
          color: 'transparent',
          border: `1px solid ${theme.vars.palette.divider}`,
          borderRadius: '50%',
          '& .MuiStepIcon-text': { fill: theme.vars.palette.text.secondary, fontWeight: 600 },
          '&.Mui-active, &.Mui-completed': { color: theme.vars.palette.primary.main, borderColor: 'transparent' },
          '&.Mui-active .MuiStepIcon-text': { fill: theme.vars.palette.primary.contrastText },
        }),
      },
    },
    MuiAppBar: { defaultProps: { elevation: 0, color: 'inherit' } },
    MuiTooltip: { defaultProps: { arrow: true } },
  },
});

export default theme;
