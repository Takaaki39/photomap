import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// ログイン不要で誰でも見られるパス
const PUBLIC_PATHS = new Set<string>(["/login", "/privacy"]);
const PUBLIC_PREFIXES = ["/api/auth"]; // NextAuth のOAuthコールバック等

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublicPath(pathname)) return NextResponse.next();

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (token) return NextResponse.next();

  // API は HTML へのリダイレクトではなく 401 を返す（fetch側で扱いやすくする）
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("callbackUrl", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // 静的アセット類は除外し、それ以外（ページ＋API）にミドルウェアを適用
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|map-pin.svg|.*\\.(?:png|jpg|jpeg|gif|webp|ico|svg)$).*)",
  ],
};
