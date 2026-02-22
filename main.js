import * as THREE from 'https://cdn.skypack.dev/three@0.128.0';

(() => {
  const theme = { bg: 0x0a0502, fog: 0x220f05, particle: 0xffa544, ambient: 0x442211, point: 0xff6622 };
  
  // PRIMARY URLS
  const RAW_URL = 'https://raw.githubusercontent.com/ivanatag/bor-mageddon-protocol-2/main/public/assets/images/characters/';
  // Updated URL to point to your new upload
  const BGM_URL = 'https://raw.githubusercontent.com/ivanatag/bor-mageddon-protocol-2/main/public/assets/audio/bgm/bormageddon-character-menu-soundtrack.wav';

  const cardsData = [
    { id: 'marko', title: 'MARKO', accent: '#ff4444', spd: 55, pwr: 90, gradient: ['#3a1010', '#150505'], label: 'ID: 8492-M', file: 'marko_idle.png', desc: 'Former RTB Bor Miner. Optimized movement for heavy assault. Absorbs massive damage.' },
    { id: 'maja', title: 'MAJA', accent: '#44ff44', spd: 95, pwr: 65, gradient: ['#103a15', '#051505'], label: 'ID: UNKNOWN', file: 'maja_idle.png', desc: 'Underground smuggler. High agility and reinforced combat prowess.' },
    { id: 'darko', title: 'DARKO', accent: '#44aaff', spd: 70, pwr: 75, gradient: ['#10203a', '#050a15'], label: 'ID: 1104-D', file: 'darko_idle.png', desc: 'Dizel enforcer. High melee damage with a baseball bat. Features "Air Guitar" sonic special.' }
  ];

  // 1. ENGINE SETUP
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(theme.bg);
  scene.fog = new THREE.FogExp2(theme.fog, 0.08);
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 12);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.prepend(renderer.domElement);

  // 2. AUDIO SYSTEM
  const listener = new THREE.AudioListener();
  camera.add(listener);
  const soundtrack = new THREE.Audio(listener);
  const audioLoader = new THREE.AudioLoader();

  // 3. TEXTURE BUILDERS
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

  // 4. MAIN FLOW CONTROL
  let inputLocked = true; // Prevents "Clicking through" the Initialize button onto a card

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
    }, undefined, (err) => console.error("Audio Load Error. Check URL."));

    runBoot();
  };

  document.getElementById('initialize-btn').onclick = initializeTerminal;

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
          setTimeout(() => { 
            bs.style.display = 'none'; 
            inputLocked = false; // Unlock clicks only after boot is done
          }, 600);
        }, 600);
      }
    }, 300);
  }

  // 5. ASSETS & ANIMATION
  const titleMesh = new THREE.Mesh(new THREE.PlaneGeometry(26, 7), new THREE.MeshBasicMaterial({ map: createTitleTexture(), transparent: true, opacity: 0.3, fog: false, depthWrite: false }));
  titleMesh.position.set(0, 0, -6); scene.add(titleMesh);

  const cardMeshes = [];
  const RADIUS = 3.8; const ANGLE_STEP = (Math.PI * 2) / cardsData.length;
  cardsData.forEach((card, i) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(4, 6, 0.2), [new THREE.MeshStandardMaterial({color: 0x1a0a05}), new THREE.MeshStandardMaterial({color: 0x1a0a05}), new THREE.MeshStandardMaterial({color: 0x1a0a05}), new THREE.MeshStandardMaterial({color: 0x1a0a05}), new THREE.MeshStandardMaterial({transparent: true, emissive: 0x111111}), new THREE.MeshStandardMaterial({color: 0x000000})]);
    mesh.userData = { index: i }; scene.add(mesh); cardMeshes.push(mesh);
    mesh.material[4].map = createCardTexture(card);
    const img = new Image(); img.crossOrigin = "anonymous";
    img.onload = () => { mesh.material[4].map = createCardTexture(card, img); mesh.material[4].needsUpdate = true; };
    img.src = RAW_URL + card.file;
  });

  scene.add(new THREE.AmbientLight(theme.ambient, 0.6));
  const spotLight = new THREE.PointLight(theme.point, 5, 25);
  spotLight.position.set(0, 5, 8);
  scene.add(spotLight);

  let currentAngle = 0, targetAngle = 0, isDragging = false, lastX = 0, totalMove = 0;
  const raycaster = new THREE.Raycaster(); const mouse = new THREE.Vector2();

  window.addEventListener('mousedown', e => { 
    if (inputLocked) return;
    isDragging = true; lastX = e.clientX; totalMove = 0; 
  });
  
  window.addEventListener('mousemove', e => {
    if (inputLocked || !isDragging) return;
    targetAngle += (e.clientX - lastX) * 0.01; 
    totalMove += Math.abs(e.clientX - lastX); 
    lastX = e.clientX;
    
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1; 
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera); 
    document.body.style.cursor = raycaster.intersectObjects(cardMeshes).length > 0 ? 'pointer' : 'default';
  });

  window.addEventListener('mouseup', e => {
    if (inputLocked) return;
    isDragging = false; 
    targetAngle = Math.round(targetAngle / ANGLE_STEP) * ANGLE_STEP;
    if (totalMove < 8) {
      const hits = raycaster.intersectObjects(cardMeshes);
      if (hits.length > 0) {
        const d = cardsData[hits[0].object.userData.index];
        const el = document.getElementById('expanded-card');
        el.querySelector('.card-title').textContent = d.title; 
        el.querySelector('.card-desc').textContent = d.desc;
        el.querySelector('#stat-spd').textContent = d.spd; 
        el.querySelector('#stat-pwr').textContent = d.pwr;
        el.querySelector('.card-content').style.borderColor = d.accent; 
        el.style.display = 'flex';
        setTimeout(() => el.classList.add('active'), 10);
      }
    }
  });

  // Close Logic
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('close-btn') || e.target.id === 'expanded-card') {
      const el = document.getElementById('expanded-card'); 
      if (el) { el.classList.remove('active'); setTimeout(() => { el.style.display = 'none'; }, 300); }
    }
  });

  function animate(time) {
    requestAnimationFrame(animate);
    if(!isDragging) targetAngle += 0.002;
    currentAngle += (targetAngle - currentAngle) * 0.1;
    cardMeshes.forEach((m, i) => {
      const theta = currentAngle + (i * ANGLE_STEP);
      m.position.x = Math.sin(theta) * RADIUS; 
      m.position.z = Math.cos(theta) * RADIUS - RADIUS; 
      m.rotation.y = theta;
    });
    titleMesh.material.opacity = 0.2 + Math.abs(Math.sin(time * 0.001)) * 0.15;
    renderer.render(scene, camera);
  }
  animate();
})();
