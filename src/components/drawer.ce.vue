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

  // 带吸附点的底部抽屉：给几档高度，拖到哪就近吸到哪
  <kima-drawer v-model:open="open" title="操作" :snap-points="[0.4, 0.9]">...</kima-drawer>

placement 可选值：bottom（默认）| left | right
底部抽屉从顶部的拖拽把手往下拖可以关闭（拖过面板高度 40% 即触发）；
把手以外的地方照常滚动、选字，不会被拖拽抢走。
给了 snapPoints 就是吸附模式：往上拖长高、往下拖变矮，松手吸到最近一档，
拖过最矮一档的 40% 才关闭。第一档是打开时的默认高度。
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
  // 底部抽屉的多档高度，按视口高度的比例给，例如 [0.4, 0.9]。
  // 只对底部抽屉生效；侧抽屉是全高的，没有档位可言。
  snapPoints: {
    type: Array,
    default: () => [],
  },
  // 当前档位（比例值）。不传就自己管；传了就听调用方的，配合 v-model:active-snap-point。
  activeSnapPoint: {
    type: Number,
    default: null,
  },
});

const emit = defineEmits(["update:open", "close", "update:activeSnapPoint"]);
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
// ---- 拖拽与吸附（仅底部抽屉）----
// 两种模式走同一条路径：
//   没给 snapPoints —— 一档（打开时的高度），往下拖过 40% 关闭；
//   给了 snapPoints —— 多档，拖到哪就近吸到哪，拖过最矮一档的 40% 关闭。
// 拖动过程中面板实时跟手，松手才落地到某一档：半路不跳档，手感是连续的。
// 拖拽只挂在把手上，不挂整块面板：正文要能选字、要能竖向滚动，
// 整块接拖拽会把这两件事一起抢掉（触摸端尤其明显）。
const dragOffset = ref(0);
const isDragging = ref(false);
let pointerStartY = 0;

// 档位去重、排序、夹到 (0, 1]：写反或写重的输入不该出错。
const snaps = computed(() => {
  if (placement.value !== "bottom" || !props.snapPoints.length) return [];
  return [...new Set(props.snapPoints.map(Number))]
    .filter((value) => Number.isFinite(value) && value > 0 && value <= 1)
    .sort((a, b) => a - b);
});

// 当前档位。调用方传了 activeSnapPoint 就听调用方的，否则自己管。
const innerSnap = ref(null);
const currentSnap = computed(() => {
  if (props.activeSnapPoint != null) return props.activeSnapPoint;
  if (innerSnap.value != null) return innerSnap.value;
  return snaps.value[0] ?? null;
});

// 视口高随窗口变化：用 ref 才能让依赖它的高度计算跟着重算。
const viewportHeight = ref(typeof window === "undefined" ? 0 : window.innerHeight);
function onViewportResize() {
  viewportHeight.value = window.innerHeight;
}

// 吸附模式下面板的像素高度：正在拖就按位移算，否则按当前档位算。
// 单档模式不吃 height，靠 CSS 的 max-height + 内容撑开，这里返回 null。
const panelHeightPx = computed(() => {
  if (placement.value !== "bottom" || currentSnap.value == null) return null;
  const rest = currentSnap.value * viewportHeight.value;
  return isDragging.value ? Math.max(0, rest - dragOffset.value) : rest;
});

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
  // 吸附模式向上拖是负数（长高），两个方向都跟手；
  // 单档模式向上拉不动，只往下走（关闭方向）。
  dragOffset.value = snaps.value.length ? delta : Math.max(0, delta);
}

function onDragEnd() {
  if (!isDragging.value) return;
  isDragging.value = false;
  const delta = dragOffset.value;
  dragOffset.value = 0;
  if (placement.value !== "bottom") return;

  if (!snaps.value.length) {
    // 单档：拖过自身高的 40% 就关。
    const height = panel.value?.offsetHeight ?? 300;
    if (delta > height * 0.4) close("drag");
    return;
  }

  // 多档：把离手时的高度换算成比例，找最近的一档。
  const viewport = viewportHeight.value || 1;
  const height = currentSnap.value * viewport - delta;
  const lowest = snaps.value[0] * viewport;
  // 比最矮一档还矮、且超了它自身高的 40%：当成"拖出去了"，关闭。
  if (height < lowest * 0.6) {
    close("drag");
    return;
  }
  const nearest = snaps.value.reduce((best, snap) =>
    Math.abs(snap * viewport - height) < Math.abs(best * viewport - height) ? snap : best
  );
  setSnap(nearest);
}

function setSnap(snap) {
  innerSnap.value = snap;
  emit("update:activeSnapPoint", snap);
}

