import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ListAltRoundedIcon from '@mui/icons-material/ListAltRounded';
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded';
import MedicalServicesRoundedIcon from '@mui/icons-material/MedicalServicesRounded';
import IconTile from './IconTile';

const ACTIONS = [
  { label: 'Book a consultation', to: '/book', icon: AddRoundedIcon, tone: 'accent' },
  { label: 'My appointments', to: '/appointments', icon: ListAltRoundedIcon, tone: 'info' },
  { label: 'Profile & settings', to: '/profile', icon: ManageAccountsRoundedIcon, tone: 'success' },
  { label: 'Our services', to: '/#services', icon: MedicalServicesRoundedIcon, tone: 'pending' },
];

// 2x2 grid of shortcut tiles to the main client pages.
export default function QuickActions() {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: { xs: 2, md: 3 }, '&:last-child': { pb: { xs: 2, md: 3 } } }}>
        <Typography component="h2" sx={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.01em', mb: 2 }}>
          Quick actions
        </Typography>
        <Box component="ul" sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.5, listStyle: 'none', m: 0, p: 0 }}>
          {ACTIONS.map(({ label, to, icon, tone }) => (
            <li key={to}>
              <ButtonBase
                component={RouterLink}
                to={to}
                sx={(theme) => ({
                  width: '100%',
                  height: '100%',
                  minHeight: { xs: 96, md: 112 },
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 1.5,
                  p: 2,
                  borderRadius: '18px',
                  border: 1,
                  borderColor: 'divider',
                  bgcolor: 'field.main',
                  textAlign: 'left',
                  transition: 'border-color 150ms, box-shadow 150ms, transform 150ms',
                  '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: `0 10px 24px -16px rgba(${theme.vars.palette.primary.mainChannel} / 0.6)`,
                    transform: 'translateY(-1px)',
                  },
                  '&.Mui-focusVisible': { outline: `2px solid ${theme.vars.palette.primary.main}`, outlineOffset: 2 },
                  '@media (prefers-reduced-motion: reduce)': { transition: 'none', '&:hover': { transform: 'none' } },
                })}
              >
                <IconTile icon={icon} tone={tone} size={40} />
                <Typography sx={{ fontWeight: 700, fontSize: 14.5, lineHeight: 1.3 }}>{label}</Typography>
              </ButtonBase>
            </li>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
