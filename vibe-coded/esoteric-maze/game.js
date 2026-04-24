const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d", { alpha: false });

const VIEW_W = 320;
const VIEW_H = 180;
const FOV = Math.PI / 3;
const MAX_DIST = 32;
const MOVE_SPEED = 3.0;
const RUN_MULTIPLIER = 1.8;
const TURN_SPEED = 2.5;
const PLAYER_RADIUS = 0.3;
const PLAYER_HEIGHT = 1.7;
const GRAVITY = 12;
const JUMP_FORCE = 5.5;

const frameCanvas = document.createElement("canvas");
frameCanvas.width = VIEW_W;
frameCanvas.height = VIEW_H;
const frameCtx = frameCanvas.getContext("2d", { alpha: false });

// Block types
const BLOCKS = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  WOOD: 4,
  LEAVES: 5,
  SAND: 6,
  WATER: 7,
  BRICK: 8,
  GLASS: 9
};

const BLOCK_COLORS = {
  [BLOCKS.GRASS]: { top: "#4a8f3a", side: "#5c4033" },
  [BLOCKS.DIRT]: { top: "#5c4033", side: "#5c4033" },
  [BLOCKS.STONE]: { top: "#6b6b6b", side: "#6b6b6b" },
  [BLOCKS.WOOD]: { top: "#4a3728", side: "#4a3728" },
  [BLOCKS.LEAVES]: { top: "#2d5a27", side: "#2d5a27" },
  [BLOCKS.SAND]: { top: "#c2b280", side: "#c2b280" },
  [BLOCKS.WATER]: { top: "#4a90c2", side: "#4a90c2" },
  [BLOCKS.BRICK]: { top: "#8b4513", side: "#8b4513" },
  [BLOCKS.GLASS]: { top: "#a8d5e2", side: "#a8d5e2" }
};

const BLOCK_NAMES = {
  [BLOCKS.GRASS]: "Grass",
  [BLOCKS.DIRT]: "Dirt",
  [BLOCKS.STONE]: "Stone",
  [BLOCKS.WOOD]: "Wood",
  [BLOCKS.LEAVES]: "Leaves",
  [BLOCKS.SAND]: "Sand",
  [BLOCKS.WATER]: "Water",
  [BLOCKS.BRICK]: "Brick",
  [BLOCKS.GLASS]: "Glass"
};

// World dimensions
const WORLD_WIDTH = 64;
const WORLD_HEIGHT = 32;
const WORLD_DEPTH = 64;

// Simplex-like noise for terrain generation
function noise2D(x, z) {
  const X = Math.floor(x) & 255;
  const Z = Math.floor(z) & 255;
  const xf = x - Math.floor(x);
  const zf = z - Math.floor(z);
  
  let n = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  n = n - Math.floor(n);
  
  const f = xf * xf * (3 - 2 * xf);
  const g = zf * zf * (3 - 2 * zf);
  
  return n * (1 - f) * (1 - g) + 0.5;
}

