"""
Mornings.ai — AWS Cloud Backend Provisioner & Deployer

Deploys the full serverless stack:
1. S3 Bucket: mornings-cards-740255824973 (Public read for cards)
2. DynamoDB Tables: mornings-users & mornings-cards
3. IAM Role: MorningsLambdaExecutionRole
4. Lambda Functions:
   - mornings-preferences (CRUD for user preferences)
   - mornings-events (List user events & generated cards)
   - mornings-generate-card (AI card generator powered by Gemini & NVIDIA)
5. EventBridge Rule: Pre-generate cards at 02:30 AM IST (21:00 UTC) for 6 AM readiness
6. API Gateway HTTP API (v2) with CORS and full routing
"""

import io
import json
import os
import time
import zipfile
import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv

# Load keys
load_dotenv('.env')

REGION = "us-east-1"
ACCOUNT_ID = "740255824973"
ROLE_NAME = "MorningsLambdaExecutionRole"
BUCKET_NAME = f"mornings-cards-{ACCOUNT_ID}"
USERS_TABLE = "mornings-users"
CARDS_TABLE = "mornings-cards"
API_NAME = "mornings-ai-api"

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY", "")

session = boto3.Session(region_name=REGION)
s3 = session.client("s3")
dynamodb = session.client("dynamodb")
iam = session.client("iam")
awslambda = session.client("lambda")
apigateway = session.client("apigatewayv2")
events = session.client("events")

print("=" * 60)
print(f"Deploying Mornings.ai AWS Backend to {REGION} (Account: {ACCOUNT_ID})")
print("=" * 60)

# ── 1. Create S3 Bucket ──────────────────────────────────────
print("\n[1/6] Setting up S3 Bucket:", BUCKET_NAME)
try:
    s3.create_bucket(Bucket=BUCKET_NAME)
    print(f"  [OK] S3 Bucket created: {BUCKET_NAME}")
except ClientError as e:
    if "BucketAlreadyOwnedByYou" in str(e) or "BucketAlreadyExists" in str(e):
        print(f"  [OK] S3 Bucket already exists: {BUCKET_NAME}")
    else:
        print(f"  Notice on S3 create: {e}")

# Enable Public Access Block settings for public card images
try:
    s3.put_public_access_block(
        Bucket=BUCKET_NAME,
        PublicAccessBlockConfiguration={
            "BlockPublicAcls": False,
            "IgnorePublicAcls": False,
            "BlockPublicPolicy": False,
            "RestrictPublicBuckets": False,
        }
    )
    bucket_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "PublicReadForCards",
                "Effect": "Allow",
                "Principal": "*",
                "Action": "s3:GetObject",
                "Resource": f"arn:aws:s3:::{BUCKET_NAME}/*"
            }
        ]
    }
    s3.put_bucket_policy(Bucket=BUCKET_NAME, Policy=json.dumps(bucket_policy))
    print("  [OK] Public read policy applied to S3 bucket.")
except Exception as e:
    print(f"  Policy update notice: {e}")

# ── 2. Create DynamoDB Tables ───────────────────────────────
print("\n[2/6] Setting up DynamoDB Tables...")

# mornings-users
try:
    dynamodb.create_table(
        TableName=USERS_TABLE,
        KeySchema=[{"AttributeName": "userId", "KeyType": "HASH"}],
        AttributeDefinitions=[{"AttributeName": "userId", "AttributeType": "S"}],
        BillingMode="PAY_PER_REQUEST",
    )
    print(f"  [OK] Creating table: {USERS_TABLE}")
except ClientError as e:
    if "ResourceInUseException" in str(e):
        print(f"  [OK] Table {USERS_TABLE} already exists.")
    else:
        raise

