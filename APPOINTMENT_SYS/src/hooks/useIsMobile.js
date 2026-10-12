import useMediaQuery from '@mui/material/useMediaQuery';

// True below the desktop breakpoint (1024px): phones and tablets use the mobile layout
// (bottom tab bar, bottom sheets, mobile page headers). Use for structural switches only;
// plain sizing should stay in responsive `sx` values.
export default function useIsMobile() {
  return useMediaQuery((theme) => theme.breakpoints.down('md'), { noSsr: true });
}
