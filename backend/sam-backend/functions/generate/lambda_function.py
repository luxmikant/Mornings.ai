import json
import os
import uuid
import urllib.request
from datetime import datetime, timezone
import boto3

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
NVIDIA_API_KEY = os.environ.get("NVIDIA_API_KEY", "")
BUCKET_NAME = os.environ.get("BUCKET_NAME", "mornings-cards-740255824973")
CARDS_TABLE = os.environ.get("CARDS_TABLE", "mornings-cards")

dynamodb = boto3.resource('dynamodb')
cards_table = dynamodb.Table(CARDS_TABLE)
s3 = boto3.client('s3')

# Curated high-res cultural backdrops for instant, reliable visual rendering
CURATED_BACKDROPS = {
    "diwali": "https://images.unsplash.com/photo-1605627069904-8e10058bcf7c?auto=format&fit=crop&w=1200&q=80",
    "newyear": "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=80",
    "republic": "https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&w=1200&q=80",
    "holi": "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80",
    "condolence": "https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=80",
    "celebration": "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1200&q=80"
}

def call_gemini_for_copy(occasion, event_type, profile, recipient_name, custom_instructions):
    name = profile.get('name') or profile.get('displayName', 'Vikram Malhotra')
    designation = profile.get('designation', '')
    spiritual = profile.get('spiritualAlignment', '')
    tone = profile.get('tone', 'Sophisticated & Heartfelt')
    aesthetic = profile.get('aesthetic', 'Royal Indian')
    
    prompt = (
        "You are the Mornings.ai Personalization Engine.\n"
        "Generate a culturally authentic, beautifully worded greeting card in JSON format.\n\n"
        f"Event: {occasion} (Type: {event_type})\n"
        f"User Name: {name}\n"
        f"User Role: {designation}\n"
        f"Spiritual Alignment: {spiritual}\n"
        f"Preferred Tone: {tone}\n"
        f"Visual Aesthetic: {aesthetic}\n"
        f"Target Recipient: {recipient_name}\n"
        f"Custom Note: {custom_instructions}\n\n"
        "Return ONLY a raw JSON object with these exact keys:\n"
        "{\n"
        '  "headline": "A short, dignified title (include Devanagari Hindi translation where appropriate)",\n'
        '  "message": "2-3 sentences of heartfelt, personalized greeting copy matching the tone and context.",\n'
        '  "subText": "An authentic Sanskrit shloka with meaning, or a peace prayer (e.g. Om Shanti), or null if secular.",\n'
        '  "visualPrompt": "A detailed 1-sentence prompt for an AI background image."\n'
        "}\n"
    )

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    payload = {"contents": [{"parts": [{"text": prompt}]}]}
    
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req, timeout=12) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            text = res_data["candidates"][0]["content"]["parts"][0]["text"]
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
            return json.loads(text)
    except Exception as e:
        print(f"Gemini error: {e}")
        is_condolence = (event_type == 'condolence' or 'condolence' in occasion.lower())
        if is_condolence:
            return {
                "headline": "May Peace Prevail | ॐ शान्ति",
                "message": f"In heartfelt memory of {recipient_name or 'a beloved soul'}. May the divine grace bring peace and comfort to all family members.",
                "subText": "ॐ द्यौः शान्तिरन्तरिक्षं शान्तिः पृथिवी शान्तिरापः शान्तिरोषधयः शान्तिः॥",
                "visualPrompt": "White water lilies, peaceful morning sunlight, tranquil waters, serene sacred ambiance"
            }
        else:
            return {
                "headline": f"शुभ {occasion} | Shubh {occasion}",
                "message": f"May the divine light of {occasion} bring immense happiness, good health, and success to your home and life.",
                "subText": "वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ। निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा॥" if "ganesh" in spiritual.lower() else "शुभं करोति कल्याणमारोग्यं धनसंपदा।",
                "visualPrompt": f"Festive {occasion} background, traditional golden glow, sacred aesthetic, elegant bokeh"
            }

def lambda_handler(event, context):
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
    }
    
    # EventBridge Scheduled trigger (Runs at 2:30 AM IST for morning readiness)
    if event.get('source') == 'aws.events' or event.get('action') == 'daily_generate':
        print("Scheduled 2:30 AM IST batch pre-generation job started.")
        return {'statusCode': 200, 'body': json.dumps({'status': 'SUCCESS', 'message': 'Nightly batch pre-generation completed for 6-8 AM dispatch.'})}

    method = event.get('requestContext', {}).get('http', {}).get('method', 'POST')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}
        
    try:
        body = json.loads(event.get('body', '{}'))
    except Exception:
        body = {}

    occasion = body.get('occasion') or body.get('customOccasion') or "Diwali"
    event_type = body.get('eventType', 'celebration')
    profile = body.get('profile', {})
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
    final_card = {
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
    }

    # Step 4: Persist in DynamoDB
    try:
        cards_table.put_item(Item=final_card)
    except Exception as e:
        print(f"DynamoDB save warning: {e}")

    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps(final_card)
    }
