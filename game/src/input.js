// Ember Sigils — input: mouse clicks on cards and buttons, plus keyboard.
// Keys 1–7 play the card in that hand slot, E ends the turn, R starts a new
// duel, Enter begins the duel or dismisses the win/loss overlay.
export function bindInput(hooks) {
  document.getElementById('end-turn').addEventListener('click', () => hooks.onEndTurn());
  document.getElementById('restart').addEventListener('click', () => hooks.onRestart());
  document.getElementById('overlay-btn').addEventListener('click', () => hooks.onOverlayButton());

  document.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    if (key >= '1' && key <= '7') {
      hooks.onCard(Number(key) - 1);
    } else if (key === 'e') {
      hooks.onEndTurn();
    } else if (key === 'r') {
      hooks.onRestart();
    } else if (key === 'enter') {
      hooks.onOverlayButton();
    }
  });
}
