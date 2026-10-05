<!--
布局容器：用统一的页面或面板宽度、间距和内边距组织设置类内容。
调用示例：
  <feyo-layout variant="page" as="main">
    <template #header><h1>设置</h1></template>
    <section>页面内容</section>
  </feyo-layout>
  <feyo-layout variant="panel" :max-width="640">表单内容</feyo-layout>
-->
<script setup>
import { computed, ref, useAttrs } from "vue";
import { useNativeSlots } from "../../utils/native-slots.js";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  as: {
    type: String,
    default: "main",
  },
  variant: {
    type: String,
    default: "page",
  },
  maxWidth: {
    type: [String, Number],
    default: 920,
  },
  gap: {
    type: [String, Number],
    default: 24,
  },
  padding: {
    type: [String, Number],
    default: undefined,
  },
});

const attrs = useAttrs();
const root = ref(null);
const { hasNativeSlot, isCustomElement } = useNativeSlots(root);
const forwardedAttrs = computed(() => isCustomElement ? { ...attrs, id: undefined } : attrs);

const semanticElement = computed(() => {
  const elements = ["main", "section", "div"];
  return elements.includes(props.as) ? props.as : "main";
});
const layoutVariant = computed(() =>
  ["page", "panel"].includes(props.variant) ? props.variant : "page",
);
const dimension = (value) => {
  if (typeof value === "number") return `${value}px`;
  if (typeof value === "string" && /^\d+(?:\.\d+)?$/.test(value.trim())) return `${value}px`;
  return value;
};
const layoutStyle = computed(() => ({
  "--feyo-layout-max-width": dimension(props.maxWidth),
  "--feyo-layout-gap": dimension(props.gap),
  "--feyo-layout-padding": props.padding === undefined ? undefined : dimension(props.padding),
}));
</script>

<template>
  <component
    :is="semanticElement"
    ref="root"
    v-bind="forwardedAttrs"
    class="feyo-layout"
    :class="`feyo-layout--${layoutVariant}`"
    :style="layoutStyle"
  >
    <header v-if="$slots.header || hasNativeSlot('header')" class="feyo-layout__header"><slot name="header" /></header>
    <div v-if="$slots.default || hasNativeSlot('default')" class="feyo-layout__content"><slot /></div>
    <footer v-if="$slots.footer || hasNativeSlot('footer')" class="feyo-layout__footer"><slot name="footer" /></footer>
  </component>
</template>

<style scoped lang="scss">
.feyo-layout {
  box-sizing: border-box;
  width: 100%;
  max-width: var(--feyo-layout-max-width);
  margin: 0 auto;
  color: var(--feyo-color-on-surface);
  font-family: var(--feyo-font-family);
}

.feyo-layout__header,
.feyo-layout__content,
.feyo-layout__footer {
  display: flex;
  flex-direction: column;
  gap: var(--feyo-layout-gap);
}

.feyo-layout__content {
  min-width: 0;
}

.feyo-layout__header + .feyo-layout__content,
.feyo-layout__content + .feyo-layout__footer {
  margin-top: var(--feyo-layout-gap);
}

.feyo-layout--page {
  padding: var(--feyo-layout-padding, 40px);
}

.feyo-layout--panel {
  padding: var(--feyo-layout-padding, 24px);
  border: 1px solid var(--feyo-color-outline);
  border-radius: 16px;
  background: var(--feyo-color-surface-container);
}

@media (max-width: 720px) {
  .feyo-layout--page {
    padding: 24px;
  }
}

@media (max-width: 480px) {
  .feyo-layout--page,
  .feyo-layout--panel {
    padding: 16px;
  }
}
</style>
