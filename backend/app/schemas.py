"""
Agentic PR Manager — Pydantic Schemas (Request/Response DTOs)

Serialization schemas for all API endpoints.
"""

import uuid
from datetime import datetime, date, time
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ═══════════════════════════════════════════════════════════
# Shared Enums (mirrored from ORM for API contracts)
# ═══════════════════════════════════════════════════════════

class ArchetypeEnum(str, Enum):
    CULTURAL_LEADER = "CULTURAL_LEADER"
    CIVIC_REPRESENTATIVE = "CIVIC_REPRESENTATIVE"
    FAMILY_HEAD = "FAMILY_HEAD"
    LOCAL_PROFESSIONAL = "LOCAL_PROFESSIONAL"


class ToneRegisterEnum(str, Enum):
    REVERENT_DEVOTIONAL = "REVERENT_DEVOTIONAL"
    CIVIC_AUTHORITATIVE = "CIVIC_AUTHORITATIVE"
    WARM_FAMILIAL = "WARM_FAMILIAL"


class ArtifactStatusEnum(str, Enum):
    PENDING_GENERATION = "PENDING_GENERATION"
    READY_FOR_REVIEW = "READY_FOR_REVIEW"
    APPROVED = "APPROVED"
    DISMISSED = "DISMISSED"
    FAILED = "FAILED"


class DispatchActionEnum(str, Enum):
    SHARED_ONE_TAP = "SHARED_ONE_TAP"
    EDIT_REQUESTED = "EDIT_REQUESTED"
    DISMISSED_EXPIRED = "DISMISSED_EXPIRED"


class TargetPlatformEnum(str, Enum):
    WHATSAPP_STATUS = "WHATSAPP_STATUS"
    WHATSAPP_CHAT = "WHATSAPP_CHAT"
    FACEBOOK = "FACEBOOK"
    MANUAL_DOWNLOAD = "MANUAL_DOWNLOAD"


# ═══════════════════════════════════════════════════════════
# User Schemas
# ═══════════════════════════════════════════════════════════

class UserOnboardRequest(BaseModel):
    """POST /api/v1/users/onboard — Onboarding questionnaire submission."""
    phone_number: str = Field(..., min_length=10, max_length=15)
    display_name: str = Field(..., min_length=1, max_length=200)
    designation: Optional[str] = Field(None, max_length=300)
    archetype: ArchetypeEnum
    language_code: str = Field(default="hi_IN", max_length=10)
    tone_register: ToneRegisterEnum = ToneRegisterEnum.REVERENT_DEVOTIONAL
    calendar_subscriptions: list[str] = Field(
        default=["PANCHANG_NORTH_INDIAN", "NATIONAL_GAZETTED"]
    )
    priority_deities: list[str] = Field(default=[])
    target_channels: list[str] = Field(default=["WHATSAPP_STATUS"])
    scheduled_delivery_time: str = Field(
        default="06:00",
        description="HH:MM format in IST"
    )
    # Portrait image is sent as multipart file, not in JSON body


class UserOnboardResponse(BaseModel):
    """Response after successful onboarding."""
    user_id: uuid.UUID
    display_name: str
    archetype: ArchetypeEnum
    portrait_url: Optional[str] = None
    message: str = "Onboarding successful"


class UserProfileResponse(BaseModel):
    """GET /api/v1/users/me — User profile response."""
    id: uuid.UUID
    phone_number: str
    display_name: str
    designation: Optional[str]
    portrait_url: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class PreferenceProfileResponse(BaseModel):
    """GET /api/v1/users/me/profile — Preference profile response."""
    id: uuid.UUID
    archetype: ArchetypeEnum
    calendar_subscriptions: list[str]
    priority_deities: list[str]
    language_code: str
    tone_register: ToneRegisterEnum
    target_channels: list[str]
    scheduled_delivery_time: str

    class Config:
        from_attributes = True


class ProfileUpdateRequest(BaseModel):
    """PATCH /api/v1/users/me/profile — Partial profile update."""
    archetype: Optional[ArchetypeEnum] = None
    calendar_subscriptions: Optional[list[str]] = None
    priority_deities: Optional[list[str]] = None
    language_code: Optional[str] = None
    tone_register: Optional[ToneRegisterEnum] = None
    target_channels: Optional[list[str]] = None
    scheduled_delivery_time: Optional[str] = None


class UserUpdateRequest(BaseModel):
    """PATCH /api/v1/users/me — Update display name or designation."""
    display_name: Optional[str] = Field(None, max_length=200)
    designation: Optional[str] = Field(None, max_length=300)


