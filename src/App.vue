<!--
KIMA 全览预览页：把全部组件集中在一个页面里展示样式和交互。
调用示例：
  pnpm dev          # 打开 http://localhost:5173 查看全览
  pnpm build        # 构建预览页到 site-dist
页面结构：
  顶部栏有主题切换和搜索；左侧是组件目录；右侧按分组展示每个组件的实时交互示例。
搜索会按组件英文名和中文名过滤，只保留匹配的展示块。
-->
<script setup>
import { computed, onMounted, ref } from "vue";
import { HugeiconsIcon } from "@hugeicons/vue";
import {
  Add01Icon,
  FavouriteIcon,
  Folder01Icon,
  HeartIcon,
  Menu01Icon,
  Moon02Icon,
  MoreHorizontalIcon,
  Search01Icon,
  Settings01Icon,
  SparklesIcon,
  StarIcon,
  Sun01Icon,
} from "@hugeicons/core-free-icons";
import {
  KimaBadge,
  KimaButton,
  KimaButtonGroup,
  KimaCard,
  KimaCascader,
  KimaCheckbox,
  KimaCombobox,
  KimaDatePicker,
  KimaDialog,
  KimaDivider,
  KimaEmptyState,
  KimaIconButton,
  KimaLayout,
  KimaMenu,
  KimaNotification,
  KimaPagination,
  KimaProgress,
  KimaSelect,
  KimaSlider,
  KimaSwitch,
  KimaTable,
  KimaTabs,
  KimaTextField,
  KimaTimePicker,
  KimaTooltip,
  KimaTree,
  KimaVirtualScroll,
} from "@/index";

// --- 主题和搜索 ---
const theme = ref("dark");
function toggleTheme() {
  theme.value = theme.value === "dark" ? "light" : "dark";
  document.documentElement.dataset.kimaTheme = theme.value;
}

// --- 基础层展示 ---
// 色板只列角色名和用途，颜色值从 CSS 变量取，不在这里再抄一份。
const palette = [
  { name: "surface", use: "页面底色" },
  { name: "surface-container", use: "卡片、侧栏" },
  { name: "surface-container-high", use: "菜单、悬停面" },
  { name: "surface-container-highest", use: "抽屉、弹层" },
  { name: "on-surface", use: "主文字" },
  { name: "on-surface-variant", use: "次要文字" },
  { name: "outline", use: "强描边" },
  { name: "outline-variant", use: "弱描边" },
  { name: "primary", use: "主操作" },
  { name: "primary-container", use: "柔和主操作" },
  { name: "secondary-container", use: "次操作" },
  { name: "tertiary-container", use: "强调色" },
  { name: "error", use: "危险操作" },
  { name: "error-container", use: "危险柔和" },
  { name: "scrim", use: "抽屉遮罩" },
];
const typeScale = [
  { token: "display-small", label: "display 44" },
  { token: "headline-small", label: "headline 28" },
  { token: "title-large", label: "title 26" },
  { token: "title-medium", label: "title 20" },
  { token: "body-large", label: "body 18" },
  { token: "body-medium", label: "body 16" },
  { token: "label-medium", label: "label 14" },
];
const radii = ["xs", "s", "m", "l", "xl", "full"];

const query = ref("");
// 搜索词匹配组件英文名或本节标题时就显示这个展示块。
function visible(...keywords) {
  const text = query.value.trim().toLowerCase();
  if (!text) return true;
  return keywords.some((keyword) => keyword.toLowerCase().includes(text));
}

const sections = [
  { id: "actions", title: "按钮与动作" },
  { id: "form", title: "表单输入" },
  { id: "pickers", title: "选择与日期" },
  { id: "feedback", title: "反馈与提示" },
  { id: "data", title: "数据展示" },
  { id: "structure", title: "结构与导航" },
];

// --- 按钮与动作 ---
const clicks = ref(0);
function countClick() {
  clicks.value += 1;
}

// --- 表单输入 ---
const textValue = ref("");
const password = ref("");
const email = ref("hello@kima.dev");
const accepted = ref(true);
const partial = ref(false);
const syncEnabled = ref(true);
const volume = ref(40);
const progressValue = ref(65);

