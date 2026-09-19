# Agentic PR Manager — Backend

> ॐ श्री गणेशाय नमः

Autonomous agentic pipeline for culturally-accurate, personalized greeting card generation and single-tap social dispatch.

## Quick Start

### Prerequisites
- Python 3.12+
- Docker & Docker Compose (for local Postgres + Redis)
- AWS account with Bedrock access (Claude 3.5 Haiku + Titan Image)

### Setup

```bash
# 1. Clone and navigate
cd backend

# 2. Create virtual environment
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/Mac

# 3. Install dependencies
pip install -e ".[dev]"

# 4. Copy environment config
copy .env.example .env
# Edit .env with your credentials

# 5. Start local services (Postgres + Redis)
docker compose up -d

# 6. Run the FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### API Documentation
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Running MCP Servers (Standalone Testing)
```bash
python -m mcp_servers.panchang_server
python -m mcp_servers.shloka_server
```

### Running the Agent (Interactive)
```bash
python -m agent.orchestrator
```

## Project Structure

```
backend/
├── app/                    # FastAPI application
│   ├── main.py             # Entry point
│   ├── config.py           # Settings
│   ├── database.py         # Async SQLAlchemy
│   ├── schemas.py          # Pydantic DTOs
│   ├── models/             # ORM entities
│   └── routers/            # API endpoints
│       ├── auth.py
│       ├── users.py
│       ├── calendar.py
│       ├── artifacts.py
│       └── devices.py
├── agent/                  # Strands Agent
│   ├── orchestrator.py     # Main agent
│   ├── tools/              # Custom @tool functions
│   └── prompts/            # System prompts
├── mcp_servers/            # MCP Server implementations
│   ├── panchang_server.py  # Cultural calendar
│   └── shloka_server.py    # Verse knowledge base
├── compositor/             # Image compositing
│   └── engine.py           # Pillow pipeline
├── scheduler/              # Batch jobs
│   └── batch_runner.py     # APScheduler cron
├── policies/               # Cedar policy files
├── seeds/                  # Database seed data
└── docker-compose.yml      # Local dev stack
```
