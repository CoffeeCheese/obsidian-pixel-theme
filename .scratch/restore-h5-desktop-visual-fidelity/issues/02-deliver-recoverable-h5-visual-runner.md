# 02 — 交付可恢复的 H5 视觉运行器

**要构建什么（What to build）：** 为评审者提供一个引导式命令，用于安全安装精确的 Pixel 包、建立并核验原生 Obsidian 夹具、捕获临时证据，并在成功或失败后恢复评审工作区。

**阻塞于（Blocked by）：** 01 — 建立 H5 安装包契约与夹具目录。

**状态（Status）：** completed

- [x] `npm run visual:h5` 在更改工作区状态前，预检专用夹具 Vault/profile、所需 Obsidian 版本、Pixel 激活状态、桌面状态、默认缩放、安装包 hash、夹具内容和所需自动化能力。
- [x] 运行器快照保存现有工作区，创建操作系统临时运行目录，并在成功、失败和中断时恢复原始工作区。
- [x] 每个请求场景都从夹具目录建立，并在证据可用前核验其原生拓扑；任何不匹配都必须致命失败。
- [x] 运行器只捕获临时证据，并默认在评审生命周期结束后删除临时产物。
- [x] 夹具和主题过滤器支持聚焦重跑；显式的临时保留选项支持本地诊断，但不能形成更弱的批准路径。
- [x] 运行器契约通过注入的 adapter 覆盖预检拒绝、adapter 失败、临时目录所有权、拓扑核验、恢复和清理，普通测试无需启动桌面进程。
- [x] 主题安装包仍为纯 CSS；评审自动化不作为生产主题行为交付。

## Completion evidence

- 实现提交：`320d24b feat(h5): add recoverable visual runner`、`1aaf36c fix(h5): close visual runner review gaps`、`3b8457d refactor(h5): centralize path containment checks`。
- 单一入口：`npm run visual:h5`；支持 `--case`、`--theme`、`--keep-temp` 和注入式 `--adapter`。
- 默认 adapter 使用 Obsidian 1.12 CLI developer commands，在工作区变更前完成 fail-closed 预检；运行期间安全替换并 hash 核验精确包，结束时恢复原包和工作区。
- 夹具内容由 `h5/fixture-content.v1.json` 的 SHA-256 固定；narrow 长双语内容、side-by-side 方向与 create/switch/close/reorder/split/merge 中间状态均从运行时观察后才允许捕获。
- 生命周期测试覆盖预检拒绝、精确包安装失败、adapter 失败、中断、拓扑不匹配、transition 假报告、临时目录所有权、恢复、清理、过滤和临时保留；普通测试不启动 Obsidian。
- 最终验证：`npm run build`、122/122 tests、`npm run check` 与 `git diff --check` 全部通过。
- `code-review` Standards 与 Spec 双轴复审的全部发现均已处理；主题产品接口仍只有 `theme.css` 与 `manifest.json`，未提交截图或评审临时产物。
