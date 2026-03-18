# Tina's Crazy Eights 🃏

A classic Crazy Eights card game built with React, Tailwind CSS, and Framer Motion.

## 🚀 部署到 Vercel (Deployment)

本项目已针对 Vercel 进行了优化。

### 1. 同步到 GitHub
在 Google AI Studio 中，点击右上角的 **Settings** -> **Export to GitHub**。

### 2. 导入 Vercel
1. 登录 [Vercel](https://vercel.com)。
2. 点击 **Add New** -> **Project**。
3. 导入您刚刚导出的 GitHub 仓库。
4. **环境变量 (Environment Variables)**:
   - 如果您的游戏未来需要使用 Gemini AI 功能，请在 Vercel 面板中添加 `GEMINI_API_KEY`。
5. 点击 **Deploy**。

## 🛠 开发环境 (Development)

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建项目
npm run build
```

## 游戏规则 (Rules)
- **发牌**：玩家与 AI 各 8 张牌。
- **出牌**：必须匹配当前弃牌堆顶部的花色或点数。
- **疯狂 8 点**：数字“8”是万能牌，出牌后可指定新花色。
- **摸牌**：无牌可出时需从牌堆摸一张。
- **获胜**：最先清空手牌的一方获胜。
