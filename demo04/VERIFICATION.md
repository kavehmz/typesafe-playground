# Third pass — 29 September 2026

Checkpoint `c857918` was pushed before the third pass. The new work is described in [ROUND3.md](ROUND3.md).

## Real drive with Cinematic view

Seed **5**, normal traffic, the **840 m** preset, actual TypeSafe responses, all four sensor feeds visible:

| Observation | Result |
| --- | --- |
| Outcome | Finish, no collision |
| Simulated duration | 94.12 seconds |
| API responses / applied decisions | 230 / 229 |
| Completed overtakes | 2 |
| Crossings / crossing stops | 2 / 1 |
| Speeding / occupied crossing entries / stale decisions | 0 / 0 / 0 |
| Average request latency | 285 ms |
| Returned model | jev-1.13.0 |
| Tokens | 918,721 |
| Browser errors | 0 |

Across 6,084 browser frame intervals, the sample averaged **60.0 fps**, with a **17.4 ms** 95th percentile and **17.6 ms** 99th percentile. These are local testing-browser observations at 1600×1000, device pixel ratio 1. The final response arrived after completion and was correctly not applied.

[Browser report](artifacts/round3/final/verification.json) · [Actual session](artifacts/round3/final/live-session-seed5.json) · [Live crossing](artifacts/round3/final/live-crossing.png)

## New presentation checks

Explore selected a real pedestrian and two different vehicle types. Dragging, zooming and Follow Jev worked. The 5.6 km route rendered, and seven configuration/reset transitions showed no texture growth: 52 textures after exploring several subjects, 45 after returning to the initial scene. Those counters depend on which parts of the world have been rendered; they are not a total-memory measurement. Desktop, laptop and phone layouts showed no horizontal overflow.

The renderer also passed a frozen-world test for seeds 5 and 7 with zero changed world/ego data and zero non-finite geometry. The independent landscape audit confirmed the 25 m corridor stays flat; repeated landscape rebuilds held at 19 geometries and 11 textures. Roadside construction passed frozen-world checks across three seeds at both 840 m and 5.6 km.

Character studies were inspected at 1× and 2× density. The walking solver's flat-ground stance audit measured less than 0.000002 m of planted ankle drift per frame. Paused poses remain unchanged, and waiting/done legs remain planted. These are rendering checks, not biomechanics or real-world safety validation.

[Character study](artifacts/round3/people/head-1x.png) · [Walking poses](artifacts/round3/people/walk-1x.png) · [Render immutability](artifacts/round3/render-immutability.json)

After the full drive, two presentation corrections were added: remote Explore targets now cut directly to the subject, and foot placement follows the existing crossing slabs and their transition edges. A short actual drive and 2× display check cover those final changes separately; [final contact/camera report](artifacts/round3/final/final-contact-check.json), [grounded person](artifacts/round3/final/person-grounded.png), [final crossing view](artifacts/round3/final/cinematic-crossing-final.png).

The original 18 files, `decide()` and `frame()` still pass the demo03 parity guard. No driving decisions, inputs or actor schedules were replaced.

---

# Realism pass — 29 September 2026

The second presentation pass is now running on port 3004. Its implementation is described in [REALISM.md](REALISM.md). The initial edition's evidence remains below for comparison.

## Preservation and actual driving

The guard passes for all **18 protected files** and now also verifies the original browser **decision-request and simulation-frame loops**. The driving core and prompts remain unchanged. Demo03 was not edited.

An actual browser drive, with all four feeds visible and the new detailed scene, completed seed **5**, normal traffic, **840 m** in **94.08 simulated seconds**:

- **230 successful real API responses**, 229 applied decisions. The final response arrived after the run ended.
- **2 completed overtakes**, 2 crossings passed, 1 crossing stop.
- No collisions, no speeding, no occupied crossing entered, no stale decisions and no browser errors.
- Average request latency **278 ms**; model **jev-1.13.0**; 918,634 tokens.

Evidence: [session export](artifacts/realism/final/live-session-seed5.json), [complete browser report](artifacts/realism/final/verification.json), [live dashboard](artifacts/realism/final/live-dashboard.png), [result](artifacts/realism/final/drive-result.png).

## Rendering and resource checks

The browser frame sample across the drive contained **6,082 intervals**: average **60.0 fps**, median **16.7 ms**, 95th percentile **17.5 ms**, 99th percentile **17.6 ms**. This measures the local testing browser at 1600×1000 with device pixel ratio 1, rather than a cross-device performance guarantee.

The **5.6 km route** rendered successfully. Seven reset/configuration transitions returned to exactly the initial **304 uploaded geometries and 38 textures**, with no growth in those counters. These are renderer counters, not a complete system-memory measurement. Different route positions may load additional previously unseen chunks.

Checked the full layout at **1600×1000, 1280×760 and 390×844**, with no horizontal overflow and accessible lighting controls. Inspected all three camera positions and all three lighting modes. Focus view expands the scene; side camera previews retain the original 120° crop of the 170° detector coverage.

