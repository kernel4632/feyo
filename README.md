# FEYO

**F**low、**E**ase、**Y**ield、**O**rientation。

FEYO 是一个面向高专注、高体验感 Web 应用的 UI 设计系统与组件库。
参考成熟桌面壳层组件的结构与行为，最终打包为通用 Web Components。

## 技术栈

Vue 3 · JavaScript · Vite · SCSS · Hugeicons · pnpm

## 开始

```bash
pnpm install
pnpm dev
```

## 构建

```bash
pnpm build
pnpm preview
```

构建组件库和原生自定义元素：

```bash
pnpm build:lib
pnpm test
pnpm test:ssr
```

Vue 组件从 `@kernel4632/feyo` 导入；原生元素从 `@kernel4632/feyo/elements` 导入，样式从 `@kernel4632/feyo/style.css` 导入：

```js
import "@kernel4632/feyo/elements";
import "@kernel4632/feyo/style.css";
```

```html
<feyo-button variant="filled">保存</feyo-button>
```

当前导出的组件包括：按钮、文本框、复选框、开关、滑块、进度条、选择器、菜单、
通知、对话框、标签页、按钮组、布局容器、卡片、分割线、提示、图标按钮、徽章、
数据表和空状态。

自定义元素使用普通页面 DOM（light DOM）。注册入口会将组件样式安装到页面中的一个
`<style id="feyo-component-styles">`，重复导入不会重复安装。仍需导入
`@kernel4632/feyo/style.css`，它提供全局设计 token 和基础样式。

## 公开事件

- `FeyoTextField` / `<feyo-text-field>`：输入时发送 `update:modelValue`，完成修改或清空时发送 `change`，值为字符串。清空也发送 `update:modelValue`。
- `FeyoCheckbox` / `<feyo-checkbox>`、`FeyoSwitch` / `<feyo-switch>`：切换时各发送一次 `update:modelValue` 和 `change`，值为布尔值。
- `FeyoSlider` / `<feyo-slider>`：拖动或键盘修改时发送 `update:modelValue`，提交修改时发送 `change`，值为数字。
- `FeyoButton` / `<feyo-button>`：保留原生 `click`，点击一次只收到一个事件，不额外发送同名自定义事件。
- `FeyoProgress` / `<feyo-progress>`：没有组件自定义事件。

在 Vue 组件中，`v-model` 使用 `update:modelValue`，`@change` 直接收到新值。
在自定义元素上，Vue 发出的事件是 `CustomEvent`，参数放在 `event.detail` **数组**中，
单个值也需要通过 `event.detail[0]` 读取。直接在元素上监听，每次对应操作只收到一次事件。
内部原生 `input` / `change` 不再向外冒泡；监听 `update:modelValue` 获取连续输入。
原生按钮 `click` 仍使用普通鼠标事件，不遵循这个数组规则。

```js
const field = document.querySelector("feyo-text-field");
field.addEventListener("update:modelValue", (event) => {
  const [value] = event.detail;
  console.log(value);
});
field.addEventListener("change", (event) => {
  const [value] = event.detail;
  console.log("完成修改", value);
});
```

文本框的 `id` 标识自定义元素本身，可用于 `document.getElementById()`。
内部输入框使用单独生成的 id，标签和提示文字关联到内部输入框。

## 目录

```
src/
  styles/          设计 token 与全局样式
  components/      组件
  App.vue          开发预览页
  main.js          开发入口
```

协作约定见 [AGENTS.md](./AGENTS.md)。
上游源码的固定版本与测量记录见 [参考研究笔记](./docs/reference.md)。
组件自动从 `src/components/*/*.ce.vue` 发现，不需要修改中央注册表。
