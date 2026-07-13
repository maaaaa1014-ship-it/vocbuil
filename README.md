# vocbuil (再読)

勉強中の単語に、パブリックドメインの名著の中で再会する英語多読アプリ。

- `pipeline/` — Python。Project Gutenberg由来の10冊のテキストを取得し、spaCyで文分割・レンマ化して単語索引を生成する。
- `app/` — Next.js (TypeScript + Tailwind)。完全クライアントサイドで動作し、生成済みの索引JSONを静的アセットとして同梱する。ランタイムのAPIサーバーは持たない。

## pipeline/

```bash
cd pipeline
pip install -r requirements.txt
python3 download_books.py   # pipeline/raw, pipeline/clean にテキストを取得
python3 build_index.py      # app/public/data/index-*.json, books.json を生成
python3 build_preset.py     # app/public/data/preset-intermediate.json, preset-advanced.json を生成
```

生成物は `app/public/data/` に配置され、`app/` はそれを静的に読み込む。索引を作り直したときは `app/public/data/*.json` を再コミットする。

テキストの取得元は gutenberg.org ではなく、同じパブリックドメイン作品のGitHubミラー(9冊は[GITenberg](https://github.com/GITenberg)、`A Little Princess`のみ[Standard Ebooks](https://github.com/standardebooks)のXHTML)。プリセット語彙は[Google 10000 English](https://github.com/first20hours/google-10000-english)の頻度リストをコーパス内出現頻度でフィルタしたもの(詳細は `pipeline/build_preset.py` のコメント参照)。プリセット各語の日英語釈は `pipeline/meanings/*.json` で管理しており、`build_preset.py` が出力時にマージする。

## app/

```bash
cd app
npm install
npm run dev    # http://localhost:3000
npm run build  # 本番ビルド確認
npm run lint
```

ユーザーデータ(単語リスト・既読センテンス・進捗)はすべて `localStorage` に保存され、外部には送信されない。

表紙画像は `app/public/covers/{bookId}.jpg` に配置する(`bookId` は `app/public/data/books.json` を参照)。画像が無い間はタイトル文字のみの疑似表紙で自動的に代替される。

## Vercelへのデプロイ

1. このリポジトリをGitHubにpushした状態で、[Vercel](https://vercel.com)にログインし「Add New… → Project」からこのリポジトリをインポートする。
2. **Root Directory** を `app` に設定する(モノレポ構成のため、リポジトリ直下ではなく `app/` をルートに指定するのが重要)。
3. Framework Preset は自動的に "Next.js" が検出される。Build Command / Output Directory はデフォルトのままでよい(`next build` / `.next`)。
4. 環境変数は不要。APIキーや外部サービス接続もない。
5. "Deploy" を押すとビルドされ、`*.vercel.app` のURLが発行される。無料のHobbyプランの範囲で十分動作する。
6. 表紙画像を追加する場合は `app/public/covers/{bookId}.jpg` を追加してpushすれば、再デプロイ時に反映される。

Cloudflare Pagesを使う場合も同様に Root directory を `app` にし、Build command を `npm run build`、Build output directory を `.next` に設定した上で `@cloudflare/next-on-pages` 等のアダプタ導入を検討する(現状はVercelでの動作を主眼に構成している)。
