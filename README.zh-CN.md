<h1 align="center">P I X E L</h1>

<p align="right">中文 · <a href="README.md">English</a></p>

<p align="center">
  <strong>纸上像素 · 专注写作</strong><br>
  一款为长文写作与知识工作打造的鲜明 Obsidian 主题
</p>

<p align="center">
  <img src="src/assets/screenshots/pixel-status-rail.svg" width="352" alt="Pixel 语义色像素轨">
</p>

<p align="center">
  <kbd><!-- pixel-version:start -->0.9.8<!-- pixel-version:end --></kbd>
  <kbd>OBSIDIAN 1.12+</kbd>
  <kbd>LIGHT / DARK</kbd>
  <kbd>DESKTOP / iOS</kbd>
</p>

<p align="center">
  <a href="#pixel-boy">Pixel Boy</a> ·
  <a href="#近期更新">近期更新</a> ·
  <a href="#特色地图">特色地图</a> ·
  <a href="#图库">图库</a> ·
  <a href="#安装">安装</a> ·
  <a href="#开发">开发</a>
</p>

<p align="center">
  <img src="src/assets/screenshots/pixel-store-preview.png" alt="Pixel 主题预览，展示桌面浅色、桌面深色与 iOS 界面" width="100%">
</p>

<p align="center"><sub>桌面 Light / Dark 与 iOS · 使用真实 Obsidian 界面合成</sub></p>

Pixel 为 Obsidian 带来安静的纸张工作区、清晰的像素身份，以及用于导航和焦点的明确信号系统。它不是一层复古滤镜：正文始终适合长时间阅读，原生交互保持不变，个性只集中在真正帮助辨认方向的位置。

桌面端与 iOS 是 Pixel 的优先适配平台。Markdown、属性、导航、Bases、Canvas、Graph、PDF，以及让工作区保持连贯的细小状态，都拥有为平台单独调整的布局。

## 近期更新

`0.9.3`–`0.9.8` 这一轮更新让 Pixel 从广泛覆盖 Obsidian 界面，逐步深入到交互细节与社区插件适配：

| 版本 | 主要变化 |
| --- | --- |
| [`0.9.8`](docs/releases/0.9.8.md) | 优化 Markdown 图片、任务反馈与代码块身份，并改善 Templater 提示框和文档阅读体验。 |
| [`0.9.7`](docs/releases/0.9.7.md) | 用紧凑的青色像素游标替代厚重的文件树右键目标框，并修复 Project Manager 新增操作的对比度与状态反馈。 |
| [`0.9.6`](docs/releases/0.9.6.md) | 将 Project Manager 任务标签、长文本截断和删除操作统一到 Pixel 的紧凑胶囊体系。 |
| [`0.9.5`](docs/releases/0.9.5.md) | 固定 Project Manager 设置操作栏、统一自定义字段控件，并新增 Project Manager Insights 专项视觉适配。 |
| [`0.9.4`](docs/releases/0.9.4.md) | 重做任务编辑器与负责人展示，优化长标题布局，并收敛破坏性操作的视觉反馈。 |
| [`0.9.3`](docs/releases/0.9.3.md) | 引入 Pixel Boy、Claudian 专项适配，以及更统一的设置、搜索、标签与状态信息体系。 |

## Pixel Boy

### 新标签页，也该有一个去处

空白标签页会变成一台掌上游戏机。Obsidian 原生的**新建**、**打开**和**关闭**操作仍可在点阵屏幕中直接使用，十字键、A/B 键、电源灯与扬声器则共同补全掌机外观。

<table>
  <tr>
    <td align="center"><strong>LIGHT · PAPER SHELL</strong></td>
    <td align="center"><strong>DARK · OBSIDIAN SHELL</strong></td>
  </tr>
  <tr>
    <td><img src="src/assets/screenshots/pixel-new-tab-light.png" alt="Pixel Boy 浅色模式新标签页"></td>
    <td><img src="src/assets/screenshots/pixel-new-tab-dark.png" alt="Pixel Boy 深色模式新标签页"></td>
  </tr>
</table>

<p align="center">
  <sub>原生操作 · 响应式几何 · Light / Dark 配色 · 无障碍回退模式</sub>
</p>

掌机会在窄面板中自动收缩，但装饰不会变成交互层。键盘快捷键、点击目标、强制颜色和减少动态效果偏好仍由 Obsidian 原生机制负责。

## 特色地图

