import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import { addDays, todayString } from '../../utils/format';
import { bookingLink } from './bookingLink';

const DAYS_AHEAD = 60; // matches the server's booking limit

const fieldSx = {
  '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'background.paper' },
};

// Leading icon; the label stays raised so "Any …" shows for an empty choice.
const adornment = (Icon) => ({
  input: {
    startAdornment: (
      <InputAdornment position="start" sx={{ color: 'text.secondary' }}>
        <Icon sx={{ fontSize: 18 }} />
      </InputAdornment>
    ),
  },
  inputLabel: { shrink: true },
  select: { displayEmpty: true },
});

// Compact service / specialist / date search that opens the booking wizard pre-filled.
export default function QuickBookingBar({ services, staff }) {
  const navigate = useNavigate();
  const [serviceId, setServiceId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [date, setDate] = useState('');

  const today = todayString();
  // Each list narrows to what fits the other choice.
  const staffOptions = (staff ?? []).filter((s) => !serviceId || s.services.some((sv) => sv._id === serviceId));
  const chosenStaff = staff?.find((s) => s._id === staffId);
  const serviceOptions = (services ?? []).filter((sv) => !chosenStaff || chosenStaff.services.some((x) => x._id === sv._id));

  const changeService = (id) => {
    setServiceId(id);
    if (staffId && !staff.find((s) => s._id === staffId)?.services.some((sv) => sv._id === id)) setStaffId('');
  };

  const submit = (e) => {
    e.preventDefault();
    navigate(bookingLink({ service: serviceId, staff: staffId, date }));
  };

  return (
    <Box
      component="form"
      onSubmit={submit}
      aria-label="Quick booking"
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1.2fr 1.2fr 1fr auto' },
        gap: 1.5,
        p: 1.5,
        borderRadius: '20px',
        border: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04), 0 16px 32px -24px rgba(15, 23, 42, 0.2)',
      }}
    >
      <TextField
        select
        label="Service"
        value={serviceId}
        onChange={(e) => changeService(e.target.value)}
        disabled={!services}
        slotProps={adornment(MedicalServicesOutlinedIcon)}
        sx={fieldSx}
      >
        <MenuItem value="">Any service</MenuItem>
        {serviceOptions.map((s) => (
          <MenuItem key={s._id} value={s._id}>
            {s.name}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        label="Doctor"
        value={staffId}
        onChange={(e) => setStaffId(e.target.value)}
        disabled={!staff}
        slotProps={adornment(PersonOutlineRoundedIcon)}
        sx={fieldSx}
      >
        <MenuItem value="">Any specialist</MenuItem>
        {staffOptions.map((s) => (
          <MenuItem key={s._id} value={s._id}>
            {s.name}
            {s.specialization ? ` · ${s.specialization}` : ''}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        type="date"
        label="Date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        slotProps={{
          input: adornment(CalendarMonthOutlinedIcon).input,
          inputLabel: { shrink: true },
          htmlInput: { min: today, max: addDays(today, DAYS_AHEAD) },
        }}
        sx={fieldSx}
      />

      <Button
        type="submit"
        variant="contained"
        size="large"
        startIcon={<SearchRoundedIcon sx={{ fontSize: 18 }} />}
        // Phones/tablets: full-width 52px button under the stacked fields.
        sx={[{ borderRadius: '12px', px: 3, whiteSpace: 'nowrap' }, (theme) => ({ [theme.breakpoints.down('md')]: { minHeight: 52 } })]}
      >
        Search Availability
      </Button>
    </Box>
  );
}
