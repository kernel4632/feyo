<!--
按钮：KIMA 的主操作控件。默认药丸形，按下圆角收成 8，带状态层和焦点环。
调用示例：
  <kima-button variant="filled" type="submit">保存</kima-button>
  <kima-button variant="tonal" :loading="saving">继续</kima-button>
  <kima-button shape="square"><template #leading>...</template>添加</kima-button>
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
  // DMS DankButton 默认形状 round（药丸），square 为方形。
  shape: {
    type: String,
    default: "round",
  },
  // 旧属性，等价于 shape="round"。
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
    class="kima-button"
    :class="[
      `kima-button--${buttonVariant}`,
      { 'kima-button--round': isRound },
    ]"
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
  >
    <span v-if="loading" class="kima-button__spinner" aria-hidden="true"></span>
    <span v-else-if="$slots.leading || hasNativeSlot('leading')" class="kima-button__slot kima-button__slot--leading">
      <slot name="leading" />
    </span>
    <span class="kima-button__label"><slot /></span>
    <span v-if="$slots.trailing || hasNativeSlot('trailing')" class="kima-button__slot kima-button__slot--trailing">
      <slot name="trailing" />
    </span>
  </button>
</template>

<style scoped lang="scss">
@use "../styles/mixins" as *;

.kima-button {
  /* DMS DankButton：最小宽 58、高 40、内边距 16、内容间距 8、字号 14 中等。 */
  min-width: var(--kima-button-min-width);
  min-height: var(--kima-button-height-s);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--kima-space-s);
  padding: 0 var(--kima-space-l);
  border: 1px solid var(--kima-color-transparent);
  /* square 用 M 12；round 用整高药丸。 */
  border-radius: var(--kima-radius-m);
  box-sizing: border-box;
  font-family: var(--kima-font-family);
  font-size: var(--kima-font-size-medium);
  font-weight: var(--kima-font-weight-medium);
  line-height: 1;
  color: var(--kima-color-on-primary);
  background: var(--kima-color-primary);
  cursor: pointer;
  user-select: none;
  transition:
    background-color var(--kima-duration-expressive-effects) var(--kima-curve-expressive-effects),
    border-color var(--kima-duration-expressive-effects) var(--kima-curve-expressive-effects),
    color var(--kima-duration-expressive-effects) var(--kima-curve-expressive-effects),
    border-radius var(--kima-duration-expressive-effects) var(--kima-curve-standard);

  @include kima-state-layer;
  @include kima-focus-ring;

  &--round {
    border-radius: var(--kima-radius-full);
  }

  /* DMS：按下时圆角收成 S 8。 */
  &:active:not(:disabled) {
    border-radius: var(--kima-radius-s);
  }

  /* DMS 禁用：填充分支用 onSurface_12 底 + onSurface_38 字。 */
  &:disabled {
    cursor: not-allowed;
  }

  &--filled:disabled,
  &--tonal:disabled {
    color: var(--kima-color-on-surface-38);
    background: var(--kima-color-on-surface-12);
  }

  &--tonal {
    color: var(--kima-color-on-secondary-container);
    background: var(--kima-color-secondary-container);
  }

  &--outlined,
  &--text {
    color: var(--kima-color-primary);
    background: var(--kima-color-transparent);
  }

  &--outlined {
    border-color: var(--kima-color-outline-variant);
  }

  &--outlined:disabled,
  &--text:disabled {
    color: var(--kima-color-on-surface-38);
  }

  &__label,
  &__slot {
    display: inline-flex;
    align-items: center;
    justify-content: center;
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
    border-right-color: var(--kima-color-transparent);
    border-radius: var(--kima-radius-full);
    animation: kima-button-spin var(--kima-spinner-duration) linear infinite;
  }
}

@keyframes kima-button-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
