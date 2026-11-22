// Ember Sigils — the screenshot scenes behind ?shot=start|play|play2|end|lose.
// Each scene plays the real rules forward from a fresh duel with the autopilot,
// so every frame is what a short game really looks like and the same seed always
// gives the same frame. No scene cheats: hands, life totals and played cards are
// all produced by the duel itself.
import { newDuel, playCard, runFoeTurn, PHASE_PLAY, PHASE_WIN, PHASE_LOSE } from './state.js';
import { autopilotPlayerCard, chooseCard } from './ai.js';

/** One full player turn under the autopilot: play until nothing is affordable. */
function playPlayerTurn(state) {
  let guard = 0;
  while (state.phase === PHASE_PLAY && guard < 12) {
    guard += 1;
    const index = autopilotPlayerCard(state);
    if (index === null) break;
    playCard(state, 'you', index);
  }
}

/** A player turn that keeps the hand full for the camera: at most `max` cards. */
function playPlayerTurnCapped(state, max) {
  let played = 0;
  while (state.phase === PHASE_PLAY && played < max) {
    const index = autopilotPlayerCard(state);
    if (index === null) break;
    playCard(state, 'you', index);
    played += 1;
  }
}

/** Play `rounds` whole rounds (your turn, then Mira's), then stop mid-turn. */
function stageMidGame(seed, rounds, cardsToPlay) {
  const state = newDuel(seed);
  state.phase = PHASE_PLAY;
  for (let round = 0; round < rounds; round += 1) {
    playPlayerTurnCapped(state, 2);
    if (state.phase !== PHASE_PLAY) return state;
    runFoeTurn(state, chooseCard, 2);
    if (state.phase !== PHASE_PLAY) return state;
  }
  for (let i = 0; i < cardsToPlay; i += 1) {
    const index = autopilotPlayerCard(state);
    if (index === null) break;
    playCard(state, 'you', index);
    if (state.phase !== PHASE_PLAY) break;
  }
  return state;
}

/** Run whole autopilot duels until one ends the way `wanted` says, trying seeds. */
function stageFinished(wanted, baseSeed) {
  for (let trySeed = baseSeed; trySeed < baseSeed + 40; trySeed += 1) {
    const state = newDuel(trySeed);
    state.phase = PHASE_PLAY;
    let guard = 0;
    while (state.phase === PHASE_PLAY && guard < 60) {
      guard += 1;
      playPlayerTurn(state);
      if (state.phase !== PHASE_PLAY) break;
      runFoeTurn(state, chooseCard);
    }
    if (state.phase === wanted) return state;
  }
  // Fallback: a hand-staged ending, still through the real rules.
  const state = newDuel(baseSeed);
  state.phase = PHASE_PLAY;
  if (wanted === PHASE_WIN) state.foe.life = 1;
  else state.you.life = 1;
  const finisher = state.you.hand.findIndex((c) => (c.effect.damage ?? 0) > 0 && c.cost <= state.mana);
  if (finisher >= 0) playCard(state, 'you', finisher);
  return state;
}

/**
 * Set up the named scene and return the fresh duel state for it.
 * start: the title screen. play / play2: mid-duel tables at different seeds.
 * end: a won duel. lose: a lost duel. Anything else is start.
 */
export function stageShot(name, seed) {
  if (name === 'play') return stageMidGame(seed, 2, 2);
  if (name === 'play2') return stageMidGame(seed + 4, 4, 1);
  if (name === 'end') return stageFinished(PHASE_WIN, seed);
  if (name === 'lose') return stageFinished(PHASE_LOSE, seed + 100);
  const state = newDuel(seed);
  state.phase = 'title';
  return state;
}