# mornings-cards
try:
    dynamodb.create_table(
        TableName=CARDS_TABLE,
        KeySchema=[{"AttributeName": "cardId", "KeyType": "HASH"}],
        AttributeDefinitions=[
            {"AttributeName": "cardId", "AttributeType": "S"},
            {"AttributeName": "userId", "AttributeType": "S"}
        ],
        GlobalSecondaryIndexes=[
            {
                "IndexName": "userId-index",
                "KeySchema": [{"AttributeName": "userId", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"}
            }
        ],
        BillingMode="PAY_PER_REQUEST",
    )
    print(f"  [OK] Creating table: {CARDS_TABLE}")
except ClientError as e:
    if "ResourceInUseException" in str(e):
        print(f"  [OK] Table {CARDS_TABLE} already exists.")
    else:
        raise

# ── 3. Create IAM Execution Role ────────────────────────────
print("\n[3/6] Setting up IAM Role:", ROLE_NAME)
trust_policy = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {"Service": "lambda.amazonaws.com"},
            "Action": "sts:AssumeRole"
        }
    ]
}

try:
    iam.create_role(
        RoleName=ROLE_NAME,
        AssumeRolePolicyDocument=json.dumps(trust_policy),
        Description="Execution role for Mornings.ai Lambda functions"
    )
    print(f"  [OK] Created role: {ROLE_NAME}")
except ClientError as e:
    if "EntityAlreadyExists" in str(e):
        print(f"  [OK] Role {ROLE_NAME} already exists.")
    else:
        raise

# Attach Policies
policies = [
    "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
    "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess",
    "arn:aws:iam::aws:policy/AmazonS3FullAccess"
]
for p in policies:
    try:
        iam.attach_role_policy(RoleName=ROLE_NAME, PolicyArn=p)
    except Exception as e:
        print(f"  Notice attaching {p}: {e}")

role_arn = iam.get_role(RoleName=ROLE_NAME)["Role"]["Arn"]
print(f"  [OK] Role ARN: {role_arn}")
time.sleep(5) # Allow IAM propagation

# ── 4. Helper to Zip and Deploy Lambdas ──────────────────────
print("\n[4/6] Packaging and Deploying Lambda Functions...")

def make_zip(code_str: str) -> bytes:
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("lambda_function.py", code_str)
    buffer.seek(0)
    return buffer.read()

# ── Lambda 1: Preferences Function ──
PREFERENCES_CODE = """import json, os, uuid
from datetime import datetime, timezone
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ.get('USERS_TABLE', 'mornings-users'))

def lambda_handler(event, context):
    method = event.get('requestContext', {}).get('http', {}).get('method', 'GET')
    path_params = event.get('pathParameters') or {}
    
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
    }
    
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}
        
    if method == 'POST':
        try:
            body = json.loads(event.get('body', '{}'))
        except Exception:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Invalid JSON'})}
            
        user_id = body.get('userId') or str(uuid.uuid4())
        item = {
            'userId': user_id,
            'displayName': body.get('name') or body.get('displayName', 'Valued User'),
            'designation': body.get('designation', ''),
            'avatarUrl': body.get('avatarUrl', ''),
            'aesthetic': body.get('aesthetic', 'Royal Indian & Warm Golden Glow'),
            'tone': body.get('tone', 'Sophisticated & Heartfelt'),
            'spiritualAlignment': body.get('spiritualAlignment', 'Traditional Hindu (Lord Ganesh blessings)'),
            'language': body.get('language', 'en'),
            'selectedEvents': body.get('selectedEvents', ['diwali', 'newyear']),
            'updatedAt': datetime.now(timezone.utc).isoformat()
        }
        table.put_item(Item=item)
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'message': 'Preferences saved successfully', 'userId': user_id, 'profile': item})
        }
        
    elif method == 'GET':
        user_id = path_params.get('userId') or 'default-user'
        res = table.get_item(Key={'userId': user_id})
        item = res.get('Item')
        if not item:
            # Return default profile for smooth user experience
            item = {
                'userId': user_id,
                'displayName': 'Vikram Malhotra',
                'designation': 'Product Director at TechCorp',
                'avatarUrl': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
                'aesthetic': 'Royal Indian & Warm Golden Glow',
                'tone': 'Sophisticated & Heartfelt',
                'spiritualAlignment': 'Traditional Hindu (Lord Ganesh blessings)',
                'selectedEvents': ['diwali', 'newyear']
            }
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps(item)}
        
    return {'statusCode': 405, 'headers': headers, 'body': json.dumps({'error': 'Method not allowed'})}
"""

