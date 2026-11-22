// Ember Sigils — the duel state: lives, mana, hands, and what a played card does.
// Pure rules, no DOM: the renderer and the screenshot stager both read this state.
import {
  STARTING_LIFE, STARTING_HAND, MAX_HAND, MAX_MANA, buildDeck, makeRng,
} from './cards.js';

export const PHASE_TITLE = 'title';
export const PHASE_PLAY = 'play';
export const PHASE_WIN = 'win';
export const PHASE_LOSE = 'lose';

/** A fresh duel. `seed` drives the deck shuffle and the AI's tie-breaks. */
export function newDuel(seed) {
  const rng = makeRng(seed);
  const state = {
    seed,
    rng,
    phase: PHASE_TITLE,
    turn: 1,
    mana: 3,
    manaMax: 3,
    you: { life: STARTING_LIFE, shield: 0, hand: [], deck: buildDeck(rng), played: [], suitsThisTurn: [] },
    foe: { life: STARTING_LIFE, shield: 0, hand: [], deck: buildDeck(rng), played: [], suitsThisTurn: [] },
    log: [],
    clash: 'The duel begins.',
    resonance: '',
    winner: null,
  };
  drawCards(state, state.you, STARTING_HAND);
  drawCards(state, state.foe, STARTING_HAND);
  return state;
}

/** Draw up to `n` cards from a fighter's deck into their hand (hand caps at MAX_HAND). */
export function drawCards(state, fighter, n) {
  for (let i = 0; i < n; i += 1) {
    if (fighter.hand.length >= MAX_HAND || fighter.deck.length === 0) return;
    fighter.hand.push(fighter.deck.pop());
  }
}

function dealDamage(state, target, amount, sourceName) {
  let left = amount;
  if (target.shield > 0) {
    const blocked = Math.min(target.shield, left);
    target.shield -= blocked;
    left -= blocked;
    if (blocked > 0) state.log.push(`${sourceName} hits the shield for ${blocked}.`);
  }
  if (left > 0) {
    target.life = Math.max(0, target.life - left);
    state.log.push(`${sourceName} deals ${left} damage.`);
  }
}

/**
 * Resonance: the second card of a suit played in one turn is stronger —
 * +2 to its damage, heal or shield. Suits reward chaining, not just big cards.
 */
function resonanceBonus(fighter, card) {
  return fighter.suitsThisTurn.includes(card.suit) ? 2 : 0;
}

/** Apply one card's effect. Returns a short description for the clash line. */
export function playCard(state, side, cardIndex) {
  const me = state[side];
  const them = side === 'you' ? state.foe : state.you;
  const card = me.hand[cardIndex];
  if (!card || card.cost > state.mana && side === 'you') return null;
  if (side === 'you') state.mana -= card.cost;
  me.hand.splice(cardIndex, 1);
  me.played = [card];
  const bonus = resonanceBonus(me, card);
  me.suitsThisTurn.push(card.suit);
  const e = card.effect;
  const who = side === 'you' ? 'You' : 'Mira';
  let desc = `${who} play${side === 'you' ? '' : 's'} ${card.name}`;
  if (bonus > 0) {
    desc += ` — Resonance! +${bonus}`;
    state.resonance = `Resonance! Two ${card.suit} sigils in one turn: +${bonus} power.`;
  } else {
    state.resonance = '';
  }
  if (e.damage) {
    dealDamage(state, them, e.damage + (bonus && e.damage ? bonus : 0), card.name);
    desc += ` for ${e.damage + (bonus ? bonus : 0)} damage`;
  }
  if (e.heal) {
    const healed = Math.min(e.heal + (bonus && !e.damage ? bonus : 0), STARTING_LIFE - me.life);
    me.life += healed;
    state.log.push(`${who} restore${side === 'you' ? '' : 's'} ${healed} life.`);
    desc += `, healing ${healed}`;
  }
  if (e.shield) {
    const gained = e.shield + (bonus && !e.damage && !e.heal ? bonus : 0);
    me.shield += gained;
    state.log.push(`${who} gain${side === 'you' ? '' : 's'} ${gained} shield.`);
    desc += `, gaining ${gained} shield`;
  }
  if (e.draw) {
    drawCards(state, me, e.draw);
    state.log.push(`${who} draw${side === 'you' ? '' : 's'} ${e.draw}.`);
    desc += `, drawing ${e.draw}`;
  }
  state.clash = desc + '.';
  state.log.push(desc + '.');
  checkEnd(state);
  return desc;
}

/** Can `side` afford this card right now? The AI has its own mana pool. */
export function canPlay(state, side, cardIndex) {
  const card = state[side].hand[cardIndex];
  if (!card) return false;
  return side === 'you' ? card.cost <= state.mana : true;
}

function checkEnd(state) {
  if (state.foe.life <= 0) {
    state.phase = PHASE_WIN;
    state.winner = 'you';
    state.clash = 'Victory! Mira’s sigils fade to embers.';
  } else if (state.you.life <= 0) {
    state.phase = PHASE_LOSE;
    state.winner = 'foe';
    state.clash = 'Defeat. Your last sigil burns out.';
  }
}

/** Start the player's turn: fresh mana (+1 cap each turn, to 10) and a new card. */
export function startPlayerTurn(state) {
  state.turn += 1;
  state.manaMax = Math.min(MAX_MANA, 2 + state.turn);
  state.mana = state.manaMax;
  state.you.suitsThisTurn = [];
  state.foe.suitsThisTurn = [];
  drawCards(state, state.you, 1);
  state.clash = `Turn ${state.turn} — your move.`;
  state.resonance = '';
  state.log.push(`— Turn ${state.turn} —`);
}

/** The AI's turn: it plays its affordable cards (at most `maxPlays`), then the player draws again. */
export function runFoeTurn(state, chooseCard, maxPlays = 12) {
  let foeMana = Math.min(MAX_MANA, 2 + state.turn);
  state.foe.played = [];
  let guard = 0;
  while (guard < maxPlays) {
    guard += 1;
    const index = chooseCard(state, foeMana);
    if (index === null) break;
    const card = state.foe.hand[index];
    if (!card || card.cost > foeMana) break;
    foeMana -= card.cost;
    playCard(state, 'foe', index);
    if (state.phase !== PHASE_PLAY) return;
  }
  if (state.phase === PHASE_PLAY) startPlayerTurn(state);
}

/** Is the duel over? */
export function isOver(state) {
  return state.phase === PHASE_WIN || state.phase === PHASE_LOSE;
}
