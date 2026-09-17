# Verification — 2026-09-17

The demo was built and run through the existing Podman-backed `docker compose` runtime, bound to `127.0.0.1:3002`. No packages were installed on macOS and no host `node_modules` directory was created. The parent `.env` was loaded by Compose at runtime; its value was not printed or copied into source or the image.

## Selectable runs up to three minutes

The run-length selector offers 90, 120 and 180 seconds, with 90 seconds as the default. Route length already scales with the selected duration: 810, 1,080 and 1,620 m respectively. The standalone user brief was updated too. All 71 local container tests passed, now including 120/180-second expiry, valid sensor payloads and nonoverlapping traffic generation. The deployed browser selector was checked: choosing 180 seconds displays 3:00 and a 1,620 m route. No extra live Jev calls were made for this update.

## Traffic randomization update

Shuffle previously added only 8–35 m of jitter around fixed car slots. It now samples substantially different positions and irregular gaps in a dedicated traffic random stream: first right-lane car 35–90 m, later right-lane cars spread across the route, first oncoming car 140–440 m, and independently varied oncoming spacing. Existing lane directions, car counts and speed ranges remain. The control is labelled **Randomize traffic** and always chooses a different seed; Reset reproduces the selected setup.

**71 container tests passed**, including material position/gap variation across 100 seeds and nonoverlapping starts across 300 combinations of seed, duration and density. Example default right-lane starting positions: seed 42 = 56/227/450 m; seed 43 = 68/215/532 m; seed 44 = 79/345/447 m. Oncoming positions also differ. These are local generation tests; no extra Jev calls were made for this update. Prior driving traces describe their saved layouts and do not validate every new random layout.

## Previous update: numeric speed targets, overtaking memory and curved motion

This section supersedes the historical control descriptions and results below. Current sensor schema: `natural-drive-v4`.

Jev now chooses a numerical target speed (0–50 km/h, or emergency) for each candidate lane. The selected lane chooses the corresponding speed answer. The actuator tracks that fixed target without consulting traffic, signs, pedestrians or gaps. There is no automatic lead-speed adaptation, pedestrian creep, return-to-right decision or lane veto. The existing counted stale-command brake remains the only emergency fallback.

The vehicle follows a forward-distance curve with tangent-aligned heading and steering front wheels. It cannot slide sideways at zero speed. Repeated commands preserve the curve; reversals preserve pose and curvature. Collision geometry and camera mounts follow the actual heading. The original passing target stays in observed memory until the completed return right; a newly nearer vehicle cannot silently replace it. Lost observations are labelled constant-velocity projections using odometry, not hidden world positions.

**69 tests passed in the final built container.** The updated Compose service was deployed on port 3002, and a fresh browser tab rendered the 3D scene, four feeds, numeric target-speed panel and configured API state. Browser module syntax checks and `git diff --check` also passed. No extra browser driving run was started.

 Added regression coverage includes no stationary lateral movement, heading consistent with displacement, steering straightening, continuous retargeting, fixed-target speed matching, original passing target retention, observation-only projections, oriented collisions and rotated camera mounts. This checks application mechanics, not Jev reliability.

### Real API evidence

73 bounded real Jev requests were made for this update. Exact questions, state, answers, latency and usage are saved with each result:

- `artifacts/natural-drive-check.json`: first 25-decision loop plus two crossing snapshots. Jev matched a 12 km/h lead without stopping, but never began the available pass and selected 0 while stopped 37 m before the crossing. These failures are preserved.
- `artifacts/natural-rechecks.json`: three fixed rechecks after clarifying the choices. Far crossing selected 5, near crossing selected 0. It selected left for the pass but still chose 12 km/h; conditional speed wording was then clarified.
- `artifacts/natural-drive-revised.json`: 25-decision closed-loop run, 19.47 simulated seconds, plus two crossing snapshots. It matched the 12 km/h lead, selected left/50 after the first oncoming car passed, then selected right after clearing its original target. The actual curved return finished at 19.26 s. No collision or stale fallback. It unnecessarily selected 15 km/h for the next vehicle more than 100 m ahead; the final following-distance wording was changed after this run. Far/near crossing snapshots selected 5/0.
- `artifacts/approach-loop-check.json`: final wording, two traffic rechecks plus 14 actual closed-loop crossing decisions. Nearby lead selected right/12; returning with a distant next car selected right/50. With a slow pedestrian remaining on the roadway, the ego approached from 10 m before the stop line at 5 km/h, selected 0 near the line, and stopped at **0.23 m bumper clearance**. No collision or stale fallback. This is closer than the requested roughly 2 m clearance: the model does not precisely meet that margin. The full passing loop was not repeated after this final wording-only adjustment.

