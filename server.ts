import dns from 'node:dns/promises';
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { Readable } from 'node:stream';
import type { ReadableStream as NodeWebReadableStream } from 'node:stream/web';
import express from 'express';
import type { Request, Response } from 'express';
import driveDownloadHandler from './netlify/functions/drive-download.mts';

type ResolvedMode = 'live' | 'latest_video' | 'video' | 'playlist_fallback';

interface ResolvedYouTubeResult {
  ok: boolean;
  mode: ResolvedMode;
  isLive: boolean;
  videoId?: string;
  channelId?: string;
  title?: string;
  embedUrl: string;
  watchUrl: string;
  error?: string;
}

const DESKTOP_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

// Short TTL cache so repeated channel clicks & switching feel instant while staying fresh
const resolveCache = new Map<string, { data: ResolvedYouTubeResult; expiresAt: number }>();
const CACHE_TTL_MS = 45 * 1000;

const KNOWN_HANDLE_TO_ID: Record<string, string> = {
  '@ntvuganda': 'UCwga1dPCqBddbtq5KYRii2g',
  '@nbsalways': 'UCzv3kGHEZ0fD404GVaW-GPg',
  '@bukeddetv': 'UCbL0amMi8Ggvtzrmq5W_xTQ',
  '@sparktv-uganda': 'UC6NjYHurvba2778xqDsd-5g',
  '@ubctvuganda': 'UCvTflPL_YBQdrHcKFI5xdYg',
  '@babatvuganda': 'UCilQ77_bUV7m9fFAmyfB9hQ',
};

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

function buildVideoEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1`;
}

function buildUploadsPlaylistEmbedUrl(channelId: string): string {
  const uploadsPlaylistId = channelId.startsWith('UC') ? `UU${channelId.slice(2)}` : channelId;
  return `https://www.youtube.com/embed?listType=playlist&list=${uploadsPlaylistId}&autoplay=1&rel=0&playsinline=1`;
}

async function fetchWithTimeout(url: string, timeoutMs = 6000): Promise<globalThis.Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': DESKTOP_UA,
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

async function isVideoEmbeddable(videoId: string): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}&format=json`,
      3000
    );
    return res.ok;
  } catch {
    return true; // Assume embeddable if oEmbed check times out
  }
}

async function fetchLatestChannelVideoFromRss(
  channelId: string
): Promise<{ videoId: string; title?: string } | null> {
  try {
    const rssRes = await fetchWithTimeout(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`,
      5000
    );
    if (!rssRes.ok) return null;
    const xml = await rssRes.text();

    const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((m) => m[1]);
    if (entries.length === 0) return null;

    // Prefer non-Shorts embeddable entries first, then any embeddable entry
    const candidates: Array<{ videoId: string; title?: string; isShort: boolean }> = [];
    for (const entryXml of entries.slice(0, 6)) {
      const vid = entryXml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1]?.trim();
      if (!vid) continue;
      const rawTitle = entryXml.match(/<title>([^<]*)<\/title>/)?.[1] || '';
      const title = decodeXmlEntities(rawTitle).trim();
      const linkHref = entryXml.match(/<link[^>]+href="([^"]+)"/)?.[1] || '';
      const isShort = linkHref.includes('/shorts/') || /#shorts\b/i.test(title);
      candidates.push({ videoId: vid, title, isShort });
    }

    const ordered = [
      ...candidates.filter((c) => !c.isShort),
      ...candidates.filter((c) => c.isShort),
    ];

    for (const candidate of ordered.slice(0, 3)) {
      const embeddable = await isVideoEmbeddable(candidate.videoId);
      if (embeddable) {
        return { videoId: candidate.videoId, title: candidate.title };
      }
    }

    if (ordered[0]) {
      return { videoId: ordered[0].videoId, title: ordered[0].title };
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchLatestVideoFromVideosPage(
  channelBaseUrl: string
): Promise<{ videoId: string; title?: string } | null> {
  try {
    const res = await fetchWithTimeout(`${channelBaseUrl.replace(/\/+$/, '')}/videos`, 5000);
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/"videoId":"([A-Za-z0-9_-]{11})"/);
    if (match && match[1]) {
      return { videoId: match[1] };
    }
    return null;
  } catch {
    return null;
  }
}

