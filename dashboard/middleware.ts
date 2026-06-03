import { NextResponse, type NextRequest } from 'next/server'
import { ADMIN_COOKIE } from './lib/admin-auth'

export function middleware(request: NextRequest) {
  const cookie = request.cookies.get(ADMIN_COOKIE)?.value
  const loggedIn = Boolean(cookie && cookie === process.env.ADMIN_PASSWORD)
  const { pathname } = request.nextUrl

  if (pathname === '/' && loggedIn) {
    return NextResponse.redirect(new URL('/workspace', request.url))
  }

  if (pathname.startsWith('/workspace') && !loggedIn) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/workspace/:path*'],
}
