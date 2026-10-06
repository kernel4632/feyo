/*
涟漪：在宿主元素里从指针按下位置长出一个圆，再淡出。
按钮、图标按钮、按钮组共用同一个效果，所以放在这里而不是各写一套。
调用示例：
  const root = ref(null);
  useRipple(root);
  // root 指向的元素要套 kima-ripple-host mixin（见 _mixins.scss），
  // 否则圆不会被裁进圆角里，也压不到内容下面。
*/
import { onBeforeUnmount, onMounted } from "vue";

export function useRipple(host) {
  let element = null;

  // 一次按下长一个圆。位置和大小按宿主尺寸和指针坐标算，
  // 直径取长边的两倍，保证从角落按下也能盖满整个控件。
  function onPointerDown(event) {
    if (!element || element.disabled || event.button !== 0) return;

    const bounds = element.getBoundingClientRect();
    const diameter = Math.max(bounds.width, bounds.height) * 2;
    const ripple = document.createElement("span");
    ripple.className = "kima-ripple";
    // 用 CSS 自定义属性传值，比逐个写内联样式好读，也方便动画里引用。
    ripple.style.setProperty("--kima-ripple-size", `${diameter}px`);
    ripple.style.setProperty("--kima-ripple-x", `${event.clientX - bounds.left - diameter / 2}px`);
    ripple.style.setProperty("--kima-ripple-y", `${event.clientY - bounds.top - diameter / 2}px`);
    // 动画播完自己摘掉，不留垃圾节点。
    ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
    element.append(ripple);
  }

  onMounted(() => {
    element = host.value;
    element?.addEventListener("pointerdown", onPointerDown);
  });
  onBeforeUnmount(() => element?.removeEventListener("pointerdown", onPointerDown));
}
