// SVG Items Data Store - Organized by Platform & HD Suites
const svgData = [
  // HD Platform Suite Banners
  {
    id: 'claude-suite-hd',
    title: 'Anthropic Claude 3.7 Sonnet HD Suite',
    category: 'claude',
    path: 'svgs/mascots/claude-suite-hd.svg',
    desc: 'High-definition 3D Claude Code agent suite banner.'
  },
  {
    id: 'codex-suite-hd',
    title: 'OpenAI GPT-4.5 & Codex HD Suite',
    category: 'openai',
    path: 'svgs/mascots/codex-suite-hd.svg',
    desc: 'High-definition 3D OpenAI / Codex agent suite banner.'
  },
  {
    id: 'cursor-suite-hd',
    title: 'Cursor IDE Auto-Tab HD Suite',
    category: 'cursor',
    path: 'svgs/mascots/cursor-suite-hd.svg',
    desc: 'High-definition 3D Cursor AI agent suite banner.'
  },
  {
    id: 'gemini-suite-hd',
    title: 'Google Gemini & Antigravity HD Suite',
    category: 'gemini',
    path: 'svgs/mascots/gemini-suite-hd.svg',
    desc: 'High-definition 3D Google Antigravity zero-G suite banner.'
  },
  {
    id: 'deepseek-suite-hd',
    title: 'DeepSeek V3 Ocean Reasoning HD Suite',
    category: 'deepseek',
    path: 'svgs/mascots/deepseek-suite-hd.svg',
    desc: 'High-definition 3D DeepSeek whale agent suite banner.'
  },
  {
    id: 'copilot-suite-hd',
    title: 'GitHub Copilot Workspace HD Suite',
    category: 'copilot',
    path: 'svgs/mascots/copilot-suite-hd.svg',
    desc: 'High-definition 3D GitHub Copilot agent suite banner.'
  },

  // Claude Platform SVGs
  {
    id: 'claude-mascot',
    title: 'Claude Code (Official 3D Mascot)',
    category: 'claude',
    path: 'svgs/mascots/claude-mascot.svg',
    desc: 'Official 3D Claude terracotta mascot carrying samurai tools.'
  },
  {
    id: 'claude-sleeping',
    title: 'Claude Sleeping on 200K Tokens',
    category: 'claude',
    path: 'svgs/mascots/claude-sleeping.svg',
    desc: 'Claude sleeping peacefully on a pile of 200k context tokens.'
  },
  {
    id: 'claude-debugging',
    title: 'Claude Detective Debugging',
    category: 'claude',
    path: 'svgs/mascots/claude-debugging.svg',
    desc: 'Claude in a Sherlock hat with a magnifying glass burning a red bug.'
  },
  {
    id: 'claude-jumping',
    title: 'Claude Mascot (Animated Jumping)',
    category: 'claude',
    path: 'svgs/mascots/claude-jumping.svg',
    desc: 'Official 3D Claude mascot jumping with happiness.'
  },
  {
    id: 'claude-speaking',
    title: 'Claude Mascot (Speaking & Reasoning)',
    category: 'claude',
    path: 'svgs/mascots/claude-speaking.svg',
    desc: 'Official 3D Claude mascot speaking with an animated speech bubble.'
  },
  {
    id: 'claude-logo',
    title: 'Claude Official Vector Logo',
    category: 'claude',
    path: 'svgs/logos/claude-logo.svg',
    desc: 'Official Anthropic Claude star logo vector with pulse animation.'
  },

  // OpenAI / Codex Platform SVGs
  {
    id: 'codex-mascot',
    title: 'Codex / OpenAI Mascot (Official 3D Standalone)',
    category: 'openai',
    path: 'svgs/mascots/codex-mascot.svg',
    desc: 'Official 3D Codex agent mascot carrying tools.'
  },
  {
    id: 'codex-hallucinating',
    title: 'Codex 100% Confident Hallucination',
    category: 'openai',
    path: 'svgs/mascots/codex-hallucinating.svg',
    desc: 'Codex in a party hat floating fake math equations with 100% confidence.'
  },
  {
    id: 'codex-jumping',
    title: 'Codex Mascot (Animated Jumping)',
    category: 'openai',
    path: 'svgs/mascots/codex-jumping.svg',
    desc: 'Official 3D Codex mascot jumping happily.'
  },
  {
    id: 'codex-speaking',
    title: 'Codex Mascot (Speaking)',
    category: 'openai',
    path: 'svgs/mascots/codex-speaking.svg',
    desc: 'Official 3D Codex mascot speaking with an animated speech bubble.'
  },
  {
    id: 'openai-logo',
    title: 'OpenAI Official Vector Logo',
    category: 'openai',
    path: 'svgs/logos/openai-logo.svg',
    desc: 'Official OpenAI spiral vector logo with rotation animation.'
  },

  // Cursor Platform SVGs
  {
    id: 'cursor-mascot',
    title: 'Cursor Mascot (Official 3D Standalone)',
    category: 'cursor',
    path: 'svgs/mascots/cursor-mascot.svg',
    desc: 'Official 3D Cursor dark olive mascot carrying tools.'
  },
  {
    id: 'cursor-rage-autotab',
    title: 'Cursor Gamer Headphones Auto-Tab Rampage',
    category: 'cursor',
    path: 'svgs/mascots/cursor-rage-autotab.svg',
    desc: 'Cursor wearing gamer headphones furiously slamming TAB keys with green code lightning.'
  },
  {
    id: 'cursor-logo',
    title: 'Cursor Official Vector Logo',
    category: 'cursor',
    path: 'svgs/logos/cursor-logo.svg',
    desc: 'Official Cursor IDE vector logo with glow animation.'
  },

  // Google Gemini / Antigravity Platform SVGs
  {
    id: 'gemini-mascot',
    title: 'Gemini Mascot (Official 3D Standalone)',
    category: 'gemini',
    path: 'svgs/mascots/gemini-mascot.svg',
    desc: 'Official 3D Google Gemini mascot with 4-point sparkle core.'
  },
  {
    id: 'gemini-levitating',
    title: 'Google Antigravity Zero-G Levitating',
    category: 'gemini',
    path: 'svgs/mascots/gemini-levitating.svg',
    desc: 'Gemini 3D mascot levitating in zero-G with glowing orbital rings.'
  },
  {
    id: 'gemini-jumping',
    title: 'Gemini Mascot (Animated Jumping)',
    category: 'gemini',
    path: 'svgs/mascots/gemini-jumping.svg',
    desc: 'Official 3D Gemini mascot jumping with joy.'
  },
  {
    id: 'gemini-speaking',
    title: 'Gemini Mascot (Speaking)',
    category: 'gemini',
    path: 'svgs/mascots/gemini-speaking.svg',
    desc: 'Official 3D Gemini mascot speaking with a speech bubble.'
  },
  {
    id: 'gemini-logo',
    title: 'Gemini Official Vector Logo',
    category: 'gemini',
    path: 'svgs/logos/gemini-logo.svg',
    desc: 'Official Google Gemini 4-point star vector logo.'
  },

  // DeepSeek Platform SVGs
  {
    id: 'deepseek-mascot',
    title: 'DeepSeek (Whale Mascot)',
    category: 'deepseek',
    path: 'svgs/mascots/deepseek-mascot.svg',
    desc: 'Official DeepSeek blue whale mascot with animated blowhole spout.'
  },
  {
    id: 'deepseek-diving',
    title: 'DeepSeek Scuba Goggles Deep Dive',
    category: 'deepseek',
    path: 'svgs/mascots/deepseek-diving.svg',
    desc: 'DeepSeek whale in scuba goggles diving deep into ocean code.'
  },

  // GitHub Copilot Platform SVGs
  {
    id: 'copilot-mascot',
    title: 'GitHub Copilot (Visor Mascot)',
    category: 'copilot',
    path: 'svgs/mascots/copilot-mascot.svg',
    desc: 'Official GitHub Copilot avatar with glowing cyan scanning visor.'
  },
  {
    id: 'copilot-ninja',
    title: 'GitHub Copilot Ninja Stealth',
    category: 'copilot',
    path: 'svgs/mascots/copilot-ninja.svg',
    desc: 'Copilot wearing ninja headband stealthily inserting code snippets.'
  },

  // Banners & Badges
  {
    id: 'banner-pills',
    title: 'AI Coding Tools Banner Pills',
    category: 'banners',
    path: 'svgs/banners/banner-pills.svg',
    desc: 'Official banner pills showing Claude Code, Codex, Cursor, Gemini, DeepSeek, Copilot.'
  },
  {
    id: 'banner-models',
    title: 'AI Models Banner',
    category: 'banners',
    path: 'svgs/banners/banner-models.svg',
    desc: 'Official AI Models banner with Claude 3.7 Sonnet, GPT-4.5, Gemini 2.0 Flash, DeepSeek V3.'
  },
  {
    id: 'banner-arena',
    title: 'Vibe Coding Arena Hero Banner',
    category: 'banners',
    path: 'svgs/banners/banner-vibe-coding-arena.svg',
    desc: 'Full-width dashboard arena with live indicators and AI agent status.'
  },
  {
    id: 'banner-workflow',
    title: 'Agentic Engineering Workflow Banner',
    category: 'banners',
    path: 'svgs/banners/banner-agentic-workflow.svg',
    desc: 'Animated flowchart: Prompt ➔ Hallucination ➔ Loop ➔ Ship.'
  },
  {
    id: 'zero-human',
    title: '0% Code Written By Human',
    category: 'badges',
    path: 'svgs/badges/zero-human-code.svg',
    desc: 'Pulsing neon green badge certifying zero human keystrokes.'
  },
  {
    id: 'prompt-pray',
    title: 'Prompt & Pray Strategy',
    category: 'badges',
    path: 'svgs/badges/prompt-and-pray.svg',
    desc: 'Floating praying hands testing methodology badge.'
  },
  {
    id: 'context-exceeded',
    title: 'Context Window 99.9%',
    category: 'badges',
    path: 'svgs/badges/context-exceeded.svg',
    desc: 'Warning badge with pulsing red border and progress bar.'
  },
  {
    id: 'vibe-certified',
    title: 'Vibe Coding Certified',
    category: 'badges',
    path: 'svgs/badges/vibe-certified.svg',
    desc: 'Shimmering metallic gold standard certification badge.'
  },
  {
    id: 'ai-reviewer',
    title: 'AI Code Reviewer Approved',
    category: 'badges',
    path: 'svgs/badges/ai-reviewer-approved.svg',
    desc: 'Winking checkmark badge (Approved without reading).'
  },
  {
    id: 'refactored-claude',
    title: 'Refactored Legacy Code',
    category: 'badges',
    path: 'svgs/badges/refactored-by-claude.svg',
    desc: 'Animated flame burning away old code debt.'
  },
  {
    id: 'yolo-deploy',
    title: 'YOLO Production Deploy',
    category: 'badges',
    path: 'svgs/badges/yolo-deploy.svg',
    desc: 'Shaking rocket booster deploy badge.'
  }
];

