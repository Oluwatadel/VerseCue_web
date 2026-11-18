import assert from 'node:assert/strict';
import {GET} from '../app/api/updates/desktop/route';

async function run() {
  const originalFetch = globalThis.fetch;
  const originalSource = process.env.DESKTOP_UPDATE_MANIFEST_URL;
  let body = JSON.stringify({payload: 'publisher-signed-envelope', signature: 'passed-through-unchanged'});
  let unavailable = false;
  let requests = 0;
  globalThis.fetch = async () => {requests++; if (unavailable) throw new Error('offline'); return new Response(body);};
  try {
    delete process.env.DESKTOP_UPDATE_MANIFEST_URL;
    assert.equal((await GET(new Request('https://example.invalid/api/updates/desktop'))).status, 204);
    assert.equal(requests, 0);
    process.env.DESKTOP_UPDATE_MANIFEST_URL = 'https://github.com/example/app/releases/latest/download/versevio-desktop-update.json';
    const first = await GET(new Request('https://example.invalid/api/updates/desktop'));
    assert.equal(first.status, 200);
    assert.equal(await first.text(), body);
    assert.match(first.headers.get('cache-control')!, /s-maxage=60/);
    const tag = first.headers.get('etag')!; assert.ok(tag);
    for (const value of [tag, 'W/' + tag, '"older", ' + tag, '*']) {
      const unchanged = await GET(new Request('https://example.invalid/api/updates/desktop', {headers: {'If-None-Match': value}}));
      assert.equal(unchanged.status, 304); assert.equal(await unchanged.text(), ''); assert.equal(unchanged.headers.get('etag'), tag);
    }
    body = JSON.stringify({payload: 'new-signed-release', signature: 'new-signature'});
    const changed = await GET(new Request('https://example.invalid/api/updates/desktop', {headers: {'If-None-Match': tag}}));
    assert.equal(changed.status, 200); assert.notEqual(changed.headers.get('etag'), tag);
    unavailable = true;
    const failed = await GET(new Request('https://example.invalid/api/updates/desktop'));
    assert.equal(failed.status, 503); assert.equal(failed.headers.get('cache-control'), 'no-store');
    unavailable = false; body = 'x'.repeat(65537);
    assert.equal((await GET(new Request('https://example.invalid/api/updates/desktop'))).status, 503);
    process.env.DESKTOP_UPDATE_MANIFEST_URL = 'http://untrusted.invalid/update.json';
    const before = requests;
    assert.equal((await GET(new Request('https://example.invalid/api/updates/desktop'))).status, 503);
    assert.equal(requests, before);
    console.log('PASS update feed: unpublished, signed envelope pass-through, public cache, strong/weak/list/wildcard ETags, new releases, upstream failure, size bound and source restrictions. No external requests.');
  } finally {
    globalThis.fetch = originalFetch;
    if (originalSource === undefined) delete process.env.DESKTOP_UPDATE_MANIFEST_URL; else process.env.DESKTOP_UPDATE_MANIFEST_URL = originalSource;
  }
}
run().catch(error => {console.error(error); process.exitCode = 1;});
