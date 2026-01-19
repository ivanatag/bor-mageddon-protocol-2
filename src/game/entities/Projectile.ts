import Phaser from 'phaser';

export class Projectile extends Phaser.GameObjects.Rectangle {
  private speed: number;
  private direction: { x: number; y: number };

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number = 8,
    height: number = 20,
    color: number = 0xffff00,
    speed: number = 600,
    direction: { x: number; y: number } = { x: 0, y: -1 }
  ) {
    super(scene, x, y, width, height, color);
    
    this.speed = speed;
    this.direction = direction;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setStrokeStyle(2, 0xff8800);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(
      this.direction.x * this.speed,
      this.direction.y * this.speed
    );
  }

  update(): void {
    // Remove if off screen
    if (this.y < -50 || this.y > this.scene.scale.height + 50) {
      this.destroy();
    }
  }
}
