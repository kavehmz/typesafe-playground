# Jev "System One" Typed-Judgment Usages — Dimension 04: Control Systems, Robotics & Industrial Automation

**Scope.** Evidence-grounded catalog of 15 usages where a fast, cheap, *non-generative* typed-judgment model (Choice / Noul / Score over a JSON state, many questions per call, sub-100ms latency, ~$0.04/Mtoken) improves or automates established practice in process control, SCADA/DCS operations, manufacturing execution, and robotics. Every usage names (1) name + one-liner, (2) current practice & bottleneck, (3) concrete primitive design (questions, primitive types, state), (4) why sub-100ms + near-zero cost matters, (5) evidence. Confidence rated High/Medium/Speculative per usage.

**Framing note.** Jev's design pattern — atomic yes/no/choose/score questions composed in code — matches how the strongest existing systems already use big models: DoReMi reduced VLM monitoring to binary questions because "the VLM can focus on the specific constraints suggested by the LLM and only need to pick binary answers, providing more precise feedback" and "consists of very short token lengths and costs less than 0.1 second" per query [^15^]. Jev productizes exactly that pattern at lower cost and latency.

**Safety caveat applied throughout.** Wherever a usage touches safety functions, Jev is positioned strictly as an *advisory* layer. It must never be credited as a layer of protection, never sit in a Safety Instrumented Function (SIF), and never claim risk-reduction factor under IEC 61508/IEC 61511. IEC 61511 practice already distinguishes "Non-SIF" instrumented functions — "All Instrumented Functions that do not require an integrity level for the purposes of risk reduction" [^33^]; Jev usages in this catalog live in that non-SIF/advisory category, or in BPCS/MES/operator-support scope. EEMUA 191 further constrains alarm+operator claims used in SIL assessment [^3^].

---

## A. Alarm management & abnormal-situation support (process industries)

### Usage 1 — Alarm-flood triage and root-cause shortlisting
**One-liner:** During an alarm flood, Jev continuously classifies the live alarm burst — grouping consequential alarms, shortlisting the probable initiating cause, and scoring flood severity — so the operator sees an ordered "what started this" list instead of a scrolling wall.

**Current practice & bottleneck.** ISA-18.2 defines an alarm flood as >10 alarms in 10 minutes and recommends <1% of operating time in flood [^35^]; EEMUA 191 calls >100 alarms in the 10 minutes after an upset "definitely excessive" [^3^]. Real floods are far worse: "an operator can receive more than one thousand alarms in the first ten minutes of a major process upset" [^36^]. Research confirms floods "obscure root causes, overwhelm operators, and heighten safety risks due to delayed or incorrect responses" [^7^]. Existing mitigations are static: rationalization, state-based suppression matrices, first-out logic [^2^]. Academic root-cause methods (HAZOP-derived causal nets + Granger causality + time-retrospective reasoning [^5^]; PrefixSpan flood-pattern mining [^37^]; functional-model causal analysis in NPPs, where operators "are typically capable of managing only 6–8 alarms at once" [^6^]) are compute-heavy offline analyses, not per-flood real-time triage.

**Primitive design.**
- *State:* rolling window of the last N alarm events (tag, text, priority, timestamp, ack state), current unit mode, equipment trip bits, key PV deviations vs. limit, and a compact candidate-cause list drawn from the site's alarm-rationalization database/HAZOP deviation table.
- *Noul (parallel, one per candidate cause):* "Given the alarm sequence and process state, is *<cause i>* plausibly the initiating event of this flood?" → probability per cause; rank.
- *Noul (parallel, per standing alarm):* "Is alarm *<j>* a downstream consequence of *<top cause>*?" → drives display grouping.
- *Score:* "Rate current flood severity on the EEMUA 191 response rubric (manageable / hard-to-cope / definitely-excessive)" [^3^].
- *Choice:* "Which single alarm should be presented first to the operator?"

**Why sub-100ms + near-zero cost matters.** Floods evolve on seconds; triage must re-run every few seconds for minutes (tens to hundreds of calls per event), across possibly dozens of simultaneous candidate causes and alarms — only feasible if each atomic judgment is sub-100ms and fractions of a cent. This is supervisory-timescale (seconds), not control-loop timescale, but it is *human-decision-loop* timescale: the value is delivered in the first 1–2 minutes of the upset. A generative LLM call (seconds, ~100x cost) cannot sit in this loop; a dedicated correlation engine cannot absorb semantic context (alarm text, HAZOP phrasing, procedure context) the way a judgment model can.

**Evidence.** [^3^] EEMUA 191 flood benchmarks via HSE; [^35^] ISA-18.2 flood definition; [^36^] 1,000+ alarms/10 min observed; [^5^] "a large number of alarms are often generated at the same time… it largely hinders the operator from making accurate judgments and correct actions for the root cause of the alarm"; [^6^] NPP alarm-flood filtering/prioritization motivation; [^7^] Alberta dissertation on flood decision support; [^37^] flood-pattern mining.
**Confidence: High** (established problem, established standards targets, active literature; the Jev layer is a novel but low-risk recombination).

---

### Usage 2 — Alarm rationalization copilot: per-alarm justification, priority and "defined response" checks
**One-liner:** During ISA-18.2 rationalization workshops, Jev screens thousands of candidate/configured alarms against the alarm philosophy — does each alert/inform/guide, have a unique defined response, and deserve its proposed priority?

**Current practice & bottleneck.** ISA-18.2 defines rationalization as reviewing "potential alarms using the principles of the alarm philosophy… and document the rationale for each alarm" [^38^]. EEMUA 191's design principles: "Each alarm should alert, inform and guide the operator… be useful and relevant… have a defined response with adequate time for that operator to carry out the response" [^3^]. EEMUA's priority method is a consequence × maximum-response-time matrix [^4^]. This is manual, workshop-based, expensive, and done infrequently — a documented reason legacy systems carry "300–2,000+ alarms per operator per shift" vs. the ≤150 ISA target [^39^].

**Primitive design.**
- *State:* alarm tag + message + setpoint, P&ID/area context, consequence description from HAZOP/LOPA where available, proposed priority, documented operator response, plant alarm philosophy excerpts.
- *Noul:* "Does this alarm indicate an abnormal condition *requiring operator response* (ISA-18.2 definition)?" [^38^]
- *Noul:* "Is the documented response unique to this alarm (not duplicative of <related alarm>)?"
- *Choice:* priority band {Critical/High/Medium/Low/Journal-only} with probabilities.
- *Score:* position on the EEMUA consequence×response-time matrix cell [^4^].
- *Choice:* disposition {keep / re-setpoint / deadband+delay / state-based suppression candidate / delete}.

