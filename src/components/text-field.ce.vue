<!--
文本框：管理原生输入、浮动标签、说明文字和密码操作，同时允许 Web Component
消费者只监听 update:modelValue/change，而不用每次输入都把 modelValue 写回组件。
调用示例：
  <feyo-text-field label="邮箱" name="email" required></feyo-text-field>
  <feyo-text-field v-model="password" type="password" clearable></feyo-text-field>
-->
<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, useId, watch } from "vue";
import { HugeiconsIcon } from "@hugeicons/vue";
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
  floatLabel: {
    type: Boolean,
    default: true,
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
const inputId = `feyo-text-field-${baseId}`;
const hintId = `${inputId}-hint`;
const errorId = `${inputId}-error`;
const hasError = computed(() => props.error.length > 0);
const isLarge = computed(() => props.size === "large");
const canClear = computed(
  () => props.clearable && localValue.value.length > 0 && !props.readonly,
);
const shouldFloatLabel = computed(() =>
  props.floatLabel && (focused.value || localValue.value.length > 0),
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
    class="feyo-text-field"
    :class="[
      {
        'feyo-text-field--large': isLarge,
        'feyo-text-field--error': hasError,
        'feyo-text-field--disabled': disabled,
        'feyo-text-field--readonly': readonly,
        'feyo-text-field--flat-label': !floatLabel,
        'feyo-text-field--filled': !outlined,
        'feyo-text-field--label-inside': label && floatLabel && !shouldFloatLabel,
        'feyo-text-field--password': type === 'password',
        'feyo-text-field--has-clear': canClear,
      },
      attrs.class,
    ]"
    :style="attrs.style"
  >
    <label
      v-if="label"
      class="feyo-text-field__label"
      :class="{ 'feyo-text-field__label--floating': shouldFloatLabel }"
      :for="inputId"
    >
      {{ label }}<span v-if="required" aria-hidden="true"> *</span>
    </label>

    <div class="feyo-text-field__control">
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

      <div v-if="type === 'password'" class="feyo-text-field__actions">
        <button
          class="feyo-text-field__action"
          type="button"
          :aria-label="passwordVisible ? '隐藏密码' : '显示密码'"
          :disabled="disabled"
          @click="passwordVisible = !passwordVisible"
        >
          <HugeiconsIcon
            :icon="passwordVisible ? ViewOffIcon : ViewIcon"
            :size="18"
            color="currentColor"
          />
        </button>
        <button
          v-if="canClear"
          class="feyo-text-field__action"
          type="button"
          aria-label="清除内容"
          :disabled="disabled"
          @click="clearValue"
        >
          <HugeiconsIcon :icon="Cancel01Icon" :size="18" color="currentColor" />
        </button>
      </div>
      <button
      v-else-if="canClear"
        class="feyo-text-field__action feyo-text-field__action--clear"
        type="button"
        aria-label="清除内容"
        :disabled="disabled"
        @click="clearValue"
      >
        <HugeiconsIcon :icon="Cancel01Icon" :size="18" color="currentColor" />
      </button>
    </div>

    <p v-if="error || hint" class="feyo-text-field__message" :id="error ? errorId : hintId">
      {{ error || hint }}
    </p>
  </div>
</template>

<style scoped lang="scss">
.feyo-text-field {
  position: relative;
  display: block;
  width: 100%;
  color: var(--feyo-color-on-surface);
  font-family: var(--feyo-font-family);

  &__control {
    position: relative;
    /* DMS：高度 fieldHeight 42，圆角 cornerRadiusXS 4，描边 1。 */
    height: 42px;
    box-sizing: border-box;
    border: 1px solid var(--feyo-color-outline);
    border-radius: var(--feyo-radius-xs);
    background: var(--feyo-color-transparent);
    transition:
      border-color var(--feyo-duration-effects) var(--feyo-ease-effects),
      border-width var(--feyo-duration-effects) var(--feyo-ease-effects),
      background-color var(--feyo-duration-effects) var(--feyo-ease-effects);
  }

  &--large &__control {
    height: 48px;
  }

  /* DMS 填充态：底色 chipSurface（surfaceContainerHigh），未聚焦描边用 outlineVariant。 */
  &--filled &__control {
    background: var(--feyo-color-surface-container-high);
    border-color: var(--feyo-color-outline-variant);
  }

  &__control:focus-within {
    border-width: 2px;
    border-color: var(--feyo-color-primary);
  }

  &--error &__control,
  &--error &__control:focus-within {
    border-color: var(--feyo-color-danger);
  }

  &--disabled {
    opacity: var(--feyo-opacity-disabled);
  }

  &__label {
    position: absolute;
    z-index: 1;
    /* DMS 描边态左侧内容内边距 spacingL 16。 */
    top: 21px;
    left: 16px;
    max-width: calc(100% - 32px);
    padding: 0 4px;
    overflow: hidden;
    color: var(--feyo-color-on-surface-variant);
    background: var(--feyo-color-surface);
    font-size: var(--feyo-font-size-medium);
    line-height: 1.2;
    text-overflow: ellipsis;
    white-space: nowrap;
    transform: translateY(-50%);
    pointer-events: none;
    transition:
      top var(--feyo-duration-effects) var(--feyo-ease-effects),
      color var(--feyo-duration-effects) var(--feyo-ease-effects),
      font-size var(--feyo-duration-effects) var(--feyo-ease-effects);
  }

  /* DMS 浮动标签：字号 Small 12；未聚焦时用 onSurfaceVariant，聚焦才变 primary。 */
  &__label--floating {
    top: 0;
    font-size: var(--feyo-font-size-small);
  }

  &:focus-within &__label--floating {
    color: var(--feyo-color-primary);
  }

  /* 填充态：标签底色跟控件底色一致，左侧内边距 spacingM 12。 */
  &--filled &__label {
    left: 12px;
    max-width: calc(100% - 24px);
    background: var(--feyo-color-surface-container-high);
  }

  &--error &__label,
  &--error:focus-within &__label--floating {
    color: var(--feyo-color-danger);
  }

  &--flat-label &__label {
    position: static;
    display: block;
    max-width: none;
    padding: 0;
    margin: 0 0 var(--feyo-space-1);
    overflow: visible;
    background: var(--feyo-color-transparent);
    transform: none;
  }

  &--flat-label &__control {
    height: 42px;
  }

  &--large.feyo-text-field--flat-label &__control {
    height: 48px;
  }

  &__label--floating + &__control input::placeholder {
    color: var(--feyo-color-on-surface-variant);
  }

  &__control input {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    /* DMS 描边态输入内边距 spacingL 16。 */
    padding: 0 16px;
    border: 0;
    outline: 0;
    color: var(--feyo-color-on-surface);
    background: var(--feyo-color-transparent);
    font: inherit;
    font-size: var(--feyo-font-size-medium);
  }

  &--filled &__control input {
    padding-inline: 12px;
  }

  &__control input::placeholder {
    color: var(--feyo-color-on-surface-variant);
    opacity: 1;
  }

  &--label-inside &__control input::placeholder {
    color: var(--feyo-color-transparent);
  }

  &__control:focus-within input::placeholder {
    color: var(--feyo-color-on-surface-variant);
  }

  &__actions {
    position: absolute;
    top: 0;
    right: 4px;
    bottom: 0;
    display: flex;
    align-items: center;
    gap: var(--feyo-space-1);
  }

  &__action {
    width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 0;
    border-radius: var(--feyo-radius-full);
    color: var(--feyo-color-on-surface-variant);
    background: var(--feyo-color-transparent);
    cursor: pointer;

    &:hover:not(:disabled) {
      color: var(--feyo-color-primary);
      background: color-mix(in srgb, var(--feyo-color-primary) 12%, var(--feyo-color-transparent));
    }

    &:focus-visible {
      outline: 2px solid var(--feyo-color-primary);
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

  &--password.feyo-text-field--has-clear &__control input {
    padding-right: 76px;
  }

  &__message {
    min-height: 1.2em;
    /* DMS 说明文字：上间距 spacingXS 4，左右与内容内边距对齐 16。 */
    margin: var(--feyo-space-xs) 16px 0;
    color: var(--feyo-color-on-surface-variant);
    font-size: var(--feyo-font-size-small);
    line-height: 1.2;
  }

  &--error &__message {
    color: var(--feyo-color-danger);
  }
}
</style>
