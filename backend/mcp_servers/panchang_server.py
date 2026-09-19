from mcp.server.fastmcp import FastMCP
from datetime import datetime, timedelta

mcp = FastMCP('panchang-server')

FESTIVALS_2026 = {
    "2026-01-14": {"primary_event": "Makar Sankranti", "display_title_hi": "मकर संक्रांति", "presiding_deity": "Surya", "significance": "Celebrates the sun's transition into Capricorn. Marks the end of winter.", "auspicious_muhurta": "08:00 - 12:00", "event_type": "SOLAR_FESTIVAL"},
    "2026-01-26": {"primary_event": "Republic Day", "display_title_hi": "गणतंत्र दिवस", "presiding_deity": "Bharat Mata", "significance": "Celebrates the adoption of the Constitution of India.", "auspicious_muhurta": "08:00 - 10:00", "event_type": "CIVIC_EVENT"},
    "2026-02-14": {"primary_event": "Maha Shivratri", "display_title_hi": "महाशिवरात्रि", "presiding_deity": "Shiva", "significance": "Great night of Shiva. Celebrates his cosmic dance.", "auspicious_muhurta": "23:00 - 02:00", "event_type": "PANCHANG_TITHI"},
    "2026-03-03": {"primary_event": "Holi", "display_title_hi": "होली", "presiding_deity": "Krishna", "significance": "Festival of colors. Celebrates divine love and triumph of good.", "auspicious_muhurta": "09:00 - 13:00", "event_type": "PANCHANG_TITHI"},
    "2026-11-08": {"primary_event": "Diwali", "display_title_hi": "दिवाली", "presiding_deity": "Lakshmi", "significance": "Festival of lights. Celebrates Rama's return to Ayodhya.", "auspicious_muhurta": "18:00 - 20:30", "event_type": "PANCHANG_TITHI"}
}

@mcp.tool()
def get_cultural_context(date: str, lat: float = 25.3176, lon: float = 82.9739) -> dict:
    if date in FESTIVALS_2026:
        return FESTIVALS_2026[date]
    return {
        "primary_event": "Daily Greeting",
        "display_title_hi": "शुभ दिन",
        "presiding_deity": "General",
        "significance": "A general auspicious day.",
        "auspicious_muhurta": "All day",
        "event_type": "GENERAL"
    }

@mcp.tool()
def get_upcoming_events(days_ahead: int = 14, region: str = 'NORTH_INDIAN') -> list:
    today = datetime.now()
    upcoming = []
    for i in range(days_ahead):
        d_str = (today + timedelta(days=i)).strftime("%Y-%m-%d")
        if d_str in FESTIVALS_2026:
            upcoming.append(FESTIVALS_2026[d_str])
    return upcoming

if __name__ == '__main__':
    mcp.run()
