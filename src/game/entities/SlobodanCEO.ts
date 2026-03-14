import Phaser from 'phaser';
import { Player } from '../Player';

/**
 * Slobodan CEO: The Architect of Hyperinflation.
 * First Boss of Bor 1993. Features a Multi-Hitbox system,
 * Phase Transition, and a balanced three-part attack suite.
 */
export class SlobodanCEO extends Phaser.Physics.Arcade.Sprite {
    public health: number = 500;
    private maxHealth: number = 500;
    public isDead: boolean = false;
    public isHurt: boolean = false;
    private isAttacking: boolean = false;
    
    // Multi-hitbox references for CollisionManager
    public headHitbox!: Phaser.GameObjects.Zone;
    public torsoHitbox!: Phaser.GameObjects.Zone;
    private currentDamageZone: 'head' | 'torso' = 'torso';

    private isPhaseTwo: boolean = false;
    private jumpTimer: number = 0;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        // Initialized with the boss's dedicated atlas
        super(scene, x, y, 'boss_slobodan_93', 'slobodan-walk/001.png');
        
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Scale to 10ft height relative to the player characters
        this.setScale(1.3);
        this.setOrigin(0.5, 1);

        // Narrowed collision box for depth sorting on the industrial road belt
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(80, 50);
        body.setOffset(78, 205);
        body.setImmovable(true); // Boss cannot be pushed around easily

