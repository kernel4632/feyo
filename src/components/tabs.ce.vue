<!--
标签页：提供带底部指示条的标签栏、方向键切换和可访问的内容面板。
调用示例：
  <feyo-tabs v-model="current" :items="tabs">
    <template #panel="{ item }">{{ item.content }}</template>
  </feyo-tabs>
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
const tabsId = `feyo-tabs-${useId()}`;

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
  indicatorStyle.value = tabOrientation.value === "horizontal"
    ? { left: `${bounds.left - listBounds.left + list.scrollLeft - list.clientLeft}px`, width: `${bounds.width}px` }
    : { top: `${bounds.top - listBounds.top + list.scrollTop - list.clientTop}px`, height: `${bounds.height}px` };
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
    class="feyo-tabs"
    :class="`feyo-tabs--${tabOrientation}`"
  >
    <div ref="tabList" class="feyo-tabs__list" role="tablist" :aria-orientation="tabOrientation">
      <button
        v-for="(item, index) in items"
        :id="`${tabsId}-tab-${index}`"
        :key="itemValue(item) ?? index"
        :ref="(element) => setTabRef(element, index)"
        class="feyo-tabs__tab"
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
      <span class="feyo-tabs__indicator" :style="indicatorStyle" aria-hidden="true" />
    </div>

    <section
      v-for="(item, index) in items"
      :id="`${tabsId}-panel-${index}`"
      :key="index"
      class="feyo-tabs__panel"
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
.feyo-tabs {
  --feyo-tabs-height: 56px;
  --feyo-tabs-gap: 16px;
  --feyo-tabs-indicator-height: 3px;

  display: flex;
  min-width: 0;
  color: var(--feyo-color-on-surface);
  font-family: var(--feyo-font-family);

  &--horizontal {
    flex-direction: column;
  }

  &--vertical {
    --feyo-tabs-height: 48px;
    flex-direction: row;
    gap: var(--feyo-tabs-gap);
  }
}

.feyo-tabs__list {
  position: relative;
  display: flex;
  min-width: 0;
  gap: var(--feyo-tabs-gap);
  border-bottom: 1px solid var(--feyo-color-outline);

  .feyo-tabs--vertical & {
    flex-direction: column;
    width: 180px;
    flex: 0 0 180px;
    border-right: 1px solid var(--feyo-color-outline);
    border-bottom: 0;
  }
}

.feyo-tabs__tab {
  box-sizing: border-box;
  position: relative;
  display: inline-flex;
  min-width: 0;
  min-height: var(--feyo-tabs-height);
  flex: 1 1 0;
  align-items: center;
  justify-content: center;
  padding: 0 var(--feyo-space-4);
  border: 0;
  border-radius: var(--feyo-radius-sm) var(--feyo-radius-sm) 0 0;
  color: var(--feyo-color-on-surface-variant);
  background: var(--feyo-color-transparent);
  font: inherit;
  font-weight: var(--feyo-font-weight-medium);
  cursor: pointer;
  transition: color var(--feyo-duration-fast) var(--feyo-ease-standard), background-color var(--feyo-duration-fast) var(--feyo-ease-standard);

  &:hover:not(:disabled),
  &:focus-visible {
    color: var(--feyo-color-on-surface);
    background: var(--feyo-color-surface-container-high);
  }

  &:focus-visible {
    outline: 2px solid var(--feyo-color-primary);
    outline-offset: -2px;
  }

  &[aria-selected="true"] {
    color: var(--feyo-color-primary);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: var(--feyo-opacity-disabled);
  }

  .feyo-tabs--vertical & {
    flex: 0 0 auto;
    min-height: 48px;
    justify-content: flex-start;
    border-radius: var(--feyo-radius-sm) 0 0 var(--feyo-radius-sm);
  }
}

.feyo-tabs__indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  height: var(--feyo-tabs-indicator-height);
  border-radius: var(--feyo-radius-full) var(--feyo-radius-full) 0 0;
  background: var(--feyo-color-primary);
  pointer-events: none;
}

.feyo-tabs__panel {
  min-width: 0;
  flex: 1 1 auto;
  padding-top: var(--feyo-tabs-gap);
  outline: none;

  &:focus-visible {
    outline: 2px solid var(--feyo-color-primary);
    outline-offset: 2px;
  }

  .feyo-tabs--vertical & {
    padding-top: 0;
  }
}

.feyo-tabs--vertical .feyo-tabs__indicator {
  top: 0;
  right: 0;
  bottom: auto;
  left: auto;
  width: var(--feyo-tabs-indicator-height);
  border-radius: 0 var(--feyo-radius-full) var(--feyo-radius-full) 0;
  transform: none;
}

@media (max-width: 560px) {
  .feyo-tabs__list {
    gap: var(--feyo-space-1);
  }

  .feyo-tabs__tab {
    padding-inline: var(--feyo-space-2);
    font-size: var(--feyo-font-size-sm);
  }
}
</style>
