"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { registerAccount } from "@/features/auth/api/authApi";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const result = await registerAccount(email, password);

    if (!result.ok) {
      setLoading(false);
      setMessage(result.error);
      return;
    }

    setMessage("登録に成功しました。メール認証後にログインしてください。");
    await signIn("credentials", { email, password, callbackUrl: "/me" });
  };

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-xl font-semibold">新規登録</h1>
      <p className="mt-2 text-sm text-on-surface-variant">メールアドレスとパスワードでアカウントを作成します。</p>

      <form onSubmit={onRegister} className="mt-6 space-y-3 rounded-lg border p-4">
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
            minLength={8}
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
          {loading ? "登録中..." : "登録する"}
        </button>
      </form>

      {message && <p className="mt-3 text-sm text-on-surface">{message}</p>}
    </main>
  );
}
