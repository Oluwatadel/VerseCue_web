import {verify, X509Certificate} from 'node:crypto';
import {mobileUpdateCertificate} from './mobile-update-certificate';
import {releaseUrl} from './update-feeds';
export type MobileRelease = {platform: string; runtimeVersion: string; body: string; signature: string};
export function mobileManifest(index: string, platform: string, runtime: string): {body: Buffer; signature: string} | null {
  if (!['android','ios'].includes(platform) || !/^[0-9]+\.[0-9]+\.[0-9]+(?:-native[0-9]+)?$/.test(runtime)) return null;
  const entries: unknown = JSON.parse(index).releases;
  if (!Array.isArray(entries) || entries.length > 50) throw new Error('Invalid mobile release index.');
  const matching = entries.filter((x): x is MobileRelease => !!x && x.platform === platform && x.runtimeVersion === runtime);
  if (matching.length > 1) throw new Error('Duplicate mobile runtime.');
  const release = matching[0]; if (!release) return null;
  if (typeof release.body !== 'string' || release.body.length > 350000 || typeof release.signature !== 'string') throw new Error('Invalid signed manifest.');
  const body = Buffer.from(release.body,'base64');
  const certificate = new X509Certificate(mobileUpdateCertificate);
  if (!verify('RSA-SHA256',body,certificate.publicKey,Buffer.from(release.signature,'base64'))) throw new Error('Invalid mobile update signature.');
  const manifest = JSON.parse(body.toString('utf8'));
  if (manifest.runtimeVersion !== runtime || manifest.metadata?.platform !== platform || !/^[0-9a-f-]{36}$/i.test(manifest.id) || !Number.isFinite(Date.parse(manifest.createdAt)) || !Array.isArray(manifest.assets)) throw new Error('Incompatible manifest.');
  for (const asset of [manifest.launchAsset,...manifest.assets]) {
    releaseUrl(asset.url);
    if (!/^[A-Za-z0-9_-]{43}$/.test(asset.hash) || typeof asset.key !== 'string' || !asset.key || typeof asset.contentType !== 'string') throw new Error('Invalid update asset.');
  }
  return {body, signature: release.signature};
}
