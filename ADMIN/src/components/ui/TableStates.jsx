import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';

// Placeholder rows while a table loads.
export function SkeletonRows({ rows = 5, columns }) {
  return Array.from({ length: rows }, (_, r) => (
    <TableRow key={r}>
      {Array.from({ length: columns }, (_, c) => (
        <TableCell key={c}>
          <Skeleton width={c === 0 ? '70%' : '55%'} />
        </TableCell>
      ))}
    </TableRow>
  ));
}

// Inline error with a retry button (pass `onRetry`, usually the list's reload()).
export function ErrorState({ message, onRetry, sx }) {
  return (
    <Alert
      severity="error"
      sx={[{ m: 2 }, ...(Array.isArray(sx) ? sx : [sx])]}
      action={
        onRetry && (
          <Button color="inherit" size="small" onClick={onRetry}>
            Retry
          </Button>
        )
      }
    >
      {message}
    </Alert>
  );
}
