"""
Agentic PR Manager — AWS Bedrock AgentCore Deployment Entry Point

This module wraps the Strands Agent in a `BedrockAgentCoreApp` for
serverless deployment to AWS Bedrock AgentCore Runtime.

AgentCore provides:
  - MicroVM session isolation (Firecracker)
  - Automatic scaling
  - IAM SigV4 authentication
  - CloudWatch / X-Ray telemetry
  - Managed memory (STM / LTM)

Deployment Steps:
  1. `npm install -g @aws/agentcore`
  2. `agentcore configure`  (scans this file, creates .bedrock_agentcore.yaml)
  3. `agentcore launch`     (builds container, pushes to ECR, deploys)

Local Testing:
  `python agentcore_app.py`  (starts a local HTTP server)
"""

import json
import logging

from bedrock_agentcore.runtime import BedrockAgentCoreApp

from agent.orchestrator import create_agent

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# ═══════════════════════════════════════════════════════════
# AgentCore Application
# ═══════════════════════════════════════════════════════════

app = BedrockAgentCoreApp()

# Create the Strands agent once at module level for reuse across invocations
agent = create_agent()


@app.entrypoint
def invoke(payload: dict) -> dict:
    """
    AgentCore entry point — called upon HTTP/WebSocket invocation.

    AgentCore Runtime parses session headers and forwards the payload
    to this handler. The handler extracts the user prompt and context,
    invokes the Strands agent, and returns the result.

    Expected payload structure:
    {
        "prompt": "Generate a Diwali greeting card",
        "session_id": "session-user-123-2026-11-08",
        "user_context": {
            "display_name": "संजय वर्मा",
            "designation": "अध्यक्ष - व्यापार मंडल",
            "archetype": "CULTURAL_LEADER",
            "tone_register": "REVERENT_DEVOTIONAL",
            "language_code": "hi_IN",
            "priority_deities": ["SHIVA", "GANESHA"],
            "color_theme": "ROYAL_SAFFRON",
            "layout_style": "SIDE_BY_SIDE",
            "date": "2026-11-08"
        }
    }

    Returns:
        Dict with 'response', 'session_id', and 'status' keys.
    """
    prompt = payload.get("prompt", "")
    session_id = payload.get("session_id", "default")
    user_context = payload.get("user_context", {})

    logger.info(
        f"AgentCore invocation received. "
        f"Session: {session_id}, Prompt length: {len(prompt)}"
    )

    if not prompt:
        return {
            "response": "Error: No prompt provided in payload.",
            "session_id": session_id,
            "status": "FAILED",
        }

    try:
        # If user_context is provided, build a richer system prompt
        if user_context:
            from agent.prompts.orchestrator_prompt import ORCHESTRATOR_SYSTEM_PROMPT

            personalized_prompt = ORCHESTRATOR_SYSTEM_PROMPT.format(
                user_name=user_context.get("display_name", "User"),
                user_designation=user_context.get("designation", ""),
                archetype=user_context.get("archetype", "FAMILY_HEAD"),
                tone_register=user_context.get("tone_register", "REVERENT_DEVOTIONAL"),
                language_code=user_context.get("language_code", "hi_IN"),
                deity_preferences=", ".join(
                    user_context.get("priority_deities", [])
                ),
                date=user_context.get("date", "today"),
            )
            # Create a session-specific agent with personalized system prompt
            session_agent = create_agent(system_prompt=personalized_prompt)
            result = session_agent(prompt)
        else:
            result = agent(prompt)

        logger.info(f"AgentCore invocation complete for session {session_id}.")

        return {
            "response": str(result),
            "session_id": session_id,
            "status": "SUCCESS",
        }

    except Exception as e:
        logger.error(f"AgentCore invocation failed: {e}")
        return {
            "response": f"Agent execution error: {e}",
            "session_id": session_id,
            "status": "FAILED",
        }


# ═══════════════════════════════════════════════════════════
# Local Development Server
# ═══════════════════════════════════════════════════════════

if __name__ == "__main__":
    logger.info("Starting AgentCore app in local development mode...")
    app.run()
