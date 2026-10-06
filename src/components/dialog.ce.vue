<!--
对话框：使用原生 modal dialog 管理背景隔离、焦点和多层弹窗。
title 沿用原生属性，作为 attrs 读取，不声明同名组件 prop。
调用示例：
  <kima-dialog v-model:open="dialogOpen" title="删除项目" description="此操作无法撤销">
    <p>确定要继续吗？</p>
    <template #footer><button type="button" @click="dialogOpen = false">取消</button></template>
  </kima-dialog>
-->
<script setup>
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, useId, watch } from "vue";
import KimaIcon from "./icon.ce.vue";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { useNativeSlots } from "../utils/native-slots.js";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
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
const attrs = useAttrs();
const dialog = ref(null);
const { hasNativeSlot, isCustomElement } = useNativeSlots(dialog);
const forwardedAttrs = computed(() => isCustomElement ? { ...attrs, id: undefined } : attrs);
const localOpen = ref(props.open);

const dialogSize = computed(() => {
  const sizes = ["small", "medium", "large"];
  return sizes.includes(props.size) ? props.size : "medium";
});
const dialogId = useId();
const titleId = `kima-dialog-title-${dialogId}`;
const descriptionId = `kima-dialog-description-${dialogId}`;

function close(reason = "close") {
  if (!localOpen.value) return;
  localOpen.value = false;
  if (dialog.value?.open) dialog.value.close();
  emit("update:open", false);
  emit("close", reason);
}

function syncDialog() {
  if (!dialog.value) return;
  // The browser owns the focus return target; no deferred callback can read a cleared ref.
  if (localOpen.value && !dialog.value.open) dialog.value.showModal();
  else if (!localOpen.value && dialog.value.open) dialog.value.close();
}

function handleCancel(event) {
  event.preventDefault();
  if (props.closeOnEscape) close("escape");
}

function handleNativeClose() {
  if (!dialog.value.open) close("native");
}

function handleKeydown(event) {
  if (event.key !== "Tab" || !dialog.value) return;
  const focusable = [...dialog.value.querySelectorAll(
    "button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex='-1'])",
  )];
  if (!focusable.length) return;
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

watch(() => props.open, (open) => { localOpen.value = open; });
watch(localOpen, syncDialog, { flush: "post" });
onMounted(syncDialog);
onBeforeUnmount(() => { if (dialog.value?.open) dialog.value.close(); });
</script>

<template>
  <dialog
    ref="dialog"
    v-bind="forwardedAttrs"
    :title="undefined"
    class="kima-dialog"
    :aria-labelledby="attrs.title ? titleId : attrs['aria-labelledby']"
    :aria-describedby="[attrs['aria-describedby'], description ? descriptionId : undefined].filter(Boolean).join(' ') || undefined"
    @cancel.stop="handleCancel"
    @close.stop="handleNativeClose"
    @keydown="handleKeydown"
    @click.self="closeOnBackdrop && close('backdrop')"
  >
    <div class="kima-dialog__positioner">
      <section
        class="kima-dialog__panel"
        :class="`kima-dialog__panel--${dialogSize}`"
      >
        <header v-if="attrs.title || $slots.header || hasNativeSlot('header')" class="kima-dialog__header">
          <div class="kima-dialog__heading">
            <h2 v-if="attrs.title" :id="titleId" class="kima-dialog__title">{{ attrs.title }}</h2>
            <div v-if="$slots.header || hasNativeSlot('header')" class="kima-dialog__header-slot"><slot name="header" /></div>
          </div>
          <button class="kima-dialog__close" type="button" aria-label="关闭对话框" @click="close('button')">
            <KimaIcon :icon="Cancel01Icon" :size="20" color="currentColor" />
          </button>
        </header>

        <p v-if="description" :id="descriptionId" class="kima-dialog__description">{{ description }}</p>
        <div v-if="$slots.default || hasNativeSlot('default')" class="kima-dialog__body"><slot /></div>
        <footer v-if="$slots.footer || hasNativeSlot('footer')" class="kima-dialog__footer"><slot name="footer" /></footer>
      </section>
    </div>
  </dialog>
</template>

<style scoped lang="scss">
.kima-dialog {
  box-sizing: border-box;
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
  margin: 0;
  padding: 16px;
  border: 0;
  background: var(--kima-color-transparent);
  place-items: center;
  color: var(--kima-color-on-surface);
  font-family: var(--kima-font-family);

  &[open] { display: grid; }

  &::backdrop {
    background: color-mix(in srgb, var(--kima-color-surface) 72%, var(--kima-color-transparent));
  }
}

.kima-dialog__positioner {
  position: relative;
  z-index: 1;
  display: flex;
  width: min(100%, 920px);
  max-height: 100%;
  justify-content: center;
  pointer-events: none;
}

.kima-dialog__panel {
  box-sizing: border-box;
  width: 100%;
  max-height: 100%;
  overflow: auto;
  padding: 24px;
  border: 0;
  border-radius: 28px;
  /* 弹层是实色：它是浮在内容之上的一层，必须挡住背后，不能透。 */
  background: var(--kima-color-popup-large);
  box-shadow: var(--kima-elevation-4);
  outline: none;
  pointer-events: auto;
  animation: kima-dialog-enter var(--kima-duration-normal) var(--kima-ease-emphasized);

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

.kima-dialog__header,
.kima-dialog__footer {
  display: flex;
  align-items: center;
  gap: var(--kima-space-3);
}

.kima-dialog__header {
  justify-content: space-between;
}

.kima-dialog__heading {
  min-width: 0;
}

.kima-dialog__title {
  margin: 0;
  color: var(--kima-color-on-surface);
  font-size: var(--kima-font-size-xl);
  font-weight: var(--kima-font-weight-bold);
  line-height: 1.25;
}

.kima-dialog__header-slot {
  margin-top: var(--kima-space-2);
}

.kima-dialog__close {
  display: inline-flex;
  flex: 0 0 40px;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 0;
  border-radius: var(--kima-radius-full);
  color: var(--kima-color-on-surface-variant);
  background: var(--kima-color-transparent);
  cursor: pointer;
}

.kima-dialog__close:hover {
  color: var(--kima-color-on-surface);
  background: var(--kima-color-layer-3);
}

.kima-dialog__close:focus-visible,
.kima-dialog__panel:focus-visible {
  outline: 2px solid var(--kima-color-primary);
  outline-offset: 2px;
}

.kima-dialog__description,
.kima-dialog__body {
  margin: var(--kima-space-5) 0 0;
}

.kima-dialog__description {
  color: var(--kima-color-on-surface-variant);
  line-height: 1.5;
}

.kima-dialog__body {
  min-width: 0;
}

.kima-dialog__footer {
  justify-content: flex-end;
  margin-top: var(--kima-space-6);
}

@keyframes kima-dialog-enter {
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
  .kima-dialog {
    padding: 12px;
  }

  .kima-dialog__panel {
    padding: 20px;
  }
}
</style>
