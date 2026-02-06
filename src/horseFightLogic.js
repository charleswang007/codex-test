const ARENA_WIDTH = 720;
const ARENA_HEIGHT = 360;
const GROUND_Y = 40;

const MOVE_SPEED = 220;
const JUMP_SPEED = 420;
const GRAVITY = 1100;

const ATTACKS = {
  punch: { range: 70, damage: 6, duration: 0.2, cooldown: 0.35 },
  kick: { range: 90, damage: 9, duration: 0.28, cooldown: 0.55 },
};

function lcg(seed) {
  const next = (seed * 1664525 + 1013904223) >>> 0;
  return [next, next / 0xffffffff];
}

export function createInitialFightState() {
  return {
    arena: { width: ARENA_WIDTH, height: ARENA_HEIGHT, ground: GROUND_Y },
    seed: 1337,
    time: 0,
    status: 'READY',
    winner: null,
    player: createFighter('player', 180, 'RIGHT'),
    cpu: createFighter('cpu', 540, 'LEFT'),
  };
}

function createFighter(id, x, facing) {
  return {
    id,
    x,
    y: 0,
    vx: 0,
    vy: 0,
    facing,
    health: 100,
    isBlocking: false,
    attackType: null,
    attackTimer: 0,
    attackCooldown: 0,
    attackHit: false,
    stunned: 0,
  };
}

function applyMovement(fighter, input, dt) {
  const next = { ...fighter };
  if (next.stunned > 0) {
    next.vx *= 0.8;
    return next;
  }

  const move = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  next.vx = move * MOVE_SPEED;
  if (input.jump && next.y === 0) {
    next.vy = JUMP_SPEED;
  }
  next.isBlocking = input.block;
  return next;
}

function updatePhysics(fighter, dt, arena) {
  const next = { ...fighter };
  next.x += next.vx * dt;
  next.y += next.vy * dt;
  next.vy -= GRAVITY * dt;

  if (next.y < 0) {
    next.y = 0;
    next.vy = 0;
  }

  const minX = 40;
  const maxX = arena.width - 40;
  if (next.x < minX) next.x = minX;
  if (next.x > maxX) next.x = maxX;

  return next;
}

function updateFacing(a, b) {
  const next = { ...a };
  next.facing = b.x >= a.x ? 'RIGHT' : 'LEFT';
  return next;
}

function canStartAttack(fighter) {
  return fighter.attackCooldown <= 0 && fighter.attackTimer <= 0 && fighter.stunned <= 0;
}

function startAttack(fighter, type) {
  const next = { ...fighter };
  const spec = ATTACKS[type];
  next.attackType = type;
  next.attackTimer = spec.duration;
  next.attackCooldown = spec.cooldown;
  next.attackHit = false;
  return next;
}

function tickTimers(fighter, dt) {
  const next = { ...fighter };
  next.attackTimer = Math.max(0, next.attackTimer - dt);
  next.attackCooldown = Math.max(0, next.attackCooldown - dt);
  next.stunned = Math.max(0, next.stunned - dt);
  if (next.attackTimer === 0) next.attackType = null;
  return next;
}

function resolveHit(attacker, defender) {
  if (!attacker.attackType || attacker.attackHit) return [attacker, defender];
  const spec = ATTACKS[attacker.attackType];
  const distance = Math.abs(attacker.x - defender.x);
  const facingCorrect =
    (attacker.facing === 'RIGHT' && defender.x >= attacker.x) ||
    (attacker.facing === 'LEFT' && defender.x <= attacker.x);

  if (distance <= spec.range && facingCorrect) {
    const dmg = defender.isBlocking ? 0 : spec.damage;
    const nextAttacker = { ...attacker, attackHit: true };
    const nextDefender = {
      ...defender,
      health: Math.max(0, defender.health - dmg),
      stunned: defender.isBlocking ? 0 : 0.18,
    };
    return [nextAttacker, nextDefender];
  }

  return [attacker, defender];
}

function clampDistance(a, b) {
  const minGap = 60;
  const dist = b.x - a.x;
  if (Math.abs(dist) >= minGap) return [a, b];
  const push = (minGap - Math.abs(dist)) / 2;
  if (dist >= 0) {
    return [
      { ...a, x: a.x - push },
      { ...b, x: b.x + push },
    ];
  }
  return [
    { ...a, x: a.x + push },
    { ...b, x: b.x - push },
  ];
}

function decideCpu(state) {
  const cpu = state.cpu;
  const player = state.player;
  let seed = state.seed;
  let roll;

  [seed, roll] = lcg(seed);

  const distance = Math.abs(cpu.x - player.x);
  const wantsClose = distance > 140;
  const wantsRetreat = distance < 70;

  const input = {
    left: false,
    right: false,
    jump: false,
    block: false,
    punch: false,
    kick: false,
  };

  if (wantsClose) {
    input.left = cpu.x > player.x;
    input.right = cpu.x < player.x;
  } else if (wantsRetreat && roll < 0.5) {
    input.left = cpu.x < player.x;
    input.right = cpu.x > player.x;
  }

  if (distance < 120 && roll > 0.65) {
    input.kick = roll > 0.85;
    input.punch = !input.kick;
  }

  if (distance < 100 && roll < 0.25) {
    input.block = true;
  }

  if (roll > 0.92 && cpu.y === 0) {
    input.jump = true;
  }

  return [input, seed];
}

export function stepFight(state, playerInput, dt = 1 / 60) {
  if (state.status === 'GAME_OVER') return state;

  let next = { ...state, time: state.time + dt };

  const [cpuInput, seed] = decideCpu(next);
  next.seed = seed;

  let player = applyMovement(next.player, playerInput, dt);
  let cpu = applyMovement(next.cpu, cpuInput, dt);

  if (playerInput.punch && canStartAttack(player)) player = startAttack(player, 'punch');
  if (playerInput.kick && canStartAttack(player)) player = startAttack(player, 'kick');
  if (cpuInput.punch && canStartAttack(cpu)) cpu = startAttack(cpu, 'punch');
  if (cpuInput.kick && canStartAttack(cpu)) cpu = startAttack(cpu, 'kick');

  player = tickTimers(player, dt);
  cpu = tickTimers(cpu, dt);

  player = updatePhysics(player, dt, next.arena);
  cpu = updatePhysics(cpu, dt, next.arena);

  player = updateFacing(player, cpu);
  cpu = updateFacing(cpu, player);

  [player, cpu] = clampDistance(player, cpu);

  [player, cpu] = resolveHit(player, cpu);
  [cpu, player] = resolveHit(cpu, player);

  let status = next.status;
  let winner = next.winner;
  if (player.health <= 0 || cpu.health <= 0) {
    status = 'GAME_OVER';
    winner = player.health > cpu.health ? 'PLAYER' : 'CPU';
  }

  return { ...next, player, cpu, status, winner };
}
