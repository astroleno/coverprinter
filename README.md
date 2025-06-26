# CoverPrinter AI 封面生成工具

> 现代美学、极致交互体验的 AI 封面生成器，支持微信公众号、小红书等平台一键生成高端封面 HTML。

## 产品定位
- 一键生成高质量封面 HTML，适配微信公众号、小红书等主流平台
- 8 种专业设计风格，支持自定义风格和模板
- 现代极简 UI，竹绿色主色，动态弥散圆背景，玻璃卡片特效
- 支持多种大模型 API 联调，Vercel 一键部署

## 技术栈
- **Next.js 14**
- **React 18**
- **TypeScript**
- **Material-UI 5**
- **Node.js 18+**
- **Vercel 部署支持**

## 目录结构
```
coverprinter/
├── app/                # 前端主应用（页面、动态背景、主题等）
├── pages/api/          # API 路由（风格、模板、代理转发）
├── style/              # 设计风格 Markdown 文件
├── prompt/             # 提示词模板 Markdown 文件
├── template/           # 旧版静态模板（可选保留）
├── public/             # 静态资源
├── README.md           # 项目说明
├── package.json        # 依赖配置
├── tsconfig.json       # TypeScript 配置
└── ...
```

## 安装与本地开发
1. 安装 Node.js 18+
2. 克隆仓库并安装依赖：
   ```bash
   git clone <repo-url>
   cd coverprinter
   npm install
   npm run dev
   ```
3. 浏览器访问 http://localhost:3000

## 一键部署到 Vercel
1. 注册并登录 [Vercel](https://vercel.com/)
2. 新建项目，导入本仓库，选择 Next.js
3. 环境变量（如需自定义 API Key）可在 Vercel 后台设置
4. 自动部署，访问你的专属域名

## 使用说明
- 选择平台（如微信公众号/小红书）和风格，填写内容，点击"生成"
- 支持自定义风格/模板，支持多种大模型 API
- 生成结果可复制或下载 HTML
- 主色为竹绿色#769164，不支持自定义主题色

## 常见问题
- 风格/模板加载失败：请检查 style/ 和 prompt/ 目录下文件
- API 连接失败：检查 API Key、代理地址和网络
- Vercel 部署问题：确认 Node.js 版本、依赖已安装

## 维护建议
- 新增风格：在 style/ 目录添加 .md 文件，首行为风格名
- 新增模板：在 prompt/ 目录添加 .md 文件，变量用 {{变量名}}
- 详细注释，易于二次开发

---

> 本项目仅供学习和交流，禁止用于非法用途。 