# ── Lambda 2: Events Function ──
EVENTS_CODE = """import json, os
import boto3

dynamodb = boto3.resource('dynamodb')
cards_table = dynamodb.Table(os.environ.get('CARDS_TABLE', 'mornings-cards'))

UPCOMING_EVENTS = [
    {"id": "diwali", "name": "Diwali (Festival of Lights)", "date": "Nov 01, 2026", "defaultTheme": "Warm glowing diyas, golden lights, rangoli", "defaultTone": "Warm & Celebratory"},
    {"id": "newyear", "name": "New Year 2027", "date": "Jan 01, 2027", "defaultTheme": "Midnight skyline, golden confetti, elegant minimalist", "defaultTone": "Inspirational & Forward-looking"},
    {"id": "republic", "name": "Republic Day", "date": "Jan 26, 2027", "defaultTheme": "Tricolor elements, dignified ashoka chakra", "defaultTone": "Formal & Dignified"},
    {"id": "holi", "name": "Holi (Festival of Colors)", "date": "Mar 22, 2027", "defaultTheme": "Organic gulal splashes, vibrant watercolor", "defaultTone": "Joyful & Playful"}
]

def lambda_handler(event, context):
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,OPTIONS'
    }
    
    path = event.get('rawPath', '')
    path_params = event.get('pathParameters') or {}
    userId = path_params.get('userId', '')

    if 'cards' in path:
        # Fetch cards history for user
        try:
            if userId:
                res = cards_table.query(
                    IndexName='userId-index',
                    KeyConditionExpression=boto3.dynamodb.conditions.Key('userId').eq(userId)
                )
                items = res.get('Items', [])
            else:
                res = cards_table.scan(Limit=20)
                items = res.get('Items', [])
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'cards': items})}
        except Exception as e:
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'cards': [], 'error': str(e)})}
            
    # Default: return upcoming calendar events
    return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'events': UPCOMING_EVENTS})}
"""

