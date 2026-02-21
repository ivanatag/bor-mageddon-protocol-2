import Phaser from 'phaser';

export class Projectile extends Phaser.GameObjects.Rectangle {
  private speed: number;
  private direction: { x: number; y: number };
  private damage: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number = 8,
    height: number = 20,
    color: number = 0xffff00,
    speed: number = 600,
    direction: { x: number; y: number } = { x: 0, y: -1 },
    damage: number = 1
  ) {
    super(scene, x, y, width, height, color);
    
    this.speed = speed;
    this.direction = direction;
    this.damage = damage;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setStrokeStyle(2, 0xff8800);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(
      this.direction.x * this.speed,
      this.direction.y * this.speed
    );

    // Auto-destroy when leaving world bounds
    body.setCollideWorldBounds(false);
    body.onWorldBounds = true;
    scene.physics.world.on('worldbounds', (b: Phaser.Physics.Arcade.Body) => {
      if (b.gameObject === this) {
        this.destroy();
      }
    });
  }

  update(): void {
    if (!this.active) return;
    const { width, height } = this.scene.scale;
    if (this.x < -50 || this.x > width + 50 || this.y < -50 || this.y > height + 50) {
      this.destroy();
    }
  }

  getDamage(): number {
    return this.damage;
  }
}
