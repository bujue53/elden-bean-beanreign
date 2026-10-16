import * as THREE from "../lib/three.module.js";
import { audio } from "./audio.js";
import { CLASSES, buildBean, buildBoss, buildBeanBolt } from "./characters.js";
import {
  groundTexture, moonTexture, pillarTexture, softDotTexture,
  slashTexture, ringTexture, beamTexture, beanFaceTexture,
} from "./textures.js";

// ---------- DOM ----------
const $ = (id) => document.getElementById(id);
const canvas = $("game-canvas");

const els = {
  title: $("screen-title"),
  select: $("screen-select"),
  pause: $("screen-pause"),
  defeat: $("screen-defeat"),
  victory: $("screen-victory"),
  hud: $("hud"),
  selectGrid: $("select-grid"),
  selectPreview: $("select-preview"),
  hpFill: document.querySelector(".hp-fill"),
  hpBack: document.querySelector(".hp-back"),
  stFill: document.querySelector(".st-fill"),
  boss: $("hud-boss"),
  bossFill: document.querySelector(".boss-fill"),
  bossName: $("boss-name"),
  flaskCount: $("flask-count"),
  lockon: $("lockon-reticle"),
  bossIndicator: $("boss-indicator"),
  bossIndicatorDist: $("boss-indicator-dist"),
  controlsHint: $("controls-hint"),
  centerMsg: $("center-msg"),
  lockHint: $("lock-hint"),
};

// ---------- 渲染器 / 场景 ----------
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.55;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x121b3c);
scene.fog = new THREE.Fog(0x1c2647, 32, 82);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 3, 12);

// ---------- 灯光 ----------
const moonLight = new THREE.DirectionalLight(0xc6d2ff, 3.1);
moonLight.position.set(-18, 24, 10);
moonLight.castShadow = true;
moonLight.shadow.mapSize.set(1024, 1024);
moonLight.shadow.camera.near = 1;
moonLight.shadow.camera.far = 60;
moonLight.shadow.camera.left = -28;
moonLight.shadow.camera.right = 28;
moonLight.shadow.camera.top = 28;
moonLight.shadow.camera.bottom = -28;
scene.add(moonLight);

const fillLight = new THREE.HemisphereLight(0x6a80bd, 0x332b3d, 1.2);
scene.add(fillLight);

// 极弱环境光：把死黑抬起来，保证角色和 BOSS 的轮廓可读
const ambient = new THREE.AmbientLight(0x46527f, 0.7);
scene.add(ambient);

const bossGlow = new THREE.PointLight(0xff5522, 0, 16);
bossGlow.position.set(0, 3, -4);
scene.add(bossGlow);

// 跟随玩家的柔和补光：让豆子的轮廓在黑夜里始终看得清
const heroLight = new THREE.PointLight(0xffd9b0, 1.15, 11, 2);
heroLight.position.set(0, 3.4, 0);
scene.add(heroLight);

// ---------- 世界 ----------
const ARENA_R = 23;

function buildWorld() {
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(ARENA_R + 4, 48),
    new THREE.MeshStandardMaterial({ map: groundTexture(), roughness: 0.95, metalness: 0.02 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // 外圈石壁
  const wall = new THREE.Mesh(
    new THREE.CylinderGeometry(ARENA_R + 3, ARENA_R + 4, 7, 48, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x2a2f42, roughness: 0.95, side: THREE.DoubleSide })
  );
  wall.position.y = 3.5;
  wall.receiveShadow = true;
  scene.add(wall);

  // 破损石柱
  const pillarGeo = new THREE.CylinderGeometry(0.7, 0.9, 5.2, 10);
  const pillarMat = new THREE.MeshStandardMaterial({ map: pillarTexture(), roughness: 0.9 });
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + 0.35;
    const r = ARENA_R - 1.2;
    const p = new THREE.Mesh(pillarGeo, pillarMat);
    p.position.set(Math.cos(a) * r, 2.6, Math.sin(a) * r);
    p.rotation.z = (Math.random() - 0.5) * 0.18;
    p.rotation.x = (Math.random() - 0.5) * 0.18;
    p.castShadow = true;
    scene.add(p);
    if (i % 3 === 0) {
      const top = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.7, 0.5, 8),
        pillarMat
      );
      top.position.set(p.position.x, p.position.y + 2.7, p.position.z);
      top.rotation.copy(p.rotation);
      scene.add(top);
    }
  }

  // 月亮
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(6, 32, 24),
    new THREE.MeshBasicMaterial({ map: moonTexture() })
  );
  moon.position.set(-46, 26, -72);
  scene.add(moon);

  // 星星
  const starCount = 700;
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 80 + Math.random() * 90;
    const y = 12 + Math.random() * 70;
    starPos[i * 3] = Math.cos(a) * r;
    starPos[i * 3 + 1] = y;
    starPos[i * 3 + 2] = Math.sin(a) * r;
  }
  const stars = new THREE.Points(
    new THREE.BufferGeometry(),
    new THREE.PointsMaterial({ color: 0xdde6ff, size: 0.45, sizeAttenuation: true })
  );
  stars.geometry.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
  scene.add(stars);

  // 萤火虫粒子
  const fireflyCount = 160;
  const ffPos = new Float32Array(fireflyCount * 3);
  for (let i = 0; i < fireflyCount; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * ARENA_R * 0.9;
    ffPos[i * 3] = Math.cos(a) * r;
    ffPos[i * 3 + 1] = 0.4 + Math.random() * 4.5;
    ffPos[i * 3 + 2] = Math.sin(a) * r;
  }
  const fireflies = new THREE.Points(
    new THREE.BufferGeometry(),
    new THREE.PointsMaterial({
      color: 0xffe6a0, size: 0.22, map: softDotTexture(),
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    })
  );
  fireflies.geometry.setAttribute("position", new THREE.BufferAttribute(ffPos, 3));
  scene.add(fireflies);
  return { fireflies };
}

const world = buildWorld();

// ---------- 玩家 ----------
let player = null;
let playerClass = null;
const playerState = {
  pos: new THREE.Vector3(0, 0, 12),
  vel: new THREE.Vector3(),
  yaw: Math.PI,
  pitch: 0,
  hp: 0, maxHp: 0,
  stamina: 100, maxStamina: 100,
  flasks: 4,
  grounded: true,
  sprinting: false,
  moving: false,
  attacking: false,
  attackPhase: "none", // windup | active | recover
  attackTimer: 0,
  combo: 0,
  comboTimer: 0,
  heavyCharging: false,
  heavyCharge: 0,
  dodging: false,
  dodgeTimer: 0,
  dodgeDir: new THREE.Vector3(),
  healing: false,
  healTimer: 0,
  hitFlash: 0,
  dead: false,
  locked: false,
  invuln: 0,
  lmbHeld: false,
  shiftPressed: false,
  healPressed: false,
  animTime: 0,
  bobPhase: 0,
};

function buildPlayer() {
  if (player) scene.remove(player);
  player = buildBean({
    color: playerClass.color,
    headScale: playerClass.headScale,
    weaponType: playerClass.weapon,
    faceTex: beanFaceTexture(),
  });
  scene.add(player);
  playerState.maxHp = playerClass.stat.hp;
  playerState.maxStamina = playerClass.stat.stamina;
}

function respawnPlayer() {
  // 清掉场上的危险（扩散波、陨石落点）
  for (const m of fx.meteors) {
    scene.remove(m.mark);
    scene.remove(m.bolt);
  }
  fx.meteors = [];
  for (const r of fx.rings) {
    if (r.wave) {
      scene.remove(r.mesh);
      r.mesh.material.dispose();
    }
  }
  fx.rings = fx.rings.filter((r) => !r.wave);

  playerState.pos.set(0, 0, 12);
  playerState.vel.set(0, 0, 0);
  playerState.hp = playerState.maxHp;
  playerState.stamina = playerState.maxStamina;
  playerState.flasks = 4;
  playerState.dead = false;
  playerState.attacking = false;
  playerState.attackPhase = "none";
  playerState.attackTimer = 0;
  playerState.combo = 0;
  playerState.comboTimer = 0;
  playerState.heavyCharging = false;
  playerState.heavyCharge = 0;
  playerState.healing = false;
  playerState.dodging = false;
  playerState.grounded = true;
  playerState.sprinting = false;
  playerState.moving = false;
  playerState.hitFlash = 0;
  playerState.pitch = 0;
  playerState.invuln = 0;
  clearInput();
  playerState.yaw = Math.atan2(bossState.pos.x - 0, bossState.pos.z - 12);
  player.visible = true;
  resetWeaponPose();
  updateHUD();
}

// ---------- BOSS ----------
let boss = buildBoss();
boss.position.set(0, 0, -5);
scene.add(boss);

const bossState = {
  pos: new THREE.Vector3(0, 0, -5),
  vel: new THREE.Vector3(),
  hp: 3600,
  maxHp: 3600,
  poise: 120,
  maxPoise: 120,
  active: false,
  engaged: false,
  state: "idle", // idle | approach | attack | recover | stagger | skyrend | death
  timer: 0,
  anim: 0,
  attackCd: 1.2,
  phase2: false,
  hitFlash: 0,
  facing: new THREE.Vector3(0, 0, 1),
  dead: false,
};

// ---------- 实体：特效 / 弹幕 / 波 / 陨石 ----------
const fx = {
  slashes: [],
  rings: [],
  meteors: [],
  impacts: [],
  bolts: [],
  beams: [],
  chunks: [],
};

function spawnSlash(parentPos, angle, scale = 1, color = "220, 230, 255") {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 2.2),
    new THREE.MeshBasicMaterial({
      map: slashTexture(color), transparent: true, depthWrite: false,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    })
  );
  mesh.position.copy(parentPos).add(new THREE.Vector3(0, 1.2, 0));
  mesh.rotation.order = "YXZ";
  mesh.rotation.y = angle;
  mesh.rotation.x = -Math.PI / 2.4;
  mesh.scale.setScalar(scale);
  scene.add(mesh);
  fx.slashes.push({ mesh, life: 0.18 });
}

