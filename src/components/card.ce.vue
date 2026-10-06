<!--
卡片：提供表面、描边和抬升三种容器样式，也支持可点击和分区插槽。
调用示例：
  <feyo-card variant="outlined" clickable aria-label="打开账户设置" @click="openSettings">
    <template #header><h2>账户设置</h2></template>
    <p>管理登录方式和通知偏好。</p>
    <template #footer><button type="button">查看详情</button></template>
  </feyo-card>
-->
<script setup>
import { computed, ref, useAttrs } from "vue";
import { useNativeSlots } from "../utils/native-slots.js";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  variant: {
    type: String,
    default: "surface",
  },
  clickable: Boolean,
  disabled: Boolean,
});

const attrs = useAttrs();
const root = ref(null);
const { hasNativeSlot, isCustomElement } = useNativeSlots(root);
const forwardedAttrs = computed(() => isCustomElement ? { ...attrs, id: undefined } : attrs);

const cardVariant = computed(() => {
  const variants = ["surface", "outlined", "elevated"];
  return variants.includes(props.variant) ? props.variant : "surface";
});

function activate(event) {
  if (!props.clickable || props.disabled) return;
  // Slotted controls own their actions, including custom elements with shadow roots.
  const path = event.composedPath();
  const cardIndex = path.indexOf(event.currentTarget);
  if (path.slice(0, cardIndex).some((element) => element.matches?.("button, a, input, select, textarea, label, summary, [role='button'], [role='switch'], [role='checkbox'], [contenteditable], [tabindex]"))) {
    event.stopPropagation();
    return;
  }
}

function handleKeydown(event) {
  if (!props.clickable || props.disabled || event.target !== event.currentTarget || event.isComposing || event.repeat) return;

  if (event.key === "Enter") {
    event.preventDefault();
    event.currentTarget.click();
  } else if (event.key === " ") {
    event.preventDefault();
  }
}

function handleKeyup(event) {
  if (!props.clickable || props.disabled || event.target !== event.currentTarget || event.isComposing || event.key !== " ") return;
  event.preventDefault();
  event.currentTarget.click();
}
</script>

<template>
  <article
    class="feyo-card"
    :class="[
      `feyo-card--${cardVariant}`,
      {
        'feyo-card--clickable': clickable,
        'feyo-card--disabled': disabled,
      },
    ]"
    :role="clickable ? 'button' : undefined"
    :tabindex="clickable && !disabled ? 0 : undefined"
    :aria-disabled="disabled ? 'true' : undefined"
    ref="root"
    v-bind="forwardedAttrs"
    @click="activate"
    @keydown="handleKeydown"
    @keyup="handleKeyup"
  >
    <header v-if="$slots.header || hasNativeSlot('header')" class="feyo-card__header"><slot name="header" /></header>
    <div v-if="$slots.default || hasNativeSlot('default')" class="feyo-card__body"><slot /></div>
    <footer v-if="$slots.footer || hasNativeSlot('footer')" class="feyo-card__footer"><slot name="footer" /></footer>
  </article>
</template>

<style scoped lang="scss">
.feyo-card {
  box-sizing: border-box;
  display: flex;
  min-width: 0;
  flex-direction: column;
  /* DMS DankCard：内边距 spacingM 12，圆角 cornerRadiusM 12，默认无边框。 */
  gap: var(--feyo-space-s);
  padding: var(--feyo-space-m);
  border: 1px solid var(--feyo-color-transparent);
  border-radius: var(--feyo-radius-m);
  color: var(--feyo-color-on-surface);
  background: var(--feyo-color-surface-container);
  font-family: var(--feyo-font-family);
  transition:
    background-color var(--feyo-duration-effects) var(--feyo-ease-effects),
    border-color var(--feyo-duration-effects) var(--feyo-ease-effects),
    box-shadow var(--feyo-duration-effects) var(--feyo-ease-effects),
    opacity var(--feyo-duration-effects) var(--feyo-ease-effects),
    transform var(--feyo-duration-effects) var(--feyo-ease-effects);
}

.feyo-card--outlined {
  border-color: var(--feyo-color-outline-variant);
  background: var(--feyo-color-transparent);
}

.feyo-card--elevated {
  background: var(--feyo-color-surface-container-high);
  box-shadow: var(--feyo-shadow-2);
}

.feyo-card--clickable {
  cursor: pointer;
}

/* DMS 状态层：悬停叠加 accent（primary）8%。 */
.feyo-card--clickable:not(.feyo-card--disabled):hover {
  background: color-mix(in srgb, var(--feyo-color-primary) 8%, var(--feyo-color-transparent));
}

.feyo-card--clickable:not(.feyo-card--disabled):active {
  background: color-mix(in srgb, var(--feyo-color-primary) 12%, var(--feyo-color-transparent));
}

.feyo-card--clickable:not(.feyo-card--disabled):focus-visible {
  outline: var(--feyo-focus-ring-width) solid var(--feyo-color-primary);
  outline-offset: var(--feyo-focus-ring-offset);
}

/* DMS 非交互态：透明度 0.45，缩放到 0.92。 */
.feyo-card--disabled {
  cursor: not-allowed;
  opacity: 0.45;
  transform: scale(0.92);
}

.feyo-card__header,
.feyo-card__footer {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: var(--feyo-space-s);
}

/* DMS 标题：字号 Medium 14、字重 Medium、颜色 accent（primary）。 */
.feyo-card__header {
  font-size: var(--feyo-font-size-medium);
  font-weight: var(--feyo-font-weight-medium);
  color: var(--feyo-color-primary);
}

.feyo-card__body {
  min-width: 0;
}

.feyo-card__footer {
  justify-content: flex-end;
}
</style>
