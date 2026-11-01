// Banco de frases del Capitán Loro. {n} = cantidad, {name} = un jugador, {ani} = su animal, {phase} = isla.
// Agrega líneas libremente: el narrador elige al azar y evita repetir las últimas.
const LINES = {
  lobby: [
    'Bienvenidos a bordo de A La Deriva. Yo soy el Capitán Loro, y no, no hay chalecos para todos.',
    'Suban, suban. El barco es seguro. Creo. Nunca lo he probado con tanta gente.',
    'Escaneen el código y elijan su manada. Los que no elijan, los elijo yo, y tengo pésimo criterio.',
    'Tripulación, recuerden: si hay que abandonar el barco, el loro sale primero. Tengo alas.',
    'Qué lindo cumpleaños. Lástima que lo vamos a celebrar en medio del océano.',
    'Se aceptan pasajeros de todas las especies. Excepto tiburones. Ya saben por qué.',
  ],
  join: ['Sube a bordo {name}, como {ani}. Qué valiente.', '{name} se une a la tripulación. No toques nada.', 'Llegó {name}. Bienvenido, futuro náufrago.', 'Ah, {name}. Te esperaba. Bueno, no tanto.', '{name} sube al barco con cara de saber nadar. Ya veremos.'],
  start: ['¡Levanten el ancla! Zarpamos rumbo a lo desconocido. Y a la torta.', 'Motores encendidos, velas arriba, dignidad abajo. ¡Vámonos!', 'Que comience la travesía. Si alguien se marea, que vomite hacia el lado del viento.'],
  intro: [
    ['Zarpamos. Preguntas fáciles para calentar. Si fallan acá, mejor ni se presenten al resto.', 'Primera isla. Lo fácil primero, para que la caída duela más después.', 'Bienvenidos al Zarpe. Aquí se separan los marineros de los turistas.'],
    ['La Isla del Escudo. Si suficientes aciertan, los protejo a todos. Si no, al agua con dignidad.', 'Isla del Escudo. Trabajen juntos. Sé que es difícil para algunos.', 'Escudos arriba, cerebros encendidos. O al menos uno de los dos.'],
    ['Isla del Dilema. Aquí deciden ustedes, así que si sale mal, no me miren a mí.', 'Bienvenidos al Dilema. La democracia, ese hermoso caos.', 'Isla del Dilema. Voten con sabiduría. O con el corazón. O como siempre: al azar.'],
    ['Se viene la tormenta. Agárrense de algo que no sea otro animal.', 'La Tormenta. Relámpagos, lluvia y preguntas difíciles. Mi clima favorito.', 'Atención, viene el temporal. Recomiendo rezar, saber cosas, o ambas.'],
    ['Isla de los Bandos. Nada une más que separarse por una opinión irrelevante.', 'Bandos. Hoy descubrirán quiénes son sus verdaderos enemigos. Spoiler: los del otro lado.', 'Isla de los Bandos. Cada bando cuida a los suyos. Como en la vida, pero mojado.'],
    ['Bahía del Rescate. Los náufragos también juegan. Sí, incluso los que se cayeron en la primera.', 'Bahía del Rescate. Hoy pescamos compañeros. Con suerte, no tiburones.', 'Náufragos, prepárense. Esta bahía es su segunda oportunidad. No la desperdicien como la primera.'],
    ['Isla de las Manadas. Confíen en su grupo. Error clásico, pero adelante.', 'Manadas. Aquí manda la mayoría. Que el más sabio guíe. Si existe.', 'Isla de las Manadas. Si tu grupo se equivoca, te hunde con él. Romántico, ¿no?'],
    ['Mar de la Presión. Aquí es donde los valientes lloran en silencio.', 'Mar de la Presión. Las preguntas pesan más que el ancla.', 'Bienvenidos a la presión. Respiren. Ah, cierto, bajo el agua no se puede.'],
    ['El Último Faro. Última oportunidad de pescar a sus compañeros.', 'El Faro. La luz al final del túnel. O del océano. Lo que sea.', 'Último Faro. Después de esto, solo queda el puerto. O el fondo del mar.'],
    ['Puerto Final. Nivel máximo. Si llegamos, hay torta. Si no, hay tiburones.', 'El Puerto Final. Todo lo que aprendieron en la vida los trajo hasta aquí. Qué miedo.', 'Última isla. Si fallan ahora, les juro que lo cuento en todos los cumpleaños.'],
  ],
  q: {
    solo: ['A ver quién sabe algo.', 'Responde rápido, que el mar no espera.', 'Pregunta fácil. Para mí.', 'Esta la sabe hasta la rata.', 'Piensa. Sé que duele.', 'Una más. Y van cayendo.', 'Concéntrense. Si pueden.', 'Esta pregunta tiene nombre y apellido. Adivinen de quién.', 'Les tengo fe. Poca, pero fe.', 'Mi abuela loro sabía esta. Y era analfabeta.', 'Siguiente pregunta. Sin presión. Bueno, con un poco.', 'Atención, que esta tiene trampa. O no. No les voy a decir.'],
    hard: ['Esta es difícil. Me encanta verlos sufrir.', 'Pregunta de alto nivel. Para la tripulación de bajo nivel.', 'Uy, esta duele. Prepárense para nadar.', 'Si aciertan esta, les regalo una pluma. Mía, no.', 'Pregunta de experto. ¿Hay algún experto a bordo? Pensé que no.'],
    easy: ['Esta es regalada. Si la fallan, no tienen perdón.', 'Facilita. Hasta la jirafa la sabe, y tiene el cerebro lejísimos.', 'Pregunta de jardín infantil. Ni se atrevan a fallarla.'],
    shield: ['Si el sesenta por ciento acierta, nadie se moja.', 'Trabajo en equipo, ese mito.', 'Escudo colectivo. Todos dependen de todos. Qué miedo.', 'Si llegan a la meta, los protejo. Si no, los miro hundirse.'],
    group: ['Ahora cuenta lo que diga tu manada. Elijan bien a quién seguir.', 'Respuesta grupal. Que el más sabio guíe. Si hay alguno.', 'Manada, respondan juntos. O al menos parecido.', 'Aquí cuenta la mayoría del grupo. Así que sí, la culpa es compartida.'],
    split: ['Elijan bando. No hay respuesta correcta, solo consecuencias.', 'Divídanse. Esto va a doler a la amistad.', 'Elijan con el corazón. El cerebro lo van a necesitar después.'],
    splitQ: ['Cada bando necesita la mitad de aciertos. Sin presión.', 'Bandos, a defender su honor. Lo poco que queda.', 'El bando que falle, pierde gente. Así de simple, así de cruel.'],
    trial: ['¡Juicio a bordo! {name} está acusado de que {charge}. {name}, tienes treinta segundos para defenderte en voz alta. Los demás, voten culpable o inocente.', 'Orden en la sala. Se acusa a {name} de que {charge}. Que hable el acusado, y que la tripulación decida.', 'Tenemos un sospechoso: {name}. Dicen que {charge}. Defiéndete, {name}, porque la tripulación tiene hambre de justicia.'],
    council: ['¡Consejo del barco! Debatan en voz alta. Cuenta lo que vote la mayoría, y pueden cambiar su voto hasta el final.', 'Hora del Consejo. Discutan, peleen, convenzan. Los que voten mal y pierdan, al agua.', 'Consejo de la tripulación. Cuarenta y cinco segundos para ponerse de acuerdo. Suerte con eso.'],
    revive: ['Náufragos, esta es su oportunidad. Los de arriba, no los dejen colgando.', 'Pregunta de rescate. Los de abajo también responden. Remojados, pero responden.', 'Cada cuatro aciertos a bordo, lanzo un salvavidas. Hagan cuentas.'],
    vote: ['Votación. La democracia: el arte de equivocarse todos juntos.', 'Hora de votar. Recuerden, después no se quejen.', 'Decidan ustedes. Yo solo manejo el barco. Mal, pero lo manejo.'],
    shop: ['Hora de gastar el pozo. Nada de comprar maní, por favor.', 'La tienda está abierta. Gasten con cabeza. Si tienen.', 'Pozo común, decisión común. Elijan antes de que lo gaste yo en galletas.'],
  },
  mini: {
    draw: ['¡Galería del naufragio! Los náufragos dibujan en su celular: {prompt}. Los de a bordo eligen el {mode} dibujo, y ese vuelve al barco.', 'Hora del arte. Náufragos, dibujen esto: {prompt}. La tripulación votará el {mode}. Sí, también el peor puede ganar.'],
    math: ['Cálculo bajo el agua. Treinta segundos para resolver sumas y restas. Los náufragos con más aciertos vuelven, y el mejor de a bordo gana un premio.', 'Matemática relámpago. Hagan cuentas, rápido, que el agua sube. Los mejores náufragos vuelven a bordo.'],
    dict: ['El dictado del loro. Escuchen bien y escriban exactamente lo que digo. El que escriba más parecido gana.', 'Dictado. Voy a decir una frase y la escriben en el celular. Atención, que no la repito... bueno, una vez.'],
    wario: ['¡Microjuegos relámpago! Cinco desafíos de cinco segundos en el celular. Tocar, agitar, inclinar. Sigan las instrucciones, rápido.', 'Microjuegos. Cinco locuras seguidas. Si dudan, pierden. Si no dudan, probablemente también.'],
    best: 'mejor', worst: 'peor',
  },
  go: ['¡Ya!', '¡Tiempo corriendo!', '¡Ahora!', '¡Adelante!', '¡Vamos!'],
  none: ['Nadie al agua. Qué aburrido, yo quería ver chapoteo.', 'Impecable. Sospechosamente impecable.', 'Todos a bordo. Me están dejando sin trabajo.', 'Ni uno al agua. ¿Están haciendo trampa? No me importa, me gusta.', 'Perfecto. Hasta me emocioné un poquito.', 'Nadie cayó. Los tiburones están decepcionados.'],
  few: ['Uno menos a bordo. Los tiburones mandan saludos.', 'Al agua. Por lo menos el agua está tibia. Mentira.', 'Chao, náufrago. Te guardo un pedazo de torta. Mojado.', 'Alguien se dio un chapuzón. Valiente o ignorante.', '{n} al agua. Los tiburones les mandan saludos.', 'Adiós, {name}. Nadie te va a extrañar... bueno, un poco.', '{name} decidió darse un chapuzón. Valiente o ignorante.', 'Al agua {name}. Por lo menos el agua está tibia. Mentira.', '{name}, el {ani} más mojado del océano.', 'Perdimos a {name}. Que en paz nade.', '{name} cayó. Alguien tírele una galleta.', 'Chao {name}. Te guardo un pedazo de torta. Mojado.'],
  many: ['Eso fue un naufragio en toda regla.', '¡Hombre al agua! Y mujer. Y jirafa. Y básicamente todos.', 'Perdimos a {n}. Voy a necesitar un barco más chico.', '{n} al agua de una sola vez. Récord personal de la tripulación.', 'Eso no fue una pregunta, fue una masacre acuática.', 'Se cayeron {n}. El barco ahora flota mejor, eso sí.'],
  back: ['Un náufrago vuelve a bordo, empapado y con dignidad cero.', 'Miren quién volvió del más allá. Huele a pescado, pero volvió.', 'Bienvenido de vuelta. No te acostumbres.', '{name} vuelve a bordo, empapado y con dignidad cero.', 'Miren quién volvió. Seca tus patas antes de entrar, {name}.', '{name} regresa del más allá. Huele a pescado, pero regresa.', 'Bienvenido de vuelta, {name}. No te acostumbres.', '{name} está de vuelta. Los tiburones lloran.'],
  noMajority: ['Sin mayoría no hay compra. La democracia, otra vez, decepcionando.', 'Cada uno votó por lo suyo. Felicitaciones, no compraron nada.', 'Ni para ponerse de acuerdo sirven. El pozo se queda donde está.'],
  guilty: ['Culpable. A la plancha, sin derecho a pataleo.', 'La tripulación ha hablado: al agua con el criminal.', 'Culpable. Que los tiburones decidan si apelar.'],
  innocent: ['Inocente. Aunque yo sigo sospechando.', 'Absuelto. Pero te estaré vigilando.', 'Inocente. La justicia es ciega, y a veces también sorda.'],
  councilOk: ['El Consejo acertó. Pensar juntos funciona, ¿quién lo diría?', 'Debate exitoso. Por una vez, la mayoría tenía razón.'],
  miniFall: ['Y el peor de a bordo se va al agua por flojo.', 'Último lugar a bordo. Al agua, sin pataleo.', 'Y el peor de a bordo, {name}, se va al agua por flojo.', 'Por cierto, {name}, último lugar. Al agua.', '{name} jugó tan mal que el barco lo expulsó solo.'],
  vote: ['La democracia ha hablado. Yo no me hago responsable.', 'Decisión tomada. Espero que sepan lo que hicieron.', 'Votaron. Ahora vivan con las consecuencias.', 'Interesante elección. Equivocada, pero interesante.'],
  shieldOk: ['Escudo activado. Por una vez, trabajaron juntos.', 'Lo lograron. Están protegidos. Disfrútenlo, dura poco.', 'Escudo arriba. Estoy casi orgulloso.'],
  shieldNo: ['Sin escudo. El trabajo en equipo les queda grande.', 'No llegaron. El escudo se fue a la basura, como sus respuestas.', 'Sin protección. Que el mar tenga piedad.'],
  shop: ['Compra realizada. Gastando como si no hubiera mañana. Que quizás no la haya.', 'Buena compra. O mala. Lo sabremos pronto.', 'Gastaron el pozo. Mi comisión la quiero en semillas.'],
  save: ['Ahorraron. Muy responsables. Muy aburridos.', 'Guardan el pozo. ¿Para qué? ¿Para su funeral?', 'Ahorro total. El banco del loro les agradece.'],
  miniEnd: ['Terminó el minijuego. Algunos brillaron. Otros, bueno, participaron.', 'Se acabó. Qué talento. Escaso, pero talento.', 'Fin del desafío. Veamos quién se salva.'],
  art: ['Qué obra maestra. O qué crimen. Depende de quién mire.', 'Esto debería estar en un museo. Del horror.', 'Picasso estaría orgulloso. O asustado.'],
  sunk: ['No queda nadie a bordo. El barco se hunde. Fue un honor. Mentira, fue un desastre.'],
  win: ['¡Llegamos a puerto! Contra todo pronóstico, especialmente el mío. ¡Feliz cumpleaños!', '¡Puerto a la vista! Lo lograron. Hay torta para todos. Bueno, para los vivos.', '¡Victoria! Nunca dudé de ustedes. Bueno, dudé todo el rato.'],
  lose: ['El barco se hundió. Pero miren el lado bueno: nadie va a recordar esto. Excepto yo.', 'No llegamos. El puerto queda para otro cumpleaños.', 'Naufragio total. Igual hay torta. Mojada, pero hay.'],
  trialGen: ['¡Juicio a bordo! Tenemos un acusado. Que se defienda en voz alta, y la tripulación vote culpable o inocente.', 'Orden en la sala. Hay un sospechoso entre nosotros. Acusado, defiéndete. Tripulación, a votar.'],
  drawGen: ['¡Galería del naufragio! Los náufragos dibujan en su celular, y la tripulación vota. El autor ganador vuelve a bordo. Hoy dibujan esto:', 'Hora del arte, náufragos. Saquen el lápiz digital. El tema es:'],
  modeBest: ['Gana el mejor dibujo. Sin presión, artistas.'],
  modeWorst: ['Ojo: esta vez gana el PEOR dibujo. Hagan su mejor esfuerzo por hacerlo mal.'],
  repeat: ['Repito.'],
  voteBest: ['¡A votar! Los de a bordo eligen en su celular el mejor dibujo.'],
  voteWorst: ['¡A votar! Los de a bordo eligen en su celular el peor dibujo. Sean crueles.'],
  idle: ['¿Siguen ahí? El barco no avanza solo.', 'Capitán esperando órdenes. Y galletas.', 'Cuando quieran, eh. El océano tiene todo el día. Yo no.'],
};
const _recent = [];
function line(key, vars = {}) {
  let arr = key.split('.').reduce((o, k) => o && o[k], LINES);
  if (!Array.isArray(arr)) return '';
  let opts = arr.filter(s => !_recent.includes(s)); if (!opts.length) opts = arr;
  const s = opts[Math.floor(Math.random() * opts.length)];
  _recent.push(s); if (_recent.length > 40) _recent.shift();
  return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}

