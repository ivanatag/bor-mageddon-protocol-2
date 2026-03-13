import Phaser from 'phaser';
import { Enemy } from '../Enemy';

/**
 * MUP (Milicija) Class: The tactical blocker of Bor 1993.
 * Features 50% damage reduction from frontal attacks due to riot shield.
 */
export class MUP extends Enemy {
    private isShieldRaised: boolean = true;
    private isBatonStriking: boolean = false;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        // Initialize using the 'mup_1993' atlas key
        super(scene, x, y, 'mup_1993');
        
        // MUP has moderate health
        this.health = 180;
        this.maxHealth = 180;
        this.speed = 100; // Slightly slower due to shield
    }

    /**
     * Defensive Overlap: Checks if the attack hits the shield.
     * Frontal attacks are mitigated by 50%.
     */
    public takeDamage(amount: number) {
        if (this.isDead) return;

        // Find the player to check facing direction
        const player = (this.scene as any).player;
        if (!player) {
            super.takeDamage(amount);
            return;
        }

        // Check if the MUP is facing the player to block
        const isFacingPlayer = (player.x > this.x && !this.flipX) || (player.x < this.x && this.flipX);

        if (this.isShieldRaised && isFacingPlayer) {
            // Shield block: 50% damage reduction
            const reducedAmount = Math.ceil(amount * 0.5);
            super.takeDamage(reducedAmount);

            // Play block animation instead of standard hurt animation if not dead
            if (!this.isDead) {
                this.play('mup_1993_wince', true);
                
                // Metallic spark visual feedback
                this.scene.events.emit('spawn-industrial-debris', { 
                    x: this.x + (this.flipX ? -20 : 20), 
                    y: this.y - 40 
                });
                
                // Play shield hit sound
                this.scene.sound.playAudioSprite('sfx_atlas', 'shield_block');
            }
        } else {
            // Flanked or attacked from behind: Full damage
            super.takeDamage(amount);
        }
    }

    /**
     * AI Logic: Standard stalking toward player with strike range check.
     */
    public updateAI(player: Phaser.GameObjects.Sprite) {
        if (this.isDead || this.isHurt || this.isBatonStriking) return;

        const distX = Math.abs(player.x - this.x);
        const distY = Math.abs(player.y - this.y);

        // Strike Range: 120px reach
        if (distX <= 120 && distY <= 40) {
            this.executeBatonStrike();
        } else {
            // Use base Enemy class stalking logic
            super.updateAI(player);
        }
    }

    /**
     * Baton Strike: Heavy horizontal arc that denies the immediate area.
     */
    private executeBatonStrike() {
        this.isBatonStriking = true;
        this.setVelocityX(0); // Stop moving to swing
        this.isShieldRaised = false; // Lower shield while swinging!

        this.play('mup_1993_attack', true);

        // Frame 4: Impact frame for the baton swing
        this.on('animationupdate', (anim: Phaser.Animations.Animation, frame: Phaser.Animations.AnimationFrame) => {
            if (frame.index === 4) {
                this.triggerBatonImpact();
            }
        });

        this.once('animationcomplete', () => {
            this.isBatonStriking = false;
            this.isShieldRaised = true; // Raise shield again
            this.off('animationupdate');
            this.play('mup_1993_idle', true);
        });
    }

    /**
     * Creates the damage hitbox for the baton.
     */
    private triggerBatonImpact() {
        // Play swing sound
        this.scene.sound.playAudioSprite('sfx_atlas', 'baton_swing');

        const xDir = this.flipX ? -1 : 1;
        
        // Create "Ghost Hitbox" for the baton reach
        const impactZone = this.scene.add.zone(this.x + (60 * xDir), this.y - 40, 80, 80);
        this.scene.physics.add.existing(impactZone);

        const player = (this.scene as any).player;
        if (player) {
            this.scene.physics.add.overlap(impactZone, player, (z, p: any) => {
                if (p.takeDamage && !p.isHurt) {
                    p.takeDamage(15); // Standard baton damage
                    this.scene.events.emit('spawn-gore', { x: player.x, y: player.y, type: 'CLASSIC' });
                }
            });
        }

        // Cleanup zone instantly after active frame
        this.scene.time.delayedCall(50, () => impactZone.destroy());
    }

    /**
     * Override standard death to include dropping the shield.
     */
    protected die() {
        super.die();
        this.isShieldRaised = false;
        
        // Shield dropping sound
        this.scene.sound.playAudioSprite('sfx_atlas', 'sfx_metal_clang'); 
    }
}