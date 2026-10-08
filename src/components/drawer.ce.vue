<!--
抽屉：从底部或侧边滑入的弹层，Vaul 式体验——背景变暗模糊、面板滑入、拖拽关闭。
基于原生 modal dialog，自带焦点陷阱和 Escape 关闭。
title 沿用原生属性，作为 attrs 读取，不声明同名组件 prop。

调用示例：
  // 底部抽屉（默认）
  <kima-drawer v-model:open="open" title="操作">
    <p>在这里放内容。</p>
    <template #footer>
      <kima-button @click="open = false">完成</kima-button>
    </template>
  </kima-drawer>

  // 右侧抽屉
  <kima-drawer v-model:open="open" placement="right" title="详情">...</kima-drawer>

placement 可选值：bottom（默认）| left | right
底部抽屉从顶部的拖拽把手往下拖可以关闭（拖过面板高度 40% 即触发）；
把手以外的地方照常滚动、选字，不会被拖拽抢走。
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
  // 抽屉从哪侧滑入。bottom 适合操作菜单，left/right 适合导航和详情。
  // 侧抽屉的宽度取 --kima-drawer-max-width（默认 420px），窄屏时收到 90vw。
  placement: {
    type: String,
    default: "bottom",
  },
  description: {
    type: String,
    default: "",
  },
  closeOnEscape: {
    type: Boolean,
    default: true,
  },
  // 点击背景遮罩是否关闭。底部抽屉默认 true，重要的确认操作可以设 false。
  closeOnBackdrop: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["update:open", "close"]);
const attrs = useAttrs();
const dialog = ref(null);
const panel = ref(null);
const { hasNativeSlot, isCustomElement } = useNativeSlots(dialog);
const forwardedAttrs = computed(() => (isCustomElement ? { ...attrs, id: undefined } : attrs));
const localOpen = ref(props.open);

const placement = computed(() => {
  const valid = ["bottom", "left", "right"];
  return valid.includes(props.placement) ? props.placement : "bottom";
});

const dialogId = useId();
const titleId = `kima-drawer-title-${dialogId}`;
const descriptionId = `kima-drawer-description-${dialogId}`;

// ---- 拖拽关闭（仅底部抽屉）----
// 用户向下拖超过面板高度 40% 时触发关闭，否则弹回原位。
// isDragging 为 true 期间关闭 CSS transition，避免鼠标移动时卡顿。
// 拖拽只挂在把手上，不挂整块面板：正文要能选字、要能竖向滚动，
// 整块接拖拽会把这两件事一起抢掉（触摸端尤其明显）。
const dragOffset = ref(0);
const isDragging = ref(false);
let pointerStartY = 0;

function onDragStart(event) {
  if (placement.value !== "bottom" || event.button !== 0) return;
  isDragging.value = true;
  pointerStartY = event.clientY;
  // 抓住指针，让 pointermove 在离开元素后还能收到。
  event.currentTarget.setPointerCapture(event.pointerId);
}

function onDragMove(event) {
  if (!isDragging.value) return;
  const delta = event.clientY - pointerStartY;
  // 只允许向下拖（关闭方向），向上过度拉不动。
  dragOffset.value = Math.max(0, delta);
}

function onDragEnd() {
  if (!isDragging.value) return;
  isDragging.value = false;
  const panelHeight = panel.value?.offsetHeight ?? 300;
  if (dragOffset.value > panelHeight * 0.4) {
    close("drag");
  } else {
    // 没达到关闭阈值，弹回原位（CSS transition 此时已重新开启）。
    dragOffset.value = 0;
  }
}

// 拖拽时 transform 直接跟指针走（不走 CSS transition），松手后弹回。
const panelStyle = computed(() => {
  if (placement.value !== "bottom" || dragOffset.value === 0) return {};
  return {
    transform: `translateY(${dragOffset.value}px)`,
    transition: isDragging.value ? "none" : undefined,
  };
});

// ---- 开关 ----
function close(reason = "close") {
  if (!localOpen.value) return;
  dragOffset.value = 0;
  localOpen.value = false;
  if (dialog.value?.open) dialog.value.close();
  emit("update:open", false);
  emit("close", reason);
}

