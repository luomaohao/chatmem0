import uvicorn
import os
from dotenv import load_dotenv

load_dotenv()

if __name__ == "__main__":
    print("🚀 Starting ChatMem0 Backend in Development Mode...")
    print("📡 API: http://localhost:8000/api/v1")
    print("🔍 Docs: http://localhost:8000/docs")
    print("🔄 Hot reload enabled")
    print("")
    
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="info"
    )