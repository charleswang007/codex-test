const DEFAULT_GRID = 20;

export function createInitialState(gridSize = DEFAULT_GRID) {
  const mid = Math.floor(gridSize / 2);
  const snake = [
    { x: mid + 1, y: mid },
    { x: mid, y: mid },
    { x: mid - 1, y: mid },
  ];
  const food = placeFood(gridSize, snake, Math.random);

  return {
    gridSize,
    snake,
    dir: 'RIGHT',
    pendingDir: 'RIGHT',
    food,
    score: 0,
    status: 'READY',
  };
}

export function isOpposite(a, b) {
  return (
    (a === 'UP' && b === 'DOWN') ||
    (a === 'DOWN' && b === 'UP') ||
    (a === 'LEFT' && b === 'RIGHT') ||
    (a === 'RIGHT' && b === 'LEFT')
  );
}

export function getNextHead(head, dir) {
  switch (dir) {
    case 'UP':
      return { x: head.x, y: head.y - 1 };
    case 'DOWN':
      return { x: head.x, y: head.y + 1 };
    case 'LEFT':
      return { x: head.x - 1, y: head.y };
    case 'RIGHT':
    default:
      return { x: head.x + 1, y: head.y };
  }
}

export function isOutOfBounds(pos, gridSize) {
  return pos.x < 0 || pos.y < 0 || pos.x >= gridSize || pos.y >= gridSize;
}

export function isOnSnake(pos, snake, ignoreTail = false) {
  const limit = ignoreTail ? snake.length - 1 : snake.length;
  for (let i = 0; i < limit; i += 1) {
    if (snake[i].x === pos.x && snake[i].y === pos.y) return true;
  }
  return false;
}

export function placeFood(gridSize, snake, rng) {
  const free = [];
  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      if (!isOnSnake({ x, y }, snake)) free.push({ x, y });
    }
  }
  if (free.length === 0) return null;
  const idx = Math.floor(rng() * free.length);
  return free[idx];
}

export function step(state, inputDir, rng = Math.random) {
  if (state.status !== 'RUNNING') return state;

  const dir = isOpposite(state.dir, inputDir) ? state.dir : inputDir;
  const head = state.snake[0];
  const next = getNextHead(head, dir);

  const eats = state.food && next.x === state.food.x && next.y === state.food.y;
  const collisionWithBody = isOnSnake(next, state.snake, !eats);

  if (isOutOfBounds(next, state.gridSize) || collisionWithBody) {
    return {
      ...state,
      dir,
      status: 'GAME_OVER',
    };
  }

  const nextSnake = [next, ...state.snake];
  if (!eats) nextSnake.pop();

  let nextFood = state.food;
  let nextScore = state.score;
  let nextStatus = state.status;

  if (eats) {
    nextScore += 1;
    nextFood = placeFood(state.gridSize, nextSnake, rng);
    if (!nextFood) nextStatus = 'GAME_OVER';
  }

  return {
    ...state,
    snake: nextSnake,
    dir,
    pendingDir: dir,
    food: nextFood,
    score: nextScore,
    status: nextStatus,
  };
}

export function withPendingDir(state, nextDir) {
  if (state.status === 'GAME_OVER') return state;
  if (isOpposite(state.pendingDir, nextDir)) return state;
  return { ...state, pendingDir: nextDir };
}
