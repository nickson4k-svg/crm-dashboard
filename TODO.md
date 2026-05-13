# TODO — рефакторинг CRM.Admin

- [ ] script.js: створити єдину точку правди `updateAppState(newClients)` і замінити всі `saveToLocalStorage()`.
- [ ] script.js: винести AI (generateAiBtn listener) та `renderAnalyticsChart` у окремий блок/ініціалізатор (initAnalyticsAndAi), прибрати window.renderAnalyticsChart з глобальної логіки якщо дублюється.

- [ ] ui-navi.js: переписати перемикання вкладок через CSS-клас `.hidden` (без `style.display`), лише показ/приховання контейнерів.
- [ ] ui-navi.js: видалити дублікати `renderAnalyticsChart`/AI HTML (все лишити у script.js).
- [ ] style.css: винести кольори статусів у CSS variables (`--color-lead` тощо) і підставити у `.status--*`.
- [ ] style.css: забезпечити `.clients-grid { margin: 0 auto; max-width: 1400px; }` та додати `.hidden` якщо відсутній.
- [ ] script.js: покращити обробку помилок fetch до Vercel (response.ok + response.text(), зрозуміле повідомлення користувачу).
- [ ] Перевірка: запуск index.html та мінімальний smoke-test (clients add/edit/delete, переми