All closed-loop tests ran the same Simulation/applyDecision code as the browser with real API delay, an 800 ms cadence and the explicit stale fallback. The scenes were synthetic, bounded diagnostics, not a full randomized 90-second driving benchmark. Camera inputs remain structured detections; no image inference is claimed. No user browser runs or results were reset during testing.

## Initial build

- Container health endpoint: `{ "ok": true, "configured": true, "model": "jev-latest" }`.
- `docker compose exec -T app npm test`: **18 passed, 0 failed**.
- Tests cover seed reproducibility, 60 randomized sensor worlds, camera occlusion, matching speculative speed answers to lane choice, stale-result rejection, side collisions, high-speed collisions, stop behavior, 30/60-second budgets, finish detection, input sanitization, model-output validation, five-question batching, static route isolation, missing credentials, rate-limit cooldown, and provider failures.
- Real browser rendering checked in Follow, Aerial, and Driver modes. Console error/warning inspection returned no entries.
- Seed changes were verified against the visible world identifier after fixing a pending-input mismatch.

## Initial live API run

Observed in the browser and in **Inspect model input & output → Run results**:

```json
{
  "seed": 43,
  "duration_budget_seconds": 30,
  "density": "normal",
  "reason": "finish",
  "simulation_seconds": 28.22,
  "distance_metres": 420,
  "decisions": 36,
  "requests": 36,
  "lane_changes": 2,
  "objects_passed": 10,
  "minimum_forward_gap_metres": 10.5,
  "collisions": 0,
  "stale_fallbacks": 0,
  "discarded_responses": 0,
  "average_api_latency_ms": 329,
  "last_api_latency_ms": 284,
  "total_tokens": 67934
}
```

This was a real Jev run, not mocked responses. It is one observed successful run, not a representative driving benchmark or a promise that a repeated run will behave identically.

## Earlier integration checks

- Initial speed-question wording let the car accelerate toward a clear destination lane before it cleared a slower car in the original lane. That run collided after about 246 m. The current question explicitly describes the lane-transition interval.
- An intermediate, more prescriptive question caused excessive braking. Two 30-second runs and a 60-second run exhausted their time budgets without collisions. The final question was shortened and clarifies units, absent radar returns, and null time-to-collision values.
- Auto-restart was visibly verified across worlds 42 → 43 → 44 after timed completion. Pause held the simulation and decision count steady. The final successful run had auto-restart disabled so it remained available for inspection.
- The 60-second run completed 75 decisions, averaging 331 ms API latency; that check used the intermediate question. The final wording was verified with the 30-second successful run above.
- Session export was invoked without a console error, but the in-app browser did not expose a download completion event or a file in the standard Downloads directory. File-download completion is **not verified** in that browser. Run results and model input/output remain directly inspectable in the app.

## Scope

Perception is idealized simulation data. The front-camera view is rendered for the user; Jev is not interpreting camera pixels. Physics and simple following behavior for background traffic are deterministic. Only the cyan car's target lane and speed action are chosen by Jev. The counted stale-command braking behavior is the sole automatic driving fallback.

## Surround perception update — 2026-09-17

The running demo now uses four directional synthetic camera feeds plus the existing radar and ±7 m lane-presence flags. The measured flags passed boundary tests; they were too limited to interpret as a safe-to-merge judgement. Four-view observations add object identity, signed position, dimensions, relative speed and body overlap. Lateral position and occupied lanes expose the actual state during a lane change.

- **26 container tests passed**, including overtaken-car overlap, fast rear approach outside the blind-spot zone, left/right visibility, range/occlusion, and preservation of the model's raw action even when that causes a collision.
- Real Jev probes are saved in `artifacts/surround-probes.json`. It stayed left and braked in the alongside-car case (lane confidence 0.92) and the fast-rear-approach case (0.53). It hesitated in the clear-return case, selecting left instead of the expected right (confidence 0.13). On an empty road it selected left/accelerate (0.99 lane confidence). These four hand-written cases are not an accuracy benchmark.
- The full **seed 42, normal traffic, 30-second** browser run reached **420.3 m in 27.48 simulated seconds**, with **35 real requests**, **2 lane changes**, **0 collisions**, **0 stale fallbacks**, **0 discarded responses**, and **341 ms average API latency**. It used **100,846 tokens**; minimum observed forward gap was **14.8 m**.
- All four rendered views were inspected. The inspector confirmed that all four named camera streams reached the API in the exact state payload. The live sensor map is based on camera observations, not the entire world; switching to Jev's snapshot shows the state behind its last decision. The sensor strips and 3D outlines remain live.
- No new automatic collision avoidance, lane-change veto, speed adjustment, or weakened collision test was added. The 800 ms call cadence, lane-change duration, physics and previously documented stale-command fallback remain unchanged.

This update provides richer evidence and makes sensing inspectable. One completed run does not establish that extra cameras alone prevent crashes; the prompt now describes the richer data as well, and timings can differ between runs.

