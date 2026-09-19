from strands import tool

@tool
def compose_image(background_url: str, portrait_url: str, headline: str, shloka: str, user_name: str, user_designation: str) -> str:
    """
    Composites the final greeting card using the background image, portrait, and text overlays.
    Returns the final CDN URL.
    """
    # Mock implementation of compositor engine
    # In reality: from backend.app.compositor.engine import compose
    # final_url = compose(background_url, portrait_url, headline, shloka, user_name, user_designation)
    
    return "https://cdn.example.com/mock_final_composition.png"