function syncDialog() {
  if (!dialog.value) return;
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

// Tab 键焦点在面板内部循环，不跳出去。
function handleKeydown(event) {
  if (event.key !== "Tab" || !dialog.value) return;
  const focusable = [
    ...dialog.value.querySelectorAll(
      "button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex='-1'])",
    ),
  ];
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

watch(
  () => props.open,
  (open) => {
    localOpen.value = open;
  },
);
watch(localOpen, syncDialog, { flush: "post" });
onMounted(syncDialog);
onBeforeUnmount(() => {
  if (dialog.value?.open) dialog.value.close();
});
</script>

<template>
  <dialog
    ref="dialog"
    v-bind="forwardedAttrs"
    :title="undefined"
    class="kima-drawer"
    :class="`kima-drawer--${placement}`"
    :aria-labelledby="attrs.title ? titleId : attrs['aria-labelledby']"
    :aria-describedby="
      [attrs['aria-describedby'], description ? descriptionId : undefined].filter(Boolean).join(' ') ||
      undefined
    "
    @cancel.stop="handleCancel"
    @close.stop="handleNativeClose"
    @keydown="handleKeydown"
    @click.self="closeOnBackdrop && close('backdrop')"
  >
    <div ref="panel" class="kima-drawer__panel" :style="panelStyle">
      <!-- 底部抽屉顶部的拖拽把手：视觉上是一条短横，实际是一块更大的命中区，
       * 也是唯一能起拖的地方（见上面 onDragStart 的注释）。 -->
      <div
        v-if="placement === 'bottom'"
        class="kima-drawer__handle"
        aria-hidden="true"
        @pointerdown="onDragStart"
        @pointermove="onDragMove"
        @pointerup="onDragEnd"
        @pointercancel="onDragEnd"
      />

      <header
        v-if="attrs.title || $slots.header || hasNativeSlot('header')"
        class="kima-drawer__header"
      >
        <div class="kima-drawer__heading">
          <h2 v-if="attrs.title" :id="titleId" class="kima-drawer__title">{{ attrs.title }}</h2>
          <div v-if="$slots.header || hasNativeSlot('header')" class="kima-drawer__header-slot">
            <slot name="header" />
          </div>
        </div>
        <button
          class="kima-drawer__close"
          type="button"
          aria-label="关闭"
          @click="close('button')"
        >
          <KimaIcon :icon="Cancel01Icon" :size="20" color="currentColor" />
        </button>
      </header>

      <p v-if="description" :id="descriptionId" class="kima-drawer__description">
        {{ description }}
      </p>
      <div v-if="$slots.default || hasNativeSlot('default')" class="kima-drawer__body">
        <slot />
      </div>
      <footer v-if="$slots.footer || hasNativeSlot('footer')" class="kima-drawer__footer">
        <slot name="footer" />
      </footer>
    </div>
  </dialog>
</template>

<style scoped lang="scss">
@use "../styles/mixins" as *;

/* ---- 遮罩层 ----
 * 原生 dialog 撑满视口，自己透明；
 * ::backdrop 负责背景变暗和模糊，面板是 dialog 的子元素。 */
.kima-drawer {
  box-sizing: border-box;
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--kima-color-on-surface);
  font-family: var(--kima-font-family);
  /* 原生 dialog 的 open 属性切换是 display 离散变化，
   * allow-discrete 才能让关闭时面板有机会播完滑出动画再消失。
   * opacity 1ms 是为了让 :not([open]) 的状态能触发 allow-discrete 机制。 */
  transition:
    opacity 1ms allow-discrete,
    display var(--kima-duration-slow) allow-discrete,
    overlay var(--kima-duration-slow) allow-discrete;

  &[open] {
    display: grid;
  }

  &::backdrop {
    /* dim + 模糊：聚焦到面板，背后内容退为背景。
     * 比纯半透明遮罩多一层"场景切换"的感觉。
     * 透明度也走 token，跟全库其它遮罩一个浓度，不在这里另写一个数。 */
    background: color-mix(in srgb, var(--kima-color-scrim) var(--kima-scrim-opacity), transparent);
    backdrop-filter: blur(var(--kima-backdrop-blur));
    transition: opacity var(--kima-duration-slow) var(--kima-curve-emphasized);
    opacity: 1;
  }

  /* 打开前遮罩从透明渐入。 */
  @starting-style {
    &[open]::backdrop {
      opacity: 0;
    }
  }

  /* 关闭时遮罩淡出；dialog 有 allow-discrete，backdrop 在这期间还活着能播完。 */
  &:not([open])::backdrop {
    opacity: 0;
  }
}

/* ---- 底部抽屉 ----
 * 面板贴底边，从下往上滑入。顶部大圆角，底部平齐屏幕边缘。
 * 最高 90vh：超过后内容区滚动，而不是把面板撑出屏幕。 */
.kima-drawer--bottom {
  align-items: end;

  .kima-drawer__panel {
    width: 100%;
    max-height: 90dvh;
    border-radius: var(--kima-radius-xl) var(--kima-radius-xl) 0 0;
    /* 打开：从屏幕外滑入。关闭：滑回屏幕外。
     * 比 opacity 多一层空间感，符合"从底下来"的认知。 */
    transition: transform var(--kima-duration-slow) var(--kima-curve-emphasized);

    @starting-style {
      transform: translateY(100%);
    }
  }

  /* 关闭时面板滑回屏幕底部（dialog 的 allow-discrete 保证它有时间播完）。 */
  &:not([open]) .kima-drawer__panel {
    transform: translateY(100%);
  }
}

/* ---- 右侧抽屉 ----
 * 面板贴右边，从右往左滑入，全高，最宽 420px。 */
.kima-drawer--right {
  justify-items: end;

  .kima-drawer__panel {
    height: 100%;
    width: min(var(--kima-drawer-max-width), 90vw);
    border-radius: var(--kima-radius-xl) 0 0 var(--kima-radius-xl);
    transition: transform var(--kima-duration-slow) var(--kima-curve-emphasized);

    @starting-style {
      transform: translateX(100%);
    }
  }

  &:not([open]) .kima-drawer__panel {
    transform: translateX(100%);
  }
}

/* ---- 左侧抽屉 ----
 * 面板贴左边，从左往右滑入，全高，最宽 420px。 */
.kima-drawer--left {
  justify-items: start;

  .kima-drawer__panel {
    height: 100%;
    width: min(var(--kima-drawer-max-width), 90vw);
    border-radius: 0 var(--kima-radius-xl) var(--kima-radius-xl) 0;
    transition: transform var(--kima-duration-slow) var(--kima-curve-emphasized);

    @starting-style {
      transform: translateX(-100%);
    }
  }

  &:not([open]) .kima-drawer__panel {
    transform: translateX(-100%);
  }
}

/* ---- 面板本体 ---- */
.kima-drawer__panel {
  box-sizing: border-box;
  overflow: auto;
  padding: 24px;
  outline: none;
  /* 弹层必须实色（kima-popup 给的就是实色底）。
   * 抽屉比对话框更大、盖住半屏，阴影用更高的 elevation-5 才托得住。 */
  @include kima-popup(large);

  box-shadow: var(--kima-elevation-5);
}

/* 拖拽把手：告诉用户"可以往下拖"。
 * 视觉上是一条 40×4 的短横，但命中区上下各撑开一圈，
 * 手指够得着（4px 的线本身点不准）。 */
.kima-drawer__handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 28px;
  margin: 0 auto var(--kima-space-3);
  cursor: grab;
  /* 在这块区域内，纵向手势不交给浏览器滚动，全部喂给拖拽逻辑。 */
  touch-action: none;

  /* 那条看得见的短横本身。 */
  &::before {
    content: "";
    width: 40px;
    height: 4px;
    border-radius: var(--kima-radius-full);
    background: var(--kima-color-on-surface-variant);
    opacity: 0.4;
  }

  &:active {
    cursor: grabbing;
  }

  &:active::before {
    opacity: 0.6;
  }
}

