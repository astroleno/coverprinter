# 技术栈说明

## 前端
- Next.js 15：React服务端渲染与静态站点生成框架
- MUI（Material-UI）@mui/material：企业级UI组件库，主色为竹色#769164
- TypeScript：类型安全
- Axios/Fetch：API请求
- 样式引擎：@emotion/react, @emotion/styled
- 图标库：@mui/icons-material
- 代码高亮与动效：MUI自带
- 其他依赖：axios、html2canvas

## 交互
- MUI表单、下拉、按钮等组件
- 支持自定义模板和风格输入
- 结果展示与复制、下载
- 结果卡片可折叠，折叠箭头右上
- 全局竹色主题，风格统一

## 后端/接口
- Next.js API Route 或直接调用第三方LLM API
- 支持环境变量配置API Key
- 依赖管理：npm
- 动态读取style和prompt目录内容

## 其他
- 详细注释与错误处理，重要流程日志打印
- 友好的错误提示与交互体验

> 2024年7月，UI组件库由Ant Design v5切换为MUI，彻底解决React 19兼容性警告问题。 
> 2025年6月，支持自定义模板/风格、全局竹色主题、折叠卡片、错误处理优化。 