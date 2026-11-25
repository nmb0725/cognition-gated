# STATUS: 像素风格俄罗斯方块 — 实施指令

## 审查结论
**已批准**。COGNITION.md 规划完整，技术方案合理，无修改意见。

## 冻结指令

按以下顺序严格执行 COGNITION.md 的 Phase 1 → Phase 2-3：

### Phase 1: 骨架搭建
1. 创建 `index.html` — 页面结构：Canvas 300×600、侧边栏 DOM（分数/等级/消行/下一块预览）、引用 style.css + js/tetris.js
2. 创建 `style.css` — 像素主题样式：深色背景 `#0d0d1a`、双边框像素效果、等宽字体布局

### Phase 2-3: 核心逻辑 + 渲染控制
3. 创建 `js/tetris.js` — 包含全部游戏逻辑（约 290 行）：
   - 常量与数据结构（BOARD_WIDTH=10, BOARD_HEIGHT=20, BLOCK_SIZE=30, 7 种方块定义, 颜色调色板）
   - 7-bag 随机系统（shuffleArray + fillBag + getNextFromBag）
   - 游戏状态管理（initGame, spawnPiece, lockPiece, clearLines, updateScore）
   - 碰撞检测与移动（isValidMove, moveLeft, moveRight, moveDown, rotatePiece 含 Wall Kick, hardDrop, getGhostY）
   - Canvas 渲染引擎（drawBoard, drawBlock 含像素双边框特效, drawCurrentPiece, drawGhostPiece, drawLockedPieces, drawGameOverScreen, drawPauseScreen, drawNextPiece）
   - 游戏循环（gameLoop 基于 requestAnimationFrame, update 计时驱动）
   - 用户控制（handleKeyDown 键盘映射, handleTouchStart/End 触摸控制）
   - DOM 面板更新（updateUI 更新分数/等级/消行）
   - 初始化启动（initGame + gameLoop）

### 约束条件
- 零外部依赖，完全离线可用
- 所有资源内嵌在项目文件中
- Canvas 渲染，像素风格视觉
- 遵循 COGNITION.md 中定义的函数签名和状态模型