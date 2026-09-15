// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

/**
 * Webhook Receiver — SINDUKSADATI → SIPANDU (PRD Bagian 42.9)
 *
 * Menerima event lifecycle kependudukan (PERSON_CREATED, PERSON_UPDATED,
 * PERSON_DECEASED, PERSON_MOVED, FAMILY_CHANGED) dan menyinkronkannya ke
 * tabel `anggota` / log `sinduksadati_event_log`.
 *
 * KEAMANAN (audit 2026-09-14 — sebelumnya stub berbahaya):
 * - Validasi HMAC SHA-256 terhadap header `X-Sinduksadati-Signature`
 *   (dibandingkan timing-safe). TIDAK ADA jalur "anggap valid".
 * - Fail-closed: bila `SINDUKSADATI_WEBHOOK_SECRET` belum di-set → 500,
 *   tidak memproses apa pun. Endpoint tidak pernah "terbuka".
 *
 * KONTRAK KOLOM (diverifikasi ke DB live):
 * - sinduksadati_event_log: (id, event_type, sinduksadati_penduduk_id,
 *   anggota_id, payload, status, error_message, processed_at, created_at)
 * - anggota: (id, nik, nama, status_aktif, sinduksadati_penduduk_id, ...)
 *   TIDAK ada status_keanggotaan / is_active / alamat di tabel live.
 */

const logger = (msg: string, extra?: unknown) =>
  console.log(`[webhook-sinduksadati] ${msg}`, extra ?? "");

/** Bandingkan dua string hex dalam waktu konstan (anti timing-attack). */
function timingSafeEqualHex(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const len = Math.max(a.length, b.length);
  let diff = a.length === b.length ? 0 : 1;
  for (let i = 0; i < len; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

async function hmacSha256Hex(secret: string, body: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Verifikasi signature HMAC; menerima format "<hex>" atau "sha256=<hex>". */
async function verifySignature(req: Request, secret: string, bodyText: string): Promise<boolean> {
  const raw = req.headers.get("X-Sinduksadati-Signature");
  if (!raw) return false;
  const provided = raw.startsWith("sha256=") ? raw.slice(7) : raw;
  const expected = await hmacSha256Hex(secret, bodyText);
  return timingSafeEqualHex(provided.toLowerCase(), expected.toLowerCase());
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const webhookSecret = Deno.env.get("SINDUKSADATI_WEBHOOK_SECRET");
  if (!webhookSecret) {
    // Fail-closed: tanpa secret, tidak ada yang diproses.
    console.error("[webhook-sinduksadati] Missing SINDUKSADATI_WEBHOOK_SECRET");
    return json({ error: "Configuration error" }, 500);
  }

  const bodyText = await req.text();

  if (!(await verifySignature(req, webhookSecret, bodyText))) {
    return json({ error: "Invalid signature" }, 401);
  }

  let payload: any;
  try {
    payload = JSON.parse(bodyText);
  } catch {
    return json({ error: "Invalid JSON payload" }, 400);
  }

  const eventType: string = payload?.event_type ?? payload?.event ?? "";
  const data = payload?.data ?? {};
  const pendudukId: string = data?.penduduk_id ?? "";
  const nik: string = data?.nik ?? data?.nik_masked ?? "";

  const dbUrl = Deno.env.get("INSFORGE_BASE_URL") || Deno.env.get("SUPABASE_URL") || "";
  const dbKey =
    Deno.env.get("INSFORGE_SERVICE_ROLE_KEY") ||
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
    "";
  if (!dbUrl || !dbKey) {
    console.error("[webhook-sinduksadati] Missing DB url/key");
    return json({ error: "Configuration error" }, 500);
  }
  const db = createClient(dbUrl, dbKey);

  // Temukan anggota terkait (via linking key, fallback NIK).
  let anggotaId: string | null = null;
  if (pendudukId) {
    const { data: linked } = await db
      .from("anggota")
      .select("id")
      .eq("sinduksadati_penduduk_id", pendudukId)
      .maybeSingle();
    anggotaId = linked?.id ?? null;
  }
  if (!anggotaId && nik && /^\d{16}$/.test(nik)) {
    const { data: byNik } = await db.from("anggota").select("id").eq("nik", nik).maybeSingle();
    anggotaId = byNik?.id ?? null;
  }

  // Log SEBELUM memproses (payload + status 'received'). Kolom sesuai skema nyata;
  // penduduk_id NOT NULL -> gunakan UUID valid atau NIK-derived placeholder.
  const logPendudukId =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pendudukId)
      ? pendudukId
      : null;

  try {
    if (logPendudukId) {
      await db.from("sinduksadati_event_log").insert({
        event_type: eventType,
        sinduksadati_penduduk_id: logPendudukId,
        anggota_id: anggotaId,
        payload,
        status: "received",
      });
    }

    let processed = false;
    if (anggotaId) {
      switch (eventType) {
        case "PERSON_DECEASED":
        case "PERSON_MOVED":
          // Arsipkan anggota terkait (kolom nyata: status_aktif).
          await db.from("anggota").update({ status_aktif: false }).eq("id", anggotaId);
          processed = true;
          break;
        case "PERSON_UPDATED":
          if (data?.nama_lengkap) {
            await db.from("anggota").update({ nama: data.nama_lengkap }).eq("id", anggotaId);
            processed = true;
          }
          break;
        case "PERSON_CREATED":
        case "FAMILY_CHANGED":
          // Tidak ada mutasi otomatis; kader menindaklanjuti dari notifikasi/log.
          processed = true;
          break;
        default:
          processed = false;
      }
    }

    // Finalkan status log (bila baris log dibuat).
    if (logPendudukId) {
      await db
        .from("sinduksadati_event_log")
        .update({
          status: anggotaId ? "processed" : "ignored",
          processed_at: new Date().toISOString(),
        })
        .eq("sinduksadati_penduduk_id", logPendudukId)
        .eq("event_type", eventType)
        .eq("status", "received");
    }

    logger(`processed event=${eventType} anggota=${anggotaId ?? "none"} ok=${processed}`);
    return json({ received: true, processed });
  } catch (err: any) {
    console.error("[webhook-sinduksadati] processing error:", err?.message);
    return json({ error: "Processing failed" }, 400);
  }
});
