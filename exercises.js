// คลังท่าออกกำลังกาย + ภาพ stick figure เคลื่อนไหว (มุมมองด้านข้าง หันขวา)
// มุม: 0 = ชี้ขึ้น, 90 = ชี้ขวา, 180 = ชี้ลง, -90 = ชี้ซ้าย
// ทุกมุมวัดจากข้อต่อที่ใกล้สะโพกออกไป: thigh (สะโพก→เข่า), shin (เข่า→ข้อเท้า),
// torso (สะโพก→ไหล่), ua (ไหล่→ศอก), fa (ศอก→มือ)
// ตำแหน่งยึด: feet = ข้อเท้าอยู่กับที่ (ท่ายืน) หรือ hip = สะโพกอยู่กับที่ (ท่านอน)

const SEG = { thigh: 40, shin: 38, torso: 50, neck: 15, ua: 27, fa: 25, foot: 12 };

const STAND = { feet: [100, 178], thigh: 180, shin: 180, torso: 0, ua: 180, fa: 180 };
const P = (o) => Object.assign({}, STAND, o);

const EXERCISES = {
  goblet: {
    name: "Goblet Squat", th: "สควอทถือดัมเบลที่อก", eq: "db", muscles: "ต้นขา ก้น แกนกลาง",
    poses: [P({ ua: 160, fa: 20 }), P({ thigh: 100, shin: -150, torso: 35, ua: 165, fa: 25 })],
    cues: ["ถือดัมเบลแนบอก ศอกชี้ลง", "นั่งลงระหว่างส้นเท้า เข่าชี้ตามปลายเท้า", "ลงจนต้นขาขนานพื้น แล้วดันส้นเท้าขึ้น"],
    mistake: "ส้นเท้าลอย / หลังงอ / เข่าหุบเข้าใน",
    q: "goblet squat form",
  },
  rdl: {
    name: "Barbell Romanian Deadlift", th: "โรมาเนียนเดดลิฟต์บาร์เบล", eq: "bb", muscles: "ก้น หลังต้นขา หลังล่าง",
    poses: [P({}), P({ thigh: 150, shin: -172, torso: 72 })],
    cues: ["ยืนเท้ากว้างเท่าสะโพก เข่างอนิดเดียว", "ดันก้นไปข้างหลัง บาร์ไถลแนบต้นขา", "ลงถึงกลางหน้าแข้ง รู้สึกตึงหลังขา แล้วบีบก้นยืนขึ้น"],
    mistake: "หลังงอ / บาร์ห่างตัว / ย่อเข่าเหมือนสควอท",
    q: "barbell romanian deadlift form",
  },
  row: {
    name: "Barbell Bent-over Row", th: "โน้มตัวดึงบาร์เบล", eq: "bb", muscles: "หลังกลาง ปีก ไหล่หลัง",
    poses: [P({ thigh: 150, shin: -172, torso: 65 }), P({ thigh: 150, shin: -172, torso: 65, ua: -125, fa: 175 })],
    cues: ["พับสะโพกให้ลำตัวเอียงประมาณ 45°", "ดึงบาร์เข้าหาสะดือ ศอกชิดลำตัว", "บีบสะบักค้าง 1 วิ แล้วค่อยๆ ปล่อย"],
    mistake: "เหวี่ยงตัวขึ้นลง / ยักไหล่ / หลังงอ",
    q: "barbell bent over row form",
  },
  floorpress: {
    name: "Barbell Floor Press", th: "นอนดันบาร์เบลบนพื้น", eq: "bb", muscles: "อก ไหล่หน้า หลังแขน",
    poses: [
      { hip: [95, 172], torso: -90, thigh: 40, shin: 170, ua: 0, fa: 0 },
      { hip: [95, 172], torso: -90, thigh: 40, shin: 170, ua: 105, fa: 5 },
    ],
    cues: ["นอนหงาย ชันเข่า บาร์อยู่เหนืออก", "ลดบาร์ลงจนต้นแขนแตะพื้นเบาๆ ศอกกาง 45°", "ดันขึ้นจนแขนตรง ไม่ล็อกศอกแรง"],
    mistake: "ศอกกาง 90° / ปล่อยศอกกระแทกพื้น",
    q: "barbell floor press form",
  },
  pushup: {
    name: "Push-up", th: "วิดพื้น", eq: "none", muscles: "อก หลังแขน แกนกลาง",
    poses: [
      { feet: [22, 174], thigh: -114, shin: -114, torso: 66, ua: 180, fa: 180, foot: 130 },
      { feet: [22, 174], thigh: -100, shin: -100, torso: 80, ua: -115, fa: 124, foot: 130 },
    ],
    cues: ["มือกว้างกว่าไหล่เล็กน้อย ลำตัวตรงเป็นไม้กระดาน", "ลงจนอกเกือบแตะพื้น ศอกทำมุม 45° กับลำตัว", "ทำไม่ไหว: วางมือบนโต๊ะหรือคุกเข่า"],
    mistake: "สะโพกตก / ก้นโด่ง / ลงไม่สุด",
    q: "push up proper form",
  },
  ohp: {
    name: "Dumbbell Overhead Press", th: "ดันดัมเบลเหนือศีรษะ", eq: "db", muscles: "ไหล่ หลังแขน",
    poses: [P({ ua: 170, fa: 5 }), P({ ua: 0, fa: 0 })],
    cues: ["ยืนเกร็งท้อง บีบก้น ดัมเบลอยู่ระดับไหล่", "ดันขึ้นตรงจนแขนเหยียด หัวลอดแขนเล็กน้อย", "ลดลงช้าๆ 2 วินาที"],
    mistake: "แอ่นหลัง / ใช้ขาส่ง",
    q: "dumbbell overhead press standing form",
  },
  split: {
    name: "Dumbbell Split Squat", th: "สปลิทสควอทถือดัมเบล", eq: "db", muscles: "ต้นขา ก้น การทรงตัว",
    poses: [
      P({ feet: [125, 178], thigh: 155, shin: 150, thigh2: -155, shin2: -145, foot2: 115 }),
      P({ feet: [125, 178], thigh: 95, shin: 180, thigh2: 180, shin2: -95, foot2: 100 }),
    ],
    cues: ["ยืนเท้าหน้า-หลังห่างกันประมาณ 1 ก้าวยาว", "ลดเข่าหลังลงตรงๆ จนเกือบแตะพื้น", "ดันด้วยส้นเท้าหน้า ลำตัวตั้งตรง"],
    mistake: "เข่าหน้าหุบใน / โยกตัวไปหน้า",
    q: "dumbbell split squat form",
  },
  bridge: {
    name: "Barbell Glute Bridge", th: "ยกสะโพกวางบาร์บนสะโพก", eq: "bb", muscles: "ก้น หลังต้นขา",
    poses: [
      { hip: [92, 172], torso: -90, thigh: 40, shin: 170, ua: 90, fa: 90 },
      { hip: [92, 145], torso: -120, thigh: 85, shin: 192, ua: 60, fa: 60 },
    ],
    cues: ["นอนหงาย บาร์วางบนรอยพับสะโพก (รองด้วยผ้าขนหนู)", "ดันส้นเท้า ยกสะโพกจนลำตัวตรง", "บีบก้นค้าง 1–2 วิ แล้วลดลง"],
    mistake: "แอ่นหลังแทนการบีบก้น",
    q: "barbell glute bridge form",
  },
  plank: {
    name: "Plank", th: "แพลงก์", eq: "none", muscles: "แกนกลาง ไหล่",
    poses: [
      { feet: [22, 176], thigh: -102, shin: -102, torso: 78, ua: 180, fa: 90, foot: 130 },
      { feet: [22, 176], thigh: -101, shin: -101, torso: 77, ua: 180, fa: 90, foot: 130 },
    ],
    cues: ["ศอกอยู่ใต้ไหล่ ลำตัวตรงจากหัวถึงส้นเท้า", "เกร็งท้องเหมือนจะโดนต่อย บีบก้น", "หายใจปกติ อย่ากลั้น"],
    mistake: "สะโพกตก / ก้นโด่ง",
    q: "plank proper form",
  },
  deadbug: {
    name: "Dead Bug", th: "เดดบัก", eq: "none", muscles: "แกนกลาง หลังล่าง",
    poses: [
      { hip: [110, 172], torso: -90, thigh: 0, shin: 90, ua: 0, fa: 0, foot: 0 },
      { hip: [110, 172], torso: -90, thigh: 78, shin: 78, ua: -78, fa: -78, foot: 0, thigh2: 0, shin2: 90, ua2: 0, fa2: 0 },
    ],
    cues: ["นอนหงาย แขนชี้เพดาน เข่างอ 90°", "เหยียดแขนซ้ายกับขาขวาออกพร้อมกัน", "หลังล่างแนบพื้นตลอด สลับข้าง"],
    mistake: "หลังแอ่นลอยจากพื้น / ทำเร็วเกิน",
    q: "dead bug exercise form",
  },
  curl: {
    name: "Barbell Curl", th: "ยกบาร์เบลงอแขน", eq: "bb", muscles: "หน้าแขน",
    poses: [P({}), P({ ua: 175, fa: 20 })],
    cues: ["ศอกแนบลำตัว ไม่ขยับ", "ยกบาร์ขึ้นหาไหล่", "ลดลงช้าๆ จนแขนเหยียด"],
    mistake: "เหวี่ยงลำตัว / ศอกเลื่อนไปหน้า",
    q: "barbell curl form",
  },
  triceps: {
    name: "Dumbbell Overhead Triceps Extension", th: "เหยียดแขนหลังเหนือหัว", eq: "db", muscles: "หลังแขน",
    poses: [P({ ua: 5, fa: 190 }), P({ ua: 5, fa: 5 })],
    cues: ["จับดัมเบลสองมือ ยกเหนือหัว", "งอศอกให้ดัมเบลลงไปหลังศีรษะ ศอกชี้เพดาน", "เหยียดขึ้นจนแขนตรง"],
    mistake: "ศอกกางออก / แอ่นหลัง",
    q: "dumbbell overhead triceps extension form",
  },
};

