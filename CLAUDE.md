# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此代码库中工作时提供指导。

## 项目概述

这是一个名为"GMGN Export"（GMGN_KILLER）的 Next.js 15 Web 应用程序，帮助用户导出他们在 GMGN 平台关注的钱包地址。该工具处理 GMGN API 响应数据，并将其转换为与其他钱包跟踪平台（如 Axiom）兼容的格式。

## 技术栈

- **框架**: Next.js 15 with App Router
- **语言**: TypeScript
- **样式**: TailwindCSS v4
- **运行时**: React 19
- **字体**: Geist Sans 和 Geist Mono
- **包管理器**: npm

## 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器（使用 Turbopack）
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 运行代码检查
npm run lint
```

## 架构

### 核心组件

- **app/page.tsx**: 主应用组件，包含三段式布局（首页、数据输入、结果预览）
- **app/layout.tsx**: 根布局，包含元数据和字体配置
- **app/components/HowToUse.tsx**: 可折叠的帮助说明组件
- **app/components/LoadingSpinner.tsx**: 加载指示器组件

### 主要功能

1. **三段式布局**: 首页 → 数据输入 → 结果预览，具有平滑滚动导航
2. **数据处理**: 解析 GMGN API 响应并转换钱包数据
3. **导出格式**: 支持 GMGN 和 Axiom 两种格式
4. **钱包管理**: 编辑、删除和排序钱包条目
5. **头像生成**: 为没有图片的钱包创建像素艺术头像
6. **剪贴板集成**: 复制数据到剪贴板或下载为 TXT 文件

### 数据流程

1. 用户粘贴 GMGN API JSON 响应（来自 `following_wallets` 端点）
2. 应用解析并验证 JSON 结构
3. 将数据转换为内部 `WalletPreviewItem` 格式
4. 显示可编辑的钱包信息表格
5. 生成导出格式（GMGN 文本格式或 Axiom JSON）

### TypeScript 接口

- `GMGNApiWallet`: 来自 GMGN API 的原始钱包数据
- `GMGNResponse`: 完整的 API 响应结构
- `WalletPreviewItem`: 用于 UI 的内部钱包表示
- `GMGNExportItem`: GMGN 的简单导出格式
- `AxiomExportItem`: Axiom 的结构化导出格式

### 样式设计

- 使用 TailwindCSS v4 和 PostCSS
- 移动优先的响应式设计
- 使用 SVG 自定义像素头像生成
- 渐变文本效果和平滑过渡

## 配置文件

- **tsconfig.json**: TypeScript 配置，启用严格模式
- **eslint.config.mjs**: ESLint 配置，扩展 Next.js 规则
- **postcss.config.mjs**: TailwindCSS 的 PostCSS 配置
- **next.config.ts**: Next.js 配置
- **vercel.json**: Vercel 部署配置

## 开发注意事项

- 应用完全在客户端运行 - 无服务器端数据处理
- 所有钱包处理都在浏览器中进行，保护隐私
- 使用浏览器 API 如剪贴板和文件下载
- 包含 JSON 解析的全面错误处理
- 支持按利润指标排序钱包
- 实现钱包数据的就地编辑功能