**Why sub-100ms + near-zero cost matters.** Rationalization covers thousands of alarms × ~5 questions; a full-plant screen is ~10–50k atomic judgments. At ~$0.04/Mtoken this is a few dollars per plant per cycle — turning a once-a-decade workshop into a continuous screening process, with humans adjudicating only flagged disagreements. This is offline/batch timescale; latency matters only for interactive workshop use (engineers iterating live).

**Evidence.** [^3^] EEMUA 191 principles (verbatim above); [^38^] ISA-18.2 rationalization definition and alarm definition ("equipment malfunction, process deviation, or abnormal condition requiring a response"); [^4^] EEMUA priority matrix; [^39^] legacy vs. ISA-18.2 alarm volumes.
**Confidence: High** (direct automation of a standardized, text-heavy judgment workflow).

---

### Usage 3 — Operating-state inference for state-based/dynamic alarming
**One-liner:** Jev classifies the plant's true operating state (startup / shutdown / normal / upset / hold / maintenance) from mixed signals, feeding the state parameter that drives ISA-18.2 state-based alarm suppression matrices.

**Current practice & bottleneck.** ISA-18.2's advanced-alarming guidance: "alarm attributes are modified based on the operating state of the plant or a piece of equipment… It can suppress a low-flow alarm from the operator when it is caused by the trip of an associated pump… In batch processes it can change which alarms are presented to the operator based on the phase" [^2^]. The standard defines a "suppressed-by-design" state "under the control of logic that determines the relevance of the alarm" [^1^]. The bottleneck is the state detector itself: today it is hand-built logic in the controller ("logic in the controller can determine the state of the column" [^2^]) — brittle, per-unit engineering that plants under-invest in, so suppression matrices go unconfigured and floods persist ("Static alarming is effective when the process is running normally, but… in conditions like a shutdown state, an alarm flood will likely occur" [^40^]).

**Primitive design.**
- *State:* unit equipment-module status bits, phase state machine outputs (ISA-88 states: IDLE/RUNNING/HOLD/ABORT/COMPLETE [^41^]), key PVs and rates of change, trip/interlock bits, recent operator actions.
- *Choice:* current operating state from the site's defined state list (probabilities + confidence).
- *Noul (parallel, per ambiguous transition):* "Has unit <u> genuinely completed transition to state <s>, or is this a transient?"
- *Score:* confidence-weighted "state stability" — used to hysteresis-gate switching of the suppression matrix (prevents flapping between states).

**Why sub-100ms + near-zero cost matters.** The state output drives which alarms annunciate *now*; during fast transitions (trips) it must update in scan-adjacent time (100ms–1s) and run continuously per unit. Cost matters because this is an always-on per-unit service across hundreds of units. Note: the *suppression decision itself* remains deterministic, reviewed logic per ISA-18.2 MOC; Jev only supplies the semantic state classification — keeping the safety-relevant path engineered and auditable.

**Evidence.** [^2^] Siemens/ISA-18.2 state-based alarming (verbatim); [^1^] ANSI/ISA-18.2-2016 §5.3.2.7 suppressed-by-design (verbatim) and §3.1.84 state-based alarm definition; [^40^] Emerson on dynamic vs. static alarming; [^41^] ISA-88/ISA-106 state models.
**Confidence: Medium-High** (clear standards hook; novelty is semantic state inference rather than hand-coded logic).

---

### Usage 4 — Operator decision support: abnormal-situation procedure selection
**One-liner:** Given a diagnosed (or hypothesized) abnormal event and current plant state, Jev shortlists which abnormal/emergency operating procedure applies and scores response urgency — advisory decision support, not automated action.

**Current practice & bottleneck.** NPP work documents the bottleneck directly: "there may be more than one hundred of abnormal procedures in NPPs, it is difficult for operators to select a procedure relevant for the current situation" [^12^]. The AIDAA support system therefore includes "alarm processing, event diagnosis with reasoning process, provision of procedures, suggestion of mitigating actions" [^12^]. ASM literature identifies root-cause diagnosis and procedure selection as core decision-support functions [^14^]. Recent work puts large reasoning models above regulatory control for ASM — but with a "programmatic validator [that] gates every proposal against static limits" [^13^], and such models are slow/expensive per call.

**Primitive design.**
- *State:* diagnosed event hypothesis (from Usage 1/5 layers) with probabilities, key process variables vs. operating envelope, active alarms, unit mode, list of applicable procedures with entry conditions.
- *Choice:* "Which procedure's entry conditions best match the current situation?" (probabilities across the procedure library).
- *Noul (parallel, per candidate):* "Are all entry conditions of procedure <p> satisfied?"
- *Noul:* "Is the situation degrading toward <trip/relief threshold> within the available response time?"
- *Score:* urgency on a fixed rubric (monitor / act within shift / act within minutes / immediate).
- Composition: the Choice output + Noul gates feed a *deterministic* presenter that shows the operator the top-2 procedures with entry-condition checklist status; all actions remain operator-executed.

**Why sub-100ms + near-zero cost matters.** Procedure selection must re-evaluate continuously as the situation evolves (every few seconds during an event) and cheaply enough to run against the full procedure library in parallel. This is human-supervisory timescale; the advisory framing (validated, deterministic gating downstream) mirrors the validator architecture in [^13^] and the advisory role of AIDAA [^12^]. Explicitly not a safety function: procedures themselves remain the credited mitigation.

**Evidence.** [^12^] AIDAA (verbatim above); [^13^] reasoning-model ASM layer with bounded action interface and validator; [^14^] ASM concept: "Root cause diagnosis can provide decision support for operators… cutting off the path from abnormal situations to incidents or accidents."
**Confidence: Medium-High** (documented practice of procedure-provision DSS; Jev is a cheaper/faster judgment substrate for the same functions).

---

## B. Fault detection, diagnosis & asset-health triage

### Usage 5 — FDD verdict & routing layer above statistical detectors
**One-liner:** Jev sits above existing model-based/data-driven FDD (PCA, QDA, observer banks) as a semantic jury: is this detection a real fault, which fault class best fits, and who should act (operator now / maintenance / ignore-and-log)?

