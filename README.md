# Fight Random

Arena online para 2–4 jugadores con combate incremental, personajes y mejoras acumulables.

## Modos

- **1v1** — 2 jugadores, primero en ganar 5 rondas.
- **1v1v1** — todos contra todos para 3 jugadores, primero en ganar 4 rondas.
- **2v2** — 4 jugadores, primer equipo en ganar 5 rondas.
- **NÚCLEO** — modo especial 1v1. Durante la ronda aparece un objetivo central. Capturarlo estando solo dentro de la zona concede 8 s de Sobrecarga: movimiento, cadencia y recuperación de habilidades mejorados. El objetivo reaparece si la ronda continúa.

## Personajes

### MIX

Perfil equilibrado y móvil.

- Vida: 155 en 1v1 / 170 en modos grandes.
- Velocidad base: 225.
- Cadencia base: 0.52 s.
- **Space — Dash:** desplazamiento rápido con breve invulnerabilidad. Recarga base: 1.9 s.
- **E — Bola de cañón:** proyectil explosivo de alto retroceso. Recarga base: 7.2 s.

Legendarias:
- Vector reforzado.
- Recámara de asedio.

Ilegales:
- Sobrecarga cinética.
- Munición de racimo.

### TRUCKS

Tanque lento centrado en resistencia y control de zona.

- Vida: 212 en 1v1 / 227 en modos grandes.
- Velocidad base: 160.
- Cadencia base: 0.68 s.
- **Space — Fortificar:** reduce un 42% el daño durante 1.45 s y ralentiza el movimiento. Recarga base: 5.0 s.
- **E — ¡Fuego!:** secuencia de proyectiles incendiarios que crea zonas persistentes. Recarga base: 8.8 s.

Legendarias:
- Blindaje laminado.
- Compuesto de napalm.

Ilegales:
- Blindaje reactivo.
- Tormenta de fuego.

### LIZZY

Asesina rápida y frágil orientada a reposicionamiento y burst a corta distancia.

- Vida: 140 en 1v1 / 155 en modos grandes.
- Velocidad base: 258.
- Cadencia base: 0.44 s.
- Daño del disparo principal inferior al de MIX.
- **Space — Invisibilidad:** desaparece durante 1.85 s y se mueve más rápido. Atacar o recibir daño rompe la invisibilidad. Recarga base: 5.4 s.
- **E — Navajazo:** ataque frontal de corto alcance y alto daño. Recarga base: 5.8 s.

Legendarias:
- **Camuflaje adaptativo:** más duración, más velocidad mientras está oculta y menor recarga.
- **Hoja extendida:** más alcance, daño y una pequeña reducción de recarga.

Ilegales:
- **Depredadora:** usar Navajazo desde invisibilidad potencia el golpe y devuelve parte de la recarga de Invisibilidad si impacta.
- **Ejecución:** Navajazo causa daño adicional contra enemigos por debajo del 35% de vida.

## Cooldowns

Los tiempos de recarga se han revisado como sistema conjunto para que cada personaje tenga ventanas claras:

- MIX usa habilidades con mucha frecuencia y depende de movilidad.
- TRUCKS tiene ventanas defensivas/ofensivas más espaciadas.
- LIZZY alterna entrada, burst y retirada.

La mejora rara **Refrigeración** reduce de forma moderada tanto la habilidad básica como la especial y sigue siendo útil con todos los personajes.

## Feedback de combate

Los impactos tienen ahora feedback inmediato:

- hitmarker;
- números de daño;
- feedback ampliado para golpes fuertes y explosiones;
- banner de eliminación/eliminado;
- pequeño feedback sonoro generado por el navegador;
- efectos visuales específicos para invisibilidad, revelado y Navajazo.

Los efectos de daño por tiempo no generan números constantemente para evitar ruido.

## Combate incremental

Las rondas avanzadas aumentan ligeramente velocidad de movimiento/proyectil y frecuencia de pickups, pero no escalan el daño global de forma automática. La tormenta sigue cerrando partidas demasiado largas.

## Mapas

Mapas estándar:
- Pilares
- Cruce
- Cuatro Esquinas
- Arsenal

Mapas grandes:
- Hangar — 1v1v1 / 2v2.
- Fábrica — 2v2.

NÚCLEO utiliza el pool de mapas estándar de 1v1.

## Pickups

- **Curación:** cruz médica verde, +32 HP.
- **Velocidad:** doble flecha azul, movilidad temporal.
- **Escudo:** escudo gris, bloquea un impacto.

## Controles

- `WASD` — movimiento
- Ratón — apuntar
- Click izquierdo — disparo principal
- `Space` — habilidad básica
- `E` — habilidad especial
