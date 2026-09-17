# Jev Driving Lab — demo02

A small 3D experiment: TypeSafe Jev controls the cyan car on a **two-way road: keep right, oncoming traffic on the left**, populated with seeded moving traffic, pedestrian crossings, and 30/50 km/h signs. The model chooses the target lane and a numerical speed target. Three.js renders the world plus four live directional camera views and visible sensor overlays.

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

- Choose a **90-, 120-, or 180-second** simulation budget (**90 seconds / 810 metres by default**), normal/busy traffic, and a world seed. The seed reproduces initial geometry and traffic, not network timing or model outputs.
- **Start/Pause** (or Space) controls the run. Pause stops simulation time and cancels the current request. Hiding the browser tab pauses an active run.
- **Road awareness** shows the active limit, observed sign history, the next already-seen sign, detected crossing activity, and cumulative speeding time. Solid red-ring signs are active; dashed signs have been seen ahead; faded signs have been passed.
- **Reset** restarts the same seed. **Randomize traffic** (⤨) chooses a different seed and resamples car positions, gaps and speeds.
- With **Auto-restart** enabled, crossing the finish line, exhausting the time budget, or colliding starts a new seed after three seconds. Leave it off for one run. Auto-restart continues to make real, billable API calls until paused.
- **Follow / Aerial / Driver** changes the main camera. The front, left, right, and rear camera views stay attached to the car. Their labels show the live detection count, range, and horizontal field of view.
- **3D overlays** shows camera coverage rays, outlines around detected objects, and short blind-spot lane zones (amber when occupied).
- **Sensor map source** switches between current readings and the exact snapshot used for Jev’s last decision. The latter draws the selected lane, shows snapshot age, and exposes nearby object IDs, body overlap, and relative speeds. The map uses camera and radar detections, not a hidden complete world list.
- **Inspect model input & output** shows the exact latest sensor payload, model answer distributions, and all five questions.
- **Export session** saves observed decisions, sensor states, API latency, token usage, outcomes, and stale-response counts as JSON. Up to 2,000 recent decisions are retained in the browser; totals cover the whole page session. There are no credentials in exports.

## What Jev receives

This demo uses **idealized structured perception, not vision inference**. The 3D camera is for the human observer. No camera pixels are sent to Jev.

- Four synthetic camera feeds: **front** 220 m / 100°, **left** and **right** 35 m / 150°, **rear** 65 m / 110°. Rendered views use the same mounting positions and horizontal fields of view as the detectors.
- Camera visibility uses horizontal fields of view, range, and sampled vehicle-footprint occlusion. Partially visible objects can appear in more than one camera under the same object ID. At most eight visible objects per feed are sent. This is idealized 2D detection, not image recognition.
- Each detection carries signed forward/right offsets, vehicle dimensions, speed relative to the ego car, bumper clearance, and whether the two bodies overlap longitudinally. A negative forward offset can still mean a partly alongside car.
- Synthetic radar: nearest forward bumper gap up to 360 m, nearest rear gap up to 65 m, signed longitudinal velocity, object identity, and time to collision. Up to three oncoming tracks per lane are reported within range.
- Existing blind-spot flags report object **centres** within ±7 m in each road lane. This is a short-range presence sensor, not a safe-to-merge signal. Rear radar and side/rear cameras cover situations beyond that boundary.
- Ego speed, current/target lane, measured lateral position, both occupied lanes during a crossing, remaining lane-change time, and deterministic stopping-distance/following-gap calculations.

No route-wide object list, unseen sign coordinates, or private pedestrian event schedule is provided to the model. The sensor map combines the camera and radar observations in the selected snapshot; red downward markers represent oncoming traffic. It does not display a hidden complete world list. The inspector is the authoritative payload.

## Decision and motion loop

1. Approximately every 800 ms, capture a sensor snapshot. Only one request is in flight.
2. One `POST https://api.typesafe.ai/v1/systemone` asks five independent questions: target lane (Choice), hypothetical left-lane speed control (Choice), hypothetical right-lane speed control (Choice), collision risk (Noul), and what needs attention (Choice).
3. Consume the speed answer for the lane Jev selected. The speed question explicitly accounts for the original lane during a transition. The attention output labels the observed situation; it is not an explanation of model reasoning.
4. Jev chooses an integer target of **0–50 km/h** or **emergency**. The actuator approaches that fixed target at up to +2.5 / −4.5 m/s² (emergency −9), without reading traffic, crossings, signs or gaps. It does not continuously adapt the target to a lead car. Jev chooses each new speed. The mechanical bound remains 0–22 m/s; there is no automatic 30-zone clamp.
5. The selected lane becomes a smooth curve parameterized by forward distance (at least 14 m, approximately three seconds at the speed when selected). Heading follows the curve tangent; front wheels steer with curvature. A stopped car cannot move sideways. Repeated lane commands retain the current curve; reversals preserve position, heading and curvature. The actuator does not inspect traffic or choose a return lane.
6. Collision checks use oriented vehicle rectangles and small physics steps. A collision ends the run and is reported; it is not silently corrected or erased.

