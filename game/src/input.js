// Keyboard and mouse input, translated into game actions. The game reads
// this, never the DOM directly, so the same intents drive play, tests and
// staged screenshots. Logical coordinates are 1280x720 whatever the canvas
// size on screen.
import { FIELD_H, FIELD_W } from './config.js';

export const ACTION_CONFIRM = 'confirm';
export const ACTION_PAUSE = 'pause';
export const ACTION_MUTE = 'mute';
export const ACTION_RESTART = 'restart';
export const ACTION_PICKUP = 'pickup';
export const ACTION_COIN = 'coin';

const KEY_ACTIONS = {
  Enter: ACTION_CONFIRM,
  Space: ACTION_CONFIRM,
  Escape: ACTION_PAUSE,
  KeyP: ACTION_PAUSE,
  KeyM: ACTION_MUTE,
  KeyR: ACTION_RESTART,
  KeyE: ACTION_PICKUP,
  KeyQ: ACTION_COIN,
};

export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set(); // edge-triggered actions, consumed each frame
  let mouse = { x: FIELD_W / 2, y: FIELD_H / 2, clicked: false, clickX: 0, clickY: 0 };

  function toLogical(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * FIELD_W,
      y: ((clientY - rect.top) / rect.height) * FIELD_H,
    };
  }

  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
    if (!event.repeat) {
      const action = KEY_ACTIONS[event.code] ?? KEY_ACTIONS[event.key];
      if (action) pressed.add(action);
    }
    keys.add(event.code);
  });
  window.addEventListener('keyup', (event) => {
    keys.delete(event.code);
  });
  canvas.addEventListener('mousemove', (event) => {
    mouse = { ...mouse, ...toLogical(event.clientX, event.clientY) };
  });
  canvas.addEventListener('mousedown', (event) => {
    const p = toLogical(event.clientX, event.clientY);
    mouse = { ...mouse, ...p, clicked: true, clickX: p.x, clickY: p.y };
  });
  window.addEventListener('blur', () => keys.clear());

  return {
    // Held movement vector, normalised by the caller.
    moveVector() {
      let x = 0;
      let y = 0;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
      if (keys.has('KeyW') || keys.has('ArrowUp')) y -= 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) y += 1;
      return { x, y };
    },
    sneaking() {
      return keys.has('ShiftLeft') || keys.has('ShiftRight');
    },
    // True once per key press; the game consumes it.
    takeAction(action) {
      if (pressed.has(action)) {
        pressed.delete(action);
        return true;
      }
      return false;
    },
    takeClick() {
      if (!mouse.clicked) return null;
      mouse.clicked = false;
      return { x: mouse.clickX, y: mouse.clickY };
    },
    // Test hooks: pretend a key was pressed, or a click happened.
    pressAction(action) {
      pressed.add(action);
    },
    clickAt(x, y) {
      mouse = { ...mouse, x, y, clicked: true, clickX: x, clickY: y };
    },
  };
}
