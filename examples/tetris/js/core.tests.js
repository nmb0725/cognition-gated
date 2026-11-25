/*
 * TetrisCore 的验收测试。不依赖任何测试框架：
 *   - 浏览器：双击 test.html
 *   - Node（如已安装）：node js/core.tests.js
 */
(function (global) {
  'use strict';

  function assert(cond, msg) {
    if (!cond) throw new Error(msg || '断言失败');
  }

  /** 可复现的伪随机数（mulberry32） */
  function seeded(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function fillRow(core, board, row, exceptCol) {
    for (let c = 0; c < core.BOARD_WIDTH; c++) {
      if (c !== exceptCol) board[row][c] = 'T';
    }
  }

  function cells(piece) {
    const out = [];
    piece.shape.forEach((row, r) => row.forEach((v, c) => { if (v) out.push([piece.x + c, piece.y + r]); }));
    return out;
  }

  const tests = [
    ['新游戏：20×10 空面板，有当前块和下一块，分数 0、等级 1', core => {
      const g = core.createGame(seeded(1));
      assert(g.board.length === 20 && g.board.every(r => r.length === 10 && r.every(c => c === null)), '面板不对');
      assert(g.current && g.next, '缺少当前块或下一块');
      assert(g.score === 0 && g.level === 1 && g.lines === 0 && !g.gameOver, '初始状态不对');
    }],
    ['7-bag：第一袋 7 个方块各出现一次', core => {
      const g = core.createGame(seeded(2));
      const firstBag = [g.current.type, g.next.type].concat(g.bag);
      assert(firstBag.length === 7 && new Set(firstBag).size === 7, '第一袋是 ' + firstBag.join(','));
    }],
    ['左移到墙后停止，不越界', core => {
      const g = core.createGame(seeded(3));
      let n = 0;
      while (core.move(g, -1)) n++;
      assert(n > 0 && n < 10, '移动次数异常：' + n);
      assert(cells(g.current).every(([x]) => x >= 0), '越过左墙');
    }],
    ['靠墙旋转时自动踢墙，结果在界内', core => {
      const g = core.createGame(seeded(4));
      g.current = { type: 'I', shape: core.rotateMatrix([[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]]), x: -2, y: 5 };
      assert(core.isValidPosition(g.board, g.current.shape, g.current.x, g.current.y), '测试前置位置非法');
      assert(core.rotate(g) === true, '旋转失败');
      assert(cells(g.current).every(([x, y]) => x >= 0 && x < 10 && y >= 0 && y < 20), '旋转后越界');
    }],
    ['消行：满行被清除，面板仍为 20 行，上方内容下移', core => {
      const g = core.createGame(seeded(5));
      fillRow(core, g.board, 19);
      g.board[18][0] = 'J';
      const n = core.clearLines(g.board);
      assert(n === 1, '应清除 1 行，实际 ' + n);
      assert(g.board.length === 20, '行数变了');
      assert(g.board[19][0] === 'J' && g.board[19].slice(1).every(c => c === null), '上方内容没有下移');
    }],
    ['计分：等级 1 一次消 4 行得 800 分', core => {
      const g = core.createGame(seeded(6));
      core.scoreLines(g, 4);
      assert(g.score === 800 && g.lines === 4, '分数 ' + g.score);
    }],
    ['升级：累计 10 行升到 2 级，下落间隔变为 680ms', core => {
      const g = core.createGame(seeded(7));
      g.lines = 9;
      core.scoreLines(g, 1);
      assert(g.level === 2, '等级 ' + g.level);
      assert(Math.abs(g.dropInterval - 680) < 1e-9, '间隔 ' + g.dropInterval);
      assert(core.dropIntervalForLevel(50) === 100, '最快间隔应为 100ms');
    }],
    ['计时：不足一个间隔不下落，满一个间隔下落一格', core => {
      const g = core.createGame(seeded(8));
      const y0 = g.current.y;
      core.tick(g, 799);
      assert(g.current.y === y0, '提前下落');
      core.tick(g, 1);
      assert(g.current.y === y0 + 1, '没有下落');
    }],
    ['硬降：锁定后新方块从完整下落间隔开始计时（v0 缺陷）', core => {
      const g = core.createGame(seeded(9));
      g.dropTimer = 790;
      const before = g.current;
      core.hardDrop(g);
      assert(g.current !== before, '没有生成新方块');
      assert(g.dropTimer === 0, '计时没有重置：' + g.dropTimer);
      const y0 = g.current.y;
      core.tick(g, 16);
      assert(g.current.y === y0, '新方块立刻掉了一格');
    }],
    ['暂停：暂停时移动和计时都无效', core => {
      const g = core.createGame(seeded(10));
      core.togglePause(g);
      const { x, y } = g.current;
      assert(core.move(g, 1) === false, '暂停时仍能移动');
      core.tick(g, 5000);
      assert(g.current.x === x && g.current.y === y, '暂停时仍在下落');
      core.togglePause(g);
      assert(core.move(g, 1) === true, '恢复后不能移动');
    }],
    ['幽灵块：空面板时落点贴底', core => {
      const g = core.createGame(seeded(11));
      const gy = core.getGhostY(g);
      const bottom = Math.max(...cells({ shape: g.current.shape, x: g.current.x, y: gy }).map(([, y]) => y));
      assert(bottom === 19, '落点最低行是 ' + bottom);
    }],
    ['Game Over：出生点被占满时游戏结束，之后操作无效', core => {
      const g = core.createGame(seeded(12));
      for (let r = 0; r < 4; r++) fillRow(core, g.board, r, 0);
      core.hardDrop(g);
      assert(g.gameOver === true, '没有判定 Game Over');
      assert(core.move(g, 1) === false && core.hardDrop(g) === 0, 'Game Over 后仍可操作');
    }]
  ];

  function run(core) {
    return tests.map(([name, fn]) => {
      try {
        fn(core);
        return { name, ok: true };
      } catch (e) {
        return { name, ok: false, error: e.message };
      }
    });
  }

  global.TetrisCoreTests = { run };

  // Node 直接运行：node js/core.tests.js
  if (typeof module !== 'undefined' && require.main === module) {
    require('./core.js');
    const results = run(globalThis.TetrisCore);
    results.forEach(r => console.log((r.ok ? 'PASS ' : 'FAIL ') + r.name + (r.ok ? '' : ' — ' + r.error)));
    const failed = results.filter(r => !r.ok).length;
    console.log(failed ? `有失败 ${results.length - failed}/${results.length}` : `全部通过 ${results.length}/${results.length}`);
    process.exitCode = failed ? 1 : 0;
  }
})(typeof window !== 'undefined' ? window : globalThis);