There is **no hidden obstacle-avoidance controller for the ego car**. Background cars use a simple deterministic following rule, observe the 30/50 zones, yield temporarily at active crossings, and resume when people clear. Fixed barriers are no longer generated. Jev can choose badly, collide, hesitate, or fail to reach the end before the timer. This is a visual experiment in structured model control, not a real autonomous-driving system or a validated benchmark.

Code owns explicit failure behavior: a decision older than 1.8 simulation seconds is discarded; a command older than 1.8 seconds triggers a counted, visibly labelled emergency-brake fallback. API errors pause the simulation. Requests time out after six seconds; rate limits impose a five-second cooldown before manual retry. Pause, reset, and run changes invalidate late responses. Choice confidence measures distribution concentration, not the probability that the driving policy is correct.

The clock is simulation time, advancing with rendered frames (capped after long stalls); a throttled device may take more wall-clock time. The first API request is made before motion begins. Each run uses a route of `duration × 9` metres (810 m for 90 seconds, 1,080 m for 120 seconds, and 1,620 m for 180 seconds), sized for the lower posted limits and crossings. Finishing and using up the time budget are reported separately.

## Files

- `questions.mjs`: Jev decision definitions and response validation.
- `server.mjs`: static server, sanitized API proxy, request limits, credential handling.
- `public/simulation.mjs`: deterministic world generation, radar/blind-spot sensors, physics, collisions.
- `public/perception.mjs`: four directional camera configurations, visibility, occlusion, and structured car/pedestrian observations.
- `public/road.mjs`: limited-view sign/crosswalk observations and persistent sign memory.
- `public/motion.mjs`: shared physical control constants and numeric motion estimates; it does not select driving actions.
- `public/vehicle.mjs`: fixed speed actuator, curved lane motion, oriented collision geometry and camera mounts.
- `public/passing.mjs`: observed original-target memory and passing/return timing estimates.
- `public/world.mjs`: Three.js scene, car geometry, cameras, and rendering.
- `public/app.mjs`: request lifecycle, control loop, instrumentation, export.
- `tests/app.test.mjs`: physics, perception limits, stale-answer rejection, API contracts, and secret isolation.

The TypeSafe skill is used as session guidance only. It has not been installed.

## Traffic, pedestrians, and speed-sign memory

Normal 90-second mode has two marked crossings, one or two people per crossing, and **six cars: three slow vehicles in our right lane and three oncoming vehicles in the left lane**. Some oncoming vehicles begin beyond the route endpoint and approach naturally during the run. Normal 120-second mode has eight cars; 180-second mode has twelve. Busy mode adds three cars and one crossing. Car positions are sampled across broad ranges rather than shifted around fixed slots: the first right-lane car starts 35–90 m ahead, later cars have irregular gaps across the route, and the first oncoming car starts 140–440 m ahead with independently varied spacing behind it. Same-lane spawn spacing prevents overlapping starts. Cruising speeds, pedestrian walking speed/direction, crossing offsets, and colours also vary with the seed. Right-lane traffic has individual seeded cruising speeds of **10–20 km/h**. Oncoming traffic approaches at **25–45 km/h**, slowing for the scenario’s 30 zones and pedestrian crossings. Slow right-lane targets persist through both 30 and 50 zones. Opposite-direction traffic moves toward decreasing road position; its radar velocity is negative. After yielding, each car resumes its own target, helping gaps reopen. The ego car still observes 30/50 signs through Jev; its control logic has not been changed to force passing.

Pedestrians walk continuously from sidewalk to sidewalk. A crossing starts when the ego car is within 58 m, or after three seconds of approach within 105 m, followed by short seeded individual delays. This makes the scenario progress even if Jev stops early. This scheduling controls pedestrians only; it never brakes or steers the ego car. Vehicle contact with a pedestrian is reported as a collision.

Signs alternate from 50 to 30 before each crossing and back to 50 after it. A synthetic road-feature detector observes signs within 90 m, subject to camera direction and vehicle occlusion. A sign is added to memory only after observation. Its measured location is then tracked with odometry. It becomes active when passed and stays active until another observed sign is passed. An upcoming higher limit does not become active merely because it is visible. The initial road rule is explicitly 50 km/h before the entry sign is passed. Both current memory and visible upcoming signs are included in every Jev state payload.

Pedestrian detections include lateral velocity, waiting/crossing/cleared motion, and crossing identity, so Jev can anticipate a person entering its lane. Marked crossings are also included as visible road observations. The speed questions ask Jev to yield to people ahead, obey remembered limits, and resume cruising when clear. No deterministic ego lane-change veto, pedestrian brake, or legal-speed governor has been added.

