import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { SECTION_SCROLL_MARGIN } from './profileUtils';

// Frosted profile card with a title, muted subtitle and an optional header action.
// `id` makes it a side-nav anchor; `component="form"` turns the whole card into a form.
export default function ProfileSection({ id, title, subtitle, action, children, component, onSubmit, sx }) {
  const titleId = id ? `${id}-title` : undefined;
  return (
    <Card
      id={id}
      tabIndex={id ? -1 : undefined}
      aria-labelledby={titleId}
      component={component ?? 'section'}
      noValidate={component === 'form' ? true : undefined}
      onSubmit={onSubmit}
      sx={[{ scrollMarginTop: SECTION_SCROLL_MARGIN, '&:focus': { outline: 'none' } }, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      <Box sx={{ p: { xs: 2.5, sm: 3.5 } }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-start' }, mb: children ? 3 : 0 }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography id={titleId} variant="h6" component="h2" sx={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.01em' }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          {action && <Box sx={{ flex: 'none' }}>{action}</Box>}
        </Stack>
        {children}
      </Box>
    </Card>
  );
}
