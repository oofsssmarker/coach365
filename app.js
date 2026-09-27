// Coach 365 — ข้อมูลทั้งหมดเก็บใน localStorage ของเครื่อง
(() => {
  const START = new Date(2026, 8, 28); // จันทร์ 28 ก.ย. 2569
  const DAY = 86400000;
  const START_WEIGHT = 100, GOAL_WEIGHT = 78, SAVE_GOAL = 100000, PASSIVE_GOAL_DAY = 300;
  const GOAL_END = new Date(2027, 8, 27);
  const STEPS = [5000, 7000, 9000, 10000, 11000, 12000, 12000, 12000, 12000, 12000, 12000, 12000];
  const KEY = "coach365";
  const CHECKS = [["if", "ปิดครัวตามเวลา (IF)"], ["protein", "โปรตีนถึง 140 ก."], ["workout", "ออกกำลังกายตามแผน"], ["posture", "จัดท่าทาง 10 นาที"], ["room", "เก็บห้อง 10 นาที"], ["sleep", "นอนก่อน 23:30"]];

  const REMINDERS = [
    { id: "wake", time: "07:00", days: "daily", msg: "ตื่น! ดื่มน้ำ 500 มล. แล้วจัดท่าทาง 10 นาที" },
    { id: "train", time: "07:15", days: "weekday", msg: "ได้เวลาออกกำลังกาย เปิดแอปดูท่าวันนี้" },
    { id: "move", time: "10:00,11:00,14:00,15:00,16:00,17:00", days: "weekday", msg: "ลุกเดิน 3 นาที ยืดอก เก็บคาง" },
    { id: "meal1", time: "12:00", days: "daily", msg: "มื้อแรก: โปรตีนก่อน ข้าวครึ่ง" },
    { id: "snack", time: "16:00", days: "daily", msg: "มื้อว่างโปรตีน: อกไก่ + นมถั่วเหลืองไม่หวาน" },
    { id: "meal2", time: "18:15", days: "daily", msg: "มื้อสุดท้าย แล้วปิดครัว" },
    { id: "walk", time: "19:00", days: "daily", msg: "เดินให้ครบก้าววันนี้" },
    { id: "log", time: "22:00", days: "daily", msg: "บันทึกวันนี้ในแอป แล้วเก็บห้อง 10 นาที" },
    { id: "phone", time: "22:45", days: "daily", msg: "วางมือถือไกลเตียง จด 3 บรรทัด" },
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
    if (tab === "train") renderTrain();
    if (tab === "money") renderMoney();
    if (tab === "stats") renderStats();
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

  function renderToday() {
    const d = parse($("logDate").value), p = plan(d);
    $("targets").innerHTML = [
      ["ก้าวเดิน", fmt(p.steps)], ["หน้าต่างกิน", p.window], ["ออกกำลังกาย", p.activity], ["แคลอรี่ / โปรตีน", "2,000 / 140 ก."],
    ].map(([a, b]) => `<div class="tgt"><span class="eyebrow">${a}</span><b>${b}</b></div>`).join("");
    const e = S.logs[iso(d)] || {};
    ["weight", "waist", "steps", "spend"].forEach((k) => ($("f-" + k).value = e[k] ?? ""));
    $("f-note").value = e.note || "";
    CHECKS.forEach(([k]) => ($("c-" + k).checked = !!e[k]));
  }
  const num = (id) => { const v = $(id).value; return v === "" ? null : Number(v); };
  $("logForm").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const k = $("logDate").value, prev = S.logs[k] || {};
    const e = Object.assign({}, prev, { weight: num("f-weight"), waist: num("f-waist"), steps: num("f-steps"), spend: num("f-spend"), note: $("f-note").value.trim() });
    CHECKS.forEach(([c]) => (e[c] = $("c-" + c).checked));
    S.logs[k] = e; save(); renderHeader();
    $("saveStatus").textContent = "บันทึกแล้ว " + new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
    toast("บันทึกแล้ว");
  });

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
    const yt = "https://www.youtube.com/results?search_query=" + encodeURIComponent(ex.q);
    return `<article class="ex ${cur.done ? "done" : ""}" data-id="${id}">
      ${Figures.svg(id)}
      <div>
        <h3>${ex.th}<span class="eqtag">${eqName[ex.eq]}</span></h3>
        <div class="small muted">${ex.name} · ${ex.muscles}</div>
        ${sets ? `<div class="sets">${sets}</div>` : ""}
        ${withLog ? `<div class="last">${last ? `ครั้งก่อน (${last.date.slice(5)}): ${last.w ?? "–"} กก. × ${last.r ?? "–"}` : "ยังไม่มีสถิติ เริ่มเบาๆ เน้นท่าถูก"}</div>
        <div class="inputs">
          <input type="number" inputmode="decimal" step="0.5" placeholder="กก." aria-label="น้ำหนักที่ใช้" data-f="w" value="${cur.w ?? ""}">
          <input type="number" inputmode="numeric" placeholder="ครั้ง" aria-label="จำนวนครั้งเซ็ตสุดท้าย" data-f="r" value="${cur.r ?? ""}">
          <label class="chk" style="padding:6px 8px"><input type="checkbox" data-f="done" ${cur.done ? "checked" : ""}>เสร็จ</label>
        </div>` : ""}
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
    if (!$("library").innerHTML) $("library").innerHTML = Object.keys(EXERCISES).map((id) => exCard(id, "", false)).join("");
    Figures.start();
  }
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
    if (items.length && items.every(([x]) => lifts[x]?.done)) { log.workout = true; toast("จบเซสชันแล้ว เก่งมาก 💪"); }
    save();
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
    $("history").innerHTML = es.slice(-30).reverse().map((e) => `<tr><td class="num">${e.date.slice(5)}</td><td class="num">${fmt(e.weight, 1)}</td><td class="num">${fmt(e.waist, 1)}</td><td class="num">${fmt(e.steps)}</td><td>${ck(e.if)}</td><td>${ck(e.protein)}</td><td>${ck(e.workout)}</td></tr>`).join("") || `<tr><td colspan="7" class="muted">ยังไม่มีบันทึก</td></tr>`;
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
  $("exportJson").addEventListener("click", () => download(`coach365-backup-${iso(today())}.json`, JSON.stringify(S, null, 1), "application/json"));
  $("exportCsv").addEventListener("click", () => {
    const head = ["date", "weight", "waist", "steps", "spend", ...CHECKS.map((c) => c[0]), "note"];
    const rows = entries().map((e) => head.map((h) => (h === "note" ? `"${String(e.note || "").replace(/"/g, '""')}"` : e[h] ?? "")).join(","));
    download(`coach365-logs-${iso(today())}.csv`, "﻿" + [head.join(","), ...rows].join("\n"), "text/csv");
  });
  $("importJson").addEventListener("change", async (ev) => {
    const f = ev.target.files[0]; if (!f) return;
    try { const d = JSON.parse(await f.text()); if (!d.logs) throw 0; S = Object.assign(def(), d); save(); renderAll(); toast("นำเข้าข้อมูลแล้ว"); }
    catch (e) { toast("ไฟล์ไม่ถูกต้อง ใช้ไฟล์ที่ส่งออกจากแอปนี้"); }
    ev.target.value = "";
  });

  function renderAll() { renderHeader(); renderToday(); renderMoney(); }
  renderAll();
  const fromHash = () => { const h = location.hash.slice(1); if (["today", "train", "money", "stats", "settings"].includes(h)) show(h); };
  addEventListener("hashchange", fromHash); fromHash();

  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
