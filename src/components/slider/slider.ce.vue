<!--
滑块：保留原生 range 的键盘、拖动和表单能力，并采用 FEYO 参考结构的 16px 轨道与 4×28px 滑块。
调用示例：
  <feyo-slider v-model="volume" label="音量" :show-value="true" name="volume" />
-->
<script setup>
import { computed, ref, useAttrs, watch } from "vue";

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
const localValue = ref(Number(props.modelValue));

// 外部值变化时同步；拖动过程中先更新本地值，保证原生控件不等待父组件回写。
watch(
  () => props.modelValue,
  (value) => {
    localValue.value = Number(value);
  },
);

const fill = computed(() => {
  const range = props.max - props.min;
  if (range <= 0) return "0%";
  const ratio = (localValue.value - props.min) / range;
  return `${Math.max(0, Math.min(1, ratio)) * 100}%`;
});

// input 事件用于连续同步，原生 change 事件用于提交一次完整改动。
function handleInput(event) {
  localValue.value = Number(event.target.value);
  emit("update:modelValue", localValue.value);
}

function handleChange(event) {
  localValue.value = Number(event.target.value);
  emit("change", localValue.value);
}
</script>

<template>
  <label
    class="feyo-slider"
    :class="{ 'feyo-slider--disabled': disabled }"
  >
    <span v-if="label || showValue" class="feyo-slider__header">
      <span v-if="label" class="feyo-slider__label">{{ label }}</span>
      <output v-if="showValue" class="feyo-slider__value">{{ localValue }}</output>
    </span>
    <input
      v-bind="attrs"
      class="feyo-slider__input"
      type="range"
      :value="localValue"
      :min="min"
      :max="max"
      :step="step"
      :disabled="disabled"
      :required="required"
      :name="name"
      :style="{ '--feyo-slider-fill': fill }"
      @input.stop="handleInput"
      @change.stop="handleChange"
    />
  </label>
</template>

<style scoped lang="scss">
.feyo-slider {
  display: block;
  width: 100%;
  color: var(--feyo-color-on-surface);

  &__header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--feyo-space-3);
    margin-bottom: var(--feyo-space-2);
  }

  &__label,
  &__value {
    color: var(--feyo-color-on-surface);
    line-height: 1.35;
  }

  &__value {
    color: var(--feyo-color-on-surface-variant);
    font-variant-numeric: tabular-nums;
  }

  &__input {
    display: block;
    width: 100%;
    height: 28px;
    margin: 0;
    appearance: none;
    background: var(--feyo-color-transparent);
    cursor: pointer;

    &::-webkit-slider-runnable-track {
      height: 16px;
      border-radius: var(--feyo-radius-full);
      background: linear-gradient(
        to right,
        var(--feyo-color-primary) 0 var(--feyo-slider-fill),
        var(--feyo-color-surface-container-high) var(--feyo-slider-fill) 100%
      );
    }

    &::-webkit-slider-thumb {
      width: 4px;
      height: 28px;
      margin-top: -6px;
      appearance: none;
      border: 0;
      border-radius: var(--feyo-radius-full);
      background: var(--feyo-color-primary);
    }

    &::-moz-range-track {
      height: 16px;
      border-radius: var(--feyo-radius-full);
      background: var(--feyo-color-surface-container-high);
    }

    &::-moz-range-progress {
      height: 16px;
      border-radius: var(--feyo-radius-full);
      background: var(--feyo-color-primary);
    }

    &::-moz-range-thumb {
      width: 4px;
      height: 28px;
      border: 0;
      border-radius: var(--feyo-radius-full);
      background: var(--feyo-color-primary);
    }

    &:focus-visible {
      outline: 2px solid var(--feyo-color-primary);
      outline-offset: 3px;
    }

    &:disabled {
      cursor: not-allowed;
    }
  }

  &--disabled {
    opacity: var(--feyo-opacity-disabled);
  }
}
</style>
