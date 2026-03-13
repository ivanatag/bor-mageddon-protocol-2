import Phaser from 'phaser';
import { Player } from '../Player';

/**
 * Dizel: The "Stabbing Brute" / Tracksuit Thug of Bor 1993.
 * Focused on high-speed approach, butterfly knife area denial, and weighted physics.
 */
export class Dizel extends Phaser.Physics.Arcade.Sprite {
    public health: number = 120; // Fast scout health profile
    public isDead: boolean = false;
    public isHurt: boolean = false;
    
    private isSlashing: boolean = false;
    private slashCooldown: boolean = false;
    private isKnockedDown: boolean = false;
    public isInvulnerable: boolean = false;

    private speed: number = 140; // Faster than the heavily armored MUP
    private attackRange: number = 100;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        // Initialised from the 1993 Mega-Atlas we set up in BootScene
        super(scene, x, y, 'enemies_1993', 'dizel-walk/001.png');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(50, 30);
        body.setOffset(25, 150); 
        this.setOrigin(0.5, 1);
        
        body.setCollideWorldBounds(true);
        body.setAllowGravity(false); // Belt-scroller depth physics

        // Note: CSV didn't have an idle animation for Dizelaš, so we default to walk
        this.play('dizel-walk', true); 
    }

    public updateAI(player: Player) {
        // Halt AI logic if dazed, dead, attacking, or knocked down
        if (this.isDead || this.isHurt || this.isSlashing || this.isKnockedDown) {
            this.setVelocity(0, 0);
            return;
        }

        const distX = Math.abs(player.x - this.x);
        const distY = Math.abs(player.y - this.y);

        this.setFlipX(player.x < this.x);

        // Attack Trigger: Within reach on X, and in the same Y lane
        if (distX <= this.attackRange && distY <= 20 && !this.slashCooldown) {
            this.executeKnifeSlash(player);
        } else {
            // Standard "Stalker" approach: align with Y-lane then approach X
            const dirX = player.x > this.x ? 1 : -1;
            const dirY = player.y > this.y ? 1 : -1;

            let vx = dirX * this.speed;
            let vy = distY > 10 ? dirY * (this.speed * 0.8) : 0;

            this.setVelocity(vx, vy);
            
            if (this.anims.currentAnim?.key !== 'dizel-walk') {
                this.play('dizel-walk', true);
            }
        }
    }

    /**
     * Butterfly Knife Slash: Fast attack using the CSV's dizel-punch-1
     */
    private executeKnifeSlash(player: Player) {
        this.isSlashing = true;
        this.setVelocity(0, 0);

        this.play('dizel-punch-1', true);

        // Frame-specific timing for the damage application (around 200ms into the animation)
        this.scene.time.delayedCall(200, () => {
            if (this.isDead || this.isHurt || this.isKnockedDown) return;

            const distX = Math.abs(player.x - this.x);
            const distY = Math.abs(player.y - this.y);

            // Re-check distance to see if player dodged out of the way
            if (distX <= this.attackRange + 20 && distY <= 30) {
                player.takeDamage(25); // Standard stab damage
                
                // Visual & Audio Feedback via Global Event Bus
                this.scene.events.emit('spawn-gore', { x: player.x, y: player.y - 80, type: 'CLASSIC' });
                this.scene.events.emit('play-generic-sfx', 'sfx_knife_stab');
                
                // Hit Stop for impact weight (Freezes game for 50ms)
                this.scene.physics.world.pause();
                this.scene.time.delayedCall(50, () => this.scene.physics.world.resume());
            }
        });

        this.once('animationcomplete', (anim: any) => {
            if (anim.key === 'dizel-punch-1') {
                this.isSlashing = false;
                this.slashCooldown = true;
                
                // 1.5s recovery window for the scout class
                this.scene.time.delayedCall(1500, () => (this.slashCooldown = false));
                this.play('dizel-walk', true);
            }
        });
    }

    /**
     * Standard Damage routing
     */
    public takeDamage(amount: number) {
        if (this.isDead || this.isInvulnerable) return;

        this.health -= amount;
        
        // Interrupt attacks
        this.isSlashing = false;
        
        // Flash white
        this.setTintFill(0xffffff);
        this.scene.time.delayedCall(50, () => this.clearTint());

        // Blood Splatter
        this.scene.events.emit('spawn-gore', { x: this.x, y: this.y - 90, type: 'CLASSIC' });
        
        // Audio
        this.scene.events.emit('play-sfx', { character: 'dizelas', action: 'damage' });

        if (this.health <= 0) {
            // Trigger the dramatic knockdown death
            this.takeKnockdown();
        } else {
            this.isHurt = true;
            this.play('dizel-damage', true);
            
            // Pushback
            this.x += this.flipX ? 15 : -15;

            this.scene.time.delayedCall(400, () => {
                if (!this.isDead && !this.isKnockedDown) {
                    this.isHurt = false;
                    this.play('dizel-walk', true);
                }
            });
        }
    }

    /**
     * Knockdown Logic: Jerked violently back with i-frames until get-up completes, or dies.
     */
    public takeKnockdown() {
        if (this.isDead || this.isKnockedDown) return;

        this.isKnockedDown = true;
        this.isInvulnerable = true; 
        
        // Flight path: push backward
        this.x += this.flipX ? 40 : -40; 
        this.play('dizel-knockdown-get-up', true);

        this.once('animationcomplete', () => {
            if (this.health <= 0) {
                // If health is 0, he dies after hitting the floor
                this.isDead = true;
                (this.body as Phaser.Physics.Arcade.Body).enable = false;
                this.scene.events.emit('play-sfx', { character: 'dizelas', action: 'dying' });
                this.play('dizel-dying', true);
                
                // Loot drop chance
                if (Phaser.Math.Between(1, 100) <= 40) {
                    this.scene.events.emit('spawn-loot', { x: this.x, y: this.y });
                }
            } else {
                // Recover and keep fighting
                this.isKnockedDown = false;
                this.isInvulnerable = false;
                this.isHurt = false;
                this.play('dizel-walk', true);
            }
        });
    }
}