# ═══════════════════════════════════════════════════════════
# Calendar Schemas
# ═══════════════════════════════════════════════════════════

class CulturalContextResponse(BaseModel):
    """GET /api/v1/calendar/today — Today's cultural context."""
    date: str
    primary_event: str
    display_title: str
    event_type: str
    presiding_deity: Optional[str]
    significance: str
    auspicious_muhurta: Optional[str]


class UpcomingEventResponse(BaseModel):
    """Single event in the upcoming events list."""
    canonical_name: str
    display_title: str
    event_type: str
    event_date: str
    presiding_deity: Optional[str]
    lookahead_days: int


class ArchetypeInfo(BaseModel):
    """GET /api/v1/calendar/archetypes — Archetype metadata."""
    code: str
    display_name: str
    description: str
    typical_tone: str


class DeityInfo(BaseModel):
    """GET /api/v1/calendar/deities — Deity metadata."""
    code: str
    display_name_hi: str
    display_name_en: str
    tradition: str


# ═══════════════════════════════════════════════════════════
# Artifact Schemas
# ═══════════════════════════════════════════════════════════

class ArtifactResponse(BaseModel):
    """GET /api/v1/artifacts/{id} — Artifact detail response."""
    id: uuid.UUID
    user_id: uuid.UUID
    event_name: Optional[str] = None
    headline: str
    body_copy: str
    shloka_text: Optional[str]
    shloka_source: Optional[str]
    background_image_url: Optional[str]
    composite_image_url: Optional[str]
    status: ArtifactStatusEnum
    created_at: datetime

    class Config:
        from_attributes = True


class GenerateArtifactRequest(BaseModel):
    """POST /api/v1/artifacts/generate — Manual order/generation request."""
    event_date: Optional[str] = None
    event_name: Optional[str] = None
    user_name: Optional[str] = "आदरणीय सदस्य"
    user_designation: Optional[str] = "समाजसेवी"
    custom_instruction: Optional[str] = None
    tone: Optional[str] = "REVERENT_DEVOTIONAL"


class AgentChatOrderRequest(BaseModel):
    """POST /api/v1/artifacts/agent-chat — Interactive on-the-go chat artifact order."""
    chat_prompt: str
    event_name: Optional[str] = None
    event_date: Optional[str] = None
    save_to_memory: bool = True
    user_name: Optional[str] = "आदरणीय सदस्य"
    user_designation: Optional[str] = "समाजसेवी"


class AgentChatOrderResponse(BaseModel):
    agent_message: str
    artifact: ArtifactResponse
    memory_saved: bool


class ArtifactDailyResponse(BaseModel):
    """GET /api/v1/artifacts/daily — Today's artifact."""
    artifact: Optional[ArtifactResponse] = None
    has_artifact: bool = False
    message: str = ""


class ArtifactHistoryResponse(BaseModel):
    """GET /api/v1/artifacts/history — Paginated history."""
    artifacts: list[ArtifactResponse]
    total: int
    page: int
    page_size: int


class DispatchRequest(BaseModel):
    """POST /api/v1/artifacts/{id}/dispatch — Record a share action."""
    action: DispatchActionEnum
    target_platform: Optional[TargetPlatformEnum] = None
    user_feedback_rating: Optional[int] = Field(None, ge=1, le=5)


class TweakRequest(BaseModel):
    """POST /api/v1/artifacts/{id}/tweak — Request regeneration."""
    tone_register: Optional[ToneRegisterEnum] = None
    prefer_different_shloka: bool = False
    backdrop_style: Optional[str] = None
    custom_instruction: Optional[str] = Field(None, max_length=500)


class DispatchLogResponse(BaseModel):
    """GET /api/v1/dispatch/logs — Dispatch log entry."""
    id: uuid.UUID
    artifact_id: uuid.UUID
    action: DispatchActionEnum
    target_platform: Optional[TargetPlatformEnum]
    user_feedback_rating: Optional[int]
    action_timestamp: datetime

    class Config:
        from_attributes = True


# ═══════════════════════════════════════════════════════════
# Device Schemas
# ═══════════════════════════════════════════════════════════

class FCMTokenRequest(BaseModel):
    """POST /api/v1/device/fcm-token — Register FCM token."""
    token: str = Field(..., min_length=10)


# ═══════════════════════════════════════════════════════════
# Health Check
# ═══════════════════════════════════════════════════════════

class HealthResponse(BaseModel):
    """GET /api/v1/system/health"""
    status: str = "healthy"
    app_name: str
    version: str
    environment: str
    database: str = "unknown"
    timestamp: datetime
