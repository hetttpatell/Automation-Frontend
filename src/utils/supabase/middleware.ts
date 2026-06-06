import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
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
    }
  );

  // IMPORTANT: Do NOT use getSession() here.
  // getUser() sends a request to the Supabase Auth server every time
  // to revalidate the Auth token, while getSession() does not.
  // This is critical for security in middleware.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

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

  // If user IS authenticated and trying to access login/register page, redirect to dashboard
  if (user && (pathname === "/login" || pathname === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