// ---------- audios pregrabados ----------
function audioKey(t) {
  const s = String(t).normalize('NFC').replace(/\s+/g, ' ').trim();
  let h1 = 0x811c9dc5, h2 = 0x01000193 ^ s.length;
  for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 16777619) >>> 0; h2 = Math.imul(h2 + c, 2246822519) >>> 0; h2 = (h2 << 13 | h2 >>> 19) >>> 0; }
  return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0');
}
// Todas las frases fijas (sin {variables}) que se pueden pregrabar
function fixedLines() { const out = new Set(); const walk = o => { if (typeof o === 'string') { if (!/\{\w+\}/.test(o)) out.add(o); } else if (o && typeof o === 'object') Object.values(o).forEach(walk); }; walk(LINES); return [...out]; }

// Carga los paquetes audio/pack1.zip, pack2.zip… (cada uno trae audio/<clave>.mp3 y audio/manifest.json)
async function loadAudioPacks(onUrl) {
  const man = {};
  for (let i = 1; i <= 20; i++) {
    let r; try { r = await fetch(`audio/pack${i}.zip`); } catch (e) { break; }
    if (!r.ok) break;
    const zip = await JSZip.loadAsync(await r.arrayBuffer());
    const mf = zip.file('audio/manifest.json'); const m = mf ? JSON.parse(await mf.async('string')) : {};
    await Promise.all(Object.values(zip.files).map(async f => {
      const k = (f.name.match(/([0-9a-f]{16})\.mp3$/) || [])[1]; if (!k) return;
      man[k] = m[k] || '';
      if (onUrl) onUrl(k, URL.createObjectURL(new Blob([await f.async('arraybuffer')], { type: 'audio/mpeg' })));
    }));
  }
  return man;
}
