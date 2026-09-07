# CUTLINE v11 — Cloudflare版

このパッケージは、元のNetlify依存（Netlify Functions / Netlify Database）を外し、Cloudflare Workers + D1で動くようにした版です。

## Cloudflare側で必要なもの
- Worker Static Assets
- D1 binding: `DB`（wrangler設定では自動プロビジョニング対象）
- パスワード再設定メールを使う場合だけ Secrets:
  - `RESEND_API_KEY`
  - `PASSWORD_RESET_FROM`
  - 任意: `PASSWORD_RESET_BASE_URL`

## 構成
- `worker.js`: API + 認証 + D1保存 + Resend
- `public_build/`: ビルド済みフロントエンド
- `wrangler.jsonc`: Cloudflare設定

DBテーブルは最初のAPIアクセス時に自動作成します。
