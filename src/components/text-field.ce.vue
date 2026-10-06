<!--
文本框：管理原生输入、标签、说明文字和密码操作，同时允许 Web Component
消费者只监听 update:modelValue/change，而不用每次输入都把 modelValue 写回组件。
标签固定在输入框上方，不做浮动标签——那套做法要拿同色底遮边框，在透明背景上会露馅。
调用示例：
  <kima-text-field label="邮箱" name="email" required></kima-text-field>
  <kima-text-field v-model="password" type="password" clearable></kima-text-field>
  <kima-text-field label="备注" :outlined="false"></kima-text-field>
-->
<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, useId, watch } from "vue";
import KimaIcon from "./icon.ce.vue";
import {
  Cancel01Icon,
  ViewIcon,
  ViewOffIcon,
} from "@hugeicons/core-free-icons";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  label: {
    type: String,
    default: "",
  },
  hint: {
    type: String,
    default: "",
  },
  error: {
    type: String,
    default: "",
  },
  modelValue: {
    type: String,
    default: "",
  },
  type: {
    type: String,
    default: "text",
  },
  name: String,
  required: Boolean,
  disabled: Boolean,
  readonly: Boolean,
  placeholder: {
    type: String,
    default: "",
  },
  clearable: Boolean,
  size: {
    type: String,
    default: "default",
  },
  outlined: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["update:modelValue", "change"]);
const attrs = useAttrs();
const baseId = useId();
const input = ref(null);
const focused = ref(false);
const passwordVisible = ref(false);
const localValue = ref(props.modelValue);
let composing = false;
let resetValue;
let ownerDocument;

// The host keeps its public id; labels and descriptions use a separate internal id.
const inputId = `kima-text-field-${baseId}`;
const hintId = `${inputId}-hint`;
const errorId = `${inputId}-error`;
const hasError = computed(() => props.error.length > 0);
const isLarge = computed(() => props.size === "large");
const canClear = computed(
  () => props.clearable && localValue.value.length > 0 && !props.readonly,
);
const actualType = computed(() =>
  props.type === "password" && passwordVisible.value ? "text" : props.type,
);
function describedBy() {
  const ids = [];
  if (props.error) ids.push(errorId);
  else if (props.hint) ids.push(hintId);
  if (attrs["aria-describedby"]) ids.push(attrs["aria-describedby"]);
  return ids.length > 0 ? ids.join(" ") : undefined;
}
function inputAriaLabel() {
  return attrs["aria-label"] || attrs.ariaLabel || (!props.label ? props.placeholder || undefined : undefined);
}
function inputAttrs() {
  const forwarded = { ...attrs };
  delete forwarded.id;
  delete forwarded.class;
  delete forwarded.style;
  delete forwarded["aria-describedby"];
  delete forwarded["aria-label"];
  delete forwarded.ariaLabel;
  return forwarded;
}

watch(
  () => props.modelValue,
  (value) => {
    // 外部值变化时更新本地输入；用户逐字输入不依赖父组件回写。
    if (value !== localValue.value) localValue.value = value;
  },
);

function handleInput(event) {
  if (composing || event.isComposing || event.target.value === localValue.value) return;
  localValue.value = event.target.value;
  emit("update:modelValue", localValue.value);
}

function handleChange() {
  emit("change", localValue.value);
}

function clearValue() {
  if (props.disabled || props.readonly || !localValue.value) return;
  localValue.value = "";
  emit("update:modelValue", localValue.value);
  emit("change", localValue.value);
  nextTick(() => input.value?.focus());
}

function focus() {
  input.value?.focus();
}

defineExpose({ focus });

// Reset to the mounted default, not the last user edit; reset does not emit change.
function handleReset(event) {
  if (event.target !== input.value.form) return;
  queueMicrotask(() => {
    if (event.defaultPrevented || !input.value) return;
    composing = false;
    const changed = localValue.value !== resetValue;
    localValue.value = resetValue;
    input.value.value = resetValue;
    if (changed) emit("update:modelValue", resetValue);
  });
}

