<!--
数据表格：展示数据行，通过事件通知外部排序和选择结果，不修改传入的数据。
items 和 rows 都接受对象数组；传入 items 时优先使用它，包括空数组。
rowKey 接受字段名或函数，未指定时使用 id、key，最后才使用行位置。
sortDirection 使用 asc / desc；sort-change 返回 { key, direction }，由外部重新排列数据。
排序是外部契约：本组件不重排 rows/items。调用方处理 sort-change 后回写排序状态和数据。
选择先更新本地状态，Vue 可用 v-model 同步，Web Components 无需回写每次选择。
row-click 返回 row 和原始事件；Enter 激活行，空格选择行，方向键移动焦点。
Vue 支持 cell-字段名插槽；原生自定义元素用 slot="empty" / slot="loading"。
调用示例：
  <kima-table
    :columns="[{ key: 'name', label: '姓名', sortable: true }, { key: 'state', label: '状态' }]"
    :rows="users"
    row-key="id"
    selectable
    v-model="selectedUsers"
    :sort-key="sort.key"
    :sort-direction="sort.direction"
    @sort-change="sort = $event"
  />
  <kima-table :items="[]" :columns="columns"><template #empty>暂无记录</template></kima-table>
-->
<script setup>
import { computed, getCurrentInstance, ref, useAttrs, useHost, watch } from "vue";
import KimaIcon from "./icon.ce.vue";
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  ArrowUpDownIcon,
  CheckmarkSquare02Icon,
  MinusSignSquareIcon,
  SquareIcon,
} from "@hugeicons/core-free-icons";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  columns: { type: Array, default: () => [] },
  rows: { type: Array, default: () => [] },
  items: { type: Array, default: undefined },
  caption: { type: String, default: "" },
  striped: Boolean,
  hoverable: Boolean,
  selectable: Boolean,
  modelValue: { type: Array, default: () => [] },
  rowKey: { type: [String, Function], default: undefined },
  sortKey: { type: String, default: "" },
  sortDirection: { type: String, default: "" },
  loading: Boolean,
});

const emit = defineEmits(["update:modelValue", "row-click", "sort-change"]);
const attrs = useAttrs();
const host = getCurrentInstance().ce ? useHost() : null;
const forwardedAttrs = computed(() => host ? { ...attrs, id: undefined } : attrs);
const localSelection = ref(props.modelValue);
watch(() => props.modelValue, (value) => { localSelection.value = value; }, { deep: true });

const tableRows = computed(() => props.items === undefined ? props.rows : props.items);
const validDirection = computed(() => ["asc", "desc"].includes(props.sortDirection) ? props.sortDirection : "");
const selectedKeys = computed(() => new Set(localSelection.value));
const visibleKeys = computed(() => tableRows.value.map(getRowKey));
const allSelected = computed(() => visibleKeys.value.length > 0 && visibleKeys.value.every((key) => selectedKeys.value.has(key)));
const someSelected = computed(() => visibleKeys.value.some((key) => selectedKeys.value.has(key)));
const selectionState = computed(() => allSelected.value ? "true" : someSelected.value ? "mixed" : "false");
const selectionLabel = computed(() => allSelected.value ? "取消选择全部行" : "选择全部行");
const columnCount = computed(() => Math.max(1, props.columns.length + (props.selectable ? 1 : 0)));

// --- 找到行的身份：排序后继续跟随同一条数据 ---
function getRowKey(row, index) {
  if (typeof props.rowKey === "function") return props.rowKey(row);
  if (typeof props.rowKey === "string") return row[props.rowKey];
  return row.id ?? row.key ?? `row-${index}`;
}

// --- 选择一行：只提交新数组，不改动外部 modelValue ---
function toggleRow(row, index) {
  const key = getRowKey(row, index);
  const nextKeys = new Set(selectedKeys.value);
  if (nextKeys.has(key)) nextKeys.delete(key);
  else nextKeys.add(key);
  localSelection.value = [...nextKeys];
  emit("update:modelValue", localSelection.value);
}

// --- 全选当前数据：保留筛选或分页后暂时不可见的选择 ---
function toggleAll() {
  const nextKeys = new Set(selectedKeys.value);
  for (const key of visibleKeys.value) {
    if (allSelected.value) nextKeys.delete(key);
    else nextKeys.add(key);
  }
  localSelection.value = [...nextKeys];
  emit("update:modelValue", localSelection.value);
}

// --- 激活一行：单元格里的按钮、链接和输入框保留自己的行为 ---
function handleRowClick(row, event) {
  const control = event.target.closest?.("button, a, input, select, textarea, label, summary, [contenteditable]:not([contenteditable='false']), [role='button'], [role='checkbox'], [tabindex]");
  if (control && control !== event.currentTarget) return;
  emit("row-click", row, event);
}

