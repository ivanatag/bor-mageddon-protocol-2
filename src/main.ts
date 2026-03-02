import Phaser from 'phaser';
import { BootScene } from './game/scenes/BootScene';
import { MainLevel } from './game/scenes/MainLevel';
import { UIScene } from './game/scenes/UIScene';

/**
 * BOR-MAGEDDON 1993: Core Engine Configuration
 * Industrial Belt-Scroller System Initialized.
 */
const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 1920,
    height: 1080,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, MainLevel, UIScene],
    pixelArt: true,
    roundPixels: true,
    backgroundColor: '#000000'
};

// 1. Initialize the Game Engine
const game = new Phaser.Game(config);

// 2. Expose the Game to the Global Window Object
declare global {
    interface Window {
        phaserGame: Phaser.Game;
    }
}
window.phaserGame = game;
