# Jev Driving Lab — demo02

A small 3D experiment: TypeSafe Jev controls the cyan car on a two-lane road populated with seeded moving traffic, pedestrian crossings, and 30/50 km/h signs. The model chooses the target lane and acceleration/braking. Three.js renders the world plus four live directional camera views and visible sensor overlays.

## Run entirely in containers

From this directory:

```sh
docker compose up -d --build
```

Open **http://localhost:3002** and click **Start driving**. The existing Docker-compatible Podman runtime also works. Nothing needs to be installed on the host; the only application dependency (Three.js) is installed in the image from a lockfile. No browser CDN is required.

The parent `../.env` is loaded at runtime. Supported credential names are `TYPESAFE_API` (the existing workspace name) and `TYPESAFE_API_KEY`. Optional `TYPESAFE_MODEL` defaults to `jev-latest`. The key stays on the server, outside the build context and public assets. Do not run `docker compose config` into a shared log because it can expand environment values.

To select a different local port:

```sh
DEMO02_PORT=3003 docker compose up -d
```

Stop:

```sh
docker compose down
```

Run the tests in the built container:

```sh
docker compose run --rm app npm test
```

## Controls

- Choose a **30-, 60-, or 90-second** simulation budget (**90 seconds / 810 metres by default**), normal/busy traffic, and a world seed. The seed reproduces initial geometry and traffic, not network timing or model outputs.
- **Start/Pause** (or Space) controls the run. Pause stops simulation time and cancels the current request. Hiding the browser tab pauses an active run.
- **Road awareness** shows the active limit, observed sign history, the next already-seen sign, detected crossing activity, and cumulative speeding time. Solid red-ring signs are active; dashed signs have been seen ahead; faded signs have been passed.
- **Reset** restarts the same seed. **Shuffle** chooses a different seed.
- With **Auto-restart** enabled, crossing the finish line, exhausting the time budget, or colliding starts a new seed after three seconds. Leave it off for one run. Auto-restart continues to make real, billable API calls until paused.
- **Follow / Aerial / Driver** changes the main camera. The front, left, right, and rear camera views stay attached to the car. Their labels show the live detection count, range, and horizontal field of view.
- **3D overlays** shows camera coverage rays, outlines around detected objects, and short blind-spot lane zones (amber when occupied).
- **Sensor map source** switches between current readings and the exact snapshot used for Jev’s last decision. The latter draws the selected lane, shows snapshot age, and exposes nearby object IDs, body overlap, and relative speeds. The map uses camera detections, not a hidden complete world list.
- **Inspect model input & output** shows the exact latest sensor payload, model answer distributions, and all five questions.
- **Export session** saves observed decisions, sensor states, API latency, token usage, outcomes, and stale-response counts as JSON. Up to 2,000 recent decisions are retained in the browser; totals cover the whole page session. There are no credentials in exports.

## What Jev receives

This demo uses **idealized structured perception, not vision inference**. The 3D camera is for the human observer. No camera pixels are sent to Jev.

- Four synthetic camera feeds: **front** 110 m / 100°, **left** and **right** 35 m / 150°, **rear** 65 m / 110°. Rendered views use the same mounting positions and horizontal fields of view as the detectors.
- Camera visibility uses horizontal fields of view, range, and sampled vehicle-footprint occlusion. Partially visible objects can appear in more than one camera under the same object ID. At most eight visible objects per feed are sent. This is idealized 2D detection, not image recognition.
- Each detection carries signed forward/right offsets, vehicle dimensions, speed relative to the ego car, bumper clearance, and whether the two bodies overlap longitudinally. A negative forward offset can still mean a partly alongside car.
- Synthetic radar: nearest forward bumper gap up to 140 m, nearest rear gap up to 40 m, object speed, and time to collision.
- Existing blind-spot flags report object **centres** within ±7 m in each road lane. This is a short-range presence sensor, not a safe-to-merge signal. Rear radar and side/rear cameras cover situations beyond that boundary.
- Ego speed, current/target lane, measured lateral position, both occupied lanes during a crossing, remaining lane-change time, and deterministic stopping-distance/following-gap calculations.

No route-wide object list, unseen sign coordinates, or private pedestrian event schedule is provided to the model. The sensor map displays the camera observations in the selected snapshot; the front/rear gap readouts expose radar measurements. The inspector is the authoritative payload.

