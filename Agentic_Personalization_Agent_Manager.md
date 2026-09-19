# Agentic Personalization Agent Manager

> **Codename:** Agentic PR Manager (Personal Relation Manager)
> **Hackathon:** [Agents for Humans — Devpost](https://agentsforhumans.devpost.com/)
> **Track:** Build a new AI agent with Strands Agents that does real work for real people.

---

## 1. Problem Statement

Elder people in a community or in a family spend most of their morning time looking for a perfect fit for a greeting and personalizing it for a festival. To remove and decrease that friction of spending **15–20 minutes daily** searching for images, editing them for a personalized touch, and posting them to social media, we introduce the **Agentic Personal Relation (PR) Manager**.

We are building an **autonomous, Android-native agent** that eliminates the daily content creation and distribution friction for community representatives, civic officers, and everyday citizens. By using an onboarding questionnaire to map their social persona, the agent autonomously generates context-accurate, non-generic social artifacts, and provides a **single-tap native OS dispatch**.

### Who is this for?

| Archetype | Example Persona | Daily Pain Point |
|---|---|---|
| `CULTURAL_LEADER` | Temple committee president | Finds/edits devotional images for each tithi |
| `CIVIC_REPRESENTATIVE` | RWA General Secretary | Creates civic advisories with their photo & title |
| `FAMILY_HEAD` | Retired grandparent | Wants to greet family groups on festivals |
| `LOCAL_PROFESSIONAL` | Local shopkeeper / doctor | Sends branded festival greetings to clients |

---

## 2. Project Goals & Hackathon Alignment

- **Objective:** Build an autonomous, end-to-end agentic application that does real work for real people, moving beyond simple chat interfaces to handle an entire daily workflow.
- **Core Technology:** **Strands Agents SDK** (`strands-agents` Python package) for the central reasoning and orchestration loop.
- **AI Infrastructure:** **Amazon Bedrock** (Claude 3.5 Haiku for text, Titan Image Generator for backdrops) — pay-per-use, no provisioned capacity.
- **MCP Integration:** Custom **MCP Servers** (Panchang calendar, Shloka knowledge base) consumed by the Strands agent via `MCPClient`.
- **Novelty:** 100% newly created project during the hackathon submission period.

### Hackathon Rule Compliance

| Rule | How We Comply |
|---|---|
| Functionality | Fully installable Android app + deployable backend; end-to-end demo in video |
| Platform | Android (Kotlin/Jetpack Compose) + Python backend |
| New Projects Only | All code written fresh; Strands SDK, FastAPI, Pillow are standard libraries |
| Third Party Integrations | AWS Bedrock (authorized via AWS account), Supabase (free tier), FCM (free), Cloudflare R2 (free tier) |

---

## 3. Requirements

### 3.1 Functional Requirements (FR)

| ID | Requirement | Priority |
|---|---|---|
| FR-1 | **Persona Ingestion:** Onboarding questionnaire maps user to an archetype, captures portrait, and stores preferences | P0 |
| FR-2 | **Autonomous Context Resolution:** Agent resolves today's cultural event (tithi, festival, civic day) without user input | P0 |
| FR-3 | **Bespoke Artifact Synthesis:** Pipeline dynamically pairs typography, visual style, shloka, and copy based on archetype and event type | P0 |
| FR-4 | **Punctual Lock-Screen Delivery:** Push notification arrives at user's configured morning time with a BigPicture preview | P1 |
| FR-5 | **Single-Tap Dispatch:** Android app populates native share targets (WhatsApp, Facebook) with image + formatted text in one tap | P0 |
| FR-6 | **Evolution Telemetry:** System logs share/dismiss/tweak actions and feeds them back to improve future generations | P2 |
| FR-7 | **Tone Tweaking:** User can request on-the-fly regeneration with modified tone, shloka, or backdrop | P1 |

### 3.2 Non-Functional Requirements (NFR)

| ID | Requirement | Target |
|---|---|---|
| NFR-1 | **Punctual Delivery SLA** | All batch processing concludes by 05:00 AM; FCM notifications arrive by 06:00 AM IST |
| NFR-2 | **Indic Typography Precision** | Zero glyph clipping for Devanagari, Tamil, Telugu conjuncts |
| NFR-3 | **Zero-Prompt UX** | No AI prompt box after onboarding; UI is preview cards + toggle + dispatch buttons only |
| NFR-4 | **Compositing Speed** | < 1.5 seconds per image composite |
| NFR-5 | **RAG Cache Latency** | < 100ms on cached panchang/tithi hits |
| NFR-6 | **Image Output** | 1080×1350 px WebP, quality 85, < 1.2 MB file size |

---

## 4. Core Data Entities

### 4.1 Entity-Relationship Overview

```
User 1──1 PreferenceProfile
User 1──* Artifact
Artifact *──1 CulturalEvent
Artifact 1──* DispatchLog
```

### 4.2 Entity Definitions

**1. User** — Account holder and persistent identity assets.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `phone_number` | String | Primary credential for auth & WhatsApp sync |
| `display_name` | String | Full name displayed on banners |
| `designation` | String (nullable) | Formal community title |
| `portrait_url` | URL | Alpha-transparent portrait cutout (Cloudflare R2) |
| `is_active` | Boolean | Whether the user receives daily generations |
| `fcm_device_token` | String (nullable) | Firebase Cloud Messaging token |
| `created_at` / `updated_at` | Timestamp | Audit fields |

**2. PreferenceProfile** — Onboarding calibration data that narrows the agent's generative scope.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `user_id` | FK → User | One-to-one |
| `archetype` | Enum | `CULTURAL_LEADER`, `CIVIC_REPRESENTATIVE`, `FAMILY_HEAD`, `LOCAL_PROFESSIONAL` |
| `calendar_subscriptions` | JSON Array | `["PANCHANG_NORTH_INDIAN", "NATIONAL_GAZETTED", "CIVIC_DAYS"]` |
| `priority_deities` | JSON Array | `["SHIVA", "HANUMAN"]` |
| `language_code` | String | `hi_IN`, `sa_IN`, `gu_IN` |
| `tone_register` | Enum | `REVERENT_DEVOTIONAL`, `CIVIC_AUTHORITATIVE`, `WARM_FAMILIAL` |
| `target_channels` | JSON Array | `["WHATSAPP_STATUS", "WHATSAPP_CHAT", "FACEBOOK"]` |
| `scheduled_delivery_time` | Time+TZ | Default: `06:00:00+05:30` |

**3. CulturalEvent** — Temporal milestones ingested from external calendar engines.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `canonical_name` | String | e.g., `KARTIK_PURNIMA`, `INDEPENDENCE_DAY` |
| `event_type` | Enum | `PANCHANG_TITHI`, `SOLAR_FESTIVAL`, `NATIONAL_HOLIDAY`, `CIVIC_PULSE` |
| `event_date` | Date | Calendar date |
| `tithi_details` | JSON | Astronomical data (muhurta, bhadra timings) |
| `significance_summary` | Text | Contextual summary for LLM prompt engine |
| `presiding_deity` | String (nullable) | e.g., `SHIVA`, `VISHNU` |
| `lookahead_days` | Integer | Advance notification threshold |

**4. Artifact (GreetingPost)** — Synthesized multimodal asset for user review and dispatch.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `user_id` | FK → User | Owner |
| `event_id` | FK → CulturalEvent | Associated event |
| `headline` | String | Inscribed title in user's language |
| `body_copy` | Text | Blessing, shloka, or quote |
| `shloka_source` | String (nullable) | Verified source reference for the verse |
| `background_image_url` | URL | Raw AI-generated backdrop |
| `composite_image_url` | URL | Final composited image |
| `status` | Enum | `PENDING_GENERATION`, `READY_FOR_REVIEW`, `APPROVED`, `DISMISSED`, `FAILED` |
| `created_at` | Timestamp | Generation time (typically 03:00–04:00 AM IST) |

**5. DispatchLog** — Audit record tracking human-in-the-loop decisions.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `artifact_id` | FK → Artifact | Associated artifact |
| `user_id` | FK → User | Acting user |
| `action` | Enum | `SHARED_ONE_TAP`, `EDIT_REQUESTED`, `DISMISSED_EXPIRED` |
| `target_platform` | Enum | `WHATSAPP_STATUS`, `WHATSAPP_CHAT`, `FACEBOOK`, `MANUAL_DOWNLOAD` |
| `user_feedback_rating` | Integer (nullable) | 1–5 score |
| `action_timestamp` | Timestamp | When the user acted |

---

## 5. Architecture & Technology Stack

### 5.1 Cost-Optimized Stack (95%+ Savings vs Full AWS)

| Layer | Technology | Monthly Cost |
|---|---|---|
| **Agent Orchestrator** | Strands Agents SDK (Python, self-hosted) | $0 |
| **LLM Inference** | Amazon Bedrock (Claude 3.5 Haiku + Titan Image) — pay-per-call | ~$10–20 |
| **Policy Guardrails** | `cedarpolicy` (open-source Rust/Python) — in-process | $0 |
| **Knowledge Base / RAG** | Supabase PostgreSQL 16 + `pgvector` (free tier) | $0 |
| **User State & Auth** | Supabase PostgreSQL (same instance) | $0 |
| **Asset Storage & CDN** | Cloudflare R2 + CDN (10 GB free, $0 egress) | $0 |
| **Image Compositing** | Docker container (Pillow/Skia-Python) | $5–10 |
| **Scheduling** | APScheduler / `node-cron` (in-process) | $0 |
| **Push Notifications** | Firebase Cloud Messaging (completely free) | $0 |
| **Cache** | Redis (Upstash free tier) or in-memory | $0–5 |
| **Total** | — | **~$15–35/mo** |

### 5.2 Project Directory Structure

```
agentic-pr-manager/
├── backend/                          # Python monorepo
│   ├── pyproject.toml                # Project metadata & dependencies
│   ├── .env.example                  # Environment variable template
│   │
│   ├── app/                          # FastAPI application
│   │   ├── main.py                   # FastAPI app entry point
│   │   ├── config.py                 # Settings (Pydantic BaseSettings)
│   │   ├── database.py               # Supabase/Postgres connection
│   │   │
│   │   ├── models/                   # SQLAlchemy / Pydantic models
│   │   │   ├── user.py
│   │   │   ├── preference_profile.py
│   │   │   ├── cultural_event.py
│   │   │   ├── artifact.py
│   │   │   └── dispatch_log.py
│   │   │
│   │   ├── routers/                  # FastAPI route handlers
│   │   │   ├── auth.py               # OTP send/verify
│   │   │   ├── users.py              # Onboard, profile, portrait
│   │   │   ├── calendar.py           # Today, upcoming, archetypes
│   │   │   ├── artifacts.py          # Daily, history, tweak, dispatch
│   │   │   ├── devices.py            # FCM token management
│   │   │   └── health.py             # System health
│   │   │
│   │   └── services/                 # Business logic layer
│   │       ├── portrait_service.py   # rembg background removal
│   │       ├── storage_service.py    # Cloudflare R2 operations
│   │       └── dispatch_service.py   # FCM push notifications
│   │
│   ├── agent/                        # Strands Agent Core
│   │   ├── orchestrator.py           # Main Strands Agent definition
│   │   ├── tools/                    # Custom @tool functions
│   │   │   ├── rag_tool.py           # pgvector shloka retrieval
│   │   │   ├── cedar_tool.py         # Cedar policy validation
│   │   │   ├── bedrock_image_tool.py # Titan Image backdrop generation
│   │   │   └── compositor_tool.py    # Pillow/Skia compositing
│   │   └── prompts/                  # System prompt templates
│   │       └── orchestrator_prompt.py
│   │
│   ├── mcp_servers/                  # MCP Server implementations
│   │   ├── panchang_server.py        # Cultural calendar MCP
│   │   └── shloka_server.py          # Verse knowledge base MCP
│   │
│   ├── scheduler/                    # Batch job scheduler
│   │   └── batch_runner.py           # APScheduler cron jobs
│   │
│   ├── compositor/                   # Image compositing engine
│   │   ├── engine.py                 # Pillow/Skia rendering pipeline
│   │   ├── templates/                # Layout templates (JSON)
│   │   └── fonts/                    # Noto Sans Devanagari, etc.
│   │
│   ├── policies/                     # Cedar policy files
│   │   └── artifact_generation.cedar
│   │
│   ├── seeds/                        # Database seed data
│   │   ├── shlokas.json              # Verified Sanskrit verses
│   │   ├── events_2026.json          # Cultural calendar entries
│   │   └── embeddings_seed.py        # Generate & store pgvector embeddings
│   │
│   └── tests/
│       ├── test_agent.py
│       ├── test_compositor.py
│       └── test_api.py
│
├── android/                          # Kotlin Android app
│   └── app/
│       └── src/main/
│           ├── java/.../
│           │   ├── MainActivity.kt
│           │   ├── ui/               # Jetpack Compose screens
│           │   ├── data/             # Repository + API client
│           │   ├── notifications/    # FCM service + BigPicture
│           │   └── sharing/          # Intent dispatcher
│           └── res/
│
├── docs/                             # Documentation
│   ├── Agentic_Personalization_Agent_Manager.md  # This file
│   ├── DEVELOPMENT_LOG.md
│   └── API_SPEC.md
│
├── docker-compose.yml                # Local dev environment
├── Dockerfile                        # Backend container
└── README.md
```

---

## 6. Strands Agent Orchestration Design

### 6.1 Agent Architecture Overview

The **Strands Orchestrator** is the brain of the system. It is a single `Agent` instance backed by Amazon Bedrock (Claude 3.5 Haiku) that uses a combination of **custom `@tool` functions** and **MCP server connections** to execute the full artifact generation pipeline.

```python
from strands import Agent, tool
from strands.models import BedrockModel
from strands.tools.mcp import MCPClient

# ── Model Provider ──────────────────────────────────────────
bedrock_model = BedrockModel(
    model_id="anthropic.claude-3-5-haiku-20241022-v1:0",
    region_name="us-east-1",
    temperature=0.3,
)

# ── MCP Servers (Cultural Context + Shloka KB) ─────────────
mcp_panchang = MCPClient(
    command="python",
    args=["mcp_servers/panchang_server.py"],
)
mcp_shlokas = MCPClient(
    command="python",
    args=["mcp_servers/shloka_server.py"],
)

# ── Core Agent Definition ───────────────────────────────────
agent = Agent(
    model=bedrock_model,
    system_prompt=ORCHESTRATOR_SYSTEM_PROMPT,
    tools=[
        mcp_panchang,       # MCP: get_cultural_context, get_upcoming_events
        mcp_shlokas,        # MCP: search_shlokas, get_shloka_by_id
        rag_search_tool,    # @tool: pgvector similarity search
        cedar_validate,     # @tool: Cedar policy check
        generate_backdrop,  # @tool: Bedrock Titan Image generation
        compose_image,      # @tool: Pillow/Skia deterministic compositing
        store_artifact,     # @tool: Save to R2 + database
    ],
)
```

### 6.2 Custom Tool Definitions

```python
@tool
def rag_search_tool(query: str, top_k: int = 3) -> str:
    """Search the verified shloka and blessing database using semantic similarity.
    Returns top-k matching verses with source references."""
    # Embed query via Bedrock → cosine search on pgvector
    ...

@tool
def cedar_validate(user_id: str, action: str, resource: str, context: dict) -> str:
    """Validate a proposed artifact against Cedar authorization policies.
    Returns ALLOW or DENY with the reason."""
    # cedarpolicy.is_authorized(...)
    ...

@tool
def generate_backdrop(prompt: str, style: str = "cinematic") -> str:
    """Generate an AI backdrop image using Amazon Bedrock Titan Image Generator.
    Returns the temporary R2 URL of the generated image."""
    # bedrock_runtime.invoke_model(modelId="amazon.titan-image-generator-v2:0", ...)
    ...

@tool
def compose_image(
    background_url: str,
    portrait_url: str,
    headline: str,
    shloka: str,
    user_name: str,
    user_designation: str,
) -> str:
    """Deterministically composite the final greeting card image.
    Layers: background → gradient scrim → Devanagari text → portrait circle → name banner.
    Returns the final CDN URL of the composited WebP image."""
    ...

@tool
def store_artifact(user_id: str, event_id: str, headline: str,
                   body_copy: str, image_url: str) -> str:
    """Persist the completed artifact record to the database and return the artifact ID."""
    ...
```

### 6.3 MCP Server: Panchang Calendar (`mcp_servers/panchang_server.py`)

Built with `FastMCP` from the official MCP Python SDK. Exposes tools that the Strands agent calls via the `MCPClient` transport.

```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("panchang-server")

@mcp.tool()
def get_cultural_context(date: str, lat: float, lon: float) -> dict:
    """Get today's cultural context: tithi, presiding deity, muhurta, festivals.
    Returns structured JSON with event details and significance."""
    # 1. Check Redis cache → panchang:{date}:{lat}_{lon}
    # 2. If miss: query Drik Panchang API / ephemeris
    # 3. Compute tithi, deity, fasting rules, muhurta
    ...

@mcp.tool()
def get_upcoming_events(days_ahead: int = 14, region: str = "NORTH_INDIAN") -> list:
    """Fetch upcoming cultural events for the next N days.
    Returns a list of events with canonical names, dates, and types."""
    ...
```

### 6.4 MCP Server: Shloka Knowledge Base (`mcp_servers/shloka_server.py`)

```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("shloka-server")

@mcp.tool()
def search_shlokas(query: str, deity: str = None, language: str = "sa_IN", top_k: int = 3) -> list:
    """Search verified Sanskrit shlokas and Hindi blessings by semantic similarity.
    Filters by deity affinity if provided. Returns verses with source attribution."""
    # pgvector cosine similarity search
    ...

@mcp.tool()
def get_shloka_by_id(shloka_id: str) -> dict:
    """Retrieve a specific shloka by its database ID.
    Returns the verse text, transliteration, meaning, and source."""
    ...
```

### 6.5 Agent Execution Flow (Per User, Per Day)

```
┌─────────────────────────────────────────────────────────┐
│                  Strands Agent Loop                      │
│                                                          │
│  1. Agent receives: { user_id, date, preferences }       │
│           │                                              │
│  2. Agent calls MCP: get_cultural_context(date, lat, lon)│
│           │ → Returns: tithi, deity, significance        │
│           │                                              │
│  3. Agent calls MCP: search_shlokas(event, deity)        │
│           │ → Returns: top-3 verified verses             │
│           │                                              │
│  4. Agent internally drafts:                             │
│           │   • headline (matching tone_register)        │
│           │   • body_copy (personalized blessing)        │
│           │   • backdrop prompt                          │
│           │                                              │
│  5. Agent calls: cedar_validate(user, action, context)   │
│           │ → ALLOW / DENY (retry with mutations)        │
│           │                                              │
│  6. Agent calls: generate_backdrop(prompt)                │
│           │ → Returns: temp backdrop URL                 │
│           │                                              │
│  7. Agent calls: compose_image(bg, portrait, text...)    │
│           │ → Returns: final CDN URL (1080×1350 WebP)    │
│           │                                              │
│  8. Agent calls: store_artifact(user_id, event_id, ...)  │
│           │ → Returns: artifact_id                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 7. Component-Wise Engineering Specification

### Component 1: Ingestion & Persona Engine (`service-personalizer`)

- **Role:** User authentication, profile calibration, portrait preprocessing.
- **Tech:** FastAPI (Python 3.12+), Supabase PostgreSQL, Cloudflare R2, `rembg` / `BiRefNet`.
- **Input:** `POST /api/v1/users/onboard` — user metadata, archetype, raw selfie (Base64/Multipart).
- **Processing:**
  1. `rembg.remove()` → alpha-transparent PNG
  2. Upload to R2 `user-portraits/{user_id}.png`
  3. Persist to Supabase `users` + `preference_profiles`
- **Output:** HTTP 201 → `{ user_id, archetype, portrait_cdn_url }`
- **Invariants:** Portraits must be 32-bit WebP/PNG at 1024×1024 px. Non-null enforcement on `archetype`, `tone`, `delivery_time`.

### Component 2: Cultural Context MCP (`service-context-provider`)

- **Role:** Panchang calendar ingestion and daily cultural milestone calculation.
- **Tech:** FastMCP Python server, Drik Panchang API, Redis cache-aside.
- **Interface:** MCP tools consumed by Strands agent via `MCPClient(command="python", args=["mcp_servers/panchang_server.py"])`.
- **Invariants:** < 100ms on cached hits. Deterministic fallback to solar weekday greetings if no tithi is active.

### Component 3: Strands Orchestrator & Policy Guardrail (`service-agent-core`)

- **Role:** Central reasoning loop — shloka RAG, copy drafting, Cedar policy enforcement, image synthesis request.
- **Tech:** `strands-agents` (Python), `cedarpolicy`, Supabase `pgvector`, Amazon Bedrock.
- **Trigger:** Batch job enqueues `{ user_id, date }` messages.
- **Invariants:** Zero hallucinated verses (only pgvector-validated). Cedar `Deny` → auto-mutate copy and retry.

### Component 4: Sandboxed Compositor (`worker-compositor`)

- **Role:** Deterministic image compositing — layers backdrop + text + portrait + border.
- **Tech:** Pillow / Skia-Python, Docker container (`--cpus=1.0 --memory=512m --read-only`).
- **Pipeline:** Background → dark gradient scrim → Devanagari vector text → portrait circle (gold border) → name banner → WebP export.
- **Invariants:** < 1.5s per composite. 1080×1350 px WebP, quality 85, < 1.2 MB. All Indic text rendered as vector overlays (no raster text).

### Component 5: Batch Scheduler & Notification Worker (`service-dispatcher`)

- **Role:** Nightly batch coordination and morning FCM push dispatch.
- **Tech:** APScheduler (Python) or Node.js cron, `firebase-admin` SDK, Redis Streams.
- **Schedule:**
  - 02:30 AM IST: Select active users → enqueue generation jobs
  - 06:00 AM IST: Verify artifacts → send FCM high-priority data messages
- **Invariants:** FCM handoff window: 05:59:30–06:00:30 IST. Auto-nullify expired FCM tokens on 404/Unregistered.

### Component 6: Native Android Client (`client-android`)

- **Role:** Lock-screen previews, single-tap sharing, telemetry.
- **Tech:** Kotlin, Jetpack Compose, Coil, Android `FileProvider`, `NotificationCompat.BigPictureStyle`.
- **Push Handling:** `FirebaseMessagingService.onMessageReceived()` → BigPicture notification with "Share to WhatsApp" + "Tweak Tone" action buttons.
- **Invariants:** ≤ 2 taps from notification to WhatsApp share. No gallery duplication unless explicitly downloaded.

---

## 8. Component Communication Topology

```text
[02:30 AM IST] Cron Trigger (APScheduler)
      │
      ▼
+------------------------------------+
| Component 5: Dispatcher Scheduler  |
| (Selects active users from DB)     |
+------------------------------------+
      │
      │ 1. Enqueues { user_id, date } to Redis Stream
      ▼
+------------------------------------+
| Component 3: Strands Orchestrator  | ◄── Enforces Cedar Policy (local)
| (strands-agents + BedrockModel)    |
+------------------------------------+
      │                         │
      │ 2. MCP Call:            │ 3. MCP Call:
      │ get_cultural_context()  │ search_shlokas()
      ▼                         ▼
+--------------------+    +----------------------+
| Component 2:       |    | Shloka MCP Server    |
| Panchang MCP       |    | (pgvector search)    |
+--------------------+    +----------------------+
      │
      │ 4. @tool: generate_backdrop() → Bedrock Titan Image
      │ 5. @tool: compose_image() → Pillow/Skia
      ▼
+------------------------------------+
| Component 4: Compositor Worker     | ◄── Reads Portrait from R2
| (Pillow/Skia in Docker sandbox)    |
+------------------------------------+
      │
      │ 6. Writes Final WebP → R2
      ▼
+------------------------------------+
| Cloudflare R2 / CDN Storage        |
+------------------------------------+
      ▲
      │ 7. Reads CDN URI @ 06:00 AM IST
+------------------------------------+
| Component 5: Dispatcher (FCM Send) |
+------------------------------------+
      │
      │ 8. High-Priority FCM Push
      ▼
+------------------------------------+
| Component 6: Android Client        |
| (BigPicture Lock-Screen Preview)   |
+------------------------------------+
      │
      │ 9. One-Tap: Intent.ACTION_SEND
      ▼
+------------------------------------+
| WhatsApp Status / Groups           |
+------------------------------------+
```

---

## 9. REST API Endpoint Matrix

### 9.1 Authentication & Identity

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/otp/send` | Trigger SMS OTP verification |
| POST | `/api/v1/auth/otp/verify` | Validate OTP, issue JWT session tokens |
| GET | `/api/v1/users/me` | Retrieve authenticated user's core profile |
| GET | `/api/v1/users/me/profile` | Fetch current PreferenceProfile |
| GET | `/api/v1/users/me/portrait` | Fetch pre-signed CDN URL for portrait |
| POST | `/api/v1/users/onboard` | Ingest onboarding questionnaire, assign archetype |
| POST | `/api/v1/users/portrait/upload-url` | Request pre-signed upload URL for headshot |
| PUT | `/api/v1/users/me/profile` | Full replacement of archetype & preferences |
| PATCH | `/api/v1/users/me/profile` | Partial mutation (delivery time, event feeds) |
| PATCH | `/api/v1/users/me` | Update display name, community title |
| DELETE | `/api/v1/users/me` | Cascade delete account, assets, and memory |

### 9.2 Calendar & Cultural Context

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/calendar/today` | Today's tithi, deity, muhurta, holidays |
| GET | `/api/v1/calendar/upcoming` | 14–30 day forward lookahead |
| GET | `/api/v1/calendar/archetypes` | List supported engagement archetypes |
| GET | `/api/v1/calendar/deities` | List selectable spiritual affinities |

### 9.3 Artifacts & Generation Lifecycle

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/artifacts/daily` | Today's review-ready greeting artifact |
| GET | `/api/v1/artifacts/{artifact_id}` | Specific artifact metadata & asset URIs |
| GET | `/api/v1/artifacts/history` | Paginated historical feed |
| GET | `/api/v1/artifacts/{artifact_id}/preview` | Low-res thumbnail during generation |
| POST | `/api/v1/artifacts/{artifact_id}/dispatch` | Record lock-screen approval & log destination |
| POST | `/api/v1/artifacts/{artifact_id}/tweak` | Request regeneration with modified tone/shloka |
| DELETE | `/api/v1/artifacts/{artifact_id}` | Dismiss and hide a generated card |

### 9.4 Device & Telemetry

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/device/fcm-token` | Register/refresh FCM device token |
| DELETE | `/api/v1/device/fcm-token/{token}` | Deregister device token on logout |
| GET | `/api/v1/dispatch/logs` | Historical audit log of sharing actions |
| GET | `/api/v1/system/health` | Service heartbeat endpoint |

---

## 10. Key Dependencies & Packages

### Backend (Python 3.12+)

```
strands-agents>=0.1.0        # Core agent framework
strands-agents-tools>=0.1.0  # Community tool extensions
mcp[cli]>=1.0.0              # MCP server SDK (FastMCP)
fastapi>=0.115.0             # HTTP API framework
uvicorn>=0.30.0              # ASGI server
sqlalchemy>=2.0.0            # ORM
asyncpg>=0.30.0              # Async Postgres driver
pgvector>=0.3.0              # pgvector SQLAlchemy extension
supabase>=2.0.0              # Supabase Python client
boto3>=1.35.0                # AWS SDK (Bedrock)
cedarpolicy>=4.0.0           # Cedar authorization engine
pillow>=11.0.0               # Image compositing
rembg>=2.0.0                 # Background removal
apscheduler>=3.10.0          # Job scheduling
firebase-admin>=6.0.0        # FCM push notifications
redis>=5.0.0                 # Cache layer
httpx>=0.27.0                # HTTP client
python-jose>=3.3.0           # JWT handling
```

### Android (Kotlin)

```
Jetpack Compose (BOM)
Coil (Image loading)
Retrofit + OkHttp (API client)
Firebase Cloud Messaging
Hilt (Dependency Injection)
```
