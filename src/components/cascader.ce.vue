<!--
级联选择器：按层级展示 options，并用 modelValue 保存从根到当前项的 value 路径。
options 格式为 { value, label, children, disabled }；children 缺失时按叶子项处理，适合异步补充数据。
本地上游参考只有 DankDropdown、DankListView 和 DankListItem，没有 Cascader 或 Combobox 控件。
原生表单只提交路径最后一个 value；对象会按 String(value) 提交，复杂路径请在 Vue 事件中读取完整数组。
Vue 用 v-model 和 v-model:open 同步状态；调用示例：
  <feyo-cascader v-model="path" name="category" label="分类" :options="categories" clearable />
  <feyo-cascader v-model="path" v-model:open="open" :options="categories" required />
-->
<script setup>
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, useAttrs, useHost, useId, watch } from "vue";
import { HugeiconsIcon } from "@hugeicons/vue";
import { ArrowDown01Icon, ArrowRight01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  options: {
    type: Array,
    default: () => [],
  },
  label: {
    type: String,
    default: "",
  },
  placeholder: {
    type: String,
    default: "请选择",
  },
  name: String,
  required: Boolean,
  disabled: Boolean,
  clearable: Boolean,
  open: Boolean,
});

const emit = defineEmits(["update:modelValue", "change", "update:open"]);
const attrs = useAttrs();
const host = getCurrentInstance()?.ce ? useHost() : null;
const forwardedAttrs = computed(() => host ? { ...attrs, id: undefined } : attrs);

const root = ref(null);
const trigger = ref(null);
const nativeInput = ref(null);
const optionElements = ref([]);
const localPath = shallowRef(Array.isArray(props.modelValue) ? [...props.modelValue] : []);
const localOpen = ref(props.open && !props.disabled);
const activeColumn = ref(0);
const activeIndexes = ref([]);
const baseId = `feyo-cascader-${useId()}`;
const labelId = `${baseId}-label`;
const triggerId = `${baseId}-trigger`;
const listboxId = `${baseId}-listbox`;
const inputId = `${baseId}-native`;
let ownerDocument;
let form;
let initialPath = [];
let resetTimer;
let restoreFocus = true;

const columns = computed(() => {
  const result = [];
  let items = Array.isArray(props.options) ? props.options : [];

  for (let column = 0; ; column += 1) {
    result.push(items);
    const selected = items.find((item) => Object.is(item?.value, localPath.value[column]));
    const children = Array.isArray(selected?.children) ? selected.children : [];
    if (!selected || children.length === 0) break;
    items = children;
  }

  return result;
});

const selectedItems = computed(() => {
  const result = [];
  let items = Array.isArray(props.options) ? props.options : [];

  for (let column = 0; column < localPath.value.length; column += 1) {
    const item = items.find((candidate) => Object.is(candidate?.value, localPath.value[column]));
    if (!item) break;
    result.push(item);
    items = Array.isArray(item.children) ? item.children : [];
  }

  return result;
});

const displayLabel = computed(() => selectedItems.value.map((item) => item.label).join(" / "));
const nativeValue = computed(() => localPath.value.length ? String(localPath.value[localPath.value.length - 1]) : "");
const activeId = computed(() => {
  const index = activeIndexes.value[activeColumn.value];
  return localOpen.value && Number.isInteger(index) && index >= 0
    ? `${listboxId}-${activeColumn.value}-option-${index}`
    : undefined;
});

function pathEquals(left, right) {
  return left.length === right.length && left.every((value, index) => Object.is(value, right[index]));
}

function enabledIndexes(items) {
  return items.flatMap((item, index) => item?.disabled ? [] : [index]);
}

function firstEnabledIndex(items) {
  return enabledIndexes(items)[0] ?? -1;
}

function lastEnabledIndex(items) {
  const indexes = enabledIndexes(items);
  return indexes[indexes.length - 1] ?? -1;
}

function selectedIndex(items, column) {
  const index = items.findIndex((item) => Object.is(item?.value, localPath.value[column]) && !item.disabled);
  return index >= 0 ? index : firstEnabledIndex(items);
}

function setOptionRef(element, column, index) {
  if (!optionElements.value[column]) optionElements.value[column] = [];
  if (element) optionElements.value[column][index] = element;
  else delete optionElements.value[column][index];
}

function focusOption(column, index) {
  const item = columns.value[column]?.[index];
  if (!item || item.disabled) return;
  activeColumn.value = column;
  activeIndexes.value[column] = index;
  nextTick(() => optionElements.value[column]?.[index]?.scrollIntoView({ block: "nearest", inline: "nearest" }));
}

function initializeActive() {
  activeIndexes.value = columns.value.map((items, column) => selectedIndex(items, column));
  activeColumn.value = Math.max(0, columns.value.length - 1);
}

