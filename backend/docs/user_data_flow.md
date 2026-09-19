# User Data Flow — From Onboarding to Artifact Generation

> This document traces how user preference data flows through the
> multi-agent system, from the moment a user opens the Android app
> to the moment a personalized greeting card is generated.

---

## 1. Data Ingestion: Android Onboarding → FastAPI → SQLite

```
┌─────────────────────────┐
│     Android App         │
│  (Jetpack Compose UI)   │
│                         │
│  User fills 6 Pillars:  │
│  ┌───────────────────┐  │
│  │ Name & Title      │  │
│  │ Portrait Photo    │  │
│  │ Deity Preference  │  │
│  │ Festival Calendar │  │
│  │ Visual Palette    │  │
│  │ Tone & Sign-off   │  │
│  └───────────────────┘  │
└────────┬────────────────┘
         │ POST /api/v1/users/onboard
         │ (Multipart: JSON + Portrait Image)
         ▼
┌─────────────────────────┐
│     FastAPI Backend      │
│  routers/users.py        │
│                         │
│  1. Create User record  │
│  2. Process portrait    │
│     (rembg → alpha PNG) │
│  3. Create Preference   │
│     Profile record      │
│  4. Save to SQLite      │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│                    SQLite Database                        │
│                                                          │
│  ┌──────────────┐     ┌────────────────────────────────┐│
│  │    Users      │     │     PreferenceProfiles          ││
│  │──────────────│     │────────────────────────────────││
│  │ id (UUID)    │──┐  │ id (UUID)                      ││
│  │ display_name │  └──│ user_id (FK)                   ││
│  │ designation  │     │ archetype (Enum)               ││
│  │ portrait_url │     │ priority_deities (JSON Array)  ││
│  │ phone_number │     │ calendar_subscriptions (JSON)  ││
│  │ is_active    │     │ tone_register (Enum)           ││
│  │ fcm_token    │     │ language_code (String)         ││
│  └──────────────┘     │ layout_style (String)          ││
│                       │ color_theme (String)           ││
│                       │ custom_signoff (String)        ││
│                       │ scheduled_delivery_time (Time) ││
│                       │ target_channels (JSON Array)   ││
│                       └────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### Parameters Extracted (The 6 Pillars)

| # | Pillar | Database Field(s) | Example Value | How It Affects Generation |
|---|---|---|---|---|
| 1 | **Identity & Persona** | `display_name`, `designation`, `portrait_url` | "संजय वर्मा", "अध्यक्ष" | Overlaid on the final card by compositor |
| 2 | **Spiritual Tradition** | `priority_deities` | `["SHIVA", "GANESHA"]` | Dictates backdrop motifs and shloka selection |
| 3 | **Event Calendar** | `calendar_subscriptions` | `["PANCHANG_NORTH_INDIAN"]` | Filters which events trigger generation |
| 4 | **Visual Layout** | `layout_style`, `color_theme` | "SIDE_BY_SIDE", "ROYAL_SAFFRON" | Controls card composition and color grading |
| 5 | **Audience Tone** | `tone_register` | "REVERENT_DEVOTIONAL" | Shapes the Gemini copywriting prompt |
| 6 | **Sign-off** | `custom_signoff` | "विनीत: संजय वर्मा" | Appended to greeting text on the card |

---

## 2. Data Digestion: Preferences → Agentic Memory

The **Memory Agent** (conceptually Agent 2) doesn't exist as a separate
process — it's the backend logic in `routers/artifacts.py` and the
`batch_runner.py` scheduler that reads preferences from SQLite and
constructs the agent's context window.

```
┌──────────────────────────────────────────────────┐
│              PREFERENCE DIGESTION                 │
│                                                   │
│  SQLite Row (user_id=123):                        │
│  ┌─────────────────────────────────────────────┐  │
│  │ archetype: CULTURAL_LEADER                  │  │
│  │ priority_deities: ["SHIVA", "GANESHA"]      │  │
│  │ tone_register: REVERENT_DEVOTIONAL          │  │
│  │ language_code: hi_IN                        │  │
│  │ color_theme: ROYAL_SAFFRON                  │  │
│  │ layout_style: SIDE_BY_SIDE                  │  │
│  │ custom_signoff: "विनीत: संजय वर्मा"          │  │
│  └─────────────────────────────────────────────┘  │
│                     │                             │
│                     ▼                             │
│  Transformed into System Prompt Fragment:          │
│  ┌─────────────────────────────────────────────┐  │
│  │ "You are generating for a CULTURAL_LEADER.  │  │
│  │  Name: संजय वर्मा (अध्यक्ष).                │  │
│  │  Deity: SHIVA, GANESHA.                     │  │
│  │  Tone: REVERENT_DEVOTIONAL.                 │  │
│  │  Language: hi_IN.                           │  │
│  │  Color: ROYAL_SAFFRON."                     │  │
│  └─────────────────────────────────────────────┘  │
│                                                   │
│  This fragment is injected into the Strands Agent │
│  system prompt at invocation time.                │
└──────────────────────────────────────────────────┘
```

### Agent Memory via `agent-chat` Endpoint

When a user interacts via the "AI Agent Studio" (chat), the backend
also saves new events and preferences to the database memory:

```python
# From routers/artifacts.py → agent_chat_order()
if req.save_to_memory:
    # 1. Save new event to CulturalEvents table
    new_event = CulturalEvent(canonical_name="CUSTOM_FESTIVAL", ...)
    db.add(new_event)

    # 2. Update user's priority_deities in PreferenceProfile
    profile.priority_deities = current_deities + [new_event_name]
