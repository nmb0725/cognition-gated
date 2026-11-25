/*
 * Tetris 核心逻辑：纯函数 + 状态对象，不碰 DOM、不碰 Canvas。
 * 以普通 <script> 加载（file:// 下也能用），对外只暴露全局对象 TetrisCore。
 * 接口契约见 docs/plans/COGNITION.md §3。
 */
(function (global) {
  'use strict';

  const BOARD_WIDTH = 10;
  const BOARD_HEIGHT = 20;
  const INITIAL_DROP_INTERVAL = 800;
  const LEVEL_SPEED_FACTOR = 0.85;
  const MIN_DROP_INTERVAL = 100;
  const LINE_POINTS = [0, 100, 300, 500, 800];
  const LINES_PER_LEVEL = 10;
  const WALL_KICKS = [0, -1, 1, -2, 2];

  const SHAPES = {
    I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
    O: [[1, 1], [1, 1]],
    T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
    S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
    Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
    J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
    L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]]
  };
  const PIECE_TYPES = Object.keys(SHAPES);

  // ---------- 内部工具 ----------

  function emptyRow() {
    return new Array(BOARD_WIDTH).fill(null);
  }

  function shuffle(arr, rng) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /** 7-bag：7 种方块各出一次后再重新洗牌 */
  function drawType(game) {
    if (game.bag.length === 0) {
      game.bag = shuffle(PIECE_TYPES.slice(), game.rng);
    }
    return game.bag.pop();
  }

  function createPiece(type) {
    const shape = SHAPES[type].map(row => row.slice());
    return { type, shape, x: Math.floor((BOARD_WIDTH - shape[0].length) / 2), y: 0 };
  }

  function canAct(game) {
    return Boolean(game.current) && !game.gameOver && !game.paused;
  }

  function spawn(game) {
    game.current = game.next;
    game.next = createPiece(drawType(game));
    game.dropTimer = 0; // 新方块总是从完整的下落间隔开始计时
    if (!isValidPosition(game.board, game.current.shape, game.current.x, game.current.y)) {
      game.gameOver = true;
    }
  }

  function lock(game) {
    const { shape, x, y, type } = game.current;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        const by = y + r;
        const bx = x + c;
        if (shape[r][c] && by >= 0 && by < BOARD_HEIGHT && bx >= 0 && bx < BOARD_WIDTH) {
          game.board[by][bx] = type;
        }
      }
    }
    const cleared = clearLines(game.board);
    if (cleared > 0) scoreLines(game, cleared);
    spawn(game);
    return cleared;
  }

  // ---------- 对外接口 ----------

  function dropIntervalForLevel(level) {
    return Math.max(MIN_DROP_INTERVAL, INITIAL_DROP_INTERVAL * Math.pow(LEVEL_SPEED_FACTOR, level - 1));
  }

  /** 新建一局。rng 可注入，便于测试复现 */
  function createGame(rng) {
    const game = {
      board: Array.from({ length: BOARD_HEIGHT }, emptyRow),
      current: null,
      next: null,
      bag: [],
      score: 0,
      level: 1,
      lines: 0,
      gameOver: false,
      paused: false,
      dropTimer: 0,
      dropInterval: INITIAL_DROP_INTERVAL,
      rng: rng || Math.random
    };
    game.next = createPiece(drawType(game));
    spawn(game);
    return game;
  }

  function isValidPosition(board, shape, x, y) {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const bx = x + c;
        const by = y + r;
        if (bx < 0 || bx >= BOARD_WIDTH || by >= BOARD_HEIGHT) return false;
        if (by >= 0 && board[by][bx] !== null) return false;
      }
    }
    return true;
  }

  /** 顺时针旋转方阵 */
  function rotateMatrix(matrix) {
    const n = matrix.length;
    return Array.from({ length: n }, (_, col) =>
      Array.from({ length: n }, (_, i) => matrix[n - 1 - i][col]));
  }

  /** 左右移动，dx = -1 或 1。返回是否移动成功 */
  function move(game, dx) {
    if (!canAct(game)) return false;
    const p = game.current;
    if (!isValidPosition(game.board, p.shape, p.x + dx, p.y)) return false;
    p.x += dx;
    return true;
  }

  /** 旋转（带简单踢墙）。返回是否旋转成功 */
  function rotate(game) {
    if (!canAct(game)) return false;
    const p = game.current;
    const rotated = rotateMatrix(p.shape);
    for (const kick of WALL_KICKS) {
      if (isValidPosition(game.board, rotated, p.x + kick, p.y)) {
        p.shape = rotated;
        p.x += kick;
        return true;
      }
    }
    return false;
  }

  /** 软降一格；落不下去就锁定。返回是否下移成功 */
  function softDrop(game) {
    if (!canAct(game)) return false;
    const p = game.current;
    if (isValidPosition(game.board, p.shape, p.x, p.y + 1)) {
      p.y++;
      game.dropTimer = 0;
      return true;
    }
    lock(game);
    return false;
  }

  /** 硬降到底并锁定。返回下落的格数 */
  function hardDrop(game) {
    if (!canAct(game)) return 0;
    const p = game.current;
    let distance = 0;
    while (isValidPosition(game.board, p.shape, p.x, p.y + 1)) {
      p.y++;
      distance++;
    }
    lock(game);
    return distance;
  }

  /** 推进时间 dt（毫秒），到点自动下落 */
  function tick(game, dt) {
    if (!canAct(game)) return;
    game.dropTimer += dt;
    if (game.dropTimer < game.dropInterval) return;
    game.dropTimer = 0;
    const p = game.current;
    if (isValidPosition(game.board, p.shape, p.x, p.y + 1)) {
      p.y++;
    } else {
      lock(game);
    }
  }

  function togglePause(game) {
    if (!game.gameOver) game.paused = !game.paused;
    return game.paused;
  }

  /** 幽灵块（落点预览）的 y 坐标 */
  function getGhostY(game) {
    const p = game.current;
    if (!p) return 0;
    let y = p.y;
    while (isValidPosition(game.board, p.shape, p.x, y + 1)) y++;
    return y;
  }

  /** 清除满行（原地修改 board），返回清除行数 */
  function clearLines(board) {
    const kept = board.filter(row => row.some(cell => cell === null));
    const cleared = board.length - kept.length;
    while (kept.length < board.length) kept.unshift(emptyRow());
    board.splice(0, board.length, ...kept);
    return cleared;
  }

  /** 按消行数加分并处理升级 */
  function scoreLines(game, count) {
    game.score += (LINE_POINTS[count] || 0) * game.level;
    game.lines += count;
    const level = Math.floor(game.lines / LINES_PER_LEVEL) + 1;
    if (level > game.level) {
      game.level = level;
      game.dropInterval = dropIntervalForLevel(level);
    }
  }

  global.TetrisCore = {
    BOARD_WIDTH, BOARD_HEIGHT, PIECE_TYPES,
    createGame, move, rotate, softDrop, hardDrop, tick, togglePause, getGhostY,
    isValidPosition, rotateMatrix, clearLines, scoreLines, dropIntervalForLevel
  };
})(typeof window !== 'undefined' ? window : globalThis);