## Moving traffic, crossings and signs — 2026-09-17

The current build replaces generated fixed barriers with moving traffic and animated pedestrians at marked crossings. Normal one-minute runs have two crossings and 30/50 km/h signs, on a 540 m road. Car speeds are deliberately a little below the posted limits to allow passing opportunities. Background cars resume after people clear the road.

- **36 container tests passed**, including continuous pedestrian movement, collision reporting, NPC traffic resuming, sign visibility, sign memory persisting after occlusion/passing, not applying future signs early, and no automatic posted-speed clamp on the ego vehicle.
- The initial five live road probes all matched their expected actions; after clarifying the cruising goal, **four of five** matched. The exception accelerated at 28.8 km/h under a remembered 30 limit while a 50 sign was ahead. This limitation is preserved in `artifacts/road-probes-final.json`, not hidden by a speed governor.
- Final real browser run, seed 42, normal density, **60 seconds**: **495.1 m**, **74 decisions / 75 requests**, **358 ms average API latency**, **5 lane changes**, **1 car overtaken**, **2 crossings passed**, **5 signs remembered**, **0 collisions**, **0 stale fallbacks**, **0 discarded responses**, **284,791 tokens**. The time budget expired before the 540 m finish.
- It spent **5.67 seconds** more than 1 km/h over the actual posted limit, with **9.4 km/h maximum overspeed**. Minimum measured forward gap was **0.8 m**. These observations show the policy is imperfect; this is not a claim of reliable driving.
- The browser inspector showed the sign history 50 → 30 → 50 → 30 → 50, with activation only on passing. The last state retained the final 50 limit while no signs were visible. Future sign observations remained distinct from the active limit.
- The new sign banner and legible 3D numbered signs were visually inspected. The pedestrian motion/collision code and crossing flow were exercised by tests and the completed live run. Browser logs inspected during the run contained no errors or warnings.
- An optional additional live run intended for a closer animation inspection was rejected by automatic approval review due to further API usage. No workaround or further live test was attempted. The completed one-minute run above remains the verification result.

Exact observed final metrics are saved in `artifacts/traffic-run.json`. Neither collision detection nor Jev's action application is bypassed. Code retains observed signs and computes measurements, but Jev selects the ego car's steering and speed action.

## Sparse, slower traffic and longer run — 2026-09-17

The default is now **90 seconds / 810 m**, 1.5 times the previous 60-second / 540 m route. Normal mode has six cars (four for a 60-second run and three for 30 seconds); Busy adds three. Initial car positions alternate between lanes with seeded jitter and wide longitudinal spacing. Two crossings are retained on the default route.

Each background car has a distinct seeded desired speed: **10–14 km/h in the right lane**, **16–20 km/h in the left lane**. The old shared 30-zone target is removed: legal-speed capping now preserves each car's individual, already-lower target. Cars still yield to pedestrians and follow nearby traffic, then resume their own speeds. There is no fixed fast car added behind the ego vehicle.

**39 container tests passed.** New checks exercise 40 seeds for the 90-second layout, initial staggering, speed ranges, preserved speed diversity in 30 zones, and reopening a gap after two cars yield at the same crossing. The complete suite also verifies the 30/60/90 time budgets and existing sensor, sign-memory, collision, and API-contract behavior.

This update was verified with local simulation tests and UI inspection, without additional live Jev API calls. Earlier live-run metrics above apply to their recorded builds, not to the new traffic distribution. Jev's questions, ego control, collisions, and stale-response fallback are unchanged.

## Distance-aware approaches and gentle controls — 2026-09-17

The reported early-stop case exposed a gap in the input/prompt design: object offsets and crossing-centre distances were already present, but there was no explicit bumper-to-stop-line distance, no measured round-trip timing in the state, and only strong braking actions. The previous wording also did not clearly distinguish approaching an occupied crossing from entering it.

The current build adds `ease` (+1 m/s²) and `slow` (−1.5 m/s²), both selected directly by Jev. The server derives numeric motion measurements from the supplied observations: stopping distances, stop-line clearance, relative closing/stopping gaps, candidate action travel, and clearance estimates for visible pedestrians. It does not rank, choose, veto, or replace the model's lane or speed choice. The previously documented 1.8-second stale-command emergency fallback remains visible and counted.

**48 local container tests passed.** They verify measured-delay/speed scaling, a 37 m bumper-to-stop-line gap, no automatic restart of a distant stopped car, direct execution of gentle actions, no backwards kinematic projections, no double counting of people across cameras, and explicit rejection of old clients that cannot execute the new action values.

Seven bounded real Jev requests were made: six initial synthetic snapshots and one targeted recheck. The fixtures assume a representative 345 ms round trip and are explicitly labelled `scenario_assumption`; the API latency fields record actual request time.