```

This means **future batch runs will automatically include this event**
when its date arrives.

---

## 3. Generation Day: The "Mix-Up" — Event × Preferences → Artifact

On the day of an event (or daily at 6 AM), the **Generation Agent**
(Agent 3) combines all data sources:

```
┌─────────────────────────────────────────────────────────────────┐
│                    GENERATION PIPELINE                           │
│                                                                  │
│  TRIGGER: batch_runner.py (02:30 AM IST) or POST /generate      │
│                                                                  │
│  INPUT FUSION:                                                   │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │  Event Theme     │  │  User Preferences │  │  User Assets   │  │
│  │  (from MCP)      │  │  (from SQLite)    │  │  (from R2/CDN) │  │
│  │─────────────────│  │──────────────────│  │────────────────│  │
│  │ "Diwali"        │  │ Deity: LAKSHMI   │  │ portrait.png   │  │
│  │ "Festival of    │  │ Tone: REVERENT   │  │ (alpha-cut)    │  │
│  │  Lights"        │  │ Palette: SAFFRON │  │                │  │
│  │ Deity: LAKSHMI  │  │ Layout: SIDE     │  │                │  │
│  └────────┬────────┘  └────────┬─────────┘  └───────┬────────┘  │
│           │                    │                     │           │
│           └────────────┬───────┘                     │           │
│                        ▼                             │           │
│  ┌─────────────────────────────────────────────┐     │           │
│  │         STRANDS AGENT EXECUTION LOOP         │     │           │
│  │                                              │     │           │
│  │  Step 1: MCP → get_cultural_context("Diwali")│     │           │
│  │  Step 2: MCP → search_shlokas(deity="LAKSHMI")│    │           │
│  │  Step 3: @tool → cedar_validate(...)         │     │           │
│  │  Step 4: @tool → generate_creative_copy(     │     │           │
│  │            topic="Diwali", tone="REVERENT")  │     │           │
│  │  Step 5: @tool → generate_backdrop(          │     │           │
│  │            "Diwali, Lakshmi motifs, saffron") │     │           │
│  │  Step 6: @tool → compose_image(              │◄────┘           │
│  │            bg, portrait, headline, shloka)   │                 │
│  └──────────────────────┬──────────────────────┘                 │
│                         │                                        │
│                         ▼                                        │
│  ┌──────────────────────────────────────────────┐                │
│  │           FINAL ARTIFACT                      │                │
│  │                                               │                │
│  │  1080×1350px WebP greeting card with:         │                │
│  │  ✓ AI-generated festive backdrop              │                │
│  │  ✓ Personalized Devanagari headline           │                │
│  │  ✓ Culturally authentic shloka                │                │
│  │  ✓ User's portrait (circular, gold border)    │                │
│  │  ✓ Name & designation banner                  │                │
│  └──────────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

### Why This Is Never "Common"

The prompt sent to the image generation model is **NOT** generic:

```
❌ Generic:  "Generate a Diwali greeting card"
✅ Agentic:  "Generate a Diwali backdrop. Palette: Saffron/Gold.
              Deity motifs: Lakshmi with diyas. Style: cinematic.
              Leave 40% negative space on the right for portrait.
              Mood: reverent, traditional, warm."
```

Every parameter from the user's 6-Pillar profile constrains the output,
making each card **unique to that specific user's public persona**.

---

## 4. Daily Morning Greeting Flow (Optional Parameter)

If the user opts in to daily morning greetings during onboarding:

```
scheduled_delivery_time = 06:00 AM IST
daily_greeting_enabled  = True  (stored in calendar_subscriptions)
```

The batch scheduler triggers at 02:30 AM IST:
1. Queries all users with `is_active=True`
2. For each user, checks if today matches any subscribed event
3. If no festival today → generates a "शुभ प्रभात" (Good Morning) card
   using the user's spiritual alignment for verse selection
4. Stores artifact → FCM push at 06:00 AM

---

## 5. Strands Agent Deployment on Bedrock AgentCore

```
┌─────────────────────────────────────────────────────────┐
│              AWS BEDROCK AGENTCORE RUNTIME                │
│                                                          │
│  ┌───────────────────────────────────────────────┐       │
│  │  agentcore_app.py                              │       │
│  │  ┌─────────────────────────────────────────┐   │       │
│  │  │  @app.entrypoint                        │   │       │
│  │  │  def invoke(payload):                   │   │       │
│  │  │      agent = create_agent(system_prompt)│   │       │
│  │  │      result = agent(prompt)             │   │       │
│  │  │      return result                      │   │       │
│  │  └─────────────────────────────────────────┘   │       │
│  │                                                │       │
│  │  ┌──────────────┐  ┌────────────────────────┐  │       │
│  │  │ BedrockModel │  │ MCPClient (Panchang)   │  │       │
│  │  │ Claude Haiku │  │ MCPClient (Shloka)     │  │       │
│  │  └──────────────┘  └────────────────────────┘  │       │
│  │                                                │       │
│  │  ┌──────────────────────────────────────────┐  │       │
│  │  │ @tool: cedar_validate                    │  │       │
│  │  │ @tool: rag_search_tool                   │  │       │
│  │  │ @tool: generate_creative_copy (Gemini)   │  │       │
│  │  │ @tool: generate_backdrop (NVIDIA/Pillow) │  │       │
│  │  │ @tool: compose_image (Compositor)        │  │       │
│  │  └──────────────────────────────────────────┘  │       │
│  └───────────────────────────────────────────────┘       │
│                                                          │
│  MicroVM Isolation │ Auto-Scaling │ IAM SigV4 │ CW Logs  │
└─────────────────────────────────────────────────────────┘
```
