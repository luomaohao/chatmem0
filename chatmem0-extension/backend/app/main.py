from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from app.core.cors import add_cors_middleware
from app.api.conversations import router as conversations_router
from app.db.database import engine, Base
from app.schemas.conversation import ErrorResponse
import os
from dotenv import load_dotenv

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ChatMem0 API",
    description="Backend API for ChatMem0 browser extension",
    version="1.0.0"
)

add_cors_middleware(app)

app.include_router(conversations_router, prefix="/api/v1")

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(error=exc.detail).dict()
    )

@app.get("/")
async def root():
    return {"message": "ChatMem0 API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "API is operational"}

if __name__ == "__main__":
    import uvicorn
    
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", 8000))
    debug = os.getenv("DEBUG", "True").lower() == "true"
    
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=debug
    )