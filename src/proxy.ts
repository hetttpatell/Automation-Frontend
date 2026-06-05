import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // TODO: Add Supabase session checking here later
  // For now, allow the request to proceed so the compiler passes
  return NextResponse.next();
}

// 3. CONFIGURE THE ROUTE MATCHER
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - register (public auth page)
     * - login (public auth page)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|register|login).*)',
  ],
};
