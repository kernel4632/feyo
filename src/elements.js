/* Register FEYO light-DOM elements and install their component styles once.
 * Usage: import "@kernel4632/feyo/elements";
 */
import { defineCustomElement } from "vue";
import globalStyles from "./styles/index.scss?inline";
import FeyoButton from "./components/button/button.ce.vue";
import FeyoTextField from "./components/text-field/text-field.ce.vue";
import FeyoCheckbox from "./components/checkbox/checkbox.ce.vue";
import FeyoSwitch from "./components/switch/switch.ce.vue";
import FeyoSlider from "./components/slider/slider.ce.vue";
import FeyoProgress from "./components/progress/progress.ce.vue";
import FeyoMenu from "./components/menu/menu.ce.vue";
import FeyoTabs from "./components/tabs/tabs.ce.vue";
import FeyoDialog from "./components/dialog/dialog.ce.vue";
import FeyoLayout from "./components/layout/layout.ce.vue";
import FeyoButtonGroup from "./components/button-group/button-group.ce.vue";
import FeyoCard from "./components/card/card.ce.vue";
import FeyoDivider from "./components/divider/divider.ce.vue";
import FeyoTooltip from "./components/tooltip/tooltip.ce.vue";
import FeyoIconButton from "./components/icon-button/icon-button.ce.vue";
import FeyoBadge from "./components/badge/badge.ce.vue";

const elements = {
  "feyo-button": FeyoButton,
  "feyo-text-field": FeyoTextField,
  "feyo-checkbox": FeyoCheckbox,
  "feyo-switch": FeyoSwitch,
  "feyo-slider": FeyoSlider,
  "feyo-progress": FeyoProgress,
  "feyo-menu": FeyoMenu,
  "feyo-tabs": FeyoTabs,
  "feyo-dialog": FeyoDialog,
  "feyo-layout": FeyoLayout,
  "feyo-button-group": FeyoButtonGroup,
  "feyo-card": FeyoCard,
  "feyo-divider": FeyoDivider,
  "feyo-tooltip": FeyoTooltip,
  "feyo-icon-button": FeyoIconButton,
  "feyo-badge": FeyoBadge,
};

if (typeof document !== "undefined") {
  // Vue only injects .ce.vue styles into shadow roots; light DOM shares one stylesheet.
  if (!document.getElementById("feyo-component-styles")) {
    const style = document.createElement("style");
    style.id = "feyo-component-styles";
     const componentStyles = Object.values(elements).flatMap((component) => component.styles || []).join("\n");
     style.textContent = `${globalStyles}\n${componentStyles}`;
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
