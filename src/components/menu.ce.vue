<!--
菜单：提供可搜索的单选菜单；items 使用 { value, label, disabled, description }。
调用示例：
  <kima-menu v-model="choice" :items="items" label="选择项目" searchable>
    <template #trigger="{ selectedItem }">{{ selectedItem?.label || '选择项目' }}</template>
  </kima-menu>
-->
<script setup>
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, useAttrs, useId, watch } from "vue";
import { HugeiconsIcon } from "@hugeicons/vue";
import { ArrowDown01Icon, Search01Icon, Tick01Icon } from "@hugeicons/core-free-icons";

defineOptions({ inheritAttrs: false });

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
const attrs = useAttrs();
const isCustomElement = Boolean(getCurrentInstance()?.ce);
const forwardedAttrs = computed(() => isCustomElement ? { ...attrs, id: undefined } : attrs);

const root = ref(null);
const trigger = ref(null);
const searchInput = ref(null);
const menuPanel = ref(null);
const itemButtons = ref([]);
const query = ref("");
const activeIndex = ref(-1);
// Keep object-valued choices identical to the consumer's DOM property values.
const localValue = shallowRef(props.modelValue);
const localOpen = ref(props.open && !props.disabled);
let ownerDocument;
const menuId = `kima-menu-${useId()}`;
const triggerId = `${menuId}-trigger`;

const menuPlacement = computed(() => {
  const placements = ["bottom-start", "bottom-end", "top-start", "top-end"];
  return placements.includes(props.placement) ? props.placement : "bottom-start";
});
const visibleItems = computed(() => {
  const text = query.value.trim().toLocaleLowerCase();
  if (!text) return props.items;
  return props.items.filter((item) => `${item.label} ${item.description || ""}`.toLocaleLowerCase().includes(text));
});
const selectedItem = computed(() => props.items.find((item) => Object.is(item.value, localValue.value)) || null);
const selectedLabel = computed(() => selectedItem.value ? selectedItem.value.label : props.label);

function setItemRef(element, index) {
  itemButtons.value[index] = element;
}

function firstEnabledIndex() {
  return visibleItems.value.findIndex((item) => !item.disabled);
}

function lastEnabledIndex() {
  for (let index = visibleItems.value.length - 1; index >= 0; index -= 1) {
    if (!visibleItems.value[index].disabled) return index;
  }
  return -1;
}

function selectedVisibleIndex() {
  const index = visibleItems.value.findIndex((item) => Object.is(item.value, localValue.value) && !item.disabled);
  return index >= 0 ? index : firstEnabledIndex();
}

function focusItem(index) {
  if (index < 0 || !visibleItems.value[index] || visibleItems.value[index].disabled) return;
  activeIndex.value = index;
  nextTick(() => { if (localOpen.value) itemButtons.value[index]?.focus(); });
}

function moveActive(step) {
  const count = visibleItems.value.length;
  if (!count) return;
  let next = activeIndex.value;
  for (let attempts = 0; attempts < count; attempts += 1) {
    next = (next + step + count) % count;
    if (!visibleItems.value[next].disabled) {
      focusItem(next);
      return;
    }
  }
}

function openMenu(preferLast = false) {
  if (props.disabled || localOpen.value) return;
  query.value = "";
  activeIndex.value = preferLast ? lastEnabledIndex() : selectedVisibleIndex();
  localOpen.value = true;
  emit("update:open", true);
}

function closeMenu(restoreFocus = true) {
  if (!localOpen.value) return;
  // Outside clicks and Tab keep their destination; explicit dismissal returns focus now.
  if (restoreFocus) trigger.value?.focus();
  localOpen.value = false;
  emit("update:open", false);
}

function toggleMenu() {
  if (localOpen.value) closeMenu();
  else openMenu();
}

function selectItem(item) {
  if (props.disabled || item.disabled) return;
  if (!Object.is(item.value, localValue.value)) {
    localValue.value = item.value;
    emit("update:modelValue", item.value);
    emit("change", item.value);
  }
  closeMenu();
}

function selectActive() {
  const item = visibleItems.value[activeIndex.value];
  if (item) selectItem(item);
}

function handleTriggerKeydown(event) {
  if (props.disabled || event.isComposing) return;
  if (event.key === "Escape" && localOpen.value) {
    event.preventDefault();
    event.stopPropagation();
    closeMenu();
    return;
  }
  if (event.key === "Tab") {
    closeMenu(false);
    return;
  }
  if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
    event.preventDefault();
    openMenu();
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    openMenu(true);
  }
}

