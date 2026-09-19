# Development Log — Agentic PR Manager

> **Project:** Agentic Personalization Agent Manager
> **Hackathon:** Agents for Humans (Devpost)
> **Repository:** `agentic-pr-manager`

---

## How to Use This Log

Each entry documents a development session with:
- **Date & Session Number**
- **Focus Area** — what was worked on
- **Decisions Made** — key technical choices and rationale
- **Work Completed** — what was built/shipped
- **Blockers & Issues** — problems encountered
- **Next Steps** — what to do next session

---

## Log Entries

---

### Session #001 — 2026-09-14 (Planning & Architecture)

**Focus Area:** Project planning, requirements gathering, architecture design

**Decisions Made:**

1. **Strands Agents SDK as core orchestrator**
   - Using `strands-agents` Python package (Apache-2.0, open-source)
   - Agent backed by `BedrockModel` (Claude 3.5 Haiku) for text reasoning
   - Agent uses both custom `@tool` functions and MCP server connections
   - MCP servers built with `FastMCP` from the official `mcp` Python SDK

2. **MCP Server architecture**
   - Two dedicated MCP servers connected to the Strands agent via `MCPClient`:
     - `panchang_server.py` — cultural calendar & tithi resolution
     - `shloka_server.py` — verified verse/shloka knowledge base (pgvector)
   - This keeps domain knowledge separate from the orchestration logic
   - Strands SDK natively supports MCP via `MCPClient(command=..., args=[...])`

3. **Cost-optimized stack**
   - Bedrock (pay-per-call only) — ~$10–20/mo at low scale
   - Supabase free tier for Postgres + pgvector
   - Cloudflare R2 free tier for assets (zero egress fees)
   - Firebase FCM for push (completely free)
   - Cedar policy engine (open-source, in-process)
   - **Total projected: ~$15–35/month** (vs $380–650 full AWS)

4. **MVP Priority Tiers**
   - P0 (Core): Onboard → Agent generates artifact → User previews → User shares
   - P1 (Enhanced): Batch scheduler, FCM push, tone tweaking, profile management
   - P2 (Polish): Telemetry, observability, production hardening

5. **Project structure**
   - Python monorepo for backend (FastAPI + Strands agent + MCP servers + compositor)
   - Separate Android project (Kotlin + Jetpack Compose)
   - Docker Compose for local dev (Postgres, Redis)

**Work Completed:**

- [x] Created comprehensive project requirements document (`Agentic_Personalization_Agent_Manager.md`)
  - Problem statement and target personas
  - Functional & non-functional requirements with priority mapping
  - 5 core data entities with full field definitions
  - 6-component architecture with Strands SDK integration details
  - REST API endpoint matrix (30+ endpoints)
  - Strands agent code architecture (BedrockModel, MCPClient, @tool definitions)
  - MCP server specifications (panchang + shloka)
  - Cost analysis table
  - Project directory structure

- [x] Created MVP task list (`MVP_TASK_LIST.md`)
  - Phase 0: Scaffolding (9 tasks)
  - Phase 1 / P0: Core MVP (7 sections, ~40 tasks)
  - Phase 2 / P1: Enhanced MVP (6 sections, ~25 tasks)
  - Phase 3 / P2: Polish & Telemetry (5 sections, ~15 tasks)
  - Development milestones timeline (M0–M7)

- [x] Created development log (`DEVELOPMENT_LOG.md` — this file)

**Blockers & Issues:**

- None at this stage. Planning phase complete.

**Next Steps:**

- [ ] **Session #002:** Initialize Python project, set up virtual environment, install core dependencies
- [ ] **Session #002:** Create Supabase project and run database migrations
- [ ] **Session #002:** Scaffold FastAPI app with health check endpoint
- [ ] **Session #003:** Build the Strands agent core with BedrockModel + first MCP server

---

### Session #002 — 2026-09-14 (Full Backend Scaffolding — "श्री गणेशाय नमः")

**Focus Area:** Complete backend implementation — project structure, all API routers, Strands agent, MCP servers, compositor, and services.

**Decisions Made:**

1. **Parallel build strategy** — Used 3 concurrent coding agents to build all components simultaneously:
   - Agent A: All 5 FastAPI routers (auth, users, calendar, artifacts, devices)
   - Agent B: Strands orchestrator + 4 custom tools + 2 MCP servers + system prompt
   - Agent C: Compositor engine + R2 storage + portrait service + FCM dispatch + batch scheduler

2. **MVP auth simplification** — Using `X-User-ID` header for user identification instead of full OTP flow. JWT generation is wired but OTP verification accepts any 6-digit code.

3. **Hardcoded seed data for MVP** — Panchang MCP server and Shloka MCP server use hardcoded dictionaries (17 festivals, 30+ shlokas) instead of external API calls. This ensures the demo works without internet dependencies.

4. **APScheduler over Celery** — Confirmed: single-process scheduler is sufficient for MVP scale. Two cron jobs: 02:30 AM generation, 06:00 AM dispatch.

