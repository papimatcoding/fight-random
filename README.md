# Fight Random

Nombre provisional para un arena PvP de máquinas de combate clandestinas. El jugador no elige un héroe cerrado: monta una máquina antes de entrar y la sigue modificando entre rondas.

## Máquina

Cada build usa cuatro piezas:

- **Chasis** — define vida, movilidad, tamaño, capacidad y la habilidad de `Space`.
- **Arma** — ataque principal con click.
- **Especial** — habilidad equipada en `E`.
- **Sistema** — pasiva sencilla.

Los módulos cuestan puntos y cada chasis tiene un límite de capacidad. La rareza y el coste son conceptos separados.

### Chasis

- **MIX** — medio, 10 puntos, Dash.
- **TRUCKS** — pesado, 14 puntos, Fortificar.
- **LIZZY** — ligero, 7 puntos, Invisibilidad.

### Armas

- **RIVET-9** — torreta estándar.
- **LANCE-50** — francotirador de largo alcance y gran retroceso.
- **SCRAPSHOT** — escopeta de corto alcance.
- **SUNLINE** — rayo láser continuo con calor y sobrecarga forzada.
- **PISTON** — puñetazo hidráulico de enorme knockback y retroceso propio.
- **GRINDER** — hacha rotatoria para melee sostenido.

Las armas tienen daño, alcance, cadencia y retroceso propios. El Hangar muestra el daño base real del motor; SCRAPSHOT muestra daño por perdigón y total, y SUNLINE daño por tick + DPS aproximado. Algunas armas tienen restricciones de chasis.

### Especiales

- **ATLAS SHELL** — proyectil explosivo pesado.
- **HELLTRAIL** — línea de proyectiles que deja fuego.
- **SHIV** — corte frontal.
- **DEAD TRACK** — minas temporales; caducan sin explotar.
- **HOUND PACK** — micromisiles con homing moderado.
- **TRINITY DRIVE** — velocidad adicional y cuchillas orbitales.

### Sistemas iniciales

PLACAS, SIFÓN, OVERCLOCK, SERVOS, REFRIGERACIÓN y ESTABILIZADOR.

## Modificaciones entre rondas

El draft ya no ofrece una lista general idéntica para todo el mundo. El pool depende del chasis, arma, especial y sistema montados.

Rarezas visibles:

**BÁSICO → RARO → ÉPICO → LEGENDARIO → MERCADO NEGRO**

Mercado Negro se reserva para modificaciones que alteran de forma fuerte el comportamiento de una pieza.

## Multiplayer / persistencia

- 1v1, 1v1v1, 2v2 y NÚCLEO.
- 15 arenas con geometría sencilla, varios tamaños y pools por modo.
- El lobby principal es un menú compacto. El Hangar vive en una vista separada y concentra el montaje de la máquina.
- P2P host-authoritative para combate.
- Perfil persistente, salas públicas/privadas, quick play, rating, leaderboard e historial mediante Supabase.
- Amigos V1: solicitudes por apodo, estado online aproximado e invitaciones temporales a partidas amistosas.
- Si el backend persistente falla, las partidas P2P por enlace siguen funcionando.

## Lobby / taller

Quickplay muestra solo tu slot antes de buscar partida y usa códigos de sala únicamente como detalle interno: el jugador ve QUICKPLAY, no un código. El menú principal da acceso a Hangar, Amigos, Salas, Ranking e Historial sin cargar todos esos paneles a la vez. En el Hangar, cada módulo muestra una descripción breve; el arma se representa físicamente sobre el chasis con un prototipo simple y centrado, compensando además la longitud del arma para que la silueta completa quede visualmente centrada. Al cambiar arma aparece una comparación breve de DPS, cadencia, alcance y retroceso. Especial y sistema siguen sin arte provisional.

## Campo de pruebas

Desde el Hangar se puede abrir un banco de pruebas local (PC por ahora) que no publica partidas ni estadísticas online. Usa un dummy inmortal y muestra daño total, DPS de los últimos 5 segundos, golpe máximo y precisión. Permite resetear métricas, recolocar el dummy y desactivar los cooldowns de `Space`/`E` sin alterar la cadencia del arma ni la sobrecarga de SUNLINE.

## Controles

- `WASD` — mover
- Ratón — apuntar
- Click — arma
- `Space` — habilidad del chasis
- `E` — especial equipado

## Backend

Ver `backend/README.md`, `backend/schema.sql` y `backend/fight-random-api/`.
