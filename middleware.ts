import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value

  // If token not found, redirect to login page
  if (!token && request.nextUrl.pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Allow access
  return NextResponse.next()
}

// Optional: Specify paths to run the middleware
export const config = {
  matcher: ["/((?!_next|favicon.ico|api|login).*)"], // Protect all routes except these
}
