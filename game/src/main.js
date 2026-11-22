// Ember Sigils — bootstrap: wires the duel state to the table and the input,
// runs Mira's turn after yours, and stages the ?shot= scenes for screenshots.
import { newDuel, playCard, runFoeTurn, PHASE_TITLE, PHASE_PLAY, PHASE_WIN, PHASE_LOSE, isOver } from './state.js';
import { render, renderOverlay } from './render.js';
import { bindInput } from './input.js';
import { chooseCard } from './ai.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') ?? '7') || 7;

const score = { wins: 0, losses: 0, duels: 0 };
let state = null;
let selectedUid = null;
let foeThinking = false;

function draw() {
  render(state, hooks, score);
  renderOverlay(state, score);
}

function countResultOnce() {
  if (state.phase === PHASE_WIN && !state.scoreCounted) {
    state.scoreCounted = true;
    score.wins += 1;
  } else if (state.phase === PHASE_LOSE && !state.scoreCounted) {
    state.scoreCounted = true;
    score.losses += 1;
  }
}

const hooks = {
  get selectedUid() { return selectedUid; },
  onCard(index) {
    if (!state || state.phase !== PHASE_PLAY || foeThinking) return;
    const card = state.you.hand[index];
    if (!card || card.cost > state.mana) return;
    selectedUid = card.uid;
    playCard(state, 'you', index);
    selectedUid = null;
    countResultOnce();
    draw();
  },
  onEndTurn() {
    if (!state || state.phase !== PHASE_PLAY || foeThinking) return;
    foeThinking = true;
    draw();
    window.setTimeout(() => {
      runFoeTurn(state, chooseCard);
      foeThinking = false;
      countResultOnce();
      draw();
    }, 450);
  },
  onRestart() {
    if (!state || state.phase === PHASE_TITLE) return;
    startDuel();
  },
  onOverlayButton() {
    if (!state) return;
    if (state.phase === PHASE_TITLE) {
      state.phase = PHASE_PLAY;
      state.clash = 'Turn 1 — your move.';
      draw();
    } else if (isOver(state)) {
      startDuel();
    }
  },
};

function startDuel() {
  const freshSeed = (Date.now() % 100000) + 1;
  state = newDuel(freshSeed);
  score.duels += 1;
  draw();
}

if (shotName) {
  // A screenshot scene: stage it synchronously and show exactly that frame.
  state = stageShot(shotName, seed);
  if (state.phase === PHASE_WIN) score.wins = 1;
  if (state.phase === PHASE_LOSE) score.losses = 1;
  score.duels = 1;
  draw();
} else {
  state = newDuel(seed);
  score.duels = 1;
  draw();
  bindInput(hooks);
}

// The renderer's click handlers are attached at render time; keep the table
// clickable after every draw by delegating card clicks through the hooks above.
export { state, score };
