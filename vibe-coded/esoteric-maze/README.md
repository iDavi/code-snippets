# Minecraft-like Voxel Game

A first-person voxel sandbox game inspired by Minecraft, built with vanilla JavaScript and HTML5 Canvas.

## How to Run

Open `index.html` in a browser.

Optional (local server):

```bash
cd vibe-coded/esoteric-maze
python3 -m http.server 8080
```

Then access `http://localhost:8080`.

## Controls

- **WASD / Arrow Keys**: Move
- **Mouse**: Look around
- **Space**: Jump
- **Left Click**: Break block
- **Right Click**: Place block
- **Shift**: Sprint
- **1-9**: Select block type

## Features

- Procedurally generated terrain with hills, valleys, and water
- Multiple block types: Grass, Dirt, Stone, Wood, Leaves, Sand, Water, Brick, Glass
- Trees generated randomly throughout the world
- Physics with gravity and collision detection
- Block breaking and placement system
- Hotbar UI for block selection
- Distance fog for depth perception
- Dynamic sky with sun and animated clouds

## World Generation

The game uses a pseudo-random noise function to generate varied terrain including:
- Rolling hills and valleys
- Underground stone layers
- Dirt and grass surface layers
- Water bodies at lower elevations
- Randomly placed trees with wood trunks and leaf canopies

## Building

Explore the world and build your own structures! Select different block types using number keys 1-9, then:
- Left-click to break blocks
- Right-click to place blocks on adjacent faces

