# Lunar Horse Duel (Vite + React)

A single‑player, horse‑themed fighting game inspired by classic arcade duels.
Built in this repo using Codex with **GPT-5.2-Codex**.

## Features
- Player vs AI horse duel
- Punch, kick, block, jump, and movement
- Lunar New Year visuals + background music
- Keyboard controls and quick restart

## Controls
- Move: `A` / `D` (or Arrow Left/Right)
- Jump: `W` (or Arrow Up)
- Punch: `J`
- Kick: `K`
- Block: `L`
- Start: `Space`
- Restart: `R`

## Run Locally
```bash
npm install
npm run dev
```
Then open the local URL printed by Vite (typically `http://localhost:5173`).

## Build
```bash
npm run build
npm run preview
```

## Assets
- Horse sprite: `/Users/charleswang/GitHub/codex-test/src/assets/horse.png`
- Lunar music: `/Users/charleswang/GitHub/codex-test/src/assets/lunar.mp3`

## Deployment (Vercel)
1. Push this repo to GitHub.
2. In Vercel, create a new project and import the repo.
3. Deploy with the default Vite settings.

## Manual Check
- Start, move, jump, attack, block.
- AI responds and health decreases on hits.
- Restart resets the fight.
- Music toggles on/off and loops.
