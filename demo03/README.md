# Jev Drives — demo03

A 3D driving test for **TypeSafe Jev**. Jev is the tactical driver: every half second it picks one manoeuvre for the amber car on a two-way road with slow traffic ahead, oncoming traffic, zebra crossings with pedestrians and 30/50 km/h signs. Code senses the world, does the arithmetic, and steers and brakes the way Jev asked. Nothing in code decides *whether* to overtake, stop or go.

## Run it

From this directory, with the API key in the parent `.env` as `TYPESAFE_API` (or `TYPESAFE_API_KEY`):

```sh
docker compose up --build -d
```

Open **http://localhost:3003** and press **Start driving**. Works with Docker or the Podman-backed `docker` on this Mac. Nothing is installed on the host: the image contains Node 22 and Three.js, installed from the lockfile. The key never reaches the browser or the image.

```sh
DEMO03_PORT=3004 docker compose up -d       # different local port
docker compose run --rm app npm test         # 43 tests, inside the container
docker compose down
```

Headless run against the real API (same simulation and executor as the browser, latency simulated as driving time), saving every situation and answer:

```sh
docker run --rm --env-file ../.env -v "$PWD/artifacts":/app/artifacts -u 0 typesafe-demo03-jev-drives-app \
  node tools/probe.mjs --seed 7 --traffic normal --seconds 150 --out artifacts/probe-seed7.json
```

## How it is built

Three layers, like a real driving stack:

| Layer | Who | What |
| --- | --- | --- |
| Sensing | code | Four cameras with field of view, range and line-of-sight occlusion; front and rear radar (nearest body per lane, closing speed); two blind-spot zones; sign, zebra and centre-line reading. Structured detections, not pixels. |
| Fusion | code | Turns detections plus memory into one compact situation: the car ahead, the two nearest oncoming cars, the car being passed, the right-lane return zone, people at the next crossing, remembered signs, and an arithmetic overtake estimate (time needed vs time available, margin, conflicts). Numbers come with plain-word classes such as `gap_class: close` or `margin_class: thin`. |
| Decision | **Jev** | One request, six questions. Two steer the car; four are shown to the audience. |
| Execution | code | Carries out the chosen manoeuvre at 120 Hz: quintic lane-change curves with real heading, a follow controller that matches the lead car, a stop controller that rests just before the stop line. No manoeuvre completes on its own: Jev has to choose to come back right, to stop and to go again. |

### The six questions

| Question | Type | Used for |
| --- | --- | --- |
| `maneuver` | Choice of 8: cruise, follow, creep, stop, overtake, return_right, abort_overtake, emergency_brake | **steers the car** |
| `pace` | Choice 30 / 50 | **the speed limit the car cruises at**; Jev reads the remembered signs |
| `hazard` | Score, 4 levels | shown |
| `attention` | Choice of 7 | shown |
| `pass_window_open` | Noul | shown |
| `must_yield` | Noul | shown |

Every criterion names the fields to read and states the literal condition, following the TypeSafe guidance that Jev reads literally and should not be asked to do arithmetic. The rules of the road travel in the state; the server injects them so a browser cannot change them.

### What Jev is told, and what it is not

Jev receives only what a sensor reported or the car computed from its own motion: cars hidden behind another car are not in the state, people at a crossing are remembered for three seconds after a car hides them, and signs stay in memory after they leave view with their distance advanced by odometry. Jev never gets the world's object list, the pedestrian schedule or the oncoming cars beyond radar range.

Oncoming cars do not react to the amber car. A head-on conflict is a real collision that ends the run.

### Where code is deliberately in control

* The executor keeps a following gap when Jev says **follow**, and rests before the stop line (or behind a stopped car) when Jev says **stop**. That is the pedal, not the decision.
* **cruise** ignores the car ahead. Choosing it behind a slow car is Jev's mistake and ends in a collision.
* There is no backup driver. If the API fails, the run pauses with a banner.
* A decision older than two seconds is discarded and counted.

## Controls

* **Start / Pause** (Space), **Restart** the same seed (R), **New traffic** (N), traffic level light / normal / dense, **Drive** length (90 s · 840 m up to 10 min · 5.6 km; crossings, signs and slow cars scale with the road), seed, camera view chase / aerial / driver (V), sensor overlays (O), auto-restart. Your choices are remembered in the browser.
* A run ends at the finish line, on a collision, or when the time cap (twice the chosen drive time) runs out. The end card says which.
* **Inspect** (I): the exact state Jev received, its full answer with probabilities, the question definitions, and the run log. **Export session** downloads all decisions as JSON.
* Sensor overlays: camera cones, detection outlines coloured by the sensor that sees them, blind-spot zones that turn amber when occupied, the planned lane-change curve, and the stop-line marker while stopping.
* The dashboard shows speed, the limit Jev applies against the posted one, the remembered signs (passed, active, seen ahead), progress with crossings and signs, run metrics, and a 60-second timeline of decisions.

## Numbers to expect

About 2.5 decisions per second at 300–400 ms latency, 3.5–4k tokens per decision, roughly one million tokens (about $0.04) per 90 s drive; a 10-minute drive costs about $0.25. Auto-restart draws a new seed.

## Files

* `questions.mjs` — Jev's questions and answer validation.
* `server.mjs`, `schema.mjs` — static files, strict situation schema, proxy to TypeSafe.
* `sim/` — world, traffic, sensors, memory, fusion, dynamics (manoeuvre executors), simulation, policy. Pure JavaScript shared by the browser, the tests and the headless probe.
* `public/` — Three.js scene, HUD, app loop.
* `tests/` — 43 tests; `tools/probe.mjs` — headless closed-loop run (`--length` for longer roads).
