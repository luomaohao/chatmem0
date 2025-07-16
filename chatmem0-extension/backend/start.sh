#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting ChatMem0 Backend...${NC}"

# 检查Python是否可用
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python3 not found. Please install Python 3.8+ first.${NC}"
    exit 1
fi

# 检查pip是否可用
if ! command -v pip &> /dev/null && ! command -v pip3 &> /dev/null; then
    echo -e "${RED}❌ pip not found. Please install pip first.${NC}"
    exit 1
fi

# 创建虚拟环境（如果不存在）
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}📦 Creating virtual environment...${NC}"
    python3 -m venv venv
fi

# 激活虚拟环境
echo -e "${YELLOW}🔧 Activating virtual environment...${NC}"
source venv/bin/activate

# 安装依赖
echo -e "${YELLOW}📥 Installing dependencies...${NC}"
pip install -r requirements.txt --quiet

# 检查环境变量文件
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  No .env file found. Creating from example...${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ Created .env file from template${NC}"
    else
        echo -e "${YELLOW}⚠️  No .env.example found. Please create .env file manually.${NC}"
    fi
fi

# 初始化数据库
echo -e "${YELLOW}🗄️  Initializing database...${NC}"
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

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Database initialization failed${NC}"
    exit 1
fi

# 启动服务器
echo -e "${GREEN}✅ Starting server on http://localhost:8000${NC}"
echo -e "${BLUE}📡 API available at http://localhost:8000/api/v1${NC}"
echo -e "${BLUE}🔍 Swagger docs at http://localhost:8000/docs${NC}"
echo -e "${BLUE}📊 ReDoc docs at http://localhost:8000/redoc${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
echo ""

python run.py