// โปรแกรมตามเฟส
const SESSIONS = {
  A: { name: "Full body A", items: [["goblet", "3×10–12"], ["floorpress", "3×8–10"], ["row", "3×8–10"], ["bridge", "3×12"], ["plank", "3×30 วิ"]] },
  B: { name: "Full body B", items: [["rdl", "3×8–10"], ["pushup", "3×เกือบหมดแรง"], ["ohp", "3×8–12"], ["split", "3×8/ข้าง"], ["deadbug", "3×8/ข้าง"]] },
  U1: { name: "Upper 1 (หนัก)", items: [["floorpress", "4×6–10"], ["row", "4×8–10"], ["ohp", "3×8–10"], ["curl", "2×10–12"], ["triceps", "2×10–12"]] },
  L1: { name: "Lower 1 (หนัก)", items: [["goblet", "4×8–12"], ["rdl", "4×8–10"], ["split", "3×10/ข้าง"], ["plank", "3×40 วิ"]] },
  U2: { name: "Upper 2 (ปริมาณ)", items: [["pushup", "4×เกือบหมดแรง"], ["row", "4×10–12"], ["ohp", "3×10–12"], ["curl", "3×12"], ["triceps", "3×12"]] },
  L2: { name: "Lower 2 (ปริมาณ)", items: [["rdl", "4×6–8"], ["split", "3×10/ข้าง"], ["bridge", "4×10–12"], ["deadbug", "3×10/ข้าง"]] },
};

