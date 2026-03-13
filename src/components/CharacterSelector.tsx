import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface CharacterSelectorProps {
  onSelect: (characterName: string) => void;
}

const CHARACTER_DB: Record<string, { name: string; desc: string; spd: number; pwr: number }> = {
  marko: { name: "MARKO", desc: "Former miner turned union enforcer. Armed with an M70 assault rifle.", spd: 65, pwr: 80 },
  darko: { name: "DARKO", desc: "Street-smart smuggler. Quick on his feet, carries forbidden tapes.", spd: 85, pwr: 50 },
  maja: { name: "MAJA", desc: "Underground resistance leader. Specialises in devastating close-quarters combat.", spd: 75, pwr: 90 }
};

export const CharacterSelector: React.FC<CharacterSelectorProps> = ({ onSelect }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [audioOn, setAudioOn] = useState(true);

  useEffect(() => {
    if (!mountRef.current) return;

    // SCENE SETUP
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#050505');
    scene.fog = new THREE.FogExp2('#050505', 0.05);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1, 6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const spotLight = new THREE.SpotLight(0xff8c00, 50);
    spotLight.position.set(0, 5, 5);
    scene.add(spotLight);

    // 3D CAROUSEL
    const carouselGroup = new THREE.Group();
    scene.add(carouselGroup);

    const characters = ['marko', 'darko', 'maja'];
    const radius = 3;

    characters.forEach((char, index) => {
      const angle = (index / characters.length) * Math.PI * 2;
      const geometry = new THREE.BoxGeometry(1.5, 2.5, 0.2);
      const material = new THREE.MeshStandardMaterial({ 
        color: 0x222222, metalness: 0.8, roughness: 0.2,
        emissive: index === 0 ? 0x39FF14 : 0x000000,
        emissiveIntensity: 0.2
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      mesh.rotation.y = -angle + Math.PI / 2;
      mesh.userData = { characterName: char };
      carouselGroup.add(mesh);
    });

    // INTERACTIVITY
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => { isDragging = true; previousMousePosition = { x: e.clientX, y: e.clientY }; };
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        carouselGroup.rotation.y += (e.clientX - previousMousePosition.x) * 0.01;
        previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    };
    const onMouseUp = (e: MouseEvent) => {
      isDragging = false;
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(carouselGroup.children);
      if (intersects.length > 0) setActiveCard(intersects[0].object.userData.characterName);
    };

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isDragging && !activeCard) carouselGroup.rotation.y += 0.002;
      carouselGroup.position.y = Math.sin(Date.now() * 0.001) * 0.1;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (mountRef.current && renderer.domElement) mountRef.current.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [activeCard]);

  const currentStats = activeCard ? CHARACTER_DB[activeCard] : null;

  return (
    <div className="absolute inset-0 w-full h-full text-white font-mono pointer-events-none select-none">
      <div ref={mountRef} className="absolute inset-0 w-full h-full -z-10 pointer-events-auto cursor-grab active:cursor-grabbing" />

      {!isInitialized && (
        <div id="start-overlay" className="absolute inset-0 flex items-center justify-center bg-black/90 z-50 pointer-events-auto">
          <div className="border-2 border-orange-700 p-8 bg-black/80 text-center shadow-[0_0_30px_rgba(194,65,12,0.5)]">
            <h1 className="font-metal text-5xl mb-6 text-orange-500 tracking-widest">BOR-MAGEDDON</h1>
            <h2 className="text-xl mb-8 text-zinc-400 border-b border-zinc-700 pb-2">[TERMINAL_01]</h2>
            <button onClick={() => setIsInitialized(true)} className="bg-orange-900 px-8 py-3 text-lg hover:bg-orange-600 font-bold border border-orange-500 cursor-pointer">
              INITIALIZE PROTOCOL
            </button>
            <p className="mt-6 text-xs text-[#39FF14] animate-pulse">ESTABLISHING SECURE CONNECTION...</p>
          </div>
        </div>
      )}

      {isInitialized && (
        <div id="terminal-header" className="absolute top-0 left-0 w-full p-4 flex justify-between items-center bg-black/60 border-b border-zinc-800 pointer-events-auto z-20">
          <div id="hint" className="text-xs text-[#39FF14] animate-pulse">SYSTEM_STATUS: [DRAG_TO_ROTATE] // [CLICK_CARD_FOR_ARCHIVE]</div>
          <button onClick={() => setAudioOn(!audioOn)} className="text-xs border border-zinc-600 px-3 py-1 bg-black/50 hover:bg-white hover:text-black cursor-pointer">
            AUDIO: [{audioOn ? 'ON' : 'OFF'}]
          </button>
        </div>
      )}

      {isInitialized && activeCard && currentStats && (
        <div id="expanded-card" className="absolute bottom-12 right-12 w-96 bg-black/95 border-2 border-orange-800 p-6 z-30 pointer-events-auto shadow-[0_0_50px_rgba(0,0,0,0.9)] transition-all">
          <button onClick={() => setActiveCard(null)} className="absolute top-3 right-4 text-zinc-500 hover:text-red-500 font-bold text-xl cursor-pointer">X</button>
          <div className="card-header border-b border-zinc-700 pb-3 mb-4">
            <span className="text-[10px] text-[#39FF14] block mb-1 tracking-widest">DE-ENCRYPTION SUCCESSFUL</span>
            <h2 className="font-metal text-4xl text-orange-600 mt-1">{currentStats.name}</h2>
          </div>
          <p className="text-sm text-zinc-300 mb-6 leading-relaxed h-20">{currentStats.desc}</p>
          <div className="flex gap-6 mb-8 text-sm font-bold border border-zinc-800 p-3 bg-zinc-900/50">
            <div className="flex-1">SPD: <span className="text-orange-500 text-lg ml-2">{currentStats.spd}</span></div>
            <div className="flex-1">PWR: <span className="text-orange-500 text-lg ml-2">{currentStats.pwr}</span></div>
          </div>
          <button onClick={() => onSelect(activeCard)} className="w-full bg-orange-800 text-white py-4 text-lg hover:bg-orange-600 font-bold border border-orange-500 cursor-pointer shadow-[0_0_15px_rgba(194,65,12,0.4)]">
            INITIATE DEPLOYMENT
          </button>
        </div>
      )}
    </div>
  );
};