function spawnRing(x, z, color = "255, 210, 150") {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
      map: ringTexture(color), transparent: true, depthWrite: false,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, 0.06, z);
  scene.add(mesh);
  fx.rings.push({ mesh, life: 0.4, grow: 1 });
}

function spawnWave(x, z, speed = 7) {
  const mesh = new THREE.Mesh(
    new THREE.RingGeometry(0.9, 1.15, 40),
    new THREE.MeshBasicMaterial({
      color: 0xffb36a, transparent: true, opacity: 0.9, depthWrite: false,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, 0.05, z);
  scene.add(mesh);
  fx.rings.push({ mesh, life: 2.2, radius: 0, speed, wave: true, hit: new Set() });
}

function spawnMeteor(x, z) {
  const mark = new THREE.Mesh(
    new THREE.RingGeometry(1.3, 1.65, 28),
    new THREE.MeshBasicMaterial({
      color: 0xff4422, transparent: true, opacity: 0.85, depthWrite: false,
      side: THREE.DoubleSide,
    })
  );
  mark.rotation.x = -Math.PI / 2;
  mark.position.set(x, 0.08, z);
  scene.add(mark);
  const bolt = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xff5522, emissive: 0xff2200, emissiveIntensity: 2 })
  );
  bolt.position.set(x, 14, z);
  scene.add(bolt);
  fx.meteors.push({ mark, bolt, x, z, timer: 0.95, state: "telegraph", impacted: false });
}

function spawnImpact(x, y, z, color = 0xffa050, count = 10) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const vel = [];
  for (let i = 0; i < count; i++) {
    pos[i * 3] = x;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = z;
    const a = Math.random() * Math.PI * 2;
    const sp = 2 + Math.random() * 5;
    vel.push(new THREE.Vector3(Math.cos(a) * sp, 3 + Math.random() * 6, Math.sin(a) * sp));
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color, size: 0.16, map: softDotTexture(), transparent: true,
    depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const pts = new THREE.Points(geo, mat);
  scene.add(pts);
  fx.impacts.push({ pts, vel, life: 0.55 });
}

function spawnBeanBolt(from, dir) {
  const mesh = buildBeanBolt();
  mesh.position.copy(from);
  scene.add(mesh);
  fx.bolts.push({ mesh, dir: dir.clone().normalize(), speed: 18, life: 3, friendly: true });
}

function spawnBeam(x, z, w = 2.2) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, 24),
    new THREE.MeshBasicMaterial({
      map: beamTexture(), transparent: true, depthWrite: false,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    })
  );
  mesh.position.set(x, 12, z);
  scene.add(mesh);
  fx.beams.push({ mesh, life: 1.5 });
}

function spawnChunks(pos, color, count = 8) {
  const geo = new THREE.BufferGeometry();
  const arr = new Float32Array(count * 3);
  const vel = [];
  for (let i = 0; i < count; i++) {
    arr[i * 3] = pos.x;
    arr[i * 3 + 1] = pos.y + 0.5;
    arr[i * 3 + 2] = pos.z;
    vel.push(new THREE.Vector3((Math.random() - 0.5) * 6, 3 + Math.random() * 5, (Math.random() - 0.5) * 6));
  }
  geo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
  const mat = new THREE.PointsMaterial({ color, size: 0.18, map: softDotTexture(), transparent: true, depthWrite: false });
  const pts = new THREE.Points(geo, mat);
  scene.add(pts);
  fx.chunks.push({ pts, vel, life: 0.8 });
}

// ---------- 飘字 ----------
const dmgPool = [];
function spawnDmgNum(amount, worldPos, opts = {}) {
  const el = document.createElement("div");
  el.className = "dmg-num" + (opts.crit ? " crit" : "") + (opts.heal ? " heal" : "");
  el.textContent = opts.heal ? "+" + amount : "-" + amount;
  document.body.appendChild(el);
  const v = worldPos.clone().project(camera);
  el.style.left = ((v.x * 0.5 + 0.5) * window.innerWidth) + "px";
  el.style.top = ((-v.y * 0.5 + 0.5) * window.innerHeight) + "px";
  el.style.fontSize = (opts.size || 18) + "px";
  let t = 0;
  const item = { el, t };
  dmgPool.push(item);
}

function showCenterMsg(text, dur = 1.8) {
  els.centerMsg.textContent = text;
  els.centerMsg.classList.remove("hidden");
  clearTimeout(showCenterMsg._t);
  showCenterMsg._t = setTimeout(() => els.centerMsg.classList.add("hidden"), dur * 1000);
}

// ---------- 输入 ----------
const keys = {};
let mouseDownL = false;
let mouseDownR = false;
let locked = false;
let freeLook = false; // 浏览器不支持指针锁定时的降级方案：直接用鼠标位移转视角
let gameState = "title"; // title | select | play | pause | defeat | victory

window.addEventListener("keydown", (e) => {
  if (["Space", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.code)) e.preventDefault();
  keys[e.code] = true;
  if (e.repeat) return;
  if (e.code === "Enter") {
    if (gameState === "title") {
      audio.init();
      audio.sfx("ui");
      openSelect();
    } else if (gameState === "victory") {
      toTitle();
    } else if (gameState === "select") {
      selectIndex(selectIdx, true);
    }
  }
  if (gameState === "select" && (e.code === "ArrowLeft" || e.code === "ArrowUp")) {
    audio.sfx("ui");
    selectIndex(selectIdx - 1, false);
  } else if (gameState === "select" && (e.code === "ArrowRight" || e.code === "ArrowDown")) {
    audio.sfx("ui");
    selectIndex(selectIdx + 1, false);
  }
  if (e.code === "Escape" && gameState === "play") {
    setState("pause");
    // 主动退出指针锁定，避免某些浏览器不响应 Esc 导致卡在游戏里
    if (document.pointerLockElement) document.exitPointerLock();
  } else if (e.code === "Escape" && gameState === "pause") {
    // 锁定成功后由 pointerlockchange 切回游戏；若环境不支持锁定则退化为自由视角
    requestGamePointerLock();
  }
  if (e.code === "KeyR" && gameState === "defeat") {
    audio.sfx("ui");
    respawnPlayer();
    setState("play");
  }
  if (e.code === "KeyE") toggleLockOn();
  if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
    playerState.shiftPressed = true;
  }
  if (e.code === "KeyH") {
    playerState.healPressed = true;
  }
});

window.addEventListener("keyup", (e) => { keys[e.code] = false; });

function clearInput() {
  for (const key of Object.keys(keys)) keys[key] = false;
  mouseDownL = false;
  mouseDownR = false;
  playerState.lmbHeld = false;
  playerState.shiftPressed = false;
  playerState.healPressed = false;
  playerState.heavyCharging = false;
}

function pauseOnBlur() {
  clearInput();
  if (gameState === "play") {
    setState("pause");
    if (document.pointerLockElement) document.exitPointerLock();
  }
}
window.addEventListener("blur", pauseOnBlur);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pauseOnBlur();
});

window.addEventListener("mousedown", (e) => {
  if (gameState !== "play" && gameState !== "pause") return;
  // 中键：锁定 / 解除锁定敌人
  if (e.button === 1) {
    e.preventDefault();
    toggleLockOn();
    return;
  }
  if (!locked && !freeLook) return;
  if (e.button === 0) mouseDownL = true;
  if (e.button === 2) mouseDownR = true;
});

window.addEventListener("mouseup", (e) => {
  if (e.button === 1) e.preventDefault();
  if (e.button === 0) mouseDownL = false;
  if (e.button === 0) playerState.lmbHeld = false;
  if (e.button === 2) mouseDownR = false;
  if (e.button === 2 && playerState.heavyCharging && gameState === "play") {
    releaseHeavy();
  }
});

window.addEventListener("contextmenu", (e) => e.preventDefault());
window.addEventListener("auxclick", (e) => { if (e.button === 1) e.preventDefault(); });

document.addEventListener("mousemove", (e) => {
  if ((!locked && !freeLook) || gameState !== "play") return;
  // 锁定敌人时水平视角交给锁定逻辑，避免鼠标与锁定互相打架
  if (!playerState.locked) playerState.yaw -= e.movementX * 0.0024;
  playerState.pitch -= e.movementY * 0.0024;
  playerState.pitch = Math.max(-0.95, Math.min(0.95, playerState.pitch));
});

// 点击进入战斗：监听挂在 document 上，避免被铺满屏幕的提示层挡住
document.addEventListener("click", (e) => {
  if (e.target.closest && e.target.closest(".pause-action, .select-card")) return;
  if ((gameState === "play" || gameState === "pause") && document.pointerLockElement !== canvas) {
    requestGamePointerLock();
  }
});

let lockAttemptId = 0;
let lastLockExit = 0;

function requestGamePointerLock() {
  if (!canvas.requestPointerLock) {
    enableFreeLook();
    return;
  }
  // Chrome 在刚退出指针锁定后的 1.25 秒内会拒绝再次锁定，这里等冷却结束再请求
  const sinceExit = performance.now() - lastLockExit;
  if (sinceExit < 1400) {
    const waitId = ++lockAttemptId;
    setTimeout(() => {
      if (waitId === lockAttemptId) requestGamePointerLock();
    }, 1400 - sinceExit + 60);
    return;
  }
  const myId = ++lockAttemptId;
  try {
    const p = canvas.requestPointerLock();
    if (p && typeof p.catch === "function") {
      p.catch(() => { if (myId === lockAttemptId) enableFreeLook(); });
    }
  } catch (err) {
    if (myId === lockAttemptId) enableFreeLook();
    return;
  }
  // 浏览器可能静默拒绝（例如刚退出锁定、或环境不支持），退化为自由视角
  setTimeout(() => {
    if (myId === lockAttemptId && document.pointerLockElement !== canvas
      && (gameState === "play" || gameState === "pause")) {
      enableFreeLook();
    }
  }, 700);
}

