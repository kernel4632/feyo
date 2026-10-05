<!--
菜单：提供可搜索的单选菜单，负责触发器、弹层、键盘选择和焦点返回。
调用示例：
  <feyo-menu v-model="choice" :items="items" label="选择项目" searchable>
    <template #trigger="{ selectedItem }">{{ selectedItem?.label || '选择项目' }}</template>
  </feyo-menu>
-->
<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from "vue";
import { HugeiconsIcon } from "@hugeicons/vue";
import { ArrowDown01Icon, Search01Icon, Tick01Icon } from "@hugeicons/core-free-icons";

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
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
    default: "选择项目",
  },
  disabled: Boolean,
  placement: {
    type: String,
    default: "bottom-start",
  },
  searchable: Boolean,
});

const emit = defineEmits(["update:open", "update:modelValue", "change"]);

const root = ref(null);
const trigger = ref(null);
const searchInput = ref(null);
const menuPanel = ref(null);
const itemButtons = ref([]);
const query = ref("");
const activeIndex = ref(-1);
const returnFocus = ref(null);
const menuId = `feyo-menu-${useId()}`;
const triggerId = `${menuId}-trigger`;

const isOpen = computed(() => props.open);
const menuPlacement = computed(() => {
  const placements = ["bottom-start", "bottom-end", "top-start", "top-end"];
  return placements.includes(props.placement) ? props.placement : "bottom-start";
});
const visibleItems = computed(() => {
  const text = query.value.trim().toLocaleLowerCase();
  if (!text) return props.items;
  return props.items.filter((item) => itemLabel(item).toLocaleLowerCase().includes(text));
});
const selectedItem = computed(() => props.items.find((item) => itemValue(item) === props.modelValue) || null);
const selectedLabel = computed(() => selectedItem.value ? itemLabel(selectedItem.value) : props.label);

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

function setItemRef(element, index) {
  if (element) itemButtons.value[index] = element;
}

function firstEnabledIndex() {
  return visibleItems.value.findIndex((item) => !itemDisabled(item));
}

function lastEnabledIndex() {
  for (let index = visibleItems.value.length - 1; index >= 0; index -= 1) {
    if (!itemDisabled(visibleItems.value[index])) return index;
  }
  return -1;
}

function selectedVisibleIndex() {
  const index = visibleItems.value.findIndex((item) => itemValue(item) === props.modelValue && !itemDisabled(item));
  return index >= 0 ? index : firstEnabledIndex();
}

function focusItem(index) {
  if (index < 0 || !visibleItems.value[index] || itemDisabled(visibleItems.value[index])) return;
  activeIndex.value = index;
  nextTick(() => itemButtons.value[index]?.focus());
}

function moveActive(step) {
  const count = visibleItems.value.length;
  if (!count) return;
  let next = activeIndex.value;
  for (let attempts = 0; attempts < count; attempts += 1) {
    next = (next + step + count) % count;
    if (!itemDisabled(visibleItems.value[next])) {
      focusItem(next);
      return;
    }
  }
}

function openMenu(preferLast = false) {
  if (props.disabled || props.open) return;
  if (typeof document !== "undefined") returnFocus.value = document.activeElement;
  query.value = "";
  activeIndex.value = preferLast ? lastEnabledIndex() : selectedVisibleIndex();
  emit("update:open", true);
}

function closeMenu() {
  if (!props.open) return;
  emit("update:open", false);
}

function toggleMenu() {
  if (props.open) closeMenu();
  else openMenu();
}

function selectItem(item) {
  if (itemDisabled(item)) return;
  const value = itemValue(item);
  emit("update:modelValue", value);
  emit("change", value);
  closeMenu();
}

function selectActive() {
  const item = visibleItems.value[activeIndex.value];
  if (item) selectItem(item);
}

function handleTriggerKeydown(event) {
  if (props.disabled) return;
  if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
    event.preventDefault();
    openMenu();
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    openMenu(true);
  }
}

