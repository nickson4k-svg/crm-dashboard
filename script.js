const LS_KEY = "crm_clients";

function loadClientsFromLocalStorage() {
  try {
    const raw = window.localStorage?.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveToLocalStorage() {
  try {
    window.localStorage?.setItem(LS_KEY, JSON.stringify(clients));
  } catch {
  }
}

const clients = loadClientsFromLocalStorage() || (window.CRMAdminClients || []);
let nextId = clients.length ? Math.max(...clients.map((c) => c.id)) + 1 : 1;

const clientsGrid = document.getElementById("clientsGrid");
const searchInput = document.getElementById("searchInput");
const openModalBtn = document.getElementById("openModalBtn");
const modalOverlay = document.getElementById("modalOverlay");
const closeModalBtn = document.getElementById("closeModalBtn");
const addClientForm = document.getElementById("addClientForm");

const addClientMode = document.getElementById("addClientMode");
const deleteClientMode = document.getElementById("deleteClientMode");

const saveClientBtn = document.getElementById("saveClientBtn");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

const clientNameInput = document.getElementById("clientName");
const companyNameInput = document.getElementById("companyName");
const clientStatusInput = document.getElementById("clientStatus");
const clientTotalValueInput = document.getElementById("clientTotalValue");

const clientNameError = document.getElementById("clientNameError");
const companyNameError = document.getElementById("companyNameError");
const clientStatusError = document.getElementById("clientStatusError");
const clientTotalValueError = document.getElementById("clientTotalValueError");

const deleteUserInput = document.getElementById("deleteUserInput");
const deleteUserError = document.getElementById("deleteUserError");

const resultsHint = document.getElementById("resultsHint");

const profileBtn = document.getElementById("profileBtn");
const profileMenu = document.getElementById("profileMenu");

function escapeText(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/'/g, "&#039;");
}

function normalize(text) {
  return String(text ?? "")
    .trim()
    .toLowerCase();
}

function formatUSD(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "$0";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

const STATUS_ORDER = ["Lead", "Nurturing", "Demo", "Won", "Lost"];

function isValidStatus(status) {
  return STATUS_ORDER.includes(status);
}

function getStatusTagClass(status) {
  switch (status) {
    case "Lead":
      return "status-tag status--lead";
    case "Nurturing":
      return "status-tag status--nurturing";
    case "Demo":
      return "status-tag status--demo";
    case "Won":
      return "status-tag status--won";
    case "Lost":
      return "status-tag status--lost";
    default:
      return "status-tag";
  }
}

function animateGridRefresh() {
  if (!clientsGrid) return;
  clientsGrid.classList.remove("grid-anim");

  void clientsGrid.offsetHeight;
  clientsGrid.classList.add("grid-anim");

  setTimeout(() => {
    clientsGrid.classList.remove("grid-anim");
  }, 200);
}

function updateSummaryStats(currentList) {
  const totalClientsEl = document.getElementById("statTotalClients");
  const totalPipelineEl = document.getElementById("statTotalPipelineValue");
  const wonDealsEl = document.getElementById("statWonDeals");

  if (!totalClientsEl || !totalPipelineEl || !wonDealsEl) return;

  const safeList = Array.isArray(currentList) ? currentList : [];

  const totalClients = safeList.length;

  const totalPipelineValue = safeList.reduce((sum, c) => {
    const v = Number(c?.totalValue);
    return sum + (Number.isFinite(v) ? v : 0);
  }, 0);

  const wonDeals = safeList.filter((c) => c?.status === "Won").length;

  totalClientsEl.textContent = String(totalClients);
  totalPipelineEl.textContent = formatUSD(totalPipelineValue);
  wonDealsEl.textContent = String(wonDeals);
}

function renderClients(list) {
  if (!clientsGrid) return;

  updateSummaryStats(list);

  if (resultsHint) {
    const total = clients.length;
    const shown = list.length;
    resultsHint.textContent = `Показано ${shown} з ${total} клієнтів`;
  }

  if (!list.length) {
    clientsGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-title">Немає збігів</div>
        <div class="empty-sub">Спробуйте інший запит або перевірте статус.</div>
      </div>
    `;
    return;
  }

  clientsGrid.innerHTML = list
    .map((client) => {
      const initial = (client.contactName || "?").slice(0, 1).toUpperCase();
      const tagClass = getStatusTagClass(client.status);

      return `
        <article class="client-card" data-id="${client.id}">
          <div class="client-card__top">
            <div class="client-avatar" aria-hidden="true">${escapeText(initial)}</div>

            <div class="client-meta">
              <div class="client-name">${escapeText(client.contactName)}</div>
              <div class="client-company">${escapeText(client.companyName)}</div>
            </div>
          </div>

          <div class="client-card__bottom">
            <div class="client-bottom-left">
              <span class="status-pill-wrap">
                <span class="${tagClass}" aria-label="Status: ${escapeText(client.status)}">${escapeText(client.status)}</span>
              </span>
            </div>

            <div class="client-bottom-right">
              <div class="client-id">#${escapeText(client.id)}</div>
              <div class="client-total" title="Total Value">${escapeText(formatUSD(client.totalValue))}</div>
            </div>
          </div>

          <div class="client-card__actions">
            <button type="button" class="btn-secondary btn-edit-user" data-edit-id="${client.id}">Редагувати</button>
            <button type="button" class="btn-secondary btn-delete-user" data-delete-id="${client.id}">Видалити</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function getFilteredClients() {
  const q = normalize(searchInput?.value);
  const statusFilter = (document.getElementById("filterStatus")?.value || "all");
  const sortValue = (document.getElementById("sortClients")?.value || "default");

  const filtered = clients.filter((c) => {
    const contact = normalize(c.contactName);
    const company = normalize(c.companyName);
    const status = normalize(c.status);

    const matchesQuery = !q || contact.includes(q) || company.includes(q) || status.includes(q);
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;

    return matchesQuery && matchesStatus;
  });

  const getTotal = (c) => Number(c?.totalValue);

  if (sortValue === "value-desc") {
    filtered.sort((a, b) => (getTotal(b) || 0) - (getTotal(a) || 0));
  } else if (sortValue === "value-asc") {
    filtered.sort((a, b) => (getTotal(a) || 0) - (getTotal(b) || 0));
  } else if (sortValue === "name-asc") {
    filtered.sort(
      (a, b) =>
        String(a?.contactName ?? "").localeCompare(String(b?.contactName ?? ""), "uk", {
          sensitivity: "base",
        })
    );
  }

  return filtered;
}

function setModalMode(mode) {
  if (modalOverlay) modalOverlay.dataset.modalMode = mode;

  const isAdd = mode === "add";
  const isEdit = mode === "edit";
  const isDelete = mode === "delete";

  if (addClientMode) addClientMode.hidden = !(isAdd || isEdit);
  if (deleteClientMode) deleteClientMode.hidden = !isDelete;

  if (saveClientBtn) saveClientBtn.hidden = !(isAdd || isEdit);
  if (confirmDeleteBtn) confirmDeleteBtn.hidden = !isDelete;
}

function openModal() {
  if (!modalOverlay) return;

  const addModeEl = document.getElementById("addClientMode");
  const delModeEl = document.getElementById("deleteClientMode");
  if (addModeEl) addModeEl.hidden = false;
  if (delModeEl) delModeEl.hidden = true;

  setModalMode("add");
  deleteClientMode?.hidden && (deleteClientMode.hidden = true);
  if (modalOverlay.dataset.editTargetId) delete modalOverlay.dataset.editTargetId;

  modalOverlay.classList.add("is-open");
  modalOverlay.setAttribute("aria-hidden", "false");

  setTimeout(() => clientNameInput?.focus(), 60);
}

function closeModal() {
  if (!modalOverlay) return;
  modalOverlay.classList.remove("is-open");
  modalOverlay.setAttribute("aria-hidden", "true");
}

function clearErrors() {
  if (clientNameError) clientNameError.textContent = "";
  if (companyNameError) companyNameError.textContent = "";
  if (clientStatusError) clientStatusError.textContent = "";
  if (clientTotalValueError) clientTotalValueError.textContent = "";
}

function clearDeleteError() {
  if (deleteUserError) deleteUserError.textContent = "";
  if (deleteUserInput) deleteUserInput.classList.remove("field-invalid");
}

function setFieldError(inputEl, errorEl, message) {
  if (!inputEl || !errorEl) return;
  errorEl.textContent = message;
  inputEl.classList.add("field-invalid");
}

function clearFieldError(inputEl) {
  if (!inputEl) return;
  inputEl.classList.remove("field-invalid");
}

function validateForm() {
  clearErrors();

  const contactName = clientNameInput?.value?.trim();
  const companyName = companyNameInput?.value?.trim();
  const status = clientStatusInput?.value;
  const totalValueRaw = clientTotalValueInput?.value;
  const totalValue = Number(totalValueRaw);

  let ok = true;

  clearFieldError(clientNameInput);
  clearFieldError(companyNameInput);
  clearFieldError(clientStatusInput);
  clearFieldError(clientTotalValueInput);

  if (!contactName) {
    ok = false;
    setFieldError(clientNameInput, clientNameError, "Вкажіть ім’я контакту.");
  }

  if (!companyName) {
    ok = false;
    setFieldError(companyNameInput, companyNameError, "Вкажіть назву компанії.");
  }

  if (!isValidStatus(status)) {
    ok = false;
    setFieldError(clientStatusInput, clientStatusError, "Оберіть статус.");
  }

  if (!Number.isFinite(totalValue) || totalValue < 0) {
    ok = false;
    setFieldError(clientTotalValueInput, clientTotalValueError, "Вкажіть коректну суму (>= 0)." );
  }

  return ok;
}

function debounce(fn, delay = 250) {
  let t;
  return (...args) => {
    window.clearTimeout(t);
    t = window.setTimeout(() => fn(...args), delay);
  };
}

const onSearchInput = debounce(() => {
  const filtered = getFilteredClients();
  animateGridRefresh();
  renderClients(filtered);
}, 250);

searchInput?.addEventListener("input", onSearchInput);

const filterStatus = document.getElementById("filterStatus");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");

filterStatus?.addEventListener("change", () => {
  const filtered = getFilteredClients();
  animateGridRefresh();
  renderClients(filtered);
});

const sortClients = document.getElementById("sortClients");
sortClients?.addEventListener("change", () => {
  const filtered = getFilteredClients();
  animateGridRefresh();
  renderClients(filtered);
});

clearFiltersBtn?.addEventListener("click", () => {
  if (filterStatus) filterStatus.value = "all";
  if (searchInput) searchInput.value = "";
  const filtered = getFilteredClients();
  animateGridRefresh();
  renderClients(filtered);
});

openModalBtn?.addEventListener("click", openModal);
closeModalBtn?.addEventListener("click", closeModal);
modalOverlay?.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modalOverlay?.classList.contains("is-open")) closeModal();
});

addClientForm?.addEventListener("submit", (e) => {
  e.preventDefault();

  const mode = modalOverlay?.dataset.modalMode;
  if (mode !== "add" && mode !== "edit") return;

  if (!validateForm()) return;

  const contactName = clientNameInput.value.trim();
  const companyName = companyNameInput.value.trim();
  const status = clientStatusInput.value;
  const totalValue = Number(clientTotalValueInput.value);

  if (mode === "add") {

    const newClient = {
      id: nextId++,
      contactName,
      companyName,
      status,
      totalValue,
    };

    clients.push(newClient);
  } else {
    const editId = Number(modalOverlay?.dataset.editTargetId);
    if (!Number.isFinite(editId)) return;

    const idx = clients.findIndex((c) => c.id === editId);
    if (idx === -1) return;

    clients[idx] = {
      ...clients[idx],
      contactName,
      companyName,
      status,
      totalValue,
    };
  }

  saveToLocalStorage();

  // Warning: if client set to Lost and has unpaid invoices
  try {
    if (status === "Lost" && window.CRMAdminInvoices) {
      const invs = window.CRMAdminInvoices || [];
      const hasUnpaid = invs.some((inv) => Number(inv.clientId) === Number(editId ?? modalOverlay?.dataset.editTargetId) && inv.status !== "Paid" && inv.status !== "Cancelled");
      // Note: editId is only available in edit branch; fallback to current editTargetId.
      const currentClientId = mode === "edit" ? editId : null;
      const clientIdToCheck = Number.isFinite(Number(currentClientId)) ? currentClientId : Number(modalOverlay?.dataset.editTargetId);
      if (hasUnpaid || invs.some((inv) => Number(inv.clientId) === clientIdToCheck && inv.status === "Sent")) {
        window.showToast?.("Попередження: у клієнта є неоплачені рахунки.");
      }
    }
  } catch {
    // ignore
  }

  addClientForm.reset();

  clearErrors();
  clearDeleteError();

  clearFieldError(clientNameInput);
  clearFieldError(companyNameInput);
  clearFieldError(clientStatusInput);
  clearFieldError(clientTotalValueInput);

  closeModal();

  const filtered = getFilteredClients();
  animateGridRefresh();
  renderClients(filtered);
});

confirmDeleteBtn?.addEventListener("click", () => {
  if (modalOverlay?.dataset.modalMode !== "delete") return;

  clearDeleteError();

  const v = (deleteUserInput?.value || "").trim();
  if (v.toLowerCase() !== "delete") {
    if (deleteUserError) deleteUserError.textContent = 'Потрібно написати "delete" для підтвердження.';
    if (deleteUserInput) deleteUserInput.classList.add("field-invalid");
    return;
  }

  const id = Number(modalOverlay?.dataset.deleteTargetId);
  if (Number.isFinite(id)) {
    const idx = clients.findIndex((c) => c.id === id);
    if (idx !== -1) clients.splice(idx, 1);
  }

  saveToLocalStorage();
  closeModal();

  const filtered = getFilteredClients();
  animateGridRefresh();
  renderClients(filtered);
});

function closeProfileMenu() {
  if (!profileMenu) return;
  profileMenu.hidden = true;
}

function toggleProfileMenu() {
  if (!profileMenu) return;
  const isHidden = profileMenu.hidden;
  profileMenu.hidden = !isHidden;
  const expanded = !isHidden;
  if (profileBtn) profileBtn.setAttribute("aria-expanded", String(expanded));
}

function wireProfileMenuActions() {
  profileMenu?.querySelectorAll(".menu-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn && btn.id === "deleteUserBtn") {
        openDeleteUserConfirm(NaN);
        return;
      }
      closeProfileMenu();
    });
  });
}