// ---------- stick figure ----------
function dir(a) { const r = (a * Math.PI) / 180; return [Math.sin(r), -Math.cos(r)]; }
function add(p, a, len) { const d = dir(a); return [p[0] + d[0] * len, p[1] + d[1] * len]; }

function solve(p) {
  const legVec = (t, s) => { const k = add([0, 0], t, SEG.thigh); return add(k, s, SEG.shin); };
  let hip;
  if (p.hip) hip = p.hip;
  else { const v = legVec(p.thigh, p.shin); hip = [p.feet[0] - v[0], p.feet[1] - v[1]]; }
  const knee = add(hip, p.thigh, SEG.thigh), ankle = add(knee, p.shin, SEG.shin), toe = add(ankle, p.foot ?? 90, SEG.foot);
  const t2 = p.thigh2 ?? p.thigh, s2 = p.shin2 ?? p.shin;
  const knee2 = add(hip, t2, SEG.thigh), ankle2 = add(knee2, s2, SEG.shin), toe2 = add(ankle2, p.foot2 ?? p.foot ?? 90, SEG.foot);
  const sh = add(hip, p.torso, SEG.torso), head = add(sh, p.torso, SEG.neck);
  const el = add(sh, p.ua, SEG.ua), hand = add(el, p.fa, SEG.fa);
  const el2 = add(sh, p.ua2 ?? p.ua, SEG.ua), hand2 = add(el2, p.fa2 ?? p.fa, SEG.fa);
  return { hip, knee, ankle, toe, knee2, ankle2, toe2, sh, head, el, hand, el2, hand2 };
}

