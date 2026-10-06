<!--
图标：包一层Hugeicons，全库统一线宽。
Hugeicons 的图标数据自带 stroke-width 1.5，在放大的控件里偏细，所以这里默认改成 2。
想改动全库图标粗细，只改下面的 --kima-icon-stroke-width，不要在各个组件里单独传 strokeWidth。
调用示例：
  <kima-icon :icon="Search01Icon" :size="20" />
  <kima-icon :icon="StarIcon" :size="32" class="my-icon" />
-->
<script setup>
import { computed } from "vue";
import { HugeiconsIcon } from "@hugeicons/vue";

const props = defineProps({
  icon: {
    type: [Object, Array],
    required: true,
  },
  // 图标边长。默认取控件图标的标准档 24。
  size: {
    type: [Number, String],
    default: 24,
  },
  color: {
    type: String,
    default: "currentColor",
  },
});

// 默认 2 倍线宽：Hugeicons 自带的 1.5 在放大尺寸下显得太细。
const strokeWidth = computed(() => 2);
</script>

<template>
  <HugeiconsIcon
    class="kima-icon"
    :icon="props.icon"
    :size="props.size"
    :color="props.color"
    :stroke-width="strokeWidth"
  />
</template>

<style scoped lang="scss">
/* 图标永远不参与伸缩：放进 flex 容器时不会被压扁，跟文字混排时也对齐中线。 */
.kima-icon {
  display: inline-block;
  flex: none;
  vertical-align: middle;
}
</style>
