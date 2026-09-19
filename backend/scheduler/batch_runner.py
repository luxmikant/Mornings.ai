import logging
import asyncio
from datetime import datetime, date
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models import User, Artifact
from app.services.dispatch_service import send_artifact_notification
from app.config import get_settings

logger = logging.getLogger(__name__)

async def batch_generate_artifacts():
    logger.info("Starting batch generation of artifacts...")
    settings = get_settings()
    
    async with AsyncSessionLocal() as session:
        try:
            result = await session.execute(select(User).where(User.is_active == True))
            users = result.scalars().all()
            
            for user in users:
                try:
                    logger.info(f"Generating artifact for user {user.id}")
                    # TODO: Invoke Strands agent orchestrator
                    
                except Exception as e:
                    logger.error(f"Error generating artifact for user {user.id}: {e}")
        except Exception as e:
            logger.error(f"Error fetching active users: {e}")
            
    logger.info("Finished batch generation of artifacts.")

async def batch_dispatch_notifications():
    logger.info("Starting batch dispatch of notifications...")
    
    async with AsyncSessionLocal() as session:
        try:
            today = date.today()
            result = await session.execute(
                select(Artifact).where(Artifact.status == 'READY_FOR_REVIEW')
            )
            artifacts = result.scalars().all()
            
            artifacts_today = [a for a in artifacts if a.created_at.date() == today]
            
            for artifact in artifacts_today:
                try:
                    user_result = await session.execute(select(User).where(User.id == artifact.user_id))
                    user = user_result.scalars().first()
                    
                    if user and user.fcm_device_token:
                        artifact_data = {
                            'artifact_id': artifact.id,
                            'image_url': artifact.image_url,
                            'headline': artifact.headline,
                            'body_copy': artifact.body_copy
                        }
                        success = await send_artifact_notification(user.fcm_device_token, artifact_data)
                        if not success:
                            logger.warning(f"Failed to send notification for user {user.id}")
                except Exception as e:
                    logger.error(f"Error dispatching notification for artifact {artifact.id}: {e}")
        except Exception as e:
            logger.error(f"Error fetching artifacts: {e}")

    logger.info("Finished batch dispatch of notifications.")


def setup_scheduler():
    settings = get_settings()
    scheduler = AsyncIOScheduler()
    
    scheduler.add_job(
        batch_generate_artifacts,
        CronTrigger(hour=2, minute=30, timezone='Asia/Kolkata'),
        id='batch_generate',
        name='Generate artifacts for all active users',
        replace_existing=True
    )
    
    scheduler.add_job(
        batch_dispatch_notifications,
        CronTrigger(hour=6, minute=0, timezone='Asia/Kolkata'),
        id='batch_dispatch',
        name='Dispatch notifications for ready artifacts',
        replace_existing=True
    )
    
    scheduler.start()
    return scheduler
