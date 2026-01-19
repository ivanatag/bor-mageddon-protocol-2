import React, { useState } from 'react';
import { profileService } from '@/game/services/ProfileService';

interface AccessGateProps {
  onAccessGranted: () => void;
}

const AccessGate: React.FC<AccessGateProps> = ({ onAccessGranted }) => {
  const [username, setUsername] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim().length < 2) return;

    setIsAnimating(true);
    profileService.setLocalProfile(username.trim().toUpperCase());

    setTimeout(() => {
      onAccessGranted();
    }, 1000);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-background transition-opacity duration-1000 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
      {/* Red star background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute text-primary/10 text-9xl select-none"
            style={{
              left: `${(i % 4) * 30}%`,
              top: `${Math.floor(i / 4) * 35}%`,
              transform: `rotate(${i * 30}deg)`,
            }}
          >
            ★
          </div>
        ))}
      </div>

      <div className="relative hud-panel max-w-md w-full mx-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <span className="text-6xl text-primary animate-pulse-glow">★</span>
          </div>
          <h1 className="font-pixel text-2xl text-primary mb-2 glitch-text">
            ACCESS GATE
          </h1>
          <p className="font-retro text-lg text-muted-foreground">
            BEOGRAD GAMING COLLECTIVE
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block font-pixel text-xs text-muted-foreground mb-2">
              ENTER CALLSIGN
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.slice(0, 12))}
              className="w-full bg-muted border-2 border-primary/50 p-3 font-pixel text-lg text-foreground uppercase tracking-wider focus:outline-none focus:border-primary transition-colors"
              placeholder="COMRADE..."
              autoFocus
              maxLength={12}
            />
            <p className="font-retro text-xs text-muted-foreground mt-1">
              {username.length}/12 CHARACTERS
            </p>
          </div>

          <button
            type="submit"
            disabled={username.trim().length < 2}
            className="btn-retro w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            PROCEED
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-border text-center">
          <p className="font-retro text-sm text-muted-foreground">
            PROTOCOL-2 INITIATED • 1993
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccessGate;
