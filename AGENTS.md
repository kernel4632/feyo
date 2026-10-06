# KIMA

KIMA 是一个面向高专注、高体验 Web 应用的 UI 设计系统与组件库。
全称：**K**inetic、**I**nteraction、**M**otion、**A**live。

一句话定位：**Material 3（Material You）风，把手机界面放大到电脑**——大控件、大卡片、
低密度、简洁展示；用动效引导注意力；弹层用抽屉聚光；**交互体验第一，好看第二**。

本文件是本仓库的最高协作约束。任何会话在改代码前先读本文件。

> 仓库已从旧的 FEYO 改名到 KIMA，源码、样式、脚本、测试、文档里的名字都统一成 `kima`。
> 组件本身还是旧的占位实现，下一步重做基础层（见下方「迁移状态」）。

## 技术栈（固定，不要替换）

- Vue 3（Composition API）
- JavaScript（不是 TypeScript）
- Vite
- SCSS
- pnpm
- Hugeicons 图标：`@hugeicons/vue` + `@hugeicons/core-free-icons`
- **Reka UI**：交互与无障碍行为底座（无样式，`reka-ui`）
- **@material/material-color-utilities**：从种子色生成 Material You 动态配色

## 交付目标

最终打包成 **Web Components**，能用在任何 Web 项目里，标签形如：

```html
<kima-button variant="filled">保存</kima-button>
```

组件既要在 Vue 项目里可用，也要能在原生 HTML 里直接使用。

## 命名规则

- npm 包名、源码目录、CSS 变量统一用 `kima`。
- 包名：`@kernel4632/kima`。
- CSS 变量前缀：`--kima-*`。
- 自定义元素标签前缀：`<kima-*>`。
- class 前缀：`kima-`。
- **禁止**把 `DMS`、`Dank`、`MUI`、`Material` 用作项目名、组件名或 class 前缀。
  （Material 3 只是**设计语言参考**，不是我们的品牌名。）

## 设计方向（已锁定，不要自行改回）

- **全局**：Material 3（Material You）。尺寸比官方默认**再放大一号**，像桌面版的手机 UI。
- **密度**：松。大按钮、大卡片、信息不密、简洁展示。
- **颜色**：从**单一青蓝种子**（默认 `#61afef`）用 material-color-utilities 生成整套
  Material You 色板；种子可整体替换。**深浅两套都做**。
- **字体**：全站等宽 **Maple Mono NF CN**，semi-bold。中文按需分片或系统回退，不要整包内联。
- **形状**：M3 圆角刻度（XS 4 / S 8 / M 12 / L 16 / XL 28）；按钮、芯片满圆；
  卡片 M（12）；抽屉大圆角。只有「明确提示下一步交互」的元素才用满圆胶囊。
- **弹层**：bottom sheet / 侧抽屉（Vaul 式）——背景 dim + 模糊 + 抽屉滑入，**只聚焦当前内容**，
  不展示背后内容。拖拽关闭、吸附点。
- **动效**：承担**引导注意力**的职责，不只是装饰。用 M3 的时长/缓动 + 弹簧。
- **交互**：状态层（轻）+ 焦点环 + 键盘可达。**不用涟漪**。
- **优先级**：交互与体验第一，好看第二。

## 禁止使用的依赖

不要引入带视觉意见的组件库（Material UI、Material Web、MUI、Ant Design、Vuetify 等）。
**Reka UI 允许**（它无样式）。图标只允许 Hugeicons。

## 主题与颜色

颜色只能由 KIMA 自己的 CSS variables 控制，全部以 `--kima-` 开头，方便整体换主题。
组件里**不允许**硬编码颜色值（hex、rgb 等），只能引用 token。
token 定义在 `src/styles/_tokens.scss`；动态色板由 `material-color-utilities` 生成。

## 目录结构（随开发扩展）