function handleMenuKeydown(event) {
  if (event.isComposing) return;
  if (event.target === searchInput.value && [" ", "Home", "End"].includes(event.key)) return;
  if (event.key === "Tab") {
    closeMenu(false);
    return;
  }
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
    event.stopPropagation();
    closeMenu();
  }
}

function handleOutside(event) {
  if (localOpen.value && !event.composedPath().includes(root.value)) closeMenu(false);
}

function focusOpenedMenu() {
  if (!localOpen.value) return;
  if (props.searchable) {
    searchInput.value?.focus();
    return;
  }
  const index = activeIndex.value >= 0 ? activeIndex.value : selectedVisibleIndex();
  if (index >= 0) focusItem(index);
  else menuPanel.value?.focus();
}

watch(() => props.modelValue, (value) => { localValue.value = value; });
watch(() => props.open, (open) => {
  if (open) {
    query.value = "";
    activeIndex.value = selectedVisibleIndex();
  }
  localOpen.value = open && !props.disabled;
});
watch(() => props.disabled, (disabled) => { if (disabled) closeMenu(false); });
watch(localOpen, (open) => {
  if (open) nextTick(focusOpenedMenu);
}, { immediate: true });

watch(visibleItems, () => {
  activeIndex.value = selectedVisibleIndex();
}, { flush: "sync" });

onMounted(() => {
  ownerDocument = root.value.ownerDocument;
  ownerDocument.addEventListener("pointerdown", handleOutside);
  ownerDocument.addEventListener("focusin", handleOutside);
});
onBeforeUnmount(() => {
  ownerDocument.removeEventListener("pointerdown", handleOutside);
  ownerDocument.removeEventListener("focusin", handleOutside);
});
</script>

<template>
   <div ref="root" v-bind="forwardedAttrs" class="kima-menu" :class="{ 'kima-menu--open': localOpen }">
    <button
      :id="triggerId"
      ref="trigger"
      class="kima-menu__trigger"
      type="button"
      :disabled="disabled"
      aria-haspopup="menu"
      :aria-expanded="localOpen"
      :aria-controls="menuId"
      @click="toggleMenu"
      @keydown="handleTriggerKeydown"
    >
      <slot name="trigger" :open="localOpen" :selected-item="selectedItem" :value="localValue">
        <span class="kima-menu__trigger-label">{{ selectedLabel }}</span>
      </slot>
      <HugeiconsIcon class="kima-menu__trigger-icon" :icon="ArrowDown01Icon" :size="20" aria-hidden="true" />
    </button>

    <div
      v-if="localOpen"
      ref="menuPanel"
      :id="menuId"
      class="kima-menu__popup"
      :class="`kima-menu__popup--${menuPlacement}`"
      role="menu"
      tabindex="-1"
      :aria-labelledby="triggerId"
      @keydown="handleMenuKeydown"
    >
      <div v-if="searchable" class="kima-menu__search-wrap">
        <HugeiconsIcon class="kima-menu__search-icon" :icon="Search01Icon" :size="18" aria-hidden="true" />
        <input
          ref="searchInput"
          v-model="query"
          class="kima-menu__search"
          type="search"
          role="searchbox"
          aria-label="搜索菜单项"
          :aria-controls="menuId"
          @input.stop
          @change.stop
          @keydown.stop="handleMenuKeydown"
        >
      </div>

      <div class="kima-menu__items">
        <button
          v-for="(item, index) in visibleItems"
          :key="index"
          :ref="(element) => setItemRef(element, index)"
          class="kima-menu__item"
          type="button"
          role="menuitemradio"
          :disabled="item.disabled"
          :aria-disabled="item.disabled || undefined"
          :aria-checked="Object.is(item.value, localValue)"
          :tabindex="index === activeIndex ? 0 : -1"
          @click="selectItem(item)"
          @focus="activeIndex = index"
        >
          <span class="kima-menu__item-copy">
            <span class="kima-menu__item-label">{{ item.label }}</span>
            <span v-if="item.description" class="kima-menu__item-description">{{ item.description }}</span>
          </span>
          <HugeiconsIcon
            v-if="Object.is(item.value, localValue)"
            class="kima-menu__item-check"
            :icon="Tick01Icon"
            :size="18"
            aria-hidden="true"
          />
        </button>
        <div v-if="visibleItems.length === 0" class="kima-menu__empty" role="status">没有匹配项目</div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.kima-menu {
  position: relative;
  display: inline-flex;
  min-width: 180px;
  color: var(--kima-color-on-surface);
  font-family: var(--kima-font-family);
}

