<!--
文本框：管理原生输入、浮动标签、说明文字和密码操作，同时允许 Web Component
消费者只监听 update:modelValue/change，而不用每次输入都把 modelValue 写回组件。
调用示例：
  <feyo-text-field label="邮箱" name="email" required></feyo-text-field>
  <feyo-text-field v-model="password" type="password" clearable></feyo-text-field>
-->
<script setup>
import { computed, nextTick, ref, useAttrs, useId, watch } from "vue";
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
const describedBy = computed(() => {
  const ids = [];
  if (props.error) ids.push(errorId);
  else if (props.hint) ids.push(hintId);
  if (attrs["aria-describedby"]) ids.push(attrs["aria-describedby"]);
  return ids.length > 0 ? ids.join(" ") : undefined;
});
const inputAriaLabel = computed(() =>
  attrs["aria-label"] || (!props.label ? props.placeholder || undefined : undefined),
);
const inputAttrs = computed(() => {
  const forwarded = { ...attrs };
  delete forwarded.id;
  delete forwarded.class;
  delete forwarded.style;
  delete forwarded["aria-describedby"];
  delete forwarded["aria-label"];
  return forwarded;
});

watch(
  () => props.modelValue,
  (value) => {
    // 外部值变化时更新本地输入；用户逐字输入不依赖父组件回写。
    if (value !== localValue.value) localValue.value = value;
  },
);

function handleInput(event) {
  localValue.value = event.target.value;
  emit("update:modelValue", localValue.value);
}

function handleChange() {
  emit("change", localValue.value);
}

function clearValue() {
  localValue.value = "";
  emit("update:modelValue", localValue.value);
  emit("change", localValue.value);
  nextTick(() => input.value?.focus());
}

function focus() {
  input.value?.focus();
}

defineExpose({ focus });
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
        v-bind="inputAttrs"
        :id="inputId"
        :name="name"
        :type="actualType"
        :value="localValue"
        :required="required"
        :disabled="disabled"
        :readonly="readonly"
        :placeholder="placeholder"
        :aria-label="inputAriaLabel"
        :aria-describedby="describedBy"
        :aria-invalid="hasError || undefined"
        :aria-required="required || undefined"
        @focus="focused = true"
        @blur="focused = false"
        @input.stop="handleInput"
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
    height: 42px;
    box-sizing: border-box;
    border: 1px solid var(--feyo-color-outline);
    border-radius: 4px;
    background: var(--feyo-color-transparent);
    transition:
      border-color var(--feyo-duration-fast) var(--feyo-ease-standard),
      border-width var(--feyo-duration-fast) var(--feyo-ease-standard),
      background-color var(--feyo-duration-fast) var(--feyo-ease-standard);
  }

  &--large &__control {
    height: 48px;
  }

  &--filled &__control {
    background: var(--feyo-color-surface-container);
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
    top: 21px;
    left: 12px;
    max-width: calc(100% - 24px);
    padding: 0 4px;
    overflow: hidden;
    color: var(--feyo-color-on-surface-variant);
    background: var(--feyo-color-surface);
    font-size: var(--feyo-font-size-md);
    line-height: 1.2;
    text-overflow: ellipsis;
    white-space: nowrap;
    transform: translateY(-50%);
    pointer-events: none;
    transition:
      top var(--feyo-duration-normal) var(--feyo-ease-standard),
      color var(--feyo-duration-fast) var(--feyo-ease-standard),
      font-size var(--feyo-duration-normal) var(--feyo-ease-standard);
  }

  &__label--floating {
    top: 0;
    color: var(--feyo-color-primary);
    font-size: var(--feyo-font-size-sm);
  }

  &--error &__label {
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
    padding: 0 12px;
    border: 0;
    outline: 0;
    color: var(--feyo-color-on-surface);
    background: var(--feyo-color-transparent);
    font: inherit;
    font-size: var(--feyo-font-size-md);
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
    margin: var(--feyo-space-1) var(--feyo-space-2) 0;
    color: var(--feyo-color-on-surface-variant);
    font-size: var(--feyo-font-size-sm);
    line-height: 1.2;
  }

  &--error &__message {
    color: var(--feyo-color-danger);
  }
}
</style>
