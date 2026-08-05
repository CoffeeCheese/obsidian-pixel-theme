# 03 — 交付临时 H5 评审台

**要构建什么（What to build）：** 将一次运行器会话转化为临时、由 rubric 驱动的评审台，使视觉负责人能够检查精确制品的全部十个视图并定位问题，同时不存储验证图片，也不把判断交给评分算法。

**阻塞于（Blocked by）：** 02 — 交付可恢复的 H5 视觉运行器。

**状态（Status）：** completed

- [x] 评审台展示精确的构建和环境身份，并按拓扑及 canonical/narrow 状态组织全部十个视图。
- [x] 评审者可使用并排查看、同步缩放、overlay 和差异定位作为诊断辅助。
- [x] 评审台不计算或显示接受百分比、像素差异阈值、感知相似度评分或快照相等结果。
- [x] 六个视觉 gate 中的每一个都只接受 `Pass`、`Revise` 或 `Fail`，并可记录关联具体夹具和区域的局部发现。
- [x] H5 Identity 作为独立的整体判断呈现，不能从六项局部门结果推导。
- [x] 自动化身份和实施者身份不能冒充视觉负责人或标记人工决策。
- [x] 截图、overlay、差异图片和评审页面保持为操作系统临时产物，在正常完成后不留在仓库中。
- [x] 失败或取消时保留可行动的文本诊断，同时仍默认恢复工作区并清理图片。

## Completion evidence

- `npm run visual:h5` 在本次 runner-owned OS 临时目录中生成并打开自包含 `review.html`，人工确认结束后恢复原工作区并删除页面与图片；`--keep-temp` 仍只用于本地诊断。
- 评审台绑定精确 CSS/manifest hash、commit/dirty 状态、fixture/rubric 版本、Obsidian/平台/缩放、专用 Vault/profile 与捕获时间，并按 canonical/narrow、single/split topology 展示默认十视图。
- 双视口支持并排同步缩放/平移、可调 overlay 与不含数值评分的 browser difference blend；页面不实现百分比、阈值、感知分数或快照相等判断。
- 六个 gate 仅提供 `Pass`、`Revise`、`Fail`，支持追加 fixture/region 局部发现，`Revise`/`Fail` 缺少完整定位时拒绝复制文本草稿；H5 Identity 以独立 holistic veto 仅提供 `Approved`、`Rejected`，不从局部 gate 推导。
- 所有人工决策默认禁用，只有填写具名视觉负责人并显式声明授权后解锁；自动化标签、通用 implementer 占位和页面显示的 source author 均被拒绝作为 owner 姓名，且这些只读身份不能标记人工判断。
- focused fixture/theme rerun 明确为 diagnostic-only，完全不渲染 gate、owner、H5 Identity 或草稿控件；只有精确十视图矩阵提供人工决策路径。
- runner 错误包含失败阶段、当前 fixture（如适用）以及工作区恢复/临时制品清理结果；取消评审同样默认恢复和清理。
- 定向 Node 契约测试覆盖评审页面、会话交接、精确 provenance、runner 生命周期及取消诊断；真实浏览器验收覆盖页面布局、隐藏状态、difference canvas 与人工权限解锁。
