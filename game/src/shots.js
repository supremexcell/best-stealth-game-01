// Deterministic ?shot= staging. Each shot builds its scene through the
// game's own code — loadLevel, teleport, real guard states — then the
// renderer paints it, so a screenshot is a render of the game, never a
// mock-up. main.js paints twice and sets window.__shotReady.
import { GUARD_ALERTED, GUARD_SUSPICIOUS } from './guards.js';
import { SCREEN_LEVEL_COMPLETE, SCREEN_PLAYING, SCREEN_WIN } from './game.js';

export function stageShot(name, handle) {
  const game = handle.game;

  if (name === 'cover') {
    // Level 1 mid-play: one relic collected, Wulan sneaking behind a case,
    // a guard's cone sweeping past her, the exit glowing in the corner.
    handle.loadLevel(0);
    game.screen = SCREEN_PLAYING;
    game.relics[0].taken = true;
    game.relicsGot = 1;
    game.score = 100;
    game.elapsed = 47.5;
    handle.teleport(700, 185);
    game.player.sneaking = true;
    game.player.angle = Math.PI;
    const guard = game.guards[0];
    guard.x = 560;
    guard.y = 300;
    guard.angle = Math.PI / 2;
    guard.state = GUARD_SUSPICIOUS;
    guard.detection = 38;
    guard.investigateX = 700;
    guard.investigateY = 185;
    const guard2 = game.guards[1];
    guard2.x = 1000;
    guard2.y = 250;
    guard2.angle = Math.PI;
    game.detection = 38;
    game.exitOpen = false;
    game.message = 'Relik didapat (1/3)';
    game.messageTimer = 10;
    return { screen: SCREEN_PLAYING };
  }

  if (name === 'alert') {
    // The alarm moment: a guard at full meter chasing Wulan as she slips
    // into a shadow patch, detection bar full and red.
    handle.loadLevel(0);
    game.screen = SCREEN_PLAYING;
    game.relics[0].taken = true;
    game.relicsGot = 1;
    game.score = 100;
    game.elapsed = 62;
    handle.teleport(190, 500);
    game.player.sneaking = true;
    game.player.angle = Math.PI;
    game.player.inShadow = true;
    const guard = game.guards[0];
    guard.x = 280;
    guard.y = 470;
    guard.angle = Math.atan2(500 - 470, 190 - 280);
    guard.state = GUARD_ALERTED;
    guard.detection = 100;
    guard.lastSeenX = 190;
    guard.lastSeenY = 500;
    const guard2 = game.guards[1];
    guard2.x = 950;
    guard2.y = 320;
    guard2.angle = Math.PI * 0.75;
    game.detection = 100;
    game.ghost = false;
    game.message = 'TERLIHAT! Sembunyi!';
    game.messageTimer = 10;
    return { screen: SCREEN_PLAYING };
  }

  if (name === 'level3') {
    // Level 3 vista: four guards, several cones at once, relics and the
    // exit readable across the rooftop garden.
    handle.loadLevel(2);
    game.screen = SCREEN_PLAYING;
    game.elapsed = 88;
    game.score = 640;
    handle.teleport(420, 640);
    game.player.angle = -Math.PI / 2;
    const [g1, g2, g3, g4] = game.guards;
    g1.x = 260;
    g1.y = 300;
    g1.angle = Math.PI / 2;
    g2.x = 650;
    g2.y = 190;
    g2.angle = 0;
    g3.x = 1060;
    g3.y = 250;
    g3.angle = Math.PI;
    g4.x = 650;
    g4.y = 560;
    g4.angle = -Math.PI / 2;
    g4.state = GUARD_SUSPICIOUS;
    g4.detection = 22;
    game.detection = 22;
    game.message = 'Taman Atap — empat penjaga…';
    game.messageTimer = 10;
    return { screen: SCREEN_PLAYING };
  }

  if (name === 'win') {
    // The dawn screen after all three galleries, with a final score.
    handle.loadLevel(2);
    game.screen = SCREEN_WIN;
    game.relics.forEach((r) => {
      r.taken = true;
    });
    game.relicsGot = 3;
    game.exitOpen = true;
    game.score = 2140;
    game.best = 2140;
    game.levelScore = 740;
    game.elapsed = 132;
    game.message = '';
    game.messageTimer = 0;
    return { screen: SCREEN_WIN };
  }

  if (name === 'levelComplete') {
    handle.loadLevel(0);
    game.screen = SCREEN_LEVEL_COMPLETE;
    game.relicsGot = 3;
    game.score = 840;
    game.levelScore = 540;
    game.elapsed = 96;
    return { screen: SCREEN_LEVEL_COMPLETE };
  }

  return null;
}
