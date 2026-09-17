# Verification — 2026-09-17

The demo was built and run through the existing Podman-backed `docker compose` runtime, bound to `127.0.0.1:3002`. No packages were installed on macOS and no host `node_modules` directory was created. The parent `.env` was loaded by Compose at runtime; its value was not printed or copied into source or the image.

## Final build

- Container health endpoint: `{ "ok": true, "configured": true, "model": "jev-latest" }`.
- `docker compose exec -T app npm test`: **18 passed, 0 failed**.
- Tests cover seed reproducibility, 60 randomized sensor worlds, camera occlusion, matching speculative speed answers to lane choice, stale-result rejection, side collisions, high-speed collisions, stop behavior, 30/60-second budgets, finish detection, input sanitization, model-output validation, five-question batching, static route isolation, missing credentials, rate-limit cooldown, and provider failures.
- Real browser rendering checked in Follow, Aerial, and Driver modes. Console error/warning inspection returned no entries.
- Seed changes were verified against the visible world identifier after fixing a pending-input mismatch.

## Final live API run

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

A repeat live run on seed 42 with the same surround-perception build exhausted the 30-second budget at about **253 m** after **38 decisions** (346 ms average latency), with **no collision and no stale fallback**. Jev stopped behind a slower car despite the right lane being available. This illustrates the remaining model-decision limitation and is retained alongside the successful run rather than reporting only the finish. The live/Jev-snapshot selector and 3D-overlay toggle were exercised in the browser. No console errors or warnings were observed.
