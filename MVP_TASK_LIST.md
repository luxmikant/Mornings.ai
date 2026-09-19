# MVP Task List — Agentic PR Manager

> **Last Updated:** 2026-09-14 (Session #002)
> **Sprint Model:** 3-tier MVP priority (P0 → P1 → P2)

---

## Priority Legend

| Priority | Meaning | Target |
|---|---|---|
| **P0 — Core MVP** | Without this, the demo doesn't work | Must be done for hackathon submission |
| **P1 — Enhanced MVP** | Makes the demo impressive and complete | Should be done if time permits |
| **P2 — Polish & Telemetry** | Adds production readiness and feedback loops | Nice-to-have stretch goals |

---

## Phase 0: Project Scaffolding & Infrastructure

- [x] Initialize Python project with `pyproject.toml` and virtual environment
- [x] Set up project directory structure (backend/, agent/, mcp_servers/, compositor/, etc.)
- [x] Create `.env.example` with all required environment variables
- [x] Create `app/config.py` (Pydantic BaseSettings)
- [x] Create `app/database.py` (async SQLAlchemy engine + session)
- [x] Create database models for all 5 core entities (User, PreferenceProfile, CulturalEvent, Artifact, DispatchLog)
- [x] Create Pydantic schemas for all API request/response DTOs
- [x] Set up Docker Compose for local development (Postgres with pgvector, Redis)
- [x] Create database seed SQL (17 cultural events for 2026, cultural_verses table with vector index)
- [x] Create FastAPI app skeleton with health check endpoint
- [x] Create backend README with setup instructions
- [x] Create Cedar policy files for artifact generation rules
- [ ] Set up Supabase project OR run local Docker Compose
- [ ] Configure AWS credentials for Amazon Bedrock access
- [ ] Set up Cloudflare R2 bucket (`user-portraits`, `artifacts`, `temp`)
- [ ] Install Python dependencies in virtual environment
- [ ] Download and install Noto Sans Devanagari font files

---

## Phase 1: P0 — Core MVP (End-to-End Flow)

> **Goal:** One user onboards → agent generates one greeting → user sees it → user shares it.

### 1.1 User Onboarding & Persona Engine

- [x] Implement `POST /api/v1/users/onboard` endpoint
- [x] Implement `GET /api/v1/users/me` endpoint
- [x] Implement `GET /api/v1/users/me/profile` endpoint
- [x] Implement `GET /api/v1/users/me/portrait` endpoint
- [x] Implement `PATCH /api/v1/users/me/profile` endpoint
- [x] Implement `PATCH /api/v1/users/me` endpoint
- [x] Implement `DELETE /api/v1/users/me` endpoint
- [x] Implement portrait background removal service (`rembg`)
- [x] Implement R2 storage service (upload/download/presigned URLs)
- [ ] Integrate portrait service into onboarding endpoint (wire up rembg + R2 upload)
- [ ] Test onboarding flow end-to-end via curl/Postman

### 1.2 Cultural Context MCP Server

- [x] Create `mcp_servers/panchang_server.py` using FastMCP
- [x] Implement `get_cultural_context(date, lat, lon)` tool with 17+ festival seed data
- [x] Implement `get_upcoming_events(days_ahead, region)` tool
- [x] Add deterministic fallback to solar weekday greetings
- [ ] Test MCP server standalone via `mcp` CLI
- [ ] Add Redis cache-aside layer for context lookups

### 1.3 Shloka Knowledge Base MCP Server

- [x] Create `mcp_servers/shloka_server.py` using FastMCP
- [x] Implement `search_shlokas(query, deity, language, top_k)` tool with 30+ verified shlokas
- [x] Implement `get_shloka_by_id(shloka_id)` tool
- [ ] Generate pgvector embeddings for all seed shlokas (via Bedrock Titan Embed)
- [ ] Test semantic search end-to-end

### 1.4 Strands Agent Orchestrator (Core Brain)

- [x] Define orchestrator system prompt with all constraints and step-by-step plan
- [x] Define custom `@tool` functions (rag_search, cedar_validate, generate_backdrop, compose_image, compositor_tool)
- [x] Create `agent/orchestrator.py` with BedrockModel + MCPClient + Agent definition
- [x] Create `run_generation_for_user()` function
- [ ] Test agent in interactive mode with sample user context
- [ ] Validate tool call chain: MCP → RAG → Cedar → Image → Compose → Store

### 1.5 Image Compositor Engine

- [x] Build `compositor/engine.py` with Pillow pipeline
  - [x] Background loading + resize to 1080×1350
  - [x] Dark gradient scrim on lower portion
  - [x] Devanagari headline text rendering
  - [x] Shloka/blessing text rendering with wrapping
  - [x] Portrait circular mask + gold border
  - [x] User name + designation banner
  - [x] WebP export (quality 85)
- [ ] Install and bundle Google Noto Sans Devanagari font files
- [ ] Test compositing with sample data and verify Indic text rendering
- [ ] Verify output dimensions and file size constraints

### 1.6 API Surface

- [x] Implement `POST /api/v1/auth/otp/send` (MVP stub)
- [x] Implement `POST /api/v1/auth/otp/verify` (MVP JWT)
- [x] Implement `GET /api/v1/calendar/today`
- [x] Implement `GET /api/v1/calendar/upcoming`
- [x] Implement `GET /api/v1/calendar/archetypes`
- [x] Implement `GET /api/v1/calendar/deities`
- [x] Implement `GET /api/v1/artifacts/daily`
- [x] Implement `GET /api/v1/artifacts/{artifact_id}`
- [x] Implement `GET /api/v1/artifacts/history`
- [x] Implement `POST /api/v1/artifacts/{artifact_id}/dispatch`
- [x] Implement `POST /api/v1/artifacts/{artifact_id}/tweak`
- [x] Implement `DELETE /api/v1/artifacts/{artifact_id}`
- [x] Implement `GET /api/v1/system/health`
- [x] Implement `POST /api/v1/device/fcm-token`
- [x] Implement `DELETE /api/v1/device/fcm-token/{token}`

### 1.7 Supporting Services

- [x] Build R2 storage service (Cloudflare R2 via boto3)
- [x] Build portrait service (rembg background removal + R2 upload)
- [x] Build dispatch service (Firebase Cloud Messaging)
- [x] Build batch scheduler (APScheduler with generation + dispatch cron jobs)

### 1.8 Integration & Testing

- [ ] Start FastAPI server and verify all endpoints in Swagger UI
- [ ] Run full pipeline test: create user → trigger agent → verify artifact in DB
- [ ] Test compositor with a real festival event
- [ ] Validate generated image quality

### 1.9 Android Client (Minimal Viable) — PENDING

- [ ] Create new Kotlin/Jetpack Compose Android project
- [ ] Build onboarding flow (3–4 screens)
- [ ] Build daily artifact preview screen
- [ ] Implement share dispatcher (Intent.ACTION_SEND)
- [ ] Connect to backend API (Retrofit + OkHttp)

---

## Phase 2: P1 — Enhanced MVP (Notifications + Polish)

### 2.1 Push Notification System
- [x] Build FCM dispatcher service
- [x] Build batch notification scheduler
- [ ] Set up Firebase project + FCM credentials
- [ ] Test push notifications on Android emulator

### 2.2 Profile Management
- [x] Implement all PATCH/PUT/DELETE profile endpoints
- [ ] Wire up portrait re-upload functionality

### 2.3 Tone Tweaking
- [x] Implement `POST /api/v1/artifacts/{artifact_id}/tweak` (stub)
- [ ] Wire up Strands agent re-invocation for tweaked artifacts

### 2.4 Cedar Policy Guardrails
- [x] Write Cedar policy files
- [x] Build cedar_validate tool
- [ ] Test Cedar DENY → auto-mutate → retry flow

### 2.5 Android Enhancements
- [ ] FCM BigPicture notification
- [ ] Artifact history screen
- [ ] Settings screen
- [ ] App branding (icon, splash)

---

## Phase 3: P2 — Polish & Telemetry (Stretch Goals)

- [ ] Telemetry logging + dispatch log analytics
- [ ] Drik Panchang API integration for live astronomical data
- [ ] Langfuse agent observability integration
- [ ] Dockerize backend with multi-stage build
- [ ] Unit tests (pytest) for agent tools, compositor, API
- [ ] Integration test for full pipeline
- [ ] Demo video recording for Devpost submission

---

## Progress Summary

| Phase | Total Tasks | Done | Remaining |
|---|---|---|---|
| Phase 0: Scaffolding | 17 | 12 | 5 |
| Phase 1: Core MVP | ~45 | ~32 | ~13 |
| Phase 2: Enhanced | ~12 | 6 | 6 |
| Phase 3: Stretch | 7 | 0 | 7 |
| **Total** | **~81** | **~50** | **~31** |

---

## Development Milestones

| Milestone | Components | Target Date | Status |
|---|---|---|---|
| **M0: Scaffold** | Project setup, DB schema, env config | Day 1 | ✅ `DONE` |
| **M1: Agent Core** | Strands agent + MCP servers + tools | Day 1 | ✅ `DONE` |
| **M2: Compositor** | Image compositing pipeline | Day 1 | ✅ `DONE` |
| **M3: API + Services** | FastAPI routers + all services | Day 1 | ✅ `DONE` |
| **M4: Integration & Test** | Wire up + end-to-end test | Day 2 | `IN_PROGRESS` |
| **M5: Android Client** | Kotlin app onboard + preview + share | Day 3–4 | `NOT_STARTED` |
| **M6: Notifications** | FCM push + BigPicture | Day 4–5 | `NOT_STARTED` |
| **M7: Polish & Submit** | Tests, video, README, Devpost | Day 6 | `NOT_STARTED` |
