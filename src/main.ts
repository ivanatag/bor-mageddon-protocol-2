import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MainLevel } from './scenes/MainLevel';
import { UIScene } from './scenes/UIScene';
import { EndingScene } from './scenes/EndingScene';

/**
 * BOR-MAGEDDON 1993: Core Engine Configuration
 * Industrial Belt-Scroller System Initialized.
 */
const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 1920,
    height: 1080,
    parent: 'game-container', // The HTML <div> ID where Phaser will inject its canvas
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }, // Y gravity is 0 because this is a top-down/belt-scroller perspective
            debug: false       // Change to true if you need to see hitboxes and road belt boundaries
        }
    },
    scale: {
        mode: Phaser.Scale.FIT, // Ensures the 1080p game scales correctly on smaller monitors
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    // The order matters: BootScene loads assets, but we don't auto-start MainLevel 
    // if we are using the Three.js HTML overlay first.
    scene: [BootScene, MainLevel, UIScene, EndingScene],
    pixelArt: true,      // Crucial for 16-bit Yugoslav sprites; prevents blurriness
    roundPixels: true,   // Prevents sub-pixel rendering tearing on sprites
    backgroundColor: '#000000' // Base black void behind the parallax layers
};

// 1. Initialize the Game Engine
const game = new Phaser.Game(config);

// 2. Expose the Game to the Global Window Object
// This allows the external Three.js Character Selector UI to control Phaser.
declare global {
    interface Window {
        phaserGame: Phaser.Game;
    }
}
window.phaserGame = game;
