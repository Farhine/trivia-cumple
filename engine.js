// Motor del juego: corre en el navegador del host. Los jugadores se conectan por PeerJS.
const HOOKS = { host: () => {}, send: () => {} };
const TIME = 20;        // segundos por pregunta
const GOAL = 0.4;       // meta colectiva: terminar con al menos el 40% del equipo vivo

// TODOS son un solo equipo. Los grupos del lobby solo organizan dinámicas, no compiten.
// pasos: solo (individual, fallar = eliminado), shield (escudo colectivo si el equipo llega al 60%),
// group (cuenta la mayoría de tu grupo), split (bandos), vote (dilema), revive (rescate), shop (votación de compra)
const PHASES = [
  { name: 'Zarpe', desc: 'Calentamos motores. Respondes solo; si fallas, caes al agua.', steps: [['solo', 1], ['solo', 1], ['solo', 1], ['solo', 2]] },
  { name: 'Isla del Escudo', desc: 'Si el 60% del barco acierta, todos quedan protegidos. Y al final, un minijuego relámpago.', steps: [['shield', 2], ['solo', 2], ['solo', 2], ['mini', 'wario']] },
  { name: 'Isla del Dilema', desc: 'La tripulación vota, juzga a un sospechoso y responde.', steps: [['vote'], ['solo', 2], ['trial'], ['solo', 2], ['solo', 3]] },
  { name: 'La Tormenta', desc: 'Sube la dificultad y el oleaje. Cierra con cálculo mental bajo la lluvia.', steps: [['solo', 3], ['solo', 3], ['solo', 3], ['solo', 3], ['mini', 'math']] },
  { name: 'Isla de los Bandos', desc: 'El barco se divide en dos, y luego todos debaten una pregunta en el Consejo.', steps: [['split', 3], ['splitQ', 3], ['splitQ', 3], ['council', 3]] },
  { name: 'Bahía del Rescate', desc: 'Los náufragos dibujan, escriben y responden para volver a bordo.', steps: [['mini', 'draw'], ['revive', 3], ['solo', 3], ['mini', 'dict']] },
  { name: 'Isla de las Manadas', desc: 'Cuenta la respuesta de la mayoría de tu grupo. Y alguien será juzgado.', steps: [['group', 4], ['group', 4], ['trial'], ['group', 4], ['mini', 'wario']] },
  { name: 'Mar de la Presión', desc: 'Escudo colectivo, preguntas difíciles y matemática con nervios.', steps: [['shield', 4], ['solo', 4], ['solo', 4], ['mini', 'math']] },
  { name: 'El Último Faro', desc: 'Un dilema, una galería de arte, un Consejo y la última oportunidad de rescatar náufragos.', steps: [['vote'], ['mini', 'draw'], ['council', 4], ['revive', 3], ['solo', 4]] },
  { name: 'Puerto Final', desc: 'Nivel máximo. Debatan juntos y lleguen a puerto con al menos el 40% de la tripulación.', steps: [['council', 5], ['group', 5], ['solo', 5], ['solo', 5], ['solo', 5]] },
];
const CHARGES = ['se comió la torta del capitán', 'escondió los salvavidas', 'le puso sal al agua dulce', 'robó las galletas del loro', 'hizo un hoyo en el barco "para ver peces"', 'usó la vela como toalla', 'le dijo al tiburón dónde estábamos', 'roncó toda la noche y asustó a las ballenas', 'cambió el rumbo para ir a buscar completos', 'tiró el mapa al agua por accidente', 'se sentó en el pulpo', 'organizó un karaoke durante la tormenta'];
const TIMES = { trial: 35, council: 45 };

