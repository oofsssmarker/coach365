// คลังท่าออกกำลังกาย — รูปจาก free-exercise-db (github.com/yuhonas/free-exercise-db, สาธารณสมบัติ Unlicense)
// รูป 0 = จังหวะเริ่ม, 1 = จังหวะสุดท่า แอปสลับ 2 รูปให้เห็นการเคลื่อนไหว
// check = ชนิดการตรวจท่าด้วยกล้อง (posecheck.js), view = มุมกล้องที่แนะนำ

const EXERCISES = {
  goblet: {
    th: "สควอทถือดัมเบลที่อก", name: "Goblet Squat", img: "Goblet_Squat", eq: "db", muscles: "ต้นขา ก้น แกนกลาง",
    cues: ["ถือดัมเบลตั้งแนบอก (ในรูปใช้เคตเทิลเบล ใช้ดัมเบลแทนได้)", "เท้ากว้างกว่าไหล่เล็กน้อย ปลายเท้าชี้ออก 15–30°", "นั่งลงระหว่างส้นเท้า เข่าชี้ตามปลายเท้า อกตั้ง", "ลงจนต้นขาขนานพื้นหรือต่ำกว่า แล้วดันส้นเท้ายืนขึ้น"],
    mistake: "ส้นเท้าลอย / หลังงอ / เข่าหุบเข้าใน", check: "squat", view: "ด้านข้าง",
  },
  rdl: {
    th: "โรมาเนียนเดดลิฟต์บาร์เบล", name: "Romanian Deadlift", img: "Romanian_Deadlift", eq: "bb", muscles: "ก้น หลังต้นขา หลังล่าง",
    cues: ["ยืนเท้ากว้างเท่าสะโพก จับบาร์กว้างกว่าสะโพก เข่างอนิดเดียว", "ดันก้นไปข้างหลัง บาร์ไถลแนบต้นขาลงมา หลังตรง", "ลงถึงใต้เข่าหรือกลางหน้าแข้ง รู้สึกตึงหลังขา", "บีบก้นดันสะโพกกลับมายืนตรง"],
    mistake: "หลังงอ / บาร์ห่างตัว / ย่อเข่าเหมือนสควอท", check: "hinge", view: "ด้านข้าง",
  },
  row: {
    th: "โน้มตัวดึงบาร์เบล", name: "Bent Over Barbell Row", img: "Bent_Over_Barbell_Row", eq: "bb", muscles: "หลังกลาง ปีก ไหล่หลัง",
    cues: ["พับสะโพกให้ลำตัวเอียง 30–45° จากพื้น เข่างอเล็กน้อย", "ดึงบาร์เข้าหาสะดือ ศอกชิดลำตัว", "บีบสะบักค้าง 1 วิ แล้วค่อยๆ ปล่อยลง"],
    mistake: "เหวี่ยงตัวขึ้นลง / ยักไหล่ / หลังงอ", check: "row", view: "ด้านข้าง",
  },
  floorpress: {
    th: "นอนดันบาร์เบลบนพื้น", name: "Floor Press", img: "Floor_Press", eq: "bb", muscles: "อก ไหล่หน้า หลังแขน",
    cues: ["นอนหงาย ชันเข่า ให้บาร์อยู่เหนืออก (ใช้ดัมเบลแทนได้)", "ลดบาร์ลงจนต้นแขนแตะพื้นเบาๆ ศอกกาง 45° จากลำตัว", "ค้าง 1 วิ แล้วดันขึ้นจนแขนตรง"],
    mistake: "ศอกกาง 90° / ปล่อยศอกกระแทกพื้น", check: "press", view: "ด้านข้าง",
  },
  pushup: {
    th: "วิดพื้น", name: "Push-up", img: "Pushups", eq: "none", muscles: "อก หลังแขน แกนกลาง",
    cues: ["มือกว้างกว่าไหล่เล็กน้อย ลำตัวตรงเป็นไม้กระดาน เกร็งท้อง บีบก้น", "ลงจนอกเกือบแตะพื้น ศอกทำมุม 45° กับลำตัว", "ดันขึ้นจนแขนตรง ถ้ายังทำไม่ไหวให้ใช้ท่าวิดพื้นเอียง"],
    mistake: "สะโพกตก / ก้นโด่ง / ลงไม่สุด", check: "pushup", view: "ด้านข้าง",
  },
  incline: {
    th: "วิดพื้นเอียง (มือบนโต๊ะ/เตียง)", name: "Incline Push-up", img: "Incline_Push-Up", eq: "none", muscles: "อก หลังแขน",
    cues: ["วางมือบนขอบโต๊ะหรือเตียงที่แข็งแรง", "ลำตัวตรง ลงจนอกเกือบแตะขอบ", "ยิ่งที่วางมือต่ำ ยิ่งยาก ค่อยๆ ลดระดับลงจนวิดพื้นได้"],
    mistake: "สะโพกตก / ศอกกางออก", check: "pushup", view: "ด้านข้าง",
  },
  ohp: {
    th: "ยืนดันดัมเบลเหนือศีรษะ", name: "Standing Dumbbell Press", img: "Standing_Dumbbell_Press", eq: "db", muscles: "ไหล่ หลังแขน",
    cues: ["ยืนเกร็งท้อง บีบก้น ดัมเบลอยู่ระดับไหล่", "ดันขึ้นตรงจนแขนเหยียดเหนือหัว", "ลดลงช้าๆ 2 วินาทีกลับระดับไหล่"],
    mistake: "แอ่นหลัง / ใช้ขาส่ง", check: "ohp", view: "ด้านข้าง",
  },
  split: {
    th: "สปลิทสควอทถือดัมเบล", name: "Split Squat", img: "Split_Squat_with_Dumbbells", eq: "db", muscles: "ต้นขา ก้น การทรงตัว",
    cues: ["ยืนเท้าหน้าและเท้าหลังห่างกันประมาณ 1 ก้าวยาว ถือดัมเบลข้างตัว", "ลดเข่าหลังลงตรงๆ จนเกือบแตะพื้น", "ดันด้วยส้นเท้าหน้า ลำตัวตั้งตรง ทำให้ครบแล้วสลับข้าง"],
    mistake: "เข่าหน้าหุบใน / โยกตัวไปข้างหน้า", check: "split", view: "ด้านข้าง",
  },
  bridge: {
    th: "ยกสะโพกวางบาร์บนสะโพก", name: "Barbell Glute Bridge", img: "Barbell_Glute_Bridge", eq: "bb", muscles: "ก้น หลังต้นขา",
    cues: ["นอนหงาย ชันเข่า บาร์วางบนรอยพับสะโพก รองด้วยผ้าขนหนูพับ", "ดันส้นเท้า ยกสะโพกจนเข่า-สะโพก-ไหล่เป็นเส้นตรง", "บีบก้นค้าง 1–2 วิ แล้วลดลง"],
    mistake: "แอ่นหลังแทนการบีบก้น", check: "bridge", view: "ด้านข้าง",
  },
  plank: {
    th: "แพลงก์", name: "Plank", img: "Plank", eq: "none", muscles: "แกนกลาง ไหล่",
    cues: ["ศอกอยู่ใต้ไหล่ ลำตัวตรงจากหัวถึงส้นเท้า", "เกร็งท้องเหมือนกำลังจะโดนต่อย บีบก้น", "หายใจปกติ อย่ากลั้นหายใจ"],
    mistake: "สะโพกตก / ก้นโด่ง", check: "plank", view: "ด้านข้าง",
  },
  deadbug: {
    th: "เดดบัก", name: "Dead Bug", img: "Dead_Bug", eq: "none", muscles: "แกนกลาง หลังล่าง",
    cues: ["นอนหงาย แขนชี้เพดาน เข่างอ 90° ลอยเหนือสะโพก", "เหยียดแขนข้างหนึ่งกับขาข้างตรงข้ามออกช้าๆ", "หลังล่างแนบพื้นตลอด กลับที่เดิมแล้วสลับข้าง"],
    mistake: "หลังแอ่นลอยจากพื้น / ทำเร็วเกินไป", check: null, view: "",
  },
  curl: {
    th: "ยกบาร์เบลงอแขน", name: "Barbell Curl", img: "Barbell_Curl", eq: "bb", muscles: "หน้าแขน",
    cues: ["ยืนตรง ศอกแนบลำตัว ไม่ขยับศอก", "ยกบาร์ขึ้นหาไหล่", "ลดลงช้าๆ จนแขนเกือบเหยียด"],
    mistake: "เหวี่ยงลำตัว / ศอกเลื่อนไปหน้า", check: "curl", view: "ด้านข้าง",
  },
  triceps: {
    th: "เหยียดแขนหลังด้วยดัมเบล", name: "Standing Dumbbell Triceps Extension", img: "Standing_Dumbbell_Triceps_Extension", eq: "db", muscles: "หลังแขน",
    cues: ["จับดัมเบลสองมือ ยกเหนือหัว", "งอศอกให้ดัมเบลลงไปหลังศีรษะ ศอกชี้เพดาน", "เหยียดขึ้นจนแขนตรง"],
    mistake: "ศอกกางออก / แอ่นหลัง", check: null, view: "",
  },
  dbrow: {
    th: "ดึงดัมเบลแขนเดียว", name: "One-Arm Dumbbell Row", img: "One-Arm_Dumbbell_Row", eq: "db", muscles: "ปีก หลังกลาง",
    cues: ["มือและเข่าข้างหนึ่งวางบนเก้าอี้หรือเตียง หลังขนานพื้น", "ดึงดัมเบลขึ้นหาสะโพก ศอกชิดตัว", "ลดลงช้าๆ ทำครบแล้วสลับข้าง"],
    mistake: "บิดลำตัว / ดึงด้วยแขนแทนหลัง", check: null, view: "",
  },
  revfly: {
    th: "กางแขนหลัง (แก้ไหล่ห่อ)", name: "Reverse Fly", img: "Reverse_Flyes", eq: "db", muscles: "ไหล่หลัง สะบัก",
    cues: ["ใช้ดัมเบลเบา 1–3 กก. โน้มตัวไปหน้า หลังตรง", "กางแขนออกด้านข้างจนระดับไหล่ บีบสะบัก", "ลดลงช้าๆ"],
    mistake: "ใช้น้ำหนักมากจนเหวี่ยง", check: null, view: "",
  },
  superman: {
    th: "ซูเปอร์แมน (หลังแข็งแรง)", name: "Superman", img: "Superman", eq: "none", muscles: "หลังล่าง ก้น",
    cues: ["นอนคว่ำ แขนเหยียดไปข้างหน้า", "ยกแขน อก และขาขึ้นพร้อมกันเล็กน้อย", "ค้าง 2–3 วิ แล้ววางลง"],
    mistake: "เงยคอมากเกินไป", check: null, view: "",
  },
  hipflexor: {
    th: "ยืดสะโพกด้านหน้า (ท่าคุกเข่า)", name: "Kneeling Hip Flexor Stretch", img: "Kneeling_Hip_Flexor", eq: "none", muscles: "สะโพกหน้า (นั่งนานตึง)",
    cues: ["คุกเข่าข้างหนึ่ง อีกขาก้าวไปข้างหน้า", "บีบก้นข้างที่คุกเข่า ดันสะโพกไปหน้าเล็กน้อย", "ค้าง 30 วิต่อข้าง"],
    mistake: "แอ่นหลังแทนการดันสะโพก", check: null, view: "",
  },
  calf: {
    th: "เขย่งน่องถือดัมเบล", name: "Standing Dumbbell Calf Raise", img: "Standing_Dumbbell_Calf_Raise", eq: "db", muscles: "น่อง",
    cues: ["ยืนถือดัมเบล (ยืนบนขั้นบันไดได้)", "เขย่งปลายเท้าให้สูงสุด ค้าง 1 วิ", "ลดส้นเท้าลงช้าๆ"],
    mistake: "เด้งเร็วเกินไป", check: null, view: "",
  },
};

