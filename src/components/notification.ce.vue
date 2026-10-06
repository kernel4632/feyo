<!--
通知：显示短消息、状态和可选操作，负责自动关闭、手动关闭和关闭时的事件通知。
duration 单位是毫秒；0 表示保持显示。close 事件传出 button 或 timeout。
heading 是标题属性；Vue 的 title 透传属性也支持，避免覆盖 HTMLElement.title。
挂载后才开始计时；鼠标停留或焦点在通知内部时暂停，离开后继续剩余时间。
position 支持 top/bottom 和 top-left/top-center/top-right/bottom-left/bottom-center/bottom-right。
调用示例：
  <kima-notification v-model:open="noticeOpen" title="保存成功" message="项目已保存" variant="success" />
  <kima-notification v-model:open="noticeOpen" title="需要确认" message="请检查表单" variant="warning" :duration="0" closable>
    <template #action><button type="button">查看</button></template>
  </kima-notification>
-->
<script setup>
import { computed, getCurrentInstance, onBeforeUnmount, onMounted, ref, watch, useAttrs, useHost, useId } from "vue";
import KimaIcon from "./icon.ce.vue";
import { Cancel01Icon } from "@hugeicons/core-free-icons";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  heading: {
    type: String,
    default: "",
  },
  message: {
    type: String,
    default: "",
  },
  variant: {
    type: String,
    default: "neutral",
  },
  duration: {
    type: Number,
    default: 5000,
  },
  closable: {
    type: Boolean,
    default: true,
  },
  position: {
    type: String,
    default: "top-right",
  },
});

const emit = defineEmits(["update:open", "close"]);
const attrs = useAttrs();
const host = getCurrentInstance().ce ? useHost() : null;
const localOpen = ref(props.open);
const baseId = useId();
const titleId = `kima-notification-${baseId}-title`;
const messageId = `kima-notification-${baseId}-message`;
let closeTimer = null;
let mounted = false;
let remaining = 0;
let startedAt = 0;
let hovered = false;
let focused = false;

const notificationVariant = computed(() => {
  const variants = ["neutral", "info", "success", "warning", "danger"];
  return variants.includes(props.variant) ? props.variant : "neutral";
});
const notificationPosition = computed(() => {
  const positions = ["top", "top-left", "top-center", "top-right", "bottom", "bottom-left", "bottom-center", "bottom-right"];
  return positions.includes(props.position) ? props.position : "top-right";
});
const notificationRole = computed(() => ["warning", "danger"].includes(notificationVariant.value) ? "alert" : "status");
const notificationLive = computed(() => notificationRole.value === "alert" ? "assertive" : "polite");
const durationMs = computed(() => Number.isFinite(props.duration) ? Math.max(0, props.duration) : 0);

// --- 关闭计时器：重开、修改时长和卸载都取消旧计时 ---
function clearCloseTimer() {
  if (closeTimer === null) return;
  clearTimeout(closeTimer);
  closeTimer = null;
}

function close(reason = "close") {
  if (!localOpen.value) return;
  clearCloseTimer();
  localOpen.value = false; // 同一次打开只发送一次关闭事件。
  emit("update:open", false);
  emit("close", reason);
}

function startCloseTimer() {
  clearCloseTimer();
  if (!mounted || !localOpen.value || durationMs.value === 0 || hovered || focused) return;
  startedAt = Date.now();
  closeTimer = setTimeout(() => {
    closeTimer = null;
    close("timeout");
  }, remaining);
}

function pauseTimer() {
  if (closeTimer === null) return;
  remaining = Math.max(0, remaining - (Date.now() - startedAt));
  clearCloseTimer();
}

function handleHover(inside) {
  hovered = inside;
  if (inside) pauseTimer();
  else startCloseTimer();
}

function handleFocus(event) {
  focused = event.type === "focusin" || event.currentTarget.contains(event.relatedTarget);
  if (focused) pauseTimer();
  else startCloseTimer();
}

// --- 外部打开状态同步；没有 v-model 时也能自行关闭 ---
watch(() => props.open, (open) => { localOpen.value = open; });
watch(
  [localOpen, durationMs],
  ([open]) => {
    remaining = durationMs.value;
    if (open) startCloseTimer();
    else {
      clearCloseTimer();
      hovered = false;
      focused = false;
    }
  },
  { immediate: true },
);

onMounted(() => {
  mounted = true;
  remaining = durationMs.value;
  startCloseTimer();
});
onBeforeUnmount(() => {
  mounted = false;
  clearCloseTimer();
});
</script>