// Theme Palette colors for Custom Badge Generator
const themePalettes = {
  green: { labelBg: '#18181b', statusBg1: '#059669', statusBg2: '#10b981', textColor: '#ffffff' },
  cyan: { labelBg: '#0f172a', statusBg1: '#0284c7', statusBg2: '#06b6d4', textColor: '#ffffff' },
  purple: { labelBg: '#18181b', statusBg1: '#7c3aed', statusBg2: '#a855f7', textColor: '#ffffff' },
  gold: { labelBg: '#1e1b4b', statusBg1: '#d97706', statusBg2: '#fbbf24', textColor: '#451a03' },
  red: { labelBg: '#18181b', statusBg1: '#dc2626', statusBg2: '#f87171', textColor: '#ffffff' },
  pink: { labelBg: '#18181b', statusBg1: '#db2777', statusBg2: '#f43f5e', textColor: '#ffffff' }
};

let activeCategory = 'all';
let searchQuery = '';
let selectedTheme = 'green';

// Initialize Gallery
document.addEventListener('DOMContentLoaded', () => {
  renderGallery();
  setupFilterEvents();
  setupSearchEvent();
  setupCustomBadgeGenerator();
});

// Render Gallery Cards
function renderGallery() {
  const grid = document.getElementById('gallery-grid');
  grid.innerHTML = '';

  const filtered = svgData.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">No SVGs matched your search query.</div>`;
    return;
  }

  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-header">
        <h3 class="card-title">${item.title}</h3>
        <span class="card-category">${item.category}</span>
      </div>
      <div class="card-preview">
        <img src="${item.path}" alt="${item.title}" loading="lazy" />
      </div>
      <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">${item.desc}</p>
      <div class="card-actions">
        <button class="btn btn-secondary" onclick="copyMarkdown('${item.title}', '${item.path}')">📋 Markdown</button>
        <button class="btn btn-primary" onclick="downloadSVG('${item.path}')">📥 Download</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Filter button events
