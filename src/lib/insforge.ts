/// <reference types="vite/client" />

/**
 * SIPANDU - InsForge BaaS Client
 * Fallback graceful: bila backend tidak tersedia, aplikasi tetap jalan
 * penuh dengan seed data lokal (mode offline operasional hari H).
 */
import { createClient } from "@insforge/sdk";

const INSFORGE_URL = import.meta.env.VITE_INSFORGE_URL || "";
const INSFORGE_ANON_KEY = import.meta.env.VITE_INSFORGE_ANON_KEY || "";

export const insforgeConfigured = Boolean(INSFORGE_URL && INSFORGE_ANON_KEY);

export const insforge = createClient({
  baseUrl: INSFORGE_URL || "http://localhost:3000",
  anonKey: INSFORGE_ANON_KEY || "demo-not-configured",
});
