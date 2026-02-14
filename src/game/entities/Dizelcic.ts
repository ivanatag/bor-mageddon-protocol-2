import Phaser from 'phaser';

/**
 * Dizelcic - Aggressive scout enemy.
 * "Aerosol Ambush" attack: deodorant spray mist triggers a temporary
 * "VHS Glitch" effect on the player.
 * Uses Classic Gore and belt depth-sorting (Z = position.y).
 */
export class Dizelcic extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Rectangle;
  private health: number = 5;
  private speed: number = 120;
  private damage: number = 2;
  private isCharging: boolean = false;
  private chargeSpeed: number = 250;
  private chargeCooldown: number = 0;
  private chargeCooldownMax: number = 3000;
  private sprayCooldown: number = 0;
  private sprayCooldownMax: number = 4000;
  private sprayMists: Phaser.GameObjects.Rectangle[] = [];
  private onGlitchPlayer: (() => void) | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    // Bulky body
    this.sprite = scene.add.rectangle(0, 0, 40, 56, 0x4a3728);
    this.sprite.setStrokeStyle(2, 0x6b4f3a);
    this.add(this.sprite);

    // Head
    const head = scene.add.circle(0, -24, 14, 0xd4a574);
    head.setStrokeStyle(2, 0x8b6914);
    this.add(head);

    // Diesel tank on back
    const tank = scene.add.rectangle(14, 0, 10, 20, 0x555555);
    tank.setStrokeStyle(1, 0x888888);
    this.add(tank);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(40, 56);
    body.setCollideWorldBounds(true);
  }

  setGlitchCallback(cb: () => void): void {
    this.onGlitchPlayer = cb;
  }

  update(delta: number, playerX: number, playerY: number): void {
    const dt = delta / 1000;

    // Belt depth-sort: Z = position.y
    this.setDepth(this.y);

    // Cooldowns
    if (this.chargeCooldown > 0) this.chargeCooldown -= delta;
    if (this.sprayCooldown > 0) this.sprayCooldown -= delta;

    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    this.setScale(dx < 0 ? -1 : 1, 1);

    // Aerosol Ambush at mid-range
    if (dist < 120 && dist > 40 && this.sprayCooldown <= 0) {
      this.aerosolAmbush(playerX, playerY);
    }
    // Charge at close range
    else if (dist < 150 && this.chargeCooldown <= 0 && !this.isCharging) {
      this.isCharging = true;
      this.sprite.fillColor = 0xff4400;
      this.scene.time.delayedCall(500, () => {
        this.isCharging = false;
        this.sprite.fillColor = 0x4a3728;
        this.chargeCooldown = this.chargeCooldownMax;
      });
    }

    const currentSpeed = this.isCharging ? this.chargeSpeed : this.speed;
    if (dist > 10) {
      this.x += (dx / dist) * currentSpeed * dt;
      this.y += (dy / dist) * currentSpeed * dt;
    }

    // Cleanup spray mists
    for (let i = this.sprayMists.length - 1; i >= 0; i--) {
      const mist = this.sprayMists[i];
      if (!mist.active) {
        this.sprayMists.splice(i, 1);
      }
    }
  }

  private aerosolAmbush(targetX: number, targetY: number): void {
    this.sprayCooldown = this.sprayCooldownMax;

    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Spray mist cloud
    const mist = this.scene.add.rectangle(
      this.x + (dx / dist) * 40, this.y + (dy / dist) * 40,
      50, 30, 0x88ff88, 0.4
    );
    this.scene.physics.add.existing(mist);
    const body = mist.body as Phaser.Physics.Arcade.Body;
    body.setVelocity((dx / dist) * 100, (dy / dist) * 100);
    body.setAllowGravity(false);
    this.sprayMists.push(mist);

    // Fade out and trigger glitch on contact
    this.scene.tweens.add({
      targets: mist,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 1500,
      onComplete: () => mist.destroy()
    });

    // Trigger VHS glitch effect if close enough
    if (dist < 80 && this.onGlitchPlayer) {
      this.onGlitchPlayer();
    }
  }

  getSprayMists(): Phaser.GameObjects.Rectangle[] { return this.sprayMists; }

  takeDamage(amount: number = 1): boolean {
    this.health -= amount;
    this.sprite.fillColor = 0xff0000;
    this.scene.time.delayedCall(100, () => {
      this.sprite.fillColor = 0x4a3728;
    });
    return this.health <= 0;
  }

  getDamage(): number {
    return this.damage;
  }

  getHealth(): number {
    return this.health;
  }

  destroy(fromScene?: boolean): void {
    this.sprayMists.forEach(m => m.destroy());
    this.sprayMists = [];
    super.destroy(fromScene);
  }
}
