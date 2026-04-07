// blg - booklog viewer
(function() {
  'use strict';

  var DESC_SORTS = { rating: 1, created_at: 1, pages: 1 };
  var currentSort = 'created_at';
  var sortAsc = false;

  function cmp(a, b) {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  }

  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
  }

  function getFiltered() {
    var books = window.ALL_BOOKS;
    var status = document.getElementById('status-filter').value;
    var rating = document.getElementById('rating-filter').value;
    var category = document.getElementById('category-filter').value;
    var search = document.getElementById('search').value.toLowerCase();

    if (status) books = books.filter(function(b) { return b.status_code == status; });
    if (rating) books = books.filter(function(b) { return b.rating == rating; });
    if (category) books = books.filter(function(b) { return b.category_name === category; });
    if (search) books = books.filter(function(b) {
      return (b.title + ' ' + b.author + ' ' + (b.authors || '') + ' ' + (b.publisher || '') + ' ' + (b.tags || '')).toLowerCase().indexOf(search) >= 0;
    });

    books = books.slice().sort(function(a, b) {
      var va = a[currentSort] || '';
      var vb = b[currentSort] || '';
      return sortAsc ? cmp(va, vb) : cmp(vb, va);
    });

    return books;
  }

  function render() {
    var books = getFiltered();
    var tbody = document.getElementById('book-tbody');
    var rows = [];
    for (var i = 0; i < books.length; i++) {
      var b = books[i];
      var stars = '';
      for (var j = 0; j < (b.rating || 0); j++) stars += '\u2605';
      var date = (b.created_at || '').slice(0, 10);
      rows.push('<tr>' +
        '<td><img class="book-img" src="' + (b.image_url || '') + '" loading="lazy" onerror="this.style.display=\'none\'"></td>' +
        '<td><a href="' + (b.amazon_url || b.booklog_url || '#') + '" target="_blank">' + esc(b.title) + '</a></td>' +
        '<td>' + esc(b.author) + '</td>' +
        '<td>' + esc(b.publisher || '') + '</td>' +
        '<td class="rating">' + stars + '</td>' +
        '<td class="status-' + b.status_code + '">' + esc(b.status_name) + '</td>' +
        '<td>' + esc(b.category_name || '') + '</td>' +
        '<td>' + (b.pages || '') + '</td>' +
        '<td>' + date + '</td>' +
        '</tr>');
    }
    tbody.innerHTML = rows.join('');
    document.getElementById('book-count').textContent = books.length + ' / ' + window.ALL_BOOKS.length + ' \u518a';

    var ths = document.querySelectorAll('th[data-sort]');
    for (var i = 0; i < ths.length; i++) {
      var th = ths[i];
      var arrow = th.querySelector('.arrow');
      if (arrow) arrow.remove();
      if (th.dataset.sort === currentSort) {
        th.classList.add('sorted');
        th.insertAdjacentHTML('beforeend', '<span class="arrow">' + (sortAsc ? '\u25b2' : '\u25bc') + '</span>');
      } else {
        th.classList.remove('sorted');
      }
    }
  }

  // Sort click
  var ths = document.querySelectorAll('th[data-sort]');
  for (var i = 0; i < ths.length; i++) {
    ths[i].addEventListener('click', function() {
      if (currentSort === this.dataset.sort) {
        sortAsc = !sortAsc;
      } else {
        currentSort = this.dataset.sort;
        sortAsc = !DESC_SORTS[currentSort];
      }
      render();
    });
  }

  // Filter change
  var filterIds = ['status-filter', 'rating-filter', 'category-filter'];
  for (var i = 0; i < filterIds.length; i++) {
    document.getElementById(filterIds[i]).addEventListener('change', render);
  }

  // Search
  var searchTimer;
  document.getElementById('search').addEventListener('input', function() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(render, 200);
  });

  // Init
  render();
})();
