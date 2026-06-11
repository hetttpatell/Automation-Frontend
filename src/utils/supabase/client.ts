import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: (url, options) => {
          const headers = new Headers(options?.headers);
          if (typeof window === "undefined") {
            headers.set("Connection", "close");
          }
          return fetch(url, {
            ...options,
            headers,
          });
        },
      },
    }
  );
}
