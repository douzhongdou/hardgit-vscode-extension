# Hardgit Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个可直接部署到 GitHub Pages 的静态单页介绍站，让机械 / 结构 / CAD 工程师快速理解 Hardgit 插件并前往 GitHub Releases 下载试用。

**Architecture:** 站点采用纯静态实现，使用独立的 `site/` 目录承载 `index.html`、`styles.css`、`main.js` 与语言资源。页面结构固定，所有中英文文案集中到单独的多语言资源对象中，通过 `data-i18n` 标记和轻量脚本完成切换与状态记忆。

**Tech Stack:** HTML, CSS, 原生 JavaScript, GitHub Pages 相对路径资源

---

### Task 1: 搭建静态站点目录与页面骨架

**Files:**
- Create: `site/index.html`
- Create: `site/styles.css`
- Create: `site/main.js`
- Create: `site/assets/.gitkeep`

- [ ] **Step 1: 创建静态站点目录和核心文件**

创建 `site/` 目录，并准备一个单页结构，至少包含以下语义区块：

- 顶部栏：品牌名称、语言切换、仓库链接
- Hero：标题、副标题、主次 CTA、截图
- 功能区：6 个卖点卡片
- 场景区：3 个工程场景
- 支持格式区：格式、安装方式、使用方式、限制说明
- 页尾 CTA：再次引导到 Releases

- [ ] **Step 2: 在 `site/index.html` 中写出完整静态骨架**

要求：

- 所有用户可见文案都使用 `data-i18n` 标识
- 按钮和链接可使用 `data-i18n-attr="aria-label"` 或 `data-i18n-html`
- Hero 截图指向 `./assets/snapshot.png`
- 主 CTA 指向 GitHub Releases
- 次 CTA 指向 GitHub 仓库

- [ ] **Step 3: 在 `site/styles.css` 中建立 GitHub 极简风基础样式**

要求：

- 使用 CSS 变量集中管理颜色和间距
- 页面默认浅色主题
- Hero 双栏布局，移动端自动折叠
- 卡片、按钮、截图容器风格克制，不使用重阴影与复杂渐变
- 语言切换器与顶部栏融为一体

- [ ] **Step 4: 准备资源占位**

在 `site/assets/` 中保留资源目录，后续复制 `public/assets/snapshot.png` 进入站点资源。

### Task 2: 实现中英双语与语言切换

**Files:**
- Modify: `site/index.html`
- Modify: `site/main.js`

- [ ] **Step 1: 在 `site/main.js` 中建立语言资源对象**

实现一个集中式内容对象，例如：

```js
const translations = {
  "zh-CN": {
    "nav.repo": "GitHub 仓库"
  },
  en: {
    "nav.repo": "GitHub Repository"
  }
};
```

覆盖页面所有核心文案，包括：

- 标题、副标题
- 按钮文案
- 功能点
- 场景文案
- 支持格式区说明
- 页尾 CTA

- [ ] **Step 2: 实现 `applyLanguage()` 渲染逻辑**

要求：

- 扫描所有 `data-i18n` 节点并注入文本
- 支持 `data-i18n-html`
- 支持属性型翻译，例如 `aria-label`
- 切换语言时只更新内容，不刷新页面

- [ ] **Step 3: 实现语言状态管理**

要求：

- 默认语言为 `zh-CN`
- 支持通过 `localStorage` 记住上次选择
- 切换器点击后同步更新活动状态
- `<html lang="">` 需要同步更新

- [ ] **Step 4: 验证双语覆盖完整**

检查页面中不存在未接入翻译系统的主要可见文案。

### Task 3: 衔接真实截图与 GitHub Pages 资源路径

**Files:**
- Create: `site/assets/snapshot.png`
- Modify: `site/index.html`

- [ ] **Step 1: 复制截图到站点资源目录**

将 `public/assets/snapshot.png` 复制为：

- `site/assets/snapshot.png`

- [ ] **Step 2: 确认图片引用为相对路径**

要求：

- 页面本地直接打开时可显示
- GitHub Pages 子路径部署时仍可显示

- [ ] **Step 3: 为截图容器补足可访问性描述**

图片需要有明确 `alt`，中英切换时同步更新。

### Task 4: 补充部署说明与基础验证

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 在 `README.md` 中增加站点说明**

新增一个简短章节，说明：

- 介绍页静态文件位于 `site/`
- 可部署到 GitHub Pages
- 页面目前支持中英双语

- [ ] **Step 2: 做静态文件结构自检**

检查以下内容：

- `site/index.html`
- `site/styles.css`
- `site/main.js`
- `site/assets/snapshot.png`

- [ ] **Step 3: 做页面内容一致性自检**

确认：

- 主 CTA 和页尾 CTA 都指向 Releases
- 仓库链接正确
- 中英文切换后信息层级一致
- 页面文案面向机械 / 结构 / CAD 工程师

## Self-Review

### Spec coverage

- 单页落地页：由 Task 1 实现
- GitHub 极简风：由 Task 1 的样式实现
- 中英双语与可扩展多语言：由 Task 2 实现
- 使用真实截图：由 Task 3 实现
- GitHub Releases 下载路径：由 Task 1 与 Task 4 覆盖
- GitHub Pages 静态部署友好：由 Task 3 与 Task 4 覆盖

### Placeholder scan

计划中没有使用 TBD、TODO 或“稍后实现”类占位语，所有任务都绑定了明确文件与动作。

### Type consistency

计划统一采用 `site/` 作为站点目录，统一使用 `data-i18n` 标识与 `translations` 资源对象，没有在后续任务中切换目录命名或语言机制。
