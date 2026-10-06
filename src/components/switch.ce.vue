<!--
开关：用原生 checkbox 承担表单和辅助技术语义，再用 52×32 的轨道显示状态。
几何和颜色照 DMS 的 DankToggle 对齐：轨道 52×32，滑块 16/24/28，选中轨道无描边。
调用示例：
  <feyo-switch v-model="enabled" name="enabled"><span>启用同步</span></feyo-switch>
-->
<script setup>
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue";
import { HugeiconsIcon } from "@hugeicons/vue";
import { Tick02Icon } from "@hugeicons/core-free-icons";
import { useNativeSlots } from "../utils/native-slots.js";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  required: { type: Boolean, default: false },
  name: { type: String, default: undefined },
  value: { type: String, default: "on" },
});

const emit = defineEmits(["update:modelValue", "change"]);
const attrs = useAttrs();
const root = ref(null);
const { hasNativeSlot, isCustomElement } = useNativeSlots(root);
const forwardedAttrs = computed(() => isCustomElement ? { ...attrs, id: undefined } : attrs);
const localValue = ref(props.modelValue || attrs.checked === "" || attrs.checked === true);
const input = ref(null);
let resetValue;
let ownerDocument;

// 本地状态让没有立即回写 modelValue 的 Web Component 仍能完成点击反馈。
watch(
  () => props.modelValue,
  (value) => {
    localValue.value = value;
  },
);

// 原生 change 是开关状态完成切换的边界。
function handleChange(event) {
  localValue.value = event.target.checked;
  emit("update:modelValue", localValue.value);
  emit("change", localValue.value);
}

function handleReset(event) {
  if (event.target !== input.value.form) return;
  queueMicrotask(() => {
    if (event.defaultPrevented || !input.value) return;
    const changed = localValue.value !== resetValue;
    localValue.value = resetValue;
    input.value.checked = resetValue;
    if (changed) emit("update:modelValue", resetValue);
  });
}

onMounted(() => {
  resetValue = localValue.value;
  input.value.defaultChecked = resetValue;
  ownerDocument = input.value.ownerDocument;
  ownerDocument.addEventListener("reset", handleReset, true);
});
onBeforeUnmount(() => ownerDocument.removeEventListener("reset", handleReset, true));
</script>

<template>
  <label
    ref="root"
    class="feyo-switch"
    :class="{ 'feyo-switch--disabled': disabled }"
  >
    <input
      ref="input"
       v-bind="forwardedAttrs"
      class="feyo-switch__input"
      type="checkbox"
      role="switch"
      :checked="localValue"
      :disabled="disabled"
      :required="required"
      :name="name"
      :value="value"
      @input.stop
      @change.stop="handleChange"
    />
    <span v-if="$slots.default || hasNativeSlot('default')" class="feyo-switch__label">
      <slot />
    </span>
    <span class="feyo-switch__track" aria-hidden="true">
      <span class="feyo-switch__thumb">
        <HugeiconsIcon class="feyo-switch__check" :icon="Tick02Icon" :size="16" />
      </span>
    </span>
  </label>
</template>

<style scoped lang="scss">
.feyo-switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  /* DMS 设置行：文字在左，开关在右，间距 spacingM 12。 */
  gap: var(--feyo-space-m);
  min-height: var(--feyo-switch-track-height);
  color: var(--feyo-color-on-surface);
  cursor: pointer;
  user-select: none;

  &__input {
    position: absolute;
    inset: 0;
    z-index: 1;
    width: 100%;
    height: 100%;
    margin: 0;
    opacity: 0;
    cursor: inherit;
  }

  &__label {
    min-width: 0;
    font-size: var(--feyo-font-size-medium);
    font-weight: var(--feyo-font-weight-medium);
    line-height: 1.35;
  }

  /* DMS：轨道 52×32，未选中 2px outline 描边、chipSurface 底。 */
  &__track {
    box-sizing: border-box;
    position: relative;
    flex: 0 0 var(--feyo-switch-track-width);
    width: var(--feyo-switch-track-width);
    height: var(--feyo-switch-track-height);
    border: var(--feyo-switch-outline-width) solid var(--feyo-color-outline);
    border-radius: var(--feyo-radius-full);
    background: var(--feyo-color-surface-container-high);
    transition:
      background-color var(--feyo-duration-effects) var(--feyo-ease-effects),
      border-color var(--feyo-duration-effects) var(--feyo-ease-effects);
  }

  /* 滑块：未选中 16，选中 24，按下 28；位置用 DMS 的 4px 内边距推算。 */
  &__thumb {
    box-sizing: border-box;
    position: absolute;
    top: 50%;
    left: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: var(--feyo-radius-full);
    background: var(--feyo-color-outline);
    transform: translateY(-50%);
    transition:
      left var(--feyo-duration-long) var(--feyo-ease-emphasized),
      width var(--feyo-duration-medium) var(--feyo-ease-emphasized),
      height var(--feyo-duration-medium) var(--feyo-ease-emphasized),
      background-color var(--feyo-duration-effects) var(--feyo-ease-effects);
  }

  &__check {
    color: var(--feyo-color-on-primary-container);
    opacity: 0;
    transition: opacity var(--feyo-duration-effects) var(--feyo-ease-effects);
  }

  &__input:checked ~ .feyo-switch__track {
    /* 选中：轨道 primary 无描边，滑块 onPrimary 带对勾。 */
    border-color: var(--feyo-color-primary);
    background: var(--feyo-color-primary);

    .feyo-switch__thumb {
      left: 24px;
      width: 24px;
      height: 24px;
      background: var(--feyo-color-on-primary);
    }

    .feyo-switch__check {
      opacity: 1;
    }
  }

  &__input:active ~ .feyo-switch__track .feyo-switch__thumb {
    left: 2px;
    width: var(--feyo-switch-thumb-pressed);
    height: var(--feyo-switch-thumb-pressed);
    background: var(--feyo-color-on-surface-variant);
  }

  &__input:checked:active ~ .feyo-switch__track .feyo-switch__thumb {
    left: 22px;
    background: var(--feyo-color-primary-container);
  }

  &__input:focus-visible ~ .feyo-switch__track {
    outline: var(--feyo-focus-ring-width) solid var(--feyo-color-primary);
    outline-offset: var(--feyo-focus-ring-offset);
  }

  /* DMS 禁用：轨道选中用 onSurface_12，滑块降到 onSurface_38。 */
  &--disabled {
    cursor: not-allowed;
  }

  &--disabled &__label {
    color: var(--feyo-color-on-surface-38);
  }

  &--disabled &__input:not(:checked) ~ .feyo-switch__track {
    background: color-mix(in srgb, var(--feyo-color-surface-container-high) 12%, transparent);
  }

  &--disabled &__input:checked ~ .feyo-switch__track {
    border-color: var(--feyo-color-on-surface-12);
    background: var(--feyo-color-on-surface-12);
  }

  &--disabled &__thumb {
    background: var(--feyo-color-on-surface-38);
  }

  &--disabled &__input:checked ~ .feyo-switch__track .feyo-switch__thumb {
    background: var(--feyo-color-surface);
  }
}
</style>
