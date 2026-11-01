# 🎂 Trivia de Cumpleaños — 100% cooperativa, 30+ jugadores

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

## Las 10 fases
| # | Fase | Mecánica | Dificultad |
|---|------|----------|-----------|
| 1 | Calentamiento | Trivia individual: si fallas, quedas fuera | ★ |
| 2 | Escudo Colectivo | Si el 60% del equipo acierta, todos ganan inmunidad | ★★ |
| 3 | El Dilema | Votación grupal + trivia | ★★ |
| 4 | Escalada | Trivia individual | ★★★ |
| 5 | Bandos | Se dividen por opinión; cada bando debe llegar al 50% de aciertos (si ambos llegan: +10 al pozo) | ★★★ |
| 6 | Rescate | Vivos y eliminados responden; cada 3 vivos que aciertan traen de vuelta a 1 eliminado que acertó | ★★ |
| 7 | Fuerza de Grupo | Cuenta la respuesta de la mayoría del grupo; si el grupo acierta, todos se salvan | ★★★★ |
| 8 | Presión | Escudo colectivo + trivia difícil | ★★★★ |
| 9 | Último Rescate | Dilema + rescate | ★★★ |
| 10 | La Gran Final | Grupo + 2 individuales | ★★★★★ |

## Eventos automáticos (gatillantes)
- 🚨 **Rescate de emergencia**: si quedan ≤25% vivos, vuelve el 30% de los eliminados (1 vez por fase).
- 🔥 **Racha perfecta**: si todos los vivos aciertan, vuelven 2 al azar.
- 👻 **Fantasma afortunado** (15%): vuelve 1 al azar.
- 💰 **Lluvia de puntos** (15%): +5 al pozo común.
- ⚡ **Resurrección masiva**: si nadie queda en pie, vuelve el 20%.

## Dilemas grupales (vota todo el equipo vivo, gana la mayoría)
Portal (pagar puntos para revivir 3) · Doble puntos vs. escudo para todos · Dado del destino · Pacto oscuro (revivir a todos pero la siguiente es nivel 5).

## Pozo común y tienda del equipo
Cada acierto suma al **pozo común**, según la dificultad de la pregunta (x2 si el equipo lo votó). No hay puntaje individual.
Al final de cada fase, el equipo **vota** en qué gastar el pozo:
- 🛡️ **Escudo** (10): nadie puede ser eliminado en la próxima pregunta.
- 🔁 **Revivir a 3** compañeros al azar (12).
- ✂️ **50/50 para todos** (6).
- 💰 Ahorrar.

Al final se muestra quiénes aportaron más aciertos al equipo, como reconocimiento y no como ranking.

## Personalizar preguntas
Edita `questions.json` (en la raíz):
- `trivia`: `{"d": dificultad 1-5, "q": pregunta, "o": [4 opciones], "a": índice de la correcta (0 = primera)}`. Las opciones se mezclan solas.
- `splits`: preguntas de opinión con 2 opciones para formar bandos.

Tip: agrega preguntas sobre ti para darle toque de cumpleaños.
Ajustes en `engine.js`: `GOAL` (meta de sobrevivientes), `TIME` (segundos por pregunta) y el arreglo `PHASES`.