**Current practice & bottleneck.** FDD is a mature three-decade field [^8^][^9^]: detection and classification are "carried out sequentially" [^42^], and methods output class labels or residuals — but the *disposition* of a detection (true fault vs. known transient vs. sensor artifact; whom to route it to) is left to engineers. Reviews note industry constraints: shortage of labeled fault data, interpretability demands, and that rule-based expert systems "remain dominant in industrial applications" despite brittleness [^9^]. Decision-support tools that assist operators "to diagnose faults and make correct decisions" are an active research need [^9^].

**Primitive design.**
- *State:* detector outputs (T²/SPE statistics, classifier top-3 classes with scores), recent process context (mode, feedstock, rate changes), maintenance history flags for the implicated equipment, sensor-health diagnostics (NAMUR NE 107-style status), and a fault-class vocabulary from the site's FMEA.
- *Noul:* "Is this detection consistent with a genuine process/equipment fault (vs. benign transient or measurement artifact)?"
- *Choice:* fault class from the FMEA-derived vocabulary (probabilities) — used only to *re-rank/soften* the statistical classifier's output when process context is discriminative.
- *Choice:* routing {operator-immediate / operator-shift-end / maintenance-work-order / instrumentation-check / log-only}.
- *Score:* confidence-ordered severity for work-order prioritization.

**Why sub-100ms + near-zero cost matters.** FDD runs continuously across thousands of loops/assets; a verdict layer must evaluate every detection event (potentially hundreds/hour plant-wide) at negligible marginal cost, with latency matched to DCS scan/event timescales (seconds). Batch re-scoring of overnight detection logs is also cost-sensitive.

**Evidence.** [^8^] Venkatasubramanian et al. FDD review taxonomy; [^9^] Industry 4.0 FDD systematic review (DST need, rule-base dominance, labeled-data scarcity — verbatim above); [^42^] dynamic-QDA industrial fault classification (sequential detection→classification pipeline).
**Confidence: Medium-High** (the "verdict/routing above statistics" gap is documented; specific composition is our design).

---

### Usage 6 — Control-loop performance monitoring (CLPM) diagnosis triage
**One-liner:** Jev converts CLPM oscillation/performance detections into diagnosed verdicts — stiction vs. aggressive tuning vs. external disturbance vs. cascade-propagated oscillation — and prioritizes "bad actor" loops for the reliability engineer.

**Current practice & bottleneck.** Industrial surveys: "only one third of industrial controllers provide acceptable performance" and "about 20–30% of all control loops oscillate due to valve problems" [^43^]. Commercial CLPM tools output diagnosis lists such as "Oscillating due to aggressive tuning / Oscillating due to valve stiction / Oscillating due to loop X (cascade)…" [^10^], but plant-wide diagnosis "requires both detection and root-cause analysis" [^11^], and expert attention is the scarce resource; tools must provide "a prioritized list of poorly performing loops" and "guidance on problem resolution… vital information for the non-expert" [^10^].

**Primitive design.**
- *State:* per-loop OP/PV oscillation metrics (period, amplitude, shape features — e.g., square/triangular/sawtooth templates from shape-analysis methods [^43^]), loop configuration (cascade position, valve type), CLPM flags, neighboring-loop co-oscillation map.
- *Choice:* diagnosis from the standard CLPM vocabulary {stiction / aggressive tuning / external disturbance / propagated-from-loop-X / sensor-noise / slug-flow or process nonlinearity}.
- *Noul:* "Is loop <x> the root-cause oscillator for the co-oscillating group, or a victim?"
- *Score:* maintenance priority rubric combining loop criticality × performance degradation [^10^].
- *Choice:* recommended next step {valve inspection / retune / investigate disturbance source / monitor}.

**Why sub-100ms + near-zero cost matters.** Hundreds-to-thousands of loops, re-scored daily or on-drift; per-loop cost must be near zero for continuous plant-wide coverage. Latency is batch-to-minutes (not control-loop timescale) — but interactivity matters for engineers drilling down live.

**Evidence.** [^43^] Srinivasan/Rengaswamy stiction statistics and qualitative shape categories (verbatim); [^10^] CLPM diagnosis list & prioritization practice (verbatim); [^11^] plant-wide oscillation diagnosis challenge (NTNU thesis).
**Confidence: High** (maps directly onto documented CLPM diagnosis outputs; Jev replaces brittle per-loop rule trees with contextual judgments).

---

### Usage 7 — Condition-monitoring / predictive-maintenance alert triage to work orders
**One-liner:** Jev adjudicates condition-monitoring alerts (vibration, oil, thermography) in process context — true degradation vs. operating-transient artifact vs. sensor drift — and drafts the disposition: work order type, priority, or "watch."

**Current practice & bottleneck.** False alarms destroy PdM programs: "technicians stop trusting alerts, and leadership starts questioning the ROI" [^44^]; best practice is multi-sensor and process-context corroboration — "a pump start-up vibration spike could look identical to bearing damage if context isn't considered" [^44^]. CBM guidance warns "thresholds set too tight generate false alarms and erode team confidence," and that without automated alert-to-work-order workflows "alerts become emails that get buried" [^45^]. Recommended practice already includes alert disposition categories ("False Positive / Planned for Next Shutdown / Immediate Action Taken") [^46^].

**Primitive design.**
- *State:* alert features (spectrum bands, trend slope, threshold crossed), machine operating context at alert time (start/stop transient, load, speed), corroborating channels (temperature, oil debris, power), asset criticality, recent work history.
- *Noul:* "Is this alert consistent with a genuine developing fault (vs. transient/measurement artifact)?"
- *Choice:* most likely failure mode from the asset's FMEA list (probabilities).
- *Choice:* disposition {immediate work order / plan for next outage / increase monitoring frequency / recalibrate sensor / dismiss as false positive}.
- *Score:* severity on the site's priority rubric (drives SLA tier).

**Why sub-100ms + near-zero cost matters.** Fleet-wide CBM generates alerts continuously; triage must scale to every alert at near-zero marginal cost, and fast enough (seconds) that work orders are created while the context window is fresh. This is supervisory/maintenance timescale; the win vs. rules is absorbing semantic context (operating mode, recent maintenance notes) that static thresholds can't [^44^].

**Evidence.** [^44^] false-alarm trust erosion & context-free spike example (verbatim); [^45^] CBM threshold and CMMS-integration guidance; [^46^] disposition-feedback-loop practice.
**Confidence: High** (documented bottleneck; disposition categories already exist as a workflow target).

