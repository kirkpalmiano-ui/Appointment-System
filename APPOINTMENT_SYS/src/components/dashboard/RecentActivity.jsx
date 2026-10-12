import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import { timeAgo } from './activity';
import IconTile from './IconTile';

// Timeline of the client's latest booking events. `items` null = loading.
export default function RecentActivity({ items }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: { xs: 2, md: 3 }, '&:last-child': { pb: { xs: 2, md: 3 } } }}>
        <Typography component="h2" sx={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.01em', mb: 2 }}>
          Recent activity
        </Typography>

        {items === null && (
          <Stack spacing={2}>
            {[1, 2, 3].map((n) => (
              <Stack key={n} direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <Skeleton variant="rounded" width={40} height={40} sx={{ borderRadius: '14px' }} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton width="50%" />
                  <Skeleton width="80%" />
                </Box>
              </Stack>
            ))}
          </Stack>
        )}

        {items?.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <HistoryRoundedIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
            <Typography sx={{ fontWeight: 600 }}>No activity yet</Typography>
            <Typography variant="body2" color="text.secondary">
              Bookings and updates will show up here.
            </Typography>
          </Box>
        )}

        {items?.length > 0 && (
          <Stack component="ul" spacing={0.5} sx={{ listStyle: 'none', m: 0, p: 0 }}>
            {items.map((item) => (
              <Stack component="li" key={`${item.id}-${item.title}`} direction="row" spacing={1.5} sx={{ alignItems: 'center', py: 1 }}>
                <IconTile icon={item.icon} tone={item.tone} size={40} />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 14.5 }}>{item.title}</Typography>
                  <Typography variant="body2" color="text.secondary" noWrap title={item.detail}>
                    {item.detail}
                  </Typography>
                </Box>
                <Typography
                  component="time"
                  dateTime={item.at}
                  variant="caption"
                  color="text.secondary"
                  sx={{ flex: 'none', fontWeight: 600, alignSelf: 'flex-start', mt: 0.25 }}
                >
                  {timeAgo(item.at)}
                </Typography>
              </Stack>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