const DRAW_PROMPTS = ['El Capitán Loro en traje de baño', 'Una jirafa dentro de un submarino', 'El cumpleañero como superhéroe', 'Un tiburón vegetariano', 'Una vaca surfeando', 'El barco hundiéndose con estilo', 'Un pulpo haciendo malabares', 'Una rata pirata con parche', 'Un elefante en una tina', 'La torta de cumpleaños más fea del mundo', 'Un pingüino en la playa con calor', 'Un gato que odia el agua... en el agua', 'Un delfín con lentes de sol', 'Una cebra sin rayas', 'El loro dormido en el mástil', 'Una sirena que es mitad perro'];
const DICTATIONS = ['El loro capitán navega sin brújula y sin vergüenza', 'Una jirafa mareada vomitó sobre la cubierta', 'Los tiburones esperan pacientemente su almuerzo', 'Hoy celebramos un cumpleaños en medio del océano', 'El pulpo robó tres galletas y dos salvavidas', 'Nadie sabe nadar pero todos quieren torta', 'La tormenta se llevó el sombrero del capitán', 'El elefante pidió un bote más grande', 'Un pingüino elegante bailaba en la proa', 'Las olas gigantes no asustan a la tripulación'];
const MINI_DUR = { draw: 60, math: 30, dict: 30, wario: 32 };
const WARIO = ['tap', 'shake', 'tilt', 'stop', 'avoid', 'swipe'];

// Compras con el pozo común, decididas por votación
const SHOP = [
  { n: '🛡️ Escudo para todo el barco en la próxima pregunta', c: 10, fx: () => { G.mods.shield = true; return 'Próxima pregunta: nadie puede ser eliminado'; } },
  { n: '🛟 Rescatar a 2 náufragos al azar', c: 15, fx: () => revive(shuffle(dead()).slice(0, 2), 'Vuelven a bordo') || 'No había nadie en el agua' },
  { n: '✂️ 50/50 para todos en la próxima pregunta', c: 6, fx: () => { G.mods.fifty = true; return 'Próxima pregunta: se eliminan 2 opciones incorrectas'; } },
];

const P = {};
const ANIMALS = ['🐀','🐱','🐶','🐘','🦓','🦒','🐵','🐼','🐸','🦊','🐷','🐮','🦁','🐯','🐨','🐧','🦉','🐢','🦔','🦘','🦛','🦏','🐊','🦩','🐙','🦥','🦦','🦨','🦇','🐰','🐻','🐔','🦆','🐴','🦙','🐐','🦬','🐫','🦭','🦜','🐹','🦝','🐗','🐳'];
const pickAnimal = () => { const used = new Set(list().map(p => p.ani)); const free = ANIMALS.filter(a => !used.has(a)); return rnd(free.length ? free : ANIMALS); };
let BANK = null;
let G = null, QID = 0;
const list = () => Object.values(P), alive = () => list().filter(p => p.alive), dead = () => list().filter(p => !p.alive);
const rnd = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const names = ps => ps.map(p => p.name).join(', ');
const award = (n, d) => { G.pool += n * d * (G.mods.double ? 2 : 1); };

function reset() {
  clearTimeout(G && G.timer);
  G = { stage: 'lobby', phase: -1, queue: [], cur: null, answers: {}, lastAnswers: {}, deadline: 0, result: null, mods: {}, pool: 0, used: new Set(), emergCount: 0, usedSplit: new Set(), usedDraw: new Set(), usedCharge: new Set(), usedDict: new Set(), mini: null, sunk: false, lightning: false, armed: false, usedDil: new Set(), emergency: false, sides: null, groups: (G && G.groups) || ['🔴 Rojo', '🔵 Azul', '🟢 Verde', '🟡 Amarillo'] };
  for (const p of list()) Object.assign(p, { alive: true, immune: false, fifty: false, hinted: false, hide: [], side: null, hits: 0 });
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
  { q: '🌀 Se abrió un portal al más allá. ¿Qué hace el equipo?', o: ['Gastar 10 pts del pozo → vuelven 2 al azar', 'Ignorarlo y guardar el pozo'],
    fx: [() => { G.pool = Math.max(0, G.pool - 10); return revive(shuffle(dead()).slice(0, 2), '🔁 Portal: vuelven') || 'No había nadie que revivir'; }, () => 'El pozo queda intacto'] },
  { q: '⚖️ La próxima pregunta...', o: ['Vale DOBLE para el pozo', 'Tiene ESCUDO: nadie puede ser eliminado'],
    fx: [() => { G.mods.double = true; return 'Próxima pregunta: puntos x2'; }, () => { G.mods.shield = true; return 'Próxima pregunta: escudo para todos'; }] },
  { q: '🎲 El dado del destino', o: ['+10 puntos al pozo común', 'Lanzar un salvavidas: 50% de revivir a 2'],
    fx: [() => { G.pool += 10; return '+10 al pozo'; }, () => Math.random() < 0.5 ? (revive(shuffle(dead()).slice(0, 2), '🎲 El dado: vuelven') || 'No había nadie en el agua') : '🎲 El dado salió mal: el salvavidas se hundió'] },
  { q: '😈 Pacto oscuro', o: ['Revivir a la mitad de los náufragos, pero la próxima pregunta es nivel 5', 'Rechazar el pacto'],
    fx: [() => { const d = dead(); const r = revive(shuffle(d).slice(0, Math.ceil(d.length / 2)), '😈 Pacto: vuelven'); G.mods.hard = true; return (r ? r + ' · ' : '') + '¡Próxima pregunta en nivel máximo!'; }, () => 'Pacto rechazado'] },
];

