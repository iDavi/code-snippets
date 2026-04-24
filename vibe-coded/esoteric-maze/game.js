const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d", { alpha: false });

const VIEW_W = 320;
const VIEW_H = 180;
const FOV = Math.PI / 3;
const MAX_DIST = 28;
const MOVE_SPEED = 2.35;
const RUN_MULTIPLIER = 1.6;
const TURN_SPEED = 2.1;
const PLAYER_RADIUS = 0.2;

const frameCanvas = document.createElement("canvas");
frameCanvas.width = VIEW_W;
frameCanvas.height = VIEW_H;
const frameCtx = frameCanvas.getContext("2d", { alpha: false });

const maze = [
  "1111111111111111",
  "1000000010000001",
  "1011111010111101",
  "1010000010000101",
  "1010111111110101",
  "1010100000010101",
  "1000101111010001",
  "1110101001011111",
  "1000101001000001",
  "1011101011111101",
  "1010001000000101",
  "1010111011110101",
  "1000000010000001",
  "1011111110111101",
  "10000000000000E1",
  "1111111111111111"
];

const enemyNames = ["João", "Maria", "Tiago", "Beatriz", "Rui", "Inês", "Bruno", "Sofia"];
const enemySpawns = [
  [4.5, 4.5],
  [12.5, 2.5],
  [5.5, 11.5],
  [10.5, 13.3],
  [2.6, 8.5]
];

const player = {
  x: 1.5,
  y: 1.5,
  angle: 0.15,
  hp: 100,
  dead: false,
  reviveTimer: 0,
  wins: false
};

const weapon = {
  cooldown: 0,
  recoil: 0
};

const enemies = enemySpawns.map(([x, y], i) => ({
  id: i,
  name: enemyNames[i % enemyNames.length],
  x,
  y,
  hp: 100,
  radius: 0.22,
  speed: 1.1 + (i % 2) * 0.2,
  attackCooldown: 0,
  alive: true
}));

const keys = new Set();
const mouseButtons = new Set();
const wallDepth = new Float32Array(VIEW_W);
let pointerLocked = false;
let flash = 0;
let lastTime = performance.now();

const wallTexture = buildWallTexture();
const floorTexture = buildFloorTexture();
const skyTexture = buildSkyTexture();
const enemyTexture = buildEnemyTexture();

function buildWallTexture() {
  const tex = document.createElement("canvas");
  tex.width = 64;
  tex.height = 64;
  const g = tex.getContext("2d");

  g.fillStyle = "#1f572f";
  g.fillRect(0, 0, tex.width, tex.height);

  for (let y = 0; y < tex.height; y += 2) {
    g.fillStyle = y % 8 === 0 ? "#2d783f" : "#18482a";
    g.fillRect(0, y, tex.width, 2);
  }

  g.strokeStyle = "#ff8ca7";
  g.lineWidth = 3;
  for (let i = 0; i < 6; i++) {
    const x = 10 + i * 10;
    g.beginPath();
    g.moveTo(x, 6);
    g.quadraticCurveTo(x - 7, 24, x + 4, 40);
    g.quadraticCurveTo(x + 12, 52, x + 2, 60);
    g.stroke();
  }

  return tex;
}

function buildFloorTexture() {
  const tex = document.createElement("canvas");
  tex.width = 64;
  tex.height = 64;
  const g = tex.getContext("2d");

  g.fillStyle = "#355735";
  g.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 300; i++) {
    const shade = 50 + Math.random() * 90;
    g.fillStyle = `rgb(${shade * 0.6}, ${shade}, ${shade * 0.6})`;
    g.fillRect(Math.random() * 64, Math.random() * 64, 1, 1);
  }

  return tex;
}

function buildSkyTexture() {
  const tex = document.createElement("canvas");
  tex.width = 64;
  tex.height = 64;
  const g = tex.getContext("2d");

  const grad = g.createLinearGradient(0, 0, 0, 64);
  grad.addColorStop(0, "#0e1219");
  grad.addColorStop(1, "#1a1120");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);

  g.fillStyle = "#ff7cc0";
  g.font = "12px monospace";
  ["✶", "☉", "✶", "⟁", "✶", "☽"].forEach((mark, i) => {
    g.fillText(mark, 4 + i * 9, 12 + ((i % 3) * 13));
  });

  return tex;
}

function buildEnemyTexture() {
  const tex = document.createElement("canvas");
  tex.width = 32;
  tex.height = 48;
  const g = tex.getContext("2d");

  g.fillStyle = "#2b1030";
  g.fillRect(0, 0, 32, 48);

  g.fillStyle = "#ff93d3";
  g.fillRect(10, 6, 12, 10);
  g.fillStyle = "#e43f8b";
  g.fillRect(6, 16, 20, 20);
  g.fillStyle = "#2d3a82";
  g.fillRect(8, 36, 6, 10);
  g.fillRect(18, 36, 6, 10);
  g.fillStyle = "#12131b";
  g.fillRect(12, 10, 2, 2);
  g.fillRect(18, 10, 2, 2);

  return tex;
}

