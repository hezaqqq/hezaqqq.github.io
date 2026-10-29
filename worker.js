function corsHeaders(env) {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

function corsResponse(env, body, init = {}) {
  const headers = new Headers(init.headers || {});
  for (const [k, v] of Object.entries(corsHeaders(env))) headers.set(k, v);
  return new Response(body, { ...init, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(env) });
    }
    if (request.method !== "GET") {
      return corsResponse(env, "Méthode non autorisée", { status: 405 });
    }
    if (url.pathname === "/health") {
      return corsResponse(env, JSON.stringify({ status: "ok", hasKey: !!env.API_KEY }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const ref = url.searchParams.get("MonitoringRef");
    if (!ref || !/^STIF:(StopPoint:Q|StopArea:SP):[A-Za-z0-9_-]+:$/.test(ref)) {
      return corsResponse(env, "Référence invalide", { status: 400 });
    }
    if (!env.API_KEY) {
      return corsResponse(env, "Configuration serveur manquante (API_KEY)", { status: 500 });
    }

    const base = (env.API_BASE_URL || "https://prim.iledefrance-mobilites.fr").replace(/\/+$/, "");
    const apiUrl = new URL(base + "/marketplace/stop-monitoring");
    apiUrl.searchParams.set("MonitoringRef", ref);

    try {
      const upstream = await fetch(apiUrl.toString(), {
        headers: { "Accept": "application/json", "apikey": env.API_KEY },
      });
      const buf = await upstream.arrayBuffer();
      let body;
      try {
        body = new TextDecoder("utf-8", { fatal: true }).decode(buf);
      } catch (e) {
        body = new TextDecoder("windows-1252").decode(buf);
      }
      const type = (upstream.headers.get("Content-Type") || "application/json").replace(/;\s*charset=[^;]*/i, "");
      return corsResponse(env, body, {
        status: upstream.status,
        headers: {
          "Content-Type": type + "; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    } catch (err) {
      return corsResponse(env, "Erreur lors de la récupération des horaires", { status: 502 });
    }
  },
};
