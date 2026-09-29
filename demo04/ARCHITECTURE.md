# Jev Drives: the preserved driving system

Demo04 presents Fable's demo03 driving system through a redesigned interface and scene. This document records the actual implementation, including its boundaries and inherited quirks. The reference is the adjacent `demo03` source tree. Historical live-run evidence is in [demo03/VERIFICATION.md](../demo03/VERIFICATION.md); it is separate from current demo04 verification.

## Ownership and preservation

| Responsibility | Implementation | Preserved behavior |
| --- | --- | --- |
| Seeded scenario | `sim/world.mjs`, `sim/rng.mjs` | Road dimensions, signs, crossings, actors, seeds and random distributions |
| Background actors | `sim/traffic.mjs` | Vehicle following, pedestrian timing, recycling oncoming traffic |
| Perception | `sim/sensors.mjs` | Range, field of view, occlusion, radar and blind spots |
| Memory | `sim/memory.mjs`, `sim/fusion.mjs` | Observed signs/crossings and briefly hidden pedestrians |
| Situation arithmetic | `sim/fusion.mjs` | Distances, timing, pass estimates and plain-language classes |
| Tactical decisions | `questions.mjs`, real TypeSafe API | The six questions and their literal criteria |
| Answer-to-control mapping | `sim/policy.mjs` | Direct mapping of maneuver and pace; no extra decision policy |
| Vehicle execution | `sim/dynamics.mjs` | Smooth path, acceleration, following and stopping controllers |
| Run lifecycle | `sim/simulation.mjs` | Physics, collision checks, metrics, decision freshness, finish and time cap |
| Server boundary | `schema.mjs`, `server.mjs` | Sanitization, rule injection, response validation, credentials and routes |
| Presentation | `public/` | May change appearance and presentation while preserving the contracts below |

The simulation, questions, schema, server behavior, original tests and headless probe are copied from demo03. Run the dependency-free guard from the repository checkout:

```sh
node demo04/tools/check-parity.mjs
```

It compares every file in `sim/` and `tests/`, including any fixtures, plus `questions.mjs`, `schema.mjs`, `server.mjs` and `tools/probe.mjs`. It rejects additions, removals and byte changes, allowing only the server's one startup message to say `demo04`. It requires the adjacent demo03 checkout and is not a standalone image command. It also compares the browser decision-request and simulation-frame loops byte for byte. It does not prove model quality; browser review and inherited tests remain separate checks.

## One decision, end to end

1. The browser constructs `Simulation` from seed, traffic density and route length. The world and ego vehicle live in the browser, not on the server.
2. Physics advances ego, background vehicles and people. Perception samples that state and updates remembered observations.
3. `snapshot()` produces the current tick, simulation time, raw sensed data and fused situation. Only the fused `situation` is posted to `/api/decide`.
4. The server checks the situation's complete schema, adds the server-owned `RULES`, and sends `{ model, state, questions }` to `https://api.typesafe.ai/v1/systemone`.
5. `validateAnswers()` checks the six answers and token usage. The browser receives the validated answer plus server request latency.
6. `decisionFromAnswers()` returns `{ maneuver: answers.maneuver.choice, pace: Number(answers.pace.choice) }`.
7. `applyDecision()` checks freshness, valid maneuver and a pace of 30 or 50, then sets those values on ego. It does not inspect hazard, attention, pass-window or yield answers.
8. The executor performs that maneuver until another valid answer changes it. The UI shows the answer, its probabilities, executor state, timing, metrics and history.

There is no separate planner or rescue driver. A wrong maneuver can produce a real simulated collision. Structured sensing is an idealized perception model; no rendered pixels are sent to Jev.

## The seeded world

World units are metres, seconds and metres per second internally. Sensor/request speed fields use km/h. Forward travel increases simulation `z`; the right lane has positive `x`.

| Parameter | Value |
| --- | --- |
| Lane width / lane centres | 3.5 m / x = ±1.75 m |
| Road half-width | 3.5 m |
| Ego/background car dimensions | 4.5 m long × 1.85 m wide |
| Pedestrian waiting kerb / sign position | x = ±5 m / x = +5.4 m |
| Stop line | 3 m before zebra centre |
| No-passing segment | 30 m before to 8 m after each crossing |
| Initial ego state | Right lane, 30 km/h, cruise, applied limit 50 km/h |
| Drive presets | 90 s/840 m; 120 s/1,100 m; 180 s/1,650 m; 300 s/2,800 m; 600 s/5,600 m |

