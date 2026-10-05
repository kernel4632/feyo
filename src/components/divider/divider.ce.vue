<!--
分割线：用水平或垂直的语义分隔线组织内容，也可以在中间显示文字或插槽内容。
调用示例：
  <feyo-divider />
  <feyo-divider inset label="或者" />
  <feyo-divider vertical><span aria-hidden="true">+</span></feyo-divider>
-->
<script setup>
import { Comment, computed, ref, useAttrs, useSlots } from "vue";
import { useNativeSlots } from "../../utils/native-slots.js";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  vertical: Boolean,
  inset: Boolean,
  label: {
    type: String,
    default: "",
  },
});

const slots = useSlots();
const attrs = useAttrs();
const root = ref(null);
const { hasNativeSlot, isCustomElement } = useNativeSlots(root);
const forwardedAttrs = computed(() => isCustomElement ? { ...attrs, id: undefined } : attrs);
const hasSlotContent = computed(() => slots.default?.().some((vnode) => {
  if (vnode.type === Comment) return false;
  return typeof vnode.children !== "string" || vnode.children.trim().length > 0;
}) || hasNativeSlot("default"));
const hasContent = computed(() => Boolean(props.label.trim()) || hasSlotContent.value);
</script>

<template>
  <div
    ref="root"
    v-bind="forwardedAttrs"
    class="feyo-divider"
    :class="{
      'feyo-divider--vertical': vertical,
      'feyo-divider--inset': inset,
      'feyo-divider--labeled': hasContent,
    }"
    role="separator"
    :aria-orientation="vertical ? 'vertical' : undefined"
  >
    <span class="feyo-divider__line" aria-hidden="true" />
    <span v-if="hasContent" class="feyo-divider__label">
      <slot v-if="hasSlotContent" />
      <template v-else>{{ label }}</template>
    </span>
    <span v-if="hasContent" class="feyo-divider__line" aria-hidden="true" />
  </div>
</template>

<style scoped lang="scss">
.feyo-divider {
  display: flex;
  width: 100%;
  min-height: 1px;
  align-items: center;
  gap: var(--feyo-space-3);
  color: var(--feyo-color-on-surface-variant);
  font-family: var(--feyo-font-family);
}

.feyo-divider--inset:not(.feyo-divider--vertical) {
  width: auto;
  margin-inline: var(--feyo-space-6);
}

.feyo-divider__line {
  display: block;
  min-width: 0;
  flex: 1 1 auto;
  height: 1px;
  background: var(--feyo-color-outline);
}

.feyo-divider__label {
  flex: 0 0 auto;
  font-size: var(--feyo-font-size-sm);
  line-height: 1.4;
  text-align: center;
}

.feyo-divider--vertical {
  width: 1px;
  min-height: 48px;
  height: 100%;
  flex-direction: column;
  gap: var(--feyo-space-2);
}

.feyo-divider--vertical.feyo-divider--inset {
  height: auto;
  margin-block: var(--feyo-space-6);
}

.feyo-divider--vertical .feyo-divider__line {
  width: 1px;
  min-height: 0;
  height: auto;
  flex: 1 1 auto;
}

.feyo-divider--vertical .feyo-divider__label {
  writing-mode: vertical-rl;
}
</style>