// --- 选择与日期 ---
const countries = [
  { value: "cn", label: "中国" },
  { value: "jp", label: "日本", description: "东亚" },
  { value: "de", label: "德国", description: "欧洲" },
  { value: "br", label: "巴西", disabled: true },
];
const country = ref("cn");
const tags = [
  { value: "design", label: "设计" },
  { value: "code", label: "开发" },
  { value: "docs", label: "文档" },
];
const tag = ref(null);
const categoryPath = ref(["tech", "web"]);
const categoryOptions = [
  {
    value: "tech",
    label: "技术",
    children: [
      { value: "web", label: "前端", children: [{ value: "vue", label: "Vue" }, { value: "react", label: "React" }] },
      { value: "native", label: "原生" },
    ],
  },
  { value: "life", label: "生活" },
];
const birthday = ref("1998-06-15");
const dateOpen = ref(false);
const startTime = ref("09:30");
const timeOpen = ref(false);

// --- 反馈与提示 ---
const dialogOpen = ref(false);
const noticeOpen = ref(true);
const noticeVariant = ref("success");

// --- 数据展示 ---
const columns = [
  { key: "name", label: "名称", sortable: true },
  { key: "role", label: "角色" },
  { key: "state", label: "状态", align: "end" },
];
const rows = ref([
  { id: "1", name: "林一", role: "设计", state: "在线" },
  { id: "2", name: "赵二", role: "开发", state: "离线" },
  { id: "3", name: "钱三", role: "测试", state: "在线" },
]);
const selectedRows = ref([]);
const sort = ref({ key: "", direction: "" });
function applySort(event) {
  sort.value = event;
  const direction = event.direction === "asc" ? 1 : -1;
  rows.value = [...rows.value].sort((left, right) => (left[event.key] > right[event.key] ? direction : -direction));
}

const treeItems = [
  {
    value: "src",
    label: "src",
    children: [
      { value: "components", label: "components", children: [{ value: "button", label: "button.ce.vue" }] },
      { value: "styles", label: "styles" },
    ],
  },
  { value: "readme", label: "README.md" },
];
const treeSelected = ref("button");
const treeExpanded = ref(["src", "components"]);

const page = ref(1);
const treePageSize = 20;

const virtualItems = Array.from({ length: 5000 }, (_, index) => ({ value: `row-${index}`, label: `第 ${index + 1} 行` }));
const virtualSelected = ref(null);

// --- 结构与导航 ---
const menuValue = ref("recent");
const menuOpen = ref(false);
const menuItems = [
  { value: "recent", label: "最近打开" },
  { value: "starred", label: "已收藏" },
  { value: "archived", label: "归档", disabled: true },
];
const tabValue = ref("overview");
const tabItems = [
  { value: "overview", label: "概览" },
  { value: "usage", label: "用法" },
  { value: "api", label: "API" },
];
const viewValue = ref("grid");
const viewItems = [
  { value: "grid", label: "网格" },
  { value: "list", label: "列表" },
  { value: "board", label: "看板" },
];

onMounted(() => {
  document.documentElement.dataset.kimaTheme = theme.value;
});

const componentCount = 27;
const isFiltering = computed(() => query.value.trim().length > 0);
</script>

