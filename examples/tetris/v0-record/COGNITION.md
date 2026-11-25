# COGNITION: 像素风格俄罗斯方块（Tetris）

## 1. 需求概述

开发一款纯前端、离线可玩的俄罗斯方块游戏，遵循这套架构的工作流来跑通"架构规划 → 人类审查 → 确定性执行"的全流程。

### 核心需求
- 无服务端，纯 HTML + CSS + JavaScript，双击 `.html` 即可在浏览器打开
- 所有资源内嵌，完全离线可用
- 像素复古视觉风格
- 标准俄罗斯方块规则（7 种方块、旋转、消行、计分、等级加速）

---

## 2. 技术选型

| 技术 | 选型 | 理由 |
| :--- | :--- | :--- |
| **渲染** | Canvas 2D API | 像素风格游戏的首选渲染方式，逐像素精确控制，性能好 |
| **样式** | 纯 CSS（不依赖任何框架） | 页面框架简单，仅需处理布局和少量 UI 样式 |
| **字体** | 系统内置等宽字体 / canvas fillText | 不依赖任何外部字体 CDN，保证离线可用 |
| **交互** | 键盘事件（`keydown`）+ 触摸事件（可选） | 无需额外库 |
| **音效** | Web Audio API 生成简易音效（可选） | 纯代码合成，无需音频文件 |
| **文件组织** | 3 个文件：`index.html` + `style.css` + `js/tetris.js` | 适度分离，不过度工程化 |

---

## 3. 模块拆分与文件清单

### 文件结构
```
l:\git\subagent\
├── .ai_rules              # [已创建] 权限守则
├── docs/
│   └── plans/
│       └── COGNITION.md   # [当前文件] 本架构设计文档
├── index.html             # [待创建] 入口页面
├── style.css              # [待创建] 像素主题样式
└── js/
    └── tetris.js          # [待创建] 全部游戏逻辑
```

### 各文件职责

#### `index.html`
- 定义页面骨架：标题、Canvas 画布、分数/等级/下一块预览区域、操作提示
- 引入 `style.css` 和 `js/tetris.js`
- **不包含任何样式和逻辑代码**，纯 HTML 结构

#### `style.css`
- 像素风格主题：深色背景、像素化边框效果
- 页面布局：游戏区域居中，侧边栏显示分数/等级/下一块
- Canvas 画布样式
- 像素风格的按钮和文字效果
- **纯表现层**，不依赖任何 CSS 框架

#### `js/tetris.js`
- 全部游戏逻辑、渲染、控制
- 预期代码量：约 350-500 行纯 JS
- 详细接口定义见第 4 节

---

## 4. 核心数据结构与接口定义

### 4.1 常量定义

```javascript
const BOARD_WIDTH = 10;          // 游戏面板宽度（列数）
const BOARD_HEIGHT = 20;         // 游戏面板高度（行数）
const BLOCK_SIZE = 30;           // 每个格子的像素大小
const INITIAL_DROP_INTERVAL = 800; // 初始下落间隔（毫秒）
const LEVEL_SPEED_FACTOR = 0.85;   // 每升一级速度倍率

// 像素风格颜色调色板（RGB 字符串，给 Canvas fillStyle 使用）
const COLORS = {
  I: '#00f0f0',  // 青色
  O: '#f0f000',  // 黄色
  T: '#a000f0',  // 紫色
  S: '#00f000',  // 绿色
  Z: '#f00000',  // 红色
  J: '#0000f0',  // 蓝色
  L: '#f0a000',  // 橙色
  GHOST: 'rgba(255,255,255,0.15)', // 幽灵块
  GRID_LINE: 'rgba(255,255,255,0.08)',
  BACKGROUND: '#1a1a2e',
  BORDER_LIGHT: '#2a2a4e',
  BORDER_DARK: '#0d0d1a'
};
```

### 4.2 方块定义（7 种 Tetrominoes）

```javascript
// 每种方块定义为 4x4 矩阵（I 为 4x4，其他为 3x3，O 为 2x2）
// 1 表示填充块，0 表示空白
const PIECES = {
  I: { shape: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], color: 'I', size: 4 },
  O: { shape: [[1,1],[1,1]],                                    color: 'O', size: 2 },
  T: { shape: [[0,1,0],[1,1,1],[0,0,0]],                       color: 'T', size: 3 },
  S: { shape: [[0,1,1],[1,1,0],[0,0,0]],                       color: 'S', size: 3 },
  Z: { shape: [[1,1,0],[0,1,1],[0,0,0]],                       color: 'Z', size: 3 },
  J: { shape: [[1,0,0],[1,1,1],[0,0,0]],                       color: 'J', size: 3 },
  L: { shape: [[0,0,1],[1,1,1],[0,0,0]],                       color: 'L', size: 3 }
};
```

