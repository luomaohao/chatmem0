from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.conversation import Conversation
from app.schemas.conversation import ConversationSchema, ConversationResponse, ErrorResponse
import json

router = APIRouter()

@router.post("/conversations", response_model=ConversationResponse)
async def create_or_update_conversation(
    conversation: ConversationSchema,
    db: Session = Depends(get_db)
):
    try:
        existing = db.query(Conversation).filter(Conversation.id == conversation.id).first()
        
        if existing:
            existing.platform = conversation.platform
            existing.title = conversation.title
            existing.url = conversation.url
            existing.created_at = conversation.createdAt
            existing.updated_at = conversation.updatedAt
            existing.messages = [msg.dict() for msg in conversation.messages]
            existing.processed = conversation.processed
            existing.processed_at = conversation.processedAt
            existing.tags = conversation.tags
            existing.summary = conversation.summary
            existing.metadata = conversation.metadata
            
            db.commit()
            db.refresh(existing)
            
            return ConversationResponse(
                id=existing.id,
                status="updated",
                message="Conversation updated successfully"
            )
        else:
            new_conversation = Conversation(
                id=conversation.id,
                platform=conversation.platform,
                title=conversation.title,
                url=conversation.url,
                created_at=conversation.createdAt,
                updated_at=conversation.updatedAt,
                messages=[msg.dict() for msg in conversation.messages],
                processed=conversation.processed,
                processed_at=conversation.processedAt,
                tags=conversation.tags,
                summary=conversation.summary,
                metadata=conversation.metadata
            )
            
            db.add(new_conversation)
            db.commit()
            db.refresh(new_conversation)
            
            return ConversationResponse(
                id=new_conversation.id,
                status="created",
                message="Conversation created successfully"
            )
            
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )

@router.get("/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: str,
    db: Session = Depends(get_db)
):
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    return {
        "id": conversation.id,
        "platform": conversation.platform,
        "title": conversation.title,
        "url": conversation.url,
        "createdAt": conversation.created_at,
        "updatedAt": conversation.updated_at,
        "messages": conversation.messages,
        "processed": conversation.processed,
        "processedAt": conversation.processed_at,
        "tags": conversation.tags,
        "summary": conversation.summary,
        "metadata": conversation.metadata
    }

@router.get("/conversations")
async def get_conversations(
    skip: int = 0,
    limit: int = 100,
    platform: str = None,
    db: Session = Depends(get_db)
):
    query = db.query(Conversation)
    
    if platform:
        query = query.filter(Conversation.platform == platform)
    
    conversations = query.offset(skip).limit(limit).all()
    
    return [
        {
            "id": conv.id,
            "platform": conv.platform,
            "title": conv.title,
            "url": conv.url,
            "createdAt": conv.created_at,
            "updatedAt": conv.updated_at,
            "messages": conv.messages,
            "processed": conv.processed,
            "processedAt": conv.processed_at,
            "tags": conv.tags,
            "summary": conv.summary,
            "metadata": conv.metadata
        }
        for conv in conversations
    ]