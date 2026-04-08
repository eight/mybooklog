# CLAUDE.md

## プロジェクト概要

booklog.jp の本棚データをローカルで閲覧するCLI + 静的HTMLツール。

## 構成

```
mybooklog/
  cli.py          - CLIエントリポイント (click)
  api.py          - booklog.jp データ取得 (並列、リトライ付き)
  db.py           - JSONファイルストレージ + クエリヘルパー
  templates/
    index.html    - Jinja2テンプレート（HTML構造）
  static/
    style.css     - CSS
    app.js         - クライアントサイドJS（ソート・フィルタ・検索）
tests/
  test_query.py   - 検索・フィルタ・ソートのテスト
  test_db_io.py   - ファイルI/O・マージ・メタのテスト
  test_api.py     - API正規化・リトライ・並列fetchのテスト
  test_build.py   - HTML生成・カテゴリフィルタ・タブ・統計表示のテスト
  test_cli.py     - CLI list/stats/export/fetchのテスト
docs/
  booklog-api.md  - booklog.jp API リファレンス（非公式、リバースエンジニアリング）
```

## API情報

- booklog.jp に公式APIドキュメント・OpenAPI仕様は存在しない
- 本プロジェクトで使用するAPIの詳細は `docs/booklog-api.md` を参照
- 主に使用: `GET https://booklog.jp/users/{user_id}?status={s}&page={p}&json=true`
- 公開API (`api.booklog.jp/v2/json/`) は著者・評価等が欠けるため使用していない

## コマンド

- `make` - fetch → build → open を一発実行
- `mybooklog fetch` - booklog.jpからデータ取得（.mybooklog/books.json に保存）
- `mybooklog build` - 静的HTML生成（output/index.html）
- `mybooklog list` - CLI一覧表示
- `mybooklog stats` - 統計表示
- `mybooklog export` - CSV/JSONエクスポート

## テスト

```bash
pytest tests/ -v --cov=mybooklog    # 131テスト、カバレッジ98%
```

## 技術的な注意点

- HTML生成はJinja2テンプレート。統計・カテゴリフィルタはビルド時に静的生成
- 書籍データはJSON全量をHTMLに埋め込み、クライアントJSでソート・フィルタ
- fetchは4ステータス並列（ThreadPoolExecutor）、0.5秒間隔、503リトライ付き
- デフォルトユーザーID: jinim8