function enableFreeLook() {
  freeLook = true;
  els.lockHint.classList.add("hidden");
  if (gameState === "pause") setState("play");
}

function toggleLockOn() {
  if (gameState !== "play") return;
  playerState.locked = !playerState.locked;
  audio.sfx("lock");
  els.lockon.classList.toggle("hidden", !playerState.locked);
}

document.addEventListener("pointerlockchange", () => {
  locked = document.pointerLockElement === canvas;
  if (locked) freeLook = false;
  else lastLockExit = performance.now();
  els.lockHint.classList.toggle("hidden", (locked || freeLook) || gameState !== "play");
  if (!locked && !freeLook && gameState === "play") {
    setState("pause");
  } else if (locked && gameState === "pause") {
    setState("play");
  }
});

document.addEventListener("pointerlockerror", () => enableFreeLook());

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------- 界面 ----------
function buildSelectUI() {
  els.selectGrid.innerHTML = "";
  CLASSES.forEach((cls, i) => {
    const card = document.createElement("div");
    card.className = "select-card" + (i === 0 ? " selected" : "");
    card.dataset.index = i;
    card.innerHTML = `
      <div class="bean-emoji">${cls.emoji}</div>
      <div class="card-name">${cls.name}</div>
      <div class="card-stat">
        <div class="card-hp">HP ${cls.stat.hp}</div>
        <div class="card-atk">攻击 ×${cls.stat.atk}</div>
        <div class="card-spd">速度 ×${cls.stat.speed}</div>
      </div>`;
    card.addEventListener("click", () => {
      audio.init();
      selectIndex(i, true);
    });
    card.addEventListener("mouseenter", () => {
      audio.sfx("ui");
      selectIndex(i, false);
    });
    els.selectGrid.appendChild(card);
  });
}

let selectIdx = 0;
function selectIndex(i, confirm) {
  selectIdx = (i + CLASSES.length) % CLASSES.length;
  document.querySelectorAll(".select-card").forEach((c, j) => {
    c.classList.toggle("selected", j === selectIdx);
  });
  els.selectPreview.textContent = CLASSES[selectIdx].desc;
  if (confirm) {
    audio.sfx("select");
    startFight(CLASSES[selectIdx]);
  }
}

document.querySelectorAll(".pause-action").forEach((btn) => {
  btn.addEventListener("click", () => {
    const action = btn.dataset.action;
    audio.sfx("ui");
    if (action === "resume") {
      requestGamePointerLock();
    } else if (action === "restart") {
      resetFight();
      requestGamePointerLock();
    } else if (action === "title") {
      toTitle();
    }
  });
});

function setState(s) {
  if (s !== "play") clearInput();
  gameState = s;
  els.title.classList.toggle("hidden", s !== "title");
  els.select.classList.toggle("hidden", s !== "select");
  els.pause.classList.toggle("hidden", s !== "pause");
  els.defeat.classList.toggle("hidden", s !== "defeat");
  els.victory.classList.toggle("hidden", s !== "victory");
  els.hud.classList.toggle("hidden", !["play", "pause", "defeat"].includes(s));
  els.lockHint.classList.toggle("hidden", !(s === "play" && !locked && !freeLook));
  if (s !== "play") els.bossIndicator.classList.add("hidden");
}

function openSelect() {
  setState("select");
  audio.playTitleTheme();
}

function toTitle() {
  lockAttemptId += 1;
  if (document.pointerLockElement) document.exitPointerLock();
  freeLook = false;
  audio.stopBattlePulse();
  audio.sfx("ui");
  setState("title");
  scene.remove(player);
  player = null;
  bossState.hp = bossState.maxHp;
  bossState.poise = bossState.maxPoise;
  bossState.dead = false;
  bossState.state = "idle";
  bossState.engaged = false;
  bossState.phase2 = false;
  bossState.pos.set(0, 0, -5);
  bossState.facing.set(0, 0, 1);
  boss.scale.setScalar(1);
  boss.userData.marker.visible = true;
  boss.userData.aura.intensity = 1.5;
  bossGlow.intensity = 0.7;
  boss.position.set(0, 0, -5);
  boss.rotation.set(0, 0, 0);
  boss.visible = true;
  els.boss.classList.add("hidden");
  els.lockon.classList.add("hidden");
  clearFx();
}

function startFight(cls) {
  playerClass = cls;
  buildPlayer();
  playerState.hp = playerState.maxHp;
  playerState.stamina = playerState.maxStamina;
  playerState.flasks = 4;
  playerState.pos.set(0, 0, 12);
  playerState.yaw = Math.PI;
  playerState.locked = false;
  els.lockon.classList.add("hidden");
  bossState.hp = bossState.maxHp;
  bossState.poise = bossState.maxPoise;
  bossState.dead = false;
  bossState.state = "idle";
  bossState.engaged = false;
  bossState.phase2 = false;
  bossState.pos.set(0, 0, -5);
  bossState.facing.set(0, 0, 1);
  boss.scale.setScalar(1);
  boss.userData.marker.visible = true;
  boss.userData.aura.intensity = 1.5;
  bossGlow.intensity = 0.7;
  boss.position.set(0, 0, -5);
  boss.visible = true;
  els.boss.classList.add("hidden");
  clearFx();
  respawnPlayer();
  setState("play");
  updateCamera(1);
  showCenterMsg("击败夜王 Heolstor", 2.5);
}

function resetFight() {
  bossState.hp = bossState.maxHp;
  bossState.poise = bossState.maxPoise;
  bossState.dead = false;
  bossState.state = "idle";
  bossState.engaged = false;
  bossState.phase2 = false;
  bossState.pos.set(0, 0, -5);
  bossState.facing.set(0, 0, 1);
  boss.scale.setScalar(1);
  boss.userData.marker.visible = true;
  boss.userData.aura.intensity = 1.5;
  bossGlow.intensity = 0.7;
  boss.position.set(0, 0, -5);
  boss.rotation.set(0, 0, 0);
  boss.visible = true;
  els.boss.classList.add("hidden");
  clearFx();
  respawnPlayer();
}

function clearFx() {
  for (const key of Object.keys(fx)) {
    for (const item of fx[key]) {
      scene.remove(item.mesh ?? item.pts ?? item.mark ?? item);
      if (item.mesh) scene.remove(item.mesh);
      if (item.pts) scene.remove(item.pts);
      if (item.mark) { scene.remove(item.mark); scene.remove(item.bolt); }
      if (item.el) item.el.remove();
    }
    fx[key] = [];
  }
  for (const d of dmgPool) d.el.remove();
  dmgPool.length = 0;
}

