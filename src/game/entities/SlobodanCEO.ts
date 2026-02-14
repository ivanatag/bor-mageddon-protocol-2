import Phaser from 'phaser';

/**
 * SlobodanCEO - Level 1 Boss: 10ft tall sludge monster.
 * Multi-hitbox system: Head (2x damage), Torso (standard).
 * "Hyper-Inflation Storm" attack: spawns falling dinar projectiles.
 * Uses Classic Gore (red blood) and belt depth-sorting (Z = position.y).
 */
export class SlobodanCEO extends Phaser.GameObjects.Container {
  private torso: Phaser.GameObjects.Rectangle;
  private head: Phaser.GameObjects.Rectangle;
  private headHitbox: Phaser.GameObjects.Zone;
  private torsoHitbox: Phaser.GameObjects.Zone;
  private health: number = 30;
  private maxHealth: number = 30;
  private speed: number = 40;
  private damage: number = 3;
  private isAttacking: boolean = false;
  private attackCooldown: number = 0;
  private attackCooldownMax: number = 4000;
  private stormCooldown: number = 0;
  private stormCooldownMax: number = 8000;
  private stormProjectiles: Phaser.GameObjects.Rectangle[] = [];
  private facingLeft: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    // Massive sludge torso
    this.torso = scene.add.rectangle(0, 0, 80, 120, 0x2d4a1e);
    this.torso.setStrokeStyle(3, 0x1a2e10);
    this.add(this.torso);

    // Dripping sludge details
    const sludgeL = scene.add.rectangle(-30, 40, 12, 30, 0x1a3010);
    this.add(sludgeL);
    const sludgeR = scene.add.rectangle(30, 50, 10, 25, 0x1a3010);
    this.add(sludgeR);

    // Head - weak point (2x damage)
    this.head = scene.add.rectangle(0, -80, 40, 40, 0x3d6a2e);
    this.head.setStrokeStyle(2, 0xff4444);
    this.add(this.head);

    // Glowing eyes
    const eyeL = scene.add.circle(-10, -85, 5, 0xff0000);
    const eyeR = scene.add.circle(10, -85, 5, 0xff0000);
    this.add(eyeL);
    this.add(eyeR);

    // Arms
    const armL = scene.add.rectangle(-50, -10, 20, 70, 0x2d4a1e);
    armL.setStrokeStyle(2, 0x1a2e10);
    this.add(armL);
    const armR = scene.add.rectangle(50, -10, 20, 70, 0x2d4a1e);
    armR.setStrokeStyle(2, 0x1a2e10);
    this.add(armR);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // 256px asset hitbox standard
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(80, 40);
    body.setOffset(-40, 70);
    body.setCollideWorldBounds(true);

    // Head hitbox zone (for 2x damage detection)
    this.headHitbox = scene.add.zone(x, y - 80, 40, 40);
    scene.physics.add.existing(this.headHitbox, true);

    // Torso hitbox zone
    this.torsoHitbox = scene.add.zone(x, y, 80, 120);
    scene.physics.add.existing(this.torsoHitbox, true);
  }

  update(delta: number, playerX: number, playerY: number): void {
    const dt = delta / 1000;

    // Belt depth-sort
    this.setDepth(this.y);

    // Update hitbox positions
    this.headHitbox.setPosition(this.x, this.y - 80);
    this.torsoHitbox.setPosition(this.x, this.y);

    // Cooldowns
    if (this.attackCooldown > 0) this.attackCooldown -= delta;
    if (this.stormCooldown > 0) this.stormCooldown -= delta;

    // Face player
    this.facingLeft = playerX < this.x;
    this.setScale(this.facingLeft ? -1 : 1, 1);

    // Move toward player
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 80) {
      this.x += (dx / dist) * this.speed * dt;
      this.y += (dy / dist) * this.speed * dt;
    } else if (this.attackCooldown <= 0) {
      this.meleeAttack();
    }

    // Hyper-Inflation Storm
    if (this.stormCooldown <= 0 && dist < 400) {
      this.hyperInflationStorm(playerX);
      this.stormCooldown = this.stormCooldownMax;
    }

    // Update storm projectiles
    for (let i = this.stormProjectiles.length - 1; i >= 0; i--) {
      const proj = this.stormProjectiles[i];
      if (!proj.active || proj.y > this.scene.scale.height) {
        proj.destroy();
        this.stormProjectiles.splice(i, 1);
      }
    }
  }

  private meleeAttack(): void {
    this.isAttacking = true;
    this.torso.fillColor = 0x4a7a2e;
    this.attackCooldown = this.attackCooldownMax;

    this.scene.time.delayedCall(300, () => {
      this.isAttacking = false;
      this.torso.fillColor = 0x2d4a1e;
    });
  }

  /**
   * Hyper-Inflation Storm: rains dinar projectiles from above.
   */
  private hyperInflationStorm(targetX: number): void {
    const count = 8;
    for (let i = 0; i < count; i++) {
      this.scene.time.delayedCall(i * 200, () => {
        if (!this.active) return;
        const px = targetX - 100 + Math.random() * 200;
        const proj = this.scene.add.rectangle(px, this.y - 200, 16, 16, 0x228B22);
        proj.setStrokeStyle(2, 0x006400);
        this.scene.physics.add.existing(proj);
        const body = proj.body as Phaser.Physics.Arcade.Body;
        body.setVelocityY(250 + Math.random() * 100);
        body.setAllowGravity(false);
        this.stormProjectiles.push(proj);
      });
    }
  }

  takeDamage(amount: number, isHeadshot: boolean = false): boolean {
    const finalDamage = isHeadshot ? amount * 2 : amount;
    this.health -= finalDamage;

    // Flash red
    const target = isHeadshot ? this.head : this.torso;
    target.fillColor = 0xff0000;
    this.scene.time.delayedCall(100, () => {
      target.fillColor = isHeadshot ? 0x3d6a2e : 0x2d4a1e;
    });

    return this.health <= 0;
  }

  getHeadHitbox(): Phaser.GameObjects.Zone { return this.headHitbox; }
  getTorsoHitbox(): Phaser.GameObjects.Zone { return this.torsoHitbox; }
  getStormProjectiles(): Phaser.GameObjects.Rectangle[] { return this.stormProjectiles; }
  getDamage(): number { return this.damage; }
  getHealth(): number { return this.health; }
  getMaxHealth(): number { return this.maxHealth; }
  isPerformingAttack(): boolean { return this.isAttacking; }

  destroy(fromScene?: boolean): void {
    this.stormProjectiles.forEach(p => p.destroy());
    this.stormProjectiles = [];
    this.headHitbox?.destroy();
    this.torsoHitbox?.destroy();
    super.destroy(fromScene);
  }
}
