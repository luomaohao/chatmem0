import uvicorn
import os
import sys
from dotenv import load_dotenv

load_dotenv()

def main():
    """开发模式启动函数"""
    try:
        print("🚀 Starting ChatMem0 Backend in Development Mode...")
        print("📡 API: http://127.0.0.1:8000/api/v1")
        print("🔍 Docs: http://127.0.0.1:8000/docs")
        print("🔄 Hot reload enabled")
        print("")
        
        uvicorn.run(
            "app.main:app",
            host="127.0.0.1",
            port=8000,
            reload=True,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n🛑 Development server stopped by user")
        sys.exit(0)
    except Exception as e:
        print(f"❌ Failed to start development server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()