// ---------- 玩家更新 ----------
function updatePlayer(dt) {
  if (playerState.dead) return;
  const stat = playerClass.stat;
  const inputX = (keys["KeyD"] ? 1 : 0) - (keys["KeyA"] ? 1 : 0);
  const inputZ = (keys["KeyW"] ? 1 : 0) - (keys["KeyS"] ? 1 : 0);
  const wantSprint = keys["ShiftLeft"] || keys["ShiftRight"];

  // 锁定敌人时角色自动面向 BOSS（魂系锁定手感）：
  // 这样“前进方向”始终等于相机看向 BOSS 的方向，W 不会突然变成后退
  if (playerState.locked && !bossState.dead) {
    const targetYaw = Math.atan2(bossState.pos.x - playerState.pos.x, bossState.pos.z - playerState.pos.z);
    let diff = targetYaw - playerState.yaw;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff)); // 归一化到 [-π, π]，避免绕远路
    playerState.yaw += diff * Math.min(1, dt * 9);
  }

  // 朝向与右方向：屏幕右侧为 +X，按 D 应向角色右手边移动
  const forwardVec = new THREE.Vector3(Math.sin(playerState.yaw), 0, Math.cos(playerState.yaw));
  const rightVec = new THREE.Vector3(-Math.cos(playerState.yaw), 0, Math.sin(playerState.yaw));
  const wishDir = () => new THREE.Vector3()
    .addScaledVector(forwardVec, inputZ)
    .addScaledVector(rightVec, inputX);

  // 翻滚
  if (!playerState.dodging && !playerState.attacking && !playerState.healing && playerState.shiftPressed && playerState.stamina >= 18) {
    const move = wishDir();
    if (move.lengthSq() < 0.01) move.copy(forwardVec).multiplyScalar(-1); // 没有方向输入时向后翻滚
    playerState.dodging = true;
    playerState.dodgeTimer = 0.34;
    playerState.dodgeDir.copy(move.normalize());
    playerState.stamina -= 18;
    playerState.invuln = 0.36;
    audio.sfx("dodge");
  }

  if (playerState.dodging) {
    playerState.dodgeTimer -= dt;
    playerState.pos.x += playerState.dodgeDir.x * 12 * dt;
    playerState.pos.z += playerState.dodgeDir.z * 12 * dt;
    if (playerState.dodgeTimer <= 0) playerState.dodging = false;
  } else if (!playerState.attacking && !playerState.healing) {
    const speed = wantSprint && playerState.stamina > 0 && (inputX || inputZ) ? 7.0 * stat.speed : 4.4 * stat.speed;
    playerState.sprinting = wantSprint && playerState.stamina > 0 && (inputX || inputZ);
    if (playerState.sprinting) playerState.stamina = Math.max(0, playerState.stamina - 13 * dt);
    const move = wishDir();
    playerState.moving = move.lengthSq() > 0.01;
    if (playerState.moving) {
      move.normalize();
      playerState.pos.x += move.x * speed * dt;
      playerState.pos.z += move.z * speed * dt;
    } else {
      playerState.moving = false;
    }
  } else {
    playerState.sprinting = false;
  }

  // 跳跃
  if (!playerState.attacking && !playerState.dodging && !playerState.healing && keys["Space"] && playerState.grounded) {
    playerState.vel.y = 8.2;
    playerState.grounded = false;
    audio.sfx("jump");
  }

  // 重力
  playerState.vel.y -= 22 * dt;
  playerState.pos.y += playerState.vel.y * dt;
  if (playerState.pos.y <= 0) {
    if (!playerState.grounded && playerState.vel.y < -6) audio.sfx("land");
    playerState.pos.y = 0;
    playerState.vel.y = 0;
    playerState.grounded = true;
  }

  // 场地边界
  const dist = Math.hypot(playerState.pos.x, playerState.pos.z);
  if (dist > ARENA_R - 0.8) {
    const k = (ARENA_R - 0.8) / dist;
    playerState.pos.x *= k;
    playerState.pos.z *= k;
  }

  // 攻击
  if (!playerState.healing && !playerState.dodging) {
    if (!playerState.attacking && !playerState.heavyCharging) {
      if (mouseDownL && !playerState.lmbHeld) {
        playerState.lmbHeld = true;
        const cost = !playerState.grounded ? 16 : playerState.sprinting ? 15 : 12;
        if (playerState.stamina >= cost) {
          if (!playerState.grounded) startJumpAttack();
          else if (playerState.sprinting) startRunningAttack();
          else startLightAttack();
        }
      } else if (mouseDownR && playerState.stamina >= (stat.magic ? 22 : 20)) {
        playerState.heavyCharging = true;
        playerState.heavyCharge = 0;
        audio.sfx("charge");
      }
    } else if (playerState.heavyCharging) {
      playerState.heavyCharge = Math.min(1, playerState.heavyCharge + dt * 1.15);
    }
  }

  // 喝血
  if (!playerState.attacking && !playerState.dodging && !playerState.healing && playerState.healPressed && playerState.flasks > 0 && playerState.hp < playerState.maxHp) {
    playerState.healing = true;
    playerState.healTimer = 1.15;
    audio.sfx("flask");
  }
  if (playerState.healing) {
    playerState.healTimer -= dt;
    if (playerState.healTimer <= 0) {
      const heal = Math.min(340, playerState.maxHp - playerState.hp);
      playerState.hp += heal;
      playerState.flasks -= 1;
      spawnDmgNum(heal, playerPosWorld().add(new THREE.Vector3(0, 1.9, 0)), { heal: true, size: 22 });
      audio.sfx("heal");
      playerState.healing = false;
      resetWeaponPose();
    }
  }

  if (playerState.invuln > 0) playerState.invuln -= dt;
  playerState.shiftPressed = false;
  playerState.healPressed = false;

  // 精力回复
  if (!playerState.sprinting && !playerState.attacking && !playerState.dodging && !playerState.heavyCharging) {
    playerState.stamina = Math.min(playerState.maxStamina, playerState.stamina + 30 * dt);
  }

  // 连击超时
  if (playerState.comboTimer > 0) {
    playerState.comboTimer -= dt;
    if (playerState.comboTimer <= 0) playerState.combo = 0;
  }

  // 攻击动画推进
  if (playerState.attacking) {
    playerState.attackTimer -= dt;
    const total = playerState.attackTotal || 0.5;
    const t = 1 - Math.max(0, playerState.attackTimer) / total;
    animateAttack(playerState.attackType, t);
    if (playerState.attackPhase === "windup" && t >= playerState.attackWindup) {
      playerState.attackPhase = "active";
      onAttackActive(playerState.attackType);
    }
    if (playerState.attackTimer <= 0) {
      playerState.attacking = false;
      playerState.attackPhase = "none";
      resetWeaponPose();
    }
  }

  // 受击闪烁
  if (playerState.hitFlash > 0) {
    playerState.hitFlash -= dt;
    player.userData.parts.head.material.emissive && player.userData.parts.head.material.emissive.setScalar(playerState.hitFlash > 0 ? 0.7 : 0);
  }

  // 移动动画
  playerState.animTime += dt;
  animatePlayerVisual(dt);
  updateHUD();
}

function playerPosWorld() {
  return new THREE.Vector3(playerState.pos.x, playerState.pos.y, playerState.pos.z);
}

function startLightAttack() {
  const stat = playerClass.stat;
  playerState.attacking = true;
  playerState.attackPhase = "windup";
  playerState.comboTimer = 1.0;
  playerState.attackType = "light";
  const mult = [1, 1.08, 1.18][playerState.combo] || 1.1;
  playerState.attackDamage = Math.round(42 * stat.atk * mult);
  playerState.combo = (playerState.combo + 1) % stat.combo;
  playerState.attackTotal = 0.42 / stat.speed;
  playerState.attackTimer = playerState.attackTotal;
  playerState.attackWindup = 0.28 / stat.speed / playerState.attackTotal;
  playerState.attackHit = false;
  playerState.stamina -= 12;
  audio.sfx("whoosh");
  spawnSlash(playerPosWorld(), playerState.yaw, 1, "220, 230, 255");
}

function startRunningAttack() {
  const stat = playerClass.stat;
  playerState.attacking = true;
  playerState.attackPhase = "windup";
  playerState.combo = 0;
  playerState.comboTimer = 1.0;
  playerState.attackType = "running";
  playerState.attackDamage = Math.round(58 * stat.atk);
  playerState.attackTotal = 0.52 / stat.speed;
  playerState.attackTimer = playerState.attackTotal;
  playerState.attackWindup = 0.3 / stat.speed / playerState.attackTotal;
  playerState.attackHit = false;
  playerState.stamina -= 15;
  audio.sfx("whoosh");
}

function startJumpAttack() {
  const stat = playerClass.stat;
  playerState.attacking = true;
  playerState.attackPhase = "windup";
  playerState.combo = 0;
  playerState.comboTimer = 1.0;
  playerState.attackType = "jump";
  playerState.attackDamage = Math.round(64 * stat.atk);
  playerState.attackTotal = 0.6;
  playerState.attackTimer = playerState.attackTotal;
  playerState.attackWindup = 0.35 / playerState.attackTotal;
  playerState.attackHit = false;
  playerState.stamina -= 16;
  audio.sfx("whoosh");
}

function releaseHeavy() {
  if (!playerState.heavyCharging) return;
  playerState.heavyCharging = false;
  const stat = playerClass.stat;
  if (stat.magic) {
    // 隐士：发射豆能弹幕
    playerState.attacking = true;
    playerState.attackPhase = "active";
    playerState.attackType = "magic";
    playerState.attackTotal = 0.5;
    playerState.attackTimer = 0.5;
    playerState.stamina -= 22;
    const dir = new THREE.Vector3(Math.sin(playerState.yaw), 0, Math.cos(playerState.yaw));
    spawnBeanBolt(playerPosWorld().add(new THREE.Vector3(0, 1.3, 0)).add(dir.clone().multiplyScalar(1)), dir);
    audio.sfx("meteor");
    return;
  }
  playerState.attacking = true;
  playerState.attackPhase = "windup";
  playerState.attackType = "heavy";
  const chargeBonus = 1 + playerState.heavyCharge * 0.65;
  playerState.attackDamage = Math.round(80 * stat.atk * chargeBonus);
  playerState.attackTotal = 0.62 / stat.speed;
  playerState.attackTimer = playerState.attackTotal;
  playerState.attackWindup = 0.3 / stat.speed / playerState.attackTotal;
  playerState.attackHit = false;
  playerState.stamina -= 20;
  audio.sfx("whoosh");
  spawnSlash(playerPosWorld(), playerState.yaw, 1.5, "255, 200, 140");
}

function onAttackActive(type) {
  if (type === "magic") return;
  const stat = playerClass.stat;
  const range = 2.1 * stat.range;
  const toBoss = new THREE.Vector3(bossState.pos.x - playerState.pos.x, 0, bossState.pos.z - playerState.pos.z);
  const dist = toBoss.length();
  const facing = new THREE.Vector3(Math.sin(playerState.yaw), 0, Math.cos(playerState.yaw));
  toBoss.normalize();
  const angle = facing.angleTo(toBoss);
  if (type === "jump") {
    // 跳跃攻击：小范围落地判定
    if (dist < range + 0.8) {
      damageBoss(playerState.attackDamage, { crit: false, knock: 2 });
      spawnImpact(bossState.pos.x, 1, bossState.pos.z, 0xffb060, 8);
    }
  } else if (dist < range && angle < 1.25) {
    const crit = playerState.attackType === "heavy" && playerState.heavyCharge > 0.7;
    damageBoss(playerState.attackDamage, { crit, knock: type === "heavy" ? 2.5 : 1.2 });
    spawnImpact(bossState.pos.x, 1.4, bossState.pos.z, 0xffc080, crit ? 14 : 8);
  }
}

// 攻击动画：挥舞武器
function animateAttack(type, t) {
  const p = player.userData.parts;
  const wh = p.weaponHolder;
  if (type === "light") {
    const phase = t < 0.35 ? 0 : 1;
    if (phase === 0) {
      wh.rotation.x = THREE.MathUtils.lerp(wh.rotation.x, -1.5, 0.4);
      wh.rotation.z = THREE.MathUtils.lerp(wh.rotation.z, -0.7, 0.4);
    } else {
      wh.rotation.x = THREE.MathUtils.lerp(wh.rotation.x, 1.1, 0.35);
      wh.rotation.z = THREE.MathUtils.lerp(wh.rotation.z, 0.8, 0.35);
    }
  } else if (type === "heavy" || type === "running") {
    wh.rotation.x = t < 0.4 ? -2.0 : 1.3;
    wh.rotation.z = t < 0.4 ? -0.9 : 0.7;
  } else if (type === "jump") {
    wh.rotation.x = t < 0.5 ? -2.4 : -1.2;
    wh.rotation.z = 0.5;
  } else if (type === "magic") {
    wh.rotation.x = -1.6 + t * 0.4;
    wh.rotation.z = 0.3;
  }
}

