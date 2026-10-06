<!--
文本框：管理原生输入、浮动标签、说明文字和密码操作，同时允许 Web Component
消费者只监听 update:modelValue/change，而不用每次输入都把 modelValue 写回组件。
调用示例：
  <kima-text-field label="邮箱" name="email" required></kima-text-field>
  <kima-text-field v-model="password" type="password" clearable></kima-text-field>
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
const inputId = `kima-text-field-${baseId}`;
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
    class="kima-text-field"
    :class="[
      {
        'kima-text-field--large': isLarge,
        'kima-text-field--error': hasError,
        'kima-text-field--disabled': disabled,
        'kima-text-field--readonly': readonly,
        'kima-text-field--flat-label': !floatLabel,
        'kima-text-field--filled': !outlined,
        'kima-text-field--label-inside': label && floatLabel && !shouldFloatLabel,
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
      :class="{ 'kima-text-field__label--floating': shouldFloatLabel }"
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
          <HugeiconsIcon
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
          <HugeiconsIcon :icon="Cancel01Icon" :size="18" color="currentColor" />
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
        <HugeiconsIcon :icon="Cancel01Icon" :size="18" color="currentColor" />
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

  &__control {
    position: relative;
    /* DMS：高度 fieldHeight 42，圆角 cornerRadiusXS 4，描边 1。 */
    height: 42px;
    box-sizing: border-box;
    border: 1px solid var(--kima-color-outline);
    border-radius: var(--kima-radius-xs);
    background: var(--kima-color-transparent);
    transition:
      border-color var(--kima-duration-effects) var(--kima-ease-effects),
      border-width var(--kima-duration-effects) var(--kima-ease-effects),
      background-color var(--kima-duration-effects) var(--kima-ease-effects);
  }

  &--large &__control {
    height: 48px;
  }

  /* DMS 填充态：底色 chipSurface（surfaceContainerHigh），未聚焦描边用 outlineVariant。 */
  &--filled &__control {
    background: var(--kima-color-surface-container-high);
    border-color: var(--kima-color-outline-variant);
  }

  &__control:focus-within {
    border-width: 2px;
    border-color: var(--kima-color-primary);
  }

  &--error &__control,
  &--error &__control:focus-within {
    border-color: var(--kima-color-danger);
  }

  &--disabled {
    opacity: var(--kima-opacity-disabled);
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
    color: var(--kima-color-on-surface-variant);
    background: var(--kima-color-surface);
    font-size: var(--kima-font-size-medium);
    line-height: 1.2;
    text-overflow: ellipsis;
    white-space: nowrap;
    transform: translateY(-50%);
    pointer-events: none;
    transition:
      top var(--kima-duration-effects) var(--kima-ease-effects),
      color var(--kima-duration-effects) var(--kima-ease-effects),
      font-size var(--kima-duration-effects) var(--kima-ease-effects);
  }

  /* DMS 浮动标签：字号 Small 12；未聚焦时用 onSurfaceVariant，聚焦才变 primary。 */
  &__label--floating {
    top: 0;
    font-size: var(--kima-font-size-small);
  }

  &:focus-within &__label--floating {
    color: var(--kima-color-primary);
  }

  /* 填充态：标签底色跟控件底色一致，左侧内边距 spacingM 12。 */
  &--filled &__label {
    left: 12px;
    max-width: calc(100% - 24px);
    background: var(--kima-color-surface-container-high);
  }

  &--error &__label,
  &--error:focus-within &__label--floating {
    color: var(--kima-color-danger);
  }

  &--flat-label &__label {
    position: static;
    display: block;
    max-width: none;
    padding: 0;
    margin: 0 0 var(--kima-space-1);
    overflow: visible;
    background: var(--kima-color-transparent);
    transform: none;
  }

  &--flat-label &__control {
    height: 42px;
  }

  &--large.kima-text-field--flat-label &__control {
    height: 48px;
  }

  &__label--floating + &__control input::placeholder {
    color: var(--kima-color-on-surface-variant);
  }

  &__control input {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    /* DMS 描边态输入内边距 spacingL 16。 */
    padding: 0 16px;
    border: 0;
    outline: 0;
    color: var(--kima-color-on-surface);
    background: var(--kima-color-transparent);
    font: inherit;
    font-size: var(--kima-font-size-medium);
  }

  &--filled &__control input {
    padding-inline: 12px;
  }

  &__control input::placeholder {
    color: var(--kima-color-on-surface-variant);
    opacity: 1;
  }

  &--label-inside &__control input::placeholder {
    color: var(--kima-color-transparent);
  }

  &__control:focus-within input::placeholder {
    color: var(--kima-color-on-surface-variant);
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
    /* DMS 说明文字：上间距 spacingXS 4，左右与内容内边距对齐 16。 */
    margin: var(--kima-space-xs) 16px 0;
    color: var(--kima-color-on-surface-variant);
    font-size: var(--kima-font-size-small);
    line-height: 1.2;
  }

  &--error &__message {
    color: var(--kima-color-danger);
  }
}
</style>
