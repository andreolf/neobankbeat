/* Edge middleware — Markdown for Agents.
   Requests to the homepage with `Accept: text/markdown` are rewritten to
   /index.md (the markdown twin of llms.txt, synced by tests/build-pages.mjs).
   Runs before Vercel's filesystem handling, which is why the vercel.json
   rewrite alone can't do this. Browsers never send this Accept value. */
export const config = { matcher: '/' };

export default function middleware(request) {
  const accept = request.headers.get('accept') || '';
  if (accept.includes('text/markdown')) {
    return new Response(null, {
      headers: { 'x-middleware-rewrite': new URL('/index.md', request.url).toString() },
    });
  }
}
