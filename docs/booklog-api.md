# booklog.jp API リファレンス

> booklog.jp に公式APIドキュメントは存在しない。以下はリバースエンジニアリングおよびコミュニティの知見に基づく非公式仕様。

## 使用しているエンドポイント

### ユーザー本棚 JSON API

本プロジェクトで実際に使用しているエンドポイント。本棚ページの無限スクロールが内部的に呼び出すAPIをそのまま利用。

```
GET https://booklog.jp/users/{user_id}?status={status}&page={page}&json=true
```

#### パラメータ

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| `user_id` | string | Yes | URLパス内。ユーザーID |
| `status` | int | Yes | 読書ステータス: 1=読みたい, 2=いま読んでる, 3=読み終わった, 4=積読 |
| `page` | int | Yes | ページ番号 (1〜)。1ページあたり約24件 |
| `json` | string | Yes | `true` を指定。これがないとHTMLが返る |

#### レスポンス

```json
{
  "user": { "account": "jinim8", "name": "納屋にゆく手前" },
  "login": null,
  "genre_id": "all",
  "category_id": null,
  "status": "3",
  "rank": null,
  "tag": null,
  "keyword": null,
  "sort": null,
  "categories": [...],
  "books": [
    {
      "book_id": "224797979",
      "service_id": "1",
      "id": "4122065062",
      "rank": "5",
      "category_id": "1040715",
      "public": "1",
      "status": "3",
      "create_on": "2025-10-08 22:03:59",
      "read_at": "2025-10-29 00:00:00",
      "title": "高慢と偏見 (中公文庫)",
      "image": "https://image.st-booklog.jp/...",
      "item": {
        "Binding": 3,
        "is_BL": false,
        "title": "高慢と偏見 (中公文庫)",
        "genre_id": 1,
        "url": "https://www.amazon.co.jp/dp/4122065062?tag=booklogjp-default-22&...",
        "EAN": "9784122065062",
        "pages": 672,
        "release_date": "2017-12-22",
        "price": 1320,
        "service_id": "1",
        "publisher": "中央公論新社",
        "id": "4122065062",
        "isAdult": false,
        "authors": ["ジェイン・オースティン", "大島一彦"],
        "author": "ジェイン・オースティン",
        "medium_image_url": "...",
        "large_image_url": "...",
        "small_image_url": "..."
      },
      "status_name": "読み終わった",
      "category_name": "Life",
      "tags": [],
      "quotes": [],
      "rereads": []
    }
  ]
}
```

#### bookオブジェクトの主要フィールド

| フィールド | 型 | 説明 |
|---|---|---|
| `book_id` | string | ブクログ内部ID |
| `id` | string | ASIN / ISBN-10 |
| `rank` | string | ユーザー評価 (0-5, 文字列) |
| `status` | string | ステータスコード (1-4, 文字列) |
| `create_on` | string | 登録日時 `YYYY-MM-DD HH:MM:SS` |
| `read_at` | string/null | 読了日 |
| `title` | string | 書籍タイトル |
| `image` | string | カバー画像URL (小) |
| `status_name` | string | ステータス名 (日本語) |
| `category_name` | string | カテゴリ/棚名 |
| `tags` | array | タグ配列 |

#### item (書籍メタデータ) の主要フィールド

| フィールド | 型 | 説明 |
|---|---|---|
| `author` | string | 主著者 |
| `authors` | array | 著者リスト |
| `publisher` | string | 出版社 |
| `pages` | int | ページ数 |
| `release_date` | string | 発売日 `YYYY-MM-DD` |
| `EAN` | string | ISBN-13 |
| `url` | string | Amazon URL |
| `price` | int | 価格 |
| `large_image_url` | string | カバー画像URL (大) |

#### 注意事項

- `status` パラメータなしだと最初のページ以降が取得できない（無限スクロールの実装上の制約）
- 1ページあたり約24件
- レートリミットは明示されていないが、0.5秒間隔を推奨
- 認証不要（公開プロフィールのみ）

---

### 公開API (v2)

簡易的なJSON API。認証不要。データが限定的。

```
GET http://api.booklog.jp/v2/json/{user_id}?count={count}
```

| パラメータ | 型 | 説明 |
|---|---|---|
| `user_id` | string | ユーザーID |
| `count` | int | 取得件数 (最大10000) |

#### レスポンス

```json
{
  "tana": {
    "account": "jinim8",
    "name": "納屋にゆく手前",
    "image_url": "..."
  },
  "category": [],
  "books": [
    {
      "url": "https://booklog.jp/users/jinim8/archives/1/4003104285",
      "title": "下谷叢話 (岩波文庫)",
      "image": "https://m.media-amazon.com/images/I/41ae1qpuZBL._SL75_.jpg",
      "catalog": "book"
    }
  ]
}
```

> **制限**: 著者、評価、ステータス、登録日が含まれない。本プロジェクトでは使用していない。

---

### レガシーAPI (v1/JSONP)

ブログパーツ用のJSONP API。

```
GET http://api.booklog.jp/json/{user_id}?category=0&count=5&status=0&rank=0&callback=func
```

| パラメータ | 型 | 説明 |
|---|---|---|
| `category` | int | カテゴリID (0=全て) |
| `count` | int | 件数 |
| `status` | int | ステータス (0=全て, 1-3) |
| `rank` | int | 評価 (0=全て, 1-5) |
| `callback` | string | JSONP コールバック関数名 |

> **制限**: ステータス4(積読)非対応、登録日なし。本プロジェクトでは使用していない。

---

## 参考リンク

- [ブクログのブログパーツAPIで遊んでみた](https://unformedbuilding.com/articles/booklog-blogparts-api/)
- [Python3でブクログの本棚情報を取得する](https://maky.hatenadiary.jp/entry/%3Fp=78)
- [ブクログから月毎の読書リストを取得するPythonスクリプト](https://zenn.dev/kenzo/articles/ecff32b74df5d4)
- [booklog-sns API一覧 (GitHub Wiki)](https://github.com/derui/booklog-sns/wiki/API%E4%B8%80%E8%A6%A7)
- [エクスポート機能 (公式ヘルプ)](https://booklog.zendesk.com/hc/ja/articles/33979925034263)
