# Changelog

## v1.0 — 2026-11-25

基于 2026 年下半年的工具生态重写。核心理念（开发者主权、跨文件接口契约、规模分级）不变，实现方式现代化。

### 变更
- **`.ai_rules` → `AGENTS.md`**：改用跨工具通用的规则文件。旧的 JSON 权限声明没有任何工具会执行，改为写明分级、红线、绿区、验收和命令策略，并在 `docs/ENFORCEMENT.md` 说明怎样落到工具权限配置里。
- **Skill 目录 `.trae/skills/` → `.agents/skills/`**：SKILL.md 本身是开放格式，不再绑定 Trae。用 `scripts/install_skills.py` 安装到任意工具。
- **`local-router` 更名为 `dispatcher`**：不再假设有本地路由模型。角色隔离改为用独立上下文的子 agent，而不是让同一个对话切换角色。
- **去掉写死的模型和硬件**：Skill 里只写能力档（推理档/编码档/工具档），具体模型在 `AGENTS.md` §8 里按项目配置。
- **规格从"像素级实现文档"改为"意图 + 接口契约 + 可执行验收标准"**：实现细节交给代码和 diff，减少文档和代码脱节。
- **审查重心后移**：主要审查点变为验收结果 + diff；只有 L 档保留执行前的 DISPATCH 审批。
- **测试按风险定量**：高风险要复现测试 + 回归，中风险一条证明命令，低风险不测。
- **错误处理**：自愈从"重试 1 次"改为"预算内循环（默认 3 轮）"；升级时由 agent 自动组装最小上下文，并直接写入修复，不再人工粘贴三件套和手工拼补丁。
- **命令执行**：从"任何 bash 都要人确认"改为"只读/构建/测试放行，删除、推送、装依赖、碰生产时询问"。
- **合并 v0.2 提案**：红线/绿区、调试快速通道（`@dispatcher debug`）、批量审查、反向同步（`@dispatcher sync`）已写入 `AGENTS.md` 和 dispatcher Skill。
- **新增 `scripts/check_redlines.py`**：根据 git 改动检查依赖变化、文件清单之外的结构变化、凭据文件，不依赖模型自觉。
- **新增 DISPATCH 规则：文件独占**：并行任务之间不能共用可写文件。
- **新增 `scripts/check_contract.py`**：按 COGNITION.md 的契约表核对代码，并反查未登记的共用名字、悬空的 ID/类引用、断掉的本地文件引用。契约从"写给模型看的约定"变成可执行的验收。
- **tetris 示例按 v1 M 档重做**：拆出纯逻辑的 `js/core.js`，加 12 项测试（`test.html`）；修复 v0 的两个缺陷（拦截所有按键导致 F5 失效、硬降后新方块继承下落计时）；v0 文档移到 `examples/tetris/v0-record/`。

### 修正的不一致
- 统一文件名：`COGNITION.md` 和 `DISPATCH.md` 都放在 `docs/plans/`（旧文档里混用了 `STATUS.md`、`DISPATCH_PLAN.md`、`docs/dispatch/`）。
- 版本号统一（旧提案文件名写 v0.2，正文写 v1.0→v2.0）。
- 删除根目录的空目录 `js/`、`docs/logs/`、`docs/plans/`，`.screenshots/` 加入 `.gitignore`。
- 原探索日志和 v0.2 提案移到 `docs/history/`，标注为历史记录。
- `个人AI辅助开发工作流-完整说明.md` 内嵌了一份已过时的 Skill 副本，删除后由 `docs/HOW_TO_START.md` 替代。
- tetris 示例原来按 L 档流程运行，但按分级规则它属于 M 档；已按 M 档重做。

## v0 — 2026-05

初版：云端架构师 + 本地 Qwen 路由器/执行器的串行文档状态机。见 `docs/history/`。