**Work Completed:**

- [x] **Foundation (4 files):** `pyproject.toml`, `.env.example`, `config.py`, `database.py`
- [x] **Data Layer (2 files):** `models/__init__.py` (5 ORM entities + 6 enums), `schemas.py` (25+ Pydantic DTOs)
- [x] **API Entry (1 file):** `main.py` (FastAPI with lifespan, CORS, health check, router registration)
- [x] **Routers (6 files):** `__init__.py`, `auth.py`, `users.py`, `calendar.py`, `artifacts.py`, `devices.py` — 15+ endpoints
- [x] **Strands Agent (9 files):**
  - `orchestrator.py` — Agent definition with BedrockModel + MCPClient
  - `prompts/orchestrator_prompt.py` — Full system prompt with constraints
  - `tools/rag_tool.py` — pgvector semantic search
  - `tools/cedar_tool.py` — Cedar policy validation
  - `tools/bedrock_image_tool.py` — Titan Image backdrop generation
  - `tools/compositor_tool.py` — Compositing bridge
- [x] **MCP Servers (3 files):** `panchang_server.py` (17 festivals), `shloka_server.py` (30+ verified shlokas)
- [x] **Compositor (2 files):** `engine.py` (full Pillow pipeline with gradient scrim, Devanagari text, circular portrait, gold border, WebP export)
- [x] **Services (4 files):** `storage_service.py` (R2), `portrait_service.py` (rembg), `dispatch_service.py` (FCM), `batch_runner.py` (APScheduler)
- [x] **Infrastructure (3 files):** `docker-compose.yml`, `seeds/init.sql` (pgvector + seed events), `policies/artifact_generation.cedar`
- [x] **Docs (1 file):** `backend/README.md` with quick start guide

**Total: 31 Python files + 4 config/infra files = 35 files created**

**Blockers & Issues:**

- Google Noto Sans Devanagari font files need to be downloaded and placed in `compositor/fonts/`
- AWS Bedrock model access needs to be verified (Claude 3.5 Haiku + Titan Image)
- Cloudflare R2 bucket not yet created
- Firebase project not yet set up

**Next Steps:**

- [ ] **Session #003:** Install dependencies, start Docker Compose, run FastAPI server, test all endpoints
- [ ] **Session #003:** Download Noto Sans Devanagari fonts, test compositor with sample data
- [ ] **Session #004:** Test Strands agent end-to-end with Bedrock
- [ ] **Session #005:** Begin Android client development

---

### Session #003 — 2026-09-15 (Bedrock AgentCore Orchestration, External Model Providers & Android App Foundation)

**Focus Area:** Bedrock AgentCore orchestration, hybrid tool routing, multi-provider integration (Gemini + NVIDIA NIM), and Android client scaffolding.

**Decisions Made:**

1. **Bedrock AgentCore Architecture Shift**
   - Discovered AWS has placed Classic Bedrock Agents into Maintenance Mode for new accounts, directing developers to **Amazon Bedrock AgentCore** (`bedrock-agentcore-control`).
   - Established the **Return Control** loop pattern: Bedrock AgentCore acts as the reasoning engine and tool orchestrator in AWS (`ap-south-1`), while local Python tools handle execution without requiring public IPs or cloud Lambdas.

2. **Multi-Model Provider Integration (Cost-Optimized)**
   - **Text & Copy:** Integrated Google Gemini (`gemini-2.5-flash`) via third-party API key for zero-latency multi-lingual Devanagari copy and poetry generation.
   - **Image Generation:** Integrated NVIDIA NIM API (`nvapi-...`) with verified access to `black-forest-labs/flux.1-dev` and high-speed fallback to deterministic procedural festive backdrop generation using Pillow.
   - Updated `backend/.env` and `backend/app/config.py` to seamlessly configure these providers.

3. **OpenAPI Action Group Schema**
   - Created `backend/bedrock_action_group.yaml` conforming to OpenAPI 3.0 specifying 5 core agent tools: `get_cultural_context`, `search_shlokas`, `cedar_validate`, `generate_backdrop`, and `compose_image`.

4. **Android Client Architecture (Kotlin + Jetpack Compose)**
   - Created full Gradle structure (`settings.gradle.kts`, `app/build.gradle.kts`) targeting SDK 34 with Jetpack Compose, Material 3, and Coil image loading.
   - Built the networking layer with Retrofit & OkHttp (`ApiClient.kt`, `ApiService.kt`) mapped to the FastAPI backend at `10.0.2.2:8000`.
   - Built state management with `GreetingViewModel.kt` exposing a reactive `StateFlow<GreetingState>`.
   - Built the UI with `MainActivity.kt` containing the preview canvas and single-tap `Intent.ACTION_SEND` WhatsApp sharing button.

**Work Completed:**

