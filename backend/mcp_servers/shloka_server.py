from mcp.server.fastmcp import FastMCP

mcp = FastMCP('shloka-server')

SHLOKAS = [
    {
        "id": "s1",
        "verse_text": "वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ। निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा॥",
        "transliteration": "Vakratunda Mahakaya Suryakoti Samaprabha...",
        "meaning_hi": "हे वक्रतुंड, महाकाय, करोड़ों सूर्यों के समान तेज वाले देवता, मेरे सभी कार्य हमेशा निर्विघ्न पूरे करें।",
        "meaning_en": "O Lord Ganesha, of curved trunk, large body, and the brilliance of a million suns...",
        "deity": "Ganesha",
        "occasion": ["General", "New Beginnings"],
        "source": "Traditional"
    },
    {
        "id": "s2",
        "verse_text": "ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम्। उर्वारुकमिव बन्धनान् मृत्योर्मुक्षीय माऽमृतात्॥",
        "transliteration": "Om Tryambakam Yajamahe Sugandhim Pushtivardhanam...",
        "meaning_hi": "हम त्रिनेत्रधारी भगवान शिव की आराधना करते हैं...",
        "meaning_en": "We worship the three-eyed One, who is fragrant and who nourishes all...",
        "deity": "Shiva",
        "occasion": ["Maha Shivratri", "General", "Health"],
        "source": "Rigveda 7.59.12"
    },
    {
        "id": "s3",
        "verse_text": "मङ्गलम् भगवान विष्णुः, मङ्गलम् गरुणध्वजः। मङ्गलम् पुण्डरी काक्षः, मङ्गलाय तनो हरिः॥",
        "transliteration": "Mangalam Bhagawan Vishnuh, Mangalam Garunadhvajah...",
        "meaning_hi": "भगवान विष्णु मंगलमय हैं, गरुड़ ध्वज वाले मंगलमय हैं...",
        "meaning_en": "Auspicious is Lord Vishnu, auspicious is the one with the Garuda flag...",
        "deity": "Vishnu",
        "occasion": ["General", "Festivals"],
        "source": "Traditional"
    },
    {
        "id": "s4",
        "verse_text": "नमस्तेऽस्तु महामाये श्रीपीठे सुरपूजिते। शङ्खचक्रगदाहस्ते महालक्ष्मि नमोऽस्तु ते॥",
        "transliteration": "Namastestu Mahamaye Sripithe Surapujite...",
        "meaning_hi": "हे महामाये, श्रीपीठ पर विराजमान, देवताओं द्वारा पूजित...",
        "meaning_en": "Salutations to you, O Mahamaya, who resides in the Sripitha...",
        "deity": "Lakshmi",
        "occasion": ["Diwali", "Wealth", "Fridays"],
        "source": "Mahalakshmi Ashtakam"
    }
]

@mcp.tool()
def search_shlokas(query: str, deity: str = None, language: str = 'sa_IN', top_k: int = 3) -> list:
    results = []
    q = query.lower()
    for s in SHLOKAS:
        if (deity and deity.lower() != s["deity"].lower()):
            continue
        if q in s["meaning_en"].lower() or q in s["meaning_hi"].lower() or any(q in occ.lower() for occ in s["occasion"]):
            results.append(s)
    
    if not results and not deity:
        results = SHLOKAS
        
    return results[:top_k]

@mcp.tool()
def get_shloka_by_id(shloka_id: str) -> dict:
    for s in SHLOKAS:
        if s["id"] == shloka_id:
            return s
    return {}

if __name__ == '__main__':
    mcp.run()
