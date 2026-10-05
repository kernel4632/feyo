<!--
对话框：提供带遮罩的可访问弹层，管理关闭、焦点和打开期间的页面滚动。
调用示例：
  <feyo-dialog v-model="dialogOpen" title="删除项目" description="此操作无法撤销">
    <p>确定要继续吗？</p>
    <template #footer><button type="button" @click="dialogOpen = false">取消</button></template>
  </feyo-dialog>
-->
<script setup>
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from "vue";
import { HugeiconsIcon } from "@hugeicons/vue";
import { Cancel01Icon } from "@hugeicons/core-free-icons";

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: "",
  },
  description: {
    type: String,
    default: "",
  },
  closeOnEscape: {
    type: Boolean,
    default: true,
  },
  closeOnBackdrop: {
    type: Boolean,
    default: true,
  },
  size: {
    type: String,
    default: "medium",
  },
});

const emit = defineEmits(["update:open", "close"]);
const dialog = ref(null);
const panel = ref(null);
let returnFocus = null;
let previousBodyOverflow = "";
let bodyScrollLocked = false;

const dialogSize = computed(() => {
  const sizes = ["small", "medium", "large"];
  return sizes.includes(props.size) ? props.size : "medium";
});
const dialogId = useId();
const titleId = `feyo-dialog-title-${dialogId}`;
const descriptionId = `feyo-dialog-description-${dialogId}`;

function close(reason = "close") {
  if (!props.open) return;
  emit("update:open", false);
  emit("close", reason);
}

function focusInitialElement() {
  const target = dialog.value?.querySelector("[autofocus], button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex='-1'])");
  (target || panel.value)?.focus();
}

function lockBodyScroll() {
  if (bodyScrollLocked || typeof document === "undefined") return;
  previousBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  bodyScrollLocked = true;
}

function restoreBodyScroll() {
  if (!bodyScrollLocked || typeof document === "undefined") return;
  document.body.style.overflow = previousBodyOverflow;
  bodyScrollLocked = false;
}

function openDialog() {
  if (typeof document !== "undefined") returnFocus = document.activeElement;
  lockBodyScroll();
  nextTick(focusInitialElement);
}

function closeDialog() {
  restoreBodyScroll();
  if (returnFocus && typeof returnFocus.focus === "function") {
    nextTick(() => returnFocus.focus());
  }
  returnFocus = null;
}

function handleKeydown(event) {
  if (event.key === "Escape" && props.closeOnEscape) {
    event.preventDefault();
    close("escape");
    return;
  }

  if (event.key === "Tab") {
    const focusable = [...dialog.value.querySelectorAll(
      "button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex='-1'])",
    )];
    if (!focusable.length) {
      event.preventDefault();
      panel.value?.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}

watch(
  () => props.open,
  (open) => {
    if (open) openDialog();
    else closeDialog();
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  restoreBodyScroll();
});
</script>

<template>
  <div
    v-if="open"
    ref="dialog"
    class="feyo-dialog"
    @keydown="handleKeydown"
  >
    <div class="feyo-dialog__backdrop" aria-hidden="true" @click.self="closeOnBackdrop && close('backdrop')" />
    <div class="feyo-dialog__positioner">
      <section
        ref="panel"
        class="feyo-dialog__panel"
        :class="`feyo-dialog__panel--${dialogSize}`"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="title ? titleId : undefined"
        :aria-describedby="description ? descriptionId : undefined"
        tabindex="-1"
      >
        <header v-if="title || $slots.header" class="feyo-dialog__header">
          <div class="feyo-dialog__heading">
            <h2 v-if="title" :id="titleId" class="feyo-dialog__title">{{ title }}</h2>
            <div v-if="$slots.header" class="feyo-dialog__header-slot"><slot name="header" /></div>
          </div>
          <button class="feyo-dialog__close" type="button" aria-label="关闭对话框" @click="close('button')">
            <HugeiconsIcon :icon="Cancel01Icon" :size="20" color="currentColor" />
          </button>
        </header>

        <p v-if="description" :id="descriptionId" class="feyo-dialog__description">{{ description }}</p>
        <div class="feyo-dialog__body"><slot /></div>
        <footer v-if="$slots.footer" class="feyo-dialog__footer"><slot name="footer" /></footer>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.feyo-dialog {
  position: fixed;
  z-index: 1000;
  inset: 0;
  display: grid;
  place-items: center;
  color: var(--feyo-color-on-surface);
  font-family: var(--feyo-font-family);
}

.feyo-dialog__backdrop {
  position: absolute;
  inset: 0;
  background: color-mix(in srgb, var(--feyo-color-surface) 72%, var(--feyo-color-transparent));
}

.feyo-dialog__positioner {
  position: relative;
  z-index: 1;
  display: flex;
  width: min(calc(100% - 32px), 920px);
  max-height: calc(100% - 32px);
  justify-content: center;
}

.feyo-dialog__panel {
  width: 100%;
  max-height: 100%;
  overflow: auto;
  padding: 24px;
  border: 1px solid var(--feyo-color-outline);
  border-radius: 28px;
  background: var(--feyo-color-surface-container);
  box-shadow: 0 16px 40px color-mix(in srgb, var(--feyo-color-surface) 60%, var(--feyo-color-transparent));
  outline: none;
  animation: feyo-dialog-enter var(--feyo-duration-normal) var(--feyo-ease-emphasized);

  &--small {
    max-width: 420px;
  }

  &--medium {
    max-width: 640px;
  }

  &--large {
    max-width: 920px;
  }
}

.feyo-dialog__header,
.feyo-dialog__footer {
  display: flex;
  align-items: center;
  gap: var(--feyo-space-3);
}

.feyo-dialog__header {
  justify-content: space-between;
}

.feyo-dialog__heading {
  min-width: 0;
}

.feyo-dialog__title {
  margin: 0;
  color: var(--feyo-color-on-surface);
  font-size: var(--feyo-font-size-xl);
  font-weight: var(--feyo-font-weight-bold);
  line-height: 1.25;
}

.feyo-dialog__header-slot {
  margin-top: var(--feyo-space-2);
}

.feyo-dialog__close {
  display: inline-flex;
  flex: 0 0 40px;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 0;
  border-radius: var(--feyo-radius-full);
  color: var(--feyo-color-on-surface-variant);
  background: var(--feyo-color-transparent);
  cursor: pointer;
}

.feyo-dialog__close:hover {
  color: var(--feyo-color-on-surface);
  background: var(--feyo-color-surface-container-high);
}

.feyo-dialog__close:focus-visible,
.feyo-dialog__panel:focus-visible {
  outline: 2px solid var(--feyo-color-primary);
  outline-offset: 2px;
}

.feyo-dialog__description,
.feyo-dialog__body {
  margin: var(--feyo-space-5) 0 0;
}

.feyo-dialog__description {
  color: var(--feyo-color-on-surface-variant);
  line-height: 1.5;
}

.feyo-dialog__body {
  min-width: 0;
}

.feyo-dialog__footer {
  justify-content: flex-end;
  margin-top: var(--feyo-space-6);
}

@keyframes feyo-dialog-enter {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@media (max-width: 600px) {
  .feyo-dialog__positioner {
    width: min(calc(100% - 24px), 920px);
    max-height: calc(100% - 24px);
  }

  .feyo-dialog__panel {
    padding: 20px;
  }
}
</style>