<template>
  <div
    v-bind="{ ...attrs, id: host ? undefined : attrs.id, title: undefined }"
    v-show="localOpen"
    class="kima-notification"
    :class="[`kima-notification--${notificationVariant}`, `kima-notification--${notificationPosition}`]"
    :role="notificationRole"
    :aria-live="notificationLive"
    aria-atomic="true"
    :aria-labelledby="heading || attrs.title ? titleId : undefined"
    :aria-describedby="message ? messageId : undefined"
    @mouseenter="handleHover(true)"
    @mouseleave="handleHover(false)"
    @focusin="handleFocus"
    @focusout="handleFocus"
  >
    <div v-if="localOpen" class="kima-notification__copy">
      <strong v-if="heading || attrs.title" :id="titleId" class="kima-notification__title">{{ heading || attrs.title }}</strong>
      <span v-if="message" :id="messageId" class="kima-notification__message">{{ message }}</span>
      <div v-if="$slots.action || host" class="kima-notification__action"><slot name="action" /></div>
    </div>
    <button
      v-if="localOpen && closable"
      class="kima-notification__close"
      type="button"
      aria-label="关闭通知"
      title="关闭通知"
      @click="close('button')"
    >
      <KimaIcon :icon="Cancel01Icon" :size="18" aria-hidden="true" />
    </button>
  </div>
</template>

<style scoped lang="scss">
.kima-notification {
  box-sizing: border-box;
  position: fixed;
  z-index: 1100;
  display: flex;
  width: min(420px, calc(100vw - 32px));
  max-height: calc(100dvh - 32px);
  overflow: auto;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--kima-space-4);
  padding: var(--kima-space-4);
  border: 0;
  border-radius: var(--kima-radius-lg);
  color: var(--kima-color-on-surface);
  background: var(--kima-color-layer-2);
  box-shadow: 0 12px 32px color-mix(in srgb, var(--kima-color-surface) 55%, var(--kima-color-transparent));
  font-family: var(--kima-font-family);
  animation: kima-notification-enter var(--kima-duration-normal) var(--kima-ease-emphasized);
}

.kima-notification--top,
.kima-notification--top-center,
.kima-notification--top-left,
.kima-notification--top-right {
  top: var(--kima-space-4);
}

.kima-notification--bottom,
.kima-notification--bottom-center,
.kima-notification--bottom-left,
.kima-notification--bottom-right {
  bottom: var(--kima-space-4);
}

.kima-notification--top,
.kima-notification--bottom {
  left: 50%;
  transform: translateX(-50%);
}

.kima-notification--top-center,
.kima-notification--bottom-center {
  left: 50%;
  transform: translateX(-50%);
}

.kima-notification--top-left,
.kima-notification--bottom-left {
  left: var(--kima-space-4);
}

.kima-notification--top-right,
.kima-notification--bottom-right {
  right: var(--kima-space-4);
}

.kima-notification--info {
  color: var(--kima-color-on-primary-container);
  background: var(--kima-color-primary-container);
}

.kima-notification--warning {
  color: var(--kima-color-on-surface);
  background: color-mix(in srgb, var(--kima-color-danger) 12%, var(--kima-color-layer-2));
}

.kima-notification--success {
  color: var(--kima-color-on-success);
  background: var(--kima-color-success);
}

.kima-notification--danger {
  color: var(--kima-color-on-danger);
  background: var(--kima-color-danger);
}

.kima-notification__copy {
  min-width: 0;
  display: grid;
  gap: var(--kima-space-1);
  overflow-wrap: anywhere;
}

.kima-notification__title {
  font-size: var(--kima-font-size-md);
  font-weight: var(--kima-font-weight-bold);
  line-height: 1.3;
}

.kima-notification__message {
  font-size: var(--kima-font-size-sm);
  line-height: 1.45;
}

.kima-notification__action {
  display: flex;
  flex-wrap: wrap;
  margin-top: var(--kima-space-2);
  gap: var(--kima-space-2);
}

.kima-notification__action:empty {
  display: none;
}

.kima-notification__close:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .kima-notification {
    animation: none;
  }
}

.kima-notification__close {
  display: inline-flex;
  flex: 0 0 32px;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: var(--kima-radius-full);
  color: inherit;
  background: var(--kima-color-transparent);
  cursor: pointer;
}

.kima-notification__close:hover {
  background: color-mix(in srgb, currentColor 12%, var(--kima-color-transparent));
}

@keyframes kima-notification-enter {
  from {
    opacity: 0;
    scale: 0.98;
  }

  to {
    opacity: 1;
    scale: 1;
  }
}

@media (max-width: 600px) {
  .kima-notification--top,
  .kima-notification--top-left,
  .kima-notification--top-center,
  .kima-notification--top-right {
    top: var(--kima-space-3);
  }

  .kima-notification--bottom,
  .kima-notification--bottom-left,
  .kima-notification--bottom-center,
  .kima-notification--bottom-right {
    bottom: var(--kima-space-3);
  }

  .kima-notification--top-left,
  .kima-notification--bottom-left {
    left: var(--kima-space-3);
  }

  .kima-notification--top-right,
  .kima-notification--bottom-right {
    right: var(--kima-space-3);
  }
}
</style>