function resetWeaponPose() {
  const p = player.userData.parts;
  p.weaponHolder.rotation.set(0, 0, 0);
  p.armL.rotation.set(0, 0, 0);
  p.armR.rotation.set(0, 0, 0);
}

// 行走 / 待机动画
function animatePlayerVisual(dt) {
  const p = player.userData.parts;
  const t = playerState.animTime;
  player.position.set(playerState.pos.x, playerState.pos.y, playerState.pos.z);
  player.rotation.y = playerState.yaw;
  heroLight.position.set(playerState.pos.x, playerState.pos.y + 3.2, playerState.pos.z);

  if (playerState.dodging) {
    p.body.rotation.x = THREE.MathUtils.lerp(p.body.rotation.x, 1.2, 0.3);
    player.scale.y = 0.9;
  } else if (!playerState.grounded) {
    p.legL.rotation.x = -0.5;
    p.legR.rotation.x = 0.5;
  } else if (playerState.attacking || playerState.healing) {
    p.legL.rotation.x = 0;
    p.legR.rotation.x = 0;
  } else if (playerState.moving) {
    const speed = playerState.sprinting ? 14 : 9;
    const swing = Math.sin(t * speed) * (playerState.sprinting ? 0.75 : 0.5);
    p.legL.rotation.x = swing;
    p.legR.rotation.x = -swing;
    p.armL.rotation.x = -swing * 0.7;
    p.body.rotation.x = THREE.MathUtils.lerp(p.body.rotation.x, playerState.sprinting ? 0.35 : 0.08, 0.2);
    p.head.position.y = 1.32 * player.userData.headBaseScale + Math.abs(Math.sin(t * speed * 2)) * 0.06;
  } else {
    const breath = Math.sin(t * 2.2) * 0.03;
    p.legL.rotation.x = THREE.MathUtils.lerp(p.legL.rotation.x, 0, 0.2);
    p.legR.rotation.x = THREE.MathUtils.lerp(p.legR.rotation.x, 0, 0.2);
    p.armL.rotation.x = THREE.MathUtils.lerp(p.armL.rotation.x, 0, 0.2);
    p.body.rotation.x = THREE.MathUtils.lerp(p.body.rotation.x, 0, 0.2);
    p.head.position.y = 1.32 * player.userData.headBaseScale + breath;
  }

  if (playerState.healing) {
    p.weaponHolder.rotation.x = -1.2;
  } else if (playerState.heavyCharging) {
    p.weaponHolder.rotation.x = -1.2 - playerState.heavyCharge * 0.9;
    p.weaponHolder.rotation.z = -0.25;
    p.body.rotation.x = THREE.MathUtils.lerp(p.body.rotation.x, 0.12, 0.2);
  }

  if (playerState.hitFlash > 0) {
    player.userData.parts.body.material.emissive = new THREE.Color(0xff3322);
    player.userData.parts.body.material.emissiveIntensity = 0.8;
  } else if (player.userData.parts.body.material.emissive) {
    player.userData.parts.body.material.emissive.setScalar(0);
  }

  // 无敌帧期间闪烁，给出明确反馈（翻滚时用动作本身表现，不闪）
  if (playerState.invuln > 0 && !playerState.dodging) {
    player.visible = Math.floor(playerState.invuln * 14) % 2 === 0;
  } else if (!playerState.dead) {
    player.visible = true;
  }
}

// ---------- 伤害 BOSS ----------
function damageBoss(amount, { crit = false, knock = 1 } = {}) {
  if (bossState.dead || bossState.state === "death") return;
  bossState.hp -= amount;
  bossState.poise -= amount * 0.35 + (crit ? 40 : 0);
  bossState.hitFlash = 0.12;
  bossGlow.intensity = 1.6;
  spawnDmgNum(amount, new THREE.Vector3(bossState.pos.x, 2.8, bossState.pos.z), { crit, size: crit ? 26 : 18 });
  audio.sfx(crit ? "heavyHit" : "hit");
  cameraShake(crit ? 0.25 : 0.1);
  if (bossState.poise <= 0 && bossState.state !== "stagger" && bossState.state !== "skyrend") {
    bossState.poise = bossState.maxPoise;
    bossState.state = "stagger";
    bossState.timer = 2.6;
    bossState.anim = 0;
    audio.sfx("bossDown");
    showCenterMsg("处决时机！", 1.4);
  } else if (bossState.state === "skyrend" && bossState.poise <= 0) {
    // 开天蓄力中被破韧：取消技能
    bossState.poise = bossState.maxPoise;
    bossState.state = "stagger";
    bossState.timer = 3.2;
    bossState.anim = 0;
    for (const m of fx.meteors) {
      scene.remove(m.mark); scene.remove(m.bolt);
    }
    fx.meteors = [];
    audio.sfx("bossDown");
    showCenterMsg("打断了开天！", 1.6);
  }
  if (bossState.hp <= 0) {
    bossState.hp = 0;
    bossDie();
    return;
  }
  if (!bossState.engaged) {
    bossState.engaged = true;
    els.boss.classList.remove("hidden");
  }
  if (!bossState.phase2 && bossState.hp < bossState.maxHp * 0.38) {
    bossState.phase2 = true;
    bossState.attackCd = 0.6;
    showCenterMsg("黑夜将至……", 2.2);
    audio.sfx("roar");
  }
  const kb = new THREE.Vector3(bossState.pos.x - playerState.pos.x, 0, bossState.pos.z - playerState.pos.z).normalize();
  bossState.pos.add(kb.multiplyScalar(0.25 * knock));
  bossState.vel.add(kb.multiplyScalar(0.2 * knock));
}

function bossDie() {
  bossState.dead = true;
  bossState.state = "death";
  bossState.timer = 2.2;
  bossState.anim = 0;
  audio.stopBattlePulse();
  audio.sfx("roar");
  audio.sfx("heavyHit");
  spawnImpact(bossState.pos.x, 2, bossState.pos.z, 0xff8844, 30);
  spawnImpact(bossState.pos.x, 2, bossState.pos.z, 0x6644ff, 20);
  spawnBeam(bossState.pos.x, bossState.pos.z, 3);
  showCenterMsg("NIGHTLORD SLAIN", 2.4);
  els.bossFill.style.width = "0%";
}

// ---------- BOSS AI ----------
function updateBoss(dt) {
  if (bossState.dead) {
    bossState.timer -= dt;
    const k = Math.max(0, bossState.timer / 2.2);
    boss.scale.setScalar(0.4 + 0.6 * k);
    boss.rotation.z += dt * 2;
    bossGlow.intensity = Math.max(0, bossGlow.intensity - dt * 2);
    if (boss.userData.marker) boss.userData.marker.visible = false;
    if (boss.userData.aura) boss.userData.aura.intensity = Math.max(0, boss.userData.aura.intensity - dt * 2);
    if (bossState.timer <= 0) {
      boss.visible = false;
      audio.playVictory();
      setState("victory");
    }
    return;
  }
  if (!bossState.engaged) return;

  bossState.timer -= dt;
  bossState.anim += dt;
  bossState.attackCd -= dt;
  bossState.hitFlash -= dt;
  // 灵光保持在基础亮度，受击时短暂变亮
  bossGlow.intensity = Math.max(bossState.phase2 ? 1.1 : 0.7, bossGlow.intensity - dt * 6);
  bossGlow.position.set(bossState.pos.x, bossState.pos.y + 3.0, bossState.pos.z);

  // 面向玩家
  const toPlayer = new THREE.Vector3(playerState.pos.x - bossState.pos.x, 0, playerState.pos.z - bossState.pos.z);
  const dist = toPlayer.length();
  if (dist > 0.01) {
    bossState.facing.copy(toPlayer).normalize();
    const targetYaw = Math.atan2(bossState.facing.x, bossState.facing.z);
    boss.rotation.y = targetYaw;
  }

  switch (bossState.state) {
    case "idle": {
      if (bossState.attackCd <= 0) {
        if (dist > 7) {
          bossState.state = "approach";
        } else {
          chooseAttack(dist);
        }
      }
      break;
    }
    case "approach": {
      const speed = bossState.phase2 ? 5.5 : 4.2;
      bossState.pos.x += bossState.facing.x * speed * dt;
      bossState.pos.z += bossState.facing.z * speed * dt;
      if (dist < 4.5) {
        bossState.state = "idle";
        bossState.attackCd = 0.3;
      }
      animateBossWalk(dt);
      break;
    }
    case "attack": {
      updateBossAttack(dt);
      break;
    }
    case "recover": {
      animateBossRecover();
      if (bossState.timer <= 0) {
        bossState.state = "idle";
        bossState.attackCd = bossState.phase2 ? 0.55 : 0.95;
        resetBossPose();
      }
      break;
    }
    case "stagger": {
      bossState.anim = 0;
      boss.userData.parts.body.rotation.x = THREE.MathUtils.lerp(boss.userData.parts.body.rotation.x, 1.5, 0.15);
      boss.userData.parts.head.rotation.x = THREE.MathUtils.lerp(boss.userData.parts.head.rotation.x, 1.3, 0.15);
      boss.userData.parts.swordHolder.rotation.z = 0.8;
      if (bossState.timer <= 0) {
        bossState.state = "idle";
        bossState.attackCd = 0.8;
        resetBossPose();
        boss.userData.parts.body.rotation.x = 0;
        boss.userData.parts.head.rotation.x = 0;
      }
      break;
    }
    default:
      break;
  }

  // 边界限制
  const bd = Math.hypot(bossState.pos.x, bossState.pos.z);
  if (bd > ARENA_R - 1.5) {
    const k = (ARENA_R - 1.5) / bd;
    bossState.pos.x *= k;
    bossState.pos.z *= k;
  }
  boss.position.set(bossState.pos.x, bossState.pos.y, bossState.pos.z);

  // 头顶标记：上下浮动 + 旋转，二阶段更快
  const marker = boss.userData.marker;
  if (marker) {
    marker.visible = true;
    const speed = bossState.phase2 ? 3.2 : 2.0;
    marker.position.y = 6.1 + Math.sin(elapsed * speed) * 0.22;
    marker.rotation.y += dt * (bossState.phase2 ? 2.2 : 1.2);
  }
  const aura = boss.userData.aura;
  if (aura) {
    aura.intensity = bossState.phase2 ? 2.2 + Math.sin(elapsed * 3) * 0.5 : 1.5;
  }

  // BOSS 受伤闪烁
  const core = boss.userData.parts.core;
  if (bossState.hitFlash > 0) {
    core.material.emissiveIntensity = 2.4;
  } else {
    core.material.emissiveIntensity = bossState.phase2 ? 1.6 : 0.8;
  }
}

