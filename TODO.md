# TODO (BlackboxAI security & UX fixes)

- [x] Знайшов XSS місце в front: usage aiContent.innerHTML + вставка insightText.
- [x] Застосував escapeText(insightText) перед рендером у #aiInsightText (script.js).
- [x] Замінено backend /api/forecast на безпечну реалізацію (CORS-only, ліміт 50, fallback на 429) (crm-backend/server.js).
- [x] Подвійний рендер: прибрано ризик дубля через одноразове render-оновлення (script.js).

- [x] Перевірка ui-navi.js: дублікати/мертвий код відсутні (оновлює renderAnalyticsChart з script.js).

