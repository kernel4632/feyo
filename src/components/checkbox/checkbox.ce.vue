<!--
复选框：提供可参与表单提交的原生 checkbox，并显示 FEYO 的选中状态。
调用示例：
  <feyo-checkbox v-model="accepted" label="接受条款" name="accepted" required />
  <feyo-checkbox :model-value="true" label="已完成" indeterminate />
-->
<script setup>
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue";
import { useNativeSlots } from "../../utils/native-slots.js";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  indeterminate: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  required: { type: Boolean, default: false },
  name: { type: String, default: undefined },
  value: { type: String, default: "on" },
  label: { type: String, default: "" },
});

const emit = defineEmits(["update:modelValue", "change"]);
const attrs = useAttrs();
const root = ref(null);
const { hasNativeSlot, isCustomElement } = useNativeSlots(root);
const forwardedAttrs = computed(() => isCustomElement ? { ...attrs, id: undefined } : attrs);
const input = ref(null);
const localValue = ref(props.modelValue || attrs.checked === "" || attrs.checked === true);
const localIndeterminate = ref(props.indeterminate);
let resetValue;
let resetIndeterminate;
let ownerDocument;

// 外部值变化时同步显示；用户点击后先由本地值保证控件立即响应。
watch(
  () => props.modelValue,
  (value) => {
    localValue.value = value;
  },
);

// indeterminate 是 DOM 属性，不是可以可靠绑定的 HTML 属性。
watch(() => props.indeterminate, (value) => { localIndeterminate.value = value; });

// 原生 change 是复选框提交新状态的边界，两个事件都发送最新布尔值。
function handleChange(event) {
  localValue.value = event.target.checked;
  localIndeterminate.value = event.target.indeterminate;
  emit("update:modelValue", localValue.value);
  emit("change", localValue.value);
}

function handleReset(event) {
  if (event.target !== input.value.form) return;
  queueMicrotask(() => {
    if (event.defaultPrevented || !input.value) return;
    const changed = localValue.value !== resetValue;
    localValue.value = resetValue;
    localIndeterminate.value = resetIndeterminate;
    input.value.checked = resetValue;
    input.value.indeterminate = resetIndeterminate;
    if (changed) emit("update:modelValue", resetValue);
  });
}

onMounted(() => {
  resetValue = localValue.value;
  resetIndeterminate = localIndeterminate.value;
  input.value.defaultChecked = resetValue;
  ownerDocument = input.value.ownerDocument;
  ownerDocument.addEventListener("reset", handleReset, true);
});
onBeforeUnmount(() => ownerDocument.removeEventListener("reset", handleReset, true));
</script>

<template>
  <label
    ref="root"
    class="feyo-checkbox"
    :class="{
      'feyo-checkbox--checked': localValue,
      'feyo-checkbox--indeterminate': localIndeterminate,
      'feyo-checkbox--disabled': disabled,
    }"
  >
    <input
      ref="input"
       v-bind="forwardedAttrs"
      class="feyo-checkbox__input"
      type="checkbox"
      :checked="localValue"
      :indeterminate.prop="localIndeterminate"
      :disabled="disabled"
      :required="required"
      :name="name"
      :value="value"
      @input.stop
      @change.stop="handleChange"
    />
    <span class="feyo-checkbox__box" aria-hidden="true">
      <span class="feyo-checkbox__mark" />
    </span>
    <span v-if="label || $slots.default || hasNativeSlot('default')" class="feyo-checkbox__label">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<style scoped lang="scss">
.feyo-checkbox {
  position: relative;
  display: inline-flex;
  align-items: flex-start;
  gap: var(--feyo-space-2);
  min-height: 20px;
  color: var(--feyo-color-on-surface);
  cursor: pointer;
  user-select: none;

  &__input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    opacity: 0;
    cursor: inherit;
  }

  &__box {
    box-sizing: border-box;
    position: relative;
    flex: 0 0 20px;
    width: 20px;
    height: 20px;
    border: 2px solid var(--feyo-color-outline);
    border-radius: var(--feyo-radius-sm);
    background: var(--feyo-color-transparent);
    transition:
      background var(--feyo-duration-fast) var(--feyo-ease-standard),
      border-color var(--feyo-duration-fast) var(--feyo-ease-standard);
  }

  &__mark {
    position: absolute;
    inset: 3px;
    display: block;
    border-right: 2px solid var(--feyo-color-on-primary);
    border-bottom: 2px solid var(--feyo-color-on-primary);
    transform: rotate(45deg) scale(0);
    transition: transform var(--feyo-duration-fast) var(--feyo-ease-standard);
  }

  &__label {
    min-width: 0;
    padding-top: 1px;
    color: var(--feyo-color-on-surface);
    line-height: 1.35;
  }

  &--checked,
  &--indeterminate {
    .feyo-checkbox__box {
      border-color: var(--feyo-color-primary);
      background: var(--feyo-color-primary);
    }
  }

  &--checked .feyo-checkbox__mark {
    transform: rotate(45deg) scale(1);
  }

  &--indeterminate .feyo-checkbox__mark {
    inset: 7px 3px;
    border: 0;
    background: var(--feyo-color-on-primary);
    transform: none;
  }

  &__input:focus-visible + .feyo-checkbox__box {
    outline: 2px solid var(--feyo-color-primary);
    outline-offset: 2px;
  }

  &--disabled {
    color: var(--feyo-color-on-surface-variant);
    opacity: var(--feyo-opacity-disabled);
    cursor: not-allowed;
  }
}
</style>
