# Ember Sigils

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/s8fr2hf/best-card-game-20261122-1826/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/s8fr2hf/best-card-game-20261122-1826/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

**Ember Sigils** is an original turn-based card duel for the make.fun best card game bounty. You are the Sigil Keeper, duelling Mira the Gale Witch across a table. Each turn you gain mana and draw a card, then play sigils from your hand: **Ember ▲** burns, **Tide ●** mends and flows, **Thorn ✦** guards, **Gale ◆** strikes fast. Play two sigils of one suit in a turn for **Resonance +2** power. Reduce Mira to 0 life before she does the same to you.

## How to play

- **Mouse:** click a card to play it, click **End turn** to pass to Mira.
- **Keyboard:** keys **1–7** play the card in that hand slot, **E** ends your turn, **R** starts a new duel, **Enter** begins the duel or takes the rematch.
- Both fighters start at 30 life. Mana grows by 1 each turn, up to 10. Shield absorbs damage first. First to 0 life loses; the score box tracks your wins, losses and duels.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. The game is plain static files under `game/` — no build step, no network requests, everything offline.

## Layout

- `game/index.html` — the table
- `game/style.css` — the table, cards and overlays
- `game/src/cards.js` — the four suits, the twelve sigils, the deck
- `game/src/state.js` — the duel rules: lives, mana, Resonance, win/loss
- `game/src/ai.js` — Mira's choices and the autopilot that stages screenshots
- `game/src/render.js` — the table, drawn from the duel state
- `game/src/input.js` — mouse and keyboard input
- `game/src/shots.js` — the deterministic `?shot=` scenes
- `game/src/main.js` — bootstrap and turn flow
- `main.ts` — the make.fun hand-in program
- `screenshots/` — real renders of the game's own code: title, two mid-duel tables, victory
