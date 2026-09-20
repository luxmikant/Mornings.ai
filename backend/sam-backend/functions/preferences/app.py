"""
Mornings.ai — Preferences Handler Lambda
CRUD operations for user preferences stored in DynamoDB.
"""
import json
import os
import uuid
from datetime import datetime, timezone

import boto3

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["USERS_TABLE"])


def lambda_handler(event, context):
    """Route based on HTTP method and path."""
    method = event.get("requestContext", {}).get("http", {}).get("method", "GET")
    path_params = event.get("pathParameters") or {}

    if method == "POST":
        return create_preferences(event)
    elif method == "GET" and "userId" in path_params:
        return get_preferences(path_params["userId"])
    else:
        return response(400, {"error": "Invalid request"})


def create_preferences(event):
    """Save user preferences to DynamoDB."""
    try:
        body = json.loads(event.get("body", "{}"))
    except json.JSONDecodeError:
        return response(400, {"error": "Invalid JSON body"})

    user_id = body.get("userId") or str(uuid.uuid4())

    item = {
        "userId": user_id,
        "displayName": body.get("displayName", ""),
        "designation": body.get("designation", ""),
        "avatarUrl": body.get("avatarUrl", ""),
        "aesthetic": body.get("aesthetic", "Traditional Indian"),
        "tone": body.get("tone", "Warm"),
        "spiritualAlignment": body.get("spiritualAlignment", ""),
        "language": body.get("language", "en"),
        "subscribedEvents": body.get("subscribedEvents", []),
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    }

    table.put_item(Item=item)

    return response(201, {
        "message": "Preferences saved successfully",
        "userId": user_id,
        "preferences": item,
    })


def get_preferences(user_id):
    """Retrieve user preferences from DynamoDB."""
    result = table.get_item(Key={"userId": user_id})
    item = result.get("Item")

    if not item:
        return response(404, {"error": f"User {user_id} not found"})

    return response(200, item)


def response(status_code, body):
    """Format Lambda proxy response with CORS headers."""
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
        },
        "body": json.dumps(body, default=str),
    }
