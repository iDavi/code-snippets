const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

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

const start = { x: 1, y: 1 };

const width = maze[0].length;
assert(maze.every((row) => row.length === width), "Todas as linhas do labirinto devem ter o mesmo tamanho.");

const exits = [];
maze.forEach((row, y) => {
  [...row].forEach((cell, x) => {
    if (cell === "E") exits.push({ x, y });
    assert(cell === "0" || cell === "1" || cell === "E", `Célula inválida em (${x}, ${y}): ${cell}`);
  });
});
assert(exits.length === 1, `O labirinto deve ter exatamente 1 saída. Encontradas: ${exits.length}`);

const queue = [start];
const visited = new Set([`${start.x},${start.y}`]);
const dirs = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1]
];

while (queue.length) {
  const { x, y } = queue.shift();
  for (const [dx, dy] of dirs) {
    const nx = x + dx;
    const ny = y + dy;
    const key = `${nx},${ny}`;
    if (visited.has(key)) continue;
    const cell = maze[ny]?.[nx];
    if (!cell || cell === "1") continue;
    visited.add(key);
    queue.push({ x: nx, y: ny });
  }
}

const exit = exits[0];
assert(visited.has(`${exit.x},${exit.y}`), "A saída não é alcançável a partir do ponto inicial.");

console.log("Maze tests passed: estrutura válida e saída alcançável.");