function setupFilterEvents() {
  const buttons = document.querySelectorAll('.filter-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.getAttribute('data-category');
      renderGallery();
    });
  });
}

// Search input event
function setupSearchEvent() {
  const input = document.getElementById('search-input');
  input.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderGallery();
  });
}

// Copy Markdown Helper
window.copyMarkdown = (title, path) => {
  const rawUrl = `https://raw.githubusercontent.com/imMamdouhaboammar/vibe-svgs/main/${path}`;
  const markdown = `![${title}](${rawUrl})`;
  navigator.clipboard.writeText(markdown).then(() => {
    showToast('Markdown snippet copied to clipboard! 📋');
  });
};

// Download SVG Helper
window.downloadSVG = (path) => {
  const link = document.createElement('a');
  link.href = path;
  link.download = path.split('/').pop();
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Show Toast
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.innerText = msg;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

// Custom Badge Generator
function setupCustomBadgeGenerator() {
  const labelInput = document.getElementById('badge-label');
  const statusInput = document.getElementById('badge-status');
  const themeBtns = document.querySelectorAll('.theme-btn');
  const previewBox = document.getElementById('builder-svg-preview');

  function updateCustomBadge() {
    const labelText = labelInput.value || 'vibe coding';
    const statusText = statusInput.value || '100% UNCHECKED 🚀';
    const theme = themePalettes[selectedTheme];

    const labelWidth = Math.max(80, labelText.length * 8 + 20);
    const statusWidth = Math.max(100, statusText.length * 8 + 30);
    const totalWidth = labelWidth + statusWidth;

    const svgMarkup = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} 40" width="${totalWidth}" height="40">
  <defs>
    <linearGradient id="custom-badge-bg" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${theme.statusBg1}" />
      <stop offset="100%" stop-color="${theme.statusBg2}" />
    </linearGradient>
  </defs>
  <style>
    .custom-label-bg { fill: ${theme.labelBg}; }
    .custom-status-bg { fill: url(#custom-badge-bg); }
    .custom-pulse { animation: custom-p 1.5s infinite ease-in-out alternate; }
    @keyframes custom-p { 0% { opacity: 0.5; } 100% { opacity: 1; } }
    .custom-text-l { font-family: system-ui, sans-serif; font-weight: 700; fill: #e4e4e7; font-size: 12px; }
    .custom-text-s { font-family: system-ui, sans-serif; font-weight: 800; fill: ${theme.textColor}; font-size: 12px; }
  </style>
  <path d="M6 0 H${labelWidth} V40 H6 A6 6 0 0 1 0 34 V6 A6 6 0 0 1 6 0 Z" class="custom-label-bg" />
  <path d="M${labelWidth} 0 H${totalWidth - 6} A6 6 0 0 1 ${totalWidth} 6 V34 A6 6 0 0 1 ${totalWidth - 6} 40 H${labelWidth} Z" class="custom-status-bg" />
  <text x="14" y="25" class="custom-text-l">${escapeHtml(labelText)}</text>
  <text x="${labelWidth + 14}" y="25" class="custom-text-s custom-pulse">${escapeHtml(statusText)}</text>
</svg>
    `.trim();

    previewBox.innerHTML = svgMarkup;
  }

  labelInput.addEventListener('input', updateCustomBadge);
  statusInput.addEventListener('input', updateCustomBadge);

  themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      themeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedTheme = btn.getAttribute('data-theme');
      updateCustomBadge();
    });
  });

  document.getElementById('copy-custom-markdown').addEventListener('click', () => {
    const svgCode = previewBox.innerHTML;
    navigator.clipboard.writeText(svgCode).then(() => {
      showToast('Custom SVG code copied to clipboard! 📋');
    });
  });

  document.getElementById('download-custom-svg').addEventListener('click', () => {
    const blob = new Blob([previewBox.innerHTML], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'custom-vibe-badge.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  updateCustomBadge();
}

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
