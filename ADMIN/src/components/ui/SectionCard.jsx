import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';

/**
 * Card with a header row: title, optional chip (e.g. a count), and a "View all →" link
 * (`linkTo` + `linkLabel`) or any custom `action`. Children render below; pass `flush`
 * for edge-to-edge content like tables.
 */
export default function SectionCard({ title, chip, linkTo, linkLabel = 'View all', action, flush = false, children, sx, headerSx }) {
  return (
    <Card sx={[{ display: 'flex', flexDirection: 'column', minWidth: 0 }, ...(Array.isArray(sx) ? sx : [sx])]}>
      {(title || action || linkTo) && (
        <Stack direction="row" spacing={1.25} sx={[{ alignItems: 'center', px: 2.5, pt: 2.25, pb: flush ? 1.75 : 0 }, headerSx]}>
          {title && (
            <Typography component="h2" sx={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.02em' }}>
              {title}
            </Typography>
          )}
          {chip}
          <Box sx={{ flexGrow: 1 }} />
          {action}
          {linkTo && (
            <Button component={RouterLink} to={linkTo} size="small" endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />} sx={{ minHeight: 30, px: 1 }}>
              {linkLabel}
            </Button>
          )}
        </Stack>
      )}
      <Box sx={{ flexGrow: 1, minWidth: 0, ...(flush ? {} : { p: 2.5 }) }}>{children}</Box>
    </Card>
  );
}
