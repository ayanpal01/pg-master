import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/attendance',
  '/history',
  '/profile',
  '/expenses',
  '/members',
  '/setup-pg',
];

// Routes only for unauthenticated users
const PUBLIC_ONLY_ROUTES = ['/login'];

// API routes - add CORS and auth checks
const API_PREFIX = '/api';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ─── CORS / API Security ──────────────────────────────────────────────────
  if (pathname.startsWith(API_PREFIX)) {
    const origin = req.headers.get('origin');
    const host = req.headers.get('host');

    // Block requests from external origins (not same-origin)
    // In production this prevents API scraping from external domains
    if (origin && host) {
      const allowedOrigins = [
        `https://${host}`,
        `http://${host}`,
        `http://localhost:3000`,
        `http://localhost:3001`,
      ];
      if (!allowedOrigins.some((o) => origin.startsWith(o.split(':').slice(0,2).join(':').replace('http://', '').replace('https://', '')))) {
        // Only block if it's clearly a cross-origin request (not same-site)
        const isSameOrigin = origin.includes(host.split(':')[0]);
        if (!isSameOrigin) {
          return new NextResponse(JSON.stringify({ error: 'Forbidden' }), {
            status: 403,
            headers: {
              'Content-Type': 'application/json',
              'X-Content-Type-Options': 'nosniff',
            },
          });
        }
      }
    }

    // Allow auth routes without session (login, logout)
    if (
      pathname.startsWith('/api/auth/login') ||
      pathname.startsWith('/api/auth/logout')
    ) {
      return addSecurityHeaders(NextResponse.next());
    }

    // Proxy other API routes. The backend will validate the session itself!
    // This avoids dual-validation issues if secrets mismatch slightly.
    return addSecurityHeaders(NextResponse.next());
  }

  // ─── Page Route Guards ────────────────────────────────────────────────────
  const session = req.cookies.get('session')?.value;
  let isAuthenticated = false;

  // We only check for the presence of the session cookie here.
  // The actual cryptographic validation is handled by the Express backend API.
  if (session && session.length > 10) {
    isAuthenticated = true;
  }

  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isPublicOnly = PUBLIC_ONLY_ROUTES.some((route) => pathname.startsWith(route));

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isPublicOnly && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return addSecurityHeaders(NextResponse.next());
}

/**
 * Adds professional security headers to every response.
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  // Referrer privacy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Disable dangerous browser features
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );
  // XSS protection (legacy browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block');
  // Content Security Policy - Allow backend API connections
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval needed for Next.js dev; tighten in prod
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      `connect-src 'self' ${backendUrl} http://localhost:4000 https://*.vercel.app`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)',
  ],
};
