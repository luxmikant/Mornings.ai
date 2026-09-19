"""
Agentic PR Manager — AgentCore Deployment Verification Script

Run this script to verify your environment is correctly configured
before deploying to AWS Bedrock AgentCore.

Usage:
    python scripts/deploy_agentcore.py              # Full verification
    python scripts/deploy_agentcore.py --dry-run    # Skip agent test
    python scripts/deploy_agentcore.py --test-agent # Only test agent invocation
"""

import os
import sys
import argparse
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

# Add backend/ to path so imports work
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))


def check_python_version() -> bool:
    """Verify Python 3.12+."""
    major, minor = sys.version_info[:2]
    if major >= 3 and minor >= 12:
        logger.info(f"✅ Python version: {major}.{minor}")
        return True
    else:
        logger.warning(f"⚠️  Python {major}.{minor} detected. Python 3.12+ recommended.")
        return True  # Non-blocking


def check_aws_credentials() -> bool:
    """Verify AWS credentials are available."""
    try:
        import boto3

        sts = boto3.client("sts")
        identity = sts.get_caller_identity()
        account = identity["Account"]
        arn = identity["Arn"]
        logger.info(f"✅ AWS credentials valid. Account: {account}")
        logger.info(f"   ARN: {arn}")
        return True
    except Exception as e:
        logger.error(f"❌ AWS credentials check failed: {e}")
        logger.error("   Run: aws configure (or set AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY)")
        return False


def check_bedrock_model_access() -> bool:
    """Verify Bedrock model access in the configured region."""
    try:
        from app.config import get_settings

        settings = get_settings()
        import boto3

        bedrock = boto3.client("bedrock", region_name=settings.aws_region)
        models = bedrock.list_foundation_models()
        model_ids = [m["modelId"] for m in models.get("modelSummaries", [])]

        target = settings.bedrock_model_id
        # Check if the base model family is available
        base_family = target.split(":")[0] if ":" in target else target
        found = any(base_family in mid for mid in model_ids)

        if found:
            logger.info(f"✅ Bedrock model access confirmed for: {target}")
            logger.info(f"   Region: {settings.aws_region}")
            return True
        else:
            logger.warning(f"⚠️  Model '{target}' not found in region {settings.aws_region}")
            logger.warning("   Request model access via the AWS Bedrock console.")
            return False
    except Exception as e:
        logger.error(f"❌ Bedrock model access check failed: {e}")
        return False


def check_environment_variables() -> bool:
    """Verify required environment variables."""
    from dotenv import load_dotenv

    env_path = BACKEND_DIR / ".env"
    if env_path.exists():
        load_dotenv(env_path)
        logger.info(f"✅ .env file loaded from: {env_path}")
    else:
        logger.warning(f"⚠️  No .env file found at {env_path}")

    required_vars = {
        "GEMINI_API_KEY": "Gemini API for creative copy generation",
    }

    optional_vars = {
        "NVIDIA_API_KEY": "NVIDIA NIM for AI image generation",
        "AWS_ACCESS_KEY_ID": "AWS credentials (or use ~/.aws/credentials)",
    }

    all_ok = True
    for var, desc in required_vars.items():
        val = os.getenv(var, "")
        if val:
            logger.info(f"✅ {var} is set ({desc})")
        else:
            logger.error(f"❌ {var} is NOT set ({desc})")
            all_ok = False

    for var, desc in optional_vars.items():
        val = os.getenv(var, "")
        if val:
            logger.info(f"✅ {var} is set ({desc})")
        else:
            logger.info(f"ℹ️  {var} not set (optional: {desc})")

    return all_ok


def check_packages() -> bool:
    """Verify required packages are installed."""
    packages = {
        "strands": "strands-agents",
        "bedrock_agentcore": "bedrock-agentcore",
        "mcp": "mcp",
        "boto3": "boto3",
        "fastapi": "fastapi",
    }

    all_ok = True
    for import_name, pip_name in packages.items():
        try:
            __import__(import_name)
            logger.info(f"✅ Package '{pip_name}' installed")
        except ImportError:
            logger.error(f"❌ Package '{pip_name}' not installed. Run: pip install {pip_name}")
            all_ok = False

    return all_ok


def check_agentcore_cli() -> bool:
    """Check if the AgentCore CLI is available."""
    import subprocess

    try:
        result = subprocess.run(
            ["agentcore", "--version"],
            capture_output=True, text=True, timeout=10, shell=True
        )
        if result.returncode == 0:
            logger.info(f"✅ AgentCore CLI: {result.stdout.strip()}")
            return True
        else:
            logger.warning("⚠️  AgentCore CLI not found.")
            logger.warning("   Install with: npm install -g @aws/agentcore")
            return False
    except FileNotFoundError:
        logger.warning("⚠️  AgentCore CLI not found.")
        logger.warning("   Install with: npm install -g @aws/agentcore")
        return False
    except Exception as e:
        logger.warning(f"⚠️  AgentCore CLI check error: {e}")
        return False


def test_agent_creation() -> bool:
    """Test that the Strands agent can be instantiated."""
    try:
        from agent.orchestrator import create_agent

        agent = create_agent()
        logger.info("✅ Strands Agent created successfully!")
        logger.info(f"   Tools registered: {len(agent.tools) if hasattr(agent, 'tools') else 'N/A'}")
        return True
    except Exception as e:
        logger.error(f"❌ Agent creation failed: {e}")
        return False


def print_deployment_commands():
    """Print the AgentCore deployment commands."""
    print("\n" + "=" * 60)
    print("  DEPLOYMENT COMMANDS")
    print("=" * 60)
    print()
    print("  1. Deploy to AWS AgentCore:")
    print("     npx @aws/agentcore deploy")
    print()
    print("  2. Invoke the deployed agent (Python):")
    print("     import boto3, json")
    print('     client = boto3.client("bedrock-agentcore", region_name="us-east-1")')
    print("     response = client.invoke_agent_runtime(")
    print('         agentRuntimeId="<YOUR_AGENT_RUNTIME_ID>",')
    print('         sessionId="test-session",')
    print('         payload=json.dumps({"prompt": "Generate a Diwali greeting"})')
    print("     )")
    print()
    print("=" * 60)


def main():
    parser = argparse.ArgumentParser(description="AgentCore Deployment Verification")
    parser.add_argument("--dry-run", action="store_true", help="Skip agent test")
    parser.add_argument("--test-agent", action="store_true", help="Only test agent")
    args = parser.parse_args()

    print()
    print("=" * 60)
    print("  AGENTIC PR MANAGER — DEPLOYMENT VERIFICATION")
    print("=" * 60)
    print()

    if args.test_agent:
        test_agent_creation()
        return

    results = {}
    results["Python Version"] = check_python_version()
    results["Packages"] = check_packages()
    results["Environment Variables"] = check_environment_variables()
    results["AWS Credentials"] = check_aws_credentials()
    results["Bedrock Model Access"] = check_bedrock_model_access()
    results["AgentCore CLI"] = check_agentcore_cli()

    if not args.dry_run:
        results["Agent Creation"] = test_agent_creation()

    # Summary
    print()
    print("=" * 60)
    print("  VERIFICATION SUMMARY")
    print("=" * 60)
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    for check, ok in results.items():
        status = "✅ PASS" if ok else "❌ FAIL"
        print(f"  {status}  {check}")
    print()
    print(f"  Result: {passed}/{total} checks passed.")

    if passed == total:
        print_deployment_commands()
    else:
        print("\n  ⚠️  Fix the failing checks above before deploying.\n")


if __name__ == "__main__":
    main()
