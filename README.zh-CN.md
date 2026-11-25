# Cognition-Gated Development

[English](./README.md) · v1.0 · MIT

**让 AI 写代码，但项目始终是你的。**

一套可以直接拷进任何仓库的 AI 编程约束：用一份规格定下"做什么、接口叫什么、怎样算做完"，由脚本核对代码是否遵守，人只在两个地方拍板：**冻结规格**和**审查结果**。

## 为什么需要它

用 AI agent 写几轮代码之后，常见的情况是：
- 代码能跑，但你已经说不清它的结构；
- 几个文件各自取名，HTML 和 CSS、前端和后端对不上；
- 文档写了一份，代码改成另一样；
- "别动目录结构""别加依赖"这类要求，只是写在提示词里，模型未必照做。

这个项目不靠模型自觉，而是把关键约束变成**看得见的规格**和**跑得动的检查**。

## 它包含什么

| 组成 | 作用 |
| :--- | :--- |
| `AGENTS.md` | 给 agent 的规则：先分 S/M/L 档、哪些是红线必须停、哪些是绿区可以直接改、按风险决定测试量。大多数 coding agent 会自动读取 |
| `@cognition-architect` | 把需求写成规格 `COGNITION.md`：意图、**接口契约表**、可执行的验收标准 |
| `@dispatcher` | 大任务拆给多个子 agent 并行，每个任务独占自己的文件；也负责调试快速通道和"代码改了就同步回规格" |
| `check_contract.py` | 拿契约表核对代码，并反查没登记的共用名字、悬空的 ID/类引用、断掉的文件引用 |
| `check_redlines.py` | 根据 git 改动检查是否加了依赖、改了文件结构、碰了凭据文件 |

两个 Skill 是开放的 SKILL.md 格式，不绑定 Trae、Claude Code 或某个模型；具体用什么模型，在 `AGENTS.md` 里按"推理档 / 编码档"配置。

## 流程

先分级，流程的轻重跟着改动大小走：

```
[需求] → 分级 S / M / L
   S ──→ 直接改 ──────────────────────────────→ [验收 + diff 审查]
   M ──→ COGNITION.md ─→ 人审冻结 ─→ 实施 ────→ [验收 + diff 审查]
   L ──→ COGNITION.md ─→ 人审冻结 ─→ DISPATCH.md ─→ 人审
            ─→ 子 agent 并行（文件独占 + 共享契约）─→ [验收 + diff 审查]
```

执行、重试、自愈都交给 agent。一旦触碰红线（改结构、改公共接口、加依赖、碰数据或生产环境），agent 必须停下来交回给你。

## 实际效果：tetris 示例

[examples/tetris/](./examples/tetris/) 按 M 档完整走了一遍：

- 规格里有 38 条接口契约、6 条验收标准；
- 契约检查通过 84 项核对，12 项自动测试全部通过，另有 2 项人工验收；
- 顺带发现并修复了旧版本的 2 个缺陷（拦截所有按键导致 F5 失效、硬降后新方块立刻掉一格）；
- 旧版本当时"HTML 和 CSS 类名各写一套"的问题，现在会被 `check_contract.py` 直接报出来。

旧版本的原始记录保留在 `examples/tetris/v0-record/`，可以对照着看。

## 快速开始

```bash
# 把规则、Skill 和检查脚本装进你的项目（Trae 用 --tool trae，Claude Code 用 --tool claude）
python scripts/install_skills.py <你的项目目录> --tool agents
```

改一下目标项目 `AGENTS.md` 里的 §7 项目命令和 §8 能力档映射，然后：

```
@cognition-architect 我想做一个 ...
```

## 和 Spec-Driven Development 的关系

它和 AWS Kiro、GitHub spec-kit 属于同一个思路：规格先行。如果你已经在用它们，也可以只借用这里的几样东西：**可执行的接口契约**、**文件独占的并行拆分**、**红线检查**和**规格反向同步**。

## 了解更多

- [docs/HOW_TO_START.md](./docs/HOW_TO_START.md)：完整使用说明和常见问题
- [docs/ENFORCEMENT.md](./docs/ENFORCEMENT.md)：怎样让红线真正生效（工具权限、子 agent 隔离、钩子）
- [CHANGELOG.md](./CHANGELOG.md)：版本变化
- [docs/history/](./docs/history/)：早期架构日志和 v0.2 提案（历史记录）

## License

MIT
