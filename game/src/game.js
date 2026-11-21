// The game itself: screens, level flow, scoring, nerve, timer, and the
// per-frame update that ties the player, the guards and the input together.
// Screens: title, playing, paused, levelComplete, caught, gameOver, win.
// The renderer draws whatever this holds; shots.js stages it directly.
import {
  BEST_KEY,
  COIN_LURE_RADIUS,
  EXIT_RANGE,
  NERVE_START,
  SCORE_GHOST,
  SCORE_RELIC,
  SCORE_TIME_PER_SECOND,
  STEP,
} from './config.js';
import { LEVELS, levelBlockers } from './levels.js';
import { createGuard, guardHearNoise, guardSenses, stepGuard, GUARD_ALERTED } from './guards.js';
import {
  coinDrawPosition,
  createPlayer,
  nearRelic,
  stepCoin,
  stepPlayer,
  throwCoin,
} from './player.js';
import {
  ACTION_COIN,
  ACTION_CONFIRM,
  ACTION_MUTE,
  ACTION_PAUSE,
  ACTION_PICKUP,
  ACTION_RESTART,
} from './input.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAYING = 'playing';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_LEVEL_COMPLETE = 'levelComplete';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_GAME_OVER = 'gameOver';
export const SCREEN_WIN = 'win';

const CAUGHT_PAUSE = 1.5;

