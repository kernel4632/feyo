<!--
标签页：提供带底部指示条的标签栏、方向键切换和可访问的内容面板。
调用示例：
  <kima-tabs v-model="current" :items="tabs">
    <template #panel="{ item }">{{ item.content }}</template>
  </kima-tabs>
-->
<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, useId, watch } from "vue";

const props = defineProps({
  modelValue: {
    type: [String, Number, Boolean, Object, Array],
    default: null,
  },
  items: {
    type: Array,
    default: () => [],
  },
  orientation: {
    type: String,
    default: "horizontal",
  },
});

const emit = defineEmits(["update:modelValue", "change"]);

const tabButtons = ref([]);
const tabList = ref(null);
const localValue = shallowRef(props.modelValue);
const indicatorStyle = ref({ display: "none" });
let resizeObserver;
const tabsId = `kima-tabs-${useId()}`;

const tabOrientation = computed(() => props.orientation === "vertical" ? "vertical" : "horizontal");
const activeIndex = computed(() => {
  const selected = props.items.findIndex((item) => Object.is(itemValue(item), localValue.value) && !itemDisabled(item));
  if (selected >= 0) return selected;
  return props.items.findIndex((item) => !itemDisabled(item));
});

function itemValue(item) {
  return item && typeof item === "object" && Object.prototype.hasOwnProperty.call(item, "value")
    ? item.value
    : item;
}

function itemLabel(item) {
  if (item && typeof item === "object") {
    return String(item.label ?? item.text ?? item.title ?? item.value ?? "");
  }
  return String(item ?? "");
}

function itemDisabled(item) {
  return Boolean(item && typeof item === "object" && item.disabled);
}

function setTabRef(element, index) {
  tabButtons.value[index] = element;
}

function selectItem(item) {
  if (itemDisabled(item)) return;
  const value = itemValue(item);
  if (Object.is(value, localValue.value)) return;
  localValue.value = value;
  emit("update:modelValue", value);
  emit("change", value);
}

function enabledIndexFrom(start, step) {
  const count = props.items.length;
  if (!count) return -1;
  let index = start;
  for (let attempts = 0; attempts < count; attempts += 1) {
    if (index >= 0 && index < count && !itemDisabled(props.items[index])) return index;
    index = (index + step + count) % count;
  }
  return -1;
}

function focusAndSelect(index) {
  if (index < 0) return;
  const item = props.items[index];
  nextTick(() => tabButtons.value[index]?.focus());
  selectItem(item);
}

function handleKeydown(index, event) {
  if (event.isComposing) return;
  const horizontal = tabOrientation.value === "horizontal";
  const forward = horizontal ? event.key === "ArrowRight" : event.key === "ArrowDown";
  const backward = horizontal ? event.key === "ArrowLeft" : event.key === "ArrowUp";

  if (event.key === "Home") {
    event.preventDefault();
    focusAndSelect(enabledIndexFrom(0, 1));
    return;
  }
  if (event.key === "End") {
    event.preventDefault();
    focusAndSelect(enabledIndexFrom(props.items.length - 1, -1));
    return;
  }
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    selectItem(props.items[index]);
    return;
  }
  if (!forward && !backward) return;

  event.preventDefault();
  const step = forward ? 1 : -1;
  focusAndSelect(enabledIndexFrom((index + step + props.items.length) % props.items.length, step));
}

// Measure the selected button, including gaps, wrapped labels and container resizing.
function measureIndicator() {
  const button = tabButtons.value[activeIndex.value];
  if (!button || !tabList.value) {
    indicatorStyle.value = { display: "none" };
    return;
  }
  const list = tabList.value;
  const bounds = button.getBoundingClientRect();
  const listBounds = list.getBoundingClientRect();
  // DMS：指示条宽度取 标签宽 - 内缩 2×2，最小 24，并在标签内居中。
  const inset = 2;
  if (tabOrientation.value === "horizontal") {
    const width = Math.max(24, bounds.width - inset * 2);
    const left = bounds.left - listBounds.left + list.scrollLeft - list.clientLeft + (bounds.width - width) / 2;
    indicatorStyle.value = { left: `${left}px`, width: `${width}px` };
  } else {
    const height = Math.max(24, bounds.height - inset * 2);
    const top = bounds.top - listBounds.top + list.scrollTop - list.clientTop + (bounds.height - height) / 2;
    indicatorStyle.value = { top: `${top}px`, height: `${height}px` };
  }
}

function observeTabs() {
  resizeObserver?.disconnect();
  if (tabList.value) resizeObserver?.observe(tabList.value);
  for (const button of tabButtons.value) {
    if (button?.isConnected) resizeObserver?.observe(button);
  }
  measureIndicator();
}

watch(() => props.modelValue, (value) => { localValue.value = value; });
watch([activeIndex, tabOrientation, () => props.items], () => nextTick(observeTabs), { deep: true });
onMounted(() => {
  resizeObserver = new ResizeObserver(measureIndicator);
  observeTabs();
});
onBeforeUnmount(() => resizeObserver?.disconnect());
</script>

