# 🚢 El Arca a la Deriva — trivia cooperativa de cumpleaños, 30+ jugadores

Cada invitado es un animal al azar a bordo del Arca. El barco navega por 10 islas; quien falla cae al agua y puede ser rescatado. Un capitán loro sarcástico narra en voz alta (botón 🔊 Narrador; usa la voz en español del navegador).

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

## Las 10 islas (34 desafíos)
| # | Isla | Desafíos | Dificultad |
|---|------|----------|-----------|
| 1 | Zarpe | 4 trivias individuales | ★–★★ |
| 2 | Isla del Escudo | Escudo colectivo (60%) + 2 trivias | ★★ |
| 3 | Isla del Dilema | Votación + 3 trivias | ★★–★★★ |
| 4 | La Tormenta | 4 trivias | ★★★ |
| 5 | Isla de los Bandos | Elegir bando + 2 desafíos de bandos (50%) | ★★★ |
| 6 | Bahía del Rescate | Rescate + trivia + rescate | ★★–★★★ |
| 7 | Isla de las Manadas | 3 respuestas de grupo | ★★★★ |
| 8 | Mar de la Presión | Escudo colectivo + 2 trivias | ★★★★ |
| 9 | El Último Faro | Votación + rescate + trivia | ★★★–★★★★ |
| 10 | Puerto Final | Grupo + 3 trivias | ★★★★★ |

## Eventos automáticos (con probabilidad, máximo un rescate automático por pregunta)
- 🚨 **Bote de emergencia** (35%, máx. 2 por partida): si quedan ≤25% a bordo, vuelve el 25% de los náufragos.
- 🔥 **Ronda perfecta** (40%): si todos aciertan, vuelve 1 al azar.
- 🐬 **Delfín amable** (6%): vuelve 1 al azar.
- 💰 **Cofre flotante** (10%): +5 al pozo.
- ⚡ **Rayo milagroso**: si el barco queda vacío, vuelve el 15%.
- En los rescates, cada 4 a bordo que aciertan lanzan 1 salvavidas.

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
Ajustes en `engine.js`: `GOAL` (meta de sobrevivientes), `TIME` (segundos por pregunta) y el arreglo `PHASES`.
