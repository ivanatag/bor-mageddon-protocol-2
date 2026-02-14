import Phaser from 'phaser';

/**
 * CorruptedMiner - Level 1 shambling tank unit.
 * Slow, high-damage overhead pickaxe slam with guaranteed player knockdown.
 * Uses Classic Gore (red blood) and belt depth-sorting (Z = position.y).
 */
export class CorruptedMiner extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Rectangle;
  private pickaxe: Phaser.GameObjects.Rectangle;
  private health: number = 8;
  private speed: number = 50;
  private damage: number = 4;
  private isSlammingDown: boolean = false;
  private slamCooldown: number = 0;
  private slamCooldownMax: number = 3500;
  private slamWindup: number = 800;
  private causesKnockdown: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    // Bulky miner body
    this.sprite = scene.add.rectangle(0, 0, 48, 64, 0x3a3a3a);
    this.sprite.setStrokeStyle(2, 0x555555);
    this.add(this.sprite);

    // Hard hat
    const hat = scene.add.rectangle(0, -38, 36, 12, 0xccaa00);
    hat.setStrokeStyle(1, 0x887700);
    this.add(hat);

    // Head
    const head = scene.add.circle(0, -26, 14, 0x8b7355);
    head.setStrokeStyle(2, 0x5a4a35);
    this.add(head);

    // Pickaxe
    this.pickaxe = scene.add.rectangle(28, -20, 8, 40, 0x8b4513);
    this.pickaxe.setStrokeStyle(1, 0x654321);
    this.add(this.pickaxe);

    // Pickaxe head
    const pickHead = scene.add.rectangle(28, -42, 20, 8, 0x888888);
    pickHead.setStrokeStyle(1, 0xaaaaaa);
    this.add(pickHead);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // 256px asset hitbox standard
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(80, 40);
    body.setOffset(-40, 30);
    body.setCollideWorldBounds(true);
  }

  update(delta: number, playerX: number, playerY: number): void {
    const dt = delta / 1000;

    // Belt depth-sort
    this.setDepth(this.y);

    if (this.slamCooldown > 0) this.slamCooldown -= delta;

    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Face player
    this.setScale(dx < 0 ? -1 : 1, 1);

    if (this.isSlammingDown) return; // Locked in slam animation

    if (dist < 60 && this.slamCooldown <= 0) {
      this.startSlam();
    } else if (dist > 20) {
      this.x += (dx / dist) * this.speed * dt;
      this.y += (dy / dist) * this.speed * dt;
    }
  }

  private startSlam(): void {
    this.isSlammingDown = true;
    this.causesKnockdown = false;
    this.sprite.fillColor = 0x664444;

    // Windup: raise pickaxe
    this.scene.tweens.add({
      targets: this.pickaxe,
      angle: -90,
      duration: this.slamWindup,
      onComplete: () => {
        // Slam down
        this.scene.tweens.add({
          targets: this.pickaxe,
          angle: 45,
          duration: 150,
          onComplete: () => {
            this.causesKnockdown = true;
            // Reset after slam
            this.scene.time.delayedCall(400, () => {
              this.isSlammingDown = false;
              this.causesKnockdown = false;
              this.sprite.fillColor = 0x3a3a3a;
              this.pickaxe.angle = 0;
              this.slamCooldown = this.slamCooldownMax;
            });
          }
        });
      }
    });
  }

  takeDamage(amount: number = 1): boolean {
    this.health -= amount;
    this.sprite.fillColor = 0xff0000;
    this.scene.time.delayedCall(100, () => {
      this.sprite.fillColor = this.isSlammingDown ? 0x664444 : 0x3a3a3a;
    });
    return this.health <= 0;
  }

  getDamage(): number { return this.damage; }
  getHealth(): number { return this.health; }
  isSlamming(): boolean { return this.isSlammingDown; }
  doesCauseKnockdown(): boolean { return this.causesKnockdown; }
}
