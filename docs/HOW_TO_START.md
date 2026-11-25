# 使用说明

## 1. 安装到你的项目

```bash
python scripts/install_skills.py <你的项目目录> --tool agents   # 通用位置 .agents/skills/
python scripts/install_skills.py <你的项目目录> --tool trae     # Trae：.trae/skills/
python scripts/install_skills.py <你的项目目录> --tool claude   # Claude Code：.claude/skills/
```

脚本会复制两个 Skill、`AGENTS.md`、`scripts/check_redlines.py` 和 `scripts/check_contract.py`。已存在的文件不会被覆盖（加 `--force` 才覆盖）。

装好后改目标项目 `AGENTS.md` 里的两节：

- **§7 项目命令**：安装、构建、测试命令
- **§8 能力档映射**：推理档和编码档分别用哪个模型。只有一个模型就两档都填它

最后按 [ENFORCEMENT.md](./ENFORCEMENT.md) 把命令策略写进工具的权限设置。

## 2. 目录约定

```
<项目>/
├── AGENTS.md
├── docs/plans/
│   ├── COGNITION.md   ← @cognition-architect 产出（M/L 档）
│   └── DISPATCH.md    ← @dispatcher 产出（仅 L 档）
└── scripts/
    ├── check_contract.py
    └── check_redlines.py
```

## 3. 三个档位怎么走

### S 档：小改动
直接说需求。agent 写明"分级：S"，简短说明后直接改，交付改动清单。

### M 档：2–5 个文件
1. `@cognition-architect 我想做 …` → 产出精简版 `COGNITION.md`
2. **你审查**：意图、接口契约、验收标准对不对。满意就让它把状态改为"已冻结"
3. "按 COGNITION.md 实施" → agent 实施并跑验收
4. **你审查**：验收结果 + diff

### L 档：多模块、并行
1. 同 M 档第 1–2 步，产出完整版 `COGNITION.md` 并冻结
2. `@dispatcher` → 产出 `DISPATCH.md`：任务表、文件独占、批次、验收
3. **你审批**任务表（30 秒能扫完）
4. 调度器把任务派给子 agent 并行执行，逐个跑验收并集成
5. **你审查**：汇总的验收结果 + diff

## 4. 审查时看什么

**审 COGNITION.md（最重要的一道关）**
- 意图和非目标写清楚了吗？
- 接口契约表里，是否所有被多个文件共用的名字都列出来了？
- 每条验收标准都能用命令或可观察的结果判定吗？
- 风险档（高/中/低）定得合理吗？

**审 DISPATCH.md（仅 L 档）**
- 并行任务之间有没有共用文件？
- 依赖顺序对吗？

**审结果**
- 验收全部通过了吗？`check_contract.py` 和 `check_redlines.py` 都干净吗？
- diff 里有没有规格之外的改动？

## 5. 出错时

不需要你手动搬运报错。错误按下面的路径逐级升级：

| 层级 | 情况 | 处理 |
| :---: | :--- | :--- |
| ① | 单文件错误 | 执行者在重试预算内（默认 3 轮）自己修 |
| ② | 跨文件、契约不一致 | 调度器修 |
| ③ | 预算用完仍失败 | 用最小上下文（堆栈 + diff + 规格对应章节）升级到推理档模型 |
| ④ | 触及红线、规格有错 | 停下来问你 |

## 6. 调试阶段

```
@dispatcher debug     # 进入快速通道：绿区直接批量修，碰红线自动停
…修 bug…
@dispatcher sync      # 把调试期间的接口变化写回 COGNITION.md，等你重新冻结
```

## 7. 常见问题

**Q：每一步都要审，会不会很慢？**
真正要动脑子的只有冻结 COGNITION.md 这一次。S 档没有关口；执行期间 agent 自己循环修错，你只在最后看结果。

**Q：只有一个模型能用吗？**
能。§8 的两档都填同一个模型即可。隔离靠的是子 agent 各自独立的上下文，不是靠不同的模型。

**Q：工具不支持子 agent 怎么办？**
用新会话执行每个任务（只给任务卡和契约表），或者用 `git worktree` 隔离，效果相近。

**Q：规格冻结后需求变了怎么办？**
`@cognition-architect 需求有变：…`。它会更新相关章节，追加修订记录，把状态改回草稿，等你重新冻结。

**Q：和直接用 Kiro 或 spec-kit 有什么区别？**
思路相同。如果你已经在用它们，可以只借用本项目的接口契约、文件独占、红线检查这几样，配合它们的规格流程。
