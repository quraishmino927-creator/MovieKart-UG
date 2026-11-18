import { LiveTVChannel } from '../types';

function createChannelLogoSvg(
  bgStart: string,
  bgEnd: string,
  accent: string,
  shortTitle: string,
  subtitle: string
): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${bgStart}" />
        <stop offset="100%" stop-color="${bgEnd}" />
      </linearGradient>
    </defs>
    <rect width="320" height="180" rx="18" fill="url(#bg)" />
    <circle cx="275" cy="36" r="52" fill="${accent}" opacity="0.16" />
    <circle cx="42" cy="150" r="44" fill="#ffffff" opacity="0.06" />
    <rect x="24" y="24" width="6" height="132" rx="3" fill="${accent}" />
    <text x="48" y="96" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="38" letter-spacing="-0.5">${shortTitle}</text>
    <text x="48" y="128" fill="#e5e7eb" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="14" letter-spacing="1.5">${subtitle}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Official Ugandan YouTube channel handles -> channel IDs
const KNOWN_UG_CHANNEL_IDS: Record<string, string> = {
  '@ntvuganda': 'UCwga1dPCqBddbtq5KYRii2g',
  '@nbsalways': 'UCzv3kGHEZ0fD404GVaW-GPg',
  '@bukeddetv': 'UCbL0amMi8Ggvtzrmq5W_xTQ',
  '@sparktv-uganda': 'UC6NjYHurvba2778xqDsd-5g',
  '@ubctvuganda': 'UCvTflPL_YBQdrHcKFI5xdYg',
  '@babatvuganda': 'UCilQ77_bUV7m9fFAmyfB9hQ',
};

export const DEFAULT_LIVE_CHANNELS: LiveTVChannel[] = [
  {
    id: 'ntv_uganda',
    name: 'NTV Uganda',
    logoUrl: createChannelLogoSvg('#061b3a', '#0c4a6e', '#38bdf8', 'NTV UG', 'TURNING ON YOUR WORLD'),
    youtubeLiveUrl: 'https://www.youtube.com/embed/live_stream?channel=UCwga1dPCqBddbtq5KYRii2g',
    description: 'Breaking Ugandan news, Akawungeezi, Mwasuze Mutya, and live current affairs.',
    watchingNow: 4280,
    isLive: true,
    order: 1,
  },
  {
    id: 'nbs_tv',
    name: 'NBS TV',
    logoUrl: createChannelLogoSvg('#1a0b2e', '#0f172a', '#f59e0b', 'NBS TV', 'THE POLITICAL COMMAND CENTER'),
    youtubeLiveUrl: 'https://www.youtube.com/embed/live_stream?channel=UCzv3kGHEZ0fD404GVaW-GPg',
    description: 'Live news bulletins, Frontline, Morning Breeze, Barometer, and national debates.',
    watchingNow: 3910,
    isLive: true,
    order: 2,
  },
  {
    id: 'bukedde_tv',
    name: 'Bukedde TV',
    logoUrl: createChannelLogoSvg('#3f0d12', '#170709', '#ef4444', 'BUKEDDE', 'OMUKUTU GW’EMBOOZI'),
    youtubeLiveUrl: 'https://www.youtube.com/embed/live_stream?channel=UCbL0amMi8Ggvtzrmq5W_xTQ',
    description: 'Agataliiko Nfuufu, Luganda news, local drama, and community stories across Uganda.',
    watchingNow: 3140,
    isLive: true,
    order: 3,
  },
  {
    id: 'spark_tv',
    name: 'Spark TV',
    logoUrl: createChannelLogoSvg('#3b0764', '#180529', '#ec4899', 'SPARK TV', 'MORE TO LIFE'),
    youtubeLiveUrl: 'https://www.youtube.com/embed/live_stream?channel=UC6NjYHurvba2778xqDsd-5g',
    description: 'Live Scoop, entertainment shows, music countdowns, and Kampala lifestyle.',
    watchingNow: 2450,
    isLive: true,
    order: 4,
  },
  {
    id: 'ubc_tv',
    name: 'UBC TV',
    logoUrl: createChannelLogoSvg('#064e3b', '#022c22', '#22c55e', 'UBC TV', 'INSPIRING UGANDA'),
    youtubeLiveUrl: 'https://www.youtube.com/embed/live_stream?channel=UCvTflPL_YBQdrHcKFI5xdYg',
    description: 'Uganda National Broadcaster — Parliament sessions, national events, and sports.',
    watchingNow: 1860,
    isLive: true,
    order: 5,
  },
  {
    id: 'baba_tv',
    name: 'Baba TV',
    logoUrl: createChannelLogoSvg('#431407', '#1c0a04', '#fb923c', 'BABA TV', 'VOICE OF BUSOGA & UGANDA'),
    youtubeLiveUrl: 'https://www.youtube.com/embed/live_stream?channel=UCilQ77_bUV7m9fFAmyfB9hQ',
    description: 'Regional news, talk shows, music, and live Busoga & Eastern Uganda coverage.',
    watchingNow: 1520,
    isLive: true,
    order: 6,
  },
];

