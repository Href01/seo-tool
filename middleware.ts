import { auth } from './lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Admin routes require admin role
  if (pathname.startsWith('/admin')) {
    // @ts-ignore
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  // App routes require authentication
  if (pathname.startsWith('/app')) {
    if (!session?.user) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/app/:path*', '/admin/:path*'],
}