function generateTerrain() {
  const world = new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT * WORLD_DEPTH);
  
  for (let x = 0; x < WORLD_WIDTH; x++) {
    for (let z = 0; z < WORLD_DEPTH; z++) {
      // Generate height using multiple octaves of noise
      const n1 = noise2D(x * 0.05, z * 0.05);
      const n2 = noise2D(x * 0.1, z * 0.1) * 0.5;
      const n3 = noise2D(x * 0.2, z * 0.2) * 0.25;
      const height = Math.floor((n1 + n2 + n3) * 8 + 10);
      
      for (let y = 0; y < WORLD_HEIGHT; y++) {
        const idx = x + y * WORLD_WIDTH + z * WORLD_WIDTH * WORLD_HEIGHT;
        
        if (y === 0) {
          world[idx] = BLOCKS.STONE;
        } else if (y < height - 3) {
          world[idx] = BLOCKS.STONE;
        } else if (y < height - 1) {
          world[idx] = BLOCKS.DIRT;
        } else if (y < height) {
          world[idx] = BLOCKS.GRASS;
        } else if (y <= 6) {
          world[idx] = BLOCKS.WATER;
        } else {
          world[idx] = BLOCKS.AIR;
        }
      }
      
      // Add some trees
      if (x > 5 && x < WORLD_WIDTH - 5 && z > 5 && z < WORLD_DEPTH - 5) {
        if (Math.random() < 0.02) {
          const treeBaseY = Math.floor((noise2D(x * 0.05, z * 0.05) + 
                                        noise2D(x * 0.1, z * 0.1) * 0.5 + 
                                        noise2D(x * 0.2, z * 0.2) * 0.25) * 8 + 10);
          
          // Trunk
          for (let ty = 0; ty < 4; ty++) {
            const idx = x + (treeBaseY + ty) * WORLD_WIDTH + z * WORLD_WIDTH * WORLD_HEIGHT;
            if (idx < world.length) world[idx] = BLOCKS.WOOD;
          }
          
          // Leaves
          for (let lx = -2; lx <= 2; lx++) {
            for (let lz = -2; lz <= 2; lz++) {
              for (let ly = 2; ly <= 4; ly++) {
                if (Math.abs(lx) + Math.abs(lz) + Math.abs(ly - 3) < 4) {
                  const leafX = x + lx;
                  const leafY = treeBaseY + ly;
                  const leafZ = z + lz;
                  if (leafX >= 0 && leafX < WORLD_WIDTH && 
                      leafY >= 0 && leafY < WORLD_HEIGHT && 
                      leafZ >= 0 && leafZ < WORLD_DEPTH) {
                    const idx = leafX + leafY * WORLD_WIDTH + leafZ * WORLD_WIDTH * WORLD_HEIGHT;
                    if (world[idx] === BLOCKS.AIR) {
                      world[idx] = BLOCKS.LEAVES;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  
  return world;
}

let world = generateTerrain();

const player = {
  x: WORLD_WIDTH / 2,
  y: 20,
  z: WORLD_DEPTH / 2,
  angleX: 0,
  angleY: 0,
  velY: 0,
  onGround: false,
  selectedBlock: BLOCKS.GRASS
};

const keys = new Set();
const mouseButtons = new Set();
let pointerLocked = false;
let lastTime = performance.now();
let hitResult = null;

function getBlock(x, y, z) {
  if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT || z < 0 || z >= WORLD_DEPTH) {
    return BLOCKS.STONE;
  }
  return world[Math.floor(x) + Math.floor(y) * WORLD_WIDTH + Math.floor(z) * WORLD_WIDTH * WORLD_HEIGHT];
}

function setBlock(x, y, z, type) {
  if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT || z < 0 || z >= WORLD_DEPTH) {
    return;
  }
  world[Math.floor(x) + Math.floor(y) * WORLD_WIDTH + Math.floor(z) * WORLD_WIDTH * WORLD_HEIGHT] = type;
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

function castRay(angleX, angleY, maxDist) {
  const sinX = Math.sin(angleX);
  const cosX = Math.cos(angleX);
  const sinY = Math.sin(angleY);
  const cosY = Math.cos(angleY);
  
  const dirX = cosX * cosY;
  const dirY = sinY;
  const dirZ = sinX * cosY;
  
  let dist = 0;
  const step = 0.05;
  let lastX = player.x;
  let lastY = player.y;
  let lastZ = player.z;
  
  while (dist < maxDist) {
    dist += step;
    const rx = player.x + dirX * dist;
    const ry = player.y + dirY * dist;
    const rz = player.z + dirZ * dist;
    
    const block = getBlock(rx, ry, rz);
    if (block !== BLOCKS.AIR && block !== BLOCKS.WATER) {
      // Determine which face was hit
      const bx = Math.floor(rx);
      const by = Math.floor(ry);
      const bz = Math.floor(rz);
      
      const localX = rx - bx;
      const localY = ry - by;
      const localZ = rz - bz;
      
      let face = 0;
      if (localX < 0.1) face = 1;
      else if (localX > 0.9) face = 2;
      else if (localY < 0.1) face = 3;
      else if (localY > 0.9) face = 4;
      else if (localZ < 0.1) face = 5;
      else if (localZ > 0.9) face = 6;
      
      return { 
        dist, 
        x: bx, 
        y: by, 
        z: bz, 
        block,
        face,
        hitX: lastX,
        hitY: lastY,
        hitZ: lastZ
      };
    }
    
    lastX = rx;
    lastY = ry;
    lastZ = rz;
  }
  
  return null;
}

function checkCollision(x, y, z) {
  const r = PLAYER_RADIUS;
  const h = PLAYER_HEIGHT;
  
  for (let dx = -r; dx <= r; dx += r) {
    for (let dz = -r; dz <= r; dz += r) {
      for (let dy = 0; dy < h; dy += 0.5) {
        const block = getBlock(x + dx, y + dy, z + dz);
        if (block !== BLOCKS.AIR && block !== BLOCKS.WATER) {
          return true;
        }
      }
    }
  }
  return false;
}

function updatePlayer(dt) {
  // Rotation
  if (!pointerLocked) {
    if (keys.has("q")) player.angleX -= TURN_SPEED * dt;
    if (keys.has("e")) player.angleX += TURN_SPEED * dt;
  }
  
  // Movement
  let moveX = 0;
  let moveZ = 0;
  
  if (keys.has("w") || keys.has("arrowup")) {
    moveX += Math.cos(player.angleX);
    moveZ += Math.sin(player.angleX);
  }
  if (keys.has("s") || keys.has("arrowdown")) {
    moveX -= Math.cos(player.angleX);
    moveZ -= Math.sin(player.angleX);
  }
  if (keys.has("a") || keys.has("arrowleft")) {
    moveX += Math.cos(player.angleX - Math.PI / 2);
    moveZ += Math.sin(player.angleX - Math.PI / 2);
  }
  if (keys.has("d") || keys.has("arrowright")) {
    moveX += Math.cos(player.angleX + Math.PI / 2);
    moveZ += Math.sin(player.angleX + Math.PI / 2);
  }
  
  const len = Math.hypot(moveX, moveZ);
  if (len > 0.0001) {
    const speed = MOVE_SPEED * (keys.has("shift") ? RUN_MULTIPLIER : 1);
    const newX = player.x + (moveX / len) * speed * dt;
    const newZ = player.z + (moveZ / len) * speed * dt;
    
    if (!checkCollision(newX, player.y, player.z)) {
      player.x = newX;
    }
    if (!checkCollision(player.x, player.y, newZ)) {
      player.z = newZ;
    }
  }
  
  // Jumping
  if ((keys.has("space") || keys.has(" ")) && player.onGround) {
    player.velY = JUMP_FORCE;
    player.onGround = false;
  }
  
  // Gravity
  player.velY -= GRAVITY * dt;
  const newY = player.y + player.velY * dt;
  
  if (player.velY < 0) {
    // Falling
    if (checkCollision(player.x, newY, player.z)) {
      player.y = Math.ceil(player.y - 0.1);
      player.velY = 0;
      player.onGround = true;
    } else {
      player.y = newY;
      player.onGround = false;
    }
  } else {
    // Rising
    if (checkCollision(player.x, newY, player.z)) {
      player.y = Math.floor(player.y + PLAYER_HEIGHT) - PLAYER_HEIGHT - 0.01;
      player.velY = 0;
    } else {
      player.y = newY;
      player.onGround = false;
    }
  }
  
  // Keep player in bounds
  player.x = Math.max(1, Math.min(WORLD_WIDTH - 1, player.x));
  player.z = Math.max(1, Math.min(WORLD_DEPTH - 1, player.z));
  if (player.y < 0) {
    player.y = 20;
    player.velY = 0;
  }
}

function handleInteraction() {
  hitResult = castRay(player.angleX, player.angleY, 6);
  
  if (hitResult) {
    if (mouseButtons.has(0)) {
      // Left click: break block
      setBlock(hitResult.x, hitResult.y, hitResult.z, BLOCKS.AIR);
      mouseButtons.delete(0);
    } else if (mouseButtons.has(2)) {
      // Right click: place block
      const px = hitResult.x + (hitResult.face === 1 ? -1 : hitResult.face === 2 ? 1 : 0);
      const py = hitResult.y + (hitResult.face === 3 ? -1 : hitResult.face === 4 ? 1 : 0);
      const pz = hitResult.z + (hitResult.face === 5 ? -1 : hitResult.face === 6 ? 1 : 0);
      
      // Don't place block inside player
      const dx = Math.abs((px + 0.5) - player.x);
      const dz = Math.abs((pz + 0.5) - player.z);
      const dy = (py + 0.5) - player.y;
      
      if (!(dx < PLAYER_RADIUS && dz < PLAYER_RADIUS && dy >= -1 && dy < PLAYER_HEIGHT)) {
        setBlock(px, py, pz, player.selectedBlock);
      }
      mouseButtons.delete(2);
    }
  }
}

function update(dt) {
  handleInteraction();
  updatePlayer(dt);
}

function renderSky() {
  const grad = frameCtx.createLinearGradient(0, 0, 0, VIEW_H);
  grad.addColorStop(0, "#87ceeb");
  grad.addColorStop(0.5, "#b0e0f0");
  grad.addColorStop(1, "#e0f0ff");
  frameCtx.fillStyle = grad;
  frameCtx.fillRect(0, 0, VIEW_W, VIEW_H);
  
  // Draw sun
  frameCtx.fillStyle = "#fffacd";
  frameCtx.beginPath();
  frameCtx.arc(VIEW_W - 30, 30, 15, 0, Math.PI * 2);
  frameCtx.fill();
  
  // Draw clouds
  frameCtx.fillStyle = "rgba(255, 255, 255, 0.8)";
  for (let i = 0; i < 5; i++) {
    const cx = ((performance.now() * 0.01 + i * 50) % (VIEW_W + 40)) - 20;
    const cy = 20 + i * 15;
    frameCtx.beginPath();
    frameCtx.ellipse(cx, cy, 20, 8, 0, 0, Math.PI * 2);
    frameCtx.fill();
  }
}

function renderBlockFace(x, y, width, height, color, shade) {
  frameCtx.fillStyle = shade ? adjustColor(color, -30) : color;
  frameCtx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(width), Math.ceil(height));
  
  // Add border for block definition
  frameCtx.strokeStyle = "rgba(0,0,0,0.15)";
  frameCtx.lineWidth = 1;
  frameCtx.strokeRect(Math.floor(x) + 0.5, Math.floor(y) + 0.5, Math.ceil(width) - 1, Math.ceil(height) - 1);
}

function adjustColor(hex, amount) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
  const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}

function renderWorld() {
  const depthBuffer = new Float32Array(VIEW_W * VIEW_H).fill(Infinity);
  
  for (let x = 0; x < VIEW_W; x += 2) {
    for (let y = 0; y < VIEW_H; y += 2) {
      const screenX = (x / VIEW_W - 0.5) * 2;
      const screenY = (y / VIEW_H - 0.5) * 2;
      
      const rayAngleX = player.angleX + screenX * FOV / 2;
      const rayAngleY = player.angleY + screenY * FOV / 2;
      
      const hit = castRay(rayAngleX, rayAngleY, MAX_DIST);
      
      if (hit) {
        const correctedDist = hit.dist * Math.cos(rayAngleY - player.angleY);
        const blockSize = Math.min(VIEW_H, Math.floor((VIEW_H / (correctedDist + 0.0001)) * 0.8));
        
        const blockColor = BLOCK_COLORS[hit.block];
        if (!blockColor) continue;
        
        let color;
        if (hit.face === 4) {
          color = blockColor.top;
        } else if (hit.face === 3) {
          color = adjustColor(blockColor.side, -50);
        } else {
          color = blockColor.side;
        }
        
        // Apply distance fog
        const fogAmount = Math.min(1, correctedDist / MAX_DIST);
        const fogColor = { r: 135, g: 206, b: 235 };
        
        const rgb = hexToRgb(color);
        const r = Math.floor(rgb.r * (1 - fogAmount) + fogColor.r * fogAmount);
        const g = Math.floor(rgb.g * (1 - fogAmount) + fogColor.g * fogAmount);
        const b = Math.floor(rgb.b * (1 - fogAmount) + fogColor.b * fogAmount);
        color = `rgb(${r},${g},${b})`;
        
        const drawX = x - blockSize / 2;
        const drawY = VIEW_H / 2 - blockSize / 2 + screenY * blockSize;
        
        frameCtx.fillStyle = color;
        frameCtx.fillRect(drawX, drawY, blockSize + 2, blockSize + 2);
        
        // Store depth
        const startRow = Math.max(0, Math.floor(drawY));
        const endRow = Math.min(VIEW_H, Math.ceil(drawY + blockSize));
        const startCol = Math.max(0, Math.floor(drawX));
        const endCol = Math.min(VIEW_W, Math.ceil(drawX + blockSize));
        
        for (let dy = startRow; dy < endRow; dy += 2) {
          for (let dx = startCol; dx < endCol; dx += 2) {
            depthBuffer[dx + dy * VIEW_W] = Math.min(depthBuffer[dx + dy * VIEW_W], correctedDist);
          }
        }
      }
    }
  }
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

function renderCrosshair() {
  frameCtx.strokeStyle = "#ffffff";
  frameCtx.lineWidth = 2;
  frameCtx.beginPath();
  frameCtx.moveTo(VIEW_W / 2 - 8, VIEW_H / 2);
  frameCtx.lineTo(VIEW_W / 2 + 8, VIEW_H / 2);
  frameCtx.moveTo(VIEW_W / 2, VIEW_H / 2 - 8);
  frameCtx.lineTo(VIEW_W / 2, VIEW_H / 2 + 8);
  frameCtx.stroke();
  
  // Highlight block outline
  if (hitResult) {
    frameCtx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    frameCtx.lineWidth = 2;
    frameCtx.strokeRect(VIEW_W / 2 - 20, VIEW_H / 2 - 20, 40, 40);
  }
}

function renderHotbar() {
  const hotbarY = VIEW_H - 50;
  const slotSize = 40;
  const slots = Object.keys(BLOCKS).filter(k => k !== 'AIR').map(k => BLOCKS[k]);
  const totalWidth = slots.length * (slotSize + 4);
  const startX = (VIEW_W - totalWidth) / 2;
  
  // Background
  frameCtx.fillStyle = "rgba(0, 0, 0, 0.5)";
  frameCtx.fillRect(startX - 4, hotbarY - 4, totalWidth + 8, slotSize + 8);
  
  slots.forEach((blockType, i) => {
    const x = startX + i * (slotSize + 4);
    
    // Slot background
    frameCtx.fillStyle = player.selectedBlock === blockType ? "rgba(255, 255, 255, 0.3)" : "rgba(100, 100, 100, 0.5)";
    frameCtx.fillRect(x, hotbarY, slotSize, slotSize);
    
    // Block preview
    const color = BLOCK_COLORS[blockType].top;
    frameCtx.fillStyle = color;
    frameCtx.fillRect(x + 5, hotbarY + 5, slotSize - 10, slotSize - 10);
    
    // Border
    frameCtx.strokeStyle = "#ffffff";
    frameCtx.lineWidth = 1;
    frameCtx.strokeRect(x + 0.5, hotbarY + 0.5, slotSize - 1, slotSize - 1);
    
    // Number
    frameCtx.fillStyle = "#ffffff";
    frameCtx.font = "12px monospace";
    frameCtx.fillText((i + 1).toString(), x + 2, hotbarY + 12);
  });
  
  // Current block name
  frameCtx.fillStyle = "#ffffff";
  frameCtx.font = "14px monospace";
  frameCtx.textAlign = "center";
  frameCtx.fillText(BLOCK_NAMES[player.selectedBlock], VIEW_W / 2, hotbarY - 8);
}

function renderInfo() {
  frameCtx.fillStyle = "#ffffff";
  frameCtx.font = "12px monospace";
  frameCtx.textAlign = "left";
  frameCtx.fillText(`Pos: ${player.x.toFixed(1)}, ${player.y.toFixed(1)}, ${player.z.toFixed(1)}`, 5, 15);
  frameCtx.fillText(`Look: ${player.angleY.toFixed(2)}`, 5, 28);
  frameCtx.textAlign = "right";
  frameCtx.fillText("WASD: Move | Space: Jump | Click: Break/Place | 1-9: Select Block", VIEW_W - 5, 15);
}

function render() {
  frameCtx.clearRect(0, 0, VIEW_W, VIEW_H);
  renderSky();
  renderWorld();
  renderCrosshair();
  renderHotbar();
  renderInfo();
  
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
  
  // Number keys for block selection
  if (ev.key >= "1" && ev.key <= "9") {
    const index = parseInt(ev.key) - 1;
    const slots = Object.keys(BLOCKS).filter(k => k !== 'AIR').map(k => BLOCKS[k]);
    if (index < slots.length) {
      player.selectedBlock = slots[index];
    }
  }
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
});

window.addEventListener("mouseup", (ev) => {
  // Keep track for single-click actions
});

document.addEventListener("pointerlockchange", () => {
  pointerLocked = document.pointerLockElement === canvas;
});

document.addEventListener("mousemove", (ev) => {
  if (!pointerLocked) return;
  player.angleX += ev.movementX * 0.003;
  player.angleY += ev.movementY * 0.003;
  player.angleY = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, player.angleY));
});

canvas.addEventListener("contextmenu", (ev) => {
  ev.preventDefault();
});

resizeCanvas();
requestAnimationFrame(loop);