<template>
  <div class="kima-gallery">
    <header class="kima-gallery__top">
      <div class="kima-gallery__brand">
        <HugeiconsIcon :icon="SparklesIcon" :size="22" />
        <div>
          <strong>KIMA</strong>
          <span>Kinetic · Interaction · Motion · Alive</span>
        </div>
      </div>

      <div class="kima-gallery__tools">
        <label class="kima-gallery__search">
          <HugeiconsIcon :icon="Search01Icon" :size="18" aria-hidden="true" />
          <input v-model="query" type="search" placeholder="搜索组件，例如 text / 表" aria-label="搜索组件" />
        </label>
        <kima-icon-button
          :label="theme === 'dark' ? '切换到浅色' : '切换到深色'"
          variant="outlined"
          :icon="theme === 'dark' ? Sun01Icon : Moon02Icon"
          @click="toggleTheme"
        />
      </div>
    </header>

    <div class="kima-gallery__body">
      <nav class="kima-gallery__nav" aria-label="组件目录">
        <p class="kima-gallery__count">{{ componentCount }} 个组件</p>
        <a v-for="section in sections" :key="section.id" :href="`#${section.id}`">{{ section.title }}</a>
        <kima-divider label="提示" />
        <p class="kima-gallery__hint">点击控件即可交互，覆盖层组件点按钮打开。</p>
      </nav>

      <main class="kima-gallery__main">
        <!-- 基础层：色板、字体、圆角、状态层，改主题色或尺寸先看这里 -->
        <section v-show="visible('基础层', 'token', 'color', 'type', '基础')" id="tokens" class="kima-gallery__section">
          <h2>基础层</h2>

          <article class="kima-gallery__demo">
            <header>
              <h3>主题色板</h3>
              <p>全部由种子色 <code>#61afef</code> 生成，改 <code>scripts/palette.js</code> 里的 seed 即可整体换色。</p>
            </header>
            <div class="kima-gallery__swatches">
              <div v-for="swatch in palette" :key="swatch.name" class="kima-gallery__swatch">
                <span class="kima-gallery__swatch-chip" :style="{ background: `var(--kima-color-${swatch.name})` }" />
                <code>{{ swatch.name }}</code>
                <small>{{ swatch.use }}</small>
              </div>
            </div>
          </article>

          <article class="kima-gallery__demo">
            <header>
              <h3>字体阶梯</h3>
              <p>Maple Mono NF CN，semi-bold。比 M3 官方默认整体放大一号，中文走系统回退。</p>
            </header>
            <div class="kima-gallery__stack">
              <p v-for="step in typeScale" :key="step.token" class="kima-gallery__type" :style="{ fontSize: `var(--kima-font-size-${step.token})` }">
                {{ step.label }} 永远不要放弃探索
              </p>
            </div>
          </article>

          <article class="kima-gallery__demo">
            <header>
              <h3>圆角与层级</h3>
              <p>M3 圆角刻度。层级只用在浮起来的表面上。</p>
            </header>
            <div class="kima-gallery__row kima-gallery__row--tall">
              <span v-for="radius in radii" :key="radius" class="kima-gallery__radius" :style="{ borderRadius: `var(--kima-radius-${radius})` }">
                {{ radius }}
              </span>
            </div>
            <div class="kima-gallery__row kima-gallery__row--tall">
              <span v-for="level in [1, 2, 3, 4, 5]" :key="level" class="kima-gallery__elevation" :style="{ boxShadow: `var(--kima-elevation-${level})` }">
                {{ level }}
              </span>
            </div>
          </article>
        </section>

        <!-- 按钮与动作 -->
        <section v-show="visible('按钮与动作', 'button', 'badge', 'divider', 'card')" id="actions" class="kima-gallery__section">
          <h2>按钮与动作</h2>

          <article v-show="visible('button', '按钮')" class="kima-gallery__demo">
            <header><h3>Button 按钮</h3><p>四种外观、加载和禁用状态。点击计数：{{ clicks }}</p></header>
            <div class="kima-gallery__row">
              <kima-button @click="countClick">填充</kima-button>
              <kima-button variant="tonal" @click="countClick">柔和</kima-button>
              <kima-button variant="outlined" @click="countClick">描边</kima-button>
              <kima-button variant="text" @click="countClick">文字</kima-button>
              <kima-button loading>加载中</kima-button>
              <kima-button disabled>禁用</kima-button>
              <kima-button round @click="countClick">
                <template #leading><HugeiconsIcon :icon="Add01Icon" :size="18" /></template>
                新建
              </kima-button>
            </div>
          </article>

          <article v-show="visible('icon-button', '图标按钮')" class="kima-gallery__demo">
            <header><h3>IconButton 图标按钮</h3><p>单个图标的可访问按钮，三种尺寸。</p></header>
            <div class="kima-gallery__row">
              <kima-icon-button label="收藏" :icon="HeartIcon" />
              <kima-icon-button label="收藏" variant="tonal" :icon="FavouriteIcon" />
              <kima-icon-button label="设置" variant="outlined" :icon="Settings01Icon" />
              <kima-icon-button label="更多" variant="text" :icon="MoreHorizontalIcon" />
              <kima-icon-button label="小号" size="small" variant="tonal" :icon="Menu01Icon" />
              <kima-icon-button label="大号" size="large" :icon="StarIcon" />
              <kima-icon-button label="加载中" loading />
            </div>
          </article>

          <article v-show="visible('button-group', '按钮组')" class="kima-gallery__demo">
            <header><h3>ButtonGroup 按钮组</h3><p>单选切换视图，支持方向键。</p></header>
            <div class="kima-gallery__row">
              <kima-button-group v-model="viewValue" :items="viewItems" />
              <kima-button-group v-model="viewValue" :items="viewItems" size="small" orientation="vertical" />
            </div>
          </article>

          <article v-show="visible('badge', '徽章')" class="kima-gallery__demo">
            <header><h3>Badge 徽章</h3><p>状态、数量和圆点三种用法。</p></header>
            <div class="kima-gallery__row">
              <kima-badge value="8" />
              <kima-badge :value="128" :max="99" variant="danger" aria-label="128 条未读" />
              <kima-badge value="新" variant="primary" />
              <kima-badge value="在线" variant="success" />
              <kima-badge dot variant="success" aria-label="在线" />
            </div>
          </article>

          <article v-show="visible('divider', '分割线')" class="kima-gallery__demo">
            <header><h3>Divider 分割线</h3><p>水平、带文字和垂直三种形态。</p></header>
            <div class="kima-gallery__stack">
              <kima-divider />
              <kima-divider label="或者" />
              <div class="kima-gallery__row kima-gallery__row--tall">
                <span>左</span>
                <kima-divider vertical />
                <span>右</span>
              </div>
            </div>
          </article>

          <article v-show="visible('card', '卡片')" class="kima-gallery__demo">
            <header><h3>Card 卡片</h3><p>三种容器样式，可点击的卡片支持键盘。</p></header>
            <div class="kima-gallery__grid">
              <kima-card>
                <template #header><strong>表面卡片</strong></template>
                <p>默认的容器样式。</p>
              </kima-card>
              <kima-card variant="outlined">
                <template #header><strong>描边卡片</strong></template>
                <p>透明的底色配描边。</p>
              </kima-card>
              <kima-card variant="elevated" clickable @click="countClick">
                <template #header><strong>可点击卡片</strong></template>
                <p>点击计数加到上方的按钮示例。</p>
              </kima-card>
            </div>
          </article>
        </section>

        <!-- 表单输入 -->
        <section v-show="visible('表单输入', 'text-field', 'checkbox', 'switch', 'slider', 'progress')" id="form" class="kima-gallery__section">
          <h2>表单输入</h2>

          <article v-show="visible('text-field', '文本框')" class="kima-gallery__demo">
            <header><h3>TextField 文本框</h3><p>浮动标签、说明、错误和密码显示。当前值：{{ textValue || "空" }}</p></header>
            <div class="kima-gallery__grid">
              <kima-text-field v-model="textValue" label="昵称" placeholder="请输入昵称" clearable />
              <kima-text-field v-model="email" type="email" label="邮箱" hint="用于接收通知" />
              <kima-text-field :model-value="'错误示例'" label="错误状态" error="这个值不符合要求" />
              <kima-text-field v-model="password" type="password" label="密码" placeholder="请输入密码" clearable />
              <kima-text-field :model-value="''" label="大号" size="large" /><kima-text-field :model-value="'只读'" label="只读" readonly />
            </div>
          </article>

          <article v-show="visible('checkbox', '复选框')" class="kima-gallery__demo">
            <header><h3>Checkbox 复选框</h3><p>选中、半选和禁用。选中：{{ accepted }}</p></header>
            <div class="kima-gallery__row">
              <kima-checkbox v-model="accepted" label="接受条款" />
              <kima-checkbox v-model="partial" :indeterminate="true" label="半选状态" />
              <kima-checkbox :model-value="true" disabled label="已禁用" />
            </div>
          </article>

          <article v-show="visible('switch', '开关')" class="kima-gallery__demo">
            <header><h3>Switch 开关</h3><p>开关状态：{{ syncEnabled }}</p></header>
            <div class="kima-gallery__row">
              <kima-switch v-model="syncEnabled">启用同步</kima-switch>
              <kima-switch :model-value="false">关闭示例</kima-switch>
              <kima-switch :model-value="true" disabled>禁用</kima-switch>
            </div>
          </article>

          <article v-show="visible('slider', '滑块')" class="kima-gallery__demo">
            <header><h3>Slider 滑块</h3><p>音量：{{ volume }}</p></header>
            <div class="kima-gallery__stack">
              <kima-slider v-model="volume" label="音量" show-value />
              <kima-slider :model-value="25" :min="0" :max="50" label="范围 0-50" show-value />
            </div>
          </article>

          <article v-show="visible('progress', '进度条')" class="kima-gallery__demo">
            <header><h3>Progress 进度条</h3><p>进度：{{ progressValue }}%</p></header>
            <div class="kima-gallery__stack">
              <kima-progress :value="progressValue" label="下载进度" />
              <kima-progress indeterminate label="正在连接" />
              <div class="kima-gallery__row">
              <kima-button variant="tonal" @click="progressValue = Math.max(0, progressValue - 10)">减 10</kima-button>
              <kima-button variant="tonal" @click="progressValue = Math.min(100, progressValue + 10)">加 10</kima-button>
              </div>
            </div>
          </article>
        </section>

        <!-- 选择与日期 -->
        <section v-show="visible('选择与日期', 'select', 'combobox', 'cascader', 'date-picker', 'time-picker')" id="pickers" class="kima-gallery__section">
          <h2>选择与日期</h2>

          <article v-show="visible('select', '选择器')" class="kima-gallery__demo">
            <header><h3>Select 选择器</h3><p>已选：{{ country || "未选择" }}</p></header>
            <div class="kima-gallery__grid">
              <kima-select v-model="country" label="国家" :items="countries" searchable clearable />
              <kima-select :model-value="null" label="必填" :items="countries" required placeholder="请选择国家" />
            </div>
          </article>

          <article v-show="visible('combobox', '组合框')" class="kima-gallery__demo">
            <header><h3>Combobox 组合框</h3><p>输入可过滤，已选：{{ tag || "未选择" }}</p></header>
            <div class="kima-gallery__grid">
              <kima-combobox v-model="tag" label="标签" :items="tags" clearable searchable />
              <kima-combobox :model-value="null" label="自由输入" :items="tags" free-solo searchable />
            </div>
          </article>

          <article v-show="visible('cascader', '级联')" class="kima-gallery__demo">
            <header><h3>Cascader 级联选择</h3><p>路径：{{ categoryPath.join(" / ") }}</p></header>
            <kima-cascader v-model="categoryPath" label="分类" :options="categoryOptions" clearable />
          </article>

          <article v-show="visible('date-picker', '日期')" class="kima-gallery__demo">
            <header><h3>DatePicker 日期选择</h3><p>日期：{{ birthday || "未选择" }}</p></header>
            <div class="kima-gallery__grid">
              <kima-date-picker v-model="birthday" v-model:open="dateOpen" label="生日" clearable />
              <kima-date-picker
                :model-value="'2024-06-15'"
                min="2024-06-01"
                max="2024-06-20"
                label="限定范围"
              />
            </div>
          </article>

          <article v-show="visible('time-picker', '时间')" class="kima-gallery__demo">
            <header><h3>TimePicker 时间选择</h3><p>时间：{{ startTime || "未选择" }}</p></header>
            <div class="kima-gallery__grid">
              <kima-time-picker v-model="startTime" v-model:open="timeOpen" label="开始时间" :step="15" clearable />
              <kima-time-picker :model-value="'14:00'" label="12 小时制" locale="en-US" :hour12="true" />
            </div>
          </article>
        </section>

        <!-- 反馈与提示 -->
        <section v-show="visible('反馈与提示', 'notification', 'dialog', 'tooltip', 'empty-state')" id="feedback" class="kima-gallery__section">
          <h2>反馈与提示</h2>

          <article v-show="visible('notification', '通知')" class="kima-gallery__demo">
            <header><h3>Notification 通知</h3><p>右上角浮层，可自动关闭。</p></header>
            <div class="kima-gallery__row">
              <kima-button variant="tonal" @click="noticeVariant = 'success'; noticeOpen = true">成功通知</kima-button>
              <kima-button variant="tonal" @click="noticeVariant = 'warning'; noticeOpen = true">警告通知</kima-button>
              <kima-button variant="tonal" @click="noticeVariant = 'danger'; noticeOpen = true">错误通知</kima-button>
            </div>
          </article>

          <article v-show="visible('dialog', '对话框')" class="kima-gallery__demo">
            <header><h3>Dialog 对话框</h3><p>模态弹层，按 Esc 或点遮罩关闭。</p></header>
            <kima-button @click="dialogOpen = true">打开对话框</kima-button>
          </article>

          <article v-show="visible('tooltip', '提示')" class="kima-gallery__demo">
            <header><h3>Tooltip 提示框</h3><p>悬停或聚焦触发。</p></header>
            <div class="kima-gallery__row">
              <kima-tooltip text="保存当前内容"><kima-button variant="outlined">底部提示</kima-button></kima-tooltip>
              <kima-tooltip text="这段提示显示在上方" position="top"><kima-button variant="outlined">顶部提示</kima-button></kima-tooltip>
              <kima-tooltip text="右侧说明" position="right"><kima-button variant="outlined">右侧提示</kima-button></kima-tooltip>
            </div>
          </article>

          <article v-show="visible('empty-state', '空状态')" class="kima-gallery__demo">
            <header><h3>EmptyState 空状态</h3><p>没有内容时的占位。</p></header>
            <kima-empty-state heading="还没有项目" description="创建第一个项目后，它会显示在这里。">
              <template #icon><HugeiconsIcon :icon="Folder01Icon" :size="40" /></template>
              <template #action><kima-button variant="tonal">创建项目</kima-button></template>
            </kima-empty-state>
          </article>
        </section>

        <!-- 数据展示 -->
        <section v-show="visible('数据展示', 'table', 'tree', 'pagination', 'virtual-scroll')" id="data" class="kima-gallery__section">
          <h2>数据展示</h2>

          <article v-show="visible('table', '表格')" class="kima-gallery__demo">
            <header><h3>Table 数据表</h3><p>已选 {{ selectedRows.length }} 行，可点表头排序。</p></header>
            <kima-table
              v-model="selectedRows"
              :columns="columns"
              :rows="rows"
              row-key="id"
              caption="团队成员"
              selectable
              striped
              hoverable
              :sort-key="sort.key"
              :sort-direction="sort.direction"
              @sort-change="applySort"
            />
          </article>

          <article v-show="visible('tree', '树')" class="kima-gallery__demo">
            <header><h3>Tree 树</h3><p>已选：{{ treeSelected || "未选择" }}</p></header>
            <kima-tree
              v-model="treeSelected"
              v-model:expanded="treeExpanded"
              :items="treeItems"
              selectable
            />
          </article>

          <article v-show="visible('pagination', '分页')" class="kima-gallery__demo">
            <header><h3>Pagination 分页</h3><p>当前第 {{ page }} 页。</p></header>
            <div class="kima-gallery__stack">
              <kima-pagination v-model="page" :total="480" :page-size="treePageSize" />
              <kima-pagination v-model="page" :total="480" :page-size="treePageSize" compact :sibling-count="1" />
            </div>
          </article>

          <article v-show="visible('virtual-scroll', '虚拟滚动')" class="kima-gallery__demo">
            <header><h3>VirtualScroll 虚拟滚动</h3><p>5000 行只渲染可见部分，已选：{{ virtualSelected || "未点击" }}</p></header>
            <kima-virtual-scroll
              v-model="virtualSelected"
              :items="virtualItems"
              :item-height="36"
              height="280"
              :overscan="3"
            >
              <template #default="{ item, index }">
                <span class="kima-gallery__row-index">{{ index + 1 }}</span>
                {{ item.label }}
              </template>
            </kima-virtual-scroll>
          </article>
        </section>

        <!-- 结构与导航 -->
        <section v-show="visible('结构与导航', 'layout', 'menu', 'tabs')" id="structure" class="kima-gallery__section">
          <h2>结构与导航</h2>

          <article v-show="visible('menu', '菜单')" class="kima-gallery__demo">
            <header><h3>Menu 菜单</h3><p>可搜索的单选菜单，已选：{{ menuValue }}</p></header>
            <div class="kima-gallery__row">
              <kima-menu v-model="menuValue" v-model:open="menuOpen" :items="menuItems" label="排序" searchable />
            </div>
          </article>

          <article v-show="visible('tabs', '标签页')" class="kima-gallery__demo">
            <header><h3>Tabs 标签页</h3><p>当前标签：{{ tabValue }}</p></header>
            <kima-tabs v-model="tabValue" :items="tabItems">
              <template #panel="{ item }">
                <p>{{ item.label }} 面板的内容。用方向键切换标签。</p>
              </template>
            </kima-tabs>
          </article>

          <article v-show="visible('layout', '布局')" class="kima-gallery__demo">
            <header><h3>Layout 布局容器</h3><p>页面和面板两种容器。</p></header>
            <div class="kima-gallery__stack">
              <kima-layout variant="panel" :max-width="520" :gap="12">
                <template #header><strong>面板标题</strong></template>
                <span>面板内容，最大宽度 520。</span>
                <template #footer><kima-button variant="tonal">确定</kima-button></template>
              </kima-layout>
            </div>
          </article>
        </section>

        <kima-empty-state
          v-if="isFiltering && !visible(
            'button', 'icon-button', 'button-group', 'badge', 'divider', 'card',
            'text-field', 'checkbox', 'switch', 'slider', 'progress',
            'select', 'combobox', 'cascader', 'date-picker', 'time-picker',
            'notification', 'dialog', 'tooltip', 'empty-state',
            'table', 'tree', 'pagination', 'virtual-scroll',
            'layout', 'menu', 'tabs',
          )"
          heading="没有匹配的组件"
          description="换一个关键词试试，例如 button、日期或表格。"
          compact
        />
      </main>
    </div>

    <kima-notification
      v-model:open="noticeOpen"
      :variant="noticeVariant"
      heading="操作完成"
      message="这是一个可以自动关闭的通知示例。"
      position="top-right"
    />

    <kima-dialog v-model:open="dialogOpen" title="确认操作" description="这个示例展示对话框的标题、说明和按钮区。">
      <p>对话框使用原生 modal 实现，会自动隔离背景并管理键盘焦点。</p>
      <template #footer>
        <kima-button variant="text" @click="dialogOpen = false">取消</kima-button>
        <kima-button @click="dialogOpen = false">确定</kima-button>
      </template>
    </kima-dialog>
  </div>
