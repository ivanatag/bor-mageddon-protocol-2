import * as THREE from 'https://cdn.skypack.dev/three@0.128.0';

(() => {
  const theme = { bg: 0x0a0502, fog: 0x220f05, particle: 0xffa544, ambient: 0x442211, point: 0xff6622 };
  const RAW_URL = 'https://raw.githubusercontent.com/ivanatag/bor-mageddon-protocol-2/main/public/assets/images/characters/';
  const BGM_URL = 'https://raw.githubusercontent.com/ivanatag/bor-mageddon-protocol-2/main/public/assets/audio/bgm/bormageddon-character-menu-soundtrack.wav';

  // --- UPDATED TEEN CHARACTER PROFILES ---
  const cardsData = [
    { 
      id: 'marko', title: 'MARKO', accent: '#ff4444', spd: 55, pwr: 90, gradient: ['#3a1010', '#150505'], label: 'AGE: 16', file: 'marko_idle.png', 
      desc: 'Local basketball prodigy turned wasteland brawler. Fueled by heavy metal and a love for non-stop action, he acts as the tank, absorbing massive damage on the frontlines.' 
    },
    { 
      id: 'maja', title: 'MAJA', accent: '#44ff44', spd: 95, pwr: 65, gradient: ['#103a15', '#051505'], label: 'AGE: 15', file: 'maja_idle.png', 
      desc: 'Do not let the bubbly and upbeat personality fool you—she is absolutely ferocious in a fight. Her high agility makes her a lethal blur on the battlefield.' 
    },
    { 
      id: 'darko', title: 'DARKO', accent: '#44aaff', spd: 70, pwr: 75, gradient: ['#10203a', '#050a15'], label: 'AGE: 16', file: 'darko_idle.png', 
      desc: 'A certified tactical supergenius and die-hard Guns N\' Roses fan. Delivers high melee damage with a baseball bat and features a killer "Sweet Child" sonic special attack.' 
    }
  ];

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(theme.bg);
  scene.fog = new THREE.FogExp2(theme.fog, 0.08);
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 12);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.prepend(renderer.domElement);

  const listener = new THREE.AudioListener();
  camera.add(listener);
  const soundtrack = new THREE.Audio(listener);
  const audioLoader = new THREE.AudioLoader();

  // --- PARTICLE SYSTEM ---
  const ashCount = 1000;
  const ashGeo = new THREE.BufferGeometry();
  const ashPos = new Float32Array(ashCount * 3);
  for(let i=0; i < ashCount * 3; i++) {
    ashPos[i] = (Math.random() - 0.5) * 30;
  }
  ashGeo.setAttribute('position', new THREE.BufferAttribute(ashPos, 3));
  const ashMaterial = new THREE.PointsMaterial({ size: 0.08, color: theme.particle, transparent: true, opacity: 0.4 });
  const ashSystem = new THREE.Points(ashGeo, ashMaterial);
  scene.add(ashSystem);

  // --- TEXTURE BUILDERS ---
  function createTitleTexture() {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 256;
    const ctx = c.getContext('2d'); ctx.textAlign = 'center';
    ctx.font = '900 130px "Metal Mania", Impact, sans-serif';
    ctx.fillStyle = '#110400'; ctx.fillText('BORMAGEDDON', 522, 138);
    ctx.fillStyle = '#ff4400'; ctx.fillText('BORMAGEDDON', 512, 128);
    return new THREE.CanvasTexture(c);
  }

  function createCardTexture(card, img = null) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 700;
    const ctx = c.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 700);
    grad.addColorStop(0, card.gradient[0]); grad.addColorStop(1, card.gradient[1]);
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 512, 700);
    if (img) { ctx.imageSmoothingEnabled = false; ctx.drawImage(img, (512 - img.width * 2.8)/2, (700 - img.height * 2.8)/2 + 20, img.width * 2.8, img.height * 2.8); }
    ctx.strokeStyle = card.accent; ctx.lineWidth = 20; ctx.strokeRect(10,10,492,680);
    ctx.fillStyle = card.accent; ctx.font = 'bold 24px "Space Mono"'; ctx.fillText(card.label, 50, 75);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 75px "Space Mono"'; ctx.fillText(card.title, 50, 610);
    const tex = new THREE.CanvasTexture(c); tex.magFilter = THREE.NearestFilter;
    return tex;
  }

  // --- FLOW CONTROL ---
  let inputLocked = true;
  const initializeTerminal = () => {
    document.getElementById('start-overlay').style.display = 'none';
    document.getElementById('boot-screen').style.display = 'block';
    const audioCtx = THREE.AudioContext.getContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    audioLoader.load(BGM_URL, (buffer) => {
        soundtrack.setBuffer(buffer);
        soundtrack.setLoop(true);
        soundtrack.setVolume(0.5);
        soundtrack.play();
    });
    runBoot();
  };

  document.getElementById('initialize-btn').onclick = initializeTerminal;

  const musicBtn = document.getElementById('music-toggle');
  musicBtn.onclick = () => {
    if (soundtrack.isPlaying) { soundtrack.pause(); musicBtn.textContent = 'AUDIO: [OFF]'; } 
    else { soundtrack.play(); musicBtn.textContent = 'AUDIO: [ON]'; }
  };

  function runBoot() {
    const bootLines = ["> SYNCING RTB-BOR ARCHIVES...", "> DETECTING COPPER...", "> ACCESS GRANTED."];
    const el = document.getElementById('boot-text');
    let idx = 0;
    const interval = setInterval(() => {
      if (idx < bootLines.length) { el.innerHTML += bootLines[idx++] + "<br>"; }
      else {
        clearInterval(interval);
        setTimeout(() => {
          const bs = document.getElementById('boot-screen');
          bs.style.opacity = '0';
          setTimeout(() => { bs.style.display = 'none'; inputLocked = false; }, 600);
        }, 600);
      }
    }, 300);
  }

  // --- MESHES ---
  const titleMesh = new THREE.Mesh(new THREE.PlaneGeometry(26, 7), new THREE.MeshBasicMaterial({ map: createTitleTexture(), transparent: true, opacity: 0.3, fog: false, depthWrite: false }));
  titleMesh.position.set(0, 0, -6); scene.add(titleMesh);

  const cardMeshes = [];
  const RADIUS = 3.8; const ANGLE_STEP = (Math.PI * 2) / cardsData.length;
  cardsData.forEach((card, i) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(4, 6, 0.2), [new THREE.MeshStandardMaterial
