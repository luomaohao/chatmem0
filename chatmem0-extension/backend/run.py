import uvicorn
import os
import sys
from dotenv import load_dotenv
from app.core.config import settings

load_dotenv()

def main():
    """启动应用的主函数"""
    try:
        print(f"🚀 Starting {settings.APP_NAME}...")
        print(f"📡 API: http://{settings.API_HOST}:{settings.API_PORT}/api/v1")
        print(f"🔍 Docs: http://{settings.API_HOST}:{settings.API_PORT}/docs")
        print(f"🔄 Debug mode: {'enabled' if settings.DEBUG else 'disabled'}")
        print("")
        
        uvicorn.run(
            "app.main:app",
            host=settings.API_HOST,
            port=settings.API_PORT,
            reload=settings.DEBUG,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
        sys.exit(0)
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()