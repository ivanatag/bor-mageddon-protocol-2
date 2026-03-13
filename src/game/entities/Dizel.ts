import { Enemy } from './Enemy';
import { GoreManager } from '../systems/GoreManager';
import { AudioManager } from '../systems/AudioManager';

/**
 * Dizel: The "Stabbing Brute" of Bor 1993.
 * Focused on high-speed approach, butterfly knife area denial, and weighted physics.
 */
export class Dizel extends Enemy {
    private isSlashing: boolean = false;
    private slashCooldown: boolean = false;
    private isKnockedDown: boolean = false;
    private isInvulnerable: boolean = false;

    constructor(scene: Phaser.Scene, x: number, y: number, goreManager: GoreManager, audioManager: AudioManager) {
        // Initialised with the specific Dizelaš walk key from the 1993 atlas [cite: 1143]
        super(scene, x, y, 'enemies_1993', goreManager, audioManager);
        this.health = 120; // Fast scout health profile [cite: 190, 1909]
        this.enemyType = 'dizel';
    }

    public updateAI(player: Phaser.Physics.Arcade.Sprite) {
        // Halt AI logic if dazed, dead, attacking, or knocked down [cite: 711]
        if (this.isDead || this.isHurt || this.isSlashing || this.isKnockedDown) {
            this.setVelocityX(0);
            return;
        }

        const distX = Math.abs(player.x - this.x);
        const distY = Math.abs(player.y - this.y);

        // Attack Trigger: Within 256px strike zone (180px reach) [cite: 729]
        if (distX <= 180 && distY <= 20 && !this.slashCooldown) {
            this.executeKnifeSlash();
        } else {
            // Standard "Stalker" approach: align with Y-lane then approach X [cite: 716, 723]
            super.updateAI(player);
        }
    }

    /**
     * Butterfly Knife Slash: 6-frame sequence with wide horizontal arc 
     */
    private executeKnifeSlash() {
        this.isSlashing = true;
        this.setVelocityX(0);

        this.play('dizel_slash', true);

        // Frame-specific trigger for the motion blur impact (Frames 2-4) 
        this.on('animationupdate', (anim: any, frame: any) => {
            if (frame.index >= 2 && frame.index <= 4) {
                this.triggerKnifeImpact();
            }
        });

        this.once('animationcomplete', () => {
            this.isSlashing = false;
            this.slashCooldown = true;
            // 1.5s recovery window for the scout class
            this.scene.time.delayedCall(1500, () => (this.slashCooldown = false));
        });
    }

    private triggerKnifeImpact() {
        const xDir = this.flipX ? -1 : 1;
        // Hitbox offset 110px from center to account for 256px arm reach [cite: 615]
        const impactZone = this.scene.add.zone(this.x + (110 * xDir), this.y - 100, 100, 60);
        this.scene.physics.add.existing(impactZone);

        this.scene.physics.add.overlap(impactZone, (this.scene as any).player, (z, p: any) => {
            p.takeDamage(25); // Standard stab damage [cite: 642]
            this.goreManager.emitGore(impactZone.x, impactZone.y, 'HIT'); // Visual feedback [cite: 681]
            this.audioManager.playGlobalSFX('sfx_knife_stab');
            
            // Hit Stop for impact weight [cite: 742]
            this.scene.physics.world.pause();
            this.scene.time.delayedCall(50, () => this.scene.physics.world.resume());
        });

        this.scene.time.delayedCall(100, () => impactZone.destroy());
    }

    /**
     * Knockdown Logic: Jerked violently back with i-frames until get-up completes.
     */
    public takeKnockdown() {
        if (this.isDead || this.isKnockedDown) return;

        this.isKnockedDown = true;
        this.isInvulnerable = true; 
        
        // Flight path: fly backward horizontally with a slight upward arc [cite: 704]
        this.setVelocity(this.flipX ? 300 : -300, -200); 
        this.play('dizel_knockdown', true);

        this.once('animationcomplete', () => {
            // Stay prone for 2.5 seconds (the "Dazed" state)
            this.scene.time.delayedCall(2500, () => this.recover());
        });
    }

    private recover() {
        // 6-frame recovery sequence [cite: 704]
        this.play('dizel_getup', true);

        this.once('animationcomplete', () => {
            this.isKnockedDown = false;
            this.isInvulnerable = false;
            this.isHurt = false;
        });
    }
}
