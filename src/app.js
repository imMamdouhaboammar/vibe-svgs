const categoryMeta = {
  claude: { label: 'Claude', logo: 'svgs/logos/claudecode-color.svg' },
  'claude-code': { label: 'Claude Code', logo: 'svgs/logos/claudecode-color.svg' },
  openai: { label: 'OpenAI', logo: 'svgs/logos/openai.svg' },
  codex: { label: 'Codex', logo: 'svgs/logos/codex-color.svg' },
  cursor: { label: 'Cursor', logo: 'svgs/logos/cursor.svg' },
  gemini: { label: 'Gemini', logo: 'svgs/logos/geminicli-color.svg' },
  deepseek: { label: 'DeepSeek', logo: 'svgs/logos/deepseek-color.svg' },
  copilot: { label: 'GitHub Copilot', logo: 'svgs/logos/githubcopilot.svg' },
  logos: { label: 'Official Logos', logo: 'svgs/logos/github.svg' },
  'mascot-packs': { label: 'Mascot Packs' },
  badges: { label: 'Badges' },
  banners: { label: 'Banners' },
};

const packLabels = {
  reactions: 'Reactions',
  work: 'Work',
  systems: 'Systems',
  security: 'Security',
  growth: 'Growth',
  celebration: 'Celebration',
  daily: 'Daily',
  'sprite-stories': 'Sprite Stories',
};

const themePalettes = {
  green: { labelBg: '#18181b', statusBg1: '#059669', statusBg2: '#10b981', textColor: '#ffffff' },
  cyan: { labelBg: '#0f172a', statusBg1: '#0284c7', statusBg2: '#06b6d4', textColor: '#ffffff' },
  purple: { labelBg: '#18181b', statusBg1: '#7c3aed', statusBg2: '#a855f7', textColor: '#ffffff' },
  gold: { labelBg: '#1e1b4b', statusBg1: '#d97706', statusBg2: '#fbbf24', textColor: '#451a03' },
  red: { labelBg: '#18181b', statusBg1: '#dc2626', statusBg2: '#f87171', textColor: '#ffffff' },
  pink: { labelBg: '#18181b', statusBg1: '#db2777', statusBg2: '#f43f5e', textColor: '#ffffff' }
};

let svgData = [];
let activeCategory = 'all';
let searchQuery = '';
let selectedTheme = 'green';

window.addEventListener('DOMContentLoaded', async () => {
  setupFilterEvents();
  setupSearchEvent();
  setupCustomBadgeGenerator();

  try {
    await loadAssetManifest();
    renderGallery();
  } catch (error) {
    renderGalleryError(error);
  }
});

function isSafeAssetPath(path) {
  return typeof path === 'string' && (
    /^svgs\/(?:badges|banners|logos|mascots|scenes)\/[a-z0-9][a-z0-9._-]*\.svg$/.test(path) ||
    /^svgs\/packs\/[a-z0-9-]+\/[a-z0-9][a-z0-9._-]*\.svg$/.test(path)
  );
}

function isManifestAsset(asset) {
  const hasValidPack = asset?.category !== 'mascot-packs' ||
    (typeof asset.pack === 'string' && Boolean(packLabels[asset.pack]));
  return Boolean(asset) &&
    typeof asset.id === 'string' &&
    typeof asset.title === 'string' &&
    typeof asset.description === 'string' &&
    typeof asset.category === 'string' &&
    typeof asset.type === 'string' &&
    (asset.contractVersion === 0 || asset.contractVersion === 1) &&
    hasValidPack &&
    isSafeAssetPath(asset.path);
}

