import Phaser from 'phaser';

/**
 * UIScene: The Heads-Up Display (HUD).
 * Displays the active character's health, ammo, SMF meter, and industrial score.
 */
export class UIScene extends Phaser.Scene {
    private ammoText!: Phaser.GameObjects.Text;
    private healthBar!: Phaser.GameObjects.Graphics;
    private smfBar!: Phaser.GameObjects.Graphics;
    private scoreText!: Phaser.GameObjects.Text;
    
    private currentScore: number = 0;
    private maxHealth!: number;

    constructor() {
        super({ key: 'UIScene' });
    }

    create() {
        // 1. Fetch Dynamic Data
        const characterName = (this.registry.get('selectedCharacter') || 'MARKO').toUpperCase();

        // Dynamically set Max Health so the background bar scales correctly
        if (characterName === 'MAJA') this.maxHealth = 150;
        else if (characterName === 'DARKO') this.maxHealth = 90;
        else this.maxHealth = 100; // Marko default

        // 2. Label Styles
        const labelStyle = { 
            fontFamily: '"Press Start 2P", "Metal Mania", monospace', 
            fontSize: '24px', 
            color: '#ff0000',
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', fill: true }
        };

        const infoStyle = { 
            fontFamily: 'monospace', 
            fontSize: '20px', 
            color: '#ffffff',
            shadow: { offsetX: 1, offsetY: 1, color: '#000000', fill: true }
        };

        // 3. Player Info
        this.add.text(20, 20, `${characterName} - 1993`, labelStyle);
        this.ammoText = this.add.text(20, 55, 'AMMO: 5/5', infoStyle);
        
        // 4. Initialize Graphics Bars
        this.healthBar = this.add.graphics();
        this.smfBar = this.add.graphics();
        
        // 5. Score Tracking
        this.scoreText = this.add.text(1900, 20, 'DINARS: 0', labelStyle).setOrigin(1, 0);

        // ==========================================
        // INITIAL SYNC & EVENT LISTENERS
        // ==========================================
        const mainLevel = this.scene.get('MainLevel') as any;

        // Sync initial state directly from the player if they already exist
        if (mainLevel && mainLevel.player) {
            this.drawHealthBar(mainLevel.player.health);
            this.drawSMFBar(mainLevel.player.smfMeter);
            this.ammoText.setText(`AMMO: ${mainLevel.player.ammo}/5`);
        } else {
            this.drawHealthBar(this.maxHealth);
            this.drawSMFBar(0);
        }

        // Listen for live updates
        mainLevel.events.on('update-ammo', (current: number, max: number) => {
            this.ammoText.setText(`AMMO: ${current}/${max}`);
        });

        mainLevel.events.on('update-health', (health: number) => {
            this.drawHealthBar(health);
        });

        mainLevel.events.on('update-smf', (smf: number) => {
            this.drawSMFBar(smf);
        });

        mainLevel.events.on('add-score', (amount: number) => {
            this.currentScore += amount;
            this.scoreText.setText(`DINARS: ${this.currentScore}`);
            
            // Pop effect for juice
            this.tweens.add({
                targets: this.scoreText,
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 100,
                yoyo: true
            });
        });

        // CRITICAL MEMORY LEAK PREVENTION:
        this.events.on('shutdown', () => {
            mainLevel.events.off('update-ammo');
            mainLevel.events.off('update-health');
            mainLevel.events.off('update-smf');
            mainLevel.events.off('add-score');
        });
    }

    /**
     * Draws the dynamic health bar. Turns red when health is critically low.
     */
    private drawHealthBar(health: number) {
        this.healthBar.clear();
        
        // Background (Dark Red/Black) scales dynamically based on character's max health!
        this.healthBar.fillStyle(0x330000, 0.8);
        this.healthBar.fillRect(20, 90, this.maxHealth * 2, 20); 
        
        const currentHealth = Math.max(0, health);
        const barColor = currentHealth > 30 ? 0x00ff00 : 0xff0000;
        
        this.healthBar.fillStyle(barColor, 1);
        this.healthBar.fillRect(20, 90, currentHealth * 2, 20);
    }

    /**
     * Draws the blue Special Move / Finisher (SMF) Meter right below the health bar.
     * Max SMF is always 100 for all characters.
     */
    private drawSMFBar(smf: number) {
        this.smfBar.clear();
        
        // Background (Dark Blue) - Matches the width of the health bar for UI symmetry
        this.smfBar.fillStyle(0x000033, 0.8);
        this.smfBar.fillRect(20, 115, this.maxHealth * 2, 10); 
        
        const currentSMF = Math.max(0, Math.min(100, smf));
        
        // Bright cyan when full (ready for Finisher), standard blue otherwise
        const barColor = currentSMF >= 100 ? 0x00ffff : 0x0088ff;
        
        this.smfBar.fillStyle(barColor, 1);
        
        // Calculate the width as a percentage of the total background width
        const fillWidth = (currentSMF / 100) * (this.maxHealth * 2);
        this.smfBar.fillRect(20, 115, fillWidth, 10);
    }
}