`createRng()` uses a seeded mulberry32 generator. Each density sets crossing/slow-car counts per kilometre, spacing and pedestrian counts. Slow vehicles begin around 10–20 km/h; oncoming vehicles around 30–50 km/h. Crossings have a preceding 30 sign and a following 50 sign. Scenery is deterministic and cosmetic; it is excluded from perception.

Background vehicles follow their own cruise speeds, posted limits, leading cars and occupied crossings. Same-direction vehicles can follow ego after it merges. Oncoming cars do **not** react to ego's presence in their lane. Cars well behind ego are recycled farther ahead with seeded new speed/spacing, keeping opposing traffic available.

Pedestrians wait until ego is within their seeded trigger distance, then start after their seeded delay. Dense traffic may include a late stepper. They walk to the far kerb and become `done`. Jev never receives these trigger distances, delays or future schedules.

## Sensor model

| Sensor | Mount / view | Range |
| --- | --- | --- |
| Front camera | x 0, z +2.1 m; forward; 70° FOV | 200 m |
| Left camera | x −0.9, z −0.3 m; left-facing; 170° FOV | 30 m |
| Right camera | x +0.9, z −0.3 m; right-facing; 170° FOV | 30 m |
| Rear camera | x 0, z −2.1 m; rear-facing; 100° FOV | 70 m |
| Front radar | Nearest body in each road lane | 300 m |
| Rear radar | Nearest body in each road lane | 80 m |
| Blind spots | Adjacent zone 7 m behind to 1.5 m ahead | Short side zones |
| Sign reading / crossing reading / markings | Road geometry and forward visibility | 90 / 120 / 100 m |

Cameras test body corners and centre against FOV, range and line-of-sight blockage by other cars. An object is detected if any sampled point is visible. Each camera returns up to six nearest detections. Radar reports nearest bodies per lane with bumper gap and signed closing speed. Blind spots report occupied/object/covered lane.

Camera detections are expressed relative to ego. Fusion deduplicates by object ID and retains source names. The `bodies` array returned by `senseAll()` is the full render-side object list used to draw detection outlines. It is **not** part of the fused situation and must never be relabeled or exported as what Jev saw.

The four visual camera previews show rendered views for the audience. Their image contents are not detector input. Demo03's preview renderer capped horizontal FOV at 120°, even though side sensing uses 170°. Road sign/crossing reading applies geometric forward visibility; it does not apply the car-occlusion test used for camera body detections.

## Observation memory and fusion

`SignMemory` stores only seen signs and advances their distance using odometry. Passing a sign changes the active limit; before the first passed sign the default is 50. Its snapshot includes the next sign, all seen-ahead signs and the last three passed signs. Fusion marks the next sign as within slowing distance when it lies within comfortable stopping distance plus 15 m. Jev's `pace` answer chooses the applied limit; memory does not force the actuator to use it.

`CrossingMemory` retains observed crossing positions. The next crossing is selected relative to ego's front bumper and its stop line. People detected there are remembered for up to three seconds while hidden; their longitudinal offset is advanced using ego odometry. Their walking phase and lateral position are not extrapolated. Finished people are classified separately from waiting people.

A crossing is `all_clear` only when at least one person is represented and every represented person has finished. An empty observation instead sets `nobody_detected`; absence of detections is not asserted to be clearance.

The fused request contains:

- `ego`: speed, lane status, current maneuver and duration, applied limit, speeding and stopping distances.
- `lead`: nearest detected same-direction vehicle ahead in the right lane, excluding the current pass target; bumper gap, closing speed, headway and gap class.
- `being_passed`: remembered pass target identity and its currently detected position, or an explicit not-detected status.
- `oncoming`: two nearest detected approaching cars, closing speeds and meeting times.
- `right_lane_return`, `rear`, `blind_spots`: detected return-zone occupancy, time to return, rear traffic and blind-spot state.
- `crossing`, `markings`, `signs`: observed/remembered road context and pedestrian descriptions.
- `overtake_estimate`: arithmetic feasibility, times, distance, surplus class and crossing/centre-line/speed-sign conflicts.
- `timing`: smoothed decision latency, distance traveled during that latency and minimum next-decision interval.

Headway classes are far above 6 s, comfortable above 3 s, close above 1.5 s, very close otherwise, or standing still when ego has negligible forward speed. Comfortable stopping distance uses 3.5 m/s² braking plus travel during decision latency; hard distance uses 7 m/s² plus the same latency.