```
src/
  styles/
    _tokens.scss    设计 token（字体、间距、形状、层级、动效、控件尺寸）
    _palette.scss   由 scripts/palette.js 生成的颜色角色，不要手改
    _mixins.scss    共用交互 mixin（状态层、焦点环、表面、禁用）
    index.scss      开发预览页的基础样式
  components/       组件，一个组件一个 xxx.ce.vue 文件，直接平铺，放进来就自动登记
  utils/            不属于单个组件的共用小工具，两个以上才建这个目录（现在只有 native-slots.js）
  App.vue           开发预览页
  main.js           开发入口
```

## 常用命令

```bash
pnpm install     # 安装依赖
pnpm dev         # 本地开发
pnpm build       # 生产构建
pnpm build:lib   # 组件库构建（两个 dist 入口）
pnpm verify:lib  # 校验打包产物
pnpm test        # 浏览器交互测试
pnpm test:ssr    # SSR 测试
```

## 开发约定

- 修改前先看项目现有写法，保持风格一致，优先最小改动。
- 组件用 SCSS，`<style scoped lang="scss">`，颜色一律走 token。
- 换主题色只改 `scripts/palette.js` 里的 `seed`，再运行 `node scripts/palette.js`；不要手改 `_palette.scss`。
- 不凭空增加框架或抽象层。
- 完成一个可用改动后运行 `pnpm build`；组件库改动还要跑 `pnpm build:lib` 和 `pnpm verify:lib`。
- 改完一点且处于能用状态（构建和测试通过）就立刻提交并推送，不要攒着。
- 看完效果用 `pnpm shots` 出截图（`shots/` 已在 .gitignore 里，不入库）。
- commit 信息用中文描述，遵循 Conventional Commits 格式：
  `type(scope): 中文描述`，type 用英文（feat/fix/refactor/docs/test/build/chore），
  例如 `feat(按钮): 按 Material 3 重做按钮`。改动只涉及一个组件时 scope 写组件名。
- 推送目标为 `origin main`。

## 协作方式（重要）

- 用户要**逐个组件地指导**，不要一次把整套写完。
- 流程：一次只做一小步（一个组件或一小块基础）→ 做完停下来给用户看（截图 + 说明）
  → 用户给意见 → 改 → 用户点头 → 提交 → 再下一步。
- 用户较难用文字描述想要的感觉；**多用图/可见效果沟通**，少让用户凭空描述。

## 迁移状态

1. ✅ **改名**：FEYO → KIMA（包名、CSS 变量、标签、class、导出、样式注入 id、脚本、测试、
   README、docs、构建产物名）。
2. ✅ **重做基础层**：M3 token（色/字/形状/层级/状态层/动效）+ 放大尺寸 + mixins + 字体接入。
   色板由 `scripts/palette.js` 从种子 `#61afef` 生成到 `src/styles/_palette.scss`，改种子只动一处。
   按 M3 曲目不用涟漪，按下反馈只靠状态层。
3. **逐组件重做**：现有 27 个组件是占位实现，要按新方向逐个重写（交互优先）。
4. **弹层**：bottom sheet / 侧抽屉 + dialog。
5. 每步 `pnpm build` / `build:lib` / `verify:lib` / `test` 通过即提交推送。

### 复用旧资产时的注意

- 旧组件已实现自动发现、Vue 导出、Web Components 注册、浏览器/SSR 测试这套**工程骨架可以直接留用**，
  只改名即可。
- `docs/reference.md` 是旧的 DMS 研究笔记，**已过时**，仅作历史参考，不再作为设计依据。

## 设计参考

- Material 3（Material You）—— 全局外观、交互与布局、动效：`https://m3.material.io`
- Vaul —— 抽屉式弹层行为与聚焦：`https://vaul.emilkowal.ski`
- Reka UI —— 交互与无障碍行为底座：`https://reka-ui.com`
- Apple HIG —— 优雅感与决策突出（主操作填色 / 危险红 / 次要弱化）
- Maple Mono —— 字体：`https://github.com/subframe7536/maple-font`（OFL 1.1）
