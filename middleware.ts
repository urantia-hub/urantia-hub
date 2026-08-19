import { NextRequest, NextResponse } from "next/server";

// --- In-memory sliding window rate limiter ---

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Clean up expired entries every 60 seconds
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  rateLimitMap.forEach((entry, key) => {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key);
    }
  });
}

// Rate limit configuration by path prefix
function getRateLimit(pathname: string): { limit: number; windowMs: number } | null {
  if (pathname.startsWith("/api/auth")) {
    return { limit: 5, windowMs: 60_000 };
  }
  if (pathname.startsWith("/api/chat")) {
    return { limit: 20, windowMs: 60_000 };
  }
  if (pathname.startsWith("/api/")) {
    return { limit: 60, windowMs: 60_000 };
  }
  // Non-API paths — no rate limiting
  return null;
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Determine rate limit for this path
  const rateLimit = getRateLimit(pathname);
  if (!rateLimit) {
    return NextResponse.next();
  }

  // Run periodic cleanup
  cleanup();

  const ip = getClientIp(request);
  const key = `${ip}:${pathname.startsWith("/api/auth") ? "/api/auth" : pathname.startsWith("/api/chat") ? "/api/chat" : "/api"}`;
  const now = Date.now();

  let entry = rateLimitMap.get(key);

  // If no entry or window expired, start a new window
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + rateLimit.windowMs };
    rateLimitMap.set(key, entry);
  }

  entry.count++;

  const remaining = Math.max(0, rateLimit.limit - entry.count);
  const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);

  // Rate limited
  if (entry.count > rateLimit.limit) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(rateLimit.limit),
          "X-RateLimit-Remaining": "0",
          "Retry-After": String(retryAfterSeconds),
        },
      }
    );
  }

  // Allowed — attach rate limit headers
  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", String(rateLimit.limit));
  response.headers.set("X-RateLimit-Remaining", String(remaining));
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|monitoring|.*\\.(?:png|jpg|ico|svg|webp|woff2?)$).*)",
  ],
};
