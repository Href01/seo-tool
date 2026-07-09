// Mega-platforms excluded when judging "real" competitors — they dominate SERPs
// regardless of SEO effort. Shared by the difficulty calc (server) and the SERP
// page (client). Client-safe: no server-only imports here.
export const MEGA_PLATFORMS = new Set([
  'instagram.com',
  'facebook.com',
  'youtube.com',
  'pinterest.com',
  'pinterest.fr',
  'tiktok.com',
  'twitter.com',
  'x.com',
  'linkedin.com',
  'wikipedia.org',
  'reddit.com',
])
