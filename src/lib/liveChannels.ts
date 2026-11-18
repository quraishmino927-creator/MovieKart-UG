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
    youtubeLiveUrl: 'https://www.youtube.com/@ntvuganda/live',
    description: 'Breaking Ugandan news, Akawungeezi, Mwasuze Mutya, and live current affairs.',
    watchingNow: 4280,
    isLive: true,
    order: 1,
  },
  {
    id: 'nbs_tv',
    name: 'NBS TV',
    logoUrl: createChannelLogoSvg('#1a0b2e', '#0f172a', '#f59e0b', 'NBS TV', 'THE POLITICAL COMMAND CENTER'),
    youtubeLiveUrl: 'https://www.youtube.com/@NBSalways/live',
    description: 'Live news bulletins, Frontline, Morning Breeze, Barometer, and national debates.',
    watchingNow: 3910,
    isLive: true,
    order: 2,
  },
  {
    id: 'bukedde_tv',
    name: 'Bukedde TV',
    logoUrl: createChannelLogoSvg('#3f0d12', '#170709', '#ef4444', 'BUKEDDE', 'OMUKUTU GW’EMBOOZI'),
    youtubeLiveUrl: 'https://www.youtube.com/@bukeddetv/live',
    description: 'Agataliiko Nfuufu, Luganda news, local drama, and community stories across Uganda.',
    watchingNow: 3140,
    isLive: true,
    order: 3,
  },
  {
    id: 'spark_tv',
    name: 'Spark TV',
    logoUrl: createChannelLogoSvg('#3b0764', '#180529', '#ec4899', 'SPARK TV', 'MORE TO LIFE'),
    youtubeLiveUrl: 'https://www.youtube.com/@sparktv-uganda/live',
    description: 'Live Scoop, entertainment shows, music countdowns, and Kampala lifestyle.',
    watchingNow: 2450,
    isLive: true,
    order: 4,
  },
  {
    id: 'ubc_tv',
    name: 'UBC TV',
    logoUrl: createChannelLogoSvg('#064e3b', '#022c22', '#22c55e', 'UBC TV', 'INSPIRING UGANDA'),
    youtubeLiveUrl: 'https://www.youtube.com/@ubctvuganda/live',
    description: 'Uganda National Broadcaster — Parliament sessions, national events, and sports.',
    watchingNow: 1860,
    isLive: true,
    order: 5,
  },
  {
    id: 'baba_tv',
    name: 'Baba TV',
    logoUrl: createChannelLogoSvg('#431407', '#1c0a04', '#fb923c', 'BABA TV', 'VOICE OF BUSOGA & UGANDA'),
    youtubeLiveUrl: 'https://www.youtube.com/@babatvuganda/live',
    description: 'Regional news, talk shows, music, and live Busoga & Eastern Uganda coverage.',
    watchingNow: 1520,
    isLive: true,
    order: 6,
  },
];

export interface ResolvedYouTubeStream {
  ok: boolean;
  mode: 'live' | 'latest_video' | 'video' | 'playlist_fallback';
  isLive: boolean;
  videoId?: string;
  channelId?: string;
  title?: string;
  embedUrl: string;
  watchUrl: string;
  error?: string;
}

const clientStreamCache = new Map<string, { data: ResolvedYouTubeStream; expiresAt: number }>();
const inflightRequests = new Map<string, Promise<ResolvedYouTubeStream>>();
const CLIENT_CACHE_TTL_MS = 45 * 1000;

export function isYouTubeUrl(rawUrl: string): boolean {
  const lower = (rawUrl || '').toLowerCase();
  return lower.includes('youtube.com') || lower.includes('youtu.be') || lower.includes('youtube-nocookie.com');
}

