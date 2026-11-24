// Cloudflare Pages serves static files without byte ranges, and Safari (iPhone, Mac) plays an mp4 only from a server
// that answers a Range request with 206. This Function runs only for /clips/* and cuts the requested bytes out of the
// static file; every other path stays plain static. Clips are small (under 0.5 MB), so reading one whole is cheap.
export async function onRequest({ request, env }) {
  const res = await env.ASSETS.fetch(request);
  const range = request.headers.get('Range');
  if (res.status !== 200 || request.method !== 'GET' || !range) return ranged(res);
  const ifRange = request.headers.get('If-Range');
  if (ifRange && ifRange !== res.headers.get('ETag')) return ranged(res);
  const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  if (!m || (m[1] === '' && m[2] === '')) return ranged(res);
  const buf = await res.arrayBuffer(), size = buf.byteLength;
  let start, end;
  if (m[1] === '') { start = Math.max(0, size - Number(m[2])); end = size - 1; }
  else { start = Number(m[1]); end = m[2] === '' ? size - 1 : Math.min(Number(m[2]), size - 1); }
  const h = new Headers(res.headers);
  h.set('Accept-Ranges', 'bytes');
  if (start >= size || start > end) {
    h.set('Content-Range', `bytes */${size}`); h.delete('Content-Length');
    return new Response(null, { status: 416, headers: h });
  }
  h.set('Content-Range', `bytes ${start}-${end}/${size}`);
  h.set('Content-Length', String(end - start + 1));
  return new Response(buf.slice(start, end + 1), { status: 206, headers: h });
}

function ranged(res) {
  const out = new Response(res.body, res);
  if (res.status === 200) out.headers.set('Accept-Ranges', 'bytes');
  return out;
}
