<!--
进度条：使用原生 progress 元素，保留浏览器的进度语义和不确定状态。
调用示例：
  <feyo-progress :value="downloaded" label="下载进度" />
  <feyo-progress indeterminate label="正在连接" />
-->
<script setup>
import { computed, getCurrentInstance, useAttrs } from "vue";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  value: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  indeterminate: { type: Boolean, default: false },
  label: { type: String, default: "" },
});

const attrs = useAttrs();
const isCustomElement = Boolean(getCurrentInstance()?.ce);
const forwardedAttrs = computed(() => isCustomElement ? { ...attrs, id: undefined } : attrs);
const safeMax = computed(() => Number.isFinite(props.max) && props.max > 0 ? props.max : 100);
const safeValue = computed(() => Number.isFinite(props.value) ? Math.max(0, Math.min(safeMax.value, props.value)) : 0);
</script>

<template>
  <label class="feyo-progress">
    <span v-if="label" class="feyo-progress__label">{{ label }}</span>
    <span class="feyo-progress__track">
       <progress
         v-bind="forwardedAttrs"
        class="feyo-progress__bar"
        :value="indeterminate ? undefined : safeValue"
        :max="safeMax"
        :aria-label="attrs['aria-label'] || label || undefined"
      />
      <span v-if="indeterminate" class="feyo-progress__motion" aria-hidden="true"><span /></span>
    </span>
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

  &__track {
    position: relative;
    display: block;
    height: 8px;
    overflow: hidden;
    border-radius: var(--feyo-radius-full);
  }

  &__motion {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: var(--feyo-color-surface-container-high);
    pointer-events: none;

    > span {
      display: block;
      width: 40%;
      height: 100%;
      border-radius: var(--feyo-radius-full);
      background: var(--feyo-color-primary);
      animation: feyo-progress-motion 1.4s linear infinite;
    }
  }
}

@keyframes feyo-progress-motion {
  from { transform: translateX(-100%); }
  to { transform: translateX(250%); }
}

@media (prefers-reduced-motion: reduce) {
  .feyo-progress__motion > span {
    margin-inline: auto;
    animation: none;
  }
}
</style>