// ---------- Flujo ----------
function open(kind, q, who, extra = {}) {
  clearTimeout(G.timer);
  const id = ++QID;
  G.stage = 'question'; G.cur = { id, kind, who, ...q, ...extra }; G.answers = {};
  G.deadline = 0; G.armed = false;
  const wrong = () => shuffle(q.opts.map((_, i) => i).filter(i => i !== q.correct)).slice(0, 2);
  const hide = G.mods.fifty && q.correct >= 0 ? wrong() : [];
  if (hide.length) G.mods.fifty = false;
  for (const p of list()) {
    p.hide = hide; p.hinted = false;
    if (!hide.length && p.fifty && q.correct >= 0 && (who === 'all' || p.alive)) { p.hide = wrong(); p.fifty = false; p.hinted = true; }
  }
  G.timer = setTimeout(() => arm(id), 15000); // por si el narrador no avisa
  push();
}
function arm(id) {
  if (G.stage === 'question' && G.cur && G.cur.id === id && !G.armed) {
    clearTimeout(G.timer); G.armed = true; const T = (TIMES[G.cur.kind] || TIME) * 1000; G.deadline = Date.now() + T;
    G.timer = setTimeout(() => { if (G.cur && G.cur.id === id) resolve(); }, T + 400); push();
  }
  if (G.stage === 'mini' && G.mini && G.mini.id === id && !G.mini.armed) {
    clearTimeout(G.timer); const m = G.mini; m.armed = true; m.deadline = Date.now() + m.dur * 1000;
    G.timer = setTimeout(() => endPlay(id), m.dur * 1000 + 2500); push();
  }
}
// ---------- Minijuegos ----------
function openMini(type) {
  clearTimeout(G.timer);
  const id = ++QID, m = { id, type, phase: 'play', armed: false, dur: MINI_DUR[type], deadline: 0, scores: {}, arts: {}, votes: {}, seed: Math.floor(Math.random() * 1e9) };
  if (type === 'draw') { m.prompt = DRAW_PROMPTS[pickFrom(DRAW_PROMPTS, G.usedDraw)]; m.mode = Math.random() < 0.7 ? 'best' : 'worst'; m.artists = (dead().length ? dead() : alive()).map(p => p.token); }
  if (type === 'dict') m.text = DICTATIONS[pickFrom(DICTATIONS, G.usedDict)];
  if (type === 'wario') m.games = shuffle(WARIO).slice(0, 5);
  G.stage = 'mini'; G.mini = m; G.cur = null;
  G.timer = setTimeout(() => arm(id), 20000);
  push();
}
function endPlay(id) {
  const m = G.mini; if (G.stage !== 'mini' || !m || m.id !== id || m.phase !== 'play') return;
  clearTimeout(G.timer);
  if (m.type === 'draw' && Object.keys(m.arts).length && alive().length) {
    m.phase = 'vote'; m.deadline = Date.now() + 25000;
    const arts = Object.entries(m.arts).map(([t, img]) => ({ id: t, img }));
    for (const p of alive()) if (p.conn) HOOKS.send(p.conn, { arts: arts.filter(a => a.id !== p.token) });
    G.timer = setTimeout(() => resolveMini(id), 25500);
    return push();
  }
  resolveMini(id);
}
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zñ0-9 ]/g, '').replace(/\s+/g, ' ').trim();
function lev(a, b) { const d = Array.from({ length: b.length + 1 }, (_, i) => i); for (let i = 1; i <= a.length; i++) { let prev = d[0]; d[0] = i; for (let j = 1; j <= b.length; j++) { const t = d[j]; d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = t; } } return d[b.length]; }
function resolveMini(id) {
  const m = G.mini; if (G.stage !== 'mini' || !m || m.id !== id) return;
  clearTimeout(G.timer);
  const lines = [], events = [], score = {};
  if (m.type === 'draw') { for (const t of Object.keys(m.arts)) score[t] = 0; for (const v of Object.values(m.votes)) if (v in score) score[v]++; }
  else if (m.type === 'dict') { const ref = norm(m.text); for (const [t, txt] of Object.entries(m.scores)) { const s = norm(txt); score[t] = s ? Math.max(0, Math.round((1 - lev(s, ref) / Math.max(ref.length, s.length)) * 100)) : 0; } }
  else for (const [t, v] of Object.entries(m.scores)) score[t] = Math.max(0, Math.min(999, Number(v) || 0));
  const ranked = Object.keys(score).filter(t => P[t]).sort((a, b) => score[b] - score[a] || Math.random() - 0.5);
  const unit = { draw: 'votos', dict: '% de precisión', math: 'correctas', wario: 'puntos' }[m.type];
  const deadR = ranked.filter(t => !P[t].alive && score[t] > 0), aliveR = ranked.filter(t => P[t].alive && score[t] > 0);
  let winnerArt = null;
  if (m.type === 'draw') {
    const best = ranked[0];
    if (best && score[best] > 0) {
      winnerArt = m.arts[best]; const p = P[best];
      if (!p.alive) { p.alive = true; events.push(`🎨 El dibujo ${m.mode === 'best' ? 'favorito' : 'más horrible'} es de ${p.name}: ¡vuelve a bordo!`); }
      else { const pw = givePower(p); events.push(`🎨 El dibujo ${m.mode === 'best' ? 'favorito' : 'más horrible'} es de ${p.name}: gana ${pw}`); }
      if (dead().length >= 6 && ranked[1] && score[ranked[1]] > 0 && !P[ranked[1]].alive) { P[ranked[1]].alive = true; events.push(`🥈 Segundo lugar: también vuelve ${P[ranked[1]].name}`); }
    } else lines.push('Nadie votó. El arte no es apreciado en este barco.');
  } else {
    const k = Math.max(1, Math.floor(dead().length / 4));
    const back = deadR.slice(0, k).map(t => P[t]); back.forEach(p => p.alive = true);
    if (back.length) events.push('🛟 Mejores náufragos, de vuelta a bordo: ' + names(back));
    // castigo: los peores de a bordo (o quienes no jugaron) caen al agua
    const onBoard = alive().filter(p => !back.includes(p) && p.conn);
    if (onBoard.length >= 2) {
      const sc = p => score[p.token] || 0, worst = Math.min(...onBoard.map(sc));
      const losers = shuffle(onBoard.filter(p => sc(p) === worst)).slice(0, Math.max(1, Math.floor(onBoard.length / 6)));
      if (worst < Math.max(...onBoard.map(sc)) || worst === 0) {
        const fell = []; losers.forEach(p => { kill(p, lines); if (!p.alive) fell.push(p); });
        if (fell.length) events.push('🌊 Peor puntaje a bordo, ¡al agua!: ' + names(fell));
      }
    }
    const nPow = alive().length > 12 ? 2 : 1;
    aliveR.filter(t => !back.includes(P[t])).slice(0, nPow).forEach(t => events.push(`🎁 ${P[t].name} gana ${givePower(P[t])}`));
    if (!ranked.length || !score[ranked[0]]) lines.push('Nadie sumó puntos. Impresionante, en el mal sentido.');
  }
  const board = ranked.slice(0, 6).map(t => ({ name: P[t].name, ani: P[t].ani, score: score[t], alive: P[t].alive }));
  const title = { draw: '🎨 Galería del naufragio', math: '🧮 Cálculo bajo el agua', dict: '📝 El dictado del loro', wario: '⚡ Microjuegos relámpago' }[m.type];
  G.lastAnswers = {};
  G.result = { title, lines, events, correct: -1, kind: 'mini', mtype: m.type, board, unit, art: winnerArt, dictText: m.type === 'dict' ? m.text : null, mode: m.mode, prompt: m.prompt };
  G.mini = null; G.stage = 'reveal'; push();
}
function givePower(p) { if (Math.random() < 0.5) { p.fifty = true; return '🔎 una pista secreta (2 opciones menos en su próxima pregunta)'; } p.immune = true; return '🛡️ un escudo personal'; }

