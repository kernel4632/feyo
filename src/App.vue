<script setup>
import { HugeiconsIcon } from "@hugeicons/vue";
import { SparklesIcon } from "@hugeicons/core-free-icons";
</script>

<template>
  <main class="feyo-boot">
    <HugeiconsIcon :icon="SparklesIcon" :size="28" :stroke-width="1.6" />
    <h1 class="feyo-boot__title">FEYO</h1>
    <p class="feyo-boot__subtitle">Flow, Ease, Yield, Orientation</p>
    <p class="feyo-boot__note">设计系统基础已就绪</p>
  </main>
</template>

<style scoped lang="scss">
.feyo-boot {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--feyo-space-3);
  text-align: center;
  color: var(--feyo-color-primary);

  &__title {
    margin: 0;
    font-size: var(--feyo-font-size-xl);
    font-weight: var(--feyo-font-weight-bold);
    letter-spacing: 0.08em;
    color: var(--feyo-color-on-surface);
  }

  &__subtitle {
    margin: 0;
    color: var(--feyo-color-on-surface-variant);
  }

  &__note {
    margin: 0;
    font-size: var(--feyo-font-size-sm);
    color: var(--feyo-color-on-surface-variant);
  }
}
</style>