| Synthetic snapshot | Observed Jev choice |
| --- | --- |
| Stopped 37 m before the line, distant lead car waiting | Stay right; **ease forward** |
| Stopped 0.8 m before the line, person crossing | Stay right; **brake** (holds zero speed) |
| Travelling 2 m/s with 24 m to the line | Stay right; **ease forward** |
| Travelling 8 m/s with 8 m to the occupied-crossing line | Stay right; **brake** |
| Slower car 90 m ahead, ample following space | Stay right; **accelerate** |
| Closing on a car 7 m ahead, adjacent lane occupied | Initially **slow**, which failed the expected firm-braking check; after sharpening the gentle/firm descriptions, recheck chose **brake** |

Initial results are retained in `artifacts/approach-probes.json`, including the failure. The single recheck is in `artifacts/approach-close-car-recheck.json`. The first five snapshots were not rerun after the final wording refinement. Confidence varied; these observations do not establish reliable driving or collision avoidance.

The running image passed all 48 tests. The updated browser tab was inspected without starting another driving run: it loads the six control options and the new distance/stopping/delay panel, with zero live decisions and zero tokens. Existing tabs and run history were preserved by opening a fresh tab. **A complete driving run with this new control interface has not been verified.**

## True two-way traffic and overtaking — 2026-09-17

The current road uses **right-hand traffic**. Slow right-lane cars travel forward at seeded 10–20 km/h targets; left-lane cars approach in the opposite direction at 25–45 km/h targets, subject to background traffic/crossing rules. The normal 90-second scene contains three of each. Oncoming cars move toward decreasing road position, face the ego vehicle in the renderer, and are not counted as vehicles overtaken.

Camera/radar observations now include direction and signed forward velocity. Front camera range is 220 m; front radar is 360 m, rear radar 65 m. Radar includes identified oncoming tracks. Head-on closing speeds sum the two speed magnitudes. The state reports finite visibility and the explicit assumption of an unseen vehicle immediately beyond range approaching at 50 km/h.

The new passing state contains measured phase, right-hand body overlap/return gaps, estimates for passing and returning, an estimate for braking to fall behind, and numeric timing/visibility margins. These are input calculations, not an eligibility gate or action selector. Solid-line sections around crossings are observed and supplied as road conditions; the code does not veto a violating model choice. Oncoming NPCs are not specially stopped or steered to conceal an unsafe ego incursion.

**62 local tests passed in the final container.** New tests cover reverse-direction traffic movement and following, oncoming pedestrian yields, summed closing speed, radar/camera range boundaries, overtaking counters, head-on collisions after unsafe raw Jev choices, full-pass/return timing, abort estimates, body-overlap clearance, finite unseen-traffic horizons, signed-value validation, and no hidden lane permission/override.

Eleven bounded live API calls were made: eight fixed snapshots, followed by three rechecks after refining the question wording and providing calculated time margins. The original results and exact questions remain in `artifacts/two-way-probes.json`; the three rechecks are in `artifacts/two-way-rechecks.json`.

| Situation | Initial observed choice | Recheck, if performed |
| --- | --- | --- |
| Close oncoming traffic leaves too little time | Right / brake | — |
| Generous passing gap and return space | Right / brake (too conservative for the scenario) | Left / accelerate |
| No visible oncoming car, but too little legal speed advantage to finish within the visibility horizon | Right / coast | — |
| Already passing with the right-hand car still alongside | Right / accelerate (incorrect early merge) | Left / accelerate |
| Fully clear of the passed car | Right / accelerate | — |
| Cannot finish the pass, right-hand car still alongside, room to brake and drop behind | Right / slow (incorrect early merge) | Left / brake |
| Solid centre line approaching a crossing | Right / brake | — |
| Right-hand gap exists after dropping behind | Right / accelerate | — |

The five initially matching scenarios were not rerun after the final wording refinement. Confidence and latency varied. This is a small diagnostic set, not proof that Jev can safely resolve every dynamic encounter.

The new version was opened in a fresh browser tab, preserving existing runs. The page loads with 90 seconds / 810 m, opposing direction arrows, a yellow centre divider, oncoming radar markers, and the passing panel. The initial observed display showed an oncoming vehicle at about 240 m / 37 km/h, a 9.9 s oncoming-time estimate and 9.6 s pass estimate. No model call was triggered by this UI inspection; the new tab showed zero decisions/tokens. No browser console errors or warnings were observed. **A complete two-way driving run has not yet been verified.**

A repeat live run on seed 42 with the same surround-perception build exhausted the 30-second budget at about **253 m** after **38 decisions** (346 ms average latency), with **no collision and no stale fallback**. Jev stopped behind a slower car despite the right lane being available. This illustrates the remaining model-decision limitation and is retained alongside the successful run rather than reporting only the finish. The live/Jev-snapshot selector and 3D-overlay toggle were exercised in the browser. No console errors or warnings were observed.