### 4.3 核心函数签名

```javascript
// ==================== 游戏状态管理 ====================

/** 初始化/重置游戏：清空面板、重置分数、生成第一块 */
function initGame(): void

/** 创建新方块并设置为当前方块；如果无法放置则触发 Game Over */
function spawnPiece(): boolean  // 返回 false 表示 Game Over

/** 将当前方块锁定到面板 */
function lockPiece(): void

/** 检查并清除已满的行，返回清除的行数 */
function clearLines(): number

/** 更新分数（基于消行数和当前等级）并检查升级 */
function updateScore(linesCleared: number): { score: number, level: number, lines: number }


// ==================== 移动与碰撞检测 ====================

/** 判断给定形状在(x,y)位置是否合法（不越界、不重叠） */
function isValidMove(shape: number[][], x: number, y: number): boolean

/** 左移、右移、下移（一格）；返回是否成功 */
function moveLeft(): boolean
function moveRight(): boolean
function moveDown(): boolean

/** 顺时针旋转当前方块（含墙壁踢墙处理） */
function rotatePiece(): boolean

/** 硬降——直接落到底 */
function hardDrop(): void

/** 计算幽灵块（预览降落位置）的 Y 坐标 */
function getGhostY(): number


// ==================== 游戏循环 ====================

/** 主游戏循环（requestAnimationFrame），处理计时下落和渲染 */
function gameLoop(timestamp: DOMHighResTimeStamp): void

/** 更新逻辑（仅当非暂停、非 Game Over 时调用） */
function update(deltaTime: number): void

/** 渲染全部画面 */
function render(): void


// ==================== 渲染函数 ====================

/** 绘制背景和网格线 */
function drawBoard(): void

/** 在指定位置绘制一个像素块（含像素风边框高光效果） */
function drawBlock(x: number, y: number, colorKey: string): void

/** 绘制当前方块 */
function drawCurrentPiece(): void

/** 绘制幽灵块（半透明预览） */
function drawGhostPiece(): void

/** 绘制已锁定的方块 */
function drawLockedPieces(): void

/** 绘制侧边栏信息（分数、等级、消行数、下一块预览） */
function drawSidePanel(): void

/** 绘制 Game Over 遮罩 */
function drawGameOverScreen(): void

/** 绘制暂停提示 */
function drawPauseScreen(): void


// ==================== 方块生成器（7-bag 随机系统） ====================

/** 标准 Tetris 7-bag 随机：7 种方块各出现一次后重新洗牌 */
const pieceGenerator: {
  bag: string[],
  next(): string       // 取出下一个方块类型
  shuffleBag(): void   // 重新洗牌
}


// ==================== 事件处理 ====================

/** 键盘事件处理器 */
function handleKeyDown(event: KeyboardEvent): void

/** 触摸事件处理器（移动端滑动控制） */
function handleTouchStart(event: TouchEvent): void
function handleTouchEnd(event: TouchEvent): void
```

### 4.4 状态模型

```javascript
const game = {
  board: number[][],          // BOARD_HEIGHT × BOARD_WIDTH，0=空，1-7=对应颜色索引
  current: {                  // 当前活动方块
    type: string,             // 'I'|'O'|'T'|'S'|'Z'|'J'|'L'
    shape: number[][],        // 旋转后的当前形状矩阵
    x: number,                // 面板上的列坐标
    y: number                 // 面板上的行坐标
  } | null,
  next: string | null,        // 下一块类型
  score: number,              // 当前分数
  level: number,              // 当前等级
  lines: number,              // 累计消行数
  gameOver: boolean,
  paused: boolean,
  lastDropTime: number,       // 上次下落时间戳（用于计时）
  dropInterval: number,       // 当前下落间隔（毫秒）
  animationId: number | null  // requestAnimationFrame ID
};
```

---

## 5. 交互流程设计

### 5.1 键盘控制映射

| 按键 | 动作 | 实现细节 |
| :--- | :--- | :--- |
| `←` / `→` | 左右移动 | 每次按键移动 1 格，含碰撞检测；长按自动重复（系统原生 key repeat） |
| `↑` | 旋转 | 顺时针旋转 90°，含墙壁踢墙检查（Wall Kick：旋转时如果碰到墙/底，尝试偏移 1 格回退） |
| `↓` | 软降 | 加速下落（每帧移动 1 格），松开恢复计时下落 |
| `Space` | 硬降 | 瞬间落到底，锁定并立刻结算 |
| `P` | 暂停/继续 | 暂停时画面冻结，游戏循环暂停 |
| `Enter` | 重新开始 | 仅在 Game Over 时生效，重置全部状态 |

