import { initialClients } from './data/clients.js';

const CLIENTS_LS_KEY = "crm_clients";
const INVOICES_LS_KEY = "crm_invoices";

let clientsCache = null;
let invoicesCache = null;

// ========================
// CLIENTS STORE
// ========================
export function getClients() {
  if (clientsCache) return clientsCache;
  try {
    const raw = window.localStorage?.getItem(CLIENTS_LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        clientsCache = parsed;
        return clientsCache;
      }
    }
  } catch (err) {
    console.error("Failed to load clients from local storage", err);
  }
  
  // Initialize with default mock data if empty
  clientsCache = [...initialClients];
  saveClients(clientsCache);
  return clientsCache;
}

export function saveClients(clients) {
  clientsCache = clients;
  try {
    window.localStorage?.setItem(CLIENTS_LS_KEY, JSON.stringify(clients));
  } catch (err) {
    console.error("Failed to save clients", err);
  }
}

export function addClient(client) {
  const clients = getClients();
  if (!client.history) {
    client.history = [{
      date: new Date().toISOString(),
      text: "Клієнта створено"
    }];
  }
  clients.push(client);
  saveClients(clients);
}

export function updateClient(id, updatedFields) {
  const clients = getClients();
  const idx = clients.findIndex(c => c.id === id);
  if (idx !== -1) {
    const oldClient = clients[idx];
    if (updatedFields.status && updatedFields.status !== oldClient.status) {
      if (!updatedFields.history) {
        updatedFields.history = oldClient.history ? [...oldClient.history] : [];
      }
      updatedFields.history.push({
        date: new Date().toISOString(),
        text: `Статус змінено на ${updatedFields.status}`
      });
    }
    clients[idx] = { ...oldClient, ...updatedFields };
    saveClients(clients);
  }
}

export function deleteClient(id) {
  const clients = getClients();
  const idx = clients.findIndex(c => c.id === id);
  if (idx !== -1) {
    clients.splice(idx, 1);
    saveClients(clients);
  }
}

// ========================
// INVOICES STORE
// ========================
export function getInvoices() {
  if (invoicesCache) return invoicesCache;
  try {
    const raw = window.localStorage?.getItem(INVOICES_LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        invoicesCache = parsed;
        return invoicesCache;
      }
    }
  } catch (err) {
    console.error("Failed to load invoices", err);
  }
  
  invoicesCache = [];
  return invoicesCache;
}

export function saveInvoices(invoices) {
  invoicesCache = invoices;
  try {
    window.localStorage?.setItem(INVOICES_LS_KEY, JSON.stringify(invoices));
  } catch (err) {
    console.error("Failed to save invoices", err);
  }
}
