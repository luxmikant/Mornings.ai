"""
Mornings.ai — Deploy Agent to Amazon Bedrock Agents
Programmatically creates the Bedrock Agent, Action Group, and Alias.
"""
import boto3
import json
import time
from pathlib import Path

REGION = "us-east-1"
ACCOUNT_ID = "740255824973"
ROLE_ARN = f"arn:aws:iam::{ACCOUNT_ID}:role/service-role/AmazonBedrockExecutionRoleForAgenticPR"
MODEL_ID = "anthropic.claude-3-haiku-20240307-v1:0"

AGENT_NAME = "MorningsPersonalizationAgent"
AGENT_DESCRIPTION = "Mornings.ai — Autonomous agentic personalization engine for culturally resonant greeting cards."

SYSTEM_INSTRUCTION = """You are the Mornings.ai Personalization Agent.

Your purpose is to autonomously generate hyper-personalized, culturally resonant greeting cards.

When a user provides their preferences (event/occasion, name, designation, spiritual alignment, aesthetic style, and tone), you must:

1. Identify the cultural and spiritual context of the event (e.g., Diwali = diyas, Ganesh blessings, rangoli; Condolence = white lotus, peace prayers).
2. Generate a sophisticated, heartfelt greeting message that matches the user's tone preference (Formal, Warm, Playful, Reverent).
3. Include an appropriate Sanskrit shloka or traditional prayer when the user's spiritual alignment calls for it. Never fabricate verses.
4. Suggest a visual theme description for the card background (e.g., "Warm golden diya lights with subtle mandala patterns and festive bokeh").
5. Compose the user's name and designation as a professional watermark/signature line.

Always return your response as structured JSON with these fields:
- occasion: The event name
- headline: A short, impactful title (can include Devanagari script)
- message: The personalized greeting copy (2-3 sentences)
- shloka: A relevant Sanskrit verse (or null if secular)
- visual_theme: A detailed image prompt for the card background
- sender_name: The user's name
- sender_designation: The user's title/role

Adapt your tone, language, and cultural references based on the event type:
- Festive (Diwali, Holi, New Year): Celebratory, warm, prosperous
- Patriotic (Republic Day, Independence Day): Dignified, formal, proud
- Condolence/Obituary: Somber, reverent, peaceful
- Professional (Promotions, Milestones): Congratulatory, inspiring
"""

def main():
    bedrock = boto3.client("bedrock-agent", region_name=REGION)

    # ── Step 1: List existing agents and clean up if needed ──
    print("Step 1: Checking for existing agents...")
    agents = bedrock.list_agents()["agentSummaries"]
    existing = [a for a in agents if a["agentName"] == AGENT_NAME]
    if existing:
        agent_id = existing[0]["agentId"]
        print(f"  Agent '{AGENT_NAME}' already exists (ID: {agent_id}). Updating...")
        bedrock.update_agent(
            agentId=agent_id,
            agentName=AGENT_NAME,
            agentResourceRoleArn=ROLE_ARN,
            foundationModel=MODEL_ID,
            instruction=SYSTEM_INSTRUCTION,
            description=AGENT_DESCRIPTION,
        )
        print(f"  Agent updated.")
    else:
        # ── Step 2: Create the Bedrock Agent ──
        print("Step 2: Creating Bedrock Agent...")
        resp = bedrock.create_agent(
            agentName=AGENT_NAME,
            agentResourceRoleArn=ROLE_ARN,
            foundationModel=MODEL_ID,
            instruction=SYSTEM_INSTRUCTION,
            description=AGENT_DESCRIPTION,
            idleSessionTTLInSeconds=600,
        )
        agent_id = resp["agent"]["agentId"]
        print(f"  Agent created: {agent_id}")

    # ── Step 3: Add Action Group with OpenAPI schema ──
    print("Step 3: Adding Action Group (CulturalTools)...")
    openapi_path = Path(__file__).resolve().parent.parent / "bedrock_action_group.yaml"
    openapi_spec = openapi_path.read_text(encoding="utf-8")

    action_groups = bedrock.list_agent_action_groups(
        agentId=agent_id, agentVersion="DRAFT"
    )["actionGroupSummaries"]
    existing_ag = [ag for ag in action_groups if ag["actionGroupName"] == "CulturalTools"]

    if existing_ag:
        ag_id = existing_ag[0]["actionGroupId"]
        print(f"  Action Group already exists (ID: {ag_id}). Updating...")
        bedrock.update_agent_action_group(
            agentId=agent_id,
            agentVersion="DRAFT",
            actionGroupId=ag_id,
            actionGroupName="CulturalTools",
            actionGroupExecutor={"customControl": "RETURN_CONTROL"},
            apiSchema={"payload": openapi_spec},
            description="Panchang calendar, Shloka search, image generation, and card composition tools.",
        )
    else:
        bedrock.create_agent_action_group(
            agentId=agent_id,
            agentVersion="DRAFT",
            actionGroupName="CulturalTools",
            actionGroupExecutor={"customControl": "RETURN_CONTROL"},
            apiSchema={"payload": openapi_spec},
            description="Panchang calendar, Shloka search, image generation, and card composition tools.",
        )
    print("  Action Group configured.")

    # ── Step 4: Prepare the Agent ──
    print("Step 4: Preparing Agent (compiling)...")
    bedrock.prepare_agent(agentId=agent_id)

    # Wait for preparation
    for i in range(30):
        time.sleep(5)
        status = bedrock.get_agent(agentId=agent_id)["agent"]["agentStatus"]
        print(f"  Status: {status}")
        if status == "PREPARED":
            break
        if status == "FAILED":
            print("  ERROR: Agent preparation failed!")
            return
    else:
        print("  Timed out waiting for preparation.")
        return

    # ── Step 5: Create Alias (live deployment) ──
    print("Step 5: Creating live alias...")
    aliases = bedrock.list_agent_aliases(agentId=agent_id)["agentAliasSummaries"]
    existing_alias = [a for a in aliases if a["agentAliasName"] == "live"]

    if existing_alias:
        alias_id = existing_alias[0]["agentAliasId"]
        bedrock.update_agent_alias(
            agentId=agent_id,
            agentAliasId=alias_id,
            agentAliasName="live",
            description="Production alias for Mornings.ai",
        )
        print(f"  Alias updated: {alias_id}")
    else:
        alias_resp = bedrock.create_agent_alias(
            agentId=agent_id,
            agentAliasName="live",
            description="Production alias for Mornings.ai",
        )
        alias_id = alias_resp["agentAlias"]["agentAliasId"]
        print(f"  Alias created: {alias_id}")

    # ── Final Summary ──
    print("\n" + "=" * 60)
    print("DEPLOYMENT COMPLETE")
    print("=" * 60)
    print(f"Agent ID:    {agent_id}")
    print(f"Alias ID:    {alias_id}")
    print(f"Region:      {REGION}")
    print(f"Model:       {MODEL_ID}")
    print(f"\nAWS Console: https://console.aws.amazon.com/bedrock/home?region={REGION}#/agents/{agent_id}")
    print(f"\nInvoke with:")
    print(f"  aws bedrock-agent-runtime invoke-agent \\")
    print(f"    --agent-id {agent_id} \\")
    print(f"    --agent-alias-id {alias_id} \\")
    print(f"    --session-id test-session-1 \\")
    print(f'    --input-text "Generate a Diwali greeting card for Vikram Malhotra, Product Director" \\')
    print(f"    --region {REGION}")


if __name__ == "__main__":
    main()