async function resolveYouTubeUrl(rawInput: string): Promise<ResolvedYouTubeResult> {
  let trimmed = (rawInput || '').trim();
  if (!trimmed) {
    return {
      ok: false,
      mode: 'video',
      isLive: false,
      embedUrl: '',
      watchUrl: '',
      error: 'Missing YouTube URL',
    };
  }
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }

  const cacheKey = trimmed;
  const cached = resolveCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      ok: false,
      mode: 'video',
      isLive: false,
      embedUrl: trimmed,
      watchUrl: trimmed,
      error: 'Invalid URL',
    };
  }

  const host = parsed.hostname.toLowerCase();
  const pathname = parsed.pathname.replace(/\/+$/, '') || '/';

  // 1. Direct video ID links (youtu.be/ID, watch?v=ID, /live/ID, /shorts/ID, /embed/ID)
  let directVideoId = '';
  if (host.includes('youtu.be')) {
    directVideoId = pathname.replace(/^\/+/, '').split('/')[0] || '';
  } else if (host.includes('youtube.com') || host.includes('youtube-nocookie.com')) {
    const vParam = parsed.searchParams.get('v');
    if (vParam) {
      directVideoId = vParam;
    } else if (pathname.startsWith('/embed/') && !pathname.startsWith('/embed/live_stream')) {
      directVideoId = pathname.replace('/embed/', '').split('/')[0] || '';
    } else {
      const liveOrShorts = pathname.match(/^\/(?:live|shorts)\/([^/?#]+)/i);
      if (liveOrShorts?.[1]) {
        directVideoId = liveOrShorts[1];
      }
    }
  }

  if (directVideoId) {
    const result: ResolvedYouTubeResult = {
      ok: true,
      mode: 'video',
      isLive: pathname.startsWith('/live/'),
      videoId: directVideoId,
      embedUrl: buildVideoEmbedUrl(directVideoId),
      watchUrl: `https://www.youtube.com/watch?v=${directVideoId}`,
    };
    resolveCache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
    return result;
  }

  // 2. Channel / Handle / live_stream URLs
  let channelId = '';
  let channelBaseUrl = '';
  let channelLiveUrl = '';

  const embedChannelParam = parsed.searchParams.get('channel');
  if (pathname === '/embed/live_stream' && embedChannelParam) {
    channelId = embedChannelParam;
    channelBaseUrl = `https://www.youtube.com/channel/${channelId}`;
    channelLiveUrl = `${channelBaseUrl}/live`;
  } else {
    const ucMatch = pathname.match(/^\/channel\/(UC[^/?#]+)/i);
    if (ucMatch?.[1]) {
      channelId = ucMatch[1];
      channelBaseUrl = `https://www.youtube.com/channel/${channelId}`;
      channelLiveUrl = `${channelBaseUrl}/live`;
    } else {
      // Handle /@handle, /@handle/live, /c/name/live, /user/name/live
      const segMatch = pathname.match(/^\/(@[^/?#]+|(?:c|user)\/[^/?#]+)/i);
      if (segMatch?.[1]) {
        const segment = segMatch[1];
        if (segment.startsWith('@')) {
          channelId = KNOWN_HANDLE_TO_ID[segment.toLowerCase()] || '';
        }
        channelBaseUrl = `https://www.youtube.com/${segment}`;
        channelLiveUrl = `${channelBaseUrl}/live`;
      }
    }
  }

  if (!channelLiveUrl) {
    const fallback: ResolvedYouTubeResult = {
      ok: false,
      mode: 'video',
      isLive: false,
      embedUrl: trimmed,
      watchUrl: trimmed,
      error: 'Unsupported YouTube URL format',
    };
    return fallback;
  }

  try {
    const livePageRes = await fetchWithTimeout(channelLiveUrl, 6000);
    const html = await livePageRes.text();

    // Extract channelId from HTML if unknown
    if (!channelId) {
      channelId =
        html.match(/"externalId":"(UC[^"]+)"/)?.[1] ||
        html.match(/"browseId":"(UC[^"]+)"/)?.[1] ||
        html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[^"]+)"/)?.[1] ||
        '';
    }

    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1] || '';
    const canonicalWatchMatch = canonical.match(/[?&]v=([A-Za-z0-9_-]{6,})/);
    const isActuallyLive =
      Boolean(canonicalWatchMatch?.[1]) &&
      /"isLive"\s*:\s*true|"isLiveNow"\s*:\s*true|"isLiveContent"\s*:\s*true/.test(html);

    if (isActuallyLive && canonicalWatchMatch?.[1]) {
      const liveVideoId = canonicalWatchMatch[1];
      const rawPageTitle = html.match(/<title>([^<]+)<\/title>/)?.[1] || '';
      const cleanTitle = decodeXmlEntities(rawPageTitle.replace(/\s*-\s*YouTube\s*$/i, '')).trim();

      const result: ResolvedYouTubeResult = {
        ok: true,
        mode: 'live',
        isLive: true,
        videoId: liveVideoId,
        channelId: channelId || undefined,
        title: cleanTitle || undefined,
        embedUrl: buildVideoEmbedUrl(liveVideoId),
        watchUrl: `https://www.youtube.com/watch?v=${liveVideoId}`,
      };
      resolveCache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
      return result;
    }

    // Channel is currently OFFLINE -> automatically resolve latest video so there is NO black screen
    let latestVideo: { videoId: string; title?: string } | null = null;
    if (channelId) {
      latestVideo = await fetchLatestChannelVideoFromRss(channelId);
    }
    if (!latestVideo && channelBaseUrl) {
      latestVideo = await fetchLatestVideoFromVideosPage(channelBaseUrl);
    }

    if (latestVideo?.videoId) {
      const result: ResolvedYouTubeResult = {
        ok: true,
        mode: 'latest_video',
        isLive: false,
        videoId: latestVideo.videoId,
        channelId: channelId || undefined,
        title: latestVideo.title,
        embedUrl: buildVideoEmbedUrl(latestVideo.videoId),
        watchUrl: `https://www.youtube.com/watch?v=${latestVideo.videoId}`,
      };
      resolveCache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
      return result;
    }

    // Final fallback if RSS & scrape found no explicit ID, still embed uploads playlist rather than dead screen
    if (channelId) {
      const result: ResolvedYouTubeResult = {
        ok: true,
        mode: 'playlist_fallback',
        isLive: false,
        channelId,
        embedUrl: buildUploadsPlaylistEmbedUrl(channelId),
        watchUrl: channelLiveUrl,
      };
      resolveCache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
      return result;
    }
  } catch {
    // Network/timeout fallback using known channelId RSS or uploads playlist
    if (channelId) {
      const latest = await fetchLatestChannelVideoFromRss(channelId);
      if (latest?.videoId) {
        const result: ResolvedYouTubeResult = {
          ok: true,
          mode: 'latest_video',
          isLive: false,
          videoId: latest.videoId,
          channelId,
          title: latest.title,
          embedUrl: buildVideoEmbedUrl(latest.videoId),
          watchUrl: `https://www.youtube.com/watch?v=${latest.videoId}`,
        };
        resolveCache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
        return result;
      }

      return {
        ok: true,
        mode: 'playlist_fallback',
        isLive: false,
        channelId,
        embedUrl: buildUploadsPlaylistEmbedUrl(channelId),
        watchUrl: channelLiveUrl,
      };
    }
  }

  return {
    ok: false,
    mode: 'playlist_fallback',
    isLive: false,
    embedUrl: '',
    watchUrl: channelLiveUrl,
    error: 'Could not resolve channel stream or latest video',
  };
}

const MAX_PROXY_REDIRECTS = 5;

function isPrivateOrReservedIpv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return true;
  }
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true; // 0.0.0.0/8, 10.0.0.0/8, 127.0.0.0/8
  if (a === 169 && b === 254) return true; // link-local / cloud metadata 169.254.0.0/16
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64.0.0/10
  if (a >= 224) return true; // multicast & reserved
  return false;
}

function isPrivateOrReservedIp(ip: string): boolean {
  const ipVersion = net.isIP(ip);
  if (ipVersion === 4) {
    return isPrivateOrReservedIpv4(ip);
  }
  if (ipVersion === 6) {
    const normalized = ip.toLowerCase();
    if (normalized === '::' || normalized === '::1') return true;
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true; // ULA fc00::/7
    if (/^fe[89ab]/.test(normalized)) return true; // link-local fe80::/10
    if (normalized.startsWith('ff')) return true; // multicast
    const v4MappedDotted = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (v4MappedDotted?.[1]) {
      return isPrivateOrReservedIpv4(v4MappedDotted[1]);
    }
    const v4MappedHex = normalized.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
    if (v4MappedHex?.[1] && v4MappedHex?.[2]) {
      const hi = parseInt(v4MappedHex[1], 16);
      const lo = parseInt(v4MappedHex[2], 16);
      const dotted = `${(hi >> 8) & 255}.${hi & 255}.${(lo >> 8) & 255}.${lo & 255}`;
      return isPrivateOrReservedIpv4(dotted);
    }
    return false;
  }
  return true;
}

async function validatePublicVideoUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new Error('Invalid video URL');
  }

  if (parsed.protocol !== 'https:') {
    throw new Error('Only HTTPS video URLs are supported for offline download');
  }
  if (parsed.username || parsed.password) {
    throw new Error('URLs containing embedded credentials are not allowed');
  }

  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, '');
  if (
    !hostname ||
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    throw new Error('Private or local hostnames are not permitted');
  }

  if (net.isIP(hostname)) {
    if (isPrivateOrReservedIp(hostname)) {
      throw new Error('Private or loopback IP addresses are not permitted');
    }
    return parsed;
  }

  const resolved = await dns.lookup(hostname, { all: true });
  if (!resolved.length) {
    throw new Error('Could not resolve video host');
  }
  for (const record of resolved) {
    if (isPrivateOrReservedIp(record.address)) {
      throw new Error('Video host resolved to a restricted network address');
    }
  }

  return parsed;
}

