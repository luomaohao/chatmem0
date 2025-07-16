from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.db.database import get_db
from app.models.conversation import Conversation
from app.schemas.conversation import ConversationSchema, ConversationResponse, ErrorResponse
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/conversations", response_model=ConversationResponse)
async def create_or_update_conversation(
    conversation: ConversationSchema,
    db: Session = Depends(get_db)
):
    try:
        # 转换时间字符串为datetime对象
        created_at = datetime.fromisoformat(conversation.createdAt.replace('Z', '+00:00'))
        updated_at = datetime.fromisoformat(conversation.updatedAt.replace('Z', '+00:00'))
        processed_at = None
        if conversation.processedAt:
            processed_at = datetime.fromisoformat(conversation.processedAt.replace('Z', '+00:00'))
        
        existing = db.query(Conversation).filter(Conversation.id == conversation.id).first()
        
        if existing:
            # 更新现有对话
            existing.platform = conversation.platform
            existing.title = conversation.title
            existing.url = conversation.url
            existing.created_at = created_at
            existing.updated_at = updated_at
            existing.messages = [msg.dict() for msg in conversation.messages]
            existing.processed = conversation.processed
            existing.processed_at = processed_at
            existing.tags = conversation.tags
            existing.summary = conversation.summary
            existing.metadata = conversation.metadata
            
            db.commit()
            db.refresh(existing)
            
            logger.info(f"Conversation updated: {conversation.id}")
            return ConversationResponse(
                id=existing.id,
                status="updated",
                message="Conversation updated successfully"
            )
        else:
            # 创建新对话
            new_conversation = Conversation(
                id=conversation.id,
                platform=conversation.platform,
                title=conversation.title,
                url=conversation.url,
                created_at=created_at,
                updated_at=updated_at,
                messages=[msg.dict() for msg in conversation.messages],
                processed=conversation.processed,
                processed_at=processed_at,
                tags=conversation.tags,
                summary=conversation.summary,
                metadata=conversation.metadata
            )
            
            db.add(new_conversation)
            db.commit()
            db.refresh(new_conversation)
            
            logger.info(f"Conversation created: {conversation.id}")
            return ConversationResponse(
                id=new_conversation.id,
                status="created",
                message="Conversation created successfully"
            )
            
    except Exception as e:
        db.rollback()
        logger.error(f"Database error in create_or_update_conversation: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )

@router.get("/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: str,
    db: Session = Depends(get_db)
):
    try:
        conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        return {
            "id": conversation.id,
            "platform": conversation.platform,
            "title": conversation.title,
            "url": conversation.url,
            "createdAt": conversation.created_at.isoformat() if conversation.created_at else None,
            "updatedAt": conversation.updated_at.isoformat() if conversation.updated_at else None,
            "messages": conversation.messages,
            "processed": conversation.processed,
            "processedAt": conversation.processed_at.isoformat() if conversation.processed_at else None,
            "tags": conversation.tags,
            "summary": conversation.summary,
            "metadata": conversation.metadata
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting conversation {conversation_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/conversations")
async def get_conversations(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
    platform: str = Query(None, description="Filter by platform"),
    processed: bool = Query(None, description="Filter by processed status"),
    db: Session = Depends(get_db)
):
    try:
        query = db.query(Conversation)
        
        if platform:
            query = query.filter(Conversation.platform == platform)
        
        if processed is not None:
            query = query.filter(Conversation.processed == processed)
        
        # 按更新时间倒序排列
        conversations = query.order_by(desc(Conversation.updated_at)).offset(skip).limit(limit).all()
        
        return [
            {
                "id": conv.id,
                "platform": conv.platform,
                "title": conv.title,
                "url": conv.url,
                "createdAt": conv.created_at.isoformat() if conv.created_at else None,
                "updatedAt": conv.updated_at.isoformat() if conv.updated_at else None,
                "messages": conv.messages,
                "processed": conv.processed,
                "processedAt": conv.processed_at.isoformat() if conv.processed_at else None,
                "tags": conv.tags,
                "summary": conv.summary,
                "metadata": conv.metadata
            }
            for conv in conversations
        ]
    except Exception as e:
        logger.error(f"Error getting conversations: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")