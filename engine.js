// Motor del juego: corre en el navegador del host. Los jugadores se conectan por PeerJS.
const HOOKS = { host: () => {}, send: () => {} };
const TIME = 20;        // segundos por pregunta
const GOAL = 0.4;       // meta colectiva: terminar con al menos el 40% del equipo vivo

// TODOS son un solo equipo. Los grupos del lobby solo organizan dinámicas, no compiten.
// pasos: solo (individual, fallar = eliminado), shield (escudo colectivo si el equipo llega al 60%),
// group (cuenta la mayoría de tu grupo), split (bandos), vote (dilema), revive (rescate), shop (votación de compra)
const PHASES = [
  { name: 'Calentamiento', desc: 'Respondes solo, pero cada acierto suma al pozo común. Si fallas, quedas fuera.', steps: [['solo', 1], ['solo', 1]] },
  { name: 'Escudo Colectivo', desc: 'Si al menos el 60% del equipo acierta, TODOS ganan inmunidad para la siguiente.', steps: [['shield', 2], ['solo', 2]] },
  { name: 'El Dilema', desc: 'El equipo vota. Gana la mayoría.', steps: [['vote'], ['solo', 2]] },
  { name: 'Escalada', desc: 'Sube la dificultad. Ayúdense entre todos.', steps: [['solo', 3], ['solo', 3]] },
  { name: 'Bandos', desc: 'Se dividen en dos bandos. Cada bando debe llegar al 50% de aciertos: si un bando no llega, caen quienes fallaron. Si ambos llegan, hay premio.', steps: [['split', 3]] },
  { name: 'Rescate', desc: 'Vivos y eliminados responden. Cada 3 vivos que aciertan traen de vuelta a un eliminado que acertó.', steps: [['revive', 2]] },
  { name: 'Fuerza de Grupo', desc: 'Cuenta la respuesta de la mayoría de tu grupo. Si tu grupo acierta, se salvan todos sus integrantes.', steps: [['group', 4], ['group', 4]] },
  { name: 'Presión', desc: 'Escudo colectivo y luego una pregunta difícil.', steps: [['shield', 4], ['solo', 4]] },
  { name: 'Último Rescate', desc: 'Un dilema y la última oportunidad de volver.', steps: [['vote'], ['revive', 3]] },
  { name: 'La Gran Final', desc: 'Nivel máximo. Lleguen juntos a la meta.', steps: [['group', 5], ['solo', 5], ['solo', 5]] },
];

// Compras con el pozo común, decididas por votación
const SHOP = [
  { n: '🛡️ Escudo para todos en la próxima pregunta', c: 10, fx: () => { G.mods.shield = true; return 'Próxima pregunta: nadie puede ser eliminado'; } },
  { n: '🔁 Revivir a 3 compañeros al azar', c: 12, fx: () => revive(shuffle(dead()).slice(0, 3), 'Vuelven') || 'No había nadie que revivir' },
  { n: '✂️ 50/50 para todos en la próxima pregunta', c: 6, fx: () => { G.mods.fifty = true; return 'Próxima pregunta: se eliminan 2 opciones incorrectas'; } },
];

const P = {};
let BANK = null;
let G = null, QID = 0;
const list = () => Object.values(P), alive = () => list().filter(p => p.alive), dead = () => list().filter(p => !p.alive);
const rnd = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const names = ps => ps.map(p => p.name).join(', ');
const award = (n, d) => { G.pool += n * d * (G.mods.double ? 2 : 1); };

function reset() {
  clearTimeout(G && G.timer);
  G = { stage: 'lobby', phase: -1, queue: [], cur: null, answers: {}, lastAnswers: {}, deadline: 0, result: null, mods: {}, pool: 0, used: new Set(), usedSplit: new Set(), usedDil: new Set(), emergency: false, sides: null, groups: (G && G.groups) || ['🔴 Rojo', '🔵 Azul', '🟢 Verde', '🟡 Amarillo'] };
  for (const p of list()) Object.assign(p, { alive: true, immune: false, hide: [], side: null, hits: 0 });
}