<template>
  <div
    class="kima-tabs"
    :class="`kima-tabs--${tabOrientation}`"
  >
    <div ref="tabList" class="kima-tabs__list" role="tablist" :aria-orientation="tabOrientation">
      <button
        v-for="(item, index) in items"
        :id="`${tabsId}-tab-${index}`"
        :key="itemValue(item) ?? index"
        :ref="(element) => setTabRef(element, index)"
        class="kima-tabs__tab"
        type="button"
        role="tab"
        :aria-selected="index === activeIndex"
        :aria-controls="`${tabsId}-panel-${index}`"
        :aria-disabled="itemDisabled(item) || undefined"
        :disabled="itemDisabled(item)"
        :tabindex="index === activeIndex ? 0 : -1"
        @click="selectItem(item)"
        @keydown="handleKeydown(index, $event)"
      >
        <slot name="tab" :item="item" :index="index" :selected="index === activeIndex">
          {{ itemLabel(item) }}
        </slot>
      </button>
      <span class="kima-tabs__indicator" :style="indicatorStyle" aria-hidden="true" />
    </div>

    <section
      v-for="(item, index) in items"
      :id="`${tabsId}-panel-${index}`"
      :key="index"
      class="kima-tabs__panel"
      role="tabpanel"
      :aria-labelledby="`${tabsId}-tab-${index}`"
      :hidden="index !== activeIndex"
      tabindex="0"
    >
      <slot v-if="index === activeIndex" name="panel" :item="item" :index="index" :value="localValue">
        <slot :item="item" :index="index" :value="localValue" />
      </slot>
    </section>
  </div>
</template>

<style scoped lang="scss">
.kima-tabs {
  --kima-tabs-height: 56px;
  --kima-tabs-gap: 16px;
  --kima-tabs-indicator-height: 3px;

  display: flex;
  min-width: 0;
  color: var(--kima-color-on-surface);
  font-family: var(--kima-font-family);

  &--horizontal {
    flex-direction: column;
  }

  &--vertical {
    --kima-tabs-height: 48px;
    flex-direction: row;
    gap: var(--kima-tabs-gap);
  }
}

.kima-tabs__list {
  position: relative;
  display: flex;
  min-width: 0;
  gap: var(--kima-tabs-gap);
  border-bottom: 1px solid var(--kima-color-outline-variant);

  .kima-tabs--vertical & {
    flex-direction: column;
    width: 180px;
    flex: 0 0 180px;
    border-right: 1px solid var(--kima-color-outline-variant);
    border-bottom: 0;
  }
}

.kima-tabs__tab {
  box-sizing: border-box;
  position: relative;
  display: inline-flex;
  min-width: 64px;
  /* DMS：标签高度 = 标签栏高 56 - 指示条高 3。 */
  min-height: calc(var(--kima-tabs-height) - var(--kima-tabs-indicator-height));
  flex: 1 1 0;
  align-items: center;
  justify-content: center;
  padding: 0 var(--kima-space-3);
  border: 0;
  border-radius: var(--kima-radius-m);
  color: var(--kima-color-on-surface-variant);
  background: var(--kima-color-transparent);
  font: inherit;
  font-size: var(--kima-font-size-medium);
  font-weight: var(--kima-font-weight-medium);
  cursor: pointer;
  transition:
    color var(--kima-duration-effects) var(--kima-ease-effects),
    background-color var(--kima-duration-effects) var(--kima-ease-effects);

  /* DMS 状态层：primary 悬停 8%、按下 12%。 */
  &:hover:not(:disabled) {
    background: color-mix(in srgb, var(--kima-color-primary) 8%, var(--kima-color-transparent));
  }

  &:active:not(:disabled) {
    background: color-mix(in srgb, var(--kima-color-primary) 12%, var(--kima-color-transparent));
  }

  &:focus-visible {
    outline: var(--kima-focus-ring-width) solid var(--kima-color-primary);
    outline-offset: var(--kima-focus-ring-offset);
  }

  &[aria-selected="true"] {
    color: var(--kima-color-primary);
  }

  &:disabled {
    cursor: not-allowed;
    color: var(--kima-color-on-surface-38);
  }

  .kima-tabs--vertical & {
    flex: 0 0 auto;
    min-height: 48px;
    justify-content: flex-start;
    border-radius: var(--kima-radius-m);
  }
}

.kima-tabs__indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  min-width: 24px;
  height: var(--kima-tabs-indicator-height);
  /* DMS：指示条上圆角 cornerRadiusS 8。 */
  border-radius: var(--kima-radius-s) var(--kima-radius-s) 0 0;
  background: var(--kima-color-primary);
  pointer-events: none;
}

.kima-tabs__panel {
  min-width: 0;
  flex: 1 1 auto;
  padding-top: var(--kima-tabs-gap);
  outline: none;

  &:focus-visible {
    outline: 2px solid var(--kima-color-primary);
    outline-offset: 2px;
  }

  .kima-tabs--vertical & {
    padding-top: 0;
  }
}

.kima-tabs--vertical .kima-tabs__indicator {
  top: 0;
  right: 0;
  bottom: auto;
  left: auto;
  width: var(--kima-tabs-indicator-height);
  border-radius: 0 var(--kima-radius-s) var(--kima-radius-s) 0;
  transform: none;
}

@media (max-width: 560px) {
  .kima-tabs__list {
    gap: var(--kima-space-1);
  }

  .kima-tabs__tab {
    padding-inline: var(--kima-space-2);
    font-size: var(--kima-font-size-sm);
  }
}
</style>
