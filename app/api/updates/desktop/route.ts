import {createHash} from 'node:crypto';
import {releaseFeed, updateHeaders} from '../../../../lib/update-feeds';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Short public CDN caching keeps automatic desktop checks inexpensive on shared hosting.
const headers = {...updateHeaders, 'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=60'};
export async function GET(request: Request) {
  const source = process.env.DESKTOP_UPDATE_MANIFEST_URL?.trim();
  if (!source) return new Response(null, {status: 204, headers});
  try {
    const body = await releaseFeed(source, 65536);
    const etag = '"' + createHash('sha256').update(body).digest('hex') + '"';
    const unchanged = request.headers.get('if-none-match')?.split(',').some(value => value.trim().replace(/^W\//, '') === etag || value.trim() === '*');
    if (unchanged) return new Response(null, {status: 304, headers: {...headers, ETag: etag}});
    return new Response(body, {headers: {...headers, ETag: etag, 'Content-Type': 'application/json'}});
  }
  catch {return Response.json({error: 'Update feed temporarily unavailable.'}, {status: 503, headers: updateHeaders});}
}
