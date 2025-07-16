from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime

class MessageSchema(BaseModel):
    id: str
    role: str = Field(..., regex="^(user|assistant|system)$")
    content: str
    contentType: str = Field(..., regex="^(text|code|image|mixed)$")
    timestamp: str
    metadata: Optional[Dict[str, Any]] = None
    
    @validator('timestamp')
    def validate_timestamp(cls, v):
        try:
            datetime.fromisoformat(v.replace('Z', '+00:00'))
            return v
        except ValueError:
            raise ValueError('Invalid timestamp format')

class ConversationSchema(BaseModel):
    id: str = Field(..., min_length=1, max_length=255)
    platform: str = Field(..., min_length=1, max_length=50)
    title: str = Field(..., min_length=1, max_length=500)
    url: str = Field(..., min_length=1, max_length=1000)
    createdAt: str
    updatedAt: str
    messages: List[MessageSchema] = Field(..., min_items=1)
    processed: bool
    processedAt: Optional[str] = None
    tags: Optional[List[str]] = None
    summary: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    
    @validator('createdAt', 'updatedAt')
    def validate_datetime(cls, v):
        try:
            datetime.fromisoformat(v.replace('Z', '+00:00'))
            return v
        except ValueError:
            raise ValueError('Invalid datetime format')
    
    @validator('processedAt')
    def validate_processed_at(cls, v):
        if v is not None:
            try:
                datetime.fromisoformat(v.replace('Z', '+00:00'))
                return v
            except ValueError:
                raise ValueError('Invalid processed_at datetime format')
        return v

class ConversationResponse(BaseModel):
    id: str
    status: str
    message: str

class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None