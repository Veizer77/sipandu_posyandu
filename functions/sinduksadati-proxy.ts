import { createClient } from "npm:@insforge/sdk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function configuredProvider(): { url: string; key: string } | null {
  const url = Deno.env.get("SINDUKSADATI_API_URL")?.replace(/\/$/, "");
  const key = Deno.env.get("SINDUKSADATI_SERVICE_KEY");
  return url && key ? { url, key } : null;
}

async function requireUser(req: Request): Promise<boolean> {
  const authorization = req.headers.get("Authorization");
  const accessToken = authorization?.replace(/^Bearer\s+/i, "");
  const baseUrl = Deno.env.get("INSFORGE_BASE_URL");
  if (!accessToken || !baseUrl) return false;

    const client = createClient({
      baseUrl,
      accessToken,
      anonKey: Deno.env.get("INSFORGE_ANON_KEY") || "",
    });
  const { data, error } = await client.auth.getCurrentUser();
  return Boolean(!error && ((data as { user?: { id?: string } })?.user?.id || (data as { id?: string })?.id));
}

export default async function (req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "GET" && req.method !== "POST") return response({ message: "Method not allowed" }, 405);
  if (!(await requireUser(req))) return response({ message: "Unauthorized" }, 401);

  const provider = configuredProvider();
  if (!provider) return response({ message: "SINDUKSADATI integration is not configured" }, 503);

  try {
    if (req.method === "GET") {
      const upstream = await fetch(`${provider.url}/api/v1/ecosystem/lookup?nik=0000000000000000`, {
        headers: { Accept: "application/json", "X-Ecosystem-Key": provider.key },
        cache: "no-store",
      });
      return response({ online: upstream.status < 500 }, 200);
    }

    const body = await req.json().catch(() => null) as { nik?: unknown } | null;
    const nik = typeof body?.nik === "string" ? body.nik.trim() : "";
    if (!/^\d{16}$/.test(nik)) return response({ message: "NIK harus 16 digit angka." }, 400);

    const upstream = await fetch(`${provider.url}/api/v1/ecosystem/lookup?nik=${encodeURIComponent(nik)}`, {
      headers: { Accept: "application/json", "X-Ecosystem-Key": provider.key },
      cache: "no-store",
    });
    const payload = await upstream.json().catch(() => null);
    if (!upstream.ok || !payload?.success) {
      return response({ message: payload?.message || `Provider returned HTTP ${upstream.status}` }, upstream.status === 404 ? 404 : 502);
    }

    return response({ success: true, data: payload.data });
  } catch {
    return response({ message: "SINDUKSADATI provider unavailable" }, 502);
  }
}
