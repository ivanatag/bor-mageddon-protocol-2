import Phaser from 'phaser';
import { Enemy } from './Enemy';
import { GoreManager } from '../systems/GoreManager';
import { AudioManager } from '../systems/AudioManager';

/**
 * SlobodanCEO: The Architect of Inflation.
 * First Boss of Bor 1993. Features a Multi-Hitbox system,
 * Phase Transition, and a balanced three-part attack suite[cite: 962, 963].
 */
export class SlobodanCEO extends Enemy {
    private headHitbox!: Phaser.GameObjects.Zone;
    private torsoHitbox!: Phaser.GameObjects.Zone;
    private isPhaseTwo: boolean = false;
    private maxHealth: number = 500; [cite: 968]
    private jumpTimer: number = 0;

    constructor(scene: Phaser.Scene, x: number, y: number, goreManager: GoreManager, audioManager: AudioManager) {
        // Initialized with the boss's 256px spritesheet [cite: 970, 971]
        super(scene, x, y, 'slobodan_ceo_256', goreManager, audioManager);
        
        this.health = 500; [cite: 972]
        this.enemyType = 'slobodan'; [cite: 973]

        // Scale to 10ft height relative to the player characters [cite: 974, 975]
        this.setScale(1.3);
        this.setOrigin(0.5, 1); [cite: 976]

        // Narrowed collision box for depth sorting on the industrial road belt [cite: 977, 978]
        this.body.setSize(100, 50);
        this.body.setOffset(78, 205);
        this.body.setImmovable(true); [cite: 980]

        this.createBossHitboxes();
    }

    private createBossHitboxes() {
        // Head: Targeted at the face/glasses for 2x - 3x Damage [cite: 984, 1607]
        this.headHitbox = this.scene.add.zone(this.x, this.y - 200, 80, 60);
        // Torso: Standard damage for the power suit area [cite: 986, 987]
        this.torsoHitbox = this.scene.add.zone(this.x, this.y - 100, 140, 120);

        this.scene.physics.add.existing(this.headHitbox);
        this.scene.physics.add.existing(this.torsoHitbox);
    }

    public updateAI(player: Phaser.Physics.Arcade.Sprite) {
        if (this.isDead || this.isHurt || this.isAttacking) return; [cite: 991, 992]

        // Keep hitboxes synchronized with the 256px skeletal frame [cite: 993, 994, 1612]
        this.headHitbox.setPosition(this.x, this.y - 200);
        this.torsoHitbox.setPosition(this.x, this.y - 100);

        // Phase Transition: Enrage at 50% HP [cite: 996, 997, 1614]
        if (this.health < (this.maxHealth * 0.5) && !this.isPhaseTwo) {
            this.triggerPhaseTwo();
        }

        this.handleBossCombat(player);
    }

    private handleBossCombat(player: Phaser.Physics.Arcade.Sprite) {
        const speed = this.isPhaseTwo ? 85 : 45; [cite: 1003]
        const distX = player.x - this.x;

        this.setVelocityX(distX > 0 ? speed : -speed); [cite: 1005]
        this.flipX = distX < 0; [cite: 1006]

        // Close-Range Attack Choice (X < 200px) [cite: 1008]
        if (Math.abs(distX) < 200 && !this.isAttacking) {
            // Weights: 60% chance for regular punch, 40% for heavy slam
            if (Phaser.Math.Between(0, 100) > 40) {
                this.executeRegularSwipe();
            } else {
                this.executeAuditHammer();
            }
        } 
        // Long-Range Attack Choice: Gap-closer Jump [cite: 1226]
        else if (this.scene.time.now > this.jumpTimer && !this.isAttacking) {
            this.executeJumpSlam(player);
            this.jumpTimer = this.scene.time.now + (this.isPhaseTwo ? 4000 : 5500);
        }

        if (!this.isAttacking) {
            const anim = this.isPhaseTwo ? 'slobodan_run' : 'slobodan_walk'; [cite: 1003]
            this.play(anim, true);
        }
    }

    /**
     * Regular Horizontal Punch: Explicit arm extension to fix 'headbutt' issue.
     * Uses 6-frame sequence: Wind-up (1-2), Full Extension (3-4), Recovery (5-6).
     */
    public executeRegularSwipe() {
        this.isAttacking = true;
        this.setVelocityX(0);
        this.play('slobodan_regular_swipe', true);

        this.audioManager.playSFX('sfx_swipe_heavy');

        // Frame 3/4 are the active impact frames for full extension
        this.on('animationupdate', (anim: any, frame: any) => {
            if (frame.index === 3) this.triggerSwipeImpact();
        });

        this.once('animationcomplete', () => {
            this.isAttacking = false;
            this.play('slobodan_idle');
            this.off('animationupdate');
        });
    }

