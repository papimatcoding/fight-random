# Fight Random

Arena online para 2–4 jugadores con combate incremental, personajes y mejoras acumulables.

## Modos

- **1v1** — 2 jugadores, primero en ganar 5 rondas.
- **1v1v1** — todos contra todos para 3 jugadores, primero en ganar 4 rondas.
- **2v2** — 4 jugadores, primer equipo en ganar 5 rondas.

El host sigue siendo autoritativo: los clientes envían inputs, personaje y elecciones; el host resuelve movimiento, daño, habilidades, pickups, tormenta y rondas.

## Personajes

### MIX

Perfil equilibrado y móvil.

- Vida: 155 en 1v1 / 170 en modos grandes.
- Velocidad base: 225.
- Cadencia base: 0.52 s.
- **Space — Dash:** desplazamiento rápido con una breve invulnerabilidad.
- **E — Bola de cañón:** proyectil explosivo de gran retroceso.

Legendarias:
- Vector reforzado.
- Recámara de asedio.

Ilegales:
- Sobrecarga cinética.
- Munición de racimo.

### TRUCKS

Tanque lento centrado en resistencia y control de zona.

- Vida: 212 en 1v1 / 227 en modos grandes.
- Velocidad base: 158.
- Cadencia base: 0.70 s.
- Daño base ligeramente superior a MIX.
- **Space — Fortificar:** durante 1.55 s reduce un 45% el daño recibido; mientras está activo se mueve más despacio. Recarga base 5.6 s.
- **E — ¡Fuego!:** dispara una secuencia de proyectiles que avanzan en línea y crean zonas de fuego persistente. Recarga base 10.2 s.

Legendarias:
- **Blindaje laminado:** Fortificar reduce un 60% del daño y aumenta su duración.
- **Compuesto de napalm:** mejora área/duración del fuego y reduce la recarga de ¡Fuego!.

Ilegales:
- **Blindaje reactivo:** el primer impacto durante Fortificar libera una onda de retroceso.
- **Tormenta de fuego:** ¡Fuego! lanza dos líneas paralelas.

## Combate incremental

Las rondas avanzadas ganan ritmo sin aumentar directamente el daño global:

- movimiento y velocidad de proyectil aumentan ligeramente con cada ronda, con un límite del 16%;
- los pickups aparecen progresivamente con más frecuencia;
- las mejoras de daño/cadencia siguen limitadas;
- la tormenta continúa cerrando rondas demasiado largas.

La intención es que el late game sea más frenético sin reducir el combate a un intercambio instantáneo.

## Mapas

El pool ahora depende del modo.

Mapas estándar:
- Pilares
- Cruce
- Cuatro Esquinas
- Arsenal

Mapas grandes:
- **Hangar** — reservado para 1v1v1 y 2v2.
- **Fábrica** — diseñado exclusivamente para 2v2.

Los mapas grandes tienen un mundo físico mayor, no únicamente una geometría más abierta.

## Pickups

Los objetos del mapa tienen siluetas explícitas:

- **Curación:** cruz médica verde, +32 HP.
- **Velocidad:** doble flecha azul, aumento temporal de movilidad.
- **Escudo:** escudo gris, bloquea un impacto.

## Mejoras

Común, raro y épico siguen siendo mejoras generales.

Legendario e ilegal modifican habilidades del personaje. El sistema de comeback aumenta gradualmente la probabilidad de rarezas altas con una racha de derrotas, limitado a tres rondas.

La mejora rara **Refrigeración** sustituye a Propulsión: reduce cooldowns de habilidades para que sea útil con cualquier personaje.

## Controles

- `WASD` — movimiento
- Ratón — apuntar
- Click izquierdo — disparo principal
- `Space` — habilidad básica
- `E` — habilidad especial