function chooseAttack(dist) {
  bossState.state = "attack";
  bossState.anim = 0;
  const r = Math.random();
  let atk;
  if (bossState.phase2 && r < 0.24) {
    atk = "skyrend";
  } else if (dist < 3.2) {
    atk = r < 0.45 ? "combo" : r < 0.75 ? "overhead" : "dash";
  } else if (dist < 8) {
    atk = r < 0.5 ? "dash" : r < 0.75 ? "jump" : "overhead";
  } else {
    atk = "jump";
  }
  bossState.attack = atk;
  bossState.attackStep = 0;
  bossState.attackT = 0;
  bossState.hitDone = false;
  bossState.hitDone2 = false;
  bossState.hitDone3 = false;
  bossState.skyBeamSpawned = false;
  if (atk === "skyrend") {
    bossState.attackTotal = 2.6;
    audio.sfx("roar");
  } else if (atk === "combo") {
    bossState.attackTotal = 2.0;
  } else if (atk === "overhead") {
    bossState.attackTotal = 1.5;
  } else if (atk === "dash") {
    bossState.attackTotal = 1.2;
  } else {
    bossState.attackTotal = 1.8;
  }
}

function updateBossAttack(dt) {
  bossState.attackT += dt;
  const atk = bossState.attack;
  const p = boss.userData.parts;
  const distToPlayer = Math.hypot(playerState.pos.x - bossState.pos.x, playerState.pos.z - bossState.pos.z);

  if (atk === "combo") {
    // 三段追击连斩
    const seg = 0.62;
    const idx = Math.min(2, Math.floor(bossState.attackT / seg));
    const tt = (bossState.attackT % seg) / seg;
    if (idx === 0) {
      p.swordHolder.rotation.x = tt < 0.45 ? -1.6 : 1.2;
      if (tt >= 0.45 && !bossState.hitDone) {
        bossState.hitDone = true;
        if (distToPlayer < 3.7) bossHitPlayer(85);
      }
    } else if (idx === 1) {
      p.swordHolder.rotation.x = tt < 0.45 ? -1.9 : 1.4;
      if (tt >= 0.45 && !bossState.hitDone2) {
        bossState.hitDone2 = true;
        if (distToPlayer < 3.9) bossHitPlayer(95);
      }
    } else {
      p.swordHolder.rotation.x = tt < 0.5 ? -2.2 : 1.6;
      if (tt >= 0.5 && !bossState.hitDone3) {
        bossState.hitDone3 = true;
        if (distToPlayer < 4.2) bossHitPlayer(110);
        spawnWave(bossState.pos.x, bossState.pos.z, 6.5);
      }
    }
    // 第一段后向玩家靠近
    if (idx === 0 && tt > 0.5) {
      const dir = new THREE.Vector3(playerState.pos.x - bossState.pos.x, 0, playerState.pos.z - bossState.pos.z).normalize();
      bossState.pos.x += dir.x * 3.2 * dt;
      bossState.pos.z += dir.z * 3.2 * dt;
    }
    if (bossState.attackT >= bossState.attackTotal) {
      bossState.state = "recover";
      bossState.timer = 0.5;
      resetBossPose();
    }
  } else if (atk === "overhead") {
    const tt = bossState.attackT / bossState.attackTotal;
    if (tt < 0.45) {
      p.swordHolder.rotation.x = -2.4;
      p.armR.rotation.x = -1.6;
    } else if (tt < 0.6) {
      p.swordHolder.rotation.x = 1.9;
      if (!bossState.hitDone) {
        bossState.hitDone = true;
        const dist = Math.hypot(playerState.pos.x - bossState.pos.x, playerState.pos.z - bossState.pos.z);
        if (dist < 3.4) {
          bossHitPlayer(150);
        } else {
          spawnWave(bossState.pos.x, bossState.pos.z, 7);
          audio.sfx("wave");
        }
        spawnImpact(bossState.pos.x, 0.3, bossState.pos.z, 0xffa060, 12);
        cameraShake(0.2);
      }
    } else {
      p.swordHolder.rotation.x = THREE.MathUtils.lerp(p.swordHolder.rotation.x, 0.4, 0.1);
    }
    if (bossState.attackT >= bossState.attackTotal) {
      bossState.state = "recover";
      bossState.timer = 0.6;
      resetBossPose();
    }
  } else if (atk === "dash") {
    const tt = bossState.attackT / bossState.attackTotal;
    if (tt < 0.35) {
      p.swordHolder.rotation.x = -1.5;
      p.swordHolder.rotation.z = -0.5;
    } else if (tt < 0.7) {
      const dir = new THREE.Vector3(playerState.pos.x - bossState.pos.x, 0, playerState.pos.z - bossState.pos.z).normalize();
      bossState.pos.x += dir.x * 13 * dt;
      bossState.pos.z += dir.z * 13 * dt;
      if (!bossState.hitDone && tt >= 0.45) {
        bossState.hitDone = true;
        const dist = Math.hypot(playerState.pos.x - bossState.pos.x, playerState.pos.z - bossState.pos.z);
        if (dist < 3.2) bossHitPlayer(100);
      }
      spawnSlash(bossState.pos, boss.rotation.y, 1.4, "255, 120, 90");
    } else {
      p.swordHolder.rotation.x = 0.8;
    }
    if (bossState.attackT >= bossState.attackTotal) {
      bossState.state = "recover";
      bossState.timer = 0.55;
      resetBossPose();
    }
  } else if (atk === "jump") {
    // 跳到玩家位置砸地
    const tt = bossState.attackT / bossState.attackTotal;
    if (tt < 0.4) {
      p.swordHolder.rotation.x = -2.6;
      p.legL.rotation.x = -0.6;
      p.legR.rotation.x = 0.6;
      if (tt > 0.2) {
        // 蓄力跃起
        bossState.pos.y = Math.sin((tt - 0.2) / 0.2 * Math.PI) * 4;
        bossState.pos.x = THREE.MathUtils.lerp(bossState.pos.x, playerState.pos.x, 0.05);
        bossState.pos.z = THREE.MathUtils.lerp(bossState.pos.z, playerState.pos.z, 0.05);
      }
    } else {
      if (!bossState.hitDone) {
        bossState.hitDone = true;
        bossState.pos.y = 0;
        const dist = Math.hypot(playerState.pos.x - bossState.pos.x, playerState.pos.z - bossState.pos.z);
        if (dist < 3.8) bossHitPlayer(130);
        spawnWave(bossState.pos.x, bossState.pos.z, 6.2);
        spawnImpact(bossState.pos.x, 0.4, bossState.pos.z, 0xff8040, 16);
        audio.sfx("heavyHit");
        cameraShake(0.3);
      }
    }
    if (bossState.attackT >= bossState.attackTotal) {
      bossState.state = "recover";
      bossState.timer = 0.7;
      resetBossPose();
    }
  } else if (atk === "skyrend") {
    const tt = bossState.attackT / bossState.attackTotal;
    // 开天：跃回场地中央，插剑蓄力，天空开裂
    if (tt < 0.12) {
      bossState.pos.x = THREE.MathUtils.lerp(bossState.pos.x, 0, 0.1);
      bossState.pos.z = THREE.MathUtils.lerp(bossState.pos.z, -5, 0.1);
      bossState.pos.y = Math.sin(tt / 0.12 * Math.PI) * 6;
    } else if (tt < 0.55) {
      bossState.pos.y = 0;
      p.swordHolder.rotation.x = -2.8;
      p.body.rotation.x = 0.25;
      bossGlow.intensity = 3;
      if (bossState.attackT < 0.28 && !bossState.skyBeamSpawned) {
        bossState.skyBeamSpawned = true;
        spawnBeam(0, -5, 4);
        audio.sfx("roar");
      }
    } else {
      if (!bossState.hitDone) {
        bossState.hitDone = true;
        spawnWave(0, -5, 6.5);
        setTimeout(() => spawnWave(0, -5, 6.5), 550);
        for (let i = 0; i < 6; i++) {
          const a = Math.random() * Math.PI * 2;
          const r = 4 + Math.random() * (ARENA_R - 8);
          spawnMeteor(Math.cos(a) * r, Math.sin(a) * r);
        }
        audio.sfx("wave");
        cameraShake(0.35);
        spawnImpact(0, 0.3, -5, 0xffcc88, 20);
      }
      p.swordHolder.rotation.x = THREE.MathUtils.lerp(p.swordHolder.rotation.x, 0, 0.08);
    }
    if (bossState.attackT >= bossState.attackTotal) {
      bossState.state = "recover";
      bossState.timer = 1.0;
      bossState.skyBeamSpawned = false;
      resetBossPose();
    }
  }
}