// --- 键盘操作：只处理行自身的按键，不拦截内部控件 ---
function handleRowKeydown(row, index, event) {
  if (event.target !== event.currentTarget || event.repeat) return;
  if (!["Enter", " ", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
  event.preventDefault();
  if (event.key === "Enter" || (event.key === " " && !props.selectable)) {
    emit("row-click", row, event);
    return;
  }
  if (event.key === " ") {
    toggleRow(row, index);
    return;
  }
  const rows = event.currentTarget.parentElement.rows;
  let nextIndex = index + (event.key === "ArrowUp" ? -1 : 1);
  if (event.key === "Home") nextIndex = 0;
  if (event.key === "End") nextIndex = rows.length - 1;
  rows[Math.max(0, Math.min(rows.length - 1, nextIndex))].focus();
}

// --- 请求排序：新列从升序开始，同一列切换升降序 ---
function changeSort(column) {
  const direction = props.sortKey !== column.key || validDirection.value !== "asc" ? "asc" : "desc";
  emit("sort-change", { key: column.key, direction });
}

// --- 说明下一次排序动作，同时保留列名 ---
function sortLabel(column) {
  const descending = props.sortKey === column.key && validDirection.value === "asc";
  return `${column.label}：按${descending ? '降' : '升'}序排列`;
}
</script>

<template>
  <div class="kima-table" :class="{ 'kima-table--striped': striped, 'kima-table--hoverable': hoverable }">
    <div class="kima-table__scroll" tabindex="0" role="region" :aria-label="caption || attrs['aria-label'] || '表格区域'">
      <table v-bind="forwardedAttrs" :aria-busy="loading">
        <caption v-if="caption">{{ caption }}</caption>
        <thead>
          <tr>
            <th v-if="selectable" scope="col" class="kima-table__select-column">
              <button
                type="button"
                role="checkbox"
                class="kima-table__select-button"
                :aria-checked="selectionState"
                :aria-label="selectionLabel"
                :title="selectionLabel"
                :disabled="loading || !tableRows.length"
                @click="toggleAll"
              >
                <KimaIcon :icon="allSelected ? CheckmarkSquare02Icon : someSelected ? MinusSignSquareIcon : SquareIcon" :size="20" aria-hidden="true" />
              </button>
            </th>
            <th
              v-for="column in columns"
              :key="column.key"
              scope="col"
              :class="`kima-table__align--${column.align || 'start'}`"
              :aria-sort="column.sortable ? sortKey === column.key && validDirection ? (validDirection === 'asc' ? 'ascending' : 'descending') : 'none' : undefined"
            >
              <button
                v-if="column.sortable"
                type="button"
                class="kima-table__sort-button"
                :aria-label="sortLabel(column)"
                :title="sortLabel(column)"
                :disabled="loading"
                @click="changeSort(column)"
              >
                <span>{{ column.label }}</span>
                <KimaIcon :icon="sortKey === column.key && validDirection ? (validDirection === 'asc' ? ArrowUp01Icon : ArrowDown01Icon) : ArrowUpDownIcon" :size="16" aria-hidden="true" />
              </button>
              <span v-else>{{ column.label }}</span>
            </th>
          </tr>
        </thead>
        <tbody v-if="loading">
          <tr><td class="kima-table__message" :colspan="columnCount"><div role="status"><slot name="loading">加载中</slot></div></td></tr>
        </tbody>
        <tbody v-else-if="tableRows.length">
          <tr
            v-for="(row, index) in tableRows"
            :key="getRowKey(row, index)"
            :class="{ 'kima-table__row--selected': selectable && selectedKeys.has(getRowKey(row, index)) }"
            tabindex="0"
            @click="handleRowClick(row, $event)"
            @keydown="handleRowKeydown(row, index, $event)"
          >
            <td v-if="selectable" class="kima-table__select-column">
              <button
                type="button"
                class="kima-table__select-button"
                role="checkbox"
                :aria-checked="selectedKeys.has(getRowKey(row, index))"
                :aria-label="`${selectedKeys.has(getRowKey(row, index)) ? '取消选择' : '选择'}第 ${index + 1} 行`"
                :title="`${selectedKeys.has(getRowKey(row, index)) ? '取消选择' : '选择'}第 ${index + 1} 行`"
                @click.stop="toggleRow(row, index)"
              >
                <KimaIcon :icon="selectedKeys.has(getRowKey(row, index)) ? CheckmarkSquare02Icon : SquareIcon" :size="20" aria-hidden="true" />
              </button>
            </td>
            <td v-for="column in columns" :key="column.key" :class="`kima-table__align--${column.align || 'start'}`">
              <slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]" :column="column">
                {{ row[column.key] }}
              </slot>
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr><td class="kima-table__message" :colspan="columnCount"><div role="status"><slot name="empty">暂无数据</slot></div></td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped lang="scss">
.kima-table {
  width: 100%;
  min-width: 0;
  color: var(--kima-color-on-surface);
  font-family: var(--kima-font-family);
  font-size: var(--kima-font-size-md);
  line-height: 1.5;
  letter-spacing: 0;
}

.kima-table__scroll {
  max-width: 100%;
  border-radius: var(--kima-radius-m);
  background: var(--kima-color-layer-1);
  overflow-x: auto;
  overflow-y: hidden;

  &:focus-visible {
    outline: 2px solid var(--kima-color-primary);
    outline-offset: 2px;
  }
}

table {
  width: 100%;
  min-width: 32rem;
  border-collapse: separate;
  border-spacing: 0;
}
caption {
  padding: var(--kima-space-3) var(--kima-space-4);
  border-radius: var(--kima-radius-m) var(--kima-radius-m) 0 0;
  color: var(--kima-color-on-surface-variant);
  background: var(--kima-color-layer-2);
  text-align: start;
  caption-side: top;
}

th,
td {
  padding: var(--kima-space-3) var(--kima-space-4);
  border-bottom: 1px solid var(--kima-color-outline);
  overflow-wrap: anywhere;
  text-align: start;
  vertical-align: middle;
}

th {
  color: var(--kima-color-on-surface-variant);
  background: var(--kima-color-layer-2);
  font-size: var(--kima-font-size-sm);
  font-weight: var(--kima-font-weight-bold);
}

/* caption 在表头上方，外壳的顶部圆角到不了真正有底色的表头；
 * 圆角落在首尾单元格上，表头的底色才会跟着轮廓收圆。 */
thead tr:first-child th:first-child {
  border-top-left-radius: var(--kima-radius-m);
}

thead tr:first-child th:last-child {
  border-top-right-radius: var(--kima-radius-m);
}

tbody tr {
  transition: background-color var(--kima-duration-fast) var(--kima-ease-standard);

  &:focus-visible {
    outline: 2px solid var(--kima-color-primary);
    outline-offset: -2px;
  }
}

.kima-table--striped tbody tr:nth-child(even) {
  background: var(--kima-color-layer-2);
}

/* 表格有多个 tbody（加载、数据、空状态）时，最后一个 tbody 才是底边。 */
.kima-table tbody:last-child tr:last-child td:first-child {
  border-bottom-left-radius: var(--kima-radius-m);
}

.kima-table tbody:last-child tr:last-child td:last-child {
  border-bottom-right-radius: var(--kima-radius-m);
}

.kima-table--hoverable tbody tr:hover {
  background: var(--kima-color-layer-3);
}

.kima-table tbody tr.kima-table__row--selected {
  color: var(--kima-color-on-primary-container);
  background: var(--kima-color-primary-container);
}

.kima-table__sort-button,
.kima-table__select-button {
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: var(--kima-radius-sm);
  color: inherit;
  background: var(--kima-color-transparent);
  font: inherit;
  letter-spacing: 0;
  cursor: pointer;
  /* 悬停是"亮起来"的反馈，要看得见过程。 */
  transition: color var(--kima-duration-effects) var(--kima-curve-standard);

  &:hover:not(:disabled) {
    color: var(--kima-color-primary);
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

.kima-table__sort-button {
  max-width: 100%;
  gap: var(--kima-space-2);
  text-align: inherit;

  :deep(svg) {
    flex: 0 0 16px;
  }
}

.kima-table__select-column {
  width: 40px;
  padding: var(--kima-space-1) var(--kima-space-2);
  text-align: center;
}

.kima-table__select-button {
  width: 40px;
  height: 40px;

  &[aria-checked="true"],
  &[aria-checked="mixed"] {
    color: var(--kima-color-primary);
  }
}

.kima-table__message {
  height: 96px;
  color: var(--kima-color-on-surface-variant);
  text-align: center;
}

.kima-table__align--left { text-align: left; }
.kima-table__align--right { text-align: right; }
.kima-table__align--center { text-align: center; }
.kima-table__align--end { text-align: end; }

@media (max-width: 480px) {
  th,
  td {
    padding-inline: var(--kima-space-2);
  }
}

@media (prefers-reduced-motion: reduce) {
  tbody tr { transition: none; }
}
</style>
