<!--
按钮：提供 FEYO 的四种按钮外观，并保留原生 button 的表单行为。
调用示例：
  <feyo-button variant="filled" type="submit">保存</feyo-button>
  <feyo-button variant="outlined" :loading="saving">继续</feyo-button>
  <feyo-button round><template #leading>...</template>添加</feyo-button>
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
  disabled: Boolean,
  loading: Boolean,
  type: {
    type: String,
    default: "button",
  },
  round: Boolean,
});

const attrs = useAttrs();
const root = ref(null);
const { hasNativeSlot, isCustomElement } = useNativeSlots(root);
const forwardedAttrs = computed(() => isCustomElement ? { ...attrs, id: undefined } : attrs);

const buttonVariant = computed(() => {
  const variants = ["filled", "tonal", "outlined", "text"];
  return variants.includes(props.variant) ? props.variant : "filled";
});

</script>

<template>
  <button
    ref="root"
    v-bind="forwardedAttrs"
    class="feyo-button"
    :class="[
      `feyo-button--${buttonVariant}`,
      { 'feyo-button--round': round },
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
  min-width: 58px;
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--feyo-space-2);
  padding: 0 var(--feyo-space-4);
  border: 1px solid var(--feyo-color-transparent);
  border-radius: 12px;
  box-sizing: border-box;
  font-family: var(--feyo-font-family);
  font-size: var(--feyo-font-size-md);
  font-weight: var(--feyo-font-weight-medium);
  line-height: 1;
  color: var(--feyo-color-on-primary);
  background: var(--feyo-color-primary);
  cursor: pointer;
  user-select: none;
  transition:
    background-color var(--feyo-duration-fast) var(--feyo-ease-standard),
    border-color var(--feyo-duration-fast) var(--feyo-ease-standard),
    border-radius var(--feyo-duration-fast) var(--feyo-ease-standard),
    opacity var(--feyo-duration-normal) var(--feyo-ease-standard);

  &:hover:not(:disabled) {
    background: color-mix(in srgb, var(--feyo-color-primary) 88%, var(--feyo-color-on-primary));
  }

  &:active:not(:disabled) {
    border-radius: 8px;
  }

  &:focus-visible {
    outline: 2px solid var(--feyo-color-primary);
    outline-offset: 2px;
  }

  &:disabled {
    opacity: var(--feyo-opacity-disabled);
    cursor: not-allowed;
  }

  &--round {
    border-radius: var(--feyo-radius-full);
  }

  &--round:active:not(:disabled) {
    border-radius: var(--feyo-radius-full);
  }

  &--tonal {
    color: var(--feyo-color-on-primary-container);
    background: var(--feyo-color-primary-container);
  }

  &--tonal:hover:not(:disabled) {
    background: color-mix(in srgb, var(--feyo-color-primary-container) 88%, var(--feyo-color-on-primary-container));
  }

  &--outlined,
  &--text {
    color: var(--feyo-color-primary);
    background: var(--feyo-color-transparent);
  }

  &--outlined {
    border-color: var(--feyo-color-outline);
  }

  &--outlined:hover:not(:disabled),
  &--text:hover:not(:disabled) {
    background: color-mix(in srgb, var(--feyo-color-primary) 12%, var(--feyo-color-transparent));
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

  &__spinner {
    width: 16px;
    height: 16px;
    flex: 0 0 16px;
    border: 2px solid currentColor;
    border-right-color: var(--feyo-color-transparent);
    border-radius: var(--feyo-radius-full);
    animation: feyo-button-spin var(--feyo-duration-slow) linear infinite;
  }
}

@keyframes feyo-button-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
