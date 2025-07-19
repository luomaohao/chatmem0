# ChatMem0 快速开始指南

## 🚀 5分钟快速上手

本指南将帮助您快速搭建ChatMem0开发环境并开始开发。

## 前置要求

- Node.js 16+ 和 npm
- Python 3.8+
- Git
- Chrome 浏览器（用于测试扩展）

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/yourusername/chatmem0.git
cd chatmem0
```

### 2. 启动后端服务

```bash
# 进入后端目录
cd chatmem0-extension/backend

# 使用一键启动脚本
./start.sh

# 或者使用开发模式（支持热重载）
python dev.py
```

后端服务将在 http://localhost:8000 启动，可以访问：
- API文档：http://localhost:8000/docs
- 健康检查：http://localhost:8000/health

### 3. 构建浏览器扩展

新开一个终端窗口：

```bash
# 进入扩展目录
cd chatmem0-extension

# 安装依赖
npm install

# 开发模式构建（监听文件变化）
npm run dev
```

### 4. 安装扩展到Chrome

1. 打开Chrome浏览器
2. 访问 `chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 `chatmem0-extension/dist` 目录
6. 扩展安装成功！

### 5. 测试扩展

1. 点击浏览器工具栏的ChatMem0图标
2. 在设置页面配置：
   - API端点：`http://localhost:8000/api/v1`
   - 认证Token：开发环境可留空
3. 访问支持的AI平台（如 https://chat.openai.com）
4. 进行对话，扩展会自动同步数据

## 🛠️ 开发工作流

### 前端开发

```bash
# 在 chatmem0-extension 目录

# 开发模式（自动重新构建）
npm run dev

# 生产构建
npm run build

# 代码检查
npm run lint

# 格式化代码
npm run format
```

### 后端开发

```bash
# 在 backend 目录

# 开发服务器（热重载）
python dev.py

# 运行测试
pytest

# 数据库迁移
python -m app.db.migrations
```

## 📁 项目结构速览

```
chatmem0/
├── chatmem0-extension/          # 浏览器扩展
│   ├── src/                    # 源代码
│   │   ├── background/         # 后台脚本
│   │   ├── content/           # 内容脚本
│   │   ├── popup/             # 弹窗UI
│   │   └── types/             # TypeScript类型
│   ├── backend/               # 后端API
│   │   ├── app/              # 应用代码
│   │   └── tests/            # 测试文件
│   └── develop_docs/          # 开发文档
└── README.md                  # 项目说明
```

## 🔧 常用开发任务

### 添加新的AI平台支持

1. 在 `src/content/` 创建新的提取器文件：

```typescript
// src/content/newplatform.ts
import { BaseExtractor } from '../common/BaseExtractor';

class NewPlatformExtractor extends BaseExtractor {
  constructor() {
    super('NewPlatform');
  }

  protected getPlatformSelectors() {
    return {
      conversationContainer: '.conversation-class',
      userMessage: '.user-message',
      assistantMessage: '.assistant-message',
      // ... 其他选择器
    };
  }
}

new NewPlatformExtractor();
```

2. 在 `manifest.json` 添加内容脚本配置：

```json
{
  "content_scripts": [
    {
      "matches": ["https://newplatform.com/*"],
      "js": ["content/newplatform.js"],
      "run_at": "document_idle"
    }
  ]
}
```

3. 在 `webpack.config.js` 添加入口：

```javascript
entry: {
  'content/newplatform': './src/content/newplatform.ts',
  // ... 其他入口
}
```

### 添加新的API端点

1. 创建新的路由文件：

```python
# backend/app/api/new_feature.py
from fastapi import APIRouter

router = APIRouter()

@router.get("/new-feature")
async def get_new_feature():
    return {"message": "New feature endpoint"}
```

2. 在主应用中注册路由：

```python
# backend/app/main.py
from app.api.new_feature import router as new_feature_router

app.include_router(new_feature_router, prefix="/api/v1")
```

## 🐛 调试技巧

### 浏览器扩展调试

1. **查看后台脚本日志**：
   - 在扩展管理页面点击"检查视图"下的"背景页"
   - 打开开发者工具查看控制台

2. **调试内容脚本**：
   - 在目标网站打开开发者工具
   - 在控制台中可以看到内容脚本的日志

3. **调试弹窗UI**：
   - 右键点击扩展图标，选择"检查弹出式窗口"

### 后端API调试

1. **使用Swagger UI**：
   - 访问 http://localhost:8000/docs
   - 可以直接测试API端点

2. **查看日志**：
   - 开发模式会在终端实时显示日志
   - 生产环境日志在 `logs/` 目录

## 📚 进阶学习

- [完整架构文档](./architecture.md)
- [开发路线图](./roadmap.md)
- [API参考文档](http://localhost:8000/docs)
- [Chrome扩展开发指南](https://developer.chrome.com/docs/extensions/mv3/)

## 🤝 获取帮助

遇到问题？

1. 查看 [常见问题](../README.md#故障排除)
2. 搜索 [GitHub Issues](https://github.com/yourusername/chatmem0/issues)
3. 加入开发者社区讨论

## 🎯 下一步

恭喜！您已经成功搭建了开发环境。接下来可以：

1. 阅读[架构文档](./architecture.md)深入了解系统设计
2. 查看[开发路线图](./roadmap.md)了解项目规划
3. 选择一个 [Good First Issue](https://github.com/yourusername/chatmem0/labels/good%20first%20issue) 开始贡献

Happy Coding! 🚀 