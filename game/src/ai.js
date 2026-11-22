// Ember Sigils — Mira's brain: a readable opponent, not a random one.
// She strikes when she can finish you, heals when she is hurt, guards when you
// are about to hit hard, and otherwise plays her biggest affordable sigil.
import { cardPower } from './cards.js';

/** Score a card for the AI: how much it is worth playing right now. */
export function scoreCard(state, card) {
  const e = card.effect;
  let score = 0;
  if (e.damage) {
    score += e.damage * 2;
    if (e.damage >= state.you.life) score += 100; // the killing blow
  }
  if (e.heal) {
    const missing = 30 - state.foe.life;
    score += Math.min(e.heal, missing) * 1.5;
    if (state.foe.life <= 10) score += 8; // hurt: healing matters more
  }
  if (e.shield) {
    score += e.shield;
    if (state.you.hand.some((c) => (c.effect.damage ?? 0) >= 7)) score += 4; // brace for a big hit
  }
  if (e.draw) score += 3;
  score -= card.cost; // cheap cards are easier to chain
  return score;
}

/**
 * Pick the best affordable card index for the AI, or null when it should stop.
 * Prefers a card of a suit already played this turn (Resonance) when scores tie.
 */
export function chooseCard(state, manaLeft) {
  let best = null;
  let bestScore = 0;
  for (let i = 0; i < state.foe.hand.length; i += 1) {
    const card = state.foe.hand[i];
    if (card.cost > manaLeft) continue;
    let score = scoreCard(state, card);
    if (state.foe.suitsThisTurn.includes(card.suit)) score += 2;
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  }
  return best;
}

/**
 * The autopilot used by the screenshot scenes and the play-tester: plays the
 * player's hand the way a keen beginner would — biggest damage first, heal
 * when hurt, guard when the foe is about to strike, draw when cheap.
 */
export function autopilotPlayerCard(state) {
  let best = null;
  let bestScore = -Infinity;
  for (let i = 0; i < state.you.hand.length; i += 1) {
    const card = state.you.hand[i];
    if (card.cost > state.mana) continue;
    const e = card.effect;
    let score = (e.damage ?? 0) * 2 + (e.heal ?? 0) * 1.2 + (e.shield ?? 0) + (e.draw ?? 0) * 3 - card.cost;
    if (e.damage && e.damage >= state.foe.life) score += 100;
    if (state.you.life <= 10 && e.heal) score += 10;
    if (state.foe.played.length && (state.foe.played[0].effect.damage ?? 0) >= 7 && e.shield) score += 4;
    if (state.you.suitsThisTurn.includes(card.suit)) score += 2;
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  }
  return best;
}

/** Card power, re-exported for the renderer. */
export { cardPower };