- [x] Created `backend/bedrock_action_group.yaml` (OpenAPI 3.0 Action Group schema)
- [x] Updated `backend/agent/orchestrator.py` with Bedrock Agent Return Control loop & tool dispatcher
- [x] Created `backend/agent/tools/gemini_tool.py` (Gemini 2.5 Flash copy generator)
- [x] Updated `backend/agent/tools/bedrock_image_tool.py` (NVIDIA NIM FLUX.1 + procedural generator fallback)
- [x] Created IAM execution role `AmazonBedrockExecutionRoleForAgenticPR` with `BedrockModelInvokePolicy`
- [x] Configured `backend/.env` with Gemini key and NVIDIA NIM key
- [x] Scaffolded Android Jetpack Compose app:
  - `android/settings.gradle.kts`
  - `android/app/build.gradle.kts`
  - `android/app/src/main/AndroidManifest.xml`
  - `android/app/src/main/java/com/agenticpr/manager/MainActivity.kt`
  - `android/app/src/main/java/com/agenticpr/manager/network/ApiClient.kt`
  - `android/app/src/main/java/com/agenticpr/manager/network/ApiService.kt`
  - `android/app/src/main/java/com/agenticpr/manager/viewmodel/GreetingViewModel.kt`

**Blockers & Issues:**

- Classic Bedrock Agents API (`aws bedrock-agent create-agent`) returned maintenance mode error for new agent creation; AWS CLI `bedrock-agentcore-control` is the active API for AgentCore.
- Local Python virtual environment needs dependencies installed before running local uvicorn server.

**Next Steps:**

- [ ] Run FastAPI server locally (`uvicorn app.main:app`) and verify OpenAPI docs at `/docs`
- [ ] Test the full generation pipeline with sample event input (Diwali / Shivratri)
- [ ] Open the `android` folder in Android Studio and verify Gradle build and emulator launch
- [ ] Connect Android UI with local backend on emulator (`10.0.2.2:8000`)

---

## Technical Decision Log

| # | Decision | Rationale | Date |
|---|---|---|---|
| D-001 | Use Strands Agents SDK (not LangChain/CrewAI) | Hackathon requirement; Apache-2.0 license; native Bedrock + MCP support | 2026-09-14 |
| D-002 | Use MCP servers for panchang + shloka KB | Separates domain knowledge from agent logic; reusable across agents; standard protocol | 2026-09-14 |
| D-003 | BedrockModel with Claude 3.5 Haiku | Best cost/quality ratio for text; pay-per-call; supports tool use natively | 2026-09-14 |
| D-004 | Bedrock Titan Image Generator for backdrops | Stays within AWS ecosystem (hackathon bonus); pay-per-image; high quality | 2026-09-14 |
| D-005 | Supabase (Postgres + pgvector) over DynamoDB | Free tier; pgvector for shloka RAG; relational model fits entities better; single DB | 2026-09-14 |
| D-006 | Cloudflare R2 over AWS S3 | Zero egress fees; S3-compatible API; 10 GB free tier | 2026-09-14 |
| D-007 | Pillow over Skia for MVP compositor | Simpler setup; sufficient for MVP; Skia upgrade path exists for P2 | 2026-09-14 |
| D-008 | APScheduler over Celery for batch jobs | Simpler; no broker dependency for MVP; single-process sufficient at low scale | 2026-09-14 |
| D-009 | `cedarpolicy` (local) over AWS Verified Permissions | Zero cost; Cedar engine is OSS; same policy language; in-process evaluation | 2026-09-14 |
| D-010 | Firebase FCM over AWS SNS | Completely free; direct Android integration; no middleman | 2026-09-14 |

---

## Dependency Versions (Pinned at Start)

```
Python: 3.12+
strands-agents: >=0.1.0
strands-agents-tools: >=0.1.0
mcp[cli]: >=1.0.0
fastapi: >=0.115.0
uvicorn: >=0.30.0
sqlalchemy: >=2.0.0
asyncpg: >=0.30.0
pgvector: >=0.3.0
boto3: >=1.35.0
cedarpolicy: >=4.0.0
pillow: >=11.0.0
rembg: >=2.0.0
apscheduler: >=3.10.0
firebase-admin: >=6.0.0
redis: >=5.0.0
httpx: >=0.27.0
```

---

## Known Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Bedrock Titan Image quality for specific Indian themes | Backdrops may not match expected aesthetic | Pre-generate a curated library of 20–30 backdrops as fallback |
| Devanagari font rendering in Pillow | Complex conjuncts may clip | Use Google Noto Sans Devanagari; test with known difficult conjuncts |
| Panchang data accuracy | Wrong tithi = wrong greeting | Cross-validate with 2–3 sources; seed verified data for demo dates |
| Cedar policy complexity for MVP | May over-engineer guardrails | Start with 2–3 simple permit/deny rules; expand in P2 |
| Android BigPicture notification reliability | Varies across OEM (MIUI, OneUI, etc.) | Test on Pixel emulator first; document OEM limitations |
