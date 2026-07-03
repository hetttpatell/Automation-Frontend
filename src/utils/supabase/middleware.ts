import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ──────────────────────────────────────────────────────────
  // FAST PATH: Skip Supabase auth entirely for public routes.
  // This eliminates the ~3 min latency on pages that don't
  // need authentication (landing page, login, register, etc.)
  // ──────────────────────────────────────────────────────────
  const publicRoutes = ["/", "/landing", "/login", "/register"];
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || (route !== "/" && pathname.startsWith(route + "/"))
  );

  // Also skip for static assets, API routes, and Next.js internals
  const isStaticOrApi =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") || // files like .png, .css, .js
    pathname === "/favicon.ico";

  if (isPublicRoute || isStaticOrApi) {
    return NextResponse.next({ request });
  }

  // ──────────────────────────────────────────────────────────
  // PROTECTED PATH: Only hit Supabase auth for dashboard routes
  // ──────────────────────────────────────────────────────────
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
      global: {
        fetch: (url, options) => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

          const headers = new Headers(options?.headers);
          headers.set("Connection", "close");

          return fetch(url, {
            ...options,
            headers,
            signal: controller.signal,
          }).finally(() => clearTimeout(timeoutId));
        },
      },
    }
  );

  // IMPORTANT: Do NOT use getSession() here.
  // getUser() sends a request to the Supabase Auth server every time
  // to revalidate the Auth token, while getSession() does not.
  // This is critical for security in middleware.
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Check if target is a dashboard route
    const isDashboardRoute =
      pathname === "/dashboard" || pathname.startsWith("/dashboard/") ||
      pathname === "/inbox" || pathname.startsWith("/inbox/") ||
      pathname === "/knowledge" || pathname.startsWith("/knowledge/") ||
      pathname === "/knowledge-base" || pathname.startsWith("/knowledge-base/") ||
      pathname === "/campaigns" || pathname.startsWith("/campaigns/") ||
      pathname === "/settings" || pathname.startsWith("/settings/") ||
      pathname === "/pricing" || pathname.startsWith("/pricing/");

    // If user is NOT authenticated and trying to access a protected dashboard route
    if (!user && isDashboardRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  } catch (error) {
    // If Supabase auth times out or fails, redirect to login for protected routes
    console.error("[Middleware] Auth check failed:", error);
    const isDashboardRoute =
      pathname === "/dashboard" || pathname.startsWith("/dashboard/") ||
      pathname === "/inbox" || pathname.startsWith("/inbox/") ||
      pathname === "/knowledge" || pathname.startsWith("/knowledge/") ||
      pathname === "/knowledge-base" || pathname.startsWith("/knowledge-base/") ||
      pathname === "/campaigns" || pathname.startsWith("/campaigns/") ||
      pathname === "/settings" || pathname.startsWith("/settings/") ||
      pathname === "/pricing" || pathname.startsWith("/pricing/");

    if (isDashboardRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
