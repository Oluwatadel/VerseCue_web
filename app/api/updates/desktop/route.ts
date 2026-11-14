import {releaseFeed, updateHeaders} from '../../../../lib/update-feeds';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  const source = process.env.DESKTOP_UPDATE_MANIFEST_URL?.trim();
  if (!source) return new Response(null, {status: 204, headers: updateHeaders});
  try {const body = await releaseFeed(source, 65536); return new Response(body, {headers: {...updateHeaders, 'Content-Type': 'application/json'}});}
  catch {return Response.json({error: 'Update feed temporarily unavailable.'}, {status: 503, headers: updateHeaders});}
}
