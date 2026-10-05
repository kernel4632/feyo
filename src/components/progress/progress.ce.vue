<!--
进度条：使用原生 progress 元素，保留浏览器的进度语义和不确定状态。
调用示例：
  <feyo-progress :value="downloaded" label="下载进度" />
  <feyo-progress indeterminate label="正在连接" />
-->
<script setup>
import { computed, useAttrs } from "vue";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  value: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  indeterminate: { type: Boolean, default: false },
  label: { type: String, default: "" },
});

const attrs = useAttrs();
const safeValue = computed(() => Math.max(0, Math.min(props.max, props.value)));
</script>

<template>
  <label class="feyo-progress">
    <span v-if="label" class="feyo-progress__label">{{ label }}</span>
    <progress
      v-bind="attrs"
      class="feyo-progress__bar"
      :class="{ 'feyo-progress__bar--indeterminate': indeterminate }"
      :value="indeterminate ? undefined : safeValue"
      :max="max"
      :aria-label="label || undefined"
    />
  </label>
</template>

<style scoped lang="scss">
.feyo-progress {
  display: block;
  width: 100%;
  color: var(--feyo-color-on-surface);

  &__label {
    display: block;
    margin-bottom: var(--feyo-space-2);
    color: var(--feyo-color-on-surface-variant);
    line-height: 1.35;
  }

  &__bar {
    display: block;
    width: 100%;
    height: 8px;
    overflow: hidden;
    appearance: none;
    border: 0;
    border-radius: var(--feyo-radius-full);
    background: var(--feyo-color-surface-container-high);
  }

  &__bar::-webkit-progress-bar {
    border-radius: var(--feyo-radius-full);
    background: var(--feyo-color-surface-container-high);
  }

  &__bar::-webkit-progress-value {
    border-radius: var(--feyo-radius-full);
    background: var(--feyo-color-primary);
  }

  &__bar::-moz-progress-bar {
    border-radius: var(--feyo-radius-full);
    background: var(--feyo-color-primary);
  }

  &__bar--indeterminate::-webkit-progress-value {
    background: var(--feyo-color-primary);
  }
}
</style>
