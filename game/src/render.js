// All canvas drawing: the gallery floor, walls, cases, shadows, vision
// cones, the player and the guards, the HUD, and every screen. Nothing here
// changes game state — it only paints what game.js holds.
import { FIELD_H, FIELD_W, PALETTE } from './config.js';
import { coneOutline } from './vision.js';
import { GUARD_ALERTED, GUARD_SUSPICIOUS } from './guards.js';
import {
  SCREEN_CAUGHT,
  SCREEN_GAME_OVER,
  SCREEN_LEVEL_COMPLETE,
  SCREEN_PAUSED,
  SCREEN_PLAYING,
  SCREEN_TITLE,
  SCREEN_WIN,
} from './game.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawStar(ctx, x, y, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? radius : radius * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function drawFloor(ctx, time) {
  // Warm parquet: alternating planks with a faint grain line.
  const tile = 64;
  for (let y = 0; y < FIELD_H; y += tile) {
    for (let x = 0; x < FIELD_W; x += tile) {
      const even = ((x + y) / tile) % 2 === 0;
      ctx.fillStyle = even ? PALETTE.floorA : PALETTE.floorB;
      ctx.fillRect(x, y, tile, tile);
    }
  }
  ctx.strokeStyle = PALETTE.floorLine;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.35;
  for (let x = 0; x <= FIELD_W; x += tile) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, FIELD_H);
    ctx.stroke();
  }
  for (let y = 0; y <= FIELD_H; y += tile) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(FIELD_W, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // A soft dusk vignette so the middle reads brighter than the edges.
  const vignette = ctx.createRadialGradient(640, 360, 240, 640, 360, 760);
  vignette.addColorStop(0, 'rgba(255, 190, 110, 0.05)');
  vignette.addColorStop(1, 'rgba(10, 8, 28, 0.35)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, FIELD_W, FIELD_H);
  void time;
}

function drawWalls(ctx, level) {
  for (const wall of level.walls) {
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.fillStyle = PALETTE.wallTop;
    ctx.fillRect(wall.x, wall.y, wall.w, 4);
  }
}

function drawCases(ctx, level) {
  for (const c of level.cases) {
    ctx.fillStyle = 'rgba(20, 24, 40, 0.9)';
    ctx.fillRect(c.x - 3, c.y - 3, c.w + 6, c.h + 6);
    ctx.fillStyle = PALETTE.caseGlass;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.globalAlpha = 1;
    // A little heirloom silhouette inside the glass.
    ctx.fillStyle = '#5d4a2a';
    ctx.beginPath();
    ctx.arc(c.x + c.w / 2, c.y + c.h / 2 - 4, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(c.x + c.w / 2 - 12, c.y + c.h / 2 + 4, 24, 10);
    ctx.strokeStyle = PALETTE.caseGold;
    ctx.lineWidth = 2;
    ctx.strokeRect(c.x, c.y, c.w, c.h);
  }
}

function drawCrates(ctx, level) {
  for (const c of level.crates) {
    ctx.fillStyle = '#6e4f2c';
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.strokeStyle = '#4a3319';
    ctx.lineWidth = 3;
    ctx.strokeRect(c.x + 2, c.y + 2, c.w - 4, c.h - 4);
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(c.x + c.w, c.y + c.h);
    ctx.moveTo(c.x + c.w, c.y);
    ctx.lineTo(c.x, c.y + c.h);
    ctx.stroke();
  }
}

function drawShadows(ctx, level) {
  for (const s of level.shadows) {
    ctx.fillStyle = PALETTE.shadow;
    roundRect(ctx, s.x, s.y, s.w, s.h, 18);
    ctx.fill();
    ctx.fillStyle = 'rgba(190, 200, 235, 0.35)';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BAYANGAN — AMAN', s.x + s.w / 2, s.y + s.h - 10);
  }
}

function drawExit(ctx, level, exitOpen, time) {
  const { x, y } = level.exit;
  const pulse = exitOpen ? 0.6 + 0.4 * Math.sin(time * 4) : 0.25;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = PALETTE.exitGlow;
  ctx.beginPath();
  ctx.arc(x, y, 46, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = exitOpen ? PALETTE.exit : '#3a5a44';
  roundRect(ctx, x - 26, y - 18, 52, 36, 6);
  ctx.fill();
  ctx.strokeStyle = exitOpen ? '#c9f5d8' : '#6b7a6e';
  ctx.lineWidth = 2;
  roundRect(ctx, x - 26, y - 18, 52, 36, 6);
  ctx.stroke();
  ctx.fillStyle = '#eaf7ee';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(exitOpen ? 'KELUAR' : 'TERKUNCI', x, y + 4);
}

function drawRelics(ctx, relics, time) {
  for (const relic of relics) {
    if (relic.taken) continue;
    const bob = Math.sin(time * 2 + relic.x) * 3;
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = PALETTE.relicGlow;
    ctx.beginPath();
    ctx.arc(relic.x, relic.y + bob, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    drawStar(ctx, relic.x, relic.y + bob, 13, PALETTE.relic);
    ctx.strokeStyle = '#8a6a1d';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(relic.x, relic.y + bob, 18, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawCones(ctx, guards, blockers) {
  for (const guard of guards) {
    const alerted = guard.state === GUARD_ALERTED;
    const suspicious = guard.state === GUARD_SUSPICIOUS;
    const points = coneOutline(guard.x, guard.y, guard.angle, guard.range, guard.halfAngle, blockers);
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.closePath();
    ctx.fillStyle = alerted ? PALETTE.coneAlert : PALETTE.cone;
    ctx.fill();
    ctx.strokeStyle = alerted ? 'rgba(255, 90, 90, 0.7)' : suspicious ? 'rgba(255, 180, 80, 0.6)' : PALETTE.coneEdge;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

function drawGuard(ctx, guard, time) {
  const bob = Math.sin(guard.stepPhase) * 1.5;
  // Body: a night guard in a dark red uniform, visible against the floor.
  ctx.fillStyle = PALETTE.guardDark;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y + 2, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.guard;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y + bob * 0.4, 14, 0, Math.PI * 2);
  ctx.fill();
  // Cap brim points where the guard looks.
  ctx.fillStyle = '#2c1e1e';
  ctx.beginPath();
  ctx.arc(guard.x + Math.cos(guard.angle) * 8, guard.y + Math.sin(guard.angle) * 8, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f5ead2';
  ctx.beginPath();
  ctx.arc(guard.x + Math.cos(guard.angle) * 12, guard.y + Math.sin(guard.angle) * 12, 2.5, 0, Math.PI * 2);
  ctx.fill();
  // Sweeper gets a gold band so the faster guard reads at a glance.
  if (guard.sweeper) {
    ctx.strokeStyle = PALETTE.relic;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 17, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Detection arc above the head.
  if (guard.detection > 2) {
    ctx.strokeStyle = guard.detection >= 100 ? PALETTE.danger : PALETTE.hudGold;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y - 24, 10, -Math.PI / 2, -Math.PI / 2 + (guard.detection / 100) * Math.PI * 2);
    ctx.stroke();
  }
  // "?" when curious, "!" when chasing.
  if (guard.state === GUARD_SUSPICIOUS || guard.state === GUARD_ALERTED) {
    ctx.fillStyle = guard.state === GUARD_ALERTED ? PALETTE.danger : PALETTE.hudGold;
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(guard.state === GUARD_ALERTED ? '!' : '?', guard.x, guard.y - 34);
  }
  void time;
}

function drawPlayer(ctx, player, time) {
  const bob = player.moving ? Math.sin(player.stepPhase) * 1.5 : 0;
  // Soft shadow under the feet.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(player.x, player.y + 12, 13, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.playerCoat;
  ctx.beginPath();
  ctx.arc(player.x, player.y + bob * 0.4, player.sneaking ? 12 : 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.player;
  ctx.beginPath();
  ctx.arc(player.x, player.y + bob * 0.4 - 2, 8, 0, Math.PI * 2);
  ctx.fill();
  // Hair bun + the direction she faces.
  ctx.fillStyle = '#3a2a1a';
  ctx.beginPath();
  ctx.arc(player.x - Math.cos(player.angle) * 4, player.y - Math.sin(player.angle) * 4 - 4, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.player;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(player.x + Math.cos(player.angle) * 16, player.y + Math.sin(player.angle) * 16);
  ctx.stroke();
  if (player.sneaking) {
    ctx.fillStyle = 'rgba(245, 234, 210, 0.85)';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('mengendap…', player.x, player.y - 22);
  }
  void time;
}

function drawCoin(ctx, coinPos, coinRing) {
  if (coinPos) {
    ctx.fillStyle = PALETTE.relic;
    ctx.beginPath();
    ctx.arc(coinPos.x, coinPos.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8a6a1d';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  if (coinRing) {
    const k = coinRing.t / 1.2;
    ctx.strokeStyle = `rgba(255, 215, 94, ${1 - k})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(coinRing.x, coinRing.y, 8 + k * 40, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawHud(ctx, game) {
  ctx.fillStyle = PALETTE.hudBg;
  roundRect(ctx, 8, 8, FIELD_W - 16, 46, 10);
  ctx.fill();
  ctx.fillStyle = PALETTE.hudText;
  ctx.textAlign = 'left';
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText(`${game.level.name}  ·  ${game.levelIndex + 1}/3`, 22, 30);
  ctx.font = '15px system-ui, sans-serif';
  const relicText = `Relik ${'★'.repeat(game.relicsGot)}${'☆'.repeat(3 - game.relicsGot)} ${game.relicsGot}/3`;
  ctx.fillStyle = PALETTE.hudGold;
  ctx.fillText(relicText, 300, 30);
  ctx.fillStyle = game.nerve <= 1 ? PALETTE.danger : PALETTE.hudText;
  ctx.fillText(`Nyali ${'♥'.repeat(game.nerve)}${'♡'.repeat(3 - game.nerve)}`, 480, 30);
  const minutes = Math.floor(game.elapsed / 60);
  const seconds = Math.floor(game.elapsed % 60);
  ctx.fillStyle = PALETTE.hudText;
  ctx.fillText(`Waktu ${minutes}:${String(seconds).padStart(2, '0')}`, 640, 30);
  ctx.fillText(`Koin ${'●'.repeat(game.player.coins)}${'○'.repeat(3 - game.player.coins)}`, 800, 30);
  ctx.fillStyle = PALETTE.hudGold;
  ctx.fillText(`Skor ${game.score}`, 960, 30);
  ctx.fillStyle = PALETTE.hudText;
  ctx.textAlign = 'right';
  ctx.fillText(`Terbaik ${game.best}`, FIELD_W - 22, 30);

  // Detection eye + meter, centred under the bar.
  const meterW = 320;
  const meterX = (FIELD_W - meterW) / 2;
  const meterY = 62;
  ctx.fillStyle = PALETTE.hudBg;
  roundRect(ctx, meterX - 34, meterY - 4, meterW + 68, 26, 8);
  ctx.fill();
  ctx.font = '16px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = game.detection >= 100 ? PALETTE.danger : game.detection >= 50 ? '#ffb450' : PALETTE.hudText;
  ctx.fillText('👁', meterX - 28, meterY + 15);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  roundRect(ctx, meterX, meterY, meterW, 14, 7);
  ctx.fill();
  const fill = Math.max(0, Math.min(1, game.detection / 100));
  ctx.fillStyle = game.detection >= 100 ? PALETTE.danger : game.detection >= 50 ? '#ffb450' : '#7be2a0';
  if (fill > 0) {
    roundRect(ctx, meterX, meterY, meterW * fill, 14, 7);
    ctx.fill();
  }
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = '11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(game.detection >= 100 ? 'TERLIHAT!' : game.detection >= 50 ? 'Hampir ketahuan…' : 'Tak terlihat', meterX + meterW / 2, meterY + 32);

  // Toast message.
  if (game.messageTimer > 0 && game.message) {
    ctx.fillStyle = PALETTE.hudBg;
    const tw = ctx.measureText(game.message).width + 32;
    roundRect(ctx, (FIELD_W - tw) / 2, FIELD_H - 52, tw, 30, 8);
    ctx.fill();
    ctx.fillStyle = PALETTE.hudText;
    ctx.font = '14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(game.message, FIELD_W / 2, FIELD_H - 32);
  }
}

function dimOverlay(ctx, alpha) {
  ctx.fillStyle = `rgba(8, 6, 20, ${alpha})`;
  ctx.fillRect(0, 0, FIELD_W, FIELD_H);
}

function panel(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(16, 12, 30, 0.92)';
  roundRect(ctx, 340, 150, 600, 420, 16);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  roundRect(ctx, 340, 150, 600, 420, 16);
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.font = 'bold 34px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, 640, 205);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = '16px system-ui, sans-serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, 640, 250 + i * 30);
  });
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function draw(game, time) {
    ctx.clearRect(0, 0, FIELD_W, FIELD_H);
    if (game.screen === SCREEN_TITLE) {
      drawTitle(game);
      return;
    }
    drawFloor(ctx, time);
    drawShadows(ctx, game.level);
    drawExit(ctx, game.level, game.exitOpen, time);
    drawRelics(ctx, game.relics, time);
    drawCases(ctx, game.level);
    drawCrates(ctx, game.level);
    drawCones(ctx, game.guards, game.blockers);
    drawWalls(ctx, game.level);
    drawCoin(ctx, game._coinDraw, game.coinRing);
    for (const guard of game.guards) drawGuard(ctx, guard, time);
    drawPlayer(ctx, game.player, time);
    drawHud(ctx, game);

    if (game.screen === SCREEN_PAUSED) {
      dimOverlay(ctx, 0.55);
      panel(ctx, 'Jeda', ['WASD / panah — bergerak', 'Shift — mengendap (lebih pelan, lebih sulit terlihat)', 'Klik / Q — lempar koin untuk memancing penjaga', 'E — ambil relik · P — lanjut · R — ulang level · M — bisu', 'Enter — lanjut bermain'], PALETTE.hudGold);
    } else if (game.screen === SCREEN_LEVEL_COMPLETE) {
      dimOverlay(ctx, 0.45);
      const timeBonus = Math.max(0, Math.round((game.level.parTime - game.elapsed) * 5));
      panel(
        ctx,
        `${game.level.name} — selesai!`,
        [
          `Bonus waktu: +${timeBonus}`,
          game.ghost ? 'Bonus hantu (tak pernah ketahuan): +500' : 'Bonus hantu: — (sempat ketahuan)',
          `Skor level ini: +${game.levelScore}`,
          `Skor total: ${game.score}`,
          '',
          'Enter — galeri berikutnya',
        ],
        PALETTE.exitGlow,
      );
    } else if (game.screen === SCREEN_CAUGHT) {
      dimOverlay(ctx, 0.35);
      ctx.fillStyle = PALETTE.danger;
      ctx.font = 'bold 52px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('KETAHUAN!', 640, 340);
      ctx.fillStyle = PALETTE.ink;
      ctx.font = '18px system-ui, sans-serif';
      ctx.fillText(`Nyali tersisa: ${game.nerve} — kembali ke awal galeri…`, 640, 380);
    } else if (game.screen === SCREEN_GAME_OVER) {
      dimOverlay(ctx, 0.7);
      panel(
        ctx,
        'Malam berakhir',
        ['Tiga kali ketahuan — fajar datang tanpa relik.', `Skor: ${game.score} · Terbaik: ${game.best}`, '', 'Enter — coba lagi dari Galeri Senja'],
        PALETTE.danger,
      );
    } else if (game.screen === SCREEN_WIN) {
      dimOverlay(ctx, 0.45);
      panel(
        ctx,
        'Fajar menyingsing',
        ['Wulan keluar dari museum dengan tiga galeri di belakangnya,', 'relik-relik bintang aman di tasnya — dan tak satu pun penjaga', 'tahu ia pernah ada di sana.', '', `Skor akhir: ${game.score} · Terbaik: ${game.best}`, '', 'Enter — kembali ke judul'],
        PALETTE.hudGold,
      );
    }
  }

  function drawTitle(game) {
    // A dimmed gallery behind the title, so the game is visible at once.
    drawFloor(ctx, 0);
    drawShadows(ctx, game.level);
    drawExit(ctx, game.level, true, 0);
    drawRelics(ctx, game.relics, 0);
    drawCases(ctx, game.level);
    drawWalls(ctx, game.level);
    dimOverlay(ctx, 0.62);
    ctx.fillStyle = PALETTE.hudGold;
    ctx.font = 'bold 64px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('GALERI SENJA', 640, 150);
    ctx.fillStyle = PALETTE.ink;
    ctx.font = 'italic 20px Georgia, serif';
    ctx.fillText('Seorang magang, tiga relik bintang, dan penjaga malam yang tak boleh melihatmu.', 640, 190);
    ctx.font = '16px system-ui, sans-serif';
    const lines = [
      'WASD / panah — bergerak      Shift — mengendap (pelan, sulit terlihat)',
      'Klik / Q — lempar koin, pancing penjaga ke arah dentingnya      E — ambil relik',
      'Kumpulkan 3 relik di tiap galeri, lalu capai pintu KELUAR tanpa ketahuan.',
      'Bersembunyi di balik etalase dan peti, dan di petak bayangan yang gelap.',
      'Tiga kali ketahuan, malam berakhir. Tak pernah ketahuan: bonus hantu +500.',
    ];
    lines.forEach((line, i) => ctx.fillText(line, 640, 250 + i * 28));
    ctx.fillStyle = PALETTE.hudGold;
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText('Klik atau tekan Enter untuk mulai', 640, 440);
    ctx.fillStyle = PALETTE.ink;
    ctx.font = '15px system-ui, sans-serif';
    ctx.fillText(`Skor terbaik: ${game.best}      P — jeda · R — ulang level · M — bisu`, 640, 480);
  }

  return { draw };
}