The overtake estimate integrates ego acceleration at 0.1 s increments and compares relative distance gained with oncoming closure using that same speed profile. It accounts for entry/return paths, requires ego's centre to gain target offset plus 11.5 m, and checks whether solid line, crossing or a lower speed sign lies within the estimated pass distance. No oncoming detection means assuming a potential unseen car at the 300 m radar boundary doing 50 km/h. Margins of at least 6 s are a large surplus, at least 3 s a moderate surplus, 0–3 s thin, and negative a deficit. These are information supplied to Jev, not an automatic veto on its chosen maneuver.

## Jev's six questions

| Answer | Type | Effect |
| --- | --- | --- |
| `maneuver` | Choice of eight | Selects the active vehicle executor |
| `pace` | Choice 30 or 50 | Sets cruising target limit |
| `hazard` | Score over four levels | Displayed |
| `attention` | Choice of seven | Displayed |
| `pass_window_open` | Noul probability | Displayed |
| `must_yield` | Noul probability | Displayed |

Criteria are literal, named-field rules; code does arithmetic before Jev judges the situation. Fixed server-injected road rules require keeping right, legal complete passes, yielding at crossings, remembered speed limits, progress where a pass has sufficient margin, and repeated decisions. The return/abort criteria contain the inherited approximately six-second oncoming threshold. Prompts and their wording are part of the preserved behavior.

## Vehicle executors

| Maneuver | Mechanical action |
| --- | --- |
| `cruise` | Keep lane target and accelerate to pace; ignore leading traffic |
| `follow` | Keep lane target and track the lead vehicle with a gap controller |
| `creep` | Keep lane target and aim for 8 km/h |
| `stop` | Keep lane target and stop before remembered stop line, also respecting the follow controller |
| `overtake` | Set left lane target and accelerate to pace |
| `return_right` | Set right lane target and follow any lead vehicle there |
| `abort_overtake` | Keep current lane target and slow to pass-target speed minus 12 km/h, or half the limit without a target |
| `emergency_brake` | Brake at 8.5 m/s² while retaining the current path |

Following asks for `lead.speed + 0.6 × (gap − (5 + lead.speed))`, clamped between zero and the limit. Ordinary acceleration is capped at 3 m/s² and braking at 3.5 m/s²; abort may brake at 5 m/s². Stop recomputes required deceleration to rest about one metre short of the line and permits up to 7 m/s². Ego's physical maximum is 60 km/h.

Lane changes use a quintic lateral curve over 22–45 m of forward travel, derived from speed and initial heading. Heading, curvature and steering follow the curve. A car at rest cannot slide sideways. A changed lane target replans from its current pose. No completed overtake automatically returns right, and no cleared crossing automatically resumes motion.

`controllerContext()` reads nearby world cars, remembered stop line and pass-target speed to execute a selected maneuver. This local mechanical controller is more direct than the sensor-limited tactical state. It never substitutes its own maneuver. Collision detection uses oriented rectangles for all cars and pedestrian bodies and also checks the road edge.

## Timing, requests and run lifecycle

The preserved browser orchestration uses one request in flight and a minimum 400 ms of simulation time between snapshots. Physics continues under the last command while the request is pending. A 70/30 exponential moving average of measured browser request latency feeds the next situation. Simulation integration uses 1/120 s substeps; browser frame advancement is capped at 100 ms and `Simulation.step()` independently caps its input at 250 ms. A slow renderer can therefore change wall-time cadence even with unchanged simulation code.

Decision age is elapsed **simulation time** since its snapshot. Ages above two seconds or below zero are rejected. The server separately times out upstream requests after seven wall-clock seconds. There is no confidence threshold that silently substitutes another action.

The run ends on collision, ego reaching the road length, or `max(150 seconds, 2 × chosen target duration)`. Overtakes count only after returning right with the tracked target behind. Other metrics include decisions and maneuver changes, lane changes, left-lane time, minimum gap/oncoming TTC, speeding, crossings, stops and stale decisions. Collision immediately sets ego speed to zero.

Start/pause, restart same seed, new traffic, density, seed, route length, camera mode, overlays and auto-restart remain available. Changing density/seed/length resets and pauses. Auto-restart waits 3.5 wall-clock seconds and draws a fresh seed. A hidden tab pauses a running drive. Session export includes current run summary, retained request/answer records, token totals and average latency.

