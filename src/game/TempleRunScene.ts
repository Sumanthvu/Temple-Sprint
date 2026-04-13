// TempleRunScene.ts - Full Phaser 3 Game Scene
// 3-lane endless runner with jump, slide, lane-switch mechanics

import Phaser from "phaser";

const LANE_X = [133, 300, 467]; // Left, Center, Right (out of 600 width)
const GROUND_Y = 480;
const PLAYER_Y = 430;
const LANE_COUNT = 3;

export class TempleRunScene extends Phaser.Scene {
  // Player
  private player!: Phaser.GameObjects.Container;
  private playerBody!: Phaser.GameObjects.Rectangle;
  private playerLegs!: Phaser.GameObjects.Rectangle;
  private playerHead!: Phaser.GameObjects.Ellipse;
  private currentLane: number = 1;
  private targetLaneX: number = LANE_X[1];
  private isJumping: boolean = false;
  private isSliding: boolean = false;
  private playerVelY: number = 0;
  private isAlive: boolean = true;

  // Obstacles
  private obstacles!: Phaser.GameObjects.Group;
  private obstacleTimer!: Phaser.Time.TimerEvent;

  // Environment
  private bg!: Phaser.GameObjects.Rectangle;
  private ground!: Phaser.GameObjects.Rectangle;
  private bgColumns: Phaser.GameObjects.Rectangle[] = [];
  private bgTrees: Phaser.GameObjects.Graphics[] = [];
  private particles: Phaser.GameObjects.Graphics[] = [];
  private fogLayers: Phaser.GameObjects.Graphics[] = [];
  private railLeft!: Phaser.GameObjects.Rectangle;
  private railRight!: Phaser.GameObjects.Rectangle;
  private floorTiles: Phaser.GameObjects.Rectangle[] = [];
  private torches: Phaser.GameObjects.Container[] = [];

  // Game state
  private score: number = 0;
  private speed: number = 280;
  private maxSpeed: number = 620;
  private speedIncrement: number = 8;
  private scoreText!: Phaser.GameObjects.Text;
  private speedText!: Phaser.GameObjects.Text;
  private distanceTraveled: number = 0;
  private lastObstacleLane: number = -1;

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: Record<string, Phaser.Input.Keyboard.Key>;
  private swipeStartX: number = 0;
  private swipeStartY: number = 0;
  private isPointerDown: boolean = false;

  // Callbacks
  private onScoreUpdate!: (score: number) => void;
  private onGameOver!: (score: number) => void;

  constructor() {
    super({ key: "TempleRunScene" });
  }

  init(data: { onScoreUpdate: (s: number) => void; onGameOver: (s: number) => void }) {
    this.onScoreUpdate = data.onScoreUpdate;
    this.onGameOver = data.onGameOver;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.isAlive = true;
    this.score = 0;
    this.speed = 280;
    this.distanceTraveled = 0;
    this.currentLane = 1;
    this.targetLaneX = LANE_X[1];

    this.buildBackground(W, H);
    this.buildLaneTrack(W, H);
    this.buildPlayer();
    this.buildObstacles();
    this.buildHUD(W);
    this.setupInput();
    this.startObstacleTimer();
  }

  // ─────────────────────────── BACKGROUND ───────────────────────────
  private buildBackground(W: number, H: number) {
    // Sky gradient (fake with rects)
    this.add.rectangle(W / 2, H / 2, W, H, 0x0d0a1a);

    // Distant jungle canopy layers
    const canopyColors = [0x1a2d1a, 0x162616, 0x122012];
    [H * 0.25, H * 0.38, H * 0.5].forEach((y, i) => {
      const g = this.add.graphics();
      g.fillStyle(canopyColors[i], 0.9);
      // Draw wavy tree tops
      for (let x = 0; x < W; x += 40 + i * 20) {
        const w = 50 + Math.sin(x) * 20 + i * 15;
        const h = 80 + Math.cos(x * 0.5) * 30 + i * 20;
        g.fillEllipse(x + w / 2, y, w, h);
      }
      this.bgTrees.push(g);
    });

    // Temple pillars in background
    const pillarColor = 0x3d2b1f;
    for (let i = 0; i < 6; i++) {
      const x = (W / 5) * i + 60;
      const pillarH = 120 + (i % 3) * 40;
      const p = this.add.rectangle(x, H * 0.55 - pillarH / 2, 22, pillarH, pillarColor);
      p.setAlpha(0.6);
      this.bgColumns.push(p);
      // Pillar cap
      this.add.rectangle(x, H * 0.55 - pillarH - 8, 30, 16, 0x5a3e2b).setAlpha(0.6);
    }

    // Atmospheric fog
    for (let i = 0; i < 3; i++) {
      const fg = this.add.graphics();
      this.fogLayers.push(fg);
    }

    // Particle dust specs
    for (let i = 0; i < 20; i++) {
      const g = this.add.graphics();
      g.fillStyle(0xffd700, 0.4);
      g.fillCircle(
        Phaser.Math.Between(0, W),
        Phaser.Math.Between(50, H * 0.7),
        Phaser.Math.Between(1, 3)
      );
      this.particles.push(g);
    }
  }

