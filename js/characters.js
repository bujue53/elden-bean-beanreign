import * as THREE from "../lib/three.module.js";
import { beanFaceTexture, bossFaceTexture } from "./textures.js";

export const CLASSES = [
  {
    id: "executioner",
    name: "执刑者",
    emoji: "⚔️",
    desc: "青铜覆面甲与绿色披布的执刑者，持弯曲武士刀。攻击高、范围大。",
    weapon: "marais",
    color: 0xb0402a,
    headScale: 1.15,
    stat: { hp: 620, stamina: 100, atk: 1.25, speed: 1.0, combo: 3, heavyCharge: 1.0, range: 1.25 },
  },
  {
    id: "guardian",
    name: "守护者",
    emoji: "🛡️",
    desc: "鸟首银甲的守护者，持长戟与大盾。生命最多；本作盾牌仅作外观。",
    weapon: "swordshield",
    color: 0x3f6f9e,
    headScale: 1.0,
    stat: { hp: 820, stamina: 100, atk: 0.9, speed: 0.95, combo: 3, heavyCharge: 0.9, range: 1.05 },
  },
  {
    id: "rogue",
    name: "无赖",
    emoji: "🪓",
    desc: "戴角盔、披毛皮的无赖，手持巨斧。保留本作快速连击与较多精力。",
    weapon: "twinblade",
    color: 0x4c5c3c,
    headScale: 0.9,
    stat: { hp: 500, stamina: 110, atk: 0.65, speed: 1.25, combo: 4, heavyCharge: 0.7, range: 0.95 },
  },
  {
    id: "hermit",
    name: "隐士",
    emoji: "🧙",
    desc: "银发尖帽的隐士，着紫黑长袍与刺绣宽袖。右键释放法术弹幕。",
    weapon: "staff",
    color: 0x6b4f8f,
    headScale: 1.05,
    stat: { hp: 560, stamina: 100, atk: 0.85, speed: 1.05, combo: 2, heavyCharge: 0.8, range: 1.0, magic: true },
  },
];

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.05, ...opts });
}

// 马雷家行刑剑：红色剑身 + 金色护手（致敬原作武器）
function buildMaraisSword() {
  const g = new THREE.Group();
  const blade = new THREE.Mesh(
    new THREE.BoxGeometry(0.10, 1.5, 0.22),
    mat(0xb12a1e, { metalness: 0.25, roughness: 0.35 })
  );
  blade.position.y = 0.85;
  blade.castShadow = true;
  g.add(blade);

  const edge = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 1.5, 0.06),
    mat(0xe8b23a, { metalness: 0.8, roughness: 0.3 })
  );
  edge.position.set(0, 0.85, 0.09);
  g.add(edge);

  const guard = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.2, 0.08, 10),
    mat(0xe0b94a, { metalness: 0.85, roughness: 0.25 })
  );
  guard.rotation.z = Math.PI / 2;
  guard.position.y = 0.08;
  g.add(guard);

  const grip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.28, 8),
    mat(0x3a2c1c, { roughness: 0.9 })
  );
  grip.position.y = -0.06;
  g.add(grip);

  const pommel = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 8, 8),
    mat(0xe0b94a, { metalness: 0.8 })
  );
  pommel.position.y = -0.24;
  g.add(pommel);
  return g;
}

function buildStraightSword() {
  const g = new THREE.Group();
  const blade = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, 1.1, 0.16),
    mat(0xcfd6dc, { metalness: 0.7, roughness: 0.3 })
  );
  blade.position.y = 0.68;
  blade.castShadow = true;
  g.add(blade);
  const guard = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.14, 0.07, 8),
    mat(0x8a6a2c, { metalness: 0.6 })
  );
  guard.rotation.z = Math.PI / 2;
  guard.position.y = 0.08;
  g.add(guard);
  const grip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.045, 0.24, 8),
    mat(0x33261a)
  );
  grip.position.y = -0.06;
  g.add(grip);
  return g;
}

function buildShield() {
  const g = new THREE.Group();
  const face = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.34, 0.05, 20),
    mat(0x2c3e50, { metalness: 0.6, roughness: 0.4 })
  );
  face.rotation.z = Math.PI / 2;
  face.castShadow = true;
  g.add(face);
  const boss = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 12, 8),
    mat(0xb9a35a, { metalness: 0.8 })
  );
  boss.scale.set(0.7, 1, 0.4);
  boss.position.z = 0.02;
  g.add(boss);
  return g;
}

