import React, { useState } from 'react';
import { CharacterSelector } from './components/CharacterSelector';
import { GameContainer } from './components/GameContainer';
// import { GameHUD } from './components/GameHUD'; // Uncomment when you add the HUD

export default function App() {
  const [gameState, setGameState] = useState<'MENU' | 'PLAYING'>('MENU');
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);

  const handleCharacterSelect = (character: string) => {
    setSelectedCharacter(character);
    setGameState('PLAYING');
  };

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative">
      {/* 1. Show the 3D Menu */}
      {gameState === 'MENU' && (
        <CharacterSelector onSelect={handleCharacterSelect} />
      )}

      {/* 2. Show the Phaser Game */}
      {gameState === 'PLAYING' && selectedCharacter && (
        <>
          <GameContainer selectedCharacter={selectedCharacter} />
          {/* <GameHUD /> */}
        </>
      )}

      {/* 3. Global CRT Scanline Overlay */}
      <div 
        className="pointer-events-none absolute inset-0 z-50 mix-blend-overlay opacity-30"
        style={{
          background: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 118, 0.06))",
          backgroundSize: "100% 2px, 3px 100%"
        }}
      />
    </div>
  );
}
