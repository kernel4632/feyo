# 上游参考研究笔记

> 历史笔记：写于项目还叫 FEYO、设计方向参考 DMS 的时期。**已过时**，仅作历史参考，
> 不再作为设计依据；当前方向见 [AGENTS.md](../AGENTS.md)。

本文件只记录本地上游源码的结构、数值与行为，不是 KIMA 的设计规范或实现承诺。
没有运行 QML 界面或测量截图；下列测量来自读取源码中的尺寸常量与计算公式。
QML 数值是逻辑尺寸，不能直接当作任何屏幕上的物理像素。
KIMA 的命名、颜色、字体、图标和浏览器交互仍以自己的源码为准。

## 固定版本

读取时两个本地参考仓库的 `git status --short` 均为空。版本使用完整提交哈希固定，
不代表上游当前最新版本。下文的文件路径均相对于对应仓库根目录。

- 共用组件：<https://github.com/AvengeMedia/dank-qml-common>。
  提交：`3a56e88ac7a730497d8afed423f18fda229a1e56`。
  本地目录：`C:/Users/17137/AppData/Local/Temp/opencode/feyo-common-reference`。
- 桌面壳层：<https://github.com/AvengeMedia/DankMaterialShell>。
  提交：`d8113d2a0289d7fb4b074207d3e08fb22e1b6843`。
  本地目录：`C:/Users/17137/AppData/Local/Temp/opencode/feyo-shell-reference`。

## 主题与基础尺寸

- 共用仓库 `README.md` 的 `The contract` 与 `DankCommon/Common/Style.qml`：
  宿主启动时注入 theme，组件通过 `theme?.x ?? fallback` 读取 token。
  容器依次使用 host、card、chip、nested chip 的语义角色。
- 共用仓库 `DankCommon/Common/Style.qml:250` 与壳层
  `quickshell/Common/Theme.qml:1244`：间距 XXS/XS/S/M/L/XL 为 2/4/8/12/16/24。
  图标 small/medium/default/large 为 16/20/24/32；图标按钮 40，最小触控目标 48。
- 壳层 `quickshell/Common/Theme.qml:1251`：字体尺寸以 fontScale 乘以
  12/14/16/20/28/36/57 后取整，fontScale 的无配置回退为 1。
  `Theme.qml:26` 的默认字体是 Google Sans Flex，等宽字体 Fira Code，展示字体 DM Serif Display。
  这是参考的字体配置，不是 KIMA 的字体选择。
- 共用仓库 `SHAPES.md` 与 `DankCommon/Common/Shape.js`：圆角基线
  XXS/XS/S/M/L/L increased/XL/XL increased/XXL 为 2/4/8/12/16/20/28/32/48。
  strength 默认 50，缩放系数为 strength / 50；fullRadius 上限为短边的一半。
  fixedRadius 默认 -1，启用时替换缩放计算；归一化固定值限制在 0 到 32。

## 组件尺寸与行为

- 按钮：共用仓库 `DankCommon/Widgets/DankButton.qml:9` 默认 round，默认高度为
  `Style.buttonHeightS`。`DankCommon/Common/Style.qml:321` 的 XXS/XS/S/M 高度
  为 28/32/40/56，最小宽度 58。S 按钮水平内边距 16，内容间距 8。
  `DankCommon/Common/Shape.js:57` 与 `Style.qml:240` 显示，小型方形按钮圆角
  静止为 12，按下为 8；round 静止时使用 fullRadius，按下时仍改为尺寸对应的圆角。
  KIMA 当前 round 按钮保持圆形边角是本地选择，不是这一上游行为。
- 文本框：共用仓库 `DankCommon/Widgets/DankTextField.qml:24` 的 outlined 默认 false。
  `Style.qml:351` 的默认宽度 200，fieldHeight 为 round(fontSizeMedium × 3)，
  14 字号下结果为 42；large 高度 48，浮动标签行高 16。
  实际 outlined 控件默认 controlHeight 使用 iconButtonSize（40），并将标签带和说明文字
  计入 implicitHeight，不能把所有输入框都归纳为固定 42 高度。
  `DankTextField.qml:48` 使用 1/2 的普通/聚焦边框宽度与 XS 圆角（默认 4）。
  `DankTextField.qml:103` 的标签在聚焦、有内容或输入法正在组合文字时浮起；
  placeholder 的显示同时考虑组合输入状态。说明文字和错误状态另有布局与颜色逻辑。
- 开关：共用仓库 `DankCommon/Widgets/DankToggle.qml:34` 与 `Style.qml:298`：
  轨道 52 × 32，未选中边框 2；无图标的未选中滑块 16，选中或有图标时 24，按下时 28。
  `DankToggle.qml:59` 点击发送 clicked 与 toggled(!checked)，由外部绑定更新 checked；
  位移动画结束后发送 toggleCompleted。KIMA 的原生 checkbox 与 change 是浏览器实现选择。
- 滑块：共用仓库 `DankCommon/Widgets/DankSlider.qml:51` 默认 size 为 s，
  因此当前默认轨道/滑块高度是 24/36。`Style.qml:279` 的基础尺寸为 16/28；
  m/l/xl 对应 40/52、56/68、96/108。滑块宽 4，按下宽 2，间隙 6。
  外侧圆角 xs/s/m/l/xl 基线为 8/8/12/16/28，朝向滑块的内侧圆角单独为 2。
  `DankSlider.qml:167` 区分连续 sliderValueChanged 与完成 sliderDragFinished，
  数值限制在 minimum 到 maximum；有溢出滚动容器时关闭滚轮修改，键盘与拖动仍可用。
  `SHAPES.md` 提到 medium handle 保留 44，但本次读取的 Style.qml 和壳层
  `quickshell/Common/Theme.qml:1278` 都实际定义为 52；本笔记保留此差异，以实现数值为准。
- 进度参考：共用仓库 `DankCommon/Widgets/M3WaveProgress.qml` 是播放波形，
  默认线宽 2、波长 20、振幅 1.6；播放时推进相位，暂停时振幅归零，
  振幅变化使用 300ms OutCubic。它不是 KIMA 当前 8 高度的原生 progress 实现。
  本笔记不将 KIMA 的复选框或原生进度条尺寸归因于未核对的上游控件。

## 动画

- 共用仓库 `DankCommon/Common/Style.qml:417`：动画基准回退为 500ms，
  expressive spatial fast/default/slow 回退为 350/500/650ms，
  effects fast/default/slow 回退为 150/200/300ms。
  standard 曲线为 `[0.2, 0, 0, 1, 1, 1]`，QML 数组含终点坐标；
  对应 CSS 的四个控制点为 `cubic-bezier(0.2, 0, 0, 1)`。
- 壳层 `quickshell/Common/Theme.qml:960`：没有配置时基准为 250ms，
  shorter/short/medium/long/extraLong 为基准的 0.2/0.3/0.6/1/2，即 50/75/150/250/500ms。
  `Theme.qml:1046` 的 expressive spatial 为基准的 0.7/1/1.3，即 175/250/325ms；
  effects 为 0.3/0.4/0.6，即 75/100/150ms。不能把共用库回退值当作宿主运行值。
- 共用仓库 `DankCommon/Widgets/DankTextField.qml:133` 与 `Style.qml:355`：
  浮动标签和边框宽度采用弹簧运动，基础刚度 800、阻尼比 1；颜色使用刚度 3800。
  KIMA 当前 CSS transition 是本地适配，没有实现这些 QML 弹簧。