function openDeleteUserConfirm(targetId) {
  if (!modalOverlay) return;

  const addModeEl = document.getElementById("addClientMode");
  const delModeEl = document.getElementById("deleteClientMode");
  if (addModeEl) addModeEl.hidden = true;
  if (delModeEl) delModeEl.hidden = false;

  setModalMode("delete");

  const title = document.getElementById("modalTitle");
  if (title) title.textContent = "Видалення користувача";

  modalOverlay.dataset.deleteTargetId = String(targetId ?? "");

  clearDeleteError();
  if (deleteUserInput) deleteUserInput.value = "";

  modalOverlay.classList.add("is-open");
  modalOverlay.setAttribute("aria-hidden", "false");

  setTimeout(() => deleteUserInput?.focus(), 60);
}

function openEditModal(editId) {
  if (!modalOverlay) return;

  const client = clients.find((c) => c.id === editId);
  if (!client) return;

  const title = document.getElementById("modalTitle");
  if (title) title.textContent = "Редагування клієнта";

  setModalMode("edit");

  modalOverlay.dataset.editTargetId = String(editId);

  if (clientNameInput) clientNameInput.value = client.contactName ?? "";
  if (companyNameInput) companyNameInput.value = client.companyName ?? "";
  if (clientStatusInput) clientStatusInput.value = client.status ?? "Lead";
  if (clientTotalValueInput) clientTotalValueInput.value = Number(client.totalValue ?? 0);

  clearErrors();
  clearDeleteError();
  clearFieldError(clientNameInput);
  clearFieldError(companyNameInput);
  clearFieldError(clientStatusInput);
  clearFieldError(clientTotalValueInput);

  modalOverlay.classList.add("is-open");
  modalOverlay.setAttribute("aria-hidden", "false");

  setTimeout(() => clientNameInput?.focus(), 60);
}

profileBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleProfileMenu();
});

clientsGrid?.addEventListener("click", (e) => {
  const editBtn = e.target.closest?.(".btn-edit-user");
  if (editBtn) {
    e.preventDefault();
    e.stopPropagation();

    const rawId = editBtn.getAttribute("data-edit-id");
    const id = Number(rawId);
    if (!Number.isFinite(id)) return;

    openEditModal(id);
    return;
  }

  const deleteBtn = e.target.closest?.(".btn-delete-user");
  if (!deleteBtn) return;

  e.preventDefault();
  e.stopPropagation();

  const rawId = deleteBtn.getAttribute("data-delete-id");
  const id = Number(rawId);
  if (!Number.isFinite(id)) return;

  openDeleteUserConfirm(id);
});

document.addEventListener("click", () => closeProfileMenu());
wireProfileMenuActions();

function showToast(message) {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;

  container.hidden = false;
  container.innerHTML = "";
  container.appendChild(toast);

  window.clearTimeout(showToast._t);
  showToast._t = window.setTimeout(() => {
    window.setTimeout(() => {
      container.hidden = true;
    }, 400);
  }, 2500);
}



clientsGrid?.addEventListener("mousemove", (e) => {
  const card = e.target.closest(".client-card");
  if (!card) return;

  const rect = card.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  const rotateX = ((y - centerY) / centerY) * -7;
  const rotateY = ((x - centerX) / centerX) * 7;

  card.style.transition = "none";
  card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
});

