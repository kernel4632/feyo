<!--
时间选择器：使用本地 HH:mm 字符串，不创建带时区的值，也不做日期换算。
modelValue 是 HH:mm 或 null；min、max 是同样格式，step 是分钟间隔。
调用示例：
  <kima-time-picker v-model="time" name="start" label="开始时间" min="08:00" max="18:00" step="15" clearable />
  <kima-time-picker v-model="time" v-model:open="open" locale="en-US" hour12 />
打开后先选小时，再选分钟；Arrow、Home、End、Enter、Escape 和 Tab 都有对应的键盘行为。
上游记录：本地参考仓库有 DankTimePicker.qml，采用小时、分钟分步选择和 AM/PM；没有浏览器原生时间选择器实现。
-->
<script setup>
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, useHost, useId, watch } from "vue";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  modelValue: {
    type: String,
    default: null,
  },
  min: {
    type: String,
    default: null,
  },
  max: {
    type: String,
    default: null,
  },
  step: {
    type: Number,
    default: 30,
  },
  label: {
    type: String,
    default: "",
  },
  placeholder: {
    type: String,
    default: "Select time",
  },
  open: Boolean,
  required: Boolean,
  name: String,
  disabled: Boolean,
  clearable: Boolean,
  locale: {
    type: String,
    default: "en-GB",
  },
  hour12: {
    type: Boolean,
    default: null,
  },
  mode: {
    type: String,
    default: "auto",
  },
});

const emit = defineEmits(["update:modelValue", "change", "update:open"]);
const attrs = useAttrs();
const host = getCurrentInstance()?.ce ? useHost() : null;
const forwardedAttrs = computed(() => host ? { ...attrs, id: undefined } : attrs);

const root = ref(null);
const trigger = ref(null);
const nativeInput = ref(null);
const optionElements = ref({ hour: [], minute: [], period: [] });
const localValue = ref(props.modelValue);
const localOpen = ref(false);
const draftHour = ref(0);
const draftMinute = ref(0);
const draftPeriod = ref("AM");
const activeColumn = ref("hour");
const activeIndex = ref(0);
let ownerDocument;
let form;
let initialValue;
let resetTimer;

const baseId = `kima-time-picker-${useId()}`;
const labelId = `${baseId}-label`;
const triggerId = `${baseId}-trigger`;
const popupId = `${baseId}-popup`;
const hourListId = `${baseId}-hours`;
const minuteListId = `${baseId}-minutes`;
const periodListId = `${baseId}-period`;

const safeStep = computed(() => {
  const value = Number(props.step);
  return Number.isFinite(value) && value > 0 ? Math.min(60, Math.floor(value)) : 30;
});
const minMinutes = computed(() => parseTime(props.min));
const maxMinutes = computed(() => parseTime(props.max));
const is12Hour = computed(() => {
  const mode = props.mode.toLowerCase();
  if (["12", "12h", "12-hour"].includes(mode)) return true;
  if (["24", "24h", "24-hour"].includes(mode)) return false;
  if (typeof props.hour12 === "boolean") return props.hour12;
  try {
    const cycle = new Intl.DateTimeFormat(props.locale || "en-GB", { hour: "numeric" }).resolvedOptions().hourCycle;
    return cycle === "h11" || cycle === "h12";
  } catch {
    return false;
  }
});
const minuteValues = computed(() => {
  const values = [];
  for (let minute = 0; minute < 60; minute += safeStep.value) values.push(minute);
  return values;
});
const hourOptions = computed(() => {
  const values = [];
  if (is12Hour.value) {
    for (let hour = 1; hour <= 12; hour += 1) {
      const hour24 = to24Hour(hour, draftPeriod.value);
      values.push({ value: hour24, label: String(hour), disabled: !hasAllowedMinute(hour24) });
    }
  } else {
    for (let hour = 0; hour < 24; hour += 1) values.push({ value: hour, label: pad(hour), disabled: !hasAllowedMinute(hour) });
  }
  return values;
});
const minuteOptions = computed(() => minuteValues.value.map((minute) => ({
  value: minute,
  label: pad(minute),
  disabled: !isAllowedTime(draftHour.value, minute),
})));
const periodOptions = computed(() => [
  { value: "AM", label: "AM", disabled: !hasAllowedPeriod("AM") },
  { value: "PM", label: "PM", disabled: !hasAllowedPeriod("PM") },
]);
const displayText = computed(() => {
  const parsed = parseTime(localValue.value);
  return parsed === null ? props.placeholder : formatDisplay(parsed);
});
const activeOptionId = computed(() => `${baseId}-${activeColumn.value}-${activeIndex.value}`);

