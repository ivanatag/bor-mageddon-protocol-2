import Phaser from 'phaser';
import { Enemy } from './Enemy';
import { Projectile } from './Projectile';
import { GoreManager } from '../systems/GoreManager';
import { AudioManager } from '../systems/AudioManager';

/**
 * Miner: The "Shambling Tank" of the Bor Copper Mine.
 * Features high endurance, long-range pickaxe throws, and sinking death logic.
 */
export class Miner extends Enemy {
    private isThrowing: boolean = false;
    private throwCooldown: boolean = false;
    private throwRange: number = 400;

    constructor(scene: Phaser.Scene, x: number, y: number, goreManager: GoreManager, audioManager: AudioManager) {
        // Initialized with Corrupted Miner specific sprite key [cite: 1089]
        super(scene, x, y, 'miner_1993', goreManager, audioManager);
        
        this.health = 250; // High endurance for Level 1 tank [cite: 1090]
        this.enemyType = 'miner';
        
        // Calibrate 256px physics body to just the feet [cite: 1862]
        this.body.setSize(80, 40);
        this.body.setOffset(88, 210);
    }

    public updateAI(player: Phaser.Physics.Arcade.Sprite) {
        if (this.isDead || this.isHurt || this.isThrowing) return;

        const distX = Math.abs(player.x - this.x);
        const distY = Math.abs(player.y - this.y);

        // 1. Attack Trigger: If player is in throw range [cite: 1096]
        if (distX <= this.throwRange && distX >= 250 && distY <= 30 && !this.throwCooldown) {
            this.executePickaxeThrow();
        } else {
            // 2. Shuffling walk logic: Slower speed than scouts [cite: 1099]
            super.updateAI(player);
        }
    }

    private executePickaxeThrow() {
        this.isThrowing = true;
        this.setVelocityX(0);

        // Play aggressive 8-frame throwing sequence
        this.play('miner_throw', true);

        // RELEASE POINT: Listen for Frame 4 where the hands go empty
        this.on('animationupdate', (anim: any, frame: any) => {
            if (frame.index === 4) { 
                this.spawnPickaxe();
                this.audioManager.playSFX('sfx_punch_hit');
            }
        });

        this.once('animationcomplete', () => {
            this.isThrowing = false;
            this.throwCooldown = true;
            // 4-second reload speed for the heavy pickaxe [cite: 1114]
            this.scene.time.delayedCall(4000, () => (this.throwCooldown = false));
        });
    }

    private spawnPickaxe() {
        const xDirection = this.flipX ? -1 : 1;
        const spawnX = this.x + (140 * xDirection); // Positioned at extended arm
        const spawnY = this.y - 120;

        const pickaxe = new Projectile(this.scene, spawnX, spawnY, 'item_pickaxe', xDirection);
        
        // Add to the scene's global projectile group for collision handling
        if ((this.scene as any).enemyProjectiles) {
            (this.scene as any).enemyProjectiles.add(pickaxe);
        }
    }

    /**
     * Override takeDamage to handle 256px impact weight
     */
    public takeDamage(amount: number) {
        if (this.isDead || this.isHurt) return;
        
        this.isHurt = true;
        this.health -= amount;
        
        this.play('miner_hurt', true);
        this.goreManager.emitGore(this.x, this.y - 120, 'INDUSTRIAL', 'HIT'); [cite: 1864]

        this.scene.time.delayedCall(150, () => {
            this.isHurt = false;
            if (this.health <= 0) this.die();
        });
    }

    /**
     * Final Death: Collapse and Sinking Archive Tween
     */
    protected die() {
        this.isDead = true;
        this.setVelocity(0, 0);

        // Visual: 8-frame collapse animation
        this.play('miner_death', true);
        
        // Audio & HUD feedback [cite: 1868, 1869]
        this.audioManager.playSFX('sfx_gore_splat');
        this.scene.events.emit('boss-dialogue', "ARHIVIRAN!"); [cite: 1869]

        // Gore: Final burst of paper scraps and black sludge [cite: 1046, 1869]
        this.goreManager.emitGore(this.x, this.y - 100, 'BUREAUCRATIC', 'FINISHER');

        // THE TWEEN: Sinks into the floor and fades out 
        this.scene.tweens.add({
            targets: this,
            alpha: 0,           // Fade to transparent
            y: this.y + 50,      // Sink into Bor runoff
            duration: 2500,     // 2.5 second sink
            delay: 1500,        // Wait for knockdown frame to settle
            onComplete: () => {
                this.destroy(); // Memory cleanup 
            }
        });
    }
}
