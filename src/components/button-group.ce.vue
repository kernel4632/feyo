<!--
按钮组：把一组项目渲染成单选、多选或标签页，并提供方向键移动焦点。
调用示例：
  <feyo-button-group v-model="view" :items="views" />
  <feyo-button-group v-model="filters" :items="filters" multiple orientation="vertical" />
  <feyo-button-group v-model="tab" :items="tabs" role="tablist" />
-->
<script setup>
import { computed, getCurrentInstance, nextTick, ref, shallowRef, useAttrs, watch } from "vue";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  modelValue: {
    type: [String, Number, Array, Boolean, Object],
    default: null,
  },
  multiple: Boolean,
  orientation: {
    type: String,
    default: "horizontal",
  },
  size: {
    type: String,
    default: "default",
  },
});

const emit = defineEmits(["update:modelValue", "change"]);
const attrs = useAttrs();
const isCustomElement = Boolean(getCurrentInstance()?.ce);
const forwardedAttrs = computed(() => isCustomElement ? { ...attrs, id: undefined } : attrs);
const buttons = ref([]);
const localValue = shallowRef(props.modelValue);
const focusedIndex = ref(-1);
watch(() => props.modelValue, (value) => { localValue.value = value; });

const groupOrientation = computed(() =>
  props.orientation === "vertical" ? "vertical" : "horizontal",
);
const groupSize = computed(() => {
  const sizes = ["small", "default", "large"];
  return sizes.includes(props.size) ? props.size : "default";
});
const groupRole = computed(() =>
  attrs.role === "tablist" ? "tablist" : "group",
);
const selectedValues = computed(() =>
  props.multiple ? (Array.isArray(localValue.value) ? localValue.value : []) : [localValue.value],
);
const firstEnabledIndex = computed(() => props.items.findIndex((item) => !item.disabled));
const activeIndex = computed(() => {
  if (focusedIndex.value >= 0 && props.items[focusedIndex.value] && !props.items[focusedIndex.value].disabled) return focusedIndex.value;
  const selectedIndex = props.items.findIndex((item) => isSelected(item) && !item.disabled);
  return selectedIndex >= 0 ? selectedIndex : firstEnabledIndex.value;
});

function isSelected(item) {
  return selectedValues.value.some((value) => Object.is(value, item.value));
}

function setButtonRef(element, index) {
  buttons.value[index] = element;
}

function select(item) {
  if (item.disabled) return;

  if (props.multiple) {
    const values = [...selectedValues.value];
    const index = values.findIndex((value) => Object.is(value, item.value));
    if (index >= 0) values.splice(index, 1);
    else values.push(item.value);
    localValue.value = values;
    emit("update:modelValue", values);
    emit("change", values);
    return;
  }

  if (Object.is(item.value, localValue.value)) return;
  localValue.value = item.value;
  emit("update:modelValue", item.value);
  emit("change", item.value);
}

function focusItem(index, selectOnMove = false) {
  const item = props.items[index];
  if (!item || item.disabled) return;
  nextTick(() => buttons.value[index]?.focus());
  if (selectOnMove) select(item);
}

function moveFocus(index, event) {
  if (event.isComposing) return;
  const forward = groupOrientation.value === "horizontal"
    ? event.key === "ArrowRight"
    : event.key === "ArrowDown";
  const backward = groupOrientation.value === "horizontal"
    ? event.key === "ArrowLeft"
    : event.key === "ArrowUp";

  if (event.key === "Home") {
    event.preventDefault();
    focusItem(firstEnabledIndex.value, groupRole.value === "tablist");
    return;
  }
  if (event.key === "End") {
    event.preventDefault();
    for (let last = props.items.length - 1; last >= 0; last -= 1) {
      if (!props.items[last].disabled) {
        focusItem(last, groupRole.value === "tablist");
        return;
      }
    }
  }
  if (!forward && !backward) return;

  event.preventDefault();
  let next = index;
  for (let step = 0; step < props.items.length; step += 1) {
    next = forward
      ? (next + 1) % props.items.length
      : (next - 1 + props.items.length) % props.items.length;
    if (!props.items[next].disabled) {
      focusItem(next, groupRole.value === "tablist");
      return;
    }
  }
}
</script>

