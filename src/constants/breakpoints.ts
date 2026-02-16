/**
 * Canonical breakpoint for "desktop" layout.
 * Below this width: mobile (bottom nav).
 * At or above: desktop (hamburger + drawer).
 */
export const DESKTOP_MIN_WIDTH_PX = 768

/** Media query string for desktop layout. */
export const DESKTOP_MEDIA_QUERY = `(min-width: ${DESKTOP_MIN_WIDTH_PX}px)`
