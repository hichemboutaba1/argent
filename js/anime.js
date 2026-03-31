/* =============================================
   ANIME DETAIL PAGE — anime.js
   ============================================= */

const params = getParams();
const animeId = params.id;

let animeData = null;
let totalEpisodes = 0;
let episodesList = [];
let currentBatch = 0;
const BATCH_SIZE = 24;

async function loadAnime() {
  if (!animeId) {
    document.getElementById('animeTitle').textContent = 'Anime introuvable';
    return;
  }
  try {
    const data = await API.getAnime(animeId);
    animeData = data.data;
    renderAnimeDetail(animeData);
    loadEpisodes();
    loadCharacters();
  } catch (e) {
    console.error('Failed to load anime:', e);
    document.getElementById('animeTitle').textContent = 'Erreur de chargement';
  }
}

function renderAnimeDetail(a) {
  document.title = `AniStream — ${a.title}`;

  // Background
  const bg = document.getElementById('animeHeroBg');
  bg.style.backgroundImage = `url('${a.images?.jpg?.large_image_url || ''}')`;

  // Poster
  const poster = document.getElementById('animePoster');
  poster.src = a.images?.jpg?.large_image_url || '';
  poster.alt = a.title;

  // Score badge
  const scoreBadge = document.getElementById('animeScoreBadge');
  if (a.score) {
    scoreBadge.textContent = a.score.toFixed(1);
    scoreBadge.style.background = scoreColor(a.score);
    scoreBadge.style.display = 'flex';
  }

  // Titles
  document.getElementById('animeTitleBreadcrumb').textContent = a.title;
  document.getElementById('animeTitle').textContent = a.title;
  const alt = a.title_english && a.title_english !== a.title ? a.title_english : (a.title_japanese || '');
  document.getElementById('animeAltTitle').textContent = alt;

  // Tags (genres)
  const tags = document.getElementById('animeTags');
  const genres = [...(a.genres || []), ...(a.themes || [])];
  tags.innerHTML = genres.slice(0, 6).map(g =>
    `<a href="browse.html?genre=${g.mal_id}" class="tag">${g.name}</a>`
  ).join('');

  // Stats
  const stats = document.getElementById('animeStats');
  const statItems = [
    { label: 'Note', value: a.score ? `★ ${a.score.toFixed(1)} / 10` : 'N/A' },
    { label: 'Rang', value: a.rank ? `#${a.rank}` : 'N/A' },
    { label: 'Popularité', value: a.popularity ? `#${a.popularity}` : 'N/A' },
    { label: 'Membres', value: formatNumber(a.members) },
    { label: 'Épisodes', value: a.episodes || '?' },
    { label: 'Statut', value: translateStatus(a.status) },
    { label: 'Type', value: a.type || 'N/A' },
    { label: 'Saison', value: a.season && a.year ? `${capitalize(a.season)} ${a.year}` : (a.year || 'N/A') },
  ];
  stats.innerHTML = statItems.map(s => `
    <div class="stat-item">
      <div class="stat-label">${s.label}</div>
      <div class="stat-value">${s.value}</div>
    </div>
  `).join('');

  // Synopsis
  document.getElementById('animeSynopsis').textContent =
    a.synopsis?.replace(/\[Written by MAL Rewrite\]/g, '').trim() || 'Pas de synopsis disponible.';

  // Render details tab
  renderDetails(a);

  // Render trailer
  renderTrailer(a);

  // Related section (from recommendations)
  loadRecommendations();
}

