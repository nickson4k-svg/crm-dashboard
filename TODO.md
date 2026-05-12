# TODO - crm-backend Express micro-service

- [x] Create `crm-backend/package.json` with express, cors, dotenv dependencies and start script.
- [x] Create `crm-backend/server.js` implementing POST `/api/forecast` proxy to OpenRouter.
- [x] Ensure `module.exports = app;` is the very last line in `server.js`.
- [x] Create `crm-backend/.gitignore` ignoring `node_modules` and `.env`.
- [x] Create `crm-backend/.env.example` with `OPENROUTER_API_KEY` and `PORT=3000`.
- [ ] Verify/adjust `crm-backend/vercel.json` for `@vercel/node` and `server.js` routing.
- [x] Run `npm install` in `crm-backend`.
- [x] Run local test: `node server.js` and verify POST `/api/forecast` (returns 401 without OPENROUTER_API_KEY).



