# COGNITION: 像素俄罗斯方块（v1 示例）

状态：已冻结（2026-11-25）
分级：M，理由：一个页面、5 个代码文件（1 个修改、3 个新建、1 个删除），接口边界清楚，没有外部依赖，不需要并行子 agent，所以跳过 DISPATCH。

> 示例说明：这一份是在已有 v0 代码的基础上重构，规格和实现在同一次会话里完成。实际使用时，应该先冻结规格，再开始实施。

## 1. 意图

- 一个纯前端、离线可玩的俄罗斯方块，双击 `index.html` 就能玩
- 相对 v0 的改动：
  - 把游戏规则拆成不碰 DOM 的 `js/core.js`，让核心逻辑可以自动测试
  - 修复两个 v0 缺陷：
    - 键盘处理拦截了所有按键，导致 F5、Ctrl+R 失效
    - 硬降后新方块继承了旧的下落计时，会立刻掉一格
- 非目标：音效、最高分存储、SRS 标准踢墙表、锁定延迟、构建工具和模块打包
- 假设：使用现代浏览器（Chrome、Edge、Firefox、Safari 的近两个大版本）。脚本用普通 `<script>` 加载，不用 ES Module，因为浏览器在 `file://` 下会拦截 ES Module

## 3. 接口契约

所有被两个以上文件共用的名字都列在这里。`python scripts/check_contract.py examples/tetris/docs/plans/COGNITION.md` 会逐条核对，也会反查表外的共用名字。

| 类别 | 名称 | 定义方 | 引用方 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| DOM ID | `#game-container` | index.html | style.css | 页面外层容器 |
| DOM ID | `#game-main` | index.html | style.css | 棋盘 + 侧栏的横向布局 |
| DOM ID | `#side-panel` | index.html | style.css | 侧栏 |
| DOM ID | `#game-canvas` | index.html | js/main.js | 主画布 300×600 |
| DOM ID | `#next-canvas` | index.html | js/main.js | 下一块预览 120×120 |
| DOM ID | `#score` | index.html | js/main.js | 分数 |
| DOM ID | `#level` | index.html | js/main.js | 等级 |
| DOM ID | `#lines` | index.html | js/main.js | 消行数 |
| CSS 类 | `.title` | style.css | index.html | 标题 |
| CSS 类 | `.board-wrapper` | style.css | index.html | 棋盘边框 |
| CSS 类 | `.panel-section` | style.css | index.html | 侧栏区块 |
| CSS 类 | `.panel-label` | style.css | index.html | 区块标签 |
| CSS 类 | `.panel-value` | style.css | index.html | 区块数值 |
| CSS 类 | `.controls-hint` | style.css | index.html | 操作说明行 |
| CSS 类 | `.key` | style.css | index.html | 按键样式 |
| 路径 | `style.css` | style.css | index.html | 样式表 |
| 路径 | `js/core.js` | js/core.js | index.html, test.html | 必须在 main.js / core.tests.js 之前加载 |
| 路径 | `js/main.js` | js/main.js | index.html | 外壳 |
| 路径 | `js/core.tests.js` | js/core.tests.js | test.html | 测试用例 |
| 全局 | `TetrisCore` | js/core.js | js/main.js, js/core.tests.js, test.html | 核心逻辑唯一出口 |
| 导出 | `TetrisCore.BOARD_WIDTH` | js/core.js | js/main.js | 10 列 |
| 导出 | `TetrisCore.BOARD_HEIGHT` | js/core.js | js/main.js | 20 行 |
| 导出 | `TetrisCore.createGame(rng?): GameState` | js/core.js | js/main.js, js/core.tests.js | 新建一局，rng 可注入以便复现 |
| 导出 | `TetrisCore.move(game, dx): boolean` | js/core.js | js/main.js, js/core.tests.js | dx = -1 或 1 |
| 导出 | `TetrisCore.rotate(game): boolean` | js/core.js | js/main.js, js/core.tests.js | 顺时针，带踢墙 |
| 导出 | `TetrisCore.softDrop(game): boolean` | js/core.js | js/main.js | 下移一格，落不下去就锁定 |
| 导出 | `TetrisCore.hardDrop(game): number` | js/core.js | js/main.js, js/core.tests.js | 返回下落格数 |
| 导出 | `TetrisCore.tick(game, dt): void` | js/core.js | js/main.js, js/core.tests.js | 推进 dt 毫秒 |
| 导出 | `TetrisCore.togglePause(game): boolean` | js/core.js | js/main.js, js/core.tests.js | Game Over 后无效 |
| 导出 | `TetrisCore.getGhostY(game): number` | js/core.js | js/main.js, js/core.tests.js | 落点预览 |
| 导出 | `TetrisCore.isValidPosition(board, shape, x, y)` | js/core.js | js/core.tests.js | 碰撞检测 |
| 导出 | `TetrisCore.rotateMatrix(m)` | js/core.js | js/core.tests.js | 测试用 |
| 导出 | `TetrisCore.clearLines(board): number` | js/core.js | js/core.tests.js | 原地清除满行 |
| 导出 | `TetrisCore.scoreLines(game, n)` | js/core.js | js/core.tests.js | 计分与升级 |
| 导出 | `TetrisCore.dropIntervalForLevel(level)` | js/core.js | js/core.tests.js | 800×0.85^(等级-1)，最低 100ms |
| 全局 | `TetrisCoreTests` | js/core.tests.js | test.html | 测试入口 |
| 导出 | `TetrisCoreTests.run(core)` | js/core.tests.js | test.html | 返回 `[{name, ok, error}]` |
| 数据结构 | `GameState` | js/core.js | js/main.js | 字段见下 |

