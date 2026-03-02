import Phaser from 'phaser';
import { eventBus, GameEvents } from '../EventBus';
import { Weapon } from './Weapon';

/**
 * Darko – The Lanky Bassist. High jump, long melee reach.
 * Special: "Feedback Blast" – directional shockwave from bass guitar.
 * Uses sprite key 'darko_atlas' (256x256 frames).
 */
export class Darko extends Phaser.GameObjects.Container {
  private torso: Phaser.GameObjects.Rectangle;
  private headCircle: Phaser.GameObjects.Arc;

  // Lanky physics: faster, higher jump arc
  private speed: number = 350;
  private health: number = 4;
  private maxHealth: number = 4;
  private isInvulnerable: boolean = false;
  private invulnerabilityMs: number = 1800;
  private facingRight: boolean = true;

  // Long-range bass guitar melee hitbox
  private meleeRange: number = 80; // extended reach
  private meleeDamage: number = 2;
  private canMelee: boolean = true;
  private meleeCooldown: number = 600;

  // Feedback Blast special
  private specialCooldown: number = 0;
  private specialCooldownMax: number = 10000;
  private blastWidth: number = 300;
  private blastDamage: number = 3;

  private equippedWeapon: Weapon | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    // Tall lanky torso (blue)
    this.torso = scene.add.rectangle(0, 0, 28, 56, 0x3366cc);
    this.torso.setStrokeStyle(2, 0x2244aa);
    this.add(this.torso);

    // Head
    this.headCircle = scene.add.circle(0, -24, 11, 0xffcc99);
    this.headCircle.setStrokeStyle(2, 0xcc9966);
    this.add(this.headCircle);

    // Bass guitar visual
    const guitar = scene.add.rectangle(20, 5, 40, 6, 0x8B4513);
    guitar.setStrokeStyle(1, 0x5C3010);
    this.add(guitar);

    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);
    scene.physics.add.existing(this as unknown as Phaser.GameObjects.GameObject);

    const body = (this as any).body as Phaser.Physics.Arcade.Body;
    body.setSize(28, 56);
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

    if (this.specialCooldown > 0) this.specialCooldown -= delta;
  }

  /** Long-range bass guitar swing. Returns a hitbox rect for collision. */
  meleeSwing(): Phaser.GameObjects.Rectangle | null {
    if (!this.canMelee) return null;
    this.canMelee = false;

    const dirMult = this.facingRight ? 1 : -1;
    const hitbox = this.scene.add.rectangle(
      this.x + this.meleeRange * 0.5 * dirMult,
      this.y,
      this.meleeRange,
      30,
      0x8B4513,
      0.3
    );
    hitbox.setDepth(998);

    this.scene.physics.add.existing(hitbox);
    (hitbox as any).damage = this.meleeDamage;

    this.scene.tweens.add({
      targets: hitbox,
      alpha: 0,
      duration: 200,
      onComplete: () => hitbox.destroy(),
    });

    this.scene.time.delayedCall(this.meleeCooldown, () => { this.canMelee = true; });
    return hitbox;
  }

  /**
   * Feedback Blast – directional shockwave from the bass guitar.
   * Damages enemies in a wide cone in front of Darko.
   */
  feedbackBlast(): Phaser.GameObjects.Rectangle | null {
    if (this.specialCooldown > 0) return null;
    this.specialCooldown = this.specialCooldownMax;

    const dirMult = this.facingRight ? 1 : -1;
    const blast = this.scene.add.rectangle(
      this.x + (this.blastWidth / 2) * dirMult,
      this.y,
      this.blastWidth,
      60,
      0x9933ff,
      0.5
    );
    blast.setStrokeStyle(3, 0x6600cc);
    blast.setDepth(999);

    this.scene.physics.add.existing(blast);
    (blast as any).damage = this.blastDamage;

    this.scene.tweens.add({
      targets: blast,
      scaleX: 1.5,
      alpha: 0,
      duration: 350,
      onComplete: () => blast.destroy(),
    });

    this.scene.cameras.main.shake(150, 0.008);
    eventBus.emit('special:feedbackBlast', this.x, this.y, dirMult);
    return blast;
  }

  // ── Weapon API ──
  equipWeapon(weapon: Weapon): void {
    this.equippedWeapon?.destroy();
    this.equippedWeapon = weapon;
    eventBus.emit('weapon:equipped', weapon.getName(), weapon.getAmmo(), weapon.getMaxAmmo());
  }

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
    return this.meleeSwing();
  }

  // ── Health ──
  takeDamage(): boolean {
    if (this.isInvulnerable) return false;
    this.health--;
    this.isInvulnerable = true;

    this.torso.fillColor = 0xff0000;
    this.scene.time.delayedCall(100, () => { this.torso.fillColor = 0x3366cc; });
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
