<!--
开关：用原生 checkbox 承担表单和辅助技术语义，再用 52×32 的轨道显示状态。
调用示例：
  <feyo-switch v-model="enabled" name="enabled"><span>启用同步</span></feyo-switch>
-->
<script setup>
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue";
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
    <span class="feyo-switch__track" aria-hidden="true">
      <span class="feyo-switch__thumb" />
    </span>
    <span v-if="$slots.default || hasNativeSlot('default')" class="feyo-switch__label">
      <slot />
    </span>
  </label>
</template>

<style scoped lang="scss">
.feyo-switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--feyo-space-3);
  min-height: 32px;
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

  &__track {
    box-sizing: border-box;
    position: relative;
    flex: 0 0 52px;
    width: 52px;
    height: 32px;
    border: 2px solid var(--feyo-color-outline);
    border-radius: var(--feyo-radius-full);
    background: var(--feyo-color-surface-container-high);
    transition:
      background var(--feyo-duration-normal) var(--feyo-ease-standard),
      border-color var(--feyo-duration-normal) var(--feyo-ease-standard);
  }

  &__thumb {
    box-sizing: border-box;
    position: absolute;
    top: 50%;
    left: 6px;
    width: 16px;
    height: 16px;
    border-radius: var(--feyo-radius-full);
    background: var(--feyo-color-outline);
    transform: translateY(-50%);
    transition:
      left var(--feyo-duration-normal) var(--feyo-ease-emphasized),
      width var(--feyo-duration-fast) var(--feyo-ease-emphasized),
      height var(--feyo-duration-fast) var(--feyo-ease-emphasized),
      background var(--feyo-duration-normal) var(--feyo-ease-standard);
  }

  &__label {
    min-width: 0;
    color: var(--feyo-color-on-surface);
    line-height: 1.35;
  }

  &__input:checked + .feyo-switch__track {
    border-color: var(--feyo-color-primary);
    background: var(--feyo-color-primary);

    .feyo-switch__thumb {
      left: 22px;
      width: 24px;
      height: 24px;
      background: var(--feyo-color-on-primary);
    }
  }

  &__input:active + .feyo-switch__track .feyo-switch__thumb {
    left: 0;
    width: 28px;
    height: 28px;
  }

  &__input:checked:active + .feyo-switch__track .feyo-switch__thumb {
    left: 20px;
  }

  &__input:focus-visible + .feyo-switch__track {
    outline: 2px solid var(--feyo-color-primary);
    outline-offset: 2px;
  }

  &--disabled {
    opacity: var(--feyo-opacity-disabled);
    cursor: not-allowed;
  }
}
</style>
