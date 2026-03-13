import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { GameConfig } from '../game/main';

interface GameContainerProps {
  selectedCharacter: string;
}

export const GameContainer: React.FC<GameContainerProps> = ({ selectedCharacter }) => {
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    // Prevent React Strict Mode from booting two copies of the game at the same time
    if (gameRef.current) return;

    // Merge the imported settings with the specific HTML div ID we are creating below
    const finalConfig: Phaser.Types.Core.GameConfig = {
      ...GameConfig,
      parent: 'phaser-container'
    };

    // Boot the Phaser Engine
    const game = new Phaser.Game(finalConfig);
    gameRef.current = game;

    // Pass the chosen character into Phaser's global memory (Registry)
    // MainLevel.ts will read this exact string to decide who to spawn!
    game.registry.set('selectedCharacter', selectedCharacter.toLowerCase());

    // Cleanup function: If the user leaves this screen, safely kill the game engine
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