function buildTwinBlade() {
  const g = new THREE.Group();
  for (const side of [-1, 1]) {
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.9, 0.14),
      mat(0xc8d2da, { metalness: 0.7, roughness: 0.3 })
    );
    blade.position.set(side * 0.09, 0.58, 0);
    blade.rotation.z = side * 0.25;
    blade.castShadow = true;
    g.add(blade);
    const grip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.2, 6),
      mat(0x2e2418)
    );
    grip.position.set(side * 0.09, -0.06, 0);
    g.add(grip);
  }
  return g;
}

function buildStaff() {
  const g = new THREE.Group();
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.06, 1.5, 8),
    mat(0x5a4326, { roughness: 0.9 })
  );
  shaft.position.y = 0.75;
  g.add(shaft);
  const gem = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.16),
    mat(0x8a5fd0, { emissive: 0x4a2a9a, emissiveIntensity: 1.2, metalness: 0.2, roughness: 0.2 })
  );
  gem.position.y = 1.52;
  gem.castShadow = true;
  g.add(gem);
  return g;
}

export function buildWeapon(type) {
  switch (type) {
    case "marais": return buildMaraisSword();
    case "swordshield": return buildStraightSword();
    case "twinblade": return buildTwinBlade();
    case "staff": return buildStaff();
    default: return buildStraightSword();
  }
}

// 豆子角色：大头 + 小身体 + 小手小脚
export function buildBean({ color = 0xb9a05c, headScale = 1, weaponType = "marais", faceTex = beanFaceTexture() } = {}) {
  const root = new THREE.Group();
  const bodyMat = mat(color);
  const limbMat = mat(new THREE.Color(color).multiplyScalar(0.9), { roughness: 0.85 });

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 16), bodyMat);
  body.scale.set(0.9, 1.05, 0.75);
  body.position.y = 0.62;
  body.castShadow = true;
  root.add(body);

  // 豆子特有的“裂缝”线
  const seam = new THREE.Mesh(
    new THREE.TorusGeometry(0.33, 0.02, 8, 24, Math.PI),
    mat(0x2a2218)
  );
  seam.rotation.x = Math.PI / 2 + 0.25;
  seam.position.y = 0.66;
  seam.scale.set(0.9, 0.75, 1);
  root.add(seam);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 24, 20), bodyMat);
  head.position.y = 1.32;
  head.scale.set(1, 1, 0.92);
  head.scale.multiplyScalar(headScale);
  // 球体贴图中心在 +X，这里的 -90° 让脸部朝向模型正前方(+Z)
  head.rotation.y = -Math.PI / 2;
  head.castShadow = true;
  head.material = new THREE.MeshStandardMaterial({
    color, roughness: 0.7, metalness: 0.0, map: faceTex,
  });
  root.add(head);

  const buildLimb = (len, radius) => {
    const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, len, 6, 10), limbMat);
    mesh.castShadow = true;
    return mesh;
  };

  // 手臂
  const armL = buildLimb(0.24, 0.09);
  armL.position.set(-0.44, 0.78, 0);
  const armR = buildLimb(0.24, 0.09);
  armR.position.set(0.44, 0.78, 0);
  root.add(armL, armR);

  // 腿
  const legL = buildLimb(0.2, 0.1);
  legL.position.set(-0.18, 0.16, 0);
  const legR = buildLimb(0.2, 0.1);
  legR.position.set(0.18, 0.16, 0);
  root.add(legL, legR);

  // 武器
  const weaponHolder = new THREE.Group();
  weaponHolder.position.set(0.42, 0.82, 0.05);
  const weapon = buildWeapon(weaponType);
  weaponHolder.add(weapon);
  root.add(weaponHolder);

  // 盾牌（守护者）
  let shieldHolder = null;
  if (weaponType === "swordshield") {
    shieldHolder = new THREE.Group();
    shieldHolder.position.set(-0.38, 0.8, 0.08);
    const shield = buildShield();
    shieldHolder.add(shield);
    root.add(shieldHolder);
    root.userData.shieldHolder = shieldHolder;
  }

  root.userData.parts = { body, head, armL, armR, legL, legR, weaponHolder, weapon, shieldHolder };
  root.userData.headBaseScale = headScale;
  return root;
}

// BOSS：巨大的黑暗豆骑士 Heolstor
export function buildBoss() {
  const root = new THREE.Group();
  const dark = mat(0x322839, { roughness: 0.6, metalness: 0.15, emissive: 0x1a0d14, emissiveIntensity: 0.6 });
  const armor = mat(0x4c4058, { metalness: 0.5, roughness: 0.5, emissive: 0x22121c, emissiveIntensity: 0.5 });

  const body = new THREE.Mesh(new THREE.SphereGeometry(1.1, 24, 18), armor);
  body.scale.set(1.1, 1.15, 0.9);
  body.position.y = 1.7;
  body.castShadow = true;
  root.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.95, 24, 20), dark);
  head.position.y = 3.4;
  head.scale.set(1, 0.92, 0.95);
  head.rotation.y = -Math.PI / 2;
  head.material = new THREE.MeshStandardMaterial({
    color: 0x241c26, roughness: 0.55, metalness: 0.2, map: bossFaceTexture(),
  });
  head.castShadow = true;
  root.add(head);

  // 头盔角
  for (const s of [-1, 1]) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.9, 10), armor);
    horn.position.set(s * 0.55, 4.25, 0);
    horn.rotation.z = -s * 0.35;
    horn.castShadow = true;
    root.add(horn);
  }

  // 斗篷
  const cape = new THREE.Mesh(
    new THREE.ConeGeometry(1.35, 2.6, 18, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x180f1c, side: THREE.DoubleSide, roughness: 0.9 })
  );
  cape.position.set(0, 1.9, -1.15);
  cape.rotation.x = 0.18;
  root.add(cape);

  // 手臂
  const buildLimb = (len, radius, m) => {
    const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, len, 8, 12), m);
    mesh.castShadow = true;
    return mesh;
  };
  const armL = buildLimb(0.8, 0.24, armor);
  armL.position.set(-1.25, 2.0, 0);
  const armR = buildLimb(0.8, 0.24, armor);
  armR.position.set(1.25, 2.0, 0);
  root.add(armL, armR);

  // 腿
  const legL = buildLimb(0.7, 0.3, dark);
  legL.position.set(-0.5, 0.4, 0);
  const legR = buildLimb(0.7, 0.3, dark);
  legR.position.set(0.5, 0.4, 0);
  root.add(legL, legR);

  // 巨剑
  const swordHolder = new THREE.Group();
  swordHolder.position.set(1.2, 2.1, 0.1);
  const blade = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 4.4, 0.7),
    new THREE.MeshStandardMaterial({ color: 0x2c2f3a, metalness: 0.7, roughness: 0.35 })
  );
  blade.position.y = 2.5;
  blade.castShadow = true;
  swordHolder.add(blade);
  const glowEdge = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 4.4, 0.3),
    new THREE.MeshStandardMaterial({
      color: 0xff5a30, emissive: 0xff3a10, emissiveIntensity: 1.4, roughness: 0.3,
    })
  );
  glowEdge.position.set(0, 2.5, 0.22);
  swordHolder.add(glowEdge);
  const guard = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 0.85, 0.24, 12),
    new THREE.MeshStandardMaterial({ color: 0x8a5a2a, metalness: 0.8 })
  );
  guard.rotation.z = Math.PI / 2;
  guard.position.y = 0.12;
  swordHolder.add(guard);
  const grip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.16, 0.6, 10),
    mat(0x2a1c14)
  );
  grip.position.y = -0.25;
  swordHolder.add(grip);
  root.add(swordHolder);

  // 胸口核心（阶段变化时发亮）
  const core = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.34),
    new THREE.MeshStandardMaterial({
      color: 0xff6a30, emissive: 0xff3a10, emissiveIntensity: 0.8, roughness: 0.2,
    })
  );
  core.position.set(0, 1.85, 0.75);
  root.add(core);

  root.userData.parts = { body, head, armL, armR, legL, legR, swordHolder, cape, core };

  // 随身红色灵光：让 BOSS 在黑夜中远远就能被看到
  const aura = new THREE.PointLight(0xff4a24, 1.5, 18, 2);
  aura.position.set(0, 2.4, 0.6);
  root.add(aura);
  root.userData.aura = aura;

  // 头顶标记（随 BOSS 移动，方便定位）
  const marker = new THREE.Group();
  const diamond = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.3),
    new THREE.MeshBasicMaterial({ color: 0xff5a2a, transparent: true, opacity: 0.95 })
  );
  const halo = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.52),
    new THREE.MeshBasicMaterial({
      color: 0xff2a10, transparent: true, opacity: 0.28,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
  );
  marker.add(diamond, halo);
  marker.position.set(0, 6.1, 0);
  root.add(marker);
  root.userData.marker = marker;
  return root;
}

// 豆能弹幕（隐士攻击）
export function buildBeanBolt() {
  const g = new THREE.Group();
  const bolt = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 12, 10),
    new THREE.MeshStandardMaterial({
      color: 0x9a7ad0, emissive: 0x5a2aa0, emissiveIntensity: 1.4, roughness: 0.2,
    })
  );
  g.add(bolt);
  return g;
}
