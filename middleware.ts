import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/signup'];
const PUBLIC_API_PREFIXES = ['/api/auth/'];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Validate the session cookie if present.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublicPage = PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + '/'));
  const isPublicApi = PUBLIC_API_PREFIXES.some((p) => path.startsWith(p));

  // Unauthenticated users: block the portal, allow auth pages + public APIs.
  if (!user && !isPublicPage && !isPublicApi) {
    const url = new URL('/login', request.url);
    if (path !== '/') url.searchParams.set('next', path);
    return NextResponse.redirect(url);
  }

  // Authenticated users land back on the dashboard if they visit /login or /signup.
  if (user && isPublicPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
