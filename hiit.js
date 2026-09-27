// HIIT 10 นาที แบบแรงกระแทกต่ำ (เหมาะกับน้ำหนักตัวมาก ไม่ต้องกระโดด) มีเสียง + สั่นบอกจังหวะ
const LEVELS = [
  { work: 20, rest: 40, th: "ระดับ 1: 20 วิ / พัก 40 วิ" },
  { work: 30, rest: 30, th: "ระดับ 2: 30 วิ / พัก 30 วิ" },
  { work: 40, rest: 20, th: "ระดับ 3: 40 วิ / พัก 20 วิ" },
];
const MOVES = [
  { th: "ย่ำเท้ายกเข่าสูง", cue: "ยกเข่าสลับให้เร็ว แกว่งแขน หลังตรง", img: null },
  { th: "สควอทตัวเปล่า", cue: "นั่งลงแตะเก้าอี้แล้วลุก ดันส้นเท้า", img: "Goblet_Squat" },
  { th: "ยืนดึงเข่าสลับ (mountain climber ยืน)", cue: "มือชูขึ้น ดึงศอกลงหาเข่าฝั่งตรงข้าม", img: null },
  { th: "วิดพื้นเอียงกับโต๊ะ", cue: "ลำตัวตรง ลงช้า ดันเร็ว", img: "Incline_Push-Up" },
  { th: "ชกลมสลับหมัด", cue: "ย่อเข่าเล็กน้อย ชกให้เต็มแขน หายใจออกทุกหมัด", img: null },
];
const WARM = ["เดินอยู่กับที่ แกว่งแขน", "หมุนไหล่ หมุนสะโพก", "ย่อเข่าเบาๆ 10 ครั้ง"];

