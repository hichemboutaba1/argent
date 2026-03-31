/* =============================================
   SEARCH PAGE — search.js
   ============================================= */

const params = getParams();
let currentPage = 1;
let currentQuery = params.q || '';
let debounceTimer = null;

function doSearch(page = 1) {
  const query = document.getElementById('searchInput').value.trim();
  const type = document.getElementById('filterType').value;
  const status = document.getElementById('filterStatus').value;
  const order = document.getElementById('filterOrder').value;

  if (!query) {
    loadDefaultContent();
    return;
  }

  currentPage = page;
  currentQuery = query;

  const status_el = document.getElementById('searchStatus');
  const grid = document.getElementById('searchResults');
  status_el.textContent = `Recherche de "${query}"…`;
  grid.innerHTML = '<div class="loading-grid">' + Array(8).fill('<div class="skeleton-card"></div>').join('') + '</div>';

  const searchParams = {};
  if (type) searchParams.type = type;
  if (status) searchParams.status = status;
  if (order) searchParams.order_by = order;

  API.search(query, page, searchParams).then(data => {
    const results = data.data || [];
    const total = data.pagination?.items?.total || results.length;
    const lastPage = data.pagination?.last_visible_page || 1;

    status_el.textContent = `${total} résultat${total !== 1 ? 's' : ''} pour "${query}"`;
    renderCards('searchResults', results);

    buildPagination('pagination', page, lastPage, (p) => doSearch(p));

    // Update URL
    window.history.replaceState({}, '', `?q=${encodeURIComponent(query)}`);
  }).catch(e => {
    status_el.textContent = 'Erreur lors de la recherche. Réessaie.';
    grid.innerHTML = '<div class="no-results">Une erreur est survenue.</div>';
  });
}

async function loadDefaultContent() {
  const status_el = document.getElementById('searchStatus');
  const grid = document.getElementById('searchResults');
  status_el.textContent = 'Animes populaires';
  grid.innerHTML = '<div class="loading-grid">' + Array(8).fill('<div class="skeleton-card"></div>').join('') + '</div>';

  try {
    const data = await API.getTopAnime(1, 'bypopularity');
    renderCards('searchResults', data.data || []);
    document.getElementById('pagination').innerHTML = '';
  } catch (e) {
    grid.innerHTML = '<div class="no-results">Impossible de charger le contenu.</div>';
  }
}

// Enter key to search
document.getElementById('searchInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') doSearch(1);
});

// Debounced live search
document.getElementById('searchInput').addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const q = document.getElementById('searchInput').value.trim();
    if (q.length >= 3) doSearch(1);
    else if (q.length === 0) loadDefaultContent();
  }, 600);
});

// Init
if (currentQuery) {
  document.getElementById('searchInput').value = currentQuery;
  doSearch(1);
} else {
  loadDefaultContent();
}
