<!--
滑块：保留原生 range 的键盘、拖动和表单能力，并采用 KIMA 参考结构的 16px 轨道与 4×28px 滑块。
调用示例：
  <kima-slider v-model="volume" label="音量" :show-value="true" name="volume" />
-->
<script setup>
import { computed, getCurrentInstance, onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  modelValue: { type: Number, default: 0 },
  min: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  step: { type: Number, default: 1 },
  disabled: { type: Boolean, default: false },
  required: { type: Boolean, default: false },
  name: { type: String, default: undefined },
  label: { type: String, default: "" },
  showValue: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue", "change"]);
const attrs = useAttrs();
const isCustomElement = Boolean(getCurrentInstance()?.ce);
const forwardedAttrs = computed(() => isCustomElement ? { ...attrs, id: undefined } : attrs);
const input = ref(null);
let resetValue;
let ownerDocument;

const sliderMin = computed(() => Number.isFinite(props.min) ? props.min : 0);
const sliderMax = computed(() => Number.isFinite(props.max) ? Math.max(sliderMin.value, props.max) : sliderMin.value + 100);

function clampValue(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return sliderMin.value;
  return Math.max(sliderMin.value, Math.min(sliderMax.value, numericValue));
}

const localValue = ref(clampValue(props.modelValue));

// 外部值变化时同步；拖动过程中先更新本地值，保证原生控件不等待父组件回写。
watch(
  [() => props.modelValue, () => props.min, () => props.max],
  () => { localValue.value = clampValue(props.modelValue); },
);

const fill = computed(() => {
  const range = sliderMax.value - sliderMin.value;
  if (range <= 0) return "0%";
  const ratio = (localValue.value - sliderMin.value) / range;
  return `${Math.max(0, Math.min(1, ratio)) * 100}%`;
});

// input 事件用于连续同步，原生 change 事件用于提交一次完整改动。
function handleInput(event) {
  localValue.value = clampValue(event.target.value);
  emit("update:modelValue", localValue.value);
}

function handleChange(event) {
  localValue.value = clampValue(event.target.value);
  emit("change", localValue.value);
}

function handleReset(event) {
  if (event.target !== input.value.form) return;
  queueMicrotask(() => {
    if (event.defaultPrevented || !input.value) return;
    const nextValue = clampValue(resetValue);
    const changed = localValue.value !== nextValue;
    localValue.value = nextValue;
    input.value.value = String(nextValue);
    if (changed) emit("update:modelValue", nextValue);
  });
}

onMounted(() => {
  // The native range applies min/max/step before the mounted default is captured.
  localValue.value = clampValue(input.value.valueAsNumber);
  resetValue = localValue.value;
  input.value.defaultValue = String(resetValue);
  ownerDocument = input.value.ownerDocument;
  ownerDocument.addEventListener("reset", handleReset, true);
});
onBeforeUnmount(() => ownerDocument.removeEventListener("reset", handleReset, true));
</script>

<template>
  <label
    class="kima-slider"
    :class="{ 'kima-slider--disabled': disabled }"
  >
    <span v-if="label || showValue" class="kima-slider__header">
      <span v-if="label" class="kima-slider__label">{{ label }}</span>
      <output v-if="showValue" class="kima-slider__value">{{ localValue }}</output>
    </span>
     <input
       ref="input"
       v-bind="forwardedAttrs"
      class="kima-slider__input"
      type="range"
      :value="localValue"
       :min="sliderMin"
       :max="sliderMax"
      :step="step"
      :disabled="disabled"
      :required="required"
      :name="name"
      :style="{ '--kima-slider-fill': fill }"
      @input.stop="handleInput"
      @change.stop="handleChange"
    />
  </label>
</template>

<style scoped lang="scss">
.kima-slider {
  display: block;
  width: 100%;
  color: var(--kima-color-on-surface);

  &__header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--kima-space-3);
    margin-bottom: var(--kima-space-2);
  }

  &__label,
  &__value {
    color: var(--kima-color-on-surface);
    line-height: 1.35;
  }

  &__value {
    color: var(--kima-color-on-surface-variant);
    font-variant-numeric: tabular-nums;
  }

  &__input {
    /* DMS size s：轨道 24，滑块 36，圆角 8，控件高 = 滑块 36 + spacingXS 4。 */
    --kima-slider-fill-color: var(--kima-color-primary);
    --kima-slider-track-color: var(--kima-color-secondary-container);

    display: block;
    width: 100%;
    height: 40px;
    margin: 0;
    appearance: none;
    background: var(--kima-color-transparent);
    cursor: pointer;

    &::-webkit-slider-runnable-track {
      height: 24px;
      border-radius: var(--kima-radius-s);
      background: linear-gradient(
        to right,
        var(--kima-slider-fill-color) 0 var(--kima-slider-fill),
        var(--kima-slider-track-color) var(--kima-slider-fill) 100%
      );
    }

    /* DMS 滑块是 4px 宽的细竖条，高度 36。 */
    &::-webkit-slider-thumb {
      width: 4px;
      height: 36px;
      margin-top: -6px;
      appearance: none;
      border: 0;
      border-radius: var(--kima-radius-full);
      background: var(--kima-slider-fill-color);
    }

    &::-moz-range-track {
      height: 24px;
      border-radius: var(--kima-radius-s);
      background: var(--kima-slider-track-color);
    }

    &::-moz-range-progress {
      height: 24px;
      border-radius: var(--kima-radius-s);
      background: var(--kima-slider-fill-color);
    }

    &::-moz-range-thumb {
      width: 4px;
      height: 36px;
      border: 0;
      border-radius: var(--kima-radius-full);
      background: var(--kima-slider-fill-color);
    }

    &:focus-visible {
      outline: var(--kima-focus-ring-width) solid var(--kima-color-primary);
      outline-offset: var(--kima-focus-ring-offset);
    }

    /* DMS 禁用：已填充 onSurface_38，未填充 onSurface_12。 */
    &:disabled {
      --kima-slider-fill-color: var(--kima-color-on-surface-38);
      --kima-slider-track-color: var(--kima-color-on-surface-12);

      cursor: not-allowed;
    }
  }

  &--disabled &__label {
    color: var(--kima-color-on-surface-38);
  }
}
</style>