---

## C. Robotics

### Usage 8 — Robot execution verification: preconditions, postconditions, and task success
**One-liner:** Before and after each robot skill executes, Jev answers atomic Nouls over scene state — "is precondition <p> satisfied?" / "did postcondition <q> hold?" / "did step <s> succeed?" — plus a calibrated "proceed / retry / ask-for-help" gate — the exact monitoring role VLMs play today, at a fraction of the cost and latency.

**Current practice & bottleneck.** State-of-the-art failure-handling frameworks verify pre/postconditions with large VLMs: "The VLM continuously analyses execution states… Precondition Verification… Postcondition Verification" [^16^]; REMAC does "post-conditions checks" per subtask with a VLM deciding "whether the current scene conditions satisfy the success criteria" [^17^]; DoReMi queries a VLM as a binary "constraint detector" every 0.1–0.2 s — noting binary questions "cost less than 0.1 second" and that this focus yields "highly accurate feedback" [^15^]. Predictive monitoring work explicitly lists "VLM latency" as a limitation [^18^]. Foundation-model pipeline latency is dominated by the big model: "LLM inference takes 76.9% of the execution time" (249 ms/frame even on high-end GPU) [^23^].

**Primitive design.**
- *State:* scene graph (objects, relations, robot-object states [^16^]), skill descriptor with declared pre/postconditions, execution history (skills + timestamps + prior check results), camera-derived object tracks (if vision upstream is used) or textual scene summary.
- *Noul (parallel — one per precondition):* "Is precondition <p> currently satisfied?" with probability; gate = min-probability threshold, otherwise block/expand plan (as in [^16^]).
- *Noul (parallel — one per postcondition):* "Does postcondition <q> hold after execution?"
- *Score:* degradation rubric {clean success / partial / failed / uncertain} to drive retry vs. replan vs. ask-human.
- *Noul:* "Did step <s> achieve its success criteria?" (probability; parallel across criteria) — the VLM-success-detector role in Inner Monologue-style systems ("Is the cube in the gripper?… binary Yes/No success signals" [^18^]) and CLIPort+LLM baselines that "repeat the step until success" [^15^].
- *Choice:* next meta-action {proceed / retry-step / replan / ask-human} — with probabilities that can feed a conformal wrapper à la KnowNo [^22^]: KnowNo showed LLM planner confidences are uncalibrated and used conformal prediction to decide when to ask for help, achieving "statistically guaranteed levels of task success while reducing the amount of help required by 10–24%" [^22^]. Jev's calibrated probabilities are the wrapper's input; the guarantee comes from the wrapper.
- Note: where visual grounding is required, a small vision encoder produces the structured scene state; Jev consumes the *structured* state, which is where its cost/latency advantage over full VLM calls is largest.

**Why sub-100ms + near-zero cost matters.** DoReMi runs constraint checks at 5–10 Hz during execution [^15^]; per-skill checks × multiple conditions × every robot in a fleet makes VLM calls the dominant cost and latency term [^23^]. Sub-100ms keeps verification inside the skill-transition budget (control-adjacent, not servo-loop); near-zero cost makes continuous (not just step-boundary) monitoring economically viable — the documented gap between DoReMi's continuous checking and Inner Monologue's step-end checking [^15^][^18^]. Success checks additionally fire after every primitive in training *and* deployment (episode termination, data collection) — fleet-scale, millions of judgments/day, the textbook case for ~$0.04/Mtoken.

**Evidence.** [^16^] unified VLM/BT failure-handling framework (verbatim); [^17^] REMAC post-condition checks; [^15^] DoReMi binary constraint detector (IROS 2024; verbatim); [^18^] predictive VLM monitoring limitations and IM success detectors; [^23^] Corki latency breakdown; [^22^] KnowNo ask-for-help gating.
**Confidence: High** (this is a direct substitution of a documented, working component).

---

### Usage 9 — Recovery-policy selection after failure
**One-liner:** When verification fails, Jev chooses the recovery strategy — retry, regrasp, adjust pose, replan trajectory, notify operator — ranked by applicability to the diagnosed failure and scene context.

**Current practice & bottleneck.** Recovery today is either hand-coded fallback or heavyweight replanning. The Recover framework classifies action outcomes "as either a failure or a success" via a sub-goal verifier, then extracts recovery strategies from an ontology for an LLM replanner [^19^]. An LLM-based failure-recovery system assigns each strategy "a priority level ranging from 1 to 5" and filters candidates "against the provided context: any recovery strategy that is marked as incompatible with the detected object type or the current robot configuration is excluded" [^20^]. Frontiers work shows predictive monitors "halt the current action, execute the fallback behavior, and replan" [^18^]. Strategy selection is a small discrete choice — ideal for Choice primitives — but is currently done with generative LLM calls or static tables.

**Primitive design.**
- *State:* failure type (from Usage 8 verdicts), violated condition, scene graph, robot configuration, object class, recovery-strategy library with compatibility metadata and base priorities.
- *Choice:* recovery strategy from the compatible set (probabilities + confidence).
- *Score:* risk-of-collateral-damage rubric per candidate (filters risky retries near fragile objects).
- *Noul:* "Is this failure class unrecoverable without human intervention?" (routes to operator notify — the documented low-priority passive fallback [^20^]).
- Composition: Jev ranks; a deterministic filter enforces compatibility and safety envelopes; the reactive planner/BT executes [^16^].

**Why sub-100ms + near-zero cost matters.** Recovery latency is dead time in the task; sub-100ms selection lets the robot abort-and-recover within the skill-cycle budget, approaching DoReMi's "immediate re-plan and recovery" benefit [^15^]. Cost matters because failures are long-tail and frequent in real deployments.

**Evidence.** [^19^] Recover neuro-symbolic framework; [^20^] prioritized recovery-strategy selection (verbatim); [^16^] reactive-planner correction loop; [^18^] fallback-and-replan monitor.
**Confidence: Medium-High.**

---

### Usage 10 — Affordance / skill-feasibility judgment (SayCan's "Can," without the learned value function per task)
**One-liner:** Jev estimates "can skill <π> succeed from the current state?" as Score/Noul judgments over a structured scene — a cheap, zero-shot affordance layer to ground skill selection.