function pad(value) {
  return String(value).padStart(2, "0");
}

function parseTime(value) {
  if (typeof value !== "string" || !/^\d{2}:\d{2}$/.test(value)) return null;
  const [hour, minute] = value.split(":").map(Number);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

function formatTime(hour, minute) {
  return `${pad(hour)}:${pad(minute)}`;
}

function formatDisplay(minutes) {
  const date = new Date(2000, 0, 1, Math.floor(minutes / 60), minutes % 60);
  try {
    return new Intl.DateTimeFormat(props.locale || "en-GB", {
      hour: "numeric",
      minute: "2-digit",
      hour12: is12Hour.value,
    }).format(date);
  } catch {
    return formatTime(Math.floor(minutes / 60), minutes % 60);
  }
}

function to12Hour(hour) {
  const value = hour % 12;
  return value === 0 ? 12 : value;
}

function to24Hour(hour, period) {
  if (period === "PM") return hour === 12 ? 12 : hour + 12;
  return hour === 12 ? 0 : hour;
}

function isAllowedTime(hour, minute) {
  const value = hour * 60 + minute;
  if (value % safeStep.value !== 0) return false;
  if (minMinutes.value !== null && value < minMinutes.value) return false;
  if (maxMinutes.value !== null && value > maxMinutes.value) return false;
  return true;
}

function hasAllowedMinute(hour) {
  return minuteValues.value.some((minute) => isAllowedTime(hour, minute));
}

function hasAllowedPeriod(period) {
  return hourOptions.value.some((option) => to12Hour(option.value) === to12Hour(draftHour.value) && draftPeriod.value === period && !option.disabled)
    || Array.from({ length: 12 }, (_, index) => to24Hour(index + 1, period)).some((hour) => hasAllowedMinute(hour));
}

function firstAllowedTime() {
  for (let value = 0; value < 1440; value += 1) {
    const hour = Math.floor(value / 60);
    const minute = value % 60;
    if (isAllowedTime(hour, minute)) return value;
  }
  return 0;
}

function draftFromValue() {
  const parsed = parseTime(localValue.value);
  const value = parsed !== null && isAllowedTime(Math.floor(parsed / 60), parsed % 60) ? parsed : firstAllowedTime();
  draftHour.value = Math.floor(value / 60);
  draftMinute.value = value % 60;
  draftPeriod.value = draftHour.value >= 12 ? "PM" : "AM";
  activeColumn.value = "hour";
  activeIndex.value = Math.max(0, hourOptions.value.findIndex((option) => option.value === draftHour.value));
}

function setOptionRef(column, index, element) {
  if (element) optionElements.value[column][index] = element;
}

function focusActiveOption() {
  nextTick(() => optionElements.value[activeColumn.value]?.[activeIndex.value]?.focus());
}

function openPicker(notify = true) {
  if (props.disabled) return;
  draftFromValue();
  localOpen.value = true;
  if (notify) emit("update:open", true);
  focusActiveOption();
}

function closePicker(notify = true, returnFocus = true) {
  if (!localOpen.value) return;
  localOpen.value = false;
  if (notify) emit("update:open", false);
  if (returnFocus) nextTick(() => trigger.value?.focus());
}

function togglePicker() {
  if (localOpen.value) closePicker(true, true);
  else openPicker(true);
}

function updateValue(value) {
  if (props.disabled || value === localValue.value) return;
  localValue.value = value;
  emit("update:modelValue", value);
  emit("change", value);
}

function commitDraft() {
  if (!isAllowedTime(draftHour.value, draftMinute.value)) return;
  updateValue(formatTime(draftHour.value, draftMinute.value));
  closePicker(true, true);
}

function selectHour(option, index) {
  if (option.disabled) return;
  draftHour.value = option.value;
  activeColumn.value = "minute";
  const current = minuteOptions.value.findIndex((item) => item.value === draftMinute.value && !item.disabled);
  activeIndex.value = current >= 0 ? current : Math.max(0, minuteOptions.value.findIndex((item) => !item.disabled));
  focusActiveOption();
}

function selectMinute(option, index) {
  if (option.disabled) return;
  draftMinute.value = option.value;
  activeColumn.value = "minute";
  activeIndex.value = index;
  commitDraft();
}

function selectPeriod(option, index) {
  if (option.disabled) return;
  draftPeriod.value = option.value;
  draftHour.value = to24Hour(to12Hour(draftHour.value), option.value);
  activeColumn.value = "period";
  activeIndex.value = index;
  focusActiveOption();
}

function columnOptions(column) {
  if (column === "hour") return hourOptions.value;
  if (column === "minute") return minuteOptions.value;
  return periodOptions.value;
}

function moveOption(column, start, direction) {
  const options = columnOptions(column);
  let index = start + direction;
  while (index >= 0 && index < options.length) {
    if (!options[index].disabled) return index;
    index += direction;
  }
  return start;
}

function handleOptionKeydown(column, index, event) {
  if (event.isComposing) return;
  if (event.key === "Escape") {
    event.preventDefault();
    closePicker(true, true);
    return;
  }
  if (["ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) {
    event.preventDefault();
    const options = columnOptions(column);
    const next = event.key === "Home" ? options.findIndex((option) => !option.disabled)
      : event.key === "End" ? [...options].findLastIndex((option) => !option.disabled)
        : moveOption(column, index, event.key === "ArrowUp" ? -1 : 1);
    if (next >= 0) {
      activeColumn.value = column;
      activeIndex.value = next;
      if (column === "hour") draftHour.value = options[next].value;
      if (column === "minute") draftMinute.value = options[next].value;
      if (column === "period") selectPeriod(options[next], next);
      focusActiveOption();
    }
    return;
  }
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    event.preventDefault();
    const columns = is12Hour.value ? ["hour", "minute", "period"] : ["hour", "minute"];
    const nextColumn = columns[Math.max(0, Math.min(columns.length - 1, columns.indexOf(column) + (event.key === "ArrowLeft" ? -1 : 1)))];
    activeColumn.value = nextColumn;
    const options = columnOptions(nextColumn);
    activeIndex.value = Math.max(0, options.findIndex((option) => !option.disabled));
    focusActiveOption();
    return;
  }
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  const option = columnOptions(column)[index];
  if (column === "hour") selectHour(option, index);
  else if (column === "minute") selectMinute(option, index);
  else selectPeriod(option, index);
}

function handleTriggerKeydown(event) {
  if (props.disabled) return;
  if (event.key === "Escape" && localOpen.value) {
    event.preventDefault();
    closePicker(true, true);
    return;
  }
  if (!["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) return;
  event.preventDefault();
  if (!localOpen.value) openPicker(true);
}

function handlePopupKeydown(event) {
  if (event.key !== "Escape") return;
  event.preventDefault();
  closePicker(true, true);
}

function clearValue() {
  updateValue(null);
  closePicker(true, true);
}

function handleOutside(event) {
  if (localOpen.value && !event.composedPath().includes(root.value)) closePicker(false, false);
}

function resetValue(event) {
  clearTimeout(resetTimer);
  resetTimer = setTimeout(() => {
    if (event.defaultPrevented) return;
    const changed = localValue.value !== initialValue;
    localValue.value = initialValue;
    closePicker(false, false);
    if (changed) {
      emit("update:modelValue", localValue.value);
      emit("change", localValue.value);
    }
  }, 0);
}

function handleInvalid(event) {
  event.preventDefault();
  nextTick(() => trigger.value?.focus());
}

watch(() => props.modelValue, (value) => { localValue.value = value; });
watch(() => props.open, (open) => {
  if (open) openPicker(false);
  else closePicker(false, false);
}, { immediate: true });
watch(() => props.disabled, (disabled) => { if (disabled) closePicker(false, false); });
watch([is12Hour, () => props.locale], () => {
  if (localOpen.value) draftFromValue();
});

onMounted(() => {
  initialValue = props.modelValue;
  form = nativeInput.value?.form;
  form?.addEventListener("reset", resetValue);
  ownerDocument = root.value.ownerDocument;
  ownerDocument.addEventListener("pointerdown", handleOutside);
  ownerDocument.addEventListener("focusin", handleOutside);
  if (localOpen.value) focusActiveOption();
});

onBeforeUnmount(() => {
  clearTimeout(resetTimer);
  form?.removeEventListener("reset", resetValue);
  ownerDocument?.removeEventListener("pointerdown", handleOutside);
  ownerDocument?.removeEventListener("focusin", handleOutside);
});
</script>

<template>
  <div
    ref="root"
    v-bind="forwardedAttrs"
    class="kima-time-picker"
    :class="{ 'kima-time-picker--open': localOpen, 'kima-time-picker--disabled': disabled }"
  >
    <span v-if="label" :id="labelId" class="kima-time-picker__label">
      {{ label }}<span v-if="required" aria-hidden="true"> *</span>
    </span>

    <div class="kima-time-picker__control" :class="{ 'kima-time-picker__control--clearable': clearable && localValue }">
      <button
        :id="triggerId"
        ref="trigger"
        class="kima-time-picker__trigger"
        type="button"
        role="combobox"
        aria-haspopup="dialog"
        :aria-expanded="localOpen"
        :aria-controls="popupId"
        :aria-labelledby="label ? labelId : undefined"
        :aria-label="label ? undefined : placeholder"
        :aria-required="required || undefined"
        :disabled="disabled"
        @click="togglePicker"
        @keydown="handleTriggerKeydown"
      >
        <span class="kima-time-picker__trigger-label" :class="{ 'kima-time-picker__trigger-label--placeholder': parseTime(localValue) === null }">
          {{ displayText }}
        </span>
        <span class="kima-time-picker__arrow" aria-hidden="true"></span>
      </button>
      <button
        v-if="clearable && localValue"
        class="kima-time-picker__clear"
        type="button"
        aria-label="Clear time"
        title="Clear time"
        :disabled="disabled"
        @click.stop="clearValue"
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>

    <!-- 隐藏输入框保留 HH:mm 原值，让 FormData、required 和 form.reset() 使用原生表单规则。 -->
    <input
      ref="nativeInput"
      class="kima-time-picker__native"
      type="text"
      :name="name"
      :value="localValue || ''"
      :required="required"
      :disabled="disabled"
      tabindex="-1"
      aria-hidden="true"
      @input.stop
      @change.stop
      @invalid="handleInvalid"
    >

    <div v-if="localOpen" :id="popupId" class="kima-time-picker__popup" role="dialog" :aria-labelledby="label ? labelId : undefined" @keydown="handlePopupKeydown">
      <div class="kima-time-picker__summary" aria-live="polite">{{ formatTime(draftHour, draftMinute) }}</div>
      <div class="kima-time-picker__columns">
        <div class="kima-time-picker__column">
          <span class="kima-time-picker__column-label">Hour</span>
          <div :id="hourListId" class="kima-time-picker__list" role="listbox" aria-label="Hour" :aria-activedescendant="activeColumn === 'hour' ? activeOptionId : undefined">
            <button
              v-for="(option, index) in hourOptions"
              :id="`${baseId}-hour-${index}`"
              :key="option.value"
              :ref="(element) => setOptionRef('hour', index, element)"
              class="kima-time-picker__option"
              :class="{ 'kima-time-picker__option--active': activeColumn === 'hour' && activeIndex === index, 'kima-time-picker__option--selected': option.value === draftHour }"
              type="button"
              role="option"
              :aria-selected="option.value === draftHour"
              :aria-disabled="option.disabled || undefined"
              :disabled="option.disabled"
              :tabindex="activeColumn === 'hour' && activeIndex === index ? 0 : -1"
              @click="selectHour(option, index)"
              @keydown="handleOptionKeydown('hour', index, $event)"
            >{{ option.label }}</button>
          </div>
        </div>

        <div class="kima-time-picker__column">
          <span class="kima-time-picker__column-label">Minute</span>
          <div :id="minuteListId" class="kima-time-picker__list" role="listbox" aria-label="Minute" :aria-activedescendant="activeColumn === 'minute' ? activeOptionId : undefined">
            <button
              v-for="(option, index) in minuteOptions"
              :id="`${baseId}-minute-${index}`"
              :key="option.value"
              :ref="(element) => setOptionRef('minute', index, element)"
              class="kima-time-picker__option"
              :class="{ 'kima-time-picker__option--active': activeColumn === 'minute' && activeIndex === index, 'kima-time-picker__option--selected': option.value === draftMinute }"
              type="button"
              role="option"
              :aria-selected="option.value === draftMinute"
              :aria-disabled="option.disabled || undefined"
              :disabled="option.disabled"
              :tabindex="activeColumn === 'minute' && activeIndex === index ? 0 : -1"
              @click="selectMinute(option, index)"
              @keydown="handleOptionKeydown('minute', index, $event)"
            >{{ option.label }}</button>
          </div>
        </div>

        <div v-if="is12Hour" class="kima-time-picker__column kima-time-picker__column--period">
          <span class="kima-time-picker__column-label">Period</span>
          <div :id="periodListId" class="kima-time-picker__list kima-time-picker__list--period" role="listbox" aria-label="AM or PM" :aria-activedescendant="activeColumn === 'period' ? activeOptionId : undefined">
            <button
              v-for="(option, index) in periodOptions"
              :id="`${baseId}-period-${index}`"
              :key="option.value"
              :ref="(element) => setOptionRef('period', index, element)"
              class="kima-time-picker__option"
              :class="{ 'kima-time-picker__option--active': activeColumn === 'period' && activeIndex === index, 'kima-time-picker__option--selected': option.value === draftPeriod }"
              type="button"
              role="option"
              :aria-selected="option.value === draftPeriod"
              :aria-disabled="option.disabled || undefined"
              :disabled="option.disabled"
              :tabindex="activeColumn === 'period' && activeIndex === index ? 0 : -1"
              @click="selectPeriod(option, index)"
              @keydown="handleOptionKeydown('period', index, $event)"
            >{{ option.label }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.kima-time-picker {
  position: relative;
  display: inline-flex;
  width: 100%;
  max-width: 320px;
  min-width: 0;
  flex-direction: column;
  gap: var(--kima-space-1);
  color: var(--kima-color-on-surface);
  font-family: var(--kima-font-family);
  font-size: var(--kima-font-size-md);
}

.kima-time-picker__label,
.kima-time-picker__column-label {
  color: var(--kima-color-on-surface-variant);
  font-size: var(--kima-font-size-sm);
  font-weight: var(--kima-font-weight-medium);
}

.kima-time-picker__control {
  position: relative;
  display: flex;
  min-height: 42px;
}

.kima-time-picker__trigger {
  box-sizing: border-box;
  display: flex;
  width: 100%;
  min-height: 42px;
  align-items: center;
  justify-content: space-between;
  gap: var(--kima-space-3);
  padding: 0 var(--kima-space-4);
  border: 0;
  border-radius: var(--kima-radius-sm);
  color: var(--kima-color-on-surface);
  background: var(--kima-color-layer-2);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color var(--kima-duration-fast) var(--kima-ease-standard), background-color var(--kima-duration-fast) var(--kima-ease-standard);

  &:hover:not(:disabled),
  .kima-time-picker--open & {
    background: var(--kima-color-layer-3);
  }

  &:focus-visible {
    outline: 2px solid var(--kima-color-primary);
    outline-offset: 2px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: var(--kima-opacity-disabled);
  }
}

.kima-time-picker__control--clearable .kima-time-picker__trigger {
  padding-right: 72px;
}

.kima-time-picker__trigger-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kima-time-picker__trigger-label--placeholder {
  color: var(--kima-color-on-surface-variant);
}

.kima-time-picker__arrow {
  width: 8px;
  height: 8px;
  flex: 0 0 auto;
  border-right: 1.5px solid currentColor;
  border-bottom: 1.5px solid currentColor;
  color: var(--kima-color-on-surface-variant);
  transform: translateY(-2px) rotate(45deg);
  transition: transform var(--kima-duration-fast) var(--kima-ease-standard);
}

.kima-time-picker--open .kima-time-picker__arrow {
  transform: translateY(2px) rotate(225deg);
}

.kima-time-picker__clear {
  position: absolute;
  top: 50%;
  right: 36px;
  display: inline-flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: var(--kima-radius-full);
  color: var(--kima-color-on-surface-variant);
  background: var(--kima-color-transparent);
  font: inherit;
  cursor: pointer;
  transform: translateY(-50%);

  &:hover:not(:disabled),
  &:focus-visible {
    color: var(--kima-color-primary);
    background: var(--kima-color-layer-3);
  }

  &:focus-visible {
    outline: 2px solid var(--kima-color-primary);
    outline-offset: 1px;
  }
}

.kima-time-picker__native {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  border: 0;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
}

.kima-time-picker__popup {
  box-sizing: border-box;
  position: absolute;
  z-index: 20;
  top: calc(100% + var(--kima-space-2));
  left: 0;
  width: max(100%, 248px);
  padding: var(--kima-space-3);
  border: 0;
  border-radius: var(--kima-radius-md);
  background: var(--kima-color-layer-2);
  box-shadow: 0 12px 28px color-mix(in srgb, var(--kima-color-surface) 55%, var(--kima-color-transparent));
  animation: kima-time-picker-enter var(--kima-duration-fast) var(--kima-ease-emphasized);
}

.kima-time-picker__summary {
  padding-bottom: var(--kima-space-2);
  color: var(--kima-color-primary);
  font-size: var(--kima-font-size-lg);
  font-weight: var(--kima-font-weight-bold);
  text-align: center;
}

.kima-time-picker__columns {
  display: flex;
  gap: var(--kima-space-2);
}

.kima-time-picker__column {
  display: grid;
  min-width: 0;
  flex: 1 1 0;
  gap: var(--kima-space-1);
}

.kima-time-picker__column--period {
  flex: 0 0 58px;
}

.kima-time-picker__column-label {
  text-align: center;
}

.kima-time-picker__list {
  display: grid;
  max-height: 224px;
  gap: var(--kima-space-1);
  overflow-y: auto;
  padding: 2px;
  scrollbar-width: thin;
}

.kima-time-picker__list--period {
  max-height: none;
}

.kima-time-picker__option {
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  justify-content: center;
  padding: 0 var(--kima-space-2);
  border: 0;
  border-radius: var(--kima-radius-sm);
  color: var(--kima-color-on-surface);
  background: var(--kima-color-transparent);
  font: inherit;
  cursor: pointer;
  transition: background-color var(--kima-duration-fast) var(--kima-ease-standard), border-color var(--kima-duration-fast) var(--kima-ease-standard), color var(--kima-duration-fast) var(--kima-ease-standard);

  &:hover:not(:disabled),
  &--active {
    background: var(--kima-color-layer-3);
  }

  &:focus-visible {
    outline: 2px solid var(--kima-color-primary);
    outline-offset: -2px;
  }

  &--selected {
    color: var(--kima-color-on-primary-container);
    background: var(--kima-color-primary-container);
  }

  &:disabled {
    color: var(--kima-color-on-surface-variant);
    cursor: not-allowed;
    opacity: var(--kima-opacity-disabled);
  }
}

@media (prefers-reduced-motion: reduce) {
  .kima-time-picker__trigger,
  .kima-time-picker__arrow,
  .kima-time-picker__option {
    transition: none;
  }

  .kima-time-picker__popup {
    animation: none;
  }
}

@keyframes kima-time-picker-enter {
  from {
    opacity: 0;
    transform: translateY(-4px) scale(0.98);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
