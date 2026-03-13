import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // ==========================================
        // 1. LOAD ENVIRONMENT & UI ASSETS
        // ==========================================
        // (Assuming you have placeholders for these right now)
        this.load.image('part1_sky', 'assets/env/part1_sky.png');
        this.load.image('obj_kiosk', 'assets/env/obj_kiosk.png');
        this.load.image('muzzle_flash', 'assets/effects/muzzle-flash-m70.png');
        
        // ==========================================
        // 2. THE 1993 ENEMY MEGA-ATLAS
        // ==========================================
        // Instead of loading 5 separate files, we load the single highly-optimized 1993 roster.
        this.load.atlas(
            'enemies_1993', 
            'assets/sprites/enemies/enemies_1993.png', 
            'assets/sprites/enemies/enemies_1993.json'
        );

        // (You would still load the Player atlases separately since they are huge and used in all eras)
        // this.load.atlas('marko', 'assets/sprites/players/marko.png', 'assets/sprites/players/marko.json');
    }

    create() {
        // Automatically generate all 1993 enemy animations from the Mega-Atlas
        this.createEnemy1993Animations();

        // (You would also generate Player animations here)

        // Once everything is loaded and parsed, boot the main game!
        this.scene.start('MainLevel');
    }

    /**
     * Reads the exact folder names from your CSV and turns them into global animations.
     */
    private createEnemy1993Animations() {
        // Mapped exactly to the "BOR - Graphic Asset Register - Movements.csv"
        const enemyRoster = [
            {
                character: 'MUP',
                animations: ['mup-idle', 'mup-walk', 'mup-punch-1', 'mup-punch-2', 'mup-damage', 'mup-dying', 'mup-knockdown-get-up']
            },
            {
                character: 'Dizelaš', 
                animations: ['dizel-walk', 'dizel-run', 'dizel-punch-1', 'dizel-throw', 'dizel-damage', 'dizel-dying', 'dizel-knockdown-get-up']
            },
            {
                character: 'Dizelčić', 
                animations: ['dizelcic-walk', 'dizelcic-punch-1', 'dizelcic-damage', 'dizelcic-dying', 'dizelcic-knockdown-get-up']
            },
            {
                character: 'Miner',
                animations: ['miner-walk', 'miner-melee', 'miner-damage', 'miner-dying', 'miner-knockdown-get-up']
            },
            {
                character: 'Slobodan (Boss)', 
                animations: ['slobodan-walk', 'slobodan-run', 'slobodan-jump', 'slobodan-jump-punch', 'slobodan-punch-1', 'slobodan-punch-2', 'slobodan-damage', 'slobodan-special-attack', 'slobodan-dying', 'slobodan-knockdown-get-up']
            }
        ];

        // Loop through the roster and generate the animations
        enemyRoster.forEach(enemy => {
            enemy.animations.forEach(animName => {
                
                // Automatically make idle, walk, and run animations loop infinitely
                const isLooping = animName.includes('walk') || animName.includes('run') || animName.includes('idle');
                
                this.anims.create({
                    key: animName, // The global key you will call (e.g., this.play('mup-walk'))
                    frames: this.anims.generateFrameNames('enemies_1993', {
                        
                        // IMPORTANT: TexturePacker usually formats frame names as "Folder/001.png" or "Folder_01".
                        // Adjust this prefix to exactly match how your packer exports the JSON!
                        prefix: `${animName}/`, 
                        suffix: '.png',
                        start: 1,
                        end: 8, // Adjust this default end frame if some animations are longer
                        zeroPad: 3 // e.g., 001, 002, 003
                    }),
                    frameRate: 10, // 16-bit retro frame pacing
                    repeat: isLooping ? -1 : 0
                });
            });
        });
    }
}