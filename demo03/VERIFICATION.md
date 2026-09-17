# Verification — demo03 Jev Drives (2026-09-17)

Everything below ran inside containers through the Podman-backed `docker` on this Mac. No package was installed on the host. The API key came from the parent `.env` at runtime and was never printed or copied.

## Build and tests

* `docker compose up --build -d` → `http://127.0.0.1:3003`, health `{"ok":true,"configured":true,"model":"jev-latest"}`.
* `docker compose run --rm app npm test` → **43 tests, 43 passed** in the built image (two added with the drive-length control: world scaling and the time cap).
* Tests cover: seeded world variety and traffic speeds; smooth lane-change curves with visible heading and no sideways motion when standing; follow settling at a safe gap; stop resting before the line; emergency braking; camera occlusion, side and rear camera ranges, radar nearest-per-lane and closing speed, blind spots; sign memory (read within range, applied only when passed, kept after leaving view); crossing memory; pedestrian short-term memory and "not seeing anyone is not clear"; finished people not counted as waiting; overtake estimate consistency along the pass; head-on collision when the left lane is entered blindly; overtakes counted only after returning right; stale/unknown decisions rejected; server schema strictness, rule injection, error mapping, static routes, response validation.

## Live runs with the real Jev API

Headless closed-loop runs use the same simulation and executor as the browser; API latency is simulated as driving time. Every situation and answer is saved in `artifacts/probe-*.json`.

Final build (estimate integrated along the speed profile, abort/return criteria with the 6 s oncoming rule, make-progress rule). Seed 5 ran after the last wording change (no pass without an estimate); the other three ran one wording change earlier with identical code otherwise:

| Run | Result | Time | Decisions | Overtakes | Left lane | Min oncoming TTC | Crossings (stops) | Speeding | Latency | Tokens / cost |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| seed 4, light | **finish** | 92.8 s | 253 | 2 | 19.4 s | 9.9 s | 1 (1) | 0 s | 339 ms | 987k / $0.041 |
| seed 12, normal | **finish** | 94.2 s | 261 | 3 | 15.2 s | 6.0 s | 2 (2) | 0 s | 351 ms | 1.05M / $0.044 |
| seed 33, dense | **finish** | 116.8 s | 320 | 3 | 16.0 s | 5.8 s | 3 (0) | 0 s | 342 ms | 1.31M / $0.055 |
| seed 5, normal (final prompt) | **finish** | 94.1 s | 262 | 2 | 12.4 s | 3.9 s | 2 (1) | 0 s | 354 ms | 1.05M / $0.044 |

Earlier build of the same design (before the estimate fix), for the record:

| Run | Result | Time | Overtakes | Note |
| --- | --- | --- | --- | --- |
| seed 7, normal | finish | 106.2 s | 2 | one abort while alongside, recovered |
| seed 21, normal | finish | 94.2 s | 2 | passed two close cars in one manoeuvre |
| seed 33, dense | finish | 117.4 s | 3 | |
| seed 4, light | **collision** with oncoming car at 85.7 s | — | 2 | started a third pass from 11 km/h on a "moderate surplus" that turned "thin" as the car sped up; aborted to 2 km/h in the left lane, got boxed in by the car it had passed earlier, returned too late |

That failure is why the estimate now simulates the ego speed profile and reads both "time needed" and "time available" from the same profile, why abort braking is firmer, and why the return-right criterion says to leave the oncoming lane when the oncoming car is under about 6 s away. The same seed then finished with a minimum oncoming time-to-contact of 9.9 s.

What the traces show Jev doing, consistently across seeds:

* **Follow** the slow car at its speed with an 8–10 m gap; never stop-and-go.
* **Overtake** only when the estimate shows a surplus and no centre-line, crossing or speed-sign conflict, typically at 90–99% confidence; **stay left** while the passed car is alongside (attention: car being passed); **return right** once it is behind, then **cruise** or **follow**.
* Refuse passes with `thin` or `deficit` margins, with a 30 sign inside the pass distance, or near a crossing.
* **Stop** for a crossing from 40–110 m out when people are on the road or waiting (must-yield 93–98%); the executor brakes late and smoothly and rests about 1 m before the line; **cruise/follow** resumes as soon as everyone has finished (must-yield drops to under 10%).
* Switch the applied limit to 30 before the 30 sign and back to 50 when the 50 sign is passed; zero seconds over the posted limit in every run.

## Browser

Opened in Chrome at 1600×950. No console errors or warnings. Observed live: first decision within about 700 ms of Start, then about 2.4 decisions per second at 300–400 ms; the amber car followed, overtook the red car with the blind-spot zone lit and the passed car outlined by the right camera, returned right, slowed to 30 before the sign, and approached the crossing with must-yield at 96%. All four camera feeds render from the sensor mounts with detection counts; sensor cones, outlines, blind-spot zones, the lane-change curve and the stop marker draw in the scene. The Inspector shows the exact request and answer JSON and the question definitions. The run ends with a result card and auto-restarts with a new seed.

Limitation of this check: the automated browser tab counts as hidden when its window is behind others, which pauses the animation loop by design (and the API spend with it). Behaviour was therefore verified mainly through the headless runs, which share every line of simulation and executor code with the page.

## Honest limits

* Perception is structured simulation data with occlusion, not vision. No pixels reach Jev.
* Jev is imperfect: it occasionally wobbles between two manoeuvres at 40–50% for a decision or two (e.g. an overtake started toward a car 167 m away, then cancelled). All such moments are in the traces.
* Oncoming cars never brake for the amber car. A head-on is a real collision.
* Four to seven finished runs are evidence of typical behaviour, not a benchmark. Thresholds (surplus classes, the 6 s rule) were chosen by reasoning and one failure, not tuned on data.

## Follow-up after first viewing (same day)

Kaveh reported the right side of the page running off screen and a run that ended before the finish.

* Layout: the overlay is now a CSS grid that shrinks the side panels and wraps the top-bar controls; feed tiles size themselves to the window height. Checked at 1280×760 and 1440×860 with no clipping and no console errors.
* Run length: a **Drive** selector (90 s up to 10 min) scales the road, crossings, signs and slow traffic; the time cap is twice the chosen drive time (was a fixed 150 s). The end card now names the cap explicitly when it is the reason. The run he saw must have ended on a collision or that cap; the code has never had a 60 s limit.
