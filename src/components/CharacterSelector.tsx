import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface CharacterSelectorProps {
  onSelect: (characterName: string) => void;
}

// Defining character stats for the UI Card
const CHARACTER_DB: Record<string, { name: string; desc: string; spd: number; pwr: number }> = {
  marko: {
    name: "MARKO",
    desc: "Former miner turned union enforcer. Armed with an M70 assault rifle and an iron will.",
    spd: 65,
    pwr: 80
  },
  darko: {
    name: "DARKO",
    desc: "Street-smart smuggler. Quick on his feet, carries forbidden cassette tapes and a bad attitude.",
    spd: 85,
    pwr: 50
  },
  maja: {
    name: "MAJA",
    desc: "Underground resistance leader. Specialises in devastating close-quarters combat and suplexes.",
    spd: 75,
    pwr: 90
  }
};

export const CharacterSelector: React.FC<CharacterSelectorProps> = ({ onSelect }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  
  // React State for UI Overlays
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [audioOn, setAudioOn] = useState(true);

  useEffect(() => {
    if (!mountRef.current) return;

    // ==========================================
    // 1. THREE.JS SCENE SETUP
    // ==========================================
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#050505'); // Deep industrial black
    scene.fog = new THREE.FogExp2('#050505', 0.05);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1, 6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Performance optimization
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const spotLight = new THREE.SpotLight(0xff8c00, 50); // Orange tint
    spotLight.position.set(0, 5, 5);
    spotLight.angle = Math.PI / 6;
    spotLight.penumbra = 0.5;
    scene.add(spotLight);

    // ==========================================
    // 2. THE 3D CAROUSEL (Replace with your models if needed)
    // ==========================================
    const carouselGroup = new THREE.Group();
    scene.add(carouselGroup);

    // Create 3 placeholder "Terminals/Cards" for Marko, Darko, Maja
    const characters = ['marko', 'darko', 'maja'];
    const radius = 3;

    characters.forEach((char, index) => {
      const angle = (index / characters.length) * Math.PI * 2;
      
      // Placeholder Geometry (You can swap this for GLTFLoader if you have 3D models)
      const geometry = new THREE.BoxGeometry(1.5, 2.5, 0.2);
      const material = new THREE.MeshStandardMaterial({ 
        color: 0x222222, 
        metalness: 0.8,
        roughness: 0.2,
        emissive: index === 0 ? 0x39FF14 : 0x000000, // Highlight Marko initially
        emissiveIntensity: 0.2
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      
      // Position in a circle
      mesh.position.x = Math.cos(angle) * radius;
      mesh.position.z = Math.sin(angle) * radius;
      mesh.rotation.y = -angle + Math.PI / 2; // Face outward
      
      mesh.userData = { characterName: char }; // Tag for the Raycaster
      carouselGroup.add(mesh);
    });

    // ==========================================
    // 3. INTERACTIVITY (Raycasting & Dragging)
    // ==========================================
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaMove = {
          x: e.clientX - previousMousePosition.x,
          y: e.clientY - previousMousePosition.y
        };
        // Rotate the carousel based on drag
        carouselGroup.rotation.y += deltaMove.x * 0.01;
        previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      isDragging = false;
      
      // Check for clicks on characters
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(carouselGroup.children);
      
      if (intersects.length > 0) {
        const clickedChar = intersects[0].object.userData.characterName;
        // Trigger React State to show the HTML Card
        setActiveCard(clickedChar);
      }
    };

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Handle Window Resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // ==========================================
    // 4. ANIMATION LOOP
    // ==========================================
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      
      // Slow passive rotation if not interacting
      if (!isDragging && !activeCard) {
        carouselGroup.rotation.y += 0.002;
      }

      // Add a slight floating effect
      carouselGroup.position.y = Math.sin(Date.now() * 0.001) * 0.1;

      renderer.render(scene, camera);
    };
    animate();

    // ==========================================
    // 5. CLEANUP ON UNMOUNT
    // ==========================================
    return () => {
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [activeCard]); // Re-run effect slightly if active card changes to pause rotation

  // UI Handlers
  const handleInitialize = () => {
    setIsInitialized(true);
    // You can trigger your global audio start here if needed
  };

  const handleDeployment = () => {
    if (activeCard) {
      onSelect(activeCard); // Sends the choice to App.tsx to start Phaser!
    }
  };

  const currentStats = activeCard ? CHARACTER_DB[activeCard] : null;

  return (
    <div className="absolute inset-0 w-full h-full text-white font-mono pointer-events-none select-none">
      
      {/* 1. The Three.js Canvas Container (Pointer events enabled to allow dragging/clicking) */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full -z-10 pointer-events-auto cursor-grab active:cursor-grabbing" />

      {/* 2. INITIALIZATION OVERLAY (Blocks interactions until clicked) */}
      {!isInitialized && (
        <div id="start-overlay" className="absolute inset-0 flex items-center justify-center bg-black/90 z-50 pointer-events-auto">
          <div className="border-2 border-orange-700 p-8 bg-black/80 text-center shadow-[0_0_30px_rgba(194,65,12,0.5)]">
            <h1 className="font-metal text-5xl mb-6 text-orange-500 tracking-widest">BOR-MAGEDDON</h1>
            <h2 className="text-xl mb-8 text-zinc-400 border-b border-zinc-700 pb-2">[TERMINAL_01]</h2>
            <button 
              onClick={handleInitialize}
              className="bg-orange-900 px-8 py-3 text-lg hover:bg-orange-600 hover:scale-105 transition-all font-bold border border-orange-500 cursor-pointer"
            >
              INITIALIZE PROTOCOL
            </button>
            <p className="mt-6 text-xs text-[#39FF14] animate-pulse font-mono">ESTABLISHING SECURE CONNECTION...</p>
          </div>
        </div>
      )}

      {/* 3. TERMINAL HEADER (Visible after init) */}
      {isInitialized && (
        <div id="terminal-header" className="absolute top-0 left-0 w-full p-4 flex justify-between items-center bg-black/60 border-b border-zinc-800 pointer-events-auto backdrop-blur-sm z-20">
          <div id="hint" className="text-xs text-[#39FF14] animate-pulse">
            SYSTEM_STATUS: [DRAG_TO_ROTATE] // [CLICK_CARD_FOR_ARCHIVE]
          </div>
          <div id="audio-controls">
            <button 
              onClick={() => setAudioOn(!audioOn)}
              className="text-xs border border-zinc-600 px-3 py-1 bg-black/50 hover:bg-white hover:text-black transition-colors cursor-pointer"
            >
              AUDIO: [{audioOn ? 'ON' : 'OFF'}]
            </button>
          </div>
        </div>
      )}

      {/* 4. EXPANDED CHARACTER CARD */}
      {isInitialized && activeCard && currentStats && (
        <div id="expanded-card" className="absolute bottom-12 right-12 w-96 bg-black/95 border-2 border-orange-800 p-6 z-30 pointer-events-auto shadow-[0_0_50px_rgba(0,0,0,0.9)] transition-all animate-in fade-in slide-in-from-right-10">
          
          <button 
            onClick={() => setActiveCard(null)}
            className="absolute top-3 right-4 text-zinc-500 hover:text-red-500 font-bold text-xl cursor-pointer"
          >
            X
          </button>
          
          <div className="card-header border-b border-zinc-700 pb-3 mb-4">
            <span className="text-[10px] text-[#39FF14] block mb-1 tracking-widest">DE-ENCRYPTION SUCCESSFUL</span>
            <h2 className="font-metal text-4xl text-orange-600 mt-1">{currentStats.name}</h2>
          </div>
          
          <p className="text-sm text-zinc-300 mb-6 leading-relaxed h-20">
            {currentStats.desc}
          </p>
          
          <div className="flex gap-6 mb-8 text-sm text-zinc-400 font-bold border border-zinc-800 p-3 bg-zinc-900/50">
            <div className="stat flex-1">SPD: <span className="text-orange-500 text-lg ml-2">{currentStats.spd}</span></div>
            <div className="stat flex-1">PWR: <span className="text-orange-500 text-lg ml-2">{currentStats.pwr}</span></div>
          </div>
          
          <button 
            onClick={handleDeployment}
            className="w-full bg-orange-800 text-white py-4 text-lg hover:bg-orange-600 font-bold border border-orange-500 cursor-pointer shadow-[0_0_15px_rgba(194,65,12,0.4)] hover:shadow-[0_0_25px_rgba(234,88,12,0.8)] transition-all"
          >
            INITIATE DEPLOYMENT
          </button>
        </div>
      )}

    </div>
  );
};
