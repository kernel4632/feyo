<!--
卡片：提供表面、描边和抬升三种容器样式，也支持可点击和分区插槽。
调用示例：
  <feyo-card variant="outlined" clickable aria-label="打开账户设置" @click="openSettings">
    <template #header><h2>账户设置</h2></template>
    <p>管理登录方式和通知偏好。</p>
    <template #footer><button type="button">查看详情</button></template>
  </feyo-card>
-->
<script setup>
import { computed } from "vue";

const props = defineProps({
  variant: {
    type: String,
    default: "surface",
  },
  clickable: Boolean,
  disabled: Boolean,
});

const emit = defineEmits(["click"]);

const cardVariant = computed(() => {
  const variants = ["surface", "outlined", "elevated"];
  return variants.includes(props.variant) ? props.variant : "surface";
});

function activate(event) {
  if (!props.clickable || props.disabled) return;
  if (event.target !== event.currentTarget && event.target.closest?.("button, a, input, select, textarea, [role='button']")) return;
  emit("click", event);
}

function handleKeydown(event) {
  if (!props.clickable || props.disabled) return;

  if (event.key === "Enter") {
    event.preventDefault();
    activate(event);
  } else if (event.key === " ") {
    event.preventDefault();
  }
}

function handleKeyup(event) {
  if (event.key !== " ") return;
  event.preventDefault();
  activate(event);
}
</script>

<template>
  <article
    class="feyo-card"
    :class="[
      `feyo-card--${cardVariant}`,
      {
        'feyo-card--clickable': clickable,
        'feyo-card--disabled': disabled,
      },
    ]"
    :role="clickable ? 'button' : undefined"
    :tabindex="clickable && !disabled ? 0 : undefined"
    :aria-disabled="disabled ? 'true' : undefined"
    @click.stop="activate"
    @keydown="handleKeydown"
    @keyup="handleKeyup"
  >
    <header v-if="$slots.header" class="feyo-card__header"><slot name="header" /></header>
    <div v-if="$slots.default" class="feyo-card__body"><slot /></div>
    <footer v-if="$slots.footer" class="feyo-card__footer"><slot name="footer" /></footer>
  </article>
</template>

<style scoped lang="scss">
.feyo-card {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--feyo-space-4);
  padding: var(--feyo-space-5);
  border: 1px solid var(--feyo-color-transparent);
  border-radius: 12px;
  color: var(--feyo-color-on-surface);
  background: var(--feyo-color-surface-container);
  font-family: var(--feyo-font-family);
  transition:
    background-color var(--feyo-duration-fast) var(--feyo-ease-standard),
    border-color var(--feyo-duration-fast) var(--feyo-ease-standard),
    box-shadow var(--feyo-duration-fast) var(--feyo-ease-standard),
    opacity var(--feyo-duration-fast) var(--feyo-ease-standard);
}

.feyo-card--outlined {
  border-color: var(--feyo-color-outline);
  background: var(--feyo-color-transparent);
}

.feyo-card--elevated {
  background: var(--feyo-color-surface-container-high);
  box-shadow: 0 8px 20px color-mix(in srgb, var(--feyo-color-surface) 55%, var(--feyo-color-transparent));
}

.feyo-card--clickable {
  cursor: pointer;
}

.feyo-card--clickable:not(.feyo-card--disabled):hover {
  background: var(--feyo-color-surface-container-high);
}

.feyo-card--clickable:not(.feyo-card--disabled):focus-visible {
  outline: 2px solid var(--feyo-color-primary);
  outline-offset: 2px;
}

.feyo-card--disabled {
  cursor: not-allowed;
  opacity: var(--feyo-opacity-disabled);
}

.feyo-card__header,
.feyo-card__footer {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: var(--feyo-space-3);
}

.feyo-card__body {
  min-width: 0;
}

.feyo-card__footer {
  justify-content: flex-end;
}
</style>
