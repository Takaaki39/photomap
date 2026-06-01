"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { requestPasswordResetEmail } from "@/features/auth/api/authApi";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const callbackUrl =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("callbackUrl") ?? "/me"
      : "/me";
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onCredentialsLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const result = await signIn("credentials", {
      email,
      password,
      callbackUrl,
      redirect: false,
    });

    setLoading(false);
    if (result?.error) {
      setMessage("ログインに失敗しました。メールアドレスまたはパスワードを確認してください。");
      return;
    }
    window.location.href = result?.url ?? callbackUrl;
  };

  const onGoogleLogin = async () => {
    await signIn("google", { callbackUrl });
  };

  const onResetPassword = async () => {
    if (!email) {
      setMessage("パスワードリセットにはメールアドレスの入力が必要です。");
      return;
    }
    const result = await requestPasswordResetEmail(email);
    if (!result.ok) {
      setMessage("パスワードリセットメール送信に失敗しました。");
      return;
    }
    setMessage("パスワードリセットメールを送信しました。受信ボックスを確認してください。");
  };

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-xl font-semibold">ログイン</h1>
      <p className="mt-2 text-sm text-on-surface-variant">メール/パスワード または Google でログインできます。</p>

      <button
        type="button"
        onClick={onGoogleLogin}
        className="mt-6 w-full rounded-md border border-outline-variant bg-surface-container-lowest px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-container-high"
      >
        Google でログイン
      </button>

      <form onSubmit={onCredentialsLogin} className="mt-4 space-y-3 rounded-lg border p-4">
        <label className="block">
          <span className="mb-1 block text-sm">メールアドレス</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm">パスワード</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
            required
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-container disabled:opacity-60"
        >
          {loading ? "ログイン中..." : "メールでログイン"}
        </button>
      </form>

      <button
        type="button"
        onClick={onResetPassword}
        className="mt-3 text-sm text-primary hover:underline"
      >
        パスワードを忘れた場合
      </button>

      {message && <p className="mt-3 text-sm text-on-surface">{message}</p>}
    </main>
  );
}
