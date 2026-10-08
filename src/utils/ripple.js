/*
涟漪：在宿主元素里从指针按下位置长出一个圆，再淡出。
按钮、图标按钮、按钮组、卡片共用同一个效果，所以放在这里而不是各写一套。
调用示例：
  const root = ref(null);
  useRipple(root);
  // root 指向的元素要套 kima-ripple-host mixin（见 _mixins.scss）：
  // 它负责把圆定位成绝对定位、裁进圆角里、压到内容下面。
*/
import { onBeforeUnmount, onMounted } from "vue";

export function useRipple(host) {
  let element = null;

  // 一次按下长一个圆。位置和大小按宿主尺寸和指针坐标算。
  function onPointerDown(event) {
    if (!element || event.button !== 0) return;

    // 禁用中的控件不长圆。宿主可能是按钮（自己带 disabled），
    // 也可能是整块场地（用 aria-disabled 表示禁用），两种都认。
    if (element.matches(":disabled, [aria-disabled='true']")) return;

    // 宿主没套 kima-ripple-host 时不长圆。
    // 少了那个 mixin，这个 span 会变成一个没定位的普通子元素，被布局算进去，
    // 凭空把宿主撑高一段（卡片踩过这个坑：高度多出整整一个 gap）。
    // 拦住比每个调用点都记得套 mixin 可靠。
    const position = getComputedStyle(element).position;
    if (position !== "relative" && position !== "absolute" && position !== "fixed") return;

    const bounds = element.getBoundingClientRect();
    // 半径 = 按下点到最远那只角的距离 × 1.25。
    // 公式有两层意思，缺一层就会出现"远端没有涟漪"：
    //   1. 必须按"最远那只角"算：从左边按下时，要盖住的是右沿，用长边乘 2 从边缘按下够不到；
    //   2. 必须多留 1.25 的余量：圆按减速曲线长大，盖到最远角需要缩放达到"距离 / 半径"。
    //      余量是 1 时这一比就是 0.99，等于动画快结束才盖满——波到得太晚，右侧（清除按钮一带）
    //      看起来就没有涟漪。留 25% 后盖满发生在前 35% 处，那时透明度还在高位，
    //      整块场地会在同一个亮面里亮起来（实测：320 宽的控件从左侧按下，右沿 176ms 被盖到、
    //      透明度 0.149；改前同一时刻只剩 0.036，看起来就是"右侧没有涟漪"）。
    const farCorner = {
      x: Math.max(event.clientX - bounds.left, bounds.right - event.clientX),
      y: Math.max(event.clientY - bounds.top, bounds.bottom - event.clientY),
    };
    const radius = Math.hypot(farCorner.x, farCorner.y) * 1.25;
    const diameter = radius * 2;
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
