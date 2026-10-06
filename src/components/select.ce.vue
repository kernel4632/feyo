<!--
选择器：提供搜索、键盘单选和原生表单提交；items 格式为 { value, label, disabled, description }。
Vue 用 v-model 和 v-model:open 同步状态；原生 HTML 设置元素的 items 属性。
原生表单需要沿用本库的 light DOM 注册方式（shadowRoot: false）。
表单把字符串、数字、布尔值提交为字符串。对象和数组仍可用于 Vue/事件选择，
但原生表单会用 String(value) 提交（对象为 [object Object]）；表单请用唯一的字符串或数字 value。
form.reset() 恢复挂载时的 modelValue；清除选择返回 null，必填时为空值。
调用示例：
  <feyo-select v-model="country" name="country" label="国家" :items="countries" searchable clearable />
  <feyo-select v-model="choice" v-model:open="selectOpen" :items="items" placeholder="请选择" />
-->
<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, useAttrs, useHost, useId, getCurrentInstance, watch } from "vue";
import { HugeiconsIcon } from "@hugeicons/vue";
import { ArrowDown01Icon, Cancel01Icon, Search01Icon, Tick01Icon } from "@hugeicons/core-free-icons";

defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
const host = getCurrentInstance().ce ? useHost() : null;

const props = defineProps({
  modelValue: {
    type: [String, Number, Boolean, Object, Array],
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
    default: "请选择",
  },
  disabled: Boolean,
  required: Boolean,
  name: String,
  searchable: Boolean,
  clearable: Boolean,
  open: Boolean,
});

const emit = defineEmits(["update:modelValue", "change", "update:open"]);

const root = ref(null);
const trigger = ref(null);
const searchInput = ref(null);
const nativeSelect = ref(null);
const optionElements = ref([]);
const query = ref("");
const activeIndex = ref(-1);
// 对象值保留调用方的身份，不转换成另一个 Proxy 后导致 Object.is 失配。
const localValue = shallowRef(props.modelValue);
const localOpen = ref(props.open && !props.disabled);
let ownerDocument;
let form;
let initialValue;
let resetTimer;
let restoreFocus = true;
const baseId = useId();
const labelId = `feyo-select-${baseId}-label`;
const triggerId = `feyo-select-${baseId}-trigger`;
const listboxId = `feyo-select-${baseId}-listbox`;
const hiddenSelectId = `feyo-select-${baseId}-native`;

const visibleItems = computed(() => {
  const text = query.value.trim().toLocaleLowerCase();
  if (!text) return props.items;
  return props.items.filter((item) => `${item.label} ${item.description || ""}`.toLocaleLowerCase().includes(text));
});
const selectedItem = computed(() => props.items.find((item) => Object.is(item.value, localValue.value)));
const nativeValue = computed({
  get: () => selectedItem.value ? localValue.value : "",
  set: () => {
    const index = nativeSelect.value.selectedIndex;
    updateValue(index > 0 ? props.items[index - 1].value : null);
  },
});
const enabledIndexes = computed(() => visibleItems.value.flatMap((item, index) => item.disabled ? [] : [index]));
const activeId = computed(() => localOpen.value && activeIndex.value >= 0 ? `${listboxId}-option-${activeIndex.value}` : undefined);

// --- 移动高亮，不把键盘焦点从搜索框中移走 ---
function highlight(index) {
  activeIndex.value = index;
  nextTick(() => optionElements.value[index]?.scrollIntoView({ block: "nearest" }));
}

function moveActive(step) {
  const count = enabledIndexes.value.length;
  if (!count) return;
  const current = enabledIndexes.value.indexOf(activeIndex.value);
  const next = current < 0 ? (step > 0 ? 0 : count - 1) : (current + step + count) % count;
  highlight(enabledIndexes.value[next]);
}

// --- 打开和关闭：不要求原生 HTML 的调用方每次都回写属性 ---
function openSelect() {
  if (props.disabled || localOpen.value) return;
  localOpen.value = true;
  emit("update:open", true);
}

function closeSelect(returnToTrigger = true) {
  if (!localOpen.value) return;
  restoreFocus = returnToTrigger;
  localOpen.value = false;
  emit("update:open", false);
}

function toggleSelect() {
  if (localOpen.value) closeSelect();
  else openSelect();
}

