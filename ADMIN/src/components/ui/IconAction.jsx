import { forwardRef } from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

/**
 * 34px rounded-square icon button (border + field bg, muted icon). `label` is required:
 * it is the tooltip and the aria-label. tone="danger" makes the icon red.
 */
const IconAction = forwardRef(function IconAction({ label, tone, size = 34, children, sx, tooltip = true, ...rest }, ref) {
  const button = (
    <IconButton
      ref={ref}
      aria-label={label}
      {...rest}
      sx={[
        {
          width: size,
          height: size,
          borderRadius: '10px',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'field.main',
          color: tone === 'danger' ? 'error.main' : 'text.secondary',
          '& .MuiSvgIcon-root': { fontSize: 18 },
          '&:hover': { bgcolor: tone === 'danger' ? 'dangerChip.light' : 'hover.main', color: tone === 'danger' ? 'error.main' : 'text.primary' },
          '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </IconButton>
  );
  if (!tooltip || rest.disabled) return button;
  return <Tooltip title={label}>{button}</Tooltip>;
});

export default IconAction;