function handleMenuKeydown(event) {
  if (event.key === "ArrowDown") {
    event.preventDefault();
    moveActive(1);
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    moveActive(-1);
  } else if (event.key === "Home") {
    event.preventDefault();
    focusItem(firstEnabledIndex());
  } else if (event.key === "End") {
    event.preventDefault();
    focusItem(lastEnabledIndex());
  } else if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    selectActive();
  } else if (event.key === "Escape") {
    event.preventDefault();
    closeMenu();
  }
}

function handleOutsidePointerdown(event) {
  if (props.open && root.value && !root.value.contains(event.target)) closeMenu();
}

function returnFocusToTrigger() {
  const target = returnFocus.value || trigger.value;
  if (target && typeof target.focus === "function") nextTick(() => target.focus());
  returnFocus.value = null;
}

function focusOpenedMenu() {
  if (props.searchable) {
    searchInput.value?.focus();
    return;
  }
  const index = activeIndex.value >= 0 ? activeIndex.value : firstEnabledIndex();
  if (index >= 0) focusItem(index);
  else menuPanel.value?.focus();
}

watch(
  () => props.open,
  (open, wasOpen) => {
    if (open) nextTick(focusOpenedMenu);
    else if (wasOpen) returnFocusToTrigger();
  },
  { immediate: true },
);

watch(visibleItems, () => {
  if (activeIndex.value >= visibleItems.value.length || itemDisabled(visibleItems.value[activeIndex.value])) {
    activeIndex.value = firstEnabledIndex();
  }
});

onMounted(() => document.addEventListener("pointerdown", handleOutsidePointerdown));
onBeforeUnmount(() => document.removeEventListener("pointerdown", handleOutsidePointerdown));
</script>

<template>
  <div ref="root" class="feyo-menu" :class="{ 'feyo-menu--open': isOpen }">
    <button
      :id="triggerId"
      ref="trigger"
      class="feyo-menu__trigger"
      type="button"
      :disabled="disabled"
      aria-haspopup="menu"
      :aria-expanded="isOpen"
      :aria-controls="menuId"
      @click="toggleMenu"
      @keydown="handleTriggerKeydown"
    >
      <slot name="trigger" :open="isOpen" :selected-item="selectedItem" :value="modelValue">
        <span class="feyo-menu__trigger-label">{{ selectedLabel }}</span>
      </slot>
      <HugeiconsIcon class="feyo-menu__trigger-icon" :icon="ArrowDown01Icon" :size="20" aria-hidden="true" />
    </button>

    <div
      v-if="isOpen"
      ref="menuPanel"
      :id="menuId"
      class="feyo-menu__popup"
      :class="`feyo-menu__popup--${menuPlacement}`"
      role="menu"
      tabindex="-1"
      :aria-labelledby="triggerId"
      @keydown="handleMenuKeydown"
    >
      <div v-if="searchable" class="feyo-menu__search-wrap">
        <HugeiconsIcon class="feyo-menu__search-icon" :icon="Search01Icon" :size="18" aria-hidden="true" />
        <input
          ref="searchInput"
          v-model="query"
          class="feyo-menu__search"
          type="search"
          role="searchbox"
          aria-label="搜索菜单项"
          :aria-controls="menuId"
          @keydown.stop="handleMenuKeydown"
        >
      </div>

      <div class="feyo-menu__items">
        <button
          v-for="(item, index) in visibleItems"
          :key="itemValue(item) ?? index"
          :ref="(element) => setItemRef(element, index)"
          class="feyo-menu__item"
          type="button"
          role="menuitem"
          :disabled="itemDisabled(item)"
          :aria-disabled="itemDisabled(item) || undefined"
          :aria-selected="itemValue(item) === modelValue"
          :tabindex="index === activeIndex ? 0 : -1"
          @click="selectItem(item)"
          @focus="activeIndex = index"
        >
          <span class="feyo-menu__item-label">{{ itemLabel(item) }}</span>
          <HugeiconsIcon
            v-if="itemValue(item) === modelValue"
            class="feyo-menu__item-check"
            :icon="Tick01Icon"
            :size="18"
            aria-hidden="true"
          />
        </button>
        <div v-if="visibleItems.length === 0" class="feyo-menu__empty" role="status">没有匹配项目</div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.feyo-menu {
  position: relative;
  display: inline-flex;
  min-width: 180px;
  color: var(--feyo-color-on-surface);
  font-family: var(--feyo-font-family);
}

