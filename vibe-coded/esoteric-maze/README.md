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

## Publicar no GitHub Pages

Este repositório inclui workflow em `.github/workflows/deploy-esoteric-maze-pages.yml`.

Passos:

1. Suba este código para um repositório no GitHub.
2. Em **Settings → Pages**, configure **Build and deployment** como **GitHub Actions**.
3. Faça push na branch `main` (ou `master`) com alterações em `vibe-coded/esoteric-maze/**`.
4. A Action vai publicar o jogo e expor uma URL em `https://<usuario>.github.io/<repo>/`.
