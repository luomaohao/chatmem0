# ChatMem0 开发文档

欢迎来到 ChatMem0 开发文档！这里包含了项目开发所需的所有技术文档和指南。

## 📚 文档导航

### 🚀 快速开始
- [**快速开始指南**](./quick-start.md) - 5分钟搭建开发环境
  - 环境准备
  - 项目启动
  - 基础开发流程
  - 调试技巧

### 🏗️ 架构设计
- [**技术架构文档**](./architecture.md) - 系统架构详解
  - 整体架构概览
  - 技术选型说明
  - 各模块详细设计
  - 性能与安全架构

### 🗺️ 项目规划
- [**开发路线图**](./roadmap.md) - 项目发展规划
  - 各阶段目标和任务
  - 技术演进路线
  - 里程碑时间表
  - 成功指标定义

## 🔧 开发指南

### 浏览器扩展开发
1. **基础概念**
   - Chrome Extension Manifest V3
   - Content Scripts vs Background Service
   - 消息通信机制

2. **核心模块**
   - 数据提取器开发
   - 同步管理器实现
   - 存储方案设计

3. **平台适配**
   - 添加新平台支持
   - DOM选择器配置
   - 数据格式标准化

### 后端API开发
1. **FastAPI基础**
   - 路由设计规范
   - 数据模型定义
   - 异步处理模式

2. **数据库设计**
   - 表结构设计
   - 索引优化策略
   - 迁移管理

3. **API安全**
   - JWT认证实现
   - 权限控制
   - 请求限流

## 🛠️ 开发工具

### 推荐的开发工具
- **IDE**: VS Code / WebStorm
- **API测试**: Postman / Insomnia
- **数据库工具**: DBeaver / TablePlus
- **Chrome扩展调试**: Chrome DevTools

### VS Code推荐插件
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-python.python",
    "ms-python.vscode-pylance",
    "streetsidesoftware.code-spell-checker",
    "yzhang.markdown-all-in-one"
  ]
}
```

## 📋 开发规范

### 代码规范
- **TypeScript**: 遵循 ESLint + Prettier 配置
- **Python**: 遵循 PEP 8 规范
- **Git提交**: 使用语义化提交信息

### 提交信息格式
```
<type>(<scope>): <subject>

<body>

<footer>
```

类型说明：
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建/工具相关

### 分支管理
- `main`: 生产分支
- `develop`: 开发分支
- `feature/*`: 功能分支
- `hotfix/*`: 紧急修复分支

## 🧪 测试指南

### 单元测试
```bash
# 前端测试
npm test

# 后端测试
pytest
```

### 集成测试
- 浏览器扩展测试
- API端到端测试
- 性能测试

## 📊 性能优化

### 前端性能
- Bundle大小优化
- 运行时性能监控
- 内存泄漏检测

### 后端性能
- 数据库查询优化
- 缓存策略
- 并发处理

## 🔐 安全最佳实践

- 输入验证
- XSS防护
- CSRF防护
- 敏感数据加密
- 安全的依赖管理

## 🤝 贡献指南

### 如何贡献
1. Fork项目
2. 创建功能分支
3. 提交代码
4. 创建Pull Request

### 代码审查清单
- [ ] 代码符合规范
- [ ] 包含必要的测试
- [ ] 文档已更新
- [ ] 无安全漏洞
- [ ] 性能影响评估

## 📞 获取帮助

- **技术问题**: 查看相关文档或创建Issue
- **架构讨论**: 在Discussions中发起讨论
- **紧急问题**: 联系项目维护者

## 🔄 文档更新

这些文档会随着项目发展持续更新。如果您发现任何错误或有改进建议，欢迎提交PR！

---

*最后更新: 2024-01-15* 