import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { getToken } from "next-auth/jwt";
import type { Database } from "@/types";

const PROTECTED_PATHS = ["/upload", "/me", "/settings"] as const;

function getAllowedEmails(): string[] {
  return (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function isEmailAllowed(email: string | null | undefined): boolean {
  const allowed = getAllowedEmails();
  if (allowed.length === 0) return true;
  if (!email) return false;
  return allowed.includes(email.toLowerCase());
}

function normalizeSupabaseUrl(raw: string) {
  try {
    const u = new URL(raw);
    u.pathname = "";
    u.search = "";
    u.hash = "";
    return u.toString().replace(/\/$/, "");
  } catch {
    return raw.replace(/\/rest\/v1\/?$/i, "").replace(/\/$/, "");
  }
}

function getSupabaseAnonClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY are required.");
  }
  return createClient<Database>(normalizeSupabaseUrl(supabaseUrl), supabaseAnonKey);
}

function getSupabaseServiceRoleClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;

  return createClient<Database>(normalizeSupabaseUrl(supabaseUrl), serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function stableUuidFromString(input: string) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(digest).subarray(0, 16);
  // Set version 4 + RFC4122 variant.
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

async function normalizeUserId(user: Pick<User, "id" | "email">) {
  if (user.id && isUuid(user.id)) return user.id;
  // Google の `sub` 等（UUID ではないID）に対して、アプリ内で安定した UUID を生成する
  const basis = user.id ? `ext:${user.id}` : user.email ? `email:${user.email}` : `rand:${crypto.randomUUID()}`;
  return await stableUuidFromString(basis);
}

async function ensurePublicUser(user: Pick<User, "id" | "email" | "name" | "image">) {
  const admin = getSupabaseServiceRoleClient();
  if (!admin || !user.email) return;
  const id = await normalizeUserId(user);

  const payload: Database["public"]["Tables"]["users"]["Insert"] = {
    id,
    email: user.email,
    display_name: user.name ?? null,
    avatar_url: user.image ?? null,
  };

  const { error } = await admin.from("users").upsert(
    {
      ...payload,
    } as unknown as never,
    { onConflict: "id" }
  );
  if (error) {
    const msg = String(error.message ?? "");
    const hint =
      msg.includes("<!DOCTYPE html>") || msg.includes("<html")
        ? " (SUPABASE_URL が誤っている可能性があります。`https://<project-ref>.supabase.co` の形式になっているか確認してください)"
        : "";
    throw new Error(`Failed to sync user profile: ${msg}${hint}`);
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        if (!isEmailAllowed(credentials.email)) return null;

        const supabase = getSupabaseAnonClient();
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });
        if (error || !data.user) return null;

        return {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? null,
          image: data.user.user_metadata?.avatar_url ?? null,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      // Ensure token.sub is ALWAYS the app's stable UUID (not Google `sub`, etc).
      if (typeof token.sub === "string" && token.sub && !isUuid(token.sub)) {
        token.sub = await stableUuidFromString(`ext:${token.sub}`);
      }
      if (user) {
        token.sub = await normalizeUserId(user);
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.email = token.email ?? "";
        session.user.name = token.name ?? null;
        session.user.image = (token.picture as string | null | undefined) ?? null;
      }
      return session;
    },
    async signIn({ user }) {
      // メールアドレスのallowlistによる制限（ALLOWED_EMAILS 未設定なら全許可）
      if (!isEmailAllowed(user.email)) {
        console.warn(`[auth] sign-in blocked: ${user.email ?? "(no email)"}`);
        return false;
      }

      // プロフィール同期の失敗でログイン全体を失敗させない（環境変数ミス等の影響を局所化）
      try {
        await ensurePublicUser(user);
      } catch (e) {
        console.error(e);
      }
      return true;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export function getServerAuthSession() {
  return getServerSession(authOptions);
}

export function isProtectedPath(pathname: string) {
  return PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export async function requireAuthInMiddleware(request: NextRequest) {
  if (!isProtectedPath(request.nextUrl.pathname)) return null;

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (token) return null;

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}
