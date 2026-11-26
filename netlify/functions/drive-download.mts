/**
 * Netlify Function v2 (Streaming): /.netlify/functions/drive-download?fileId=XXX
 *
 * Streams Google Drive video files directly into the MovieKart UG browser app (IndexedDB)
 * with proper CORS headers and automatic virus-scan confirmation token handling for >100MB files.
 * Rejects quota errors and HTML pages with JSON errors — never returns HTML or fake video bytes.
 */

const FILE_ID_PATTERN = /^[A-Za-z0-9_-]{10,120}$/;
const DESKTOP_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const ALLOWED_ORIGINS = new Set([
  'https://moviekartug.netlify.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
]);

function getCorsOrigin(req: Request): string {
  const origin = req.headers.get('origin') || '';
  if (
    ALLOWED_ORIGINS.has(origin) ||
    /^https:\/\/[a-z0-9-]+--moviekartug\.netlify\.app$/i.test(origin) ||
    /^https:\/\/[a-z0-9-]+\.[a-z0-9-]+\.run\.app$/i.test(origin)
  ) {
    return origin;
  }
  return 'https://moviekartug.netlify.app';
}

function buildCorsHeaders(req: Request, extra: Record<string, string> = {}): Headers {
  const headers = new Headers({
    'Access-Control-Allow-Origin': getCorsOrigin(req),
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Range',
    'Access-Control-Expose-Headers': 'Content-Length, Content-Type, Content-Disposition, Content-Range, Accept-Ranges',
    Vary: 'Origin',
    ...extra,
  });
  return headers;
}

function jsonError(req: Request, status: number, error: string): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: buildCorsHeaders(req, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    }),
  });
}

