import os
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

load_dotenv()

security = HTTPBearer()

VALID_TOKENS = {
    os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production"): "default_user"
}

async def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    
    if token not in VALID_TOKENS:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token"
        )
    
    return VALID_TOKENS[token]