function resetMatch() {
  player.x = 1.5;
  player.y = 1.5;
  player.angle = 0.15;
  player.hp = 100;
  player.dead = false;
  player.reviveTimer = 0;
  player.wins = false;
  flash = 0;

  enemies.forEach((enemy, i) => {
    enemy.x = enemySpawns[i][0];
    enemy.y = enemySpawns[i][1];
    enemy.hp = 100;
    enemy.alive = true;
    enemy.attackCooldown = 0;
  });
}

function resizeCanvas() {
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const w = Math.floor(window.innerWidth * dpr);
  const h = Math.floor(window.innerHeight * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
}

function cellAt(x, y) {
  return maze[Math.floor(y)]?.[Math.floor(x)] ?? "1";
}

function isWall(x, y) {
  return cellAt(x, y) === "1";
}

function isExit(x, y) {
  return cellAt(x, y) === "E";
}

function castRay(angle) {
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  let dist = 0;

  while (dist < MAX_DIST) {
    dist += 0.02;
    const rx = player.x + cos * dist;
    const ry = player.y + sin * dist;

    if (isWall(rx, ry) || isExit(rx, ry)) {
      const localX = rx - Math.floor(rx);
      const localY = ry - Math.floor(ry);
      const offset = Math.abs(localX - 0.5) > Math.abs(localY - 0.5) ? localX : localY;
      return { dist, offset, isDoor: isExit(rx, ry) };
    }
  }

  return { dist: MAX_DIST, offset: 0, isDoor: false };
}

function canMoveTo(x, y, radius = PLAYER_RADIUS) {
  return (
    !isWall(x - radius, y - radius) &&
    !isWall(x + radius, y - radius) &&
    !isWall(x - radius, y + radius) &&
    !isWall(x + radius, y + radius)
  );
}

function hasLineOfSight(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const steps = Math.ceil(Math.hypot(dx, dy) / 0.05);
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (isWall(x1 + dx * t, y1 + dy * t)) return false;
  }
  return true;
}

function shoot() {
  if (weapon.cooldown > 0 || player.dead || player.wins) return;
  weapon.cooldown = 0.22;
  weapon.recoil = 1;
  flash = 0.7;

  const centerRay = castRay(player.angle);
  let bestEnemy = null;
  let bestDist = centerRay.dist;

  enemies.forEach((enemy) => {
    if (!enemy.alive) return;
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const dist = Math.hypot(dx, dy);
    if (dist > bestDist || dist > MAX_DIST) return;

    const angleToEnemy = Math.atan2(dy, dx);
    const angleDelta = Math.atan2(Math.sin(angleToEnemy - player.angle), Math.cos(angleToEnemy - player.angle));
    if (Math.abs(angleDelta) > 0.08) return;
    if (!hasLineOfSight(player.x, player.y, enemy.x, enemy.y)) return;

    bestEnemy = enemy;
    bestDist = dist;
  });

  if (bestEnemy) {
    bestEnemy.hp -= 50;
    if (bestEnemy.hp <= 0) {
      bestEnemy.alive = false;
    }
  }
}

function updatePlayer(dt) {
  let moveX = 0;
  let moveY = 0;

  if (keys.has("w") || keys.has("arrowup")) {
    moveX += Math.cos(player.angle);
    moveY += Math.sin(player.angle);
  }
  if (keys.has("s") || keys.has("arrowdown")) {
    moveX -= Math.cos(player.angle);
    moveY -= Math.sin(player.angle);
  }
  if (keys.has("a") || keys.has("arrowleft")) {
    moveX += Math.cos(player.angle - Math.PI / 2);
    moveY += Math.sin(player.angle - Math.PI / 2);
  }
  if (keys.has("d") || keys.has("arrowright")) {
    moveX += Math.cos(player.angle + Math.PI / 2);
    moveY += Math.sin(player.angle + Math.PI / 2);
  }

  if (!pointerLocked) {
    if (keys.has("q")) player.angle -= TURN_SPEED * dt;
    if (keys.has("e")) player.angle += TURN_SPEED * dt;
  }

  const len = Math.hypot(moveX, moveY);
  if (len > 0.0001) {
    const speed = MOVE_SPEED * (keys.has("shift") ? RUN_MULTIPLIER : 1);
    const stepX = (moveX / len) * speed * dt;
    const stepY = (moveY / len) * speed * dt;

    const nx = player.x + stepX;
    const ny = player.y + stepY;
    if (canMoveTo(nx, player.y)) player.x = nx;
    if (canMoveTo(player.x, ny)) player.y = ny;
  }

  if (isExit(player.x, player.y) && enemies.every((e) => !e.alive)) {
    player.wins = true;
    player.reviveTimer = 2.2;
  }
}

