import Phaser from 'phaser';
import { AudioManager } from '../systems/AudioManager';
import { GoreManager } from '../systems/GoreManager';

/**
 * Enemy: Represents industrial-era threats in Bor.
 * Handles AI movement, damage states, and Armor Break logic.
 */
export class Enemy extends Phaser.Physics.Arcade.Sprite {
    public hp: number = 100;
    public maxHealth: number = 100;
    public enemyType: string;
    public isDead: boolean = false;
    public isHurt: boolean = false;
    public isAttacking: boolean = false;
    public isKnockedDown: boolean = false;
    public isArmorBroken: boolean = false;

    protected audio: AudioManager;
    protected gore: GoreManager;
    private armorBreakTimer: Phaser.Time.TimerEvent | null = null;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, gore: GoreManager, audio: AudioManager) {
        super(scene, x, y, texture);
        this.enemyType = texture;
        this.gore = gore;
        this.audio = audio;

        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Standard 16-bit hitbox calibrated for the 250px industrial road belt [cite: 2051-2052]
        this.setCollideWorldBounds(true);
        this.body.setSize(80, 40); 
        this.body.setOffset(88, 210); // Positions box at character's boots [cite: 1403-1405]
    }

    /**
     * "The Stalker" AI Logic: Aligns with player's vertical lane then approaches on X-axis [cite: 706-708, 717].
     */
    public updateAI(player: Phaser.Physics.Arcade.Sprite) {
        if (this.isDead || this.isHurt || this.isAttacking || this.isKnockedDown) {
            this.setVelocity(0, 0);
            return;
        }

        const distanceX = player.x - this.x;
        const distanceY = player.y - this.y;
        const absDistX = Math.abs(distanceX);
        const absDistY = Math.abs(distanceY);

        // 1. Lane Alignment (Z-axis/Y movement) [cite: 718-719]
        if (absDistY > 15) {
            this.setVelocityY(distanceY > 0 ? 100 : -100);
        } else {
            this.setVelocityY(0);
        }

        // 2. Approach (X-axis movement) [cite: 723-725]
        if (absDistX > 180) {
            this.setVelocityX(distanceX > 0 ? 120 : -120);
            this.setFlipX(distanceX < 0);
            this.play(`${this.enemyType}_walk`, true);
        } 
        // 3. Attack Trigger [cite: 729-734]
        else if (absDistX <= 180 && absDistY <= 20) {
            this.setVelocityX(0);
            this.executeEnemyAttack();
        } else {
            this.setVelocityX(0);
            this.play(`${this.characterName}_idle`, true);
        }
    }

    protected executeEnemyAttack() {
        // Overridden by specific enemy classes (e.g., Dizel knife slash) [cite: 2109]
    }

    /**
     * Damage Logic: Accounts for Armor Break multipliers and gore feedback [cite: 2057-2058].
     */
    public takeDamage(amount: number) {
        if (this.isDead) return;

        // Apply 1.5x multiplier if armor is broken (triggered by Maja) [cite: 1017, 1136-1137].
        const finalDamage = this.isArmorBroken ? Math.floor(amount * 1.5) : amount;
        this.hp -= finalDamage;
        
        this.isHurt = true;
        this.setTint(this.isArmorBroken ? 0xB87333 : 0xff0000); // Maintain Copper tint if broken

        // Audio grunts and screen shake juice [cite: 2060, 2193]
        this.audio.playMaleDamageGrunt();
        this.scene.cameras.main.shake(100, 0.005);

        // Spawn "Bureaucratic Gore" particles 
        this.scene.events.emit('spawn-gore', this.x, this.y - 100, 'BUREAUCRATIC', 'HIT');

        this.scene.time.delayedCall(200, () => {
            if (!this.isDead) {
                this.isHurt = false;
                if (!this.isArmorBroken) this.clearTint();
            }
        });

        if (this.hp <= 0) this.die();
    }

    /**
     * Applies Armor Break state: Reduces defense and tints sprite Copper/Rust[cite: 1017].
     */
    public applyArmorBreak() {
        if (this.isDead) return;

        this.isArmorBroken = true;
        this.setTint(0xB87333); // Visual feedback for exposed armor [cite: 1843]
        
        // Impact FX
        this.scene.events.emit('spawn-industrial-debris', { x: this.x, y: this.y - 100 });

        // Auto-recovery after 5 seconds
        if (this.armorBreakTimer) this.armorBreakTimer.remove();
        this.armorBreakTimer = this.scene.time.delayedCall(5000, () => {
            this.isArmorBroken = false;
            if (!this.isDead) this.clearTint();
        });
    }

    protected die() {
        this.isDead = true;
        this.setVelocity(0, 0);
        this.body.enable = false; // Prevents further collisions [cite: 2066]

        // Final "Fatality" Gore burst [cite: 805, 1348]
        this.scene.events.emit('spawn-gore', this.x, this.y - 100, 'BUREAUCRATIC', 'FINISHER');
        this.audio.playRandomSFX(['Break_1', 'Break_2', 'Break_3'], 0.8);
        
        this.play(`${this.enemyType}_die`);

        // Sinking Archive Tween: Body sinks into the industrial floor runoff [cite: 1349-1356, 1474-1476]
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            y: this.y + 60,
            duration: 3500,
            delay: 2000,
            onComplete: () => this.destroy()
        });
    }
}
