import { useState } from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { formatDate, parseDate } from '../../utils/format';
import { focusRingSx, handleRadioKeys, reducedMotionSx } from './radioKeys';

const WEEK = 7;

function weekLabel(page, week) {
  if (page === 0) return 'This week';
  if (page === 1) return 'Next week';
  const first = formatDate(week[0], { month: 'short', day: 'numeric' });
  const last = formatDate(week[week.length - 1], { month: 'short', day: 'numeric' });
  return `${first} – ${last}`;
}

// 44px touch targets below desktop; desktop keeps the default IconButton size.
const pagerSx = { border: 1, borderColor: 'divider', bgcolor: 'field.main', width: { xs: 44, md: 'auto' }, height: { xs: 44, md: 'auto' } };

// One week of days at a time (starting today), with previous/next week buttons.
// Days the specialist doesn't work are faded and disabled. Pages to the selected day by itself.
export default function WeekDatePicker({ dates, value, onChange, isDisabled }) {
  const weeks = [];
  for (let i = 0; i < dates.length; i += WEEK) weeks.push(dates.slice(i, i + WEEK));
  const weekOf = (d) => Math.max(0, weeks.findIndex((w) => w.includes(d)));

  const [page, setPage] = useState(() => weekOf(value));
  // Jump to the selected day's week when it changes (e.g. picked automatically).
  const [shownValue, setShownValue] = useState(value);
  if (value !== shownValue) {
    setShownValue(value);
    if (value && dates.includes(value)) setPage(weekOf(value));
  }

  const week = weeks[page] ?? [];
  const month = week[0] ? parseDate(week[0]).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '';

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ minWidth: 0 }} aria-live="polite">
          <Typography component="h2" sx={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.01em' }}>
            {month}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {weekLabel(page, week)}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <IconButton onClick={() => setPage(page - 1)} disabled={page === 0} aria-label="Previous week" sx={pagerSx}>
            <ChevronLeftRoundedIcon />
          </IconButton>
          <IconButton onClick={() => setPage(page + 1)} disabled={page >= weeks.length - 1} aria-label="Next week" sx={pagerSx}>
            <ChevronRightRoundedIcon />
          </IconButton>
        </Stack>
      </Stack>

      <Box
        role="radiogroup"
        aria-label="Choose a date"
        onKeyDown={handleRadioKeys}
        sx={{ display: 'grid', gridTemplateColumns: `repeat(${WEEK}, minmax(0, 1fr))`, gap: { xs: 0.5, sm: 1 } }}
      >
        {week.map((dateStr) => {
          const date = parseDate(dateStr);
          const disabled = isDisabled(dateStr);
          const selected = value === dateStr;
          const label = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
          return (
            <ButtonBase
              key={dateStr}
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              aria-label={disabled ? `${label}, unavailable` : label}
              onClick={() => onChange(dateStr)}
              sx={[
                (theme) => ({
                  flexDirection: 'column',
                  gap: 0.25,
                  minWidth: 0,
                  py: { xs: 1, sm: 1.5 },
                  borderRadius: { xs: 2.5, sm: 3.5 },
                  border: '1.5px solid',
                  borderColor: selected ? 'primary.main' : 'divider',
                  bgcolor: selected ? 'primary.main' : 'field.main',
                  color: selected ? 'primary.contrastText' : 'text.primary',
                  boxShadow: selected ? `0 10px 22px -12px rgba(${theme.vars.palette.primary.mainChannel} / 0.75)` : 'none',
                  transition: 'background-color 150ms, border-color 150ms',
                  '&:hover': selected ? undefined : { borderColor: 'primary.main' },
                  '&.Mui-disabled': { opacity: 0.4 },
                }),
                focusRingSx,
                reducedMotionSx,
              ]}
            >
              <Typography
                component="span"
                sx={{ fontSize: { xs: 11, sm: 12 }, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', opacity: selected ? 0.9 : 0.7 }}
              >
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </Typography>
              <Typography component="span" sx={{ fontSize: { xs: 17, sm: 20 }, fontWeight: 800, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>
                {date.getDate()}
              </Typography>
            </ButtonBase>
          );
        })}
      </Box>
    </Box>
  );
}