  // ─────────────────────────── TRACK ───────────────────────────────
  private buildLaneTrack(W: number, H: number) {
    // Ground base
    this.ground = this.add.rectangle(W / 2, H - 40, W, 140, 0x2d1f0e);

    // Lane floor tiles (scrolling)
    for (let i = 0; i < 12; i++) {
      const tile = this.add.rectangle(
        W / 2,
        GROUND_Y + 20,
        260,
        12,
        i % 2 === 0 ? 0x4a3520 : 0x3d2b18
      );
      tile.setY(GROUND_Y - 10 + i * 45);
      this.floorTiles.push(tile);
    }

    // Side rails (perspective lines)
    this.railLeft = this.add.rectangle(168, GROUND_Y - 30, 6, 200, 0x8b6914).setAlpha(0.7);
    this.railRight = this.add.rectangle(432, GROUND_Y - 30, 6, 200, 0x8b6914).setAlpha(0.7);

    // Lane dividers
    [133, 300, 467].forEach((lx) => {
      const div = this.add.graphics();
      div.lineStyle(2, 0x6b4c2a, 0.4);
      div.strokeRect(lx - 66, GROUND_Y - 80, 132, 120);
    });

    // Torches on sides
    for (let i = 0; i < 3; i++) {
      this.torches.push(this.createTorch(80, GROUND_Y - 80 - i * 200));
      this.torches.push(this.createTorch(520, GROUND_Y - 80 - i * 200));
    }
  }

  private createTorch(x: number, y: number): Phaser.GameObjects.Container {
    const c = this.add.container(x, y);
    const pole = this.add.rectangle(0, 0, 6, 40, 0x6b4c2a);
    const bowl = this.add.ellipse(0, -22, 14, 8, 0x8b6914);
    const flame = this.add.ellipse(0, -30, 10, 16, 0xff6600);
    c.add([pole, bowl, flame]);
    // Animate flame
    this.tweens.add({
      targets: flame,
      scaleY: 0.6,
      scaleX: 1.3,
      alpha: 0.7,
      duration: 150 + Math.random() * 200,
      yoyo: true,
      repeat: -1,
    });
    return c;
  }

  // ─────────────────────────── PLAYER ──────────────────────────────
  private buildPlayer() {
    this.player = this.add.container(LANE_X[1], PLAYER_Y);

    // Shadow
    const shadow = this.add.ellipse(0, 28, 40, 12, 0x000000, 0.3);

    // Body parts
    this.playerLegs = this.add.rectangle(0, 18, 20, 24, 0xd4a843);
    this.playerBody = this.add.rectangle(0, -4, 24, 30, 0x8b2500);
    this.playerHead = this.add.ellipse(0, -24, 22, 22, 0xd4a843);

    // Eyes
    const eyeL = this.add.ellipse(-5, -25, 5, 5, 0x1a0a00);
    const eyeR = this.add.ellipse(5, -25, 5, 5, 0x1a0a00);

    // Arms
    const armL = this.add.rectangle(-15, -2, 8, 20, 0xd4a843).setRotation(-0.3);
    const armR = this.add.rectangle(15, -2, 8, 20, 0xd4a843).setRotation(0.3);

    this.player.add([shadow, this.playerLegs, this.playerBody, armL, armR, this.playerHead, eyeL, eyeR]);

    // Running animation on legs
    this.tweens.add({
      targets: this.playerLegs,
      scaleX: 1.2,
      duration: 100,
      yoyo: true,
      repeat: -1,
    });
  }

  // ─────────────────────────── OBSTACLES ───────────────────────────
  private buildObstacles() {
    this.obstacles = this.add.group();
  }

  private startObstacleTimer() {
    this.obstacleTimer = this.time.addEvent({
      delay: 1500,
      callback: this.spawnObstacle,
      callbackScope: this,
      loop: true,
    });
  }

