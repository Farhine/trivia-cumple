# 🚢 A La Deriva — trivia cooperativa de cumpleaños, 30+ jugadores

Cada invitado es un animal al azar a bordo del barco. El barco navega por 10 islas; quien falla cae al agua y puede ser rescatado. Un capitán loro sarcástico narra en voz alta (botón 🔊 Narrador; usa la voz en español del navegador).

Todos los invitados son **un solo equipo**. Los grupos del lobby solo organizan dinámicas y no compiten entre sí. Al final **ganan todos o pierden todos**: la meta es terminar con al menos el **40% del equipo vivo**.

## Cómo jugar en la fiesta (GitHub Pages, sin instalar nada)
1. Activa GitHub Pages en el repositorio: **Settings → Pages → Branch: `main` / `(root)` → Save**.
2. En el notebook conectado a la TV abre **https://farhine.github.io/trivia-cumple/host.html**.
3. Los invitados escanean el QR o entran a https://farhine.github.io/trivia-cumple/ con el **código de sala**. Pueden usar WiFi o datos móviles.
4. Avanza con **Siguiente** o la **barra espaciadora**.

> ⚠️ La partida vive en la pestaña del host: **no la cierres ni la recargues** durante el juego. Si un celular pierde conexión, se reconecta solo.
> Para probar solo, abre el host en una ventana y `index.html` en otra de incógnito.

### Modo offline (opcional, sin internet)
`npm install && npm start` levanta la versión con servidor local (carpeta `public/`) en http://localhost:3000/host.html.

## Lobby
- Edita los nombres de los grupos (uno por línea) y presiona *Guardar grupos*.
- Cada jugador elige su grupo desde el celular, o presiona *🔀 Repartir al azar*.
- Quien llega tarde entra eliminado y puede volver en un rescate.

## Narrador
- El Capitán Loro lee cada pregunta y comenta con humor (frases en `narrator.js`).
- **Ritmo:** el cronómetro arranca cuando el loro termina de leer y Siguiente espera a que termine de hablar. **⏩ Auto** avanza solo. `Shift+S` lo hace callar.
- **Voz (botón 🎙️):**
  - *Navegador* (gratis): en **Microsoft Edge** hay voces "Natural" en español muy buenas.
  - *OpenAI* (`gpt-4o-mini-tts`): voz actuada con instrucciones de "loro pirata sarcástico". Necesita clave de platform.openai.com.
  - *ElevenLabs*: la más natural. Necesita clave de elevenlabs.io y un `voice_id`.
  - La clave queda guardada solo en el navegador del host. Si la nube falla, vuelve a la voz del navegador.

## Antes de empezar
En el lobby, cada jugador puede tocar **🧪 Probar microjuegos y giroscopio** para practicar los 6 microjuegos y comprobar que su celular entrega datos de los sensores.

## Momentos de interacción
- ⚖️ **Juicio a bordo:** el loro acusa a alguien de un crimen absurdo. El acusado se defiende en voz alta 35 s y el resto vota. Culpable por mayoría → al agua y +10 al pozo; inocente → recibe un escudo personal.
- 🗣️ **Consejo del barco:** pregunta difícil con 45 s para debatir en voz alta. Los votos se ven en vivo y se pueden cambiar. Cuenta la mayoría del barco; si se equivocan, caen quienes votaron mal.
- También: votaciones de dilemas, tienda, bandos, respuestas de manada y la galería de dibujos.
- 🛒 **Tienda:** solo se compra si una opción tiene **mayoría absoluta** (más de la mitad de los que están a bordo).

## Las 10 islas
| # | Isla | Desafíos |
|---|------|----------|
| 1 | Zarpe | 4 trivias ★–★★ |
| 2 | Isla del Escudo | Escudo colectivo + 2 trivias + ⚡ microjuegos |
| 3 | Isla del Dilema | Votación + ⚖️ juicio + 3 trivias |
| 4 | La Tormenta | 4 trivias ★★★ + 🧮 cálculo |
| 5 | Isla de los Bandos | Bandos + 2 desafíos de bando + 🗣️ consejo |
| 6 | Bahía del Rescate | 🎨 dibujo + rescate + trivia + 📝 dictado |
| 7 | Isla de las Manadas | 3 respuestas de grupo + ⚖️ juicio + ⚡ microjuegos |
| 8 | Mar de la Presión | Escudo + 2 trivias ★★★★ + 🧮 cálculo |
| 9 | El Último Faro | Votación + 🎨 dibujo + 🗣️ consejo + rescate + trivia |
| 10 | Puerto Final | 🗣️ consejo + grupo + 3 trivias ★★★★★ |

## Minijuegos
Los **náufragos** compiten para volver a bordo (vuelve 1 por cada 4 náufragos, mínimo 1); el mejor **de a bordo** gana un power-up personal, y **el peor de a bordo cae al agua** (1 por cada 6 a bordo): 🔎 pista secreta (2 opciones menos en su próxima pregunta) o 🛡️ escudo personal.
- 🎨 **Galería del naufragio:** los náufragos dibujan en el celular; los de a bordo votan el mejor (o el peor) dibujo.
- 🧮 **Cálculo bajo el agua:** 30 s de sumas, restas y multiplicaciones.
- 📝 **Dictado del loro:** el loro dicta una frase dos veces; gana la escritura más precisa.
- ⚡ **Microjuegos relámpago:** 5 retos de 5 s estilo WarioWare: tocar rápido, agitar el celular, inclinarlo (giroscopio), semáforo, no tocar y deslizar. En iPhone se pide permiso de sensores con un botón.

## Eventos automáticos
- 🚨 **Bote de emergencia** (35%, máx. 2 por partida) si quedan ≤25% a bordo.
- 🔥 **Ronda perfecta** (40%): vuelve 1.  🐬 **Delfín** (6%): vuelve 1.  💰 **Cofre** (10%): +5 al pozo.
- ⚡ Si el barco queda vacío: en las islas 1–3 hay un rescate garantizado (una vez); después, 40% de rayo milagroso (una vez). Si no sale, **el barco se hunde** y termina la partida.

## Dilemas grupales (vota todo el equipo vivo, gana la mayoría)
Portal (pagar puntos para revivir 3) · Doble puntos vs. escudo para todos · Dado del destino · Pacto oscuro (revivir a todos pero la siguiente es nivel 5).

## Pozo común y tienda del equipo
Cada acierto suma al **pozo común**, según la dificultad de la pregunta (x2 si el equipo lo votó). No hay puntaje individual.
Al final de cada fase, el equipo **vota** en qué gastar el pozo:
- 🛡️ **Escudo** (10): nadie puede ser eliminado en la próxima pregunta.
- 🛟 **Rescatar a 2** náufragos al azar (15).
- ✂️ **50/50 para todos** (6).
- 💰 Ahorrar.

Al final se muestra quiénes aportaron más aciertos al equipo, como reconocimiento y no como ranking.

## Personalizar preguntas
Edita `questions.json` (en la raíz):
- `trivia`: `{"d": dificultad 1-5, "q": pregunta, "o": [4 opciones], "a": índice de la correcta (0 = primera)}`. Las opciones se mezclan solas.
- `splits`: preguntas de opinión con 2 opciones para formar bandos.

Tip: agrega preguntas sobre ti para darle toque de cumpleaños.
Ajustes en `engine.js`: `GOAL` (meta), `TIME` (segundos por pregunta), `PHASES`, `DRAW_PROMPTS` y `DICTATIONS`.
