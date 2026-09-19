# 🎇 Agentic PR Manager

> **Built for the "Agents for Humans" Hackathon**  
> An automated, agent-driven public relations engine designed for community leaders, public figures, and local politicians.

## 📖 Overview

**Agentic PR Manager** solves the "authenticity at scale" problem for public figures. Remembering cultural events, festivals, and personal milestones—and crafting unique, culturally accurate greeting cards for them—is a massive overhead. 

Instead of relying on generic templates, this project leverages the **Strands Agents SDK** and **AWS Bedrock AgentCore** to autonomously generate deeply personalized, aesthetic greeting cards (artifacts) perfectly aligned with the user's regional, spiritual, and aesthetic preferences.

### ✨ Key Features
*   **6-Pillar Personalization Engine:** Learns the user's archetype, priority deities, tone, language, aesthetic, and layout preferences during onboarding.
*   **Autonomous Agentic Orchestration:** Uses the Strands SDK to orchestrate a multi-agent workflow (researching the festival, generating creative copy via Gemini, generating the backdrop via Amazon Bedrock/NVIDIA NIM, and compositing the final image).
*   **Native MCP Server Integrations:** Real-time cultural context injected via custom Model Context Protocol (MCP) servers:
    *   `Panchang Server`: Calculates regional festival dates.
    *   `Shloka Server`: Retrieves contextually accurate Sanskrit verses.
*   **Production-Ready Deployment:** Packaged and deployed as a serverless agent runtime using **AWS Bedrock AgentCore**.
*   **Mobile MVP:** A clean Android application (Jetpack Compose) for users to view generated artifacts, approve drafts, and manage their AI agent studio.

---

## 🏗️ Architecture & Tech Stack

*   **Frontend:** Android (Kotlin, Jetpack Compose)
*   **Backend:** Python, FastAPI, SQLite (Async ORM)
*   **Agent Framework:** Strands SDK (`strands-agents`)
*   **Deployment & Infrastructure:** AWS Bedrock AgentCore (`bedrock-agentcore`)
*   **AI Models:**
    *   *Orchestration:* Anthropic Claude 3 Haiku (via Amazon Bedrock)
    *   *Creative Copy:* Google Gemini API
    *   *Image Generation:* Amazon Titan / NVIDIA NIM

---

## 📂 Project Structure

```text
├── android/ & android_app/    # Native Android MVP (Jetpack Compose UI)
├── backend/                   # Core Python application
│   ├── agent/                 # Strands SDK orchestrator, tools, and prompts
│   ├── agentcore/             # AWS Bedrock AgentCore deployment configuration
│   ├── app/                   # FastAPI backend, routers, and SQLite DB models
│   ├── mcp_servers/           # Model Context Protocol servers (Panchang, Shlokas)
│   ├── compositor/            # Image layering and text-rendering engine
│   └── scripts/               # CI/CD and verification scripts
└── docs/                      # Extensive architecture & data-flow documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
*   Python 3.12+
*   Node.js (for AgentCore CLI)
*   Android Studio (for compiling the Mobile MVP)
*   AWS CLI configured with Bedrock model access (Claude 3 Haiku)

### 2. Local Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Or .venv\Scripts\activate on Windows
pip install -r pyproject.toml
```

Set up your `.env` file (see `backend/.env.example` for required keys: `GEMINI_API_KEY`, `NVIDIA_API_KEY`).

Start the local API:
```bash
uvicorn app.main:app --reload
```

### 3. Deploy to AWS Bedrock AgentCore
This project natively utilizes AWS Bedrock AgentCore for serverless deployment.

```bash
cd backend
npm install -g @aws/agentcore
npx @aws/agentcore deploy
```

---

## 📝 License

This project was built as a Hackathon MVP. Feel free to fork, explore, and expand upon the multi-agent orchestration patterns!