</template>

<style scoped lang="scss">
.kima-gallery {
  min-height: 100vh;
  background: var(--kima-color-surface);
  color: var(--kima-color-on-surface);
  font-family: var(--kima-font-family);

  &__top {
    position: sticky;
    top: 0;
    z-index: 5;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--kima-space-3);
    padding: var(--kima-space-3) var(--kima-space-5);
    border-bottom: 1px solid var(--kima-color-outline);
    background: var(--kima-color-surface-container);
  }

  &__brand {
    display: flex;
    align-items: center;
    gap: var(--kima-space-3);
    color: var(--kima-color-primary);

    strong {
      display: block;
      font-size: var(--kima-font-size-lg);
      letter-spacing: 0.08em;
      color: var(--kima-color-on-surface);
    }

    span {
      font-size: var(--kima-font-size-xs);
      color: var(--kima-color-on-surface-variant);
    }
  }

  &__tools {
    display: flex;
    align-items: center;
    gap: var(--kima-space-2);
  }

  &__search {
    display: flex;
    align-items: center;
    gap: var(--kima-space-2);
    min-height: 40px;
    padding: 0 var(--kima-space-3);
    border: 1px solid var(--kima-color-outline);
    border-radius: var(--kima-radius-sm);
    color: var(--kima-color-on-surface-variant);
    background: var(--kima-color-surface);

    input {
      width: 200px;
      border: 0;
      outline: 0;
      color: var(--kima-color-on-surface);
      background: var(--kima-color-transparent);
      font: inherit;
    }
  }

  &__body {
    display: grid;
    grid-template-columns: 220px minmax(0, 1fr);
    align-items: start;
    gap: var(--kima-space-5);
    max-width: 1280px;
    margin: 0 auto;
    padding: var(--kima-space-5);
  }

  &__nav {
    position: sticky;
    top: 84px;
    display: flex;
    flex-direction: column;
    gap: var(--kima-space-1);

    a {
      padding: var(--kima-space-2) var(--kima-space-3);
      border-radius: var(--kima-radius-sm);
      color: var(--kima-color-on-surface-variant);
      text-decoration: none;

      &:hover {
        color: var(--kima-color-on-surface);
        background: var(--kima-color-surface-container-high);
      }
    }
  }

  &__count {
    margin: 0 0 var(--kima-space-2);
    font-size: var(--kima-font-size-sm);
    color: var(--kima-color-primary);
  }

  &__hint {
    margin: 0;
    font-size: var(--kima-font-size-xs);
    color: var(--kima-color-on-surface-variant);
  }

  &__main {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: var(--kima-space-6);
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: var(--kima-space-4);

    > h2 {
      margin: 0;
      padding-bottom: var(--kima-space-2);
      border-bottom: 2px solid var(--kima-color-primary);
      font-size: var(--kima-font-size-xl);
    }
  }

  /* --- 基础层展示：色板、字体阶梯、圆角、层级 --- */

  &__swatches {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: var(--kima-space-3);
  }

  &__swatch {
    display: flex;
    flex-direction: column;
    gap: var(--kima-space-1);

    code {
      font-size: var(--kima-font-size-label-medium);
    }

    small {
      color: var(--kima-color-on-surface-variant);
      font-size: var(--kima-font-size-label-small);
    }
  }

  &__swatch-chip {
    display: block;
    height: 56px;
    border: 1px solid var(--kima-color-outline-variant);
    border-radius: var(--kima-radius-m);
  }

  &__type {
    margin: 0;
    line-height: var(--kima-line-height-tight);
  }

  &__radius,
  &__elevation {
    display: grid;
    place-items: center;
    width: 72px;
    height: 72px;
    background: var(--kima-color-surface-container-high);
    color: var(--kima-color-on-surface-variant);
    font-size: var(--kima-font-size-label-small);
  }

  &__demo {
    display: flex;
    flex-direction: column;
    gap: var(--kima-space-4);
    padding: var(--kima-space-4);
    border: 1px solid var(--kima-color-outline);
    border-radius: var(--kima-radius-md);
    background: var(--kima-color-surface-container);

    > header {
      h3 {
        margin: 0;
        font-size: var(--kima-font-size-lg);
      }

      p {
        margin: var(--kima-space-1) 0 0;
        font-size: var(--kima-font-size-sm);
        color: var(--kima-color-on-surface-variant);
      }
    }
  }

  &__row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--kima-space-3);

    &--tall {
      min-height: 80px;
    }
  }

  &__stack {
    display: flex;
    flex-direction: column;
    gap: var(--kima-space-3);
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: var(--kima-space-4);
  }

  &__row-index {
    display: inline-block;
    min-width: 56px;
    color: var(--kima-color-on-surface-variant);
    font-variant-numeric: tabular-nums;
  }
}

@media (max-width: 860px) {
  .kima-gallery__body {
    grid-template-columns: minmax(0, 1fr);
  }

  .kima-gallery__nav {
    position: static;
    flex-direction: row;
    flex-wrap: wrap;
  }
}
</style>