function extractDirectVideoId(url: URL): string | null {
  const host = url.hostname.toLowerCase();
  const path = url.pathname.replace(/\/+$/, '') || '/';

  if (host.includes('youtu.be')) {
    const vid = path.replace(/^\/+/, '').split('/')[0];
    return vid || null;
  }

  if (host.includes('youtube.com') || host.includes('youtube-nocookie.com')) {
    const vParam = url.searchParams.get('v');
    if (vParam) return vParam;

    if (path.startsWith('/embed/') && !path.startsWith('/embed/live_stream')) {
      const id = path.replace('/embed/', '').split('/')[0];
      return id || null;
    }

    const liveOrShorts = path.match(/^\/(?:live|shorts)\/([^/?#]+)/i);
    if (liveOrShorts?.[1]) return liveOrShorts[1];
  }

  return null;
}

function extractChannelIdFromUrl(url: URL): string | null {
  const chParam = url.searchParams.get('channel');
  if (chParam && chParam.startsWith('UC')) return chParam;

  const ucMatch = url.pathname.match(/^\/channel\/(UC[^/?#]+)/i);
  if (ucMatch?.[1]) return ucMatch[1];

  const handleMatch = url.pathname.match(/^\/(@[^/?#]+)/i);
  if (handleMatch?.[1]) {
    return KNOWN_UG_CHANNEL_IDS[handleMatch[1].toLowerCase()] || null;
  }

  return null;
}

/**
 * Synchronous best-effort embed URL conversion (never passes raw @handle/live directly into iframe).
 */
export function toYouTubeEmbedUrl(rawUrl: string): string {
  let trimmed = (rawUrl || '').trim();
  if (!trimmed) return '';
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }

  try {
    const url = new URL(trimmed);
    const directVid = extractDirectVideoId(url);
    if (directVid) {
      return `https://www.youtube.com/embed/${directVid}?autoplay=1&rel=0&playsinline=1`;
    }

    if (url.pathname.startsWith('/embed/')) {
      const embedUrl = new URL(`https://www.youtube.com${url.pathname}${url.search}`);
      if (!embedUrl.searchParams.has('autoplay')) embedUrl.searchParams.set('autoplay', '1');
      if (!embedUrl.searchParams.has('rel')) embedUrl.searchParams.set('rel', '0');
      if (!embedUrl.searchParams.has('playsinline')) embedUrl.searchParams.set('playsinline', '1');
      return embedUrl.toString();
    }

    const channelId = extractChannelIdFromUrl(url);
    if (channelId) {
      const uploadsList = channelId.startsWith('UC') ? `UU${channelId.slice(2)}` : channelId;
      return `https://www.youtube.com/embed?listType=playlist&list=${uploadsList}&autoplay=1&rel=0&playsinline=1`;
    }
  } catch {
    // Fallback below
  }

  return trimmed;
}

/**
 * Returns a clean direct YouTube watch or channel /live URL for external links.
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

export function getCachedResolvedYouTubeStream(rawUrl: string): ResolvedYouTubeStream | null {
  const key = (rawUrl || '').trim();
  if (!key) return null;
  const cached = clientStreamCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }
  return null;
}

/**
 * Resolves any YouTube URL (including channel live URLs like https://www.youtube.com/@ntvuganda/live)
 * to the channel's active live stream OR its latest embeddable video when the channel is offline.
 */
export async function resolveYouTubeStream(rawUrl: string): Promise<ResolvedYouTubeStream> {
  let trimmed = (rawUrl || '').trim();
  if (!trimmed) {
    return {
      ok: false,
      mode: 'video',
      isLive: false,
      embedUrl: '',
      watchUrl: '',
      error: 'Missing URL',
    };
  }
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }

  // Fast synchronous path if direct video ID is already in the URL
  try {
    const parsed = new URL(trimmed);
    const directVid = extractDirectVideoId(parsed);
    if (directVid) {
      return {
        ok: true,
        mode: 'video',
        isLive: parsed.pathname.startsWith('/live/'),
        videoId: directVid,
        embedUrl: `https://www.youtube.com/embed/${directVid}?autoplay=1&rel=0&playsinline=1`,
        watchUrl: `https://www.youtube.com/watch?v=${directVid}`,
      };
    }
  } catch {
    // Continue to server resolution
  }

  const cached = clientStreamCache.get(trimmed);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const inflight = inflightRequests.get(trimmed);
  if (inflight) return inflight;

  const task = (async (): Promise<ResolvedYouTubeStream> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(`/api/youtube/resolve?url=${encodeURIComponent(trimmed)}`, {
        signal: controller.signal,
      });
      if (res.ok) {
        const json = (await res.json()) as ResolvedYouTubeStream;
        if (json && json.embedUrl) {
          clientStreamCache.set(trimmed, {
            data: json,
            expiresAt: Date.now() + CLIENT_CACHE_TTL_MS,
          });
          return json;
        }
      }
    } catch {
      // Fallback below if network or API unavailable
    } finally {
      clearTimeout(timer);
      inflightRequests.delete(trimmed);
    }

    // Fallback: use uploads playlist embed if we know the channel ID (avoids dead black screen)
    const fallbackEmbed = toYouTubeEmbedUrl(trimmed);
    let channelId: string | undefined;
    try {
      channelId = extractChannelIdFromUrl(new URL(trimmed)) || undefined;
    } catch {}

    const fallbackResult: ResolvedYouTubeStream = {
      ok: Boolean(fallbackEmbed && fallbackEmbed !== trimmed),
      mode: 'playlist_fallback',
      isLive: false,
      channelId,
      embedUrl: fallbackEmbed,
      watchUrl: toYouTubeWatchLink(trimmed),
    };
    return fallbackResult;
  })();

  inflightRequests.set(trimmed, task);
  return task;
}
