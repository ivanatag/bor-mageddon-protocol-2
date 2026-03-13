import Phaser from 'phaser';

/**
 * UIScene: The Heads-Up Display (HUD).
 * Displays the active character's health, ammo, SMF meter, and industrial score.
 */
export class UIScene extends Phaser.Scene {
    private ammoText!: Phaser.GameObjects.Text;
    private healthBar!: Phaser.GameObjects.Graphics;
    private scoreText!: Phaser.GameObjects.Text;
    private currentScore: number = 0;

    constructor() {
        // We don't use active: true here. It's safer to let MainLevel launch it.
        super({ key: 'UIScene' });
    }

    create() {
        // 1. Fetch Dynamic Data
        // Read which character the user clicked in the 3D React Menu
        const characterName = (this.registry.get('selectedCharacter') || 'MARKO').toUpperCase();

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

        // 3. Player Info (Top Left)
        this.add.text(20, 20, `${characterName} - 1993`, labelStyle);
        
        // 4. Ammo Counter (Top Left, under name)
        // Defaulting to 5/5 since that's the M70 max ammo we set in Weapon.ts
        this.ammoText = this.add.text(20, 55, 'AMMO: 5/5', infoStyle);
        
        // 5. Health Bar Graphics
        this.healthBar = this.add.graphics();
        this.drawHealthBar(100); // Initial dummy draw

        // 6. Score Tracking (Top Right)
        // Positioned at 1900 to sit nicely in the top right corner of your 1920x1080 screen
        this.scoreText = this.add.text(1900, 20, 'DINARS: 0', labelStyle).setOrigin(1, 0);

        // ==========================================
        // EVENT LISTENERS
        // ==========================================
        const mainLevel = this.scene.get('MainLevel');

        mainLevel.events.on('update-ammo', (current: number, max: number) => {
            this.ammoText.setText(`AMMO: ${current}/${max}`);
        });

        mainLevel.events.on('update-health', (health: number) => {
            this.drawHealthBar(health);
        });

        mainLevel.events.on('update-smf', (smf: number) => {
            // Optional: You can draw a blue SMF bar here right below the health bar!
            // E.g., this.drawSMFBar(smf);
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
        // When the UI Scene shuts down (like if you die and restart), 
        // we must detach these listeners so they don't fire twice.
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
        
        // Background (Dark Red/Black)
        this.healthBar.fillStyle(0x330000, 0.8);
        this.healthBar.fillRect(20, 90, 300, 20); // Scaled up to fit a 150HP Tank like Maja
        
        // Prevent drawing negative health widths
        const currentHealth = Math.max(0, health);

        // Foreground (Green normally, Bright Red if under 30 HP)
        const barColor = currentHealth > 30 ? 0x00ff00 : 0xff0000;
        this.healthBar.fillStyle(barColor, 1);
        
        // Multiply by 2 so 100 HP equals 200 pixels wide on the screen
        this.healthBar.fillRect(20, 90, currentHealth * 2, 20);
    }
}