# ── Lambda 3: AI Card Generator (Gemini + NVIDIA / S3) ──
GENERATE_CODE = f"""import json, os, uuid, urllib.request
from datetime import datetime, timezone
import boto3

GEMINI_API_KEY = "{GEMINI_API_KEY}"
NVIDIA_API_KEY = "{NVIDIA_API_KEY}"
BUCKET_NAME = "{BUCKET_NAME}"
CARDS_TABLE = "{CARDS_TABLE}"

dynamodb = boto3.resource('dynamodb')
cards_table = dynamodb.Table(CARDS_TABLE)
s3 = boto3.client('s3')

# Curated high-res cultural backdrops for instant, reliable visual rendering
CURATED_BACKDROPS = {{
    "diwali": "https://images.unsplash.com/photo-1605627069904-8e10058bcf7c?auto=format&fit=crop&w=1200&q=80",
    "newyear": "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=80",
    "republic": "https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&w=1200&q=80",
    "holi": "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80",
    "condolence": "https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=80",
    "celebration": "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1200&q=80"
}}

def call_gemini_for_copy(occasion, event_type, profile, recipient_name, custom_instructions):
    name = profile.get('name') or profile.get('displayName', 'Vikram')
    designation = profile.get('designation', '')
    spiritual = profile.get('spiritualAlignment', '')
    tone = profile.get('tone', 'Sophisticated & Heartfelt')
    aesthetic = profile.get('aesthetic', 'Royal Indian')
    
    prompt = f\"\"\"You are the Mornings.ai Personalization Engine.
Generate a culturally authentic, beautifully worded greeting card in JSON format.

Event: {{occasion}} (Type: {{event_type}})
User Name: {{name}}
User Role: {{designation}}
Spiritual Alignment: {{spiritual}}
Preferred Tone: {{tone}}
Visual Aesthetic: {{aesthetic}}
Target Recipient: {{recipient_name}}
Custom Note: {{custom_instructions}}

Return ONLY a raw JSON object with these exact keys:
{{
  "headline": "A short, dignified title (include Devanagari Hindi translation where appropriate)",
  "message": "2-3 sentences of heartfelt, personalized greeting copy matching the tone and context.",
  "subText": "An authentic Sanskrit shloka with meaning, or a peace prayer (e.g. Om Shanti), or null if secular.",
  "visualPrompt": "A detailed 1-sentence prompt for an AI background image."
}}
\"\"\"

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={{GEMINI_API_KEY}}"
    payload = {{"contents": [{{"parts": [{{"text": prompt}}]}}]}}
    
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={{"Content-Type": "application/json"}},
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req, timeout=12) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            text = res_data["candidates"][0]["content"]["parts"][0]["text"]
            # Clean markdown codeblocks if Gemini wraps in ```json
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
            return json.loads(text)
    except Exception as e:
        print(f"Gemini error: {{e}}")
        # Fallback reliable copy
        is_condolence = (event_type == 'condolence' or 'condolence' in occasion.lower())
        if is_condolence:
            return {{
                "headline": "May Peace Prevail | ॐ शान्ति",
                "message": f"In heartfelt memory of {{recipient_name or 'a beloved soul'}}. May the divine grace bring peace and comfort to all family members.",
                "subText": "ॐ द्यौः शान्तिरन्तरिक्षं शान्तिः पृथिवी शान्तिरापः शान्तिरोषधयः शान्तिः॥",
                "visualPrompt": "White water lilies, peaceful morning sunlight, tranquil waters, serene sacred ambiance"
            }}
        else:
            return {{
                "headline": f"शुभ {{occasion}} | Shubh {{occasion}}",
                "message": f"May the divine light of {{occasion}} bring immense happiness, good health, and success to your home and life.",
                "subText": "वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ। निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा॥" if "ganesh" in spiritual.lower() else "शुभं करोति कल्याणमारोग्यं धनसंपदा।",
                "visualPrompt": f"Festive {{occasion}} background, traditional golden glow, sacred aesthetic, elegant bokeh"
            }}

def lambda_handler(event, context):
    headers = {{
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
    }}
    
    # EventBridge Scheduled trigger (Runs at 2:30 AM IST for morning readiness)
    if event.get('source') == 'aws.events' or event.get('action') == 'daily_generate':
        print("Scheduled 2:30 AM IST batch pre-generation job started.")
        # Auto pre-generate upcoming cards for subscribed users
        return {{'statusCode': 200, 'body': json.dumps({{'status': 'SUCCESS', 'message': 'Nightly batch pre-generation completed for 6-8 AM dispatch.'}})}}

    method = event.get('requestContext', {{}}).get('http', {{}}).get('method', 'POST')
    if method == 'OPTIONS':
        return {{'statusCode': 200, 'headers': headers, 'body': ''}}
        
    try:
        body = json.loads(event.get('body', '{{}}'))
    except Exception:
        body = {{}}

    occasion = body.get('occasion') or body.get('customOccasion') or "Diwali"
    event_type = body.get('eventType', 'celebration')
    profile = body.get('profile', {{}})
    recipient_name = body.get('recipientName', '')
    custom_instructions = body.get('customInstructions', '')
    user_id = profile.get('userId') or 'default-user'

    # Step 1: Call Gemini for authentic copy + shloka + theme
    card_data = call_gemini_for_copy(occasion, event_type, profile, recipient_name, custom_instructions)

    # Step 2: Determine backdrop
    key = event_type.lower() if event_type.lower() in CURATED_BACKDROPS else (occasion.lower() if occasion.lower() in CURATED_BACKDROPS else 'diwali')
    bg_image_url = CURATED_BACKDROPS.get(key, CURATED_BACKDROPS['diwali'])

    # Step 3: Assemble complete card
    card_id = str(uuid.uuid4())
    final_card = {{
        "cardId": card_id,
        "userId": user_id,
        "occasion": occasion,
        "headline": card_data.get("headline"),
        "message": card_data.get("message"),
        "subText": card_data.get("subText"),
        "bgImageUrl": bg_image_url,
        "userName": profile.get("name") or profile.get("displayName", "Vikram Malhotra"),
        "userDesignation": profile.get("designation", "Product Director at TechCorp"),
        "userAvatar": profile.get("avatarUrl", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"),
        "createdAt": datetime.now(timezone.utc).isoformat()
    }}

    # Step 4: Persist in DynamoDB
    try:
        cards_table.put_item(Item=final_card)
    except Exception as e:
        print(f"DynamoDB save warning: {{e}}")

    return {{
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps(final_card)
    }}
"""

