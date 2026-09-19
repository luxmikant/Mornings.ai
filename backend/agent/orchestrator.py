"""
Agentic PR Manager — Strands Agent Orchestrator

Uses the Strands Agents SDK (`strands-agents`) for clean, declarative
agent orchestration backed by Amazon Bedrock.

MCP Servers (Panchang Calendar + Shloka Knowledge Base) are connected
via `MCPClient` over stdio transport. Custom tools use the `@tool` decorator.

This module is imported by:
  - `agentcore_app.py`   → for AWS Bedrock AgentCore deployment
  - `batch_runner.py`    → for nightly scheduled generation
  - `routers/artifacts.py` → for on-demand generation via the API
"""

import logging
from pathlib import Path
from typing import Optional

from strands import Agent
from strands.models import BedrockModel
from strands.tools.mcp import MCPClient
from mcp import stdio_client, StdioServerParameters

from app.config import get_settings
from agent.prompts.orchestrator_prompt import ORCHESTRATOR_SYSTEM_PROMPT
from agent.tools.cedar_tool import cedar_validate
from agent.tools.rag_tool import rag_search_tool
from agent.tools.bedrock_image_tool import generate_backdrop
from agent.tools.compositor_tool import compose_image
from agent.tools.gemini_tool import generate_creative_copy

logger = logging.getLogger(__name__)
settings = get_settings()

# ═══════════════════════════════════════════════════════════
# MCP Server Directory (relative to backend/)
# ═══════════════════════════════════════════════════════════
MCP_SERVER_DIR = Path(__file__).resolve().parent.parent / "mcp_servers"


# ═══════════════════════════════════════════════════════════
# Model Provider
# ═══════════════════════════════════════════════════════════

def _create_bedrock_model() -> BedrockModel:
    """Configures the Amazon Bedrock model provider for Strands."""
    return BedrockModel(
        model_id=settings.bedrock_model_id,
        region_name=settings.aws_region,
        temperature=0.3,
        max_tokens=4096,
        streaming=True,
    )


# ═══════════════════════════════════════════════════════════
# MCP Client Factories
# ═══════════════════════════════════════════════════════════

def _create_panchang_mcp() -> MCPClient:
    """Connects to the Panchang cultural calendar MCP server via stdio."""
    server_path = str(MCP_SERVER_DIR / "panchang_server.py")
    return MCPClient(lambda: stdio_client(
        StdioServerParameters(
            command="python",
            args=[server_path],
        )
    ))


def _create_shloka_mcp() -> MCPClient:
    """Connects to the Shloka knowledge base MCP server via stdio."""
    server_path = str(MCP_SERVER_DIR / "shloka_server.py")
    return MCPClient(lambda: stdio_client(
        StdioServerParameters(
            command="python",
            args=[server_path],
        )
    ))


# ═══════════════════════════════════════════════════════════
# Agent Factory
# ═══════════════════════════════════════════════════════════

def create_agent(system_prompt: Optional[str] = None) -> Agent:
    """
    Creates and returns a fully configured Strands Agent instance.

    The agent is equipped with:
      - BedrockModel (Claude 3 Haiku) for reasoning
      - 2 MCP servers (Panchang + Shloka) for cultural context
      - 5 custom @tool functions for generation pipeline

    Args:
        system_prompt: Optional override for the system prompt.
                       Defaults to ORCHESTRATOR_SYSTEM_PROMPT.

    Returns:
        A ready-to-invoke Strands Agent.
    """
    model = _create_bedrock_model()

    # MCP tool providers (auto-managed lifecycle)
    mcp_panchang = _create_panchang_mcp()
    mcp_shloka = _create_shloka_mcp()

    agent = Agent(
        model=model,
        system_prompt=system_prompt or ORCHESTRATOR_SYSTEM_PROMPT,
        tools=[
            # MCP servers (expose get_cultural_context, get_upcoming_events,
            #              search_shlokas, get_shloka_by_id)
            mcp_panchang,
            mcp_shloka,
            # Custom @tool functions
            cedar_validate,
            rag_search_tool,
            generate_creative_copy,
            generate_backdrop,
            compose_image,
        ],
    )

    logger.info("Strands Agent created with BedrockModel + 2 MCP servers + 5 tools.")
    return agent


# ═══════════════════════════════════════════════════════════
# Generation Entry Point
# ═══════════════════════════════════════════════════════════

async def run_generation_for_user(
    user_id: str,
    date_str: str,
    user_context: dict,
) -> dict:
    """
    Main entry point for generating a greeting card for a user.

    Constructs a personalized prompt from the user's preference profile
    and invokes the Strands agent. The agent autonomously:
      1. Resolves cultural context via MCP (Panchang)
      2. Searches for relevant shlokas via MCP (Shloka KB)
      3. Validates against Cedar policies
      4. Generates creative copy via Gemini
      5. Generates AI backdrop image
      6. Composites the final greeting card

    Args:
        user_id: The UUID of the user.
        date_str: Target date in YYYY-MM-DD format.
        user_context: Dict with keys: display_name, designation,
                      archetype, tone_register, language_code,
                      priority_deities, layout_style, color_theme,
                      custom_signoff.

    Returns:
        Dict with 'status' and 'agent_response' keys.
    """
    # Build the personalized prompt from user preferences
    prompt = ORCHESTRATOR_SYSTEM_PROMPT.format(
        user_name=user_context.get("display_name", "User"),
        user_designation=user_context.get("designation", ""),
        archetype=user_context.get("archetype", "FAMILY_HEAD"),
        tone_register=user_context.get("tone_register", "REVERENT_DEVOTIONAL"),
        language_code=user_context.get("language_code", "hi_IN"),
        deity_preferences=", ".join(user_context.get("priority_deities", [])),
        date=date_str,
    )

    generation_instruction = (
        f"Generate a personalized greeting card for date {date_str}. "
        f"The user's name is {user_context.get('display_name')} "
        f"({user_context.get('designation', 'समाजसेवी')}). "
        f"Their preferred color theme is {user_context.get('color_theme', 'ROYAL_SAFFRON')}. "
        f"Layout style: {user_context.get('layout_style', 'SIDE_BY_SIDE')}. "
        f"Follow the full generation pipeline."
    )

    try:
        agent = create_agent(system_prompt=prompt)
        result = agent(generation_instruction)
        logger.info(f"Agent generation complete for user {user_id}.")
        return {"status": "SUCCESS", "agent_response": str(result)}

    except Exception as e:
        logger.error(f"Agent generation failed for user {user_id}: {e}")
        return {"status": "FAILED", "agent_response": str(e)}
