<!--
组合框：用 items { value, label, disabled, description } 提供可输入、可过滤的单选框。
modelValue 保存选中 value；freeSolo 为 true 时，输入的自由文本也会成为 modelValue。
本地上游参考只有 DankDropdown、DankListView 和 DankListItem，没有 Cascader 或 Combobox 控件。
原生表单提交 modelValue；对象会按 String(value) 提交。input 表示当前文字，change 只在确认值变化后发送一次。
Vue 用 v-model 和 v-model:open 同步状态；调用示例：
  <kima-combobox v-model="country" name="country" label="国家" :items="countries" searchable clearable />
  <kima-combobox v-model="tag" :items="tags" free-solo searchable @input="onText" />
-->
<script setup>
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, useAttrs, useHost, useId, watch } from "vue";
import { HugeiconsIcon } from "@hugeicons/vue";
import { ArrowDown01Icon, Cancel01Icon, Search01Icon, Tick01Icon } from "@hugeicons/core-free-icons";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  modelValue: {
    type: [String, Number, Boolean],
    default: null,
  },
  items: {
    type: Array,
    default: () => [],
  },
  label: {
    type: String,
    default: "",
  },
  placeholder: {
    type: String,
    default: "请选择或输入",
  },
  name: String,
  required: Boolean,
  disabled: Boolean,
  clearable: Boolean,
  searchable: {
    type: Boolean,
    default: true,
  },
  open: Boolean,
  freeSolo: Boolean,
});

const emit = defineEmits(["input", "update:modelValue", "change", "update:open"]);
const attrs = useAttrs();
const host = getCurrentInstance()?.ce ? useHost() : null;
const forwardedAttrs = computed(() => host ? { ...attrs, id: undefined } : attrs);

const root = ref(null);
const input = ref(null);
const nativeInput = ref(null);
const optionElements = ref([]);
const query = ref("");
const activeIndex = ref(-1);
const localValue = shallowRef(props.modelValue);
const committedValue = shallowRef(props.modelValue);
const localOpen = ref(props.open && !props.disabled);
const baseId = `kima-combobox-${useId()}`;
const labelId = `${baseId}-label`;
const inputId = `${baseId}-input`;
const listboxId = `${baseId}-listbox`;
let ownerDocument;
let form;
let initialValue;
let restoreFocus = true;

const selectedItem = computed(() => props.items.find((item) => Object.is(item?.value, localValue.value)) || null);
const visibleItems = computed(() => {
  const text = props.searchable ? query.value.trim().toLocaleLowerCase() : "";
  if (!text) return props.items;
  return props.items.filter((item) => `${item?.label || ""} ${item?.description || ""}`.toLocaleLowerCase().includes(text));
});
const nativeValue = computed(() => localValue.value === null || localValue.value === undefined ? "" : String(localValue.value));
const activeId = computed(() => localOpen.value && activeIndex.value >= 0 ? `${listboxId}-option-${activeIndex.value}` : undefined);
const canClear = computed(() => props.clearable && (localValue.value !== null && localValue.value !== undefined && localValue.value !== "" || query.value.length > 0));

function setOptionRef(element, index) {
  if (element) optionElements.value[index] = element;
  else delete optionElements.value[index];
}

function enabledIndexes() {
  return visibleItems.value.flatMap((item, index) => item?.disabled ? [] : [index]);
}

function firstEnabledIndex() {
  return enabledIndexes()[0] ?? -1;
}

function lastEnabledIndex() {
  const indexes = enabledIndexes();
  return indexes[indexes.length - 1] ?? -1;
}

function selectedVisibleIndex() {
  const index = visibleItems.value.findIndex((item) => Object.is(item?.value, localValue.value) && !item.disabled);
  return index >= 0 ? index : firstEnabledIndex();
}

function setActive(index, focus = false) {
  if (index < 0 || !visibleItems.value[index] || visibleItems.value[index].disabled) return;
  activeIndex.value = index;
  nextTick(() => {
    if (focus) optionElements.value[index]?.focus();
    optionElements.value[index]?.scrollIntoView({ block: "nearest" });
  });
}

function moveActive(step) {
  const indexes = enabledIndexes();
  if (!indexes.length) return;
  const current = indexes.indexOf(activeIndex.value);
  const next = current < 0 ? (step > 0 ? 0 : indexes.length - 1) : (current + step + indexes.length) % indexes.length;
  setActive(indexes[next]);
}

function emitCommittedChange(value) {
  if (Object.is(value, committedValue.value)) return;
  committedValue.value = value;
  emit("change", value);
}