## Decision and motion loop

1. Approximately every 800 ms, capture a sensor snapshot. Only one request is in flight.
2. One `POST https://api.typesafe.ai/v1/systemone` asks five independent questions: target lane (Choice), hypothetical left-lane speed control (Choice), hypothetical right-lane speed control (Choice), collision risk (Noul), and what needs attention (Choice).
3. Consume the speed answer for the lane Jev selected. The speed question explicitly accounts for the original lane during a transition. The attention output labels the observed situation; it is not an explanation of model reasoning.
4. Physics applies that choice: acceleration +3 m/s², gentle acceleration +1 m/s², coast 0, gentle braking −1.5 m/s², firm braking −5 m/s², emergency braking −9 m/s²; speed has a mechanical bound of 0–22 m/s (about 80 km/h), independent of the posted limits. There is no automatic 30/50 km/h speed clamp; Jev must choose how to comply. A full lane change takes 1.4 seconds.
5. Collision checks use vehicle dimensions and small physics steps. A collision ends the run and is reported; it is not silently corrected or erased.

There is **no hidden obstacle-avoidance controller for the ego car**. Background cars use a simple deterministic following rule, observe the 30/50 zones, yield temporarily at active crossings, and resume when people clear. Fixed barriers are no longer generated. Jev can choose badly, collide, hesitate, or fail to reach the end before the timer. This is a visual experiment in structured model control, not a real autonomous-driving system or a validated benchmark.

Code owns explicit failure behavior: a decision older than 1.8 simulation seconds is discarded; a command older than 1.8 seconds triggers a counted, visibly labelled emergency-brake fallback. API errors pause the simulation. Requests time out after six seconds; rate limits impose a five-second cooldown before manual retry. Pause, reset, and run changes invalidate late responses. Choice confidence measures distribution concentration, not the probability that the driving policy is correct.

The clock is simulation time, advancing with rendered frames (capped after long stalls); a throttled device may take more wall-clock time. The first API request is made before motion begins. Each run uses a route of `duration × 9` metres (810 m for 90 seconds; 540 m for one minute), sized for the lower posted limits and crossings. Finishing and using up the time budget are reported separately.

## Files

- `questions.mjs`: Jev decision definitions and response validation.
- `server.mjs`: static server, sanitized API proxy, request limits, credential handling.
- `public/simulation.mjs`: deterministic world generation, radar/blind-spot sensors, physics, collisions.
- `public/perception.mjs`: four directional camera configurations, visibility, occlusion, and structured car/pedestrian observations.
- `public/road.mjs`: limited-view sign/crosswalk observations and persistent sign memory.
- `public/motion.mjs`: shared physical control constants and numeric motion estimates; it does not select driving actions.
- `public/world.mjs`: Three.js scene, car geometry, cameras, and rendering.
- `public/app.mjs`: request lifecycle, control loop, instrumentation, export.
- `tests/app.test.mjs`: physics, perception limits, stale-answer rejection, API contracts, and secret isolation.

The TypeSafe skill is used as session guidance only. It has not been installed.

## Checking the overtaking cases

`npm test` includes deterministic tests for a car still partly alongside after overtaking, fast rear traffic outside the blind-spot zone, camera range/occlusion, and occupied lanes during a crossing. A regression test deliberately sends an unsafe model choice and verifies that it is executed and the collision remains visible: no lane-change veto or replacement driving controller has been added.

An optional **billable** live probe asks Jev about four hand-written situations:

```sh
docker compose exec -T app node tests/perception-probe.mjs
```

The saved observations in `artifacts/surround-probes.json` are a small diagnostic, not a general driving-quality benchmark. More sensor evidence can help but does not guarantee a good action. The decision cadence and physical lane-change speed are unchanged.

## Traffic, pedestrians, and speed-sign memory

Normal 90-second mode has two marked crossings, one or two people per crossing, and **six cars** staggered between lanes along the 810 m route. Normal 60-second mode has four cars; 30-second mode has three. Busy mode adds three cars and one crossing. Initial car positions, cruising speeds, pedestrian walking speed/direction, crossing offsets, and colours vary with the seed. Background cars have individual seeded cruising speeds of **10–14 km/h in the right lane** and **16–20 km/h in the left lane**. Those targets persist through both 30 and 50 zones, rather than converging on a shared slow-zone speed. After yielding, each car resumes its own target, helping gaps reopen. The ego car still observes 30/50 signs through Jev; its control logic has not been changed to force passing.

