import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresca la sesión — NUNCA elimines esta línea
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isPublicPath    = pathname.startsWith('/login') || pathname.startsWith('/api/auth')
  const isOnboardingPath = pathname.startsWith('/onboarding')
  const onboardingDone  = user?.user_metadata?.onboarding_completed === true

  // Sin sesión → login
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Con sesión en /login → dashboard o onboarding según si ya completó perfil
  if (user && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = onboardingDone ? '/' : '/onboarding'
    return NextResponse.redirect(url)
  }

  // Con sesión, ya completó onboarding, intenta entrar a /onboarding → dashboard
  if (user && isOnboardingPath && onboardingDone) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Con sesión, sin onboarding, en ruta protegida → /onboarding
  if (user && !isPublicPath && !isOnboardingPath && !onboardingDone) {
    const url = request.nextUrl.clone()
    url.pathname = '/onboarding'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
