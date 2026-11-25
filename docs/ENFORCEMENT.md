# 让红线真正生效

`AGENTS.md` 里的规则是写给模型读的，模型可能会不遵守。要让规则真正生效，得把它落到**不依赖模型自觉**的地方。下面从轻到重列出几层做法，按需选用。

> 各工具的配置语法更新很快，下面的示例只说明思路，具体写法请以你所用工具的最新文档为准。

## 1. 工具权限配置（命令放行/询问/禁止）

几乎所有 coding agent 都支持按命令设白名单和黑名单。把 `AGENTS.md` §5 原样搬进去：

- **放行**：测试、构建、lint、`git status/diff/log`
- **询问**：`git push`、安装依赖、删除文件
- **禁止**：读取 `.env` 和密钥文件、`rm -rf`、强推

以 Claude Code 的 `.claude/settings.json` 为例：

```json
{
  "permissions": {
    "allow": ["Bash(npm test:*)", "Bash(npm run build:*)", "Bash(git diff:*)", "Bash(git status)"],
    "ask":   ["Bash(git push:*)", "Bash(npm install:*)"],
    "deny":  ["Read(./.env)", "Read(./.env.*)", "Bash(rm -rf:*)"]
  }
}
```

Trae、Cursor、Codex、Kiro 等工具在设置里都有对应的命令确认或允许列表，用法类似。

## 2. 只读规划

让 `@cognition-architect` 在工具的计划模式或只读模式下运行。这样它在物理上就没法写代码，比在 Skill 里写一句"不写代码"可靠。

## 3. 子 agent 隔离

- 每个任务交给独立上下文的子 agent，只传任务卡和契约表。这样上一个角色的推理不会泄漏给下一个角色。
- 并行任务写同一个仓库时，可以给每个子 agent 开一个 `git worktree`，集成时再合并。即使"文件独占"规则被违反，冲突也会在合并时暴露出来，不会静默覆盖。

## 4. 红线检查脚本（不依赖模型）

`scripts/check_redlines.py` 根据 git 改动判断是否碰到红线：依赖清单变化、文件清单之外的新建/删除/重命名、凭据文件。

```bash
python scripts/check_redlines.py              # 对比 HEAD
python scripts/check_redlines.py --base main  # 对比 main 分支
```

接入方式：

- **交付前**：调度器在 Step 6 自动运行（已写进 dispatcher Skill）
- **pre-commit 钩子**：在 `.git/hooks/pre-commit` 里加一行 `python scripts/check_redlines.py --base HEAD || exit 1`
- **CI**：在 PR 流水线里对比目标分支运行

脚本只检查能从文件改动机械判断的部分。接口契约有没有被破坏，仍然要靠人审 diff。

## 5. 契约检查

`scripts/check_contract.py` 把 COGNITION.md 的接口契约表变成可以执行的检查：
- 表里每个名字，在定义方真的有定义，在引用方真的有使用
- 反查 HTML 与 CSS/JS 之间共用、却没登记的 ID 和类
- 反查 JS 引用了不存在的 ID、HTML 用了没人定义的类、本地文件引用断了

可以和红线检查一样，接进 pre-commit 或 CI。

## 6. 工具钩子（可选，最强）

部分工具支持在 agent 调用工具前后运行自定义脚本（例如 Claude Code 的 hooks）。可以在每次写文件后跑 `check_redlines.py`，触发红线就直接拦截。