function sanitizeDownloadFilename(rawName: string): string {
  const cleaned = (rawName || 'MovieKart_Video.mp4')
    .replace(/[\r\n"/\\<>:*?|]/g, '_')
    .trim()
    .slice(0, 100);
  return cleaned || 'MovieKart_Video.mp4';
}

async function fetchPublicVideoWithSafeRedirects(
  initialUrl: string,
  signal: AbortSignal
): Promise<globalThis.Response> {
  let currentUrl = initialUrl;

  for (let hop = 0; hop <= MAX_PROXY_REDIRECTS; hop++) {
    const validated = await validatePublicVideoUrl(currentUrl);
    const upstream = await fetch(validated.toString(), {
      method: 'GET',
      redirect: 'manual',
      signal,
      headers: {
        'User-Agent': DESKTOP_UA,
        Accept: 'video/*,application/octet-stream;q=0.9,*/*;q=0.5',
      },
    });

    if (upstream.status >= 300 && upstream.status < 400) {
      const location = upstream.headers.get('location');
      if (!location) {
        throw new Error('Upstream redirect missing location header');
      }
      currentUrl = new URL(location, validated).toString();
      continue;
    }

    return upstream;
  }

  throw new Error('Too many redirects while fetching video file');
}

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const PORT = Number(process.env.PORT || 3000);
  const distDir = path.resolve(import.meta.dirname, 'dist');
  const isProd =
    process.env.NODE_ENV === 'production' ||
    (process.env.npm_lifecycle_event === 'start' && fs.existsSync(distDir));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, service: 'MovieKart UG Server' });
  });

  app.get('/api/youtube/resolve', async (req: Request, res: Response) => {
    const url = typeof req.query.url === 'string' ? req.query.url : '';
    if (!url) {
      res.status(400).json({ ok: false, error: 'Missing url query parameter' });
      return;
    }

    try {
      const resolved = await resolveYouTubeUrl(url);
      res.json(resolved);
    } catch (error) {
      res.status(500).json({
        ok: false,
        mode: 'video',
        isLive: false,
        embedUrl: '',
        watchUrl: url,
        error: error instanceof Error ? error.message : 'Resolution error',
      });
    }
  });

  app.all('/.netlify/functions/drive-download', async (req: Request, res: Response) => {
    try {
      const fullUrl = `http://${req.headers.host || 'localhost:3000'}${req.originalUrl}`;
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) {
        if (typeof value === 'string') headers.set(key, value);
        else if (Array.isArray(value)) headers.set(key, value.join(', '));
      }

      const webReq = new globalThis.Request(fullUrl, {
        method: req.method,
        headers,
      });

      const webRes = await driveDownloadHandler(webReq);
      res.status(webRes.status);
      webRes.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });

      if (!webRes.body) {
        res.end();
        return;
      }

      const nodeStream = Readable.fromWeb(webRes.body as unknown as NodeWebReadableStream);
      req.on('close', () => {
        if (!res.writableEnded) {
          nodeStream.destroy();
        }
      });
      nodeStream.on('error', () => {
        if (!res.headersSent) {
          res.status(502).json({ error: 'Drive video stream interrupted' });
        } else {
          res.end();
        }
      });
      nodeStream.pipe(res);
    } catch (error) {
      if (!res.headersSent) {
        res.status(502).json({
          error: error instanceof Error ? error.message : 'Drive download proxy error',
        });
      }
    }
  });

  app.get('/api/download/proxy', async (req: Request, res: Response) => {
    const rawUrl = typeof req.query.url === 'string' ? req.query.url : '';
    const rawFilename = typeof req.query.filename === 'string' ? req.query.filename : 'MovieKart_Video.mp4';

    if (!rawUrl) {
      res.status(400).json({ ok: false, error: 'Missing url query parameter' });
      return;
    }

    const abortController = new AbortController();
    req.on('close', () => {
      if (!res.writableEnded) {
        abortController.abort();
      }
    });

    try {
      const upstream = await fetchPublicVideoWithSafeRedirects(rawUrl, abortController.signal);
      if (!upstream.ok || !upstream.body) {
        res.status(upstream.status >= 400 ? upstream.status : 502).json({
          ok: false,
          error: `Video source returned HTTP ${upstream.status}`,
        });
        return;
      }

      const contentType = (upstream.headers.get('content-type') || 'application/octet-stream')
        .split(';')[0]
        .trim()
        .toLowerCase();

      const isAllowedMediaType =
        contentType.startsWith('video/') ||
        contentType.startsWith('audio/') ||
        contentType === 'application/octet-stream' ||
        contentType === 'binary/octet-stream';

      if (!isAllowedMediaType) {
        abortController.abort();
        res.status(422).json({
          ok: false,
          error: 'Source URL did not return a downloadable video file.',
        });
        return;
      }

      const safeFilename = sanitizeDownloadFilename(rawFilename);
      res.setHeader('Content-Type', contentType.startsWith('video/') ? contentType : 'video/mp4');
      res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('X-Content-Type-Options', 'nosniff');

      const contentLength = upstream.headers.get('content-length');
      if (contentLength && /^\d+$/.test(contentLength)) {
        res.setHeader('Content-Length', contentLength);
      }

      const nodeStream = Readable.fromWeb(upstream.body as unknown as NodeWebReadableStream);
      nodeStream.on('error', () => {
        if (!res.headersSent) {
          res.status(502).json({ ok: false, error: 'Video stream interrupted' });
        } else {
          res.end();
        }
      });
      nodeStream.pipe(res);
    } catch (error) {
      if (abortController.signal.aborted) return;
      const message = error instanceof Error ? error.message : 'Download proxy error';
      const status =
        message.includes('Invalid') ||
        message.includes('HTTPS') ||
        message.includes('credentials') ||
        message.includes('permitted') ||
        message.includes('restricted')
          ? 400
          : 502;
      if (!res.headersSent) {
        res.status(status).json({ ok: false, error: message });
      }
    }
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ws: { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`MovieKart UG server listening on http://0.0.0.0:${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start MovieKart UG server:', err);
  process.exit(1);
});
