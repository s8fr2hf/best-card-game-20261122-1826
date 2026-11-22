// Ember Sigils — the table: turns the duel state into DOM, and back again.
// One card element per card; the foe's hand shows as card backs, the player's
// hand as full cards with cost, suit glyph, name and effect.
import { SUITS, cardPower, cardPowerKind } from './cards.js';
import { PHASE_TITLE, PHASE_WIN, PHASE_LOSE } from './state.js';

const $ = (id) => document.getElementById(id);

function cardElement(card, opts = {}) {
  const el = document.createElement('div');
  el.className = `card suit-${card.suit}`;
  if (opts.played) el.classList.add('played');
  if (opts.playable) el.classList.add('playable');
  if (opts.unplayable) el.classList.add('unplayable');
  if (opts.selected) el.classList.add('selected');
  el.dataset.uid = card.uid;
  const suit = SUITS[card.suit];
  const kind = cardPowerKind(card);
  const powerLabel = kind === 'damage' ? 'damage' : kind === 'heal' ? 'heal' : kind === 'shield' ? 'shield' : 'power';
  el.innerHTML =
    `<span class="cost" title="Mana cost">${card.cost}</span>` +
    `<span class="suit-glyph" style="color:${suit.colour}">${suit.glyph}</span>` +
    `<span class="card-name">${card.name}</span>` +
    `<span class="card-suit">${suit.name} sigil</span>` +
    `<span class="card-power" title="${powerLabel}">${cardPower(card)}</span>` +
    `<span class="card-text">${card.text}</span>`;
  if (opts.onClick) el.addEventListener('click', () => opts.onClick(card));
  return el;
}

function backElement() {
  const el = document.createElement('div');
  el.className = 'card back';
  el.innerHTML = '<span class="back-mark">✦</span>';
  return el;
}

function renderFighter(prefix, fighter, maxLife) {
  $(`${prefix}-life-fill`).style.width = `${Math.max(0, (fighter.life / maxLife) * 100)}%`;
  $(`${prefix}-life-text`).textContent = `♥ ${fighter.life} / ${maxLife}`;
  $(`${prefix}-shield`).textContent = fighter.shield > 0 ? `Shield ${fighter.shield}` : '';
}

/** Draw the whole table from `state`. `hooks` carries the click handlers. */
export function render(state, hooks, score) {
  renderFighter('you', state.you, 30);
  renderFighter('foe', state.foe, 30);
  $('turn-banner').textContent = state.phase === PHASE_TITLE ? 'Ember Sigils' : `Turn ${state.turn}`;
  $('score-wins').textContent = score.wins;
  $('score-losses').textContent = score.losses;
  $('score-duels').textContent = score.duels;

  const foeHand = $('foe-hand');
  foeHand.replaceChildren();
  for (let i = 0; i < state.foe.hand.length; i += 1) foeHand.appendChild(backElement());
  $('foe-count').textContent = state.foe.hand.length;

  const youHand = $('you-hand');
  youHand.replaceChildren();
  state.you.hand.forEach((card, index) => {
    const playable = state.phase === 'play' && card.cost <= state.mana;
    youHand.appendChild(cardElement(card, {
      playable,
      unplayable: state.phase === 'play' && !playable,
      selected: hooks.selectedUid === card.uid,
      onClick: () => hooks.onCard(index),
    }));
  });
  $('you-count').textContent = state.you.hand.length;

  const foePlayed = $('foe-played');
  foePlayed.replaceChildren();
  if (state.foe.played.length) foePlayed.appendChild(cardElement(state.foe.played[0], { played: true }));
  const youPlayed = $('you-played');
  youPlayed.replaceChildren();
  if (state.you.played.length) youPlayed.appendChild(cardElement(state.you.played[0], { played: true }));

  $('clash-text').textContent = state.clash;
  $('resonance').textContent = state.resonance;

  const pips = $('mana-pips');
  pips.replaceChildren();
  for (let i = 0; i < state.manaMax; i += 1) {
    const pip = document.createElement('span');
    pip.className = `pip${i < state.mana ? ' full' : ''}`;
    pips.appendChild(pip);
  }
  $('mana-text').textContent = `${state.mana} / ${state.manaMax} mana`;
  $('end-turn').disabled = state.phase !== 'play';
  $('restart').disabled = state.phase === PHASE_TITLE;

  const log = $('log');
  log.replaceChildren();
  for (const line of state.log.slice(-14)) {
    const div = document.createElement('div');
    div.textContent = line;
    if (line.startsWith('You')) div.className = 'log-you';
    if (line.startsWith('Mira')) div.className = 'log-foe';
    log.appendChild(div);
  }
  $('status').textContent = `You ${state.you.life} life, Mira ${state.foe.life} life, turn ${state.turn}. ${state.clash}`;
}

/** Show the title / win / loss overlay, or hide it while playing. */
export function renderOverlay(state, score) {
  const overlay = $('overlay');
  const title = $('overlay-title');
  const sub = $('overlay-sub');
  const body = $('overlay-body');
  const btn = $('overlay-btn');
  if (state.phase === PHASE_TITLE) {
    overlay.classList.remove('hidden');
    title.textContent = 'EMBER SIGILS';
    sub.textContent = 'A duel of sigil cards';
    body.innerHTML =
      '<span class="big">You are the Sigil Keeper. Mira the Gale Witch waits across the table.</span>' +
      'Each turn you gain mana and draw a card. Play sigils from your hand: ' +
      '<b>Ember ▲</b> burns, <b>Tide ●</b> mends and flows, <b>Thorn ✦</b> guards, ' +
      '<b>Gale ◆</b> strikes fast. Play two sigils of one suit in a turn for <b>Resonance +2</b>. ' +
      'Reduce Mira to 0 life before she does the same to you. First to fall loses.';
    btn.textContent = 'Begin the duel';
  } else if (state.phase === PHASE_WIN) {
    overlay.classList.remove('hidden');
    title.textContent = 'VICTORY!';
    sub.textContent = 'Mira’s sigils fade to embers';
    body.innerHTML =
      `<span class="big">You win the duel in ${state.turn} turns.</span>` +
      `Your life stands at ${state.you.life} — Mira falls to 0. ` +
      `Duels won: ${score.wins} · lost: ${score.losses}. Play again and chase a faster win.`;
    btn.textContent = 'Duel again';
  } else if (state.phase === PHASE_LOSE) {
    overlay.classList.remove('hidden');
    title.textContent = 'DEFEAT';
    sub.textContent = 'Your last sigil burns out';
    body.innerHTML =
      `<span class="big">Mira wins the duel in ${state.turn} turns.</span>` +
      `Mira stands at ${state.foe.life} life — you fall to 0. ` +
      `Duels won: ${score.wins} · lost: ${score.losses}. Shuffle up and take the rematch.`;
    btn.textContent = 'Rematch';
  } else {
    overlay.classList.add('hidden');
  }
}