**Current practice & bottleneck.** SayCan grounds LLM plans with per-skill learned affordance value functions: "the affordance function describes the probability that each skill will succeed" and final selection multiplies P(useful) × P(success) [^21^]. The bottleneck: value functions are trained per skill/domain (RL, real-world data) [^21^][^49^]. Many deployments need a lightweight, no-training feasibility screen — e.g., "is the target graspable given occupancy/occlusion/gripper state" — before committing a skill.

**Primitive design.**
- *State:* scene graph + robot state + skill descriptor with declared requirements (gripper free, target visible/reachable, path clear, payload limits).
- *Score (parallel per candidate skill):* feasibility rubric {infeasible / unlikely / feasible / ideal} with probabilities → multiplies with task-relevance scores exactly as in SayCan's argmax composition [^21^].
- *Noul:* "Is the workspace currently safe for autonomous execution of <π> (no human in cell, no obstruction)?" — advisory gate; hard safety stays with rated safety systems.
- *Choice:* argmax selection of skill (or expose full distribution to the planner).

**Why sub-100ms + near-zero cost matters.** Affordance scoring runs at every planning step over the whole skill library (10s of skills × every step). Sub-100ms keeps re-planning interactive; near-zero cost enables scoring the full library each step rather than caching stale values. Learned value functions remain preferable where training data exists; Jev covers the long tail of new skills/objects with no retraining.

**Evidence.** [^21^] SayCan (verbatim); [^49^] Q-Transformer on SayCan affordance estimation; [^50^] Semantic Skill Grounding description of SayCan pipeline.
**Confidence: Medium** (zero-shot affordance quality needs validation per domain; architecture is proven).

---

## D. Manufacturing execution, quality & HMI

### Usage 11 — Machine-vision reject adjudication (false-reject triage)
**One-liner:** Jev re-judges borderline vision-system rejects using part context and defect taxonomy — true defect vs. false reject vs. reworkable — cutting scrap and manual re-inspection load.

**Current practice & bottleneck.** "In traditional rule-based machine vision systems, FR [false rejection] rates of 5–15% or higher are common," a "direct driver of yield loss and OEE degradation" [^26^]. Rejected parts "accumulate in a manual work area where they are double-checked by an operator… If the part is a false reject, the operator can add this image… and reintroduce the part" [^27^]. Threshold calibration is the acknowledged control knob [^26^], but context (product variant, tooling wear state, lighting drift) is not used at decision time.

**Primitive design.**
- *State:* vision-system output (defect class, confidence score, ROI descriptor), part/lot context (SKU, tooling age, material batch), recent reject-rate trend for the station, defect taxonomy with severity definitions, (optionally) compact vision-encoder embeddings of the ROI.
- *Noul:* "Is the flagged anomaly a genuine defect per the defect definition (vs. cosmetic-in-tolerance / imaging artifact)?"
- *Choice:* disposition {pass / rework / scrap / route-to-human-MRB}.
- *Choice:* defect class from taxonomy (drives correct NCR workflow).
- *Score:* severity rubric → containment scope (single part / since-last-good / lot hold).

**Why sub-100ms + near-zero cost matters.** Inspection runs at line rate; adjudication must complete within the reject-handling window (100s of ms to seconds) and cost far less per part than the scrap it saves. Volume is the whole point: thousands of rejects/day/plant.

