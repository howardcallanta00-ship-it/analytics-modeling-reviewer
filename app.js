/* Pipeline Analytics Reviewer: app shell, progress, quiz engine, flashcards, tools. */
(function () {
  'use strict';
  const R = window.REVIEWER || { modules: [] };
  const MODS = R.modules.slice().sort((a, b) => a.num - b.num);
  const X = R.extras || {};
  const LABS = window.LABS || {};
  const $app = document.getElementById('app');

  /* ---------- storage ---------- */
  const KEY = 'pipeline-reviewer-v1';
  const DEFAULT_PREFS = { theme: 'system', fs: 16, depth: 'standard', python: false, feedback: 'instant', shuffle: true, examDate: '', goal: 3 };
  function blank() { return { xp: 0, days: {}, lessons: {}, labs: {}, q: {}, best: {}, cards: {}, exams: [], last: '', prefs: Object.assign({}, DEFAULT_PREFS) }; }
  let S = blank();
  try { const raw = localStorage.getItem(KEY); if (raw) { S = Object.assign(blank(), JSON.parse(raw)); S.prefs = Object.assign({}, DEFAULT_PREFS, S.prefs || {}); } } catch (e) { /* storage unavailable */ }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } updateTop(); }

  /* ---------- helpers ---------- */
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const today = () => dayKey(new Date());
  function dayKey(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function shuffle(a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
  function act(n, xp) {
    const k = today();
    S.days[k] = S.days[k] || { acts: 0, sessions: 0 };
    S.days[k].acts += n || 1;
    if (xp) S.xp += xp;
    save();
  }
  function session() { const k = today(); S.days[k] = S.days[k] || { acts: 0, sessions: 0 }; S.days[k].sessions += 1; save(); }
  function streak() {
    let n = 0; const d = new Date();
    if (!S.days[dayKey(d)]) d.setDate(d.getDate() - 1);
    while (S.days[dayKey(d)] && S.days[dayKey(d)].acts > 0) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  let toastT;
  function toast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2600); }
  const mod = (id) => MODS.find((m) => m.id === id);
  const allQuestions = () => MODS.flatMap((m) => (m.quiz || []).map((q, i) => Object.assign({ mid: m.id, qid: m.id + '-q' + i }, q)));
  function mastery(m) {
    const L = (m.lessons || []).length || 1;
    const done = (m.lessons || []).filter((_, i) => S.lessons[m.id + '-' + i]).length;
    return Math.round(40 * done / L + (S.labs[m.id] ? 10 : 0) + 50 * (S.best[m.id] || 0) / 100);
  }
  function lessonsDone(m) { return (m.lessons || []).filter((_, i) => S.lessons[m.id + '-' + i]).length; }
  const ICON = {
    flame: '<svg width="16" height="16" viewBox="0 0 24 24" fill="#F2792E" aria-hidden="true"><path d="M12 2c1 4 5 5.5 5 10.5A5 5 0 0 1 7 12.5C7 10 8.5 8.5 9.5 7c.3 2 1.3 3 2.5 3.5C11.5 7 12 4.5 12 2z"/></svg>',
    bolt: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></svg>',
    arrow: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    back: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>',
    warn: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#15172B" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>',
    check: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>'
  };

  function updateTop() {
    document.getElementById('streakPill').innerHTML = ICON.flame + streak() + '-day streak';
    document.getElementById('xpPill').innerHTML = ICON.bolt + S.xp.toLocaleString() + ' XP';
  }
  function applyPrefs() {
    const root = document.documentElement;
    if (S.prefs.theme === 'system') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', S.prefs.theme);
    root.style.setProperty('--fs', S.prefs.fs + 'px');
  }

  /* ---------- router ---------- */
  function route() {
    const h = (location.hash || '#home').slice(1) || 'home';
    let m;
    document.querySelectorAll('#nav a').forEach((a) => a.classList.toggle('on', h === a.dataset.nav || h.startsWith(a.dataset.nav + '-') || (a.dataset.nav === 'modules' && /^m\d/.test(h))));
    stopTimer();
    if (h === 'home') return viewHome();
    if (h === 'modules') return viewModules();
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
      if (m[2] === 'quiz') return startQuiz({ qs: modQuestions(md), title: md.short + ' · Check yourself', mid: md.id, mode: 'practice' });
      if (m[2] === 'cheat') return viewCheat(md);
    }
    viewHome();
  }
  function render(html) { $app.innerHTML = html; window.scrollTo(0, 0); }
  window.addEventListener('hashchange', route);

  /* ---------- home ---------- */
  const STEPS = [['Define', 'Business question and target'], ['Prepare', 'Clean, encode, scale'], ['Explore', 'Plots, patterns, outliers'], ['Split', 'Train · validate · test'], ['Model', 'Fit candidate methods'], ['Assess', 'Metrics and residuals'], ['Report', 'Action and limits']];
  function pipelineHTML(on) {
    return '<div class="pipeline">' + STEPS.map((s, i) => '<div class="pstep' + ((on || []).includes(i + 1) ? ' on' : '') + '"><b>STEP ' + (i + 1) + '</b><span>' + s[0] + '</span><small>' + s[1] + '</small></div>').join('') + '</div>';
  }
  function nextLesson() {
    for (const m of MODS) { for (let i = 0; i < (m.lessons || []).length; i++) if (!S.lessons[m.id + '-' + i]) return { m, i }; }
    return null;
  }
  function moduleCard(m, isNext) {
    const p = mastery(m);
    let st = ['Not started', 'var(--muted)', '', 'chip'];
    if (p >= 80) st = ['Mastered', 'var(--green-ink)', 'green', 'chip green'];
    else if (p > 0) st = ['In progress', 'var(--indigo-ink)', '', 'chip indigo'];
    if (isNext && p < 80) st = ['Up next', 'var(--orange-ink)', 'orange', 'chip orange'];
    return '<a class="mcard' + (isNext ? ' next' : '') + '" href="#' + m.id + '">' +
      '<div class="row between"><span class="' + st[3] + '">M' + m.num + '</span><span style="font-size:.78rem;font-weight:600;color:' + st[1] + '">' + st[0] + '</span></div>' +
      '<h3>' + esc(m.title) + '</h3><p>' + esc(m.blurb) + '</p>' +
      '<div class="row" style="gap:10px"><div class="bar ' + st[2] + '"><i style="width:' + p + '%"></i></div><b class="num" style="font-size:.85rem">' + p + '%</b></div></a>';
  }
  function ring(done, goal, label) {
    const r = 70, c = 2 * Math.PI * r, f = Math.min(1, goal ? done / goal : 0);
    return '<svg class="ring" width="160" height="160" viewBox="0 0 168 168" role="img" aria-label="' + done + ' of ' + goal + ' ' + (label || 'sessions today') + '">' +
      '<circle cx="84" cy="84" r="70" fill="none" style="stroke:var(--hero-2)" stroke-width="16"/>' +
      '<circle cx="84" cy="84" r="70" fill="none" stroke="#FF9A5A" stroke-width="16" stroke-linecap="round" stroke-dasharray="' + (c * f).toFixed(1) + ' ' + c.toFixed(1) + '" transform="rotate(-90 84 84)"/>' +
      '<text x="84" y="82" text-anchor="middle" font-size="40" font-weight="700" fill="#FFFFFF">' + Math.min(done, 999) + '</text>' +
      '<text x="84" y="106" text-anchor="middle" font-size="13" style="fill:var(--hero-muted)" font-family="Inter, sans-serif">of ' + goal + ' ' + (label || 'sessions today') + '</text></svg>';
  }
  function topicStats() {
    const qs = allQuestions(); const t = {};
    qs.forEach((q) => { const st = S.q[q.qid]; if (!st || !st.seen) return; const key = q.mid + '|' + (q.topic || 'General'); t[key] = t[key] || { mid: q.mid, topic: q.topic || 'General', seen: 0, right: 0 }; t[key].seen += st.seen; t[key].right += st.right; });
    return Object.values(t).map((x) => Object.assign(x, { acc: Math.round(100 * x.right / x.seen) }));
  }
  function badges() {
    const answered = Object.values(S.q).reduce((a, b) => a + (b.seen || 0), 0);
    const st = streak();
    const list = MODS.map((m) => ['M' + m.num, m.short + ' cleared', mastery(m) >= 80]);
    list.push(['3d', '3-day streak', st >= 3], ['7d', '7-day streak', st >= 7], ['100', '100 questions', answered >= 100], ['Lab', 'First lab', Object.keys(S.labs).length > 0], ['9', 'All 9 labs', Object.keys(S.labs).length >= 9], ['A+', 'Exam 80%+', (S.exams || []).some((e) => e.pct >= 80)]);
    return list;
  }
  function viewHome() {
    const nl = nextLesson();
    const sess = (S.days[today()] || {}).sessions || 0;
    const goal = S.prefs.goal || 3;
    let countdown = '<a href="#prefs" style="color:var(--orange-hi)">Set your exam date</a> to get a countdown';
    if (S.prefs.examDate) {
      const d = Math.ceil((new Date(S.prefs.examDate + 'T00:00:00') - new Date(today() + 'T00:00:00')) / 86400000);
      countdown = d > 0 ? 'Exam in ' + d + ' day' + (d === 1 ? '' : 's') : (d === 0 ? 'Exam day. You’ve got this' : 'Exam date has passed');
    }
    const overall = Math.round(MODS.reduce((a, m) => a + mastery(m), 0) / (MODS.length || 1));
    const started = MODS.filter((m) => mastery(m) > 0).length;
    const hr = new Date().getHours();
    const greet = hr < 12 ? 'Good morning.' : hr < 18 ? 'Good afternoon.' : 'Good evening.';
    let headline, sub, cta;
    if (!nl) { headline = greet + ' Every lesson is done.'; sub = 'Now lock it in: take a mixed exam and clear your flashcards.'; cta = '<a class="btn accent" href="#exam">Start a mixed exam ' + ICON.arrow + '</a>'; }
    else {
      const left = nl.m.lessons.length - lessonsDone(nl.m);
      headline = greet + ' ' + (left === 1 ? 'One more lesson' : left + ' lessons') + ' and Module ' + nl.m.num + ' is yours.';
      sub = 'Up next: <strong style="color:#fff">' + esc(nl.m.lessons[nl.i].title) + '</strong> in ' + esc(nl.m.title) + '.';
      cta = '<a class="btn accent" href="#' + nl.m.id + '-lesson-' + nl.i + '">Continue: M' + nl.m.num + ' · ' + esc(nl.m.lessons[nl.i].title) + ' ' + ICON.arrow + '</a>';
    }
    const ts = topicStats().filter((t) => t.acc < 75).sort((a, b) => a.acc - b.acc).slice(0, 5);
    const weak = ts.length ? ts.map((t) => '<div class="row" style="gap:12px;padding:8px 0;border-top:1px solid var(--line-2);flex-wrap:nowrap"><span class="num" style="width:46px;height:46px;border-radius:12px;background:var(--orange-soft);color:var(--orange-ink);font-weight:700;display:grid;place-items:center;flex-shrink:0">' + t.acc + '%</span><div style="flex:1;min-width:0"><div style="font-weight:600;font-size:.9rem">' + esc(t.topic) + '</div><div class="muted" style="font-size:.78rem">M' + mod(t.mid).num + ' · ' + esc(mod(t.mid).short) + '</div></div><button class="btn small" data-drill="' + esc(t.mid + '|' + t.topic) + '">Drill</button></div>').join('')
      : '<p class="muted" style="font-size:.9rem">Answer a few quiz questions and the topics you miss most will show up here.</p>';
    const days = []; for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push(d); }
    const maxA = Math.max(5, ...days.map((d) => (S.days[dayKey(d)] || {}).acts || 0));
    const week = days.map((d) => { const a = (S.days[dayKey(d)] || {}).acts || 0; const isT = dayKey(d) === today(); return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;justify-content:flex-end;height:120px"><div title="' + a + ' activities" style="width:100%;border-radius:6px 6px 2px 2px;background:' + (isT ? 'var(--orange)' : a ? 'var(--indigo)' : 'var(--line)') + ';height:' + Math.max(4, Math.round(96 * a / maxA)) + 'px"></div><span class="muted" style="font-size:.72rem">' + d.toLocaleDateString(undefined, { weekday: 'short' }) + '</span></div>'; }).join('');
    const totalWeek = days.reduce((a, d) => a + ((S.days[dayKey(d)] || {}).acts || 0), 0);
    const bl = badges();
    render(
      '<section class="hero split" style="align-items:center">' +
        '<div class="main" style="gap:14px"><span class="eyebrow">' + countdown + '</span>' +
        '<h1 style="font-size:clamp(1.9rem,4vw,2.7rem)">' + headline + '</h1>' +
        '<p class="muted" style="font-size:1.05rem;max-width:62ch">' + sub + '</p>' +
        '<div class="row">' + cta + '<a class="btn ghost-dark" href="#cards">Review flashcards (' + dueCards().length + ' due)</a></div></div>' +
        '<div class="side" style="align-items:center;gap:8px">' + ring(sess, goal) + '<span class="muted" style="font-size:.9rem">' + (sess >= goal ? 'Goal reached. Nice work today.' : (goal - sess) + ' more to hit today’s goal') + '</span></div>' +
      '</section>' +
      '<section class="stack"><div class="section-head"><h2>The pipeline every module follows</h2><span class="muted" style="font-size:.9rem">Learn it once, reuse it nine times</span></div>' + pipelineHTML() + '</section>' +
      '<div class="split"><section class="main" style="gap:14px"><div class="section-head"><h2>Your modules</h2><span class="muted" style="font-size:.9rem">Overall mastery <strong style="color:var(--ink)">' + overall + '%</strong> · ' + started + ' of ' + MODS.length + ' started</span></div>' +
        '<div class="grid-auto">' + MODS.map((m) => moduleCard(m, nl && nl.m.id === m.id)).join('') + '</div></section>' +
        '<aside class="side">' +
          '<section class="card stack"><h2 style="font-size:1.15rem">Fix your weak spots</h2>' + weak + '</section>' +
          '<section class="card stack"><div class="row between"><h2 style="font-size:1.15rem">This week</h2><span class="muted num" style="font-size:.85rem">' + totalWeek + ' activities</span></div><div style="display:flex;align-items:flex-end;gap:8px;height:120px" role="img" aria-label="Study activities per day this week">' + week + '</div></section>' +
          '<section class="card stack"><div class="row between"><h2 style="font-size:1.15rem">Badges</h2><span class="muted" style="font-size:.85rem">' + bl.filter((b) => b[2]).length + ' of ' + bl.length + '</span></div><div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px">' + bl.map((b) => '<div class="badge"><div class="b ' + (b[2] ? 'on' : 'off') + '">' + b[0] + '</div><small>' + esc(b[1]) + '</small></div>').join('') + '</div></section>' +
        '</aside></div>'
    );
    $app.querySelectorAll('[data-drill]').forEach((b) => b.addEventListener('click', () => {
      const [mid, topic] = b.dataset.drill.split('|');
      const qs = allQuestions().filter((q) => q.mid === mid && (q.topic || 'General') === topic);
      startQuiz({ qs, title: 'Drill · ' + topic, mid, mode: 'practice' });
    }));
  }

  function viewModules() {
    const nl = nextLesson();
    render('<div class="stack"><h1 style="font-size:2rem">All modules</h1><p class="muted">Each module walks the same pipeline with a new technique. Pick any one; your progress is kept.</p></div>' + pipelineHTML() + '<div class="grid-auto">' + MODS.map((m) => moduleCard(m, nl && nl.m.id === m.id)).join('') + '</div>');
  }

  /* ---------- module pages ---------- */
  function tabs(m, cur) {
    const L = (m.lessons || []).length;
    const t = [['', 'Overview', '1'], ['lesson-0', 'Lessons ' + lessonsDone(m) + '/' + L, '2'], ['lab', 'Lab', '3'], ['traps', 'Traps', '4'], ['quiz', 'Check yourself', '5'], ['cheat', 'Cheat sheet', '6']];
    return '<nav class="tabs" aria-label="Module sections">' + t.map(([k, label, n]) => {
      const on = cur === k || (k === 'lesson-0' && cur === 'lesson');
      const done = (k === 'lesson-0' && lessonsDone(m) === L) || (k === 'lab' && S.labs[m.id]) || (k === 'quiz' && (S.best[m.id] || 0) >= 80);
      return '<a href="#' + m.id + (k ? '-' + k : '') + '" class="' + (on ? 'on' : done ? 'done' : '') + '"><small>' + n + '</small>' + label + '</a>';
    }).join('') + '</nav>';
  }
  function modHeader(m) {
    const p = mastery(m);
    return '<div class="row between" style="gap:12px"><div class="row" style="gap:10px"><a class="btn small" href="#modules">' + ICON.back + 'Modules</a><span class="muted" style="font-size:.9rem">Module ' + m.num + '</span></div>' +
      '<div class="row" style="gap:10px;min-width:220px;flex:0 1 320px"><div class="bar orange"><i style="width:' + p + '%"></i></div><b class="num" style="font-size:.85rem">' + p + '% mastered</b></div></div>';
  }
  function viewModule(m) {
    S.last = m.id; save();
    render(modHeader(m) + tabs(m, '') +
      '<div class="split"><div class="main">' +
        '<section class="hero stack" style="gap:12px"><span class="eyebrow">The 30-second version</span><h1 style="font-size:clamp(1.7rem,3.4vw,2.3rem)">' + esc(m.title) + '</h1>' +
        '<p style="font-family:var(--f-display);font-size:1.3rem;line-height:1.4;font-weight:600">' + m.thirty + '</p>' +
        '<p class="muted" style="font-size:1rem">' + m.analogy + '</p></section>' +
        '<section class="card stack"><h2 style="font-size:1.2rem">By the end you can</h2><ul class="prose" style="padding-left:1.2em;margin:0">' + (m.objectives || []).map((o) => '<li>' + o + '</li>').join('') + '</ul></section>' +
        '<section class="stack"><h2 style="font-size:1.2rem">Where this module sits in the pipeline</h2>' + pipelineHTML(m.steps) + '<p class="muted" style="font-size:.92rem">' + (m.pipelineNote || '') + '</p></section>' +
        '<div class="row"><a class="btn primary" href="#' + m.id + '-lesson-' + firstUndone(m) + '">' + (lessonsDone(m) ? 'Continue lessons' : 'Start lesson 1') + ' ' + ICON.arrow + '</a><a class="btn" href="#' + m.id + '-lab">Open the lab</a><a class="btn" href="#' + m.id + '-quiz">Test yourself</a></div>' +
      '</div><aside class="side">' + outline(m, -1) + keyTerms(m) + '</aside></div>');
  }
  function firstUndone(m) { const i = (m.lessons || []).findIndex((_, k) => !S.lessons[m.id + '-' + k]); return i < 0 ? 0 : i; }
  function outline(m, cur) {
    return '<section class="card outline" style="display:flex;flex-direction:column;gap:2px"><h2 style="font-size:1.05rem;margin-bottom:8px">Lessons in this module</h2>' +
      (m.lessons || []).map((l, i) => { const d = S.lessons[m.id + '-' + i]; return '<a href="#' + m.id + '-lesson-' + i + '" class="' + (i === cur ? 'cur' : '') + '"><span class="dot ' + (d ? 'done' : i === cur ? 'cur' : '') + '">' + (d ? '✓' : i + 1) + '</span>' + esc(l.title) + '</a>'; }).join('') + '</section>';
  }
  function keyTerms(m) {
    const g = (X.glossary || []).filter((t) => t.mod === m.id);
    if (!g.length) return '';
    return '<section class="card stack"><h2 style="font-size:1.05rem">Key terms</h2>' + g.map((t) => '<details class="more" style="padding:8px 12px"><summary style="font-size:.9rem">' + esc(t.term) + '</summary><p style="font-size:.88rem;margin-top:6px" class="muted">' + t.def + '</p></details>').join('') + '</section>';
  }
  function viewLesson(m, i) {
    const L = m.lessons || []; if (!L[i]) return viewModule(m);
    const l = L[i]; S.last = m.id + '-lesson-' + i; save();
    const depth = S.prefs.depth;
    let body = l.body;
    if (depth === 'simple' && l.simple) body = '<div class="analogy"><strong>In plain words:</strong> ' + l.simple + '</div>' + l.body;
    if (depth === 'exam' && l.exam) body = l.body + '<div class="formula" style="background:var(--surface-2);border-color:var(--line)"><span class="eyebrow" style="color:var(--ink-2)">Exam detail</span><div style="font-size:.98rem;line-height:1.65">' + l.exam + '</div></div>';
    if (depth === 'simple' && !l.simple) body = l.body;
    const code = S.prefs.python && l.code ? l.code.map((c) => '<div class="code-wrap"><span class="eyebrow">Python · ' + esc(c.t) + '</span><pre class="code">' + esc(c.c) + '</pre></div>').join('') : '';
    const codeHint = !S.prefs.python && l.code ? '<p class="muted" style="font-size:.85rem">This lesson has Python examples. Turn on <a href="#prefs">Show Python code</a> to see them.</p>' : '';
    const done = S.lessons[m.id + '-' + i];
    render(modHeader(m) + tabs(m, 'lesson') +
      '<div class="split"><article class="main"><section class="card stack" style="padding:clamp(18px,3vw,30px);gap:18px">' +
        '<div class="row between"><div class="stack" style="gap:4px"><span class="muted" style="font-size:.85rem;font-weight:600">Lesson ' + (i + 1) + ' of ' + L.length + (l.slides ? ' · slides ' + esc(l.slides) : '') + '</span><h1 style="font-size:clamp(1.7rem,3.2vw,2.2rem)">' + esc(l.title) + '</h1></div>' +
        '<div class="seg" role="group" aria-label="Explanation depth">' + [['simple', 'Simple'], ['standard', 'Standard'], ['exam', 'Exam-detail']].map(([k, t]) => '<button data-depth="' + k + '" class="' + (depth === k ? 'on' : '') + '" aria-pressed="' + (depth === k) + '">' + t + '</button>').join('') + '</div></div>' +
        '<div class="prose">' + body + '</div>' + code + codeHint +
      '</section>' +
      '<div class="row between"><a class="btn" href="#' + (i > 0 ? m.id + '-lesson-' + (i - 1) : m.id) + '">' + ICON.back + (i > 0 ? 'Previous lesson' : 'Overview') + '</a>' +
      '<button class="btn primary" id="doneBtn">' + (i < L.length - 1 ? (done ? 'Next lesson' : 'Got it · next lesson (+10 XP)') : (done ? 'Go to the lab' : 'Got it · open the lab (+10 XP)')) + ' ' + ICON.arrow + '</button></div>' +
      '</article><aside class="side">' + outline(m, i) + keyTerms(m) + '</aside></div>');
    $app.querySelectorAll('[data-depth]').forEach((b) => b.addEventListener('click', () => { S.prefs.depth = b.dataset.depth; save(); viewLesson(m, i); }));
    document.getElementById('doneBtn').addEventListener('click', () => {
      if (!S.lessons[m.id + '-' + i]) { S.lessons[m.id + '-' + i] = true; act(1, 10); session(); toast('+10 XP · lesson complete'); }
      location.hash = i < L.length - 1 ? m.id + '-lesson-' + (i + 1) : m.id + '-lab';
    });
  }
  function viewLab(m) {
    S.last = m.id + '-lab'; save();
    render(modHeader(m) + tabs(m, 'lab') + '<section class="lab" id="labRoot"></section>');
    const root = document.getElementById('labRoot');
    const api = {
      done: (msg) => { if (!S.labs[m.id]) { S.labs[m.id] = true; act(2, 20); session(); toast('Lab challenge cleared · +20 XP'); } else if (msg) toast(msg); },
      isDone: () => !!S.labs[m.id], esc
    };
    if (LABS[m.id]) { try { LABS[m.id](root, api); } catch (e) { root.innerHTML = '<div class="card empty">This lab could not start. ' + esc(e.message) + '</div>'; } }
    else root.innerHTML = '<div class="card empty">Lab coming soon.</div>';
  }
  function viewTraps(m) {
    render(modHeader(m) + tabs(m, 'traps') + '<div class="stack"><h1 style="font-size:1.8rem">Traps &amp; mix-ups</h1><p class="muted" style="max-width:70ch">The mistakes students make most in this module. Red cards mark places where the slides themselves are wrong or inconsistent.</p></div><div class="stack">' +
      (m.traps || []).map((t) => trapHTML(t)).join('') + '</div>' +
      '<div class="row"><a class="btn primary" href="#' + m.id + '-quiz">Test yourself on this module ' + ICON.arrow + '</a></div>');
  }
  function trapHTML(t) { return '<div class="trap' + (t.errata ? ' errata' : '') + '"><span class="ico">' + ICON.warn + '</span><div><span class="chip ' + (t.errata ? 'red' : 'orange') + '" style="margin-bottom:6px">' + (t.errata ? 'Slide error' : 'Common mix-up') + (t.slide ? ' · ' + esc(t.slide) : '') + '</span><h4>' + t.title + '</h4><p style="font-size:.95rem;line-height:1.6;color:var(--ink-2)">' + t.text + '</p></div></div>'; }
  function viewCheat(m) {
    render(modHeader(m) + tabs(m, 'cheat') + '<div class="row between"><h1 style="font-size:1.8rem">M' + m.num + ' cheat sheet</h1><span class="muted" style="font-size:.9rem">Everything on one page</span></div><div class="cheat">' + (m.cheat || '') + '</div>');
  }

  /* ---------- quiz engine ---------- */
  function modQuestions(m) { return (m.quiz || []).map((q, i) => Object.assign({ mid: m.id, qid: m.id + '-q' + i }, q)); }
  let Q = null, timerId = null;
  function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }
  function startQuiz(opts) {
    let qs = opts.qs.slice();
    if (S.prefs.shuffle) qs = shuffle(qs);
    if (opts.limit) qs = qs.slice(0, opts.limit);
    // shuffle answer options so the correct letter can't be guessed from position
    qs = qs.map((q) => {
      if (q.type === 'num' || q.type === 'tf' || !q.options) return q;
      const perm = shuffle(q.options.map((_, i) => i));
      return Object.assign({}, q, { options: perm.map((i) => q.options[i]), why: q.why ? perm.map((i) => q.why[i]) : q.why, answer: perm.indexOf(q.answer) });
    });
    if (!qs.length) { render('<div class="card empty">No questions here yet.</div>'); return; }
    Q = { qs, i: 0, ans: [], title: opts.title, mid: opts.mid, mode: opts.mode || 'practice', feedback: opts.mode === 'exam' ? 'end' : S.prefs.feedback, combo: 0, xp: 0, hint: false, ends: opts.minutes ? Date.now() + opts.minutes * 60000 : 0, mods: opts.mods };
    drawQ();
    if (Q.ends) { timerId = setInterval(() => { const t = document.getElementById('qtimer'); const left = Q.ends - Date.now(); if (left <= 0) { stopTimer(); finishQuiz(); return; } if (t) t.textContent = Math.floor(left / 60000) + ':' + String(Math.floor(left / 1000) % 60).padStart(2, '0'); }, 1000); }
  }
  function correctText(q) { return q.type === 'num' ? (q.answer + (q.unit ? ' ' + q.unit : '')) : q.options[q.answer]; }
  function isRight(q, a) {
    if (a == null) return false;
    if (q.type === 'num') { const v = parseFloat(String(a).replace(/[%,\s₱$]/g, '')); return !isNaN(v) && Math.abs(v - q.answer) <= (q.tol != null ? q.tol : Math.max(0.01, Math.abs(q.answer) * 0.01)); }
    return a === q.answer;
  }
  function drawQ() {
    const q = Q.qs[Q.i]; const a = Q.ans[Q.i]; const answered = a !== undefined; const reveal = answered && Q.feedback === 'instant';
    const n = Q.qs.length;
    const dots = '<div class="qdots" style="grid-template-columns:repeat(' + Math.min(n, 40) + ',minmax(0,1fr))">' + Q.qs.slice(0, 40).map((qq, k) => { const aa = Q.ans[k]; let c = 'var(--line)'; if (k === Q.i) c = 'var(--orange)'; else if (aa !== undefined) c = Q.feedback === 'instant' ? (isRight(qq, aa) ? 'var(--green)' : 'var(--red)') : 'var(--indigo)'; return '<i style="background:' + c + '"></i>'; }).join('') + '</div>';
    let body = '';
    const typeLabel = { mcq: 'Multiple choice', num: 'Compute it', tf: 'True or false' }[q.type || 'mcq'] || 'Question';
    if (q.type === 'num') {
      body = '<form id="numForm" class="row" style="align-items:flex-end"><label class="field" for="numIn" style="flex:1 1 220px">Your answer' + (q.unit ? ' (' + esc(q.unit) + ')' : '') + '<input id="numIn" type="text" inputmode="decimal" autocomplete="off" ' + (answered ? 'disabled value="' + esc(a) + '"' : '') + ' placeholder="Type a number"></label>' + (answered ? '' : '<button class="btn primary" type="submit">Check answer</button>') + '</form>';
      if (reveal) body += '<div class="qopt ' + (isRight(q, a) ? 'right' : 'wrong') + '" style="padding:14px 16px;gap:6px"><strong>' + (isRight(q, a) ? 'Correct' : 'Answer: ' + esc(correctText(q))) + '</strong><span style="font-size:.92rem;color:var(--ink-2)">' + q.explain + '</span></div>';
    } else {
      const opts = q.type === 'tf' ? ['True', 'False'] : q.options;
      body = '<div class="stack" style="gap:10px">' + opts.map((o, k) => {
        let cls = 'qopt';
        if (reveal) { if (k === q.answer) cls += ' right'; else if (k === a) cls += ' wrong'; }
        else if (answered && k === a) cls += ' picked';
        const why = reveal && q.why && q.why[k] ? '<div class="why">' + q.why[k] + '</div>' : '';
        return '<div class="' + cls + '"><button data-opt="' + k + '" ' + (answered ? 'disabled' : '') + '><span class="key">' + String.fromCharCode(65 + k) + '</span><span style="flex:1;font-weight:600">' + o + '</span>' + (reveal && k === q.answer ? '<span class="chip green">Correct answer</span>' : reveal && k === a ? '<span class="chip red">Your pick</span>' : '') + '</button>' + why + '</div>';
      }).join('') + '</div>';
      if (reveal && q.explain) body += '<p style="font-size:.95rem;color:var(--ink-2)">' + q.explain + '</p>';
    }
    let fb = '';
    if (answered) {
      const ok = isRight(q, a); const last = Q.i === n - 1;
      if (Q.feedback === 'instant') fb = '<div class="feedback ' + (ok ? 'ok' : 'no') + '"><div style="flex:1 1 260px"><div style="font-family:var(--f-display);font-weight:700;font-size:1.2rem">' + (ok ? (Q.combo >= 3 ? 'Combo ×' + Q.combo + '! +10 XP' : 'Correct. +10 XP') : 'Not quite, and that’s useful') + '</div><div style="font-size:.9rem">' + (ok ? 'Keep the streak going.' : 'Read why above. This question is now in your flashcards.') + '</div></div><button class="btn" id="nextQ">' + (last ? 'See results' : 'Next question') + ' ' + ICON.arrow + '</button></div>';
      else fb = '<div class="row" style="justify-content:flex-end"><button class="btn primary" id="nextQ">' + (last ? 'Finish and see results' : 'Next question') + ' ' + ICON.arrow + '</button></div>';
    }
    const m = mod(q.mid);
    render('<header class="row" style="gap:14px;flex-wrap:wrap"><button class="iconbtn" id="quitQ" aria-label="Leave quiz"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
      '<div style="flex:1 1 260px;display:flex;flex-direction:column;gap:6px;min-width:0"><div class="row between" style="font-size:.85rem;font-weight:600"><span>' + esc(Q.title) + (Q.mode === 'exam' ? ' · Exam mode' : ' · Practice') + '</span><span class="num">Question ' + (Q.i + 1) + ' of ' + n + '</span></div>' + dots + '</div>' +
      (Q.ends ? '<span class="pill xp num" id="qtimer">--:--</span>' : '') + (Q.feedback === 'instant' ? '<span class="pill streak">' + ICON.flame + 'Combo ×' + Q.combo + '</span>' : '') + '</header>' +
      '<div class="split"><section class="main" style="gap:16px"><div class="row" style="gap:8px"><span class="chip indigo">' + typeLabel + '</span><span class="chip">M' + m.num + ' · ' + esc(q.topic || m.short) + '</span></div>' +
      '<h1 style="font-size:clamp(1.25rem,2.4vw,1.6rem);line-height:1.4;font-weight:600">' + q.q + '</h1>' + body + fb + '</section>' +
      '<aside class="side"><section class="card stack"><div class="row between"><h2 style="font-size:1.05rem">Need a nudge?</h2>' + (Q.mode === 'exam' ? '<span class="muted" style="font-size:.78rem">Hints off in exam mode</span>' : '') + '</div>' +
      (Q.mode === 'exam' ? '<p class="muted" style="font-size:.88rem">Answer from memory. You’ll see every explanation at the end.</p>' : '<button class="btn" id="hintBtn" aria-expanded="' + Q.hint + '">' + (Q.hint ? 'Hide hint' : 'Show a hint') + '</button>' + (Q.hint ? '<div class="formula"><div style="font-size:.95rem">' + (q.hint || 'Go back to the definition: what exactly does each term measure?') + '</div></div>' : '')) + '</section>' +
      '<section class="card stack"><h2 style="font-size:1.05rem">This round</h2><div class="kpis"><div class="kpi"><b class="num" style="color:var(--green-ink)">' + Q.ans.filter((x, k) => x !== undefined && isRight(Q.qs[k], x)).length + '</b><small>correct</small></div><div class="kpi"><b class="num">' + Q.ans.filter((x) => x !== undefined).length + '/' + n + '</b><small>answered</small></div><div class="kpi"><b class="num" style="color:var(--indigo-ink)">' + Q.xp + '</b><small>XP</small></div></div><p class="muted" style="font-size:.82rem">Missed questions are added to your flashcards automatically.</p></section></aside></div>');
    document.getElementById('quitQ').addEventListener('click', () => { stopTimer(); if (Q.ans.some((x) => x !== undefined)) finishQuiz(); else if (Q.mode === 'exam') viewExamSetup(); else location.hash = Q.mid || 'home'; });
    const hb = document.getElementById('hintBtn'); if (hb) hb.addEventListener('click', () => { Q.hint = !Q.hint; drawQ(); });
    $app.querySelectorAll('[data-opt]').forEach((b) => b.addEventListener('click', () => answer(Number(b.dataset.opt))));
    const nf = document.getElementById('numForm'); if (nf) nf.addEventListener('submit', (e) => { e.preventDefault(); const v = document.getElementById('numIn').value.trim(); if (v) answer(v); });
    const nx = document.getElementById('nextQ'); if (nx) { nx.addEventListener('click', () => { Q.hint = false; if (Q.i < n - 1) { Q.i++; drawQ(); } else finishQuiz(); }); nx.focus(); }
    if (!answered) { const ni = document.getElementById('numIn'); if (ni) ni.focus(); }
  }
  function answer(a) {
    const q = Q.qs[Q.i]; Q.ans[Q.i] = a; const ok = isRight(q, a);
    const st = S.q[q.qid] = S.q[q.qid] || { seen: 0, right: 0 };
    st.seen++; if (ok) st.right++; st.last = ok;
    if (ok) { Q.combo++; Q.xp += 10; act(1, 10); }
    else { Q.combo = 0; act(1, 0); addMissedCard(q); }
    save(); drawQ();
  }
  function addMissedCard(q) {
    const id = 'q:' + q.qid;
    S.cards[id] = { box: 0, due: Date.now(), missed: true };
  }
  function finishQuiz() {
    stopTimer();
    const n = Q.qs.length; const right = Q.qs.filter((q, k) => isRight(q, Q.ans[k])).length; const pct = Math.round(100 * right / n);
    if (Q.mid && Q.mode === 'practice' && n >= 5 && Q.title.indexOf('Drill') !== 0) S.best[Q.mid] = Math.max(S.best[Q.mid] || 0, pct);
    if (Q.mode === 'exam') S.exams.push({ at: today(), pct, n });
    session();
    const byTopic = {};
    Q.qs.forEach((q, k) => { const key = 'M' + mod(q.mid).num + ' · ' + (q.topic || mod(q.mid).short); byTopic[key] = byTopic[key] || [0, 0]; byTopic[key][1]++; if (isRight(q, Q.ans[k])) byTopic[key][0]++; });
    const missed = Q.qs.map((q, k) => [q, Q.ans[k]]).filter(([q, a]) => !isRight(q, a));
    const msg = pct >= 90 ? 'Outstanding.' : pct >= 75 ? 'Solid work.' : pct >= 50 ? 'Good progress. The misses below are your study list.' : 'Every miss here is now a flashcard. Run it again tomorrow.';
    render('<section class="hero split" style="align-items:center"><div class="main" style="gap:10px"><span class="eyebrow">' + esc(Q.title) + (Q.mode === 'exam' ? ' · Exam results' : ' · Results') + '</span><h1 style="font-size:clamp(2rem,4vw,2.8rem)">' + right + ' of ' + n + ' correct · ' + pct + '%</h1><p class="muted" style="font-size:1.05rem">' + msg + '</p><div class="row"><button class="btn accent" id="again">Try again</button>' + (missed.length ? '<button class="btn ghost-dark" id="retryMissed">Retry the ' + missed.length + ' missed</button>' : '') + '<a class="btn ghost-dark" href="#home">Home</a></div></div>' +
      '<div class="side" style="align-items:center">' + ring(right, n, 'correct') + '</div></section>' +
      '<section class="card stack"><h2 style="font-size:1.2rem">By topic</h2>' + Object.entries(byTopic).sort((a, b) => a[1][0] / a[1][1] - b[1][0] / b[1][1]).map(([t, [r, c]]) => '<div class="row" style="gap:12px;flex-wrap:nowrap"><span style="flex:0 1 320px;min-width:0;font-size:.9rem;font-weight:600">' + esc(t) + '</span><div class="bar ' + (r / c >= .75 ? 'green' : r / c >= .5 ? '' : 'orange') + '"><i style="width:' + Math.round(100 * r / c) + '%"></i></div><span class="num" style="font-size:.85rem;width:48px;text-align:right">' + r + '/' + c + '</span></div>').join('') + '</section>' +
      (missed.length ? '<section class="stack"><h2 style="font-size:1.2rem">Review what you missed</h2>' + missed.map(([q, a]) => '<div class="card stack" style="gap:8px"><span class="chip">M' + mod(q.mid).num + ' · ' + esc(q.topic || '') + '</span><p style="font-weight:600">' + q.q + '</p><p style="font-size:.92rem"><span class="chip red">You: ' + esc(a === undefined ? 'skipped' : q.type === 'num' ? a : (q.type === 'tf' ? ['True', 'False'][a] : q.options[a])) + '</span> <span class="chip green">Answer: ' + esc(q.type === 'tf' ? ['True', 'False'][q.answer] : correctText(q)) + '</span></p><p style="font-size:.92rem;color:var(--ink-2)">' + (q.explain || (q.why ? q.why[q.answer] : '')) + '</p></div>').join('') + '</section>' : ''));
    const prev = Q;
    document.getElementById('again').addEventListener('click', () => startQuiz({ qs: prev.qs, title: prev.title, mid: prev.mid, mode: prev.mode }));
    const rm = document.getElementById('retryMissed'); if (rm) rm.addEventListener('click', () => startQuiz({ qs: missed.map((x) => x[0]), title: 'Retry missed', mid: prev.mid, mode: 'practice' }));
  }

  /* ---------- exam ---------- */
  function viewExamSetup() {
    const total = allQuestions().length;
    render('<section class="hero stack" style="gap:12px"><span class="eyebrow">Exam mode</span><h1 style="font-size:clamp(1.8rem,3.6vw,2.5rem)">A mixed test from every module, scored at the end.</h1><p class="muted" style="max-width:64ch">No hints and no instant feedback, just like the real thing. You’ll get a topic-by-topic breakdown and every explanation afterward. ' + total + ' questions in the bank.</p></section>' +
      '<form id="examForm" class="card stack" style="gap:18px"><fieldset style="border:none;padding:0;margin:0;display:flex;flex-direction:column;gap:10px"><legend style="font-weight:700;margin-bottom:8px">Modules to include</legend><div class="row" style="gap:8px">' + MODS.map((m) => '<label class="toggle" for="ex-' + m.id + '"><input type="checkbox" id="ex-' + m.id + '" value="' + m.id + '" checked>M' + m.num + ' ' + esc(m.short) + '</label>').join('') + '</div></fieldset>' +
      '<div class="row" style="gap:18px;align-items:flex-end"><label class="field" for="exLen">Number of questions<select id="exLen"><option value="10">10 questions</option><option value="20" selected>20 questions</option><option value="40">40 questions</option><option value="999">All available</option></select></label>' +
      '<label class="toggle" for="exTimer"><input type="checkbox" id="exTimer">Timed (about 1 min 15 s per question)</label></div>' +
      '<div class="row"><button class="btn primary" type="submit">Start the exam ' + ICON.arrow + '</button></div></form>' +
      ((S.exams || []).length ? '<section class="card stack"><h2 style="font-size:1.15rem">Past exams</h2>' + S.exams.slice(-8).reverse().map((e) => '<div class="row between" style="border-top:1px solid var(--line-2);padding-top:8px"><span>' + esc(e.at) + ' · ' + e.n + ' questions</span><b class="num">' + e.pct + '%</b></div>').join('') + '</section>' : ''));
    document.getElementById('examForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const mids = MODS.map((m) => m.id).filter((id) => document.getElementById('ex-' + id).checked);
      if (!mids.length) { toast('Pick at least one module'); return; }
      const len = Number(document.getElementById('exLen').value);
      // spread questions evenly across chosen modules
      const pools = mids.map((id) => shuffle(modQuestions(mod(id))));
      const qs = []; let k = 0; while (qs.length < len && pools.some((p) => p.length)) { const p = pools[k % pools.length]; if (p.length) qs.push(p.pop()); k++; }
      const timed = document.getElementById('exTimer').checked;
      const prevShuffle = S.prefs.shuffle; S.prefs.shuffle = true;
      startQuiz({ qs, title: 'Mixed exam', mode: 'exam', minutes: timed ? Math.ceil(qs.length * 1.25) : 0 });
      S.prefs.shuffle = prevShuffle;
    });
  }

  /* ---------- flashcards ---------- */
  function allCards() {
    const list = [];
    MODS.forEach((m) => (m.cards || []).forEach((c, i) => list.push({ id: m.id + '-c' + i, mid: m.id, q: c[0], a: c[1], ex: c[2] || '' })));
    allQuestions().forEach((q) => { const id = 'q:' + q.qid; if (S.cards[id]) list.push({ id, mid: q.mid, q: q.q, a: q.type === 'tf' ? ['True', 'False'][q.answer] : correctText(q), ex: q.explain || (q.why ? q.why[q.answer] : ''), missed: true }); });
    return list;
  }
  function dueCards(mid) { const now = Date.now(); return allCards().filter((c) => (!mid || c.mid === mid) && (!S.cards[c.id] || S.cards[c.id].due <= now)); }
  let F = { mid: '', flipped: false, n: 0 };
  function viewCards() {
    const due = dueCards(F.mid);
    const total = allCards().filter((c) => !F.mid || c.mid === F.mid).length;
    const filt = '<div class="row" style="gap:8px"><button class="btn small' + (!F.mid ? ' primary' : '') + '" data-fm="">All modules</button>' + MODS.map((m) => '<button class="btn small' + (F.mid === m.id ? ' primary' : '') + '" data-fm="' + m.id + '">M' + m.num + '</button>').join('') + '</div>';
    let main;
    if (!due.length) main = '<div class="card empty stack" style="align-items:center"><span style="color:var(--green)">' + ICON.check + '</span><h2 style="font-size:1.4rem;color:var(--ink)">All caught up</h2><p>No cards due' + (F.mid ? ' in this module' : '') + '. Cards you rate "Good" come back in a day or more.</p><a class="btn primary" href="#exam">Take a mixed exam instead</a></div>';
    else {
      const c = due[0]; const m = mod(c.mid);
      main = '<button class="flash' + (F.flipped ? ' back' : '') + '" id="flip" aria-label="' + (F.flipped ? 'Show question' : 'Show answer') + '"><div class="row between" style="width:100%"><span class="chip indigo">M' + m.num + ' · ' + esc(m.short) + (c.missed ? ' · missed in a quiz' : '') + '</span><span class="muted" style="font-size:.8rem;font-weight:600">' + (F.flipped ? 'Answer' : 'Question') + '</span></div>' +
        (F.flipped ? '<span class="q" style="font-size:1.35rem;font-weight:700">' + c.a + '</span><span style="font-size:1rem;line-height:1.6;color:var(--ink-2)">' + c.ex + '</span>' : '<span class="q">' + c.q + '</span>') +
        '<span style="flex:1"></span><span class="muted" style="font-size:.82rem">Tap the card to ' + (F.flipped ? 'see the question again' : 'flip') + '</span></button>' +
        (F.flipped ? '<div class="rate"><button data-rate="0" style="background:#C2410C">Again<small>1 min</small></button><button data-rate="1" style="background:#3A3D5C">Hard<small>10 min</small></button><button data-rate="2" style="background:#3D3BD4">Good<small>' + interval(c, 2) + '</small></button><button data-rate="3" style="background:#1F8A55">Easy<small>' + interval(c, 3) + '</small></button></div>' : '<button class="btn accent" id="show" style="min-height:58px;font-size:1.05rem">Show answer</button>');
    }
    render('<div class="row between"><div class="stack" style="gap:4px"><h1 style="font-size:2rem">Flashcards</h1><p class="muted">' + due.length + ' due now · ' + total + ' in this deck · ' + F.n + ' reviewed this visit</p></div>' + filt + '</div>' +
      '<div class="split"><section class="main" style="max-width:760px">' + main + '</section><aside class="side"><section class="card stack"><h2 style="font-size:1.05rem">How the deck works</h2><p class="muted" style="font-size:.9rem">Cards you know drift further apart (1, 2, 4, 8, 16 days). Cards you miss come right back. Every quiz question you get wrong joins the deck automatically.</p></section></aside></div>');
    $app.querySelectorAll('[data-fm]').forEach((b) => b.addEventListener('click', () => { F.mid = b.dataset.fm; F.flipped = false; viewCards(); }));
    const fl = document.getElementById('flip'); if (fl) fl.addEventListener('click', () => { F.flipped = !F.flipped; viewCards(); });
    const sh = document.getElementById('show'); if (sh) sh.addEventListener('click', () => { F.flipped = true; viewCards(); });
    $app.querySelectorAll('[data-rate]').forEach((b) => b.addEventListener('click', () => rate(due[0], Number(b.dataset.rate))));
  }
  const DAYS = [1, 2, 4, 8, 16, 32];
  function interval(c, r) { const box = (S.cards[c.id] || { box: 0 }).box; const nb = Math.min(5, box + (r === 3 ? 2 : 1)); return DAYS[nb - 1 < 0 ? 0 : nb - 1] + ' d'; }
  function rate(c, r) {
    const st = S.cards[c.id] || { box: 0, due: 0 };
    const now = Date.now();
    if (r === 0) { st.box = 0; st.due = now + 60000; }
    else if (r === 1) { st.due = now + 600000; }
    else { st.box = Math.min(5, st.box + (r === 3 ? 2 : 1)); st.due = now + DAYS[Math.max(0, st.box - 1)] * 86400000; }
    S.cards[c.id] = st; F.flipped = false; F.n++;
    act(1, 2);
    if (F.n % 10 === 0) { session(); toast('10 cards reviewed · session counted'); }
    viewCards();
  }

  /* ---------- tools ---------- */
  const TOOLS = [
    ['compare', 'Compare & contrast', 'Side-by-side tables for the things students mix up most.'],
    ['formulas', 'Formula bank', 'Every formula in the course, each symbol explained, with a calculator.'],
    ['wizard', 'Which method do I use?', 'Answer a few questions about the data and goal; get the technique.'],
    ['recurring', 'Ideas that repeat', 'Leakage, baselines, splits, residuals: how each shows up across modules.'],
    ['glossary', 'Glossary', 'Search every key term with its plain-language definition.'],
    ['errata', 'Slide errors', 'Every place the slides contradict themselves, and what to write instead.']
  ];
  function viewTools() {
    render('<div class="stack"><h1 style="font-size:2rem">Study tools</h1><p class="muted">Cross-module help for connecting everything together.</p></div><div class="grid-auto">' + TOOLS.map(([k, t, d]) => '<a class="mcard" href="#tools-' + k + '"><h3>' + t + '</h3><p>' + d + '</p><span style="color:var(--indigo);font-weight:600;font-size:.9rem;display:inline-flex;gap:6px;align-items:center">Open ' + ICON.arrow + '</span></a>').join('') + '</div>');
  }
  function toolHead(t) { return '<div class="row" style="gap:10px"><a class="btn small" href="#tools">' + ICON.back + 'Study tools</a></div><h1 style="font-size:2rem">' + t + '</h1>'; }
  function viewTool(k) {
    if (k === 'compare') return render(toolHead('Compare & contrast') + (X.compare || []).map((c) => '<section class="stack"><h2 style="font-size:1.25rem">' + c.title + '</h2>' + (c.note ? '<p class="muted" style="max-width:72ch">' + c.note + '</p>' : '') + '<div class="tablebox">' + c.table + '</div></section>').join(''));
    if (k === 'formulas') return viewFormulas();
    if (k === 'wizard') return viewWizard('start', []);
    if (k === 'recurring') return render(toolHead('Ideas that repeat across modules') + '<p class="muted" style="max-width:72ch">The same handful of ideas appear in almost every deck. Learn them once here and you’ll recognize them everywhere.</p>' + (X.recurring || []).map((r) => '<section class="card stack"><h2 style="font-size:1.2rem">' + r.name + '</h2><p style="color:var(--ink-2)">' + r.desc + '</p><div class="tablebox"><table><thead><tr><th>Module</th><th>How it shows up</th></tr></thead><tbody>' + r.where.map((w) => '<tr><td style="white-space:nowrap;font-weight:600">' + w[0] + '</td><td>' + w[1] + '</td></tr>').join('') + '</tbody></table></div></section>').join(''));
    if (k === 'glossary') return viewGlossary('');
    if (k === 'errata') { const er = MODS.flatMap((m) => (m.traps || []).filter((t) => t.errata).map((t) => Object.assign({ m }, t))); return render(toolHead('Slide errors and inconsistencies') + '<p class="muted" style="max-width:72ch">If you memorized these straight from the slides, swap in the correction. When in doubt on an exam, write the correct version and briefly note why.</p><div class="stack">' + er.map((t) => trapHTML(Object.assign({}, t, { slide: 'M' + t.m.num + (t.slide ? ' ' + t.slide : '') }))).join('') + '</div>'); }
    viewTools();
  }
  function viewGlossary(qv) {
    const g = (X.glossary || []).slice().sort((a, b) => a.term.localeCompare(b.term));
    render(toolHead('Glossary') + '<label class="field" for="gq" style="max-width:480px">Search terms<input id="gq" type="text" placeholder="e.g. lift, residual, centroid" value="' + esc(qv) + '" autocomplete="off"></label><div class="stack" id="glist"></div>');
    const draw = (v) => { const s = v.trim().toLowerCase(); const list = g.filter((t) => !s || t.term.toLowerCase().includes(s) || t.def.toLowerCase().includes(s)); document.getElementById('glist').innerHTML = list.length ? list.map((t) => '<div class="card" style="padding:14px 18px;display:flex;flex-wrap:wrap;gap:6px 16px"><div style="flex:0 1 220px;min-width:0"><b>' + esc(t.term) + '</b><div><a class="chip" href="#' + t.mod + '" style="text-decoration:none;margin-top:4px">M' + mod(t.mod).num + ' · ' + esc(mod(t.mod).short) + '</a></div></div><p style="flex:1 1 320px;min-width:0;color:var(--ink-2);font-size:.95rem">' + t.def + '</p></div>').join('') : '<div class="card empty">No terms match "' + esc(v) + '".</div>'; };
    const inp = document.getElementById('gq'); inp.addEventListener('input', () => draw(inp.value)); draw(qv);
  }
  function viewFormulas() {
    const F2 = X.formulas || [];
    render(toolHead('Formula bank') + '<p class="muted" style="max-width:72ch">Grouped by module. Calculators work with your own numbers.</p>' +
      MODS.map((m) => { const fs = F2.filter((f) => f.mod === m.id); if (!fs.length) return ''; return '<section class="stack"><h2 style="font-size:1.2rem">M' + m.num + ' · ' + esc(m.title) + '</h2><div class="grid-auto" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr))">' + fs.map((f, i) => '<div class="formula"><span class="eyebrow">' + f.name + '</span><div class="f">' + f.f + '</div><div style="font-size:.88rem;color:var(--ink-2)">' + f.vars + '</div>' + (f.calc ? calcHTML(m.id + i, f.calc) : '') + '</div>').join('') + '</div></section>'; }).join(''));
    $app.querySelectorAll('[data-calc]').forEach((box) => {
      const spec = F2.filter((f) => f.calc).find((f) => box.dataset.calc === f.calc.id);
      if (!spec) return;
      const run = () => { const vals = spec.calc.inputs.map((inp, j) => parseFloat(box.querySelector('[data-i="' + j + '"]').value)); const out = box.querySelector('.out'); if (vals.some(isNaN)) { out.textContent = 'Enter all values'; return; } try { out.textContent = spec.calc.fn.apply(null, vals); } catch (e) { out.textContent = 'Check the inputs'; } };
      box.querySelectorAll('input').forEach((i) => i.addEventListener('input', run)); run();
    });
  }
  function calcHTML(uid, c) { return '<div data-calc="' + c.id + '" style="display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end;border-top:1px solid var(--indigo-line);padding-top:10px">' + c.inputs.map((inp, j) => '<label class="field" for="c' + uid + '-' + j + '" style="font-size:.78rem;flex:1 1 90px">' + inp[0] + '<input id="c' + uid + '-' + j + '" data-i="' + j + '" type="number" step="any" value="' + inp[1] + '" style="min-height:40px;padding:6px 8px"></label>').join('') + '<div style="flex:1 1 100%;font-weight:700;font-family:var(--f-display);font-size:1.1rem">= <span class="out num"></span></div></div>'; }
  function viewWizard(node, path) {
    const W = X.wizard || {}; const n = W[node]; if (!n) return viewTools();
    const crumbs = path.map((p) => '<span class="chip">' + esc(p) + '</span>').join(' ');
    if (n.result) {
      render(toolHead('Which method do I use?') + (crumbs ? '<div class="row" style="gap:6px">' + crumbs + '</div>' : '') + '<section class="hero stack"><span class="eyebrow">Use this</span><h2 style="font-size:2rem">' + n.result + '</h2><p class="muted" style="font-size:1.05rem;max-width:64ch">' + n.why + '</p><div class="row">' + (n.mod ? '<a class="btn accent" href="#' + n.mod + '">Study M' + mod(n.mod).num + ' · ' + esc(mod(n.mod).short) + ' ' + ICON.arrow + '</a>' : '') + '<button class="btn ghost-dark" id="restart">Start over</button></div></section>');
      document.getElementById('restart').addEventListener('click', () => viewWizard('start', []));
      return;
    }
    render(toolHead('Which method do I use?') + (crumbs ? '<div class="row" style="gap:6px">' + crumbs + '</div>' : '') + '<section class="card stack" style="gap:16px"><h2 style="font-size:1.4rem">' + n.q + '</h2><div class="stack" style="gap:10px">' + n.options.map((o, i) => '<div class="qopt"><button data-w="' + i + '"><span class="key">' + String.fromCharCode(65 + i) + '</span><span style="flex:1"><b>' + o[0] + '</b>' + (o[2] ? '<br><span class="muted" style="font-size:.88rem">' + o[2] + '</span>' : '') + '</span></button></div>').join('') + '</div>' + (path.length ? '<div><button class="btn small" id="restart">Start over</button></div>' : '') + '</section>');
    $app.querySelectorAll('[data-w]').forEach((b) => b.addEventListener('click', () => { const o = n.options[Number(b.dataset.w)]; viewWizard(o[1], path.concat(o[0])); }));
    const rs = document.getElementById('restart'); if (rs) rs.addEventListener('click', () => viewWizard('start', []));
  }

  /* ---------- prefs ---------- */
  function viewPrefs() {
    const p = S.prefs;
    const seg = (key, opts) => '<div class="seg" role="group">' + opts.map(([v, t]) => '<button data-pk="' + key + '" data-pv="' + v + '" class="' + (String(p[key]) === String(v) ? 'on' : '') + '" aria-pressed="' + (String(p[key]) === String(v)) + '">' + t + '</button>').join('') + '</div>';
    const rowp = (title, desc, ctl) => '<div class="row between" style="border-top:1px solid var(--line-2);padding-top:14px;gap:14px"><div style="flex:1 1 280px;min-width:0"><b>' + title + '</b><p class="muted" style="font-size:.88rem">' + desc + '</p></div>' + ctl + '</div>';
    render('<div class="stack"><h1 style="font-size:2rem">Preferences</h1><p class="muted">Saved in this browser only.</p></div>' +
      '<section class="card stack" style="gap:14px"><h2 style="font-size:1.15rem">Display</h2>' +
        rowp('Theme', 'System follows your device setting.', seg('theme', [['system', 'System'], ['light', 'Light'], ['dark', 'Dark']])) +
        rowp('Text size', 'Makes every page larger or smaller.', seg('fs', [[15, 'Small'], [16, 'Medium'], [18, 'Large'], [20, 'Extra large']])) + '</section>' +
      '<section class="card stack" style="gap:14px"><h2 style="font-size:1.15rem">Learning</h2>' +
        rowp('Explanation depth', 'Simple adds a plain-words summary; Exam-detail adds derivations and fine print.', seg('depth', [['simple', 'Simple'], ['standard', 'Standard'], ['exam', 'Exam-detail']])) +
        rowp('Show Python code', 'Adds the sklearn / pandas / transformers snippets from the slides to lessons.', seg('python', [[false, 'Off'], [true, 'On']])) +
        rowp('Quiz feedback', 'Instant shows the answer after each question; End holds it until the results.', seg('feedback', [['instant', 'Instant'], ['end', 'At the end']])) +
        rowp('Shuffle questions', 'Mix up question order each time.', seg('shuffle', [[true, 'On'], [false, 'Off']])) +
        rowp('Daily goal', 'Sessions per day. A session is a finished lesson, lab, quiz or 10 flashcards.', seg('goal', [[2, '2'], [3, '3'], [4, '4'], [6, '6']])) +
        rowp('Exam date', 'Shows a countdown on the home page.', '<input id="examDate" type="date" value="' + esc(p.examDate) + '" aria-label="Exam date">') + '</section>' +
      '<section class="card stack" style="gap:12px"><h2 style="font-size:1.15rem">Reset</h2><p class="muted" style="font-size:.9rem">Clears XP, streak, lesson progress, quiz history and flashcard schedule. Preferences stay.</p><div class="row" id="resetRow"><button class="btn" id="reset1">Reset all progress</button></div></section>');
    $app.querySelectorAll('[data-pk]').forEach((b) => b.addEventListener('click', () => { let v = b.dataset.pv; if (v === 'true') v = true; else if (v === 'false') v = false; else if (/^\d+$/.test(v)) v = Number(v); S.prefs[b.dataset.pk] = v; save(); applyPrefs(); viewPrefs(); }));
    document.getElementById('examDate').addEventListener('change', (e) => { S.prefs.examDate = e.target.value; save(); toast('Exam date saved'); });
    document.getElementById('reset1').addEventListener('click', () => {
      document.getElementById('resetRow').innerHTML = '<span style="font-weight:600">This can’t be undone.</span><button class="btn" id="reset2" style="border-color:var(--red);color:var(--red-ink)">Yes, reset everything</button><button class="btn" id="resetNo">Cancel</button>';
      document.getElementById('reset2').addEventListener('click', () => { const prefs = S.prefs; S = blank(); S.prefs = prefs; save(); toast('Progress reset'); viewPrefs(); });
      document.getElementById('resetNo').addEventListener('click', viewPrefs);
    });
  }

  /* ---------- boot ---------- */
  applyPrefs(); updateTop();
  route();
})();
