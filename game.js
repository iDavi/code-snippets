const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d", { alpha: false });
const statusEl = document.getElementById("status");

const VIEW_W = 240;
const VIEW_H = 135;
const FOV = Math.PI / 3;
const MAX_DIST = 24;
const MOVE_SPEED = 2.4;
const RUN_MULTIPLIER = 1.65;
const TURN_SPEED = 2.2;

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

const player = {
  x: 1.5,
  y: 1.5,
  angle: 0.15
};

const keys = new Set();
let pointerLocked = false;
let completed = false;
let lastTime = performance.now();

const wallTexture = buildWallTexture();
const floorTexture = buildFloorTexture();
const skyTexture = buildSkyTexture();

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

  g.fillStyle = "#ff5c93";
  g.font = "bold 15px monospace";
  g.fillText("◉", 5, 15);
  g.fillText("◉", 47, 33);
  g.fillText("◉", 27, 55);

  return tex;
}

function buildFloorTexture() {
  const tex = document.createElement("canvas");
  tex.width = 64;
  tex.height = 64;
  const g = tex.getContext("2d");

  g.fillStyle = "#355735";
  g.fillRect(0, 0, 64, 64);

  for (let i = 0; i < 280; i++) {
    const x = Math.random() * 64;
    const y = Math.random() * 64;
    const shade = 60 + Math.random() * 80;
    g.fillStyle = `rgb(${shade * 0.6}, ${shade}, ${shade * 0.6})`;
    g.fillRect(x, y, 1, 1);
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

function isWall(x, y) {
  const mx = Math.floor(x);
  const my = Math.floor(y);
  const row = maze[my];
  if (!row) return true;
  return row[mx] === "1";
}

function isExit(x, y) {
  const mx = Math.floor(x);
  const my = Math.floor(y);
  return maze[my]?.[mx] === "E";
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
      const edge = Math.abs(localX - 0.5) > Math.abs(localY - 0.5) ? localX : localY;
      return { dist, offset: edge, isDoor: isExit(rx, ry) };
    }
  }

  return { dist: MAX_DIST, offset: 0, isDoor: false };
}

function update(dt) {
  if (completed) return;

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

  const len = Math.hypot(moveX, moveY) || 1;
  const speed = MOVE_SPEED * (keys.has("shift") ? RUN_MULTIPLIER : 1);
  const nx = player.x + (moveX / len) * speed * dt;
  const ny = player.y + (moveY / len) * speed * dt;

  if (!isWall(nx, player.y)) player.x = nx;
  if (!isWall(player.x, ny)) player.y = ny;

  if (isExit(player.x, player.y)) {
    completed = true;
    statusEl.textContent = "Status: portal encontrado. o labirinto te aceita.";
  }

  if (!pointerLocked) {
    if (keys.has("q")) player.angle -= TURN_SPEED * dt;
    if (keys.has("e")) player.angle += TURN_SPEED * dt;
  }
}

function render() {
  frameCtx.clearRect(0, 0, VIEW_W, VIEW_H);

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
    const wallH = Math.min(VIEW_H, Math.floor((VIEW_H / (corrected + 0.0001)) * 1.2));
    const yTop = ((VIEW_H - wallH) / 2) | 0;

    const tx = Math.abs(Math.floor(ray.offset * wallTexture.width)) % wallTexture.width;
    frameCtx.drawImage(wallTexture, tx, 0, 1, wallTexture.height, x, yTop, 1, wallH);

    if (ray.isDoor) {
      frameCtx.fillStyle = "rgba(255,255,255,0.35)";
      frameCtx.fillRect(x, yTop + wallH * 0.25, 1, wallH * 0.5);
      frameCtx.fillStyle = "#331419";
      frameCtx.fillRect(x, yTop + wallH * 0.45, 1, wallH * 0.08);
    }

    const shade = Math.min(0.9, corrected / MAX_DIST);
    frameCtx.fillStyle = `rgba(5, 8, 10, ${shade})`;
    frameCtx.fillRect(x, yTop, 1, wallH);
  }

  frameCtx.strokeStyle = "#ffffff22";
  frameCtx.beginPath();
  frameCtx.moveTo(VIEW_W / 2 - 4, VIEW_H / 2);
  frameCtx.lineTo(VIEW_W / 2 + 4, VIEW_H / 2);
  frameCtx.moveTo(VIEW_W / 2, VIEW_H / 2 - 4);
  frameCtx.lineTo(VIEW_W / 2, VIEW_H / 2 + 4);
  frameCtx.stroke();

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(frameCanvas, 0, 0, canvas.width, canvas.height);
}

function loop(now) {
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

canvas.addEventListener("click", async () => {
  if (pointerLocked) return;
  try {
    await canvas.requestPointerLock({ unadjustedMovement: true });
  } catch {
    await canvas.requestPointerLock();
  }
});

document.addEventListener("pointerlockchange", () => {
  pointerLocked = document.pointerLockElement === canvas;
});

document.addEventListener("mousemove", (ev) => {
  if (!pointerLocked || completed) return;
  player.angle += ev.movementX * 0.0024;
});

window.addEventListener("blur", () => {
  keys.clear();
});

statusEl.textContent = "Status: clique na tela para travar o mouse e caminhar no ritual.";
requestAnimationFrame(loop);
