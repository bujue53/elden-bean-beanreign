import * as THREE from '../lib/three.module.js';
import { GLTFLoader } from '../lib/GLTFLoader.js';

const templates = new Map();
const ids = ['executioner', 'guardian', 'rogue', 'hermit', 'heolstor'];

export async function loadNightfarers() {
  const loader = new GLTFLoader();
  await Promise.all(ids.map(async id => {
    const gltf = await loader.loadAsync(new URL(`../assets/models/${id}.glb`, import.meta.url).href);
    templates.set(id, gltf.scene);
  }));
}

export function createNightfarer(id) {
  const template = templates.get(id);
  if (!template) throw new Error(`角色模型未加载：${id}`);
  const root = new THREE.Group();
  const visual = new THREE.Group();
  const model = template.clone(true);
  visual.position.y = 0.95;
  model.position.y = -0.95;
  visual.add(model);
  root.add(visual);
  const parts = {};
  const materials = new Set();
  root.traverse(node => {
    if (node.userData.part) parts[node.userData.part] = node;
    if (node.isMesh) {
      node.castShadow = true;
      node.receiveShadow = true;
      const cloned = (Array.isArray(node.material) ? node.material : [node.material]).map(mat => {
        const copy = mat.clone();
        copy.side = THREE.DoubleSide;
        materials.add(copy);
        return copy;
      });
      node.material = Array.isArray(node.material) ? cloned : cloned[0];
    }
  });
  for (const name of ['body', 'head', 'armL', 'armR', 'legL', 'legR', 'weaponHolder']) {
    if (!parts[name]) throw new Error(`模型 ${id} 缺少关节 ${name}`);
  }
  root.userData.parts = parts;
  root.userData.humanoid = true;
  root.userData.visual = visual;
  root.userData.classId = id;
  root.userData.headRestY = parts.head.position.y;
  root.userData.flashMaterials = [...materials];
  root.userData.materials = materials;
  return root;
}

export function disposeNightfarer(root) {
  // Geometry and image textures belong to the shared cached templates.
  for (const material of root?.userData.materials ?? []) material.dispose();
}

export function createHeolstor() {
  const root = createNightfarer('heolstor');
  const p = root.userData.parts;
  p.swordHolder = p.weaponHolder;
  p.core = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), new THREE.MeshStandardMaterial({
    color: 0x18152f, emissive: 0x5544aa, emissiveIntensity: 0.8, metalness: 0.5, roughness: 0.4,
  }));
  p.criticalAnchor.add(p.core);
  const marker = new THREE.Group();
  marker.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.18), new THREE.MeshBasicMaterial({ color: 0xc7a76c })));
  marker.position.y = 6.1;
  root.add(marker);
  const aura = new THREE.PointLight(0x6755bb, 1.5, 18, 2);
  aura.position.set(0, 2.5, 0.4);
  root.add(aura);
  root.userData.marker = marker;
  root.userData.aura = aura;
  return root;
}

export function updateNightfarerFlash(root, active) {
  if (root.userData.flashActive === active) return;
  root.userData.flashActive = active;
  for (const material of root.userData.flashMaterials) {
    material.emissive?.set(active ? 0xff3322 : 0x000000);
    material.emissiveIntensity = active ? 0.65 : 0;
  }
}
