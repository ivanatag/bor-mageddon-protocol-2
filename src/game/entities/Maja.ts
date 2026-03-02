import Phaser from 'phaser';
import { eventBus, GameEvents } from '../EventBus';
import { Weapon } from './Weapon';

/**
 * Maja – The Tank. Slow, heavy damage, high HP.
 * Special: "Balkan Suplex" – grab-and-slam throw on nearby enemy.
 * Finisher: "Bor Mining Drill" – extended damage-over-time finisher.
 * Uses sprite key 'maja_atlas' (256x256 frames).
 */
export class Maja extends Phaser.GameObjects.Container {
  private torso: Phaser.GameObjects.Rectangle;
  private headCircle: Phaser.GameObjects.Arc;

  // Tank physics: slow but tanky
  private speed: number = 200;
  private health: number = 8;
  private maxHealth: number = 8;
  private isInvulnerable: boolean = false;
  private invulnerabilityMs: number = 2500;
  private facingRight: boolean = true;

  private canShoot: boolean = true;
  private shootCooldown: number = 700;

  // Balkan Suplex
  private suplexCooldown: number = 0;
  private suplexCooldownMax: number = 8000;
  private suplexRange: number = 60;
  private suplexDamage: number = 6;

  // Bor Mining Drill finisher
  private drillDamage: number = 2;
  private drillTicks: number = 5;
  private drillInterval: number = 200;

  private equippedWeapon: Weapon | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    // Stocky torso (green)
    this.torso = scene.add.rectangle(0, 0, 40, 44, 0x228B22);
    this.torso.setStrokeStyle(2, 0x006400);
    this.add(this.torso);

    // Head
    this.headCircle = scene.add.circle(0, -18, 13, 0xffcc99);
    this.headCircle.setStrokeStyle(2, 0xcc9966);
    this.add(this.headCircle);

