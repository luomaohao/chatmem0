from sqlalchemy import Column, String, Text, Boolean, DateTime, JSON, Index
from sqlalchemy.sql import func
from app.db.database import Base
from datetime import datetime

class Conversation(Base):
    __tablename__ = "conversations"
    
    id = Column(String(255), primary_key=True, index=True)
    platform = Column(String(50), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    url = Column(String(1000), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=False)
    messages = Column(JSON, nullable=False)
    processed = Column(Boolean, default=False, index=True)
    processed_at = Column(DateTime(timezone=True), nullable=True)
    tags = Column(JSON, nullable=True)
    summary = Column(Text, nullable=True)
    metadata = Column(JSON, nullable=True)
    
    db_created_at = Column(DateTime(timezone=True), server_default=func.now())
    db_updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 添加复合索引以提高查询性能
    __table_args__ = (
        Index('idx_platform_processed', 'platform', 'processed'),
        Index('idx_created_at', 'created_at'),
        Index('idx_updated_at', 'updated_at'),
    )