function show(title, line, fx) { if (fx) fx(); G.stage = 'reveal'; G.cur = null; G.lastAnswers = {}; G.result = { title, lines: [line], events: [], correct: -1 }; push(); }

function startPhase(i) {
  G.phase = i; G.queue = PHASES[i].steps.map(s => [...s]);
  if (i < PHASES.length - 1) G.queue.push(['shop']);
  G.stage = 'intro'; G.cur = null; G.emergency = false; push();
}
function runStep() {
  const s = G.queue.shift();
  if (G.sunk) { G.stage = 'end'; G.cur = null; return push(); }
  if (!s) { if (G.phase >= PHASES.length - 1) { G.stage = 'end'; G.cur = null; return push(); } return startPhase(G.phase + 1); }
  const [k, d] = s;
  if (['solo', 'shield', 'group', 'splitQ'].includes(k)) return open(k, pickQ(d), 'alive');
  if (k === 'revive') {
    if (!dead().length) return show('Rescate', '¡Nadie ha caído! +10 al pozo común.', () => { G.pool += 10; });
    return open(k, pickQ(d), 'all');
  }
  if (k === 'mini') return openMini(d);
  if (k === 'council') return open('council', pickQ(d), 'alive');
  if (k === 'trial') {
    const cands = alive().filter(p => !p.immune); if (alive().length < 3 || !cands.length) return runStep();
    const acc = rnd(cands), charge = CHARGES[pickFrom(CHARGES, G.usedCharge)];
    return open('trial', { text: `⚖️ ${acc.name} está acusado de que ${charge}. ¿Qué dice la tripulación?`, opts: ['😇 Inocente', '😈 Culpable'], correct: -1 }, 'alive', { accused: acc.token, accusedName: acc.name, charge });
  }
  if (k === 'split') { const sp = BANK.splits[pickFrom(BANK.splits, G.usedSplit)]; return open('split', { text: sp.q, opts: sp.o, correct: -1 }, 'alive'); }
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
  if (G.stage === 'mini') return G.mini.phase === 'play' ? endPlay(G.mini.id) : resolveMini(G.mini.id);
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
  const total = list().length, lethal = ['solo', 'group', 'splitQ', 'council', 'trial'].includes(c.kind);
  let title = '';
  if (c.correct >= 0) list().filter(ok).forEach(p => p.hits++);

  if (c.kind === 'solo' || c.kind === 'shield') {
    const al = alive(), good = al.filter(ok); award(good.length, c.d);
    if (c.kind === 'solo') {
      const bad = al.filter(p => !ok(p)); bad.forEach(p => kill(p, lines));
      const out = bad.filter(p => !p.alive);
      title = `${good.length} acertaron · ${out.length} al agua`;
      if (G.mods.shield && bad.length) lines.push('🛡️ El escudo del barco salvó a todos');
      if (out.length) lines.push('🌊 Al agua: ' + names(out));
      if (!bad.length && good.length && dead().length && Math.random() < 0.4) events.push(revive([rnd(dead())], '🔥 ¡Ronda perfecta! Como premio vuelve'));
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
        lines.push(`❌ ${g}: el grupo falló` + (out.length ? ` — al agua: ${names(out)}` : ''));
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
      else { both = false; const bad = m.filter(p => !ok(p)); bad.forEach(p => kill(p, lines)); const out = bad.filter(p => !p.alive); lines.push(`❌ ${G.sides[s]}: ${Math.round(r * 100)}%` + (out.length ? ` — al agua: ${names(out)}` : '')); }
    });
    if (both) { G.pool += 10; events.push('🤝 ¡Ambos bandos lo lograron! +10 al pozo'); }
  } else if (c.kind === 'revive') {
    const okA = alive().filter(ok); award(okA.length, c.d);
    const okD = shuffle(dead().filter(ok));
    const n = Math.floor(okA.length / 4) || (okA.length && Math.random() < 0.5 ? 1 : 0), back = okD.slice(0, n);
    back.forEach(p => p.alive = true);
    title = '🔁 Rescate';
    lines.push(`${okA.length} a bordo acertaron → ${n} salvavidas`, `${okD.length} náufragos acertaron`, back.length ? 'Vuelven: ' + names(back) : 'Nadie vuelve esta vez');
  } else if (c.kind === 'council') {
    const voters = alive(), { w, cnt } = majority(c, voters);
    title = '🗣️ El Consejo decidió';
    lines.push(`La tripulación eligió "${c.opts[w]}" (${cnt[w]} de ${voters.length})`);
    if (w === c.correct) { award(voters.length, c.d); lines.push('✅ ¡El Consejo acertó! Todos a salvo.'); }
    else { const bad = voters.filter(p => !ok(p)); bad.forEach(p => kill(p, lines)); const out = bad.filter(p => !p.alive); lines.push('❌ El Consejo se equivocó' + (out.length ? ` — al agua quienes votaron mal: ${names(out)}` : '')); award(voters.filter(ok).length, 1); }
  } else if (c.kind === 'trial') {
    const acc = P[c.accused], voters = alive().filter(p => p.token !== c.accused);
    const guilty = voters.filter(p => ans(p) && ans(p).i === 1).length, need = Math.floor(voters.length / 2) + 1;
    title = '⚖️ Veredicto';
    lines.push(`Culpable: ${guilty} · Inocente: ${voters.filter(p => ans(p) && ans(p).i === 0).length}`);
    if (acc && guilty >= need) { if (acc.alive) { kill(acc, lines); } G.pool += 10; lines.push(acc.alive ? `${acc.name} fue declarado culpable, pero su escudo lo salvó.` : `😈 ${acc.name} es CULPABLE: ¡a la plancha! El capitán premia la justicia con +10 al pozo.`); }
    else if (acc) { acc.immune = true; lines.push(`😇 ${acc.name} es inocente. Como disculpa recibe un escudo personal.`); }
  } else if (c.kind === 'vote') {
    const { w, cnt } = majority(c, alive());
    title = '🗳️ El equipo decidió';
    lines.push(`"${c.opts[w]}" (${cnt[w]} de ${alive().length} votos)`);
    G.mods = {}; const msg = DILEMMAS[c.dil].fx[w](); if (msg) lines.push(msg);
  } else if (c.kind === 'shop') {
    const { w, cnt } = majority(c, alive()), need = Math.floor(alive().length / 2) + 1;
    title = '🛒 El equipo decidió';
    if (cnt[w] < need) { title = '🛒 Sin mayoría'; lines.push(`La opción más votada tuvo ${cnt[w]} de ${alive().length} votos; se necesitaban ${need}.`, `No se compra nada. El pozo queda en ${G.pool} pts.`); }
    else lines.push(`"${c.opts[w]}" (${cnt[w]} de ${alive().length} votos)`);
    if (cnt[w] < need) {} else if (w < c.items.length) { const it = SHOP[c.items[w]]; G.pool -= it.c; G.mods = {}; lines.push(it.fx()); }
    else lines.push(`El pozo se guarda: ${G.pool} pts`);
  }

  // Gatillantes de eventos (con probabilidad; como mucho un rescate automático por pregunta)
  let autoBack = events.length > 0;
  if (lethal && dead().length && !autoBack) {
    const low = alive().length <= Math.max(1, Math.floor(total * 0.25));
    if (low && G.emergCount < 2 && Math.random() < 0.35) {
      G.emergCount++; autoBack = true; events.push(revive(shuffle(dead()).slice(0, Math.max(1, Math.floor(dead().length * 0.25))), '🚨 Bote de emergencia: vuelven'));
    } else if (Math.random() < 0.06) { autoBack = true; events.push(revive([rnd(dead())], '🐬 Un delfín amable devolvió a')); }
  }
  if (lethal && Math.random() < 0.10) { G.pool += 5; events.push('💰 Un cofre flotante: +5 al pozo'); }
  if (total && !alive().length) {
    const early = G.phase < 3 && !G.earlyRescue;
    if (early || (!G.lightning && Math.random() < 0.4)) { if (early) G.earlyRescue = true; else G.lightning = true; events.push(revive(shuffle(dead()).slice(0, Math.max(1, Math.ceil(total * 0.15))), '⚡ ¡Barco vacío! Un rayo milagroso trae de vuelta a')); }
    else { G.sunk = true; events.push('🌊 No queda nadie a bordo. El arca se hunde...'); }
  }

  if (!['vote', 'split', 'shop'].includes(c.kind)) { const f = G.mods.fifty; G.mods = {}; if (f) G.mods.fifty = true; }
  G.lastAnswers = A;
  G.result = { title, lines, events: events.filter(Boolean), correct: c.correct, opts: c.opts, text: c.text, kind: c.kind };
  G.stage = 'reveal'; G.cur = null; push();
}

