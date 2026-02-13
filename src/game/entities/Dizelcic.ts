import Phaser from 'phaser';

/**
 * Dizelcic - Diesel-powered melee enemy.
 * Slow, heavy bruiser that charges at the player.
 * Uses belt depth-sorting (Z = position.y).
 */
export class Dizelcic extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Rectangle;
  private health: number = 5;
  private speed: number = 80;
  private damage: number = 2;
  private isCharging: boolean = false;
  private chargeSpeed: number = 250;
  private chargeCooldown: number = 0;
  private chargeCooldownMax: number = 3000;

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

  update(delta: number, playerX: number, playerY: number): void {
    const dt = delta / 1000;

    // Belt depth-sort: Z = position.y
    this.setDepth(this.y);

    // Charge cooldown
    if (this.chargeCooldown > 0) {
      this.chargeCooldown -= delta;
    }

    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 150 && this.chargeCooldown <= 0 && !this.isCharging) {
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
  }

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
}