function bossHitPlayer(dmg) {
  if (gameState !== "play" || playerState.dead || playerState.invuln > 0 || playerState.dodging) return;
  playerState.hp -= dmg;
  playerState.hitFlash = 0.25;
  // 受伤后的无敌帧：避免被 BOSS 一套连招直接连死（可与翻滚无敌帧叠加）
  playerState.invuln = 0.75;
  spawnDmgNum(dmg, playerPosWorld().add(new THREE.Vector3(0, 1.8, 0)), { size: 22 });
  audio.sfx("heavyHit");
  cameraShake(0.22);
  const dir = new THREE.Vector3(playerState.pos.x - bossState.pos.x, 0, playerState.pos.z - bossState.pos.z).normalize();
  playerState.pos.x += dir.x * 1.4;
  playerState.pos.z += dir.z * 1.4;
  if (playerState.healing) playerState.healing = false;
  if (playerState.heavyCharging) {
    playerState.heavyCharging = false;
    showCenterMsg("蓄力被打断（没有强韧度）", 1.2);
  }
  if (playerState.hp <= 0) {
    playerState.hp = 0;
    playerDie();
  }
}

function playerDie() {
  playerState.dead = true;
  audio.stopBattlePulse();
  audio.sfx("death");
  spawnChunks(playerPosWorld(), 0x8ab84a, 14);
  spawnImpact(playerPosWorld().x, 1, playerPosWorld().z, 0xa8d868, 16);
  player.visible = false;
  setState("defeat");
}

function animateBossWalk(dt) {
  const p = boss.userData.parts;
  const swing = Math.sin(bossState.anim * 7) * 0.5;
  p.legL.rotation.x = swing;
  p.legR.rotation.x = -swing;
  p.armL.rotation.x = -swing * 0.6;
}

function animateBossRecover() {
  const p = boss.userData.parts;
  p.body.rotation.x = THREE.MathUtils.lerp(p.body.rotation.x, 0, 0.1);
}

function resetBossPose() {
  const p = boss.userData.parts;
  p.swordHolder.rotation.set(0, 0, 0);
  p.armL.rotation.set(0, 0, 0);
  p.armR.rotation.set(0, 0, 0);
  p.legL.rotation.x = 0;
  p.legR.rotation.x = 0;
  p.body.rotation.x = 0;
  bossState.hitDone = false;
  bossState.hitDone2 = false;
  bossState.hitDone3 = false;
  bossState.pos.y = 0;
}

// ---------- 特效更新 ----------
function updateFx(dt) {
  for (let i = fx.slashes.length - 1; i >= 0; i--) {
    const s = fx.slashes[i];
    s.life -= dt;
    s.mesh.material.opacity = Math.max(0, s.life / 0.18);
    s.mesh.rotation.z += dt * 4;
    if (s.life <= 0) {
      scene.remove(s.mesh);
      s.mesh.material.dispose();
      fx.slashes.splice(i, 1);
    }
  }

  for (let i = fx.rings.length - 1; i >= 0; i--) {
    const r = fx.rings[i];
    if (r.wave) {
      r.radius += r.speed * dt;
      r.mesh.scale.setScalar(r.radius);
      r.mesh.material.opacity = Math.max(0, 1 - r.radius / 26);
      const dx = playerState.pos.x - r.mesh.position.x;
      const dz = playerState.pos.z - r.mesh.position.z;
      const pd = Math.hypot(dx, dz);
      const key = Math.round(pd);
      if (!r.hit.has(key) && Math.abs(pd - r.radius) < 0.7 && playerState.pos.y < 0.75 && !playerState.dead) {
        r.hit.add(key);
        bossHitPlayer(95);
      }
      if (r.radius > 27) {
        scene.remove(r.mesh);
        r.mesh.material.dispose();
        fx.rings.splice(i, 1);
      }
    } else {
      r.life -= dt;
      r.mesh.scale.multiplyScalar(1 + dt * 6);
      r.mesh.material.opacity = Math.max(0, r.life / 0.4);
      if (r.life <= 0) {
        scene.remove(r.mesh);
        r.mesh.material.dispose();
        fx.rings.splice(i, 1);
      }
    }
  }

  for (let i = fx.meteors.length - 1; i >= 0; i--) {
    const m = fx.meteors[i];
    if (m.state === "telegraph") {
      m.timer -= dt;
      m.mark.material.opacity = 0.5 + Math.sin(m.timer * 14) * 0.35;
      if (m.timer <= 0) {
        m.state = "impact";
        m.mark.material.opacity = 0.2;
        audio.sfx("meteor");
        spawnImpact(m.x, 0.4, m.z, 0xff6633, 14);
        spawnImpact(m.x, 0.4, m.z, 0xffcc66, 8);
        cameraShake(0.18);
        const dist = Math.hypot(playerState.pos.x - m.x, playerState.pos.z - m.z);
        if (dist < 1.8 && !playerState.dead) bossHitPlayer(120);
      }
    } else {
      m.bolt.position.y -= 14 * dt;
      if (m.bolt.position.y <= 0.5) {
        scene.remove(m.mark);
        scene.remove(m.bolt);
        fx.meteors.splice(i, 1);
      }
    }
  }

  for (let i = fx.bolts.length - 1; i >= 0; i--) {
    const b = fx.bolts[i];
    b.life -= dt;
    b.mesh.position.add(b.dir.clone().multiplyScalar(b.speed * dt));
    if (b.friendly) {
      const dx = bossState.pos.x - b.mesh.position.x;
      const dz = bossState.pos.z - b.mesh.position.z;
      const dy = 1.4 - b.mesh.position.y;
      if (Math.hypot(dx, dz) < 1.0 && Math.abs(dy) < 1.4 && !bossState.dead) {
        damageBoss(58 * playerClass.stat.atk, {});
        spawnImpact(b.mesh.position.x, b.mesh.position.y, b.mesh.position.z, 0xaa88ff, 10);
        scene.remove(b.mesh);
        fx.bolts.splice(i, 1);
        continue;
      }
    }
    if (b.life <= 0 || b.mesh.position.length() > ARENA_R + 8) {
      scene.remove(b.mesh);
      fx.bolts.splice(i, 1);
    }
  }

  for (let i = fx.beams.length - 1; i >= 0; i--) {
    const b = fx.beams[i];
    b.life -= dt;
    b.mesh.material.opacity = Math.max(0, b.life / 1.5) * 0.9;
    b.mesh.rotation.z += dt * 0.4;
    if (b.life <= 0) {
      scene.remove(b.mesh);
      b.mesh.material.dispose();
      fx.beams.splice(i, 1);
    }
  }

  for (let i = fx.impacts.length - 1; i >= 0; i--) {
    const pt = fx.impacts[i];
    pt.life -= dt;
    const arr = pt.pts.geometry.attributes.position.array;
    for (let j = 0; j < pt.vel.length; j++) {
      arr[j * 3] += pt.vel[j].x * dt;
      arr[j * 3 + 1] += pt.vel[j].y * dt;
      arr[j * 3 + 2] += pt.vel[j].z * dt;
      pt.vel[j].y -= 14 * dt;
    }
    pt.pts.geometry.attributes.position.needsUpdate = true;
    pt.pts.material.opacity = Math.max(0, pt.life / 0.55);
    if (pt.life <= 0) {
      scene.remove(pt.pts);
      pt.pts.material.dispose();
      pt.pts.geometry.dispose();
      fx.impacts.splice(i, 1);
    }
  }

  for (let i = fx.chunks.length - 1; i >= 0; i--) {
    const c = fx.chunks[i];
    c.life -= dt;
    const arr = c.pts.geometry.attributes.position.array;
    for (let j = 0; j < c.vel.length; j++) {
      arr[j * 3] += c.vel[j].x * dt;
      arr[j * 3 + 1] += c.vel[j].y * dt;
      arr[j * 3 + 2] += c.vel[j].z * dt;
      c.vel[j].y -= 20 * dt;
      if (arr[j * 3 + 1] < 0.1) {
        arr[j * 3 + 1] = 0.1;
        c.vel[j].y *= -0.3;
      }
    }
    c.pts.geometry.attributes.position.needsUpdate = true;
    c.pts.material.opacity = Math.max(0, c.life / 0.8);
    if (c.life <= 0) {
      scene.remove(c.pts);
      c.pts.material.dispose();
      c.pts.geometry.dispose();
      fx.chunks.splice(i, 1);
    }
  }

  // 伤害飘字动画
  for (let i = dmgPool.length - 1; i >= 0; i--) {
    const d = dmgPool[i];
    d.t += dt;
    d.el.style.top = (parseFloat(d.el.style.top) - dt * 46) + "px";
    d.el.style.opacity = Math.max(0, 1 - d.t / 0.9);
    if (d.t > 0.9) {
      d.el.remove();
      dmgPool.splice(i, 1);
    }
  }
}

// ---------- 相机 ----------
let shake = 0;
function cameraShake(v) {
  shake = Math.min(0.5, shake + v);
}

function updateCamera(dt) {
  if (!player) return;
  // 相机围绕“角色胸口高度”这个支点旋转，保证角色始终在画面里
  const pivot = new THREE.Vector3(playerState.pos.x, playerState.pos.y + 1.55, playerState.pos.z);
  const yaw = playerState.yaw;
  const pitch = playerState.pitch;

  let desired;
  let lookTarget;

  if (playerState.locked && !bossState.dead) {
    // 锁定视角：相机退到玩家身后，取景点偏向 BOSS，保证两者都在画面里
    const bossPos = new THREE.Vector3(bossState.pos.x, 2.6, bossState.pos.z);
    const gap = pivot.distanceTo(bossPos);
    const dir = pivot.clone().sub(bossPos).setY(0).normalize();
    const camDist = THREE.MathUtils.clamp(5.6 + (gap - 8) * 0.35, 5.6, 12);
    desired = pivot.clone().addScaledVector(dir, camDist);
    desired.y = THREE.MathUtils.clamp(2.4 + gap * 0.08, 2.4, 6.5);
    lookTarget = pivot.clone().lerp(bossPos, 0.35);
    camera.position.lerp(desired, 1 - Math.pow(0.001, dt));
  } else {
    // 第三人称越肩视角：只让水平方向绕轨道旋转，高度单独计算并夹紧，避免钻进地面
    const back = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const horizontal = Math.max(3.4, 5.4 * Math.cos(pitch * 0.5));
    desired = pivot.clone().addScaledVector(back, horizontal);
    desired.y = THREE.MathUtils.clamp(pivot.y + 1.0 - Math.sin(pitch) * 1.5, 1.1, 6.5);
    desired = clampInsideArena(desired);
    lookTarget = pivot.clone().add(new THREE.Vector3(0, 0.15 + Math.sin(pitch) * 2.0, 0));
    camera.position.lerp(desired, 1 - Math.pow(0.002, dt));
  }

  if (shake > 0) {
    camera.position.x += (Math.random() - 0.5) * shake * 0.4;
    camera.position.y += (Math.random() - 0.5) * shake * 0.4;
    camera.position.z += (Math.random() - 0.5) * shake * 0.4;
    shake = Math.max(0, shake - dt * 1.2);
  }

  if (playerState.locked && !bossState.dead) {
    updateLockonReticle();
  } else {
    els.lockon.classList.add("hidden");
  }
  camera.lookAt(lookTarget);
}