async function loadAssetManifest() {
  const response = await fetch('asset-manifest.json', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Could not load asset manifest (${response.status}).`);
  }

  const manifest = await response.json();
  if (manifest.version !== 1 || !Array.isArray(manifest.assets)) {
    throw new Error('The asset manifest does not match version 1.');
  }

  const invalidIndex = manifest.assets.findIndex((asset) => !isManifestAsset(asset));
  if (invalidIndex !== -1) {
    throw new Error(`Asset manifest entry ${invalidIndex} contains invalid metadata or an unsafe path.`);
  }

  svgData = manifest.assets.map((asset) => ({
    id: asset.id,
    title: asset.title,
    category: asset.category,
    type: asset.type,
    path: asset.path,
    pack: asset.pack || '',
    packLabel: packLabels[asset.pack] || '',
    desc: asset.description,
    migrated: asset.contractVersion === 1
  }));
}

function renderGallery() {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;
  grid.replaceChildren();

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filtered = svgData.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = !normalizedQuery ||
      item.title.toLowerCase().includes(normalizedQuery) ||
      item.desc.toLowerCase().includes(normalizedQuery) ||
      item.packLabel.toLowerCase().includes(normalizedQuery);
    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    const empty = document.createElement('div');
    empty.style.gridColumn = '1 / -1';
    empty.style.textAlign = 'center';
    empty.style.color = 'var(--text-muted)';
    empty.style.padding = '40px';
    empty.textContent = 'No SVGs matched your search query.';
    grid.appendChild(empty);
    return;
  }

  for (const item of filtered) {
    grid.appendChild(createGalleryCard(item));
  }
}

function createGalleryCard(item) {
  const card = document.createElement('article');
  card.className = 'card';

  const header = document.createElement('div');
  header.className = 'card-header';

  const title = document.createElement('h3');
  title.className = 'card-title';
  title.textContent = item.title;

  const category = document.createElement('span');
  category.className = 'card-category';
  const categoryInfo = categoryMeta[item.category] || { label: item.category };
  const categoryLabel = item.category === 'mascot-packs' && packLabels[item.pack]
    ? `${categoryInfo.label} · ${packLabels[item.pack]}`
    : categoryInfo.label;
  if (categoryInfo.logo) {
    const categoryLogo = document.createElement('img');
    categoryLogo.src = categoryInfo.logo;
    categoryLogo.alt = '';
    categoryLogo.width = 14;
    categoryLogo.height = 14;
    category.append(categoryLogo, document.createTextNode(categoryLabel));
  } else {
    category.textContent = categoryLabel;
  }

  header.append(title, category);

  const preview = document.createElement('div');
  preview.className = 'card-preview';
  if (item.type === 'logo') preview.classList.add('logo-preview');
  if (item.category === 'mascot-packs') preview.classList.add('pack-preview');

  const image = document.createElement('img');
  image.src = item.path;
  image.alt = item.title;
  image.loading = 'lazy';
  preview.appendChild(image);

  const description = document.createElement('p');
  description.style.fontSize = '13px';
  description.style.color = 'var(--text-muted)';
  description.style.marginBottom = '12px';
  description.textContent = item.desc;

  const qualityState = document.createElement('p');
  qualityState.style.fontSize = '11px';
  qualityState.style.marginBottom = '16px';
  qualityState.style.color = item.migrated ? 'var(--success, #10b981)' : 'var(--text-muted)';
  qualityState.textContent = item.category === 'mascot-packs'
    ? 'Verified motion pack'
    : item.migrated ? 'Verified SVG contract' : 'Source artwork';

  const actions = document.createElement('div');
  actions.className = 'card-actions';

  const copyButton = document.createElement('button');
  copyButton.className = 'btn btn-secondary';
  copyButton.type = 'button';
  copyButton.textContent = 'Copy Markdown';
  copyButton.addEventListener('click', () => copyMarkdown(item.title, item.path));

  const downloadButton = document.createElement('button');
  downloadButton.className = 'btn btn-primary';
  downloadButton.type = 'button';
  downloadButton.textContent = 'Download SVG';
  downloadButton.addEventListener('click', () => downloadSVG(item.path));

  actions.append(copyButton, downloadButton);
  card.append(header, preview, description, qualityState, actions);
  return card;
}

function renderGalleryError(error) {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;
  const message = error instanceof Error ? error.message : String(error);
  grid.innerHTML = '';

  const errorBox = document.createElement('div');
  errorBox.style.gridColumn = '1 / -1';
  errorBox.style.textAlign = 'center';
  errorBox.style.color = 'var(--text-muted)';
  errorBox.style.padding = '40px';
  errorBox.textContent = `The gallery could not load: ${message}`;
  grid.appendChild(errorBox);
}

function setupFilterEvents() {
  const buttons = document.querySelectorAll('.filter-btn');
  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      buttons.forEach((candidate) => candidate.classList.remove('active'));
      button.classList.add('active');
      activeCategory = button.getAttribute('data-category') || 'all';
      renderGallery();
    });
  });
}

function setupSearchEvent() {
  const input = document.getElementById('search-input');
  if (!input) return;
  input.addEventListener('input', (event) => {
    searchQuery = event.target.value;
    renderGallery();
  });
}

async function copyMarkdown(title, path) {
  const rawUrl = `https://raw.githubusercontent.com/imMamdouhaboammar/vibe-svgs/main/${path}`;
  const markdown = `![${title}](${rawUrl})`;
  try {
    await navigator.clipboard.writeText(markdown);
    showToast('Markdown snippet copied.');
  } catch {
    showToast('Clipboard access was blocked.');
  }
}

function downloadSVG(path) {
  const link = document.createElement('a');
  link.href = path;
  link.download = path.split('/').pop() || 'vibe-asset.svg';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.innerText = message;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 2500);
}