**GameState**（由 core.js 创建和修改，main.js 只读）：

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `board` | `(PieceType 或 null)[20][10]` | 已锁定的格子 |
| `current` / `next` | `{type, shape, x, y}` | 当前块 / 下一块，`shape` 为方阵 |
| `score` / `level` / `lines` | number | 面板显示 |
| `gameOver` / `paused` | boolean | 覆盖层显示 |
| `dropTimer` / `dropInterval` | number（毫秒） | 自动下落计时 |

计分规则：消 1/2/3/4 行分别得 100/300/500/800 × 等级；每 10 行升 1 级。

## 4. 模块与文件

| 文件 | 职责（一句话） | 新建/修改 |
| :--- | :--- | :--- |
| `index.html` | 页面骨架，按顺序加载 core.js、main.js | 修改（脚本引用） |
| `style.css` | 像素风样式 | 不变 |
| `js/core.js` | 全部游戏规则，纯逻辑，不碰 DOM | 新建 |
| `js/main.js` | 渲染、键盘/触摸输入、游戏循环，只调用 TetrisCore | 新建 |
| `js/core.tests.js` | 核心逻辑测试，浏览器和 Node 都能跑 | 新建 |
| `test.html` | 在浏览器里运行测试并显示结果 | 新建 |
| `js/tetris.js` | v0 的单文件实现 | 删除 |

## 5. 验收标准

| # | 标准 | 验证方式 | 风险档 |
| :--- | :--- | :--- | :--- |
| A1 | 契约和代码一致，没有未登记的共用名字 | `python scripts/check_contract.py examples/tetris/docs/plans/COGNITION.md` 输出"✓ 契约一致" | 中 |
| A2 | 核心规则正确：7-bag、移动、踢墙、消行、计分升级、计时、暂停、幽灵块、Game Over | 双击 `test.html` 显示"全部通过 12/12"；装了 Node 的话也可以运行 `node examples/tetris/js/core.tests.js` | 中 |
| A3 | 硬降后新方块从完整的下落间隔开始计时（v0 缺陷） | A2 中的"硬降"用例。去掉修复后该用例会失败 | 中 |
| A4 | 零外部依赖 | `git grep -n "http" -- examples/tetris/*.html examples/tetris/js` 无结果 | 低 |
| A5 | 浏览器快捷键不被拦截（v0 缺陷） | 打开 `index.html`，按 F5 能刷新、Ctrl+R 能刷新、Ctrl+F 能打开查找 | 低（手动） |
| A6 | 能完整玩一局 | 打开 `index.html`：方向键移动和旋转、空格硬降、P 暂停、出现 Game Over 后按 Enter 重开，分数和等级正常更新 | 低（手动） |

## 6. 实施顺序

1. `js/core.js` 与 `js/core.tests.js`：先写核心逻辑和测试，测试通过（A2、A3）
2. `js/main.js`：只依赖契约表里的导出
3. `index.html` 改脚本引用，`test.html`，删除 `js/tetris.js`
4. 运行 A1、A4，手动验收 A5、A6

第 1、2 步只通过契约连接，可以交给两个子 agent 并行。但文件少，按 M 档直接串行做更省事。

## 7. 风险与开放问题

- 踢墙只是简单的横向偏移（0, -1, 1, -2, 2），不是标准 SRS。可以玩，但手感和官方版本有差别
- 没有锁定延迟，方块落地即锁定

## 修订记录

| 日期 | 改了什么 | 原因 |
| :--- | :--- | :--- |
| 2026-11-25 | 按 v1 重写：拆出 core.js、加测试、修两个缺陷 | v1 示例 |
