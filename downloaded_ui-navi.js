// CRM.Admin — UI navigation (clients/invoices/analytics) — UI-only
import { renderAnalyticsChart } from './analytics.js';
import { renderInvoices, checkOverdueInvoices } from './invoices.js';
import { renderClients, getFilteredClients, animateGridRefresh } from './clientsView.js';
import { renderTasks } from './tasksView.js';

function setActiveNav(navKey) {
  const navItems = document.querySelectorAll('.sidebar nav li[data-nav]');
  navItems.forEach((li) => {
    const isActive = li.getAttribute('data-nav') === navKey;
    if (isActive) li.classList.add('active');
    else li.classList.remove('active');
  });
}

// Reset shared container (clientsGrid) before switching modules.
function resetClientsGrid() {
  const grid = document.getElementById('clientsGrid');
  if (!grid) return;

  grid.removeAttribute('style');
  grid.className = 'clients-grid';
}

function hideAllModules() {
  const clientsGrid = document.getElementById('clientsGrid');
  const invoicesSection = document.getElementById('invoicesSection');
  const clientsHeader = document.getElementById('clientsHeader');
  const clientsSummaryStats = document.getElementById('clientsSummaryStats');

  if (clientsGrid) {
    clientsGrid.hidden = true;
    clientsGrid.innerHTML = '';
  }

  if (invoicesSection) {
    invoicesSection.hidden = true;
  }
  
  if (clientsHeader) clientsHeader.hidden = true;
  if (clientsSummaryStats) clientsSummaryStats.hidden = true;
}


function renderClientsHeaderLike(title, subtitle) {
  const clientsGrid = document.getElementById('clientsGrid');
  if (!clientsGrid) return;


  clientsGrid.innerHTML = `
    <div class="empty-state">
      <div class="empty-title">${String(title)}</div>
      <div class="empty-sub">${String(subtitle)}</div>
    </div>
  `;
}



function showInvoices() {
  console.log('→ showInvoices');
  hideAllModules();
  setActiveNav('invoices');

  const invoicesSection = document.getElementById('invoicesSection');

  if (invoicesSection) invoicesSection.hidden = false;


  checkOverdueInvoices();
  renderInvoices();
}


function showAnalytics() {
  hideAllModules();
  setActiveNav('analytics');
  resetClientsGrid();
  const grid = document.getElementById('clientsGrid');
  if (!grid) return;
  grid.hidden = false;



  // FIX: Chart.js в responsive mode може розтягувати контейнер в grid.
  // Даємо жорстку висоту, щоб не було “вічного” підлаштування.
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(400px, 1fr))';
  grid.style.gap = '20px';

  grid.innerHTML = `
    <div class="chart-wrapper" style="position: relative; height: 400px; width: 100%; margin: 20px auto; padding: 24px; padding-bottom:100px; border-radius: var(--radius-lg); border: 1px solid var(--border);">
      <h2 style="margin-top:0; margin-bottom: 20px; font-size:18px; font-weight:900; color: var(--text); text-align:center;">Total Pipeline Value by Status</h2>
      <canvas id="analyticsChart"></canvas>
    </div>

    <div class="chart-wrapper" style="position: relative; height: 400px; width: 100%; margin: 20px auto; padding: 24px; padding-bottom:100px; border-radius: var(--radius-lg); border: 1px solid var(--border);">
      <h2 style="margin-top:0; margin-bottom: 20px; font-size:18px; font-weight:900; color: var(--text); text-align:center;">Sales Funnel Conversion</h2>
      <canvas id="funnelChart"></canvas>
    </div>

    <div class="chart-wrapper" style="position: relative; height: 400px; width: 100%; margin: 20px auto; padding: 24px; border-radius: var(--radius-lg); border: 1px solid var(--border); overflow: hidden;">
      <h2 style="margin-top:0; margin-bottom: 18px; font-size:18px; font-weight:900; color: var(--text); text-align:center;">AI Sales Forecast</h2>

      <button id="generateAiBtn" class="btn-primary" style="width:100%; margin-bottom:15px;"><i class="fa-solid fa-wand-magic-sparkles"></i> Generate AI Forecast</button>

      <div id="aiInsightsContent">Click the button to analyze your pipeline using AI.</div>
    </div>
  `;

  setTimeout(() => {
    renderAnalyticsChart();
  }, 50);
}


function showClients() {
  hideAllModules();
  setActiveNav('clients');
  resetClientsGrid();

  const clientsGrid = document.getElementById('clientsGrid');
  const clientsHeader = document.getElementById('clientsHeader');
  const clientsSummaryStats = document.getElementById('clientsSummaryStats');
  
  if (clientsGrid) clientsGrid.hidden = false;
  if (clientsHeader) clientsHeader.hidden = false;
  if (clientsSummaryStats) clientsSummaryStats.hidden = false;

  const filtered = getFilteredClients();
  animateGridRefresh();
  renderClients(filtered);
}



function showTasks() {
  hideAllModules();
  setActiveNav('tasks');
  const tasksSection = document.getElementById('tasksSection');
  if (tasksSection) {
    tasksSection.hidden = false;
    renderTasks();
  }
}

function wireUiNavigation() {
  document.querySelectorAll('.sidebar nav li[data-nav]').forEach((li) => {
    li.addEventListener('click', () => {
      const key = li.getAttribute('data-nav');
      try {
        if (key === 'clients') return showClients();
        if (key === 'invoices') return showInvoices();
        if (key === 'analytics') return showAnalytics();
        if (key === 'tasks') return showTasks();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Navigation error:', err);
      }
    });
  });
}



function initTheme() {
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (!themeToggleBtn) return;
  
  const currentTheme = window.localStorage.getItem('crm_theme') || 'dark';
  if (currentTheme === 'light') {
    document.body.classList.add('theme-light');
    themeToggleBtn.textContent = '🌙';
  } else {
    document.body.classList.remove('theme-light');
    themeToggleBtn.textContent = '🌞';
  }

  themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('theme-light');
    const isLight = document.body.classList.contains('theme-light');
    window.localStorage.setItem('crm_theme', isLight ? 'light' : 'dark');
    themeToggleBtn.textContent = isLight ? '🌙' : '🌞';
    
    setTimeout(() => {
      if (document.querySelector('.sidebar nav li[data-nav="analytics"]').classList.contains('active')) {
        renderAnalyticsChart();
      }
    }, 50);
  });
}

function initMobileMenu() {
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('mobileOverlay');

  if (!mobileMenuBtn || !sidebar || !overlay) return;

  function closeMenu() {
    sidebar.classList.remove('sidebar-open');
    overlay.classList.remove('show');
  }

  mobileMenuBtn.addEventListener('click', () => {
    sidebar.classList.add('sidebar-open');
    overlay.classList.add('show');
  });

  overlay.addEventListener('click', closeMenu);

  document.querySelectorAll('.sidebar nav li').forEach(li => {
    li.addEventListener('click', closeMenu);
  });
}

export function initNavigation() {
  wireUiNavigation();
  initTheme();
  initMobileMenu();
  // By default show clients view on load
  showClients();
}