function setupCustomBadgeGenerator() {
  const labelInput = document.getElementById('badge-label');
  const statusInput = document.getElementById('badge-status');
  const previewBox = document.getElementById('builder-svg-preview');
  const themeButtons = document.querySelectorAll('.theme-btn');
  const copyButton = document.getElementById('copy-custom-markdown');
  const downloadButton = document.getElementById('download-custom-svg');

  if (!labelInput || !statusInput || !previewBox || !copyButton || !downloadButton) return;

  const updateCustomBadge = () => {
    const labelText = labelInput.value || 'vibe coding';
    const statusText = statusInput.value || '100% UNCHECKED';
    const theme = themePalettes[selectedTheme];
    const labelWidth = Math.max(80, labelText.length * 8 + 20);
    const statusWidth = Math.max(100, statusText.length * 8 + 30);
    const totalWidth = labelWidth + statusWidth;
    const safeLabel = escapeHtml(labelText);
    const safeStatus = escapeHtml(statusText);

    previewBox.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} 40" width="${totalWidth}" height="40" role="img" aria-labelledby="custom-badge-title custom-badge-desc">
  <title id="custom-badge-title">${safeLabel}: ${safeStatus}</title>
  <desc id="custom-badge-desc">A user-generated animated project badge.</desc>
  <defs>
    <linearGradient id="custom-badge-background-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${theme.statusBg1}" />
      <stop offset="100%" stop-color="${theme.statusBg2}" />
    </linearGradient>
  </defs>
  <style>
    .custom-badge-label-background { fill: ${theme.labelBg}; }
    .custom-badge-status-background { fill: url(#custom-badge-background-gradient); }
    .custom-badge-pulse { animation: custom-badge-pulse-motion 1.5s infinite ease-in-out alternate; }
    @keyframes custom-badge-pulse-motion { from { opacity: .62; } to { opacity: 1; } }
    .custom-badge-label-text { font-family: system-ui, sans-serif; font-weight: 700; fill: #e4e4e7; font-size: 12px; }
    .custom-badge-status-text { font-family: system-ui, sans-serif; font-weight: 800; fill: ${theme.textColor}; font-size: 12px; }
    @media (prefers-reduced-motion: reduce) { .custom-badge-pulse { animation: none !important; } }
  </style>
  <path d="M6 0 H${labelWidth} V40 H6 A6 6 0 0 1 0 34 V6 A6 6 0 0 1 6 0 Z" class="custom-badge-label-background" />
  <path d="M${labelWidth} 0 H${totalWidth - 6} A6 6 0 0 1 ${totalWidth} 6 V34 A6 6 0 0 1 ${totalWidth - 6} 40 H${labelWidth} Z" class="custom-badge-status-background" />
  <text x="14" y="25" class="custom-badge-label-text">${safeLabel}</text>
  <text x="${labelWidth + 14}" y="25" class="custom-badge-status-text custom-badge-pulse">${safeStatus}</text>
</svg>`.trim();
  };

  labelInput.addEventListener('input', updateCustomBadge);
  statusInput.addEventListener('input', updateCustomBadge);

  themeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      themeButtons.forEach((candidate) => candidate.classList.remove('active'));
      button.classList.add('active');
      selectedTheme = button.getAttribute('data-theme') || 'green';
      updateCustomBadge();
    });
  });

  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(previewBox.innerHTML);
      showToast('Custom SVG code copied.');
    } catch {
      showToast('Clipboard access was blocked.');
    }
  });

  downloadButton.addEventListener('click', () => {
    const blob = new Blob([previewBox.innerHTML], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'custom-vibe-badge.svg';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  });

  updateCustomBadge();
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
