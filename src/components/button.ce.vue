<!--
按钮：提供 FEYO 的四种按钮外观，几何和状态照 DMS 的 DankButton 对齐，并保留原生 button 的表单行为。
调用示例：
  <feyo-button variant="filled" type="submit">保存</feyo-button>
  <feyo-button variant="outlined" :loading="saving">继续</feyo-button>
  <feyo-button shape="square"><template #leading>...</template>添加</feyo-button>
-->
<script setup>
import { computed, ref, useAttrs } from "vue";
import { useNativeSlots } from "../utils/native-slots.js";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  variant: {
    type: String,
    default: "filled",
  },
  // DMS DankButton 默认形状是 round（药丸），square 是方形。
  shape: {
    type: String,
    default: "round",
  },
  // 旧属性，等价于 shape="round"，保留以免老调用报错。
  round: Boolean,
  disabled: Boolean,
  loading: Boolean,
  type: {
    type: String,
    default: "button",
  },
});

const attrs = useAttrs();
const root = ref(null);
const { hasNativeSlot, isCustomElement } = useNativeSlots(root);
const forwardedAttrs = computed(() => isCustomElement ? { ...attrs, id: undefined } : attrs);

const buttonVariant = computed(() => {
  const variants = ["filled", "tonal", "outlined", "text"];
  return variants.includes(props.variant) ? props.variant : "filled";
});

const isRound = computed(() => props.round || props.shape !== "square");

</script>

<template>
  <button
    ref="root"
    v-bind="forwardedAttrs"
    class="feyo-button"
    :class="[
      `feyo-button--${buttonVariant}`,
      { 'feyo-button--round': isRound },
    ]"
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
  >
    <span v-if="loading" class="feyo-button__spinner" aria-hidden="true"></span>
    <span v-else-if="$slots.leading || hasNativeSlot('leading')" class="feyo-button__slot feyo-button__slot--leading">
      <slot name="leading" />
    </span>
    <span class="feyo-button__label"><slot /></span>
    <span v-if="$slots.trailing || hasNativeSlot('trailing')" class="feyo-button__slot feyo-button__slot--trailing">
      <slot name="trailing" />
    </span>
  </button>
</template>

<style scoped lang="scss">
.feyo-button {
  /* DMS DankButton：最小宽度 58，高度取 buttonHeightS 40，内边距 spacingL 16，内容间距 spacingS 8。 */
  min-width: var(--feyo-button-min-width);
  min-height: var(--feyo-button-height-s);
  display: inline-flex;
  position: relative;
  align-items: center;
  justify-content: center;
  gap: var(--feyo-space-s);
  padding: 0 var(--feyo-space-l);
  border: 1px solid var(--feyo-color-transparent);
  /* square 用 M 圆角 12；round 用整高药丸。 */
  border-radius: var(--feyo-radius-m);
  box-sizing: border-box;
  font-family: var(--feyo-font-family);
  font-size: var(--feyo-font-size-medium);
  font-weight: var(--feyo-font-weight-medium);
  line-height: 1;
  color: var(--feyo-color-on-primary);
  background: var(--feyo-color-primary);
  cursor: pointer;
  user-select: none;
  /* 状态层用文字色的透明度叠加，时长为 expressiveEffects，圆角用 standard 曲线。 */
  transition:
    background-color var(--feyo-duration-effects) var(--feyo-ease-effects),
    border-color var(--feyo-duration-effects) var(--feyo-ease-effects),
    border-radius var(--feyo-duration-effects) var(--feyo-ease-standard-curve),
    color var(--feyo-duration-effects) var(--feyo-ease-effects);

  &--round {
    border-radius: var(--feyo-radius-full);
  }

  /* DMS 状态层：悬停 8%，按下 12%，叠加在填充色上。 */
  &:hover:not(:disabled) {
    background: color-mix(in srgb, var(--feyo-color-primary) 92%, var(--feyo-color-on-primary));
  }

  &:active:not(:disabled) {
    background: color-mix(in srgb, var(--feyo-color-primary) 88%, var(--feyo-color-on-primary));
    /* DMS 按下时圆角收成 S（8），药丸和方形一样。 */
    border-radius: var(--feyo-radius-s);
  }

  /* DMS FocusRing：宽度 1.5，偏移 3，颜色 primary。 */
  &:focus-visible {
    outline: var(--feyo-focus-ring-width) solid var(--feyo-color-primary);
    outline-offset: var(--feyo-focus-ring-offset);
  }

  /* DMS 禁用：底色 onSurface_12，文字 onSurface_38。 */
  &:disabled {
    color: var(--feyo-color-on-surface-38);
    background: var(--feyo-color-on-surface-12);
    cursor: not-allowed;
  }

  &--tonal {
    color: var(--feyo-color-on-secondary-container);
    background: var(--feyo-color-secondary-container);
  }

  &--tonal:hover:not(:disabled) {
    background: color-mix(in srgb, var(--feyo-color-secondary-container) 92%, var(--feyo-color-on-secondary-container));
  }

  &--tonal:active:not(:disabled) {
    background: color-mix(in srgb, var(--feyo-color-secondary-container) 88%, var(--feyo-color-on-secondary-container));
  }

  &--outlined,
  &--text {
    color: var(--feyo-color-primary);
    background: var(--feyo-color-transparent);
  }

  &--outlined {
    border-color: var(--feyo-color-outline-variant);
  }

  &--outlined:hover:not(:disabled),
  &--text:hover:not(:disabled) {
    background: color-mix(in srgb, var(--feyo-color-primary) 8%, var(--feyo-color-transparent));
  }

  &--outlined:active:not(:disabled),
  &--text:active:not(:disabled) {
    background: color-mix(in srgb, var(--feyo-color-primary) 12%, var(--feyo-color-transparent));
  }

  &--outlined:disabled,
  &--text:disabled {
    color: var(--feyo-color-on-surface-38);
    background: var(--feyo-color-transparent);
  }

  &__label,
  &__slot {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  &__label {
    min-width: 0;
    white-space: nowrap;
  }

  /* DMS DankSpinner：直径取图标 20，描边 2，转一圈 1568ms。 */
  &__spinner {
    width: 20px;
    height: 20px;
    flex: 0 0 20px;
    border: 2px solid currentColor;
    border-right-color: var(--feyo-color-transparent);
    border-radius: var(--feyo-radius-full);
    animation: feyo-button-spin var(--feyo-spinner-duration) linear infinite;
  }
}

@keyframes feyo-button-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
