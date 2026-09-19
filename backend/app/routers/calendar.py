from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import date, timedelta
from typing import List

from app.database import get_db
from app.schemas import (
    CulturalContextResponse,
    UpcomingEventResponse,
    ArchetypeInfo,
    DeityInfo,
)
from app.models import CulturalEvent

router = APIRouter(prefix="/calendar", tags=["calendar"])

@router.get("/today", response_model=CulturalContextResponse)
async def get_today_calendar(db: AsyncSession = Depends(get_db)):
    today = date.today()
    result = await db.execute(select(CulturalEvent).where(CulturalEvent.event_date == today))
    event = result.scalar_one_or_none()
    
    if event:
        return CulturalContextResponse(
            date=str(today),
            primary_event=event.canonical_name,
            display_title=event.display_title,
            event_type=event.event_type.value if hasattr(event.event_type, "value") else str(event.event_type),
            presiding_deity=event.presiding_deity,
            significance=event.significance_summary,
            auspicious_muhurta=event.auspicious_muhurta,
        )
    return CulturalContextResponse(
        date=str(today),
        primary_event="DAILY_BLESSING",
        display_title="शुभ प्रभात एवं दैनिक मंगल कामना",
        event_type="DAILY",
        presiding_deity="SURYA",
        significance="प्रातः कालीन मंगल वेला में सुख, शांति एवं समृद्धि की कामना।",
        auspicious_muhurta="06:00 - 08:30 IST",
    )

@router.get("/upcoming", response_model=List[UpcomingEventResponse])
async def get_upcoming_calendar(days: int = 60, db: AsyncSession = Depends(get_db)):
    today = date.today()
    end_date = today + timedelta(days=days)
    result = await db.execute(
        select(CulturalEvent)
        .where(CulturalEvent.event_date >= today, CulturalEvent.event_date <= end_date)
        .order_by(CulturalEvent.event_date)
    )
    events = result.scalars().all()
    return [
        UpcomingEventResponse(
            canonical_name=e.canonical_name,
            display_title=e.display_title,
            event_type=e.event_type.value if hasattr(e.event_type, "value") else str(e.event_type),
            event_date=str(e.event_date),
            presiding_deity=e.presiding_deity,
            lookahead_days=e.lookahead_days,
        )
        for e in events
    ]

@router.get("/archetypes", response_model=List[ArchetypeInfo])
async def get_archetypes():
    return [
        ArchetypeInfo(
            code="CULTURAL_LEADER",
            display_name="सांस्कृतिक एवं धार्मिक मार्गदर्शक (Cultural Leader)",
            description="Focuses on authentic traditional mantras, shlokas, and auspicious festival tithis.",
            typical_tone="REVERENT_DEVOTIONAL",
        ),
        ArchetypeInfo(
            code="CIVIC_REPRESENTATIVE",
            display_name="जनप्रतिनिधि / सामाजिक कार्यकर्ता (Civic Representative)",
            description="Broad community outreach, public welfare, national holidays, and festivals.",
            typical_tone="CIVIC_AUTHORITATIVE",
        ),
        ArchetypeInfo(
            code="FAMILY_HEAD",
            display_name="पारिवारिक मुखिया / ज्येष्ठ सदस्य (Family Head)",
            description="Warm blessings, family cohesion, and intimate festive wishes for relatives.",
            typical_tone="WARM_FAMILIAL",
        ),
        ArchetypeInfo(
            code="LOCAL_PROFESSIONAL",
            display_name="व्यापारी / पेशेवर (Local Professional)",
            description="Client and colleague relationship greetings for festivals and new beginnings.",
            typical_tone="WARM_FAMILIAL",
        ),
    ]

@router.get("/deities", response_model=List[DeityInfo])
async def get_deities():
    return [
        DeityInfo(
            code="GANESHA",
            display_name_hi="श्री गणेश",
            display_name_en="Lord Ganesha",
            tradition="Vighnaharta, remover of obstacles and patron of new beginnings.",
        ),
        DeityInfo(
            code="SHIVA",
            display_name_hi="भगवान शिव",
            display_name_en="Lord Shiva",
            tradition="Mahadeva, meditation, asceticism, and divine transformation.",
        ),
        DeityInfo(
            code="LAKSHMI",
            display_name_hi="माँ लक्ष्मी",
            display_name_en="Goddess Lakshmi",
            tradition="Goddess of wealth, prosperity, light, and auspicious fortune.",
        ),
        DeityInfo(
            code="RAMA",
            display_name_hi="प्रभु श्री राम",
            display_name_en="Lord Rama",
            tradition="Maryada Purushottam, embodiment of dharma, truth, and virtue.",
        ),
        DeityInfo(
            code="KRISHNA",
            display_name_hi="भगवान श्री कृष्ण",
            display_name_en="Lord Krishna",
            tradition="Divine wisdom, Gita's philosophical guide, and joyous devotion.",
        ),
    ]
