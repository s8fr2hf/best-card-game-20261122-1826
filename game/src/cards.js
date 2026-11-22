// Ember Sigils — the cards: four suits, twelve sigils, one deck.
// Suits are told apart by colour AND shape, never by text alone:
// Ember ▲ red, Tide ● blue, Thorn ✦ green, Gale ◆ purple.
export const SUITS = {
  ember: { name: 'Ember', glyph: '▲', colour: '#d84315' },
  tide: { name: 'Tide', glyph: '●', colour: '#1565c0' },
  thorn: { name: 'Thorn', glyph: '✦', colour: '#2e7d32' },
  gale: { name: 'Gale', glyph: '◆', colour: '#6a1b9a' },
};

// effect: { damage, heal, shield, draw } — a card may do more than one thing.
export const CARD_DEFS = [
  { id: 'cinder', name: 'Cinder Flick', suit: 'ember', cost: 1, effect: { damage: 3 }, text: 'Deal 3 damage.' },
  { id: 'ember-strike', name: 'Ember Strike', suit: 'ember', cost: 2, effect: { damage: 5 }, text: 'Deal 5 damage.' },
  { id: 'ember-burst', name: 'Ember Burst', suit: 'ember', cost: 4, effect: { damage: 9 }, text: 'Deal 9 damage.' },
  { id: 'tide-flow', name: 'Tide Flow', suit: 'tide', cost: 1, effect: { draw: 2 }, text: 'Draw 2 cards.' },
  { id: 'tide-mend', name: 'Tide Mend', suit: 'tide', cost: 2, effect: { heal: 6 }, text: 'Restore 6 life.' },
  { id: 'tide-surge', name: 'Tide Surge', suit: 'tide', cost: 3, effect: { damage: 4, draw: 1 }, text: 'Deal 4 damage. Draw 1 card.' },
  { id: 'thorn-guard', name: 'Thorn Guard', suit: 'thorn', cost: 2, effect: { shield: 6 }, text: 'Gain 6 shield.' },
  { id: 'thorn-snare', name: 'Thorn Snare', suit: 'thorn', cost: 3, effect: { damage: 3, shield: 3 }, text: 'Deal 3 damage. Gain 3 shield.' },
  { id: 'thorn-bloom', name: 'Thorn Bloom', suit: 'thorn', cost: 3, effect: { heal: 4, shield: 4 }, text: 'Restore 4 life. Gain 4 shield.' },
  { id: 'gale-swift', name: 'Gale Swift', suit: 'gale', cost: 1, effect: { damage: 2, draw: 1 }, text: 'Deal 2 damage. Draw 1 card.' },
  { id: 'gale-force', name: 'Gale Force', suit: 'gale', cost: 4, effect: { damage: 7 }, text: 'Deal 7 damage.' },
  { id: 'cyclone', name: 'Cyclone Sigil', suit: 'gale', cost: 5, effect: { damage: 8, draw: 1 }, text: 'Deal 8 damage. Draw 1 card.' },
];

export const DECK_COPIES = { cinder: 3, 'ember-strike': 3, 'ember-burst': 2, 'tide-flow': 3, 'tide-mend': 3, 'tide-surge': 2, 'thorn-guard': 3, 'thorn-snare': 2, 'thorn-bloom': 2, 'gale-swift': 3, 'gale-force': 2, cyclone: 2 };
export const STARTING_LIFE = 30;
export const MAX_HAND = 7;
export const STARTING_HAND = 5;
export const MAX_MANA = 10;

/** Small deterministic PRNG (mulberry32) so ?shot= scenes replay exactly. */
export function makeRng(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Build a fresh 30-card deck from the definitions and shuffle it with `rng`. */
export function buildDeck(rng) {
  const deck = [];
  for (const def of CARD_DEFS) {
    for (let i = 0; i < (DECK_COPIES[def.id] ?? 1); i += 1) deck.push({ ...def, uid: `${def.id}-${i}` });
  }
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/** The big number a card shows: its damage, or its heal/shield when it deals none. */
export function cardPower(card) {
  const e = card.effect;
  if (e.damage) return e.damage;
  if (e.heal && e.shield) return Math.max(e.heal, e.shield);
  if (e.heal) return e.heal;
  if (e.shield) return e.shield;
  return e.draw ?? 0;
}

/** What kind of card it is, for the power label. */
export function cardPowerKind(card) {
  const e = card.effect;
  if (e.damage) return 'damage';
  if (e.heal && !e.shield) return 'heal';
  if (e.shield && !e.heal) return 'shield';
  return 'power';
}
