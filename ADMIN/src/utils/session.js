// Session rules shared by the layout's session card and the My account page.
// Sign out after this many minutes without activity.
export const IDLE_MINUTES = Number(import.meta.env.VITE_IDLE_TIMEOUT_MINUTES) || 15;
// Admin sessions last 2 hours (server-issued token); used to draw remaining-time bars and rings.
export const SESSION_SECONDS = 2 * 60 * 60;
