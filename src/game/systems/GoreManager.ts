import Phaser from 'phaser';

/**
 * GoreManager: Manages particle effects for combat feedback.
 * Handles organic blood splatters and industrial debris.
 */
export class GoreManager {
    private scene: Phaser.Scene;
    private bloodParticles: Phaser.GameObjects.Particles.ParticleEmitter;
    private debrisParticles: Phaser.GameObjects.Particles.ParticleEmitter;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;

        // 1. Organic Blood Splatter (Red/Dark Red)
        // Uses a simple 16-bit square or circle pixel texture
        this.bloodParticles = this.scene.add.particles(0, 0, 'pixel_particle', {
            color: [0x8b0000, 0xff0000, 0x5e0000],
            speed: { min: 100, max: 250 },
            scale: { start: 1, end: 0 },
            lifespan: 400,
            gravityY: 600,
            quantity: 0, // Manual burst only
            blendMode: 'NORMAL'
        });

        // 2. Industrial Debris/Sparks (Yellow/Orange/Grey)
        this.debrisParticles = this.scene.add.particles(0, 0, 'pixel_particle', {
            color: [0xffa500, 0xffff00, 0x808080],
            speed: { min: 150, max: 300 },
            scale: { start: 1, end: 0 },
            lifespan: 300,
            gravityY: 400,
            quantity: 0,
            blendMode: 'ADD'
        });

        // Global Event Listeners for easy triggering
        this.scene.events.on('spawn-blood-splatter', this.spawnBlood, this);
        this.scene.events.on('spawn-industrial-debris', this.spawnDebris, this);
    }

    /**
     * Spawns a burst of blood at the impact location.
     * Triggered by bullets hitting organic enemies.
     */
    public spawnBlood(data: { x: number, y: number }) {
        this.bloodParticles.emitParticleAt(data.x, data.y, Phaser.Math.Between(8, 15));
        
        // Brief screen shake for "weighty" hits
        this.scene.cameras.main.shake(100, 0.005);
    }

    /**
     * Spawns sparks and dust.
     * Triggered by melee hits on armored enemies (MUP) or objects breaking.
     */
    public spawnDebris(data: { x: number, y: number }) {
        this.debrisParticles.emitParticleAt(data.x, data.y, Phaser.Math.Between(10, 20));
    }

    /**
     * Specialized "Industrial Dust" for the road belt movement.
     */
    public spawnDustCloud(x: number, y: number) {
        this.scene.add.particles(x, y, 'pixel_particle', {
            color: 0x444444,
            alpha: { start: 0.5, end: 0 },
            scale: { start: 2, end: 4 },
            speed: 20,
            lifespan: 800,
            frequency: -1,
            maxParticles: 5
        }).explode();
    }
}