function setModelValue(value, commit = false) {
  if (!Object.is(value, localValue.value)) {
    localValue.value = value;
    emit("update:modelValue", value);
  }
  if (commit) emitCommittedChange(value);
}

function selectedText() {
  return selectedItem.value ? selectedItem.value.label : "";
}

function openCombobox() {
  if (props.disabled || localOpen.value) return;
  localOpen.value = true;
  activeIndex.value = selectedVisibleIndex();
  emit("update:open", true);
}

function closeCombobox(returnFocus = true) {
  if (!localOpen.value) return;
  restoreFocus = returnFocus;
  localOpen.value = false;
  emit("update:open", false);
}

function commitInput() {
  if (props.freeSolo) {
    const value = query.value === "" ? null : query.value;
    setModelValue(value);
    emitCommittedChange(value);
  } else {
    query.value = selectedText();
  }
}

function selectItem(item) {
  if (props.disabled || item?.disabled) return;
  query.value = item.label;
  setModelValue(item.value, true);
  closeCombobox(true);
}

function selectActive() {
  const item = visibleItems.value[activeIndex.value];
  if (item) selectItem(item);
  else if (props.freeSolo) {
    commitInput();
    closeCombobox(true);
  }
}

function clearValue() {
  query.value = "";
  setModelValue(null, true);
  closeCombobox(true);
  nextTick(() => input.value?.focus());
}

function handleInput(event) {
  if (props.disabled) return;
  query.value = event.target.value;
  emit("input", query.value);
  if (!localOpen.value) openCombobox();
  if (props.freeSolo) setModelValue(query.value === "" ? null : query.value);
}

function handleKeydown(event) {
  if (props.disabled || event.isComposing) return;
  if (event.key === "Tab") {
    commitInput();
    closeCombobox(false);
    return;
  }
  if (!["ArrowDown", "ArrowUp", "Home", "End", "Enter", " ", "Escape"].includes(event.key)) return;
  event.preventDefault();
  event.stopPropagation();

  if (event.key === "Escape") {
    query.value = selectedText();
    closeCombobox(true);
    return;
  }
  if (!localOpen.value) {
    openCombobox();
    if (event.key === "ArrowUp" || event.key === "End") nextTick(() => setActive(lastEnabledIndex()));
    else if (event.key === "Home") nextTick(() => setActive(firstEnabledIndex()));
    return;
  }
  if (event.key === "ArrowDown") moveActive(1);
  else if (event.key === "ArrowUp") moveActive(-1);
  else if (event.key === "Home") setActive(firstEnabledIndex());
  else if (event.key === "End") setActive(lastEnabledIndex());
  else selectActive();
}

function handleOutside(event) {
  if (!localOpen.value || event.composedPath().includes(root.value)) return;
  commitInput();
  closeCombobox(false);
}

function handleInvalid(event) {
  event.preventDefault();
  nextTick(() => input.value?.focus());
}

function handleReset(event) {
  queueMicrotask(() => {
    if (event.defaultPrevented) return;
    const changed = !Object.is(localValue.value, initialValue);
    localValue.value = initialValue;
    committedValue.value = initialValue;
    query.value = props.items.find((item) => Object.is(item?.value, initialValue))?.label || (props.freeSolo && initialValue != null ? String(initialValue) : "");
    closeCombobox(false);
    if (nativeInput.value) nativeInput.value.value = initialValue == null ? "" : String(initialValue);
    if (changed) emit("update:modelValue", initialValue);
  });
}

watch(() => props.modelValue, (value) => {
  localValue.value = value;
  committedValue.value = value;
  query.value = props.items.find((item) => Object.is(item?.value, value))?.label || (props.freeSolo && value != null ? String(value) : "");
});
watch(() => props.items, () => {
  if (!localOpen.value) query.value = selectedText();
}, { deep: true });
watch(() => props.open, (open) => {
  localOpen.value = open && !props.disabled;
  if (localOpen.value) activeIndex.value = selectedVisibleIndex();
});
watch(() => props.disabled, (disabled) => { if (disabled) closeCombobox(false); });
watch(visibleItems, () => {
  activeIndex.value = selectedVisibleIndex();
});
watch(localOpen, (open, wasOpen) => {
  if (open) nextTick(() => input.value?.focus());
  else if (wasOpen && restoreFocus) nextTick(() => input.value?.focus());
  restoreFocus = true;
}, { immediate: true });

