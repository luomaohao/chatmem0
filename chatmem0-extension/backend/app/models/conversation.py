from sqlalchemy import Column, String, Text, Boolean, DateTime, JSON
from sqlalchemy.sql import func
from app.db.database import Base

class Conversation(Base):
    __tablename__ = "conversations"
    
    id = Column(String, primary_key=True, index=True)
    platform = Column(String, nullable=False)
    title = Column(String, nullable=False)
    url = Column(String, nullable=False)
    created_at = Column(String, nullable=False)
    updated_at = Column(String, nullable=False)
    messages = Column(JSON, nullable=False)
    processed = Column(Boolean, default=False)
    processed_at = Column(String, nullable=False)
    tags = Column(JSON, nullable=True)
    summary = Column(Text, nullable=True)
    metadata = Column(JSON, nullable=True)
    
    db_created_at = Column(DateTime(timezone=True), server_default=func.now())
    db_updated_at = Column(DateTime(timezone=True), onupdate=func.now())