export function isYouTubeUrl(rawUrl: string): boolean {
  const lower = (rawUrl || '').toLowerCase();
  return lower.includes('youtube.com') || lower.includes('youtu.be') || lower.includes('youtube-nocookie.com');
}

/**
 * Normalizes any YouTube URL (watch?v=, youtu.be/, /live/, /embed/, /channel/UC...,
 * live_stream?channel=..., or known @handle) into an embeddable YouTube iframe URL.
 */
export function toYouTubeEmbedUrl(rawUrl: string): string {
  let trimmed = (rawUrl || '').trim();
  if (!trimmed) return '';
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }

  try {
    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase();

    // Handle youtu.be/VIDEO_ID
    if (host.includes('youtu.be')) {
      const vid = url.pathname.replace(/^\/+/, '').split('/')[0];
      if (vid) {
        return `https://www.youtube.com/embed/${vid}?autoplay=1&rel=0&playsinline=1`;
      }
    }

    if (host.includes('youtube.com') || host.includes('youtube-nocookie.com')) {
      const path = url.pathname;

      // Already an embed URL (including /embed/live_stream?channel=...)
      if (path.startsWith('/embed/')) {
        const embedUrl = new URL(`https://www.youtube.com${path}${url.search}`);
        if (!embedUrl.searchParams.has('autoplay')) embedUrl.searchParams.set('autoplay', '1');
        if (!embedUrl.searchParams.has('rel')) embedUrl.searchParams.set('rel', '0');
        if (!embedUrl.searchParams.has('playsinline')) embedUrl.searchParams.set('playsinline', '1');
        return embedUrl.toString();
      }

      // Standard watch?v=VIDEO_ID
      const vParam = url.searchParams.get('v');
      if (vParam) {
        return `https://www.youtube.com/embed/${vParam}?autoplay=1&rel=0&playsinline=1`;
      }

      // /live/VIDEO_ID
      const liveMatch = path.match(/^\/live\/([^/?#]+)/i);
      if (liveMatch && liveMatch[1]) {
        return `https://www.youtube.com/embed/${liveMatch[1]}?autoplay=1&rel=0&playsinline=1`;
      }

      // /shorts/VIDEO_ID
      const shortsMatch = path.match(/^\/shorts\/([^/?#]+)/i);
      if (shortsMatch && shortsMatch[1]) {
        return `https://www.youtube.com/embed/${shortsMatch[1]}?autoplay=1&rel=0&playsinline=1`;
      }

      // /channel/UCxxxx or /channel/UCxxxx/live
      const channelMatch = path.match(/^\/channel\/(UC[^/?#]+)/i);
      if (channelMatch && channelMatch[1]) {
        return `https://www.youtube.com/embed/live_stream?channel=${channelMatch[1]}&autoplay=1&rel=0&playsinline=1`;
      }

      // Known @handle URLs -> live_stream?channel=UC...
      const handleMatch = path.match(/^\/(@[^/?#]+)/i);
      if (handleMatch && handleMatch[1]) {
        const knownId = KNOWN_UG_CHANNEL_IDS[handleMatch[1].toLowerCase()];
        if (knownId) {
          return `https://www.youtube.com/embed/live_stream?channel=${knownId}&autoplay=1&rel=0&playsinline=1`;
        }
      }
    }
  } catch {
    // Fallback below if invalid URL format
  }

  return trimmed;
}

/**
 * Returns a clean direct YouTube watch/channel URL for external fallback link.
 */
export function toYouTubeWatchLink(rawUrl: string): string {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) return 'https://www.youtube.com';
  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const ch = url.searchParams.get('channel');
    if (url.pathname.includes('live_stream') && ch) {
      return `https://www.youtube.com/channel/${ch}/live`;
    }
    if (url.pathname.startsWith('/embed/')) {
      const id = url.pathname.replace('/embed/', '').split('/')[0];
      if (id && id !== 'live_stream') {
        return `https://www.youtube.com/watch?v=${id}`;
      }
    }
    return url.toString();
  } catch {
    return trimmed;
  }
}
