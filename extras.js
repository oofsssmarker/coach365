// ฟีเจอร์เสริม: กราฟต่อท่า รูปเทียบก่อน-หลัง สรุปสัปดาห์ ปฏิทินความสม่ำเสมอ น้ำ ETA รายการซื้อของ
(() => {
  const C = window.Coach, $ = (id) => document.getElementById(id), DAY = 86400000;
  const e1rm = (w, r) => (w && r ? w * (1 + r / 30) : 0);
  const logs = () => C.S.logs;
  const days = () => Object.keys(logs()).sort();

  // ---------- กราฟความก้าวหน้าต่อท่า (ใช้ทั้งใน player และคลังท่า) ----------
  window.exChart = function (id, opts = {}) {
    const pts = days().map((k) => {
      const sets = (logs()[k].lifts?.[id]?.sets || []).filter((s) => s.done && s.r);
      if (!sets.length) return null;
      const best = sets.reduce((b, s) => (e1rm(s.w || 0, s.r) > e1rm(b.w || 0, b.r) ? s : b));
      return { k, e: e1rm(best.w || 0, best.r), w: best.w || 0, r: best.r, vol: sets.reduce((a, s) => a + (s.w || 0) * (s.r || 0), 0), reps: sets.reduce((a, s) => a + s.r, 0) };
    }).filter(Boolean);
    if (pts.length < 2) return `<p class="small muted">${pts.length ? "เล่นอีก 1 ครั้งจะเริ่มเห็นกราฟ" : "ยังไม่มีข้อมูล"}</p>`;
    const bodyweight = pts.every((p) => !p.w);
    const val = (p) => (bodyweight ? p.reps : p.e), label = bodyweight ? "ครั้งรวมต่อวัน" : "ความแข็งแรง (e1RM กก.)";
    const W = 640, H = 200, L = 44, R = 16, T = 16, B = 30;
    const vs = pts.map(val), lo = Math.min(...vs) * 0.9, hi = Math.max(...vs) * 1.08 || 1;
    const x = (i) => L + ((W - L - R) * i) / (pts.length - 1), y = (v) => T + ((H - T - B) * (hi - v)) / (hi - lo || 1);
    let s = "";
    for (let g = 0; g <= 4; g++) { const v = lo + ((hi - lo) * g) / 4; s += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="var(--muted)" font-family="IBM Plex Mono,monospace">${v.toFixed(bodyweight ? 0 : 1)}</text>`; }
    const path = pts.map((p, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(val(p)).toFixed(1)).join(" ");
    s += `<path d="${path} L${x(pts.length - 1)} ${H - B} L${x(0)} ${H - B} Z" fill="var(--accent)" opacity=".12"/><path d="${path}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round"/>`;
    pts.forEach((p, i) => { s += `<circle cx="${x(i)}" cy="${y(val(p))}" r="4" fill="var(--accent)" stroke="var(--surface)" stroke-width="2"/>`; if (i === 0 || i === pts.length - 1 || pts.length <= 6) s += `<text x="${x(i)}" y="${H - 10}" text-anchor="${i === 0 ? "start" : i === pts.length - 1 ? "end" : "middle"}" font-size="11" fill="var(--muted)">${p.k.slice(5)}</text>`; });
    const first = val(pts[0]), last = val(pts[pts.length - 1]), gain = ((last - first) / first) * 100;
    const lastP = pts[pts.length - 1];
    return `<div class="exchart"><div class="row between"><span class="small muted">${label}</span><b class="num ${gain >= 0 ? "ok" : "no"}">${gain >= 0 ? "+" : ""}${gain.toFixed(0)}% ใน ${pts.length} ครั้ง</b></div><svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="กราฟความก้าวหน้า">${s}</svg>${opts.compact ? "" : `<div class="small muted">ล่าสุด ${lastP.w || "ตัวเปล่า"} × ${lastP.r} · ปริมาณ ${C.fmt(lastP.vol)}</div>`}</div>`;
  };
  // ปุ่ม 📈 ในคลังท่า
  document.querySelector('[data-view="train"]').addEventListener("click", (e) => {
    const b = e.target.closest("[data-chart]"); if (!b) return;
    const box = b.closest(".ex").querySelector(".exchart-box"); box.innerHTML = box.innerHTML ? "" : window.exChart(b.dataset.chart);
  });

  // ---------- น้ำ ----------
  function renderWater() {
    const l = C.S.logs[C.iso(C.today())] || {}, n = l.water || 0;
    $("water").innerHTML = `<span class="eyebrow">น้ำวันนี้ <span class="num">${n}/8 แก้ว</span></span><div class="cups">${Array.from({ length: 8 }, (_, i) => `<button type="button" class="cup ${i < n ? "on" : ""}" data-cup="${i + 1}" aria-label="แก้วที่ ${i + 1}">💧</button>`).join("")}</div>`;
  }
  $("water").addEventListener("click", (e) => {
    const c = e.target.closest("[data-cup]"); if (!c) return;
    const l = (C.S.logs[C.iso(C.today())] = C.S.logs[C.iso(C.today())] || {}), n = Number(c.dataset.cup);
    l.water = l.water === n ? n - 1 : n; C.save(); renderWater(); if (l.water === 8) C.celebrate("น้ำครบ 8 แก้ว 💧");
  });

  // ---------- ปฏิทินความสม่ำเสมอ 8 สัปดาห์ ----------
  function score(l) { if (!l) return 0; return ["if", "workout", "protein", "meditate"].filter((k) => l[k]).length + ((l.steps || 0) >= 5000 ? 1 : 0); }
  function renderHeat() {
    const t = C.today(), start = new Date(t - DAY * (7 * 8 - 1)); start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    let cells = "", d = new Date(start);
    while (d <= t) {
      const k = C.iso(d), s = score(logs()[k]);
      cells += `<i class="h${s}" title="${k.slice(5)}: ${s}/5"></i>`; d = new Date(d.getTime() + DAY);
    }
    const streak = (() => { let n = 0, x = new Date(t); if (score(logs()[C.iso(x)]) < 2) x = new Date(x - DAY); while (score(logs()[C.iso(x)]) >= 2) { n++; x = new Date(x - DAY); } return n; })();
    $("heat").innerHTML = `<div class="row between"><h2>ความสม่ำเสมอ</h2><b class="num">🔥 ${streak} วันติด</b></div><div class="heat">${cells}</div><div class="small muted">แต่ละช่อง = 1 วัน สีเข้มขึ้นตามจำนวนที่ทำได้ (IF · เวท · โปรตีน · สมาธิ · เดิน 5,000+)</div>`;
  }

  // ---------- น้ำหนักเฉลี่ย 7 วัน + วันที่คาดว่าถึงเป้า ----------
  function renderTrend() {
    const ws = days().filter((k) => logs()[k].weight != null).map((k) => ({ k, w: logs()[k].weight }));
    if (ws.length < 3) { $("trend").innerHTML = `<p class="small muted">ชั่งน้ำหนักครบ 3 วันจะเริ่มคำนวณแนวโน้ม</p>`; return; }
    const avg = (arr) => arr.reduce((a, x) => a + x.w, 0) / arr.length;
    const last7 = ws.slice(-7), prev7 = ws.slice(-14, -7);
    const a7 = avg(last7), rate = prev7.length >= 3 ? (a7 - avg(prev7)) / ((new Date(last7[last7.length - 1].k) - new Date(prev7[prev7.length - 1].k)) / DAY) * 7 : null;
    const p = C.plan(C.today()), mode = p.mode;
    const want = { cut: [-0.8, -0.4], cut2: [-0.7, -0.3], minicut: [-0.8, -0.4], maintain: [-0.2, 0.2], bulk: [0.05, 0.25] }[mode];
    const cls = rate == null ? "" : rate >= want[0] && rate <= want[1] ? "good" : (mode === "bulk" ? rate > want[1] : rate < want[0]) ? "warn" : "bad";
    let eta = "";
    if (rate == null) eta = "ชั่งต่ออีก 1 สัปดาห์จะเริ่มบอกแนวโน้มได้";
    else if (mode === "cut" && rate < -0.05) { const weeks = (a7 - 78) / -rate; const d = new Date(C.today().getTime() + weeks * 7 * DAY); eta = `ถ้าเป็นแบบนี้ต่อไป ถึง 78 กก. ประมาณ <b>${d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })}</b>`; }
    else if (mode === "bulk") eta = rate > 0.3 ? "ขึ้นเร็วไป จะเป็นไขมันมากกว่ากล้าม ลดข้าว 1 ทัพพี/วัน" : rate < 0 ? "ช่วงสร้างกล้ามต้องกินให้ถึงเป้า เพิ่มข้าว 1 ทัพพี + นม 1 กล่อง" : "กำลังดี กล้ามขึ้นช้าแต่ชัวร์ ดูน้ำหนักบาร์ที่เพิ่มเป็นหลัก";
    else if (mode === "maintain") eta = Math.abs(rate) <= 0.2 ? "น้ำหนักนิ่งตามแผน ร่างกายกำลังปรับตัว" : "ควรนิ่ง ปรับอาหารทีละ 100 kcal";
    else eta = rate >= 0 ? "น้ำหนักนิ่งหรือขึ้น เช็กน้ำมันแฝงในอาหารร้าน และปิดครัวตรงเวลาไหม" : "ลงตามแผน รักษาโปรตีนไว้ กล้ามจะไม่หาย";
    $("trend").innerHTML = `<div class="stats"><div class="stat good"><span class="eyebrow">เฉลี่ย 7 วัน</span><b>${a7.toFixed(1)}</b><span class="small muted">เป้าตอนนี้ ${p.goal.toFixed(1)}</span></div><div class="stat ${cls}"><span class="eyebrow">ต่อสัปดาห์</span><b>${rate == null ? "–" : (rate > 0 ? "+" : "") + rate.toFixed(2)}</b><span class="small muted">ช่วง${p.modeTh}: ${want[0]} ถึง ${want[1]}</span></div></div><p class="small" style="margin:6px 0 0">${eta}</p>`;
  }

  // ---------- แผน 3 ปี ----------
  function renderRoadmap() {
    const p = C.plan(C.today());
    const goalEnd = (m) => C.goalAt(Math.round(m * 30.4));
    $("roadmap").innerHTML = C.PHASES.map(([a, b, name, mode, prog, note], i) => `<div class="rm ${i + 1 === p.phase ? "now" : i + 1 < p.phase ? "past" : ""}">
      <div class="rm-h"><b>${name}</b><span class="num small muted">เดือน ${a}–${b}</span></div>
      <div class="small">${note}</div>
      <div class="small muted">${TARGETS[mode].th} · ${C.fmt(TARGETS[mode].kcal)} kcal · โปรตีน ${TARGETS[mode].protein} ก. · เวท ${{ AB: "Full body 3 วัน", UL: "Upper/Lower 4 วัน", PPL: "Push/Pull/Legs 5 วัน", PPL2: "PPL หนัก 5 วัน" }[prog]} · เป้าจบช่วง ${goalEnd(b).toFixed(0)} กก.</div></div>`).join("") +
      `<p class="small muted">น้ำหนักปลายปี 3 (~82 กก.) มากกว่าปลายปี 1 (78) เพราะเป็นกล้ามที่สร้างมา ไม่ใช่ไขมัน ตัวเลขที่ต้องดูคือรอบเอวและรูปเทียบ</p>`;
  }

  // ---------- โค้ชสรุปสัปดาห์ ----------
  function renderWeekly() {
    const t = C.today(), last7 = Array.from({ length: 7 }, (_, i) => C.iso(new Date(t - DAY * i))), L = last7.map((k) => logs()[k]).filter(Boolean);
    if (!L.length) { $("weekly").hidden = true; return; }
    $("weekly").hidden = false;
    const n = (k) => L.filter((l) => l[k]).length, steps = L.filter((l) => l.steps).map((l) => l.steps), spend = L.reduce((a, l) => a + (l.spend || 0), 0);
    const kcal = L.map((l) => (l.food || []).reduce((a, m) => a + m.items.reduce((b, i) => b + i.kcal, 0), 0)).filter(Boolean);
    const lines = [];
    lines.push(n("workout") >= 3 ? `✅ เวท ${n("workout")} ครั้ง ครบตามแผน` : `⚠️ เวท ${n("workout")}/3 ครั้ง ${n("workout") === 0 ? "สัปดาห์นี้ยังไม่ได้เริ่ม เริ่มพรุ่งนี้เช้า 1 เซสชันพอ" : "ขาดอีก " + (3 - n("workout"))}`);
    lines.push(n("if") >= 5 ? `✅ ปิดครัวตรงเวลา ${n("if")}/7 วัน` : `⚠️ ปิดครัวตรงเวลาแค่ ${n("if")}/7 วัน ตัวนี้มีผลกับน้ำหนักมากที่สุด`);
    lines.push(n("protein") >= 5 ? `✅ โปรตีนถึงเป้า ${n("protein")} วัน` : `⚠️ โปรตีนถึงเป้า ${n("protein")}/7 วัน เพิ่มไข่ต้ม 2 ฟองต่อวันง่ายสุด`);
    if (steps.length) { const a = steps.reduce((x, y) => x + y, 0) / steps.length; lines.push(a >= 5000 ? `✅ เดินเฉลี่ย ${C.fmt(a)} ก้าว` : `⚠️ เดินเฉลี่ย ${C.fmt(a)} ก้าว ลองลงรถก่อน 1 ป้าย`); }
    const T = C.plan(t).target;
    if (kcal.length) { const a = kcal.reduce((x, y) => x + y, 0) / kcal.length; lines.push(a >= T.kcalMin && a <= T.kcalMax ? `✅ กินเฉลี่ย ${C.fmt(a)} kcal อยู่ในเป้า (${T.th})` : a < T.kcalMin ? `⚠️ กินเฉลี่ย ${C.fmt(a)} kcal น้อยกว่าเป้า ${C.fmt(T.kcalMin - a)} ช่วง${T.th}ต้องกินให้ถึง ไม่งั้นกล้ามไม่ขึ้น` : `⚠️ กินเฉลี่ย ${C.fmt(a)} kcal เกินเป้า ${C.fmt(a - T.kcalMax)}`); }
    if (spend) lines.push(spend <= T.budget * 7 ? `✅ ค่ากิน ${C.fmt(spend)} บาท อยู่ในงบ` : `⚠️ ค่ากิน ${C.fmt(spend)} บาท เกินงบ ${C.fmt(spend - T.budget * 7)}`);
    const med = L.reduce((a, l) => a + (l.meditateMin || 0), 0); if (med) lines.push(`🧘 สมาธิรวม ${med} นาที`);
    const good = lines.filter((x) => x.startsWith("✅")).length;
    $("weekly").innerHTML = `<h2>โค้ชสรุป 7 วันล่าสุด</h2><ul class="plainlist">${lines.map((x) => `<li>${x}</li>`).join("")}</ul><p class="small" style="margin:0">${good >= 4 ? "สัปดาห์นี้ดีมาก รักษาแบบนี้ไว้ อย่าเพิ่มอะไรใหม่" : good >= 2 ? "ผ่านครึ่ง สัปดาห์หน้าโฟกัสแค่ข้อ ⚠️ อันแรกพอ" : "สัปดาห์นี้หลุด ไม่เป็นไร กฎคือห้ามพลาด 2 สัปดาห์ติด เริ่มใหม่พรุ่งนี้"}</p>`;
  }

  // ---------- รูปเทียบก่อน-หลัง ----------
  const dbP = new Promise((res, rej) => { const r = indexedDB.open("coach365-photos", 1); r.onupgradeneeded = () => r.result.createObjectStore("p"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const tx = async (mode, fn) => { const db = await dbP; return new Promise((res, rej) => { const t = db.transaction("p", mode); const q = fn(t.objectStore("p")); t.oncomplete = () => res(q?.result); t.onerror = () => rej(t.error); }); };
  async function shrink(file, max = 900) { const bmp = await createImageBitmap(file); const k = Math.min(1, max / Math.max(bmp.width, bmp.height)); const c = document.createElement("canvas"); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k); c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height); return new Promise((r) => c.toBlob(r, "image/jpeg", 0.82)); }
  const POSES = [["front", "หน้า"], ["side", "ข้าง"], ["back", "หลัง"]];
  let bodyUrls = [];
  async function renderBody() {
    const B = (C.S.body = C.S.body || []); // [{date, front, side, back}]
    bodyUrls.splice(0).forEach(URL.revokeObjectURL);
    const t = C.today(), latest = B[B.length - 1], due = !latest || (t - new Date(latest.date)) / DAY >= 28;
    const month = C.iso(t).slice(0, 7);
    let cur = B.find((b) => b.date.startsWith(month));
    const shot = async (b, pose) => { if (!b?.[pose]) return ""; const blob = await tx("readonly", (s) => s.get(b[pose])).catch(() => null); if (!blob) return ""; const u = URL.createObjectURL(blob); bodyUrls.push(u); return u; };
    const first = B[0];
    const cards = await Promise.all(POSES.map(async ([pose, th]) => {
      const a = await shot(first, pose), b = await shot(cur || latest, pose);
      return `<div class="bodycol"><div class="eyebrow">${th}</div><div class="bodypair">${a ? `<img src="${a}" alt="${th} เริ่มต้น">` : `<div class="noimg">–</div>`}${b && b !== a ? `<img src="${b}" alt="${th} ล่าสุด">` : `<label class="noimg add" title="ถ่ายรูป${th}">📷<input type="file" accept="image/*" capture="environment" data-pose="${pose}" hidden></label>`}</div></div>`;
    }));
    $("body").innerHTML = `<div class="row between"><h2>รูปเทียบก่อน-หลัง</h2><span class="small muted">${B.length ? `ถ่ายมาแล้ว ${B.length} เดือน` : "ถ่ายทุกต้นเดือน"}</span></div>
      <p class="small muted" style="margin:0">${due ? "ได้เวลาถ่ายรูปเดือนนี้ ที่เดิม แสงเดิม เช็ดกระจกก่อน 😄 (เก็บในเครื่องนี้เท่านั้น)" : "รูปซ้าย = เดือนแรก · รูปขวา = ล่าสุด"}</p>
      <div class="bodygrid">${cards.join("")}</div>${B.length > 1 ? `<div class="small muted">น้ำหนัก: ${first.weight ?? "–"} → ${(cur || latest).weight ?? "–"} กก. · รอบเอว: ${first.waist ?? "–"} → ${(cur || latest).waist ?? "–"} ซม.</div>` : ""}`;
  }
  $("body").addEventListener("change", async (e) => {
    const pose = e.target.dataset.pose, f = e.target.files?.[0]; if (!pose || !f) return;
    const B = (C.S.body = C.S.body || []), month = C.iso(C.today()).slice(0, 7);
    let rec = B.find((b) => b.date.startsWith(month)); if (!rec) { rec = { date: C.iso(C.today()) }; B.push(rec); }
    const id = "body-" + rec.date + "-" + pose, blob = await shrink(f); await tx("readwrite", (s) => s.put(blob, id));
    rec[pose] = id; const l = C.S.logs[C.iso(C.today())] || {}; rec.weight = l.weight ?? rec.weight; rec.waist = l.waist ?? rec.waist;
    C.save(); C.celebrate("เก็บรูปแล้ว เดือนหน้ามาเทียบกัน 📸"); renderBody();
  });

  // ---------- รายการซื้อของแบบติ๊ก ----------
  function renderShopChecks() {
    const wk = Math.floor(Math.max(0, Math.round((C.today() - C.START) / DAY)) / 7), key = "w" + wk;
    const done = (C.S.shop = C.S.shop || {})[key] || [];
    const box = $("shopChecks"); if (!box) return;
    box.innerHTML = `<div class="eyebrow">ติ๊กตอนซื้อ (รีเซ็ตทุกสัปดาห์)</div><div class="chips">${SHOPPING.filter((s) => s[1]).map((s, i) => `<button type="button" class="chip ${done.includes(i) ? "on" : ""}" data-shop="${i}">${done.includes(i) ? "✓ " : ""}${s[0]} ${s[1]}</button>`).join("")}</div>`;
    box.onclick = (e) => { const i = e.target.closest("[data-shop]")?.dataset.shop; if (i == null) return; const arr = (C.S.shop[key] = C.S.shop[key] || []); const n = Number(i); const at = arr.indexOf(n); at >= 0 ? arr.splice(at, 1) : arr.push(n); C.save(); renderShopChecks(); };
  }

  window.Extras = { light() { renderWater(); renderHeat(); renderTrend(); renderWeekly(); }, renderBody, renderShopChecks, renderRoadmap };
  window.Extras.light(); renderBody(); renderShopChecks(); renderRoadmap();
})();