Speeding time counts simulation time more than 1 km/h above the actual posted limit; the tolerance avoids display-rounding noise. Run results include crossings passed, speeding duration, maximum overspeed, and signs remembered. These measurements do not change the vehicle's control.

## Following and crossing approaches

Jev receives lead-car speed in km/h, relative closing speed, headway, and the distance needed to match the moving lead speed. The questions distinguish following a moving car from stopping behind a stationary obstruction. Left- and right-lane speed answers are conditional on that lane being selected; a pass needs speed advantage over its original target.

For crossings, the payload includes bumper-to-stop-line distance, observed occupancy, estimated pedestrian clearance time, and normal/emergency stopping distances. The painted stop line is 6 m before the zebra centre; Jev is asked to hold roughly 2 m before it when occupied. A distant occupied crossing should receive a low moving approach speed, not a stop at first detection. **There is no automatic creep, stop-at-line controller or pedestrian braking rule for the ego car.**

Motion estimates cover the 800 ms decision interval plus recent measured response delay (400 ms startup estimate until a response is measured). The **To stop line / Stop distance / Response delay** panel exposes these numbers. Candidate speed effects are numeric projections, not ranked actions or permissions. Perception and extrapolation remain idealized.

Older open tabs cannot apply the numeric speed interface (`natural-drive-v4`). Requests from them are paused explicitly while their in-memory results remain available. Open the updated demo in a fresh tab.

## Two-way road and overtaking

**Keep right. The left lane is oncoming traffic, not a second normal driving lane.** Direction arrows are painted on the road and oncoming cars face toward us. Broken centre lines permit consideration of a pass. Solid double lines run from 35 m before to 15 m beyond each crossing; the simulation’s rule is not to begin a pass there, and to plan to return before reaching a visible solid section.

The front camera now reaches 220 m; front radar reaches 360 m and rear radar 65 m. Camera/radar detections identify direction and signed forward velocity. Head-on closing speed is the sum of the speeds, not their difference. A stopped oncoming car retains its observed heading. Stopping in the opposing lane does not by itself solve a head-on threat.

`passing` in every model state exposes:

- Observed phase: keeping right, moving out, occupying the opposing lane, or returning right.
- Oncoming gaps and contact-time estimates at current speed and at the posted limit.
- The time required to clear the observed right-lane vehicle and return, including acceleration, lane-change time and a response allowance.
- Signed body clearance to the passed car, right-side overlap, and front/rear merge gaps.
- A separate estimate for selecting a lower rolling speed to drop behind the target and then drive a return curve. Other traffic can invalidate this single-vehicle estimate.
- Numeric margins to the detected oncoming traffic, the visibility boundary, and observed road markings. No `allowed`, `safe_to_pass`, or recommended action is returned by code.

An empty radar view is finite. The state explicitly considers a hypothetical vehicle just beyond 360 m approaching at 50 km/h. This is a stated scenario assumption, not proof that unseen traffic cannot be faster. Passing estimates use the speed actuator and curved lane transitions, while assuming constant observed traffic velocities; every request gives Jev a fresh snapshot to reassess them.

The observed original target is remembered until the actual return right. A newly nearer car does not silently replace it. If the original car leaves sensor coverage, its last observation is projected using odometry and velocity, with the age and projection label sent to Jev. Memory does not automatically return the car.

The questions ask Jev to pass when beneficial and the measured/estimated conditions support it, return right as soon as clearance exists, or brake while staying left long enough to fall behind if a pass must be abandoned. **There is no automatic pull-out, merge, abort, solid-line veto, or head-on avoidance for the ego car.** Oncoming NPCs follow their own traffic and pedestrian rules; they are not specially steered or stopped to conceal an unsafe ego manoeuvre. Collisions remain visible. Oncoming cars passing us are excluded from the overtakes count.

The **passing strip** shows oncoming gap/time, pass estimate, right return space, and centre-line observations using the selected sensor snapshot. Run results additionally record time spent occupying the opposing lane and minimum oncoming contact-time estimate while there.

## Verification

```sh
docker compose exec -T app npm test
```

The local tests exercise physics, sensor bounds, preserved unsafe choices/collisions, speed tracking, curved motion with no stationary sliding, original-target memory, HTTP contracts and credential isolation. They do not establish model driving quality.

A bounded **billable** diagnostic (at most 27 requests) tests actual Jev following, overtaking and returning over time, plus two fixed pedestrian cases:

```sh
docker compose exec -T app node tests/natural-drive-check.mjs
```

Saved results and limitations are documented in `VERIFICATION.md`. Earlier probe scripts/artifacts cover older interfaces and are historical diagnostics; their pedal-action expectations do not validate the current numeric speed controls. No full randomized driving benchmark is claimed.
