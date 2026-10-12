import Typography from '@mui/material/Typography';

// Small uppercase muted label ("YOUR NEXT VISIT", "TIME", "MORNING").
export default function Eyebrow({ children, sx, component = 'p' }) {
  return (
    <Typography
      component={component}
      sx={[
        { fontSize: 12, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'text.secondary', lineHeight: 1.4 },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Typography>
  );
}
