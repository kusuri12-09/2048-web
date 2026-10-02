function mergeLine(line) {
  const numbers = line.filter(Boolean), result = [];
  let points = 0;
  for (let i = 0; i < numbers.length; i++) {
    if (numbers[i] === numbers[i + 1]) {
      const value = numbers[i++] * 2;
      result.push(value);
      points += value;
    } else result.push(numbers[i]);
  }
  return { line: result.concat(Array(4 - result.length).fill(0)), points };
}

function moveBoard(board, direction) {
  const next = board.slice();
  let points = 0;
  for (let lane = 0; lane < 4; lane++) {
    const indices = Array.from({ length: 4 }, (_, position) => {
      const p = direction === 'right' || direction === 'down' ? 3 - position : position;
      return direction === 'left' || direction === 'right' ? lane * 4 + p : p * 4 + lane;
    });
    const merged = mergeLine(indices.map(index => board[index]));
    indices.forEach((index, position) => { next[index] = merged.line[position]; });
    points += merged.points;
  }
  return { board: next, points, changed: next.some((value, index) => value !== board[index]) };
}

function canMove(board) {
  return board.includes(0) || ['left', 'up'].some(direction => moveBoard(board, direction).changed);
}

function validGameState(state) {
  return state && Array.isArray(state.board) && state.board.length === 16 && state.board.every(value => value === 0 || Number.isSafeInteger(value) && value >= 2 && Number.isInteger(Math.log2(value))) && Number.isSafeInteger(state.score) && state.score >= 0 && typeof state.continued === 'boolean';
}
if (typeof module !== 'undefined') module.exports = { mergeLine, moveBoard, canMove, validGameState };

if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id);
  let board, score, best = 0, continued, mode = '', touchStart;
  try { best = Number(localStorage.getItem('2048-best')) || 0; } catch {}

  function spawn() {
    const empty = board.map((value, index) => value === 0 ? index : -1).filter(index => index >= 0);
    const index = empty[Math.floor(Math.random() * empty.length)];
    if (index !== undefined) board[index] = Math.random() < .9 ? 2 : 4;
    return index;
  }

  function render(newIndex) {
    try { localStorage.setItem('2048-game', JSON.stringify({ board, score, continued })); } catch {}
    $('board').replaceChildren(...board.map((value, index) => {
      const tile = document.createElement('div');
      tile.className = `tile${index === newIndex ? ' new' : ''}${value > 2048 ? ' high' : ''}`;
      tile.dataset.value = value;
      tile.textContent = value || '';
      tile.setAttribute('aria-label', `${Math.floor(index / 4) + 1}행 ${index % 4 + 1}열: ${value || '빈칸'}`);
      return tile;
    }));
    $('score').textContent = score;
    $('best').textContent = best;
    mode = !continued && board.some(value => value >= 2048) ? 'won' : !canMove(board) ? 'over' : '';
    $('overlay').hidden = !mode;
    if (mode) {
      $('message').textContent = mode === 'won' ? '2048 달성!' : '게임 끝!';
      $('detail').textContent = mode === 'won' ? '멋져요. 더 큰 숫자에 도전해보세요.' : `최종 점수 ${score.toLocaleString()}점. 다시 도전해볼까요?`;
      $('overlay-action').textContent = mode === 'won' ? '계속하기 →' : '다시 시작 ↗';
      $('status').textContent = $('message').textContent;
    } else $('status').textContent = `현재 점수 ${score}점`;
  }

  function restart() {
    board = Array(16).fill(0); score = 0; continued = false;
    spawn(); render(spawn());
  }

  function move(direction) {
    if (mode) return;
    const result = moveBoard(board, direction);
    if (!result.changed) return;
    board = result.board; score += result.points;
    if (score > best) {
      best = score;
      try { localStorage.setItem('2048-best', best); } catch {}
    }
    render(spawn());
  }

  document.addEventListener('keydown', event => {
    if (document.querySelector('dialog[open]')) return;
    const direction = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }[event.key];
    if (direction && !event.ctrlKey && !event.metaKey && !event.altKey) { event.preventDefault(); move(direction); }
  });
  $('restart').addEventListener('click', restart);
  $('overlay-action').addEventListener('click', () => { if (mode === 'won') { continued = true; render(); } else restart(); });
  $('board').addEventListener('pointerdown', event => { touchStart = { x: event.clientX, y: event.clientY }; $('board').setPointerCapture(event.pointerId); });
  $('board').addEventListener('pointerup', event => {
    if (!touchStart) return;
    const dx = event.clientX - touchStart.x, dy = event.clientY - touchStart.y;
    touchStart = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    move(Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'down' : 'up');
  });
  $('board').addEventListener('pointercancel', () => { touchStart = null; });
  let savedGame;
  try { savedGame = JSON.parse(localStorage.getItem('2048-game')); } catch {}
  if (validGameState(savedGame)) {
    board = savedGame.board; score = savedGame.score; continued = savedGame.continued;
    best = Math.max(best, score);
    try { localStorage.setItem('2048-best', best); } catch {}
    render();
  } else restart();
}