Pedestrians walk continuously from sidewalk to sidewalk. A crossing starts when the ego car is within 58 m, or after three seconds of approach within 105 m, followed by short seeded individual delays. This makes the scenario progress even if Jev stops early. This scheduling controls pedestrians only; it never brakes or steers the ego car. Vehicle contact with a pedestrian is reported as a collision.

Signs alternate from 50 to 30 before each crossing and back to 50 after it. A synthetic road-feature detector observes signs within 90 m, subject to camera direction and vehicle occlusion. A sign is added to memory only after observation. Its measured location is then tracked with odometry. It becomes active when passed and stays active until another observed sign is passed. An upcoming higher limit does not become active merely because it is visible. The initial road rule is explicitly 50 km/h before the entry sign is passed. Both current memory and visible upcoming signs are included in every Jev state payload.

Pedestrian detections include lateral velocity, waiting/crossing/cleared motion, and crossing identity, so Jev can anticipate a person entering its lane. Marked crossings are also included as visible road observations. The speed questions ask Jev to yield to people ahead, obey remembered limits, and resume cruising when clear. No deterministic ego lane-change veto, pedestrian brake, or legal-speed governor has been added.

Speeding time counts simulation time more than 1 km/h above the actual posted limit; the tolerance avoids display-rounding noise. Run results include crossings passed, speeding duration, maximum overspeed, and signs remembered. These measurements do not change the vehicle's control.

Optional live checks for sign memory and pedestrian responses (billable):

```sh
docker compose exec -T app node tests/road-probe.mjs
```

The saved `artifacts/road-probes.json` records five synthetic live API cases, not a general benchmark.

## Distance-aware approach controls

Every normal lane and pedal decision remains a real Jev choice. Two additional actions, **Ease forward** (+1 m/s²) and **Gentle brake** (−1.5 m/s²), let Jev make smaller changes. They are constant-acceleration commands, not hidden cruise controllers: neither automatically stops at a line nor chooses a target speed. Existing collision detection, mechanical speed bounds, and the visibly counted stale-response emergency brake remain.

The model already received camera offsets and radar gaps. It now additionally receives:

- **Front-bumper distance to the painted stop line**, located 6 m before the crosswalk centre. This differs from distance to a pedestrian or the centre of the crossing.
- **Gentle, firm, and emergency stopping-distance estimates** that vary with current speed and timing. The planning window covers the 0.8-second request interval plus the recent average of up to five measured browser-to-server round trips. A new run explicitly uses a 400 ms estimate until a real response is measured.
- **Closing speed, headway, speed-dependent following space, and relative stopping gap** for each lane's front radar return.
- **Candidate action effects**: predicted travel and speed after holding the current command during the estimated response delay, then the candidate action for 0.8 seconds. These predictions neither rank actions nor apply them.
- **Observed pedestrian occupancy and estimated clearance time**, deduplicated across cameras. Estimates extrapolate visible pedestrians at constant walking velocity; they are not guarantees or access to the private scenario schedule.

The new **To stop line / Gentle stop / Response delay** panel shows these values for the same live or Jev-snapshot source as the sensor map. The exact numbers and assumptions are also in the inspector and exports.

The questions distinguish controlled approach from entry into an occupied crossing: approach while distance allows, progressively slow, and hold near the line when required. They also tell Jev to use closing speed and available headway before passing a distant car. None of this is a deterministic lane-change or braking override.

Older open tabs do not understand the new action values. If they request another decision after an update, the server explicitly pauses them with an update message; their in-memory results remain intact. Use a fresh tab for the new version.

Bounded live diagnostics, **billable** (six requests, or one case by index):

```sh
docker compose exec -T app node tests/approach-probe.mjs
docker compose exec -T app node tests/approach-probe.mjs 5
```

Results are in `artifacts/approach-probes.json` and the close-following recheck in `artifacts/approach-close-car-recheck.json`. These are fixed snapshot checks, not a complete driving benchmark.
