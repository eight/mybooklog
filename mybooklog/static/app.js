// blg - booklog viewer
(function() {
  'use strict';

  var ROW_HEIGHT = 74;
  var CARD_ROW_HEIGHT = 340;
  var BUFFER = 10;
  var COL_COUNT = 10; // number of table columns

  var DESC_SORTS = { rating: 1, created_at: 1, read_at: 1, pages: 1 };
  var currentSort = 'created_at';
  var sortAsc = false;
  var viewMode = 'table';
  var currentTab = 'all';
  var currentBooks = [];

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

  function stars(n) {
    var s = '';
    for (var i = 0; i < (n || 0); i++) s += '\u2605';
    return s;
  }

  function getFiltered() {
    var books = window.ALL_BOOKS;
    var rating = document.getElementById('rating-filter').value;
    var category = document.getElementById('category-filter').value;
    var reviewFilter = document.getElementById('review-filter').value;
    var search = document.getElementById('search').value.toLowerCase();

    if (currentTab !== 'all' && currentTab !== 'stats') {
      books = books.filter(function(b) { return b.status_code == currentTab; });
    }
    if (rating) books = books.filter(function(b) { return b.rating == rating; });
    if (category) books = books.filter(function(b) { return b.category_name === category; });
    if (reviewFilter === 'has') books = books.filter(function(b) { return b.review; });
    if (reviewFilter === 'none') books = books.filter(function(b) { return !b.review; });
    if (search) books = books.filter(function(b) {
      return (b.title + ' ' + b.author + ' ' + (b.authors || '') + ' ' + (b.publisher || '') + ' ' + (b.tags || '') + ' ' + (b.review || '')).toLowerCase().indexOf(search) >= 0;
    });

    books = books.slice().sort(function(a, b) {
      var va = a[currentSort] || '';
      var vb = b[currentSort] || '';
      return sortAsc ? cmp(va, vb) : cmp(vb, va);
    });

    return books;
  }

  // --- Table virtual scroll ---

  function buildRow(b) {
    var date = (b.created_at || '').slice(0, 10);
    var readDate = (b.read_at || '').slice(0, 10);
    var link = b.amazon_url || b.booklog_url || '#';
    var reviewHtml = b.review ? '<div class="book-review">' + esc(b.review) + '</div>' : '';
    return '<tr>' +
      '<td class="col-img"><img class="book-img" src="' + esc(b.image_url || '') + '" loading="lazy" onerror="this.style.visibility=\'hidden\'"></td>' +
      '<td class="col-title"><a class="book-title" href="' + esc(link) + '" target="_blank">' + esc(b.title) + '</a>' +
        '<div class="book-author">' + esc(b.author) + '</div>' + reviewHtml + '</td>' +
      '<td class="pub-cell">' + esc(b.publisher || '') + '</td>' +
      '<td class="rating">' + stars(b.rating) + '</td>' +
      '<td><span class="badge badge-' + b.status_code + '">' + esc(b.status_name) + '</span></td>' +
      '<td class="cat-cell">' + esc(b.category_name || '') + '</td>' +
      '<td class="pages-cell">' + (b.pages || '') + '</td>' +
      '<td class="date-cell">' + date + '</td>' +
      '<td class="date-cell">' + readDate + '</td>' +
      '</tr>';
  }

  var tableScroll = document.querySelector('.table-scroll');
  var tbody = document.getElementById('book-tbody');

  function renderTableSlice() {
    var scrollTop = tableScroll.scrollTop;
    var viewH = tableScroll.clientHeight;
    var total = currentBooks.length;

    var start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER);
    var end = Math.min(total, Math.ceil((scrollTop + viewH) / ROW_HEIGHT) + BUFFER);

    var topH = start * ROW_HEIGHT;
    var bottomH = Math.max(0, (total - end) * ROW_HEIGHT);

    var rows = [];
    if (topH > 0) rows.push('<tr class="vspacer" style="height:' + topH + 'px"><td colspan="' + COL_COUNT + '"></td></tr>');
    for (var i = start; i < end; i++) {
      rows.push(buildRow(currentBooks[i]));
    }
    if (bottomH > 0) rows.push('<tr class="vspacer" style="height:' + bottomH + 'px"><td colspan="' + COL_COUNT + '"></td></tr>');

    tbody.innerHTML = rows.join('');
  }

  var tableRaf = 0;
  tableScroll.addEventListener('scroll', function() {
    if (tableRaf) return;
    tableRaf = requestAnimationFrame(function() {
      tableRaf = 0;
      renderTableSlice();
    });
  });

  // --- Card virtual scroll ---

  var cardScroll = document.getElementById('card-scroll');
  var cardSpacer = document.getElementById('card-spacer');
  var cardContainer = document.getElementById('card-container');

  function getCardsPerRow() {
    var w = cardScroll.clientWidth;
    var minCard = 176; // 160px card + 16px gap
    return Math.max(1, Math.floor(w / minCard));
  }

  function buildCard(b) {
    var link = b.amazon_url || b.booklog_url || '#';
    return '<div class="book-card">' +
      '<a href="' + esc(link) + '" target="_blank">' +
        '<img class="book-card-img" src="' + esc(b.large_image_url || b.image_url || '') + '" loading="lazy" onerror="this.style.visibility=\'hidden\'">' +
      '</a>' +
      '<div class="book-card-body">' +
        '<div class="book-card-title">' + esc(b.title) + '</div>' +
        '<div class="book-card-author">' + esc(b.author) + '</div>' +
        '<div class="book-card-meta">' +
          '<span class="book-card-rating">' + stars(b.rating) + '</span>' +
          '<span class="badge badge-' + b.status_code + '">' + esc(b.status_name) + '</span>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function renderCardSlice() {
    var perRow = getCardsPerRow();
    var totalRows = Math.ceil(currentBooks.length / perRow);
    var totalH = totalRows * CARD_ROW_HEIGHT;

    cardSpacer.style.height = totalH + 'px';

    var scrollTop = cardScroll.scrollTop;
    var viewH = cardScroll.clientHeight;

    var startRow = Math.max(0, Math.floor(scrollTop / CARD_ROW_HEIGHT) - 2);
    var endRow = Math.min(totalRows, Math.ceil((scrollTop + viewH) / CARD_ROW_HEIGHT) + 2);

    var startIdx = startRow * perRow;
    var endIdx = Math.min(currentBooks.length, endRow * perRow);

    var cards = [];
    for (var i = startIdx; i < endIdx; i++) {
      cards.push(buildCard(currentBooks[i]));
    }

    cardContainer.innerHTML = cards.join('');
    cardContainer.style.transform = 'translateY(' + (startRow * CARD_ROW_HEIGHT) + 'px)';
  }

  var cardRaf = 0;
  cardScroll.addEventListener('scroll', function() {
    if (cardRaf) return;
    cardRaf = requestAnimationFrame(function() {
      cardRaf = 0;
      renderCardSlice();
    });
  });

  // --- Render dispatch ---

  function render() {
    currentBooks = getFiltered();

    document.getElementById('book-count').textContent =
      currentBooks.length + ' / ' + window.ALL_BOOKS.length + ' \u518a';

    if (viewMode === 'table') {
      tableScroll.scrollTop = 0;
      renderTableSlice();
    } else {
      cardScroll.scrollTop = 0;
      renderCardSlice();
    }

    // Update sort indicators
    var ths = document.querySelectorAll('th[data-sort]');
    for (var i = 0; i < ths.length; i++) {
      var th = ths[i];
      var arrow = th.querySelector('.arrow');
      if (arrow) arrow.remove();
      if (th.dataset.sort === currentSort) {
        th.classList.add('sorted');
        th.insertAdjacentHTML('beforeend',
          '<span class="arrow">' + (sortAsc ? '\u25b2' : '\u25bc') + '</span>');
      } else {
        th.classList.remove('sorted');
      }
    }
  }

  function setViewMode(mode) {
    viewMode = mode;
    var btns = document.querySelectorAll('.view-toggle button');

    if (mode === 'table') {
      tableScroll.classList.remove('hidden');
      cardScroll.classList.add('hidden');
      btns[0].classList.add('active');
      btns[1].classList.remove('active');
    } else {
      tableScroll.classList.add('hidden');
      cardScroll.classList.remove('hidden');
      btns[0].classList.remove('active');
      btns[1].classList.add('active');
    }
    render();
  }

  function switchTab(tab) {
    currentTab = tab;

    var tabs = document.querySelectorAll('.tab-bar .tab');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].classList.toggle('active', tabs[i].dataset.tab === tab);
    }

    var booksView = document.getElementById('books-view');
    var statsView = document.getElementById('stats-view');
    if (tab === 'stats') {
      booksView.classList.add('hidden');
      statsView.classList.remove('hidden');
    } else {
      booksView.classList.remove('hidden');
      statsView.classList.add('hidden');
      render();
    }

    var controls = document.querySelector('.controls');
    var inputs = controls.querySelectorAll('input, select, button');
    for (var i = 0; i < inputs.length; i++) {
      inputs[i].disabled = (tab === 'stats');
    }
    controls.classList.toggle('disabled', tab === 'stats');
  }

  // Calibrate row height from first rendered row
  function calibrate() {
    if (currentBooks.length === 0) return;
    var rows = tbody.querySelectorAll('tr:not(.vspacer)');
    if (rows.length > 0) {
      var h = rows[0].offsetHeight;
      if (h > 0) ROW_HEIGHT = h;
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

  // Tab click
  var tabBtns = document.querySelectorAll('.tab-bar .tab');
  for (var i = 0; i < tabBtns.length; i++) {
    tabBtns[i].addEventListener('click', function() {
      switchTab(this.dataset.tab);
    });
  }

  // Filter change
  var filterIds = ['rating-filter', 'category-filter', 'review-filter'];
  for (var i = 0; i < filterIds.length; i++) {
    document.getElementById(filterIds[i]).addEventListener('change', render);
  }

  // Search
  var searchTimer;
  document.getElementById('search').addEventListener('input', function() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(render, 200);
  });

  // Reset filters
  var resetBtn = document.getElementById('reset-filters');
  if (resetBtn) {
    resetBtn.addEventListener('click', function() {
      document.getElementById('search').value = '';
      for (var i = 0; i < filterIds.length; i++) {
        document.getElementById(filterIds[i]).value = '';
      }
      switchTab('all');
    });
  }

  // View toggle
  var viewBtns = document.querySelectorAll('.view-toggle button');
  for (var i = 0; i < viewBtns.length; i++) {
    viewBtns[i].addEventListener('click', function() {
      setViewMode(this.dataset.view);
    });
  }

  // Resize: recalculate card layout
  var resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      if (viewMode === 'card') renderCardSlice();
    }, 150);
  });

  // Init
  render();
  calibrate();
})();
