# ChatMem0

ChatMem0 是一个用于自动同步和管理多平台 AI 对话的开源项目。

## 项目简介

本仓库目前包含一个 Chrome/Edge 浏览器扩展，可自动从 ChatGPT、Claude、文心一言、通义千问等平台收集对话，保存到本地，并支持统计分析和隐私保护。

## 功能特性

- 🔄 **自动同步**：实时监控并同步 AI 对话
- 🌐 **多平台支持**：支持主流 AI 对话平台
- 💾 **本地存储**：对话数据本地备份
- 🔒 **隐私保护**：数据加密存储
- 📊 **统计分析**：对话数量、活跃度等统计
- 🎨 **友好界面**：现代化 UI 设计

## 目录结构

- `chatmem0-extension/`：浏览器扩展源码

## 快速开始

1. 进入扩展目录：

   ```bash
   cd chatmem0-extension
   ```

2. 安装依赖：

   ```bash
   npm install
   ```

3. 开发模式：

   ```bash
   npm run dev
   ```

4. 生产构建：

   ```bash
   npm run build
   ```

5. 在 Chrome 中打开 `chrome://extensions/`，开启“开发者模式”，点击“加载已解压的扩展程序”，选择 `dist` 目录。

## 许可证

本项目基于 MIT License。
