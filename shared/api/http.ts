import { ApiError, getErrorMessage } from "./errors";

export type ApiFetchOptions = RequestInit & {
  /** JSON レスポンスを期待しない場合（FormData 送信など） */
  parseJson?: boolean;
};

/**
 * アプリ内 `/api/*` 向けの薄い fetch ラッパー。
 * 他フレームワークへ移植する際は base URL の差し替えだけで再利用可能。
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<{ data: T; response: Response }> {
  const { parseJson = true, ...init } = options;
  const res = await fetch(path, init);

  if (!parseJson) {
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new ApiError(text || `Request failed (${res.status})`, res.status, text);
    }
    return { data: undefined as T, response: res };
  }

  const raw = await res.text();
  let data: unknown = null;
  if (raw) {
    try {
      data = JSON.parse(raw) as T;
    } catch {
      data = raw;
    }
  }

  if (!res.ok) {
    throw new ApiError(getErrorMessage(data, `Request failed (${res.status})`), res.status, data);
  }

  return { data: data as T, response: res };
}

export async function apiFetchSafe<T = unknown>(
  path: string,
  options?: ApiFetchOptions,
): Promise<{ ok: true; data: T } | { ok: false; error: string; status: number }> {
  try {
    const { data } = await apiFetch<T>(path, options);
    return { ok: true, data };
  } catch (e) {
    if (e instanceof ApiError) {
      return { ok: false, error: e.message, status: e.status };
    }
    return { ok: false, error: "通信に失敗しました。", status: 0 };
  }
}