.feyo-menu__trigger {
  display: inline-flex;
  width: 100%;
  min-height: 56px;
  align-items: center;
  justify-content: space-between;
  gap: var(--feyo-space-3);
  padding: 0 var(--feyo-space-4);
  border: 1px solid var(--feyo-color-outline);
  border-radius: var(--feyo-radius-md);
  color: var(--feyo-color-on-surface);
  background: var(--feyo-color-surface-container);
  font: inherit;
  cursor: pointer;
  transition: border-color var(--feyo-duration-fast) var(--feyo-ease-standard), background-color var(--feyo-duration-fast) var(--feyo-ease-standard);

  &:hover:not(:disabled),
  .feyo-menu--open & {
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

.feyo-menu__trigger-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.feyo-menu__trigger-icon {
  flex: 0 0 auto;
  color: var(--feyo-color-on-surface-variant);
  transition: transform var(--feyo-duration-fast) var(--feyo-ease-standard);
}

.feyo-menu--open .feyo-menu__trigger-icon {
  transform: rotate(180deg);
}

.feyo-menu__popup {
  position: absolute;
  z-index: 20;
  width: max(100%, 220px);
  max-height: 360px;
  overflow: auto;
  padding: var(--feyo-space-2);
  border: 1px solid var(--feyo-color-outline);
  border-radius: var(--feyo-radius-md);
  background: var(--feyo-color-surface-container);
  box-shadow: 0 12px 28px color-mix(in srgb, var(--feyo-color-surface) 55%, var(--feyo-color-transparent));
  animation: feyo-menu-enter var(--feyo-duration-fast) var(--feyo-ease-emphasized);

  &--bottom-start {
    top: calc(100% + var(--feyo-space-2));
    left: 0;
  }

  &--bottom-end {
    top: calc(100% + var(--feyo-space-2));
    right: 0;
  }

  &--top-start {
    bottom: calc(100% + var(--feyo-space-2));
    left: 0;
  }

  &--top-end {
    right: 0;
    bottom: calc(100% + var(--feyo-space-2));
  }
}

.feyo-menu__search-wrap {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: var(--feyo-space-2);
}

.feyo-menu__search-icon {
  position: absolute;
  left: var(--feyo-space-3);
  color: var(--feyo-color-on-surface-variant);
  pointer-events: none;
}

.feyo-menu__search {
  width: 100%;
  min-height: 40px;
  padding: 0 var(--feyo-space-3) 0 40px;
  border: 1px solid var(--feyo-color-outline);
  border-radius: var(--feyo-radius-sm);
  color: var(--feyo-color-on-surface);
  background: var(--feyo-color-surface);
  font: inherit;

  &:focus {
    border-color: var(--feyo-color-primary);
    outline: 2px solid var(--feyo-color-primary);
    outline-offset: 1px;
  }
}

.feyo-menu__items {
  display: grid;
  gap: var(--feyo-space-1);
}

.feyo-menu__item {
  display: flex;
  width: 100%;
  min-height: 40px;
  align-items: center;
  justify-content: space-between;
  gap: var(--feyo-space-3);
  padding: 0 var(--feyo-space-3);
  border: 0;
  border-radius: var(--feyo-radius-sm);
  color: var(--feyo-color-on-surface);
  background: var(--feyo-color-transparent);
  font: inherit;
  text-align: left;
  cursor: pointer;

  &:hover:not(:disabled),
  &:focus-visible {
    background: var(--feyo-color-surface-container-high);
  }

  &:focus-visible {
    outline: 2px solid var(--feyo-color-primary);
    outline-offset: -2px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: var(--feyo-opacity-disabled);
  }
}

.feyo-menu__item-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.feyo-menu__item-check {
  flex: 0 0 auto;
  color: var(--feyo-color-primary);
}

.feyo-menu__empty {
  padding: var(--feyo-space-3);
  color: var(--feyo-color-on-surface-variant);
  text-align: center;
}

@keyframes feyo-menu-enter {
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