function pickQ(d) {
  if (G.mods.hard) d = 5;
  const all = BANK.trivia.map((q, i) => ({ ...q, i }));
  let pool = all.filter(q => q.d === d && !G.used.has(q.i));
  if (!pool.length) pool = all.filter(q => !G.used.has(q.i));
  if (!pool.length) { G.used.clear(); pool = all; }
  const q = rnd(pool); G.used.add(q.i);
  const order = shuffle(q.o.map((_, k) => k));
  return { text: q.q, opts: order.map(k => q.o[k]), correct: order.indexOf(q.a), d: q.d };
}
function pickFrom(arr, usedSet) { let idx = arr.map((_, i) => i).filter(i => !usedSet.has(i)); if (!idx.length) { usedSet.clear(); idx = arr.map((_, i) => i); } const i = rnd(idx); usedSet.add(i); return i; }
function revive(ps, why) { ps = ps.filter(Boolean); ps.forEach(p => { p.alive = true; }); return ps.length ? `${why}: ${names(ps)}` : null; }
function kill(p, lines) {
  if (G.mods.shield) return;
  if (p.immune) { p.immune = false; lines.push(`🛡️ ${p.name} se salvó por el escudo colectivo`); return; }
  p.alive = false;
}

const DILEMMAS = [
  { q: '🌀 Se abrió un portal al más allá. ¿Qué hace el equipo?', o: ['Gastar 8 pts del pozo → vuelven 3 al azar', 'Ignorarlo y guardar el pozo'],
    fx: [() => { G.pool = Math.max(0, G.pool - 8); return revive(shuffle(dead()).slice(0, 3), '🔁 Portal: vuelven') || 'No había nadie que revivir'; }, () => 'El pozo queda intacto'] },
  { q: '⚖️ La próxima pregunta...', o: ['Vale DOBLE para el pozo', 'Tiene ESCUDO: nadie puede ser eliminado'],
    fx: [() => { G.mods.double = true; return 'Próxima pregunta: puntos x2'; }, () => { G.mods.shield = true; return 'Próxima pregunta: escudo para todos'; }] },
  { q: '🎲 El dado del destino', o: ['+10 puntos al pozo común', 'Revivir a 2 compañeros al azar'],
    fx: [() => { G.pool += 10; return '+10 al pozo'; }, () => revive(shuffle(dead()).slice(0, 2), '🔁 El dado: vuelven') || 'No había nadie que revivir'] },
  { q: '😈 Pacto oscuro', o: ['Revivir a TODOS, pero la próxima pregunta es nivel 5', 'Rechazar el pacto'],
    fx: [() => { const r = revive(dead(), '🔁 Pacto: vuelven'); G.mods.hard = true; return (r ? r + ' · ' : '') + '¡Próxima pregunta en nivel máximo!'; }, () => 'Pacto rechazado'] },
];

// ---------- Flujo ----------
function open(kind, q, who, extra = {}) {
  clearTimeout(G.timer);
  const id = ++QID;
  G.stage = 'question'; G.cur = { id, kind, who, ...q, ...extra }; G.answers = {};
  G.deadline = Date.now() + TIME * 1000;
  const hide = G.mods.fifty && q.correct >= 0 ? shuffle(q.opts.map((_, i) => i).filter(i => i !== q.correct)).slice(0, 2) : [];
  if (hide.length) G.mods.fifty = false;
  for (const p of list()) p.hide = hide;
  G.timer = setTimeout(() => { if (G.cur && G.cur.id === id) resolve(); }, TIME * 1000 + 400);
  push();
}
function show(title, line, fx) { if (fx) fx(); G.stage = 'reveal'; G.cur = null; G.lastAnswers = {}; G.result = { title, lines: [line], events: [], correct: -1 }; push(); }

