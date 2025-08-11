from fastapi.middleware.cors import CORSMiddleware


def add_cors_middleware(app):
    # 说明：Starlette 的 allow_origins 不支持上面的通配模式（如 chrome-extension://*、localhost:*）。
    # 使用 allow_origin_regex 以匹配扩展协议与任意 localhost 端口，避免预检 400。
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[],  # 留空，使用正则匹配
        allow_origin_regex=(
            r"^("
            r"chrome-extension://[a-zA-Z0-9]+"  # Chrome 扩展
            r"|moz-extension://[a-zA-Z0-9\-]+"  # Firefox 扩展
            r"|http://localhost(:\d+)?"        # 本地开发 HTTP
            r"|https://localhost(:\d+)?"       # 本地开发 HTTPS
            r")$"
        ),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )