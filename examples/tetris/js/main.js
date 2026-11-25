/*
 * Tetris 外壳：渲染、输入、游戏循环。所有规则都调用 TetrisCore，这里不写游戏逻辑。
 * 接口契约见 docs/plans/COGNITION.md §3。
 */
(function () {
  'use strict';

  const Core = window.TetrisCore;
  const BLOCK_SIZE = 30;
  const COLORS = {
    I: '#00f0f0', O: '#f0f000', T: '#a000f0', S: '#00f000',
    Z: '#f00000', J: '#0000f0', L: '#f0a000'
  };
  const BOARD_BG = '#111';
  const GRID_LINE = '#222';
  // 只拦截游戏用到的按键，F5、Ctrl+R 等浏览器快捷键保持可用
  const GAME_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' ', 'p', 'P', 'Enter']);

  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const nextCanvas = document.getElementById('next-canvas');
  const nextCtx = nextCanvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const levelEl = document.getElementById('level');
  const linesEl = document.getElementById('lines');

  const W = Core.BOARD_WIDTH * BLOCK_SIZE;
  const H = Core.BOARD_HEIGHT * BLOCK_SIZE;

  let game = Core.createGame();
  let lastTimestamp = 0;

  // ---------- 渲染 ----------

  function drawBlock(c, px, py, type, alpha) {
    c.globalAlpha = alpha == null ? 1 : alpha;
    c.fillStyle = COLORS[type];
    c.fillRect(px + 1, py + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
    c.fillStyle = 'rgba(255,255,255,0.3)';           // 左上高光
    c.fillRect(px + 1, py + 1, BLOCK_SIZE - 2, 3);
    c.fillRect(px + 1, py + 1, 3, BLOCK_SIZE - 2);
    c.fillStyle = 'rgba(0,0,0,0.3)';                 // 右下阴影
    c.fillRect(px + BLOCK_SIZE - 4, py + 1, 3, BLOCK_SIZE - 2);
    c.fillRect(px + 1, py + BLOCK_SIZE - 4, BLOCK_SIZE - 2, 3);
    c.globalAlpha = 1;
  }

  function drawShape(c, shape, col, row, type, alpha, offsetX, offsetY) {
    for (let r = 0; r < shape.length; r++) {
      for (let k = 0; k < shape[r].length; k++) {
        if (shape[r][k]) {
          drawBlock(c, (offsetX || 0) + (col + k) * BLOCK_SIZE, (offsetY || 0) + (row + r) * BLOCK_SIZE, type, alpha);
        }
      }
    }
  }

  function drawGrid() {
    ctx.fillStyle = BOARD_BG;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = GRID_LINE;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let r = 0; r <= Core.BOARD_HEIGHT; r++) {
      ctx.moveTo(0, r * BLOCK_SIZE);
      ctx.lineTo(W, r * BLOCK_SIZE);
    }
    for (let c = 0; c <= Core.BOARD_WIDTH; c++) {
      ctx.moveTo(c * BLOCK_SIZE, 0);
      ctx.lineTo(c * BLOCK_SIZE, H);
    }
    ctx.stroke();
  }

  function drawOverlay(title, subtitle) {
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 36px monospace';
    ctx.fillText(title, W / 2, H / 2 - (subtitle ? 20 : 0));
    if (subtitle) {
      ctx.font = '16px monospace';
      ctx.fillText(subtitle, W / 2, H / 2 + 20);
    }
  }

  function drawNext() {
    nextCtx.fillStyle = BOARD_BG;
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    const p = game.next;
    if (!p) return;
    const offsetX = (nextCanvas.width - p.shape[0].length * BLOCK_SIZE) / 2;
    const offsetY = (nextCanvas.height - p.shape.length * BLOCK_SIZE) / 2;
    drawShape(nextCtx, p.shape, 0, 0, p.type, 1, offsetX, offsetY);
  }

  function render() {
    drawGrid();
    for (let r = 0; r < Core.BOARD_HEIGHT; r++) {
      for (let c = 0; c < Core.BOARD_WIDTH; c++) {
        const cell = game.board[r][c];
        if (cell !== null) drawBlock(ctx, c * BLOCK_SIZE, r * BLOCK_SIZE, cell);
      }
    }
    const p = game.current;
    if (p && !game.gameOver) {
      drawShape(ctx, p.shape, p.x, Core.getGhostY(game), p.type, 0.2);
      drawShape(ctx, p.shape, p.x, p.y, p.type);
    }
    drawNext();
    if (game.gameOver) drawOverlay('GAME OVER', 'Press Enter to restart');
    else if (game.paused) drawOverlay('PAUSED');
  }

  function updatePanel() {
    scoreEl.textContent = game.score;
    levelEl.textContent = game.level;
    linesEl.textContent = game.lines;
  }

  // ---------- 循环与输入 ----------

  function restart() {
    game = Core.createGame();
    lastTimestamp = 0;
  }

  function gameLoop(timestamp) {
    const dt = lastTimestamp ? timestamp - lastTimestamp : 0;
    lastTimestamp = timestamp;
    Core.tick(game, dt);
    render();
    updatePanel();
    requestAnimationFrame(gameLoop);
  }

  function handleKeyDown(e) {
    if (!GAME_KEYS.has(e.key) || e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault();
    if (game.gameOver) {
      if (e.key === 'Enter') restart();
      return;
    }
    switch (e.key) {
      case 'ArrowLeft': Core.move(game, -1); break;
      case 'ArrowRight': Core.move(game, 1); break;
      case 'ArrowDown': Core.softDrop(game); break;
      case 'ArrowUp': Core.rotate(game); break;
      case ' ': Core.hardDrop(game); break;
      case 'p':
      case 'P': Core.togglePause(game); break;
    }
  }

  let touchStart = null;

  function handleTouchStart(e) {
    e.preventDefault();
    const t = e.touches[0];
    touchStart = { x: t.clientX, y: t.clientY, time: Date.now() };
  }

  function handleTouchEnd(e) {
    e.preventDefault();
    if (!touchStart) return;
    if (game.gameOver) {
      restart();
      return;
    }
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    const isTap = Date.now() - touchStart.time < 200 && Math.abs(dx) < 10 && Math.abs(dy) < 10;
    touchStart = null;
    if (isTap) {
      Core.rotate(game);
    } else if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 30) Core.move(game, 1);
      else if (dx < -30) Core.move(game, -1);
    } else if (dy > 30) {
      Core.hardDrop(game);
    } else if (dy < -30) {
      Core.softDrop(game);
    }
  }

  document.addEventListener('keydown', handleKeyDown);
  canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
  canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

  requestAnimationFrame(gameLoop);
})();