function moveActive(step) {
  const items = columns.value[activeColumn.value] || [];
  const indexes = enabledIndexes(items);
  if (!indexes.length) return;
  const current = indexes.indexOf(activeIndexes.value[activeColumn.value]);
  const next = current < 0 ? (step > 0 ? 0 : indexes.length - 1) : (current + step + indexes.length) % indexes.length;
  focusOption(activeColumn.value, indexes[next]);
}

function updateValue(path) {
  if (props.disabled || pathEquals(path, localPath.value)) return false;
  localPath.value = [...path];
  emit("update:modelValue", localPath.value);
  emit("change", localPath.value);
  return true;
}

function selectItem(item, column) {
  if (props.disabled || item?.disabled) return;
  const nextPath = localPath.value.slice(0, column);
  nextPath.push(item.value);
  updateValue(nextPath);

  const children = Array.isArray(item.children) ? item.children : [];
  if (children.length) {
    activeColumn.value = Math.min(column + 1, columns.value.length - 1);
    activeIndexes.value[activeColumn.value] = firstEnabledIndex(children);
    nextTick(() => focusOption(activeColumn.value, activeIndexes.value[activeColumn.value]));
    return;
  }

  closeCascader(true);
}

function openCascader() {
  if (props.disabled || localOpen.value) return;
  localOpen.value = true;
  initializeActive();
  emit("update:open", true);
  nextTick(() => trigger.value?.focus());
}

function closeCascader(returnFocus = true) {
  if (!localOpen.value) return;
  restoreFocus = returnFocus;
  localOpen.value = false;
  emit("update:open", false);
}

function toggleCascader() {
  if (localOpen.value) closeCascader(true);
  else openCascader();
}

function clearValue() {
  updateValue([]);
  closeCascader(true);
  nextTick(() => trigger.value?.focus());
}

