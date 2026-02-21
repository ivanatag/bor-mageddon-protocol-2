import Phaser from 'phaser';
import { Weapon } from './Weapon';
import { eventBus } from '../EventBus';

export type PlayerState = 'NORMAL' | 'EQUIPPED';

export class Player extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Rectangle;
  private speed: number = 300;
  private canShoot: boolean = true;
  private shootCooldown: number = 500;
  private health: number = 3;
  private maxHealth: number = 3;
  private isInvulnerable: boolean = false;
  private invulnerabilityTime: number = 2000;

  // Weapon system
  private weaponState: PlayerState = 'NORMAL';
  private equippedWeapon: Weapon | null = null;
  private facingRight: boolean = true;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    // Create player sprite (Marko)
    this.sprite = scene.add.rectangle(0, 0, 32, 48, 0xcc0000);
    this.sprite.setStrokeStyle(2, 0xff0000);
    this.add(this.sprite);

    // Add head
    const head = scene.add.circle(0, -20, 12, 0xffcc99);
    head.setStrokeStyle(2, 0xcc9966);
    this.add(head);

    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Setup physics body
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(32, 48);
    body.setCollideWorldBounds(true);
  }

  update(cursors: Phaser.Types.Input.Keyboard.CursorKeys): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    // Horizontal movement + facing direction
    if (cursors.left?.isDown) {
      body.setVelocityX(-this.speed);
      this.facingRight = false;
    } else if (cursors.right?.isDown) {
      body.setVelocityX(this.speed);
      this.facingRight = true;
    } else {
      body.setVelocityX(0);
    }

    // Blinking effect when invulnerable
    if (this.isInvulnerable) {
      this.alpha = Math.sin(this.scene.time.now * 0.02) * 0.5 + 0.5;
    } else {
      this.alpha = 1;
    }
  }

  /**
   * Attack action — delegates to weapon fire or basic punch based on state.
   * Returns a beam Rectangle for NORMAL state (backward compat), or null for EQUIPPED.
   */
  shoot(): Phaser.GameObjects.Rectangle | null {
    if (this.weaponState === 'EQUIPPED' && this.equippedWeapon) {
      const fired = this.equippedWeapon.fire(this.x, this.y, this.facingRight);

      if (!fired && this.equippedWeapon.isEmpty()) {
        // Empty weapon → throw it and revert to NORMAL
        this.throwWeapon();
      }
      return null;
    }

    // NORMAL state — original beam/punch logic
    if (!this.canShoot) return null;
    this.canShoot = false;

    const beam = this.scene.add.rectangle(
      this.x,
      this.y - 30,
      8,
      20,
      0xffff00
    );
    beam.setStrokeStyle(2, 0xff8800);

    this.scene.physics.add.existing(beam);
    const beamBody = beam.body as Phaser.Physics.Arcade.Body;
    beamBody.setVelocityY(-600);
    beamBody.setSize(8, 20);

    this.scene.time.delayedCall(this.shootCooldown, () => {
      this.canShoot = true;
    });

    return beam;
  }

  // ── Weapon API ──

  equipWeapon(weapon: Weapon): void {
    this.equippedWeapon?.destroy();
    this.equippedWeapon = weapon;
    this.weaponState = 'EQUIPPED';
    eventBus.emit('weapon:equipped', weapon.getName(), weapon.getAmmo(), weapon.getMaxAmmo());
  }

  private throwWeapon(): void {
    if (!this.equippedWeapon) return;

    // Visual "throw" — a small rectangle flung forward
    const dirMult = this.facingRight ? 1 : -1;
    const thrown = this.scene.add.rectangle(this.x + 20 * dirMult, this.y - 10, 16, 8, 0x888888);
    thrown.setStrokeStyle(1, 0x444444);
    this.scene.physics.add.existing(thrown);
    const thrownBody = thrown.body as Phaser.Physics.Arcade.Body;
    thrownBody.setVelocity(400 * dirMult, -150);

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
    this.weaponState = 'NORMAL';
  }

  getWeaponState(): PlayerState {
    return this.weaponState;
  }

  getEquippedWeapon(): Weapon | null {
    return this.equippedWeapon;
  }

  isFacingRight(): boolean {
    return this.facingRight;
  }

  // ── Health (unchanged) ──

  takeDamage(): boolean {
    if (this.isInvulnerable) return false;

    this.health--;
    this.isInvulnerable = true;

    this.sprite.fillColor = 0xff0000;
    this.scene.time.delayedCall(100, () => {
      this.sprite.fillColor = 0xcc0000;
    });

    this.scene.time.delayedCall(this.invulnerabilityTime, () => {
      this.isInvulnerable = false;
    });

    return this.health <= 0;
  }

  getHealth(): number {
    return this.health;
  }

  getMaxHealth(): number {
    return this.maxHealth;
  }

  resetHealth(): void {
    this.health = this.maxHealth;
  }
}