function translateStatus(s) {
  const map = {
    'Currently Airing': 'En cours',
    'Finished Airing': 'Terminé',
    'Not yet aired': 'À venir',
  };
  return map[s] || s || 'N/A';
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

function renderTrailer(a) {
  const wrap = document.getElementById('trailerWrap');
  const trailer = a.trailer;
  if (trailer?.youtube_id) {
    wrap.innerHTML = `<iframe
      src="https://www.youtube.com/embed/${trailer.youtube_id}?rel=0"
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
    ></iframe>`;
  } else {
    wrap.innerHTML = `<div class="no-trailer">Aucun trailer disponible pour cet anime.</div>`;
  }
}

function renderDetails(a) {
  const grid = document.getElementById('detailsGrid');
  const items = [
    { label: 'Titre japonais', value: a.title_japanese },
    { label: 'Titre anglais', value: a.title_english },
    { label: 'Type', value: a.type },
    { label: 'Épisodes', value: a.episodes || '?' },
    { label: 'Durée / épisode', value: a.duration },
    { label: 'Statut', value: translateStatus(a.status) },
    { label: 'Diffusion', value: a.aired?.string || 'N/A' },
    { label: 'Saison', value: a.season && a.year ? `${capitalize(a.season)} ${a.year}` : 'N/A' },
    { label: 'Studio', value: a.studios?.map(s => s.name).join(', ') || 'N/A' },
    { label: 'Source', value: a.source },
    { label: 'Note', value: a.score ? `${a.score} / 10` : 'N/A' },
    { label: 'Rang', value: a.rank ? `#${a.rank}` : 'N/A' },
    { label: 'Popularité', value: a.popularity ? `#${a.popularity}` : 'N/A' },
    { label: 'Membres', value: formatNumber(a.members) },
    { label: 'Classification', value: a.rating || 'N/A' },
  ];
  grid.innerHTML = items
    .filter(i => i.value && i.value !== 'undefined')
    .map(i => `
      <div class="detail-item">
        <div class="detail-label">${i.label}</div>
        <div class="detail-value">${i.value}</div>
      </div>
    `).join('');
}

async function loadEpisodes(page = 1) {
  try {
    const data = await API.getEpisodes(animeId, page);
    const eps = data.data || [];

    if (eps.length > 0) {
      episodesList = eps;
      totalEpisodes = animeData?.episodes || eps.length;

      // Build batch select
      const batchCount = Math.ceil(totalEpisodes / BATCH_SIZE);
      const select = document.getElementById('episodeBatch');
      select.innerHTML = '';
      for (let i = 0; i < batchCount; i++) {
        const start = i * BATCH_SIZE + 1;
        const end = Math.min((i + 1) * BATCH_SIZE, totalEpisodes);
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = `Épisodes ${start}–${end}`;
        select.appendChild(opt);
      }

      renderEpisodeBatch();
    } else {
      // No episode data — generate placeholder episodes
      totalEpisodes = animeData?.episodes || 12;
      generatePlaceholderEpisodes();
    }
  } catch (e) {
    totalEpisodes = animeData?.episodes || 12;
    generatePlaceholderEpisodes();
  }
}

function generatePlaceholderEpisodes() {
  const batchCount = Math.ceil(totalEpisodes / BATCH_SIZE);
  const select = document.getElementById('episodeBatch');
  select.innerHTML = '';
  for (let i = 0; i < batchCount; i++) {
    const start = i * BATCH_SIZE + 1;
    const end = Math.min((i + 1) * BATCH_SIZE, totalEpisodes);
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `Épisodes ${start}–${end}`;
    select.appendChild(opt);
  }

  const eps = [];
  for (let i = 1; i <= totalEpisodes; i++) {
    eps.push({ mal_id: i, title: null, filler: false, recap: false });
  }
  episodesList = eps;
  renderEpisodeBatch();
}

function renderEpisodeBatch() {
  const batch = parseInt(document.getElementById('episodeBatch').value) || 0;
  const start = batch * BATCH_SIZE;
  const slice = episodesList.slice(start, start + BATCH_SIZE);
  const grid = document.getElementById('episodesGrid');
  const img = animeData?.images?.jpg?.image_url || '';

  grid.innerHTML = slice.map(ep => {
    const epNum = ep.mal_id;
    const title = ep.title || `Épisode ${epNum}`;
    const filler = ep.filler ? ' <span style="color:var(--yellow);font-size:.7rem">[Filler]</span>' : '';
    const recap = ep.recap ? ' <span style="color:var(--text3);font-size:.7rem">[Recap]</span>' : '';
    return `
      <div class="episode-card" onclick="window.location.href='watch.html?id=${animeId}&ep=${epNum}'">
        <div class="ep-thumb">
          <img src="${img}" alt="Episode ${epNum}" loading="lazy" />
          <div class="ep-play">▶</div>
        </div>
        <div class="ep-info">
          <div class="ep-number">Épisode ${epNum}${filler}${recap}</div>
          <div class="ep-title">${title}</div>
          <div class="ep-duration">${animeData?.duration || '~24 min'}</div>
        </div>
      </div>
    `;
  }).join('');
}

async function loadCharacters() {
  try {
    const data = await API.getCharacters(animeId);
    const chars = (data.data || []).slice(0, 18);
    const grid = document.getElementById('charactersGrid');
    if (chars.length === 0) {
      grid.innerHTML = '<p class="loading-text">Aucun personnage trouvé.</p>';
      return;
    }
    grid.innerHTML = chars.map(c => {
      const char = c.character;
      const img = char.images?.jpg?.image_url || '';
      const role = c.role === 'Main' ? 'Principal' : 'Secondaire';
      return `
        <div class="char-card">
          <img src="${img}" alt="${char.name}" loading="lazy" />
          <div class="char-name">${char.name}</div>
          <div class="char-role">${role}</div>
        </div>
      `;
    }).join('');
  } catch (e) {
    document.getElementById('charactersGrid').innerHTML = '<p class="loading-text">Impossible de charger les personnages.</p>';
  }
}

async function loadRecommendations() {
  try {
    const data = await API.getRecommendations(animeId);
    const recs = (data.data || []).slice(0, 12).map(r => r.entry);
    if (recs.length > 0) {
      const section = document.getElementById('relatedSection');
      section.style.display = 'block';
      renderCards('relatedGrid', recs);
    }
  } catch (e) {
    // silence
  }
}

function switchTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.getElementById(`tab-${name}`)?.classList.add('active');
  event.currentTarget.classList.add('active');
}

// Init
loadAnime();
