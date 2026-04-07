"""Tests for CLI commands: list, stats, export."""

import csv
import json
import io
from pathlib import Path
from unittest.mock import patch

import pytest
from click.testing import CliRunner

from blg.cli import cli
from blg import db


SAMPLE_BOOKS = [
    {
        "book_id": "1", "asin": "123", "title": "百年の孤独", "author": "マルケス",
        "authors": "マルケス", "publisher": "新潮社", "image_url": "", "large_image_url": "",
        "pages": 672, "rating": 5, "status_code": 3, "status_name": "読み終わった",
        "category_name": "Life", "tags": "", "release_date": "2006-12-01",
        "created_at": "2024-05-22", "read_at": "", "isbn": "", "amazon_url": "", "booklog_url": "",
    },
    {
        "book_id": "2", "asin": "456", "title": "ペスト", "author": "カミュ",
        "authors": "カミュ", "publisher": "光文社", "image_url": "", "large_image_url": "",
        "pages": 496, "rating": 4, "status_code": 2, "status_name": "いま読んでる",
        "category_name": "Kindle", "tags": "", "release_date": "2021-09-14",
        "created_at": "2025-11-16", "read_at": "", "isbn": "", "amazon_url": "", "booklog_url": "",
    },
]


@pytest.fixture
def data_dir(tmp_path):
    d = tmp_path / "data"
    d.mkdir()
    db.save_books(SAMPLE_BOOKS, d)
    return d


@pytest.fixture
def runner():
    return CliRunner()


# --- list command ---

class TestListCommand:
    def test_list_default(self, runner, data_dir):
        result = runner.invoke(cli, ["--data-dir", str(data_dir), "list"])
        assert result.exit_code == 0
        assert "ペスト" in result.output
        assert "2 of 2" in result.output

    def test_list_sort_rating(self, runner, data_dir):
        result = runner.invoke(cli, ["--data-dir", str(data_dir), "list", "-s", "rating"])
        assert result.exit_code == 0
        # Rating 5 (マルケス) should come before rating 4 (カミュ)
        idx_5 = result.output.index("マルケ")
        idx_4 = result.output.index("カミュ")
        assert idx_5 < idx_4

    def test_list_filter_status(self, runner, data_dir):
        result = runner.invoke(cli, ["--data-dir", str(data_dir), "list", "--status", "3"])
        assert result.exit_code == 0
        assert "1 of 2" in result.output
        assert "ペスト" not in result.output

    def test_list_search(self, runner, data_dir):
        result = runner.invoke(cli, ["--data-dir", str(data_dir), "list", "-q", "カミュ"])
        assert result.exit_code == 0
        assert "ペスト" in result.output
        assert "百年の孤独" not in result.output

    def test_list_no_match(self, runner, data_dir):
        result = runner.invoke(cli, ["--data-dir", str(data_dir), "list", "-q", "存在しない"])
        assert result.exit_code == 0
        assert "No books match" in result.output

    def test_list_empty_db(self, runner, tmp_path):
        d = tmp_path / "empty"
        d.mkdir()
        result = runner.invoke(cli, ["--data-dir", str(d), "list"])
        assert result.exit_code == 0
        assert "No books found" in result.output

    def test_list_limit(self, runner, data_dir):
        result = runner.invoke(cli, ["--data-dir", str(data_dir), "list", "-n", "1"])
        assert result.exit_code == 0
        assert "1 of 2" in result.output


# --- stats command ---

class TestStatsCommand:
    def test_stats_output(self, runner, data_dir):
        result = runner.invoke(cli, ["--data-dir", str(data_dir), "stats"])
        assert result.exit_code == 0
        assert "蔵書統計" in result.output
        assert "2" in result.output  # total

    def test_stats_shows_status(self, runner, data_dir):
        result = runner.invoke(cli, ["--data-dir", str(data_dir), "stats"])
        assert "読み終わった" in result.output
        assert "いま読んでる" in result.output

    def test_stats_shows_authors(self, runner, data_dir):
        result = runner.invoke(cli, ["--data-dir", str(data_dir), "stats"])
        assert "マルケス" in result.output

    def test_stats_shows_publishers(self, runner, data_dir):
        result = runner.invoke(cli, ["--data-dir", str(data_dir), "stats"])
        assert "新潮社" in result.output

    def test_stats_empty_db(self, runner, tmp_path):
        d = tmp_path / "empty"
        d.mkdir()
        result = runner.invoke(cli, ["--data-dir", str(d), "stats"])
        assert "No books found" in result.output


# --- export command ---

class TestExportCommand:
    def test_export_csv(self, runner, data_dir, tmp_path):
        out = tmp_path / "books.csv"
        result = runner.invoke(cli, ["--data-dir", str(data_dir), "export", "-f", "csv", "-o", str(out)])
        assert result.exit_code == 0
        content = out.read_text(encoding="utf-8")
        reader = csv.DictReader(io.StringIO(content))
        rows = list(reader)
        assert len(rows) == 2
        assert rows[0]["title"] in ("百年の孤独", "ペスト")

    def test_export_json(self, runner, data_dir, tmp_path):
        out = tmp_path / "books.json"
        result = runner.invoke(cli, ["--data-dir", str(data_dir), "export", "-f", "json", "-o", str(out)])
        assert result.exit_code == 0
        books = json.loads(out.read_text(encoding="utf-8"))
        assert len(books) == 2

    def test_export_csv_stdout(self, runner, data_dir):
        result = runner.invoke(cli, ["--data-dir", str(data_dir), "export", "-f", "csv"])
        assert result.exit_code == 0
        assert "title" in result.output  # header row
        assert "百年の孤独" in result.output

    def test_export_empty_db(self, runner, tmp_path):
        d = tmp_path / "empty"
        d.mkdir()
        result = runner.invoke(cli, ["--data-dir", str(d), "export"])
        assert "No books found" in result.output

    def test_export_sorted(self, runner, data_dir, tmp_path):
        out = tmp_path / "books.json"
        result = runner.invoke(cli, ["--data-dir", str(data_dir), "export", "-f", "json", "-o", str(out), "-s", "title"])
        books = json.loads(out.read_text(encoding="utf-8"))
        titles = [b["title"] for b in books]
        assert titles == sorted(titles)


# --- fetch command (mocked) ---

class TestFetchCommand:
    @patch("blg.cli.api.fetch_all_books")
    def test_fetch_saves_data(self, mock_fetch, runner, tmp_path):
        d = tmp_path / "data"
        d.mkdir()

        def fake_fetch(user_id, on_progress=None, on_batch=None, workers=4):
            if on_batch:
                on_batch(SAMPLE_BOOKS, "読み終わった")
            return SAMPLE_BOOKS

        mock_fetch.side_effect = fake_fetch
        result = runner.invoke(cli, ["--data-dir", str(d), "fetch", "-u", "testuser"])
        assert result.exit_code == 0
        assert "完了" in result.output
        loaded = db.load_books(d)
        assert len(loaded) == 2
