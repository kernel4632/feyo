<!--
徽章：显示短状态、数量或仅用于标记存在的圆点，并保留 status 语义。
外观照 DMS 的 DankBadge 对齐：默认 primary 底、药丸形、高度 20、字号 12、字重中等。
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
    default: "primary",
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
  return variants.includes(props.variant) ? props.variant : "primary";
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
    <slot v-if="!dot && hasDefaultContent" />
    <template v-else-if="!dot">{{ displayValue }}</template>
    <span v-if="$slots.trailing || hasNativeSlot('trailing')" class="feyo-badge__slot feyo-badge__slot--trailing" aria-hidden="true">
      <slot name="trailing" />
    </span>
  </span>
</template>

<style scoped lang="scss">
.feyo-badge {
  /* DMS DankBadge：文字高度 20（spacingL 16 + spacingXS 4），左右内边距 spacingS 8，
     字号 Small 12，字重 Medium，圆角取一半高度成药丸。 */
  min-width: 20px;
  min-height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--feyo-space-xs);
  padding: 0 var(--feyo-space-s);
  border: 1px solid var(--feyo-color-transparent);
  border-radius: var(--feyo-radius-full);
  box-sizing: border-box;
  font-family: var(--feyo-font-family);
  font-size: var(--feyo-font-size-small);
  font-weight: var(--feyo-font-weight-medium);
  line-height: 1;
  white-space: nowrap;
  color: var(--feyo-color-on-primary);
  background: var(--feyo-color-primary);

  &--neutral {
    color: var(--feyo-color-on-surface);
    background: var(--feyo-color-surface-container-high);
  }

  &--danger {
    color: var(--feyo-color-on-danger);
    background: var(--feyo-color-danger);
  }

  &--success {
    color: var(--feyo-color-on-success);
    background: var(--feyo-color-success);
  }

  /* DMS 无文字徽章高度 spacingXS + spacingXXS = 6，本身就是一个小圆点。 */
  &--dot {
    min-width: 6px;
    width: 6px;
    min-height: 6px;
    height: 6px;
    padding: 0;
  }

  &__slot {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