function collectCookieHeader(res: Response, existingCookie = ''): string {
  const jar = new Map<string, string>();
  if (existingCookie) {
    for (const part of existingCookie.split(';')) {
      const idx = part.indexOf('=');
      if (idx > 0) {
        jar.set(part.slice(0, idx).trim(), part.slice(idx + 1).trim());
      }
    }
  }

  const getSetCookie = (res.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;
  const setCookies = typeof getSetCookie === 'function'
    ? getSetCookie.call(res.headers)
    : res.headers.get('set-cookie')
    ? [res.headers.get('set-cookie') as string]
    : [];

  for (const raw of setCookies) {
    const firstPair = raw.split(';')[0] || '';
    const idx = firstPair.indexOf('=');
    if (idx > 0) {
      jar.set(firstPair.slice(0, idx).trim(), firstPair.slice(idx + 1).trim());
    }
  }

  return Array.from(jar.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

function decodeHtmlAttr(val: string): string {
  return val
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function detectDriveHtmlError(html: string): { status: number; error: string } | null {
  const lower = html.toLowerCase();
  if (
    lower.includes('download quota') ||
    lower.includes('too many users have viewed or downloaded') ||
    lower.includes('quota exceeded') ||
    lower.includes("sorry, you can't view or download this file at this time")
  ) {
    return { status: 429, error: 'Drive quota' };
  }
  if (
    lower.includes('you need access') ||
    lower.includes('request access') ||
    lower.includes('accounts.google.com/servicelogin') ||
    lower.includes('sign in to continue')
  ) {
    return { status: 403, error: 'Drive file is private. Set sharing to Anyone with the link.' };
  }
  if (
    lower.includes('sorry, the file you have requested does not exist') ||
    lower.includes('page not found')
  ) {
    return { status: 404, error: 'Drive file not found' };
  }
  return null;
}

const ALLOWED_DRIVE_HOSTS = new Set([
  'drive.google.com',
  'drive.usercontent.google.com',
]);

function validateTrustedDriveUrl(candidate: URL): string | null {
  if (candidate.protocol !== 'https:' || !ALLOWED_DRIVE_HOSTS.has(candidate.hostname.toLowerCase())) {
    return null;
  }
  return candidate.toString();
}

/**
 * Extracts Google Drive's virus-scan confirmation URL from the HTML interstitial page (>100MB files).
 */
function extractConfirmDownloadUrl(html: string, fileId: string, cookieHeader: string): string | null {
  // 1. Modern Google Drive form: <form id="download-form" action="https://drive.usercontent.google.com/download" method="get">
  const formMatch = html.match(/<form[^>]+id=["']download-form["'][^>]*action=["']([^"']+)["'][^>]*>([\s\S]*?)<\/form>/i);
  if (formMatch?.[1]) {
    try {
      const actionUrl = new URL(decodeHtmlAttr(formMatch[1]), 'https://drive.google.com');
      const formInner = formMatch[2] || '';
      const inputRegex = /<input[^>]+type=["']hidden["'][^>]*>/gi;
      let match: RegExpExecArray | null;
      while ((match = inputRegex.exec(formInner)) !== null) {
        const tag = match[0];
        const name = tag.match(/name=["']([^"']+)["']/i)?.[1];
        const value = tag.match(/value=["']([^"']*)["']/i)?.[1];
        if (name) {
          actionUrl.searchParams.set(decodeHtmlAttr(name), decodeHtmlAttr(value ?? ''));
        }
      }
      if (!actionUrl.searchParams.has('id')) {
        actionUrl.searchParams.set('id', fileId);
      }
      if (!actionUrl.searchParams.has('export')) {
        actionUrl.searchParams.set('export', 'download');
      }
      if (!actionUrl.searchParams.has('confirm')) {
        actionUrl.searchParams.set('confirm', 't');
      }
      const validated = validateTrustedDriveUrl(actionUrl);
      if (validated) return validated;
    } catch {
      // Fall through to legacy/fallback confirmation extraction
    }
  }

  // 2. Legacy confirmation link inside href="/uc?export=download&amp;confirm=XXXX&amp;id=..."
  const hrefMatch = html.match(/href=["'](\/uc\?export=download[^"']*confirm=[^"']+)["']/i);
  if (hrefMatch?.[1]) {
    try {
      const legacyUrl = new URL(decodeHtmlAttr(hrefMatch[1]), 'https://drive.google.com');
      const validated = validateTrustedDriveUrl(legacyUrl);
      if (validated) return validated;
    } catch {
      // Fall through
    }
  }

  // 3. Extract confirm token + uuid from HTML or download_warning cookie
  const confirmFromHtml =
    html.match(/name=["']confirm["']\s+value=["']([^"']+)["']/i)?.[1] ||
    html.match(/[?&]confirm=([0-9A-Za-z_-]+)/i)?.[1];
  const uuidFromHtml =
    html.match(/name=["']uuid["']\s+value=["']([^"']+)["']/i)?.[1] ||
    html.match(/[?&]uuid=([0-9A-Za-z_-]+)/i)?.[1];
  const warningCookieToken = cookieHeader.match(/download_warning_[^=]+=\s*([^;\s]+)/i)?.[1];

  const confirmToken = confirmFromHtml || warningCookieToken;
  if (confirmToken || html.toLowerCase().includes('virus scan') || html.toLowerCase().includes('download anyway')) {
    const confirmUrl = new URL('https://drive.usercontent.google.com/download');
    confirmUrl.searchParams.set('id', fileId);
    confirmUrl.searchParams.set('export', 'download');
    confirmUrl.searchParams.set('confirm', confirmToken || 't');
    if (uuidFromHtml) {
      confirmUrl.searchParams.set('uuid', uuidFromHtml);
    }
    return validateTrustedDriveUrl(confirmUrl);
  }

  return null;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: buildCorsHeaders(req) });
  }

  if (req.method !== 'GET') {
    return jsonError(req, 405, 'Method not allowed');
  }

  const url = new URL(req.url);
  const fileId = (url.searchParams.get('fileId') || '').trim();

  if (!FILE_ID_PATTERN.test(fileId)) {
    return jsonError(req, 400, 'Missing or invalid Google Drive fileId');
  }

  const initialDriveUrl = `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`;
  const rangeHeader = req.headers.get('range');

  try {
    let cookieHeader = '';
    const firstHeaders: Record<string, string> = {
      'User-Agent': DESKTOP_UA,
      Accept: '*/*',
    };
    if (rangeHeader) {
      firstHeaders.Range = rangeHeader;
    }

    let upstream = await fetch(initialDriveUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: firstHeaders,
    });

    cookieHeader = collectCookieHeader(upstream, cookieHeader);
    let contentType = (upstream.headers.get('content-type') || '').toLowerCase();

    // If Drive returned HTML (virus-scan confirmation for >100MB files or quota/error page)
    if (contentType.includes('text/html')) {
      const html = await upstream.text();

      const htmlError = detectDriveHtmlError(html);
      if (htmlError) {
        return jsonError(req, htmlError.status, htmlError.error);
      }

      const confirmUrl = extractConfirmDownloadUrl(html, fileId, cookieHeader);
      if (!confirmUrl) {
        return jsonError(req, 429, 'Drive quota');
      }

      const confirmHeaders: Record<string, string> = {
        'User-Agent': DESKTOP_UA,
        Accept: '*/*',
      };
      if (cookieHeader) {
        confirmHeaders.Cookie = cookieHeader;
      }
      if (rangeHeader) {
        confirmHeaders.Range = rangeHeader;
      }

      upstream = await fetch(confirmUrl, {
        method: 'GET',
        redirect: 'follow',
        headers: confirmHeaders,
      });

      contentType = (upstream.headers.get('content-type') || '').toLowerCase();

      // Still HTML after confirmation -> Drive quota or blocked access (NEVER return fake video!)
      if (contentType.includes('text/html')) {
        const secondHtml = await upstream.text();
        const secondError = detectDriveHtmlError(secondHtml);
        return jsonError(req, secondError?.status ?? 429, secondError?.error ?? 'Drive quota');
      }
    }

    if (!upstream.ok || !upstream.body) {
      if (upstream.status === 429 || upstream.status === 403) {
        return jsonError(req, 429, 'Drive quota');
      }
      return jsonError(req, upstream.status >= 400 ? upstream.status : 502, `Google Drive error (HTTP ${upstream.status})`);
    }

    const normalizedType = contentType.split(';')[0].trim();
    const outContentType = normalizedType.startsWith('video/') ? normalizedType : 'video/mp4';

    const responseHeaders = buildCorsHeaders(req, {
      'Content-Type': outContentType,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });

    const contentLength = upstream.headers.get('content-length');
    if (contentLength && /^\d+$/.test(contentLength)) {
      responseHeaders.set('Content-Length', contentLength);
    }

    const contentRange = upstream.headers.get('content-range');
    if (contentRange) {
      responseHeaders.set('Content-Range', contentRange);
    }

    const acceptRanges = upstream.headers.get('accept-ranges');
    if (acceptRanges) {
      responseHeaders.set('Accept-Ranges', acceptRanges);
    }

    const disposition = upstream.headers.get('content-disposition');
    if (disposition) {
      responseHeaders.set('Content-Disposition', disposition);
    }

    return new Response(upstream.body, {
      status: upstream.status === 206 ? 206 : 200,
      headers: responseHeaders,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to stream video from Google Drive';
    return jsonError(req, 502, message);
  }
}
