from strands import tool

@tool
def cedar_validate(user_id: str, archetype: str, action: str, event_type: str, contains_social_post: bool = False) -> str:
    """
    Validates proposed artifacts against Cedar authorization policies.
    Returns 'ALLOW' or 'DENY: <reason>'.
    """
    if contains_social_post:
        return "DENY: No archetype can auto-post to social media."

    if archetype == "CULTURAL_LEADER":
        if event_type not in ["PANCHANG_TITHI", "SOLAR_FESTIVAL"]:
            return f"DENY: CULTURAL_LEADER cannot generate for event type {event_type}."
        return "ALLOW"
    
    elif archetype == "CIVIC_REPRESENTATIVE":
        return "ALLOW"
    
    elif archetype == "FAMILY_HEAD":
        if event_type == "CIVIC_PULSE":
            return "DENY: FAMILY_HEAD cannot generate for CIVIC_PULSE."
        return "ALLOW"
        
    return "DENY: Unknown archetype or rule missing."
