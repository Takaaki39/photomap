export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <h1 className="text-2xl font-bold">プライバシーポリシー</h1>

      <section className="space-y-2 text-sm text-on-surface">
        <h2 className="text-lg font-semibold">1. 取得する情報</h2>
        <p>
          当サービスは、アカウント情報（メールアドレス、表示名、アイコン）、投稿画像、位置情報、アクセスログを取得します。
        </p>
      </section>

      <section className="space-y-2 text-sm text-on-surface">
        <h2 className="text-lg font-semibold">2. Cookie ポリシー</h2>
        <p>
          当サービスでは、ログイン状態の維持、利用状況分析、広告配信最適化のために Cookie を利用します。ブラウザ設定により
          Cookie の無効化が可能ですが、一部機能が利用できなくなる場合があります。
        </p>
      </section>

      <section className="space-y-2 text-sm text-on-surface">
        <h2 className="text-lg font-semibold">3. 広告配信について</h2>
        <p>
          当サービスは第三者配信の広告サービス（Google AdSense）を利用する場合があります。広告配信事業者は、ユーザーの興味に応じた
          広告を表示するために Cookie を使用することがあります。
        </p>
        <p>
          Google による広告 Cookie の使用については、Google のポリシーおよび設定ページをご確認ください。
        </p>
      </section>

      <section className="space-y-2 text-sm text-on-surface">
        <h2 className="text-lg font-semibold">4. 情報の利用目的</h2>
        <p>取得した情報は、サービス提供、認証、地図表示、品質改善、不正利用防止の目的で利用します。</p>
      </section>
    </main>
  );
}