A subsequent rendering review corrected cubemap colour/depth clearing between reflection captures and restored a checkered finish marker at the exact route endpoint. A final short live check on port 3004 exercises repeated reflection captures after that correction; [current captures and report](artifacts/realism/published/) come from that final build. The full-run numbers above precede these two render-only corrections. A further high-density display check found and corrected duplicate viewport pixel-ratio scaling and depth-normal sampling bands. The correction was verified at device pixel ratio 2 and in the actual Codex in-app browser; [clean high-density capture](artifacts/realism/published/bands-fixed.png).

All geometry, textures and sky assets are produced locally by the presentation modules. No additional npm dependency or host package was installed. The temporary review service on port 3005 is removed after verification; the normal demo stays on port 3004.

---

# Demo04 verification — 29 September 2026

Demo04 preserves Fable's demo03 driving system and changes its presentation. The checks below were performed against the actual local container at `http://127.0.0.1:3004`. No simulation or Jev decisions were mocked for the browser drive.

## Preserved behavior

`node demo04/tools/check-parity.mjs` passes for **18 protected files**: all nine simulation modules, questions, schema, server, five test files and the headless probe. They match demo03 byte for byte, with the sole permitted difference being the server's startup message identifying demo04.

The request/response loop and simulation stepping in `public/app.mjs` were independently reviewed against demo03. Changes there concern layout, separate preference storage, inspector keyboard/focus handling, the new focus view, export filename and display reset. Jev still selects the same eight manoeuvres and 30/50 pace from the same inputs and prompts.

The inherited suite passed **43/43 tests inside the container**. JavaScript syntax checks and repository whitespace checks passed. Demo03 itself was not edited.

## Actual browser run

A real browser run used seed **5**, normal traffic, **840 m**, the 90-second drive preset and Repeat disabled. The run included a pause/resume check. The API returned model **jev-1.13.0** through the configured `jev-latest` alias.

| Observation | Result |
| --- | --- |
| Outcome | Finish reached; no collision |
| Simulated duration | 94.05 s |
| Distance | 840 m |
| API responses / applied decisions | 228 / 227 |
| Completed overtakes | 2 |
| Crossings passed / stops at crossings | 2 / 1 |
| Time over posted speed limit | 0 s |
| Occupied crossings entered | 0 |
| Stale decisions | 0 |
| Minimum oncoming time-to-contact | 4.3 s |
| Average browser request latency | 284 ms |
| Tokens | 910,644 |
| Console or page errors | 0 |

The final response arrived after the finish and was not applied. The saved trace retains it. Evidence: [exported session](artifacts/live-session-seed5.json), [browser report](artifacts/browser-verification.json), [finish screenshot](artifacts/drive-result.png).

This is one successful synthetic run, not a general performance or safety benchmark. The original behaviour and its imperfections remain. The original headless probe has an inherited latency-advancement cap; the run above used the actual browser loop instead.

## Presentation and controls

Final checks passed at **1440×960, 1280×760, 820×900, 390×844 and 360×800**, with no horizontal overflow or clipped setup controls. Seed and active/upcoming speed signs remain available at compact sizes. Camera renders track their actual element rectangles as layout or scroll changes.

Verified: chase/aerial/driver views; all four camera previews; sensor toggle; focus view; probability displays; radar expansion; visible blind-spot indicators; inspector situation/answer/questions/run tabs; Escape and keyboard focus handling; real JSON session download; and pause keeping the simulation clock fixed. V, F and I were checked after clicking Start. A separate final smoke run recorded **23 real API responses** and supplied the [current driving screenshot](artifacts/astra-driving.png).

The initial desktop animation sample observed approximately 60 frames/second in the testing browser. This is an idle 90-frame sample, not a sustained or cross-device benchmark. The testing browser was already installed; no host packages were installed.

Final evidence: [UI check](artifacts/final-ui-check.json), [smoke session](artifacts/final-smoke-session.json), [desktop](artifacts/desktop-ready.png), [laptop](artifacts/laptop-ready.png), [phone](artifacts/small-mobile-ready.png), [inspector](artifacts/inspector.png), [focus view](artifacts/focus-ready.png).

## Presentation-only corrections

- Abort text now reflects the existing executor's target-minus-12 km/h behaviour.
- Stop text reports the current stop-line distance, without claiming that distance is the intended stopping offset.
- A new run clears old displayed probabilities until its first answer arrives; session totals retain their original meaning.
- Sign memory emphasizes the active limit and next remembered sign; older sign history remains in the inspector and hover text.
- Rear and driver views hide the ego body for visibility; simulated sensor mounts and FOV remain unchanged. Side previews retain the original 120° crop of the 170° sensor coverage.
- Rebuilt scene resources are disposed and tree geometry is instanced.

Other inherited quirks, including retry behaviour and in-flight replies across restarts, are documented in [ARCHITECTURE.md](ARCHITECTURE.md). They were deliberately preserved under the requested logic replication.
