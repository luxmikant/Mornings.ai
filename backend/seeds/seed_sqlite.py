"""Seed initial cultural events for 2026 into SQLite."""

import asyncio
from datetime import date
import uuid
from app.database import async_session_factory
from app.models import CulturalEvent, EventType

EVENTS = [
    CulturalEvent(
        id=uuid.uuid4(),
        canonical_name="MAKAR_SANKRANTI",
        display_title="मकर संक्रांति",
        event_type=EventType.SOLAR_FESTIVAL,
        event_date=date(2026, 1, 14),
        significance_summary="Sun transitions into Capricorn (Makar Rashi). Marks the beginning of Uttarayan. Devotees take holy dips and offer til-gur.",
        presiding_deity="SURYA",
        auspicious_muhurta="06:15 to 12:30 IST",
        lookahead_days=1
    ),
    CulturalEvent(
        id=uuid.uuid4(),
        canonical_name="MAHA_SHIVRATRI",
        display_title="महा शिवरात्रि",
        event_type=EventType.PANCHANG_TITHI,
        event_date=date(2026, 2, 15),
        significance_summary="The great night of Lord Shiva. Devotees observe fasting and night-long vigil.",
        presiding_deity="SHIVA",
        auspicious_muhurta="00:00 to 06:00 IST",
        lookahead_days=2
    ),
    CulturalEvent(
        id=uuid.uuid4(),
        canonical_name="HOLI",
        display_title="होली — रंगों का त्योहार",
        event_type=EventType.SOLAR_FESTIVAL,
        event_date=date(2026, 3, 17),
        significance_summary="Festival of colors celebrating the victory of good over evil. Associated with legend of Prahlad.",
        presiding_deity="VISHNU",
        auspicious_muhurta="Evening: Holika Dahan",
        lookahead_days=2
    ),
    CulturalEvent(
        id=uuid.uuid4(),
        canonical_name="DIWALI",
        display_title="दीपावली — दीपों का त्योहार",
        event_type=EventType.SOLAR_FESTIVAL,
        event_date=date(2026, 11, 5),
        significance_summary="Festival of lights celebrating Lord Rama's return to Ayodhya and Lakshmi Puja.",
        presiding_deity="LAKSHMI",
        auspicious_muhurta="17:30 to 20:00 IST",
        lookahead_days=7
    ),
    CulturalEvent(
        id=uuid.uuid4(),
        canonical_name="TODAY_DEVOTIONAL",
        display_title="दैनिक शुभ प्रभात एवं नित्य वंदना",
        event_type=EventType.PANCHANG_TITHI,
        event_date=date.today(),
        significance_summary="नित्य प्रातः काल सूर्य आराधना, मंगल कामना एवं ईष्ट वंदना।",
        presiding_deity="SURYA",
        auspicious_muhurta="प्रातः काल ब्रह्म मुहूर्त",
        lookahead_days=0
    )
]

async def seed():
    async with async_session_factory() as session:
        for ev in EVENTS:
            session.add(ev)
        await session.commit()
    print("Seeded cultural events successfully!")

if __name__ == "__main__":
    asyncio.run(seed())