onMounted(() => {
  resetValue = localValue.value;
  input.value.defaultValue = resetValue;
  ownerDocument = input.value.ownerDocument;
  ownerDocument.addEventListener("reset", handleReset, true);
});
onBeforeUnmount(() => ownerDocument.removeEventListener("reset", handleReset, true));
</script>

<template>
  <div
    class="kima-text-field"
    :class="[
      {
        'kima-text-field--large': isLarge,
        'kima-text-field--error': hasError,
        'kima-text-field--disabled': disabled,
        'kima-text-field--readonly': readonly,
        'kima-text-field--filled': !outlined,
        'kima-text-field--password': type === 'password',
        'kima-text-field--has-clear': canClear,
      },
      attrs.class,
    ]"
    :style="attrs.style"
  >
    <label
      v-if="label"
      class="kima-text-field__label"
      :for="inputId"
    >
      {{ label }}<span v-if="required" aria-hidden="true"> *</span>
    </label>

    <div class="kima-text-field__control">
      <input
        ref="input"
        v-bind="inputAttrs()"
        :id="inputId"
        :name="name"
        :type="actualType"
        :value="localValue"
        :required="required"
        :disabled="disabled"
        :readonly="readonly"
        :placeholder="placeholder"
        :aria-label="inputAriaLabel()"
        :aria-describedby="describedBy()"
        :aria-invalid="hasError || undefined"
        :aria-required="required || undefined"
        @focus="focused = true"
        @blur="focused = false"
        @input.stop="handleInput"
        @compositionstart="composing = true"
        @compositionend="composing = false; handleInput($event)"
        @change.stop="handleChange"
      />

      <div v-if="type === 'password'" class="kima-text-field__actions">
        <button
          class="kima-text-field__action"
          type="button"
          :aria-label="passwordVisible ? '隐藏密码' : '显示密码'"
          :disabled="disabled"
          @click="passwordVisible = !passwordVisible"
        >
          <KimaIcon
            :icon="passwordVisible ? ViewOffIcon : ViewIcon"
            :size="18"
            color="currentColor"
          />
        </button>
        <button
          v-if="canClear"
          class="kima-text-field__action"
          type="button"
          aria-label="清除内容"
          :disabled="disabled"
          @click="clearValue"
        >
          <KimaIcon :icon="Cancel01Icon" :size="18" color="currentColor" />
        </button>
      </div>
      <button
      v-else-if="canClear"
        class="kima-text-field__action kima-text-field__action--clear"
        type="button"
        aria-label="清除内容"
        :disabled="disabled"
        @click="clearValue"
      >
        <KimaIcon :icon="Cancel01Icon" :size="18" color="currentColor" />
      </button>
    </div>

    <p v-if="error || hint" class="kima-text-field__message" :id="error ? errorId : hintId">
      {{ error || hint }}
    </p>
  </div>
</template>

