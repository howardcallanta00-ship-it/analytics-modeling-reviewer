/* Interactive labs, one per module. Each lab is fn(root, api). api.done() clears the lab challenge once. */
(function () {
  'use strict';
  const L = (window.LABS = {});
  const fmt = (x, d) => (x == null || isNaN(x) ? '—' : (Math.round(x * Math.pow(10, d == null ? 2 : d)) / Math.pow(10, d == null ? 2 : d)).toLocaleString(undefined, { maximumFractionDigits: d == null ? 2 : d }));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (root, sel) => root.querySelector(sel);
  const $$ = (root, sel) => Array.from(root.querySelectorAll(sel));
  function head(title, desc, challenge, done) {
    return '<div class="stack" style="gap:6px"><span class="eyebrow">Interactive lab</span><h1 style="font-size:clamp(1.7rem,3.4vw,2.3rem)">' + title + '</h1><p class="muted" style="max-width:76ch">' + desc + '</p></div>' +
      '<div class="card row" data-challenge style="gap:14px;flex-wrap:nowrap;background:' + (done ? 'var(--green-soft)' : 'var(--orange-soft)') + ';border-color:' + (done ? 'var(--green-line)' : 'var(--orange-line)') + '"><span style="width:40px;height:40px;border-radius:12px;display:grid;place-items:center;flex-shrink:0;background:' + (done ? 'var(--green)' : 'var(--orange)') + ';color:#fff"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true">' + (done ? '<path d="M5 12l5 5 9-10"/>' : '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/>') + '</svg></span><div><b>' + (done ? 'Challenge cleared' : 'Challenge · +20 XP') + '</b><div style="font-size:.92rem;color:var(--ink-2)">' + challenge + '</div></div></div>';
  }
  function cleared(root, api) {
    if (api.isDone()) return;
    api.done();
    const c = $(root, '[data-challenge]');
    if (c) { c.style.background = 'var(--green-soft)'; c.style.borderColor = 'var(--green-line)'; c.querySelector('b').textContent = 'Challenge cleared · +20 XP'; const ic = c.querySelector('span'); ic.style.background = 'var(--green)'; ic.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>'; }
  }
  const kpi = (label, val, hot) => '<div class="kpi' + (hot ? ' hot' : '') + '"><small>' + label + '</small><b class="num">' + val + '</b></div>';

  /* generic SVG chart frame */
  function frame(w, h, pad, xr, yr) {
    const sx = (x) => pad.l + (x - xr[0]) / (xr[1] - xr[0] || 1) * (w - pad.l - pad.r);
    const sy = (y) => h - pad.b - (y - yr[0]) / (yr[1] - yr[0] || 1) * (h - pad.t - pad.b);
    return { sx, sy, w, h, pad };
  }
  function ticks(a, b, n) { const step = niceStep((b - a) / n); const s = Math.ceil(a / step) * step; const out = []; for (let v = s; v <= b + 1e-9; v += step) out.push(Math.round(v / step) * step); return out; }
  function niceStep(raw) { const p = Math.pow(10, Math.floor(Math.log10(raw || 1))); const m = raw / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p; }
  function axes(F, xr, yr, opt) {
    opt = opt || {};
    let s = '';
    ticks(yr[0], yr[1], 4).forEach((v) => { s += '<line x1="' + F.pad.l + '" x2="' + (F.w - F.pad.r) + '" y1="' + F.sy(v) + '" y2="' + F.sy(v) + '" style="stroke:var(--line-2)"/><text x="' + (F.pad.l - 6) + '" y="' + (F.sy(v) + 4) + '" text-anchor="end">' + (opt.yf ? opt.yf(v) : fmt(v, 2)) + '</text>'; });
    (opt.xt || ticks(xr[0], xr[1], 5)).forEach((v) => { s += '<text x="' + F.sx(v) + '" y="' + (F.h - F.pad.b + 16) + '" text-anchor="middle">' + (opt.xf ? opt.xf(v) : fmt(v, 2)) + '</text>'; });
    s += '<line x1="' + F.pad.l + '" x2="' + (F.w - F.pad.r) + '" y1="' + (F.h - F.pad.b) + '" y2="' + (F.h - F.pad.b) + '" style="stroke:var(--line)"/>';
    if (opt.xl) s += '<text x="' + ((F.w + F.pad.l - F.pad.r) / 2) + '" y="' + (F.h - 4) + '" text-anchor="middle" style="font-weight:600">' + opt.xl + '</text>';
    if (opt.yl) s += '<text x="12" y="' + ((F.h - F.pad.b + F.pad.t) / 2) + '" text-anchor="middle" transform="rotate(-90 12 ' + ((F.h - F.pad.b + F.pad.t) / 2) + ')" style="font-weight:600">' + opt.yl + '</text>';
    return s;
  }

  /* ================= M1 · Stats playground ================= */
  L.m1 = function (root, api) {
    const PRE = { start: '4, 8, 6, 5, 3, 8, 9', sym: '2, 4, 4, 4, 5, 5, 6, 6, 6, 8', right: '30, 32, 33, 35, 35, 36, 38, 40, 45, 60, 85, 120', left: '20, 55, 62, 70, 72, 74, 75, 76, 78, 79, 80, 81' };
    root.innerHTML = head('Stats Playground', 'Type or paste numbers. Every summary updates as you type, and the histogram shows where the mean (orange) and median (indigo) sit.', 'Build a <b>right-skewed</b> data set: skewness above 0.5, with the mean pulled above the median.', api.isDone()) +
      '<div class="labgrid"><section class="card stack"><label class="field" for="m1data">Your data (comma or space separated)<textarea id="m1data" rows="4">' + PRE.start + '</textarea></label>' +
      '<div class="row" style="gap:8px"><button class="btn small" data-pre="sym">Symmetric</button><button class="btn small" data-pre="right">Right-skewed (incomes)</button><button class="btn small" data-pre="left">Left-skewed (age at death)</button><button class="btn small" id="m1out">Add an outlier</button><button class="btn small" data-pre="start">Reset</button></div>' +
      '<div class="kpis" id="m1k"></div><p id="m1shape" style="font-size:.95rem"></p></section>' +
      '<section class="card stack"><h2 style="font-size:1.1rem">Histogram</h2><div id="m1h"></div><p class="muted" style="font-size:.85rem">Bins follow Sturges’ rule. Watch the mean chase the long tail while the median stays with the bulk.</p></section></div>' +
      '<section class="card stack"><h2 style="font-size:1.1rem">How the standard deviation was computed</h2><div class="tablebox" id="m1t"></div></section>';
    const ta = $(root, '#m1data');
    function parse() { return ta.value.split(/[\s,;]+/).map(Number).filter((x) => !isNaN(x) && ta.value.trim() !== ''); }
    function run() {
      const x = parse(); const n = x.length;
      if (n < 2) { $(root, '#m1k').innerHTML = kpi('n', n); $(root, '#m1h').innerHTML = '<p class="muted">Enter at least two numbers.</p>'; $(root, '#m1t').innerHTML = ''; $(root, '#m1shape').textContent = ''; return; }
      const s = x.slice().sort((a, b) => a - b);
      const mean = x.reduce((a, b) => a + b, 0) / n;
      const med = n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
      const cnt = {}; x.forEach((v) => { cnt[v] = (cnt[v] || 0) + 1; }); const mx = Math.max(...Object.values(cnt)); const modes = mx === 1 ? [] : Object.keys(cnt).filter((k) => cnt[k] === mx).map(Number);
      const ss = x.reduce((a, v) => a + (v - mean) ** 2, 0); const sd = Math.sqrt(ss / (n - 1));
      const skew = sd ? (n / ((n - 1) * (n - 2 || 1))) * x.reduce((a, v) => a + ((v - mean) / sd) ** 3, 0) : 0;
      $(root, '#m1k').innerHTML = kpi('n', n) + kpi('Mean', fmt(mean, 2), true) + kpi('Median', fmt(med, 2)) + kpi('Mode', modes.length ? modes.slice(0, 3).join(', ') : 'none') + kpi('Range', fmt(s[n - 1] - s[0], 2)) + kpi('Std. dev. (s)', fmt(sd, 2)) + kpi('Skewness', fmt(skew, 2));
      let shape = 'Roughly <b>symmetric</b>: mean ≈ median.';
      if (skew > 0.5) shape = '<b>Right (positive) skew</b>: a long tail to the right pulls the mean (' + fmt(mean) + ') above the median (' + fmt(med) + ').';
      else if (skew < -0.5) shape = '<b>Left (negative) skew</b>: a long tail to the left pulls the mean (' + fmt(mean) + ') below the median (' + fmt(med) + ').';
      $(root, '#m1shape').innerHTML = shape;
      // histogram
      const k = Math.max(3, Math.ceil(Math.log2(n) + 1)); const lo = s[0], hi = s[n - 1]; const wdt = (hi - lo) / k || 1;
      const bins = Array(k).fill(0); x.forEach((v) => { let i = Math.floor((v - lo) / wdt); if (i >= k) i = k - 1; bins[i]++; });
      const F = frame(560, 260, { l: 36, r: 12, t: 14, b: 34 }, [lo, lo + wdt * k], [0, Math.max(...bins)]);
      let g = axes(F, [lo, lo + wdt * k], [0, Math.max(...bins)], { yf: (v) => fmt(v, 0), xt: bins.map((_, i) => lo + i * wdt).concat([lo + k * wdt]) });
      bins.forEach((b, i) => { const x0 = F.sx(lo + i * wdt) + 1, x1 = F.sx(lo + (i + 1) * wdt) - 1; g += '<rect x="' + x0 + '" y="' + F.sy(b) + '" width="' + Math.max(1, x1 - x0) + '" height="' + (F.sy(0) - F.sy(b)) + '" rx="3" style="fill:var(--indigo-line)"/>'; });
      [[mean, 'var(--orange)', 'mean'], [med, 'var(--indigo)', 'median']].forEach(([v, c, t], j) => { g += '<line x1="' + F.sx(v) + '" x2="' + F.sx(v) + '" y1="' + F.pad.t + '" y2="' + F.sy(0) + '" style="stroke:' + c + ';stroke-width:3"/><text x="' + (F.sx(v) + 5) + '" y="' + (F.pad.t + 10 + j * 14) + '" style="fill:' + c + ';font-weight:700">' + t + '</text>'; });
      $(root, '#m1h').innerHTML = '<svg class="chart" viewBox="0 0 560 260" role="img" aria-label="Histogram of your data">' + g + '</svg>';
      const rows = x.slice(0, 14).map((v) => '<tr><td class="num">' + fmt(v) + '</td><td class="num">' + fmt(v - mean) + '</td><td class="num">' + fmt((v - mean) ** 2) + '</td></tr>').join('');
      $(root, '#m1t').innerHTML = '<table><thead><tr><th>x</th><th>x − x̄</th><th>(x − x̄)²</th></tr></thead><tbody>' + rows + (n > 14 ? '<tr><td colspan="3" class="muted">… ' + (n - 14) + ' more</td></tr>' : '') + '<tr><td colspan="3"><b>Σ(x − x̄)² = ' + fmt(ss) + '</b> → s² = ' + fmt(ss) + ' ÷ ' + (n - 1) + ' = ' + fmt(ss / (n - 1)) + ' → s = <b>' + fmt(sd) + '</b></td></tr></tbody></table>';
      if (skew > 0.5 && mean > med) cleared(root, api);
    }
    ta.addEventListener('input', run);
    $$(root, '[data-pre]').forEach((b) => b.addEventListener('click', () => { ta.value = PRE[b.dataset.pre]; run(); }));
    $(root, '#m1out').addEventListener('click', () => { const x = parse(); const mx = Math.max(...x, 0); ta.value = ta.value.trim() + ', ' + Math.round(mx * 4 + 10); run(); });
    run();
  };

  /* ================= M2 · Cleaning simulator ================= */
  L.m2 = function (root, api) {
    const rows = [[101, 45, 120, 'Flu'], [102, null, 130, 'Cold'], [103, 50, null, 'Diabetes'], [104, 60, 140, null]];
    root.innerHTML = head('Data Cleaning Simulator', 'Pick a strategy for each column of the hospital table and watch the cleaned version update. Then try the scaling and binning tools below.', 'Choose a <b>valid</b> fill for every column: something numeric for Age and Blood Pressure, and something that works for categories for Diagnosis.', api.isDone()) +
      '<section class="card stack"><h2 style="font-size:1.1rem">1 · Handle missing values</h2><div class="row" style="gap:14px;align-items:flex-end">' +
      '<label class="field" for="m2age">Age<select id="m2age"><option value="mean">Fill with mean</option><option value="median">Fill with median</option><option value="drop">Drop the row</option><option value="none" selected>Choose…</option></select></label>' +
      '<label class="field" for="m2bp">Blood pressure<select id="m2bp"><option value="none" selected>Choose…</option><option value="mean">Fill with mean</option><option value="median">Fill with median</option><option value="drop">Drop the row</option></select></label>' +
      '<label class="field" for="m2dx">Diagnosis<select id="m2dx"><option value="none" selected>Choose…</option><option value="mean">Fill with mean</option><option value="mode">Fill with mode</option><option value="unknown">Label "Unknown"</option><option value="drop">Drop the row</option></select></label></div>' +
      '<div class="labgrid"><div><b style="font-size:.85rem">Raw</b><div class="tablebox" id="m2raw"></div></div><div><b style="font-size:.85rem">Cleaned</b><div class="tablebox" id="m2clean"></div></div></div><p id="m2msg" style="font-size:.95rem"></p></section>' +
      '<div class="labgrid"><section class="card stack"><h2 style="font-size:1.1rem">2 · Scale a column</h2><label class="field" for="m2sc">Values<input id="m2sc" type="text" value="90, 60, 30"></label><div class="tablebox" id="m2sct"></div><p class="muted" style="font-size:.85rem">Add an extreme value (e.g. 500) and watch min-max squash everything else toward 0, while z-scores degrade more gently.</p></section>' +
      '<section class="card stack"><h2 style="font-size:1.1rem">3 · Bin a continuous variable</h2><label class="field" for="m2bin">Monthly incomes<input id="m2bin" type="text" value="1000, 1500, 3000, 3500, 5000, 6000"></label><div class="row" style="gap:10px;align-items:flex-end"><label class="field" for="m2k">Bins<select id="m2k"><option>2</option><option selected>3</option><option>4</option></select></label><div class="seg" role="group" aria-label="Binning method"><button class="on" data-bm="width">Equal-width</button><button data-bm="freq">Equal-frequency</button></div></div><div class="tablebox" id="m2bt"></div></section></div>';
    const show = (v) => v == null ? '<span style="color:var(--red-ink);font-weight:700">NaN</span>' : esc(v);
    const tbl = (rs, filled) => '<table><thead><tr><th>ID</th><th>Age</th><th>BP</th><th>Diagnosis</th></tr></thead><tbody>' + rs.map((r) => '<tr>' + r.map((c, j) => '<td' + (filled && filled[r[0] + '-' + j] ? ' style="background:var(--green-soft);font-weight:700"' : '') + '>' + show(typeof c === 'number' && j > 0 ? fmt(c, 1) : c) + '</td>').join('') + '</tr>').join('') + '</tbody></table>';
    $(root, '#m2raw').innerHTML = tbl(rows);
    function clean() {
      const a = $(root, '#m2age').value, b = $(root, '#m2bp').value, d = $(root, '#m2dx').value;
      let rs = rows.map((r) => r.slice()); const filled = {}; const msg = [];
      const stat = (j, how) => { const v = rows.map((r) => r[j]).filter((x) => x != null).sort((p, q) => p - q); if (how === 'mean') return v.reduce((p, q) => p + q, 0) / v.length; return v.length % 2 ? v[(v.length - 1) / 2] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2; };
      [[1, a, 'Age'], [2, b, 'BP']].forEach(([j, how, name]) => {
        if (how === 'mean' || how === 'median') { const s = stat(j, how); rs.forEach((r) => { if (r[j] == null) { r[j] = s; filled[r[0] + '-' + j] = 1; } }); msg.push(name + ': filled with the ' + how + ' (' + fmt(s, 1) + ').'); }
        else if (how === 'drop') { rs = rs.filter((r) => r[j] != null); msg.push(name + ': dropped rows with a missing value (sample shrinks).'); }
      });
      let bad = false;
      if (d === 'mean') { bad = true; msg.push('<span style="color:var(--red-ink);font-weight:700">Diagnosis: you can’t take the mean of "Flu" and "Cold". Use the mode or a label.</span>'); }
      else if (d === 'mode') { const c = {}; rows.forEach((r) => { if (r[3]) c[r[3]] = (c[r[3]] || 0) + 1; }); const m = Object.keys(c).sort((p, q) => c[q] - c[p])[0]; rs.forEach((r) => { if (r[3] == null) { r[3] = m; filled[r[0] + '-3'] = 1; } }); msg.push('Diagnosis: filled with the mode (' + m + ').'); }
      else if (d === 'unknown') { rs.forEach((r) => { if (r[3] == null) { r[3] = 'Unknown'; filled[r[0] + '-3'] = 1; } }); msg.push('Diagnosis: labeled "Unknown", which keeps the row and flags it honestly.'); }
      else if (d === 'drop') { rs = rs.filter((r) => r[3] != null); msg.push('Diagnosis: dropped the row.'); }
      $(root, '#m2clean').innerHTML = tbl(rs, filled);
      $(root, '#m2msg').innerHTML = msg.join('<br>') || '<span class="muted">Pick a strategy for each column.</span>';
      if (a !== 'none' && b !== 'none' && d !== 'none' && !bad) cleared(root, api);
    }
    ['#m2age', '#m2bp', '#m2dx'].forEach((s) => $(root, s).addEventListener('change', clean)); clean();
    function scale() {
      const v = $(root, '#m2sc').value.split(/[\s,;]+/).map(Number).filter((x) => !isNaN(x));
      if (v.length < 2) { $(root, '#m2sct').innerHTML = '<p class="muted" style="padding:10px">Enter at least two values.</p>'; return; }
      const mn = Math.min(...v), mx = Math.max(...v), mean = v.reduce((a, b) => a + b, 0) / v.length, sd = Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / (v.length - 1));
      $(root, '#m2sct').innerHTML = '<table><thead><tr><th>x</th><th>Min-max (0–1)</th><th>Z-score</th></tr></thead><tbody>' + v.map((x) => '<tr><td class="num">' + fmt(x) + '</td><td class="num">' + fmt((x - mn) / (mx - mn || 1), 3) + '</td><td class="num">' + fmt(sd ? (x - mean) / sd : 0, 3) + '</td></tr>').join('') + '<tr><td colspan="3" class="muted">min ' + fmt(mn) + ' · max ' + fmt(mx) + ' · mean ' + fmt(mean) + ' · SD ' + fmt(sd) + '</td></tr></tbody></table>';
    }
    $(root, '#m2sc').addEventListener('input', scale); scale();
    let bm = 'width';
    function bin() {
      const v = $(root, '#m2bin').value.split(/[\s,;]+/).map(Number).filter((x) => !isNaN(x)); const k = Number($(root, '#m2k').value);
      if (v.length < k) { $(root, '#m2bt').innerHTML = '<p class="muted" style="padding:10px">Enter at least as many values as bins.</p>'; return; }
      const labels = k === 2 ? ['Low', 'High'] : k === 3 ? ['Low', 'Medium', 'High'] : ['Low', 'Lower-mid', 'Upper-mid', 'High'];
      const s = v.slice().sort((a, b) => a - b); let assign, desc;
      if (bm === 'width') { const mn = s[0], w = (s[s.length - 1] - mn) / k; assign = (x) => Math.min(k - 1, Math.floor((x - mn) / (w || 1))); desc = 'Width = (' + fmt(s[s.length - 1]) + ' − ' + fmt(mn) + ') ÷ ' + k + ' = ' + fmt(w) + '. Bins: ' + labels.map((l, i) => l + ' ' + fmt(mn + i * w) + '–' + fmt(mn + (i + 1) * w)).join(', ') + '.'; }
      else { const per = s.length / k; assign = (x) => Math.min(k - 1, Math.floor(s.indexOf(x) / per)); desc = 'Each bin gets about ' + fmt(per, 1) + ' values (sorted, then cut into equal-count groups).'; }
      const counts = Array(k).fill(0); v.forEach((x) => counts[assign(x)]++);
      $(root, '#m2bt').innerHTML = '<table><thead><tr><th>Value</th><th>Bin</th></tr></thead><tbody>' + s.map((x) => '<tr><td class="num">' + fmt(x) + '</td><td>' + labels[assign(x)] + '</td></tr>').join('') + '<tr><td colspan="2" class="muted">' + desc + ' Counts: ' + counts.join(' / ') + '</td></tr></tbody></table>';
    }
    $(root, '#m2bin').addEventListener('input', bin); $(root, '#m2k').addEventListener('change', bin);
    $$(root, '[data-bm]').forEach((b) => b.addEventListener('click', () => { bm = b.dataset.bm; $$(root, '[data-bm]').forEach((x) => x.classList.toggle('on', x === b)); bin(); })); bin();
  };

  /* ================= M3 · Line fitter ================= */
  L.m3 = function (root, api) {
    const SETS = {
      noisy: { name: 'TV ads vs sales (noisy)', x: [1000, 1500, 2000, 2500, 3000, 3500, 4000], y: [8400, 9100, 11500, 12100, 14600, 15200, 16900] },
      slide: { name: 'Slide 26 data (perfect line)', x: [1000, 1500, 2000, 2500, 3000, 3500, 4000], y: [8000, 9500, 11000, 12500, 14000, 15500, 17000] }
    };
    let set = 'noisy';
    root.innerHTML = head('Line Fitter', 'Drag the sliders to fit your own line through the advertising data. The least-squares line (green) and its step-by-step calculation update alongside, so you can see why it is "best".', 'Get your line’s sum of squared errors within <b>10%</b> of the least-squares line on the noisy data.', api.isDone()) +
      '<div class="labgrid"><section class="card stack"><div class="row between"><h2 style="font-size:1.1rem">Your line vs the best line</h2><div class="seg" role="group" aria-label="Data set"><button data-set="noisy" class="on">Noisy data</button><button data-set="slide">Slide data</button></div></div><div id="m3c"></div>' +
      '<label class="field" for="m3b"><span>Your slope b: <span id="m3bv" class="num"></span></span><input id="m3b" type="range" min="0" max="6" step="0.05" value="1.5"></label>' +
      '<label class="field" for="m3a"><span>Your intercept a: <span id="m3av" class="num"></span></span><input id="m3a" type="range" min="0" max="12000" step="50" value="9000"></label>' +
      '<div class="kpis" id="m3k"></div></section>' +
      '<section class="card stack"><h2 style="font-size:1.1rem">Least squares, step by step</h2><div class="tablebox" id="m3t"></div><div id="m3s" style="font-size:.95rem;line-height:1.7"></div>' +
      '<div class="row" style="align-items:flex-end;gap:10px"><label class="field" for="m3x" style="flex:1 1 160px">Predict sales for ad spend<input id="m3x" type="number" value="4500" step="100"></label><div id="m3p" style="flex:1 1 200px;font-weight:600"></div></div></section></div>' +
      '<section class="card stack"><h2 style="font-size:1.1rem">Residuals of the best line</h2><div id="m3r"></div><p class="muted" style="font-size:.85rem">Residual = actual − predicted. Random scatter around zero is what you want. On the slide data every residual is exactly 0, which real data never does.</p></section>';
    function run() {
      const D = SETS[set]; const n = D.x.length;
      const xb = D.x.reduce((a, b) => a + b, 0) / n, yb = D.y.reduce((a, b) => a + b, 0) / n;
      const dx = D.x.map((x) => x - xb), dy = D.y.map((y) => y - yb);
      const sxy = dx.reduce((a, v, i) => a + v * dy[i], 0), sxx = dx.reduce((a, v) => a + v * v, 0);
      const b = sxy / sxx, a = yb - b * xb;
      const ub = Number($(root, '#m3b').value), ua = Number($(root, '#m3a').value);
      $(root, '#m3bv').textContent = fmt(ub, 2); $(root, '#m3av').textContent = fmt(ua, 0);
      const sse = (aa, bb) => D.x.reduce((s, x, i) => s + (D.y[i] - (aa + bb * x)) ** 2, 0);
      const best = sse(a, b), mine = sse(ua, ub);
      const sst = D.y.reduce((s, y) => s + (y - yb) ** 2, 0);
      $(root, '#m3k').innerHTML = kpi('Your SSE', fmt(mine / 1e6, 2) + 'M') + kpi('Best SSE', fmt(best / 1e6, 2) + 'M', true) + kpi('Best R²', fmt(1 - best / sst, 3)) + kpi('Best line', 'ŷ = ' + fmt(a, 0) + ' + ' + fmt(b, 3) + 'x');
      const F = frame(560, 300, { l: 54, r: 14, t: 14, b: 40 }, [500, 4500], [6000, 20000]);
      let g = axes(F, [500, 4500], [6000, 20000], { xl: 'Ad spend ($)', yl: 'Sales ($)', yf: (v) => fmt(v / 1000, 0) + 'k', xf: (v) => fmt(v / 1000, 1) + 'k' });
      const ln = (aa, bb, c, w, dash) => '<line x1="' + F.sx(500) + '" y1="' + F.sy(aa + bb * 500) + '" x2="' + F.sx(4500) + '" y2="' + F.sy(aa + bb * 4500) + '" style="stroke:' + c + ';stroke-width:' + w + (dash ? ';stroke-dasharray:6 5' : '') + '"/>';
      g += '<clipPath id="m3clip"><rect x="' + F.pad.l + '" y="' + F.pad.t + '" width="' + (F.w - F.pad.l - F.pad.r) + '" height="' + (F.h - F.pad.t - F.pad.b) + '"/></clipPath><g clip-path="url(#m3clip)">' + ln(a, b, 'var(--green)', 3) + ln(ua, ub, 'var(--orange)', 3, true);
      D.x.forEach((x, i) => { g += '<line x1="' + F.sx(x) + '" x2="' + F.sx(x) + '" y1="' + F.sy(D.y[i]) + '" y2="' + F.sy(ua + ub * x) + '" style="stroke:var(--orange);stroke-width:1.5;opacity:.5"/>'; });
      g += '</g>';
      D.x.forEach((x, i) => { g += '<circle cx="' + F.sx(x) + '" cy="' + F.sy(D.y[i]) + '" r="6" style="fill:var(--indigo)"/>'; });
      g += '<text x="' + (F.w - 16) + '" y="' + (F.pad.t + 12) + '" text-anchor="end" style="fill:var(--green-ink);font-weight:700">best fit</text><text x="' + (F.w - 16) + '" y="' + (F.pad.t + 28) + '" text-anchor="end" style="fill:var(--orange-ink);font-weight:700">your line</text>';
      $(root, '#m3c').innerHTML = '<svg class="chart" viewBox="0 0 560 300" role="img" aria-label="Scatter of ad spend vs sales with your line and the best-fit line">' + g + '</svg>';
      $(root, '#m3t').innerHTML = '<table><thead><tr><th>x</th><th>y</th><th>x − x̄</th><th>y − ȳ</th><th>product</th><th>(x − x̄)²</th></tr></thead><tbody>' + D.x.map((x, i) => '<tr class="num"><td>' + fmt(x, 0) + '</td><td>' + fmt(D.y[i], 0) + '</td><td>' + fmt(dx[i], 0) + '</td><td>' + fmt(dy[i], 1) + '</td><td>' + fmt(dx[i] * dy[i], 0) + '</td><td>' + fmt(dx[i] * dx[i], 0) + '</td></tr>').join('') + '<tr><td colspan="4"><b>Σ</b></td><td class="num"><b>' + fmt(sxy, 0) + '</b></td><td class="num"><b>' + fmt(sxx, 0) + '</b></td></tr></tbody></table>';
      $(root, '#m3s').innerHTML = 'x̄ = ' + fmt(xb, 0) + ', ȳ = ' + fmt(yb, 1) + '<br>b = ' + fmt(sxy, 0) + ' ÷ ' + fmt(sxx, 0) + ' = <b>' + fmt(b, 4) + '</b><br>a = ' + fmt(yb, 1) + ' − ' + fmt(b, 4) + ' × ' + fmt(xb, 0) + ' = <b>' + fmt(a, 1) + '</b>';
      const px = Number($(root, '#m3x').value); const out = px < Math.min(...D.x) || px > Math.max(...D.x);
      $(root, '#m3p').innerHTML = isNaN(px) ? '' : 'ŷ = ' + fmt(a, 0) + ' + ' + fmt(b, 3) + ' × ' + fmt(px, 0) + ' = <span style="font-size:1.2rem">$' + fmt(a + b * px, 0) + '</span>' + (out ? '<br><span class="chip orange" style="margin-top:6px">Extrapolation: outside the data range</span>' : '');
      const res = D.y.map((y, i) => y - (a + b * D.x[i])); const rm = Math.max(500, ...res.map(Math.abs));
      const R = frame(560, 180, { l: 54, r: 14, t: 12, b: 30 }, [500, 4500], [-rm, rm]);
      let rg = axes(R, [500, 4500], [-rm, rm], { yf: (v) => fmt(v, 0), xf: (v) => fmt(v / 1000, 1) + 'k' }) + '<line x1="' + R.pad.l + '" x2="' + (R.w - R.pad.r) + '" y1="' + R.sy(0) + '" y2="' + R.sy(0) + '" style="stroke:var(--red);stroke-dasharray:5 4"/>';
      D.x.forEach((x, i) => { rg += '<circle cx="' + R.sx(x) + '" cy="' + R.sy(res[i]) + '" r="5.5" style="fill:var(--indigo)"/>'; });
      $(root, '#m3r').innerHTML = '<svg class="chart" viewBox="0 0 560 180" role="img" aria-label="Residual plot">' + rg + '</svg>';
      if (set === 'noisy' && mine <= best * 1.1) cleared(root, api);
    }
    ['#m3b', '#m3a', '#m3x'].forEach((s) => $(root, s).addEventListener('input', run));
    $$(root, '[data-set]').forEach((b) => b.addEventListener('click', () => { set = b.dataset.set; $$(root, '[data-set]').forEach((x) => x.classList.toggle('on', x === b)); run(); }));
    run();
  };

  /* ================= M4 · Forecast lab ================= */
  L.m4 = function (root, api) {
    const Y = [5.3, 4.4, 5.4, 5.8, 5.6, 4.8, 5.6, 5.6, 5.4, 6.5, 5.1, 5.8, 5.0, 6.2, 5.6, 6.7, 5.2, 5.5, 5.8, 5.1, 5.8, 6.7, 5.2, 6.0, 5.8];
    let method = 'ma';
    root.innerHTML = head('Forecast Lab', 'The department store’s 25 weeks of sales ($M). Weeks 1–20 train the method; weeks 21–25 (shaded) test it. Each forecast uses only data available before that week.', 'The naïve forecast scores a test MAE of 0.82 and the slides’ best is 0.44. Find a setting that gets <b>below 0.44</b>.', api.isDone()) +
      '<section class="card stack"><div class="row between"><div class="seg" role="group" aria-label="Forecast method"><button data-m="naive">Naïve</button><button data-m="ma" class="on">Moving average</button><button data-m="ses">Exp. smoothing</button><button data-m="mean">Mean</button></div><div id="m4ctl" style="flex:1 1 260px;max-width:420px"></div></div><div id="m4c"></div><div class="kpis" id="m4k"></div></section>' +
      '<div class="labgrid"><section class="card stack"><h2 style="font-size:1.1rem">Test-period detail</h2><div class="tablebox" id="m4t"></div></section><section class="card stack"><h2 style="font-size:1.1rem">Your scoreboard</h2><div id="m4sb" class="stack" style="gap:6px"></div><p class="muted" style="font-size:.85rem">Try several k and α values. The slides’ table reports MA(3) at MAE 0.48 and exponential smoothing at 0.44.</p></section></div>';
    const board = {};
    function ctl() {
      const c = $(root, '#m4ctl');
      if (method === 'ma') c.innerHTML = '<label class="field" for="m4k2"><span>Window k = <span id="m4kv">3</span></span><input id="m4k2" type="range" min="2" max="8" step="1" value="3"></label>';
      else if (method === 'ses') c.innerHTML = '<label class="field" for="m4al"><span>α = <span id="m4av">0.30</span></span><input id="m4al" type="range" min="0.05" max="0.95" step="0.05" value="0.3"></label>';
      else c.innerHTML = '<p class="muted" style="font-size:.9rem">' + (method === 'naive' ? 'Forecast = last week’s actual.' : 'Forecast = average of every week so far.') + '</p>';
      $$(c, 'input').forEach((i) => i.addEventListener('input', run));
    }
    function forecasts() {
      const F = Array(Y.length + 1).fill(null); let label;
      if (method === 'naive') { for (let t = 1; t <= Y.length; t++) F[t] = Y[t - 1]; label = 'Naïve'; }
      if (method === 'mean') { for (let t = 1; t <= Y.length; t++) F[t] = Y.slice(0, t).reduce((a, b) => a + b, 0) / t; label = 'Mean'; }
      if (method === 'ma') { const k = Number($(root, '#m4k2').value); $(root, '#m4kv').textContent = k; for (let t = k; t <= Y.length; t++) F[t] = Y.slice(t - k, t).reduce((a, b) => a + b, 0) / k; label = 'MA(' + k + ')'; }
      if (method === 'ses') { const a = Number($(root, '#m4al').value); $(root, '#m4av').textContent = a.toFixed(2); F[1] = Y[0]; for (let t = 2; t <= Y.length; t++) F[t] = a * Y[t - 1] + (1 - a) * F[t - 1]; label = 'SES α=' + a.toFixed(2); }
      return { F, label };
    }
    function run() {
      const { F, label } = forecasts();
      const test = [20, 21, 22, 23, 24];
      const e = test.map((t) => Y[t] - F[t]);
      const mae = e.reduce((a, b) => a + Math.abs(b), 0) / 5, rmse = Math.sqrt(e.reduce((a, b) => a + b * b, 0) / 5), mape = 100 * e.reduce((a, b, i) => a + Math.abs(b / Y[test[i]]), 0) / 5;
      $(root, '#m4k').innerHTML = kpi('Method', label) + kpi('Test MAE', fmt(mae, 3), true) + kpi('Test RMSE', fmt(rmse, 3)) + kpi('Test MAPE', fmt(mape, 1) + '%') + kpi('Week 26 forecast', '$' + fmt(F[25], 2) + 'M');
      const C = frame(640, 280, { l: 40, r: 14, t: 14, b: 38 }, [1, 26], [4, 7.2]);
      let g = '<rect x="' + C.sx(20.5) + '" y="' + C.pad.t + '" width="' + (C.sx(25.5) - C.sx(20.5)) + '" height="' + (C.h - C.pad.t - C.pad.b) + '" style="fill:var(--orange-soft)"/>' + axes(C, [1, 26], [4, 7.2], { xl: 'Week', xt: [1, 5, 10, 15, 20, 25], xf: (v) => v, yf: (v) => fmt(v, 1) });
      const path = (pts, c, w, dash) => '<polyline points="' + pts.map((p) => C.sx(p[0]) + ',' + C.sy(p[1])).join(' ') + '" style="fill:none;stroke:' + c + ';stroke-width:' + w + (dash ? ';stroke-dasharray:6 4' : '') + '"/>';
      g += path(Y.map((y, i) => [i + 1, y]), 'var(--indigo)', 2.5);
      g += path(F.map((f, i) => [i + 1, f]).filter((p) => p[1] != null), 'var(--orange)', 2.5, true);
      Y.forEach((y, i) => { g += '<circle cx="' + C.sx(i + 1) + '" cy="' + C.sy(y) + '" r="3.5" style="fill:var(--indigo)"/>'; });
      g += '<circle cx="' + C.sx(26) + '" cy="' + C.sy(F[25]) + '" r="6" style="fill:var(--orange)"/><text x="' + (C.sx(23)) + '" y="' + (C.pad.t + 14) + '" text-anchor="middle" style="fill:var(--orange-ink);font-weight:700">test</text>';
      g += '<text x="' + (C.pad.l + 8) + '" y="' + (C.pad.t + 14) + '" style="fill:var(--indigo);font-weight:700">actual</text><text x="' + (C.pad.l + 70) + '" y="' + (C.pad.t + 14) + '" style="fill:var(--orange-ink);font-weight:700">forecast</text>';
      $(root, '#m4c').innerHTML = '<svg class="chart" viewBox="0 0 640 280" role="img" aria-label="Actual weekly sales and forecasts">' + g + '</svg>';
      $(root, '#m4t').innerHTML = '<table><thead><tr><th>Week</th><th>Actual</th><th>Forecast</th><th>Error</th><th>|Error|</th></tr></thead><tbody>' + test.map((t, i) => '<tr class="num"><td>' + (t + 1) + '</td><td>' + fmt(Y[t], 1) + '</td><td>' + fmt(F[t], 3) + '</td><td>' + fmt(e[i], 3) + '</td><td>' + fmt(Math.abs(e[i]), 3) + '</td></tr>').join('') + '<tr><td colspan="4"><b>MAE</b></td><td class="num"><b>' + fmt(mae, 3) + '</b></td></tr></tbody></table>';
      board[label] = mae;
      $(root, '#m4sb').innerHTML = Object.entries(board).sort((a, b) => a[1] - b[1]).slice(0, 6).map(([k, v], i) => '<div class="row" style="gap:10px;flex-wrap:nowrap"><span class="chip ' + (i === 0 ? 'green' : '') + '" style="min-width:28px;justify-content:center">' + (i + 1) + '</span><span style="flex:1;font-weight:600">' + esc(k) + '</span><span class="num" style="font-weight:700">' + fmt(v, 3) + '</span></div>').join('');
      if (mae < 0.44) cleared(root, api);
    }
    $$(root, '[data-m]').forEach((b) => b.addEventListener('click', () => { method = b.dataset.m; $$(root, '[data-m]').forEach((x) => x.classList.toggle('on', x === b)); ctl(); run(); }));
    ctl(); run();
  };

  /* ================= M5 · Basket miner ================= */
  L.m5 = function (root, api) {
    const B = [['T001', ['Bread', 'Milk', 'Eggs']], ['T002', ['Pasta', 'Sauce', 'Parmesan']], ['T003', ['Bread', 'Butter', 'Milk']], ['T004', ['Pasta', 'Sauce']], ['T005', ['Bread', 'Milk', 'Butter']]];
    const N = B.length; const ALL = ['Bread', 'Milk', 'Butter', 'Pasta', 'Sauce', 'Eggs', 'Parmesan'];
    const cnt = (set) => B.filter(([, its]) => set.every((i) => its.includes(i))).length;
    const pct = (x) => fmt(100 * x, 1) + '%';
    let min = 2, A = ['Bread'], C = ['Milk'];
    root.innerHTML = head('Basket Miner', 'The five baskets from the module. Change the minimum support and watch Apriori keep or prune itemsets level by level. Then build any rule and see its metrics worked out.', 'Find the rule with the <b>highest lift</b> that still meets 40% minimum support.', api.isDone()) +
      '<section class="card stack"><div class="row between"><h2 style="font-size:1.1rem">The baskets</h2><span class="muted" style="font-size:.85rem">Green = contains A and B · dashed orange = contains A only</span></div><div id="m5b" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px"></div></section>' +
      '<div class="labgrid"><section class="card stack"><div class="row between"><h2 style="font-size:1.1rem">Apriori, level by level</h2><div class="seg" role="group" aria-label="Minimum support"><button data-ms="1">20%</button><button data-ms="2" class="on">40%</button><button data-ms="3">60%</button></div></div><div id="m5lv" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px"></div><p style="font-size:.9rem;background:var(--indigo-soft);border-radius:12px;padding:10px 12px"><b style="color:var(--indigo-ink)">Apriori property:</b> a superset of an infrequent itemset is infrequent, so it is pruned before counting.</p></section>' +
      '<section class="card stack"><h2 style="font-size:1.1rem">Build a rule</h2><div class="stack" style="gap:8px"><b style="font-size:.85rem">A (antecedent)</b><div class="row" style="gap:6px" id="m5a"></div><b style="font-size:.85rem">B (consequent)</b><div class="row" style="gap:6px" id="m5c"></div></div><div id="m5m"></div></section></div>';
    function chips(el, sel, other, key) {
      el.innerHTML = ALL.map((it) => '<button class="btn small' + (sel.includes(it) ? ' primary' : '') + '" data-' + key + '="' + it + '" ' + (other.includes(it) ? 'disabled' : '') + ' aria-pressed="' + sel.includes(it) + '">' + it + '</button>').join('');
      $$(el, '[data-' + key + ']').forEach((b) => b.addEventListener('click', () => { const it = b.dataset[key]; const i = sel.indexOf(it); if (i >= 0) sel.splice(i, 1); else sel.push(it); draw(); }));
    }
    function draw() {
      chips($(root, '#m5a'), A, C, 'ia'); chips($(root, '#m5c'), C, A, 'ic');
      $(root, '#m5b').innerHTML = B.map(([id, its]) => { const hA = A.length && A.every((i) => its.includes(i)); const hB = C.length && C.every((i) => its.includes(i)); return '<div style="border-radius:14px;padding:12px;display:flex;flex-direction:column;gap:8px;' + (hA && hB ? 'background:var(--green-soft);border:2px solid var(--green)' : hA ? 'border:2px dashed var(--orange)' : 'border:1px solid var(--line)') + '"><b style="font-family:var(--f-display);font-size:.85rem;color:var(--muted)">' + id + '</b><div class="row" style="gap:5px">' + its.map((i) => '<span class="chip' + ((A.includes(i) || C.includes(i)) && hA ? ' indigo' : '') + '">' + i + '</span>').join('') + '</div></div>'; }).join('');
      const keep = (c) => c >= min;
      const row = (set, early) => { const c = cnt(set); const k = !early && keep(c); return '<div class="row" style="gap:6px;flex-wrap:nowrap;padding:7px 9px;border-radius:9px;background:var(--surface);opacity:' + (k ? 1 : .62) + '"><span style="flex:1;font-size:.82rem;font-weight:600">' + set.join(', ') + '</span><span class="num muted" style="font-size:.78rem">' + (early ? '—' : c + '/' + N) + '</span><span class="chip ' + (k ? 'green' : 'red') + '" style="font-size:.7rem">' + (early ? 'Pruned early' : k ? 'Keep' : 'Prune') + '</span></div>'; };
      const f1 = ALL.filter((i) => keep(cnt([i])));
      const pairs = []; for (let i = 0; i < f1.length; i++) for (let j = i + 1; j < f1.length; j++) { const s = [f1[i], f1[j]]; if (cnt(s)) pairs.push(s); }
      const f2 = pairs.filter((s) => keep(cnt(s))).map((s) => s.join(','));
      const tri = []; for (let i = 0; i < f1.length; i++) for (let j = i + 1; j < f1.length; j++) for (let k = j + 1; k < f1.length; k++) { const s = [f1[i], f1[j], f1[k]]; if (!cnt(s)) continue; const ok = [[s[0], s[1]], [s[0], s[2]], [s[1], s[2]]].every((p) => f2.includes(p.join(','))); tri.push([s, !ok]); }
      const col = (t, html) => '<div style="background:var(--surface-2);border-radius:12px;padding:10px;display:flex;flex-direction:column;gap:6px"><span class="eyebrow">' + t + '</span>' + (html || '<span class="muted" style="font-size:.82rem">Nothing reaches this level. Apriori stops.</span>') + '</div>';
      $(root, '#m5lv').innerHTML = col('1-itemsets', ALL.map((i) => row([i])).join('')) + col('2-itemsets', pairs.map((s) => row(s)).join('')) + col('3-itemsets', tri.map(([s, e]) => row(s, e)).join(''));
      const m = $(root, '#m5m');
      if (!A.length || !C.length) { m.innerHTML = '<p class="muted">Pick at least one item for A and one for B.</p>'; return; }
      const nAB = cnt(A.concat(C)), nA = cnt(A), nC = cnt(C);
      if (!nA) { m.innerHTML = '<p class="muted">No basket contains all of A, so the rule never applies.</p>'; return; }
      const sup = nAB / N, conf = nAB / nA, sC = nC / N, lift = sC ? conf / sC : 0;
      let v;
      if (!nAB) v = 'These items never appear together. Lift is 0: no association to act on.';
      else if (nAB < min) v = 'Lift ' + fmt(lift) + ', but the itemset is in only ' + nAB + ' of ' + N + ' baskets, below your minimum support. Too narrow for a storewide promo.';
      else if (lift > 2) v = 'Very strong association with enough reach. Test a bundle or co-location, then measure incremental margin.';
      else if (lift > 1.2) v = 'Clear positive association. A good candidate for a targeted coupon or placement test.';
      else if (lift > 1) v = 'Weak positive association. Only worth cheap changes on high-volume items.';
      else if (lift === 1) v = 'Exactly independent: buying A doesn’t change the chance of B.';
      else v = 'Negative association (lift below 1). Don’t bundle these.';
      m.innerHTML = '<div class="kpis">' + kpi('Support', pct(sup)) + kpi('Confidence', pct(conf)) + kpi('Lift', fmt(lift, 2), true) + '</div><p style="font-size:.9rem;line-height:1.7">Support = ' + nAB + ' ÷ ' + N + ' = ' + pct(sup) + '<br>Confidence = ' + nAB + ' ÷ ' + nA + ' = ' + pct(conf) + '<br>Lift = ' + pct(conf) + ' ÷ Support(B) ' + pct(sC) + ' = <b>' + fmt(lift, 2) + '</b></p><div style="background:var(--surface-2);border-radius:12px;padding:12px"><span class="eyebrow">What a manager should do</span><p style="margin-top:4px">' + v + '</p></div>';
      if (min === 2 && lift >= 2.5 - 1e-9 && nAB >= 2) cleared(root, api);
    }
    $$(root, '[data-ms]').forEach((b) => b.addEventListener('click', () => { min = Number(b.dataset.ms); $$(root, '[data-ms]').forEach((x) => x.classList.toggle('on', x === b)); draw(); }));
    draw();
  };

  /* ================= M6 · K-means stepper ================= */
  L.m6 = function (root, api) {
    const P = [[1.4, 1.3, 'A'], [1.1, 1.5, 'B'], [-1.2, -1.0, 'C'], [-1.5, -1.3, 'D'], [0.2, 0.1, 'E'], [-0.1, 0.3, 'F'], [1.6, 1.1, 'G'], [1.2, 1.8, 'H'], [-1.0, -1.5, 'I'], [-1.7, -0.9, 'J'], [0.4, 0.5, 'K'], [0.0, -0.2, 'L']];
    const COL = ['var(--indigo)', 'var(--orange)', 'var(--green)', 'var(--red)'];
    let K = 3, cent, asg, iter, phase, conv;
    root.innerHTML = head('K-Means Stepper', 'Twelve customers on standardized spend and frequency (A–F are the slides’ six). Step through the algorithm yourself: assign each customer to the nearest centroid, then move each centroid to its cluster’s mean.', 'Run K = 3 to convergence and reach a <b>silhouette score above 0.5</b>.', api.isDone()) +
      '<div class="labgrid"><section class="card stack"><div class="row between"><div class="seg" role="group" aria-label="Number of clusters">' + [2, 3, 4].map((k) => '<button data-k="' + k + '" class="' + (k === 3 ? 'on' : '') + '">K = ' + k + '</button>').join('') + '</div><span class="chip indigo" id="m6ph"></span></div><div id="m6c"></div>' +
      '<div class="row" style="gap:8px"><button class="btn primary" id="m6step">Next step</button><button class="btn" id="m6run">Run to convergence</button><button class="btn" id="m6new">New random start</button></div><div class="kpis" id="m6k"></div></section>' +
      '<section class="card stack"><h2 style="font-size:1.1rem">What just happened</h2><p id="m6log" style="font-size:.95rem;line-height:1.6"></p><h2 style="font-size:1.1rem">Elbow chart</h2><div id="m6e"></div><p class="muted" style="font-size:.85rem">Inertia for K = 1–6 (best of several starts). It always falls; the bend at K = 3 is the elbow.</p></section></div>';
    const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
    let seed = 7; const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    function init(random) { const idx = []; const pool = P.map((_, i) => i); const fixed = [4, 1, 3, 9]; while (idx.length < K) { const i = random ? pool.splice(Math.floor(rnd() * pool.length), 1)[0] : fixed[idx.length]; idx.push(i); } cent = idx.map((i) => [P[i][0] + 0.15, P[i][1] - 0.15]); asg = P.map(() => -1); iter = 0; phase = 'assign'; conv = false; }
    function assign(c) { return P.map((p) => { let b = 0; c.forEach((q, j) => { if (d2(p, q) < d2(p, c[b])) b = j; }); return b; }); }
    function update(c, a) { return c.map((q, j) => { const m = P.filter((_, i) => a[i] === j); return m.length ? [m.reduce((s, p) => s + p[0], 0) / m.length, m.reduce((s, p) => s + p[1], 0) / m.length] : q; }); }
    const inertia = (c, a) => P.reduce((s, p, i) => s + (a[i] >= 0 ? d2(p, c[a[i]]) : 0), 0);
    function silhouette(a) { const k = Math.max(...a) + 1; if (k < 2) return 0; let tot = 0; P.forEach((p, i) => { const own = P.filter((_, j) => j !== i && a[j] === a[i]); if (!own.length) return; const ai = own.reduce((s, q) => s + Math.sqrt(d2(p, q)), 0) / own.length; let bi = Infinity; for (let c = 0; c < k; c++) { if (c === a[i]) continue; const o = P.filter((_, j) => a[j] === c); if (o.length) bi = Math.min(bi, o.reduce((s, q) => s + Math.sqrt(d2(p, q)), 0) / o.length); } tot += (bi - ai) / Math.max(ai, bi); }); return tot / P.length; }
    function elbow() { const vals = [1, 2, 3, 4, 5, 6].map((k) => { let best = Infinity; for (let s = 0; s < 6; s++) { seed = 11 + s * 17; const idx = []; const pool = P.map((_, i) => i); while (idx.length < k) idx.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]); let c = idx.map((i) => [P[i][0], P[i][1]]); let a = assign(c); for (let t = 0; t < 25; t++) { c = update(c, a); a = assign(c); } best = Math.min(best, inertia(c, a)); } return best; }); seed = 7; return vals; }
    const EL = elbow();
    function draw(msg) {
      const F = frame(460, 400, { l: 36, r: 14, t: 14, b: 36 }, [-2.2, 2.2], [-2.2, 2.2]);
      let g = axes(F, [-2.2, 2.2], [-2.2, 2.2], { xl: 'Spend (z)', yl: 'Frequency (z)', yf: (v) => fmt(v, 0), xf: (v) => fmt(v, 0) });
      P.forEach((p, i) => { if (asg[i] >= 0) g += '<line x1="' + F.sx(p[0]) + '" y1="' + F.sy(p[1]) + '" x2="' + F.sx(cent[asg[i]][0]) + '" y2="' + F.sy(cent[asg[i]][1]) + '" style="stroke:' + COL[asg[i]] + ';opacity:.35"/>'; });
      P.forEach((p, i) => { g += '<circle cx="' + F.sx(p[0]) + '" cy="' + F.sy(p[1]) + '" r="11" style="fill:' + (asg[i] >= 0 ? COL[asg[i]] : 'var(--faint)') + '"/><text x="' + F.sx(p[0]) + '" y="' + (F.sy(p[1]) + 4) + '" text-anchor="middle" style="fill:#fff;font-weight:700;font-size:11px">' + p[2] + '</text>'; });
      cent.forEach((c, j) => { const x = F.sx(c[0]), y = F.sy(c[1]); g += '<path d="M' + (x - 9) + ' ' + (y - 9) + 'L' + (x + 9) + ' ' + (y + 9) + 'M' + (x + 9) + ' ' + (y - 9) + 'L' + (x - 9) + ' ' + (y + 9) + '" style="stroke:var(--surface);stroke-width:7;stroke-linecap:round"/><path d="M' + (x - 9) + ' ' + (y - 9) + 'L' + (x + 9) + ' ' + (y + 9) + 'M' + (x + 9) + ' ' + (y - 9) + 'L' + (x - 9) + ' ' + (y + 9) + '" style="stroke:' + COL[j] + ';stroke-width:4;stroke-linecap:round"/>'; });
      $(root, '#m6c').innerHTML = '<svg class="chart" viewBox="0 0 460 400" role="img" aria-label="Customers colored by cluster with centroids marked X">' + g + '</svg>';
      const done = asg.every((a) => a >= 0);
      const sil = conv ? silhouette(asg) : null;
      $(root, '#m6k').innerHTML = kpi('Iteration', iter) + kpi('Inertia', done ? fmt(inertia(cent, asg), 3) : '—') + kpi('Silhouette', sil == null ? 'at convergence' : fmt(sil, 3), sil != null);
      $(root, '#m6ph').textContent = conv ? 'Converged' : phase === 'assign' ? 'Next: assign' : 'Next: update centroids';
      $(root, '#m6step').disabled = conv;
      if (msg) $(root, '#m6log').innerHTML = msg;
      const E = frame(420, 200, { l: 40, r: 12, t: 12, b: 34 }, [1, 6], [0, Math.max(...EL)]);
      let eg = axes(E, [1, 6], [0, Math.max(...EL)], { xl: 'K', xt: [1, 2, 3, 4, 5, 6], xf: (v) => v, yf: (v) => fmt(v, 0) }) + '<polyline points="' + EL.map((v, i) => E.sx(i + 1) + ',' + E.sy(v)).join(' ') + '" style="fill:none;stroke:var(--indigo);stroke-width:2.5"/>';
      EL.forEach((v, i) => { eg += '<circle cx="' + E.sx(i + 1) + '" cy="' + E.sy(v) + '" r="' + (i + 1 === K ? 7 : 4.5) + '" style="fill:' + (i + 1 === K ? 'var(--orange)' : 'var(--indigo)') + '"/>'; });
      $(root, '#m6e').innerHTML = '<svg class="chart" viewBox="0 0 420 200" role="img" aria-label="Elbow chart of inertia by K">' + eg + '</svg>';
      if (conv && K === 3 && sil > 0.5) cleared(root, api);
    }
    function step() {
      if (conv) return;
      if (phase === 'assign') { const na = assign(cent); const changed = na.filter((a, i) => a !== asg[i]).length; asg = na; phase = 'update'; if (iter > 0 && changed === 0) { conv = true; draw('<b>Converged.</b> No customer changed cluster, so the centroids are final. Silhouette ' + fmt(silhouette(asg), 3) + '.'); return; } draw('<b>Assign:</b> each customer joins the nearest centroid. ' + changed + ' customer' + (changed === 1 ? '' : 's') + ' changed cluster.'); }
      else { const nc = update(cent, asg); const moved = nc.reduce((s, c, j) => s + Math.sqrt(d2(c, cent[j])), 0); cent = nc; iter++; phase = 'assign'; draw('<b>Update:</b> each centroid moves to the mean of its customers (total movement ' + fmt(moved, 3) + '). ' + cent.map((c, j) => '<span style="color:' + COL[j] + ';font-weight:700">C' + (j + 1) + ' (' + fmt(c[0]) + ', ' + fmt(c[1]) + ')</span>').join(' · ')); }
    }
    $(root, '#m6step').addEventListener('click', step);
    $(root, '#m6run').addEventListener('click', () => { let g = 0; while (!conv && g++ < 60) step(); });
    $(root, '#m6new').addEventListener('click', () => { init(true); draw('New random starting centroids. Different starts can lead to different clusters; libraries try several (n_init) and keep the lowest inertia.'); });
    $$(root, '[data-k]').forEach((b) => b.addEventListener('click', () => { K = Number(b.dataset.k); $$(root, '[data-k]').forEach((x) => x.classList.toggle('on', x === b)); init(false); draw('K = ' + K + '. Centroids placed; press <b>Next step</b> to assign customers.'); }));
    init(false); draw('Centroids (X) are placed. Press <b>Next step</b> to assign every customer to its nearest centroid.');
  };

  /* ================= M7 · Three regressors ================= */
  L.m7 = function (root, api) {
    const D = [['A', 'Yes', 1210, 0.38, 180], ['B', 'Yes', 1260, 0.52, 195], ['C', 'Yes', 1170, 0.61, 175], ['F', 'Yes', 1050, 0.95, 168], ['D', 'No', 1230, 1.44, 132], ['E', 'No', 980, 1.60, 128]];
    const S = [[620, 112], [700, 125], [780, 131], [850, 146], [900, 150], [980, 162], [1040, 160], [1100, 176], [1150, 178], [1210, 183], [1260, 191], [1330, 186], [1400, 195], [1480, 193], [1550, 199]];
    const curve = (x) => 100 + 105 * (1 - Math.exp(-(x - 560) / 520));
    root.innerHTML = head('Three Ways to Predict Demand', 'BayanMart’s bottled drink. Predict tomorrow’s units three ways: average the nearest past days (KNN), follow the tree’s rules, and fit SVR’s epsilon tube.', 'Find the <b>k</b> that reproduces the slides’ KNN forecast of <b>183.3 units</b> (simple average).', api.isDone()) +
      '<div class="labgrid"><section class="card stack"><h2 style="font-size:1.1rem">KNN Regressor</h2><label class="field" for="m7k"><span>k = <span id="m7kv">5</span></span><input id="m7k" type="range" min="1" max="6" step="1" value="5"></label><label class="toggle" for="m7w"><input type="checkbox" id="m7w">Weight neighbors by 1 ÷ distance</label><div class="tablebox" id="m7kt"></div><div class="kpis" id="m7kk"></div></section>' +
      '<section class="card stack"><h2 style="font-size:1.1rem">Decision Tree Regressor</h2><div class="row" style="gap:10px"><label class="toggle" for="m7p"><input type="checkbox" id="m7p" checked>Promotion running</label></div><label class="field" for="m7t"><span>Expected foot traffic: <span id="m7tv">1,240</span></span><input id="m7t" type="range" min="700" max="1600" step="10" value="1240"></label><div id="m7tree"></div></section></div>' +
      '<section class="card stack"><div class="row between"><h2 style="font-size:1.1rem">Support Vector Regression: the ε tube</h2><span class="muted" style="font-size:.85rem">Points outside the tube are support vectors: they shape the fit.</span></div><label class="field" for="m7e" style="max-width:420px"><span>epsilon (ε) = <span id="m7ev">8</span> units</span><input id="m7e" type="range" min="0" max="25" step="1" value="8"></label><div id="m7s"></div><div class="kpis" id="m7sk"></div></section>';
    function knn() {
      const k = Number($(root, '#m7k').value), w = $(root, '#m7w').checked; $(root, '#m7kv').textContent = k;
      const nb = D.slice(0, k); let pred;
      if (w) { const ws = nb.map((d) => 1 / d[3]); pred = nb.reduce((s, d, i) => s + d[4] * ws[i], 0) / ws.reduce((a, b) => a + b, 0); } else pred = nb.reduce((s, d) => s + d[4], 0) / k;
      $(root, '#m7kt').innerHTML = '<table><thead><tr><th>Day</th><th>Promo</th><th>Traffic</th><th>Distance</th><th>Units</th></tr></thead><tbody>' + D.map((d, i) => '<tr style="' + (i < k ? 'background:var(--indigo-soft);font-weight:600' : 'opacity:.6') + '"><td>' + d[0] + '</td><td>' + d[1] + '</td><td class="num">' + d[2].toLocaleString() + '</td><td class="num">' + d[3] + '</td><td class="num">' + d[4] + '</td></tr>').join('') + '</tbody></table>';
      $(root, '#m7kk').innerHTML = kpi('Neighbors used', k) + kpi('Prediction', fmt(pred, 1) + ' units', true);
      if (!w && k === 3) cleared(root, api);
    }
    function tree() {
      const p = $(root, '#m7p').checked, t = Number($(root, '#m7t').value); $(root, '#m7tv').textContent = t.toLocaleString();
      const leaf = !p ? 0 : t <= 1150 ? 1 : 2; const L2 = [['Promotion = No', 128, 1550], ['Promo = Yes, traffic ≤ 1,150', 168, 710], ['Promo = Yes, traffic > 1,150', 193, 940]];
      const node = (txt, on) => '<div style="padding:10px 12px;border-radius:12px;text-align:center;font-weight:600;font-size:.88rem;' + (on ? 'background:var(--hero);color:var(--hero-ink)' : 'background:var(--surface-2);color:var(--muted)') + '">' + txt + '</div>';
      $(root, '#m7tree').innerHTML = '<div class="stack" style="gap:10px">' + node('Promotion running?', true) + '<div style="display:grid;grid-template-columns:1fr 2fr;gap:10px"><div class="stack" style="gap:10px">' + node('No', !p) + node('Leaf: <b>128</b> units<br><small>1,550 days</small>', leaf === 0) + '</div><div class="stack" style="gap:10px">' + node('Yes → Traffic > 1,150?', p) + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' + node('≤ 1,150<br>Leaf: <b>168</b><br><small>710 days</small>', leaf === 1) + node('> 1,150<br>Leaf: <b>193</b><br><small>940 days</small>', leaf === 2) + '</div></div></div></div>' +
        '<div class="kpis" style="margin-top:12px">' + kpi('Rule path', L2[leaf][0]) + kpi('Prediction', L2[leaf][1] + ' units', true) + '</div><p class="muted" style="font-size:.85rem;margin-top:6px">No scaling needed: the tree only asks whether a value is above or below a threshold.</p>';
    }
    function svr() {
      const e = Number($(root, '#m7e').value); $(root, '#m7ev').textContent = e;
      const F = frame(640, 280, { l: 44, r: 14, t: 14, b: 38 }, [560, 1600], [100, 215]);
      let g = axes(F, [560, 1600], [100, 215], { xl: 'Expected foot traffic', yl: 'Units sold', yf: (v) => fmt(v, 0), xf: (v) => fmt(v, 0) });
      const xs = []; for (let x = 560; x <= 1600; x += 20) xs.push(x);
      g += '<path d="M' + xs.map((x) => F.sx(x) + ' ' + F.sy(curve(x) + e)).join(' L') + ' L' + xs.slice().reverse().map((x) => F.sx(x) + ' ' + F.sy(curve(x) - e)).join(' L') + 'Z" style="fill:var(--indigo-soft);stroke:var(--indigo-line)"/>';
      g += '<polyline points="' + xs.map((x) => F.sx(x) + ',' + F.sy(curve(x))).join(' ') + '" style="fill:none;stroke:var(--indigo);stroke-width:3"/>';
      let sv = 0, err = 0, pen = 0;
      S.forEach(([x, y]) => { const r = y - curve(x); const out = Math.abs(r) > e; if (out) { sv++; pen += Math.abs(r) - e; } err += Math.abs(r); g += '<circle cx="' + F.sx(x) + '" cy="' + F.sy(y) + '" r="6" style="fill:' + (out ? 'var(--orange)' : 'var(--surface)') + ';stroke:' + (out ? 'var(--orange-ink)' : 'var(--indigo)') + ';stroke-width:2"/>'; });
      $(root, '#m7s').innerHTML = '<svg class="chart" viewBox="0 0 640 280" role="img" aria-label="SVR fit with epsilon tube">' + g + '</svg>';
      $(root, '#m7sk').innerHTML = kpi('Support vectors (outside tube)', sv + ' of ' + S.length) + kpi('Ignored errors (inside)', S.length - sv) + kpi('Penalized excess error', fmt(pen, 1)) + kpi('MAE of this curve', fmt(err / S.length, 1) + ' units', true);
    }
    ['#m7k', '#m7w'].forEach((s) => $(root, s).addEventListener('input', knn));
    ['#m7p', '#m7t'].forEach((s) => $(root, s).addEventListener('input', tree));
    $(root, '#m7e').addEventListener('input', svr);
    knn(); tree(); svr();
  };

  /* ================= M8 · Confusion matrix & thresholds ================= */
  L.m8 = function (root, api) {
    const CL = ['Renew', 'Negotiate', 'Terminate'];
    let M = [[163, 12, 5], [14, 57, 9], [3, 7, 30]];
    let sel = 2;
    const V = [[0.92, 'T'], [0.81, 'T'], [0.74, 'N'], [0.66, 'T'], [0.58, 'N'], [0.47, 'T'], [0.41, 'R'], [0.33, 'N'], [0.22, 'R'], [0.12, 'R'], [0.08, 'R'], [0.05, 'N']];
    root.innerHTML = head('Confusion Matrix & Threshold Lab', 'Edit any cell of the vendor confusion matrix and pick a class to see its precision, recall and F1 recomputed. Then set the Terminate review threshold on twelve scored vendors.', 'Set the Terminate threshold so <b>every actual Terminate is flagged</b> while reviewing <b>as few vendors as possible</b>.', api.isDone()) +
      '<div class="labgrid"><section class="card stack"><div class="row between"><h2 style="font-size:1.1rem">Confusion matrix</h2><div class="seg" role="group" aria-label="Class to score">' + CL.map((c, i) => '<button data-c="' + i + '" class="' + (i === 2 ? 'on' : '') + '">' + c + '</button>').join('') + '</div></div><div class="tablebox" id="m8m"></div><div class="kpis" id="m8k"></div><p id="m8f" style="font-size:.92rem;line-height:1.7"></p><button class="btn small" id="m8reset" style="align-self:flex-start">Reset to the slides’ numbers</button></section>' +
      '<section class="card stack"><h2 style="font-size:1.1rem">Terminate threshold</h2><label class="field" for="m8th"><span>Flag for review when P(Terminate) ≥ <span id="m8tv" class="num">0.70</span></span><input id="m8th" type="range" min="0.05" max="0.95" step="0.01" value="0.70"></label><div class="kpis" id="m8tk"></div><div class="tablebox" id="m8tt"></div></section></div>';
    function mat() {
      const tot = M.flat().reduce((a, b) => a + b, 0);
      const rs = M.map((r) => r.reduce((a, b) => a + b, 0)), cs = [0, 1, 2].map((j) => M.reduce((a, r) => a + r[j], 0));
      $(root, '#m8m').innerHTML = '<table><thead><tr><th>Actual ↓ / Pred →</th>' + CL.map((c, j) => '<th style="' + (j === sel ? 'background:var(--orange-soft)' : '') + '">' + c + '</th>').join('') + '<th>Row total</th></tr></thead><tbody>' + M.map((r, i) => '<tr><td style="font-weight:700;' + (i === sel ? 'background:var(--indigo-soft)' : '') + '">' + CL[i] + '</td>' + r.map((v, j) => '<td style="' + (i === j ? 'background:var(--green-soft);' : '') + (i === sel || j === sel ? 'font-weight:700' : '') + '"><input class="cell-in num" type="number" min="0" step="1" value="' + v + '" data-i="' + i + '" data-j="' + j + '" aria-label="Actual ' + CL[i] + ', predicted ' + CL[j] + '"></td>').join('') + '<td class="num">' + rs[i] + '</td></tr>').join('') + '<tr><td><b>Column total</b></td>' + cs.map((c) => '<td class="num"><b>' + c + '</b></td>').join('') + '<td class="num"><b>' + tot + '</b></td></tr></tbody></table>';
      $$(root, '.cell-in').forEach((inp) => inp.addEventListener('change', () => { M[inp.dataset.i][inp.dataset.j] = Math.max(0, Math.round(Number(inp.value) || 0)); mat(); }));
      metrics();
    }
    function metrics() {
      const tot = M.flat().reduce((a, b) => a + b, 0); const diag = M[0][0] + M[1][1] + M[2][2];
      const per = [0, 1, 2].map((c) => { const tp = M[c][c]; const pc = M.reduce((a, r) => a + r[c], 0); const ac = M[c].reduce((a, b) => a + b, 0); const p = pc ? tp / pc : 0, r = ac ? tp / ac : 0; return { tp, pc, ac, p, r, f: p + r ? 2 * p * r / (p + r) : 0 }; });
      const s = per[sel]; const mf = (per[0].f + per[1].f + per[2].f) / 3;
      $(root, '#m8k').innerHTML = kpi('Accuracy', fmt(100 * diag / (tot || 1), 1) + '%') + kpi('Precision · ' + CL[sel], fmt(100 * s.p, 1) + '%') + kpi('Recall · ' + CL[sel], fmt(100 * s.r, 1) + '%') + kpi('F1 · ' + CL[sel], fmt(s.f, 3), true) + kpi('Macro F1', fmt(mf, 3));
      $(root, '#m8f').innerHTML = 'Accuracy = ' + diag + ' ÷ ' + tot + '<br>Precision(' + CL[sel] + ') = ' + s.tp + ' ÷ ' + s.pc + ' <span class="muted">(predicted column)</span><br>Recall(' + CL[sel] + ') = ' + s.tp + ' ÷ ' + s.ac + ' <span class="muted">(actual row)</span><br>F1 = 2 × ' + fmt(s.p, 3) + ' × ' + fmt(s.r, 3) + ' ÷ (' + fmt(s.p, 3) + ' + ' + fmt(s.r, 3) + ') = <b>' + fmt(s.f, 3) + '</b>';
    }
    function thr() {
      const t = Number($(root, '#m8th').value); $(root, '#m8tv').textContent = t.toFixed(2);
      const flagged = V.filter((v) => v[0] >= t); const caught = flagged.filter((v) => v[1] === 'T').length; const totalT = V.filter((v) => v[1] === 'T').length;
      $(root, '#m8tk').innerHTML = kpi('Vendors flagged', flagged.length + ' of ' + V.length) + kpi('Terminates caught (recall)', caught + '/' + totalT, true) + kpi('Precision of flags', flagged.length ? fmt(100 * caught / flagged.length, 0) + '%' : '—');
      const name = { T: 'Terminate', N: 'Negotiate', R: 'Renew' };
      $(root, '#m8tt').innerHTML = '<table><thead><tr><th>Vendor</th><th>P(Terminate)</th><th>Actual</th><th>Flagged?</th></tr></thead><tbody>' + V.map((v, i) => { const f = v[0] >= t; return '<tr style="' + (f ? 'background:var(--orange-soft)' : '') + '"><td>V-' + (301 + i) + '</td><td class="num">' + v[0].toFixed(2) + '</td><td>' + (v[1] === 'T' ? '<b>Terminate</b>' : name[v[1]]) + '</td><td>' + (f ? '<span class="chip orange">Review</span>' : '<span class="muted">—</span>') + (v[1] === 'T' && !f ? ' <span class="chip red">Missed</span>' : '') + '</td></tr>'; }).join('') + '</tbody></table>';
      if (caught === totalT && flagged.length === 6) cleared(root, api);
    }
    $$(root, '[data-c]').forEach((b) => b.addEventListener('click', () => { sel = Number(b.dataset.c); $$(root, '[data-c]').forEach((x) => x.classList.toggle('on', x === b)); mat(); }));
    $(root, '#m8reset').addEventListener('click', () => { M = [[163, 12, 5], [14, 57, 9], [3, 7, 30]]; mat(); });
    $(root, '#m8th').addEventListener('input', thr);
    mat(); thr();
  };

  /* ================= M9 · Text pipeline ================= */
  L.m9 = function (root, api) {
    const STOP = new Set('the a an was were is are but and to of in on it my i me we for with at this that be been has have had so very just now am its our you your they them their there from by as or'.split(' '));
    const NEG = new Set(['not', 'never', 'no']);
    const NORM = { pls: 'please', plz: 'please', delivry: 'delivery', '2day': '2 day', thx: 'thanks', u: 'you', rcvd: 'received', recieved: 'received', dmg: 'damage' };
    const STEM = { delivered: 'deliv', delivery: 'deliveri', damaged: 'damag', arrived: 'arriv', refunding: 'refund', days: 'day', polite: 'polit', rider: 'rider', crushed: 'crush', careful: 'care', pending: 'pend', boxes: 'box' };
    const LEM = { arrived: 'arrive', days: 'day', damaged: 'damage', refunds: 'refund', boxes: 'box', was: 'be', were: 'be', is: 'be', crushed: 'crush', delayed: 'delay', items: 'item', riders: 'rider', delivered: 'deliver', refunding: 'refund' };
    const VOCAB = new Set(['delivery', 'arrived', 'late', 'days', 'day', 'rider', 'was', 'polite', 'but', 'box', 'the', 'parcel', 'and', 'my', 'refund', 'is', 'not', 'showing', 'still', 'pending', 'wallet', 'fast', 'careful', 'crushed', 'wet', 'item', 'and', 'now', 'visit', 'bad', 'service', 'please', '3', '2', '1', 'dam', 'un', 'track', 'very', 'happy', 'thank', 'you', 'received', 'broken', 'deliver', 'del', '##aged', '##ed', '##ing', '##s', '##ly', '##er', '##ful', '##able', '##happy', '##service', '##ivr', '##y', '##ry', '##iv', '##e', '##me']);
    const STEMR = (w) => STEM[w] || w.replace(/ies$/, 'i').replace(/(ing|ed)$/, '').replace(/([^s])s$/, '$1').replace(/e$/, '');
    const LEMR = (w) => LEM[w] || (w.length > 3 && /[^s]s$/.test(w) ? w.slice(0, -1) : w);
    const REVIEWS = ['Delivery was 2 days late and the box was wet.', 'Refund has not appeared in my wallet.', 'Rider was fast and handled the parcel well.', 'The item arrived crushed and unusable.', 'Delivery late again, rider never called.'];
    let mode = 'stem';
    const ST = { lower: true, noise: true, stop: true, norm: true };
    root.innerHTML = head('Text Pipeline Lab', 'Type any customer review and switch each preprocessing step on or off. See the classic pipeline’s tokens, BERT’s WordPiece view, and TF-IDF weights on five sample reviews.', 'Put the pipeline into <b>BERT-ready</b> settings: keep stopwords, no stemming or lemmatization, and check the WordPiece output.', api.isDone()) +
      '<section class="card stack"><label class="field" for="m9in">Customer review<textarea id="m9in" rows="2">DELIVERY arrived 3 days LATE!!! Rider was polite, but box was DAMAGED. pls refund https://track.me/123 #badservice</textarea></label>' +
      '<div class="row" style="gap:8px">' + [['lower', 'Lowercase'], ['noise', 'Remove noise'], ['norm', 'Normalize slang/typos'], ['stop', 'Remove stopwords (keep negations)']].map(([k, t]) => '<label class="toggle" for="m9' + k + '"><input type="checkbox" id="m9' + k + '" checked>' + t + '</label>').join('') +
      '<div class="seg" role="group" aria-label="Word reduction"><button data-r="none">No reduction</button><button data-r="stem" class="on">Stemming</button><button data-r="lemma">Lemmatization</button></div></div>' +
      '<div class="stack" id="m9out" style="gap:12px"></div></section>' +
      '<div class="labgrid"><section class="card stack"><div class="row between"><h2 style="font-size:1.1rem">BERT’s view (WordPiece)</h2><span class="chip" id="m9ready"></span></div><div id="m9bert"></div><p class="muted" style="font-size:.85rem">A miniature vocabulary stands in for BERT’s 30,000-piece one, so splits are illustrative. Words outside it become [UNK].</p></section>' +
      '<section class="card stack"><h2 style="font-size:1.1rem">TF-IDF on five reviews</h2><label class="field" for="m9rv">Score review<select id="m9rv">' + REVIEWS.map((r, i) => '<option value="' + i + '">R' + (i + 1) + ': ' + esc(r) + '</option>').join('') + '</select></label><div class="tablebox" id="m9tf"></div><p class="muted" style="font-size:.85rem">IDF = ln(5 ÷ df). Words in many reviews ("delivery", "late") score low; distinctive words score high.</p></section></div>';
    function clean(text, st, red) {
      const stages = [];
      let t = text; if (st.lower) { t = t.toLowerCase(); stages.push(['Lowercase', t]); }
      if (st.noise) { t = t.replace(/https?:\/\/\S+/g, ' ').replace(/#/g, '').replace(/[^\p{L}\p{N}\s']/gu, ' ').replace(/\s+/g, ' ').trim(); stages.push(['Remove noise', t]); }
      let toks = t.split(/\s+/).filter(Boolean); stages.push(['Tokenize', toks]);
      if (st.norm) { toks = toks.flatMap((w) => (NORM[w.toLowerCase()] || w).split(' ')); stages.push(['Normalize', toks]); }
      if (st.stop) { toks = toks.filter((w) => NEG.has(w.toLowerCase()) || !STOP.has(w.toLowerCase())); stages.push(['Remove stopwords', toks]); }
      if (red === 'stem') { toks = toks.map((w) => STEMR(w.toLowerCase())); stages.push(['Stem (Porter-style)', toks]); }
      if (red === 'lemma') { toks = toks.map((w) => LEMR(w.toLowerCase())); stages.push(['Lemmatize', toks]); }
      return { stages, toks };
    }
    function wordpiece(w) {
      if (VOCAB.has(w)) return [w];
      const out = []; let s = 0; let first = true;
      while (s < w.length) { let e = w.length, piece = null; while (e > s) { const sub = (first ? '' : '##') + w.slice(s, e); if (VOCAB.has(sub)) { piece = sub; break; } e--; } if (!piece) return ['[UNK]']; out.push(piece); s = e; first = false; }
      return out;
    }
    function run() {
      ['lower', 'noise', 'norm', 'stop'].forEach((k) => { ST[k] = $(root, '#m9' + k).checked; });
      const txt = $(root, '#m9in').value;
      const { stages } = clean(txt, ST, mode);
      $(root, '#m9out').innerHTML = stages.map(([n, v], i) => '<div class="row" style="gap:12px;flex-wrap:nowrap;align-items:flex-start"><span class="dot cur" style="margin-top:2px">' + (i + 1) + '</span><div style="min-width:0;flex:1"><b style="font-size:.85rem">' + n + '</b><div>' + (Array.isArray(v) ? v.map((t) => '<span class="token">' + esc(t) + '</span>').join('') : '<span style="font-family:var(--f-mono);font-size:.88rem">' + esc(v) + '</span>') + '</div></div></div>').join('');
      // BERT view: lowercase + light noise cleanup only, keep order
      const bt = txt.toLowerCase().replace(/https?:\/\/\S+/g, ' ').replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean).flatMap((w) => (NORM[w] || w).split(' '));
      const pieces = ['[CLS]'].concat(bt.flatMap(wordpiece)).concat(['[SEP]']);
      $(root, '#m9bert').innerHTML = '<div>' + pieces.map((p) => '<span class="token ' + (p[0] === '[' ? 'sp' : p.startsWith('##') ? 'piece' : '') + '">' + esc(p) + '</span>').join('') + '</div><div style="margin-top:8px;font-size:.82rem"><b>attention_mask</b> <span style="font-family:var(--f-mono)">[' + pieces.map(() => 1).join(', ') + ']</span></div>';
      const ready = ST.lower && !ST.stop && mode === 'none';
      const rc = $(root, '#m9ready'); rc.textContent = ready ? 'BERT-ready settings' : 'Classic pipeline settings'; rc.className = 'chip ' + (ready ? 'green' : 'orange');
      if (ready) cleared(root, api);
      tfidf();
    }
    function tfidf() {
      const docs = REVIEWS.map((r) => clean(r, { lower: true, noise: true, norm: true, stop: true }, 'lemma').toks);
      const i = Number($(root, '#m9rv').value); const d = docs[i];
      const tf = {}; d.forEach((w) => { tf[w] = (tf[w] || 0) + 1; });
      const rows = Object.keys(tf).map((w) => { const df = docs.filter((x) => x.includes(w)).length; const idf = Math.log(5 / df); return [w, tf[w], df, idf, tf[w] * idf]; }).sort((a, b) => b[4] - a[4]);
      $(root, '#m9tf').innerHTML = '<table><thead><tr><th>Term</th><th>TF</th><th>df</th><th>IDF</th><th>TF-IDF</th></tr></thead><tbody>' + rows.map((r, k) => '<tr style="' + (k === 0 ? 'background:var(--green-soft);font-weight:700' : '') + '"><td>' + esc(r[0]) + '</td><td class="num">' + r[1] + '</td><td class="num">' + r[2] + '</td><td class="num">' + fmt(r[3], 2) + '</td><td class="num">' + fmt(r[4], 2) + '</td></tr>').join('') + '</tbody></table>';
    }
    $(root, '#m9in').addEventListener('input', run);
    ['lower', 'noise', 'norm', 'stop'].forEach((k) => $(root, '#m9' + k).addEventListener('change', run));
    $$(root, '[data-r]').forEach((b) => b.addEventListener('click', () => { mode = b.dataset.r; $$(root, '[data-r]').forEach((x) => x.classList.toggle('on', x === b)); run(); }));
    $(root, '#m9rv').addEventListener('change', tfidf);
    run();
  };
})();
