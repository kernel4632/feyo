<!--
按钮：照 DMS 的 DankButton 整套搬过来。默认药丸形，按下圆角收成 8，带状态层和涟漪。
调用示例：
  <feyo-button variant="filled" type="submit">保存</feyo-button>
  <feyo-button variant="tonal" :loading="saving">继续</feyo-button>
  <feyo-button shape="square"><template #leading>...</template>添加</feyo-button>
-->
<script setup>
import { computed, ref, useAttrs } from "vue";
import { useNativeSlots } from "../utils/native-slots.js";
import { useRipple } from "../utils/ripple.js";

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

useRipple(root);

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
@use "../styles/mixins" as *;

.feyo-button {
  /* DMS DankButton：最小宽 58、高 40、内边距 16、内容间距 8、字号 14 中等。 */
  min-width: var(--feyo-button-min-width);
  min-height: var(--feyo-button-height-s);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--feyo-space-s);
  padding: 0 var(--feyo-space-l);
  border: 1px solid var(--feyo-color-transparent);
  /* square 用 M 12；round 用整高药丸。 */
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
  transition:
    background-color var(--feyo-duration-expressive-effects) var(--feyo-curve-expressive-effects),
    border-color var(--feyo-duration-expressive-effects) var(--feyo-curve-expressive-effects),
    color var(--feyo-duration-expressive-effects) var(--feyo-curve-expressive-effects),
    border-radius var(--feyo-duration-expressive-effects) var(--feyo-curve-standard);

  @include feyo-ripple-host;
  @include feyo-state-layer;
  @include feyo-focus-ring;

  &--round {
    border-radius: var(--feyo-radius-full);
  }

  /* DMS：按下时圆角收成 S 8。 */
  &:active:not(:disabled) {
    border-radius: var(--feyo-radius-s);
  }

  /* DMS 禁用：填充分支用 onSurface_12 底 + onSurface_38 字。 */
  &:disabled {
    cursor: not-allowed;
  }

  &--filled:disabled,
  &--tonal:disabled {
    color: var(--feyo-color-on-surface-38);
    background: var(--feyo-color-on-surface-12);
  }

  &--tonal {
    color: var(--feyo-color-on-secondary-container);
    background: var(--feyo-color-secondary-container);
  }

  &--outlined,
  &--text {
    color: var(--feyo-color-primary);
    background: var(--feyo-color-transparent);
  }

  &--outlined {
    border-color: var(--feyo-color-outline-variant);
  }

  &--outlined:disabled,
  &--text:disabled {
    color: var(--feyo-color-on-surface-38);
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
