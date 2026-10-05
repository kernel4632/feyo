# FEYO

FEYO 是一个面向高专注、高体验感 Web 应用的 UI 设计系统与组件库。
全称：**F**low、**E**ase、**Y**ield、**O**rientation。

本文件是本仓库的最高协作约束。任何会话在改代码前先读本文件。

## 技术栈（固定，不要替换）

- Vue 3（Composition API）
- JavaScript（不是 TypeScript）
- Vite
- SCSS
- Hugeicons 图标：`@hugeicons/vue` + `@hugeicons/core-free-icons`
- 包管理器：pnpm

## 交付目标

最终打包成 **Web Components**，能用在任何 Web 项目里，标签形如：

```html
<feyo-button variant="filled">保存</feyo-button>
```

组件既要在 Vue 项目里可用，也要能在原生 HTML 里直接使用。

## 命名规则

- npm 包名、源码目录、CSS 变量统一用 `feyo`。
- 包名：`@kernel4632/feyo`。
- CSS 变量前缀：`--feyo-*`。
- 自定义元素标签前缀：`<feyo-*>`。
- class 前缀：`feyo-`。
- **禁止**使用 `DMS`、`Dank`、`Material`、`MUI` 作为项目名、组件名或 class 前缀。

## 设计来源（参考结构，不抄品牌）

FEYO 参考 DankMaterialShell（DMS）的组件结构、信息层级、空间比例、字体、圆角、
状态动画和交互反馈。只复刻设计结构与组件行为，**不复刻**其品牌、名称、图标
或默认配色。

以源码实际实现为准，不要凭印象猜。参考资料：

1. DMS 主仓库
   `https://github.com/AvengeMedia/DankMaterialShell`
2. DMS 共用组件源码
   `https://github.com/AvengeMedia/dank-qml-common`
3. 组件目录
   `https://github.com/AvengeMedia/dank-qml-common/tree/master/DankCommon/Widgets`
4. 形状、圆角与组件基线
   `https://github.com/AvengeMedia/dank-qml-common/blob/master/SHAPES.md`
5. 主题、尺寸、字体、动画 token
   `https://github.com/AvengeMedia/DankMaterialShell/blob/master/quickshell/Common/Theme.qml`
6. 组件 token contract
   `https://github.com/AvengeMedia/dank-qml-common#the-contract`
7. 输入框结构与状态逻辑
   `https://github.com/AvengeMedia/dank-qml-common/blob/master/DankCommon/Widgets/DankTextField.qml`
8. 设置页与控制中心布局
   `https://github.com/AvengeMedia/DankMaterialShell/tree/master/quickshell/Modules/Settings`
   `https://github.com/AvengeMedia/DankMaterialShell/tree/master/quickshell/Modules/ControlCenter`

需要时先把对应源码拉下来读，再动手。

## 禁止使用的依赖

不要引入带视觉意见的组件库：Material UI、Material Web、MUI、Ant Design 等。
图标只允许 Hugeicons。

## 主题与颜色

颜色只能由 FEYO 自己的 CSS variables 控制，全部以 `--feyo-` 开头，
方便整体替换主题。组件里**不允许**硬编码颜色值（hex、rgb 等），
只能引用 token。token 定义在 `src/styles/_tokens.scss`。

## 目录结构（随开发扩展）

```
src/
  styles/
    _tokens.scss    设计 token（字体、间距、圆角、动画、颜色）
    index.scss      全局样式入口
  components/       组件（每个组件一个目录）
  App.vue           开发预览页
  main.js           开发入口
```

## 常用命令

```bash
pnpm install     # 安装依赖
pnpm dev         # 本地开发
pnpm build       # 生产构建
pnpm preview     # 预览构建产物
```

## 开发约定

- 修改前先看项目现有写法，保持风格一致，优先最小改动。
- 组件用 SCSS，`<style scoped lang="scss">`，颜色一律走 token。
- 不凭空增加框架或抽象层。
- 完成一个可用改动后运行 `pnpm build`，确认能通过。
- 组件库改动还要运行 `pnpm build:lib`，确认 `dist/feyo.js`、`dist/feyo-elements.js` 和 `dist/style.css` 都能生成。
- 未经明确要求，不提交（commit）代码。

## 当前状态

- 已完成：Vite + Vue 3 + SCSS + pnpm 项目骨架，Hugeicons 接入，token 雏形，
  开发预览页，六个基础组件，Vue 导出入口，Web Components 注册入口，
  `pnpm build` 与 `pnpm build:lib` 可跑通。
- 已完成：读取固定版本的参考源码，研究记录见 `docs/reference.md`。
- 已完成：实现菜单、对话框、标签页、按钮组和布局容器，并接入 Web Components 注册入口。
- 已完成：补充卡片、提示、分割线、图标按钮和徽章等基础组件，并接入 Web Components 注册入口。
- 已完成：补充通知、选择器、数据表和空状态等数据展示组件，并接入自动发现与导出。
- 已完成：补充浏览器交互测试、SSR 测试、独立原生入口校验和 Vue 入口样式校验。
- 已完成：继续实现日期选择、树和分页等高阶组件，并补充边界测试。
- 已完成：实现虚拟滚动、时间选择、级联选择和组合框等高阶组件，并补充边界测试。
- 当前状态：27 个组件已自动发现、导出、注册为 Web Components，并通过 88 项桌面/移动端浏览器测试。