  private spawnObstacle() {
    if (!this.isAlive) return;

    const types = ["block", "low", "gap"];
    const type = Phaser.Utils.Array.GetRandom(types) as string;

    // Pick lane - avoid same lane twice in a row occasionally
    let lane = Phaser.Math.Between(0, LANE_COUNT - 1);
    if (Math.random() > 0.7) lane = this.lastObstacleLane === lane ? (lane + 1) % 3 : lane;
    this.lastObstacleLane = lane;

    const x = LANE_X[lane];
    const spawnY = -80;

    let obs: Phaser.GameObjects.Container | null = null;

    if (type === "block") {
      // Tall block - must jump
      const c = this.add.container(x, spawnY);
      const base = this.add.rectangle(0, 0, 50, 60, 0x5a3e1a);
      const top = this.add.rectangle(0, -35, 56, 12, 0x7a5a2a);
      const detail = this.add.rectangle(0, -5, 40, 6, 0x4a3010);
      c.add([base, top, detail]);
      c.setData("type", "block");
      obs = c;
    } else if (type === "low") {
      // Low bar - must slide
      const c = this.add.container(x, spawnY);
      const bar = this.add.rectangle(0, 15, 55, 18, 0x8b1a00);
      const postL = this.add.rectangle(-25, 0, 8, 35, 0x6b3a1a);
      const postR = this.add.rectangle(25, 0, 8, 35, 0x6b3a1a);
      c.add([postL, postR, bar]);
      c.setData("type", "low");
      obs = c;
    } else {
      // Regular block obstacle
      const c = this.add.container(x, spawnY);
      const stone = this.add.rectangle(0, 0, 45, 45, 0x4a3a2a);
      const crack = this.add.rectangle(-5, -8, 3, 20, 0x3a2a1a);
      c.add([stone, crack]);
      c.setData("type", "block");
      obs = c;
    }

    this.obstacles.add(obs);
  }

  // ─────────────────────────── HUD ─────────────────────────────────
  private buildHUD(W: number) {
    // Score
    this.scoreText = this.add
      .text(W / 2, 20, "0", {
        fontFamily: "'Courier New', monospace",
        fontSize: "36px",
        color: "#FFD700",
        stroke: "#000000",
        strokeThickness: 4,
        shadow: { blur: 8, color: "#ff6600", fill: true },
      })
      .setOrigin(0.5, 0);

    // Speed badge
    this.speedText = this.add
      .text(W - 12, 20, "SPEED x1.0", {
        fontFamily: "'Courier New', monospace",
        fontSize: "12px",
        color: "#ff9900",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(1, 0);

    // Control hints
    this.add
      .text(W / 2, 560, "← → LANES  |  ↑ JUMP  |  ↓ SLIDE", {
        fontFamily: "'Courier New', monospace",
        fontSize: "11px",
        color: "#886644",
      })
      .setOrigin(0.5, 1);
  }

  // ─────────────────────────── INPUT ───────────────────────────────
  private setupInput() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasdKeys = {
      W: this.input.keyboard!.addKey("W"),
      A: this.input.keyboard!.addKey("A"),
      S: this.input.keyboard!.addKey("S"),
      D: this.input.keyboard!.addKey("D"),
    };

    // Touch / swipe
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      this.swipeStartX = p.x;
      this.swipeStartY = p.y;
      this.isPointerDown = true;
    });

