from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class MessageSchema(BaseModel):
    id: str
    role: str = Field(..., regex="^(user|assistant|system)$")
    content: str
    contentType: str = Field(..., regex="^(text|code|image|mixed)$")
    timestamp: str
    metadata: Optional[Dict[str, Any]] = None

class ConversationSchema(BaseModel):
    id: str
    platform: str
    title: str
    url: str
    createdAt: str
    updatedAt: str
    messages: List[MessageSchema]
    processed: bool
    processedAt: str
    tags: Optional[List[str]] = None
    summary: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class ConversationResponse(BaseModel):
    id: str
    status: str
    message: str

class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None