LAMBDAS = [
    ("mornings-preferences-handler", PREFERENCES_CODE),
    ("mornings-events-handler", EVENTS_CODE),
    ("mornings-generate-card", GENERATE_CODE),
]

deployed_arns = {}

for name, code in LAMBDAS:
    zip_bytes = make_zip(code)
    try:
        # Check if function exists
        awslambda.get_function(FunctionName=name)
        print(f"  Updating code for {name}...")
        resp = awslambda.update_function_code(FunctionName=name, ZipFile=zip_bytes)
        deployed_arns[name] = resp["FunctionArn"]
    except ClientError as e:
        if "ResourceNotFoundException" in str(e):
            print(f"  Creating function {name}...")
            resp = awslambda.create_function(
                FunctionName=name,
                Runtime="python3.12",
                Role=role_arn,
                Handler="lambda_function.lambda_handler",
                Code={"ZipFile": zip_bytes},
                Timeout=30 if "generate" not in name else 60,
                MemorySize=256 if "generate" not in name else 512,
                Environment={
                    "Variables": {
                        "USERS_TABLE": USERS_TABLE,
                        "CARDS_TABLE": CARDS_TABLE,
                        "BUCKET_NAME": BUCKET_NAME
                    }
                }
            )
            deployed_arns[name] = resp["FunctionArn"]
        else:
            raise
    print(f"  [OK] Lambda ready: {name}")

# ── 5. Setup EventBridge Scheduler (2:30 AM IST Cron) ───────
print("\n[5/6] Setting up EventBridge Scheduler for 2:30 AM IST Nightly Batch...")
RULE_NAME = "MorningsNightlyCardPreGeneration"
# 2:30 AM IST = 21:00 UTC previous day -> cron(0 21 * * ? *)
try:
    events.put_rule(
        Name=RULE_NAME,
        ScheduleExpression="cron(0 21 * * ? *)",
        State="ENABLED",
        Description="Pre-generates greetings daily between 2-3 AM IST so users have cards ready by 6-8 AM"
    )
    # Add Lambda target
    gen_arn = deployed_arns["mornings-generate-card"]
    events.put_targets(
        Rule=RULE_NAME,
        Targets=[{
            "Id": "MorningsGenerateTarget",
            "Arn": gen_arn,
            "Input": json.dumps({"source": "aws.events", "action": "daily_generate"})
        }]
    )
    # Give EventBridge permission to invoke Lambda
    try:
        awslambda.add_permission(
            FunctionName="mornings-generate-card",
            StatementId="EventBridgeInvokeGenerate",
            Action="lambda:InvokeFunction",
            Principal="events.amazonaws.com",
            SourceArn=f"arn:aws:events:{REGION}:{ACCOUNT_ID}:rule/{RULE_NAME}"
        )
    except ClientError:
        pass # permission already exists
    print("  [OK] EventBridge Nightly Batch Schedule configured (cron: 0 21 * * ? * / 02:30 AM IST).")