// โปรแกรมตามเฟส
const SESSIONS = {
  A: { name: "Full body A", items: [["goblet", "3×10–12"], ["floorpress", "3×8–10"], ["row", "3×8–10"], ["bridge", "3×12"], ["plank", "3×30 วิ"]] },
  B: { name: "Full body B", items: [["rdl", "3×8–10"], ["incline", "3×เกือบหมดแรง"], ["ohp", "3×8–12"], ["split", "3×8/ข้าง"], ["deadbug", "3×8/ข้าง"]] },
  U1: { name: "Upper 1 (หนัก)", items: [["floorpress", "4×6–10"], ["row", "4×8–10"], ["ohp", "3×8–10"], ["curl", "2×10–12"], ["triceps", "2×10–12"]] },
  L1: { name: "Lower 1 (หนัก)", items: [["goblet", "4×8–12"], ["rdl", "4×8–10"], ["split", "3×10/ข้าง"], ["calf", "3×15"], ["plank", "3×40 วิ"]] },
  U2: { name: "Upper 2 (ปริมาณ)", items: [["pushup", "4×เกือบหมดแรง"], ["dbrow", "4×10–12/ข้าง"], ["ohp", "3×10–12"], ["revfly", "3×15"], ["curl", "3×12"]] },
  L2: { name: "Lower 2 (ปริมาณ)", items: [["rdl", "4×6–8"], ["split", "3×10/ข้าง"], ["bridge", "4×10–12"], ["superman", "3×10"], ["deadbug", "3×10/ข้าง"]] },
  P: { name: "จัดบุคลิก 10 นาที (ทุกเช้า)", items: [["revfly", "2×15"], ["hipflexor", "30 วิ/ข้าง"], ["superman", "2×10"]] },
  // ปี 2–3: Push / Pull / Legs (สร้างกล้าม)
  PUSH: { name: "Push (อก ไหล่ หลังแขน)", items: [["floorpress", "4×6–10"], ["ohp", "4×8–12"], ["pushup", "3×เกือบหมดแรง"], ["triceps", "3×10–15"]] },
  PULL: { name: "Pull (หลัง หน้าแขน)", items: [["row", "4×6–10"], ["dbrow", "4×10–12/ข้าง"], ["revfly", "3×15"], ["curl", "3×8–12"], ["superman", "3×12"]] },
  LEGS: { name: "Legs (ขา ก้น)", items: [["goblet", "4×8–12"], ["rdl", "4×6–10"], ["split", "3×10/ข้าง"], ["bridge", "4×10–15"], ["calf", "4×12–20"], ["plank", "3×45 วิ"]] },
  // ปี 3: เพิ่มความหนัก (เซ็ตแรกหนัก เซ็ตหลังปริมาณ)
  PUSH2: { name: "Push หนัก", items: [["floorpress", "5×5"], ["ohp", "4×6–8"], ["pushup", "3×เกือบหมดแรง"], ["triceps", "3×12–15"]] },
  PULL2: { name: "Pull หนัก", items: [["row", "5×5"], ["dbrow", "4×8–10/ข้าง"], ["revfly", "3×15–20"], ["curl", "4×8–10"]] },
  LEGS2: { name: "Legs หนัก", items: [["rdl", "5×5"], ["goblet", "4×10–12"], ["split", "4×8/ข้าง"], ["bridge", "4×12"], ["calf", "4×15"], ["deadbug", "3×10/ข้าง"]] },
};

// รูปสลับ 2 จังหวะ
const Figures = (() => {
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let timer = null, frame = 0;
  return {
    html(id) {
      const ex = EXERCISES[id], base = `img/${ex.img}/`;
      return `<div class="fig" role="img" aria-label="ภาพท่า ${ex.th}"><img src="${base}0.jpg" alt="" loading="lazy"><img src="${base}1.jpg" alt="" loading="lazy" class="f1"></div>`;
    },
    start() {
      if (reduce || timer) return;
      timer = setInterval(() => { frame ^= 1; document.body.classList.toggle("frame1", !!frame); }, 1100);
    },
  };
})();
