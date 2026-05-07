# TODO（残作業メモ）

このファイルは、仕様書を満たすために今後こちらで対応する残作業を整理したものです。  
完了した項目は随時チェックを入れて更新します。

## 1. 認証（NextAuth + Supabase）

- [x] `lib/auth.ts` に Google / Credentials プロバイダ設定を実装（NextAuth + JWT）
- [x] `/login` 画面にログインフォームと OAuth ボタンを実装
- [x] `/register` 画面に新規登録フローを実装
- [x] ログアウト UI の実装（セッションガード/未ログイン時リダイレクトは実装済み）
- [x] パスワードリセット導線を実装（Supabase Auth メール送信）

## 2. アップロード + EXIF + スポット判定

- [x] `/upload` に画像アップロード UI（D&D、EXIF確認、GPSなし時手動ピン、公開/非公開、確認→送信、完了画面＋広告）を実装
- [x] `lib/exif.ts` を使って EXIF GPS を抽出し、GPS 無しの場合の手動入力フローを実装
- [x] Nominatim 逆ジオコーディング（`lib/geocode.ts`）を実装
- [x] 同一スポット判定（名称正規化 + 50m 判定）を `lib/spotMatcher.ts` に実装
- [x] `/api/photos/upload` で Storage 保存・DB 登録・スポット紐付けを実装
- [x] EXIF 位置情報の除去方針を決めて保存前処理を実装（再エンコードでメタデータ削除）

## 3. 地図表示（Leaflet / MarkerCluster）

- [x] `components/Map/MapView.tsx` を実地図表示に置換
- [x] `leaflet.markercluster` を導入し、ズームに応じたクラスタ表示を実装
- [x] 表示モード（世界/国/地方/県/市/スポット）の切替ロジックを実装
- [x] マーカー吹き出し（代表サムネイル + 枚数バッジ）を実装
- [x] クリック時にスポット詳細パネル表示を実装

## 4. スポット詳細・マイページ

- [x] `/spot/[id]` にスポット情報 + 画像グリッド + ライトボックスを実装
- [x] `/me` に自分の投稿一覧・公開設定変更 UI を実装（検索・日時・公開状態フィルタ含む）
- [x] `/settings` にプロフィール編集（表示名・アイコン等）を実装
- [x] 広告コンポーネント `components/AdBanner.tsx` を掲載対象画面に組み込み

## 5. API Route Handlers の本実装

- [x] `GET /api/spots`（地図範囲・ズーム条件対応）を実装
- [x] `GET /api/spots/[id]` を実装
- [x] `GET /api/spots/[id]/photos` を実装（ページネーション対応）
- [x] `GET /api/me/photos` を実装
- [x] `PATCH /api/photos/[id]`（公開設定変更）を追加
- [x] `DELETE /api/photos/[id]`（画像削除）を追加
- [x] API エラーフォーマットを `{ error: string }` に統一（対象エンドポイント）

## 6. Supabase スキーマ・運用

- [x] `users / spots / photos` テーブル作成 SQL（または migration）を追加
- [x] PostGIS 利用前提の `spots.location` 設計を実装
- [x] RLS ポリシーを設計・適用（公開/非公開、本人制御）
- [x] Storage バケット設計（原本/サムネイル）と署名付き URL 方針を実装

## 7. PWA・性能・品質

- [x] `public/sw.js` に実運用キャッシュ戦略を実装（地図タイル/API/静的資産）
- [x] オフライン時のフォールバック画面を実装（`/offline`）
- [x] 画像上限（20MB）・形式（JPEG/PNG/HEIC/WebP）バリデーションを実装
- [x] PWA 設定（manifest, next-pwa fallback）を適用
- [x] CSP ヘッダーの設定（AdSense / OSM / Nominatim を許可）
- [x] アクセシビリティ（WCAG 2.1 AA）観点の改善を実施
- [x] E2E/統合テスト方針を追加し、主要フローのテストを実装

## 8. 設定・運用ドキュメント

- [x] `.env.local.example` の補足説明を README に追記
- [x] ローカル開発手順（Docker / devcontainer / 通常起動）の差分を README に明記
- [x] デプロイ手順（Vercel / Supabase）を README か `docs/` に追記
- [x] Nominatim 利用制限（1 req/sec）の対策方針をドキュメント化
- [x] プライバシーポリシー・Cookie・広告配信ポリシーページを追加（`/privacy`）

## 9. ユーザー対応が必要な項目（外部設定）

- [ ] `.env.local` に本番値を設定（Supabase / NextAuth / Google OAuth / AdSense / Nominatim）
- [ ] Supabase プロジェクトで `supabase/migrations/001_initial_schema.sql` を適用
- [ ] Supabase Storage `photos` バケットと RLS ポリシーが本番環境で有効か確認
- [ ] Google OAuth のリダイレクトURLを設定（ローカル/本番）
- [ ] AdSense の `client id` と `slot id` を取得し、審査用コンテンツ要件を満たす
- [ ] Vercel 本番環境に環境変数を登録してデプロイ
- [ ] デプロイ後に実機確認（ログイン、アップロード、地図、非公開画像、PWAインストール）

