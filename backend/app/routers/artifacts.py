import os
import uuid
from uuid import UUID
from datetime import date, datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.schemas import (
    ArtifactDailyResponse,
    ArtifactResponse,
    ArtifactHistoryResponse,
    DispatchRequest,
    TweakRequest,
    GenerateArtifactRequest,
    AgentChatOrderRequest,
    AgentChatOrderResponse,
)
from app.models import Artifact, DispatchLog, CulturalEvent, User, PreferenceProfile, ArtifactStatus, DispatchAction, EventType
from agent.tools.gemini_tool import generate_creative_copy_gemini
from agent.tools.bedrock_image_tool import generate_backdrop
from compositor.engine import compose_greeting_card

router = APIRouter(prefix="/artifacts", tags=["artifacts"])

DEFAULT_DEMO_USER_ID = uuid.UUID("123e4567-e89b-12d3-a456-426614174000")

EVENT_DISPLAY_MAP = {
    "DIWALI": "दीपावली",
    "DEEPAVALI": "दीपावली",
    "MAHA_SHIVRATRI": "महाशिवरात्रि",
    "SHIVRATRI": "महाशिवरात्रि",
    "HOLI": "होली",
    "MAKAR_SANKRANTI": "मकर संक्रांति",
    "RAM_NAVAMI": "राम नवमी",
    "JANMASHTAMI": "श्री कृष्ण जन्माष्टमी",
    "GANESH_CHATURTHI": "श्री गणेश चतुर्थी",
    "DUSSEHRA": "विजयादशमी",
    "NAVATRI": "शारदीय नवरात्रि",
    "TODAY_DEVOTIONAL": "दैनिक शुभ प्रभात",
    "DAILY_BLESSING": "दैनिक शुभ प्रभात"
}

async def get_current_user_id(x_user_id: Optional[str] = Header(None, alias="X-User-ID")) -> UUID:
    if not x_user_id:
        return DEFAULT_DEMO_USER_ID
    try:
        return uuid.UUID(x_user_id)
    except ValueError:
        return DEFAULT_DEMO_USER_ID

async def ensure_user_exists(user_id: UUID, user_name: str, designation: str, db: AsyncSession):
    """Auto-provisions user record if missing to ensure zero-friction manual order."""
    res = await db.execute(select(User).where(User.id == user_id))
    user = res.scalar_one_or_none()
    if not user:
        user = User(
            id=user_id,
            phone_number="+919876543210",
            display_name=user_name,
            designation=designation,
            is_active=True
        )
        db.add(user)
        await db.commit()
    return user