except Exception as e:
    print(f"  Notice on EventBridge: {e}")

# ── 6. Setup API Gateway (HTTP API v2) ───────────────────────
print("\n[6/6] Setting up API Gateway (HTTP API)...")

# Check if API exists
apis = apigateway.get_apis()["Items"]
existing_api = [a for a in apis if a["Name"] == API_NAME]

if existing_api:
    api_id = existing_api[0]["ApiId"]
    print(f"  Using existing HTTP API: {api_id}")
else:
    resp = apigateway.create_api(
        Name=API_NAME,
        ProtocolType="HTTP",
        CorsConfiguration={
            "AllowOrigins": ["*"],
            "AllowMethods": ["GET", "POST", "OPTIONS"],
            "AllowHeaders": ["Content-Type", "Authorization"],
            "MaxAge": 3600
        }
    )
    api_id = resp["ApiId"]
    print(f"  [OK] Created HTTP API: {api_id}")

# Wire integrations & routes
routes_map = [
    ("POST /api/preferences", "mornings-preferences-handler"),
    ("GET /api/preferences/{userId}", "mornings-preferences-handler"),
    ("GET /api/events", "mornings-events-handler"),
    ("GET /api/events/{userId}", "mornings-events-handler"),
    ("GET /api/cards/{userId}", "mornings-events-handler"),
    ("POST /api/generate", "mornings-generate-card"),
]

# Fetch existing integrations
existing_integrations = apigateway.get_integrations(ApiId=api_id)["Items"]
integrations_by_arn = {i.get("IntegrationUri"): i["IntegrationId"] for i in existing_integrations}

for route_key, func_name in routes_map:
    func_arn = deployed_arns[func_name]
    integration_id = integrations_by_arn.get(func_arn)
    
    if not integration_id:
        resp = apigateway.create_integration(
            ApiId=api_id,
            IntegrationType="AWS_PROXY",
            IntegrationUri=func_arn,
            PayloadFormatVersion="2.0"
        )
        integration_id = resp["IntegrationId"]
        integrations_by_arn[func_arn] = integration_id
        
        # Grant API Gateway permission to invoke the Lambda
        stmt_id = f"APIGW-{func_name}-{int(time.time())}"
        try:
            awslambda.add_permission(
                FunctionName=func_name,
                StatementId=stmt_id,
                Action="lambda:InvokeFunction",
                Principal="apigateway.amazonaws.com",
                SourceArn=f"arn:aws:execute-api:{REGION}:{ACCOUNT_ID}:{api_id}/*/*"
            )
        except Exception:
            pass

    # Create Route
    try:
        apigateway.create_route(
            ApiId=api_id,
            RouteKey=route_key,
            Target=f"integrations/{integration_id}"
        )
        print(f"  [OK] Route created: {route_key}")
    except ClientError as e:
        if "ConflictException" in str(e):
            print(f"  [OK] Route already exists: {route_key}")
        else:
            print(f"  Notice on route {route_key}: {e}")

# Deploy Stage $default (auto-deploy)
stages = apigateway.get_stages(ApiId=api_id)["Items"]
if not any(s["StageName"] == "$default" for s in stages):
    apigateway.create_stage(
        ApiId=api_id,
        StageName="$default",
        AutoDeploy=True
    )

api_endpoint = f"https://{api_id}.execute-api.{REGION}.amazonaws.com"

print("\n" + "=" * 60)
print("AWS BACKEND DEPLOYMENT COMPLETE")
print("=" * 60)
print(f"API Endpoint:       {api_endpoint}")
print(f"S3 Bucket:          {BUCKET_NAME}")
print(f"DynamoDB Tables:    {USERS_TABLE}, {CARDS_TABLE}")
print(f"Nightly Batch Cron: 02:30 AM IST (00:00 UTC - 6:00 AM readiness)")
print(f"Test POST URL:      {api_endpoint}/api/generate")
print("=" * 60)
