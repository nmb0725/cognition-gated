# Cognition-Gated Development

**认知门控开发工作流**：一套以**开发者主权**为核心的 AI 辅助开发流程。AI 可以写大部分代码，但架构、接口和"什么算做完"始终由你决定，并且你看得懂。

```
[需求] → 分级 S / M / L
   S ──→ 直接改 ──────────────────────────────→ [验收 + diff 审查]
   M ──→ COGNITION.md ─→ 人审冻结 ─→ 实施 ────→ [验收 + diff 审查]
   L ──→ COGNITION.md ─→ 人审冻结 ─→ DISPATCH.md ─→ 人审
            ─→ 子 agent 并行（文件独占 + 共享契约）─→ [验收 + diff 审查]
```

## 核心理念

AI 改代码越快，开发者越容易失去对项目的理解。这套流程只在**真正决定方向的地方**设人工关口：

1. **规格冻结**：意图、接口契约、验收标准由你拍板。
2. **结果审查**：你看验收结果和 diff，而不是逐行盯着 AI 写。

中间的执行、重试和自愈交给 agent。红线（改结构、改接口、加依赖、碰数据和生产环境）一旦触发，agent 必须停下。

## 与 Spec-Driven Development 的关系

本项目和 AWS Kiro、GitHub spec-kit 同属"规格驱动开发（SDD）"家族。与通用 SDD 相比，多了这几点：

- **可执行的接口契约 + 文件独占**：开工前先把所有共享的名字（DOM ID、类名、导出、路径）写进契约表，`check_contract.py` 会照表核对代码，并反查表外的共用名字；并行任务各自独占文件。"HTML 和 CSS 对不上"这类集成翻车，会被直接挡在验收这一步。
- **规模分级**：S 档没有任何仪式，只有 L 档才走完整流程。
- **红线 / 绿区**：调试阶段绿区改动可以直接批量修，碰到红线自动停下。
- **双向同步**：调试结束后用 `@dispatcher sync` 把代码的实际变化写回规格，避免文档和代码脱节。

## 快速开始

```bash
# 把规则和 Skill 装到你的项目里（Trae 用户加 --tool trae）
python scripts/install_skills.py <你的项目目录> --tool agents
```

然后修改目标项目里 `AGENTS.md` 的 §7 项目命令和 §8 能力档映射，接着：

```
@cognition-architect 我想做一个 ...
```

| 文件 | 作用 |
| :--- | :--- |
| `AGENTS.md` | 分级、红线、绿区、验收、命令策略。几乎所有 coding agent 都会自动读取 |
| `.agents/skills/cognition-architect/` | 把需求变成可审查、可验收的规格 `COGNITION.md` |
| `.agents/skills/dispatcher/` | L 档拆分派发、调试快速通道、sync |
| `scripts/check_contract.py` | 用 COGNITION.md 的契约表核对代码，并反查未登记的共用名字 |
| `scripts/check_redlines.py` | 根据 git 改动检查红线，不依赖模型自觉 |

Skill 采用开放的 SKILL.md 格式，不绑定特定工具或模型。具体用哪个模型，在 `AGENTS.md` §8 里按能力档配置。

## 了解更多

- [docs/HOW_TO_START.md](./docs/HOW_TO_START.md)：完整使用说明和常见问题
- [docs/ENFORCEMENT.md](./docs/ENFORCEMENT.md)：怎样让红线真正生效（权限配置、子 agent 隔离、钩子）
- [examples/tetris/](./examples/tetris/)：按 v1 M 档完整走一遍的示例（附 v0 原始记录对照）
- [CHANGELOG.md](./CHANGELOG.md)：版本变化
- [docs/history/](./docs/history/)：早期架构日志和 v0.2 提案（历史记录）

## License

MIT