**Evidence.** [^26^] FR definition & 5–15% rates (verbatim); [^27^] manual double-check workflow (verbatim); [^28^] threshold-calibration practice.
**Confidence: Medium-High** (needs a vision front-end for the image content itself; Jev's edge is context fusion + taxonomy judgment).

---

### Usage 12 — Andon call classification & escalation routing
**One-liner:** Jev classifies free-text/voice andon calls into the plant's call-type taxonomy, scores severity, and routes to the right responder tier — replacing mis-tagged or broadcast alerts.

**Current practice & bottleneck.** Digital andon practice: "each alert carries a call type, an assigned first responder, a response-time target, and a defined path upward" [^29^]; typical taxonomy is Quality / Maintenance / Safety / Material / Setup [^30^]. Failure modes: "too many alerts, unclear ownership, slow acknowledgement" [^31^]; routing "by issue type, area, priority, shift" is the documented digital upgrade [^31^]. Operator-entered categorization is often wrong or skipped under time pressure ("Weak Data Capture and Inconsistent Classification" [^32^]).

**Primitive design.**
- *State:* operator's spoken/typed description, station/line ID, current product, machine status bits, recent station events (fault codes, vision rejects), shift roster/responder map.
- *Choice:* call type {quality / maintenance / safety / material / setup / other} with probabilities.
- *Score:* severity rubric (aligned to the escalation matrix SLA tiers [^29^]).
- *Noul:* "Does this describe a stop-the-line condition?" (line-stop recommendation to the team leader — decision stays human per andon philosophy).
- *Choice:* first-responder assignment given type+area+shift.

**Why sub-100ms + near-zero cost matters.** Andon value is measured in response minutes; classification must be instantaneous at the pull, and cheap enough to deploy at every station on every line. Human-supervisory timescale.

**Evidence.** [^29^] tiered andon escalation model (verbatim); [^30^] call-type taxonomy & SLA defaults; [^31^] digital vs. traditional andon routing; [^32^] classification failure mode.
**Confidence: High.**

---

### Usage 13 — Changeover & line-clearance verification (parallel checklist Nouls)
**One-liner:** Jev verifies changeover/line-clearance evidence item-by-item — "is previous-batch material removed?" "is the correct die installed?" — as parallel Nouls over workstation state, flagging gaps before first article.

**Current practice & bottleneck.** Pharma line clearance under 21 CFR 211.130/211.188 "requires documented verification that equipment and areas are free from all previous-batch materials before starting a new batch," with "independent dual verification" mandatory; "automated vision systems and electronic checklists augment but do not replace the human physical inspection" [^33^]. SMED/poka-yoke practice uses RFID/sensor checks that "block machine start-up if components are misaligned" [^34^]. Bottleneck: checklist items are judgment-heavy ("no foreign object from the earlier batch is present" [^48^]) and rushed under schedule pressure; errors are "critical audit observations" [^48^].

**Primitive design.**
- *State:* clearance checklist items, workstation sensor/RFID reads, vision snapshots reduced to structured observations (objects detected on line), batch records (previous vs. next product), equipment status labels.
- *Noul (parallel, per checklist item):* "Is item <i> verifiably satisfied by the evidence?" (probability + confidence).
- *Noul:* "Is any evidence item contradictory (e.g., wrong label reel detected)?"
- *Choice:* overall verdict {clear / clear-with-exception-note / not-clear → human re-inspection}.
- Composition: Jev *pre-screens*; human dual-verification and QA sign-off remain the credited control [^33^] — Jev reduces misses and focuses human attention on flagged items.

**Why sub-100ms + near-zero cost matters.** Changeovers are downtime; verification runs on the line-rate clock of the restart decision. Dozens of items × every changeover × every line demands per-call costs of fractions of a cent. Supervisory timescale with direct OEE impact.

**Evidence.** [^33^] line-clearance regulatory practice (verbatim); [^48^] checklist contents & common errors; [^34^] poka-yoke changeover devices.
**Confidence: Medium-High.**

---

### Usage 14 — Safety-interlock advisory ("pre-trip" awareness) layer — explicitly non-SIL
**One-liner:** A read-only advisory service that watches process state and answers "are conditions converging toward interlock trip <T>?" and "would the proposed operator action violate interlock intent <I>?" — early warning only, never actuation.

**Current practice & bottleneck.** Interlocks and SIFs are engineered, SIL-rated, and deliberately simple; they act at the limit with no anticipation. Operators discover trip proximity from alarms (which EEMUA/ISA-18.2 constrain as risk-reduction claims [^3^]) or not at all. ASM research demonstrates model-based "constraint margins with signed time-to-limit" computed before model calls, with all proposals gated by a validator [^13^] — the right architecture: semantic judgment *advises*, deterministic logic *gates*.

**Primitive design.**
- *State:* constraint margins & time-to-limit per interlock (computed deterministically upstream, as in [^13^]), trend slopes, interlock intent descriptions from the C&E matrix, proposed operator action (when applicable).
- *Noul:* "Given current trajectory, is trip <T> likely within <horizon>?" (advisory early warning distinct from the alarm itself).
- *Noul:* "Does proposed action <a> conflict with the documented intent of interlock <I>?" (advisory block recommendation).
- *Score:* proximity rubric {comfortable / elevated / imminent} per interlock.
- **Hard constraint:** outputs drive displays/notifications only; no write path to BPCS/SIS actuation; documented as Non-SIF [^51^]; no risk-reduction credit claimed in LOPA.

**Why sub-100ms + near-zero cost matters.** Advisory evaluation must run continuously (every scan-to-seconds) across hundreds of interlocks; only near-zero per-call cost permits that coverage. Latency is supervisory (seconds); determinism requirements keep Jev out of the SIF by design.

**Evidence.** [^13^] validator-gated ASM architecture (verbatim); [^3^] EEMUA 191 on alarm-response PFD claims; [^51^] IEC 61511 SIF/Non-SIF register practice; [^52^] C&E matrices as interlock-intent documentation.
**Confidence: Medium** (conceptually sound and architecture-precedented; requires rigorous site-level governance to keep the advisory boundary clean).

---

### Usage 15 — HMI/SCADA intent routing for natural-language operator queries
**One-liner:** Jev classifies operator natural-language requests into HMI actions — show trend, highlight alarm, navigate to unit, compare periods — replacing brittle keyword intent classifiers.

**Current practice & bottleneck.** SCADA-NLI classifies "the intent of natural language instruction" with keyword methods (KWECS + TF-IDF) [^25^]; LLM-based SCADA prototypes similarly must first identify "user intent (generating trend chart, highlighting alarms) and extract key entities" before any execution [^53^]. ISA-101 emphasizes minimum-keystroke navigation and task-oriented displays [^54^]; NL interfaces are an emerging complement, but intent classification with keyword methods is fragile.

**Primitive design.**
- *State:* operator utterance, current display context, available HMI action vocabulary (navigate/trend/alarm-filter/ack-assist/compare), recent interaction history.
- *Choice:* intent class from the HMI action vocabulary (probabilities).
- *Choice:* target entity resolution among candidate tags/units (probabilities).
- *Noul:* "Is the requested action read-only (display) vs. control-affecting?" — control-affecting intents are refused or routed to confirmation workflows.
- *Score:* ambiguity rubric → trigger a clarification prompt when low (KnowNo-style ask-for-help [^22^]).

**Why sub-100ms + near-zero cost matters.** Conversational interaction demands <100ms-class routing to feel native at the console; always-listening availability across every console demands near-zero marginal cost. Human-interface timescale.

**Evidence.** [^25^] SCADA-NLI intent classification; [^53^] LLM-SCADA intent extraction (patent); [^54^] ISA-101 navigation principles; [^22^] ambiguity→ask-for-help pattern.
**Confidence: Medium-High.**

---

## Cross-cutting observations

1. **The binary-question decomposition is already the winning pattern in robotics.** DoReMi's finding that constraining a VLM to "pick binary answers" yields "more precise feedback" at <0.1 s/query [^15^] is direct empirical support for Jev's Noul primitive; Jev's contribution is doing it without a multimodal LLM in the loop when the state is already structured.
2. **Standards create ready-made question banks.** ISA-18.2 (alarm definition, priority rules, state-based alarming [^1^][^2^]), EEMUA 191 (alert/inform/guide, defined-response, priority matrix [^3^][^4^]), ISA-88/106 (state models [^41^]), IEC 61511 (SIF/Non-SIF boundary [^51^]), and 21 CFR 211.130 (line clearance [^33^]) encode exactly the atomic, rubric-ordered judgments Score/Noul/Choice express. Jev's state can embed the standard's clause text; questions are near-verbatim restatements.
3. **Latency tiering.** None of these usages require servo-loop rates. Required rates cluster in three tiers: (i) control-adjacent robot execution monitoring at 1–10 Hz [^15^] — sub-100ms is necessary and sufficient; (ii) event-driven supervisory triage at 0.1–1 Hz (alarms, FDD, andon, vision rejects); (iii) batch/interactive engineering workflows (rationalization, CLPM review). Cost, not latency, is the binding constraint in tiers (ii)–(iii) — and $0.04/Mtoken is what makes continuous, fleet-wide judgment economically trivial vs. generative-model calls.
4. **Composability mirrors existing architectures.** The documented ASM architecture — derived-quantity computation upstream, model judgment in the middle, programmatic validation downstream [^13^] — is the template reused in Usages 4, 5, 9, and 14. Jev never replaces deterministic gating, interlocks, or validators.
5. **Calibration is a feature, not a luxury.** KnowNo's conformal wrapper needs calibrated per-option probabilities [^22^]; Jev's per-option probabilities + confidence outputs are designed inputs for such wrappers, enabling statistically governed ask-for-help behavior in robotics (Usages 8 and 15) and operator support (Usage 4).
6. **Two adjacent usages held in reserve.** (a) *Digital-twin state interpretation* — adjudicating twin-vs-physical divergence (model gap vs. genuine degradation) and labeling the twin's semantic operating state; DT monitoring already uses hierarchical state machines plus stream anomaly detection [^55^], and the phase-labeling lesson ("without this step, the anomaly detection system failed to detect warning and critical situations" [^9^]) shows the semantic-context gap; twins today "alert operators that bearing wear may be accelerating" without divergence attribution [^56^]. (b) *OT/ICS security-alert triage* — advisory severity scoring and disposition of OT monitoring alerts; SOC triage is "the process of determining the validity and severity of security alerts," with "51% of SOC teams feel overwhelmed by alert volume" and >25% of analyst time on false positives [^24^], and in OT automated *actions* are deliberately avoided ("avoid automated actions damaging core services"), leaving an advisory-triage opening [^47^]. Both are Strong-Medium confidence extensions of the patterns above.

---

## References

[^1^]: ANSI/ISA-18.2-2016, *Management of Alarm Systems for the Process Industries*, §5.3.2.7, §3.1.84 (excerpted copy). https://18817087.s21.faiusr.com/61/ABUIABA9GAAgyZfj5AUozIu7wwI.pdf
[^2^]: Siemens White Paper, *Setting a New Standard in Alarm Management* (ISA-18.2 state-based alarming). https://support.industry.siemens.com/cs/attachments/109772836/WP_Alarm_Management_ISA_18.pdf
[^3^]: UK HSE, *Inspection of Loss of Containment* (quoting EEMUA 191 alarm-rate and flood benchmarks). https://www.hse.gov.uk/Offshore/assets/docs/inspection-of-loss-of-containment.pdf
[^4^]: ABB, *Alarm Management* training deck (EEMUA 191 principles and priority matrix). https://library.e.abb.com/public/e4a262c61f41c57285257c1300552864/9AKK105713A9841_B_Session_2_Alarm%20Management.pdf
[^5^]: Wang et al., "Chemical Process Alarm Root Cause Diagnosis Method Based on the Combination of Data-Knowledge-Driven Method and Time Retrospective Reasoning," *Processes* 2022. https://pmc.ncbi.nlm.nih.gov/articles/PMC9219089/
[^6^]: Cai et al., "Intelligent Alarm Analysis for Fault Diagnosis and Management in Nuclear Power Plants," *Energies* 18(7):1730, 2025. https://www.mdpi.com/1996-1073/18/7/1730
[^7^]: S. N. (Univ. of Alberta) dissertation, *Towards Intelligent Industrial Alarm Management: Real-Time Monitoring and Decision Support*. https://ualberta.scholaris.ca/items/3733aab5-464d-473b-b027-ae0d4f818ddc
[^8^]: Venkatasubramanian et al., "A review of process fault detection and diagnosis: Part I," *Computers & Chemical Engineering* 27(3), 2003. https://www.researchgate.net/publication/260663596
[^9^]: "Fault Detection and Diagnosis in Industry 4.0: A Systematic Literature Review," 2024. https://pmc.ncbi.nlm.nih.gov/articles/PMC11723332/
[^10^]: OptiControls, *Control Loop Performance Monitoring in a Power Plant*. https://www.opticontrols.com/files/documents/clpm_in_power.pdf
[^11^]: M. F. Aftab, PhD thesis, *Controller Performance Monitoring: Detection and Diagnosis of Oscillations in Control Loops*, NTNU. https://ntnuopen.ntnu.no/ntnu-xmlui/bitstream/handle/11250/2563654/
[^12^]: Park & Kim, "Design of Operation Support System under the Abnormal Situation in NPPs (AIDAA)," NPIC&HMIT 2023. https://pure.kaist.ac.kr/en/publications/design-of-operation-support-system-under-the-abnormal-situation-i/
[^13^]: "Large reasoning models for abnormal situation management in safety-critical industrial processes," arXiv 2026. https://arxiv.org/html/2608.19819v1
[^14^]: "Abnormal Situation Management in Chemical Processes," *Processes* 11(6):1608, 2023. https://www.mdpi.com/2227-9717/11/6/1608
[^15^]: Guo et al., "DoReMi: Grounding Language Model by Detecting and Recovering from Plan-Execution Misalignment," IROS 2024. https://arxiv.org/abs/2307.00329
[^16^]: Ahmad et al., "A Unified Framework for Real-Time Failure Handling in Robotics Using Vision-Language Models, Reactive Planner and Behavior Trees," CASE 2025. https://arxiv.org/html/2503.15202v2
[^17^]: "REMAC: Self-Reflective and Self-Evolving Multi-Agent Collaboration for Long-Horizon Robot Manipulation," arXiv 2025. https://arxiv.org/pdf/2503.22122
[^18^]: "Predictive vision-language monitoring for proactive safety in robot task execution," *Frontiers in Robotics and AI*, 2026. https://www.frontiersin.org/journals/robotics-and-ai/articles/10.3389/frobt.2026.1870024/full
[^19^]: "A Neuro-Symbolic Framework for Failure Detection and Recovery (Recover)," arXiv 2404.00756, 2024. https://arxiv.org/html/2404.00756v1
[^20^]: UPC thesis, *An LLM-Based Approach for Failure Detection and Recovery in Robotics*. https://upcommons.upc.edu/bitstreams/338e7605-d094-4237-af5f-99210b636494/download
[^21^]: Ahn et al. (Google), "Do As I Can, Not As I Say: Grounding Language in Robotic Affordances (SayCan)," arXiv 2204.01691. https://arxiv.org/pdf/2204.01691v2
[^22^]: Ren et al., "Robots That Ask For Help: Uncertainty Alignment for Large Language Model Planners (KnowNo)," CoRL 2023. https://arxiv.org/abs/2307.01928
[^23^]: "Corki: Enabling Real-time Embodied AI Robots via Algorithm-Architecture Co-Design," arXiv 2407.04292. https://arxiv.org/html/2407.04292v3
[^24^]: "Alert Fatigue in Security Operations Centres: Research Challenges and Opportunities," *ACM Computing Surveys*, 2025. https://dl.acm.org/doi/10.1145/3723158
[^25^]: "SCADA-NLI: A Natural Language Query and Control Interface for Distributed Systems." https://www.researchgate.net/publication/351860514
[^26^]: UnitX Labs, "False Acceptance & False Rejection in AI Inspection Explained." https://www.unitxlabs.com/blog/what-is-false-acceptance-fa-and-false-rejection-fr-in-ai-inspection/
[^27^]: Mitsubishi Electric / RealPars, "How to Use AI in Industrial Automation: Machine Vision" (reject double-check workflow). https://www.youtube.com/watch?v=NGPwaExODXQ
[^28^]: CruxDigits, "Computer Vision Quality Inspection in Manufacturing" (threshold calibration). https://cruxdigits.nl/blog/computer-vision-quality-inspection-in-manufacturing/
[^29^]: iFactory, "AI Quality Alert & Andon Escalation Software" (tiered escalation model). https://ifactoryapp.com/quality-control-management/quality-alert-andon-escalation-software
[^30^]: iFactory, "Andon Escalation Matrix Template for Manufacturing Lines." https://ifactoryapp.com/analytics-reporting/andon-escalation-matrix-template
[^31^]: Signalo, "What Is an Andon System?" https://signalo.us/what-is-an-andon-system/
[^32^]: Connect981, "Andon System Manufacturing: Digital Escalation Workflows." https://connect981.com/blog-posts/andon-system-manufacturing-digital-escalation-workflows
[^33^]: Assyro, "Line Clearance Procedure in Pharma: SOP Guide" (21 CFR 211.130/211.188, dual verification). https://www.assyro.com/blog/line-clearance-procedure-pharma-guide
[^34^]: Kaizen Institute, "Reduce Changeover Time and Boost Efficiency" (poka-yoke changeover devices). https://kaizen.com/insights/smed-reduce-changeover-boost-efficiency/
[^35^]: Proconex, "Alarm Rationalization for Industrial Facilities" (ISA-18.2 flood definition & <1% target). https://www.proconexdirect.com/blog/2026/alarm-rationalization-for-industrial-facilities-reducing-operator-overload-and-improving-safety/
[^36^]: iFactory, "Alarm Rationalization & HMI Upgrade for Operator Error Reduction." https://ifactoryapp.com/industries/oil-and-gas/alarm-rationalization-hmi-upgrade-operator-error-reduction
[^37^]: "Frequent Alarm Pattern Mining of Industrial Alarm Flood Sequences by an Improved PrefixSpan Algorithm," *Processes* 11(4):1169, 2023. https://www.mdpi.com/2227-9717/11/4/1169
[^38^]: Emerson Automation Experts, "Should My Dynamic Alarming Logic Suppress or Disable Alarms?" (ISA-18.2 alarm & suppression definitions). https://emersonexchange365.com/community-hubs/deltav-community-connect/b/delta-vweblog/posts/should-my-dynamic-alarming-logic-suppress-or-disable-alarms
[^39^]: iFactory, "Alarm Management in SCADA: ISA-18.2 Implementation Guide." https://ifactoryapp.com/blog/alarm-management-scada-isa-18-2
[^40^]: Emerson Automation Experts, "Best Practices with Alarm Management" (dynamic vs. static alarming). https://www.emersonautomationexperts.com/2025/industrial-software/best-practices-with-alarm-management/
[^41^]: ASP Wiki, "Batch Control with ISA-88 Standards" (equipment vs. procedural control; ISA-106 states). https://wiki.aspotomasyon.com/article/batch-control-isa-88-standards/
[^42^]: "Dynamic Feature Extraction-Based Quadratic Discriminant Analysis for Industrial Process Fault Classification and Diagnosis," *Sensors/PMC*, 2023. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10742569/
[^43^]: Srinivasan & Rengaswamy, "Control loop performance assessment. 1. A qualitative approach for stiction diagnosis," *Ind. Eng. Chem. Res.* 44, 2005 (excerpted via ResearchGate compilation). https://www.researchgate.net/publication/38442893
[^44^]: ReliaMag, "Avoiding Predictive Maintenance False Alarms." https://reliamag.com/cartoons/predictive-maintenance-false-alarms/
[^45^]: OxMaint, "Condition-Based Maintenance: Monitor First, Maintain When Needed." https://oxmaint.com/article/condition-based-maintenance-monitor-maintain-when-needed
[^46^]: F7i.ai, "Why Condition Monitoring Alerts Are Ignored: Root Causes." https://f7i.ai/blog/why-condition-monitoring-alerts-are-ignored-diagnosing-systemic-trust-failure
[^47^]: CyberSilo, "How Manufacturing SOC Teams Use AI Automation for OT Security." https://cybersilo.tech/how-manufacturing-soc-teams-use-ai-automation-for-ot-security
[^48^]: PharmaGMPGuide, "Line Clearance in Pharmaceuticals: Procedure and GMP Requirements." https://pharmagmpguide.com/line-clearance-in-pharmaceuticals-definition-procedure-checklist-gmp-requirements/
[^49^]: Chebotar et al., "Q-Transformer: Scalable Offline RL via Autoregressive Q-Functions" (SayCan affordance estimation). https://arxiv.org/html/2309.10150
[^50^]: "Semantic Skill Grounding for Embodied Instruction-Following in Cross-Domain Environments" (SayCan pipeline description). https://arxiv.org/pdf/2408.01024
[^51^]: 61508 Association, *Technical Guide: Requirements for the IEC 61511 SIS Design File* (SIF / Non-SIF / IPL registers). https://61508.org/wp-content/uploads/2023/10/T6A031_Technical_Guide_-_The_Requirements_for_the_IEC_61511_SIS_Design_File_V2_-_e092022.pdf
[^52^]: "Automating Cause-Effect Specification with Knowledge Graphs and Large Language Models," arXiv 2026. https://arxiv.org/abs/2606.31614
[^53^]: CN Patent CN120909581A, "SCADA system based on large language model" (intent identification). https://eureka.patsnap.com/patent/CN120909581A
[^54^]: PLCProgramming.io, "High Performance HMI (ISA-101): Principles and Design." https://plcprogramming.io/blog/high-performance-hmi-isa-101
[^55^]: "A Novel Method of Digital Twin-Based Manufacturing Process State Modeling and Incremental Anomaly Detection," *Machines* 11(2):151, 2023. https://www.mdpi.com/2075-1702/11/2/151
[^56^]: Tractian, "Digital Twin: Definition, Applications and Industrial Benefits." https://tractian.com/en/glossary/digital-twin
