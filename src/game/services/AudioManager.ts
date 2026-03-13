import Phaser from 'phaser';

export class AudioManager {
    private scene: Phaser.Scene;
    private soundPools: Record<string, string[]> = {};

    constructor(scene: Phaser.Scene) {
        this.scene = scene;

        // Listen for global sound events so any file can request a sound!
        this.scene.events.on('play-sfx', (payload: { character: string, action: string }) => {
            this.playAction(payload.character, payload.action);
        });

        // Simple bypass for generic sounds (like UI clicks or item pickups)
        this.scene.events.on('play-generic-sfx', (soundName: string) => {
            this.scene.sound.playAudioSprite('sfx_atlas', soundName);
        });
    }

    /**
     * Call this in BootScene after parsing the Sound CSV.
     * Builds pools of randomized sounds for dynamic variation.
     */
    public loadSoundData(soundData: any[]) {
        soundData.forEach(row => {
            // Robust check for active sounds
            const status = String(row.status).toLowerCase().trim();
            if (status !== 'true' && status !== '1') return; 

            // Format action to match code constraints (e.g., "Taking Damage" -> "taking_damage")
            const action = String(row['Goes with']).toLowerCase().trim().replace(/ /g, '_'); 
            const rawFile = String(row['Sound file']).trim().split('.')[0]; // strip .mp3/.wav
            
            // Map to specific characters or generic fallbacks
            let charsStr = row.characters ? String(row.characters).trim() : '';
            const chars = charsStr !== '' ? charsStr.split(',') : ['generic'];

            chars.forEach((c: string) => {
                const charKey = c.toLowerCase().trim();
                const key = `${charKey}_${action}`;
                
                if (!this.soundPools[key]) {
                    this.soundPools[key] = [];
                }
                this.soundPools[key].push(rawFile);
            });
        });
    }

    /**
     * Plays a random sound from the requested action pool.
     * Automatically falls back to 'generic' if character-specific audio is missing.
     */
    public playAction(character: string, action: string) {
        const charFmt = character.toLowerCase().trim();
        const actionFmt = action.toLowerCase().trim().replace(/ /g, '_');
        
        const specificKey = `${charFmt}_${actionFmt}`;
        const genericKey = `generic_${actionFmt}`;

        // 1. Try to find a character-specific sound pool (e.g., "marko_jump")
        let pool = this.soundPools[specificKey];
        
        // 2. Fallback to generic pool if character pool doesn't exist (e.g., "generic_jump")
        if (!pool || pool.length === 0) {
            pool = this.soundPools[genericKey];
        }
        
        // 3. Play a random sound from the resolved pool
        if (pool && pool.length > 0) {
            const soundToPlay = Phaser.Utils.Array.GetRandom(pool);
            this.scene.sound.playAudioSprite('sfx_atlas', soundToPlay);
        } else {
            console.warn(`AudioManager: No sound found for action [${actionFmt}] (Character: ${charFmt} or generic)`);
        }
    }
}