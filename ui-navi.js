// CRM.Admin — UI navigation (clients/invoices/analytics) — UI-only

function setActiveNav(navKey) {
  const navItems = document.querySelectorAll('.sidebar nav li[data-nav]');
  navItems.forEach((li) => {
    const isActive = li.getAttribute('data-nav') === navKey;
    if (isActive) li.classList.add('active');
    else li.classList.remove('active');
  });
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

function getAnalyticsColors() {
  // Matches required CSS-agnostic hex palette.
  return {
    Lead: '#7C4DFF',
    Nurturing: '#F59E0B',
    Demo: '#3B82F6',
    Won: '#22C55E',
    Lost: '#EF4444',
  };
}



function hideAllSections() {


  // Only hide by CSS class to avoid layout “shifts”.
  const ids = ['clientsGrid', 'invoicesSection', 'analyticsSection'];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
}

function showSectionById(sectionId) {
  const el = document.getElementById(sectionId);
  if (el) el.classList.remove('hidden');
}


function showClients() {
  setActiveNav('clients');
  hideAllSections(); // Ховаємо всі інші секції

  const grid = document.getElementById('clientsGrid');
  if (grid) {
    // ЖОРСТКО прибираємо інлайнові стилі, які могли лишитись після аналітики/багів
    grid.removeAttribute('style');
    grid.classList.remove('hidden');
  }

  // render is owned by script.js
  if (typeof getFilteredClients === 'function' && typeof renderClients === 'function') {
    const filtered = getFilteredClients();
    if (typeof animateGridRefresh === 'function') animateGridRefresh();
    renderClients(filtered);
  }
}

function showInvoices() {
  setActiveNav('invoices');
  hideAllSections();

  const section = document.getElementById('invoicesSection');
  if (section) section.classList.remove('hidden');

  // keep placeholder; rendering of clients-grid stays in script.js
  // (do not touch clientsGrid inline styles)
}

function showAnalytics() {
  setActiveNav('analytics');
  hideAllSections(); // ХОВАЄМО КЛІЄНТІВ

  // ЗВЕРТАЄМОСЯ ДО ПРАВИЛЬНОГО КОНТЕЙНЕРА АНАЛІТИКИ!
  const analyticsContainer = document.getElementById('analyticsSection');
  if (!analyticsContainer) return;

  analyticsContainer.classList.remove('hidden');

  // 1. Налаштовуємо ідеальну сітку на 2 колонки САМЕ ДЛЯ АНАЛІТИКИ
  analyticsContainer.style.display = 'grid';
  analyticsContainer.style.gridTemplateColumns = 'repeat(auto-fit, minmax(400px, 1fr))';
  analyticsContainer.style.gap = '24px';
  analyticsContainer.style.alignItems = 'stretch';

  // 2. Вставляємо розмітку в analyticsContainer
  analyticsContainer.innerHTML = `
    <div class="chart-wrapper" style="display: flex; margin-top:20px;  flex-direction: column; background: var(--panel2); border-radius: var(--radius-lg); border: 1px solid var(--border); padding: 24px;">
      <h2 style="margin-top:0; margin-bottom: 20px; font-size:18px; font-weight:900; color: var(--text); text-align:center;">Total Pipeline Value by Status</h2>
      
      <div style="position: relative; flex-grow: 1; min-height: 260px; width: 100%; display: flex; align-items: center; justify-content: center;">
        <canvas id="analyticsChart"></canvas>
      </div>
    </div>

    <div class="chart-wrapper" style="display: flex; margin-top:20px; flex-direction: column; background: var(--panel2); border-radius: var(--radius-lg); border: 1px solid var(--border); padding: 24px;">
      <h2 style="margin-top:0; margin-bottom: 20px; font-size:18px; font-weight:900; color: var(--text); text-align:center;">AI Sales Forecast</h2>
      <button id="generateAiBtn" class="btn-primary" style="width:100%; margin-bottom:20px;"><i class="fa-solid fa-wand-magic-sparkles"></i> Generate AI Forecast</button>
      
      <div id="aiInsightsContent" style="flex-grow: 1;  display: flex; flex-direction: column;">
        <div style="color: var(--muted); text-align: center; margin: auto;">Click the button to analyze your pipeline using AI.</div>
      </div>
    </div>
  `;

  setTimeout(() => {
    if (typeof window.renderAnalyticsChart === 'function') {
      window.renderAnalyticsChart();
    }
  }, 50);
}




function wireUiNavigation() {

  // avoid duplicate bindings
  document.querySelectorAll('.sidebar nav li[data-nav]').forEach((li) => {
    if (li.__wired) return;
    li.__wired = true;

    li.addEventListener('click', () => {
      const key = li.getAttribute('data-nav');
      if (key === 'clients') return showClients();
      if (key === 'invoices') return showInvoices();
      if (key === 'analytics') return showAnalytics();
    });
  });
}


window.CRMAdminNav = {
  wireUiNavigation,
};

// Auto-wire once DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => wireUiNavigation());
} else {
  wireUiNavigation();
}


