# TODO — Модуль «Рахунки» (преміальний UI)

## Plan (підтверджено користувачем)
1. Оновити `style.css` для «скляної» панелі, типографіки, compact інпутів, іконок у полях, скинути-кнопки, summary stats з кольоровими акцентами/пульсацією, table zebra+hover, компактних іконкових action-кнопок з tooltip, статусів (DRAFT/SENT/PAID/OVERDUE/CANCELLED), mobile-layout для карток, empty state, анімації.
2. Оновити `invoices.js` мінімально: новий markup для хедера/фільтрів/summary/mobile, додати кнопки/іконки/tooltip/empty state, зробити компактні action-кнопки, забезпечити overdue icon/колір, і skeleton screens через короткий JS-таймер під час `renderInvoices()`.
3. Перевірити UX у браузері на desktop та mobile, включно з:
   - фільтрами/пошуком + кнопкою «Скинути»
   - діями в таблиці (view/edit/send/paid/delete)
   - статусними бейджами
   - empty state
   - skeleton під час рендера

## Tracking
- [x] Крок 1: `style.css` — додати/оновити стилі для «Рахунків»
- [ ] Крок 2: `invoices.js` — мінімальні DOM-зміни під новий дизайн
- [ ] Крок 3: Запустити перевірку (desktop + mobile) та поправити дрібні стилі


