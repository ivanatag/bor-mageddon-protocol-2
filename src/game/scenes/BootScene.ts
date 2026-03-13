import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // 1. CREATE A LOADING BAR
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

        const loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 50,
            text: 'DECRYPTING ASSETS...',
            style: { font: '20px monospace', color: '#39FF14' } // SMF Green
        }).setOrigin(0.5, 0.5);

        this.load.on('progress', (value: number) => {
            progressBar.clear();
            progressBar.fillStyle(0xff8c00, 1); // Orange
            progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
        });

        // ==========================================
        // 2. LOAD YOUR ASSETS
        // (Vite requires these to be in your /public folder)
        // ==========================================

        // Background
        this.load.image('part1_sky', '/part1_sky.jpg');

        // Characters (Assuming you exported them as Texture Atlases: a PNG and a JSON)
        // If you are using standard spritesheets, change this to this.load.spritesheet()
        this.load.atlas('marko', '/assets/sprites/marko.png', '/assets/sprites/marko.json');
        this.load.atlas('darko', '/assets/sprites/darko.png', '/assets/sprites/darko.json');
        this.load.atlas('maja', '/assets/sprites/maja.png', '/assets/sprites/maja.json');

        // Load the CSV Data as raw text
        this.load.text('movements_csv', '/assets/data/BOR _ Graphic Asset Register - Movements.csv');
        
        // (Optional: Load your audio atlas here if you have it)
        // this.load.audioSprite('sfx_atlas', '/assets/audio/sfx_atlas.json', ['/assets/audio/sfx_atlas.ogg', '/assets/audio/sfx_atlas.mp3']);
    }

    create() {
        // 3. PARSE THE CSV AND GENERATE ANIMATIONS
        this.generateAnimationsFromCSV();

        // 4. TRANSITION TO THE GAME
        // Add a slight delay just so the player can appreciate the 1993 loading aesthetic
        this.time.delayedCall(500, () => {
            this.scene.start('MainLevel');
        });
    }

    /**
     * Reads the loaded CSV text and automatically registers all character animations in Phaser.
     */
    private generateAnimationsFromCSV() {
        const csvData = this.cache.text.get('movements_csv');
        if (!csvData) {
            console.warn("CSV data not found! Animations will not play.");
            return;
        }

        // Split the CSV into rows
        const rows = csvData.split('\n');
        
        // Skip the header row (assuming row 0 is headers like Character,AnimName,Prefix,Start,End,Framerate,Repeat)
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i].trim();
            if (!row) continue;

            const cols = row.split(',');

            // Adjust these indices based on exactly how your columns are ordered in Google Sheets!
            // Example Assumption: 
            // Col 0: Character (marko)
            // Col 1: AnimName (special_attack)
            // Col 2: Prefix (marko_attack_)
            // Col 3: StartFrame (0)
            // Col 4: EndFrame (6)
            // Col 5: FrameRate (12)
            // Col 6: Repeat (-1 for loop, 0 for play once)
            
            const character = cols[0]?.trim();
            const animName = cols[1]?.trim();
            const prefix = cols[2]?.trim();
            const startFrame = parseInt(cols[3]?.trim(), 10);
            const endFrame = parseInt(cols[4]?.trim(), 10);
            const frameRate = parseInt(cols[5]?.trim(), 10) || 10;
            const repeat = parseInt(cols[6]?.trim(), 10) || 0;

            if (character && animName && prefix && !isNaN(startFrame) && !isNaN(endFrame)) {
                // E.g., Generates 'marko_special_attack'
                const globalAnimKey = `${character}_${animName}`;

                // Tell Phaser to build this animation
                this.anims.create({
                    key: globalAnimKey,
                    frames: this.anims.generateFrameNames(character, {
                        prefix: prefix,
                        start: startFrame,
                        end: endFrame,
                        zeroPad: 2, // e.g., marko_attack_01 (change to 0 if no padding)
                        suffix: '.png' // Adjust if your JSON packer doesn't use .png suffixes
                    }),
                    frameRate: frameRate,
                    repeat: repeat
                });
            }
        }
        
        console.log("All CSV Animations successfully generated!");
    }
}
