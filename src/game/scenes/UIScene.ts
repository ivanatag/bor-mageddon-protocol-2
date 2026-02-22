import Phaser from 'phaser';

/**
 * UIScene: The Heads-Up Display (HUD).
 * Displays Marko's health, ammo, and industrial score.
 */
export class UIScene extends Phaser.Scene {
    private ammoText!: Phaser.GameObjects.Text;
    private healthBar!: Phaser.GameObjects.Graphics;
    private scoreText!: Phaser.GameObjects.Text;

    constructor() {
        super({ key: 'UIScene' });
    }

    create() {
        // 1. Label Style: Industrial Red
        const labelStyle = { 
            fontFamily: '"Press Start 2P", monospace', 
            fontSize: '20px', 
            color: '#ff0000' 
        };

        const infoStyle = { 
            fontFamily: 'monospace', 
            fontSize: '18px', 
            color: '#ffffff' 
        };

        // 2. Player Info
        this.add.text(20, 20, 'MARKO - 1993', labelStyle);
        
        // 3. Ammo Counter (M70 Tracking)
        this.ammoText = this.add.text(20, 50, 'AMMO: 6/6', infoStyle);
        
        // 4. Health Bar (Green to Red)
        this.healthBar = this.add.graphics();
        this.drawHealthBar(100);

        // 5. Score Tracking
        this.scoreText = this.add.text(1700, 20, 'Dinars: 0', labelStyle).setOrigin(1, 0);

        // --- Event Listeners from MainLevel ---
        const mainLevel = this.scene.get('MainLevel');

        mainLevel.events.on('update-ammo', (count: number) => {
            this.ammoText.setText(`AMMO: ${count}/6`);
        });

        mainLevel.events.on('update-health', (percent: number) => {
            this.drawHealthBar(percent);
        });

        mainLevel.events.on('add-score', (amount: number) => {
            // Update score display logic
        });
    }

    private drawHealthBar(percent: number) {
        this.healthBar.clear();
        
        // Background (Dark Red)
        this.healthBar.fillStyle(0x330000, 0.8);
        this.healthBar.fillRect(20, 80, 200, 15);
        
        // Foreground (Green)
        const barColor = percent > 30 ? 0x00ff00 : 0xff0000;
        this.healthBar.fillStyle(barColor, 1);
        this.healthBar.fillRect(20, 80, percent * 2, 15);
    }
}