<template>
  <div
    class="feyo-button-group"
    :class="[
      `feyo-button-group--${groupOrientation}`,
      `feyo-button-group--${groupSize}`,
    ]"
     v-bind="forwardedAttrs"
    :role="groupRole"
    :aria-orientation="groupRole === 'tablist' ? groupOrientation : undefined"
  >
    <button
      v-for="(item, index) in items"
      :key="item.value"
      :ref="(element) => setButtonRef(element, index)"
      class="feyo-button-group__item"
      :class="{ 'feyo-button-group__item--selected': isSelected(item) }"
      type="button"
      :disabled="item.disabled"
      :role="groupRole === 'tablist' ? 'tab' : undefined"
      :aria-selected="groupRole === 'tablist' ? isSelected(item) : undefined"
      :aria-pressed="groupRole === 'group' ? isSelected(item) : undefined"
      :tabindex="index === activeIndex ? 0 : -1"
      @click="select(item)"
      @focus="focusedIndex = index"
      @keydown="moveFocus(index, $event)"
    >
      <slot :item="item" :index="index" :selected="isSelected(item)">{{ item.label }}</slot>
    </button>
  </div>
</template>

<style scoped lang="scss">
.feyo-button-group {
  display: inline-flex;
  align-items: stretch;
  color: var(--feyo-color-on-surface);
  font-family: var(--feyo-font-family);

  &--vertical {
    flex-direction: column;
  }
}

.feyo-button-group__item {
  box-sizing: border-box;
  min-width: 64px;
  min-height: 40px;
  padding: 0 var(--feyo-space-4);
  border: 1px solid var(--feyo-color-outline);
  color: var(--feyo-color-on-surface);
  background: var(--feyo-color-transparent);
  font: inherit;
  font-size: var(--feyo-font-size-md);
  cursor: pointer;
  transition:
    background-color var(--feyo-duration-fast) var(--feyo-ease-standard),
    border-color var(--feyo-duration-fast) var(--feyo-ease-standard),
    opacity var(--feyo-duration-fast) var(--feyo-ease-standard);

  &:first-child {
    border-radius: var(--feyo-radius-full) 0 0 var(--feyo-radius-full);
  }

  &:last-child {
    border-radius: 0 var(--feyo-radius-full) var(--feyo-radius-full) 0;
  }

  & + & {
    margin-left: -1px;
  }

  &:hover:not(:disabled) {
    background: var(--feyo-color-surface-container-high);
  }

  &:focus-visible {
    position: relative;
    z-index: 1;
    outline: 2px solid var(--feyo-color-primary);
    outline-offset: 2px;
  }

  &:disabled {
    opacity: var(--feyo-opacity-disabled);
    cursor: not-allowed;
  }

  &--selected {
    border-color: var(--feyo-color-primary);
    color: var(--feyo-color-on-primary-container);
    background: var(--feyo-color-primary-container);
  }
}

.feyo-button-group--vertical .feyo-button-group__item {
  &:first-child {
    border-radius: var(--feyo-radius-full) var(--feyo-radius-full) 0 0;
  }

  &:last-child {
    border-radius: 0 0 var(--feyo-radius-full) var(--feyo-radius-full);
  }

  & + & {
    margin-top: -1px;
    margin-left: 0;
  }
}

.feyo-button-group--small .feyo-button-group__item {
  min-width: 56px;
  min-height: 32px;
  padding-inline: var(--feyo-space-3);
  font-size: var(--feyo-font-size-sm);
}

.feyo-button-group--large .feyo-button-group__item {
  min-height: 48px;
  padding-inline: var(--feyo-space-5);
}
</style>
