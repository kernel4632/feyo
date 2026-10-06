/*
原生插槽：在 Vue 自定义元素模式下观察宿主的直接子节点，并告诉组件某个插槽是否有内容。
调用示例：
  const root = ref(null)
  const { hasNativeSlot } = useNativeSlots(root)
  // <kima-card><span>内容</span></kima-card>
  hasNativeSlot('default')
*/
import { getCurrentInstance, onBeforeUnmount, onMounted, ref, useHost } from "vue";

// 只处理 Vue 自定义元素；普通 Vue 组件仍由 Vue 自己管理插槽。
export function useNativeSlots(rootRef) {
  const isCustomElement = Boolean(getCurrentInstance()?.ce);
  const host = isCustomElement ? useHost() : null;
  const slotNames = ref(new Set());
  let observer;

  function updateSlotNames() {
    if (!isCustomElement || !host) {
      slotNames.value = new Set();
      return;
    }

    const names = new Set();
    for (const node of host.childNodes) {
      if (node.nodeType === 8) continue;
      if (node.nodeType === 3) {
        if (node.textContent.trim()) names.add("default");
        continue;
      }
      if (node.nodeType === 1) names.add(node.getAttribute("slot")?.trim() || "default");
    }
    slotNames.value = names;
  }

  function hasNativeSlot(name = "default") {
    return isCustomElement && slotNames.value.has(name || "default");
  }

  onMounted(() => {
    if (!isCustomElement || !host) return;
    updateSlotNames();
    observer = new MutationObserver(updateSlotNames);
    observer.observe(host, {
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["slot"],
      subtree: true,
    });
  });

  onBeforeUnmount(() => observer?.disconnect());

  return { hasNativeSlot, isCustomElement };
}