onMounted(() => {
  initialValue = localValue.value;
  query.value = selectedText() || (props.freeSolo && initialValue != null ? String(initialValue) : "");
  form = nativeInput.value?.form;
  form?.addEventListener("reset", handleReset);
  ownerDocument = root.value.ownerDocument;
  ownerDocument.addEventListener("pointerdown", handleOutside);
  ownerDocument.addEventListener("focusin", handleOutside);
});

onBeforeUnmount(() => {
  form?.removeEventListener("reset", handleReset);
  ownerDocument?.removeEventListener("pointerdown", handleOutside);
  ownerDocument?.removeEventListener("focusin", handleOutside);
});
</script>

<template>
  <div
    ref="root"
    v-bind="forwardedAttrs"
    class="kima-combobox"
    :class="{ 'kima-combobox--open': localOpen, 'kima-combobox--disabled': disabled }"
  >
    <label v-if="label" class="kima-combobox__label" :id="labelId" :for="inputId">
      {{ label }}<span v-if="required" aria-hidden="true"> *</span>
    </label>

    <div class="kima-combobox__control" :class="{ 'kima-combobox__control--clearable': canClear }">
      <HugeiconsIcon v-if="searchable" class="kima-combobox__search-icon" :icon="Search01Icon" :size="18" aria-hidden="true" />
      <input
        :id="inputId"
        ref="input"
        class="kima-combobox__input"
        type="text"
        role="combobox"
        :value="query"
        :placeholder="placeholder"
        :readonly="!searchable"
        :disabled="disabled"
        :aria-expanded="localOpen"
        :aria-controls="listboxId"
        aria-haspopup="listbox"
        aria-autocomplete="list"
        :aria-labelledby="label ? labelId : undefined"
        :aria-required="required || undefined"
        :aria-activedescendant="activeId"
        @focus="openCombobox"
        @click="openCombobox"
        @input.stop="handleInput"
        @change.stop="commitInput"
        @keydown="handleKeydown"
      >
      <button
        v-if="canClear"
        class="kima-combobox__clear"
        type="button"
        aria-label="清除输入"
        title="清除输入"
        :disabled="disabled"
        @click="clearValue"
      >
        <HugeiconsIcon :icon="Cancel01Icon" :size="18" aria-hidden="true" />
      </button>
      <button class="kima-combobox__toggle" type="button" :disabled="disabled" aria-label="显示选项" @mousedown.prevent @click="localOpen ? closeCombobox(true) : openCombobox()">
        <HugeiconsIcon class="kima-combobox__arrow" :icon="ArrowDown01Icon" :size="20" aria-hidden="true" />
      </button>
    </div>

    <input
      ref="nativeInput"
      class="kima-combobox__native"
      type="text"
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

    <div v-if="localOpen" class="kima-combobox__popup">
      <div :id="listboxId" class="kima-combobox__options" role="listbox" :aria-labelledby="label ? labelId : inputId">
        <div
          v-for="(item, index) in visibleItems"
          :id="`${listboxId}-option-${index}`"
          :key="index"
          :ref="(element) => setOptionRef(element, index)"
          class="kima-combobox__option"
          :class="{ 'kima-combobox__option--active': index === activeIndex, 'kima-combobox__option--selected': Object.is(item.value, localValue) }"
          role="option"
          :aria-selected="Object.is(item.value, localValue)"
          :aria-disabled="item.disabled || undefined"
          tabindex="-1"
          @pointerdown.prevent
          @click="selectItem(item)"
        >
          <span class="kima-combobox__option-copy">
            <span class="kima-combobox__option-label">{{ item.label }}</span>
            <span v-if="item.description" class="kima-combobox__option-description">{{ item.description }}</span>
          </span>
          <HugeiconsIcon v-if="Object.is(item.value, localValue)" class="kima-combobox__check" :icon="Tick01Icon" :size="18" aria-hidden="true" />
        </div>
        <div v-if="visibleItems.length === 0" class="kima-combobox__empty" role="status">没有匹配选项</div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.kima-combobox {
  position: relative;
  display: inline-flex;
  width: 100%;
  max-width: 360px;
  min-width: 0;
  flex-direction: column;
  gap: var(--kima-space-1);
  color: var(--kima-color-on-surface);
  font-family: var(--kima-font-family);
}

.kima-combobox__label {
  color: var(--kima-color-on-surface-variant);
  font-size: var(--kima-font-size-sm);
  font-weight: var(--kima-font-weight-medium);
}

