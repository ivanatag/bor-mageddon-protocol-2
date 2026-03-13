import React, { useState } from 'react';

interface AccessGateProps {
    children: React.ReactNode;
}

/**
 * AccessGate: Protects the SDB Archives.
 * Only boots the Phaser engine after the "SMF1993" password is confirmed.
 */
export const AccessGate: React.FC<AccessGateProps> = ({ children }) => {
    const [input, setInput] = useState('');
    const [isGranted, setIsGranted] = useState(false);

    // Reads from environment variables in Vercel or locally [cite: 1823, 1843]
    const CORRECT_PASS = import.meta.env.VITE_GAME_PASSWORD || "SMF1993";

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.toUpperCase() === CORRECT_PASS.toUpperCase()) {
            setIsGranted(true);
        } else {
            alert("PRISTUP ODBIJEN: Neispravna šifra (ACCESS DENIED)."); [cite: 1826, 1846]
        }
    };

    if (isGranted) return <>{children}</>;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-[#39FF14] font-mono p-4">
            <div className="max-w-md w-full border-2 border-zinc-800 p-8 bg-black shadow-[0_0_20px_rgba(57,255,20,0.1)]">
                <h1 className="text-xl mb-2 uppercase tracking-tighter">SDB: Arhiva 3. Oktobar</h1> [cite: 1827, 1848]
                <p className="text-[10px] mb-8 opacity-70">STATUS: STROGO POVERLJIVO (TOP SECRET)</p>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <label className="block text-sm">UNESITE ŠIFRU ZA PRISTUP RIF-U:</label> [cite: 1828, 1848]
                    <input
                        type="password"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 p-2 outline-none focus:border-[#39FF14] text-white"
                        autoFocus
                    />
                    <button
                        type="submit"
                        className="w-full bg-[#1a3a11] hover:bg-[#39FF14] hover:text-black py-2 transition-colors uppercase text-sm font-bold"
                    >
                        Potvrdi Identitet
                    </button>
                </form>
                
                <div className="mt-8 text-[10px] opacity-40 leading-tight">
                    Sva neovlašćena lica biće procesuirana u skladu sa zakonom o zaštiti tekovina revolucije. [cite: 1830, 1851]
                </div>
            </div>
        </div>
    );
};
