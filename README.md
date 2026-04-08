# mybooklog - ブクログローカルビューア

[booklog.jp](https://booklog.jp) の本棚データをローカルに取得し、CLI・静的HTMLで自由にソート・フィルタ・検索できるツール。

## セットアップ

```bash
uv venv && uv pip install -e "."
```

## 使い方

```bash
# データ取得（4ステータス並列）
mybooklog fetch

# 一覧表示
mybooklog list                      # 登録日順（デフォルト）
mybooklog list -s rating            # 評価順
mybooklog list -s author            # 著者順
mybooklog list -q "村上春樹"        # 検索
mybooklog list --status 3           # 読み終わった本のみ
mybooklog list -a "永井荷風" -n 100 # 著者フィルタ、100件表示

# 統計
mybooklog stats

# エクスポート
mybooklog export -f csv -o books.csv
mybooklog export -f json -o books.json

# 静的HTMLビューア生成
mybooklog build                     # output/index.html を生成してブラウザで開く
mybooklog build --no-open           # 開かない
mybooklog build -o /path/to/out.html

# 一発実行
make                          # fetch → build → open
```

## データ構成

- `.mybooklog/` - キャッシュデータ（`books.json`, `meta.json`）
- `output/` - 生成物（`index.html`）

## API

booklog.jp に公式APIドキュメントは存在しない。本プロジェクトではリバースエンジニアリングされた非公式APIを使用。

詳細: [docs/booklog-api.md](docs/booklog-api.md)

## テスト

```bash
pytest tests/ -v --cov=mybooklog
```
