<!--
按钮组：把一组项目渲染成单选、多选或标签页，并提供方向键移动焦点。
调用示例：
  <feyo-button-group v-model="view" :items="views" />
  <feyo-button-group v-model="filters" :items="filters" multiple orientation="vertical" />
  <feyo-button-group v-model="tab" :items="tabs" role="tablist" />
-->
<script setup>
import { computed, getCurrentInstance, nextTick, ref, shallowRef, useAttrs, watch } from "vue";
import { HugeiconsIcon } from "@hugeicons/vue";
import { Tick02Icon } from "@hugeicons/core-free-icons";

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
      <span v-if="isSelected(item)" class="feyo-button-group__check" aria-hidden="true">
        <HugeiconsIcon :icon="Tick02Icon" :size="16" />
      </span>
      <slot :item="item" :index="index" :selected="isSelected(item)">{{ item.label }}</slot>
    </button>
  </div>
</template>

<style scoped lang="scss">
@use "../styles/mixins" as *;

.feyo-button-group {
  /* DMS：段与段之间间隙 groupedListGap = spacingXXS 2。 */
  display: inline-flex;
  align-items: stretch;
  gap: var(--feyo-space-xxs);
  color: var(--feyo-color-on-surface);
  font-family: var(--feyo-font-family);

  &--vertical {
    flex-direction: column;
  }
}

.feyo-button-group__item {
  box-sizing: border-box;
  /* DMS 中等档：高 40、最小宽 64、内边距 16、圆角 S 8。 */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--feyo-space-s);
  min-width: 64px;
  min-height: 40px;
  padding: 0 var(--feyo-space-l);
  border: 0;
  border-radius: var(--feyo-radius-s);
  color: var(--feyo-color-on-secondary-container);
  background: var(--feyo-color-secondary-container);
  font: inherit;
  font-size: var(--feyo-font-size-medium);
  font-weight: var(--feyo-font-weight-medium);
  cursor: pointer;
  transition:
    background-color var(--feyo-duration-expressive-effects) var(--feyo-curve-expressive-effects),
    color var(--feyo-duration-expressive-effects) var(--feyo-curve-expressive-effects),
    border-radius var(--feyo-duration-expressive-fast-spatial) var(--feyo-curve-standard);

  @include feyo-state-layer;
  @include feyo-focus-ring;

  /* DMS 首末段外侧取整圆，内侧取 S 8。 */
  &:first-child {
    border-radius: var(--feyo-radius-full) var(--feyo-radius-s) var(--feyo-radius-s) var(--feyo-radius-full);
  }

  &:last-child {
    border-radius: var(--feyo-radius-s) var(--feyo-radius-full) var(--feyo-radius-full) var(--feyo-radius-s);
  }

  /* DMS 按下时内侧圆角收成 XS 4。 */
  &:active:not(:disabled) {
    border-radius: var(--feyo-radius-xs);
  }

  /* DMS 禁用：底色 onSurface_12，文字 onSurface_38。 */
  &:disabled {
    color: var(--feyo-color-on-surface-38);
    background: var(--feyo-color-on-surface-12);
    cursor: not-allowed;
  }
}

/* DMS 选中段：变整圆 primary 药丸；两段类名确保压过首末段圆角。 */
.feyo-button-group__item.feyo-button-group__item--selected {
  border-radius: var(--feyo-radius-full);
  color: var(--feyo-color-on-primary);
  background: var(--feyo-color-primary);
}

.feyo-button-group__item.feyo-button-group__item--selected:active:not(:disabled) {
  border-radius: var(--feyo-radius-xs);
}

.feyo-button-group__check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* 纵向：首段圆上角，末段圆下角。 */
.feyo-button-group--vertical .feyo-button-group__item:first-child {
  border-radius: var(--feyo-radius-full) var(--feyo-radius-full) var(--feyo-radius-s) var(--feyo-radius-s);
}

.feyo-button-group--vertical .feyo-button-group__item:last-child {
  border-radius: var(--feyo-radius-s) var(--feyo-radius-s) var(--feyo-radius-full) var(--feyo-radius-full);
}

/* DMS small 档：高 32、最小宽 56、内边距 12、字号 Small 12。 */
.feyo-button-group--small .feyo-button-group__item {
  min-width: 56px;
  min-height: 32px;
  padding-inline: var(--feyo-space-m);
  font-size: var(--feyo-font-size-small);
}

.feyo-button-group--large .feyo-button-group__item {
  min-height: 48px;
  padding-inline: var(--feyo-space-xl);
}
</style>
