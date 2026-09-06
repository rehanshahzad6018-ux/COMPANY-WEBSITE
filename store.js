/* ============================================================
   TECHNO - data layer
   ------------------------------------------------------------
   Talks to the backend API (/api/leads) when a server is
   running, and transparently falls back to localStorage when
   it isn't (e.g. opened as a plain file, or the design preview).
   All methods are async.
   ============================================================ */
window.TechnoStore = (function () {
  const KEY = 'techno_leads';
  const API = '/api/leads';
  // In the design preview the built-in assistant exists - stay on
  // localStorage there so we don't fire requests at a non-existent API.
  const PREVIEW = !!(window.claude && window.claude.complete);

  function lread() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; }
  }
  function lwrite(list) { localStorage.setItem(KEY, JSON.stringify(list)); }
  function mkLead(type, data) {
    return {
      id: 'L' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      type, data: data || {}, createdAt: new Date().toISOString()
    };
  }
  function isJson(res) {
    return res && res.ok && (res.headers.get('content-type') || '').includes('application/json');
  }

  return {
    async saveLead(type, data) {
      if (!PREVIEW) {
        try {
          const res = await fetch(API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, data })
          });
          if (isJson(res)) return await res.json();
        } catch (e) { /* fall through to localStorage */ }
      }
      const lead = mkLead(type, data);
      const list = lread(); list.unshift(lead); lwrite(list);
      return lead;
    },

    async getLeads() {
      if (!PREVIEW) {
        try {
          const res = await fetch(API);
          if (isJson(res)) return await res.json();
        } catch (e) { /* fall through */ }
      }
      return lread();
    },

    async clearLeads() {
      if (!PREVIEW) {
        try {
          const res = await fetch(API, { method: 'DELETE' });
          if (res && res.ok) return true;
        } catch (e) { /* fall through */ }
      }
      lwrite([]);
      return true;
    },

    async countLeads() { return (await this.getLeads()).length; }
  };
})();