### 5.2 游戏状态流转

```
 [打开页面] → [初始化启动画面 / 自动开始]
                  │
                  ▼
            [游戏进行中]
            ├── ←/→ → 左右移动
            ├── ↑   → 旋转
            ├── ↓   → 软降
            ├── Space → 硬降
            ├── P   → [暂停] ──P──→ [游戏进行中]
            │
        [方块锁定] → [消行检查]
            │           │
            │      [有消行] → 更新分数/等级/速度
            │           │
            │      [无消行] → 继续
            │
        [生成新方块]
            │
        [可以放置?] ──是──→ [游戏进行中]
            │
           [否]
            │
            ▼
         [Game Over] ──Enter──→ [重新初始化]
```

### 5.3 分数计算规则

| 单次消行数 | 得分 | 说明 |
| :---: | :---: | :--- |
| 1 行 (Single) | 100 × 等级 | 消一行 |
| 2 行 (Double) | 300 × 等级 | 消两行 |
| 3 行 (Triple) | 500 × 等级 | 消三行 |
| 4 行 (Tetris) | 800 × 等级 | 消四行（I 块竖插） |

- **升级规则**：每消除 10 行升 1 级
- **速度规则**：`dropInterval = INITIAL_DROP_INTERVAL * (LEVEL_SPEED_FACTOR ^ (level - 1))`，最快不低于 100ms

---

## 6. 实施顺序

### Phase 1: 骨架搭建（可独立完成）
1. **`index.html`** — 页面结构：Canvas、侧边栏 DOM 元素、引用 CSS/JS
2. **`style.css`** — 像素主题样式：布局、颜色、字体特效、Canvas 样式

### Phase 2: 游戏核心逻辑（需 Phase 1 的 HTML 提供 Canvas）
3. **`js/tetris.js` — 初始化与数据层**：常量、数据结构、7-bag 生成器、面板初始化
4. **`js/tetris.js` — 碰撞检测与移动**：`isValidMove`、`moveLeft/Right/Down`、`rotatePiece`（含 Wall Kick）
5. **`js/tetris.js` — 锁定与消行**：`lockPiece`、`clearLines`、分数计算、等级速度更新
6. **`js/tetris.js` — 游戏循环**：`gameLoop`、`update`、计时下落、自动推进

### Phase 3: 渲染与控制（可独立完成）
7. **`js/tetris.js` — 渲染引擎**：`drawBoard`、`drawBlock`（含像素风特效）、`drawCurrentPiece`、`drawGhostPiece`、`drawLockedPieces`、`drawSidePanel`、`drawGameOverScreen`、`drawPauseScreen`
8. **`js/tetris.js` — 用户控制**：键盘事件绑定、暂停/继续、Game Over 重启

### Phase 4: 打磨（可选增强）
9. 移动端触摸控制（滑动方向识别）
10. Web Audio API 音效（锁块音、消行音、Game Over 音）
11. 本地最高分持久化（localStorage）

---

## 7. 风险与注意事项

| 风险 | 影响 | 对策 |
| :--- | :--- | :--- |
| **Canvas 像素风格效果不佳** | 视觉品质下降 | 使用像素块双边框（外侧暗、内侧亮）+ 轻微内凹阴影来模拟像素块立体感 |
| **Wall Kick 实现不完善** | 旋转体验差 | 实现 SRS（Super Rotation System）简版踢墙：当前偏移失败时，尝试 (x+1), (x-1), (x+2), (x-2) 偏移 |
| **游戏循环时间精度** | 下落速度不准确 | 基于 `requestAnimationFrame` 的时间戳差值（deltaTime）驱动，而非固定帧率 |
| **长按键盘重复延迟** | 移动不跟手 | 利用系统原生 key repeat（`keydown` 事件本身会重复触发），不做自定义重复逻辑 |
| **单文件 JS 膨胀** | 可读性下降 | 将 `tetris.js` 控制在 500 行以内，函数按语义区域分组并用注释分区标记 |
| **移动端 Canvas 触摸** | 触控不灵敏 | 触摸事件绑定到 document，500ms 内位移 < 30px 识别为"点击"，否则按方向识别为"滑动" |