// 面板的内联样式。只在"需要时才写"，其余交给 CSS：
//   1. 进出场位移（从屏幕外滑进来那一段）；
//   2. 拖拽跟手、吸附档位高度。
// 不需要时返回空对象，让 CSS 的常态规则说了算——
// "面板在终点位置"只有一个来源，不会两边打架。
const panelStyle = computed(() => {
  // 进出场位移。两段的差别就在 transition 上：
  //   入场开头那一帧必须"瞬移"到屏幕外（transition: none）——
  //     不禁的话，浏览器会把它当成"从 0 过渡到 392px"，面板先当着人面滑出去、
  //     再滑回来，看起来就是"从中间出现、往外滑"。
  //   退场正好相反：就是要过渡着滑出去。
  if (stage.value) {
    return {
      transform: shiftFrom.value,
      transition: stage.value === "entering" ? "none" : undefined,
    };
  }
  if (placement.value !== "bottom") return {};
  if (snaps.value.length) {
    const height = panelHeightPx.value;
    if (height == null) return {};
    return {
      height: `${height}px`,
      transition: isDragging.value ? "none" : undefined,
    };
  }
  if (dragOffset.value === 0) return {};
  return {
    transform: `translateY(${dragOffset.value}px)`,
    transition: isDragging.value ? "none" : undefined,
  };
});

// ---- 进出场动画 ----
// 面板从哪一侧滑进来：起点在它自己那一侧的屏幕外。
// 方向 → 位移只在这里算一次，三个方向共用同一条动画路径。
// 之前每个方向各写一份 CSS 起始态，加方向要记得补两处（进、出），
// 漏一处就有一个方向错——"右边抽屉从中间往右滑"就是这么来的。
//
// 为什么位移用像素、不用 100%：
// dialog 从 display:none 变可见的那一帧元素还没有布局盒，百分比位移解析不出结果，
// 浏览器退化成 0——现象就是"面板先在终点位置闪一下，然后才开始滑"（用户看到的
// "从中间出现"）。像素值不依赖布局盒，什么时候写都是同一个数。
// 尺寸要 showModal 之后才量得到，所以起点在这里量、由 enterDialog 调用。
const shiftFrom = ref("translateY(100%)");

function measureShift() {
  const element = panel.value;
  if (!element) return;
  const { width, height } = element.getBoundingClientRect();
  if (placement.value === "bottom") shiftFrom.value = `translateY(${height}px)`;
  else if (placement.value === "right") shiftFrom.value = `translateX(${width}px)`;
  else shiftFrom.value = `translateX(-${width}px)`;
}

// 面板当前处在哪一段："" 常态 / "entering" 在屏幕外待入场 / "leaving" 正在退场。
// 一个字符串同时给样式（类名）和内联样式（panelStyle 的位移）用，两边不会跑偏。
const stage = ref("");
const stageClass = computed(() => (stage.value ? `kima-drawer--${stage.value}` : ""));
let playToken = 0;

// ---- 打开时锁住页面滚动 ----
// 不锁的话：抽屉盖着的页面还能滚，背景会跟着动（和遮罩"聚焦当前内容"的意图相反）。
// 光设 overflow: hidden 会带来一个副作用：页面原本有滚动条的话，它一消失，
// 视口宽出来十几像素，整页内容横向抖一下（看起来就是"页面晃了一下"）。
// 所以把滚动条占掉的宽度记下来，用 padding-right 补回去，内容位置不动。
let scrollLocked = false;
let lockedPadding = "";

function lockPageScroll(locked) {
  if (locked === scrollLocked) return;
  scrollLocked = locked;
  const root = document.documentElement;
  if (locked) {
    // innerWidth 含滚动条，clientWidth 不含，两者之差就是滚动条宽度。
    const gutter = window.innerWidth - root.clientWidth;
    lockedPadding = root.style.paddingRight;
    if (gutter > 0) root.style.paddingRight = `${gutter}px`;
    root.style.overflowY = "hidden";
  } else {
    root.style.overflowY = "";
    root.style.paddingRight = lockedPadding;
    lockedPadding = "";
  }
}

// 等两帧：第一帧把刚加上的类落到样式里，第二帧才真的绘制。
// 只等一帧时起点和终点可能被合并进同一次绘制，动画就看不见了（表现为"瞬间出现"）。
function nextFrame() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

// 读 token 拿时长，不在这里另写数字：token 是全库动效的唯一来源。
function slideDuration() {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--kima-duration-slow").trim();
  if (!raw) return 300;
  const value = raw.endsWith("ms") ? parseFloat(raw) : parseFloat(raw) * 1000;
  return Number.isFinite(value) ? value : 300;
}

async function enterDialog() {
  const element = dialog.value;
  if (!element || element.open) return;
  const token = ++playToken;
  // 先锁滚动再 showModal：顺序反了的话，中间那一下页面是能滚的。
  lockPageScroll(true);
  element.showModal();
  // 量出面板尺寸当起点位移（像素值，不依赖布局盒百分比）。
  measureShift();
  // 起点：面板停在屏幕外。等两帧确保这一帧真的画出来了，
  // 再清掉 stage 让 CSS 过渡把它送回终点——这样才有"滑进来"的过程。
  stage.value = "entering";
  await nextFrame();
  // 这两帧之间被关掉了就别再往下走，否则会把正在退场的东西又推回终点。
  if (token !== playToken || stage.value !== "entering") return;
  stage.value = "";
}

