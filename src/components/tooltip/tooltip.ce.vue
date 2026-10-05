<!--
提示框：在鼠标悬停或键盘聚焦触发器时显示说明，也支持由 open 属性控制显示状态。
调用示例：
  <feyo-tooltip text="保存当前内容">
    <template #trigger="{ triggerAttrs }">
      <button type="button" v-bind="triggerAttrs">保存</button>
    </template>
  </feyo-tooltip>
  <feyo-tooltip position="top" :open="showHint">
    <template #trigger><span>账户状态</span></template>
    <template #content>当前账户已验证</template>
  </feyo-tooltip>
-->
<script setup>
import { Comment, computed, nextTick, onBeforeUnmount, onMounted, ref, useId, useSlots, watch } from "vue";

const props = defineProps({
  text: {
    type: String,
    default: "",
  },
  position: {
    type: String,
    default: "bottom",
  },
  open: {
    type: Boolean,
    default: undefined,
  },
  delay: {
    type: Number,
    default: 500,
  },
  disabled: Boolean,
});

const slots = useSlots();
const localOpen = ref(false);
const triggerRoot = ref(null);
const hovered = ref(false);
const focused = ref(false);
const tooltipId = `feyo-tooltip-${useId()}`;
let openTimer = null;
let describedElement = null;
let previousDescription = null;

const controlled = computed(() => props.open !== undefined);
const hasSlotContent = computed(() => slots.content?.().some((vnode) => {
  if (vnode.type === Comment) return false;
  return typeof vnode.children !== "string" || vnode.children.trim().length > 0;
}) || false);
const hasContent = computed(() => Boolean(props.text.trim()) || hasSlotContent.value);
const tooltipOpen = computed(() => {
  if (props.disabled || !hasContent.value) return false;
  return controlled.value ? props.open : localOpen.value;
});
const tooltipPosition = computed(() => {
  const positions = ["top", "right", "bottom", "left"];
  return positions.includes(props.position) ? props.position : "bottom";
});
const tooltipDelay = computed(() => Math.max(0, Number.isFinite(props.delay) ? props.delay : 0));
const triggerAttrs = computed(() => ({
  "aria-describedby": tooltipOpen.value ? tooltipId : undefined,
}));

function clearOpenTimer() {
  if (openTimer === null) return;
  clearTimeout(openTimer);
  openTimer = null;
}

function rememberDescription(element) {
  if (!element || typeof element.setAttribute !== "function") return;
  if (describedElement === element) return;

  restoreDescription();
  describedElement = element;
  previousDescription = element.getAttribute("aria-describedby");
  const existing = (previousDescription || "").split(/\s+/).filter((value) => value && value !== tooltipId);
  const descriptions = [...existing, tooltipId].join(" ");
  element.setAttribute("aria-describedby", descriptions);
}

function restoreDescription() {
  if (!describedElement) return;
  const existing = (previousDescription || "").split(/\s+/).filter((value) => value && value !== tooltipId);
  if (existing.length === 0) describedElement.removeAttribute("aria-describedby");
  else describedElement.setAttribute("aria-describedby", existing.join(" "));
  describedElement = null;
  previousDescription = null;
}

function hideTooltip() {
  clearOpenTimer();
  localOpen.value = false;
  restoreDescription();
}

function showTooltip(immediate = false) {
  if (controlled.value || props.disabled || !hasContent.value) return;
  clearOpenTimer();
  if (immediate || tooltipDelay.value === 0) {
    localOpen.value = true;
    return;
  }
  openTimer = setTimeout(() => {
    localOpen.value = true;
    openTimer = null;
  }, tooltipDelay.value);
}

function handleMouseenter() {
  hovered.value = true;
  showTooltip(focused.value);
}

function handleMouseleave() {
  hovered.value = false;
  if (!focused.value) hideTooltip();
}

function handleFocusin(event) {
  focused.value = true;
  showTooltip(true);
  if (tooltipOpen.value) rememberDescription(event.target);
}

function handleFocusout(event) {
  if (event.currentTarget?.contains(event.relatedTarget)) return;
  focused.value = false;
  if (!hovered.value) hideTooltip();
}

watch(tooltipOpen, (open) => {
  if (!open) {
    restoreDescription();
    return;
  }
  nextTick(() => {
    const target = triggerRoot.value?.querySelector("button, a, input, select, textarea, [tabindex]:not([tabindex='-1'])");
    if (target) rememberDescription(target);
  });
}, { immediate: true });

onMounted(() => {
  if (tooltipOpen.value) {
    nextTick(() => {
      const target = triggerRoot.value?.querySelector("button, a, input, select, textarea, [tabindex]:not([tabindex='-1'])");
      if (target) rememberDescription(target);
    });
  }
});

onBeforeUnmount(() => {
  clearOpenTimer();
  restoreDescription();
});
</script>

<template>
  <span
    class="feyo-tooltip"
    :class="{ 'feyo-tooltip--open': tooltipOpen, 'feyo-tooltip--disabled': disabled }"
    @mouseenter="handleMouseenter"
    @mouseleave="handleMouseleave"
    @focusin="handleFocusin"
    @focusout="handleFocusout"
  >
    <span
      ref="triggerRoot"
      class="feyo-tooltip__trigger"
      :aria-describedby="tooltipOpen ? tooltipId : undefined"
    >
      <slot
        name="trigger"
        :trigger-attrs="triggerAttrs"
        :attrs="triggerAttrs"
        :open="tooltipOpen"
      >
        <slot />
      </slot>
    </span>

    <span
      v-if="tooltipOpen"
      :id="tooltipId"
      class="feyo-tooltip__content"
      :class="`feyo-tooltip__content--${tooltipPosition}`"
      role="tooltip"
    >
      <slot name="content">{{ text }}</slot>
    </span>
  </span>
</template>

<style scoped lang="scss">
.feyo-tooltip {
  position: relative;
  display: inline-flex;
  max-width: 100%;
  color: var(--feyo-color-on-surface);
  font-family: var(--feyo-font-family);
}

.feyo-tooltip--disabled {
  cursor: default;
  opacity: var(--feyo-opacity-disabled);
}

.feyo-tooltip__trigger {
  display: inline-flex;
  min-width: 0;
  max-width: 100%;
}

.feyo-tooltip__content {
  position: absolute;
  z-index: 20;
  width: max-content;
  max-width: min(320px, calc(100vw - 24px));
  padding: var(--feyo-space-2) var(--feyo-space-3);
  border-radius: 4px;
  color: var(--feyo-color-on-surface);
  background: var(--feyo-color-surface-container-high);
  box-shadow: 0 8px 20px color-mix(in srgb, var(--feyo-color-surface) 55%, var(--feyo-color-transparent));
  font-size: var(--feyo-font-size-sm);
  line-height: 1.4;
  white-space: normal;
  pointer-events: none;
  animation: feyo-tooltip-enter var(--feyo-duration-fast) var(--feyo-ease-emphasized);
}

.feyo-tooltip__content--bottom {
  top: calc(100% + var(--feyo-space-2));
  left: 50%;
  transform: translateX(-50%);
}

.feyo-tooltip__content--top {
  bottom: calc(100% + var(--feyo-space-2));
  left: 50%;
  transform: translateX(-50%);
}

.feyo-tooltip__content--right {
  top: 50%;
  left: calc(100% + var(--feyo-space-2));
  transform: translateY(-50%);
}

.feyo-tooltip__content--left {
  top: 50%;
  right: calc(100% + var(--feyo-space-2));
  transform: translateY(-50%);
}

@keyframes feyo-tooltip-enter {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}
</style>
