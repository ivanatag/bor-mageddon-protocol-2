import * as THREE from 'https://cdn.skypack.dev/three@0.128.0';

(() => {
  // 1. BOOT SEQUENCE LOGIC
  const bootLines = [
      "> INITIALIZING RTB-BOR TERMINAL...",
      "> LOADING KERNEL 0.93-ALPHA",
      "> SCANNING SECTOR 7G...",
      "> DE-ENCRYPTING CHARACTER ARCHIVES...",
      "> SYNCING WITH SATELLITE...",
      "> ACCESS GRANTED."
  ];
  const bootTextEl = document.getElementById('boot-text');
  let lineIdx = 0;

  function runBoot() {
      if (lineIdx < bootLines.length) {
          bootTextEl.innerHTML += bootLines[lineIdx] + "<br>";
          lineIdx++;
          setTimeout(runBoot, 300);
      } else {
          setTimeout(() => {
              document.getElementById('boot-screen').style.opacity = '0';
              setTimeout(() => { document.getElementById('boot-screen').style.display = 'none'; }, 500);
          }, 800);
      }
  }
  runBoot();

  // 2. 3D SETUP - BRIGHTER LIGHTING
  const theme = { 
    bg: 0x0f0b0a, 
    fog: 0x1a0a05, 
    particle: 0xffaa44, 
    ambient: 0xffffff, // White light for better color accuracy
    ambientI: 1.2,     // High intensity ambient
    pointI: 4.0        // Strong point light
  };

  const RAW_URL = 'https://raw.githubusercontent.com/ivanatag/bor-mageddon-protocol-2/main/public/assets/images/characters/';
  
  const cardsData = [
    { id: 'marko', title: 'MARKO', accent: '#ff4444', spd: 55, pwr: 90, gradient: ['#4a1515', '#220808'], label: 'ID: 8492-M', file: 'marko_idle.png', desc: 'Former RTB Bor Miner. Optimized movement for heavy assault. Absorbs massive damage. Driven by sheer rage.' },
    { id: 'maja', title: 'MAJA', accent: '#44ff44', spd: 95, pwr: 65, gradient: ['#154a20', '#08220a'], label: 'ID: UNKNOWN', file: 'maja_idle.png', desc: 'Underground smuggler. High agility and reinforced combat prowess. Fragile health.' },
    { id: 'darko', title: 'DARKO', accent: '#44aaff', spd: 70, pwr: 75, gradient: ['#152a4a', '#081222'], label: 'ID: 1104-D', file: 'darko_idle.png', desc: 'Dizel enforcer. High melee damage with a bat. Features the signature "Air Guitar" sonic special attack.' }
  ];

  const RADIUS = 3.8;
  const ANGLE_STEP = (Math.PI * 2) / cardsData.length;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(theme.fog, 0.05);
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 12);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.prepend(renderer.domElement);

  // BRIGHTER LIGHTS
  scene.add(new THREE.AmbientLight(theme.ambient, theme.ambientI));
  const mainLight = new THREE.PointLight(0xffffff, theme.pointI, 40);
  mainLight.position.set(0, 5, 10);
  scene.add(mainLight);

  

  function createCardTexture(card, img = null) {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 700;
    const ctx = c.getContext('2d');
    
    // 1. Brighter Gradient Background
    const grad = ctx.createLinearGradient(0, 0, 0, 700);
    grad.addColorStop(0, card.gradient[0]);
    grad.addColorStop(1, card.gradient[1]);
    ctx.fillStyle = grad; 
    ctx.fillRect(0,0,512,700);

    // 2. Sprite with softer shadow
    if (img) {
      ctx.imageSmoothingEnabled = false;
      ctx.shadowColor = "rgba(0,0,0,0.8)"; 
      ctx.shadowBlur = 15;
      ctx.drawImage(img, (512 - img.width * 2.8)/2, (700 - img.height * 2.8)/2 + 20, img.width * 2.8, img.height * 2.8);
      ctx.shadowBlur = 0;
    }

    // 3. Brighter Shatter Effect
    ctx.strokeStyle = "rgba(255,255,255,0.6)"; 
    ctx.lineWidth = 3;
    for(let i=0; i<4; i++){
        let x = Math.random()*512, y = Math.random()*700;
        ctx.beginPath(); ctx.moveTo(x,y);
        for(let j=0; j<4; j++) { x+=(Math.random()-0.5)*250; y+=(Math.random()-0.5)*250; ctx.lineTo(x,y); }
        ctx.stroke();
    }

    // 4. Chunky UI Borders
    ctx.strokeStyle = "#000"; ctx.lineWidth = 40; ctx.strokeRect(0,0,512,700);
    ctx.strokeStyle = card.accent; ctx.lineWidth = 20; ctx.strokeRect(10,10,492,680);

    // 5. Text (Space Mono)
    ctx.fillStyle = card.accent; ctx.font = 'bold 24px "Space Mono", monospace'; ctx.fillText(card.label, 50, 75);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 70px "Space Mono", monospace'; ctx.fillText(card.title, 50, 610);

    const tex = new THREE.CanvasTexture(c);
    tex.magFilter = THREE.NearestFilter;
    return tex;
  }

  const cardMeshes = [];
  cardsData.forEach((card, i) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(4, 6, 0.2),
      [
        new THREE.MeshStandardMaterial({color: 0x333333}), // Brighter side
        new THREE.MeshStandardMaterial({color: 0x333333}),
        new THREE.MeshStandardMaterial({color: 0x333333}),
        new THREE.MeshStandardMaterial({color: 0x333333}),
        new THREE.MeshStandardMaterial({transparent: true, emissive: 0x222222}), // Self-illumination
        new THREE.MeshStandardMaterial({color: 0x000000})
      ]
    );
    mesh.userData = { index: i };
    scene.add(mesh);
    cardMeshes.push(mesh);
    updateCardFace(mesh, card);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => updateCardFace(mesh, card, img);
    img.src = RAW_URL + card.file + "?t=" + Date.now();
  });

  function updateCardFace(mesh, card, img = null) {
      mesh.material[4].map = createCardTexture(card, img);
      mesh.material[4].needsUpdate = true;
  }

  // --- INTERACTION ---
  let currentAngle = 0, targetAngle = 0, isDragging = false, lastX = 0, totalMove = 0;
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  window.addEventListener('mousedown', e => { isDragging = true; lastX = e.clientX; totalMove = 0; });
  window.addEventListener('mousemove', e => {
    if(isDragging) { targetAngle += (e.clientX - lastX) * 0.01; totalMove += Math.abs(e.clientX - lastX); lastX = e.clientX; }
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    document.body.style.cursor = raycaster.intersectObjects(cardMeshes).length > 0 ? 'pointer' : 'default';
  });
  window.addEventListener('mouseup', e => {
    isDragging = false;
    targetAngle = Math.round(targetAngle / ANGLE_STEP) * ANGLE_STEP;
    if (totalMove < 5) {
      const hits = raycaster.intersectObjects(cardMeshes);
      if (hits.length > 0) showArchive(hits[0].object.userData.index);
    }
  });

  function showArchive(idx) {
    const d = cardsData[idx];
    const el = document.getElementById('expanded-card');
    el.querySelector('.card-title').textContent = d.title;
    el.querySelector('.card-desc').textContent = d.desc;
    el.querySelector('#stat-spd').textContent = d.spd;
    el.querySelector('#stat-pwr').textContent = d.pwr;
    el.querySelector('.card-content').style.borderColor = d.accent;
    el.style.display = 'flex';
    setTimeout(() => el.classList.add('active'), 10);
  }

  document.querySelector('.close-btn').onclick = () => {
    const el = document.getElementById('expanded-card');
    el.classList.remove('active');
    setTimeout(() => el.style.display = 'none', 300);
  };

  function animate() {
    requestAnimationFrame(animate);
    if(!isDragging) targetAngle += 0.002;
    currentAngle += (targetAngle - currentAngle) * 0.1;
    cardMeshes.forEach((m, i) => {
      const theta = currentAngle + (i * ANGLE_STEP);
      m.position.x = Math.sin(theta) * RADIUS;
      m.position.z = Math.cos(theta) * RADIUS - RADIUS;
      m.rotation.y = theta;
    });
    renderer.render(scene, camera);
  }
  animate();
})();
