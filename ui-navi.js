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

function renderAnalyticsChart() {
  const canvas = document.getElementById('analyticsChart');
  if (!canvas) return;
  if (typeof window.Chart === 'undefined') return;

  const colors = getAnalyticsColors();
  const data = window.CRMAdminClients || [];

  const statuses = ['Lead', 'Nurturing', 'Demo', 'Won', 'Lost'];
  const totalByStatus = statuses.map((st) => {
    return data.reduce((sum, c) => {
      if (c?.status !== st) return sum;
      const v = Number(c?.totalValue);
      return sum + (Number.isFinite(v) ? v : 0);
    }, 0);
  });

  // Prevent hover glitches / stale tooltips.
  if (canvas.__analyticsChartInstance && typeof canvas.__analyticsChartInstance.destroy === 'function') {
    canvas.__analyticsChartInstance.destroy();
    canvas.__analyticsChartInstance = null;
  }

  const backgroundColors = statuses.map((st) => colors[st]);

  const chart = new window.Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: statuses,
      datasets: [
        {
          label: 'Pipeline by status',
          data: totalByStatus,
          backgroundColor: backgroundColors,
          borderColor: backgroundColors,
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 14,
            boxHeight: 14,
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const v = ctx.parsed;
              const value = Number(v);
              const formatted = Number.isFinite(value)
                ? value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
                : '$0';
              const label = ctx.label ? `${ctx.label}: ` : '';
              return `${label}${formatted}`;
            },
          },
        },
      },
      cutout: '62%',
    },
  });

  canvas.__analyticsChartInstance = chart;
}

function showInvoices() {
  setActiveNav('invoices');
  renderClientsHeaderLike(
    'Рахунки',
    'Демо-екран. Дані рахунків ще не під’єднані — це UI-заглушка.'
  );
}

function showAnalytics() {
  setActiveNav('analytics');
  const grid = document.getElementById('clientsGrid');
  if (!grid) return;

  // FIX: Chart.js в responsive mode може розтягувати контейнер в grid.
  // Даємо жорстку висоту, щоб не було “вічного” підлаштування.
  // Use CSS grid to avoid breaking the original clients-grid layout.
  // changed: restore default grid settings to prevent cards from stretching after returning.
  // changed: remove only the inline display override so CSS grid stays in charge.
  // Use CSS to control layout; remove only inline display so cards don't “shift left”.
  grid.style.removeProperty('display');

  grid.innerHTML = `
    <div class="chart-wrapper" style="position: relative; height: 400px; width: 100%; max-width: 600px; margin: 20px auto; padding: 24px; padding-bottom:100px; background: var(--panel2); border-radius: var(--radius-lg); border: 1px solid var(--border); grid-column: auto;">

      <h2 style="margin-top:0; margin-bottom: 20px; font-size:18px; font-weight:900; color: var(--text); text-align:center;">Total Pipeline Value by Status</h2>
      <canvas id="analyticsChart"></canvas>
    </div>

    <div class="chart-wrapper" style="position: relative; height: 400px; width: 100%; max-width: 600px; margin: 20px auto; padding: 24px; background: var(--panel2); border-radius: var(--radius-lg); border: 1px solid var(--border); grid-column: auto; overflow: hidden;">
      <h2 style="margin-top:0; margin-bottom: 18px; font-size:18px; font-weight:900; color: var(--text); text-align:center;">AI Sales Forecast</h2>

      <button id="generateAiBtn" class="btn-primary" style="width:100%; margin-bottom:15px;"><i class="fa-solid fa-wand-magic-sparkles"></i> Generate AI Forecast</button>

      <div id="aiInsightsContent">Click the button to analyze your pipeline using AI.</div>
    </div>
  `;

  setTimeout(() => {
    if (typeof window.renderAnalyticsChart === 'function') {
      window.renderAnalyticsChart();
    }
  }, 50);
}


function showClients() {
  setActiveNav('clients');
  if (typeof getFilteredClients === 'function' && typeof renderClients === 'function') {
    const filtered = getFilteredClients();
    if (typeof animateGridRefresh === 'function') animateGridRefresh();
    renderClients(filtered);
  }
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


