/* =============================================
   INDEX PAGE — main.js
   ============================================= */

let heroAnimes = [];
let heroIndex = 0;
let heroTimer = null;

async function loadHero() {
  try {
    const data = await API.getAiring(1);
    heroAnimes = (data.data || []).filter(a => a.images?.jpg?.large_image_url && a.synopsis);
    if (heroAnimes.length > 0) {
      renderHero(heroAnimes[0]);
      startHeroRotation();
    }
  } catch (e) {
    console.warn('Hero load failed:', e);
  }
}

function renderHero(anime) {
  const bg = document.getElementById('heroBg');
  const title = document.getElementById('heroTitle');
  const meta = document.getElementById('heroMeta');
  const synopsis = document.getElementById('heroSynopsis');
  const watchBtn = document.getElementById('heroWatchBtn');
  const infoBtn = document.getElementById('heroInfoBtn');

  bg.style.backgroundImage = `url('${anime.images?.jpg?.large_image_url || ''}')`;
  title.textContent = anime.title || 'Titre inconnu';

  const score = anime.score ? `<span class="meta-score">★ ${anime.score.toFixed(1)}</span>` : '';
  const type = anime.type ? `<span class="meta-badge">${anime.type}</span>` : '';
  const year = anime.year ? `<span>${anime.year}</span>` : '';
  const eps = anime.episodes ? `<span>${anime.episodes} éps</span>` : '';
  meta.innerHTML = [score, type, year, eps].filter(Boolean).join('<span>·</span>');

  synopsis.textContent = truncate(anime.synopsis?.replace(/\[Written by MAL Rewrite\]/g, '').trim(), 200);

  watchBtn.href = `watch.html?id=${anime.mal_id}&ep=1`;
  infoBtn.href = `anime.html?id=${anime.mal_id}`;
}

function startHeroRotation() {
  clearInterval(heroTimer);
  heroTimer = setInterval(() => {
    heroIndex = (heroIndex + 1) % Math.min(heroAnimes.length, 8);
    renderHero(heroAnimes[heroIndex]);
  }, 7000);
}

async function loadSection(apiCall, gridId) {
  try {
    const data = await apiCall;
    renderCards(gridId, data.data || []);
  } catch (e) {
    const el = document.getElementById(gridId);
    if (el) el.innerHTML = '<div class="no-results">Erreur de chargement. Réessaie.</div>';
  }
}

// Init
(async () => {
  loadHero();

  // Load sections in parallel (rate-limited by API queue)
  loadSection(API.getAiring(1), 'airingGrid');
  loadSection(API.getTopAnime(1, 'score'), 'topGrid');
  loadSection(API.getSeasonal(), 'seasonalGrid');
  loadSection(API.getPopular(1), 'popularGrid');
})();
