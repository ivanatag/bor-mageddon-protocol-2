import Phaser from 'phaser';

export class Player extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Rectangle;
  private speed: number = 300;
  private canShoot: boolean = true;
  private shootCooldown: number = 500;
  private health: number = 3;
  private maxHealth: number = 3;
  private isInvulnerable: boolean = false;
  private invulnerabilityTime: number = 2000;

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

    // Horizontal movement
    if (cursors.left?.isDown) {
      body.setVelocityX(-this.speed);
    } else if (cursors.right?.isDown) {
      body.setVelocityX(this.speed);
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

  shoot(): Phaser.GameObjects.Rectangle | null {
    if (!this.canShoot) return null;

    this.canShoot = false;

    // Create vertical beam
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

    // Reset cooldown
    this.scene.time.delayedCall(this.shootCooldown, () => {
      this.canShoot = true;
    });

    return beam;
  }

  takeDamage(): boolean {
    if (this.isInvulnerable) return false;

    this.health--;
    this.isInvulnerable = true;

    // Flash red
    this.sprite.fillColor = 0xff0000;
    this.scene.time.delayedCall(100, () => {
      this.sprite.fillColor = 0xcc0000;
    });

    // End invulnerability
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