.kima-menu__trigger {
  box-sizing: border-box;
  display: inline-flex;
  width: 100%;
  min-height: 56px;
  align-items: center;
  justify-content: space-between;
  gap: var(--kima-space-3);
  padding: 0 var(--kima-space-4);
  border: 1px solid var(--kima-color-outline);
  border-radius: var(--kima-radius-md);
  color: var(--kima-color-on-surface);
  background: var(--kima-color-surface-container);
  font: inherit;
  cursor: pointer;
  transition: border-color var(--kima-duration-fast) var(--kima-ease-standard), background-color var(--kima-duration-fast) var(--kima-ease-standard);

  &:hover:not(:disabled),
  .kima-menu--open & {
    border-color: var(--kima-color-primary);
    background: var(--kima-color-surface-container-high);
  }

  &:focus-visible {
    outline: 2px solid var(--kima-color-primary);
    outline-offset: 2px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: var(--kima-opacity-disabled);
  }
}

.kima-menu__trigger-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kima-menu__trigger-icon {
  flex: 0 0 auto;
  color: var(--kima-color-on-surface-variant);
  transition: transform var(--kima-duration-fast) var(--kima-ease-standard);
}

.kima-menu--open .kima-menu__trigger-icon {
  transform: rotate(180deg);
}

.kima-menu__popup {
  box-sizing: border-box;
  position: absolute;
  z-index: 20;
  width: max(100%, 220px);
  max-height: 360px;
  overflow: auto;
  padding: var(--kima-space-2);
  border: 1px solid var(--kima-color-outline);
  border-radius: var(--kima-radius-md);
  background: var(--kima-color-surface-container);
  box-shadow: 0 12px 28px color-mix(in srgb, var(--kima-color-surface) 55%, var(--kima-color-transparent));
  animation: kima-menu-enter var(--kima-duration-fast) var(--kima-ease-emphasized);

  &--bottom-start {
    top: calc(100% + var(--kima-space-2));
    left: 0;
  }

  &--bottom-end {
    top: calc(100% + var(--kima-space-2));
    right: 0;
  }

  &--top-start {
    bottom: calc(100% + var(--kima-space-2));
    left: 0;
  }

  &--top-end {
    right: 0;
    bottom: calc(100% + var(--kima-space-2));
  }
}

.kima-menu__search-wrap {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: var(--kima-space-2);
}

.kima-menu__search-icon {
  position: absolute;
  left: var(--kima-space-3);
  color: var(--kima-color-on-surface-variant);
  pointer-events: none;
}

.kima-menu__search {
  box-sizing: border-box;
  width: 100%;
  min-height: 40px;
  padding: 0 var(--kima-space-3) 0 40px;
  border: 1px solid var(--kima-color-outline);
  border-radius: var(--kima-radius-sm);
  color: var(--kima-color-on-surface);
  background: var(--kima-color-surface);
  font: inherit;

  &:focus {
    border-color: var(--kima-color-primary);
    outline: 2px solid var(--kima-color-primary);
    outline-offset: 1px;
  }
}

.kima-menu__items {
  display: grid;
  gap: var(--kima-space-1);
}

.kima-menu__item {
  box-sizing: border-box;
  display: flex;
  width: 100%;
  min-height: 40px;
  align-items: center;
  justify-content: space-between;
  gap: var(--kima-space-3);
  padding: 0 var(--kima-space-3);
  border: 0;
  border-radius: var(--kima-radius-sm);
  color: var(--kima-color-on-surface);
  background: var(--kima-color-transparent);
  font: inherit;
  text-align: left;
  cursor: pointer;

  &:hover:not(:disabled),
  &:focus-visible {
    background: var(--kima-color-surface-container-high);
  }

  &:focus-visible {
    outline: 2px solid var(--kima-color-primary);
    outline-offset: -2px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: var(--kima-opacity-disabled);
  }
}

.kima-menu__item-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kima-menu__item-copy {
  display: grid;
  min-width: 0;
  gap: var(--kima-space-1);
  padding-block: var(--kima-space-2);
}

.kima-menu__item-description {
  color: var(--kima-color-on-surface-variant);
  font-size: var(--kima-font-size-sm);
  overflow-wrap: anywhere;
}

.kima-menu__item-check {
  flex: 0 0 auto;
  color: var(--kima-color-primary);
}

.kima-menu__empty {
  padding: var(--kima-space-3);
  color: var(--kima-color-on-surface-variant);
  text-align: center;
}

@keyframes kima-menu-enter {
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
