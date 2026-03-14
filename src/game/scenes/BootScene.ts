import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // ==========================================
        // 1. LOAD ENVIRONMENT & UI ASSETS
        // ==========================================
        // (Placeholders: Make sure these exist in public/assets/)
        this.load.image('part1_sky', 'assets/env/part1_sky.png');
        this.load.image('kiosk', 'assets/env/obj_kiosk.png');
        
        // Items and Projectiles
        this.load.image('item_dinar', 'assets/sprites/items/dinar.png');
        this.load.image('item_health', 'assets/sprites/items/health.png');
        this.load.image('item_pickaxe', 'assets/sprites/items/pickaxe.png');
        
        // ==========================================
        // 2. LOAD AUDIO SPRITE (The tool we just ran!)
        // ==========================================
        // Notice we only pass the MP3 now, skipping the OGG file
        this.load.audioSprite('sfx_atlas', 'assets/audio/sfx_atlas.json', [
            'assets/audio/sfx_atlas.mp3'
        ]);

        // ==========================================
        // 3. LOAD TEXTURE ATLASES
        // ==========================================
        // The Player (Placeholder example)
        // this.load.atlas('marko', 'assets/sprites/players/marko.png', 'assets/sprites/players/marko.json');

        // The 1993 Enemy Mega-Atlas (MUP, Dizel, Dizelcic, Miner)
        this.load.atlas(
            'enemies_1993', 
            'assets/sprites/enemies/enemies_1993.png', 
            'assets/sprites/enemies/enemies_1993.json'
        );

        // The 1993 Boss Atlas (Slobodan CEO)
        this.load.atlas(
            'boss_slobodan_93', 
            'assets/sprites/bosses/slobodan_93.png', 
            'assets/sprites/bosses/slobodan_93.json'
        );
    }

    create() {
        // Automatically generate all 1993 enemy animations from the Mega-Atlas
        this.createEnemy1993Animations();

        // Generate the boss animations
        this.createBossAnimations();

        // (You would also generate Player animations here in the future)

        // Once everything is loaded, parsed, and animations are created, boot the main game!
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
            }
        ];

        // Loop through the roster and generate the animations from 'enemies_1993'
        enemyRoster.forEach(enemy => {
            enemy.animations.forEach(animName => {
                
                // Automatically make idle, walk, and run animations loop infinitely
                const isLooping = animName.includes('walk') || animName.includes('run') || animName.includes('idle');
                
                this.anims.create({
                    key: animName, 
                    frames: this.anims.generateFrameNames('enemies_1993', {
                        prefix: `${animName}/`, 
                        suffix: '.png',
                        start: 1,
                        end: 8, // Adjust this if some animations have more/less than 8 frames
                        zeroPad: 3 // Assumes your files are named 001.png, 002.png
                    }),
                    frameRate: 10, // 16-bit retro frame pacing
                    repeat: isLooping ? -1 : 0
                });
            });
        });
    }

    /**
     * Creates the animations specifically for the Level 1 Boss
     */
    private createBossAnimations() {
        const bossAnimations = [
            'slobodan-walk', 'slobodan-run', 'slobodan-jump', 'slobodan-jump-punch', 
            'slobodan-punch-1', 'slobodan-punch-2', 'slobodan-damage', 
            'slobodan-special-attack', 'slobodan-dying', 'slobodan-knockdown-get-up'
        ];

        bossAnimations.forEach(animName => {
            const isLooping = animName.includes('walk') || animName.includes('run') || animName.includes('idle');
            
            this.anims.create({
                key: animName, 
                frames: this.anims.generateFrameNames('boss_slobodan_93', {
                    prefix: `${animName}/`, 
                    suffix: '.png',
                    start: 1,
                    end: 8, 
                    zeroPad: 3 
                }),
                frameRate: 10,
                repeat: isLooping ? -1 : 0
            });
        });
    }
}