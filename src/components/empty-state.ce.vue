<!--
空状态：用居中的图标、标题、说明和操作呈现没有内容的状态。
标题可用 heading；原有 title 属性继续支持，不覆盖原生 HTMLElement.title。
icon 插槽放装饰图标；没有 icon 插槽时，默认插槽就是图标内容；action 插槽放按钮。
调用示例：
  <feyo-empty-state title="还没有项目" description="创建第一个项目后，它会显示在这里。">
    <template #icon><FolderIcon /></template>
    <template #action><feyo-button>创建项目</feyo-button></template>
  </feyo-empty-state>
原生 HTML 示例（组件由宿主注册）：
  <feyo-empty-state title="No results" compact>
    <button slot="action" type="button">Clear filters</button>
  </feyo-empty-state>
-->
<script setup>
import { computed, ref, useAttrs } from "vue";
import { useNativeSlots } from "../../utils/native-slots.js";

defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
const root = ref(null);
const { hasNativeSlot, isCustomElement } = useNativeSlots(root);
const forwardedAttrs = computed(() => isCustomElement ? { ...attrs, id: undefined } : attrs);

defineProps({
  heading: { type: String, default: undefined },
  description: { type: String, default: "" },
  compact: Boolean,
});

</script>

<template>
  <section ref="root" v-bind="{ ...forwardedAttrs, title: undefined }" class="feyo-empty-state" :class="{ 'feyo-empty-state--compact': compact, 'feyo-empty-state--native': isCustomElement }" role="status" aria-atomic="true">
    <div v-if="$slots.icon || $slots.default || hasNativeSlot('icon') || hasNativeSlot('default') || isCustomElement" class="feyo-empty-state__icon" aria-hidden="true">
      <slot name="icon"><slot /></slot>
    </div>
    <h2 v-if="heading ?? attrs.title ?? '暂无内容'" class="feyo-empty-state__title">{{ heading ?? attrs.title ?? '暂无内容' }}</h2>
    <p v-if="description" class="feyo-empty-state__description">{{ description }}</p>
    <div v-if="$slots.action || hasNativeSlot('action') || isCustomElement" class="feyo-empty-state__action"><slot name="action" /></div>
  </section>
</template>

<style scoped lang="scss">
.feyo-empty-state {
  display: flex;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  min-height: 220px;
  flex-direction: column;
  gap: var(--feyo-space-2);
  align-items: center;
  justify-content: center;
  padding: var(--feyo-space-6);
  color: var(--feyo-color-on-surface);
  font-family: var(--feyo-font-family);
  font-size: var(--feyo-font-size-md);
  line-height: 1.5;
  letter-spacing: 0;
  text-align: center;
}

.feyo-empty-state__icon {
  display: flex;
  flex: 0 0 48px;
  width: 48px;
  height: 48px;
  align-items: center;
  justify-content: center;
  color: var(--feyo-color-on-surface-variant);
}

.feyo-empty-state__title,
.feyo-empty-state__description,
.feyo-empty-state__content {
  max-width: min(100%, 440px);
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
}

.feyo-empty-state__title {
  font-size: var(--feyo-font-size-lg);
  font-weight: var(--feyo-font-weight-medium);
}

.feyo-empty-state__description {
  color: var(--feyo-color-on-surface-variant);
}

.feyo-empty-state__action {
  display: flex;
  max-width: 100%;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--feyo-space-2);
  margin-top: var(--feyo-space-2);
  overflow-wrap: anywhere;
}

.feyo-empty-state--native .feyo-empty-state__icon:empty,
.feyo-empty-state--native .feyo-empty-state__action:empty {
  display: none;
}

// 没有元素内容的原生出口不占空间，HTML 缩进空白也不会产生图标占位。
.feyo-empty-state--native .feyo-empty-state__icon:not(:has(> *)),
.feyo-empty-state--native .feyo-empty-state__action:not(:has(> *)) {
  display: contents;
}

.feyo-empty-state--compact {
  min-height: 140px;
  padding: var(--feyo-space-4);

  .feyo-empty-state__icon {
    flex-basis: 32px;
    width: 32px;
    height: 32px;
  }
}

@media (max-width: 480px) {
  .feyo-empty-state {
    padding: var(--feyo-space-4);
  }
}
</style>