    // Mining helmet
    const helmet = scene.add.rectangle(0, -26, 28, 8, 0xffcc00);
    helmet.setStrokeStyle(1, 0xcc9900);
    this.add(helmet);

    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);
    scene.physics.add.existing(this as unknown as Phaser.GameObjects.GameObject);

    const body = (this as any).body as Phaser.Physics.Arcade.Body;
    body.setSize(40, 44);
    body.setCollideWorldBounds(true);
  }

  update(cursors: Phaser.Types.Input.Keyboard.CursorKeys, delta: number): void {
    const body = (this as any).body as Phaser.Physics.Arcade.Body;

    if (cursors.left?.isDown) {
      body.setVelocityX(-this.speed);
      this.facingRight = false;
    } else if (cursors.right?.isDown) {
      body.setVelocityX(this.speed);
      this.facingRight = true;
    } else {
      body.setVelocityX(0);
    }

    if (cursors.up?.isDown) {
      body.setVelocityY(-this.speed);
    } else if (cursors.down?.isDown) {
      body.setVelocityY(this.speed);
    } else {
      body.setVelocityY(0);
    }

    this.setDepth(this.y);

    if (this.isInvulnerable) {
      this.alpha = Math.sin(this.scene.time.now * 0.02) * 0.5 + 0.5;
    } else {
      this.alpha = 1;
    }

    if (this.suplexCooldown > 0) this.suplexCooldown -= delta;
  }

  /** Heavy punch attack. */
  shoot(): Phaser.GameObjects.Rectangle | null {
    if (this.equippedWeapon) {
      const fired = this.equippedWeapon.fire(this.x, this.y, this.facingRight);
      if (!fired && this.equippedWeapon.isEmpty()) {
        this.equippedWeapon.destroy();
        this.equippedWeapon = null;
        eventBus.emit('weapon:thrown');
      }
      return null;
    }

    if (!this.canShoot) return null;
    this.canShoot = false;

    const dirMult = this.facingRight ? 1 : -1;
    const fist = this.scene.add.rectangle(this.x + 30 * dirMult, this.y, 24, 24, 0xffcc99, 0.8);
    fist.setStrokeStyle(2, 0xcc9966);
    this.scene.physics.add.existing(fist);
    (fist as any).damage = 2;

    this.scene.tweens.add({
      targets: fist,
      x: fist.x + 20 * dirMult,
      alpha: 0,
      duration: 200,
      onComplete: () => fist.destroy(),
    });

    this.scene.time.delayedCall(this.shootCooldown, () => { this.canShoot = true; });
    return fist;
  }

  /**
   * Balkan Suplex – grab an enemy within range and slam them down.
   * Returns a grab-zone rect. Scene should check overlap and apply damage.
   */
  balkanSuplex(): Phaser.GameObjects.Rectangle | null {
    if (this.suplexCooldown > 0) return null;
    this.suplexCooldown = this.suplexCooldownMax;

    const dirMult = this.facingRight ? 1 : -1;
    const grabZone = this.scene.add.rectangle(
      this.x + this.suplexRange * 0.5 * dirMult,
      this.y,
      this.suplexRange,
      50,
      0xff6600,
      0.4
    );
    grabZone.setDepth(999);
    this.scene.physics.add.existing(grabZone);
    (grabZone as any).damage = this.suplexDamage;
    (grabZone as any).isSuplex = true;

    // Slam animation: quick up then down
    this.scene.tweens.add({
      targets: this,
      y: this.y - 30,
      duration: 150,
      yoyo: true,
      ease: 'Quad.easeOut',
    });

    this.scene.tweens.add({
      targets: grabZone,
      alpha: 0,
      scaleY: 0.3,
      duration: 400,
      onComplete: () => grabZone.destroy(),
    });

    this.scene.cameras.main.shake(250, 0.015);
    eventBus.emit('special:balkanSuplex', this.x, this.y);
    return grabZone;
  }

  /**
   * Bor Mining Drill finisher – rapid multi-hit damage-over-time on downed enemy.
   */
  miningDrillFinisher(enemyX: number, enemyY: number): void {
    let tick = 0;
    const drillTimer = this.scene.time.addEvent({
      delay: this.drillInterval,
      repeat: this.drillTicks - 1,
      callback: () => {
        tick++;
        const spark = this.scene.add.circle(
          enemyX + (Math.random() - 0.5) * 20,
          enemyY + (Math.random() - 0.5) * 20,
          4 + Math.random() * 4,
          0xffaa00,
          0.8
        );
        spark.setDepth(1000);
        this.scene.tweens.add({
          targets: spark,
          alpha: 0,
          scaleX: 2,
          scaleY: 2,
          duration: 150,
          onComplete: () => spark.destroy(),
        });
        eventBus.emit('finisher:drillTick', enemyX, enemyY, this.drillDamage, tick);
      },
    });
  }

  // ── Weapon API ──
  equipWeapon(weapon: Weapon): void {
    this.equippedWeapon?.destroy();
    this.equippedWeapon = weapon;
    eventBus.emit('weapon:equipped', weapon.getName(), weapon.getAmmo(), weapon.getMaxAmmo());
  }

  // ── Health ──
  takeDamage(): boolean {
    if (this.isInvulnerable) return false;
    this.health--;
    this.isInvulnerable = true;

    this.torso.fillColor = 0xff0000;
    this.scene.time.delayedCall(100, () => { this.torso.fillColor = 0x228B22; });
    this.scene.time.delayedCall(this.invulnerabilityMs, () => { this.isInvulnerable = false; });

    eventBus.emit(GameEvents.HEALTH_UPDATE, this.health, this.maxHealth);
    return this.health <= 0;
  }

  getHealth(): number { return this.health; }
  getMaxHealth(): number { return this.maxHealth; }
  isFacingRight(): boolean { return this.facingRight; }
  getSpecialCooldownPercent(): number {
    return Math.max(0, this.suplexCooldown / this.suplexCooldownMax);
  }
  resetHealth(): void {
    this.health = this.maxHealth;
    eventBus.emit(GameEvents.HEALTH_UPDATE, this.health, this.maxHealth);
  }
}
