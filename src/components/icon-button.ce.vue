<!--
图标按钮：为单个图标提供可访问的原生按钮行为和 FEYO 的外观，几何照 DMS 的 DankIconButton 对齐。
默认外观 standard（透明底、图标用 onSurfaceVariant）；尺寸 s 40、m 56。
调用示例：
  <feyo-icon-button aria-label="搜索" title="搜索" />
  <feyo-icon-button aria-label="设置" variant="outlined" :icon="Settings01Icon" />
  <feyo-icon-button aria-label="收藏" variant="filled" :icon="HeartIcon" />
  <feyo-icon-button aria-label="自定义动作"><MyIcon /></feyo-icon-button>
-->
<script setup>
import { computed, getCurrentInstance, ref, useAttrs } from "vue";
import { HugeiconsIcon } from "@hugeicons/vue";
import { Settings01Icon } from "@hugeicons/core-free-icons";
import { useRipple } from "../utils/ripple.js";

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
    default: "standard",
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

useRipple(root);

// standard 是 DMS 的默认外观，text 作为等价别名保留。
const buttonVariant = computed(() => {
  const variants = ["standard", "filled", "tonal", "outlined", "text"];
  return variants.includes(props.variant) ? props.variant : "standard";
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
// DMS DankIconButton iconSize 固定为 iconSize 24；small 是 FEYO 附带档位，取 20。
const iconSize = computed(() => ({ small: 20, default: 24, large: 24 })[buttonSize.value]);

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
@use "../styles/mixins" as *;

.feyo-icon-button {
  /* DMS DankIconButton：s 档 40×40、图标 24、横向留白 8、整圆。 */
  width: var(--feyo-button-height-s);
  height: var(--feyo-button-height-s);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  padding: 0;
  border: 1px solid var(--feyo-color-transparent);
  border-radius: var(--feyo-radius-full);
  box-sizing: border-box;
  font-family: var(--feyo-font-family);
  /* standard 外观：透明底，图标用 onSurfaceVariant。 */
  color: var(--feyo-color-on-surface-variant);
  background: var(--feyo-color-transparent);
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

  /* DMS：按下时圆角收成 S 8。 */
  &:active:not(:disabled) {
    border-radius: var(--feyo-radius-s);
  }

  /* DMS 禁用：图标降到 onSurface_38。 */
  &:disabled {
    color: var(--feyo-color-on-surface-38);
    cursor: not-allowed;
  }

  &--small {
    width: var(--feyo-button-height-xs);
    height: var(--feyo-button-height-xs);
  }

  /* DMS m 档 56×56，图标仍为 24。 */
  &--large {
    width: var(--feyo-button-height-m);
    height: var(--feyo-button-height-m);
  }

  &--filled {
    color: var(--feyo-color-on-primary);
    background: var(--feyo-color-primary);
  }

  &--filled:disabled {
    color: var(--feyo-color-on-surface-38);
    background: var(--feyo-color-on-surface-12);
  }

  &--tonal {
    color: var(--feyo-color-on-secondary-container);
    background: var(--feyo-color-secondary-container);
  }

  &--tonal:disabled {
    color: var(--feyo-color-on-surface-38);
    background: var(--feyo-color-on-surface-12);
  }

  &--outlined {
    color: var(--feyo-color-on-surface-variant);
    border-color: var(--feyo-color-outline-variant);
  }

  &__icon,
  &__spinner {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  /* DMS DankSpinner：直径取图标，描边 2，转一圈 1568ms。 */
  &__spinner {
    width: 24px;
    height: 24px;
    border: 2px solid currentColor;
    border-right-color: var(--feyo-color-transparent);
    border-radius: var(--feyo-radius-full);
    animation: feyo-icon-button-spin var(--feyo-spinner-duration) linear infinite;
  }

  &--small .feyo-icon-button__spinner {
    width: 20px;
    height: 20px;
  }
}

@keyframes feyo-icon-button-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
