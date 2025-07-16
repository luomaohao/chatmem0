# ChatMem0 Backend API

Backend service for the ChatMem0 browser extension.

## Quick Setup (No Authentication)

1. **Install dependencies:**
```bash
cd backend
pip install -r requirements.txt
```

2. **Run the server:**
```bash
python run.py
```

The API will be available at `http://localhost:8000` with authentication disabled for testing.

## API Endpoints

### No Authentication Required
All endpoints are accessible without authentication for testing purposes.

### Conversations

**POST /api/v1/conversations**
- Create or update a conversation
- Body: ConversationSchema (JSON)
- Returns: ConversationResponse

**GET /api/v1/conversations/{id}**
- Get specific conversation by ID

**GET /api/v1/conversations**
- List conversations with optional filtering
- Query params: `skip`, `limit`, `platform`

### Health

**GET /health**
- Health check endpoint

## Configuration

Environment variables in `.env`:
- `SECRET_KEY`: Authentication token
- `DATABASE_URL`: SQLite database path
- `API_HOST`: Server host (default: 0.0.0.0)
- `API_PORT`: Server port (default: 8000)
- `DEBUG`: Debug mode (default: True)

## Browser Extension Integration

The API is configured with CORS to accept requests from:
- Chrome extensions (`chrome-extension://*`)
- Firefox extensions (`moz-extension://*`)
- Local development (`http://localhost:*`)

### Testing Configuration

1. **Update extension API endpoint to:**
   ```
   http://localhost:8000/api/v1
   ```

2. **Leave authentication token field empty** (authentication is disabled)

3. **Test the connection** using the extension's sync functionality