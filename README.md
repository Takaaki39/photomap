# PhotoMap

Next.js（App Router / TypeScript）で実装した、位置情報付き写真を地図で管理するアプリです。

## ローカル開発手順

1. 依存関係をインストール

```bash
npm install
```

2. 環境変数を作成

```bash
cp .env.local.example .env.local
```

3. `.env.local` を設定（下の環境変数一覧を参照）

4. 開発サーバー起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

### Docker

```bash
docker compose up --build
```

### devcontainer

1. Cursor / VS Code で `Reopen in Container`
2. コンテナ内で `npm run dev`
3. [http://localhost:3000](http://localhost:3000) へアクセス

## Supabase セットアップ

1. Supabase プロジェクト作成
2. SQL Editor または Supabase CLI でマイグレーション実行

```bash
# Supabase CLI を使う場合（事前に supabase login/link 済み）
supabase db push
```

初期スキーマは `supabase/migrations/001_initial_schema.sql` を参照してください。

## Vercel デプロイ手順

1. GitHub リポジトリを Vercel に接続
2. Framework Preset を `Next.js` に設定
3. Vercel の Environment Variables に `.env.local` と同等の値を登録
4. Production Deploy を実行

## 環境変数一覧

- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: クライアント用 anon key
- `SUPABASE_SERVICE_ROLE_KEY`: サーバー管理用 key（クライアント公開禁止）
- `SUPABASE_PROJECT_REF`: Supabase プロジェクトID（任意）
- `NEXTAUTH_SECRET`: NextAuth JWT secret
- `NEXTAUTH_URL`: 例 `http://localhost:3000`
- `GOOGLE_CLIENT_ID`: Google OAuth client id
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `NEXT_PUBLIC_ADSENSE_CLIENT_ID`: AdSense client id（例: `ca-pub-...`）
- `NEXT_PUBLIC_ADSENSE_SLOT_ID`: AdSense slot id
- `NOMINATIM_USER_AGENT`: Nominatim 利用時の User-Agent（連絡先付き推奨）

## 主要コマンド

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test:e2e
```

テスト方針は `docs/testing.md` を参照してください。