// --- 提交一次选择；重复选择不重复发出 change ---
function updateValue(value) {
  if (props.disabled || Object.is(value, localValue.value)) return;
  localValue.value = value;
  emit("update:modelValue", value);
  emit("change", value);
}

function selectItem(item) {
  if (props.disabled || item.disabled) return;
  updateValue(item.value);
  closeSelect();
}

function clearValue() {
  updateValue(null);
  closeSelect();
  nextTick(() => trigger.value?.focus());
}

function resetValue(event) {
  // 原生 reset 可以被取消；等待默认动作完成后再同步显示与提交值。
  clearTimeout(resetTimer);
  resetTimer = setTimeout(() => {
    if (event.defaultPrevented) return;
    localValue.value = initialValue;
    nativeSelect.value.selectedIndex = props.items.findIndex((item) => Object.is(item.value, initialValue)) + 1;
    closeSelect(false);
    emit("update:modelValue", initialValue);
  }, 0);
}

// --- 键盘：跳过禁用项；搜索时保留空格和输入法组合 ---
function handleKeydown(event) {
  if (props.disabled || event.isComposing) return;
  if (event.key === "Tab") {
    closeSelect(false); // Tab 继续前往下一个控件，不把焦点拉回来。
    return;
  }
  if (event.key === " " && event.target === searchInput.value) return;
  if (!["ArrowDown", "ArrowUp", "Home", "End", "Enter", " ", "Escape"].includes(event.key)) return;
  event.preventDefault();
  event.stopPropagation();

  if (event.key === "Escape") {
    closeSelect();
    return;
  }
  if (!localOpen.value) {
    openSelect();
    if (event.key === "ArrowUp" || event.key === "End") {
      nextTick(() => highlight(enabledIndexes.value.at(-1) ?? -1));
    } else if (event.key === "Home") {
      nextTick(() => highlight(enabledIndexes.value[0] ?? -1));
    }
    return;
  }
  if (event.key === "ArrowDown") moveActive(1);
  else if (event.key === "ArrowUp") moveActive(-1);
  else if (event.key === "Home") highlight(enabledIndexes.value[0] ?? -1);
  else if (event.key === "End") highlight(enabledIndexes.value.at(-1) ?? -1);
  else {
    const item = visibleItems.value[activeIndex.value];
    if (item) selectItem(item);
  }
}

// --- 外部点击与焦点离开：composedPath 也能识别 Shadow DOM 内部点击 ---
function handleOutside(event) {
  if (localOpen.value && !event.composedPath().includes(root.value)) closeSelect(false);
}

watch(() => props.modelValue, (value) => { localValue.value = value; });
watch(() => props.open, (open) => { localOpen.value = open && !props.disabled; });
watch(() => props.disabled, (disabled) => { if (disabled) closeSelect(false); });

watch(localOpen, async (open, wasOpen) => {
  if (open) {
    query.value = "";
    const selected = visibleItems.value.findIndex((item) => Object.is(item.value, localValue.value) && !item.disabled);
    highlight(selected >= 0 ? selected : (enabledIndexes.value[0] ?? -1));
    await nextTick();
    if (localOpen.value) (props.searchable ? searchInput.value : trigger.value)?.focus();
  } else {
    if (wasOpen && restoreFocus) nextTick(() => trigger.value?.focus());
    restoreFocus = true;
  }
}, { immediate: true });

watch(visibleItems, () => {
  // 搜索结果或选项更新后，不让高亮指向另一条过期结果。
  const selected = visibleItems.value.findIndex((item) => Object.is(item.value, localValue.value) && !item.disabled);
  highlight(!query.value && selected >= 0 ? selected : (enabledIndexes.value[0] ?? -1));
});

onMounted(() => {
  initialValue = props.modelValue;
  form = nativeSelect.value.form;
  form?.addEventListener("reset", resetValue);
  ownerDocument = root.value.ownerDocument;
  ownerDocument.addEventListener("pointerdown", handleOutside);
  ownerDocument.addEventListener("focusin", handleOutside);
});
onBeforeUnmount(() => {
  clearTimeout(resetTimer);
  form?.removeEventListener("reset", resetValue);
  ownerDocument.removeEventListener("pointerdown", handleOutside);
  ownerDocument.removeEventListener("focusin", handleOutside);
});
</script>