.kima-drawer__header,
.kima-drawer__footer {
  display: flex;
  align-items: center;
  gap: var(--kima-space-3);
}

.kima-drawer__header {
  justify-content: space-between;
}

.kima-drawer__heading {
  min-width: 0;
}

.kima-drawer__title {
  margin: 0;
  color: var(--kima-color-on-surface);
  font-size: var(--kima-font-size-xl);
  font-weight: var(--kima-font-weight-bold);
  line-height: 1.25;
}

.kima-drawer__header-slot {
  margin-top: var(--kima-space-2);
}

/* 关闭按钮：与 dialog 相同的尺寸和交互。 */
.kima-drawer__close {
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
  transition:
    background-color var(--kima-duration-effects) var(--kima-curve-standard),
    color var(--kima-duration-effects) var(--kima-curve-standard);

  &:hover {
    color: var(--kima-color-on-surface);
    background: var(--kima-color-layer-3);
  }

  &:focus-visible {
    outline: 2px solid var(--kima-color-primary);
    outline-offset: 2px;
  }
}

.kima-drawer__description,
.kima-drawer__body {
  margin: var(--kima-space-5) 0 0;
}

.kima-drawer__description {
  color: var(--kima-color-on-surface-variant);
  line-height: 1.5;
}

.kima-drawer__body {
  min-width: 0;
}

.kima-drawer__footer {
  justify-content: flex-end;
  margin-top: var(--kima-space-6);
}

/* 侧抽屉里 body 区要能竖向滚动（面板已经全高了）。 */
.kima-drawer--left,
.kima-drawer--right {
  .kima-drawer__panel {
    display: flex;
    flex-direction: column;
  }

  .kima-drawer__body {
    flex: 1 1 auto;
    overflow: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .kima-drawer__panel {
    transition-duration: 1ms;
  }

  .kima-drawer {
    transition-duration: 1ms;
  }
}
</style>
