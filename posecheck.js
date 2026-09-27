// ตรวจท่าด้วยกล้อง — MediaPipe Pose Landmarker (Apache-2.0) ทำงานในเครื่อง ไม่ส่งวิดีโอออกไปไหน
const VER = "1.0.1";
const MP = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VER}`;
const MODEL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

let landmarkerP = null;
function getLandmarker() {
  if (!landmarkerP) landmarkerP = (async () => {
    const { FilesetResolver, PoseLandmarker } = await import(`${MP}/vision_bundle.mjs`);
    const fs = await FilesetResolver.forVisionTasks(`${MP}/wasm`);
    const opts = (delegate) => ({ baseOptions: { modelAssetPath: MODEL, delegate }, runningMode: "VIDEO", numPoses: 1, minPoseDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
    try { return await PoseLandmarker.createFromOptions(fs, opts("GPU")); }
    catch (e) { return await PoseLandmarker.createFromOptions(fs, opts("CPU")); }
  })().catch((e) => { landmarkerP = null; throw e; });
  return landmarkerP;
}

// ---------- เรขาคณิต ----------
const L = { nose: 0, ear: [7, 8], sh: [11, 12], el: [13, 14], wr: [15, 16], hip: [23, 24], kn: [25, 26], an: [27, 28] };
function angle(a, b, c) {
  const v1 = [a.x - b.x, a.y - b.y], v2 = [c.x - b.x, c.y - b.y];
  const d = Math.hypot(...v1) * Math.hypot(...v2) || 1;
  return (Math.acos(Math.max(-1, Math.min(1, (v1[0] * v2[0] + v1[1] * v2[1]) / d))) * 180) / Math.PI;
}
// มุมของเส้น a→b เทียบแนวดิ่ง (0 = ตั้งตรง, 90 = แนวนอน)
function fromVertical(a, b) { return (Math.atan2(Math.abs(b.x - a.x), Math.abs(b.y - a.y)) * 180) / Math.PI; }
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function pick(lm, w, h) {
  const P = (i) => ({ x: lm[i].x * w, y: lm[i].y * h, v: lm[i].visibility ?? 1 });
  const vis = (s) => [L.sh, L.el, L.wr, L.hip, L.kn, L.an].reduce((a, k) => a + (lm[k[s]].visibility ?? 1), 0);
  const s = vis(0) >= vis(1) ? 0 : 1; // ข้างที่กล้องเห็นชัดกว่า
  const j = { nose: P(0) };
  for (const k of ["ear", "sh", "el", "wr", "hip", "kn", "an"]) { j[k] = P(L[k][s]); j[k + "2"] = P(L[k][1 - s]); }
  j.front = dist(j.sh, j.sh2) > 0.55 * dist(j.sh, j.hip); // หันหน้าเข้ากล้อง
  return j;
}
const seen = (j, keys) => keys.every((k) => j[k].v > 0.5);

// สะโพกตก/ก้นโด่ง เทียบเส้นไหล่→ข้อเท้า
function bodyLine(j) {
  const a = angle(j.sh, j.hip, j.an);
  if (a >= 160) return { ok: true, a };
  const t = (j.hip.x - j.sh.x) / ((j.an.x - j.sh.x) || 1);
  const lineY = j.sh.y + t * (j.an.y - j.sh.y);
  return { ok: false, a, msg: j.hip.y > lineY ? "สะโพกตก เกร็งท้อง บีบก้น" : "ก้นโด่ง ลดสะโพกลงให้ตรง" };
}

// ---------- กติกาแต่ละท่า ----------
// metric = ค่ามุมหลัก, active(v) = อยู่ในจังหวะออกแรง, reset(v) = กลับจุดเริ่ม → นับ 1 ครั้ง
const RULES = {
  squat: {
    need: ["hip", "kn", "an", "sh"], label: "มุมเข่า",
    metric: (j) => angle(j.hip, j.kn, j.an), active: (v) => v < 125, reset: (v) => v > 160, best: "min",
    live(j) {
      const out = [];
      const lean = fromVertical(j.hip, j.sh);
      if (!j.front && lean > 50) out.push({ bad: true, msg: "อกตั้งขึ้น อย่าโน้มตัวไปหน้ามาก" });
      // เช็กเข่าหุบเฉพาะตอนย่อตัวลง (ตอนยืนเท้ากว้าง เข่าแคบกว่าเท้าเป็นปกติ)
      if (j.front && angle(j.hip, j.kn, j.an) < 140 && dist(j.kn, j.kn2) < 0.8 * dist(j.an, j.an2)) out.push({ bad: true, msg: "เข่าหุบเข้าใน ดันเข่าออกตามปลายเท้า" });
      return out;
    },
    rep: (m) => (m <= 105 ? { msg: "ลึกพอ ดีมาก" } : { bad: true, msg: "ลงอีกนิด ให้ต้นขาขนานพื้น" }),
  },
  // สปลิทสควอท: เข่าหน้ากับเข่าหลังงอไม่เท่ากัน ใช้ค่าเฉลี่ยสองเข่า
  split: {
    need: ["hip", "kn", "an", "kn2", "an2"], label: "มุมเข่าเฉลี่ย",
    metric: (j) => (angle(j.hip, j.kn, j.an) + angle(j.hip2, j.kn2, j.an2)) / 2, active: (v) => v < 120, reset: (v) => v > 138, best: "min",
    live(j) { return fromVertical(j.hip, j.sh) > 25 ? [{ bad: true, msg: "ลำตัวตั้งตรง อย่าโน้มไปหน้า" }] : []; },
    rep: (m) => (m <= 105 ? { msg: "ลงลึกพอ" } : { bad: true, msg: "ลดเข่าหลังลงอีก จนเกือบแตะพื้น" }),
  },
  hinge: {
    need: ["sh", "hip", "kn", "an"], label: "มุมสะโพก",
    metric: (j) => angle(j.sh, j.hip, j.kn), active: (v) => v < 145, reset: (v) => v > 160, best: "min",
    live(j) { return angle(j.hip, j.kn, j.an) < 135 ? [{ bad: true, msg: "ย่อเข่ามากไป ดันก้นไปข้างหลังแทน" }] : []; },
    rep: (m) => (m <= 120 ? { msg: "พับสะโพกได้ดี" } : { bad: true, msg: "พับสะโพกลงอีก ให้รู้สึกตึงหลังขา" }),
  },
  row: {
    need: ["sh", "el", "wr", "hip"], label: "มุมศอก",
    metric: (j) => angle(j.sh, j.el, j.wr), active: (v) => v < 110, reset: (v) => v > 150, best: "min",
    live(j) { const t = fromVertical(j.hip, j.sh); return t < 35 ? [{ bad: true, msg: "โน้มตัวลงอีก ให้ลำตัวเอียงประมาณ 45°" }] : []; },
    rep: (m) => (m <= 90 ? { msg: "ดึงสุด บีบสะบัก" } : { bad: true, msg: "ดึงให้สุดกว่านี้ บาร์เข้าหาสะดือ" }),
  },
  press: {
    need: ["sh", "el", "wr"], label: "มุมศอก",
    metric: (j) => angle(j.sh, j.el, j.wr), active: (v) => v < 110, reset: (v) => v > 150, best: "min",
    live: () => [], rep: (m) => (m <= 95 ? { msg: "ลงสุดดี" } : { bad: true, msg: "ลดลงจนต้นแขนแตะพื้น" }),
  },
  pushup: {
    need: ["sh", "el", "wr", "hip", "an"], label: "มุมศอก",
    metric: (j) => angle(j.sh, j.el, j.wr), active: (v) => v < 110, reset: (v) => v > 150, best: "min",
    live(j) { const b = bodyLine(j); return b.ok ? [] : [{ bad: true, msg: b.msg }]; },
    rep: (m) => (m <= 95 ? { msg: "ลงลึกพอ" } : { bad: true, msg: "ลงอีก ให้อกเกือบแตะพื้น" }),
  },
  ohp: {
    need: ["hip", "sh", "el", "wr"], label: "มุมไหล่",
    metric: (j) => angle(j.hip, j.sh, j.el), active: (v) => v > 150, reset: (v) => v < 100, best: "max",
    live(j) { return fromVertical(j.hip, j.sh) > 15 ? [{ bad: true, msg: "อย่าแอ่นหลัง เกร็งท้อง บีบก้น" }] : []; },
    rep: (m) => (m >= 165 ? { msg: "ดันสุดแขน" } : { bad: true, msg: "ดันขึ้นให้สุดแขน" }),
  },
  curl: {
    need: ["sh", "el", "wr", "hip"], label: "มุมศอก",
    metric: (j) => angle(j.sh, j.el, j.wr), active: (v) => v < 70, reset: (v) => v > 140, best: "min",
    live(j) {
      const out = [];
      if (fromVertical(j.sh, j.el) > 35) out.push({ bad: true, msg: "ศอกแนบลำตัว อย่าให้ศอกเลื่อนไปหน้า" });
      if (fromVertical(j.hip, j.sh) > 15) out.push({ bad: true, msg: "อย่าเหวี่ยงลำตัว" });
      return out;
    },
    rep: (m) => (m <= 55 ? { msg: "ยกสุด" } : { bad: true, msg: "ยกขึ้นให้สุดกว่านี้" }),
  },
  bridge: {
    need: ["sh", "hip", "kn"], label: "มุมสะโพก",
    metric: (j) => angle(j.sh, j.hip, j.kn), active: (v) => v > 155, reset: (v) => v < 130, best: "max",
    live: () => [], rep: (m) => (m >= 165 ? { msg: "ยกสุด บีบก้นค้างไว้" } : { bad: true, msg: "ยกสะโพกขึ้นอีก ให้ตัวตรง" }),
  },
  plank: {
    need: ["sh", "hip", "an"], label: "แนวลำตัว", hold: true,
    metric: (j) => angle(j.sh, j.hip, j.an),
    live(j) { const b = bodyLine(j); return b.ok ? [{ msg: "ลำตัวตรงดี ค้างไว้" }] : [{ bad: true, msg: b.msg }]; },
  },
  posture: {
    need: ["ear", "sh", "hip"], label: "บุคลิก", posture: true,
    metric: () => 0,
    live(j) {
      const torso = dist(j.sh, j.hip) || 1;
      if (j.front) {
        const tilt = (Math.atan2(Math.abs(j.sh.y - j.sh2.y), Math.abs(j.sh.x - j.sh2.x)) * 180) / Math.PI;
        return [tilt > 4 ? { bad: true, msg: `ไหล่สองข้างสูงไม่เท่ากัน (เอียง ${tilt.toFixed(0)}°)` } : { msg: `ไหล่ระดับเท่ากัน (เอียง ${tilt.toFixed(0)}°)` },
          { msg: "หันข้างให้กล้อง เพื่อตรวจคอยื่นและไหล่ห่อ" }];
      }
      const face = Math.sign(j.nose.x - j.ear.x) || 1;
      const head = ((j.ear.x - j.sh.x) * face) / torso, shoulder = ((j.sh.x - j.hip.x) * face) / torso;
      return [
        head > 0.15 ? { bad: true, msg: `คอยื่น ${Math.round(head * 100)}% ของความยาวลำตัว: เก็บคางไปด้านหลัง` } : { msg: "ตำแหน่งศีรษะดี หูอยู่แนวเดียวกับไหล่" },
        shoulder > 0.12 ? { bad: true, msg: "ไหล่ห่อ/ลำตัวโน้มไปหน้า: ยืดอก บีบสะบักเบาๆ" } : { msg: "ไหล่อยู่แนวเดียวกับสะโพก" },
      ];
    },
  },
};

const LINKS = [["sh", "el"], ["el", "wr"], ["sh", "hip"], ["hip", "kn"], ["kn", "an"], ["sh2", "el2"], ["el2", "wr2"], ["sh2", "hip2"], ["hip2", "kn2"], ["kn2", "an2"], ["sh", "sh2"], ["hip", "hip2"], ["ear", "sh"]];

// ---------- หน้าจอ ----------
export async function openPoseCheck({ kind, title, onDone }) {
  const rule = RULES[kind];
  const ov = document.createElement("div");
  ov.className = "pc";
  ov.innerHTML = `
    <div class="pc-top"><b>${title}</b><button class="btn ghost" data-a="close" type="button">ปิด</button></div>
    <div class="pc-stage"><video playsinline muted></video><canvas></canvas><div class="pc-msg">กำลังโหลด AI ตรวจท่า (ครั้งแรกประมาณ 10 MB)…</div></div>
    <div class="pc-hud">
      <div class="pc-big"><span data-v="count">0</span><small data-v="unit">${rule.hold ? "วินาที" : rule.posture ? "" : "ครั้ง"}</small></div>
      <div class="pc-metric" data-v="metric">–</div>
      <ul class="pc-fb" data-v="fb"></ul>
      <div class="row"><button class="btn ghost" data-a="flip" type="button">สลับกล้อง</button><label class="btn ghost">ใช้วิดีโอที่ถ่ายไว้<input type="file" accept="video/*" data-a="file" hidden></label><button class="btn ghost" data-a="voice" type="button">เสียง: เปิด</button><button class="btn ghost" data-a="reset" type="button">เริ่มนับใหม่</button></div>
      <p class="small muted">วางมือถือห่าง 2–3 เมตร สูงระดับเอว ${rule.posture ? "ยืนตรงตามปกติ หันข้างให้กล้อง" : "หันข้างให้กล้องให้เห็นทั้งตัว"} · AI ช่วยดูมุมข้อต่อได้ แต่ไม่แทนโค้ชจริง</p>
    </div>`;
  document.body.appendChild(ov);
  document.body.style.overflow = "hidden";
  const video = ov.querySelector("video"), canvas = ov.querySelector("canvas"), ctx = canvas.getContext("2d");
  const $v = (k) => ov.querySelector(`[data-v="${k}"]`), msg = ov.querySelector(".pc-msg");

  let facing = "user", stream = null, raf = 0, closed = false, voice = true;
  let count = 0, phase = "rest", extreme = null, holdMs = 0, lastT = 0, lastSpeak = 0, lastSaid = "", lastRep = null, lastVideoTime = -1;

  function say(text, force) {
    if (!voice || !("speechSynthesis" in window)) return;
    const now = performance.now();
    if (!force && (now - lastSpeak < 3500 || text === lastSaid)) return;
    lastSpeak = now; lastSaid = text;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.lang = "th-TH"; u.rate = 1.05; speechSynthesis.speak(u);
  }

  async function startCam() {
    stream?.getTracks().forEach((t) => t.stop());
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
    } catch (e) {
      msg.textContent = "เปิดกล้องไม่ได้: กดอนุญาตการใช้กล้องในเบราว์เซอร์ หรือกด \"ใช้วิดีโอที่ถ่ายไว้\" ด้านล่าง"; msg.hidden = false; return false;
    }
    video.srcObject = stream; await video.play();
    ov.querySelector(".pc-stage").classList.toggle("mirror", facing === "user");
    return true;
  }

  function close() {
    if (closed) return; closed = true;
    cancelAnimationFrame(raf); stream?.getTracks().forEach((t) => t.stop());
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    ov.remove(); document.body.style.overflow = "";
    onDone?.(rule.hold ? Math.round(holdMs / 1000) : count);
  }

  ov.addEventListener("click", async (e) => {
    const a = e.target.closest("[data-a]")?.dataset.a;
    if (a === "close") close();
    if (a === "flip") { facing = facing === "user" ? "environment" : "user"; await startCam(); }
    if (a === "voice") { voice = !voice; e.target.textContent = "เสียง: " + (voice ? "เปิด" : "ปิด"); }
    if (a === "reset") { count = 0; holdMs = 0; phase = "rest"; extreme = null; $v("count").textContent = "0"; }
  });

  let lm = null, started = false;
  async function ensureModel() {
    if (lm) return true;
    msg.textContent = "กำลังโหลด AI ตรวจท่า (ครั้งแรกประมาณ 10 MB)…"; msg.hidden = false;
    try { lm = await getLandmarker(); } catch (e) { msg.textContent = "โหลด AI ไม่สำเร็จ ตรวจอินเทอร์เน็ตแล้วลองใหม่"; return false; }
    msg.hidden = true; return !closed;
  }
  function begin() { if (!started) { started = true; raf = requestAnimationFrame(loop); } }
  ov.querySelector('[data-a="file"]').addEventListener("change", async (e) => {
    const f = e.target.files[0]; if (!f) return;
    stream?.getTracks().forEach((t) => t.stop()); stream = null;
    video.srcObject = null; video.src = URL.createObjectURL(f); video.loop = true;
    ov.querySelector(".pc-stage").classList.remove("mirror");
    await video.play().catch(() => {});
    if (await ensureModel()) begin();
  });
  if (!(await startCam())) return;
  if (!(await ensureModel())) return;

  function loop(now) {
    if (closed) return;
    raf = requestAnimationFrame(loop);
    if (video.readyState < 2 || video.currentTime === lastVideoTime) return;
    lastVideoTime = video.currentTime;
    const w = video.videoWidth, h = video.videoHeight;
    if (canvas.width !== w) { canvas.width = w; canvas.height = h; }
    const res = lm.detectForVideo(video, now);
    ctx.clearRect(0, 0, w, h);
    const pose = res.landmarks?.[0];
    const dt = lastT ? now - lastT : 0; lastT = now;
    if (!pose) { render([{ bad: true, msg: "ไม่เห็นตัว ถอยออกให้เห็นทั้งตัว" }], null); return; }
    const j = pick(pose, w, h);
    draw(j);
    if (!seen(j, rule.need)) { render([{ bad: true, msg: "เห็นข้อต่อไม่ครบ หันข้างให้กล้องและถอยให้เห็นทั้งตัว" }], null); return; }
    const v = rule.metric(j);
    const fb = rule.live(j);
    if (rule.hold) {
      const good = fb.every((f) => !f.bad);
      if (good) holdMs += dt;
      $v("count").textContent = Math.floor(holdMs / 1000);
    } else if (!rule.posture) {
      if (phase === "rest" && rule.active(v)) { phase = "active"; extreme = v; }
      if (phase === "active") {
        extreme = rule.best === "min" ? Math.min(extreme, v) : Math.max(extreme, v);
        if (rule.reset(v)) {
          phase = "rest"; count++;
          const r = rule.rep(extreme);
          $v("count").textContent = count;
          say(r.bad ? `${count}. ${r.msg}` : String(count), true);
          ov.querySelector(".pc-big").classList.toggle("warn", !!r.bad);
          lastRep = r;
        }
      }
    }
    const list = lastRep ? [lastRep, ...fb] : fb;
    render(list, rule.posture ? null : `${rule.label} ${Math.round(v)}°`);
    const firstBad = fb.find((f) => f.bad); if (firstBad) say(firstBad.msg);
  }
  begin();

  function render(list, metric) {
    $v("metric").textContent = metric || (rule.posture ? "ยืนนิ่ง 3 วินาที" : "–");
    $v("fb").innerHTML = list.map((f) => `<li class="${f.bad ? "bad" : "ok"}">${f.bad ? "✗" : "✓"} ${f.msg}</li>`).join("");
  }
  function draw(j) {
    ctx.lineWidth = Math.max(3, canvas.width / 160); ctx.lineCap = "round";
    for (const [a, b] of LINKS) {
      if (j[a].v < 0.4 || j[b].v < 0.4) continue;
      ctx.strokeStyle = a.endsWith("2") ? "rgba(255,255,255,.45)" : "#7F9CFF";
      ctx.beginPath(); ctx.moveTo(j[a].x, j[a].y); ctx.lineTo(j[b].x, j[b].y); ctx.stroke();
    }
    ctx.fillStyle = "#4CC27E";
    for (const k of ["sh", "el", "wr", "hip", "kn", "an", "ear"]) if (j[k].v > 0.4) { ctx.beginPath(); ctx.arc(j[k].x, j[k].y, ctx.lineWidth * 1.3, 0, 7); ctx.fill(); }
  }
}
