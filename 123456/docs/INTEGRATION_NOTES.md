# Integration notes

## Done (Tasks 1 and 2)
- All API base URLs now come from `frontend/src/config.ts` and `frontend/.env` (no hardcoded `localhost:5000`).
- Auth/users/audit calls go to Member 1 (5016); volunteers/donors/campaigns/notifications go to Member 6 (5006).
- Member 5 port conflict removed (`Urls` deleted from appsettings; port is 5126 from launchSettings).
- `m4Api.ts` removed; its pages now use `aiApi.ts` (correct routes `/api/ai/chat`, `/api/ai/forecasts`).
- Added `.gitignore`; build output (`bin`, `obj`, `dist`, `node_modules`) removed from the package.

## Still to do (see Antigravity task list)
- Database setup per service, JWT + RBAC on Members 4/5/6, real AI logic in Member 4,
  Core API for citizen requests/coordination (finish `ResQnet.UnifiedApi`), one shared status model,
  end-to-end wiring, tests, Postman collection, final documentation.
