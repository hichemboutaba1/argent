/* =============================================
   WATCH PAGE — watch.js
   ============================================= */

const params = getParams();
const animeId = params.id;
let currentEp = parseInt(params.ep) || 1;
let animeData = null;
let episodesList = [];
let totalEps = 0;

async function initWatch() {
  if (!animeId) {
    document.getElementById('playerMessage').textContent = 'Anime introuvable.';
    return;
  }
  try {
    const data = await API.getAnime(animeId);
    animeData = data.data;
    setupPage();
    loadEpisodes();
  } catch (e) {
    document.getElementById('playerMessage').textContent = 'Erreur de chargement.';
  }
}

function setupPage() {
  const a = animeData;
  document.title = `AniStream — ${a.title} · Épisode ${currentEp}`;
  document.getElementById('watchAnimeTitle').textContent = a.title;
  document.getElementById('backToAnime').href = `anime.html?id=${animeId}`;

  // Build episode list synchronously — no API needed
  const isMovie = a.type === 'Movie';
  totalEps = isMovie ? 1 : (a.episodes || 24);
  episodesList = [];
  for (let i = 1; i <= totalEps; i++) {
    episodesList.push({ mal_id: i, title: null });
  }

  updatePlayerUI();
  loadTrailerOrPlaceholder();
  renderSidebar();
}

function updatePlayerUI() {
  const epTitle = `Épisode ${currentEp}`;
  document.getElementById('watchEpTitle').textContent = epTitle;
  document.getElementById('playerTitle').textContent = animeData?.title || '';
  document.getElementById('playerSubtitle').textContent = epTitle;

  const prevBtn = document.getElementById('prevEpBtn');
  const nextBtn = document.getElementById('nextEpBtn');
  if (prevBtn) prevBtn.disabled = currentEp <= 1;
  if (nextBtn) nextBtn.disabled = currentEp >= totalEps;
}

function loadTrailerOrPlaceholder() {
  const trailer = animeData?.trailer;
  const placeholder = document.getElementById('playerPlaceholder');
  const player = document.getElementById('youtubePlayer');

  if (trailer?.youtube_id) {
    // Play the official trailer for every episode
    player.src = `https://www.youtube.com/embed/${trailer.youtube_id}?autoplay=1&rel=0`;
    player.style.display = 'block';
    placeholder.style.display = 'none';
    document.getElementById('sourceNotice').style.display = 'flex';
    document.getElementById('sourceNotice').querySelector('.notice-text').innerHTML =
      `<strong>Trailer officiel — Épisode ${currentEp}.</strong> Les épisodes complets ne sont pas encore disponibles en streaming. Profite du trailer HD en attendant !`;
  } else {
    // No trailer available at all
    player.style.display = 'none';
    player.src = '';
    placeholder.style.display = 'flex';
    document.getElementById('playerMessage').textContent = animeData?.title || '';
    document.getElementById('playerSubMessage').textContent =
      `Aucune vidéo disponible pour l'instant. Reviens bientôt !`;
    document.getElementById('sourceNotice').style.display = 'none';
  }
}

function changeEpisode(delta) {
  const newEp = currentEp + delta;
  if (newEp < 1 || newEp > totalEps) return;
  currentEp = newEp;
  updatePlayerUI();
  loadTrailerOrPlaceholder();
  renderSidebar();
  window.history.replaceState({}, '', `?id=${animeId}&ep=${currentEp}`);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function loadEpisodes() {
  // Enrich sidebar with real episode titles (optional, sidebar already visible)
  try {
    const data = await API.getEpisodes(animeId, 1);
    const eps = data.data || [];
    if (eps.length > 0) {
      eps.forEach(ep => {
        const idx = ep.mal_id - 1;
        if (episodesList[idx]) episodesList[idx].title = ep.title || null;
      });
      renderSidebar();
    }
  } catch (e) {
    // Sidebar already showing placeholders
  }
}

function renderSidebar() {
  const container = document.getElementById('sidebarEpisodes');
  if (!container) return;

  container.innerHTML = episodesList.map(ep => {
    const num = ep.mal_id;
    const title = ep.title || `Épisode ${num}`;
    const isActive = num === currentEp;
    return `
      <div class="sidebar-ep ${isActive ? 'active' : ''}" onclick="selectEpisode(${num})">
        <div class="sidebar-ep-num">${num}</div>
        <div>
          <div class="sidebar-ep-title">${title}</div>
          <div class="sidebar-ep-meta">${animeData?.duration || '~24 min'}</div>
        </div>
      </div>
    `;
  }).join('');

  // Scroll active ep into view
  const active = container.querySelector('.sidebar-ep.active');
  if (active) active.scrollIntoView({ block: 'nearest' });
}

function selectEpisode(epNum) {
  currentEp = epNum;
  updatePlayerUI();
  loadTrailerOrPlaceholder();
  renderSidebar();
  window.history.replaceState({}, '', `?id=${animeId}&ep=${currentEp}`);
}

// Init
initWatch();