<style scoped lang="scss">
.kima-text-field {
  position: relative;
  display: block;
  width: 100%;
  color: var(--kima-color-on-surface);
  font-family: var(--kima-font-family);

  /* M3 的两种输入框，靠"描边"和"底色"区分，各是一种造型，不是两档层次：
   *   outlined（默认）—— 透明底 + 一圈描边，圈出输入区域
   *   filled          —— 浅色底 + 只有下边线
   * 这里的线是造型本身，别当成"多余的边框"一起去掉。 */
  &__control {
    position: relative;
    height: var(--kima-field-height);
    box-sizing: border-box;
    border: var(--kima-outline-width) solid var(--kima-color-outline);
    border-radius: var(--kima-radius-m);
    background: var(--kima-color-transparent);
    transition:
      background-color var(--kima-duration-effects) var(--kima-curve-standard),
      border-color var(--kima-duration-effects) var(--kima-curve-standard);
  }

  &--large &__control {
    height: var(--kima-button-height-l);
  }

  /* 聚焦时描边换成主色，注意力就落到这个框上。 */
  &__control:focus-within {
    border-color: var(--kima-color-primary);
  }

  /* 出错时描边换成危险色。 */
  &--error &__control,
  &--error &__control:focus-within {
    border-color: var(--kima-color-error);
  }

  /* filled 变体：去掉四面描边，改成一整块浅底 + 只留一条下边线。 */
  &--filled &__control {
    border: 0;
    border-bottom: var(--kima-outline-width) solid var(--kima-color-outline);
    border-radius: var(--kima-radius-s) var(--kima-radius-s) 0 0;
    background: var(--kima-color-layer-2);
  }

  &--filled &__control:focus-within {
    border-bottom-color: var(--kima-color-primary);
    background: var(--kima-color-layer-3);
  }

  /* filled 出错时下边线也换危险色。 */
  &--filled.kima-text-field--error &__control {
    border-bottom-color: var(--kima-color-error);
  }

  &--disabled {
    opacity: var(--kima-opacity-disabled);
  }

  /* 标签永远待在输入框上方，位置不动。
   * 不做 M3 那种"平时冒充占位符、聚焦时飞到边框上"的浮动标签：
   * 那种做法要靠一层和控件同色的底把边框线遮住，在透明背景上会露馅，
   * 阅读时也多了个要追踪的动效。现在的做法是标签本来就该在的地方——上面。 */
  &__label {
    display: block;
    /* 缩进跟输入框内边距用同一个数，标签文字和输入文字落在同一条竖线上。 */
    padding-inline: var(--kima-field-padding);
    margin: 0 0 var(--kima-space-1);
    overflow: hidden;
    color: var(--kima-color-on-surface-variant);
    font-size: var(--kima-font-size-label-medium);
    line-height: 1.4;
    text-overflow: ellipsis;
    white-space: nowrap;
    transition: color var(--kima-duration-effects) var(--kima-curve-standard);
  }

  /* 聚焦时标签跟着变主色，和边框一起提示"当前在这个框里"。 */
  &:focus-within &__label {
    color: var(--kima-color-primary);
  }

  &--error &__label,
  &--error:focus-within &__label {
    color: var(--kima-color-error);
  }

  &__control input {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    /* 左右内边距跟标签左右对齐，文字和标签在同一条竖线上。 */
    padding: 0 var(--kima-field-padding);
    border: 0;
    outline: 0;
    color: var(--kima-color-on-surface);
    background: var(--kima-color-transparent);
    font: inherit;
    font-size: var(--kima-font-size-body-large);
  }

  &__control input::placeholder {
    color: var(--kima-color-on-surface-variant);
    opacity: 1;
  }

  &__actions {
    position: absolute;
    top: 0;
    right: 4px;
    bottom: 0;
    display: flex;
    align-items: center;
    gap: var(--kima-space-1);
  }

  &__action {
    width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 0;
    border-radius: var(--kima-radius-full);
    color: var(--kima-color-on-surface-variant);
    background: var(--kima-color-transparent);
    cursor: pointer;

    &:hover:not(:disabled) {
      color: var(--kima-color-primary);
      background: color-mix(in srgb, var(--kima-color-primary) 12%, var(--kima-color-transparent));
    }

    &:focus-visible {
      outline: 2px solid var(--kima-color-primary);
      outline-offset: 1px;
    }

    &:disabled {
      cursor: not-allowed;
    }
  }

  &--password &__control input,
  &--has-clear &__control input {
    padding-right: 48px;
  }

  &--password.kima-text-field--has-clear &__control input {
    padding-right: 76px;
  }

  &__message {
    min-height: 1.2em;
    /* 上边挨着输入框一段小间距，左右缩进跟标签、输入文字对齐。 */
    margin: var(--kima-space-1) var(--kima-field-padding) 0;
    color: var(--kima-color-on-surface-variant);
    font-size: var(--kima-font-size-small);
    line-height: 1.2;
  }

  &--error &__message {
    color: var(--kima-color-danger);
  }
}
</style>