function startPhase(i) {
  G.phase = i; G.queue = PHASES[i].steps.map(s => [...s]);
  if (i < PHASES.length - 1) G.queue.push(['shop']);
  G.stage = 'intro'; G.cur = null; G.emergency = false; push();
}
function runStep() {
  const s = G.queue.shift();
  if (!s) { if (G.phase >= PHASES.length - 1) { G.stage = 'end'; G.cur = null; return push(); } return startPhase(G.phase + 1); }
  const [k, d] = s;
  if (['solo', 'shield', 'group', 'splitQ'].includes(k)) return open(k, pickQ(d), 'alive');
  if (k === 'revive') {
    if (!dead().length) return show('Rescate', '¡Nadie ha caído! +10 al pozo común.', () => { G.pool += 10; });
    return open(k, pickQ(d), 'all');
  }
  if (k === 'split') { const sp = BANK.splits[pickFrom(BANK.splits, G.usedSplit)]; G.queue.unshift(['splitQ', d]); return open('split', { text: sp.q, opts: sp.o, correct: -1 }, 'alive'); }
  if (k === 'vote') { const i = pickFrom(DILEMMAS, G.usedDil); return open('vote', { text: DILEMMAS[i].q, opts: DILEMMAS[i].o, correct: -1 }, 'alive', { dil: i }); }
  if (k === 'shop') {
    const items = SHOP.map((it, i) => ({ ...it, i })).filter(it => G.pool >= it.c);
    if (!items.length) return show('🛒 Tienda del equipo', `El pozo tiene ${G.pool} pts: no alcanza para comprar nada. ¡A ahorrar!`);
    return open('shop', { text: `🛒 ¿En qué gasta el equipo el pozo? (${G.pool} pts)`, opts: [...items.map(it => `${it.n} · ${it.c} pts`), '💰 Ahorrar para después'], correct: -1 }, 'alive', { items: items.map(it => it.i) });
  }
}
function next() {
  if (G.stage === 'lobby') {
    if (!list().length) return;
    list().filter(p => p.group == null).forEach(p => { const c = G.groups.map((_, i) => list().filter(x => x.group === i).length); p.group = c.indexOf(Math.min(...c)); });
    G.total0 = list().length;
    return startPhase(0);
  }
  if (G.stage === 'question') return resolve();
  if (G.stage === 'end') return;
  runStep();
}

function majority(c, voters) {
  const cnt = c.opts.map(() => 0); voters.forEach(p => { const a = G.answers[p.token]; if (a) cnt[a.i]++; });
  const max = Math.max(...cnt), top = cnt.map((n, i) => n === max ? i : -1).filter(i => i >= 0);
  return { w: rnd(top), cnt };
}