function updateEnemies(dt) {
  enemies.forEach((enemy) => {
    if (!enemy.alive) return;

    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.hypot(dx, dy);

    if (enemy.attackCooldown > 0) {
      enemy.attackCooldown -= dt;
    }

    if (dist < 0.9 && hasLineOfSight(enemy.x, enemy.y, player.x, player.y)) {
      if (enemy.attackCooldown <= 0) {
        enemy.attackCooldown = 0.75;
        player.hp -= 12;
        flash = Math.max(flash, 0.45);
        if (player.hp <= 0) {
          player.dead = true;
          player.reviveTimer = 2.2;
        }
      }
      return;
    }

    if (dist < 9 && hasLineOfSight(enemy.x, enemy.y, player.x, player.y)) {
      const dirX = dx / (dist || 1);
      const dirY = dy / (dist || 1);
      const nx = enemy.x + dirX * enemy.speed * dt;
      const ny = enemy.y + dirY * enemy.speed * dt;

      if (canMoveTo(nx, enemy.y, enemy.radius)) enemy.x = nx;
      if (canMoveTo(enemy.x, ny, enemy.radius)) enemy.y = ny;
    }
  });
}

function update(dt) {
  weapon.cooldown = Math.max(0, weapon.cooldown - dt);
  weapon.recoil = Math.max(0, weapon.recoil - dt * 4);
  flash = Math.max(0, flash - dt * 2.4);

  if (player.dead || player.wins) {
    player.reviveTimer -= dt;
    if (player.reviveTimer <= 0) {
      resetMatch();
    }
    return;
  }

  updatePlayer(dt);
  updateEnemies(dt);

  if (mouseButtons.has(0)) {
    shoot();
  }
}

function renderWorld() {
  for (let y = 0; y < VIEW_H / 2; y++) {
    const sy = ((y / (VIEW_H / 2)) * skyTexture.height) | 0;
    frameCtx.drawImage(skyTexture, 0, sy, skyTexture.width, 1, 0, y, VIEW_W, 1);
  }

  for (let y = VIEW_H / 2; y < VIEW_H; y++) {
    const p = y - VIEW_H / 2;
    const dist = VIEW_H / (2 * (p || 1));
    const wx = player.x + Math.cos(player.angle) * dist;
    const wy = player.y + Math.sin(player.angle) * dist;
    const tx = Math.abs(Math.floor(wx * 4) % floorTexture.width);
    const ty = Math.abs(Math.floor(wy * 4) % floorTexture.height);
    frameCtx.drawImage(floorTexture, tx, ty, 1, 1, 0, y, VIEW_W, 1);
  }

  for (let x = 0; x < VIEW_W; x++) {
    const rayAngle = player.angle - FOV / 2 + (x / VIEW_W) * FOV;
    const ray = castRay(rayAngle);
    const corrected = ray.dist * Math.cos(rayAngle - player.angle);
    wallDepth[x] = corrected;

    const wallH = Math.min(VIEW_H, Math.floor((VIEW_H / (corrected + 0.0001)) * 1.2));
    const yTop = ((VIEW_H - wallH) / 2) | 0;
    const tx = Math.abs(Math.floor(ray.offset * wallTexture.width)) % wallTexture.width;
    frameCtx.drawImage(wallTexture, tx, 0, 1, wallTexture.height, x, yTop, 1, wallH);

    if (ray.isDoor) {
      frameCtx.fillStyle = "rgba(255,255,255,0.28)";
      frameCtx.fillRect(x, yTop + wallH * 0.24, 1, wallH * 0.5);
    }

    const shade = Math.min(0.9, corrected / MAX_DIST);
    frameCtx.fillStyle = `rgba(6, 8, 11, ${shade})`;
    frameCtx.fillRect(x, yTop, 1, wallH);
  }
}

