.PHONY: all fetch build open clean

all: fetch build open

fetch:
	.venv/bin/blg fetch

build:
	.venv/bin/blg build --no-open

open:
	open output/index.html

clean:
	rm -rf output/ .blg/
