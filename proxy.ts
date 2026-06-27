// proxy.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

const COOKIE_NAME = "workflow_token";

// Các route chỉ dành cho người CHƯA đăng nhập
const AUTH_PATHS = ["/login", "/register"];

// Các route cần đăng nhập
const PROTECTED_PATHS = ["/dashboard", "/workspace"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;

  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));

  // Đã login mà vào /login hoặc /register → redirect dashboard
  if (isAuthPage && session) {
  return NextResponse.redirect(new URL("/dashboard", req.url)); // ← /dashboard
}

  // Chưa login mà vào route cần bảo vệ → redirect login
  if (isProtected && !session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // "/" và mọi route khác → cho qua tự do
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};