    this.input.on("pointerup", (p: Phaser.Input.Pointer) => {
      if (!this.isPointerDown) return;
      this.isPointerDown = false;
      const dx = p.x - this.swipeStartX;
      const dy = p.y - this.swipeStartY;
      const minSwipe = 30;

      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > minSwipe) this.moveRight();
        else if (dx < -minSwipe) this.moveLeft();
      } else {
        if (dy < -minSwipe) this.jump();
        else if (dy > minSwipe) this.slide();
      }
    });
  }

  // ─────────────────────────── MOVEMENT ────────────────────────────
  private moveLeft() {
    if (!this.isAlive) return;
    if (this.currentLane > 0) {
      this.currentLane--;
      this.targetLaneX = LANE_X[this.currentLane];
    }
  }

  private moveRight() {
    if (!this.isAlive) return;
    if (this.currentLane < LANE_COUNT - 1) {
      this.currentLane++;
      this.targetLaneX = LANE_X[this.currentLane];
    }
  }

  private jump() {
    if (!this.isAlive || this.isJumping || this.isSliding) return;
    this.isJumping = true;
    this.playerVelY = -520;
    this.tweens.add({
      targets: this.player,
      scaleX: 1.05,
      duration: 80,
      yoyo: true,
    });
  }

  private slide() {
    if (!this.isAlive || this.isJumping || this.isSliding) return;
    this.isSliding = true;
    this.player.setScale(1, 0.55);
    this.player.setY(PLAYER_Y + 20);
    this.time.delayedCall(500, () => {
      this.isSliding = false;
      this.player.setScale(1, 1);
      this.player.setY(PLAYER_Y);
    });
  }

  // ─────────────────────────── UPDATE LOOP ─────────────────────────
  update(time: number, delta: number) {
    if (!this.isAlive) return;

    const dt = delta / 1000;

    // Input polling (keyboard)
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left!) || Phaser.Input.Keyboard.JustDown(this.wasdKeys.A)) this.moveLeft();
    if (Phaser.Input.Keyboard.JustDown(this.cursors.right!) || Phaser.Input.Keyboard.JustDown(this.wasdKeys.D)) this.moveRight();
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up!) || Phaser.Input.Keyboard.JustDown(this.wasdKeys.W)) this.jump();
    if (Phaser.Input.Keyboard.JustDown(this.cursors.down!) || Phaser.Input.Keyboard.JustDown(this.wasdKeys.S)) this.slide();

    // Lane lerp
    const px = this.player.x;
    this.player.setX(px + (this.targetLaneX - px) * Math.min(dt * 14, 1));

    // Jump physics
    if (this.isJumping) {
      this.playerVelY += 1200 * dt;
      this.player.setY(this.player.y + this.playerVelY * dt);
      if (this.player.y >= PLAYER_Y) {
        this.player.setY(PLAYER_Y);
        this.isJumping = false;
        this.playerVelY = 0;
      }
    }

    // Speed ramp
    this.speed = Math.min(this.maxSpeed, this.speed + this.speedIncrement * dt);
    this.distanceTraveled += this.speed * dt;
    this.score = Math.floor(this.distanceTraveled / 10);
    this.scoreText.setText(String(this.score));
    this.speedText.setText(`SPEED x${(this.speed / 280).toFixed(1)}`);
    this.onScoreUpdate(this.score);

    // Scroll obstacles
    const toDestroy: Phaser.GameObjects.GameObject[] = [];
    this.obstacles.getChildren().forEach((obj) => {
      const c = obj as Phaser.GameObjects.Container;
      c.setY(c.y + this.speed * dt);

      // Collision
      if (this.isAlive) {
        const obsType = c.getData("type") as string;
        const playerAboveGround = this.player.y < PLAYER_Y - 30; // jumped
        const playerSliding = this.isSliding;

        const dx = Math.abs(c.x - this.player.x);
        const dy = Math.abs(c.y - this.player.y);

        const hitW = obsType === "low" ? 46 : 42;
        const hitH = obsType === "low" ? 28 : 52;

        if (dx < hitW / 2 + 10 && dy < hitH / 2 + 10) {
          // Can jump over block, slide under low
          if (obsType === "block" && playerAboveGround) {
            // safe
          } else if (obsType === "low" && playerSliding) {
            // safe
          } else {
            this.triggerDeath();
          }
        }
      }

      if (c.y > 620) toDestroy.push(c);
    });
    toDestroy.forEach((o) => {
      this.obstacles.remove(o, true, true);
    });

    // Scroll floor tiles
    this.floorTiles.forEach((tile) => {
      tile.setY(tile.y + this.speed * dt * 0.5);
      if (tile.y > GROUND_Y + 60) tile.setY(GROUND_Y - 60 * this.floorTiles.length + 20);
    });

    // Animate background columns slowly
    this.bgColumns.forEach((col) => {
      col.setY(col.y + 20 * dt);
      if (col.y > 400) col.setY(-60);
    });

    // Animate dust particles
    this.particles.forEach((p, i) => {
      p.setY(p.y + (10 + i * 2) * dt);
      if (p.y > this.scale.height) p.setY(-10);
      p.setAlpha(0.3 + Math.sin(time * 0.002 + i) * 0.3);
    });

    // Obstacle spawn speed
    if (this.obstacleTimer) {
      const newDelay = Math.max(700, 1500 - (this.score / 5));
      if (Math.abs(this.obstacleTimer.delay - newDelay) > 50) {
        this.obstacleTimer.delay = newDelay;
      }
    }
  }

  // ─────────────────────────── DEATH ───────────────────────────────
  private triggerDeath() {
    if (!this.isAlive) return;
    this.isAlive = false;

    // Camera shake
    this.cameras.main.shake(400, 0.015);

    // Death animation
    this.tweens.add({
      targets: this.player,
      rotation: Math.PI * 1.5,
      y: this.player.y + 30,
      alpha: 0,
      duration: 600,
      ease: "Power2",
    });

    // Flash red
    const flash = this.add.rectangle(
      this.scale.width / 2,
      this.scale.height / 2,
      this.scale.width,
      this.scale.height,
      0xff0000,
      0.35
    );
    this.tweens.add({ targets: flash, alpha: 0, duration: 500 });

    this.obstacleTimer.remove();

    this.time.delayedCall(700, () => {
      this.onGameOver(this.score);
    });
  }

  // Allow external restart
  restartGame() {
    this.scene.restart();
  }
}
