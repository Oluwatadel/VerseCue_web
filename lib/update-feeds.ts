// Release feeds are public. They never depend on account, billing or database availability.
const hosts = new Set(['github.com', 'raw.githubusercontent.com', 'objects.githubusercontent.com', 'release-assets.githubusercontent.com']);
export function releaseUrl(value: string): URL {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.hash || url.port || !hosts.has(url.hostname)) throw new Error('Use a public HTTPS GitHub release asset URL.');
  return url;
}
export async function releaseFeed(address: string, limit: number): Promise<string> {
  let url = releaseUrl(address);
  const timeout = AbortSignal.timeout(15000);
  for (let redirects = 0; redirects < 6; redirects++) {
    const response = await fetch(url, {redirect: 'manual', signal: timeout, cache: 'no-store', headers: {'User-Agent': 'verseVIO-Release-Feed'}});
    if ([301,302,303,307,308].includes(response.status)) {
      const location = response.headers.get('location'); await response.body?.cancel();
      if (!location) throw new Error('Release redirect has no address.'); url = releaseUrl(new URL(location, url).href); continue;
    }
    if (!response.ok || !response.body || Number(response.headers.get('content-length') || 0) > limit) {await response.body?.cancel();throw new Error('Release feed unavailable.');}
    const reader = response.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
    try { for (;;) { const {done,value} = await reader.read(); if (done) break; size += value.length; if (size > limit) throw new Error('Release feed too large.'); chunks.push(value); } }
    finally {await reader.cancel();}
    return Buffer.concat(chunks).toString('utf8');
  }
  throw new Error('Too many release redirects.');
}
export const updateHeaders = {'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'};