function resolve() {
  if (G.stage !== 'question') return;
  clearTimeout(G.timer);
  const c = G.cur, A = G.answers, lines = [], events = [];
  const ans = p => A[p.token], ok = p => ans(p) && ans(p).i === c.correct;
  const total = list().length, lethal = ['solo', 'group', 'splitQ'].includes(c.kind);
  let title = '';
  if (c.correct >= 0) list().filter(ok).forEach(p => p.hits++);

  if (c.kind === 'solo' || c.kind === 'shield') {
    const al = alive(), good = al.filter(ok); award(good.length, c.d);
    if (c.kind === 'solo') {
      const bad = al.filter(p => !ok(p)); bad.forEach(p => kill(p, lines));
      const out = bad.filter(p => !p.alive);
      title = `${good.length} acertaron · ${out.length} eliminados`;
      if (G.mods.shield && bad.length) lines.push('🛡️ El escudo del equipo salvó a todos');
      if (out.length) lines.push('💀 Fuera: ' + names(out));
      if (!bad.length && dead().length) events.push(revive(shuffle(dead()).slice(0, 2), '🔥 ¡Racha perfecta! Vuelven'));
    } else {
      const r = al.length ? good.length / al.length : 0;
      title = `🛡️ Escudo colectivo: ${Math.round(r * 100)}% de aciertos`;
      if (r >= 0.6) { al.forEach(p => p.immune = true); lines.push('¡Lo lograron! Todo el equipo tiene inmunidad para la próxima eliminación'); }
      else lines.push('No llegaron al 60%. Sin escudo esta vez');
    }
  } else if (c.kind === 'group') {
    title = 'Resultado por grupo';
    G.groups.forEach((g, gi) => {
      const mem = alive().filter(p => p.group === gi); if (!mem.length) return;
      const answered = mem.filter(ans);
      const best = answered.length ? majority(c, mem).w : -1;
      if (best === c.correct) { award(mem.length, c.d); lines.push(`✅ ${g}: el grupo acertó, todos a salvo`); }
      else {
        award(mem.filter(ok).length, 1);
        const bad = mem.filter(p => !ok(p)); bad.forEach(p => kill(p, lines));
        const out = bad.filter(p => !p.alive);
        lines.push(`❌ ${g}: el grupo falló` + (out.length ? ` — fuera: ${names(out)}` : ''));
      }
    });
  } else if (c.kind === 'split') {
    alive().forEach(p => { p.side = ans(p) ? ans(p).i : Math.floor(Math.random() * 2); });
    const n0 = alive().filter(p => p.side === 0).length; G.sides = c.opts;
    title = '¡Bandos formados!';
    lines.push(`${c.opts[0]}: ${n0} jugadores`, `${c.opts[1]}: ${alive().length - n0} jugadores`, 'Ahora cada bando debe llegar al 50% de aciertos.');
  } else if (c.kind === 'splitQ') {
    title = 'Desafío de bandos'; let both = true;
    [0, 1].forEach(s => {
      const m = alive().filter(p => p.side === s), g = m.filter(ok); award(g.length, c.d);
      const r = m.length ? g.length / m.length : 1;
      if (r >= 0.5) lines.push(`✅ ${G.sides[s]}: ${Math.round(r * 100)}% — bando a salvo`);
      else { both = false; const bad = m.filter(p => !ok(p)); bad.forEach(p => kill(p, lines)); const out = bad.filter(p => !p.alive); lines.push(`❌ ${G.sides[s]}: ${Math.round(r * 100)}%` + (out.length ? ` — fuera: ${names(out)}` : '')); }
    });
    if (both) { G.pool += 10; events.push('🤝 ¡Ambos bandos lo lograron! +10 al pozo'); }
  } else if (c.kind === 'revive') {
    const okA = alive().filter(ok); award(okA.length, c.d);
    const okD = shuffle(dead().filter(ok));
    const n = okA.length ? Math.max(1, Math.ceil(okA.length / 3)) : 0, back = okD.slice(0, n);
    back.forEach(p => p.alive = true);
    title = '🔁 Rescate';
    lines.push(`${okA.length} vivos acertaron → ${n} cupos`, `${okD.length} eliminados acertaron`, back.length ? 'Vuelven: ' + names(back) : 'Nadie vuelve esta vez');
  } else if (c.kind === 'vote') {
    const { w, cnt } = majority(c, alive());
    title = '🗳️ El equipo decidió';
    lines.push(`"${c.opts[w]}" (${cnt[w]} de ${alive().length} votos)`);
    G.mods = {}; const msg = DILEMMAS[c.dil].fx[w](); if (msg) lines.push(msg);
  } else if (c.kind === 'shop') {
    const { w, cnt } = majority(c, alive());
    title = '🛒 El equipo decidió';
    lines.push(`"${c.opts[w]}" (${cnt[w]} votos)`);
    if (w < c.items.length) { const it = SHOP[c.items[w]]; G.pool -= it.c; G.mods = {}; lines.push(it.fx()); }
    else lines.push(`El pozo se guarda: ${G.pool} pts`);
  }

  // Gatillantes de eventos
  if (lethal && dead().length) {
    if (!G.emergency && alive().length <= Math.max(1, Math.floor(total * 0.25))) {
      G.emergency = true; events.push(revive(shuffle(dead()).slice(0, Math.ceil(dead().length * 0.3)), '🚨 Rescate de emergencia (quedan muy pocos): vuelven'));
    } else if (Math.random() < 0.15) events.push(revive([rnd(dead())], '👻 Fantasma afortunado: vuelve'));
  }
  if (lethal && Math.random() < 0.15) { G.pool += 5; events.push('💰 Lluvia de puntos: +5 al pozo'); }
  if (total && !alive().length) events.push(revive(shuffle(dead()).slice(0, Math.max(1, Math.ceil(total * 0.2))), '⚡ ¡Nadie quedó en pie! Resurrección masiva:'));

  if (!['vote', 'split', 'shop'].includes(c.kind)) { const f = G.mods.fifty; G.mods = {}; if (f) G.mods.fifty = true; }
  G.lastAnswers = A;
  G.result = { title, lines, events: events.filter(Boolean), correct: c.correct, opts: c.opts, text: c.text, kind: c.kind };
  G.stage = 'reveal'; G.cur = null; push();
}

// ---------- Vistas ----------
const goal = () => { const t = G.total0 || list().length; return { need: Math.max(1, Math.ceil(t * GOAL)), have: alive().length }; };
const mvps = () => [...list()].sort((a, b) => b.hits - a.hits).slice(0, 5).map(p => ({ name: p.name, hits: p.hits }));
const phaseInfo = () => ({ stage: G.stage, phase: G.phase, phaseName: G.phase >= 0 ? PHASES[G.phase].name : '', desc: G.phase >= 0 ? PHASES[G.phase].desc : '', mods: G.mods, pool: G.pool, goal: goal() });

