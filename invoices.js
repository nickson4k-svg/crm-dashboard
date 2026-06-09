/* Invoices module (Рахунки) */
import { getClients, getInvoices, saveInvoices } from './store.js';

const STATUS = {
    Draft: { label: 'Draft', className: 'invoice-status--draft', icon: 'fa-solid fa-file-lines' },
    Sent: { label: 'Sent', className: 'invoice-status--sent', icon: 'fa-solid fa-paper-plane' },
    Paid: { label: 'Paid', className: 'invoice-status--paid', icon: 'fa-solid fa-circle-check' },
    Overdue: { label: 'Overdue', className: 'invoice-status--overdue', icon: 'fa-solid fa-triangle-exclamation' },
    Cancelled: { label: 'Cancelled', className: 'invoice-status--cancelled', icon: 'fa-solid fa-ban' },
  };

  function escapeText(str) {
    // Prefer existing escapeText in script.js; fallback here if needed.
    if (typeof window.escapeText === 'function') return window.escapeText(str);
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/'/g, '&#039;');
  }

  function formatDateUA(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime())) return '';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  }

  function toISODateInputValue(date) {
    const d = date instanceof Date ? date : new Date(date);
    if (!Number.isFinite(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  function isValidISODate(s) {
    if (!s || typeof s !== 'string') return false;
    const d = new Date(s);
    return Number.isFinite(d.getTime());
  }

  function getTodayISO() {
    const now = new Date();
    // normalize to local date (no timezone shift)
    const local = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return toISODateInputValue(local);
  }

  function addDaysISO(days) {
    const base = new Date();
    const local = new Date(base.getFullYear(), base.getMonth(), base.getDate());
    local.setDate(local.getDate() + Number(days || 0));
    return toISODateInputValue(local);
  }

  function saveInvoicesToLocalStorage() {
    saveInvoices(invoices);
  }

  const clients = getClients;
  const invoices = getInvoices();

  function normalizeNumber(n) {
    const x = Number(n);
    return Number.isFinite(x) ? x : 0;
  }

  let nextInvoiceInternalId = invoices.length ? Math.max(...invoices.map((i) => i.id || 0)) + 1 : 1;

  function generateInvoiceNumber() {
    // INV-YYYY-XXXX (XXXX incremental within current year)
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;

    const nums = invoices
      .map((inv) => String(inv.invoiceNumber || ''))
      .filter((s) => s.startsWith(prefix))
      .map((s) => {
        const tail = s.slice(prefix.length);
        const n = Number(tail);
        return Number.isFinite(n) ? n : 0;
      });

    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return `${prefix}${String(next).padStart(4, '0')}`;
  }

  function calculateInvoiceTotals(invoice) {
    const items = Array.isArray(invoice.items) ? invoice.items : [];
    const safeItems = items.map((it) => {
      const qty = normalizeNumber(it.quantity);
      const unitPrice = normalizeNumber(it.unitPrice);
      const amount = normalizeNumber(it.amount);
      const computedAmount = qty * unitPrice;
      return {
        ...it,
        quantity: qty,
        unitPrice,
        amount: Number.isFinite(amount) && amount !== 0 ? computedAmount : computedAmount,
      };
    });

    const subtotal = safeItems.reduce((sum, it) => sum + normalizeNumber(it.amount), 0);
    const taxRate = normalizeNumber(invoice.taxRate);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    return {
      items: safeItems,
      subtotal,
      taxRate,
      taxAmount,
      total,
    };
  }

  function getClientLabel(clientId) {
    const c = clients().find((x) => Number(x.id) === Number(clientId));
    if (!c) return '—';
    const contact = escapeText(c.contactName || '');
    const company = escapeText(c.companyName || '');
    return `${contact}<br><span style="color: var(--muted); font-weight:800;">${company}</span>`;
  }

  function getStatusMeta(status) {
    return STATUS[status] || { label: String(status), className: '', icon: 'fa-solid fa-receipt' };
  }

  function getOverdueNowISO() {
    return getTodayISO();
  }

  function checkOverdueInvoices() {
    const today = getOverdueNowISO();
    if (!today) return;

    let changed = false;
    invoices.forEach((inv) => {
      if (inv.status !== 'Sent') return;
      if (!isValidISODate(inv.dueDate)) return;
      if (inv.dueDate < today) {
        inv.status = 'Overdue';
        inv.updatedAt = new Date().toISOString();
        changed = true;
      }
    });

    if (changed) saveInvoicesToLocalStorage();
  }

  function seedDemoInvoicesIfNeeded() {
    // Create exactly 5 demo invoices if empty.
    if (invoices.length > 0) return;

    const c = clients();
    if (!Array.isArray(c) || c.length < 4) return;

    const today = new Date();
    const y = today.getFullYear();

    const issue1 = toISODateInputValue(new Date(y, today.getMonth(), Math.max(1, today.getDate() - 10)));
    const duePast = toISODateInputValue(new Date(y, today.getMonth(), Math.max(1, today.getDate() - 3)));
    const dueFuture = toISODateInputValue(new Date(y, today.getMonth(), today.getDate() + 30));

    const mkItems = (base) => [
      { id: 1, description: `Послуги ${base}`, quantity: 2, unitPrice: 180, amount: 360 },
      { id: 2, description: `Підтримка ${base}`, quantity: 1, unitPrice: 240, amount: 240 },
    ];

    const demo = [
      {
        id: nextInvoiceInternalId++,
        invoiceNumber: `INV-${y}-0001`,
        clientId: c[0].id,
        issueDate: issue1,
        dueDate: dueFuture,
        items: mkItems('A'),
        status: 'Draft',
        notes: 'Демо-інвойс: чернетка.',
        taxRate: 20,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: nextInvoiceInternalId++,
        invoiceNumber: `INV-${y}-0002`,
        clientId: c[1].id,
        issueDate: issue1,
        dueDate: duePast,
        items: mkItems('B'),
        status: 'Sent',
        notes: 'Демо-інвойс: має бути Overdue після перевірки.',
        taxRate: 20,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: nextInvoiceInternalId++,
        invoiceNumber: `INV-${y}-0003`,
        clientId: c[2].id,
        issueDate: issue1,
        dueDate: dueFuture,
        items: mkItems('C'),
        status: 'Sent',
        notes: 'Демо-інвойс: відправлено.',
        taxRate: 20,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: nextInvoiceInternalId++,
        invoiceNumber: `INV-${y}-0004`,
        clientId: c[3].id,
        issueDate: issue1,
        dueDate: dueFuture,
        items: mkItems('D'),
        status: 'Paid',
        notes: 'Демо-інвойс: сплачено.',
        taxRate: 20,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: nextInvoiceInternalId++,
        invoiceNumber: `INV-${y}-0005`,
        clientId: c[4]?.id ?? c[0].id,
        issueDate: issue1,
        dueDate: dueFuture,
        items: mkItems('E'),
        status: 'Cancelled',
        notes: 'Демо-інвойс: скасовано.',
        taxRate: 20,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    demo.forEach((inv) => {
      const totals = calculateInvoiceTotals(inv);
      inv.items = totals.items;
      inv.subtotal = totals.subtotal;
      inv.taxRate = totals.taxRate;
      inv.taxAmount = totals.taxAmount;
      inv.total = totals.total;
    });

    invoices.splice(0, invoices.length, ...demo);
    saveInvoicesToLocalStorage();
  }

  seedDemoInvoicesIfNeeded();
  checkOverdueInvoices();

  function getFilteredInvoices() {
    const q = ((document.getElementById('invoiceSearchInput')?.value || '').trim()).toLowerCase();
    const statusFilter = document.getElementById('invoiceStatusFilter')?.value || 'all';
    const clientFilter = document.getElementById('invoiceClientFilter')?.value || 'all';

    const fromDate = document.getElementById('invoiceFromDate')?.value || '';
    const toDate = document.getElementById('invoiceToDate')?.value || '';

    const sortValue = document.getElementById('invoiceSortSelect')?.value || 'issue-date-desc';

    const filtered = invoices.filter((inv) => {
      const number = String(inv.invoiceNumber || '');
      const client = clients().find((c) => Number(c.id) === Number(inv.clientId));
      const companyName = String(client?.companyName || '');
      const contactName = String(client?.contactName || '');

      const matchesQuery = !q ||
        number.toLowerCase().includes(q) ||
        companyName.toLowerCase().includes(q) ||
        contactName.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      const matchesClient = clientFilter === 'all' || String(inv.clientId) === String(clientFilter);

      const matchesFrom = !fromDate || (isValidISODate(inv.issueDate) && inv.issueDate >= fromDate);
      const matchesTo = !toDate || (isValidISODate(inv.issueDate) && inv.issueDate <= toDate);

      return matchesQuery && matchesStatus && matchesClient && matchesFrom && matchesTo;
    });

    const getTotal = (i) => normalizeNumber(i.total);

    if (sortValue === 'issue-date-asc') {
      filtered.sort((a, b) => String(a.issueDate || '').localeCompare(String(b.issueDate || '')));
    } else if (sortValue === 'amount-desc') {
      filtered.sort((a, b) => getTotal(b) - getTotal(a));
    } else if (sortValue === 'amount-asc') {
      filtered.sort((a, b) => getTotal(a) - getTotal(b));
    } else if (sortValue === 'status-asc') {
      filtered.sort((a, b) => String(a.status || '').localeCompare(String(b.status || '')));
    } else {
      // default: issue-date-desc
      filtered.sort((a, b) => String(b.issueDate || '').localeCompare(String(a.issueDate || '')));
    }

    return filtered;
  }

  function ensureInvoicesControlsWired() {
    if (window.__invoicesControlsWired) return;
    window.__invoicesControlsWired = true;

    const wire = (id, evt, handler) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener(evt, handler);
    };

    wire('invoiceSearchInput', 'input', () => renderInvoices());
    wire('invoiceStatusFilter', 'change', () => renderInvoices());
    wire('invoiceClientFilter', 'change', () => renderInvoices());
    wire('invoiceFromDate', 'change', () => renderInvoices());
    wire('invoiceToDate', 'change', () => renderInvoices());
    wire('invoiceSortSelect', 'change', () => renderInvoices());

    const clearBtn = document.getElementById('invoiceClearFiltersBtn');
    clearBtn?.addEventListener('click', () => {
      const status = document.getElementById('invoiceStatusFilter');
      const client = document.getElementById('invoiceClientFilter');
      const from = document.getElementById('invoiceFromDate');
      const to = document.getElementById('invoiceToDate');
      const search = document.getElementById('invoiceSearchInput');
      if (status) status.value = 'all';
      if (client) client.value = 'all';
      if (from) from.value = '';
      if (to) to.value = '';
      if (search) search.value = '';
      renderInvoices();
    });
  }

  function statusTagHtml(status) {
    const meta = getStatusMeta(status);
    const tagClass = meta.className ? `${meta.className}` : '';
    const iconHtml = meta.icon ? `<i class="${meta.icon}"></i> ` : '';
    return `<span class="invoice-status ${tagClass}">${iconHtml}${escapeText(status)}</span>`;
  }

  function getDueIndicator(inv) {
    if (inv.status === 'Overdue') {
      return `<span class="invoice-due overdue" aria-label="Прострочено">${formatDateUA(inv.dueDate)}</span>`;
    }
    return `<span class="invoice-due">${formatDateUA(inv.dueDate)}</span>`;
  }

  function renderInvoiceListTable(list) {
    const rows = list.map((inv) => {
      const client = clients().find((c) => Number(c.id) === Number(inv.clientId));
      const contact = escapeText(client?.contactName || '—');
      const company = escapeText(client?.companyName || '');
      const tag = statusTagHtml(inv.status);
      const due = getDueIndicator(inv);

      return `
        <tr class="invoice-row" data-id="${inv.id}">
          <td>${escapeText(inv.invoiceNumber)}</td>
          <td>
            <div class="invoice-client">
              <div class="invoice-client__contact">${contact}</div>
              <div class="invoice-client__company">${company}</div>
            </div>
          </td>
          <td>${escapeText(formatDateUA(inv.issueDate))}</td>
          <td>${due}</td>
          <td class="invoice-amount">${escapeText(window.formatUSD ? window.formatUSD(inv.total) : String(inv.total))}</td>
          <td>${tag}</td>
          <td class="invoice-actions">
            <div class="invoice-action-buttons">
              <button type="button" class="btn-secondary btn-invoice-view" data-view-id="${inv.id}" data-tooltip="Перегляд"><i class="fa-solid fa-eye"></i></button>
              <button type="button" class="btn-secondary btn-invoice-edit" data-edit-id="${inv.id}" data-tooltip="Редагувати"><i class="fa-solid fa-pen-to-square"></i></button>
              <button type="button" class="btn-secondary btn-invoice-send" data-send-id="${inv.id}" data-tooltip="Надіслати"><i class="fa-solid fa-paper-plane"></i></button>
              <button type="button" class="btn-secondary btn-invoice-paid" data-paid-id="${inv.id}" data-tooltip="Оплачено"><i class="fa-solid fa-money-bill-wave"></i></button>
              <button type="button" class="btn-secondary btn-invoice-delete" data-delete-id="${inv.id}" data-tooltip="Видалити"><i class="fa-solid fa-trash"></i></button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    const safeHeader = `
      <div class="invoice-table-wrap">
        <table class="invoice-table" aria-label="Список рахунків">
          <thead>
            <tr>
              <th>№</th>
              <th>Клієнт</th>
              <th>Дата виставлення</th>
              <th>Термін</th>
              <th>Сума</th>
              <th>Статус</th>
              <th>Дії</th>
            </tr>
          </thead>
          <tbody class="invoice-tbody">${rows}</tbody>
        </table>
      </div>
    `;

    return safeHeader;
  }

  function renderInvoiceListCards(list) {
    const cards = list.map((inv, idx) => {
      const client = clients().find((c) => Number(c.id) === Number(inv.clientId));
      const tag = statusTagHtml(inv.status);
      const due = getDueIndicator(inv);
      const delay = (idx * 0.05).toFixed(2);

      return `
        <article class="invoice-card" data-id="${inv.id}" style="animation-delay: ${delay}s;">
          <div class="invoice-card__top">
            <div>
              <div class="invoice-card__number">${escapeText(inv.invoiceNumber)}</div>
              <div class="invoice-card__dates">
                <div><span class="invoice-card__label">Виставлено:</span> ${escapeText(formatDateUA(inv.issueDate))}</div>
                <div><span class="invoice-card__label">Термін:</span> ${due}</div>
              </div>
            </div>
            <div class="invoice-card__right">
              <div class="invoice-card__total">${escapeText(window.formatUSD ? window.formatUSD(inv.total) : String(inv.total))}</div>
              ${tag}
            </div>
          </div>
          <div class="invoice-card__actions">
            <button type="button" class="btn-secondary btn-invoice-view" data-view-id="${inv.id}"><i class="fa-solid fa-eye"></i></button>
            <button type="button" class="btn-secondary btn-invoice-edit" data-edit-id="${inv.id}"><i class="fa-solid fa-pen-to-square"></i></button>
            <button type="button" class="btn-secondary btn-invoice-send" data-send-id="${inv.id}"><i class="fa-solid fa-paper-plane"></i></button>
            <button type="button" class="btn-secondary btn-invoice-paid" data-paid-id="${inv.id}"><i class="fa-solid fa-money-bill-wave"></i></button>
            <button type="button" class="btn-secondary btn-invoice-delete" data-delete-id="${inv.id}"><i class="fa-solid fa-trash"></i></button>
          </div>
        </article>
      `;
    }).join('');

    return `<div class="invoice-cards">${cards}</div>`;
  }

  function renderInvoices() {
    const invoicesSection = document.getElementById('invoicesSection');
    if (!invoicesSection) return;

    ensureInvoicesControlsWired();

    const container = invoicesSection.querySelector('#invoicesGrid');
    if (!container) return;

    const list = getFilteredInvoices();

    const totalInvoices = invoices.length;
    const expectedSum = invoices.filter((i) => i.status === 'Sent').reduce((s, i) => s + normalizeNumber(i.total), 0);
    const overdueSum = invoices.filter((i) => i.status === 'Overdue').reduce((s, i) => s + normalizeNumber(i.total), 0);
    const overdueCount = invoices.filter((i) => i.status === 'Overdue').length;

    const clientOptions = clients()
      .slice()
      .sort((a, b) => String(a.companyName || '').localeCompare(String(b.companyName || ''), 'uk', { sensitivity: 'base' }))
      .map((c) => {
        const label = `${c.contactName || ''} — ${c.companyName || ''}`;
        return `<option value="${c.id}">${escapeText(label)}</option>`;
      })
      .join('');

    container.innerHTML = `
      <div class="invoices-ambient-glow"></div>
      <div class="invoices-ambient-glow invoices-ambient-glow--left"></div>

      <section class="invoices-header-panel">
        <div class="invoices-heading">
          <h2 class="invoices-header-title">Рахунки</h2>
          <div class="invoices-header-sub">Керування інвойсами: створення, редагування, надсилання та друк.</div>
        </div>

        <div class="invoice-filters">
          <div class="filter-row">
            <input id="invoiceSearchInput" class="filter-select" style="width: 340px;" placeholder="Пошук за номером або компанією" type="text" value="" />

            <select id="invoiceStatusFilter" class="filter-select" style="width: 190px;">
              <option value="all">Усі статуси</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <select id="invoiceClientFilter" class="filter-select" style="width: 240px;">
              <option value="all">Усі клієнти</option>
              ${clientOptions}
            </select>

            <div class="invoice-date-range">
              <label class="sr-only" for="invoiceFromDate">З</label>
              <input id="invoiceFromDate" class="filter-select" type="date" style="width: 170px;" />
              <label class="sr-only" for="invoiceToDate">По</label>
              <input id="invoiceToDate" class="filter-select" type="date" style="width: 170px;" />
            </div>

            <select id="invoiceSortSelect" class="filter-select" style="width: 210px;">
              <option value="issue-date-desc">Сортування: Дата ↓</option>
              <option value="issue-date-asc">Сортування: Дата ↑</option>
              <option value="amount-desc">Сортування: Сума ↓</option>
              <option value="amount-asc">Сортування: Сума ↑</option>
              <option value="status-asc">Сортування: Статус</option>
            </select>

            <button id="invoiceClearFiltersBtn" type="button" class="btn-secondary">Скинути</button>
          </div>
        </div>
      </section>

      <section class="invoice-summary-stats">
        <div class="invoices-summary-grid">
          <article class="stat-card-invoices stat-card-invoices--total" aria-live="polite">
            <div class="stat-card-invoices__label"><i class="fa-solid fa-file-invoice"></i> Всього рахунків</div>
            <div id="statTotalInvoices" class="stat-card-invoices__value">${escapeText(String(totalInvoices))}</div>
          </article>

          <article class="stat-card-invoices stat-card-invoices--expected" aria-live="polite">
            <div class="stat-card-invoices__label"><i class="fa-solid fa-clock-rotate-left"></i> Очікується оплати</div>
            <div id="statExpectedPayment" class="stat-card-invoices__value">${escapeText(window.formatUSD ? window.formatUSD(expectedSum) : String(expectedSum))}</div>
          </article>

          <article class="stat-card-invoices stat-card-invoices--overdue" aria-live="polite">
            <div class="stat-card-invoices__label"><i class="fa-solid fa-triangle-exclamation"></i> Прострочено</div>
            <div id="statOverdue" class="stat-card-invoices__value">${escapeText(window.formatUSD ? window.formatUSD(overdueSum) : String(overdueSum))}</div>
            <div class="stat-card-invoices__sub">Кількість: ${escapeText(String(overdueCount))}</div>
          </article>
        </div>
      </section>

      <section class="invoice-list">
        <div class="invoice-list-desktop">${renderInvoiceListTable(list)}</div>
        <div class="invoice-list-mobile">${renderInvoiceListCards(list)}</div>
      </section>

      <div id="invoiceModeHint" class="sr-only">${escapeText(String(list.length))}</div>
    `;

    // Restore filter values (so changing render doesn't reset state)
    const savedState = window.__invoiceFilterState;
    const searchEl = document.getElementById('invoiceSearchInput');
    const statusEl = document.getElementById('invoiceStatusFilter');
    const clientEl = document.getElementById('invoiceClientFilter');
    const fromEl = document.getElementById('invoiceFromDate');
    const toEl = document.getElementById('invoiceToDate');
    const sortEl = document.getElementById('invoiceSortSelect');

    if (savedState) {
      if (searchEl) searchEl.value = savedState.q;
      if (statusEl) statusEl.value = savedState.status;
      if (clientEl) clientEl.value = savedState.clientId;
      if (fromEl) fromEl.value = savedState.from;
      if (toEl) toEl.value = savedState.to;
      if (sortEl) sortEl.value = savedState.sort;
    } else {
      if (searchEl) searchEl.value = '';
    }

    // Wire row actions (event delegation)
    container.querySelectorAll('.btn-invoice-view, .btn-invoice-edit, .btn-invoice-send, .btn-invoice-paid, .btn-invoice-delete').forEach(() => {});
  }

  // Preserve filter state across re-renders
  function captureInvoiceFilterState() {
    const q = (document.getElementById('invoiceSearchInput')?.value || '').trim();
    const status = document.getElementById('invoiceStatusFilter')?.value || 'all';
    const clientId = document.getElementById('invoiceClientFilter')?.value || 'all';
    const from = document.getElementById('invoiceFromDate')?.value || '';
    const to = document.getElementById('invoiceToDate')?.value || '';
    const sort = document.getElementById('invoiceSortSelect')?.value || 'issue-date-desc';
    window.__invoiceFilterState = { q, status, clientId, from, to, sort };
  }

  function wireInvoiceRowActionsOnce() {
    if (window.__invoicesRowActionsWired) return;
    window.__invoicesRowActionsWired = true;

    const invoicesSection = document.getElementById('invoicesSection');
    if (!invoicesSection) return;

    invoicesSection.addEventListener('click', (e) => {
      const btnView = e.target.closest('.btn-invoice-view');
      const btnEdit = e.target.closest('.btn-invoice-edit');
      const btnSend = e.target.closest('.btn-invoice-send');
      const btnPaid = e.target.closest('.btn-invoice-paid');
      const btnDelete = e.target.closest('.btn-invoice-delete');

      if (btnView) {
        const id = Number(btnView.getAttribute('data-view-id'));
        if (Number.isFinite(id)) openInvoiceModal('view', id);
        return;
      }

      if (btnEdit) {
        const id = Number(btnEdit.getAttribute('data-edit-id'));
        if (Number.isFinite(id)) openInvoiceModal('edit', id);
        return;
      }

      if (btnSend) {
        const id = Number(btnSend.getAttribute('data-send-id'));
        if (!Number.isFinite(id)) return;
        const inv = invoices.find((x) => x.id === id);
        if (!inv) return;
        if (inv.status !== 'Draft') {
          window.showToast?.('Можна надіслати лише Draft-рахунок.');
          return;
        }
        inv.status = 'Sent';
        inv.updatedAt = new Date().toISOString();
        saveInvoicesToLocalStorage();
        window.showToast?.('Рахунок надіслано.');
        checkOverdueInvoices();
        renderInvoices();
        return;
      }

      if (btnPaid) {
        const id = Number(btnPaid.getAttribute('data-paid-id'));
        if (!Number.isFinite(id)) return;
        const inv = invoices.find((x) => x.id === id);
        if (!inv) return;
        if (inv.status === 'Cancelled') {
          window.showToast?.('Скасований рахунок не можна позначити як сплачений.');
          return;
        }
        inv.status = 'Paid';
        inv.updatedAt = new Date().toISOString();
        saveInvoicesToLocalStorage();
        window.showToast?.('Рахунок позначено як оплачений.');
        checkOverdueInvoices();
        renderInvoices();
        return;
      }

      if (btnDelete) {
        const id = Number(btnDelete.getAttribute('data-delete-id'));
        if (!Number.isFinite(id)) return;
        openInvoiceModal('delete', id);
        return;
      }
    });

    // capture filter state on input changes to not lose state
    ['invoiceSearchInput', 'invoiceStatusFilter', 'invoiceClientFilter', 'invoiceFromDate', 'invoiceToDate', 'invoiceSortSelect'].forEach((id) => {
      const el = document.getElementById(id);
      el?.addEventListener('change', () => captureInvoiceFilterState());
      el?.addEventListener('input', () => captureInvoiceFilterState());
    });
  }

  function buildInvoiceModalHtml() {
    const now = new Date();
    const today = getTodayISO();
    const dueDefault = addDaysISO(30);

    return `
      <div class="invoices-modal-content" data-invoice-mode=""></div>
      <div class="modal-buttons">
        <button type="button" class="btn-secondary" id="invoiceCloseModalBtn">Скасувати</button>
      </div>
    `;
  }

  function getClientOptionsHtml(selectedClientId) {
    const opts = clients()
      .slice()
      .sort((a, b) => String(a.companyName || '').localeCompare(String(b.companyName || ''), 'uk', { sensitivity: 'base' }))
      .map((c) => {
        const label = `${c.contactName || ''} — ${c.companyName || ''}`;
        const sel = String(c.id) === String(selectedClientId) ? 'selected' : '';
        return `<option value="${c.id}" ${sel}>${escapeText(label)}</option>`;
      })
      .join('');
    return `<option value="">Оберіть клієнта</option>${opts}`;
  }

  function openInvoiceModal(mode, invoiceId) {
    const modalOverlay = document.getElementById('modalOverlay');
    const formTitle = document.getElementById('modalTitle');
    if (!modalOverlay || !formTitle) return;

    // Prevent interference with clients modal
    modalOverlay.dataset.modalMode = mode;
    modalOverlay.dataset.invoiceTargetId = mode === 'add' ? '' : String(invoiceId ?? '');

    // Hide/show existing client form controls safely
    const addClientForm = document.getElementById('addClientForm');
    const addClientMode = document.getElementById('addClientMode');
    const deleteClientMode = document.getElementById('deleteClientMode');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const saveClientBtn = document.getElementById('saveClientBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

    // We reuse the overlay modal container but completely replace its inner content.
    // NOTE: This may conflict with clients modal bindings, so we only use it when invoices mode is active.

    const invoicesModalInner = document.createElement('div');
    invoicesModalInner.id = 'invoicesModalInner';

    const inv = invoiceId ? invoices.find((x) => x.id === Number(invoiceId)) : null;
    const isEdit = mode === 'edit';
    const isView = mode === 'view';
    const isAdd = mode === 'add';
    const isDelete = mode === 'delete';

    if (isDelete) {
      formTitle.textContent = 'Видалення рахунку';
      invoicesModalInner.innerHTML = `
        <div style="color: var(--muted); font-weight:900; line-height:1.4;">
          Ви впевнені, що хочете видалити рахунок <b>${escapeText(inv?.invoiceNumber || '')}</b>?
          <div style="margin-top:10px;">Потрібне підтвердження: введіть <b>delete</b>.</div>
        </div>
        <div style="display:flex; flex-direction:column; gap:12px; padding-top:12px;">
          <div class="field" style="grid-column: 1 / -1;">
            <label for="deleteInvoiceUserInput" class="sr-only">Введіть delete</label>
            <input id="deleteInvoiceUserInput" type="text" placeholder="Введіть delete" autocomplete="off" required />
            <div class="field-error" id="deleteInvoiceUserError" role="alert"></div>
          </div>
        </div>
        <div class="modal-buttons">
          <button type="button" class="btn-secondary" id="invoiceDeleteCloseBtn">Скасувати</button>
          <button type="button" class="btn-primary" id="invoiceDeleteConfirmBtn">Видалити</button>
        </div>
      `;
    } else {
      formTitle.textContent = isEdit ? 'Редагувати рахунок' : isView ? 'Перегляд рахунку' : 'Новий рахунок';

      const invoiceNumber = isAdd ? generateInvoiceNumber() : (inv?.invoiceNumber || generateInvoiceNumber());
      const issueDate = isAdd ? getTodayISO() : inv?.issueDate;
      const dueDate = isAdd ? addDaysISO(30) : inv?.dueDate;
      const notes = isAdd ? (inv?.notes || '') : (inv?.notes || '');
      const clientId = isAdd ? (inv?.clientId || '') : inv?.clientId;
      const taxRate = isAdd ? 20 : inv?.taxRate;

      const items = (inv?.items || []).length ? inv.items : [{ id: 1, description: '', quantity: 1, unitPrice: 0, amount: 0 }];

      const totals = inv && !isAdd ? calculateInvoiceTotals(inv) : calculateInvoiceTotals({ items, taxRate });

      // View mode: invoice-like preview
      if (isView) {
        const safeTotals = calculateInvoiceTotals(inv || { items, taxRate });
        const statusTag = `<span class="invoice-status ${getStatusMeta(inv?.status).className}">${escapeText(inv?.status || '')}</span>`;

        invoicesModalInner.innerHTML = `
          <div class="invoice-preview">
            <div class="invoice-preview__header">
              <div class="invoice-preview__logo">CRM.Admin</div>
              <div class="invoice-preview__meta">
                <div><b>Номер:</b> ${escapeText(inv?.invoiceNumber || '')}</div>
                <div><b>Виставлено:</b> ${escapeText(formatDateUA(inv?.issueDate))}</div>
                <div><b>Термін:</b> ${escapeText(formatDateUA(inv?.dueDate))}</div>
              </div>
              <div class="invoice-preview__status">
                ${statusTag}
              </div>
            </div>

            <div class="invoice-preview__client">
              <div class="invoice-preview__client-title">Клієнт</div>
              <div class="invoice-preview__client-name">${escapeText(clients().find((c) => Number(c.id) === Number(inv?.clientId))?.contactName || '')}</div>
              <div class="invoice-preview__client-company">${escapeText(clients().find((c) => Number(c.id) === Number(inv?.clientId))?.companyName || '')}</div>
            </div>

            <div class="invoice-preview__items">
              <table class="invoice-table invoice-table--print" aria-label="Позиції рахунку">
                <thead>
                  <tr><th>Опис</th><th>К-сть</th><th>Ціна</th><th>Сума</th></tr>
                </thead>
                <tbody>
                  ${(inv?.items || []).map((it) => {
                    return `<tr>
                      <td>${escapeText(it.description || '')}</td>
                      <td>${escapeText(String(it.quantity ?? 0))}</td>
                      <td>${escapeText(window.formatUSD ? window.formatUSD(it.unitPrice) : String(it.unitPrice))}</td>
                      <td>${escapeText(window.formatUSD ? window.formatUSD(it.amount) : String(it.amount))}</td>
                    </tr>`;
                  }).join('')}
                </tbody>
              </table>
            </div>

            <div class="invoice-preview__totals">
              <div class="invoice-preview__totals-row"><span>Проміжний підсумок</span><b>${escapeText(window.formatUSD ? window.formatUSD(safeTotals.subtotal) : String(safeTotals.subtotal))}</b></div>
              <div class="invoice-preview__totals-row"><span>Податок (${escapeText(String(safeTotals.taxRate))}%)</span><b>${escapeText(window.formatUSD ? window.formatUSD(safeTotals.taxAmount) : String(safeTotals.taxAmount))}</b></div>
              <div class="invoice-preview__totals-row invoice-preview__totals-row--grand"><span>Загальна сума</span><b>${escapeText(window.formatUSD ? window.formatUSD(safeTotals.total) : String(safeTotals.total))}</b></div>
            </div>

            ${inv?.notes ? `<div class="invoice-preview__notes"><b>Примітки:</b> ${escapeText(inv.notes)}</div>` : ''}
          </div>

          <div class="modal-buttons">
            <button type="button" class="btn-secondary" id="invoicePrintBtn"><i class="fa-solid fa-print"></i> Друк</button>
            <button type="button" class="btn-secondary" id="invoiceExportPdfBtn"><i class="fa-solid fa-file-export"></i> Експорт PDF</button>
            ${inv?.status === 'Draft' ? `<button type="button" class="btn-primary" id="invoiceEditFromViewBtn"><i class="fa-solid fa-pen-to-square"></i> Редагувати</button>` : ''}
            <button type="button" class="btn-secondary" id="invoiceViewCloseBtn">Закрити</button>
          </div>
        `;
      } else {
        // Add/Edit mode
        invoicesModalInner.innerHTML = `
          <div class="invoice-form">
            <div class="invoice-form__header">
              <div class="invoice-form__number"><b>${escapeText(invoiceNumber)}</b></div>
              <div class="invoice-form__dates">
                <div class="field">
                  <label class="sr-only" for="invoiceIssueDate">Дата виставлення</label>
                  <input id="invoiceIssueDate" type="date" value="${escapeText(issueDate || '')}" />
                </div>
                <div class="field">
                  <label class="sr-only" for="invoiceDueDate">Термін оплати</label>
                  <input id="invoiceDueDate" type="date" value="${escapeText(dueDate || '')}" />
                </div>
              </div>
            </div>

            <div class="invoice-form__grid">
              <div>
                <div class="field">
                  <label class="sr-only" for="invoiceClientId">Клієнт</label>
                  <select id="invoiceClientId" required>
                    ${getClientOptionsHtml(clientId)}
                  </select>
                </div>

                <div class="field" style="margin-top:12px;">
                  <label class="sr-only" for="invoiceNotes">Примітки</label>
                  <textarea id="invoiceNotes" rows="3" style="width:100%; border-radius:14px; border:1px solid rgba(48,54,61,.95); background:#0F141C; color: var(--text); padding: 10px 14px; outline:none;" placeholder="Примітки...">${escapeText(notes || '')}</textarea>
                </div>

                <div id="invoiceFormErrors" class="field-error" style="margin-top:10px;" role="alert"></div>
              </div>

              <div>
                <div class="invoice-items">
                  <div class="invoice-items__header">
                    <div class="invoice-items__title">Позиції рахунку</div>
                  </div>
                  <div id="invoiceItemsList" class="invoice-items__list">
                    ${items
                      .map((it) => {
                        const amount = normalizeNumber(it.quantity) * normalizeNumber(it.unitPrice);
                        return `
                          <div class="invoice-item-row" data-item-id="${it.id}">
                            <div class="field invoice-item-desc">
                              <input type="text" class="invoice-item-description" value="${escapeText(it.description || '')}" placeholder="Опис" />
                            </div>
                            <div class="field invoice-item-qty">
                              <input type="number" class="invoice-item-quantity" min="1" step="1" value="${escapeText(String(it.quantity ?? 1))}" />
                            </div>
                            <div class="field invoice-item-price">
                              <input type="number" class="invoice-item-unitprice" min="0" step="1" value="${escapeText(String(it.unitPrice ?? 0))}" />
                            </div>
                            <div class="invoice-item-amount">
                              ${escapeText(window.formatUSD ? window.formatUSD(amount) : String(amount))}
                            </div>
                            <div class="invoice-item-actions">
                              <button type="button" class="btn-secondary btn-invoice-remove-item"><i class="fa-solid fa-trash"></i></button>
                            </div>
                          </div>
                        `;
                      })
                      .join('')}
                  </div>

                  <button type="button" id="invoiceAddItemBtn" class="btn-secondary" style="width:100%; margin-top:12px;">
                    <i class="fa-solid fa-plus"></i> Додати позицію
                  </button>
                </div>

                <div class="invoice-totals">
                  <div class="invoice-totals__row"><span>Проміжний підсумок</span><b id="invoiceSubtotal">${escapeText(window.formatUSD ? window.formatUSD(totals.subtotal) : String(totals.subtotal))}</b></div>
                  <div class="invoice-totals__row"><span>Податок (%)</span><input id="invoiceTaxRate" class="filter-select" type="number" min="0" step="1" value="${escapeText(String(taxRate ?? 20))}" /></div>
                  <div class="invoice-totals__row"><span>Загальна сума</span><b id="invoiceTotalBig" class="invoice-total">${escapeText(window.formatUSD ? window.formatUSD(totals.total) : String(totals.total))}</b></div>
                </div>
              </div>
            </div>

            <div class="modal-buttons">
              <button type="button" class="btn-secondary" id="invoiceCancelBtn">Скасувати</button>
              <button type="button" class="btn-primary" id="invoiceSaveDraftBtn"><i class="fa-solid fa-floppy-disk"></i> Зберегти як Draft</button>
              <button type="button" class="btn-primary" id="invoiceSaveSentBtn"><i class="fa-solid fa-paper-plane"></i> Зберегти та надіслати</button>
            </div>
          </div>
        `;
      }
    }

    // Replace modal body with invoices modal
    const modalRoot = modalOverlay.querySelector('.modal');
    if (!modalRoot) return;
    // Clear existing form content except title/header container.
    modalRoot.querySelectorAll('form').forEach((f) => (f.style.display = 'none'));

    // Insert invoices modal content after h2
    const existingInner = modalRoot.querySelector('#invoicesModalInner');
    existingInner?.remove();

    // ensure modal content appended
    modalRoot.appendChild(invoicesModalInner);

    // Open overlay
    modalOverlay.classList.add('is-open');
    modalOverlay.setAttribute('aria-hidden', 'false');

    // Close handlers
    const invoiceCloseBtn = modalRoot.querySelector('#invoiceCloseModalBtn');
    const invoiceCancelBtn = modalRoot.querySelector('#invoiceCancelBtn');
    const invoiceViewCloseBtn = modalRoot.querySelector('#invoiceViewCloseBtn');
    const invoiceDeleteCloseBtn = modalRoot.querySelector('#invoiceDeleteCloseBtn');

    const closeAll = () => {
      modalOverlay.classList.remove('is-open');
      modalOverlay.setAttribute('aria-hidden', 'true');
      invoicesModalInner?.remove();
      // show client form again
      const form = document.getElementById('addClientForm');
      if (form) form.style.display = '';
    };

    invoiceCloseBtn?.addEventListener('click', closeAll);
    invoiceCancelBtn?.addEventListener('click', closeAll);
    invoiceViewCloseBtn?.addEventListener('click', closeAll);
    invoiceDeleteCloseBtn?.addEventListener('click', closeAll);

    // Delete confirmation
    const invoiceDeleteConfirmBtn = modalRoot.querySelector('#invoiceDeleteConfirmBtn');
    const deleteInvoiceInput = modalRoot.querySelector('#deleteInvoiceUserInput');
    const deleteInvoiceError = modalRoot.querySelector('#deleteInvoiceUserError');

    invoiceDeleteConfirmBtn?.addEventListener('click', () => {
      const v = (deleteInvoiceInput?.value || '').trim();
      if (v.toLowerCase() !== 'delete') {
        if (deleteInvoiceError) deleteInvoiceError.textContent = 'Потрібно написати "delete" для підтвердження.';
        deleteInvoiceInput?.classList.add('field-invalid');
        return;
      }
      const idx = invoices.findIndex((x) => x.id === Number(invoiceId));
      if (idx !== -1) invoices.splice(idx, 1);
      saveInvoicesToLocalStorage();
      window.showToast?.('Рахунок видалено.');
      closeAll();
      renderInvoices();
    });

    // View-mode buttons
    modalRoot.querySelector('#invoicePrintBtn')?.addEventListener('click', () => {
      // Ensure print CSS kicks in
      window.setTimeout(() => window.print?.(), 50);
    });

    modalRoot.querySelector('#invoiceExportPdfBtn')?.addEventListener('click', () => {
      const element = modalRoot.querySelector('.invoice-preview');
      if (!element || typeof html2pdf === 'undefined') {
        window.showToast?.('Не вдалося згенерувати PDF (бібліотека html2pdf не завантажена)');
        return;
      }
      const opt = {
        margin:       10,
        filename:     `Invoice_${inv.invoiceNumber}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      html2pdf().set(opt).from(element).save();
    });

    modalRoot.querySelector('#invoiceEditFromViewBtn')?.addEventListener('click', () => {
      closeAll();
      openInvoiceModal('edit', invoiceId);
    });

    // Add/Edit form logic
    if (!isAdd && !isEdit) return;

    const invoiceClientIdEl = modalRoot.querySelector('#invoiceClientId');
    const issueDateEl = modalRoot.querySelector('#invoiceIssueDate');
    const dueDateEl = modalRoot.querySelector('#invoiceDueDate');
    const notesEl = modalRoot.querySelector('#invoiceNotes');
    const itemsListEl = modalRoot.querySelector('#invoiceItemsList');
    const taxRateEl = modalRoot.querySelector('#invoiceTaxRate');

    const invoiceSubtotalEl = modalRoot.querySelector('#invoiceSubtotal');
    const invoiceTotalBigEl = modalRoot.querySelector('#invoiceTotalBig');

    function recalcTotalsLive() {
      const rows = Array.from(itemsListEl.querySelectorAll('.invoice-item-row'));
      const items = rows.map((row, idx) => {
        const desc = row.querySelector('.invoice-item-description')?.value || '';
        const qty = normalizeNumber(row.querySelector('.invoice-item-quantity')?.value);
        const unitPrice = normalizeNumber(row.querySelector('.invoice-item-unitprice')?.value);
        const amount = qty * unitPrice;
        const amountEl = row.querySelector('.invoice-item-amount');
        if (amountEl) amountEl.textContent = window.formatUSD ? window.formatUSD(amount) : String(amount);
        return { id: idx + 1, description: desc, quantity: qty, unitPrice, amount };
      });

      const taxRate = normalizeNumber(taxRateEl?.value);
      const temp = { items, taxRate };
      const totals = calculateInvoiceTotals(temp);

      if (invoiceSubtotalEl) invoiceSubtotalEl.textContent = window.formatUSD ? window.formatUSD(totals.subtotal) : String(totals.subtotal);
      if (invoiceTotalBigEl) invoiceTotalBigEl.textContent = window.formatUSD ? window.formatUSD(totals.total) : String(totals.total);

      // Store for submit
      invoicesModalInner.__liveTotals = totals;
    }

    // event delegation for inputs
    itemsListEl?.addEventListener('input', (e) => {
      const t = e.target;
      if (!t) return;
      if (t.classList.contains('invoice-item-quantity') || t.classList.contains('invoice-item-unitprice') || t.classList.contains('invoice-item-description')) {
        recalcTotalsLive();
      }
    });

    taxRateEl?.addEventListener('input', () => recalcTotalsLive());

    // remove item
    modalRoot.querySelectorAll('.btn-invoice-remove-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        const row = btn.closest('.invoice-item-row');
        row?.remove();
        recalcTotalsLive();
      });
    });

    // add item
    modalRoot.querySelector('#invoiceAddItemBtn')?.addEventListener('click', () => {
      const newId = (itemsListEl.querySelectorAll('.invoice-item-row').length || 0) + 1;
      const row = document.createElement('div');
      row.className = 'invoice-item-row';
      row.setAttribute('data-item-id', String(newId));
      row.innerHTML = `
        <div class="field invoice-item-desc"><input type="text" class="invoice-item-description" value="" placeholder="Опис" /></div>
        <div class="field invoice-item-qty"><input type="number" class="invoice-item-quantity" min="1" step="1" value="1" /></div>
        <div class="field invoice-item-price"><input type="number" class="invoice-item-unitprice" min="0" step="1" value="0" /></div>
        <div class="invoice-item-amount">${escapeText(window.formatUSD ? window.formatUSD(0) : '0')}</div>
        <div class="invoice-item-actions"><button type="button" class="btn-secondary btn-invoice-remove-item"><i class="fa-solid fa-trash"></i></button></div>
      `;
      itemsListEl.appendChild(row);
      row.querySelector('.btn-invoice-remove-item')?.addEventListener('click', () => {
        row.remove();
        recalcTotalsLive();
      });
      recalcTotalsLive();
    });

    recalcTotalsLive();

    function validateInvoiceForm() {
      const errsEl = modalRoot.querySelector('#invoiceFormErrors');
      if (errsEl) errsEl.textContent = '';

      const clientId = Number(invoiceClientIdEl?.value);
      const issueDate = issueDateEl?.value || '';
      const dueDate = dueDateEl?.value || '';

      if (!Number.isFinite(clientId)) {
        if (errsEl) errsEl.textContent = 'Оберіть клієнта.';
        invoiceClientIdEl?.classList.add('field-invalid');
        return null;
      }

      if (!itemsListEl) return null;
      const rows = Array.from(itemsListEl.querySelectorAll('.invoice-item-row'));
      if (!rows.length) {
        if (errsEl) errsEl.textContent = 'Додайте хоча б 1 позицію.';
        return null;
      }

      const items = rows.map((row, idx) => {
        const desc = row.querySelector('.invoice-item-description')?.value || '';
        const qty = normalizeNumber(row.querySelector('.invoice-item-quantity')?.value);
        const unitPrice = normalizeNumber(row.querySelector('.invoice-item-unitprice')?.value);
        const amount = qty * unitPrice;
        return { id: idx + 1, description: desc, quantity: qty, unitPrice, amount };
      });

      if (items.some((it) => it.quantity <= 0 || it.unitPrice < 0)) {
        if (errsEl) errsEl.textContent = 'Перевірте кількість та ціну (кількість > 0, ціна ≥ 0).';
        return null;
      }

      if (isValidISODate(issueDate) && isValidISODate(dueDate) && dueDate <= issueDate) {
        if (errsEl) errsEl.textContent = 'Дата терміну має бути пізніше дати виставлення.';
        return null;
      }

      const taxRate = normalizeNumber(taxRateEl?.value);
      const notes = notesEl?.value || '';

      return { clientId, issueDate, dueDate, items, taxRate, notes };
    }

    function submit(status) {
      const payload = validateInvoiceForm();
      if (!payload) return;

      const nowIso = new Date().toISOString();

      if (isAdd) {
        const newInvoice = {
          id: nextInvoiceInternalId++,
          invoiceNumber: modalRoot.querySelector('.invoice-form__number b')?.textContent || generateInvoiceNumber(),
          clientId: payload.clientId,
          issueDate: payload.issueDate,
          dueDate: payload.dueDate,
          items: payload.items,
          status,
          notes: payload.notes,
          taxRate: payload.taxRate,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        const totals = calculateInvoiceTotals(newInvoice);
        newInvoice.items = totals.items;
        newInvoice.subtotal = totals.subtotal;
        newInvoice.taxRate = totals.taxRate;
        newInvoice.taxAmount = totals.taxAmount;
        newInvoice.total = totals.total;

        invoices.push(newInvoice);
      } else if (isEdit && invoiceId) {
        const inv = invoices.find((x) => x.id === Number(invoiceId));
        if (!inv) return;

        inv.clientId = payload.clientId;
        inv.issueDate = payload.issueDate;
        inv.dueDate = payload.dueDate;
        inv.items = payload.items;
        inv.status = status;
        inv.notes = payload.notes;
        inv.taxRate = payload.taxRate;
        inv.updatedAt = nowIso;

        const totals = calculateInvoiceTotals(inv);
        inv.items = totals.items;
        inv.subtotal = totals.subtotal;
        inv.taxAmount = totals.taxAmount;
        inv.total = totals.total;
      }

      saveInvoicesToLocalStorage();
      checkOverdueInvoices();
      window.showToast?.(status === 'Draft' ? 'Рахунок збережено як Draft.' : 'Рахунок збережено та надіслано.');
      closeAll();
      renderInvoices();
    }

    modalRoot.querySelector('#invoiceSaveDraftBtn')?.addEventListener('click', () => submit('Draft'));
    modalRoot.querySelector('#invoiceSaveSentBtn')?.addEventListener('click', () => submit('Sent'));

    modalRoot.querySelector('#invoiceCancelBtn')?.addEventListener('click', closeAll);
  }

  wireInvoiceRowActionsOnce();

  checkOverdueInvoices();

export { renderInvoices, checkOverdueInvoices };

