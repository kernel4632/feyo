/* Register FEYO light-DOM elements and install their component styles once.
 * Usage: import "@kernel4632/feyo/elements";
 */
import { defineCustomElement } from "vue";
import "./styles/index.scss";
import FeyoButton from "./components/button/button.ce.vue";
import FeyoTextField from "./components/text-field/text-field.ce.vue";
import FeyoCheckbox from "./components/checkbox/checkbox.ce.vue";
import FeyoSwitch from "./components/switch/switch.ce.vue";
import FeyoSlider from "./components/slider/slider.ce.vue";
import FeyoProgress from "./components/progress/progress.ce.vue";

const elements = {
  "feyo-button": FeyoButton,
  "feyo-text-field": FeyoTextField,
  "feyo-checkbox": FeyoCheckbox,
  "feyo-switch": FeyoSwitch,
  "feyo-slider": FeyoSlider,
  "feyo-progress": FeyoProgress,
};

if (typeof document !== "undefined") {
  // Vue only injects .ce.vue styles into shadow roots; light DOM shares one stylesheet.
  if (!document.getElementById("feyo-component-styles")) {
    const style = document.createElement("style");
    style.id = "feyo-component-styles";
    style.textContent = Object.values(elements).flatMap((component) => component.styles).join("\n");
    document.head.append(style);
  }

  let nextElementId = 0;
  for (const [tagName, component] of Object.entries(elements)) {
    if (!customElements.get(tagName)) {
      customElements.define(tagName, defineCustomElement(component, {
        shadowRoot: false,
        styles: undefined,
        configureApp(app) {
          // Each custom element has its own Vue app; keep useId unique across hosts.
          app.config.idPrefix = `feyo-${nextElementId++}`;
        },
      }));
    }
  }
}

export { elements };