function handleKeydown(event) {
  if (props.disabled || event.isComposing) return;
  if (event.key === "Tab") {
    closeCascader(false);
    return;
  }
  if (!["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "Home", "End", "Enter", " ", "Escape"].includes(event.key)) return;
  event.preventDefault();
  event.stopPropagation();

  if (event.key === "Escape") {
    closeCascader(true);
    return;
  }

  if (!localOpen.value) {
    openCascader();
    if (event.key === "ArrowUp" || event.key === "ArrowLeft" || event.key === "End") {
      nextTick(() => focusOption(activeColumn.value, lastEnabledIndex(columns.value[activeColumn.value] || [])));
    } else if (event.key === "Home") {
      nextTick(() => focusOption(activeColumn.value, firstEnabledIndex(columns.value[activeColumn.value] || [])));
    }
    return;
  }

  const items = columns.value[activeColumn.value] || [];
  if (event.key === "ArrowDown") moveActive(1);
  else if (event.key === "ArrowUp") moveActive(-1);
  else if (event.key === "Home") focusOption(activeColumn.value, firstEnabledIndex(items));
  else if (event.key === "End") focusOption(activeColumn.value, lastEnabledIndex(items));
  else if (event.key === "ArrowLeft") {
    if (activeColumn.value > 0) focusOption(activeColumn.value - 1, activeIndexes.value[activeColumn.value - 1]);
  } else if (event.key === "ArrowRight") {
    const item = items[activeIndexes.value[activeColumn.value]];
    const children = Array.isArray(item?.children) ? item.children : [];
    if (children.length) selectItem(item, activeColumn.value);
  } else {
    const item = items[activeIndexes.value[activeColumn.value]];
    if (item) selectItem(item, activeColumn.value);
  }
}

function handleOutside(event) {
  if (localOpen.value && !event.composedPath().includes(root.value)) closeCascader(false);
}

function handleInvalid(event) {
  event.preventDefault();
  nextTick(() => trigger.value?.focus());
}

function handleReset(event) {
  clearTimeout(resetTimer);
  resetTimer = setTimeout(() => {
    if (event.defaultPrevented) return;
    const nextPath = [...initialPath];
    const changed = !pathEquals(localPath.value, nextPath);
    localPath.value = nextPath;
    closeCascader(false);
    if (nativeInput.value) nativeInput.value.value = nextPath.length ? String(nextPath[nextPath.length - 1]) : "";
    if (changed) emit("update:modelValue", localPath.value);
  }, 0);
}

watch(() => props.modelValue, (value) => {
  localPath.value = Array.isArray(value) ? [...value] : [];
});
watch(() => props.open, (open) => {
  localOpen.value = open && !props.disabled;
  if (localOpen.value) initializeActive();
});
watch(() => props.disabled, (disabled) => { if (disabled) closeCascader(false); });
watch(columns, initializeActive, { deep: true });
watch(localOpen, (open, wasOpen) => {
  if (open) initializeActive();
  else if (wasOpen && restoreFocus) nextTick(() => trigger.value?.focus());
  restoreFocus = true;
}, { immediate: true });

onMounted(() => {
  initialPath = [...localPath.value];
  form = nativeInput.value?.form;
  form?.addEventListener("reset", handleReset);
  ownerDocument = root.value.ownerDocument;
  ownerDocument.addEventListener("pointerdown", handleOutside, true);
  ownerDocument.addEventListener("focusin", handleOutside, true);
});

onBeforeUnmount(() => {
  clearTimeout(resetTimer);
  form?.removeEventListener("reset", handleReset);
  ownerDocument?.removeEventListener("pointerdown", handleOutside, true);
  ownerDocument?.removeEventListener("focusin", handleOutside, true);
});
</script>

<template>
  <div
    ref="root"
    v-bind="forwardedAttrs"
    class="feyo-cascader"
    :class="{ 'feyo-cascader--open': localOpen, 'feyo-cascader--disabled': disabled }"
  >
    <span v-if="label" :id="labelId" class="feyo-cascader__label">
      {{ label }}<span v-if="required" aria-hidden="true"> *</span>
    </span>

    <div class="feyo-cascader__control" :class="{ 'feyo-cascader__control--clearable': clearable && localPath.length }">
      <button
        :id="triggerId"
        ref="trigger"
        class="feyo-cascader__trigger"
        type="button"
        role="combobox"
        :disabled="disabled"
        :aria-expanded="localOpen"
        :aria-controls="listboxId"
        aria-haspopup="listbox"
        :aria-labelledby="label ? labelId : undefined"
        :aria-required="required || undefined"
        :aria-activedescendant="activeId"
        @click="toggleCascader"
        @keydown="handleKeydown"
      >
        <span class="feyo-cascader__trigger-label" :class="{ 'feyo-cascader__trigger-label--placeholder': !displayLabel }">
          {{ displayLabel || placeholder }}
        </span>
        <HugeiconsIcon class="feyo-cascader__arrow" :icon="ArrowDown01Icon" :size="20" aria-hidden="true" />
      </button>
      <button
        v-if="clearable && localPath.length"
        class="feyo-cascader__clear"
        type="button"
        aria-label="清除选择"
        title="清除选择"
        :disabled="disabled"
        @click.stop="clearValue"
      >
        <HugeiconsIcon :icon="Cancel01Icon" :size="18" aria-hidden="true" />
      </button>
    </div>

    <input
      ref="nativeInput"
      class="feyo-cascader__native"
      type="text"
      :id="inputId"
      :name="name"
      :value="nativeValue"
      :required="required"
      :disabled="disabled"
      tabindex="-1"
      aria-hidden="true"
      @input.stop
      @change.stop
      @invalid="handleInvalid"
    >

    <div v-if="localOpen" :id="listboxId" class="feyo-cascader__popup" role="group" :aria-labelledby="label ? labelId : triggerId" @keydown="handleKeydown">
      <div v-for="(items, column) in columns" :key="column" class="feyo-cascader__column" role="listbox" :aria-label="`第 ${column + 1} 级`">
        <div
          v-for="(item, index) in items"
          :id="`${listboxId}-${column}-option-${index}`"
          :key="index"
          :ref="(element) => setOptionRef(element, column, index)"
          class="feyo-cascader__option"
          :class="{
            'feyo-cascader__option--active': column === activeColumn && index === activeIndexes[column],
            'feyo-cascader__option--selected': Object.is(item.value, localPath[column]),
          }"
          role="option"
          :aria-selected="Object.is(item.value, localPath[column])"
          :aria-disabled="item.disabled || undefined"
          tabindex="-1"
          @pointerdown.prevent
          @click="selectItem(item, column)"
        >
          <span class="feyo-cascader__option-label">{{ item.label }}</span>
          <HugeiconsIcon v-if="Array.isArray(item.children) && item.children.length" :icon="ArrowRight01Icon" :size="18" aria-hidden="true" />
        </div>
        <div v-if="items.length === 0" class="feyo-cascader__empty" role="status">暂无选项</div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.feyo-cascader {
  position: relative;
  display: inline-flex;
  width: 100%;
  max-width: 480px;
  min-width: 0;
  flex-direction: column;
  gap: var(--feyo-space-1);
  color: var(--feyo-color-on-surface);
  font-family: var(--feyo-font-family);
}

.feyo-cascader__label {
  color: var(--feyo-color-on-surface-variant);
  font-size: var(--feyo-font-size-sm);
  font-weight: var(--feyo-font-weight-medium);
}

.feyo-cascader__control {
  position: relative;
  display: flex;
  min-height: 42px;
}

.feyo-cascader__trigger {
  box-sizing: border-box;
  display: flex;
  width: 100%;
  min-height: 42px;
  align-items: center;
  justify-content: space-between;
  gap: var(--feyo-space-3);
  padding: 0 var(--feyo-space-4);
  border: 1px solid var(--feyo-color-outline);
  border-radius: var(--feyo-radius-sm);
  color: var(--feyo-color-on-surface);
  background: var(--feyo-color-surface-container);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color var(--feyo-duration-fast) var(--feyo-ease-standard), background-color var(--feyo-duration-fast) var(--feyo-ease-standard);

  &:hover:not(:disabled),
  .feyo-cascader--open & {
    border-color: var(--feyo-color-primary);
    background: var(--feyo-color-surface-container-high);
  }

  &:focus-visible {
    outline: 2px solid var(--feyo-color-primary);
    outline-offset: 2px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: var(--feyo-opacity-disabled);
  }
}

.feyo-cascader__control--clearable .feyo-cascader__trigger {
  padding-right: 72px;
}

.feyo-cascader__trigger-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.feyo-cascader__trigger-label--placeholder {
  color: var(--feyo-color-on-surface-variant);
}

.feyo-cascader__arrow {
  flex: 0 0 auto;
  color: var(--feyo-color-on-surface-variant);
  transition: transform var(--feyo-duration-fast) var(--feyo-ease-standard);
}

.feyo-cascader--open .feyo-cascader__arrow {
  transform: rotate(180deg);
}

.feyo-cascader__clear {
  position: absolute;
  top: 50%;
  right: 36px;
  display: inline-flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: var(--feyo-radius-full);
  color: var(--feyo-color-on-surface-variant);
  background: var(--feyo-color-transparent);
  cursor: pointer;
  transform: translateY(-50%);

  &:hover:not(:disabled),
  &:focus-visible {
    color: var(--feyo-color-primary);
    background: var(--feyo-color-surface-container-high);
  }

  &:focus-visible {
    outline: 2px solid var(--feyo-color-primary);
    outline-offset: 1px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: var(--feyo-opacity-disabled);
  }
}

.feyo-cascader__native {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  border: 0;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
}

.feyo-cascader__popup {
  box-sizing: border-box;
  position: absolute;
  z-index: 20;
  top: calc(100% + var(--feyo-space-2));
  left: 0;
  display: flex;
  max-width: min(720px, 100vw);
  max-height: min(360px, 50vh);
  overflow: auto;
  padding: var(--feyo-space-2);
  border: 1px solid var(--feyo-color-outline);
  border-radius: var(--feyo-radius-md);
  background: var(--feyo-color-surface-container);
  box-shadow: 0 12px 28px var(--feyo-color-surface);
  animation: feyo-cascader-enter var(--feyo-duration-fast) var(--feyo-ease-emphasized);
}

.feyo-cascader__column {
  display: grid;
  min-width: 176px;
  max-height: 320px;
  align-content: start;
  gap: var(--feyo-space-1);
  padding: 0 var(--feyo-space-1);
  overflow-y: auto;
}

.feyo-cascader__column + .feyo-cascader__column {
  border-left: 1px solid var(--feyo-color-outline);
}

.feyo-cascader__option {
  display: flex;
  min-height: 40px;
  align-items: center;
  justify-content: space-between;
  gap: var(--feyo-space-3);
  padding: var(--feyo-space-2) var(--feyo-space-3);
  border-radius: var(--feyo-radius-sm);
  color: var(--feyo-color-on-surface);
  cursor: pointer;

  &:hover,
  &--active {
    background: var(--feyo-color-surface-container-high);
  }

  &:focus-visible {
    outline: 2px solid var(--feyo-color-primary);
    outline-offset: -2px;
  }

  &--selected {
    color: var(--feyo-color-primary);
    background: var(--feyo-color-primary-container);
  }

  &[aria-disabled="true"] {
    cursor: not-allowed;
    opacity: var(--feyo-opacity-disabled);
  }
}

.feyo-cascader__option-label {
  min-width: 0;
  overflow-wrap: anywhere;
}

.feyo-cascader__option > svg {
  flex: 0 0 auto;
}

.feyo-cascader__empty {
  padding: var(--feyo-space-3);
  color: var(--feyo-color-on-surface-variant);
  font-size: var(--feyo-font-size-sm);
  text-align: center;
}

@media (max-width: 560px) {
  .feyo-cascader__popup {
    right: 0;
    max-width: none;
  }

  .feyo-cascader__column {
    min-width: 152px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .feyo-cascader__trigger,
  .feyo-cascader__arrow,
  .feyo-cascader__popup {
    transition: none;
    animation: none;
  }
}

@keyframes feyo-cascader-enter {
  from {
    opacity: 0;
    transform: translateY(-4px) scale(0.98);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
