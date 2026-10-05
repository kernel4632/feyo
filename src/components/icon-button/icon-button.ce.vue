<!--
图标按钮：为单个图标提供可访问的原生按钮行为和 FEYO 的四种外观。
调用示例：
  <feyo-icon-button aria-label="搜索" title="搜索" />
  <feyo-icon-button aria-label="设置" variant="outlined" :icon="Settings01Icon" />
  <feyo-icon-button aria-label="自定义动作"><MyIcon /></feyo-icon-button>
-->
<script setup>
import { computed, getCurrentInstance, ref, useAttrs } from "vue";
import { HugeiconsIcon } from "@hugeicons/vue";
import { Settings01Icon } from "@hugeicons/core-free-icons";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  icon: {
    type: [Object, Array],
    default: null,
  },
  label: {
    type: String,
    default: "",
  },
  variant: {
    type: String,
    default: "filled",
  },
  size: {
    type: String,
    default: "default",
  },
  disabled: Boolean,
  loading: Boolean,
  type: {
    type: String,
    default: "button",
  },
});

const attrs = useAttrs();
const root = ref(null);
const isCustomElement = Boolean(getCurrentInstance()?.ce);
const forwardedAttrs = computed(() => isCustomElement ? { ...attrs, id: undefined } : attrs);

const buttonVariant = computed(() => {
  const variants = ["filled", "tonal", "outlined", "text"];
  return variants.includes(props.variant) ? props.variant : "filled";
});

const buttonSize = computed(() => {
  const sizes = ["small", "default", "large"];
  return sizes.includes(props.size) ? props.size : "default";
});

// Native ariaLabel/title remain browser attributes rather than conflicting CE props.
function accessibleLabel() {
  return props.label || attrs["aria-label"] || attrs.ariaLabel || attrs.title || "图标按钮";
}
const buttonIcon = computed(() => props.icon || Settings01Icon);
const iconSize = computed(() => ({ small: 18, default: 20, large: 24 })[buttonSize.value]);

</script>

<template>
  <button
    ref="root"
    v-bind="forwardedAttrs"
    class="feyo-icon-button"
    :class="[
      `feyo-icon-button--${buttonVariant}`,
      `feyo-icon-button--${buttonSize}`,
    ]"
    :type="type"
    :disabled="disabled || loading"
    :aria-label="accessibleLabel()"
    :aria-busy="loading || undefined"
    :title="attrs.title || accessibleLabel()"
  >
    <span v-if="loading" class="feyo-icon-button__spinner" aria-hidden="true"></span>
    <span v-else class="feyo-icon-button__icon" aria-hidden="true">
      <slot><HugeiconsIcon :icon="buttonIcon" :size="iconSize" /></slot>
    </span>
  </button>
</template>

<style scoped lang="scss">
.feyo-icon-button {
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  padding: 0;
  border: 1px solid var(--feyo-color-transparent);
  border-radius: var(--feyo-radius-full);
  box-sizing: border-box;
  font-family: var(--feyo-font-family);
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
    border-radius: var(--feyo-radius-md);
  }

  &:focus-visible {
    outline: 2px solid var(--feyo-color-primary);
    outline-offset: 2px;
  }

  &:disabled {
    opacity: var(--feyo-opacity-disabled);
    cursor: not-allowed;
  }

  &--small {
    width: 32px;
    height: 32px;
  }

  &--large {
    width: 48px;
    height: 48px;
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

  &__icon,
  &__spinner {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  &__spinner {
    width: 18px;
    height: 18px;
    border: 2px solid currentColor;
    border-right-color: var(--feyo-color-transparent);
    border-radius: var(--feyo-radius-full);
    animation: feyo-icon-button-spin var(--feyo-duration-slow) linear infinite;
  }
}

@keyframes feyo-icon-button-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