    private triggerSwipeImpact() {
        // Wide xOffset (145px) to account for full arm extension
        const xOffset = this.flipX ? -145 : 145;
        const swipeZone = this.scene.add.zone(this.x + xOffset, this.y - 150, 150, 100);
        this.scene.physics.add.existing(swipeZone);

        this.scene.physics.add.overlap(swipeZone, (this.scene as any).player, (z, p: any) => {
            p.takeDamage(22); // Mid-tier damage
            this.goreManager.emitGore(p.x, p.y, 'BUREAUCRATIC', 'HIT'); // Banknote shreds [cite: 804, 1621]
            this.scene.cameras.main.shake(150, 0.007); [cite: 1015]
        });

        this.scene.time.delayedCall(150, () => swipeZone.destroy());
    }

    public executeAuditHammer() {
        this.isAttacking = true;
        this.setVelocityX(0); 
        this.play('slobodan_attack', true); [cite: 1014]

        this.on('animationupdate', (anim: any, frame: any) => {
            if (frame.index === 5) this.triggerShockwaveImpact();
        });

        this.once('animationcomplete', () => {
            this.isAttacking = false;
            this.play('slobodan_idle');
            this.off('animationupdate');
        });
    }

    private triggerShockwaveImpact() {
        this.scene.cameras.main.shake(600, 0.025); [cite: 1015, 1616]
        this.audioManager.playSFX('sfx_boss_slam_heavy');

        // Create horizontal impact zone for 500B dinar notes [cite: 949, 1609]
        const shockZone = this.scene.add.zone(this.x + (this.flipX ? -130 : 130), this.y - 20, 220, 80);
        this.scene.physics.add.existing(shockZone);

        this.scene.physics.add.overlap(shockZone, (this.scene as any).player, (z, p: any) => {
            p.takeDamage(45, true); // High damage + knockback
            this.goreManager.emitGore(p.x, p.y, 'BUREAUCRATIC', 'FINISHER'); [cite: 1019]
        });

        this.scene.time.delayedCall(150, () => shockZone.destroy());
    }

    private executeJumpSlam(player: Phaser.Physics.Arcade.Sprite) {
        this.isAttacking = true;
        this.play('slobodan_jump_start'); 

        const lungeTarget = player.x > this.x ? this.x + 350 : this.x - 350;

        this.scene.tweens.add({
            targets: this,
            x: lungeTarget,
            y: this.y - 220, 
            duration: 650,
            yoyo: true,
            ease: 'Cubic.easeOut',
            onYoyo: () => {
                this.setTexture('slobodan_ceo_256', 'slobodan_jump_attack'); 
                this.triggerShockwaveImpact();
            },
            onComplete: () => {
                this.play('slobodan_jump_landing');
                this.play('slobodan_idle');
                this.isAttacking = false;
            }
        });
    }

    public takeDamageFromZone(amount: number, zone: 'head' | 'torso') {
        if (this.isDead || this.isHurt) return;
        this.isHurt = true;

        // Head shots take triple damage in Level 1 boss fight [cite: 1025, 1026, 1620]
        const multiplier = zone === 'head' ? 3 : 1;
        this.health -= (amount * multiplier); [cite: 1027]

        this.play('slobodan_hurt', true); [cite: 703]
        this.scene.events.emit('spawn-gore', this.x, this.y - 150, 'HIT');

        // Hit-stop for 10ft boss impact weight [cite: 1030, 1031]
        this.scene.physics.world.pause();
        this.scene.time.delayedCall(100, () => {
            this.scene.physics.world.resume();
            if (this.health <= 0) this.die(); 
            else this.isHurt = false;
        });
    }

    private triggerPhaseTwo() {
        this.isPhaseTwo = true; [cite: 1036, 1037, 1622]
        this.setTint(0xff5555); [cite: 1038]
        this.scene.events.emit('boss-dialogue', "REORGANIZACIJA POČINJE!"); [cite: 1039, 1578]
        this.scene.events.emit('vhs-glitch-start'); [cite: 1307, 1616]
    }

    protected die() {
        this.isDead = true; [cite: 1040, 1041]
        this.setVelocity(0, 0);
        this.scene.physics.world.pause();

        // Satirical Defeat Dialogue [cite: 1044, 1584, 1625]
        this.scene.events.emit('boss-dialogue', "I... TREBAO SAM... KUPITI... NEMCA...");
        this.play('slobodan_dissolve'); [cite: 1045]

        this.goreManager.emitGore(this.x, this.y - 100, 'BUREAUCRATIC', 'FINISHER'); [cite: 1046]

        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            y: this.y + 60,
            duration: 3500,
            delay: 2000,
            onComplete: () => {
                this.headHitbox.destroy(); [cite: 1048]
                this.torsoHitbox.destroy(); [cite: 1051]
                this.emit('destroyed'); [cite: 1052]
                this.destroy();
            }
        });
    }
}

