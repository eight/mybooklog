.PHONY: all fetch build open clean help

all: fetch build open ## fetch → build → open を一発実行

fetch: ## booklog.jpからデータ取得
	.venv/bin/blg fetch

build: ## 静的HTML生成
	.venv/bin/blg build --no-open

open: ## 生成したHTMLをブラウザで開く
	open output/index.html

clean: ## output/ と .blg/ を削除
	rm -rf output/ .blg/

help: ## このヘルプを表示
	@grep -E '^[a-zA-Z_-]+:.*## ' $(MAKEFILE_LIST) | awk -F ':.*## ' '{printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2}'
