from fastapi.middleware.cors import CORSMiddleware

def add_cors_middleware(app):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "chrome-extension://*",
            "moz-extension://*",
            "http://localhost:*",
            "https://localhost:*"
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )