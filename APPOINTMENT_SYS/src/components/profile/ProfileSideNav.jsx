import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import { scrollToSection } from './profileUtils';

// Sticky section nav (md+) / horizontally scrollable pill row (small screens).
// `items` is [{ id, label, danger? }]; the section in view is highlighted.
// TODO(backend): "Health info" and "Devices" items once that data/those endpoints exist.
export default function ProfileSideNav({ items }) {
  const [active, setActive] = useState(items[0]?.id);

  // Active = the last section whose top has scrolled under the navbar (plus a little slack);
  // at the very bottom of the page, the last section (short ones can't reach the top).
  useEffect(() => {
    const sections = items.map((item) => document.getElementById(item.id)).filter(Boolean);
    if (!sections.length) return undefined;
    let frame = 0;
    const update = () => {
      frame = 0;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      const passed = sections.filter((section) => section.getBoundingClientRect().top <= 140);
      const current = atBottom ? sections[sections.length - 1] : (passed[passed.length - 1] ?? sections[0]);
      setActive(current.id);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [items]);

  const go = (e, id) => {
    e.preventDefault();
    setActive(id);
    scrollToSection(id);
  };

  return (
    <Card
      component="nav"
      aria-label="Profile sections"
      sx={{ p: { xs: 0.75, md: 1.5 }, maxWidth: '100%' }}
    >
      <Box
        component="ul"
        sx={{
          listStyle: 'none',
          m: 0,
          p: 0,
          display: 'flex',
          flexDirection: { xs: 'row', md: 'column' },
          gap: 0.5,
          overflowX: { xs: 'auto', md: 'visible' },
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {items.map((item) => {
          const isActive = active === item.id;
          return (
            <Box
              component="li"
              key={item.id}
              sx={{ flex: 'none', ...(item.danger && { mt: { md: 1.5 }, pt: { md: 1.5 }, borderTop: { md: 1 }, borderColor: { md: 'divider' } }) }}
            >
              <Box
                component="a"
                href={`#${item.id}`}
                aria-current={isActive ? 'location' : undefined}
                onClick={(e) => go(e, item.id)}
                sx={(theme) => ({
                  display: 'block',
                  px: 2,
                  py: 1.1,
                  borderRadius: 999,
                  fontSize: 14.5,
                  fontWeight: isActive ? 700 : 600,
                  whiteSpace: 'nowrap',
                  textDecoration: 'none',
                  color: item.danger ? theme.vars.palette.error.main : isActive ? theme.vars.palette.accent.contrastText : theme.vars.palette.text.secondary,
                  bgcolor: isActive
                    ? item.danger
                      ? `rgba(${theme.vars.palette.error.mainChannel} / 0.12)`
                      : theme.vars.palette.accent.main
                    : 'transparent',
                  transition: 'background-color 150ms, color 150ms',
                  '&:hover': {
                    bgcolor: isActive ? undefined : theme.vars.palette.action.hover,
                    color: item.danger || isActive ? undefined : theme.vars.palette.text.primary,
                  },
                  '&:focus-visible': { outline: `2px solid ${theme.vars.palette.primary.main}`, outlineOffset: -2 },
                  '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
                })}
              >
                {item.label}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Card>
  );
}
