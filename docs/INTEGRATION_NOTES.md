# Integration Notes

## Done

### Foundation & Architectural Alignment (Tasks 1 & 2)
- All frontend API base URLs centralized in `frontend/src/config.ts` reading from `frontend/.env` with robust fallbacks (no hardcoded ports).
- Dedicated service separation: Auth/users/audit routes map to Member 1 (port 5016); volunteers/donors/campaigns/notifications map to Member 6 (port 5006).
- Resolved port conflicts: Member 5 assigned to port 5126 via launchSettings, Member 4 on port 5157, Member 1 on port 5016, Member 6 on port 5006, UnifiedApi on port 5200, and frontend on port 5173.
- Member 4 AI integration unified: replaced obsolete `m4Api.ts` with `aiApi.ts` consuming `/api/ai/chat` and `/api/ai/forecasts`.
- Repository housekeeping: `.gitignore` configured to keep build artifacts (`bin`, `obj`, `dist`, `node_modules`) out of source control.

### Security & Cross-Service RBAC (Tasks 2 & 2b)
- Configured symmetric JWT Bearer authentication across all APIs (Members 1, 4, 5, 6, and UnifiedApi).
- Role-based authorization policies implemented per controller action with strict separation of duties (e.g., `SystemAdmin` manages administration but has no access to operational request contents).
- Seeded accounts provisioned for all roles with default credentials (`Password@123`).
- Added public registration self-service endpoint supporting `Citizen` and `DonorAndVolunteer` roles.

### Decision Support & Duplicate Engine (Task 3)
- Member 4 AI service implements real duplicate detection with text normalization, similarity scoring, and human-in-the-loop (HITL) confidence metrics.
- Case review endpoints (`/api/ai/cases`) and governance telemetry recording human overrides.
- External LLM strategy supporting OpenAI-compatible chat-completions endpoint with automatic PII masking and graceful rule-based fallback.

### Core Request & Event Coordination API (Task 4)
- Built `ResQnet.UnifiedApi` (port 5200) implementing citizen assistance requests and crisis event coordination.
- Strict lifecycle state machine enforced via `StatusTransitionService` (`Submitted` -> `UnderReview` -> `Approved` / `Rejected` -> `Dispatched` -> `Resolved` / `Cancelled`).
- Implemented AI case linking endpoint (`PUT /api/requests/{id}/ai-link`).

### Frontend End-to-End Integration (Tasks 5 & 6)
- Connected citizen portal (`citizenApi.ts`) and coordination dashboard (`coordinationApi.ts`) to `ResQnet.UnifiedApi` (port 5200).
- Visual "Offline" warning banner and graceful local demo data fallback when any backend API is offline.
- Connected AI recommendation panel to live assistance requests for case triage and AI linking.

### Database Scripts & Test Suite
- Separate SQL schema and initial seed scripts created for all five domain databases (`[ResQnet_Identity]`, `[ResQnet_AI]`, `[ResQnet_Resources]`, `[ResQnet_Volunteers]`, and `[ResQnet_Core]`). Note: scripts have been created but have not yet been run against SQL Server.
- Automated test suite passing with **193 total passing tests** across 5 test projects (`Member1`: 10, `Member4`: 26, `Member5`: 43, `Member6`: 16, `UnifiedApi`: 98).
- Transitive NuGet security warnings resolved: pinned `System.Security.Cryptography.Pkcs` to `9.0.21` across all 13 affected projects, achieving 0 build warnings.

---

## Still to Do

1. **Run SQL Server mode once**: Execute the 5 database scripts against a live Microsoft SQL Server or LocalDB instance and verify migrations end-to-end.
2. **Link approved requests to resource/shelter allocation**: Integrate `UnifiedApi` approved requests with Member 5 (`ResQnet.Member5.Api`) resource inventory and shelter allocation endpoints.
3. **Postman collection**: Package all API endpoints with environment variables for quick manual QA and team demos.
4. **AI integration document**: Document the OpenAI-compatible chat-completions configuration, payload contracts, PII masking rules, and confidence thresholds.
5. **Demo script**: Step-by-step walkthrough covering citizen request creation, AI duplicate check & recommendation, coordinator triage & approval, and volunteer/resource allocation.
6. **Final review and push**: Final code and documentation review before pushing to the main team repository.

---

## Future Work

- **Docker Containerization**: Multi-container `docker-compose.yml` to spin up SQL Server, the five .NET APIs, and the Vite frontend with one command.
- **Production Notification Providers**: Replace simulated notification channels with live delivery providers (Twilio for SMS, SendGrid for Email, FCM/APNS for Push).
- **Secret Management**: Move JWT signing keys, database passwords, and `AI:ApiKey` to cloud key vaults (e.g. Azure Key Vault or AWS Secrets Manager).
- **CI/CD Automation**: GitHub Actions pipeline for continuous build, `dotnet test` execution, linting, and automated staging deployments.
