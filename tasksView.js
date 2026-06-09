import { getClients } from './store.js';

export function renderTasks() {
  const tasksGrid = document.getElementById('tasksGrid');
  if (!tasksGrid) return;

  const clients = getClients();
  const tasks = [];

  clients.forEach(client => {
    if (client.status === 'Lead') {
      tasks.push({
        priority: 'high',
        text: `Зателефонувати новому ліду`,
        client: client
      });
    } else if (client.status === 'Demo') {
      tasks.push({
        priority: 'high',
        text: `Підготуватися до демо`,
        client: client
      });
    } else if (client.status === 'Nurturing') {
      tasks.push({
        priority: 'medium',
        text: `Написати follow-up листа`,
        client: client
      });
    }
  });

  if (tasks.length === 0) {
    tasksGrid.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-check-double" style="font-size:36px; color:var(--muted); margin-bottom:12px;"></i>
        <h3>Немає активних завдань</h3>
        <p style="color:var(--muted);">Усі ліди опрацьовані!</p>
      </div>
    `;
    return;
  }

  // Sort: high priority first
  tasks.sort((a, b) => (a.priority === 'high' ? -1 : 1));

  let html = '';
  tasks.forEach(task => {
    html += `
      <div class="client-card task-card priority-${task.priority}">
        <div class="client-name">${task.text}</div>
        <div class="client-company"><i class="fa-regular fa-user"></i> ${task.client.name} (${task.client.company})</div>
        <button class="btn-secondary task-action-btn" onclick="window.showToast('Завдання виконано!', 'success'); this.parentElement.style.display='none';">
          <i class="fa-solid fa-check"></i> Виконано
        </button>
      </div>
    `;
  });

  tasksGrid.innerHTML = html;
}