// ---------- Vistas ----------
const goal = () => { const t = G.total0 || list().length; return { need: Math.max(1, Math.ceil(t * GOAL)), have: alive().length }; };
const mvps = () => [...list()].sort((a, b) => b.hits - a.hits).slice(0, 5).map(p => ({ name: p.name, ani: p.ani, hits: p.hits }));
const phaseInfo = () => ({ stage: G.stage, phase: G.phase, step: G.phase >= 0 ? PHASES[G.phase].steps.length - G.queue.filter(s => s[0] !== 'shop').length : 0, steps: G.phase >= 0 ? PHASES[G.phase].steps.length : 0, phaseName: G.phase >= 0 ? PHASES[G.phase].name : '', desc: G.phase >= 0 ? PHASES[G.phase].desc : '', mods: G.mods, pool: G.pool, goal: goal() });

function hview() {
  const c = G.cur; let q = null;
  if (G.stage === 'question' && c) {
    const { correct, items, ...rest } = c;
    const el = c.who === 'all' ? list() : alive();
    q = { ...rest, time: TIMES[c.kind] || TIME, dist: ['council', 'trial'].includes(c.kind) ? c.opts.map((_, i) => Object.values(G.answers).filter(a => a.i === i).length) : null, armed: G.armed, left: G.armed ? G.deadline - Date.now() : (TIMES[c.kind] || TIME) * 1000, answered: Object.keys(G.answers).length, eligible: el.length, hide: list()[0] ? list()[0].hide : [] };
  }
  return {
    ...phaseInfo(), phases: PHASES.map(p => p.name),  total: list().length, alive: alive().length,
    groups: G.groups.map((g, i) => ({ name: g, players: list().filter(p => p.group === i).map(p => ({ name: p.name, ani: p.ani, alive: p.alive, on: !!p.conn, immune: p.immune })) })),
    noGroup: list().filter(p => p.group == null).map(p => p.name),
    crew: list().map(p => ({ id: p.token, name: p.name, ani: p.ani, alive: p.alive, immune: p.immune, fifty: !!p.fifty, on: !!p.conn, g: p.group, ans: (G.stage === 'question' && !!G.answers[p.token]) || (G.stage === 'mini' && !!G.mini && (p.token in G.mini.scores || p.token in G.mini.arts || p.token in G.mini.votes)) })),
    q, mini: G.stage === 'mini' && G.mini ? miniView(null) : null, sunk: G.sunk, result: G.stage === 'reveal' ? G.result : null, mvps: G.stage === 'end' ? mvps() : [],
  };
}
function pview(p) {
  const c = G.cur;
  const s = { ...phaseInfo(), me: { name: p.name, ani: p.ani, group: G.groups[p.group] || null, gi: p.group, alive: p.alive, immune: p.immune, fifty: !!p.fifty }, groups: G.groups.map((g, i) => ({ name: g, n: list().filter(x => x.group === i).length })) };
  if (G.stage === 'question' && c) s.q = { kind: c.kind, text: c.text, opts: c.opts, accused: c.accused === p.token, dist: ['council', 'trial'].includes(c.kind) ? c.opts.map((_, i) => Object.values(G.answers).filter(a => a.i === i).length) : null, armed: G.armed, hinted: !!p.hinted, left: G.armed ? G.deadline - Date.now() : (TIMES[c.kind] || TIME) * 1000, can: (c.who === 'all' || p.alive) && c.accused !== p.token, mine: G.answers[p.token] ? G.answers[p.token].i : null, hide: p.hide || [], side: c.kind === 'splitQ' && G.sides ? G.sides[p.side] : null };
  if (G.stage === 'reveal' && G.result) { const a = G.lastAnswers[p.token]; s.result = { ...G.result, mine: a ? a.i : null }; }
  if (G.stage === 'mini' && G.mini) s.mini = miniView(p);
  if (G.stage === 'end') s.mvps = mvps();
  return s;
}
function miniView(p) {
  const m = G.mini, v = { id: m.id, type: m.type, phase: m.phase, armed: m.armed, left: m.armed ? m.deadline - Date.now() : m.dur * 1000, dur: m.dur, prompt: m.prompt, mode: m.mode, seed: m.seed, games: m.games };
  const sent = Object.keys(m.phase === 'vote' ? m.votes : (m.type === 'draw' ? m.arts : m.scores)).length;
  if (!p) return { ...v, text: m.text, sent, artists: m.type === 'draw' ? m.artists.length : 0, arts: m.phase === 'vote' ? Object.entries(m.arts).map(([t, img]) => ({ id: t, img, name: P[t] ? P[t].name : '', ani: P[t] ? P[t].ani : '' })) : null, voters: alive().length };
  let role = 'play';
  if (m.type === 'draw') role = m.phase === 'play' ? (m.artists.includes(p.token) ? 'draw' : 'wait') : (p.alive ? 'vote' : 'wait');
  return { ...v, role, goal: p.alive ? 'power' : 'revive', done: m.phase === 'vote' ? p.token in m.votes : (m.type === 'draw' ? p.token in m.arts : p.token in m.scores), myVote: m.votes[p.token] || null };
}
function push() {
  HOOKS.host(hview());
  for (const p of list()) if (p.conn) HOOKS.send(p.conn, pview(p));
}


