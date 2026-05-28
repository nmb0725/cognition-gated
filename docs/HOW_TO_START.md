# 新项目启动包 — 个人 AI 开发工作流

## 你需要拷贝到新项目的文件

从本项目复制以下文件/目录到新项目的根目录：

```
<新项目根目录>/
├── .ai_rules                          # 权限守则
└── .trae/
    └── skills/
        ├── cognition-architect/
        │   └── SKILL.md               # 云端架构师
        └── local-router/
            └── SKILL.md               # 本地路由器
```

**共 3 个文件**。拷过去即可，无需修改。

---

## 新项目的目录结构标准

项目运行过程中会自动创建的目录：

```
<新项目根目录>/
├── docs/
│   ├── plans/
│   │   └── COGNITION.md      ← @cognition-architect 产出
│   └── dispatch/
│       └── DISPATCH.md       ← @local-router 产出
└── src/                       ← 你的生产代码
```

---

## 完整工作流程

### 第 1 步：提出需求

告诉 SOLO 你想要什么。例如：

> @cognition-architect 我想做一个离线可用的 Markdown 编辑器，支持实时预览、语法高亮、导出 HTML。

### 第 2 步：审查 COGNITION.md

`@cognition-architect` 会产出 `docs/plans/COGNITION.md`，包含：
- 技术选型
- 模块拆分与文件清单
- 核心数据结构与接口定义
- 交互流程
- 实施顺序
- 风险与注意事项

**你做的事**：读一遍，确认方案合理。有问题让 Skill 改，直到满意。

### 第 3 步：冻结，调用路由器

确认 COGNITION.md 没问题后，告诉路由器：

> @local-router COGNITION.md 已审查冻结，请按计划拆解调度。

路由器会产出 `docs/dispatch/DISPATCH.md`，包含：
- 环境快照（本地目录、可用模型）
- 跨文件接口约定（命名统一表）
- 任务清单（每个任务指派了执行模型和错误上报路径）
- 风险备注

### 第 4 步：审查 DISPATCH.md

**你做的事**：扫一眼调度表，确认：
- 任务拆解是否合理
- 执行模型指派是否正确
- 接口约定有没有遗漏
- 有误就反馈修改，无误就批准执行

### 第 5 步：执行

批准后，由执行器按 DISPATCH.md 逐个完成任务。

### 第 6 步：错误处理

执行中出错时，按预定的错误上报路径逐级处理：

| 层级 | 谁处理 | 典型错误 | 怎么做 |
| :---: | :--- | :--- | :--- |
| ① | 执行器自愈 | 语法错误 | 直接重试 1 次 |
| ② | 路由器修复 | 接口命名冲突 | 路由器跨文件协调修复 |
| ③ | 云端查询 | 逻辑偏差/推理不足 | 通过增量 Debug 协议提纯上报 |
| ④ | 你终审 | 架构/安全问题 | 看完方案后批准或否决 |

---

## 不同阶段如何调用 Skill

### 初始化新项目时

```markdown
@cognition-architect 我想做一个 ...
```

### 审查 COGNITION.md 后

```markdown
@local-router COGNITION.md 已冻结，位于 docs/plans/COGNITION.md
```

### 需要修正时

```markdown
@local-router DISPATCH.md 第 T-003 的执行模型指派不对，
这个任务需要跨文件理解，应该由路由器自留而不是交给 Coder。
```

### 需要阶段变更时

```markdown
@cognition-architect 需求有变，在已有 COGNITION.md 基础上增加以下功能：...
```

---

## 进阶用法

### 跳过路由器，直接由云端执行

适合简单、不涉及本地环境的任务，直接让云端按 COGNITION.md 实施：

> COGNITION.md 已冻结。请直接按规划实施，严格遵循文档中的接口定义和文件清单。

### 只产规划不执行

适合需要先看方案再决定做不做的探索性需求：

> @cognition-architect 只出 COGNITION.md，不需要执行。

### 复用现有 COGNITION.md

需求相似时，可以基于已有的 COGNITION.md 修改，而不是从零开始：

> @cognition-architect 参考现有的 docs/plans/COGNITION.md，为 [新项目] 调整方案。