.kima-combobox__control {
  position: relative;
  display: flex;
  min-height: 42px;
  align-items: center;
  border: 1px solid var(--kima-color-outline);
  border-radius: var(--kima-radius-sm);
  background: var(--kima-color-surface-container);
  transition: border-color var(--kima-duration-fast) var(--kima-ease-standard), background-color var(--kima-duration-fast) var(--kima-ease-standard);

  &:focus-within,
  .kima-combobox--open & {
    border-color: var(--kima-color-primary);
    background: var(--kima-color-surface-container-high);
  }
}

.kima-combobox__input {
  box-sizing: border-box;
  width: 100%;
  min-height: 40px;
  padding: 0 var(--kima-space-4);
  border: 0;
  border-radius: inherit;
  color: var(--kima-color-on-surface);
  background: var(--kima-color-transparent);
  font: inherit;
  outline: none;

  &:disabled {
    cursor: not-allowed;
    opacity: var(--kima-opacity-disabled);
  }

  &::placeholder {
    color: var(--kima-color-on-surface-variant);
  }
}

.kima-combobox__search-icon {
  position: absolute;
  left: var(--kima-space-3);
  color: var(--kima-color-on-surface-variant);
  pointer-events: none;
}

.kima-combobox__search-icon + .kima-combobox__input {
  padding-left: 40px;
}

.kima-combobox__control--clearable .kima-combobox__input {
  padding-right: 72px;
}

.kima-combobox__clear,
.kima-combobox__toggle {
  position: absolute;
  top: 50%;
  display: inline-flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: var(--kima-radius-full);
  color: var(--kima-color-on-surface-variant);
  background: var(--kima-color-transparent);
  cursor: pointer;
  transform: translateY(-50%);

  &:hover:not(:disabled),
  &:focus-visible {
    color: var(--kima-color-primary);
    background: var(--kima-color-surface-container-high);
  }

  &:focus-visible {
    outline: 2px solid var(--kima-color-primary);
    outline-offset: 1px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: var(--kima-opacity-disabled);
  }
}

.kima-combobox__clear {
  right: 36px;
}

.kima-combobox__toggle {
  right: var(--kima-space-2);
}

.kima-combobox__arrow {
  transition: transform var(--kima-duration-fast) var(--kima-ease-standard);
}

.kima-combobox--open .kima-combobox__arrow {
  transform: rotate(180deg);
}

.kima-combobox__native {
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

.kima-combobox__popup {
  box-sizing: border-box;
  position: absolute;
  z-index: 20;
  top: calc(100% + var(--kima-space-2));
  left: 0;
  width: 100%;
  max-height: min(360px, 50vh);
  overflow: auto;
  padding: var(--kima-space-2);
  border: 1px solid var(--kima-color-outline);
  border-radius: var(--kima-radius-md);
  background: var(--kima-color-surface-container);
  box-shadow: 0 12px 28px var(--kima-color-surface);
  animation: kima-combobox-enter var(--kima-duration-fast) var(--kima-ease-emphasized);
}

.kima-combobox__options {
  display: grid;
  gap: var(--kima-space-1);
}

.kima-combobox__option {
  display: flex;
  min-height: 44px;
  align-items: center;
  justify-content: space-between;
  gap: var(--kima-space-3);
  padding: var(--kima-space-2) var(--kima-space-3);
  border-radius: var(--kima-radius-sm);
  color: var(--kima-color-on-surface);
  cursor: pointer;

  &:hover,
  &--active {
    background: var(--kima-color-surface-container-high);
  }

  &:focus-visible {
    outline: 2px solid var(--kima-color-primary);
    outline-offset: -2px;
  }

  &--selected {
    color: var(--kima-color-primary);
    background: var(--kima-color-primary-container);
  }

  &[aria-disabled="true"] {
    cursor: not-allowed;
    opacity: var(--kima-opacity-disabled);
  }
}

.kima-combobox__option-copy {
  min-width: 0;
  display: grid;
  gap: var(--kima-space-1);
}

.kima-combobox__option-label,
.kima-combobox__option-description {
  overflow-wrap: anywhere;
}

.kima-combobox__option-description,
.kima-combobox__empty {
  color: var(--kima-color-on-surface-variant);
  font-size: var(--kima-font-size-sm);
}

.kima-combobox__check {
  flex: 0 0 auto;
  color: var(--kima-color-primary);
}

.kima-combobox__empty {
  padding: var(--kima-space-3);
  text-align: center;
}

@media (prefers-reduced-motion: reduce) {
  .kima-combobox__control,
  .kima-combobox__arrow,
  .kima-combobox__popup {
    transition: none;
    animation: none;
  }
}

@keyframes kima-combobox-enter {
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
