# 示例：像素俄罗斯方块

按 v1 流程走一遍的 **M 档**完整示例。`v0-record/` 里保留了 v0 当时的原始记录，可以对照着看。

## 试一下

- **玩**：双击 `index.html`
- **跑测试**：双击 `test.html`，页面应显示"全部通过 12/12"。装了 Node 的话，也可以运行 `node js/core.tests.js`
- **查契约**：在仓库根目录运行 `python scripts/check_contract.py examples/tetris/docs/plans/COGNITION.md`

## 这次 v1 怎么走的

| 步骤 | 产出 |
| :--- | :--- |
| 1. 分级 | M 档：5 个代码文件，边界清楚，不需要并行，所以跳过 DISPATCH |
| 2. 规格 | [`docs/plans/COGNITION.md`](./docs/plans/COGNITION.md)：意图、38 条接口契约、6 条验收标准 |
| 3. 冻结 | 状态写在 COGNITION.md 头部（v0 单独用了一个 STATUS.md） |
| 4. 实施 | `js/core.js`（纯逻辑）、`js/main.js`（渲染和输入）、`js/core.tests.js`、`test.html` |
| 5. 验收 | [`docs/logs/ACCEPTANCE.md`](./docs/logs/ACCEPTANCE.md) |

## 文件

```
tetris/
├── index.html          页面
├── style.css           样式
├── test.html           浏览器里跑测试
├── js/
│   ├── core.js         游戏规则（不碰 DOM，可测试）
│   ├── main.js         渲染、输入、循环
│   └── core.tests.js   12 项测试
├── docs/
│   ├── plans/COGNITION.md
│   └── logs/ACCEPTANCE.md
└── v0-record/          v0 原始记录（COGNITION、STATUS、DISPATCH_PLAN、ROUTER_SUMMARY）
```

## v0 → v1 对照

| | v0 | v1 |
| :--- | :--- | :--- |
| 档位 | 按 L 档走了完整流程（实际只有 3 个文件） | M 档 |
| 规格 | 逐个写出函数签名的"像素级"文档 | 意图 + 契约表 + 验收标准 |
| 类名不一致 | 执行器各写一套，事后由路由器修 | 契约表事先写死，`check_contract.py` 会直接报错 |
| 测试 | 没有 | 12 项自动测试 + 2 项手动验收 |
| 发现的缺陷 | — | 2 个：拦截所有按键导致 F5 失效；硬降后新方块立刻掉一格 |
| 代码结构 | 单文件 `tetris.js`，逻辑和渲染混在一起 | 逻辑和外壳分离，只通过 `TetrisCore` 连接 |

v0 的代码删掉了，git 历史里还能找到（`js/tetris.js`）。
