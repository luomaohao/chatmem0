#!/bin/bash

echo "🚀 Starting ChatMem0 Backend..."

# 检查Python是否可用
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 not found. Please install Python 3.8+ first."
    exit 1
fi

# 检查pip是否可用
if ! command -v pip &> /dev/null && ! command -v pip3 &> /dev/null; then
    echo "❌ pip not found. Please install pip first."
    exit 1
fi

# 创建虚拟环境（如果不存在）
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# 激活虚拟环境
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# 安装依赖
echo "📥 Installing dependencies..."
pip install -r requirements.txt --quiet

# 检查环境变量文件
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Creating from example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ Created .env file from template"
    else
        echo "⚠️  No .env.example found. Please create .env file manually."
    fi
fi

# 初始化数据库
echo "🗄️  Initializing database..."
python -c "
from app.db.database import init_db
from app.db.migrations import run_migrations
try:
    run_migrations()
    init_db()
    print('✅ Database initialized successfully')
except Exception as e:
    print(f'❌ Database initialization failed: {e}')
    exit(1)
"

# 启动服务器
echo "✅ Starting server on http://localhost:8000"
echo "📡 API available at http://localhost:8000/api/v1"
echo "🔍 Swagger docs at http://localhost:8000/docs"
echo "📊 ReDoc docs at http://localhost:8000/redoc"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python run.py