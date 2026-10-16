import * as THREE from "../lib/three.module.js";

// 程序化生成的贴图：所有美术资源均用 Canvas 绘制，不依赖外部图片。

function makeCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function textureFrom(canvas) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// 豆子脸：大眼睛 + 小嘴，可用于玩家与普通豆子
export function beanFaceTexture({ eyeColor = "#1b1b2e", blush = true, mouth = "smile", scale = 1 } = {}) {
  const c = makeCanvas(256, 256);
  const g = c.getContext("2d");
  // 白色背景：与材质颜色相乘后得到豆子本身的肤色
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, 256, 256);

  // 眼睛（豆子表情通常在脸部中间偏上）
  g.fillStyle = "#ffffff";
  g.beginPath();
  g.ellipse(78, 112, 34 * scale, 42 * scale, 0, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.ellipse(178, 112, 34 * scale, 42 * scale, 0, 0, Math.PI * 2);
  g.fill();

  g.fillStyle = eyeColor;
  g.beginPath();
  g.ellipse(86, 116, 17 * scale, 24 * scale, 0, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.ellipse(170, 116, 17 * scale, 24 * scale, 0, 0, Math.PI * 2);
  g.fill();

  // 高光
  g.fillStyle = "#ffffff";
  g.beginPath();
  g.ellipse(92, 104, 7 * scale, 9 * scale, 0, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.ellipse(176, 104, 7 * scale, 9 * scale, 0, 0, Math.PI * 2);
  g.fill();

  if (blush) {
    g.fillStyle = "rgba(255, 120, 120, 0.5)";
    g.beginPath();
    g.ellipse(52, 152, 20 * scale, 12 * scale, 0, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.ellipse(204, 152, 20 * scale, 12 * scale, 0, 0, Math.PI * 2);
    g.fill();
  }

  // 嘴
  g.strokeStyle = "#241f28";
  g.lineWidth = 5 * scale;
  g.lineCap = "round";
  g.beginPath();
  if (mouth === "open") {
    g.fillStyle = "#3a2430";
    g.beginPath();
    g.ellipse(128, 176, 26 * scale, 20 * scale, 0, 0, Math.PI * 2);
    g.fill();
  } else if (mouth === "grin") {
    g.beginPath();
    g.arc(128, 156, 32 * scale, 0, Math.PI);
    g.stroke();
  } else {
    g.beginPath();
    g.arc(128, 168, 30 * scale, 0.15 * Math.PI, 0.85 * Math.PI);
    g.stroke();
  }

  const tex = textureFrom(c);
  return tex;
}

// BOSS 脸：黑暗、发光的红色眼睛
export function bossFaceTexture() {
  const c = makeCanvas(256, 256);
  const g = c.getContext("2d");
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, 256, 256);

  g.fillStyle = "rgba(30, 6, 8, 0.95)";
  g.beginPath();
  g.ellipse(78, 112, 38, 46, 0, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.ellipse(178, 112, 38, 46, 0, 0, Math.PI * 2);
  g.fill();

  g.shadowColor = "rgba(255, 60, 30, 0.9)";
  g.shadowBlur = 16;
  g.fillStyle = "#ff3b1f";
  g.beginPath();
  g.ellipse(86, 116, 16, 24, 0, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.ellipse(170, 116, 16, 24, 0, 0, Math.PI * 2);
  g.fill();

  g.shadowBlur = 0;
  g.fillStyle = "#12060a";
  g.beginPath();
  g.ellipse(92, 108, 6, 9, 0, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.ellipse(176, 108, 6, 9, 0, 0, Math.PI * 2);
  g.fill();

  // 愤怒的嘴
  g.strokeStyle = "#2a0d12";
  g.lineWidth = 7;
  g.beginPath();
  g.moveTo(96, 190);
  g.lineTo(160, 190);
  g.stroke();
  g.fillStyle = "#ff3b1f";
  g.beginPath();
  g.ellipse(128, 186, 14, 5, 0, 0, Math.PI * 2);
  g.fill();

  return textureFrom(c);
}

// 岩石地面：石板 + 裂纹 + 草地斑块
export function groundTexture() {
  const c = makeCanvas(512, 512);
  const g = c.getContext("2d");
  g.fillStyle = "#2c3346";
  g.fillRect(0, 0, 512, 512);

  // 石板
  const tile = 128;
  for (let y = 0; y < 512; y += tile) {
    for (let x = 0; x < 512; x += tile) {
      const shade = 200 + Math.floor(Math.random() * 45);
      g.fillStyle = `rgb(${shade * 0.2}, ${shade * 0.24}, ${shade * 0.36})`;
      g.fillRect(x + 4, y + 4, tile - 8, tile - 8);
      g.strokeStyle = "rgba(10, 12, 20, 0.8)";
      g.lineWidth = 3;
      g.strokeRect(x + 4, y + 4, tile - 8, tile - 8);
    }
  }

  // 裂纹
  g.strokeStyle = "rgba(8, 9, 16, 0.75)";
  g.lineWidth = 2;
  for (let i = 0; i < 24; i++) {
    let x = Math.random() * 512;
    let y = Math.random() * 512;
    g.beginPath();
    g.moveTo(x, y);
    const segs = 3 + Math.floor(Math.random() * 4);
    for (let s = 0; s < segs; s++) {
      x += (Math.random() - 0.5) * 90;
      y += (Math.random() - 0.5) * 90;
      g.lineTo(x, y);
    }
    g.stroke();
  }

  // 苔藓 / 豆苗
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    g.fillStyle = `rgba(${40 + Math.random() * 30}, ${70 + Math.random() * 40}, ${30 + Math.random() * 20}, 0.5)`;
    g.beginPath();
    g.ellipse(x, y, 4 + Math.random() * 8, 3 + Math.random() * 5, 0, 0, Math.PI * 2);
    g.fill();
  }

  const tex = textureFrom(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  return tex;
}

// 月亮贴图：带环形山
export function moonTexture() {
  const c = makeCanvas(512, 512);
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(230, 220, 30, 256, 256, 256);
  grd.addColorStop(0, "#f7efd8");
  grd.addColorStop(0.65, "#e0d3ae");
  grd.addColorStop(1, "#b9ab85");
  g.fillStyle = grd;
  g.beginPath();
  g.arc(256, 256, 250, 0, Math.PI * 2);
  g.fill();

  g.fillStyle = "rgba(150, 138, 108, 0.45)";
  for (let i = 0; i < 26; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * 200;
    g.beginPath();
    g.arc(256 + Math.cos(a) * r, 256 + Math.sin(a) * r, 8 + Math.random() * 22, 0, Math.PI * 2);
    g.fill();
  }

  const tex = textureFrom(c);
  return tex;
}

// 石柱贴图
export function pillarTexture() {
  const c = makeCanvas(256, 512);
  const g = c.getContext("2d");
  g.fillStyle = "#33384a";
  g.fillRect(0, 0, 256, 512);
  for (let y = 0; y < 512; y += 32) {
    const shade = Math.random() * 30;
    g.fillStyle = `rgba(0, 0, 0, ${0.08 + Math.random() * 0.18})`;
    g.fillRect(0, y, 256, 16);
  }
  g.strokeStyle = "rgba(10, 12, 18, 0.7)";
  g.lineWidth = 3;
  for (let i = 0; i < 10; i++) {
    let x = Math.random() * 256;
    let y = Math.random() * 512;
    g.beginPath();
    g.moveTo(x, y);
    x += (Math.random() - 0.5) * 60;
    y += (Math.random() - 0.5) * 80;
    g.lineTo(x, y);
    g.stroke();
  }
  return textureFrom(c);
}

// 粒子软点
export function softDotTexture() {
  const c = makeCanvas(64, 64);
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(32, 32, 2, 32, 32, 30);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.4, "rgba(255,255,255,0.7)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  const tex = textureFrom(c);
  return tex;
}

// 挥砍特效贴图：弧形刀光
export function slashTexture(color = "220, 230, 255") {
  const c = makeCanvas(256, 256);
  const g = c.getContext("2d");
  g.translate(128, 128);
  g.lineCap = "round";
  for (let i = 0; i < 5; i++) {
    const a0 = 0.05 + i * 0.02;
    const a1 = Math.PI - 0.05 - i * 0.02;
    g.strokeStyle = `rgba(${color}, ${0.55 - i * 0.1})`;
    g.lineWidth = 16 - i * 2.4;
    g.beginPath();
    g.arc(0, 0, 86 - i * 7, a0, a1);
    g.stroke();
  }
  const tex = textureFrom(c);
  return tex;
}

// 冲击波环贴图
export function ringTexture() {
  const c = makeCanvas(256, 256);
  const g = c.getContext("2d");
  g.strokeStyle = "rgba(255, 210, 150, 0.95)";
  g.lineWidth = 14;
  g.beginPath();
  g.arc(128, 128, 92, 0, Math.PI * 2);
  g.stroke();
  g.strokeStyle = "rgba(255, 210, 150, 0.5)";
  g.lineWidth = 8;
  g.beginPath();
  g.arc(128, 128, 70, 0, Math.PI * 2);
  g.stroke();
  return textureFrom(c);
}

// 光束贴图（开天阶段天空裂缝）
export function beamTexture() {
  const c = makeCanvas(128, 128);
  const g = c.getContext("2d");
  const grd = g.createLinearGradient(0, 0, 0, 128);
  grd.addColorStop(0, "rgba(255, 240, 190, 0)");
  grd.addColorStop(0.25, "rgba(255, 240, 190, 0.85)");
  grd.addColorStop(0.75, "rgba(255, 240, 190, 0.85)");
  grd.addColorStop(1, "rgba(255, 240, 190, 0)");
  g.fillStyle = grd;
  g.fillRect(52, 0, 24, 128);
  return textureFrom(c);
}

// 武器金属贴图（简单渐变）
export function swordTexture() {
  const c = makeCanvas(128, 512);
  const g = c.getContext("2d");
  const grd = g.createLinearGradient(0, 0, 128, 0);
  grd.addColorStop(0, "#6a7078");
  grd.addColorStop(0.3, "#e8e6de");
  grd.addColorStop(0.55, "#9aa0a8");
  grd.addColorStop(0.8, "#cfd2d8");
  grd.addColorStop(1, "#5a6068");
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 512);
  g.fillStyle = "rgba(20,22,28,0.35)";
  for (let i = 0; i < 18; i++) {
    g.fillRect(0, i * 30, 128, 4 + Math.random() * 8);
  }
  return textureFrom(c);
}
