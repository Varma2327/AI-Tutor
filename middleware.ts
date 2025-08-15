// middleware.ts (if present)
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  // Skip NextAuth endpoints + static
  const p = req.nextUrl.pathname;
  if (p.startsWith("/api/auth") || p.startsWith("/_next") || p === "/favicon.ico") {
    return NextResponse.next();
  }
  // (Optional) protect your own app routes here...
  return NextResponse.next();
}

// Only run on your app routes; exclude /api/auth
export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
