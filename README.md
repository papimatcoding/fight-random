# Fight Random

Arena online para 2–4 jugadores. El host simula el combate y los clientes envían únicamente inputs y elecciones.

## Modos

- **1v1** — 2 jugadores, primero en ganar 5 rondas.
- **1v1v1** — todos contra todos para 3 jugadores, primero en ganar 4 rondas.
- **2v2** — 4 jugadores, primer equipo en ganar 5 rondas.

## Personajes

### MIX

Primer personaje jugable y referencia de balance.

- Perfil: equilibrado, con movilidad ligeramente superior a la base.
- **Espacio — Dash:** desplazamiento rápido con una breve ventana de invulnerabilidad.
- **E — Bola de cañón:** proyectil grande con 8.5 s de recarga base; causa daño explosivo y un retroceso elevado.
- Las mejoras comunes, raras y épicas son generales.
- Las mejoras legendarias e ilegales modifican habilidades del personaje.

Mejoras de habilidad actuales:

- **Legendaria — Vector reforzado:** mejora impulso y recarga del dash y añade una onda de retroceso al finalizar.
- **Legendaria — Recámara de asedio:** mejora recarga, radio y retroceso de la Bola de cañón.
- **Ilegal — Sobrecarga cinética:** reduce de forma agresiva la recarga del dash.
- **Ilegal — Munición de racimo:** añade tres explosiones secundarias a la Bola de cañón.

## Rarezas y comeback

La probabilidad base favorece común y raro. Una racha de rondas perdidas desplaza gradualmente peso hacia épico, legendario e ilegal, con un límite de tres derrotas consecutivas.

Legendario e ilegal solo entran en el sorteo cuando el personaje dispone de mejoras de habilidad de esa rareza. Ilegal no aparece antes de la ronda 5 y legendario no aparece antes de la ronda 3.

Las mejoras parten de **nivel 0** y se muestran con ese nivel antes de ser adquiridas.

## Combate

- Vida base de MIX: 155 en 1v1 y 170 en modos de 3–4 jugadores.
- Velocidad base: 225.
- Cadencia base: un disparo cada 0.52 s.
- Daño base: 10.5.
- Multishot usa daño decreciente por proyectil.
- El fuego ha sido reducido y funciona como presión ligera, no como fuente principal de daño.
- Las explosiones aplican retroceso radial y feedback visual con flash, onda expansiva, partículas y screen shake.
- Los barriles pueden encadenar explosiones y dañan a cualquier jugador, incluidos aliados en 2v2.
- Curación, escudo y velocidad siguen apareciendo como pickups.

## Tormenta

Cada ronda dispone de una fase de combate libre. A los 34 segundos comienza la tormenta y el área segura se cierra durante 26 segundos hasta un radio mínimo. Permanecer fuera inflige daño creciente y empuja hacia el centro.

Su función es cerrar rondas estancadas, no decidir los intercambios iniciales.

## Controles

- `WASD` — movimiento
- Ratón — apuntar
- Click izquierdo — disparo principal
- `Space` — Dash
- `E` — Bola de cañón

La arena se adapta a 16:9 y dispone de pantalla completa.
