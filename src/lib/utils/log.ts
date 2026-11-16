/**
 * Thin logging wrapper.
 * Phase 1: writes to console (server) / no-op (client).
 * Phase 2 (S7): swap to PostHog capture for production.
 *
 * Never use console.error / console.warn directly in committed code —
 * route through these helpers so all error capture is centralized.
 */

export function logError(message: string, context?: Record<string, unknown>) {
  if (typeof window === "undefined") {
    // Server-side — write to stderr (Vercel logs)
    // eslint-disable-next-line no-console
    console.error(`[error] ${message}`, context ?? "");
  }
  // Phase 2: posthog.capture(...) here
}

export function logWarn(message: string, context?: Record<string, unknown>) {
  if (typeof window === "undefined") {
    // eslint-disable-next-line no-console
    console.warn(`[warn] ${message}`, context ?? "");
  }
}

export function logInfo(message: string, context?: Record<string, unknown>) {
  if (typeof window === "undefined") {
    // eslint-disable-next-line no-console
    console.log(`[info] ${message}`, context ?? "");
  }
}
