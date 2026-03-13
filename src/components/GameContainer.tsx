import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';

// Import your Phaser scenes
import { BootScene } from '../game/scenes/BootScene';
import { MainLevel } from '../game/scenes/MainLevel';

interface GameContainerProps {
  selectedCharacter: string;
}

export const GameContainer: React.FC<GameContainerProps> = ({ selectedCharacter }) => {
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: 'phaser-container',
      width: 1920,
      height: 1080,
      pixelArt: true,
      physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0, x: 0 }, debug: false }
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      scene: [BootScene, MainLevel]
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    // Pass the character to Phaser's registry
    game.registry.set('selectedCharacter', selectedCharacter.toLowerCase());

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [selectedCharacter]);

  return (
    <div 
      id="phaser-container" 
      className="w-full h-full flex justify-center items-center bg-black absolute inset-0 z-20"
    />
  );
};
