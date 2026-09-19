import os
import logging
import firebase_admin
from firebase_admin import credentials, messaging
from app.config import get_settings

logger = logging.getLogger(__name__)

def initialize_firebase():
    settings = get_settings()
    cred_path = getattr(settings, 'firebase_credentials_path', None)
    
    if not cred_path or not os.path.exists(cred_path):
        logger.warning(f"Firebase credentials not found at {cred_path}. Push notifications will be disabled.")
        return
        
    try:
        if not firebase_admin._apps:
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            logger.info("Firebase app initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize Firebase: {e}")

async def send_artifact_notification(fcm_token: str, artifact_data: dict) -> bool:
    if not firebase_admin._apps:
        logger.warning("Firebase app is not initialized. Cannot send notification.")
        return False
        
    try:
        message = messaging.Message(
            notification=messaging.Notification(
                title=artifact_data.get('headline'),
                body=artifact_data.get('body_copy'),
                image=artifact_data.get('image_url')
            ),
            data={
                'artifact_id': str(artifact_data.get('artifact_id', '')),
                'image_url': str(artifact_data.get('image_url', '')),
                'headline': str(artifact_data.get('headline', '')),
                'body_copy': str(artifact_data.get('body_copy', '')),
                'action': 'ACTION_SHOW_BIG_PICTURE'
            },
            token=fcm_token,
            android=messaging.AndroidConfig(
                priority='high',
                ttl=3600
            )
        )
        
        response = messaging.send(message)
        logger.info(f"Successfully sent message: {response}")
        return True
    except messaging.UnregisteredError:
        logger.warning(f"FCM token unregistered: {fcm_token}")
        return False
    except Exception as e:
        logger.error(f"Error sending FCM message: {e}")
        return False