<template>
  <div ref="root" v-bind="{ ...attrs, id: host ? undefined : attrs.id }" class="feyo-select" :class="{ 'feyo-select--open': localOpen, 'feyo-select--disabled': disabled }">
    <span v-if="label" :id="labelId" class="feyo-select__label">
      {{ label }}<span v-if="required" aria-hidden="true"> *</span>
    </span>

    <div class="feyo-select__control" :class="{ 'feyo-select__control--clearable': clearable && selectedItem }">
      <button
        :id="triggerId"
        ref="trigger"
        class="feyo-select__trigger"
        type="button"
        role="combobox"
        :disabled="disabled"
        :aria-expanded="localOpen"
        :aria-controls="listboxId"
        aria-haspopup="listbox"
        :aria-labelledby="label ? labelId : undefined"
        :aria-required="required || undefined"
        :aria-activedescendant="searchable ? undefined : activeId"
        @click="toggleSelect"
        @keydown="handleKeydown"
      >
        <span class="feyo-select__trigger-label" :class="{ 'feyo-select__trigger-label--placeholder': !selectedItem }">
          {{ selectedItem ? selectedItem.label : placeholder }}
        </span>
        <HugeiconsIcon class="feyo-select__arrow" :icon="ArrowDown01Icon" :size="20" aria-hidden="true" />
      </button>
      <button
        v-if="clearable && selectedItem"
        class="feyo-select__clear"
        type="button"
        aria-label="清除选择"
        title="清除选择"
        :disabled="disabled"
        @click.stop="clearValue"
      >
        <HugeiconsIcon :icon="Cancel01Icon" :size="18" aria-hidden="true" />
      </button>
    </div>

    <!-- 原生选项保留真实值；阻止原生事件冒泡，只发出组件自己的 change。 -->
    <select
      ref="nativeSelect"
      v-model="nativeValue"
      :id="hiddenSelectId"
      class="feyo-select__native"
      :name="name"
      :required="required"
      :disabled="disabled"
      tabindex="-1"
      aria-hidden="true"
      @input.stop
      @change.stop
      @invalid.prevent="trigger?.focus()"
    >
      <option value=""></option>
      <option
        v-for="(item, index) in items"
        :key="index"
        :value="item.value"
        :disabled="item.disabled"
      >
        {{ item.label }}
      </option>
    </select>

    <div
      v-if="localOpen"
      class="feyo-select__popup"
    >
      <div v-if="searchable" class="feyo-select__search-wrap">
        <HugeiconsIcon class="feyo-select__search-icon" :icon="Search01Icon" :size="18" aria-hidden="true" />
        <input
          ref="searchInput"
          v-model="query"
          class="feyo-select__search"
          type="search"
          role="combobox"
          aria-label="搜索选项"
          aria-expanded="true"
          aria-autocomplete="list"
          :aria-controls="listboxId"
          :aria-activedescendant="activeId"
          @input.stop
          @change.stop
          @keydown="handleKeydown"
        >
      </div>

      <div :id="listboxId" class="feyo-select__options" role="listbox" :aria-labelledby="label ? labelId : triggerId">
        <div
          v-for="(item, index) in visibleItems"
          :id="`${listboxId}-option-${index}`"
          :key="index"
          :ref="(element) => { optionElements[index] = element; }"
          class="feyo-select__option"
          :class="{ 'feyo-select__option--active': index === activeIndex, 'feyo-select__option--selected': Object.is(item.value, localValue) }"
          role="option"
          :aria-selected="Object.is(item.value, localValue)"
          :aria-disabled="item.disabled || undefined"
          @pointerdown.prevent
          @click="selectItem(item)"
        >
          <span class="feyo-select__option-copy">
            <span class="feyo-select__option-label">{{ item.label }}</span>
            <span v-if="item.description" class="feyo-select__option-description">{{ item.description }}</span>
          </span>
          <HugeiconsIcon v-if="Object.is(item.value, localValue)" class="feyo-select__check" :icon="Tick01Icon" :size="18" aria-hidden="true" />
        </div>
      </div>
      <div v-if="visibleItems.length === 0" class="feyo-select__empty" role="status">没有匹配选项</div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.feyo-select {
  position: relative;
  display: inline-flex;
  width: 100%;
  max-width: 320px;
  min-width: 0;
  flex-direction: column;
  gap: var(--feyo-space-1);
  color: var(--feyo-color-on-surface);
  font-family: var(--feyo-font-family);
}