function renderEnemies() {
  const ordered = enemies
    .filter((enemy) => enemy.alive)
    .map((enemy) => {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const dist = Math.hypot(dx, dy);
      const rel = Math.atan2(dy, dx) - player.angle;
      const angle = Math.atan2(Math.sin(rel), Math.cos(rel));
      return { enemy, dist, angle };
    })
    .filter(({ angle, dist }) => Math.abs(angle) < FOV * 0.7 && dist > 0.25)
    .sort((a, b) => b.dist - a.dist);

  ordered.forEach(({ dist, angle }) => {
    const projH = Math.min(VIEW_H * 1.8, (VIEW_H / dist) * 0.9);
    const projW = projH * 0.6;
    const screenX = ((angle + FOV / 2) / FOV) * VIEW_W;
    const xStart = Math.floor(screenX - projW / 2);
    const xEnd = Math.floor(screenX + projW / 2);
    const yTop = Math.floor(VIEW_H / 2 - projH / 2);

    for (let x = xStart; x <= xEnd; x++) {
      if (x < 0 || x >= VIEW_W) continue;
      if (dist >= wallDepth[x]) continue;

      const u = ((x - xStart) / (projW || 1)) * enemyTexture.width;
      frameCtx.drawImage(enemyTexture, u, 0, 1, enemyTexture.height, x, yTop, 1, projH);

      const shade = Math.min(0.8, dist / 11);
      frameCtx.fillStyle = `rgba(8, 8, 12, ${shade})`;
      frameCtx.fillRect(x, yTop, 1, projH);
    }
  });
}

function renderWeapon() {
  const bob = Math.sin(performance.now() * 0.01) * 2;
  const recoil = weapon.recoil * 14;
  const w = 88;
  const h = 56;
  const x = VIEW_W / 2 - w / 2;
  const y = VIEW_H - h + bob + recoil;

  frameCtx.fillStyle = "#1c1d25";
  frameCtx.fillRect(x, y, w, h);
  frameCtx.fillStyle = "#34374c";
  frameCtx.fillRect(x + 6, y + 8, w - 12, 18);
  frameCtx.fillStyle = "#8f97c5";
  frameCtx.fillRect(x + 27, y + 12, 34, 8);
  frameCtx.fillStyle = "#151924";
  frameCtx.fillRect(x + 36, y - 8, 12, 20);
  frameCtx.fillStyle = "#2c303f";
  frameCtx.fillRect(x + 14, y + 24, 12, 24);
  frameCtx.fillRect(x + 62, y + 24, 12, 24);

  if (flash > 0.25 && weapon.recoil > 0.5) {
    frameCtx.fillStyle = `rgba(255, 234, 146, ${flash})`;
    frameCtx.beginPath();
    frameCtx.moveTo(VIEW_W / 2, y - 10);
    frameCtx.lineTo(VIEW_W / 2 - 8, y + 4);
    frameCtx.lineTo(VIEW_W / 2 + 8, y + 4);
    frameCtx.closePath();
    frameCtx.fill();
  }
}

function renderOverlays() {
  frameCtx.strokeStyle = "#ffffff25";
  frameCtx.beginPath();
  frameCtx.moveTo(VIEW_W / 2 - 5, VIEW_H / 2);
  frameCtx.lineTo(VIEW_W / 2 + 5, VIEW_H / 2);
  frameCtx.moveTo(VIEW_W / 2, VIEW_H / 2 - 5);
  frameCtx.lineTo(VIEW_W / 2, VIEW_H / 2 + 5);
  frameCtx.stroke();

  if (flash > 0) {
    frameCtx.fillStyle = `rgba(220, 40, 64, ${flash * 0.3})`;
    frameCtx.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  if (player.dead) {
    frameCtx.fillStyle = "rgba(8, 0, 0, 0.72)";
    frameCtx.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  if (player.wins) {
    frameCtx.fillStyle = "rgba(214, 248, 225, 0.16)";
    frameCtx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
}

function render() {
  frameCtx.clearRect(0, 0, VIEW_W, VIEW_H);
  renderWorld();
  renderEnemies();
  renderWeapon();
  renderOverlays();

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(frameCanvas, 0, 0, canvas.width, canvas.height);
}

function loop(now) {
  resizeCanvas();

  const dt = Math.min((now - lastTime) / 1000, 0.03);
  lastTime = now;

  update(dt);
  render();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (ev) => {
  keys.add(ev.key.toLowerCase());
});

window.addEventListener("keyup", (ev) => {
  keys.delete(ev.key.toLowerCase());
});

window.addEventListener("blur", () => {
  keys.clear();
  mouseButtons.clear();
});

canvas.addEventListener("mousedown", (ev) => {
  mouseButtons.add(ev.button);
  if (!pointerLocked) {
    canvas.requestPointerLock().catch(() => null);
  }
  if (ev.button === 0) shoot();
});

window.addEventListener("mouseup", (ev) => {
  mouseButtons.delete(ev.button);
});

document.addEventListener("pointerlockchange", () => {
  pointerLocked = document.pointerLockElement === canvas;
});

document.addEventListener("mousemove", (ev) => {
  if (!pointerLocked || player.dead || player.wins) return;
  player.angle += ev.movementX * 0.0025;
});

resizeCanvas();
requestAnimationFrame(loop);