function hview() {
  const c = G.cur; let q = null;
  if (G.stage === 'question' && c) {
    const { correct, items, ...rest } = c;
    const el = c.who === 'all' ? list() : alive();
    q = { ...rest, left: G.deadline - Date.now(), answered: Object.keys(G.answers).length, eligible: el.length, hide: list()[0] ? list()[0].hide : [] };
  }
  return {
    ...phaseInfo(), phases: PHASES.map(p => p.name),  total: list().length, alive: alive().length,
    groups: G.groups.map((g, i) => ({ name: g, players: list().filter(p => p.group === i).map(p => ({ name: p.name, alive: p.alive, on: !!p.conn, immune: p.immune })) })),
    noGroup: list().filter(p => p.group == null).map(p => p.name),
    q, result: G.stage === 'reveal' ? G.result : null, mvps: G.stage === 'end' ? mvps() : [],
  };
}
function pview(p) {
  const c = G.cur;
  const s = { ...phaseInfo(), me: { name: p.name, group: G.groups[p.group] || null, gi: p.group, alive: p.alive, immune: p.immune }, groups: G.groups.map((g, i) => ({ name: g, n: list().filter(x => x.group === i).length })) };
  if (G.stage === 'question' && c) s.q = { kind: c.kind, text: c.text, opts: c.opts, left: G.deadline - Date.now(), can: c.who === 'all' || p.alive, mine: G.answers[p.token] ? G.answers[p.token].i : null, hide: p.hide || [], side: c.kind === 'splitQ' && G.sides ? G.sides[p.side] : null };
  if (G.stage === 'reveal' && G.result) { const a = G.lastAnswers[p.token]; s.result = { ...G.result, mine: a ? a.i : null }; }
  if (G.stage === 'end') s.mvps = mvps();
  return s;
}
function push() {
  HOOKS.host(hview());
  for (const p of list()) if (p.conn) HOOKS.send(p.conn, pview(p));
}


const Game = {
  init(bank, hooks) { BANK = bank; Object.assign(HOOKS, hooks); reset(); push(); },
  next, push() { if (G && BANK) push(); },
  reset() { reset(); push(); },
  setGroups(arr) { if (G.stage !== 'lobby' || !Array.isArray(arr)) return; G.groups = arr.map(x => String(x).slice(0, 24)).filter(Boolean).slice(0, 10); if (!G.groups.length) G.groups = ['Grupo 1']; list().forEach(p => { if (p.group >= G.groups.length) p.group = null; }); push(); },
  shuffleGroups() { if (G.stage !== 'lobby') return; shuffle(list()).forEach((p, i) => p.group = i % G.groups.length); push(); },
  message(conn, m) {
    if (!m || typeof m !== 'object') return;
    if (m.type === 'join') {
      let p = P[m.token];
      if (!p) {
        const name = String(m.name || '').trim().slice(0, 20);
        if (!name) return HOOKS.send(conn, { err: 'need_name' });
        if (list().some(x => x.name.toLowerCase() === name.toLowerCase())) return HOOKS.send(conn, { err: 'Ese nombre ya está en uso' });
        const token = Math.random().toString(36).slice(2, 10);
        p = P[token] = { token, name, group: null, alive: G.stage === 'lobby', immune: false, hide: [], hits: 0 };
      }
      if (p.conn && p.conn !== conn) try { p.conn.close(); } catch (e) {}
      p.conn = conn; conn._t = p.token; HOOKS.send(conn, { token: p.token }); return push();
    }
    const p = P[conn._t]; if (!p) return;
    if (m.type === 'group') { if (G.stage === 'lobby' && G.groups[m.gi] != null) { p.group = m.gi; push(); } }
    if (m.type === 'answer') {
      const c = G.cur, i = m.i;
      if (G.stage !== 'question' || !c || (c.who !== 'all' && !p.alive) || G.answers[p.token]) return;
      if (typeof i !== 'number' || i < 0 || i >= c.opts.length || (p.hide || []).includes(i)) return;
      G.answers[p.token] = { i, t: Date.now() };
      const el = (c.who === 'all' ? list() : alive()).length, id = c.id;
      if (Object.keys(G.answers).length >= el) setTimeout(() => { if (G.cur && G.cur.id === id) resolve(); }, 800);
      push();
    }
  },
  closed(conn) { const p = P[conn._t]; if (p && p.conn === conn) { p.conn = null; push(); } },
};