.feyo-select__label {
  color: var(--feyo-color-on-surface-variant);
  font-size: var(--feyo-font-size-sm);
  font-weight: var(--feyo-font-weight-medium);
}

.feyo-select__control {
  position: relative;
  display: flex;
  min-height: 42px;
}

.feyo-select__trigger {
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
  .feyo-select--open & {
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

.feyo-select__control--clearable .feyo-select__trigger {
  padding-right: 72px;
}

.feyo-select__control--clearable .feyo-select__arrow {
  position: absolute;
  right: var(--feyo-space-4);
}

.feyo-select__trigger-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.feyo-select__trigger-label--placeholder,
.feyo-select__search::placeholder {
  color: var(--feyo-color-on-surface-variant);
}

.feyo-select__arrow {
  flex: 0 0 auto;
  color: var(--feyo-color-on-surface-variant);
  transition: transform var(--feyo-duration-fast) var(--feyo-ease-standard);
}

.feyo-select--open .feyo-select__arrow {
  transform: rotate(180deg);
}

.feyo-select__clear {
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

.feyo-select__native {
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

.feyo-select__popup {
  box-sizing: border-box;
  position: absolute;
  z-index: 20;
  top: calc(100% + var(--feyo-space-2));
  left: 0;
  width: 100%;
  max-height: min(360px, 50vh);
  overflow: auto;
  padding: var(--feyo-space-2);
  border: 1px solid var(--feyo-color-outline);
  border-radius: var(--feyo-radius-md);
  background: var(--feyo-color-surface-container);
  box-shadow: 0 12px 28px color-mix(in srgb, var(--feyo-color-surface) 55%, var(--feyo-color-transparent));
  animation: feyo-select-enter var(--feyo-duration-fast) var(--feyo-ease-emphasized);
}

.feyo-select__search-wrap {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: var(--feyo-space-2);
}

.feyo-select__search-icon {
  position: absolute;
  left: var(--feyo-space-3);
  color: var(--feyo-color-on-surface-variant);
  pointer-events: none;
}

.feyo-select__search {
  box-sizing: border-box;
  width: 100%;
  min-height: 40px;
  padding: 0 var(--feyo-space-3) 0 40px;
  border: 1px solid var(--feyo-color-outline);
  border-radius: var(--feyo-radius-sm);
  color: var(--feyo-color-on-surface);
  background: var(--feyo-color-surface);
  font: inherit;
  outline: none;

  &:focus {
    border-color: var(--feyo-color-primary);
    outline: 2px solid var(--feyo-color-primary);
    outline-offset: 1px;
  }
}

.feyo-select__options {
  display: grid;
  gap: var(--feyo-space-1);
}

.feyo-select__option {
  display: flex;
  min-height: 44px;
  align-items: center;
  justify-content: space-between;
  gap: var(--feyo-space-3);
  padding: var(--feyo-space-2) var(--feyo-space-3);
  border-radius: var(--feyo-radius-sm);
  color: var(--feyo-color-on-surface);
  cursor: pointer;

  &:hover,
  &:focus-visible,
  &--active {
    background: var(--feyo-color-surface-container-high);
  }

  &:focus-visible {
    outline: 2px solid var(--feyo-color-primary);
    outline-offset: -2px;
  }

  &--selected {
    color: var(--feyo-color-primary);
  }

  &[aria-disabled="true"] {
    cursor: not-allowed;
    opacity: var(--feyo-opacity-disabled);
  }
}

.feyo-select__option-copy {
  min-width: 0;
  display: grid;
  gap: var(--feyo-space-1);
}

.feyo-select__option-label,
.feyo-select__option-description {
  overflow-wrap: anywhere;
}

@media (prefers-reduced-motion: reduce) {
  .feyo-select__trigger,
  .feyo-select__arrow {
    transition: none;
  }

  .feyo-select__popup {
    animation: none;
  }
}

.feyo-select__option-description,
.feyo-select__empty {
  color: var(--feyo-color-on-surface-variant);
  font-size: var(--feyo-font-size-sm);
}

.feyo-select__check {
  flex: 0 0 auto;
  color: var(--feyo-color-primary);
}

.feyo-select__empty {
  padding: var(--feyo-space-3);
  text-align: center;
}

@keyframes feyo-select-enter {
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
