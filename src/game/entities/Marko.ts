import Phaser from 'phaser';
import { eventBus, GameEvents } from '../EventBus';
import { Weapon } from './Weapon';

/**
 * Marko – The Miner. Balanced stats.
 * Special: "Wall of Death" AoE mosh-pit shockwave.
 * Finisher: "Sony Walkman" – plays a kill animation and bonus score.
 * Uses sprite key 'marko_atlas' (256x256 frames).
 */
export class Marko extends Phaser.GameObjects.Container {
  private torso: Phaser.GameObjects.Rectangle;
  private headCircle: Phaser.GameObjects.Arc;

  private speed: number = 300;
  private health: number = 5;
  private maxHealth: number = 5;
  private isInvulnerable: boolean = false;
  private invulnerabilityMs: number = 2000;

  private facingRight: boolean = true;
  private canShoot: boolean = true;
  private shootCooldown: number = 500;

  // Special: Wall of Death
  private specialCooldown: number = 0;
  private specialCooldownMax: number = 12000;
  private specialRadius: number = 200;
  private specialDamage: number = 4;

  // Weapon system
  private equippedWeapon: Weapon | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    // Torso (red miner vest)
    this.torso = scene.add.rectangle(0, 0, 32, 48, 0xcc0000);
    this.torso.setStrokeStyle(2, 0xff0000);
    this.add(this.torso);

    // Head
    this.headCircle = scene.add.circle(0, -20, 12, 0xffcc99);
    this.headCircle.setStrokeStyle(2, 0xcc9966);
    this.add(this.headCircle);

    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);
    scene.physics.add.existing(this as unknown as Phaser.GameObjects.GameObject);

    const body = (this as any).body as Phaser.Physics.Arcade.Body;
    body.setSize(32, 48);
    body.setCollideWorldBounds(true);
  }

  update(cursors: Phaser.Types.Input.Keyboard.CursorKeys, delta: number): void {
    const body = (this as any).body as Phaser.Physics.Arcade.Body;

    // Movement
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

    // Belt depth-sort
    this.setDepth(this.y);

    // Invulnerability blink
    if (this.isInvulnerable) {
      this.alpha = Math.sin(this.scene.time.now * 0.02) * 0.5 + 0.5;
    } else {
      this.alpha = 1;
    }

    // Cool down special
    if (this.specialCooldown > 0) this.specialCooldown -= delta;
  }

  /** Basic attack or weapon fire. */
  shoot(): Phaser.GameObjects.Rectangle | null {
    if (this.equippedWeapon) {
      const fired = this.equippedWeapon.fire(this.x, this.y, this.facingRight);
      if (!fired && this.equippedWeapon.isEmpty()) {
        this.throwWeapon();
      }
      return null;
    }

    if (!this.canShoot) return null;
    this.canShoot = false;

    const beam = this.scene.add.rectangle(this.x, this.y - 30, 8, 20, 0xffff00);
    beam.setStrokeStyle(2, 0xff8800);
    this.scene.physics.add.existing(beam);
    const beamBody = beam.body as Phaser.Physics.Arcade.Body;
    beamBody.setVelocityY(-600);

    this.scene.time.delayedCall(this.shootCooldown, () => { this.canShoot = true; });
    return beam;
  }

  /**
   * Wall of Death – AoE shockwave that damages all enemies within radius.
   * Returns affected zone rectangle for collision checks.
   */
  wallOfDeath(): Phaser.GameObjects.Arc | null {
    if (this.specialCooldown > 0) return null;
    this.specialCooldown = this.specialCooldownMax;

    // Visual shockwave ring
    const ring = this.scene.add.circle(this.x, this.y, 10, 0xff3333, 0.6);
    ring.setStrokeStyle(4, 0xff0000);
    ring.setDepth(999);

    this.scene.tweens.add({
      targets: ring,
      radius: this.specialRadius,
      alpha: 0,
      duration: 400,
      onComplete: () => ring.destroy(),
    });

    // Camera shake for impact
    this.scene.cameras.main.shake(200, 0.01);

    eventBus.emit('special:wallOfDeath', this.x, this.y, this.specialRadius, this.specialDamage);
    return ring;
  }

  /** Sony Walkman finisher – plays VHS-style kill anim on a downed enemy. */
  walkmanFinisher(enemyX: number, enemyY: number): void {
    const icon = this.scene.add.rectangle(enemyX, enemyY - 30, 20, 14, 0xcccccc);
    icon.setStrokeStyle(2, 0x888888);
    icon.setDepth(1000);

    this.scene.tweens.add({
      targets: icon,
      y: enemyY - 60,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 600,
      onComplete: () => icon.destroy(),
    });

    eventBus.emit('finisher:walkman', enemyX, enemyY);
  }

  // ── Weapon API ──
  equipWeapon(weapon: Weapon): void {
    this.equippedWeapon?.destroy();
    this.equippedWeapon = weapon;
    eventBus.emit('weapon:equipped', weapon.getName(), weapon.getAmmo(), weapon.getMaxAmmo());
  }

  private throwWeapon(): void {
    if (!this.equippedWeapon) return;
    const dirMult = this.facingRight ? 1 : -1;
    const thrown = this.scene.add.rectangle(this.x + 20 * dirMult, this.y - 10, 16, 8, 0x888888);
    this.scene.physics.add.existing(thrown);
    (thrown.body as Phaser.Physics.Arcade.Body).setVelocity(400 * dirMult, -150);

    this.scene.tweens.add({
      targets: thrown,
      angle: 720 * dirMult,
      alpha: 0,
      duration: 600,
      onComplete: () => thrown.destroy(),
    });

    eventBus.emit('weapon:thrown');
    this.equippedWeapon.destroy();
    this.equippedWeapon = null;
  }

  // ── Health ──
  takeDamage(): boolean {
    if (this.isInvulnerable) return false;
    this.health--;
    this.isInvulnerable = true;

    this.torso.fillColor = 0xff0000;
    this.scene.time.delayedCall(100, () => { this.torso.fillColor = 0xcc0000; });
    this.scene.time.delayedCall(this.invulnerabilityMs, () => { this.isInvulnerable = false; });

    eventBus.emit(GameEvents.HEALTH_UPDATE, this.health, this.maxHealth);
    return this.health <= 0;
  }

  getHealth(): number { return this.health; }
  getMaxHealth(): number { return this.maxHealth; }
  isFacingRight(): boolean { return this.facingRight; }
  getSpecialCooldownPercent(): number {
    return Math.max(0, this.specialCooldown / this.specialCooldownMax);
  }

  resetHealth(): void {
    this.health = this.maxHealth;
    eventBus.emit(GameEvents.HEALTH_UPDATE, this.health, this.maxHealth);
  }
}