function lerpPose(a, b, t) {
  const o = {};
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  keys.forEach((k) => {
    const va = a[k] ?? fallback(a, k), vb = b[k] ?? fallback(b, k);
    if (Array.isArray(va)) o[k] = [va[0] + (vb[0] - va[0]) * t, va[1] + (vb[1] - va[1]) * t];
    else if (typeof va === "number") o[k] = va + (vb - va) * t;
  });
  return o;
}
function fallback(p, k) {
  const base = { thigh2: "thigh", shin2: "shin", ua2: "ua", fa2: "fa", foot2: "foot" };
  if (base[k]) return p[base[k]] ?? (k === "foot2" ? 90 : undefined);
  if (k === "foot") return 90;
  return undefined;
}

const line = (a, b, cls) => `<line class="${cls}" x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}"/>`;

function figureSVG(pose, eq) {
  const j = solve(pose);
  let s = `<line class="floor" x1="0" y1="181" x2="200" y2="181"/>`;
  // ข้างไกล (สีจาง)
  s += line(j.hip, j.knee2, "far") + line(j.knee2, j.ankle2, "far") + line(j.ankle2, j.toe2, "far");
  s += line(j.sh, j.el2, "far") + line(j.el2, j.hand2, "far");
  // ลำตัว
  s += line(j.hip, j.sh, "limb") + line(j.sh, j.head, "limb");
  s += line(j.hip, j.knee, "limb") + line(j.knee, j.ankle, "limb") + line(j.ankle, j.toe, "limb");
  s += line(j.sh, j.el, "limb") + line(j.el, j.hand, "limb");
  s += `<circle class="head" cx="${j.head[0].toFixed(1)}" cy="${j.head[1].toFixed(1)}" r="9"/>`;
  const h = j.hand;
  if (eq === "bb") s += `<circle class="plate" cx="${h[0].toFixed(1)}" cy="${h[1].toFixed(1)}" r="14"/><circle class="hub" cx="${h[0].toFixed(1)}" cy="${h[1].toFixed(1)}" r="3"/>`;
  if (eq === "db") s += `<rect class="db" x="${(h[0] - 7).toFixed(1)}" y="${(h[1] - 5).toFixed(1)}" width="14" height="10" rx="2"/>`;
  return s;
}

// แอนิเมชันเดียวสำหรับทุกภาพบนจอ
const Figures = (() => {
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let running = false;
  function frame(ts) {
    const nodes = document.querySelectorAll("svg[data-ex]");
    if (!nodes.length) { running = false; return; }
    const cyc = (ts % 3200) / 3200; // 3.2 วิ/รอบ: ลง-ค้าง-ขึ้น-ค้าง
    let t = cyc < 0.1 ? 0 : cyc < 0.45 ? (cyc - 0.1) / 0.35 : cyc < 0.55 ? 1 : cyc < 0.9 ? 1 - (cyc - 0.55) / 0.35 : 0;
    t = t * t * (3 - 2 * t);
    nodes.forEach((svg) => {
      const r = svg.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const ex = EXERCISES[svg.dataset.ex];
      svg.innerHTML = figureSVG(lerpPose(ex.poses[0], ex.poses[1], t), ex.eq);
    });
    requestAnimationFrame(frame);
  }
  return {
    svg(id, cls = "fig") {
      const ex = EXERCISES[id];
      return `<svg class="${cls}" ${reduce ? "" : `data-ex="${id}"`} viewBox="0 -18 200 204" role="img" aria-label="ภาพท่า ${ex.th}">${figureSVG(ex.poses[reduce ? 1 : 0], ex.eq)}</svg>`;
    },
    start() { if (!reduce && !running) { running = true; requestAnimationFrame(frame); } },
  };
})();