clientsGrid?.addEventListener("mouseout", (e) => {
  const card = e.target.closest(".client-card");
  if (!card) return;
  if (card.contains(e.relatedTarget)) return;

  card.style.transition = "transform 0.4s ease-out";
  card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
});

// CSV Export
function csvEscape(value) {
  const s = String(value ?? "");
  const needsQuotes = /[\n\r,"]/.test(s);
  if (!needsQuotes) return s;
  return `"${s.replace(/\"/g, '""')}"`;
}

function downloadTextFile(filename, text, mimeType) {
  const blob = new Blob([text], { type: mimeType || "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const exportCsvBtn = document.getElementById("exportCsvBtn");
exportCsvBtn?.addEventListener("click", () => {
  const filtered = getFilteredClients();

  const header = ["ID", "Contact Name", "Company", "Status", "Total Value"];
  const rows = filtered.map((c) => [c.id, c.contactName, c.companyName, c.status, c.totalValue]);

  const csvLines = [header, ...rows].map((row) => row.map(csvEscape).join(","));
  const csv = csvLines.join("\r\n");

  downloadTextFile("clients-report.csv", csv, "text/csv;charset=utf-8");
});

renderClients(clients);

window.renderAnalyticsChart = function () {
  const canvas = document.getElementById("analyticsChart");
  if (canvas && typeof window.Chart !== "undefined") {
    if (window.analyticsChartInstance && typeof window.analyticsChartInstance.destroy === "function") {
      window.analyticsChartInstance.destroy();
      window.analyticsChartInstance = null;
    }

    const statuses = ["Lead", "Nurturing", "Demo", "Won", "Lost"];
    const colors = {
      Lead: "#7C4DFF",
      Nurturing: "#F59E0B",
      Demo: "#3B82F6",
      Won: "#22C55E",
      Lost: "#EF4444",
    };

    const totalByStatus = statuses.map((st) => {
      return clients.reduce((sum, c) => {
        if (c?.status !== st) return sum;
        const v = Number(c?.totalValue);
        return sum + (Number.isFinite(v) ? v : 0);
      }, 0);
    });

    const backgroundColor = statuses.map((st) => colors[st]);

    const chart = new window.Chart(canvas, {
      type: "doughnut",
      data: {
        labels: statuses,
        datasets: [
          {
            data: totalByStatus,
            backgroundColor,
            borderColor: "#121821",
            borderWidth: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: "rgba(230,237,243,0.92)",
            },
          },
        },
      },
    });

    window.analyticsChartInstance = chart;
  }

  const generateBtn = document.getElementById("generateAiBtn");
  const aiContent = document.getElementById("aiInsightsContent");
  if (!generateBtn || !aiContent) return;

  if (!generateBtn.__aiWired) {
    generateBtn.__aiWired = true;

    generateBtn.addEventListener("click", async () => {
      const btn = generateBtn;
      btn.disabled = true;
      btn.dataset.busy = "1";
      btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Аналізую воронку...`;

      aiContent.innerHTML = "";
      aiContent.innerHTML = `
        <div style="padding: 14px 0;">
          <div style="color: var(--text); font-weight: 900; margin-bottom: 8px;">Analyzing with AI...</div>
          <div style="height: 10px; background: rgba(230,237,243,0.10); border-radius: 999px; overflow: hidden; margin-bottom: 10px;">
            <div style="height:100%; width:45%; background: rgba(124,77,255,0.75); animation: ai-skel 1.1s ease-in-out infinite;"></div>
          </div>
          <div style="height: 10px; background: rgba(230,237,243,0.10); border-radius: 999px; overflow: hidden; margin-bottom: 10px;">
            <div style="height:100%; width:70%; background: rgba(124,77,255,0.50); animation: ai-skel 1.1s ease-in-out infinite; animation-delay: 0.15s;"></div>
          </div>
          <div style="height: 10px; background: rgba(230,237,243,0.10); border-radius: 999px; overflow: hidden;">
            <div style="height:100%; width:55%; background: rgba(124,77,255,0.35); animation: ai-skel 1.1s ease-in-out infinite; animation-delay: 0.3s;"></div>
          </div>
        </div>
        <style>
          @keyframes ai-skel { 0% { transform: translateX(-20%); } 50% { transform: translateX(20%); } 100% { transform: translateX(-20%); } }
        </style>
      `;

     try {
      
        const actualTotal = clients
          .filter(c => c.status === "Won") 
          .reduce((sum, c) => sum + (Number(c.totalValue) || 0), 0);

    // Просто робимо запит без жодних ключів і паролів
const response = await fetch("https://crm-dashboard-eight-kappa.vercel.app/api/forecast", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    clients
  })
});

// Якщо була помилка мережі або сервера
if (!response.ok) {
  throw new Error(`AI request failed: ${response.status}`);
}
            
        

        if (!response.ok) throw new Error(`AI request failed: ${response.status}`);

        const aiResult = await response.json();

        const insightText = String(aiResult?.insight ?? "");
        const expectedRevenue = Number(aiResult?.expectedTotal);

        const safeExpected = Number.isFinite(expectedRevenue) ? expectedRevenue : actualTotal * 1.2;

        aiContent.innerHTML = `
          <div style="font-weight: 900; font-size: 14px; margin-bottom: 10px;">Smart Insight</div>
          <div style="color: var(--text); opacity: 0.95; margin-bottom: 14px; line-height: 1.4; font-size: 14px;">
            ${insightText}
          </div>
          <div style="height: 220px;">
            <canvas id="aiRevenueBarChart"></canvas>
          </div>
        `;

        if (typeof window.Chart !== "undefined") {
          const barCanvas = document.getElementById("aiRevenueBarChart");
          if (barCanvas) {
            if (window.aiRevenueBarChartInstance && typeof window.aiRevenueBarChartInstance.destroy === "function") {
              window.aiRevenueBarChartInstance.destroy();
            }

            window.aiRevenueBarChartInstance = new window.Chart(barCanvas, {
              type: "bar",
              data: {
                labels: ["Expected vs Actual Revenue"],
                datasets: [
                  {
                    label: "Actual Revenue",
                    data: [actualTotal],
                    backgroundColor: "rgba(59,130,246,0.75)",
                    borderColor: "#3B82F6",
                    borderWidth: 1,
                  },
                  {
                    label: "Expected Revenue",
                    data: [safeExpected],
                    backgroundColor: "rgba(245,158,11,0.70)",
                    borderColor: "#F59E0B",
                    borderWidth: 1,
                  },
                ],
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
              },
            });
          }
        }
      } catch (err) {
        console.error(err);
        const msg = err && err.message ? String(err.message) : String(err);
        aiContent.innerHTML = `
          <div style="font-weight: 900; font-size: 14px; margin-bottom: 10px;">AI Error</div>
          <div style="color: var(--text); opacity: 0.95; font-size: 14px; white-space: pre-wrap;">Failed to analyze pipeline.\n${msg}</div>
        `;
      } finally {
        btn.disabled = false;
        btn.dataset.busy = "";
        btn.innerHTML = "<i class=\"fa-solid fa-wand-magic-sparkles\"></i> Generate AI Forecast";
      }
    });
  }
};

