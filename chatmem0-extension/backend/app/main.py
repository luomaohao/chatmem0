from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.cors import add_cors_middleware
from app.core.config import settings
from app.api.conversations import router as conversations_router
from app.db.database import engine, Base, init_db
from app.schemas.conversation import ErrorResponse
import os
import logging
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# 配置日志
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format=settings.LOG_FORMAT
)
logger = logging.getLogger(__name__)

# 创建数据库表
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# 添加CORS中间件
add_cors_middleware(app)

# 添加请求日志中间件
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = datetime.now()
    logger.info(f"{request.method} {request.url}")
    
    response = await call_next(request)
    
    process_time = (datetime.now() - start_time).total_seconds()
    logger.info(f"Response status: {response.status_code} - Process time: {process_time:.3f}s")
    
    return response

# 包含路由
app.include_router(conversations_router, prefix="/api/v1")

@app.on_event("startup")
async def on_startup():
    """应用启动时的初始化"""
    try:
        # 初始化数据库
        init_db()
        logger.info("✅ Application started successfully")
        logger.info(f"📡 API available at http://{settings.API_HOST}:{settings.API_PORT}/api/v1")
        logger.info(f"🔍 Swagger docs at http://{settings.API_HOST}:{settings.API_PORT}/docs")
        logger.info(f"📊 ReDoc docs at http://{settings.API_HOST}:{settings.API_PORT}/redoc")
    except Exception as e:
        logger.error(f"❌ Failed to start application: {str(e)}")
        raise

@app.on_event("shutdown")
async def on_shutdown():
    """应用关闭时的清理"""
    logger.info("🔄 Application shutting down")

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """HTTP异常处理器"""
    logger.warning(f"HTTP {exc.status_code}: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(error=exc.detail).dict()
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """通用异常处理器"""
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(error="Internal server error").dict()
    )

@app.get("/")
async def root():
    """根路径"""
    return {
        "message": f"{settings.APP_NAME} is running",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """健康检查端点"""
    try:
        from app.db.database import SessionLocal
        db = SessionLocal()
        db.execute("SELECT 1")
        db.close()
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
        logger.error(f"Database health check failed: {str(e)}")
    
    return {
        "status": "healthy",
        "message": "API is operational",
        "database": db_status,
        "version": settings.APP_VERSION,
        "timestamp": datetime.now().isoformat()
    }