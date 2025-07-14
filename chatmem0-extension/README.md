# ChatMem0 - AI对话管理浏览器扩展

ChatMem0 是一个浏览器扩展，用于自动同步和管理多个AI平台的对话数据，包括ChatGPT、Claude、文心一言、通义千问等。

## 功能特性

- 🔄 **自动同步**: 实时监控并同步AI对话数据
- 🌐 **多平台支持**: 支持主流AI对话平台
- 💾 **本地存储**: 对话数据本地备份
- 🔒 **隐私保护**: 数据加密存储
- 📊 **统计分析**: 对话数量、活跃度等统计
- 🎨 **友好界面**: 现代化的UI设计

## 构建步骤

### 前置要求

- Node.js 16+
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 生产构建

```bash
npm run build
```

构建完成后，`dist` 目录将包含扩展的所有文件。

## 安装扩展

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 `dist` 目录

## 使用说明

### 初始设置

1. 点击浏览器工具栏中的 ChatMem0 图标
2. 进入"设置"标签页
3. 配置以下信息：
   - API端点：后端服务器地址
   - 认证Token：访问令牌
   - 启用的平台：选择要同步的AI平台

### 自动同步

- 启用"自动同步"后，扩展会定期同步对话数据
- 可以设置同步间隔（默认5分钟）

### 手动操作

- **同步所有对话**: 立即同步所有平台的对话
- **清理过期数据**: 删除超过保留天数的对话
- **导出/导入**: 备份和恢复对话数据

## 支持的平台

- ChatGPT (chat.openai.com)
- Claude (claude.ai)
- 文心一言 (yiyan.baidu.com)
- 通义千问 (tongyi.aliyun.com)

## 注意事项

1. 首次使用需要在各个AI平台登录
2. 扩展需要保持运行才能自动同步
3. 建议定期导出数据备份
4. 请确保后端服务正常运行

## 开发说明

### 项目结构

```
src/
├── background/     # 后台服务脚本
├── content/        # 内容脚本（各平台提取器）
├── popup/          # 弹出界面
├── common/         # 共享工具和基类
└── types/          # TypeScript类型定义

public/
├── images/         # 图标资源
└── css/           # 样式文件
```

### 添加新平台支持

1. 在 `src/content/` 创建新的提取器文件
2. 继承 `BaseExtractor` 类并实现必要方法
3. 在 `manifest.json` 添加新的 content script 配置
4. 在 `webpack.config.js` 添加新的入口点

## 许可证

MIT License