"""
Agentic PR Manager — SQLAlchemy ORM Models

All 5 core entities: User, PreferenceProfile, CulturalEvent, Artifact, DispatchLog.
"""

import enum
import uuid
from datetime import datetime, time, date

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    Time,
    func,
    JSON,
    Uuid,
)
from sqlalchemy.orm import relationship

from app.database import Base


# ═══════════════════════════════════════════════════════════
# Enums
# ═══════════════════════════════════════════════════════════

class Archetype(str, enum.Enum):
    CULTURAL_LEADER = "CULTURAL_LEADER"
    CIVIC_REPRESENTATIVE = "CIVIC_REPRESENTATIVE"
    FAMILY_HEAD = "FAMILY_HEAD"
    LOCAL_PROFESSIONAL = "LOCAL_PROFESSIONAL"


class ToneRegister(str, enum.Enum):
    REVERENT_DEVOTIONAL = "REVERENT_DEVOTIONAL"
    CIVIC_AUTHORITATIVE = "CIVIC_AUTHORITATIVE"
    WARM_FAMILIAL = "WARM_FAMILIAL"


class EventType(str, enum.Enum):
    PANCHANG_TITHI = "PANCHANG_TITHI"
    SOLAR_FESTIVAL = "SOLAR_FESTIVAL"
    NATIONAL_HOLIDAY = "NATIONAL_HOLIDAY"
    CIVIC_PULSE = "CIVIC_PULSE"


class ArtifactStatus(str, enum.Enum):
    PENDING_GENERATION = "PENDING_GENERATION"
    READY_FOR_REVIEW = "READY_FOR_REVIEW"
    APPROVED = "APPROVED"
    DISMISSED = "DISMISSED"
    FAILED = "FAILED"


class DispatchAction(str, enum.Enum):
    SHARED_ONE_TAP = "SHARED_ONE_TAP"
    EDIT_REQUESTED = "EDIT_REQUESTED"
    DISMISSED_EXPIRED = "DISMISSED_EXPIRED"


class TargetPlatform(str, enum.Enum):
    WHATSAPP_STATUS = "WHATSAPP_STATUS"
    WHATSAPP_CHAT = "WHATSAPP_CHAT"
    FACEBOOK = "FACEBOOK"
    MANUAL_DOWNLOAD = "MANUAL_DOWNLOAD"


# ═══════════════════════════════════════════════════════════
# Entity 1: User
# ═══════════════════════════════════════════════════════════

class User(Base):
    """Account holder and persistent identity assets."""

    __tablename__ = "users"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    phone_number = Column(String(20), unique=True, nullable=False, index=True)
    display_name = Column(String(200), nullable=False)
    designation = Column(String(300), nullable=True)
    portrait_url = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    fcm_device_token = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    preference_profile = relationship(
        "PreferenceProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    artifacts = relationship(
        "Artifact", back_populates="user", cascade="all, delete-orphan"
    )
    dispatch_logs = relationship(
        "DispatchLog", back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User {self.display_name} ({self.phone_number})>"


# ═══════════════════════════════════════════════════════════
# Entity 2: PreferenceProfile
# ═══════════════════════════════════════════════════════════

class PreferenceProfile(Base):
    """Onboarding calibration data that narrows the agent's generative scope."""

    __tablename__ = "preference_profiles"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id = Column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"),
        unique=True, nullable=False
    )

    archetype = Column(Enum(Archetype), nullable=False)
    calendar_subscriptions = Column(
        JSON, nullable=False,
        default=["PANCHANG_NORTH_INDIAN", "NATIONAL_GAZETTED"]
    )
    priority_deities = Column(JSON, nullable=True, default=[])
    language_code = Column(String(10), nullable=False, default="hi_IN")
    tone_register = Column(
        Enum(ToneRegister), nullable=False, default=ToneRegister.REVERENT_DEVOTIONAL
    )
    target_channels = Column(
        JSON, nullable=False,
        default=["WHATSAPP_STATUS"]
    )
    scheduled_delivery_time = Column(
        Time(timezone=True), nullable=False,
        default=time(6, 0)  # 06:00 AM
    )
    
    # Newly Added for MVP 6-Pillar Strategy
    layout_style = Column(String(50), nullable=False, default="SIDE_BY_SIDE")
    color_theme = Column(String(50), nullable=False, default="ROYAL_SAFFRON")
    custom_signoff = Column(String(300), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    user = relationship("User", back_populates="preference_profile")

    def __repr__(self) -> str:
        return f"<PreferenceProfile {self.archetype.value} for user={self.user_id}>"


# ═══════════════════════════════════════════════════════════
# Entity 3: CulturalEvent
# ═══════════════════════════════════════════════════════════

class CulturalEvent(Base):
    """Temporal milestone, festive observance, or civic holiday."""

    __tablename__ = "cultural_events"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    canonical_name = Column(String(100), nullable=False, index=True)
    display_title = Column(String(500), nullable=False)
    event_type = Column(Enum(EventType), nullable=False)
    event_date = Column(Date, nullable=False, index=True)

    tithi_details = Column(JSON, nullable=True)
    significance_summary = Column(Text, nullable=False)
    presiding_deity = Column(String(100), nullable=True)
    auspicious_muhurta = Column(String(100), nullable=True)
    lookahead_days = Column(Integer, nullable=False, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    artifacts = relationship("Artifact", back_populates="event")

    def __repr__(self) -> str:
        return f"<CulturalEvent {self.canonical_name} on {self.event_date}>"


# ═══════════════════════════════════════════════════════════
# Entity 4: Artifact (GreetingPost)
# ═══════════════════════════════════════════════════════════

class Artifact(Base):
    """Synthesized multimodal greeting asset for user review and dispatch."""

    __tablename__ = "artifacts"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id = Column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    event_id = Column(
        Uuid, ForeignKey("cultural_events.id", ondelete="SET NULL"),
        nullable=True
    )

    headline = Column(String(500), nullable=False)
    body_copy = Column(Text, nullable=False)
    shloka_text = Column(Text, nullable=True)
    shloka_source = Column(String(300), nullable=True)

    background_image_url = Column(Text, nullable=True)
    composite_image_url = Column(Text, nullable=True)
    image_checksum = Column(String(64), nullable=True)

    status = Column(
        Enum(ArtifactStatus), nullable=False, default=ArtifactStatus.PENDING_GENERATION
    )
    generation_metadata = Column(JSON, nullable=True)  # Agent trace, token usage, etc.

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    user = relationship("User", back_populates="artifacts")
    event = relationship("CulturalEvent", back_populates="artifacts")
    dispatch_logs = relationship(
        "DispatchLog", back_populates="artifact", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Artifact {self.status.value} for user={self.user_id}>"


# ═══════════════════════════════════════════════════════════
# Entity 5: DispatchLog
# ═══════════════════════════════════════════════════════════

class DispatchLog(Base):
    """Audit record tracking human-in-the-loop sharing decisions."""

    __tablename__ = "dispatch_logs"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    artifact_id = Column(
        Uuid, ForeignKey("artifacts.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    user_id = Column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True
    )

    action = Column(Enum(DispatchAction), nullable=False)
    target_platform = Column(Enum(TargetPlatform), nullable=True)
    user_feedback_rating = Column(Integer, nullable=True)  # 1-5

    action_timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    artifact = relationship("Artifact", back_populates="dispatch_logs")
    user = relationship("User", back_populates="dispatch_logs")

    def __repr__(self) -> str:
        return f"<DispatchLog {self.action.value} artifact={self.artifact_id}>"
