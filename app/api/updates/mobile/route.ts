import {releaseFeed, updateHeaders} from '../../../../lib/update-feeds';
import {mobileManifest} from '../../../../lib/mobile-updates';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const headers = {...updateHeaders, 'expo-protocol-version': '1', 'expo-sfv-version': '0'};
  const source = process.env.MOBILE_UPDATE_INDEX_URL?.trim();
  const platform = request.headers.get('expo-platform') || '';
  const version = request.headers.get('expo-runtime-version') || '';
  if (!source || !['android','ios'].includes(platform) || !/^\d+\.\d+\.\d+(?:-native\d+)?$/.test(version)) return new Response(null,{status:204,headers});
  try {
    const manifest = mobileManifest(await releaseFeed(source, 524288), platform, version);
    if (!manifest) return new Response(null,{status:204,headers});
    return new Response(new Uint8Array(manifest.body), {headers: {...headers, 'Content-Type': 'application/expo+json', 'expo-signature': `sig="${manifest.signature}", keyid="main", alg="rsa-v1_5-sha256"`}});
  } catch {return Response.json({error:'Mobile update feed temporarily unavailable.'},{status:503,headers});}
}