<table>
  <tr>
    <td width="50%" valign="top">
      <strong>纸张优先写作</strong><br><br>
      安静的表面层级、适合阅读的正文字体栈和默认 <code>72ch</code> 行宽，让长篇 Markdown 保持宽松，同时不牺牲界面个性。
    </td>
    <td width="50%" valign="top">
      <strong>信号驱动导航</strong><br><br>
      青色指示当前路径与键盘焦点，琥珀色承载上下文，砖红色表示警告或危险。状态会通过几何共同表达，而不只依赖颜色。
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <strong>知识工作界面</strong><br><br>
      属性、Bases、Canvas、Graph、PDF、嵌入、表格、代码、标签与任务共享同一套视觉语法，同时保留各自的原生行为。
    </td>
    <td width="50%" valign="top">
      <strong>随身界面</strong><br><br>
      iOS 导航、抽屉、属性、安全区域和触控目标均针对设备重新平衡，而不是把桌面布局简单缩小。
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <strong>社区插件专项适配</strong><br><br>
      Claudian、Project Manager 与 Project Manager Insights 拥有专门的 Pixel 视觉处理。所有适配均限定在插件自身界面，并保留原生控件与键盘行为。
    </td>
    <td width="50%" valign="top">
      <strong>原生交互契约</strong><br><br>
      Pixel 不替换 Obsidian 的编辑、折叠、滚动、手势、抽屉、图标或媒体控制。熟悉的操作仍保持熟悉。
    </td>
  </tr>
</table>

## 图库

### 桌面端 · 一张连续的工作平面

导航位于左侧，笔记保留中央位置，上下文停靠在右侧。紧凑状态舱会跟随右侧栏的实际宽度，让整个工作区更像一台经过设计的控制台，而不是层层堆叠的面板。

<details>
<summary><strong>展开查看 Light 与 Dark 完整对照</strong></summary>

<br>

<table>
  <tr>
    <td align="center"><strong>LIGHT</strong></td>
    <td align="center"><strong>DARK</strong></td>
  </tr>
  <tr>
    <td><img src="src/assets/screenshots/pixel-desktop-light.png" alt="Pixel 桌面端浅色主题"></td>
    <td><img src="src/assets/screenshots/pixel-desktop-dark.png" alt="Pixel 桌面端深色主题"></td>
  </tr>
</table>

</details>

## 视觉语言

<p align="center">
  <img src="src/assets/screenshots/pixel-status-rail.svg" width="352" alt="Paper、Canvas、Cyan、Amber 与 Brick 语义颜色">
</p>

| 角色 | 传达的信息 |
| --- | --- |
| **Paper** | 笔记、菜单、设置卡片和主要阅读表面。 |
| **Canvas** | 内容周围的冷灰工作区与次要区域。 |
| **Cyan** | 当前导航、链接、光标、控件和键盘焦点。 |
| **Amber** | 属性、附加上下文、强调和注意信息。 |
| **Brick** | 错误、警告、破坏性操作和 Pixel Boy 控制键。 |
| **4 / 6 / 10px 圆角** | 小尺寸保持像素结构，大尺寸提供舒适的触控几何。 |

Light 与 Dark 使用分别调校的语义颜色，而不是简单反相。正文、次要文字、焦点指示和有意义的控件边界均以可访问对比度为基线。

## 覆盖的 Obsidian 界面

<details>
<summary><strong>Markdown 写作</strong></summary>

- Source、Live Preview 与 Reading 三种模式保持一致的标题节奏。
- 支持链接、强调、列表、引用、任务、连续标签胶囊、高亮、脚注、数学公式和注释。
- 代码、表格、嵌入内容和媒体在需要时局部滚动，不挤压整篇笔记。
- 选区、光标、当前行、折叠和缩进状态保持清晰可见。

</details>

<details>
<summary><strong>知识管理</strong></summary>

- 文件导航、标签、搜索、书签、大纲、反向链接和出链。
- 笔记属性与属性建议，包括 iOS 编辑状态。
- Global Graph 与 Local Graph 的控制和语义状态。
- Canvas 卡片、分组、媒体、连线、选择和编辑。
- Bases 表格、列表、卡片、筛选、排序和属性编辑。
- PDF 工具栏、侧栏、缩略图、搜索与选区，同时保留文档页面原始显示。

</details>

<details>
<summary><strong>设置与可访问性</strong></summary>

- 独立设置卡片、稳定的悬停与焦点反馈、紧凑原生控件，以及圆形主题色选择器。
- 普通文本目标对比度不低于 `4.5:1`；有意义的图标与控件边界目标不低于 `3:1`。
- 键盘焦点同时使用轮廓、表面和位置提示，不只依赖颜色。
- 支持减少动态效果、强制颜色和增强对比度偏好。
- 用户设置的字体、字号、强调色、选区和光标颜色保持权威。

</details>

<details>
<summary><strong>社区插件适配</strong></summary>

