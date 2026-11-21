// Boot and the one loop: input is read every frame, the game advances in
// fixed 1/60 s steps (several in a slow frame, none in a fast one), and the
// renderer paints what is there. The game moves between title, play,
// paused, level complete, caught, game over and win.
//
// ?seed=N fixes the random stream. ?shot=cover|alert|level3|win (with
// &seed=N) stages that scene instead of running the loop, paints it twice
// and sets window.__shotReady for a screenshot.
import { STEP } from './config.js';
import { createRandom } from './random.js';
import { createGame, SCREEN_TITLE } from './game.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { createRenderer } from './render.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
canvas.width = 1280;
canvas.height = 720;
const status = document.getElementById('status');
const audio = createAudio();
const handle = createGame(audio, createRandom(seed));
const renderer = createRenderer(canvas);
const game = handle.game;

function announce(message) {
  status.textContent = message;
}

function runShot(name) {
  const staged = stageShot(name, handle);
  if (!staged) {
    window.__shotReady = true;
    return;
  }
  let painted = 0;
  function paint() {
    game._coinDraw = handle.coinDrawPosition();
    renderer.draw(game, 1.2);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let last = performance.now();
  let accumulator = 0;
  let previousScreen = game.screen;

  function frame(now) {
    const elapsed = Math.min(MAX_FRAME, (now - last) / 1000);
    last = now;
    accumulator += elapsed;
    while (accumulator >= STEP) {
      handle.step(input, STEP);
      accumulator -= STEP;
    }
    if (game.screen !== previousScreen) {
      previousScreen = game.screen;
      if (game.screen === SCREEN_TITLE) announce('Galeri Senja. Tekan Enter untuk mulai.');
      else if (game.screen === 'win') announce(`Fajar menyingsing. Skor akhir ${game.score}.`);
      else if (game.screen === 'gameOver') announce(`Malam berakhir. Skor ${game.score}.`);
    }
    game._coinDraw = handle.coinDrawPosition();
    renderer.draw(game, now / 1000);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

if (shot) {
  runShot(shot);
} else {
  runGame();
}

// Test handle for headless play-testing: state snapshots plus the hooks a
// real player would use (teleport, key presses, clicks).
window.__game = {
  state: () => handle.state(),
  teleport: (x, y) => handle.teleport(x, y),
  loadLevel: (i) => handle.loadLevel(i),
  game: handle.game,
};
