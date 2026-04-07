"""Tests for db file I/O: load, save, merge, meta."""

import json
from pathlib import Path

import pytest

from blg import db


@pytest.fixture
def data_dir(tmp_path):
    return tmp_path / "data"


SAMPLE_BOOKS = [
    {"book_id": "1", "title": "Book A", "author": "Author A"},
    {"book_id": "2", "title": "Book B", "author": "Author B"},
]


class TestLoadSave:
    def test_load_empty(self, data_dir):
        assert db.load_books(data_dir) == []

    def test_save_and_load(self, data_dir):
        db.save_books(SAMPLE_BOOKS, data_dir)
        loaded = db.load_books(data_dir)
        assert len(loaded) == 2
        assert loaded[0]["title"] == "Book A"

    def test_save_creates_dir(self, data_dir):
        nested = data_dir / "a" / "b"
        db.save_books(SAMPLE_BOOKS, nested)
        assert (nested / "books.json").exists()

    def test_save_overwrites(self, data_dir):
        db.save_books(SAMPLE_BOOKS, data_dir)
        db.save_books([{"book_id": "3", "title": "Book C"}], data_dir)
        loaded = db.load_books(data_dir)
        assert len(loaded) == 1

    def test_save_unicode(self, data_dir):
        books = [{"book_id": "1", "title": "百年の孤独", "author": "ガルシア・マルケス"}]
        db.save_books(books, data_dir)
        loaded = db.load_books(data_dir)
        assert loaded[0]["title"] == "百年の孤独"


class TestMerge:
    def test_merge_into_empty(self, data_dir):
        total, new = db.merge_books(SAMPLE_BOOKS, data_dir)
        assert total == 2
        assert new == 2

    def test_merge_no_duplicates(self, data_dir):
        db.save_books(SAMPLE_BOOKS, data_dir)
        total, new = db.merge_books(SAMPLE_BOOKS, data_dir)
        assert total == 2
        assert new == 0

    def test_merge_adds_new(self, data_dir):
        db.save_books(SAMPLE_BOOKS, data_dir)
        new_books = [{"book_id": "3", "title": "Book C", "author": "Author C"}]
        total, new = db.merge_books(new_books, data_dir)
        assert total == 3
        assert new == 1

    def test_merge_updates_existing(self, data_dir):
        db.save_books(SAMPLE_BOOKS, data_dir)
        updated = [{"book_id": "1", "title": "Book A Updated", "author": "Author A"}]
        total, new = db.merge_books(updated, data_dir)
        assert total == 2
        assert new == 0
        loaded = db.load_books(data_dir)
        book1 = next(b for b in loaded if b["book_id"] == "1")
        assert book1["title"] == "Book A Updated"

    def test_merge_mixed(self, data_dir):
        db.save_books(SAMPLE_BOOKS, data_dir)
        mixed = [
            {"book_id": "1", "title": "Updated A", "author": "Author A"},
            {"book_id": "3", "title": "New C", "author": "Author C"},
        ]
        total, new = db.merge_books(mixed, data_dir)
        assert total == 3
        assert new == 1


class TestMeta:
    def test_get_meta_empty(self, data_dir):
        assert db.get_meta(data_dir) == {}

    def test_set_and_get_meta(self, data_dir):
        db.set_meta("key1", "value1", data_dir)
        meta = db.get_meta(data_dir)
        assert meta["key1"] == "value1"

    def test_set_meta_multiple(self, data_dir):
        db.set_meta("a", "1", data_dir)
        db.set_meta("b", "2", data_dir)
        meta = db.get_meta(data_dir)
        assert meta == {"a": "1", "b": "2"}

    def test_set_meta_overwrite(self, data_dir):
        db.set_meta("key", "old", data_dir)
        db.set_meta("key", "new", data_dir)
        assert db.get_meta(data_dir)["key"] == "new"
