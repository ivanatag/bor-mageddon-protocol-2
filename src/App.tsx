import React, { useState } from 'react';
import { CharacterSelector } from './components/CharacterSelector';
import { GameContainer } from './components/GameContainer';
import { SettingsMenu, ControlsHUD } from './components/SettingsMenu';

export default function App() {
  const [gameState, setGameState] = useState<'MENU' | 'PLAYING'>('MENU');
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  
  // Settings & Polish State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [crtEnabled, setCrtEnabled] = useState(true);
  const [volume, setVolume] = useState(0.5);

  const handleCharacterSelect = (character: string) => {
    setSelectedCharacter(character);
    setGameState('PLAYING');
  };

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative">
      
      {/* Settings Gear / Button (Always accessible) */}
      <button 
        onClick={() => setIsSettingsOpen(true)}
        className="absolute top-4 right-4 z-50 text-white font-mono text-xs border border-zinc-600 px-3 py-1 bg-black/50 hover:bg-white hover:text-black transition-colors"
      >
        [SETTINGS]
      </button>

      {/* Main Game State Routing */}
      {gameState === 'MENU' && <CharacterSelector onSelect={handleCharacterSelect} />}
      
      {gameState === 'PLAYING' && selectedCharacter && (
        <GameContainer selectedCharacter={selectedCharacter} />
      )}

      {/* Permanent Controls HUD (Only visible during gameplay so the player remembers how to Jump/Attack) */}
      {gameState === 'PLAYING' && <ControlsHUD />}

      {/* Settings Modal Component */}
      <SettingsMenu 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        crtEnabled={crtEnabled}
        onCrtToggle={setCrtEnabled}
        volume={volume}
        onVolumeChange={setVolume}
      />

      {/* 1993 CRT Scanline Overlay */}
      {crtEnabled && (
        <div 
          className="pointer-events-none absolute inset-0 z-40 mix-blend-overlay opacity-30"
          style={{
            background: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 118, 0.06))",
            backgroundSize: "100% 2px, 3px 100%"
          }}
        />
      )}
    </div>
  );
}