// 把相机限制在场地石壁内侧，防止贴墙时被墙挡住视线
function clampInsideArena(v) {
  const maxR = ARENA_R + 0.5;
  const dist = Math.hypot(v.x, v.z);
  if (dist > maxR) {
    const k = maxR / dist;
    v.x *= k;
    v.z *= k;
  }
  return v;
}

function updateLockonReticle() {
  const v = new THREE.Vector3(bossState.pos.x, 2.6, bossState.pos.z).project(camera);
  if (v.z > 1) {
    els.lockon.classList.add("hidden");
    return;
  }
  els.lockon.classList.remove("hidden");
  els.lockon.style.left = ((v.x * 0.5 + 0.5) * window.innerWidth) + "px";
  els.lockon.style.top = ((-v.y * 0.5 + 0.5) * window.innerHeight) + "px";
}

// BOSS 跑到画面外时，在屏幕边缘显示方向指示器
function updateBossIndicator() {
  if (!player || bossState.dead || !boss.userData.marker?.visible) {
    els.bossIndicator.classList.add("hidden");
    return;
  }
  const bossWorld = new THREE.Vector3(bossState.pos.x, bossState.pos.y + 2.6, bossState.pos.z);
  const v = bossWorld.clone().project(camera);
  const onScreen = Math.abs(v.x) < 1 && Math.abs(v.y) < 1 && v.z < 1;

  // 在画面内且已经能看到 BOSS 本体时就不需要指示器
  const bossBody = new THREE.Vector3(bossState.pos.x, bossState.pos.y + 1.6, bossState.pos.z).project(camera);
  const bodyVisible = Math.abs(bossBody.x) < 1 && Math.abs(bossBody.y) < 1 && bossBody.z < 1;
  if (onScreen && bodyVisible) {
    els.bossIndicator.classList.add("hidden");
    return;
  }

  let nx = v.x;
  let ny = v.y;
  if (v.z > 1) {
    // 在相机背后时投影会翻转，取反得到真实方向
    nx = -nx;
    ny = -ny;
  }
  const margin = 0.86;
  const scale = Math.max(Math.abs(nx), Math.abs(ny)) / margin;
  const cx = scale > 1 ? nx / scale : nx * 0.94;
  const cy = scale > 1 ? ny / scale : ny * 0.94;

  els.bossIndicator.classList.remove("hidden");
  els.bossIndicator.style.left = ((cx * 0.5 + 0.5) * window.innerWidth) + "px";
  els.bossIndicator.style.top = ((-cy * 0.5 + 0.5) * window.innerHeight) + "px";
  const angle = Math.atan2(-cy, cx) * 180 / Math.PI + 90;
  els.bossIndicator.querySelector(".boss-indicator-arrow").style.transform = `rotate(${angle.toFixed(0)}deg)`;
  const dist = Math.hypot(playerState.pos.x - bossState.pos.x, playerState.pos.z - bossState.pos.z);
  els.bossIndicatorDist.textContent = Math.round(dist) + "m";
}

// ---------- HUD ----------
function updateHUD() {
  els.hpFill.style.width = (playerState.hp / playerState.maxHp * 100) + "%";
  els.hpBack.style.width = (playerState.hp / playerState.maxHp * 100) + "%";
  els.stFill.style.width = (playerState.stamina / playerState.maxStamina * 100) + "%";
  els.flaskCount.textContent = playerState.flasks;
  if (bossState.engaged && !bossState.dead) {
    els.bossFill.style.width = (Math.max(0, bossState.hp) / bossState.maxHp * 100) + "%";
  }
}

// ---------- 主循环 ----------
let elapsed = 0;
let lastFrame = performance.now();

function tick() {
  requestAnimationFrame(tick);
  const now = performance.now();
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  elapsed += dt;

  world.fireflies.rotation.y += dt * 0.02;

  if (gameState === "play" && (locked || freeLook) && player && !playerState.dead) {
    updatePlayer(dt);
    if (bossState.engaged) {
      updateBoss(dt);
      if (bossState.engaged) audio.startBattlePulse();
    }
    updateFx(dt);
    updateCamera(dt);
    updateBossIndicator();
  } else if (gameState === "play" && (locked || freeLook)) {
    updateFx(dt);
    updateCamera(dt);
  } else if (gameState === "defeat") {
    updateFx(dt);
  } else if (gameState === "select" || gameState === "title") {
    // 缓慢环绕镜头展示场景
    const a = elapsed * 0.08;
    camera.position.set(Math.sin(a) * 16, 7, Math.cos(a) * 16);
    camera.lookAt(0, 1, 0);
    if (boss) {
      boss.rotation.y += dt * 0.2;
    }
  } else if (gameState === "victory") {
    updateFx(dt);
    const a = elapsed * 0.05;
    camera.position.set(Math.sin(a) * 14, 6, Math.cos(a) * 14);
    camera.lookAt(0, 1, 0);
  }

  renderer.render(scene, camera);
}

// 隐式进入战斗：接近 BOSS 或等待片刻后激活
function autoEngage() {
  if (gameState !== "play" || (!locked && !freeLook)) return;
  if (!bossState.engaged) {
    const dist = Math.hypot(playerState.pos.x - bossState.pos.x, playerState.pos.z - bossState.pos.z);
    if (dist < 16 || elapsed > 4) {
      bossState.engaged = true;
      els.boss.classList.remove("hidden");
      els.bossName.textContent = "HEOLSTOR, THE NIGHTREIGN";
      audio.startBattlePulse();
      audio.sfx("roar");
      showCenterMsg("HEOLSTOR, THE NIGHTREIGN", 2.4);
    }
  }
}
setInterval(autoEngage, 500);

// ---------- 启动 ----------
buildSelectUI();
setState("title");
tick();

// 调试钩子：仅在 URL 带 ?debug 时暴露，用于自动化验证
if (new URLSearchParams(location.search).has("debug")) {
  window.__game = {
    get snapshot() {
      return {
        state: gameState, classId: playerClass?.id,
        hp: playerState.hp, maxHp: playerState.maxHp,
        stamina: playerState.stamina, flasks: playerState.flasks,
        dead: playerState.dead, attacking: playerState.attacking,
        heavyCharging: playerState.heavyCharging, healing: playerState.healing,
        dodging: playerState.dodging, grounded: playerState.grounded,
        heavyCharge: playerState.heavyCharge,
        y: playerState.pos.y, invuln: playerState.invuln,
        bossHp: bossState.hp, bossState: bossState.state,
        bossX: bossState.pos.x, bossZ: bossState.pos.z,
        bossPhase2: bossState.phase2, bossEngaged: bossState.engaged,
        waves: fx.rings.filter((r) => r.wave).length, meteors: fx.meteors.length,
        bolts: fx.bolts.length, lockedOn: playerState.locked,
      };
    },
    damageBoss,
    bossHitPlayer,
    spawnWave,
    spawnMeteor,
    get state() { return gameState; },
    get playerHp() { return playerState.hp; },
    get bossHp() { return bossState.hp; },
    get bossEngaged() { return bossState.engaged; },
    get bossPhase2() { return bossState.phase2; },
    get cameraPos() {
      return { x: +camera.position.x.toFixed(2), y: +camera.position.y.toFixed(2), z: +camera.position.z.toFixed(2) };
    },
    get playerPos() {
      return { x: +playerState.pos.x.toFixed(2), z: +playerState.pos.z.toFixed(2), yaw: +playerState.yaw.toFixed(2) };
    },
    get lockedOn() { return playerState.locked; },
    get freeLook() { return freeLook; },
    get pointerLocked() { return document.pointerLockElement === canvas; },
    get camForward() {
      const v = new THREE.Vector3();
      camera.getWorldDirection(v);
      return { x: +v.x.toFixed(3), z: +v.z.toFixed(3) };
    },
    get modelForward() {
      const v = new THREE.Vector3();
      player.getWorldDirection(v);
      return { x: +v.x.toFixed(3), z: +v.z.toFixed(3) };
    },
    get faceDir() {
      if (!player) return null;
      const head = player.userData.parts.head;
      const o = head.getWorldPosition(new THREE.Vector3());
      const p = head.localToWorld(new THREE.Vector3(1, 0, 0));
      const d = p.sub(o).normalize();
      return { x: +d.x.toFixed(3), z: +d.z.toFixed(3) };
    },
    screenPos(who) {
      const p = who === "boss"
        ? new THREE.Vector3(bossState.pos.x, 3.4, bossState.pos.z)
        : new THREE.Vector3(playerState.pos.x, playerState.pos.y + 1.4, playerState.pos.z);
      const v = p.project(camera);
      return { x: +v.x.toFixed(2), y: +v.y.toFixed(2), z: +v.z.toFixed(2), visible: Math.abs(v.x) < 1 && Math.abs(v.y) < 1 && v.z < 1 };
    },
    setYaw(v) { playerState.yaw = v; },
    setPlayerPos(x, z) { playerState.pos.x = x; playerState.pos.z = z; },
    setPitch(v) { playerState.pitch = v; },
  };
}
