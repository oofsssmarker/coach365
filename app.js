// Coach 365 — ข้อมูลทั้งหมดเก็บใน localStorage ของเครื่อง
(() => {
  const START = new Date(2026, 8, 28); // จันทร์ 28 ก.ย. 2569
  const DAY = 86400000;
  const START_WEIGHT = 100, GOAL_WEIGHT = 78, SAVE_GOAL = 100000, PASSIVE_GOAL_DAY = 300;
  const GOAL_END = new Date(2027, 8, 27);
  const STEPS = [5000, 7000, 9000, 10000, 11000, 12000, 12000, 12000, 12000, 12000, 12000, 12000];
  const KEY = "coach365";
  const CHECKS = [["if", "ปิดครัวตามเวลา (IF)"], ["protein", "โปรตีนถึง 140 ก."], ["workout", "ออกกำลังกายตามแผน"], ["posture", "จัดบุคลิก 10 นาที"], ["meditate", "นั่งสมาธิ เช้า + ก่อนนอน"], ["rest", "พักผ่อนครบ 3 ชม."], ["room", "เก็บห้อง 10 นาที"], ["sleep", "นอนก่อน 23:30"]];

  // rest: true = นับเป็นเวลาพักผ่อน (รวม 3 ชม./วัน)
  const REMINDERS = [
    { id: "wake", time: "07:00", days: "daily", msg: "ตื่น! ดื่มน้ำ 500 มล." },
    { id: "meditate", time: "07:05", days: "daily", msg: "นั่งสมาธิ 10 นาที (เปิดตัวจับเวลาในแอป)" },
    { id: "posture", time: "07:15", days: "daily", msg: "จัดบุคลิก 10 นาที (ท่าในแท็บเวท)" },
    { id: "train", time: "07:25", days: "weekday", msg: "ได้เวลาออกกำลังกาย 30 นาที เปิดแอปดูท่าวันนี้" },
    { id: "move", time: "10:00,11:00,14:00,15:00,16:30,17:00", days: "weekday", msg: "ลุกเดิน 3 นาที ยืดอก เก็บคาง" },
    { id: "meal1", time: "12:00", days: "daily", msg: "มื้อแรก: โปรตีนก่อน ถ่ายรูปบันทึกในแอป" },
    { id: "rest1", time: "12:30", days: "daily", msg: "พัก 30 นาที ออกจากจอ หลับตา/เดินเบาๆ", rest: 30 },
    { id: "snack", time: "16:00", days: "daily", msg: "มื้อว่างโปรตีน: ไข่ต้ม + นมถั่วเหลืองไม่หวาน" },
    { id: "meal2", time: "18:15", days: "daily", msg: "มื้อสุดท้าย แล้วปิดครัว" },
    { id: "walk", time: "18:45", days: "daily", msg: "เดิน 1 ชม. ให้ครบก้าววันนี้" },
    { id: "rest2", time: "20:00", days: "daily", msg: "เวลาพักผ่อนของตัวเอง 1 ชม. 45 นาที ไม่ทำงาน", rest: 105 },
    { id: "log", time: "22:00", days: "daily", msg: "ถึงบ้าน: บันทึกวันนี้ในแอป + เก็บห้อง 10 นาที" },
    { id: "rest3", time: "22:15", days: "daily", msg: "พักผ่อน 45 นาที อาบน้ำ ฟังเพลง อ่านหนังสือ", rest: 45 },
    { id: "meditate2", time: "23:00", days: "daily", msg: "สมาธิก่อนนอน 5 นาที + จด 3 บรรทัด แล้ววางมือถือ" },
    { id: "sleep", time: "23:15", days: "daily", msg: "ได้เวลานอน" },
    { id: "side", time: "09:00", days: "SA", msg: "งานเสริม 3 ชั่วโมง: หาลูกค้า / ทำงาน / พอร์ต" },
    { id: "weigh", time: "08:00", days: "SU", msg: "ชั่งน้ำหนัก วัดรอบเอว (ถ่ายรูปทุกต้นเดือน)" },
    { id: "prep", time: "14:00", days: "SU", msg: "Meal prep: อกไก่ + ไข่ต้มทั้งสัปดาห์" },
    { id: "money", time: "09:00", days: "M1", msg: "โอนเงินออม + ลงทุน แล้วบันทึกในแอป" },
  ];

  // ---------- state ----------
  const def = () => ({ logs: {}, money: [], passiveMonthly: 0, rem: Object.fromEntries(REMINDERS.map((r) => [r.id, true])), fired: {} });
  let S = def();
  try { const raw = localStorage.getItem(KEY); if (raw) S = Object.assign(def(), JSON.parse(raw)); } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast("บันทึกไม่ได้: พื้นที่เครื่องเต็มหรือถูกบล็อก"); } };

  // ---------- helpers ----------
  const $ = (id) => document.getElementById(id);
  const pad = (n) => String(n).padStart(2, "0");
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const idx = (d) => Math.round((d - START) / DAY);
  const fmt = (n, dp = 0) => (n == null || n === "" || isNaN(n) ? "–" : Number(n).toLocaleString("th-TH", { minimumFractionDigits: dp, maximumFractionDigits: dp }));
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  let toastT;
  function toast(msg) { const t = $("toast"); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 2200); }

  function plan(d) {
    const i = Math.max(0, idx(d));
    const month = Math.min(12, Math.floor(i / 30) + 1);
    const phase = month <= 3 ? 1 : month <= 6 ? 2 : month <= 9 ? 3 : 4;
    const wd = (d.getDay() + 6) % 7; // 0 = จันทร์
    const week = Math.floor(i / 7);
    let session = null, activity;
    if (phase === 1) {
      if ([0, 2, 4].includes(wd)) session = (week * 3 + [0, 2, 4].indexOf(wd)) % 2 === 0 ? "A" : "B";
    } else {
      session = { 0: "U1", 1: "L1", 3: "U2", 4: "L2" }[wd] || null;
    }
    if (session) activity = "เวท " + SESSIONS[session].name;
    else activity = wd === 6 ? "เดินยาว + Meal prep" : wd === 5 ? "เดินยาว 60–90 นาที" : "เดิน 20 นาที";
    return { day: i + 1, month, phase, session, activity, steps: STEPS[month - 1], window: month === 1 ? "12:00–22:00" : "12:00–20:00" };
  }

  // ---------- tabs ----------
  function show(tab) {
    document.querySelectorAll(".tabbar button").forEach((b) => b.setAttribute("aria-selected", b.dataset.tab === tab));
    document.querySelectorAll("[data-view]").forEach((v) => (v.hidden = v.dataset.view !== tab));
    if (tab === "today") { renderStats(); renderHero(); }
    if (tab === "food") window.Food?.render();
    if (tab === "train") renderTrain();
    if (tab === "money") renderMoney();
    if (tab === "settings") renderSettings();
    scrollTo(0, 0);
  }
  document.querySelectorAll(".tabbar button").forEach((b) => b.addEventListener("click", () => show(b.dataset.tab)));

  // ---------- header ----------
  function renderHeader() {
    const t = today(), p = plan(t), i = idx(t);
    $("dayLabel").textContent = i < 0 ? `อีก ${-i} วันเริ่ม` : `วันที่ ${Math.min(i + 1, 365)} / 365`;
    $("phaseLabel").textContent = `เฟส ${p.phase} · เดือน ${p.month}`;
    const last = lastWeight();
    const pct = last == null ? 0 : Math.max(0, Math.min(1, (START_WEIGHT - last) / (START_WEIGHT - GOAL_WEIGHT)));
    const C = 2 * Math.PI * 26;
    $("goalRing").innerHTML = `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" fill="none" stroke="var(--sunk)" stroke-width="7"/><circle cx="32" cy="32" r="26" fill="none" stroke="var(--good)" stroke-width="7" stroke-linecap="round" stroke-dasharray="${(C * pct).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 32 32)"/><text x="32" y="37" text-anchor="middle" font-size="14" font-family="IBM Plex Mono,monospace" fill="var(--ink)">${Math.round(pct * 100)}%</text></svg>`;
  }

  // ---------- today ----------
  $("checks").innerHTML = CHECKS.map(([k, l]) => `<label class="chk"><input type="checkbox" id="c-${k}"> ${l}</label>`).join("");
  $("logDate").value = iso(today());
  $("logDate").addEventListener("change", () => { $("saveStatus").textContent = ""; renderToday(); });

  const todayLog = () => (S.logs[iso(today())] = S.logs[iso(today())] || {});
  const hmNow = () => { const n = new Date(); return `${pad(n.getHours())}:${pad(n.getMinutes())}`; };
  const buzz = (p = 30) => { try { navigator.vibrate?.(p); } catch (e) {} };
  function celebrate(msg) { buzz([40, 60, 40]); toast(msg); const h = $("hero"); h.classList.add("pop"); setTimeout(() => h.classList.remove("pop"), 600); }

  // มื้อตามแผนของวันนี้ (จาก meals.js)
  function plannedMeal(slot) {
    const i = Math.max(0, idx(today())), wk = WEEKS[Math.floor(i / 7) % 2], row = wk[(today().getDay() + 6) % 7];
    return mealRef(row[slot]);
  }
  function addMeal(items, src, photoId = null) {
    const l = todayLog(); l.food = l.food || [];
    l.food.push({ time: hmNow(), photoId, items: items.map((x) => ({ th: x.th, kcal: Math.round(x.kcal), p: Math.round(x.p) })), src });
    afterMeal(l);
  }
  function afterMeal(l) {
    const p = l.food.reduce((a, m) => a + m.items.reduce((b, i) => b + i.p, 0), 0);
    l.protein = p >= TARGET.protein;
    const closeAt = plan(today()).window.split("–")[1];
    if (hmNow() > closeAt) { l.if = false; toast(`กินหลัง ${closeAt} แล้ว IF วันนี้ไม่ผ่าน พรุ่งนี้เอาใหม่`); }
    save(); refresh();
  }
  function closeKitchen() { const l = todayLog(); l.if = true; l.kitchenClosed = hmNow(); save(); celebrate("ปิดครัวแล้ว เจอกันพรุ่งนี้เที่ยง 🔒"); }

  // ---------- สิ่งที่ต้องทำต่อไป ----------
  function actions() {
    const l = todayLog(), p = plan(today()), wd = today().getDay(), meals = l.food?.length || 0, target = p.steps;
    const A = [];
    A.push({ t: "07:05", title: "นั่งสมาธิ 10 นาที", sub: "หายใจเข้า 4 ออก 6 แค่นั่งเฉยๆ", done: (l.meditateMin || 0) >= 10, btn: "เริ่มเลย", act: () => startMed(10) });
    A.push({ t: "07:15", title: "จัดบุคลิก 10 นาที", sub: "3 ท่า แก้คอยื่น ไหล่ห่อ", done: !!l.posture, btn: "▶ เริ่มเลย", act: () => startWorkout("P"), alt: "ทำแล้ว", altAct: () => setFlag("posture", "บุคลิกดีขึ้นทุกวัน 👍") });
    if (p.session) A.push({ t: "07:25", title: "เวท " + SESSIONS[p.session].name, sub: l.wStart?.[p.session] ? "ค้างไว้อยู่ กดเล่นต่อได้เลย" : "30 นาที 5 ท่า แอปจับเวลาพักและบอกน้ำหนักให้", done: !!l.workout, btn: l.wStart?.[p.session] ? "▶ เล่นต่อ" : "▶ เริ่มเลย", act: () => startWorkout(p.session), alt: "ดูท่าก่อน", altAct: () => { $("sessionPick").value = ""; show("train"); } });
    else A.push({ t: "07:25", title: p.activity, sub: "วันพักเวท เดินเบาๆ พอ", done: !!l.walkAm, btn: "เดินแล้ว", act: () => setFlag("walkAm", "เยี่ยม 🚶") });
    const meal = (t, slot, title, need) => {
      const m = plannedMeal(slot);
      A.push({ t, title, sub: `ตามแผน: ${m.th} (${m.kcal} kcal)`, done: meals >= need, btn: "กินตามแผน ✓", act: () => { addMeal([m], "ตามแผน"); celebrate(`บันทึก ${m.th} แล้ว`); }, alt: "ถ่ายรูป", altAct: () => { show("food"); $("photoIn").click(); } });
    };
    meal("12:00", 1, "มื้อแรก", 1);
    meal("16:00", 2, "มื้อว่างโปรตีน", 2);
    meal("18:15", 3, "มื้อสุดท้าย", 3);
    A.push({ t: "18:40", title: "ปิดครัว", sub: `ไม่กินอีกจนถึงพรุ่งนี้เที่ยง (IF ${p.window})`, done: !!l.if, btn: "ปิดครัวแล้ว 🔒", act: closeKitchen });
    A.push({ t: "18:45", title: `เดินให้ครบ ${fmt(target)} ก้าว`, sub: "ลงรถก่อน 1–2 ป้าย หรือเดินรอบย่าน", done: (l.steps || 0) >= target, btn: "ครบแล้ว", act: () => setSteps(target, `${fmt(target)} ก้าว เก่งมาก 🔥`), alt: "ใส่ตัวเลข", altAct: () => $("qSteps").scrollIntoView({ behavior: "smooth", block: "center" }) });
    A.push({ t: "22:00", title: "เก็บห้อง 10 นาที", sub: "ผ้าแห้งพับเก็บ ของวางที่เดิม", done: !!l.room, btn: "เก็บแล้ว", act: () => setFlag("room", "ห้องสะอาด สมองโล่ง ✨") });
    if (wd === 0 || l.weight == null) A.push({ t: wd === 0 ? "08:00" : "22:05", title: wd === 0 ? "ชั่งน้ำหนัก + วัดรอบเอว" : "ชั่งน้ำหนัก", sub: "ตอนเช้าก่อนกินแม่นสุด แต่ตอนไหนก็ได้ดีกว่าไม่ชั่ง", done: l.weight != null, btn: "ใส่ตัวเลข", act: () => $("qWeight").scrollIntoView({ behavior: "smooth", block: "center" }) });
    A.push({ t: "23:00", title: "สมาธิก่อนนอน 5 นาที", sub: "แล้ววางมือถือไกลเตียง", done: (l.meditateMin || 0) >= 15, btn: "เริ่มเลย", act: () => startMed(5) });
    A.push({ t: "23:15", title: "นอน", sub: "7.5 ชั่วโมง คือยาลดน้ำหนักที่ดีที่สุด", done: !!l.sleep, btn: "นอนแล้ว 😴", act: () => setFlag("sleep", "ฝันดี พรุ่งนี้เจอกัน") });
    return A;
  }
  let heroActs = [];
  function renderHero() {
    const A = actions(), now = hmNow(), i = idx(today());
    const done = A.filter((a) => a.done).length;
    $("scoreText").textContent = `${done} / ${A.length}`;
    let a = A.find((x) => !x.done && x.t <= now) || A.find((x) => !x.done);
    heroActs = a ? [a.act, a.altAct] : [];
    const h = $("hero");
    if (i < 0) {
      const w = todayLog().weight;
      h.innerHTML = w == null
        ? `<div class="eyebrow">เริ่มวันจันทร์ 28 ก.ย.</div><h2>พรุ่งนี้วันแรก</h2><p>คืนนี้ทำแค่ 2 อย่าง: ชั่งน้ำหนักตั้งต้น และตั้งปลุก 07:00</p><div class="row"><button class="btn" type="button" data-hero="0">ใส่น้ำหนักตั้งต้น</button></div>`
        : `<div class="eyebrow">เริ่มวันจันทร์ 28 ก.ย.</div><h2>พร้อมแล้ว ✓ ${w.toFixed(1)} กก.</h2><p>ตั้งปลุก 07:00 แล้วนอนก่อน 23:15 พรุ่งนี้เปิดแอปแล้วทำตามการ์ดนี้ทีละอย่าง</p><div class="row"><button class="btn ghost" type="button" data-hero="0">ตั้งค่าแจ้งเตือน</button></div>`;
      heroActs = [w == null ? () => $("qWeight").scrollIntoView({ behavior: "smooth", block: "center" }) : () => show("settings")];
      return;
    }
    if (!a) { h.innerHTML = `<div class="eyebrow">วันที่ ${i + 1}</div><h2>วันนี้ครบทุกอย่างแล้ว 🎉</h2><p>ไม่ต้องทำอะไรเพิ่ม ไปพักได้เลย</p>`; return; }
    const late = a.t <= now, upcoming = !late;
    h.innerHTML = `<div class="eyebrow">${upcoming ? `ต่อไป ${a.t}` : `ตอนนี้ · ${a.t}`} · เหลืออีก ${A.length - done} อย่าง</div><h2>${a.title}</h2><p>${a.sub}</p>
      <div class="row"><button class="btn" type="button" data-hero="0">${a.btn}</button>${a.alt ? `<button class="btn ghost" type="button" data-hero="1">${a.alt}</button>` : ""}</div>`;
  }
  $("hero").addEventListener("click", (e) => { const b = e.target.closest("[data-hero]"); if (b) heroActs[b.dataset.hero]?.(); });

  function setFlag(k, msg) { todayLog()[k] = true; save(); celebrate(msg); refresh(); }
  function setSteps(n, msg) { todayLog().steps = n; save(); if (msg) celebrate(msg); refresh(); }

  // ---------- ชิปเช็กลิสต์ (แตะเพื่อสลับ) ----------
  const CHIP = { if: "ปิดครัว", protein: "โปรตีนครบ", workout: "ออกกำลังกาย", posture: "บุคลิก", meditate: "สมาธิ", rest: "พัก 3 ชม.", room: "เก็บห้อง", sleep: "นอนตรงเวลา" };
  function renderChips() {
    const l = todayLog();
    $("chips").innerHTML = Object.entries(CHIP).map(([k, t]) => `<button type="button" class="chip ${l[k] ? "on" : ""}" data-chip="${k}" aria-pressed="${!!l[k]}">${l[k] ? "✓ " : ""}${t}</button>`).join("");
  }
  $("chips").addEventListener("click", (e) => {
    const k = e.target.closest("[data-chip]")?.dataset.chip; if (!k) return;
    const l = todayLog(); l[k] = !l[k]; if (k === "meditate" && l[k] && !(l.meditateMin >= 15)) l.meditateMin = 15;
    save(); buzz(); refresh();
  });

  // ---------- ใส่น้ำหนัก / ก้าว แบบเร็ว ----------
  let qw = null;
  function renderQuick() {
    const l = todayLog();
    qw = l.weight ?? lastWeight() ?? START_WEIGHT;
    $("qWeight").textContent = qw.toFixed(1);
    $("qWeightOk").textContent = l.weight != null ? "บันทึกแล้ว ✓" : "ใช้เลขนี้";
    $("qWeightOk").classList.toggle("ghost", l.weight != null);
    const p = plan(today()), cur = l.steps || 0;
    $("qStepsNow").textContent = cur ? `· ${fmt(cur)} / ${fmt(p.steps)}` : `· เป้า ${fmt(p.steps)}`;
    const opts = [...new Set([3000, 5000, 7000, p.steps, 12000])].sort((a, b) => a - b);
    $("qSteps").innerHTML = opts.map((n) => `<button type="button" class="chip ${cur === n ? "on" : ""}" data-steps="${n}">${n === p.steps ? "ครบเป้า " : ""}${fmt(n)}</button>`).join("") + `<button type="button" class="chip" data-steps="custom">อื่นๆ…</button>`;
  }
  document.querySelector(".quick").addEventListener("click", (e) => {
    const w = e.target.closest("[data-w]")?.dataset.w;
    if (w) { qw = Math.round((qw + Number(w)) * 10) / 10; $("qWeight").textContent = qw.toFixed(1); buzz(10); return; }
    if (e.target.id === "qWeightOk") { const l = todayLog(); l.weight = qw; save(); celebrate(l.weight < START_WEIGHT ? `บันทึก ${qw.toFixed(1)} กก. ลดไป ${(START_WEIGHT - qw).toFixed(1)} แล้ว` : `บันทึก ${qw.toFixed(1)} กก.`); refresh(); return; }
    const s = e.target.closest("[data-steps]")?.dataset.steps; if (!s) return;
    if (s === "custom") { $("f-steps").scrollIntoView({ behavior: "smooth", block: "center" }); $("f-steps").focus(); return; }
    setSteps(Number(s), Number(s) >= plan(today()).steps ? "ครบเป้าวันนี้ 🔥" : null);
  });

  function refresh() { renderHeader(); renderHero(); renderChips(); renderQuick(); renderMedToday(); if ($("logDate").value === iso(today())) renderToday(); if (!document.querySelector('[data-view="food"]').hidden) window.Food?.render(); }

  function renderToday() {
    const d = parse($("logDate").value), p = plan(d);
    $("targets").innerHTML = [
      ["ก้าวเดิน", fmt(p.steps)], ["หน้าต่างกิน", p.window], ["ออกกำลังกาย", p.activity], ["แคลอรี่ / โปรตีน", `${fmt(TARGET.kcal)} / ${TARGET.protein} ก.`],
    ].map(([a, b]) => `<div class="tgt"><span class="eyebrow">${a}</span><b>${b}</b></div>`).join("");
    const e = S.logs[iso(d)] || {};
    ["weight", "waist", "steps", "spend"].forEach((k) => ($("f-" + k).value = e[k] ?? ""));
    $("f-note").value = e.note || "";
    CHECKS.forEach(([k]) => ($("c-" + k).checked = !!e[k]));
  }
  // ---------- ตารางวันนี้ ----------
  function renderSchedule() {
    const now = new Date(), d = today(), hm = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const items = [];
    REMINDERS.forEach((r) => { if (dueToday(r, d)) r.time.split(",").forEach((t, i) => { if (r.id !== "move" || i === 0) items.push({ t, msg: r.id === "move" ? "ลุกเดิน 3 นาทีทุกชั่วโมง (10:00–17:00)" : r.msg, rest: r.rest }); }); });
    if (d.getDay() >= 1 && d.getDay() <= 5) items.push({ t: "09:00", msg: "ทำงาน (ถึง 18:00)" });
    items.sort((a, b) => (a.t < b.t ? -1 : 1));
    let cur = -1; items.forEach((it, i) => { if (it.t <= hm) cur = i; });
    const rest = items.reduce((a, i) => a + (i.rest || 0), 0);
    $("restTotal").textContent = `· พักผ่อนรวม ${Math.floor(rest / 60)} ชม.${rest % 60 ? " " + (rest % 60) + " นาที" : ""}`;
    $("schedule").innerHTML = items.map((it, i) => `<div class="srow ${i === cur ? "now" : ""} ${it.rest ? "rest" : ""}"><span class="num">${it.t}</span><span>${it.msg}${it.rest ? ` <span class="pill">พัก ${it.rest} นาที</span>` : ""}</span></div>`).join("");
  }

  // ---------- สมาธิ ----------
  let med = null;
  function medBell(freq = 528) {
    try {
      const ac = (medBell.ac ||= new (window.AudioContext || window.webkitAudioContext)());
      const o = ac.createOscillator(), g = ac.createGain();
      o.frequency.value = freq; o.type = "sine"; o.connect(g); g.connect(ac.destination);
      g.gain.setValueAtTime(0.0001, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.3, ac.currentTime + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 3.5);
      o.start(); o.stop(ac.currentTime + 3.6);
    } catch (e) {}
  }
  function renderMedToday() { const m = S.logs[iso(today())]?.meditateMin || 0; $("medToday").textContent = `วันนี้ ${m} นาที`; }
  async function startMed(min) {
    stopMed(false);
    const end = Date.now() + min * 60000;
    let lock = null; try { lock = await navigator.wakeLock?.request("screen"); } catch (e) {}
    med = { min, end, lock, timer: setInterval(tickMed, 250) };
    $("breath").classList.add("on"); $("medStop").hidden = false;
    $("medCard").scrollIntoView({ behavior: "smooth", block: "center" });
    document.querySelectorAll("[data-med]").forEach((b) => (b.hidden = true));
    medBell(); tickMed();
  }
  function tickMed() {
    if (!med) return;
    const left = med.end - Date.now();
    if (left <= 0) { stopMed(true); return; }
    const phase = ((med.min * 60000 - left) % 10000) < 4000 ? "หายใจเข้า…" : "หายใจออก…";
    $("medLabel").textContent = `${phase}  ${Math.floor(left / 60000)}:${pad(Math.floor((left % 60000) / 1000))}`;
  }
  function stopMed(done) {
    if (!med) return;
    clearInterval(med.timer); med.lock?.release?.().catch(() => {});
    const used = done ? med.min : Math.floor((med.min * 60000 - (med.end - Date.now())) / 60000);
    med = null;
    $("breath").classList.remove("on"); $("medStop").hidden = true;
    document.querySelectorAll("[data-med]").forEach((b) => (b.hidden = false));
    $("medLabel").textContent = "หายใจเข้า 4 วินาที · ออก 6 วินาที · นับลมหายใจ 1 ถึง 10 แล้วเริ่มใหม่";
    if (used > 0) {
      const k = iso(today()), l = (S.logs[k] = S.logs[k] || {});
      l.meditateMin = (l.meditateMin || 0) + used;
      if (l.meditateMin >= 15) l.meditate = true;
      save(); refresh();
    }
    if (done) { medBell(); medBell(396); celebrate(`ครบ ${used} นาที ใจนิ่งขึ้นแล้ว 🧘`); }
  }
  $("medBtns").addEventListener("click", (e) => { const m = e.target.dataset.med; if (m) startMed(Number(m)); });
  $("medStop").addEventListener("click", () => stopMed(false));

  const num = (id) => { const v = $(id).value; return v === "" ? null : Number(v); };
  function saveForm(quiet) {
    const k = $("logDate").value, prev = S.logs[k] || {};
    const e = Object.assign({}, prev, { weight: num("f-weight"), waist: num("f-waist"), steps: num("f-steps"), spend: num("f-spend"), note: $("f-note").value.trim() });
    S.logs[k] = e; save(); renderHeader(); renderStats();
    if (k === iso(today())) { renderHero(); renderChips(); renderQuick(); }
    $("saveStatus").textContent = "บันทึกแล้ว " + new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
    if (!quiet) toast("บันทึกแล้ว");
  }
  let formT;
  $("logForm").addEventListener("input", () => { clearTimeout(formT); formT = setTimeout(() => saveForm(true), 600); });
  $("logForm").addEventListener("submit", (ev) => { ev.preventDefault(); clearTimeout(formT); saveForm(false); });

  // ---------- train ----------
  const sessionOpts = Object.entries(SESSIONS).map(([k, s]) => `<option value="${k}">${s.name}</option>`).join("");
  $("sessionPick").innerHTML = `<option value="">ตามแผนวันนี้</option>` + sessionOpts;
  $("sessionPick").addEventListener("change", renderTrain);

  function lastLift(exId, beforeDate) {
    const keys = Object.keys(S.logs).filter((k) => k < beforeDate).sort().reverse();
    for (const k of keys) { const l = S.logs[k].lifts?.[exId]; if (l && (l.w || l.r)) return { date: k, ...l }; }
    return null;
  }
  const eqName = { bb: "บาร์เบล", db: "ดัมเบล", none: "ตัวเปล่า" };

  function exCard(id, sets, withLog) {
    const ex = EXERCISES[id], dk = iso(today());
    const cur = S.logs[dk]?.lifts?.[id] || {};
    const last = withLog ? lastLift(id, dk) : null;
    const yt = "https://www.youtube.com/results?search_query=" + encodeURIComponent(ex.name + " proper form");
    return `<article class="ex ${cur.done ? "done" : ""}" data-id="${id}">
      ${Figures.html(id)}
      <div>
        <h3>${ex.th}<span class="eqtag">${eqName[ex.eq]}</span></h3>
        <div class="small muted">${ex.name} · ${ex.muscles}</div>
        ${sets ? `<div class="sets">${sets}</div>` : ""}
        ${withLog ? `<div class="last">${last ? `ครั้งก่อน (${last.date.slice(5)}): ${last.w ?? "–"} กก. × ${last.r ?? "–"}` : "ยังไม่มีสถิติ เริ่มเบาๆ เน้นท่าถูก"}</div>
        <div class="setsum">${cur.sets?.length ? cur.sets.map((s) => `<span class="pill ${s.done ? "ok" : ""}">${s.done ? "✓ " : ""}${s.w ?? "–"}×${s.r ?? "–"}</span>`).join("") : `<span class="small muted">วันนี้ยังไม่ได้เล่น</span>`}</div>` : ""}
        ${ex.check ? `<button class="btn ghost small checkbtn" type="button" data-check="${id}">🎥 ตรวจท่าด้วยกล้อง</button>` : ""}
      </div>
      <details><summary>วิธีทำ</summary><ol>${ex.cues.map((c) => `<li>${c}</li>`).join("")}</ol>
        <div class="small"><b>ระวัง:</b> ${ex.mistake}</div>
        <div class="small"><a href="${yt}" target="_blank" rel="noopener">ดูวิดีโอตัวอย่างบน YouTube ↗</a></div></details>
    </article>`;
  }

  function renderTrain() {
    const p = plan(today());
    const pick = $("sessionPick").value || p.session;
    if (!pick) {
      $("sessionTitle").textContent = "วันนี้พักเวท";
      $("sessionNote").textContent = `${p.activity} · เลือกโปรแกรมด้านบนถ้าอยากเล่นชดเชย`;
      $("exList").innerHTML = "";
    } else {
      const s = SESSIONS[pick];
      $("sessionTitle").textContent = s.name;
      const phaseNote = { 1: "เฟส 1: เน้นท่าถูก พัก 60–90 วิ", 2: "เฟส 2: Upper/Lower 4 วัน พัก 90 วิ", 3: "เฟส 3: +1 เซ็ตทุกท่า + HIIT 10 นาที 2 ครั้ง/สัปดาห์", 4: "เฟส 4: ขัดเกลา สัปดาห์ที่ 7 ของทุกรอบลดน้ำหนักลง 40%" }[p.phase];
      $("sessionNote").textContent = `${phaseNote} · ทำครบจำนวนครั้งสูงสุดทุกเซ็ต ครั้งหน้าเพิ่ม 1–2.5 กก.`;
      $("exList").innerHTML = s.items.map(([id, sets]) => exCard(id, sets, true)).join("");
    }
    $("finishCard").hidden = !pick;
    $("startBtn").hidden = !pick;
    const l = todayLog(), inProgress = !!l.wStart?.[pick];
    $("startBtn").textContent = (pick === "P" ? l.posture : l.workout) ? "▶ เล่นอีกรอบ" : inProgress ? "▶ เล่นต่อ (ค้างไว้)" : "▶ เริ่มเวิร์กเอาต์";
    $("finishBtn").textContent = pick === "P" ? "✅ จัดบุคลิกไปแล้ว บันทึกว่าเสร็จ" : "✅ เล่นไปแล้วโดยไม่ได้เปิดแอป บันทึกว่าเสร็จ";
    renderWkHistory();
    if (!$("library").innerHTML) $("library").innerHTML = Object.keys(EXERCISES).map((id) => exCard(id, "", false)).join("");
    Figures.start();
  }
  async function poseCheck(kind, title, card) {
    try {
      const { openPoseCheck } = await import("./posecheck.js");
      openPoseCheck({ kind, title, onDone: (n) => {
        if (!card || !n) return;
        const r = card.querySelector('[data-f="r"]');
        if (r) { r.value = n; r.dispatchEvent(new Event("change", { bubbles: true })); toast(`บันทึก ${n} ครั้งแล้ว`); }
      } });
    } catch (e) { toast("เปิดระบบตรวจท่าไม่ได้ ตรวจอินเทอร์เน็ต"); }
  }
  document.querySelector('[data-view="train"]').addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-check]"); if (!b) return;
    const ex = EXERCISES[b.dataset.check];
    poseCheck(ex.check, ex.th, b.closest("#exList .ex"));
  });
  $("postureBtn").addEventListener("click", () => poseCheck("posture", "ตรวจบุคลิกท่ายืน", null));

  async function startWorkout(key) {
    try {
      const { openWorkout } = await import("./workout.js");
      openWorkout({ sessionKey: key, phase: plan(today()).phase, onFinish: (done) => { renderTrain(); refresh(); if (done) setTimeout(() => show("today"), 400); } });
    } catch (e) { toast("เปิดโหมดเล่นเวทไม่ได้ ตรวจอินเทอร์เน็ตแล้วลองใหม่"); }
  }
  $("startBtn").addEventListener("click", () => startWorkout($("sessionPick").value || plan(today()).session));
  function renderWkHistory() {
    const rows = Object.keys(S.logs).sort().reverse().flatMap((k) => (S.logs[k].workouts || []).map((w) => ({ date: k, ...w }))).slice(0, 8);
    const box = $("wkHistory"); box.hidden = !rows.length;
    if (!rows.length) return;
    const fmtT = (s) => `${Math.floor(s / 60)} นาที`;
    box.innerHTML = `<h2>เวิร์กเอาต์ล่าสุด</h2><div class="tbl"><table><tbody>${rows.map((w) => `<tr><td class="num">${w.date.slice(5)}</td><td>${SESSIONS[w.session]?.name || w.session}</td><td class="num">${fmtT(w.dur)}</td><td class="num">${w.sets} เซ็ต</td><td class="num">${fmt(w.vol)} กก.</td><td>${w.prs?.length ? "🏆" + w.prs.length : ""}</td></tr>`).join("")}</tbody></table></div>`;
  }
  $("barKg").value = S.barKg ?? "";
  $("barKg").addEventListener("change", () => { S.barKg = Number($("barKg").value) || 10; save(); toast("บันทึกน้ำหนักบาร์แล้ว"); });
  // ปุ่มเดียวจบเซสชัน: ติ๊กทุกท่า ใช้น้ำหนัก/ครั้งจากครั้งก่อนถ้าไม่ได้กรอก
  $("finishBtn").addEventListener("click", () => {
    const pick = $("sessionPick").value || plan(today()).session; if (!pick) return;
    const dk = iso(today()), l = todayLog(), lifts = (l.lifts = l.lifts || {});
    SESSIONS[pick].items.forEach(([id]) => {
      const cur = (lifts[id] = lifts[id] || {}), prev = lastLift(id, dk);
      if (cur.w == null && prev?.w != null) cur.w = prev.w;
      if (cur.r == null && prev?.r != null) cur.r = prev.r;
      cur.done = true;
      if (!cur.sets?.length) cur.sets = [{ w: cur.w ?? null, r: cur.r ?? null, done: true }]; else cur.sets.forEach((s) => (s.done = true));
    });
    if (pick === "P") l.posture = true; else l.workout = true;
    save(); renderTrain(); refresh();
    celebrate(pick === "P" ? "บุคลิกดีขึ้นทุกวัน 👍" : "จบเซสชันแล้ว เก่งมาก 💪");
    setTimeout(() => show("today"), 900);
  });

  $("exList").addEventListener("change", (ev) => {
    const card = ev.target.closest(".ex"); if (!card) return;
    const dk = iso(today()), id = card.dataset.id;
    const log = (S.logs[dk] = S.logs[dk] || {});
    const lifts = (log.lifts = log.lifts || {});
    const l = (lifts[id] = lifts[id] || {});
    const f = ev.target.dataset.f;
    if (f === "done") l.done = ev.target.checked; else l[f] = ev.target.value === "" ? null : Number(ev.target.value);
    card.classList.toggle("done", !!l.done);
    const items = SESSIONS[$("sessionPick").value || plan(today()).session]?.items || [];
    if (items.length && items.every(([x]) => lifts[x]?.done)) { log.workout = true; celebrate("จบเซสชันแล้ว เก่งมาก 💪"); }
    save(); renderHero(); renderChips();
  });

  // ---------- money ----------
  $("m-date").value = iso(today());
  $("passiveMonthly").value = S.passiveMonthly || "";
  $("passiveMonthly").addEventListener("change", () => { S.passiveMonthly = Number($("passiveMonthly").value) || 0; save(); renderMoney(); });
  $("moneyForm").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const amt = Number($("m-amount").value); if (!amt) return;
    S.money.push({ id: Date.now().toString(36), date: $("m-date").value, type: $("m-type").value, amount: Math.abs(amt), note: $("m-note").value.trim() });
    save(); $("m-amount").value = ""; $("m-note").value = ""; renderMoney(); toast("เพิ่มรายการแล้ว");
  });
  $("moneyList").addEventListener("click", (ev) => {
    const b = ev.target.closest("button[data-del]"); if (!b) return;
    if (b.dataset.armed) { S.money = S.money.filter((m) => m.id !== b.dataset.del); save(); renderMoney(); }
    else { b.dataset.armed = "1"; b.textContent = "ยืนยันลบ"; }
  });
  const TYPE = { save: "ออม", invest: "ลงทุน", side: "งานเสริม", passive: "passive", withdraw: "ถอน" };

  function renderMoney() {
    const total = S.money.reduce((a, m) => a + (m.type === "withdraw" ? -m.amount : m.amount), 0);
    const pct = Math.max(0, Math.min(1, total / SAVE_GOAL));
    $("saveBar").style.width = (pct * 100).toFixed(1) + "%";
    const t = today();
    const monthsLeft = Math.max(1, (GOAL_END.getFullYear() - t.getFullYear()) * 12 + GOAL_END.getMonth() - t.getMonth());
    const need = Math.max(0, SAVE_GOAL - total) / monthsLeft;
    const ym = iso(t).slice(0, 7);
    const sideThis = S.money.filter((m) => m.type === "side" && m.date.startsWith(ym)).reduce((a, m) => a + m.amount, 0);
    const p = plan(t);
    const sideTarget = p.month <= 3 ? 2000 : p.month <= 6 ? 5000 : 8000;
    $("moneyStats").innerHTML =
      `<div class="stat ${pct >= Math.max(0, idx(t)) / 365 ? "good" : "warn"}"><span class="eyebrow">เก็บแล้ว</span><b>${fmt(total)}</b><span class="small muted">${(pct * 100).toFixed(0)}% ของ 100,000</span></div>` +
      `<div class="stat"><span class="eyebrow">ต้องเก็บต่อเดือน</span><b>${fmt(need)}</b><span class="small muted">อีก ${monthsLeft} เดือน</span></div>` +
      `<div class="stat ${sideThis >= sideTarget ? "good" : sideThis >= sideTarget / 2 ? "warn" : "bad"}"><span class="eyebrow">งานเสริมเดือนนี้</span><b>${fmt(sideThis)}</b><span class="small muted">เป้าเดือนนี้ ${fmt(sideTarget)}</span></div>`;
    const perDay = (S.passiveMonthly || 0) / 30;
    $("passiveStats").innerHTML =
      `<div class="stat ${perDay >= PASSIVE_GOAL_DAY ? "good" : perDay >= 100 ? "warn" : ""}"><span class="eyebrow">ต่อวัน</span><b>${fmt(perDay)}</b><span class="small muted">เป้า 300/วัน = 9,000/เดือน</span></div>` +
      `<div class="stat"><span class="eyebrow">ถึงเป้าแล้ว</span><b>${Math.min(100, (perDay / PASSIVE_GOAL_DAY) * 100).toFixed(0)}%</b></div>`;
    const rows = [...S.money].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 30);
    $("moneyList").innerHTML = rows.length ? rows.map((m) => `<tr><td class="num">${m.date.slice(5)}</td><td>${TYPE[m.type]}</td><td class="small muted">${esc(m.note)}</td><td class="num ${m.type === "withdraw" ? "no" : "ok"}">${m.type === "withdraw" ? "−" : "+"}${fmt(m.amount)}</td><td><button class="btn ghost small" style="padding:2px 8px" data-del="${m.id}">ลบ</button></td></tr>`).join("") : `<tr><td class="muted">ยังไม่มีรายการ เริ่มจากเงินออมเดือนนี้</td></tr>`;
  }

  // ---------- stats ----------
  const entries = () => Object.keys(S.logs).sort().map((k) => ({ date: k, ...S.logs[k] }));
  function lastWeight() { const w = entries().filter((e) => e.weight != null); return w.length ? w[w.length - 1].weight : null; }

  function renderStats() {
    const es = entries(), ws = es.filter((e) => e.weight != null), t = today();
    const W = 640, H = 260, L = 44, R = 16, T = 14, B = 34, y0 = 74, y1 = 102;
    const x = (i) => L + ((W - L - R) * i) / 365, y = (v) => T + ((H - T - B) * (y1 - v)) / (y1 - y0);
    let s = "";
    for (let v = 76; v <= 100; v += 4) s += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="var(--muted)" font-family="IBM Plex Mono,monospace">${v}</text>`;
    for (let m = 0; m <= 12; m += 3) s += `<text x="${x((m * 365) / 12)}" y="${H - 12}" text-anchor="middle" font-size="11" fill="var(--muted)">${m ? "เดือน " + m : "เริ่ม"}</text>`;
    s += `<line x1="${x(0)}" y1="${y(START_WEIGHT)}" x2="${x(365)}" y2="${y(GOAL_WEIGHT)}" stroke="var(--target)" stroke-width="2" stroke-dasharray="6 5"/>`;
    const pts = [[0, START_WEIGHT], ...ws.map((e) => [Math.max(0, Math.min(365, idx(parse(e.date)))), Math.max(y0, Math.min(y1, e.weight))])];
    if (pts.length > 1) s += `<path d="${pts.map((p, i) => (i ? "L" : "M") + x(p[0]).toFixed(1) + " " + y(p[1]).toFixed(1)).join(" ")}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round"/>`;
    const lp = pts[pts.length - 1];
    s += `<circle cx="${x(lp[0])}" cy="${y(lp[1])}" r="5" fill="var(--accent)" stroke="var(--surface)" stroke-width="2"/>`;
    $("chart").innerHTML = s;

    const last = lastWeight(), tgtNow = START_WEIGHT - (START_WEIGHT - GOAL_WEIGHT) * Math.min(1, Math.max(0, idx(t)) / 365);
    const wk = es.filter((e) => (t - parse(e.date)) / DAY < 7 && e.steps != null);
    const avg = wk.length ? wk.reduce((a, e) => a + e.steps, 0) / wk.length : null;
    let streak = 0, d = new Date(t); if (!S.logs[iso(d)]) d = new Date(d - DAY);
    while (S.logs[iso(d)] && (S.logs[iso(d)].if || S.logs[iso(d)].workout)) { streak++; d = new Date(d - DAY); }
    const pt = plan(t).steps;
    $("bodyStats").innerHTML =
      `<div class="stat ${last == null ? "" : last <= tgtNow + 0.5 ? "good" : last <= tgtNow + 2 ? "warn" : "bad"}"><span class="eyebrow">ล่าสุด</span><b>${fmt(last, 1)}</b><span class="small muted">เป้าตอนนี้ ${fmt(tgtNow, 1)}</span></div>` +
      `<div class="stat ${last != null && last < START_WEIGHT ? "good" : ""}"><span class="eyebrow">ลดไปแล้ว</span><b>${last == null ? "–" : fmt(START_WEIGHT - last, 1)}</b><span class="small muted">กก.</span></div>` +
      `<div class="stat ${avg == null ? "" : avg >= pt ? "good" : avg >= pt * 0.8 ? "warn" : "bad"}"><span class="eyebrow">ก้าวเฉลี่ย 7 วัน</span><b>${fmt(avg)}</b><span class="small muted">เป้า ${fmt(pt)}</span></div>` +
      `<div class="stat ${streak >= 3 ? "good" : ""}"><span class="eyebrow">ต่อเนื่อง</span><b>${streak} วัน</b><span class="small muted">ห้ามพลาด 2 วันติด</span></div>`;
    const ck = (v) => `<span class="pill ${v ? "ok" : "no"}">${v ? "✓" : "✗"}</span>`;
    const kcal = (e) => (e.food?.length ? e.food.reduce((a, m) => a + m.items.reduce((b, i) => b + i.kcal, 0), 0) : null);
    $("history").innerHTML = es.slice(-30).reverse().map((e) => `<tr><td class="num">${e.date.slice(5)}</td><td class="num">${fmt(e.weight, 1)}</td><td class="num">${fmt(e.waist, 1)}</td><td class="num">${fmt(e.steps)}</td><td class="num">${fmt(kcal(e))}</td><td>${ck(e.if)}</td><td>${ck(e.protein)}</td><td>${ck(e.workout)}</td></tr>`).join("") || `<tr><td colspan="8" class="muted">ยังไม่มีบันทึก</td></tr>`;
  }

  // ---------- reminders ----------
  const dayText = { daily: "ทุกวัน", weekday: "จ–ศ", SA: "เสาร์", SU: "อาทิตย์", M1: "วันที่ 1 ทุกเดือน" };
  function notifSupported() { return "Notification" in window && "serviceWorker" in navigator; }
  function renderSettings() {
    const st = !notifSupported() ? "เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน (iPhone ต้องติดตั้งลงหน้าจอโฮมก่อน)" :
      Notification.permission === "granted" ? "เปิดแล้ว: แอปจะเตือนตามเวลาขณะที่แอปยังเปิดค้างหรืออยู่เบื้องหลัง" :
      Notification.permission === "denied" ? "ถูกบล็อกไว้ ไปเปิดในการตั้งค่าเว็บไซต์ของเบราว์เซอร์" : "ยังไม่ได้เปิด";
    $("notifState").textContent = st;
    $("enableNotif").hidden = !notifSupported() || Notification.permission === "granted";
    $("reminderList").innerHTML = REMINDERS.map((r) => `<label class="rem"><span class="t">${r.time.split(",")[0]}${r.time.includes(",") ? "+" : ""}</span><span class="m">${r.msg}<br><span class="small muted">${dayText[r.days]}${r.time.includes(",") ? " · " + r.time.replace(/,/g, ", ") : ""}</span></span><input type="checkbox" data-rem="${r.id}" ${S.rem[r.id] !== false ? "checked" : ""}></label>`).join("");
  }
  $("reminderList").addEventListener("change", (ev) => { const id = ev.target.dataset.rem; if (id) { S.rem[id] = ev.target.checked; save(); } });
  $("enableNotif").addEventListener("click", async () => { const p = await Notification.requestPermission(); renderSettings(); if (p === "granted") notify("เปิดแจ้งเตือนแล้ว", "Coach 365 จะเตือนตามตาราง"); });
  $("testNotif").addEventListener("click", () => notifSupported() && Notification.permission === "granted" ? notify("ทดสอบแจ้งเตือน", "ถ้าเห็นข้อความนี้ แสดงว่าใช้ได้") : toast("ยังไม่ได้เปิดการแจ้งเตือน"));

  async function notify(title, body) {
    try { const reg = await navigator.serviceWorker.ready; reg.showNotification(title, { body, icon: "icons/icon-192.png", badge: "icons/icon-192.png", tag: title }); }
    catch (e) { try { new Notification(title, { body }); } catch (e2) {} }
  }
  function dueToday(r, d) {
    const wd = d.getDay();
    return r.days === "daily" || (r.days === "weekday" && wd >= 1 && wd <= 5) || (r.days === "SA" && wd === 6) || (r.days === "SU" && wd === 0) || (r.days === "M1" && d.getDate() === 1);
  }
  function tick() {
    if (!notifSupported() || Notification.permission !== "granted") return;
    const now = new Date(), hm = `${pad(now.getHours())}:${pad(now.getMinutes())}`, dk = iso(now);
    REMINDERS.forEach((r) => {
      if (S.rem[r.id] === false || !dueToday(r, now)) return;
      r.time.split(",").forEach((t) => {
        const key = r.id + "@" + t;
        if (t <= hm && hm < addMin(t, 10) && S.fired[key] !== dk) { S.fired[key] = dk; save(); notify("Coach 365", r.msg); }
      });
    });
  }
  const addMin = (t, m) => { const [h, mi] = t.split(":").map(Number); const x = h * 60 + mi + m; return `${pad(Math.floor(x / 60) % 24)}:${pad(x % 60)}`; };
  setInterval(tick, 30000); tick();

  // ---------- .ics ----------
  function buildICS() {
    const byday = { daily: "", weekday: ";BYDAY=MO,TU,WE,TH,FR", SA: ";BYDAY=SA", SU: ";BYDAY=SU" };
    const L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Coach365//TH", "CALSCALE:GREGORIAN", "X-WR-CALNAME:Coach 365", "X-WR-TIMEZONE:Asia/Bangkok",
      "BEGIN:VTIMEZONE", "TZID:Asia/Bangkok", "BEGIN:STANDARD", "DTSTART:19700101T000000", "TZOFFSETFROM:+0700", "TZOFFSETTO:+0700", "TZNAME:ICT", "END:STANDARD", "END:VTIMEZONE"];
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
    const startDay = today() > START ? today() : START;
    REMINDERS.filter((r) => S.rem[r.id] !== false).forEach((r) => {
      r.time.split(",").forEach((t) => {
        const rule = r.days === "M1" ? "FREQ=MONTHLY;BYMONTHDAY=1" : "FREQ=" + (r.days === "daily" ? "DAILY" : "WEEKLY") + byday[r.days];
        const ds = `${startDay.getFullYear()}${pad(startDay.getMonth() + 1)}${pad(startDay.getDate())}T${t.replace(":", "")}00`;
        L.push("BEGIN:VEVENT", `UID:coach365-${r.id}-${t.replace(":", "")}@coach365`, `DTSTAMP:${stamp}`, `DTSTART;TZID=Asia/Bangkok:${ds}`, "DURATION:PT10M",
          `RRULE:${rule};UNTIL=20270927T235959Z`, `SUMMARY:${r.msg}`, "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${r.msg}`, "TRIGGER:PT0M", "END:VALARM", "END:VEVENT");
      });
    });
    L.push("END:VCALENDAR");
    return L.join("\r\n");
  }
  function download(name, text, type) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  $("icsBtn").addEventListener("click", () => { download("coach365-reminders.ics", buildICS(), "text/calendar"); toast("ดาวน์โหลดแล้ว เปิดไฟล์เพื่อเพิ่มลงปฏิทิน"); });

  // ---------- backup ----------
  $("exportJson").addEventListener("click", () => download(`coach365-backup-${iso(today())}.json`, JSON.stringify({ ...S, ai: { model: S.ai?.model } }, null, 1), "application/json"));

  // ---------- AI key ----------
  $("aiKey").value = S.ai?.key || "";
  $("aiModel").value = S.ai?.model || "claude-opus-5";
  $("aiSave").addEventListener("click", () => { S.ai = { key: $("aiKey").value.trim(), model: $("aiModel").value }; save(); toast(S.ai.key ? "บันทึก API key แล้ว" : "บันทึกแล้ว"); });
  $("aiClear").addEventListener("click", () => { S.ai = { model: $("aiModel").value }; $("aiKey").value = ""; save(); toast("ลบ key แล้ว"); });
  $("exportCsv").addEventListener("click", () => {
    const head = ["date", "weight", "waist", "steps", "spend", ...CHECKS.map((c) => c[0]), "note"];
    const rows = entries().map((e) => head.map((h) => (h === "note" ? `"${String(e.note || "").replace(/"/g, '""')}"` : e[h] ?? "")).join(","));
    download(`coach365-logs-${iso(today())}.csv`, "﻿" + [head.join(","), ...rows].join("\n"), "text/csv");
  });
  $("importJson").addEventListener("change", async (ev) => {
    const f = ev.target.files[0]; if (!f) return;
    try { const d = JSON.parse(await f.text()); if (!d.logs) throw 0; const key = S.ai?.key; S = Object.assign(def(), d); S.ai = { ...d.ai, key }; save(); renderAll(); toast("นำเข้าข้อมูลแล้ว"); }
    catch (e) { toast("ไฟล์ไม่ถูกต้อง ใช้ไฟล์ที่ส่งออกจากแอปนี้"); }
    ev.target.value = "";
  });

  function renderAll() { renderHeader(); renderToday(); renderMoney(); renderStats(); renderSchedule(); refresh(); }
  setInterval(() => { renderSchedule(); renderHero(); }, 60000);
  renderAll();
  window.Coach = { get S() { return S; }, save, iso, today, toast, fmt, esc, START, addMeal, afterMeal, closeKitchen, plannedMeal, refresh, celebrate };
  const fromHash = () => { const h = location.hash.slice(1); if (["today", "food", "train", "money", "settings"].includes(h)) show(h); };
  addEventListener("hashchange", fromHash); addEventListener("DOMContentLoaded", fromHash);

  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
