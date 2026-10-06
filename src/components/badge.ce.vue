<!--
徽章：显示短状态、数量或仅用于标记存在的圆点，并保留 status 语义。
调用示例：
  <feyo-badge value="8" />
  <feyo-badge :value="128" :max="99" variant="danger" aria-label="128 条未读消息" />
  <feyo-badge dot variant="success" aria-label="在线" />
  <feyo-badge variant="primary"><template #leading><MyIcon /></template>同步中</feyo-badge>
-->
<script setup>
import { Comment, computed, ref, useAttrs, useSlots } from "vue";
import { useNativeSlots } from "../utils/native-slots.js";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  value: {
    type: [String, Number],
    default: null,
  },
  variant: {
    type: String,
    default: "neutral",
  },
  dot: Boolean,
  max: {
    type: Number,
    default: 99,
  },
});

const attrs = useAttrs();
const slots = useSlots();
const root = ref(null);
const { hasNativeSlot, isCustomElement } = useNativeSlots(root);
const forwardedAttrs = computed(() => isCustomElement ? { ...attrs, id: undefined } : attrs);
const hasDefaultContent = computed(() => slots.default?.().some((vnode) => {
  if (vnode.type === Comment) return false;
  return typeof vnode.children !== "string" || vnode.children.trim().length > 0;
}) || hasNativeSlot("default"));

const badgeVariant = computed(() => {
  const variants = ["neutral", "primary", "danger", "success"];
  return variants.includes(props.variant) ? props.variant : "neutral";
});

const displayValue = computed(() => {
  if (props.dot || props.value === null || props.value === undefined || String(props.value).trim() === "") return "";
  const numericValue = Number(props.value);
  if (Number.isFinite(numericValue) && numericValue > props.max) {
    return `${props.max}+`;
  }
  return String(props.value);
});

const accessibleLabel = computed(() => attrs["aria-label"] || displayValue.value || undefined);
</script>

<template>
  <span
    ref="root"
    v-bind="forwardedAttrs"
    class="feyo-badge"
    :class="[
      `feyo-badge--${badgeVariant}`,
      { 'feyo-badge--dot': dot },
    ]"
    role="status"
    :aria-label="accessibleLabel"
  >
    <span v-if="$slots.leading || hasNativeSlot('leading')" class="feyo-badge__slot feyo-badge__slot--leading" aria-hidden="true">
      <slot name="leading" />
    </span>
    <span v-if="dot" class="feyo-badge__dot" aria-hidden="true"></span>
    <slot v-else-if="hasDefaultContent" />
    <template v-else>{{ displayValue }}</template>
    <span v-if="$slots.trailing || hasNativeSlot('trailing')" class="feyo-badge__slot feyo-badge__slot--trailing" aria-hidden="true">
      <slot name="trailing" />
    </span>
  </span>
</template>

<style scoped lang="scss">
.feyo-badge {
  min-width: 24px;
  min-height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--feyo-space-1);
  padding: 0 var(--feyo-space-2);
  border: 1px solid var(--feyo-color-transparent);
  border-radius: var(--feyo-radius-full);
  box-sizing: border-box;
  font-family: var(--feyo-font-family);
  font-size: var(--feyo-font-size-xs);
  font-weight: var(--feyo-font-weight-bold);
  line-height: 1;
  white-space: nowrap;
  color: var(--feyo-color-on-surface);
  background: var(--feyo-color-surface-container-high);

  &--primary {
    color: var(--feyo-color-on-primary-container);
    background: var(--feyo-color-primary-container);
  }

  &--danger {
    color: var(--feyo-color-on-danger);
    background: var(--feyo-color-danger);
  }

  &--success {
    color: var(--feyo-color-on-success);
    background: var(--feyo-color-success);
  }

  &--dot {
    min-width: 10px;
    width: 10px;
    min-height: 10px;
    height: 10px;
    padding: 0;
  }

  &__dot {
    width: 6px;
    height: 6px;
    border-radius: var(--feyo-radius-full);
    background: currentColor;
  }

  &__slot {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
