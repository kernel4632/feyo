<!--
标签页：提供带底部指示条的标签栏、方向键切换和可访问的内容面板。
调用示例：
  <feyo-tabs v-model="current" :items="tabs">
    <template #panel="{ item }">{{ item.content }}</template>
  </feyo-tabs>
-->
<script setup>
import { computed, nextTick, ref, useId } from "vue";

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
const tabsId = `feyo-tabs-${useId()}`;

const tabOrientation = computed(() => props.orientation === "vertical" ? "vertical" : "horizontal");
const activeIndex = computed(() => {
  const selected = props.items.findIndex((item) => itemValue(item) === props.modelValue && !itemDisabled(item));
  if (selected >= 0) return selected;
  return props.items.findIndex((item) => !itemDisabled(item));
});
const activeItem = computed(() => props.items[activeIndex.value] || null);
const panelId = `${tabsId}-panel`;

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
  if (element) tabButtons.value[index] = element;
}

function selectItem(item) {
  if (itemDisabled(item)) return;
  const value = itemValue(item);
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
</script>

<template>
  <div
    class="feyo-tabs"
    :class="`feyo-tabs--${tabOrientation}`"
    :style="{
      '--feyo-tabs-count': Math.max(1, items.length),
      '--feyo-active-index': Math.max(0, activeIndex),
    }"
  >
    <div class="feyo-tabs__list" role="tablist" :aria-orientation="tabOrientation">
      <button
        v-for="(item, index) in items"
        :id="`${tabsId}-tab-${index}`"
        :key="itemValue(item) ?? index"
        :ref="(element) => setTabRef(element, index)"
        class="feyo-tabs__tab"
        type="button"
        role="tab"
        :aria-selected="index === activeIndex"
        :aria-controls="panelId"
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
      <span class="feyo-tabs__indicator" aria-hidden="true" />
    </div>

    <section
      :id="panelId"
      class="feyo-tabs__panel"
      role="tabpanel"
      :aria-labelledby="activeIndex >= 0 ? `${tabsId}-tab-${activeIndex}` : undefined"
      tabindex="0"
    >
      <slot name="panel" :item="activeItem" :index="activeIndex" :value="modelValue">
        <slot :item="activeItem" :index="activeIndex" :value="modelValue" />
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
    min-height: 48px;
    justify-content: flex-start;
    border-radius: var(--feyo-radius-sm) 0 0 var(--feyo-radius-sm);
  }
}

.feyo-tabs__indicator {
  position: absolute;
  bottom: 0;
  left: calc((100% / var(--feyo-tabs-count)) * var(--feyo-active-index, 0));
  width: calc(100% / var(--feyo-tabs-count));
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
  top: calc(var(--feyo-tabs-height) * var(--feyo-active-index, 0));
  right: 0;
  bottom: auto;
  left: auto;
  width: var(--feyo-tabs-indicator-height);
  height: var(--feyo-tabs-height);
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
