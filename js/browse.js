/* =============================================
   BROWSE PAGE — browse.js
   ============================================= */

const params = getParams();
let currentPage = 1;
let currentGenre = params.genre || '';
let currentFilter = params.filter || 'bypopularity';

const genreNames = {
  '1': 'Action', '2': 'Aventure', '4': 'Comédie', '7': 'Mystère',
  '8': 'Drame', '10': 'Fantaisie', '14': 'Horreur', '22': 'Romance',
  '24': 'Sci-Fi', '37': 'Surnaturel',
};

const filterNames = {
  'bypopularity': 'Populaires', 'airing': 'En cours', 'upcoming': 'À venir',
  'tv': 'Séries TV', 'movie': 'Films', 'ova': 'OVA', 'score': 'Mieux notés',
};

async function loadBrowse(page = 1) {
  currentPage = page;
  const grid = document.getElementById('browseGrid');
  grid.innerHTML = '<div class="loading-grid">' + Array(8).fill('<div class="skeleton-card"></div>').join('') + '</div>';

  try {
    let data;
    if (currentGenre) {
      data = await API.getByGenre(currentGenre, page);
    } else {
      const filter = document.getElementById('browseFilter').value;
      data = await API.getTopAnime(page, filter);
    }

    const animes = data.data || [];
    const lastPage = data.pagination?.last_visible_page || 1;

    renderCards('browseGrid', animes);
    buildPagination('pagination', page, Math.min(lastPage, 10), (p) => loadBrowse(p));
  } catch (e) {
    grid.innerHTML = '<div class="no-results">Erreur de chargement. Réessaie.</div>';
  }
}

function applyFilter() {
  currentGenre = '';
  document.querySelectorAll('.genre-pill').forEach(p => p.classList.remove('active'));
  document.querySelector('.genre-pill[data-genre=""]')?.classList.add('active');
  updateTitle();
  loadBrowse(1);
}

function updateTitle() {
  const titleEl = document.getElementById('browseTitle');
  if (currentGenre) {
    titleEl.textContent = genreNames[currentGenre] || 'Genre';
  } else {
    const filter = document.getElementById('browseFilter').value;
    titleEl.textContent = filterNames[filter] || 'Catalogue';
  }
}

// Genre pills
document.querySelectorAll('.genre-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.genre-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    currentGenre = pill.dataset.genre;
    updateTitle();
    loadBrowse(1);
  });
});

// Init
if (currentGenre) {
  const pill = document.querySelector(`.genre-pill[data-genre="${currentGenre}"]`);
  if (pill) {
    document.querySelectorAll('.genre-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
  }
}
if (currentFilter && currentFilter !== 'bypopularity') {
  const select = document.getElementById('browseFilter');
  if (select) select.value = currentFilter;
}
updateTitle();
loadBrowse(1);