        this.createBossHitboxes();
        this.play('slobodan-walk', true);
    }

    private createBossHitboxes() {
        // Head: Targeted at the face/glasses for 3x Damage
        this.headHitbox = this.scene.add.zone(this.x, this.y - 200, 80, 60);
        // Torso: Standard damage for the power suit area
        this.torsoHitbox = this.scene.add.zone(this.x, this.y - 100, 140, 120);

        this.scene.physics.add.existing(this.headHitbox);
        this.scene.physics.add.existing(this.torsoHitbox);
    }

    public updateAI(player: Player) {
        if (this.isDead || this.isHurt || this.isAttacking) return;

        // Keep hitboxes synchronized with the moving boss sprite
        this.headHitbox.setPosition(this.x, this.y - 200);
        this.torsoHitbox.setPosition(this.x, this.y - 100);

        // Phase Transition: Enrage at 50% HP
        if (this.health < (this.maxHealth * 0.5) && !this.isPhaseTwo) {
            this.triggerPhaseTwo();
        }

        this.handleBossCombat(player);
    }

    private handleBossCombat(player: Player) {
        const speed = this.isPhaseTwo ? 85 : 45;
        const distX = player.x - this.x;
        const distY = player.y - this.y;

        this.setFlipX(distX < 0);

        // 1. Close-Range Attack Choice (X < 200px)
        if (Math.abs(distX) < 200 && Math.abs(distY) < 40 && !this.isAttacking) {
            // Weights: 60% chance for regular punch, 40% for heavy slam
            if (Phaser.Math.Between(0, 100) > 40) {
                this.executeRegularSwipe(player);
            } else {
                this.executeAuditHammer(player);
            }
        } 
        // 2. Long-Range Attack Choice: Gap-closer Jump
        else if (this.scene.time.now > this.jumpTimer && !this.isAttacking) {
            this.executeJumpSlam(player);
            this.jumpTimer = this.scene.time.now + (this.isPhaseTwo ? 4000 : 5500);
        }
        // 3. Pursue Player
        else if (!this.isAttacking) {
            // Move strictly on X if far away, align Y to get into the same "lane"
            const dirX = distX > 0 ? 1 : -1;
            const dirY = distY > 0 ? 1 : -1;

            let vx = dirX * speed;
            let vy = Math.abs(distY) > 10 ? dirY * (speed * 0.6) : 0;

            this.setVelocity(vx, vy);

            const anim = this.isPhaseTwo ? 'slobodan-run' : 'slobodan-walk';
            if (this.anims.currentAnim?.key !== anim) {
                this.play(anim, true);
            }
        }
    }

    private executeRegularSwipe(player: Player) {
        this.isAttacking = true;
        this.setVelocity(0, 0);
        this.play('slobodan-punch-1', true);

        this.scene.events.emit('play-generic-sfx', 'woosh_heavy');

        // Apply damage near full extension (approx 300ms)
        this.scene.time.delayedCall(300, () => {
            if (this.isDead || this.isHurt) return;

            const distX = Math.abs(player.x - this.x);
            const distY = Math.abs(player.y - this.y);

            if (distX < 220 && distY < 40) {
                player.takeDamage(22); 
                this.scene.events.emit('spawn-gore', { x: player.x, y: player.y - 80, type: 'BUREAUCRATIC' }); // Banknote shreds
                this.scene.cameras.main.shake(150, 0.007);
            }
        });

        this.once('animationcomplete', (anim: any) => {
            if (anim.key === 'slobodan-punch-1') {
                this.isAttacking = false;
                this.play('slobodan-walk', true);
            }
        });
    }

    private executeAuditHammer(player: Player) {
        this.isAttacking = true;
        this.setVelocity(0, 0); 
        this.play('slobodan-punch-2', true); 

        // Apply shockwave damage near animation end (approx 500ms)
        this.scene.time.delayedCall(500, () => {
            if (this.isDead || this.isHurt) return;
            this.triggerShockwaveImpact(player);
        });

        this.once('animationcomplete', (anim: any) => {
            if (anim.key === 'slobodan-punch-2') {
                this.isAttacking = false;
                this.play('slobodan-walk', true);
            }
        });
    }

    private triggerShockwaveImpact(player: Player) {
        this.scene.cameras.main.shake(600, 0.025);
        this.scene.events.emit('play-generic-sfx', 'sfx_boss_slam_heavy');

        const distX = Math.abs(player.x - this.x);
        const distY = Math.abs(player.y - this.y);

        // Huge vertical and horizontal AoE for the shockwave
        if (distX < 250 && distY < 80) {
            player.takeDamage(45); // High damage + knockback
            this.scene.events.emit('spawn-gore', { x: player.x, y: player.y, type: 'BUREAUCRATIC' });
        }
    }

    private executeJumpSlam(player: Player) {
        this.isAttacking = true;
        this.play('slobodan-jump', true); 

        const lungeTarget = player.x > this.x ? this.x + 350 : this.x - 350;

        this.scene.tweens.add({
            targets: this,
            x: lungeTarget,
            y: this.y - 150, 
            duration: 650,
            yoyo: true,
            ease: 'Cubic.easeOut',
            onYoyo: () => {
                // Play the punch animation on the way down
                this.play('slobodan-jump-punch', true); 
                
                // Deal shockwave damage upon hitting the ground
                this.scene.time.delayedCall(325, () => {
                    if (!this.isDead) this.triggerShockwaveImpact(player);
                });
            },
            onComplete: () => {
                if (!this.isDead) {
                    this.play('slobodan-walk', true);
                    this.isAttacking = false;
                }
            }
        });
    }

    // --- COLLISION MANAGER INTEGRATION ---
    
    public setDamageZone(zone: 'head' | 'torso') {
        this.currentDamageZone = zone;
    }

    public takeDamage(amount: number) {
        if (this.isDead || this.isHurt) return;
        this.isHurt = true;

        // Head shots take triple damage!
        const multiplier = this.currentDamageZone === 'head' ? 3 : 1;
        this.health -= (amount * multiplier); 

        // Reset zone back to default torso
        this.currentDamageZone = 'torso';

        this.play('slobodan-damage', true);
        this.scene.events.emit('spawn-gore', { x: this.x, y: this.y - 150, type: 'HIT' });

        // Hit-stop for 10ft boss impact weight
        this.scene.physics.world.pause();
        this.scene.time.delayedCall(100, () => {
            this.scene.physics.world.resume();
            if (this.health <= 0) {
                this.die(); 
            } else {
                this.scene.time.delayedCall(300, () => {
                    this.isHurt = false;
                    this.play(this.isPhaseTwo ? 'slobodan-run' : 'slobodan-walk', true);
                });
            }
        });
    }

    private triggerPhaseTwo() {
        this.isPhaseTwo = true;
        this.setTint(0xff5555); // Angry red tint
        
        // Trigger React UI effects via global event bus
        this.scene.events.emit('update-corruption'); // Triggers VHS Glitch on GameHUD!
        console.log("BOSS DIALOGUE: REORGANIZACIJA POČINJE!"); // Placeholder for subtitles
    }

    protected die() {
        this.isDead = true;
        this.setVelocity(0, 0);
        
        // Disable physics bodies so player doesn't get stuck
        (this.body as Phaser.Physics.Arcade.Body).enable = false;
        this.headHitbox.destroy();
        this.torsoHitbox.destroy();

        console.log("BOSS DIALOGUE: I... TREBAO SAM... KUPITI... NEMCA...");
        
        this.play('slobodan-dying', true);
        this.scene.events.emit('spawn-gore', { x: this.x, y: this.y - 100, type: 'BUREAUCRATIC' });

        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            y: this.y + 60,
            duration: 3500,
            delay: 2000,
            onComplete: () => {
                // Tell the level that the boss is dead so the "Level Clear" screen triggers
                this.scene.events.emit('boss-defeated');
                this.destroy();
            }
        });
    }
}