async function leaveDialog() {
  const element = dialog.value;
  if (!element?.open) return;
  const token = ++playToken;
  stage.value = "leaving";
  await new Promise((resolve) => setTimeout(resolve, slideDuration()));
  // 退场途中又被重新打开（快速连点）时，别把刚打开的面板关掉。
  if (token !== playToken) return;
  stage.value = "";
  if (element.open) element.close();
  lockPageScroll(false);
}

// ---- 开关 ----
function close(reason = "close") {
  if (!localOpen.value) return;
  dragOffset.value = 0;
  // 吸附模式下关掉再打开，回到第一档（最矮那档），而不是留在上次拖到的高度。
  if (snaps.value.length && props.activeSnapPoint == null) innerSnap.value = null;
  localOpen.value = false;
  emit("update:open", false);
  emit("close", reason);
}

function syncDialog() {
  if (!dialog.value) return;
  if (localOpen.value) enterDialog();
  else leaveDialog();
}

function handleCancel(event) {
  event.preventDefault();
  if (props.closeOnEscape) close("escape");
}

function handleNativeClose() {
  // 原生关掉（比如浏览器自己触发）时也要解锁页面滚动。
  if (!dialog.value.open) {
    lockPageScroll(false);
    close("native");
  }
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
onMounted(() => {
  syncDialog();
  window.addEventListener("resize", onViewportResize);
});
onBeforeUnmount(() => {
  window.removeEventListener("resize", onViewportResize);
  if (dialog.value?.open) dialog.value.close();
  // 组件被直接卸载（宿主移除节点、路由切走）时也要解锁，否则页面永远滚不动。
  lockPageScroll(false);
});
</script>

<template>
  <dialog
    ref="dialog"
    v-bind="forwardedAttrs"
    :title="undefined"
    class="kima-drawer"
    :class="[
      `kima-drawer--${placement}`,
      { 'kima-drawer--snapping': snaps.length > 0 },
      stageClass,
    ]"
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

  /* 遮罩跟面板一起走同一条进出场：JS 上了类就是起点（透明），
   * 摘掉类就是终点（不透明），中间由上面的 transition 播。 */
  &.kima-drawer--entering::backdrop,
  &.kima-drawer--leaving::backdrop {
    opacity: 0;
  }
}

/* ---- 三个方向 ----
 * 每个方向只声明两件事：面板贴哪一边、面板长什么样。
 * "从哪滑进来"由 --kima-drawer-shift 一个变量承载（见下面"滑入/滑出"），
 * 不再每个方向写一份起始态——加方向时不会漏掉其中一处。 */
.kima-drawer--bottom {
  align-items: end;

  .kima-drawer__panel {
    width: 100%;
    max-height: 90dvh;
    border-radius: var(--kima-radius-xl) var(--kima-radius-xl) 0 0;
    /* height 也进过渡：吸附模式换档要有段落感，不能瞬移。 */
    transition:
      transform var(--kima-duration-slow) var(--kima-curve-emphasized),
      height var(--kima-duration-slow) var(--kima-spring-snappy);
  }

  /* 吸附模式（JS 写了 height）：高度就是这个档位，max-height 让位。
   * 面板改成纵向排布，正文吃掉剩余高度并自己滚，档位不会被内容顶破。 */
  &.kima-drawer--snapping .kima-drawer__panel {
    max-height: none;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  &.kima-drawer--snapping .kima-drawer__body {
    flex: 1 1 auto;
    overflow: auto;
  }

  --kima-drawer-shift: translateY(100%);
}

.kima-drawer--right {
  justify-items: end;

  .kima-drawer__panel {
    height: 100%;
    width: min(var(--kima-drawer-max-width), 90vw);
    border-radius: var(--kima-radius-xl) 0 0 var(--kima-radius-xl);
    transition: transform var(--kima-duration-slow) var(--kima-curve-emphasized);
  }

  --kima-drawer-shift: translateX(100%);
}

.kima-drawer--left {
  justify-items: start;

  .kima-drawer__panel {
    height: 100%;
    width: min(var(--kima-drawer-max-width), 90vw);
    border-radius: 0 var(--kima-radius-xl) var(--kima-radius-xl) 0;
    transition: transform var(--kima-duration-slow) var(--kima-curve-emphasized);
  }

  --kima-drawer-shift: translateX(-100%);
}

/* ---- 滑入 / 滑出 ----
 * 两条规则，三个方向共用：把面板挪到屏幕外，或者挪回原位。
 * 面板本身始终是"在终点位置"的常态，位移全靠这个变量——
 * 所以不存在"先出现在中间再滑走"的中间态可言。
 *
 * 进入（--entering）和离开（--leaving）由 JS 加上/摘掉：
 * 加上是起点，摘掉就是终点，中间由上面每个方向的 transition 接管。 */
.kima-drawer--entering .kima-drawer__panel,
.kima-drawer--leaving .kima-drawer__panel {
  transform: var(--kima-drawer-shift);
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