The headless probe imports the same `Simulation` and decision policy and calls the same server API helper. It attempts to advance simulated driving during measured API latency, but passes the entire latency to `sim.step()` once: the inherited 250 ms per-call cap means longer latencies are only partially advanced. It still passes the full measured latency as decision age. The probe's default interval is 450 ms, compared with the browser's 400 ms, and it independently stops at its `--seconds` bound. It does not use the rendered scene. Its result is useful evidence of the shared driver, but it is not an exact browser-timing replay and does not verify layout or rendering performance.

## Server and deployment boundary

`GET /api/health` reports configuration and model; `GET /api/config` exposes the public questions, rules and maneuver list. `POST /api/decide` accepts only local-origin JSON, limits request bodies to 48,000 bytes, validates every situation field and rejects unknown keys. String fields use a limited alphabet and bounded length. Car/person/sign/crossing IDs have fixed numeric formats.

The server reads `TYPESAFE_API_KEY` or `TYPESAFE_API` at runtime and defaults to `jev-latest`. It does not send credentials to the browser. One global in-flight request is permitted per server process. Upstream rate limits trigger a four-second server cooldown. Public errors distinguish timeouts, rate limits, missing credentials, rejected keys, insufficient credit and unexpected responses without returning secrets.

Answer validation checks types, known choices, finite probabilities and nonnegative integer token usage. Choice distributions must sum to one within 0.03. Score distributions are range-checked but do not have the same sum check. The rules are injected by the server after schema validation, so client-supplied extra rules are rejected.

Static files are limited to `/`, one filename level under `/public` and `/sim`, and the two explicitly allowed Three.js module paths. CSP limits scripts, connections and fonts to the local origin; remote fonts/assets do not work without changing that boundary. The locked Three.js dependency and Node 22 live in the container. Compose supplies the parent `.env` at runtime, publishes only loopback, and uses a read-only, unprivileged application container.

## Presentation contracts

`Scene` accepts the canvas and provides `buildWorld(world)`, `update(sim, dt)`, `render(feedRects)`, `resize()`, `view`, `overlays` and the `first` flag for camera resets. Simulation coordinates map to Three.js as `(x, y, -z)` with negative heading rotation. Scene code must not alter simulation actor state or use its own random traffic logic.

HUD methods are `init`, `executor`, `speed`, `signs`, `progress`, `feeds`, `jev`, `stats`, `timelinePush`, `timelineReset`, `timelineRender`, `banner`, `endCard` and `startButton`. HTML, HUD and app changes must stay coordinated because controls and outputs are referenced by their DOM IDs. Feed elements use `data-cam` front/left/right/rear and contain `.feed-view`; their CSS client rectangles determine preview viewports. The full-window renderer's scissor coordinates require translation if the canvas itself becomes inset.

The inspector retains the exact fused request with server rules, complete validated answer, question definitions and session summary. The request and answer panels may show different most-recent events while a call is pending. Do not invent explanatory model thoughts: only the six answers, probabilities and actual observed/controller state are available. The chronological maneuver timeline is a record of applied decisions, not a scripted plan.

## Known inherited quirks and limits

These are source observations, not claims that demo04 has repaired them:

- The old README says API errors pause the drive. In the inherited browser loop, 429, 409 and 504 instead defer requests for four seconds while the simulation continues under its last command. Other errors pause. A visual redesign must describe the actual behavior accurately.
- Restart/reset does not cancel or tag an in-flight request. A prior run's response can arrive after reset; age is evaluated against the new run's simulation clock. A negative age is rejected, but the lifecycle has no general run-ID guard.
- Reset clears per-run simulation metrics and timeline, but session request totals, tokens, latency samples and answer log persist. The answer log retains only the latest 600 records. Export combines current run summary with those retained session records; it is not an unlimited all-runs archive.
- Automatic restarts inherit the chosen density and drive length. Persistence is saved before reset updates the seed field in the original app, so the saved seed can lag a newly randomized seed.
- The original abort HUD text described subtracting 8 km/h; the actual executor subtracts 12. Presentation copy should use the actual executor value.
- Camera previews and idealized structured detections are related views, not pixel-based computer vision. Camera body occlusion, road-object visibility and radar are distinct approximations.
- Three-second pedestrian memory retains the last lateral state. Sparse visibility can remain uncertain; no-detection is not treated as clear.
- The original scene rebuilt meshes without disposing every GPU resource. Resource disposal and efficient scene geometry can improve presentation without modifying simulation behavior.
- Model output and wall-clock API latency are external inputs, so equal seed and equal source do not guarantee identical live runs. Historical successful seeds are examples, not a benchmark or safety guarantee.
