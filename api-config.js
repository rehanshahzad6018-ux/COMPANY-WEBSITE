/* ── API endpoint configuration ────────────────────────────────
 * Leave API_BASE empty ('') when the Node backend serves the pages
 * itself — localhost, or cgw-ai.com once the Node app runs there.
 * Every /api/* call then stays a same-origin relative request.
 *
 * If the site is served as static files (cPanel/LiteSpeed) while the
 * backend lives elsewhere, put that backend's origin here, no
 * trailing slash:
 *
 *   const API_BASE = 'https://cgw-api.onrender.com';
 *
 * Nothing else in the codebase changes — the fetch wrapper below
 * rewrites every '/api/...' path onto that origin.
 * ------------------------------------------------------------- */
(function () {
  const API_BASE = '';

  window.API_BASE = API_BASE;
  if (!API_BASE) return;                 // same-origin: no patching needed

  const nativeFetch = window.fetch.bind(window);

  window.fetch = function (input, init) {
    if (typeof input === 'string' && input.startsWith('/api/')) {
      input = API_BASE + input;
      init = Object.assign({ credentials: 'omit' }, init);
    } else if (input instanceof Request && new URL(input.url).pathname.startsWith('/api/')) {
      const u = new URL(input.url);
      input = new Request(API_BASE + u.pathname + u.search, input);
    }
    return nativeFetch(input, init);
  };
})();
