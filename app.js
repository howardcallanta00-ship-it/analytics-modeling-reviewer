/* Pipeline Analytics Reviewer: shell, progress, quiz engine, flashcards, search, tools. */
(function () {
  'use strict';
  const R = window.REVIEWER || { modules: [] };
  const MODS = R.modules.slice().sort((a, b) => a.num - b.num);
  const X = R.extras || {};
  const LABS = window.LABS || {};
  const $app = document.getElementById('app');

  /* ---------- storage ---------- */
  const KEY = 'pipeline-reviewer-v1';
  const DEFAULT_PREFS = { theme: 'system', fs: 17, depth: 'standard', python: false, feedback: 'instant', shuffle: true, examDate: '', goal: 3 };
  function blank() { return { xp: 0, days: {}, lessons: {}, labs: {}, q: {}, best: {}, cards: {}, exams: [], last: '', prefs: Object.assign({}, DEFAULT_PREFS) }; }
  let S = blank();
  try { const raw = localStorage.getItem(KEY); if (raw) { S = Object.assign(blank(), JSON.parse(raw)); S.prefs = Object.assign({}, DEFAULT_PREFS, S.prefs || {}); } } catch (e) { /* storage unavailable */ }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } updateRail(); }

  /* ---------- helpers ---------- */
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dayKey = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const today = () => dayKey(new Date());
  const fmtDate = (d) => d.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
  const two = (n) => String(n).padStart(2, '0');
  function shuffle(a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
  function act(n, xp) { const k = today(); S.days[k] = S.days[k] || { acts: 0, sessions: 0 }; S.days[k].acts += n || 1; if (xp) S.xp += xp; save(); }
  function session() { const k = today(); S.days[k] = S.days[k] || { acts: 0, sessions: 0 }; S.days[k].sessions += 1; save(); }
  function streak() { let n = 0; const d = new Date(); if (!S.days[dayKey(d)]) d.setDate(d.getDate() - 1); while (S.days[dayKey(d)] && S.days[dayKey(d)].acts > 0) { n++; d.setDate(d.getDate() - 1); } return n; }
  let toastT;
  function toast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2600); }
  const mod = (id) => MODS.find((m) => m.id === id);
  const allQuestions = () => MODS.flatMap((m) => (m.quiz || []).map((q, i) => Object.assign({ mid: m.id, qid: m.id + '-q' + i }, q)));
  const lessonsDone = (m) => (m.lessons || []).filter((_, i) => S.lessons[m.id + '-' + i]).length;
  function mastery(m) { const L = (m.lessons || []).length || 1; return Math.round(40 * lessonsDone(m) / L + (S.labs[m.id] ? 10 : 0) + 50 * (S.best[m.id] || 0) / 100); }
  const totalLessons = () => MODS.reduce((a, m) => a + m.lessons.length, 0);
  const typing = (e) => /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
  const ICON = {
    arrowR: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    arrowL: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>',
    check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>',
    x: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>'
  };

  /* ---------- rail ---------- */
  function curModuleId() { const m = (location.hash || '').match(/^#(m\d)/); return m ? m[1] : ''; }
  function updateRail() {
    const cur = curModuleId();
    document.getElementById('modlist').innerHTML = MODS.map((m) => { const p = mastery(m); return '<a href="#' + m.id + '" class="' + (m.id === cur ? 'on' : '') + (p >= 80 ? ' full' : '') + '" title="' + esc(m.title) + ' · ' + p + '% mastered"><span class="n">' + m.num + '</span><span class="t">' + esc(m.title) + '</span><span class="m"><i style="width:' + p + '%"></i></span></a>'; }).join('');
    const overall = Math.round(MODS.reduce((a, m) => a + mastery(m), 0) / (MODS.length || 1));
    document.getElementById('overallPct').textContent = overall + '% mastered';
    document.getElementById('streakVal').textContent = streak();
    document.getElementById('xpVal').textContent = S.xp.toLocaleString();
    const due = dueCards().length; document.getElementById('dueCount').textContent = due ? due + ' due' : '';
  }
  function applyPrefs() {
    const root = document.documentElement;
    if (S.prefs.theme === 'system') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', S.prefs.theme);
    root.style.setProperty('--fs', S.prefs.fs + 'px');
  }
  function closeDrawer() { document.body.classList.remove('drawer'); document.getElementById('menuBtn').setAttribute('aria-expanded', 'false'); }
  document.getElementById('menuBtn').addEventListener('click', () => { const open = document.body.classList.toggle('drawer'); document.getElementById('menuBtn').setAttribute('aria-expanded', String(open)); });
  document.getElementById('scrim').addEventListener('click', closeDrawer);

  /* ---------- router ---------- */
  let keyHandler = null;
  function route() {
    const h = (location.hash || '#home').slice(1) || 'home';
    let m;
    closeDrawer(); closePop(); stopTimer(); keyHandler = null;
    document.querySelectorAll('#nav a').forEach((a) => a.classList.toggle('on', h === a.dataset.nav || h.startsWith(a.dataset.nav + '-')));
    updateRail();
    if (h === 'home' || h === 'modules') return viewHome();
    if (h === 'cards') return viewCards();
    if (h === 'exam') return viewExamSetup();
    if (h === 'prefs') return viewPrefs();
    if (h === 'tools') return viewTools();
    if (h.startsWith('tools-')) return viewTool(h.slice(6));
    if ((m = h.match(/^(m\d)(?:-(lesson|lab|traps|quiz|cheat)(?:-(\d+))?)?$/))) {
      const md = mod(m[1]); if (!md) return viewHome();
      if (!m[2]) return viewModule(md);
      if (m[2] === 'lesson') return viewLesson(md, Number(m[3] || 0));
      if (m[2] === 'lab') return viewLab(md);
      if (m[2] === 'traps') return viewTraps(md);
      if (m[2] === 'quiz') return startQuiz({ qs: modQuestions(md), title: 'Module ' + md.num + ' check', mid: md.id, mode: 'practice' });
      if (m[2] === 'cheat') return viewCheat(md);
    }
    viewHome();
  }
  function render(html) { $app.innerHTML = html; window.scrollTo(0, 0); }
  window.addEventListener('hashchange', route);
  document.addEventListener('keydown', (e) => {
    if ((e.key === '/' && !typing(e)) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) { e.preventDefault(); openSearch(); return; }
    if (e.key === 'Escape') { closePop(); closeDrawer(); }
    if (keyHandler && !typing(e) && !e.ctrlKey && !e.metaKey && !e.altKey && !document.querySelector('.palette-back')) keyHandler(e);
  });

  /* ---------- Today ---------- */
  function nextLesson() { for (const m of MODS) for (let i = 0; i < m.lessons.length; i++) if (!S.lessons[m.id + '-' + i]) return { m, i }; return null; }
  function topicStats() {
    const t = {};
    allQuestions().forEach((q) => { const st = S.q[q.qid]; if (!st || !st.seen) return; const key = q.mid + '|' + (q.topic || 'General'); t[key] = t[key] || { mid: q.mid, topic: q.topic || 'General', seen: 0, right: 0 }; t[key].seen += st.seen; t[key].right += st.right; });
    return Object.values(t).map((x) => Object.assign(x, { acc: Math.round(100 * x.right / x.seen) }));
  }
  function pace() {
    const now = Date.now(), week = 7 * 86400000;
    const recent = Object.values(S.lessons).filter((v) => typeof v === 'number' && now - v < week).length;
    const remaining = totalLessons() - Object.keys(S.lessons).length;
    if (!remaining) return { done: true };
    if (!recent) return { none: true, remaining };
    const perDay = recent / 7; const days = Math.ceil(remaining / perDay);
    const d = new Date(); d.setDate(d.getDate() + days);
    return { perDay, days, date: d, remaining };
  }
  function plotSVG(nl) {
    const W = 720, H = 300, L = 46, Rr = 16, T = 24, B = 48;
    const n = MODS.length; const sx = (i) => L + i * (W - L - Rr) / n; const sy = (v) => H - B - v / 100 * (H - T - B);
    let g = '';
    [0, 25, 50, 75, 100].forEach((v) => { g += '<line x1="' + L + '" x2="' + (W - Rr) + '" y1="' + sy(v) + '" y2="' + sy(v) + '" style="stroke:var(--line)"/><text x="' + (L - 10) + '" y="' + (sy(v) + 4) + '" text-anchor="end" font-size="13" style="fill:var(--muted)">' + v + '%</text>'; });
    g += '<line x1="' + L + '" x2="' + (W - Rr) + '" y1="' + sy(80) + '" y2="' + sy(80) + '" style="stroke:var(--ok);stroke-width:2;stroke-dasharray:6 6"/><text x="' + (W - Rr) + '" y="' + (sy(80) - 8) + '" text-anchor="end" font-size="13" font-weight="700" style="fill:var(--ok-ink)">mastered at 80%</text>';
    const pts = MODS.map((m, i) => [sx(i + 0.5), sy(mastery(m)), m, mastery(m)]);
    g += '<polyline class="trend" points="' + pts.map((p) => p[0] + ',' + p[1]).join(' ') + '" style="fill:none;stroke:var(--blue);stroke-width:3;stroke-linejoin:round;stroke-linecap:round"/>';
    pts.forEach(([x, y, m, p]) => {
      const isNext = nl && nl.m.id === m.id; const full = p >= 80;
      g += '<a class="pt" href="#' + m.id + '" aria-label="Module ' + m.num + ', ' + esc(m.title) + ': ' + p + '% mastered"><title>' + esc(m.title) + ': ' + p + '%</title>';
      if (isNext) g += '<circle cx="' + x + '" cy="' + y + '" r="17" style="fill:var(--marker);opacity:.85"/>';
      g += '<circle class="c" cx="' + x + '" cy="' + y + '" r="8" style="fill:' + (p > 0 ? (full ? 'var(--ok)' : 'var(--blue)') : 'var(--surface)') + ';stroke:' + (full ? 'var(--ok)' : 'var(--blue)') + ';stroke-width:3;transition:r .12s"/>';
      g += '<text x="' + x + '" y="' + (y - 16 - (isNext ? 8 : 0)) + '" text-anchor="middle" font-size="13" font-weight="700" style="fill:var(--ink-2)">' + (p ? p + '%' : '') + '</text>';
      g += '<text x="' + x + '" y="' + (H - B + 22) + '" text-anchor="middle" font-size="15" font-weight="700" style="fill:' + (isNext ? 'var(--ink)' : 'var(--muted)') + '">M' + m.num + '</text>';
      if (isNext) g += '<text x="' + x + '" y="' + (H - B + 40) + '" text-anchor="middle" font-size="12" font-weight="700" style="fill:var(--ink)">up next</text>';
      g += '</a>';
    });
    return '<svg class="plot" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Mastery by module">' + g + '</svg>';
  }
  function viewHome() {
    const nl = nextLesson();
    const mastered = MODS.filter((m) => mastery(m) >= 80).length;
    const anything = Object.keys(S.lessons).length + Object.keys(S.q).length + Object.keys(S.labs).length > 0;
    const pc = pace();
    let examLine = '';
    if (S.prefs.examDate) {
      const ed = new Date(S.prefs.examDate + 'T00:00:00'); const dd = Math.ceil((ed - new Date(today() + 'T00:00:00')) / 86400000);
      examLine = dd > 0 ? 'Your exam is in ' + dd + ' day' + (dd === 1 ? '' : 's') + ' (' + fmtDate(ed) + ').' : dd === 0 ? 'Your exam is today. Do a short warm-up and trust your prep.' : '';
      if (pc.date && dd > 0 && pc.date > ed) examLine += ' At your current pace you’d finish after it, so add one lesson a day.';
    }
    let h1, lede;
    if (!anything) { h1 = 'Nine modules between you and the exam.'; lede = 'Start with Exploratory Data Analysis. The first lesson takes about five minutes, and everything you do here is saved in this browser.'; }
    else if (pc.done) { h1 = 'Every lesson is done. Now make it stick.'; lede = 'Run a mixed exam and clear your flashcards. Your weakest topics are listed below.'; }
    else {
      h1 = mastered ? 'You’ve mastered ' + mastered + ' of ' + MODS.length + ' modules.' : 'You’re ' + Object.keys(S.lessons).length + ' lessons into the course.';
      lede = pc.none ? pc.remaining + ' lessons to go. Finish one today and you’ll see your finishing date here.' : 'You’re averaging ' + (pc.perDay >= 1 ? 'about ' + Math.round(pc.perDay * 10) / 10 + ' lessons a day' : Math.round(pc.perDay * 7) + ' lessons a week') + '. At that rate you’ll finish on ' + fmtDate(pc.date) + '. (Yes, that’s an extrapolation.)';
    }
    if (examLine) lede += ' ' + examLine;
    const due = dueCards().length;
    const cta = nl ? '<a class="btn primary" href="#' + nl.m.id + '-lesson-' + nl.i + '">' + (Object.keys(S.lessons).length ? 'Continue' : 'Start') + ' with ' + esc(nl.m.lessons[nl.i].title) + '</a>' : '<a class="btn primary" href="#exam">Start a mixed exam</a>';
    const weakAll = topicStats().filter((t) => t.acc < 75).sort((a, b) => a.acc - b.acc);
    const weak = weakAll.slice(0, 5);
    const curM = nl ? nl.m : MODS[MODS.length - 1];
    const sess = (S.days[today()] || {}).sessions || 0; const goal = S.prefs.goal || 3;
    const planItems = [];
    if (nl) planItems.push(['#' + nl.m.id + '-lesson-' + nl.i, 'Read “' + nl.m.lessons[nl.i].title + '”', 'Module ' + nl.m.num + ', lesson ' + (nl.i + 1) + ' of ' + nl.m.lessons.length, 'about 6 min', false]);
    planItems.push(['#cards', due ? 'Review ' + due + ' flashcard' + (due === 1 ? '' : 's') : 'Flashcards are all caught up', due ? 'Missed quiz questions come back here' : 'New cards unlock as you study', due ? 'about ' + Math.max(1, Math.round(due * 0.25)) + ' min' : '', !due]);
    if (weak.length) planItems.push(['drill:' + weak[0].mid + '|' + weak[0].topic, 'Drill your weakest topic: ' + weak[0].topic, 'You’re at ' + weak[0].acc + '% on it', 'about 4 min', false]);
    else planItems.push(['#' + curM.id + '-quiz', 'Check yourself on Module ' + curM.num, (S.best[curM.id] ? 'Best so far ' + S.best[curM.id] + '%' : 'Not attempted yet') + ', ' + curM.quiz.length + ' questions', 'about 8 min', (S.best[curM.id] || 0) >= 80]);
    const plan = planItems.map(([href, t, s, time, ok]) => (href.startsWith('drill:') ? '<button class="pi" data-drill="' + esc(href.slice(6)) + '">' : '<a href="' + href + '">') + '<span class="box' + (ok ? ' ok' : '') + '">' + (ok ? ICON.check : '') + '</span><span><b>' + esc(t) + '</b><small>' + esc(s) + '</small></span><span class="time">' + time + '</span>' + (href.startsWith('drill:') ? '</button>' : '</a>')).join('');
    const weakHTML = weak.length ? weak.map((t) => '<button class="pi" data-drill="' + esc(t.mid + '|' + t.topic) + '"><span class="num" style="font-family:var(--f-display);font-stretch:112%;font-weight:800;color:var(--pen-ink)">' + t.acc + '%</span><span><b>' + esc(t.topic) + '</b><small>Module ' + mod(t.mid).num + ', ' + esc(mod(t.mid).short) + '</small></span><span class="time">Drill</span></button>').join('') : '<p class="muted" style="padding:14px 0;border-top:1px solid var(--line)">Topics you miss in quizzes show up here, with a one-click drill.</p>';
    const days = []; for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push(d); }
    const week = days.map((d) => { const a = (S.days[dayKey(d)] || {}).acts || 0; const lv = a === 0 ? '' : a < 5 ? 'l1' : a < 15 ? 'l2' : 'l3'; return '<div><i class="' + lv + (dayKey(d) === today() ? ' today' : '') + '" title="' + a + ' activities">' + (a || '') + '</i>' + d.toLocaleDateString(undefined, { weekday: 'narrow' }) + '</div>'; }).join('');
    const bl = badges();
    const shown = bl.filter((b) => b[2]).concat(bl.filter((b) => !b[2]).slice(0, 3));
    render(
      '<section class="today">' +
        '<p class="kicker">' + new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) + (sess ? ', ' + sess + ' of ' + goal + ' sessions done' : '') + '</p>' +
        '<h1>' + esc(h1) + '</h1><p class="lede">' + esc(lede) + '</p>' +
        '<div class="plotwrap">' + plotSVG(nl) + '</div>' +
        '<div class="cta-row">' + cta + (due ? '<a class="btn" href="#cards">Review ' + due + ' flashcards</a>' : '') + '<a class="btn link" href="#exam">or take a mixed exam</a></div>' +
      '</section>' +
      '<div class="split"><section class="main" style="gap:14px"><div class="section-head"><h2>Today’s plan</h2><span>' + sess + ' of ' + goal + ' sessions toward your daily goal</span></div><div class="plan">' + plan + '</div></section>' +
      '<section class="side" style="gap:14px"><div class="section-head"><h2>Weak spots</h2></div><div class="plan">' + weakHTML + '</div></section></div>' +
      '<section class="stack" style="gap:14px"><div class="section-head"><h2>Syllabus</h2><span>Each module runs the same pipeline with a new technique</span></div><div class="syllabus">' + MODS.map((m) => syllabusRow(m)).join('') + '</div></section>' +
      '<div class="split"><section class="main" style="gap:14px"><div class="section-head"><h2>This week</h2><span>' + streak() + '-day streak</span></div><div class="week">' + week + '</div></section>' +
      '<section class="side" style="gap:14px"><div class="section-head"><h2>Badges</h2><span>' + bl.filter((b) => b[2]).length + ' of ' + bl.length + '</span></div><div class="badges">' + shown.map((b) => '<span class="badge ' + (b[2] ? 'on' : 'off') + '"><span class="b">' + b[0] + '</span>' + esc(b[1]) + '</span>').join('') + '</div></section></div>'
    );
    $app.querySelectorAll('[data-drill]').forEach((b) => b.addEventListener('click', () => drill(b.dataset.drill)));
  }
  function drill(key) { const [mid, topic] = key.split('|'); const qs = allQuestions().filter((q) => q.mid === mid && (q.topic || 'General') === topic); startQuiz({ qs, title: 'Drill: ' + topic, mid, mode: 'practice', drill: true }); }
  function syllabusRow(m) {
    const p = mastery(m); const L = m.lessons.length; const d = lessonsDone(m);
    const pips = m.lessons.map((_, i) => '<i class="' + (S.lessons[m.id + '-' + i] ? 'on' : '') + '"></i>').join('') + '<i class="lab' + (S.labs[m.id] ? ' on' : '') + '" title="Lab"></i>';
    return '<a class="syl' + (p >= 80 ? ' mastered' : p > 0 ? ' started' : '') + '" href="#' + m.id + '"><span class="bign">' + two(m.num) + '</span><span><h3>' + esc(m.title) + '</h3><p>' + esc(m.blurb) + '</p></span>' +
      '<span class="pipcol"><span class="lbl" style="display:block">' + d + ' of ' + L + ' lessons' + (S.labs[m.id] ? ', lab done' : '') + '</span><span class="pips">' + pips + '</span></span>' +
      '<span class="mast"><b class="num">' + p + '%</b><span class="bar ' + (p >= 80 ? 'green' : '') + '"><i style="width:' + p + '%"></i></span></span></a>';
  }
  function badges() {
    const answered = Object.values(S.q).reduce((a, b) => a + (b.seen || 0), 0); const st = streak();
    const list = MODS.map((m) => ['M' + m.num, m.short + ' mastered', mastery(m) >= 80]);
    list.push(['3d', '3-day streak', st >= 3], ['7d', '7-day streak', st >= 7], ['100', '100 questions', answered >= 100], ['Lab', 'First lab cleared', Object.keys(S.labs).length > 0], ['9', 'All 9 labs', Object.keys(S.labs).length >= 9], ['80', 'Exam score 80%+', (S.exams || []).some((e) => e.pct >= 80)]);
    return list;
  }

  /* ---------- module pages ---------- */
  function modTop(m, cur) {
    const L = m.lessons.length; const p = mastery(m);
    const t = [['', 'Overview'], ['lesson-' + firstUndone(m), 'Lessons ' + lessonsDone(m) + '/' + L, 'lesson'], ['lab', 'Lab'], ['traps', 'Traps'], ['quiz', 'Check yourself'], ['cheat', 'Cheat sheet']];
    const done = { lesson: lessonsDone(m) === L, lab: !!S.labs[m.id], quiz: (S.best[m.id] || 0) >= 80 };
    return '<header class="modhead"><span class="numeral" aria-hidden="true">' + two(m.num) + '</span><span class="crumb"><span>Module ' + m.num + ' of ' + MODS.length + '</span><span>' + p + '% mastered</span>' + (S.best[m.id] ? '<span>Best quiz ' + S.best[m.id] + '%</span>' : '') + '</span><h1>' + esc(m.title) + '</h1></header>' +
      '<nav class="tabs" aria-label="Module sections">' + t.map(([k, label, alias]) => { const key = alias || k; const on = cur === key; return '<a href="#' + m.id + (k ? '-' + k : '') + '" class="' + (on ? 'on' : '') + (done[key] ? ' done' : '') + '"' + (on ? ' aria-current="page"' : '') + '>' + label + '</a>'; }).join('') + '</nav>';
  }
  function firstUndone(m) { const i = m.lessons.findIndex((_, k) => !S.lessons[m.id + '-' + k]); return i < 0 ? 0 : i; }
  const STEPS = [['Define', 'Question and target'], ['Prepare', 'Clean, encode, scale'], ['Explore', 'Plots and outliers'], ['Split', 'Train, validate, test'], ['Model', 'Fit candidates'], ['Assess', 'Metrics, residuals'], ['Report', 'Action and limits']];
  function viewModule(m) {
    S.last = m.id; save();
    render(modTop(m, '') +
      '<div class="split"><div class="main" style="gap:28px">' +
        '<p class="lead">' + m.thirty + '</p>' +
        '<p class="aside-note">' + m.analogy + '</p>' +
        '<section class="stack" style="gap:14px"><h2 class="h2">What you’ll be able to do</h2><ul class="checklist">' + m.objectives.map((o) => '<li>' + o + '</li>').join('') + '</ul></section>' +
        '<section class="stack" style="gap:18px"><h2 class="h2">Where it sits in the pipeline</h2><div class="steps">' + STEPS.map((s, i) => '<div class="' + (m.steps.includes(i + 1) ? 'on' : '') + '">' + s[0] + '<small>' + s[1] + '</small></div>').join('') + '</div><p class="muted" style="max-width:70ch">' + m.pipelineNote + '</p></section>' +
        '<div class="cta-row"><a class="btn primary" href="#' + m.id + '-lesson-' + firstUndone(m) + '">' + (lessonsDone(m) ? 'Continue lessons' : 'Start lesson 1') + '</a><a class="btn" href="#' + m.id + '-lab">Open the lab</a><a class="btn" href="#' + m.id + '-quiz">Check yourself</a></div>' +
      '</div><aside class="side">' + outline(m, -1) + keyTerms(m) + '</aside></div>');
  }
  function outline(m, cur) {
    return '<nav class="outline" aria-label="Lessons"><h2>Lessons</h2>' + m.lessons.map((l, i) => { const d = S.lessons[m.id + '-' + i]; return '<a href="#' + m.id + '-lesson-' + i + '" class="' + (i === cur ? 'cur' : '') + '"' + (i === cur ? ' aria-current="page"' : '') + '><span class="dot ' + (d ? 'done' : i === cur ? 'cur' : '') + '">' + (d ? '✓' : i + 1) + '</span>' + esc(l.title) + '</a>'; }).join('') + '</nav>';
  }
  function keyTerms(m) {
    const g = (X.glossary || []).filter((t) => t.mod === m.id); if (!g.length) return '';
    return '<section class="stack" style="gap:4px"><h2 style="font-size:1rem;margin-bottom:6px">Key terms</h2>' + g.map((t) => '<details class="more"><summary>' + esc(t.term) + '</summary><p class="muted" style="font-size:.92rem;padding:4px 0 8px">' + t.def + '</p></details>').join('') + '</section>';
  }
  function viewLesson(m, i) {
    const L = m.lessons; if (!L[i]) return viewModule(m);
    const l = L[i]; S.last = m.id + '-lesson-' + i; save();
    const depth = S.prefs.depth;
    let body = l.body;
    if (depth === 'simple' && l.simple) body = '<div class="analogy"><b>In plain words.</b> ' + l.simple + '</div>' + l.body;
    if (depth === 'exam' && l.exam) body = l.body + '<div class="formula"><span class="eyebrow">Exam detail</span><div style="font-size:1rem;line-height:1.7">' + l.exam + '</div></div>';
    const code = S.prefs.python && l.code ? l.code.map((c) => '<div class="code-wrap"><span class="eyebrow">Python: ' + esc(c.t) + '</span><pre class="code">' + esc(c.c) + '</pre></div>').join('') : '';
    const done = S.lessons[m.id + '-' + i];
    const last = i === L.length - 1;
    render(modTop(m, 'lesson') +
      '<div class="split"><article class="main reading">' +
        '<div class="row between" style="align-items:flex-end"><div class="stack" style="gap:6px"><span class="kicker">Lesson ' + (i + 1) + ' of ' + L.length + (l.slides ? ', slides ' + esc(l.slides) : '') + '</span><h1>' + esc(l.title) + '</h1></div>' +
        '<div class="row" style="gap:8px"><div class="seg" role="group" aria-label="Explanation depth">' + [['simple', 'Simple'], ['standard', 'Standard'], ['exam', 'Exam detail']].map(([k, t]) => '<button data-depth="' + k + '" class="' + (depth === k ? 'on' : '') + '" aria-pressed="' + (depth === k) + '">' + t + '</button>').join('') + '</div>' +
        (l.code ? '<button class="btn small" id="pyBtn" aria-pressed="' + !!S.prefs.python + '">' + (S.prefs.python ? 'Hide Python' : 'Show Python') + '</button>' : '') + '</div></div>' +
        '<div class="prose" id="prose">' + body + '</div>' + code +
        '<div class="lessonfoot"><a class="btn" href="#' + (i > 0 ? m.id + '-lesson-' + (i - 1) : m.id) + '">' + ICON.arrowL + (i > 0 ? 'Previous' : 'Overview') + '</a>' +
        '<span class="muted" style="font-size:.84rem"><kbd>←</kbd> <kbd>→</kbd> to move between lessons</span>' +
        '<button class="btn primary" id="doneBtn">' + (done ? (last ? 'Go to the lab' : 'Next lesson') : (last ? 'I understand this, open the lab' : 'I understand this, next lesson')) + ICON.arrowR + '</button></div>' +
      '</article><aside class="side">' + outline(m, i) + '</aside></div>');
    $app.querySelectorAll('[data-depth]').forEach((b) => b.addEventListener('click', () => { S.prefs.depth = b.dataset.depth; save(); viewLesson(m, i); }));
    const py = document.getElementById('pyBtn'); if (py) py.addEventListener('click', () => { S.prefs.python = !S.prefs.python; save(); viewLesson(m, i); });
    const next = () => { if (!S.lessons[m.id + '-' + i]) { S.lessons[m.id + '-' + i] = Date.now(); act(1, 10); session(); toast('Lesson done. +10 XP'); } location.hash = last ? m.id + '-lab' : m.id + '-lesson-' + (i + 1); };
    document.getElementById('doneBtn').addEventListener('click', next);
    keyHandler = (e) => { if (e.key === 'ArrowRight') next(); if (e.key === 'ArrowLeft') location.hash = i > 0 ? m.id + '-lesson-' + (i - 1) : m.id; };
    linkTerms(document.getElementById('prose'), m);
  }

  /* glossary popovers inside lesson text */
  let pop = null;
  function closePop() { if (pop) { pop.remove(); pop = null; } }
  function linkTerms(root, m) {
    const terms = (X.glossary || []).filter((t) => t.mod === m.id && /^[\w\s\-’'²]+$/.test(t.term)).sort((a, b) => b.term.length - a.term.length);
    const used = new Set();
    terms.forEach((t) => {
      if (used.has(t.term)) return;
      const re = new RegExp('\\b' + t.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.parentElement.closest('code, pre, .f, .term, th, mark, h4, .analogy b') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
      let n;
      while ((n = walker.nextNode())) {
        const mm = n.nodeValue.match(re); if (!mm) continue;
        const before = n.nodeValue.slice(0, mm.index), word = mm[0], after = n.nodeValue.slice(mm.index + word.length);
        const b = document.createElement('button'); b.type = 'button'; b.className = 'term'; b.textContent = word; b.dataset.term = t.term;
        const frag = document.createDocumentFragment(); frag.append(before, b, after); n.parentNode.replaceChild(frag, n);
        used.add(t.term); break;
      }
    });
    root.querySelectorAll('.term').forEach((b) => {
      const show = () => { closePop(); const t = (X.glossary || []).find((g) => g.term === b.dataset.term); if (!t) return; pop = document.createElement('div'); pop.className = 'pop'; pop.setAttribute('role', 'tooltip'); pop.innerHTML = '<b>' + esc(t.term) + '</b>' + t.def; document.body.appendChild(pop); const r = b.getBoundingClientRect(); const w = pop.offsetWidth; pop.style.left = Math.max(12, Math.min(window.scrollX + r.left, window.scrollX + document.documentElement.clientWidth - w - 12)) + 'px'; pop.style.top = (window.scrollY + r.bottom + 8) + 'px'; };
      b.addEventListener('click', (e) => { e.stopPropagation(); if (pop) closePop(); else show(); });
      b.addEventListener('mouseenter', show); b.addEventListener('mouseleave', closePop); b.addEventListener('focus', show); b.addEventListener('blur', closePop);
    });
  }
  document.addEventListener('click', () => closePop());

  function viewLab(m) {
    S.last = m.id + '-lab'; save();
    render(modTop(m, 'lab') + '<section class="lab" id="labRoot"></section>');
    const root = document.getElementById('labRoot');
    const api = { done: () => { if (!S.labs[m.id]) { S.labs[m.id] = true; act(2, 20); session(); toast('Lab challenge cleared. +20 XP'); } }, isDone: () => !!S.labs[m.id], esc };
    if (LABS[m.id]) { try { LABS[m.id](root, api); } catch (e) { root.innerHTML = '<div class="card empty">This lab could not start: ' + esc(e.message) + '. Reload the page to try again.</div>'; } }
  }
  function trapHTML(t, label) { return '<article class="trap' + (t.errata ? ' errata' : '') + '"><span class="ico" aria-hidden="true">' + (t.errata ? '✕' : '!') + '</span><div><span class="chip ' + (t.errata ? 'red' : '') + '">' + (t.errata ? 'Slide error' : 'Common mix-up') + (label || t.slide ? ', ' + esc(label || t.slide) : '') + '</span><h4>' + t.title + '</h4><p class="fix">' + t.text + '</p></div></article>'; }
  function viewTraps(m) {
    render(modTop(m, 'traps') + '<div class="pagehead"><p>The mistakes students make most in this module. Red marks are places where the slides themselves are wrong or inconsistent, with what to write instead.</p></div><div>' + m.traps.map((t) => trapHTML(t)).join('') + '</div><div class="cta-row"><a class="btn primary" href="#' + m.id + '-quiz">Check yourself on this module</a></div>');
  }
  function viewCheat(m) { render(modTop(m, 'cheat') + '<div class="cheat">' + (m.cheat || '') + '</div>'); }

  /* ---------- quiz engine ---------- */
  const modQuestions = (m) => m.quiz.map((q, i) => Object.assign({ mid: m.id, qid: m.id + '-q' + i }, q));
  let Q = null, timerId = null;
  function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }
  function startQuiz(opts) {
    let qs = opts.qs.slice();
    if (S.prefs.shuffle || opts.mode === 'exam') qs = shuffle(qs);
    qs = qs.map((q) => { if (q.type === 'num' || q.type === 'tf' || !q.options) return q; const perm = shuffle(q.options.map((_, i) => i)); return Object.assign({}, q, { options: perm.map((i) => q.options[i]), why: q.why ? perm.map((i) => q.why[i]) : q.why, answer: perm.indexOf(q.answer) }); });
    if (!qs.length) { render('<div class="card empty">No questions here yet.</div>'); return; }
    Q = { qs, i: 0, ans: [], title: opts.title, mid: opts.mid, mode: opts.mode || 'practice', drill: !!opts.drill, feedback: opts.mode === 'exam' ? 'end' : S.prefs.feedback, combo: 0, xp: 0, hint: false, ends: opts.minutes ? Date.now() + opts.minutes * 60000 : 0 };
    drawQ();
    if (Q.ends) timerId = setInterval(() => { const t = document.getElementById('qtimer'); const left = Q.ends - Date.now(); if (left <= 0) { stopTimer(); finishQuiz(); return; } if (t) t.textContent = Math.floor(left / 60000) + ':' + String(Math.floor(left / 1000) % 60).padStart(2, '0') + ' left'; }, 1000);
  }
  const optsOf = (q) => (q.type === 'tf' ? ['True', 'False'] : q.options);
  const correctText = (q) => (q.type === 'num' ? q.answer + (q.unit ? ' ' + q.unit : '') : optsOf(q)[q.answer]);
  function isRight(q, a) { if (a == null) return false; if (q.type === 'num') { const v = parseFloat(String(a).replace(/[%,\s₱$]/g, '')); return !isNaN(v) && Math.abs(v - q.answer) <= (q.tol != null ? q.tol : Math.max(0.01, Math.abs(q.answer) * 0.01)); } return a === q.answer; }
  function drawQ() {
    const q = Q.qs[Q.i]; const a = Q.ans[Q.i]; const answered = a !== undefined; const reveal = answered && Q.feedback === 'instant'; const n = Q.qs.length;
    const m = mod(q.mid);
    const dots = '<div class="qdots" style="grid-template-columns:repeat(' + Math.min(n, 40) + ',minmax(0,1fr))">' + Q.qs.slice(0, 40).map((qq, k) => { const aa = Q.ans[k]; let c = 'var(--line)'; if (k === Q.i) c = 'var(--ink)'; else if (aa !== undefined) c = Q.feedback === 'instant' ? (isRight(qq, aa) ? 'var(--ok)' : 'var(--pen)') : 'var(--blue)'; return '<i style="background:' + c + '"></i>'; }).join('') + '</div>';
    let body;
    if (q.type === 'num') {
      body = '<form id="numForm" class="row" style="align-items:flex-end"><label class="field" for="numIn" style="flex:1 1 220px">Your answer' + (q.unit ? ' (' + esc(q.unit) + ')' : '') + '<input id="numIn" type="text" inputmode="decimal" autocomplete="off" ' + (answered ? 'disabled value="' + esc(a) + '"' : '') + ' placeholder="Type a number, then press Enter"></label>' + (answered ? '' : '<button class="btn primary" type="submit">Check</button>') + '</form>';
      if (reveal) body += '<div class="qopt ' + (isRight(q, a) ? 'right' : 'wrong') + '" style="padding:14px 16px;gap:6px"><b>' + (isRight(q, a) ? 'Correct' : 'The answer is ' + esc(correctText(q))) + '</b><span style="font-size:.95rem;color:var(--ink-2)">' + q.explain + '</span></div>';
    } else {
      body = '<div class="stack" style="gap:10px">' + optsOf(q).map((o, k) => {
        let cls = 'qopt'; if (reveal) { if (k === q.answer) cls += ' right'; else if (k === a) cls += ' wrong'; } else if (answered && k === a) cls += ' picked';
        const why = reveal && q.why && q.why[k] ? '<div class="why">' + q.why[k] + '</div>' : '';
        return '<div class="' + cls + '"><button data-opt="' + k + '" ' + (answered ? 'disabled' : '') + '><span class="key">' + String.fromCharCode(65 + k) + '</span><span style="flex:1">' + o + '</span>' + (reveal && k === q.answer ? '<span class="chip green">Answer</span>' : reveal && k === a ? '<span class="chip red">Your pick</span>' : '') + '</button>' + why + '</div>';
      }).join('') + '</div>';
      if (reveal && q.explain) body += '<p style="color:var(--ink-2)">' + q.explain + '</p>';
    }
    let fb = '';
    if (answered) {
      const ok = isRight(q, a); const last = Q.i === n - 1;
      fb = Q.feedback === 'instant' ? '<div class="feedback ' + (ok ? 'ok' : 'no') + '"><div style="flex:1 1 260px"><b style="font-family:var(--f-display);font-stretch:112%;font-size:1.15rem">' + (ok ? (Q.combo >= 3 ? Q.combo + ' in a row. +10 XP' : 'Correct. +10 XP') : 'Not this time') + '</b><div style="font-size:.92rem">' + (ok ? 'Keep going.' : 'Read why above. This one is now in your flashcards.') + '</div></div><button class="btn" id="nextQ">' + (last ? 'See results' : 'Next question') + ' <kbd>Enter</kbd></button></div>'
        : '<div class="row" style="justify-content:flex-end"><button class="btn primary" id="nextQ">' + (last ? 'Finish and see results' : 'Next question') + '</button></div>';
    }
    const typeLabel = { mcq: 'Choose one', num: 'Compute it', tf: 'True or false' }[q.type || 'mcq'];
    render('<div class="quiz"><div class="qtop"><button class="iconbtn" id="quitQ" aria-label="Leave">' + ICON.x + '</button><div class="meta"><div><span>' + esc(Q.title) + (Q.mode === 'exam' ? ', exam mode' : '') + '</span><span class="num">' + (Q.i + 1) + ' / ' + n + '</span></div>' + dots + '</div>' +
      (Q.ends ? '<span class="chip indigo num" id="qtimer">…</span>' : '') + (Q.feedback === 'instant' && Q.combo > 1 ? '<span class="chip marker">' + Q.combo + ' in a row</span>' : '') + '</div>' +
      '<div class="row" style="gap:8px"><span class="chip indigo">' + typeLabel + '</span><span class="chip">Module ' + m.num + ', ' + esc(q.topic || m.short) + '</span></div>' +
      '<h1 class="qtext">' + q.q + '</h1>' + body + fb +
      (Q.mode === 'exam' || answered ? '' : '<div class="row between"><button class="btn link" id="hintBtn" aria-expanded="' + Q.hint + '">' + (Q.hint ? 'Hide hint' : 'Show a hint') + ' <kbd>H</kbd></button>' + (q.type === 'num' ? '' : '<span class="muted" style="font-size:.84rem">Press <kbd>A</kbd>–<kbd>' + String.fromCharCode(64 + optsOf(q).length) + '</kbd> to answer</span>') + '</div>' + (Q.hint ? '<p class="hintbox">' + (q.hint || 'Go back to the definition: what exactly does each term measure, and what does it divide by?') + '</p>' : '')) +
      '</div>');
    document.getElementById('quitQ').addEventListener('click', () => { stopTimer(); if (Q.ans.some((x) => x !== undefined)) finishQuiz(); else if (Q.mode === 'exam') viewExamSetup(); else location.hash = Q.mid || 'home'; });
    const hb = document.getElementById('hintBtn'); if (hb) hb.addEventListener('click', () => { Q.hint = !Q.hint; drawQ(); });
    $app.querySelectorAll('[data-opt]').forEach((b) => b.addEventListener('click', () => answer(Number(b.dataset.opt))));
    const nf = document.getElementById('numForm'); if (nf) nf.addEventListener('submit', (e) => { e.preventDefault(); const v = document.getElementById('numIn').value.trim(); if (v) answer(v); });
    const nx = document.getElementById('nextQ'); const go = () => { Q.hint = false; if (Q.i < n - 1) { Q.i++; drawQ(); } else finishQuiz(); };
    if (nx) { nx.addEventListener('click', go); nx.focus({ preventScroll: true }); }
    if (!answered) { const ni = document.getElementById('numIn'); if (ni) ni.focus(); }
    keyHandler = (e) => {
      if (answered) { if (e.key === 'Enter' && document.activeElement !== nx) { e.preventDefault(); go(); } return; }
      if (e.key.toLowerCase() === 'h' && Q.mode !== 'exam') { Q.hint = !Q.hint; drawQ(); return; }
      if (q.type !== 'num') { const k = 'abcd'.indexOf(e.key.toLowerCase()); const k2 = '1234'.indexOf(e.key); const idx = k >= 0 ? k : k2; if (idx >= 0 && idx < optsOf(q).length) answer(idx); }
    };
  }
  function answer(a) {
    const q = Q.qs[Q.i]; Q.ans[Q.i] = a; const ok = isRight(q, a);
    const st = S.q[q.qid] = S.q[q.qid] || { seen: 0, right: 0 }; st.seen++; if (ok) st.right++; st.last = ok;
    if (ok) { Q.combo++; Q.xp += 10; act(1, 10); } else { Q.combo = 0; act(1, 0); S.cards['q:' + q.qid] = { box: 0, due: Date.now(), missed: true }; }
    save(); drawQ();
  }
  function finishQuiz() {
    stopTimer(); keyHandler = null;
    const n = Q.qs.length; const right = Q.qs.filter((q, k) => isRight(q, Q.ans[k])).length; const pct = Math.round(100 * right / n);
    if (Q.mid && Q.mode === 'practice' && !Q.drill && n >= 5) S.best[Q.mid] = Math.max(S.best[Q.mid] || 0, pct);
    if (Q.mode === 'exam') S.exams.push({ at: today(), pct, n });
    session();
    const byTopic = {}; Q.qs.forEach((q, k) => { const key = 'Module ' + mod(q.mid).num + ': ' + (q.topic || mod(q.mid).short); byTopic[key] = byTopic[key] || [0, 0]; byTopic[key][1]++; if (isRight(q, Q.ans[k])) byTopic[key][0]++; });
    const missed = Q.qs.map((q, k) => [q, Q.ans[k]]).filter(([q, a]) => !isRight(q, a));
    const msg = pct >= 90 ? 'That’s exam-ready.' : pct >= 75 ? 'Solid. Tidy up the few misses below.' : pct >= 50 ? 'Good progress. The misses below are your study list.' : 'Every miss is now a flashcard. Come back to it tomorrow.';
    const prev = Q;
    const ans = (q, a) => (a === undefined ? 'skipped' : q.type === 'num' ? a : optsOf(q)[a]);
    render('<section class="stack" style="gap:16px"><p class="kicker">' + esc(Q.title) + (Q.mode === 'exam' ? ', exam results' : ', results') + '</p><div class="row" style="align-items:flex-end;gap:24px"><span class="score num">' + right + '/' + n + '</span><div class="stack" style="gap:4px;padding-bottom:8px"><b style="font-family:var(--f-display);font-stretch:112%;font-size:1.6rem">' + pct + '%</b><span class="muted">' + msg + '</span></div></div>' +
      '<div class="cta-row"><button class="btn primary" id="again">Try again</button>' + (missed.length ? '<button class="btn" id="retryMissed">Retry the ' + missed.length + ' missed</button>' : '') + '<a class="btn link" href="#home">Back to Today</a></div></section>' +
      '<section class="stack" style="gap:10px;max-width:760px"><h2 class="h2">By topic</h2>' + Object.entries(byTopic).sort((a, b) => a[1][0] / a[1][1] - b[1][0] / b[1][1]).map(([t, [r, c]]) => '<div class="row" style="gap:14px;flex-wrap:nowrap"><span style="flex:0 1 330px;min-width:0;font-weight:700;font-size:.94rem">' + esc(t) + '</span><span class="bar ' + (r / c >= .75 ? 'green' : r / c >= .5 ? '' : 'orange') + '"><i style="width:' + Math.round(100 * r / c) + '%"></i></span><span class="num muted" style="width:44px;text-align:right">' + r + '/' + c + '</span></div>').join('') + '</section>' +
      (missed.length ? '<section style="max-width:780px"><h2 class="h2" style="margin-bottom:6px">Review what you missed</h2>' + missed.map(([q, a]) => '<article class="trap"><span class="ico" aria-hidden="true">?</span><div class="stack" style="gap:8px"><p style="font-weight:700;font-size:1.05rem">' + q.q + '</p><div class="row" style="gap:6px"><span class="chip red">You: ' + esc(ans(q, a)) + '</span><span class="chip green">Answer: ' + esc(correctText(q)) + '</span></div><p class="fix">' + (q.explain || (q.why ? q.why[q.answer] : '')) + '</p></div></article>').join('') + '</section>' : ''));
    document.getElementById('again').addEventListener('click', () => startQuiz({ qs: prev.qs, title: prev.title, mid: prev.mid, mode: prev.mode, drill: prev.drill }));
    const rm = document.getElementById('retryMissed'); if (rm) rm.addEventListener('click', () => startQuiz({ qs: missed.map((x) => x[0]), title: 'Retry missed', mid: prev.mid, mode: 'practice', drill: true }));
  }

  /* ---------- exam ---------- */
  function viewExamSetup() {
    const total = allQuestions().length;
    render('<div class="pagehead"><h1>Exam mode</h1><p>A mixed test drawn evenly from the modules you choose. No hints, no answers until the end, and a topic breakdown afterward. ' + total + ' questions in the bank.</p></div>' +
      '<form id="examForm" class="stack" style="gap:24px;max-width:820px"><fieldset style="border:none;padding:0;margin:0;display:flex;flex-direction:column;gap:10px"><legend class="h2" style="font-family:var(--f-display);font-stretch:112%;font-weight:700;margin-bottom:10px">Modules</legend><div class="row" style="gap:8px">' + MODS.map((m) => '<label class="toggle" for="ex-' + m.id + '"><input type="checkbox" id="ex-' + m.id + '" value="' + m.id + '" checked>' + m.num + '. ' + esc(m.short) + '</label>').join('') + '</div></fieldset>' +
      '<div class="row" style="gap:16px;align-items:flex-end"><label class="field" for="exLen">Length<select id="exLen"><option value="10">10 questions</option><option value="20" selected>20 questions</option><option value="40">40 questions</option><option value="999">Every question</option></select></label><label class="toggle" for="exTimer"><input type="checkbox" id="exTimer">Timed, about 75 seconds a question</label></div>' +
      '<div class="cta-row"><button class="btn primary" type="submit">Start the exam</button></div></form>' +
      ((S.exams || []).length ? '<section class="stack" style="max-width:820px"><h2 class="h2">Past exams</h2><div class="plan">' + S.exams.slice(-8).reverse().map((e) => '<div class="row between" style="padding:12px 4px;border-top:1px solid var(--line)"><span>' + esc(e.at) + ', ' + e.n + ' questions</span><b class="num">' + e.pct + '%</b></div>').join('') + '</div></section>' : ''));
    document.getElementById('examForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const mids = MODS.map((m) => m.id).filter((id) => document.getElementById('ex-' + id).checked);
      if (!mids.length) { toast('Pick at least one module'); return; }
      const len = Number(document.getElementById('exLen').value);
      const pools = mids.map((id) => shuffle(modQuestions(mod(id)))); const qs = []; let k = 0;
      while (qs.length < len && pools.some((p) => p.length)) { const p = pools[k % pools.length]; if (p.length) qs.push(p.pop()); k++; }
      startQuiz({ qs, title: 'Mixed exam', mode: 'exam', minutes: document.getElementById('exTimer').checked ? Math.ceil(qs.length * 1.25) : 0 });
    });
  }

  /* ---------- flashcards ---------- */
  function allCards() {
    const list = [];
    MODS.forEach((m) => (m.cards || []).forEach((c, i) => list.push({ id: m.id + '-c' + i, mid: m.id, q: c[0], a: c[1], ex: c[2] || '' })));
    allQuestions().forEach((q) => { const id = 'q:' + q.qid; if (S.cards[id]) list.push({ id, mid: q.mid, q: q.q, a: correctText(q), ex: q.explain || (q.why ? q.why[q.answer] : ''), missed: true }); });
    return list;
  }
  const NEW_PER_DAY = 20;
  function newLeft() { const n = S.newIntro && S.newIntro.d === today() ? S.newIntro.n : 0; return Math.max(0, NEW_PER_DAY - n); }
  function dueCards(mid) {
    const now = Date.now(); const all = allCards().filter((c) => !mid || c.mid === mid);
    const review = all.filter((c) => S.cards[c.id] && S.cards[c.id].due <= now);
    const fresh = all.filter((c) => !S.cards[c.id]).slice(0, newLeft());
    return review.concat(fresh);
  }
  const DAYS = [1, 2, 4, 8, 16, 32];
  const interval = (c, r) => { const box = (S.cards[c.id] || { box: 0 }).box; const nb = Math.min(5, box + (r === 3 ? 2 : 1)); return DAYS[Math.max(0, nb - 1)] + (DAYS[Math.max(0, nb - 1)] === 1 ? ' day' : ' days'); };
  let F = { mid: '', flipped: false, n: 0 };
  function viewCards() {
    const due = dueCards(F.mid); const total = allCards().filter((c) => !F.mid || c.mid === F.mid).length;
    const filt = '<div class="seg" role="group" aria-label="Filter by module"><button data-fm="" class="' + (!F.mid ? 'on' : '') + '">All</button>' + MODS.map((m) => '<button data-fm="' + m.id + '" class="' + (F.mid === m.id ? 'on' : '') + '" title="' + esc(m.title) + '">' + m.num + '</button>').join('') + '</div>';
    let main;
    if (!due.length) main = '<div class="stack" style="gap:12px;padding:28px 0"><h2 class="h2">Nothing due' + (F.mid ? ' in this module' : '') + '.</h2><p class="muted">Cards you rate Good come back in a day or more. Missed quiz questions are added here automatically.</p><div class="cta-row"><a class="btn primary" href="#exam">Take a mixed exam</a></div></div>';
    else {
      const c = due[0]; const m = mod(c.mid);
      main = '<button class="flash' + (F.flipped ? ' back' : '') + '" id="flip" aria-label="' + (F.flipped ? 'Show question' : 'Show answer') + '"><span class="row between" style="width:100%"><span class="chip">Module ' + m.num + ', ' + esc(m.short) + (c.missed ? ', missed in a quiz' : '') + '</span><span class="hint">' + (F.flipped ? 'Answer' : 'Question') + '</span></span>' +
        (F.flipped ? '<span class="q">' + c.a + '</span><span class="a">' + c.ex + '</span>' : '<span class="q">' + c.q + '</span>') + '<span style="flex:1"></span><span class="hint">' + (F.flipped ? 'Rate it with 1–4' : 'Tap or press Space to flip') + '</span></button>' +
        (F.flipped ? '<div class="rate"><button data-rate="0">Again<small>1 min</small></button><button data-rate="1">Hard<small>10 min</small></button><button data-rate="2">Good<small>' + interval(c, 2) + '</small></button><button data-rate="3">Easy<small>' + interval(c, 3) + '</small></button></div>' : '<button class="btn accent" id="show" style="min-height:56px;font-size:1.05rem">Show answer <kbd>Space</kbd></button>');
    }
    render('<div class="pagehead"><h1>Flashcards</h1><p>' + due.length + ' due now out of ' + total + ' in this deck' + (F.n ? ', ' + F.n + ' reviewed this visit' : '') + '. New cards arrive ' + NEW_PER_DAY + ' a day. Cards you know drift further apart (1, 2, 4, 8, 16 days); cards you miss come right back.</p></div>' + filt + '<section class="stack" style="gap:14px;max-width:720px">' + main + '</section>');
    $app.querySelectorAll('[data-fm]').forEach((b) => b.addEventListener('click', () => { F.mid = b.dataset.fm; F.flipped = false; viewCards(); }));
    const fl = document.getElementById('flip'); if (fl) fl.addEventListener('click', () => { F.flipped = !F.flipped; viewCards(); });
    const sh = document.getElementById('show'); if (sh) sh.addEventListener('click', () => { F.flipped = true; viewCards(); });
    $app.querySelectorAll('[data-rate]').forEach((b) => b.addEventListener('click', () => rate(due[0], Number(b.dataset.rate))));
    keyHandler = due.length ? (e) => { if (e.key === ' ') { e.preventDefault(); F.flipped = !F.flipped; viewCards(); } else if (F.flipped && '1234'.includes(e.key)) rate(due[0], Number(e.key) - 1); } : null;
  }
  function rate(c, r) {
    if (!S.cards[c.id]) { const n = S.newIntro && S.newIntro.d === today() ? S.newIntro.n : 0; S.newIntro = { d: today(), n: n + 1 }; }
    const st = S.cards[c.id] || { box: 0, due: 0 }; const now = Date.now();
    if (r === 0) { st.box = 0; st.due = now + 60000; } else if (r === 1) st.due = now + 600000; else { st.box = Math.min(5, st.box + (r === 3 ? 2 : 1)); st.due = now + DAYS[Math.max(0, st.box - 1)] * 86400000; }
    S.cards[c.id] = st; F.flipped = false; F.n++; act(1, 2);
    if (F.n % 10 === 0) { session(); toast('10 cards reviewed. Session counted'); }
    viewCards();
  }

  /* ---------- tools ---------- */
  const TOOLS = [['compare', 'Compare and contrast', 'Side-by-side tables for the things students mix up most: metrics, methods, splits, scaling.'], ['formulas', 'Formula bank', 'Every formula in the course with each symbol explained, plus calculators for your own numbers.'], ['wizard', 'Which method do I use?', 'Answer a few questions about the data and the goal, and get the technique and module.'], ['recurring', 'Ideas that repeat', 'Leakage, baselines, splits and residuals, and how each one shows up module by module.'], ['glossary', 'Glossary', 'Every key term with a plain-language definition. Also searchable from anywhere with /.'], ['errata', 'Slide errors', 'Every place the slides contradict themselves, and what to write on the exam instead.']];
  function viewTools() { render('<div class="pagehead"><h1>Study tools</h1><p>Cross-module help for tying the course together.</p></div><div class="toollist">' + TOOLS.map(([k, t, d]) => '<a class="mcard" href="#tools-' + k + '"><h3>' + t + '</h3><p>' + d + '</p></a>').join('') + '</div>'); }
  const toolHead = (t, p) => '<div class="pagehead"><a class="btn link" href="#tools" style="align-self:flex-start;padding:0">' + ICON.arrowL + 'Study tools</a><h1>' + t + '</h1>' + (p ? '<p>' + p + '</p>' : '') + '</div>';
  function viewTool(k) {
    if (k === 'compare') return render(toolHead('Compare and contrast') + (X.compare || []).map((c) => '<section class="stack"><h2 class="h2">' + c.title + '</h2>' + (c.note ? '<p class="muted" style="max-width:72ch">' + c.note + '</p>' : '') + '<div class="tablebox">' + c.table + '</div></section>').join(''));
    if (k === 'formulas') return viewFormulas();
    if (k === 'wizard') return viewWizard('start', []);
    if (k === 'recurring') return render(toolHead('Ideas that repeat', 'The same handful of ideas appear in almost every deck. Learn them once and you’ll spot them everywhere.') + (X.recurring || []).map((r) => '<section class="stack"><h2 class="h2">' + r.name + '</h2><p style="color:var(--ink-2);max-width:70ch">' + r.desc + '</p><div class="tablebox"><table><thead><tr><th>Module</th><th>How it shows up</th></tr></thead><tbody>' + r.where.map((w) => '<tr><td style="white-space:nowrap;font-weight:700">' + w[0] + '</td><td>' + w[1] + '</td></tr>').join('') + '</tbody></table></div></section>').join(''));
    if (k === 'glossary') return viewGlossary('');
    if (k === 'errata') { const er = MODS.flatMap((m) => m.traps.filter((t) => t.errata).map((t) => Object.assign({ m }, t))); return render(toolHead('Slide errors', 'If you memorized these straight from the slides, swap in the correction. On an exam, write the correct version and briefly say why.') + '<div>' + er.map((t) => trapHTML(t, 'Module ' + t.m.num + (t.slide ? ', ' + t.slide : ''))).join('') + '</div>'); }
    viewTools();
  }
  function viewGlossary(qv) {
    const g = (X.glossary || []).slice().sort((a, b) => a.term.localeCompare(b.term));
    render(toolHead('Glossary') + '<label class="field" for="gq" style="max-width:480px">Filter terms<input id="gq" type="search" placeholder="lift, residual, centroid…" value="' + esc(qv) + '" autocomplete="off"></label><div id="glist"></div>');
    const draw = (v) => { const s = v.trim().toLowerCase(); const list = g.filter((t) => !s || t.term.toLowerCase().includes(s) || t.def.toLowerCase().includes(s)); document.getElementById('glist').innerHTML = list.length ? list.map((t) => '<div style="display:grid;grid-template-columns:minmax(160px,240px) 1fr;gap:6px 24px;padding:14px 2px;border-top:1px solid var(--line)"><div><b>' + esc(t.term) + '</b><div><a href="#' + t.mod + '" style="font-size:.84rem">Module ' + mod(t.mod).num + ', ' + esc(mod(t.mod).short) + '</a></div></div><p style="color:var(--ink-2);min-width:0">' + t.def + '</p></div>').join('') : '<p class="muted" style="padding:16px 0">No terms match “' + esc(v) + '”.</p>'; };
    const inp = document.getElementById('gq'); inp.addEventListener('input', () => draw(inp.value)); draw(qv);
  }
  function viewFormulas() {
    const F2 = X.formulas || [];
    render(toolHead('Formula bank', 'Grouped by module. Calculators update as you type.') + MODS.map((m) => { const fs = F2.filter((f) => f.mod === m.id); if (!fs.length) return ''; return '<section class="stack"><h2 class="h2">' + m.num + '. ' + esc(m.title) + '</h2><div class="grid-auto" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr))">' + fs.map((f, i) => '<div class="formula"><span class="eyebrow">' + f.name + '</span><div class="f">' + f.f + '</div><div style="font-size:.9rem;color:var(--ink-2)">' + f.vars + '</div>' + (f.calc ? calcHTML(m.id + i, f.calc) : '') + '</div>').join('') + '</div></section>'; }).join(''));
    $app.querySelectorAll('[data-calc]').forEach((box) => {
      const spec = F2.find((f) => f.calc && f.calc.id === box.dataset.calc); if (!spec) return;
      const run = () => { const vals = spec.calc.inputs.map((_, j) => parseFloat(box.querySelector('[data-i="' + j + '"]').value)); const out = box.querySelector('.out'); if (vals.some(isNaN)) { out.textContent = 'enter every value'; return; } try { out.textContent = spec.calc.fn.apply(null, vals); } catch (e) { out.textContent = 'check the inputs'; } };
      box.querySelectorAll('input').forEach((i) => i.addEventListener('input', run)); run();
    });
  }
  const calcHTML = (uid, c) => '<div data-calc="' + c.id + '" style="display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end;border-top:1px solid var(--blue-line);padding-top:10px">' + c.inputs.map((inp, j) => '<label class="field" for="c' + uid + '-' + j + '" style="font-size:.8rem;flex:1 1 90px">' + inp[0] + '<input id="c' + uid + '-' + j + '" data-i="' + j + '" type="number" step="any" value="' + inp[1] + '" style="min-height:40px;padding:6px 8px"></label>').join('') + '<div style="flex:1 1 100%;font-weight:700;font-family:var(--f-display);font-size:1.15rem">= <span class="out num"></span></div></div>';
  function viewWizard(node, path) {
    const W = X.wizard || {}; const n = W[node]; if (!n) return viewTools();
    const crumbs = path.length ? '<p class="muted">' + path.map(esc).join(' → ') + '</p>' : '';
    if (n.result) {
      render(toolHead('Which method do I use?') + crumbs + '<section class="hero stack" style="gap:12px;max-width:820px"><p class="muted">Use this</p><h2 style="font-size:clamp(1.8rem,4vw,2.6rem);font-stretch:118%">' + n.result + '</h2><p class="muted" style="font-size:1.05rem;max-width:62ch">' + n.why + '</p><div class="cta-row">' + (n.mod ? '<a class="btn accent" href="#' + n.mod + '">Study Module ' + mod(n.mod).num + '</a>' : '') + '<button class="btn ghost-dark" id="restart">Start over</button></div></section>');
      document.getElementById('restart').addEventListener('click', () => viewWizard('start', [])); return;
    }
    render(toolHead('Which method do I use?') + crumbs + '<section class="stack" style="gap:14px;max-width:780px"><h2 class="qtext">' + n.q + '</h2><div class="stack" style="gap:10px">' + n.options.map((o, i) => '<div class="qopt"><button data-w="' + i + '"><span class="key">' + String.fromCharCode(65 + i) + '</span><span style="flex:1"><b>' + o[0] + '</b>' + (o[2] ? '<br><span class="muted" style="font-size:.9rem">' + o[2] + '</span>' : '') + '</span></button></div>').join('') + '</div>' + (path.length ? '<div><button class="btn link" id="restart">Start over</button></div>' : '') + '</section>');
    $app.querySelectorAll('[data-w]').forEach((b) => b.addEventListener('click', () => { const o = n.options[Number(b.dataset.w)]; viewWizard(o[1], path.concat(o[0])); }));
    const rs = document.getElementById('restart'); if (rs) rs.addEventListener('click', () => viewWizard('start', []));
    keyHandler = (e) => { const i = 'abcd'.indexOf(e.key.toLowerCase()); if (i >= 0 && n.options[i]) viewWizard(n.options[i][1], path.concat(n.options[i][0])); };
  }

  /* ---------- prefs ---------- */
  function viewPrefs() {
    const p = S.prefs;
    const seg = (key, opts) => '<div class="seg" role="group">' + opts.map(([v, t]) => '<button data-pk="' + key + '" data-pv="' + v + '" class="' + (String(p[key]) === String(v) ? 'on' : '') + '" aria-pressed="' + (String(p[key]) === String(v)) + '">' + t + '</button>').join('') + '</div>';
    const rowp = (title, desc, ctl) => '<div class="row between" style="border-top:1px solid var(--line);padding:16px 0;gap:14px"><div style="flex:1 1 280px;min-width:0"><b>' + title + '</b><p class="muted" style="font-size:.92rem">' + desc + '</p></div>' + ctl + '</div>';
    render('<div class="pagehead"><h1>Preferences</h1><p>Saved in this browser only.</p></div><div style="max-width:880px">' +
      '<h2 class="h2" style="margin-bottom:6px">Display</h2>' + rowp('Theme', 'System follows your device.', seg('theme', [['system', 'System'], ['light', 'Light'], ['dark', 'Dark']])) + rowp('Text size', 'Scales every page.', seg('fs', [[15, 'S'], [17, 'M'], [19, 'L'], [21, 'XL']])) +
      '<h2 class="h2" style="margin:26px 0 6px">Learning</h2>' + rowp('Explanation depth', 'Simple adds a plain-words summary; Exam detail adds derivations and fine print.', seg('depth', [['simple', 'Simple'], ['standard', 'Standard'], ['exam', 'Exam detail']])) +
        rowp('Python code in lessons', 'The sklearn, pandas and transformers snippets from the slides.', seg('python', [[false, 'Hide'], [true, 'Show']])) +
        rowp('Quiz feedback', 'Instant shows the answer after each question; End waits for the results.', seg('feedback', [['instant', 'Instant'], ['end', 'At the end']])) +
        rowp('Shuffle questions', 'Mix up the question order each time.', seg('shuffle', [[true, 'On'], [false, 'Off']])) +
        rowp('Daily goal', 'Sessions per day. A finished lesson, lab, quiz or 10 flashcards each count as one.', seg('goal', [[2, '2'], [3, '3'], [4, '4'], [6, '6']])) +
        rowp('Exam date', 'Adds a countdown and pace check to Today.', '<input id="examDate" type="date" value="' + esc(p.examDate) + '" aria-label="Exam date">') +
      '<h2 class="h2" style="margin:26px 0 6px">Reset</h2>' + rowp('Reset all progress', 'Clears XP, streak, lessons, quiz history and the flashcard schedule. Preferences stay.', '<div class="row" id="resetRow"><button class="btn" id="reset1">Reset progress</button></div>') +
      '<h2 class="h2" style="margin:26px 0 6px">Keyboard</h2><p class="muted" style="line-height:2"><kbd>/</kbd> search &emsp; <kbd>←</kbd> <kbd>→</kbd> lessons &emsp; <kbd>A</kbd>–<kbd>D</kbd> answer &emsp; <kbd>Enter</kbd> next question &emsp; <kbd>H</kbd> hint &emsp; <kbd>Space</kbd> flip card &emsp; <kbd>1</kbd>–<kbd>4</kbd> rate card</p></div>');
    $app.querySelectorAll('[data-pk]').forEach((b) => b.addEventListener('click', () => { let v = b.dataset.pv; if (v === 'true') v = true; else if (v === 'false') v = false; else if (/^\d+$/.test(v)) v = Number(v); S.prefs[b.dataset.pk] = v; save(); applyPrefs(); viewPrefs(); }));
    document.getElementById('examDate').addEventListener('change', (e) => { S.prefs.examDate = e.target.value; save(); toast('Exam date saved'); });
    document.getElementById('reset1').addEventListener('click', () => {
      document.getElementById('resetRow').innerHTML = '<span style="font-weight:700">This can’t be undone.</span><button class="btn" id="reset2" style="border-color:var(--pen);color:var(--pen-ink)">Reset everything</button><button class="btn" id="resetNo">Keep my progress</button>';
      document.getElementById('reset2').addEventListener('click', () => { const prefs = S.prefs; S = blank(); S.prefs = prefs; save(); toast('Progress reset'); viewPrefs(); });
      document.getElementById('resetNo').addEventListener('click', viewPrefs);
    });
  }

  /* ---------- search ---------- */
  let INDEX = null;
  function buildIndex() {
    const it = [];
    MODS.forEach((m) => {
      it.push({ t: m.title, d: m.blurb, k: 'Module ' + m.num, h: '#' + m.id, s: m.title + ' ' + m.blurb + ' ' + m.short });
      m.lessons.forEach((l, i) => it.push({ t: l.title, d: 'Lesson ' + (i + 1) + ' in ' + m.title, k: 'Lesson', h: '#' + m.id + '-lesson-' + i, s: l.title + ' ' + m.title + ' ' + (l.body || '').replace(/<[^>]+>/g, ' ') }));
      it.push({ t: m.short + ' lab', d: 'Interactive lab for Module ' + m.num, k: 'Lab', h: '#' + m.id + '-lab', s: 'lab ' + m.title });
      it.push({ t: 'Module ' + m.num + ' quiz', d: m.quiz.length + ' questions on ' + m.title, k: 'Quiz', h: '#' + m.id + '-quiz', s: 'quiz test check ' + m.title });
    });
    (X.glossary || []).forEach((g) => it.push({ t: g.term, d: g.def, k: 'Term', h: '#' + g.mod, s: g.term + ' ' + g.def }));
    (X.formulas || []).forEach((f) => it.push({ t: f.name, d: f.f, k: 'Formula', h: '#tools-formulas', s: f.name + ' formula ' + f.f }));
    TOOLS.forEach(([k, t, d]) => it.push({ t, d, k: 'Tool', h: '#tools-' + k, s: t + ' ' + d }));
    [['Flashcards', '#cards'], ['Exam mode', '#exam'], ['Preferences', '#prefs'], ['Today', '#home']].forEach(([t, h]) => it.push({ t, d: '', k: 'Page', h, s: t }));
    return it.map((x) => Object.assign(x, { lt: x.t.toLowerCase(), ls: x.s.toLowerCase() }));
  }
  function openSearch() {
    if (document.querySelector('.palette-back')) return;
    INDEX = INDEX || buildIndex();
    const back = document.createElement('div'); back.className = 'palette-back';
    back.innerHTML = '<div class="palette" role="dialog" aria-modal="true" aria-label="Search"><input type="search" id="pq" placeholder="Search lessons, terms, formulas…" autocomplete="off" aria-label="Search"><ul id="pr" role="listbox"></ul><div class="foot"><span><kbd>↑</kbd> <kbd>↓</kbd> move</span><span><kbd>Enter</kbd> open</span><span><kbd>Esc</kbd> close</span></div></div>';
    document.body.appendChild(back);
    const inp = back.querySelector('#pq'), ul = back.querySelector('#pr'); let res = [], sel = 0;
    const close = () => back.remove();
    const draw = () => {
      const q = inp.value.trim().toLowerCase(); const words = q.split(/\s+/).filter(Boolean);
      res = !words.length ? INDEX.filter((x) => x.k === 'Module') : INDEX.filter((x) => words.every((w) => x.ls.includes(w))).map((x) => Object.assign({ sc: (x.lt.startsWith(q) ? 0 : x.lt.includes(q) ? 1 : 2) + (x.k === 'Term' ? -0.5 : 0) }, x)).sort((a, b) => a.sc - b.sc).slice(0, 30);
      sel = Math.min(sel, Math.max(0, res.length - 1));
      ul.innerHTML = res.length ? res.map((x, i) => '<li><a href="' + x.h + '" class="' + (i === sel ? 'sel' : '') + '" role="option" aria-selected="' + (i === sel) + '"><span><b>' + esc(x.t) + '</b><span class="d">' + esc(x.d.length > 110 ? x.d.slice(0, 110) + '…' : x.d) + '</span></span><small>' + x.k + '</small></a></li>').join('') : '<li class="muted" style="padding:14px">Nothing matches “' + esc(inp.value) + '”. Try a shorter word.</li>';
      ul.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
      const s = ul.querySelector('.sel'); if (s) s.scrollIntoView({ block: 'nearest' });
    };
    inp.addEventListener('input', () => { sel = 0; draw(); });
    inp.addEventListener('keydown', (e) => { if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(res.length - 1, sel + 1); draw(); } else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); draw(); } else if (e.key === 'Enter' && res[sel]) { e.preventDefault(); location.hash = res[sel].h.slice(1); close(); } else if (e.key === 'Escape') close(); });
    back.addEventListener('click', (e) => { if (e.target === back) close(); });
    draw(); inp.focus();
  }
  document.getElementById('searchBtn').addEventListener('click', openSearch);
  document.getElementById('searchBtnM').addEventListener('click', openSearch);

  /* ---------- boot ---------- */
  applyPrefs();
  route();
})();
