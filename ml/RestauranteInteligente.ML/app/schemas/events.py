from datetime import datetime, timezone
from typing import Any, Dict
from uuid import UUID, uuid4
from pydantic import BaseModel, ConfigDict, Field


class StreamEventEnvelope(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
        populate_by_name=True
    )

    event_type: str = Field(..., alias="eventType")
    payload_json: str = Field(..., alias="payloadJson")
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        alias="timestamp"
    )
    correlation_id: UUID = Field(
        default_factory=uuid4,
        alias="correlationId"
    )


class ScrapingProgressPayload(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    status: str
    progress_percentage: int = Field(ge=0, le=100)
    items_extracted: int = Field(ge=0)
    detail: str = ""


class MLInferenceProgressPayload(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    step: str
    progress_percentage: int = Field(ge=0, le=100)
    current_product_id: str
    detail: str = ""
