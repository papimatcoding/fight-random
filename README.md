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

Desde el Hangar se puede abrir un banco de pruebas local (PC por ahora) que no publica partidas ni estadísticas online. Usa un dummy inmortal y muestra daño total, DPS de los últimos 5 segundos, mejor burst de 1 segundo, golpe máximo y precisión. Permite resetear métricas, recolocar el dummy, alternar entre FIJO/LIBRE/TANQUE y desactivar los cooldowns de `Space`/`E` sin alterar la cadencia del arma ni la sobrecarga de SUNLINE.

El panel `MEJORAS` permite forzar cualquier modificación compatible de arma, especial, chasis o sistema, subirla/bajarla entre 0 y su nivel máximo y probar directamente Legendarias o Mercado Negro sin depender del draft. Cada cambio reconstruye la máquina desde sus stats base para evitar acumulaciones fantasma. Los slots A/B guardan build + métricas y comparan DPS, burst, golpe máximo y precisión.

## Controles

- `WASD` — mover
- Ratón — apuntar
- Click — arma
- `Space` — habilidad del chasis
- `E` — especial equipado

## Backend

Ver `backend/README.md`, `backend/schema.sql` y `backend/fight-random-api/`.


## Draft de rarezas

La rareza escala por ronda en la build `2026.10-polish-1`. Legendario empieza a aparecer desde ronda 3 y Mercado Negro desde ronda 5. El comeback desplaza principalmente Básico hacia Raro/Épico y solo aumenta ligeramente las rarezas altas. Un draft puede contener como máximo una carta Legendaria o Mercado Negro y agotar pools de rareza baja nunca promociona automáticamente una tirada a rareza alta.


## HUD de combate

La build `2026.10-polish-2` usa un HUD fijo dentro de la arena: vida/estados del jugador y tres bloques para `SPACE`, arma primaria (`M1`) y especial (`E`). Los cooldowns se leen directamente, SUNLINE muestra calor/sobrecarga y la tormenta genera aviso contextual. La información larga ya no se dibuja debajo de la máquina local.


## Combat V3 / fullscreen

La build `2026.10-combat-3` integra los controles críticos dentro del propio frame de la arena. Marcador, ronda, mapa, fullscreen y SALIR permanecen disponibles al entrar en pantalla completa. El HUD inferior aumenta tamaño y mantiene vida, estados y SPACE/M1/E dentro del área 16:9. Al terminar una partida se muestra la configuración final: chasis, módulos, modificaciones y fusiones obtenidas.


## Party 2v2

La build `2026.10-party-1` añade una party de dos jugadores desde la lista de amigos. El líder crea una sala 2v2 privada, el amigo ocupa el segundo asiento del mismo equipo y ambos pueden ajustar la máquina antes de abrir la cola. Al pulsar `BUSCAR RIVALES`, la misma sala se publica a Quickplay; los siguientes dos asientos pertenecen al equipo contrario y la pareja se marca automáticamente como lista. No se crean tablas nuevas: se reutilizan amigos, invitaciones, salas y P2P existentes.
