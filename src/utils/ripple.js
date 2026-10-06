/*
波纹：在宿主元素里从指针位置长出一个圆，再淡出。
照 DMS 的 DankRipple 搬到 Web，让按钮、图标按钮和分段共用同一效果。
调用示例：
  const root = ref(null);
  useRipple(root);
  // root 指向的元素要套用 feyo-ripple-host mixin。
*/
import { onBeforeUnmount, onMounted } from "vue";

export function useRipple(host) {
  let element = null;

  // 一次点击长一个圆，位置和大小按宿主尺寸和指针坐标算。
  function onPointerDown(event) {
    if (!element || element.disabled || event.button !== 0) return;
    const bounds = element.getBoundingClientRect();
    const diameter = Math.max(bounds.width, bounds.height) * 2;
    const ripple = document.createElement("span");
    ripple.className = "feyo-ripple";
    ripple.style.width = `${diameter}px`;
    ripple.style.height = `${diameter}px`;
    ripple.style.left = `${event.clientX - bounds.left - diameter / 2}px`;
    ripple.style.top = `${event.clientY - bounds.top - diameter / 2}px`;
    ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
    element.append(ripple);
  }

  onMounted(() => {
    element = host.value;
    element?.addEventListener("pointerdown", onPointerDown);
  });
  onBeforeUnmount(() => element?.removeEventListener("pointerdown", onPointerDown));
}