export function createGame(audio, random) {
  const game = {
    screen: SCREEN_TITLE,
    levelIndex: 0,
    level: LEVELS[0],
    blockers: levelBlockers(LEVELS[0]),
    player: createPlayer(LEVELS[0].start.x, LEVELS[0].start.y),
    guards: LEVELS[0].guards.map((def, i) => createGuard(def, i)),
    relics: LEVELS[0].relics.map((r) => ({ ...r, taken: false })),
    relicsGot: 0,
    nerve: NERVE_START,
    score: 0,
    levelScore: 0,
    elapsed: 0,
    detection: 0,
    ghost: true,
    exitOpen: false,
    caughtTimer: 0,
    message: '',
    messageTimer: 0,
    best: 0,
    muted: false,
    lastStepX: LEVELS[0].start.x,
    lastStepY: LEVELS[0].start.y,
    coinRing: null, // {x, y, t} expanding ring where a coin landed
  };

  try {
    game.best = Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    game.best = 0;
  }

  function saveBest() {
    try {
      window.localStorage.setItem(BEST_KEY, String(game.best));
    } catch {
      // Best score is decoration; a blocked store must not stop play.
    }
  }

  function loadLevel(index) {
    const level = LEVELS[index];
    game.levelIndex = index;
    game.level = level;
    game.blockers = levelBlockers(level);
    game.player = createPlayer(level.start.x, level.start.y);
    game.guards = level.guards.map((def, i) => createGuard(def, i));
    game.relics = level.relics.map((r) => ({ ...r, taken: false }));
    game.relicsGot = 0;
    game.elapsed = 0;
    game.detection = 0;
    game.ghost = true;
    game.exitOpen = false;
    game.coinRing = null;
    game.lastStepX = level.start.x;
    game.lastStepY = level.start.y;
    game.message = `${level.name} — ${level.subtitle}`;
    game.messageTimer = 3;
  }

  function resetGuards() {
    game.guards = game.level.guards.map((def, i) => createGuard(def, i));
    game.detection = 0;
  }

  function showMessage(text, seconds = 2.5) {
    game.message = text;
    game.messageTimer = seconds;
  }

  function completeLevel() {
    const timeBonus = Math.max(0, Math.round((game.level.parTime - game.elapsed) * SCORE_TIME_PER_SECOND));
    const ghostBonus = game.ghost ? SCORE_GHOST : 0;
    game.levelScore = timeBonus + ghostBonus;
    game.score += game.levelScore;
    if (game.score > game.best) {
      game.best = game.score;
      saveBest();
    }
    game.screen = SCREEN_LEVEL_COMPLETE;
    audio.levelClear();
  }

  function caught() {
    game.nerve -= 1;
    audio.caught();
    if (game.nerve <= 0) {
      game.screen = SCREEN_GAME_OVER;
      if (game.score > game.best) {
        game.best = game.score;
        saveBest();
      }
      return;
    }
    game.screen = SCREEN_CAUGHT;
    game.caughtTimer = CAUGHT_PAUSE;
  }

  function respawn() {
    game.player = createPlayer(game.level.start.x, game.level.start.y);
    game.lastStepX = game.level.start.x;
    game.lastStepY = game.level.start.y;
    resetGuards();
    game.screen = SCREEN_PLAYING;
    showMessage('Ketahuan! Kembali ke awal galeri…', 2);
  }

  function playerInShadow() {
    for (const s of game.level.shadows) {
      if (
        game.player.x >= s.x &&
        game.player.x <= s.x + s.w &&
        game.player.y >= s.y &&
        game.player.y <= s.y + s.h
      ) {
        return true;
      }
    }
    return false;
  }

  function stepPlaying(input, dt) {
    game.elapsed += dt;
    if (game.messageTimer > 0) game.messageTimer -= dt;
    if (game.coinRing) {
      game.coinRing.t += dt;
      if (game.coinRing.t > 1.2) game.coinRing = null;
    }

    // --- player movement ---
    const move = input.moveVector();
    const wasMoving = game.player.moving;
    stepPlayer(game.player, move.x, move.y, input.sneaking(), game.blockers, dt);
    game.player.inShadow = playerInShadow();
    if (game.player.moving) {
      const walked = Math.hypot(game.player.x - game.lastStepX, game.player.y - game.lastStepY);
      if (walked > 34) {
        audio.footstep(game.player.sneaking);
        game.lastStepX = game.player.x;
        game.lastStepY = game.player.y;
      }
    } else if (wasMoving) {
      game.lastStepX = game.player.x;
      game.lastStepY = game.player.y;
    }

    // --- coin toss: click (or Q) throws toward the cursor ---
    const click = input.takeClick();
    if (click) {
      if (throwCoin(game.player, click.x, click.y)) audio.coinThrow();
    }
    if (input.takeAction(ACTION_COIN)) {
      const tx = game.player.x + Math.cos(game.player.angle) * 200;
      const ty = game.player.y + Math.sin(game.player.angle) * 200;
      if (throwCoin(game.player, tx, ty)) audio.coinThrow();
    }
    const landed = stepCoin(game.player, dt);
    if (landed) {
      audio.coinClink();
      game.coinRing = { x: landed.x, y: landed.y, t: 0 };
      let nearest = null;
      let nearestDist = Infinity;
      for (const guard of game.guards) {
        const d = Math.hypot(guard.x - landed.x, guard.y - landed.y);
        if (d < COIN_LURE_RADIUS && d < nearestDist) {
          nearest = guard;
          nearestDist = d;
        }
      }
      if (nearest) {
        guardHearNoise(nearest, landed.x, landed.y);
        showMessage('Koin berdenting — penjaga itu mendekat…', 2);
      }
    }

    // --- relic pickup ---
    if (input.takeAction(ACTION_PICKUP)) {
      const i = nearRelic(game.player, game.relics);
      if (i !== null) {
        game.relics[i].taken = true;
        game.relicsGot += 1;
        game.score += SCORE_RELIC;
        audio.pickup();
        showMessage(
          game.relicsGot >= 3 ? 'Semua relik didapat — menuju pintu keluar!' : `Relik didapat (${game.relicsGot}/3)`,
          2,
        );
        if (game.relicsGot >= 3) game.exitOpen = true;
      }
    }

    // --- guards ---
    const alertedBefore = game.guards.filter((g) => g.state === GUARD_ALERTED).length;
    let maxDetection = 0;
    let wasCaught = false;
    for (const guard of game.guards) {
      const senses = guardSenses(guard, game.player, game.blockers);
      const result = stepGuard(guard, game.level.guards[guard.index].waypoints, senses, dt);
      maxDetection = Math.max(maxDetection, guard.detection);
      if (result === 'caught') wasCaught = true;
    }
    game.detection = maxDetection;
    const alertedAfter = game.guards.filter((g) => g.state === GUARD_ALERTED).length;
    if (alertedAfter > alertedBefore) {
      game.ghost = false;
      audio.alert();
      showMessage('TERLIHAT! Sembunyi!', 2);
    }
    if (wasCaught) {
      caught();
      return;
    }

    // --- exit ---
    if (game.exitOpen) {
      const d = Math.hypot(game.player.x - game.level.exit.x, game.player.y - game.level.exit.y);
      if (d <= EXIT_RANGE) completeLevel();
    }
  }

  function step(input, dt) {
    if (input.takeAction(ACTION_MUTE)) {
      game.muted = audio.toggleMute();
    }
    if (input.takeAction(ACTION_RESTART) && game.screen !== SCREEN_TITLE) {
      loadLevel(game.levelIndex);
      game.screen = SCREEN_PLAYING;
      showMessage('Level diulang.', 1.5);
      return;
    }
    if (input.takeAction(ACTION_PAUSE)) {
      if (game.screen === SCREEN_PLAYING) game.screen = SCREEN_PAUSED;
      else if (game.screen === SCREEN_PAUSED) game.screen = SCREEN_PLAYING;
    }

    switch (game.screen) {
      case SCREEN_TITLE:
        if (input.takeAction(ACTION_CONFIRM) || input.takeClick()) {
          audio.unlock();
          audio.startAmbient();
          loadLevel(0);
          game.score = 0;
          game.nerve = NERVE_START;
          game.screen = SCREEN_PLAYING;
        }
        break;
      case SCREEN_PLAYING:
        stepPlaying(input, dt);
        break;
      case SCREEN_PAUSED:
        if (input.takeAction(ACTION_CONFIRM)) game.screen = SCREEN_PLAYING;
        break;
      case SCREEN_LEVEL_COMPLETE:
        if (input.takeAction(ACTION_CONFIRM) || input.takeClick()) {
          if (game.levelIndex + 1 < LEVELS.length) {
            loadLevel(game.levelIndex + 1);
            game.screen = SCREEN_PLAYING;
          } else {
            game.screen = SCREEN_WIN;
            audio.win();
          }
        }
        break;
      case SCREEN_CAUGHT:
        game.caughtTimer -= dt;
        if (game.caughtTimer <= 0 || input.takeAction(ACTION_CONFIRM)) respawn();
        break;
      case SCREEN_GAME_OVER:
        if (input.takeAction(ACTION_CONFIRM)) {
          game.score = 0;
          game.nerve = NERVE_START;
          loadLevel(0);
          game.screen = SCREEN_PLAYING;
        }
        break;
      case SCREEN_WIN:
        if (input.takeAction(ACTION_CONFIRM)) {
          game.score = 0;
          game.nerve = NERVE_START;
          loadLevel(0);
          game.screen = SCREEN_TITLE;
        }
        break;
      default:
        break;
    }
  }

  // Plain snapshot for the HUD, the tests and the screenshots.
  function state() {
    return {
      screen: game.screen,
      level: game.levelIndex,
      levelName: game.level.name,
      relicsGot: game.relicsGot,
      relicsTotal: game.relics.length,
      nerve: game.nerve,
      score: game.score,
      best: game.best,
      elapsed: Math.round(game.elapsed * 10) / 10,
      detection: Math.round(game.detection),
      ghost: game.ghost,
      exitOpen: game.exitOpen,
      player: { x: Math.round(game.player.x), y: Math.round(game.player.y), coins: game.player.coins },
      guards: game.guards.map((g) => ({
        x: Math.round(g.x),
        y: Math.round(g.y),
        state: g.state,
        detection: Math.round(g.detection),
        sweeper: g.sweeper,
      })),
      muted: game.muted,
    };
  }

  // Test and staging helpers: move the player without walking there.
  function teleport(x, y) {    game.player.x = x;
    game.player.y = y;
    game.lastStepX = x;
    game.lastStepY = y;
  }

  return {
    game,
    loadLevel,
    step,
    state,
    teleport,
    coinDrawPosition: () => coinDrawPosition(game.player),
  };
}