export function openHiit({ onDone }) {
  const C = window.Coach, S = C.S;
  const lvl = LEVELS[Math.min(2, S.hiitLevel || 0)], rounds = Math.round(600 / (lvl.work + lvl.rest));
  // ลำดับ: วอร์ม 60 วิ → (ทำงาน/พัก) × rounds → คูลดาวน์ 30 วิ
  const steps = [{ kind: "warm", secs: 60, th: "วอร์มอัพ", cue: WARM.join(" · ") }];
  for (let i = 0; i < rounds; i++) { const m = MOVES[i % MOVES.length]; steps.push({ kind: "work", secs: lvl.work, th: m.th, cue: m.cue, img: m.img, round: i + 1 }); steps.push({ kind: "rest", secs: lvl.rest, th: "พัก", cue: "เดินช้าๆ หายใจลึก ท่าต่อไป: " + MOVES[(i + 1) % MOVES.length].th, round: i + 1 }); }
  steps.push({ kind: "cool", secs: 30, th: "คูลดาวน์", cue: "เดินช้าๆ ยืดหน้าขา ยืดอก" });
  const total = steps.reduce((a, s) => a + s.secs, 0);

  const ov = document.createElement("div"); ov.className = "hiit"; document.body.appendChild(ov); document.body.style.overflow = "hidden";
  let wake = null; navigator.wakeLock?.request("screen").then((l) => (wake = l)).catch(() => {});
  const beep = (f = 880, d = 0.12) => { try { const ac = (beep.ac ||= new (window.AudioContext || window.webkitAudioContext)()); const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = f; o.connect(g); g.connect(ac.destination); g.gain.value = 0.3; o.start(); o.stop(ac.currentTime + d); } catch (e) {} };
  const buzz = (p) => { try { navigator.vibrate?.(p); } catch (e) {} };
  const say = (t) => { if (!voice || !("speechSynthesis" in window)) return; speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = "th-TH"; u.rate = 1.1; speechSynthesis.speak(u); };
  let i = 0, left = steps[0].secs, elapsed = 0, timer = null, paused = false, voice = true;

  function render() {
    const s = steps[i], pct = (elapsed / total) * 100;
    ov.innerHTML = `
      <div class="hiit-top"><button class="btn ghost small" data-a="close" type="button">ปิด</button><b>HIIT 10 นาที · ${lvl.th}</b><button class="btn ghost small" data-a="voice" type="button">${voice ? "🔊" : "🔇"}</button></div>
      <div class="bar"><span style="width:${pct.toFixed(1)}%"></span></div>
      <div class="hiit-stage ${s.kind}">
        <div class="eyebrow">${s.kind === "work" ? `รอบ ${s.round}/${rounds} · ออกแรง` : s.kind === "rest" ? `รอบ ${s.round}/${rounds} · พัก` : s.th}</div>
        <div class="hiit-time num" id="hiitT">${left}</div>
        <h2>${s.th}</h2>
        <p>${s.cue}</p>
        ${s.img ? `<div class="fig small"><img src="img/${s.img}/0.jpg" alt=""><img src="img/${s.img}/1.jpg" alt="" class="f1"></div>` : ""}
      </div>
      <div class="hiit-nav"><button class="btn ghost" data-a="prev" type="button" ${i === 0 ? "disabled" : ""}>◀</button><button class="btn" data-a="pause" type="button">${paused ? "▶ ต่อ" : "⏸ พัก"}</button><button class="btn ghost" data-a="next" type="button">▶▶</button></div>`;
  }
  function announce() { const s = steps[i]; beep(s.kind === "work" ? 1175 : 660, 0.25); buzz(s.kind === "work" ? [80, 40, 80] : 60); say(s.kind === "work" ? `${s.th}` : s.kind === "rest" ? "พัก" : s.th); }
  function tick() {
    if (paused) return;
    left--; elapsed++;
    const t = ov.querySelector("#hiitT"); if (t) t.textContent = left;
    if (left === 3 || left === 2 || left === 1) beep(440, 0.08);
    if (left <= 0) { i++; if (i >= steps.length) { finish(); return; } left = steps[i].secs; render(); announce(); }
  }
  function finish() {
    clearInterval(timer);
    const k = C.iso(C.today()), l = (S.logs[k] = S.logs[k] || {});
    l.hiit = true; l.workout = l.workout || l.hiit; S.hiitDone = (S.hiitDone || 0) + 1;
    let up = "";
    if (S.hiitDone % 4 === 0 && (S.hiitLevel || 0) < 2) { S.hiitLevel = (S.hiitLevel || 0) + 1; up = `<div class="callout">🎉 ทำครบ 4 ครั้ง เลื่อนเป็น${LEVELS[S.hiitLevel].th}</div>`; }
    C.save();
    beep(880, .15); setTimeout(() => beep(1175, .15), 180); setTimeout(() => beep(1568, .3), 360); buzz([50, 50, 50, 50, 120]); say("เสร็จแล้ว เก่งมาก");
    ov.innerHTML = `<div class="wk-sum"><div class="eyebrow">เสร็จแล้ว</div><h2>HIIT 10 นาที 🔥</h2><div class="stats"><div class="stat good"><span class="eyebrow">รอบ</span><b>${rounds}</b></div><div class="stat"><span class="eyebrow">ครั้งที่</span><b>${S.hiitDone}</b></div></div>${up}<p class="muted">ดื่มน้ำ 1 แก้ว เดินช้าๆ อีก 2–3 นาทีก่อนนั่ง</p><button class="btn big" data-a="done" type="button">ปิด</button></div>`;
  }
  function close(done) { clearInterval(timer); wake?.release?.().catch(() => {}); if ("speechSynthesis" in window) speechSynthesis.cancel(); ov.remove(); document.body.style.overflow = ""; onDone?.(done); }
  ov.addEventListener("click", (e) => {
    const a = e.target.closest("[data-a]")?.dataset.a; if (!a) return;
    if (a === "close") close(false);
    if (a === "done") close(true);
    if (a === "voice") { voice = !voice; render(); }
    if (a === "pause") { paused = !paused; render(); }
    if (a === "next" && i < steps.length - 1) { elapsed += left; i++; left = steps[i].secs; render(); announce(); }
    if (a === "prev" && i > 0) { elapsed -= steps[i].secs - left; i--; elapsed -= steps[i].secs; left = steps[i].secs; render(); announce(); }
  });
  render(); announce();
  timer = setInterval(tick, 1000);
  document.body.classList.add("frame1"); setInterval(() => document.body.classList.toggle("frame1"), 1100);
}