const Game = {
  init(bank, hooks) { BANK = bank; Object.assign(HOOKS, hooks); reset(); push(); },
  next, push() { if (G && BANK) push(); },
  arm() { if (G.stage === 'question' && G.cur) arm(G.cur.id); if (G.stage === 'mini' && G.mini) arm(G.mini.id); },
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
        p = P[token] = { token, name, ani: pickAnimal(), group: null, alive: G.stage === 'lobby', immune: false, hide: [], hits: 0 };
      }
      if (p.conn && p.conn !== conn) try { p.conn.close(); } catch (e) {}
      p.conn = conn; conn._t = p.token; HOOKS.send(conn, { token: p.token }); return push();
    }
    const p = P[conn._t]; if (!p) return;
    if (m.type === 'group') { if (G.stage === 'lobby' && G.groups[m.gi] != null) { p.group = m.gi; push(); } }
    if (m.type === 'mini') {
      const g = G.mini; if (G.stage !== 'mini' || !g || g.id !== m.id) return;
      if (g.phase === 'play') {
        if (g.type === 'draw') { if (g.artists.includes(p.token) && typeof m.art === 'string' && m.art.startsWith('data:image/') && m.art.length < 120000) g.arts[p.token] = m.art; }
        else if (g.type === 'dict') { if (typeof m.text === 'string') g.scores[p.token] = m.text.slice(0, 300); }
        else if (typeof m.score === 'number') g.scores[p.token] = m.score;
        const need = g.type === 'draw' ? g.artists.length : list().filter(x => x.conn).length;
        const got = Object.keys(g.type === 'draw' ? g.arts : g.scores).length;
        if (m.final && got >= need) setTimeout(() => endPlay(g.id), 600);
      } else if (g.phase === 'vote' && p.alive && typeof m.vote === 'string' && m.vote !== p.token && m.vote in g.arts) {
        g.votes[p.token] = m.vote;
        if (Object.keys(g.votes).length >= alive().length) setTimeout(() => resolveMini(g.id), 800);
      }
      return push();
    }
    if (m.type === 'answer') {
      const c = G.cur, i = m.i;
      if (G.stage !== 'question' || !c || (c.who !== 'all' && !p.alive) || c.accused === p.token || (G.answers[p.token] && c.kind !== 'council')) return;
      if (typeof i !== 'number' || i < 0 || i >= c.opts.length || (p.hide || []).includes(i)) return;
      G.answers[p.token] = { i, t: Date.now() };
      const el = (c.who === 'all' ? list() : alive()).length - (c.accused ? 1 : 0), id = c.id;
      if (Object.keys(G.answers).length >= el && c.kind !== 'council') setTimeout(() => { if (G.cur && G.cur.id === id) resolve(); }, 800);
      push();
    }
  },
  closed(conn) { const p = P[conn._t]; if (p && p.conn === conn) { p.conn = null; push(); } },
};