- **Claudian**：对话、输入区、上下文标签、会话、菜单与设置标签，包括窄面板和键盘状态。
- **Project Manager**：任务编辑、项目设置、自定义字段、负责人、标签、长标题与操作反馈。
- **Project Manager Insights**：只读工作量视图中的筛选、指标、负责人汇总和任务明细。
- **Templater**：使用轻量发丝边框和无障碍聚焦回退的紧凑提示输入框。

</details>

## 安装

Pixel 已上架 Obsidian 社区主题目录：

1. 打开 Obsidian「设置 → 外观」。
2. 在主题区域选择「管理」。
3. 搜索 **Pixel**，安装并选择使用。

后续已发布版本会由 Obsidian 内置主题更新器从匹配的 GitHub Release 获取。

### 手动安装

1. 从[最新 GitHub Release](https://github.com/CoffeeCheese/obsidian-pixel-theme/releases/latest) 下载 `manifest.json` 和 `theme.css`。
2. 在目标 Vault 中创建 `.obsidian/themes/Pixel/`。
3. 将两个文件放入该目录。
4. 如有需要，重新启动 Obsidian，然后在外观设置中选择 **Pixel**。

如需稳定的手动安装，请使用带版本标签的 Release 资产；`main` 分支文件可能包含为下一版本准备的开发中改动。

在 iOS 上使用同步 Vault 时，请先等待 `.obsidian/themes/Pixel/` 完成同步，再重新启动 Obsidian。

## 个性化

Pixel 尊重 Obsidian 自身的外观设置，不需要配套插件：

- Light 或 Dark 模式
- 正文字体与界面字体
- 基础字号
- 主题强调色

Pixel 当前不提供自定义 **Style Settings** 选项。Style Settings 插件为可选项，安装、使用和调整主题均不依赖它。

主题内置 Fusion Pixel 作为身份标题字体。代码和技术状态使用 Obsidian 配置的等宽字体与系统回退；正文则使用用户的正文字体，并由操作系统补全罕见字符。

专项支持的社区插件列在[覆盖的 Obsidian 界面](#覆盖的-obsidian-界面)中。其他使用 Obsidian 官方变量和 Setting 组件的插件通常可以自然继承主题，但除非在该章节明确列出，否则不构成逐个社区插件的兼容承诺。

## 兼容性

| 项目 | 当前信息 |
| --- | --- |
| 当前版本 | <code><!-- pixel-version:start -->0.9.8<!-- pixel-version:end --></code> |
| Obsidian 要求 | `1.12.0` 或更高版本 |
| 优先适配平台 | 桌面端 / iOS |
| 已验证桌面环境 | Obsidian `1.13.4` / macOS |
| 外观模式 | Light / Dark |
| 分发方式 | Obsidian 社区主题目录 / GitHub Releases |
| 安装文件 | `manifest.json`、`theme.css` |
| 主题许可 | MIT |
| 内置字体许可 | SIL Open Font License 1.1 |

## 开发

Pixel 需要 Node.js 24 与 npm：

```sh
npm ci
npm run build
npm test
npm run check
```

- `npm run build`：编译 `theme.css`，并在配置后部署到专用开发 Vault。
- `npm run dev`：监听 Sass 源文件。
- `npm test`：运行主题结构、兼容性和发布契约测试。
- `npm run check`：确认生成文件与源码一致，不修改文件。

`src/scss/index.scss` 是唯一 Sass 入口。请修改 `src/` 下的源模块，不要直接编辑生成的 `theme.css`。

如需安全部署，将 `OBSIDIAN_THEME_DIR` 指向专用 `dev-test` Vault 的 Pixel 主题目录后再执行构建。构建脚本会拒绝相对路径、符号链接、错误 Vault 和越界目标。

## 发布

- `manifest.json` 是当前版本的权威来源。
- `versions.json` 永久记录每个已发布主题版本对应的最低 Obsidian 版本。
- 只有不带前缀的 `x.y.z` 注释标签会触发发布 CI。
- 通过验证的 Release 只发布 `theme.css` 与 `manifest.json`，并附带 GitHub 构建来源证明。
- 已公开的标签、Release 和资产不可覆盖；回归问题通过新的 PATCH 版本向前修复。

完整流程见 [Pixel 发布与 Obsidian 更新手册](docs/RELEASING.md)。

## 反馈

请通过 [GitHub Issues](https://github.com/CoffeeCheese/obsidian-pixel-theme/issues) 提交公开反馈，并尽量包含 Pixel 与 Obsidian 版本、操作系统、Light 或 Dark 模式、复现步骤、截图，以及启用的 CSS snippets 或社区插件。

## 许可

Pixel 使用 [MIT License](LICENSE) 发布。内置 Fusion Pixel 字体继续遵循 SIL Open Font License 1.1；完整来源、校验信息和许可证位于 [`src/assets/fonts/`](src/assets/fonts/)。

---

[Read the complete English documentation](README.md).
