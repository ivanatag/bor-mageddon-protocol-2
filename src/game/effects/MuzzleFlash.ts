import Phaser from 'phaser';

/**
 * MuzzleFlash: A transient visual effect for the M70.
 * Spritesheet: muzzle-flash-m70.png.
 */
export class MuzzleFlash extends Phaser.GameObjects.Sprite {
    constructor(scene: Phaser.Scene, x: number, y: number, flipX: boolean) {
        super(scene, x, y, 'muzzle-flash-m70');

        scene.add.existing(this);
        
        this.setFlipX(flipX);
        this.setDepth(1001); // Ensure it's above character sprites
        this.setScale(1.2);
        this.setBlendMode(Phaser.BlendModes.ADD); // Makes it "glow"

        // 16-bit Quick Flash Sequence
        this.play('m70_flash_anim');

        this.on('animationcomplete', () => {
            this.destroy();
        });
    }
}
