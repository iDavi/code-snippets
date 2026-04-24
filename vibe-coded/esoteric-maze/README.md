# Labirinto Esotérico (vibe coded)

Jogo 3D em primeira pessoa com estética pixelada e textura esticada, inspirado na imagem de referência com corredores surreais e atmosfera ritualística.

## Como rodar

Abra `index.html` no navegador.

Opcional (servidor local):

```bash
cd vibe-coded/esoteric-maze
python3 -m http.server 8080
```

Depois acesse `http://localhost:8080`.

## Controles

- **WASD / setas**: mover
- **Mouse**: olhar (clique na tela para capturar cursor)
- **Shift**: correr
- **Q / E**: girar sem mouse

## Objetivo

Navegar pelo labirinto e encontrar a porta final (`E`) para concluir o ritual.

## Teste rápido

Para validar a estrutura do mapa e confirmar que a saída é alcançável:

```bash
node vibe-coded/esoteric-maze/test-maze.js
```
