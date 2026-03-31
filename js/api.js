/* =============================================
   JIKAN API v4 WRAPPER
   ============================================= */

const API = {
  base: 'https://api.jikan.moe/v4',
  queue: [],
  running: false,
  rateLimit: 400, // ms between requests

  async request(endpoint) {
    return new Promise((resolve, reject) => {
      this.queue.push({ endpoint, resolve, reject });
      if (!this.running) this._processQueue();
    });
  },

  async _processQueue() {
    if (this.queue.length === 0) { this.running = false; return; }
    this.running = true;
    const { endpoint, resolve, reject } = this.queue.shift();
    try {
      const res = await fetch(`${this.base}${endpoint}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      resolve(data);
    } catch (e) {
      reject(e);
    }
    setTimeout(() => this._processQueue(), this.rateLimit);
  },

  // Get top anime (paginated)
  async getTopAnime(page = 1, filter = 'bypopularity') {
    return this.request(`/top/anime?page=${page}&filter=${filter}&limit=24`);
  },

  // Get currently airing
  async getAiring(page = 1) {
    return this.request(`/top/anime?page=${page}&filter=airing&limit=18`);
  },

  // Get seasonal anime
  async getSeasonal() {
    return this.request(`/seasons/now?limit=18`);
  },

  // Get single anime
  async getAnime(id) {
    return this.request(`/anime/${id}/full`);
  },

  // Get anime episodes
  async getEpisodes(id, page = 1) {
    return this.request(`/anime/${id}/episodes?page=${page}`);
  },

  // Get anime characters
  async getCharacters(id) {
    return this.request(`/anime/${id}/characters`);
  },

  // Get anime videos (trailers)
  async getVideos(id) {
    return this.request(`/anime/${id}/videos`);
  },

  // Search anime
  async search(query, page = 1, params = {}) {
    const q = encodeURIComponent(query);
    const extra = Object.entries(params)
      .filter(([, v]) => v)
      .map(([k, v]) => `&${k}=${v}`)
      .join('');
    return this.request(`/anime?q=${q}&page=${page}&limit=24${extra}`);
  },

  // Get anime by genre
  async getByGenre(genreId, page = 1) {
    return this.request(`/anime?genres=${genreId}&page=${page}&limit=24&order_by=score&sort=desc`);
  },

  // Get popular (by members)
  async getPopular(page = 1) {
    return this.request(`/top/anime?page=${page}&filter=bypopularity&limit=18`);
  },

  // Recommendations for an anime
  async getRecommendations(id) {
    return this.request(`/anime/${id}/recommendations`);
  },
};

/* =============================================
   SHARED UTILITIES
   ============================================= */

function showToast(msg, duration = 3000) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}

function showComingSoon() {
  showToast('🚀 Fonctionnalité bientôt disponible !');
}

function scoreColor(score) {
  if (score >= 8) return '#22c55e';
  if (score >= 6.5) return '#eab308';
  return '#ef4444';
}

function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
  return n?.toString() || '?';
}

function truncate(str, maxLen) {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
}

function getParams() {
  const p = {};
  new URLSearchParams(window.location.search).forEach((v, k) => p[k] = v);
  return p;
}

function buildAnimeCard(anime, opts = {}) {
  const id = anime.mal_id;
  const title = anime.title || anime.title_english || 'Titre inconnu';
  const img = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || '';
  const score = anime.score ? anime.score.toFixed(1) : 'N/A';
  const type = anime.type || '';
  const year = anime.year || anime.aired?.prop?.from?.year || '';
  const isAiring = anime.status === 'Currently Airing';
  const isMovie = type === 'Movie';

  const badge = isAiring
    ? '<span class="card-badge airing">LIVE</span>'
    : isMovie
      ? '<span class="card-badge movie">FILM</span>'
      : type === 'OVA' ? '<span class="card-badge">OVA</span>' : '';

  return `
    <div class="anime-card" onclick="window.location.href='anime.html?id=${id}'">
      <img src="${img}" alt="${title}" loading="lazy" />
      ${badge}
      <div class="card-overlay">
        <div class="card-play-btn" onclick="event.stopPropagation(); window.location.href='watch.html?id=${id}&ep=1'">▶</div>
        <div class="card-info-hover">
          <div class="card-score-hover">★ ${score}</div>
          <div>${type}${year ? ' · ' + year : ''}</div>
        </div>
      </div>
      <div class="card-bottom">
        <div class="card-title">${title}</div>
        <div class="card-meta">${type}${year ? ' · ' + year : ''}${score !== 'N/A' ? ' · ★ ' + score : ''}</div>
      </div>
    </div>
  `;
}

function renderCards(containerId, animes) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!animes || animes.length === 0) {
    el.innerHTML = '<div class="no-results">Aucun anime trouvé.</div>';
    return;
  }
  el.innerHTML = animes.map(a => buildAnimeCard(a)).join('');
}

function buildPagination(containerId, currentPage, lastPage, onPage) {
  const el = document.getElementById(containerId);
  if (!el) return;

  const pages = [];
  const delta = 2;
  for (let i = 1; i <= lastPage; i++) {
    if (i === 1 || i === lastPage || (i >= currentPage - delta && i <= currentPage + delta)) {
      pages.push(i);
    }
  }

  let html = `<button class="page-btn page-btn-prev" ${currentPage === 1 ? 'disabled' : ''} onclick="(${onPage.toString()})(${currentPage - 1})">← Préc.</button>`;

  let prev = null;
  for (const p of pages) {
    if (prev && p - prev > 1) html += `<span style="padding:0 6px;color:var(--text3)">…</span>`;
    html += `<button class="page-btn ${p === currentPage ? 'active' : ''}" onclick="(${onPage.toString()})(${p})">${p}</button>`;
    prev = p;
  }

  html += `<button class="page-btn page-btn-next" ${currentPage === lastPage ? 'disabled' : ''} onclick="(${onPage.toString()})(${currentPage + 1})">Suiv. →</button>`;
  el.innerHTML = html;
}

// Navbar scroll effect
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (nav) {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  }
});

function toggleMobileMenu() {
  document.getElementById('mobileMenu')?.classList.toggle('open');
}
