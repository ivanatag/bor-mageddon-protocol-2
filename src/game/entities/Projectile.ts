import Phaser from 'phaser';

export class Projectile extends Phaser.Physics.Arcade.Sprite {
    public damage: number;
    public isThrow: boolean;

    constructor(scene: Phaser.Scene, x: number, y: number, dir: number, type: 'BULLET' | 'THROW') {
        // We assume 'bullet' and 'm70_empty' are loaded in your BootScene
        const texture = type === 'THROW' ? 'm70_empty' : 'bullet';
        super(scene, x, y, texture);
        
        this.isThrow = type === 'THROW';
        
        // Thrown empty guns act as heavy projectiles
        this.damage = this.isThrow ? 50 : 45; 

        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);

        const body = this.body as Phaser.Physics.Arcade.Body;
        
        // Fire left (-1) or right (1)
        body.setVelocityX(dir * (this.isThrow ? 400 : 1200));
        
        if (this.isThrow) {
            // 16-bit rotation feel and arc gravity for thrown weapons
            body.setAngularVelocity(600); 
            body.setAccelerationY(600); 
        } else {
            // Bullets fly perfectly straight, ignore world gravity if it exists
            body.setAllowGravity(false);
        }
    }

    /**
     * preUpdate runs automatically every frame for Phaser Sprites.
     * We use this to safely clean up projectiles that fly off the screen,
     * preventing memory leaks and game crashes.
     */
    preUpdate(time: number, delta: number) {
        super.preUpdate(time, delta);

        // If the projectile flies 100 pixels out of bounds, delete it from memory
        const { width, height } = this.scene.scale;
        if (this.x < -100 || this.x > width + 100 || this.y < -100 || this.y > height + 100) {
            this.destroy();
        }
    }

    /**
     * Called by MainLevel.ts when the physics engine detects a collision
     * between this projectile and an enemy.
     */
    public onImpact(enemy: any) {
        if (enemy.isDead) return;

        // Deal damage
        if (enemy.takeDamage) {
            enemy.takeDamage(this.damage);
        }
        
        // Throws guarantee knockdown
        if (this.isThrow && enemy.forceKnockdown) {
            enemy.forceKnockdown(); 
        }
        
        // Trigger the global gore system in the main scene
        this.scene.events.emit('spawn-gore', {
            x: this.x,
            y: this.y,
            type: 'BUREAUCRATIC' // Shredded tax forms / paperwork
        });
        
        // Destroy the bullet/weapon on impact
        this.destroy();
    }
}