@router.post("/generate", response_model=ArtifactResponse)
async def generate_artifact_manual(
    req: GenerateArtifactRequest,
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Manual order endpoint: Generates and delivers an artifact based on event and date.
    Triggers the full agent pipeline:
    Cultural Context -> Gemini Copy -> NVIDIA/Procedural Image -> Pillow Compositor -> Database.
    """
    target_date = date.fromisoformat(req.event_date) if req.event_date else date.today()
    canonical_event = req.event_name.upper().replace(" ", "_") if req.event_name else "DAILY_BLESSING"
    
    # 1. Resolve Cultural Event
    query = select(CulturalEvent)
    if req.event_name:
        query = query.where(CulturalEvent.canonical_name == canonical_event)
    else:
        query = query.where(CulturalEvent.event_date == target_date)
        
    result = await db.execute(query)
    event = result.scalar_one_or_none()
    
    event_title = event.display_title if event else EVENT_DISPLAY_MAP.get(canonical_event, req.event_name or "शुभ प्रभात एवं मंगल कामना")
    deity = event.presiding_deity if event else "SURYA"
    
    # 2. Ensure User Exists
    await ensure_user_exists(user_id, req.user_name or "आदरणीय सदस्य", req.user_designation or "समाजसेवी", db)
    
    # 3. Generate Creative Copy via Gemini
    prompt_topic = f"{event_title} ({req.custom_instruction or 'मंगल कामना'})"
    body_copy = generate_creative_copy_gemini(
        topic=prompt_topic,
        tone=req.tone or "REVERENT_DEVOTIONAL",
        language="hi_IN"
    )
    if "Error:" in body_copy:
        body_copy = f"इस पावन अवसर पर आपके और आपके परिवार के जीवन में सुख, शांति, और समृद्धि का वास हो। {event_title} की हार्दिक बधाई!"
        
    headline = f"{event_title} की हार्दिक शुभकामनाएं"
    shloka = "सर्वे भवन्तु सुखिनः सर्वे सन्तु निरामयाः। सर्वे भद्राणि पश्यन्तु मा कश्चिद्दुःखभाग्भवेत्॥"
    
    # 4. Generate Backdrop Image
    bg_local_path = generate_backdrop(prompt=f"{event_title}, sacred Indian spiritual celebration, glowing diyas")
    
    # 5. Composite Final Greeting Card
    from pathlib import Path
    artifact_id = uuid.uuid4()
    static_dir = Path(__file__).resolve().parent.parent.parent / "static"
    static_dir.mkdir(parents=True, exist_ok=True)
    out_filename = f"artifact_{artifact_id.hex[:10]}.webp"
    out_filepath = str(static_dir / out_filename)
    
    compose_greeting_card(
        background_path=bg_local_path,
        portrait_path="",
        headline=headline,
        shloka=shloka,
        user_name=req.user_name or "आदरणीय सदस्य",
        user_designation=req.user_designation or "समाजसेवी",
        output_path=out_filepath
    )
    
    composite_url = f"/static/{out_filename}"
    
    # 6. Store in Database
    new_artifact = Artifact(
        id=artifact_id,
        user_id=user_id,
        event_id=event.id if event else None,
        headline=headline,
        body_copy=body_copy,
        shloka_text=shloka,
        shloka_source="बृहदारण्यक उपनिषद्",
        background_image_url=bg_local_path,
        composite_image_url=composite_url,
        status=ArtifactStatus.READY_FOR_REVIEW,
        generation_metadata={"ordered_by": "manual", "date": str(target_date)}
    )
    
    db.add(new_artifact)
    await db.commit()
    await db.refresh(new_artifact)
    
    return ArtifactResponse(
        id=new_artifact.id,
        user_id=new_artifact.user_id,
        event_name=event.canonical_name if event else "DAILY_BLESSING",
        headline=new_artifact.headline,
        body_copy=new_artifact.body_copy,
        shloka_text=new_artifact.shloka_text,
        shloka_source=new_artifact.shloka_source,
        background_image_url=new_artifact.background_image_url,
        composite_image_url=new_artifact.composite_image_url,
        status=new_artifact.status.value if hasattr(new_artifact.status, "value") else str(new_artifact.status),
        created_at=new_artifact.created_at
    )

@router.get("/daily", response_model=ArtifactDailyResponse)
async def get_daily_artifact(user_id: UUID = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Artifact)
        .where(Artifact.user_id == user_id)
        .order_by(Artifact.created_at.desc())
        .limit(1)
    )
    artifact = result.scalar_one_or_none()
    if not artifact:
        return ArtifactDailyResponse(
            has_artifact=False,
            artifact=None,
            message="No greeting generated yet. Use POST /api/v1/artifacts/generate to order one!"
        )
    
    return ArtifactDailyResponse(
        has_artifact=True,
        artifact=ArtifactResponse(
            id=artifact.id,
            user_id=artifact.user_id,
            event_name="FESTIVAL",
            headline=artifact.headline,
            body_copy=artifact.body_copy,
            shloka_text=artifact.shloka_text,
            shloka_source=artifact.shloka_source,
            background_image_url=artifact.background_image_url,
            composite_image_url=artifact.composite_image_url,
            status=artifact.status.value if hasattr(artifact.status, "value") else str(artifact.status),
            created_at=artifact.created_at
        ),
        message="Daily greeting retrieved successfully"
    )

@router.get("/{artifact_id}", response_model=ArtifactResponse)
async def get_artifact(artifact_id: UUID, user_id: UUID = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Artifact).where(Artifact.id == artifact_id, Artifact.user_id == user_id))
    artifact = result.scalar_one_or_none()
    if not artifact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Artifact not found")
    return ArtifactResponse(
        id=artifact.id,
        user_id=artifact.user_id,
        event_name="FESTIVAL",
        headline=artifact.headline,
        body_copy=artifact.body_copy,
        shloka_text=artifact.shloka_text,
        shloka_source=artifact.shloka_source,
        background_image_url=artifact.background_image_url,
        composite_image_url=artifact.composite_image_url,
        status=artifact.status.value if hasattr(artifact.status, "value") else str(artifact.status),
        created_at=artifact.created_at
    )

@router.post("/agent-chat", response_model=AgentChatOrderResponse)
async def agent_chat_order(
    req: AgentChatOrderRequest,
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    On-the-go conversational agent call:
    - User gives freeform chat prompt or specifies festival.
    - Agent generates card via Gemini + Image Generator + Compositor.
    - Saves event & user preferences to database memory so it will auto-trigger when that event arrives in the future!
    """
    await ensure_user_exists(user_id, req.user_name or "आदरणीय सदस्य", req.user_designation or "समाजसेवी", db)
    
    event_date = date.fromisoformat(req.event_date) if req.event_date else date.today()
    canonical_event = req.event_name.upper().replace(" ", "_") if req.event_name else "CUSTOM_BLESSING"
    
    memory_saved = False
    if req.save_to_memory:
        res = await db.execute(select(CulturalEvent).where(CulturalEvent.canonical_name == canonical_event))
        existing_event = res.scalar_one_or_none()
        if not existing_event:
            new_event = CulturalEvent(
                id=uuid.uuid4(),
                canonical_name=canonical_event,
                display_title=req.event_name or "विशेष पावन पर्व",
                event_type=EventType.PANCHANG_TITHI,
                event_date=event_date,
                significance_summary=f"यूज़र द्वारा सहेजा गया विशेष पर्व: {req.chat_prompt}",
                lookahead_days=1
            )
            db.add(new_event)
            memory_saved = True
            
        prof_res = await db.execute(select(PreferenceProfile).where(PreferenceProfile.user_id == user_id))
        profile = prof_res.scalar_one_or_none()
        if profile:
            current_deities = profile.priority_deities or []
            if canonical_event not in current_deities:
                profile.priority_deities = current_deities + [canonical_event]
                db.add(profile)
                memory_saved = True
        await db.commit()

    event_title = EVENT_DISPLAY_MAP.get(canonical_event, req.event_name or "पावन पर्व")
    gemini_topic = f"{event_title}: {req.chat_prompt}"
    body_copy = generate_creative_copy_gemini(topic=gemini_topic, tone="REVERENT_DEVOTIONAL", language="hi_IN")
    if "Error:" in body_copy:
        body_copy = f"इस पावन अवसर पर आपके जीवन में सुख, शांति और समृद्धि का वास हो। {event_title} की हार्दिक बधाई!"

    headline = f"{event_title} की हार्दिक शुभकामनाएं"
    shloka = "शान्ताकारं भुजगशयनं पद्मनाभं सुरेशं। विश्वाधारं गगनसदृशं मेघवर्णं शुभाङ्गम्॥"

    bg_path = generate_backdrop(prompt=f"{event_title}, {req.chat_prompt}, divine Indian spiritual aesthetic, 8k resolution")

    from pathlib import Path
    artifact_id = uuid.uuid4()
    static_dir = Path(__file__).resolve().parent.parent.parent / "static"
    static_dir.mkdir(parents=True, exist_ok=True)
    out_filename = f"artifact_{artifact_id.hex[:10]}.webp"
    out_filepath = str(static_dir / out_filename)

    compose_greeting_card(
        background_path=bg_path,
        portrait_path="",
        headline=headline,
        shloka=shloka,
        user_name=req.user_name or "आदरणीय सदस्य",
        user_designation=req.user_designation or "समाजसेवी",
        output_path=out_filepath
    )

    new_artifact = Artifact(
        id=artifact_id,
        user_id=user_id,
        headline=headline,
        body_copy=body_copy,
        shloka_text=shloka,
        shloka_source="वैदिक श्लोक",
        background_image_url=bg_path,
        composite_image_url=f"/static/{out_filename}",
        status=ArtifactStatus.READY_FOR_REVIEW,
        generation_metadata={"ordered_by": "agent_chat", "prompt": req.chat_prompt, "date": str(event_date)}
    )
    db.add(new_artifact)
    await db.commit()
    await db.refresh(new_artifact)

    confirm_msg = f"✅ आपका {event_title} का पावन संदेश सफलतापूर्वक तैयार कर दिया गया है!"
    if memory_saved:
        confirm_msg += " यह पर्व आपकी प्राथमिकताओं (Agent Memory) में भी सहेज लिया गया है।"

    return AgentChatOrderResponse(
        agent_message=confirm_msg,
        artifact=ArtifactResponse(
            id=new_artifact.id,
            user_id=new_artifact.user_id,
            event_name=canonical_event,
            headline=new_artifact.headline,
            body_copy=new_artifact.body_copy,
            shloka_text=new_artifact.shloka_text,
            shloka_source=new_artifact.shloka_source,
            background_image_url=new_artifact.background_image_url,
            composite_image_url=new_artifact.composite_image_url,
            status=new_artifact.status.value if hasattr(new_artifact.status, "value") else str(new_artifact.status),
            created_at=new_artifact.created_at
        ),
        memory_saved=memory_saved
    )

@router.post("/{artifact_id}/dispatch")
async def dispatch_artifact(
    artifact_id: UUID,
    request: DispatchRequest,
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Artifact).where(Artifact.id == artifact_id, Artifact.user_id == user_id))
    artifact = result.scalar_one_or_none()
    if not artifact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Artifact not found")
    
    artifact.status = ArtifactStatus.APPROVED
    log = DispatchLog(
        id=uuid.uuid4(),
        artifact_id=artifact_id,
        user_id=user_id,
        action=DispatchAction.SHARED_ONE_TAP,
        target_platform=None
    )
    db.add(log)
    await db.commit()
    
    return {"message": "Artifact dispatched successfully", "status": "APPROVED"}
