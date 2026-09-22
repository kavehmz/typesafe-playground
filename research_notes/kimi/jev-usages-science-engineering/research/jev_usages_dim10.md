# Jev "System One" Typed-Judgment Model — Usage Catalog for the Chemical Process Industry

**Scope:** Operations, control, and optimization of chemical / petrochemical / pharmaceutical plants.
**Positioning:** Every usage below is an **advisory / supervisory semantic layer**. Jev sits *above* the DCS/APC/MES stack and *alongside* humans; it is **never inside a Safety Instrumented System (SIS)**. This mirrors how established decision-support practice is positioned relative to functional safety: "POST is conceived as a decision-support layer that operates above, and is consistent with, existing functional safety standards. IEC 61511 … governs the design, installation, and operation of Safety Instrumented Systems (SIS); POST does not modify SIS logic or safety integrity levels."[^23^]

**Technology recap (per brief):** Jev takes a JSON "state" + typed questions and returns structured judgments — **Choice** (option + probabilities + confidence), **Noul** (truth probability of a statement), **Score** (ordered rubric position + probabilities + confidence). Many questions per call, parallelized over the same state. Sub-100 ms latency (roadmap sub-10 ms), ~$0.04/Mtoken, 32K context. The design pattern throughout this catalog: statistical/first-principles layers (PCA, MPCA, reconciliation, optimizers) produce numeric signals; Jev answers the *atomic gut-check questions* those signals raise, in bulk, cheaply, and fast — the judgment work that today consumes scarce control engineers and operators.

**Why the economics matter at plant scale:** A single refinery/petrochemical complex has tens of thousands of historian tags, hundreds of PID loops, dozens of MPC controllers, hundreds of alarms/day/operator, and hundreds of batches/month. The Abnormal Situation Management (ASM) Consortium found that "Operators must interpret 2,000–5,000 data points under stress"[^22^] and that "the number of control loops that operators must manage has increased from two hundred to eight hundred per operator over the last twenty years."[^21^] Sub-100 ms latency means verdicts arrive inside a DCS scan/refresh cycle; ~$0.04/Mtoken means a whole-plant judgment sweep (thousands of questions/hour) costs single-digit dollars per day.

---

## 1. APC / MPC Controller Performance Monitoring Verdicts

**One-liner:** Convert numeric control-performance indices into triaged, actionable verdicts per controller per day.

**Current practice & bottleneck:** Control Performance Monitoring (CPM) computes statistical benchmarks — the Harris index (minimum-variance benchmark, Harris 1989[^3^]) and variants — across the loop base. Qin & Badgwell's canonical vendor survey documented 4,600+ industrial MPC applications by 2003, mostly refining (63%+)[^1^]; every one of them needs periodic performance review. The bottleneck is *interpretation and triage*: indices flag degradation but not its cause or the right response, so a small APC engineer team must eyeball dozens of controller scorecards and decide which ones justify (expensive) re-identification. "One of the challenges that still needs to be overcome in order to improve the performance of the MPC is its maintenance. Re-identification of the process is one of the best options … However, re-identification is costly."[^2^]

**Primitive design:**
- **State (per controller):** Harris index trend, oscillation metrics, CV/MV saturation fractions, model-residual statistics, recent process changes (crude switch, exchanger cleaning), uptime.
- **Noul:** "This controller's degradation is primarily model–plant mismatch rather than a disturbance/valve problem." (matches the unmeasured-disturbance-vs-mismatch diagnosis literature[^24^])
- **Choice:** {"monitor", "retune", "re-identify subset of sub-models", "take controller off-service"} with probabilities.
- **Score:** maintenance urgency on a 5-point rubric.
- Composition: run one multi-question call per controller per shift; roll up Choice verdicts into a weekly APC worklist.

**Why latency/cost matters:** A large site runs 50–200 MPC applications and 5,000–20,000 regulatory loops. Daily triage of every controller is infeasible for humans; at Jev cost/latency it is a nightly batch of a few thousand questions — pennies — with verdicts waiting in the morning report.

**Evidence:** Harris 1989 minimum-variance benchmark is "a milestone in the field of CPM"[^3^]; Badwe et al., "Detection of model-plant mismatch in MPC applications," *J. Process Control* 2009[^2^]; Qin & Badgwell industrial MPC survey, *Control Engineering Practice* 2003[^1^]; integrated FDD+MPC performance-assessment review[^24^]. **Confidence: High.**

---

## 2. MPC Constraint-Status & Advisory Semantic Interpretation (APC Advisory Layer)

**One-liner:** Translate the MPC's raw constraint/solution status each execution into an operator-meaningful judgment ("pushing the right limit", "economically wrong binding constraint", "QP infeasible risk").

**Current practice & bottleneck:** Industrial MPC continuously solves QPs with dozens of CV/MV limits; vendors document that operators watch controller "health" and constraint status but the meaning ("is being pinned at the reactor temperature limit good — we are maximizing severity — or bad — the limit is stale after the feed change?") depends on operating context and economics that the controller doesn't know. APC benefit decay is a documented industry pain: benefits erode as limits, models and operating modes drift, and sustaining them is a continuous engineering effort (vendor "evergreen model" subscription programs exist precisely because of this[^13^]).

**Primitive design:**
- **State:** binding constraints, QP status, shadow-price signs, current operating mode/grade, economic drivers (margins, energy prices), recent lab results.
- **Noul:** "The currently binding constraint set is consistent with the intended operating strategy for this mode."
- **Choice:** {"accept as-is", "raise with APC engineer", "operator action recommended: relax/limit X", "likely stale limit — flag for review"}.
- **Score:** confidence that the controller is pushing against the economically correct constraint (rubric: correct / benign / suspicious / wrong).

**Why latency/cost matters:** MPC executes every minute; advisory verdicts every execution cycle or every shift across all controllers are only viable with sub-second, sub-cent judgments. This is the classic "APC babysitting" workload that otherwise requires a control engineer physically watching trends.

**Evidence:** Qin & Badgwell survey of commercial MPC practice[^1^]; APC/RTO sustainment practice — KBC/Visual MESA "Sustainability Program which ensures that their model is 'evergreen' … available and running as a service 24x7x365 in order to provide the customer recommendations for the lowest cost utility operation that are trustworthy"[^13^]. **Confidence: Medium-High** (strong practice grounding; the specific semantic-verdict packaging is our design synthesis).

---

## 3. Fault Detection & Diagnosis (FDD) — Verdict & Routing Layer Above Statistical Methods

**One-liner:** A semantic jury above PCA/PLS/SPE-T² monitors: given the detection statistics and plant context, is this a real fault, which fault family, and who should be alerted first?

**Current practice & bottleneck:** Three decades of established FDD literature: Venkatasubramanian et al.'s three-part review (*Computers & Chemical Engineering*, 2003) taxonomizes quantitative model-based, qualitative, and process-history (PCA/PLS/neural) methods[^4^]; Qin's 2012 survey covers industrial data-driven monitoring[^5^]. The well-documented deployment gap is the last mile: multivariate charts detect, but "The observation and interpretation of the process state is often based on univariate statistics and it is up to the experience of the process operator to put the particular variables into relations and to make decisions about the process state."[^11^] False alarms and context-blind diagnosis keep FDD systems from being trusted; the 2025 *Processes* review is titled "Bridging the Gap in Chemical Process Monitoring: Beyond Algorithm-Centric Research Toward Industrial Deployment."[^25^]

**Primitive design:**
- **State:** T²/SPE excursions + contribution plots (top contributing tags), recent mode changes, maintenance events, lab results, correlated detector states.
- **Noul:** "This T² excursion reflects a genuine process fault, not a benign mode change / analyzer recalibration / known maintenance activity."
- **Choice (routing):** {"instrument/sensor fault", "process fault — reactor system", "process fault — separation train", "utility disturbance", "false positive — log only"}.
- **Score:** severity/urgency rubric for escalation.

**Why latency/cost matters:** Continuous plants run dozens of PCA/PLS monitoring models; each excursion spawns contribution-plot interpretation across tens of tags. Verdicts must be near-real-time (an FCC or compressor excursion develops in minutes) and cheap enough to re-evaluate every scan while the event evolves.

**Evidence:** Venkatasubramanian et al. Parts I–III (2003)[^4^]; Qin, "Survey on data-driven industrial process monitoring and diagnosis," *Annual Reviews in Control* 2012[^5^]; industrial-deployment-gap review[^25^]; operator-interpretation bottleneck quote from Kadlec et al.[^11^]. **Confidence: High.**

---

## 4. Batch Trajectory Verdict & Golden-Batch Comparison

**One-liner:** Per-batch, per-phase judgment: "Is this batch tracking the golden trajectory, and if it deviates, is it the kind of deviation that historically ends off-spec?"

**Current practice & bottleneck:** Multiway PCA/PLS (Nomikos & MacGregor, AIChE J. 1994; Technometrics 1995) is the established method: "Multivariate statistical procedures for monitoring the progress of batch processes are developed. The only information needed to exploit the procedures is a historical database of past successful batches."[^6^] MPCA/MPLS charts track new batches against the reference distribution, but end-of-batch disposition and mid-batch intervention calls remain human: someone must judge whether the current deviation pattern resembles past *bad* batches versus past *acceptable* ones — a semantic comparison against plant memory.

**Primitive design:**
- **State:** current phase, MPCA scores/SPE vs. control limits, top contribution tags, batch context (recipe version, raw-material lot, unit, crew), features of N nearest historical batches.
- **Noul:** "This batch is materially following the golden-batch trajectory for its current phase."
- **Choice:** {"continue", "monitor closely", "operator review now", "hold batch / escalate to QA"}.
- **Score:** predicted end-of-batch quality class (on-spec / borderline / likely deviation), with probabilities — feeding review-by-exception (Usage 14).

**Why latency/cost matters:** A pharma/specialty site runs hundreds of batches/month across many units; each batch needs a verdict every phase transition and on every SPE alarm. Cheap parallel questions over the same batch state make per-phase, per-unit coverage routine instead of sampling-based.

**Evidence:** Nomikos & MacGregor 1994[^6^], 1995[^7^]; Kourti, Nomikos & MacGregor multiblock/multiway PLS for batch FDD, *J. Process Control* 1995[^26^]; industrial application experience, Kourti et al. 1996[^27^]. **Confidence: High.**

---

## 5. Batch Phase-Transition Detection & S88 Procedural Support

**One-liner:** From process state, judge which S88 procedural element the batch is really in, whether transition conditions are genuinely met, and whether the operator's pending action matches the procedure.

**Current practice & bottleneck:** ANSI/ISA-88 (S88 / IEC 61512) defines the procedural model — procedure → unit procedure → operation → phase — with explicit transitions, e.g. "the condition *Approved by lab* has to be satisfied before the Prepare to Transfer step operation starts."[^19^] In practice, phases bound to PLC logic execute blindly on configured conditions; exceptions (manual holds, out-of-order execution, stale parameter sets, skipped prerequisites) are reviewed after the fact in the batch record. There is no cheap real-time semantic check that the *physical state* agrees with the *procedural state*.

**Primitive design:**
- **State:** S88 phase state machine status + key process values + recipe parameters + pending operator actions.
- **Noul:** "The physical process state is consistent with the procedural state the batch system reports."
- **Noul:** "All documented prerequisites for the pending phase transition are genuinely satisfied (not just formally checked)."
- **Choice:** {"proceed", "hold — prerequisite doubtful", "escalate — procedure/state mismatch"}.

**Why latency/cost matters:** Phase transitions happen in seconds-to-minutes across every running unit; only a sub-100 ms, per-transition-priced judgment can ride along with the sequence engine (advisory only; interlocks stay in the equipment modules per S88 practice).

**Evidence:** ISA-88 models and terminology[^19^][^20^]; S88 mode/state management and exception-rate KPIs (held/aborted/override exceptions per 100 phases)[^20^]. **Confidence: Medium-High.**

---

## 6. Operator Decision Support for Abnormal Situation Management (ASM)

**One-liner:** Situation-assessment judgments during upsets: classify the developing situation, rank candidate causes, and suggest the first correct response — the AEGIS idea, delivered as typed judgments.

**Current practice & bottleneck:** The ASM Consortium (Honeywell + major petrochemical companies, NIST-funded) built the research base, including the AEGIS "Abnormal Event Guidance Information System" concept integrating "State Estimators, Fault diagnostics, Sensor validation, Multivariate analysis, Simulation-based root cause tools."[^22^] The documented stakes: "abnormal situations caused a 3%-8% loss in productive capacity, and that 2%-6% of this could potentially be recovered"[^8^]; "The inability of the automated control system and plant operations personnel to control abnormal situations has an economic impact of at least $20 B annually in the petrochemical industry alone."[^8^] Root cause is human-factors: "Operators must interpret 2,000–5,000 data points under stress"[^22^]; 42% of abnormal situations trace to people and work-context factors[^9^]. Legacy expert systems (G2/Gensym-era) proved value but were brittle and expensive to maintain[^21^].

**Primitive design:**
- **State:** curated snapshot — active alarms (post-flood filtering), key deviation tags, equipment status, recent operator actions, unit mode.
- **Choice:** situation class {"feed/utility disturbance", "equipment degradation", "instrumentation fault", "exotherm/runaway precursors", "normal transient (startup/grade change)"} with probabilities.
- **Noul:** "The situation is developing toward a trip/shutdown within the operator's response window."
- **Choice:** first-response recommendation ranked from the unit's own procedures; each recommendation is advisory text a human confirms.
- **Score:** situation severity (ASM-style: normal / abnormal / emergency).

**Why latency/cost matters:** Upsets evolve in minutes; the advisory must re-judge the state every few seconds during an event, and simultaneously across every console on site. Cost matters because the system must run *always-on, plant-wide, forever* — not just during incidents.

**Evidence:** ASM Consortium 20-year retrospective[^8^]; ASM AEGIS description[^22^]; TAMU Mary Kay O'Connor Center ASM paper ($20B/yr estimate)[^9a^]; alarm-flood human-performance study (Bullemer et al.)[^9b^]. **Confidence: High** (decades of consortium grounding; Jev is the modern cheap vehicle for the same advisory function).

---

## 7. Alarm Rationalization Assistance (ISA-18.2 / IEC 62682)

**One-liner:** Draft rationalization judgments per alarm — consequence if ignored, correct priority, duplicate/root-cause redundancy — to compress the workshop bottleneck.

**Current practice & bottleneck:** ANSI/ISA-18.2 requires rationalizing every alarm against the alarm philosophy; "Typical workshops process 30-50 alarms per day"[^10^] and "For a typical mid-size process facility with 2,000-5,000 alarms, full rationalization runs several weeks to several months of workshop time."[^10^] Each alarm requires answering: consequence of no response, time available, whether it's the best indicator of the root cause, and priority (<5% should be top priority)[^10^]. This is precisely thousands of atomic judgment calls — the reason "so many plants start the effort and never finish it."[^12^]

**Primitive design:**
- **State (per alarm):** tag description, P&ID context excerpt, alarm text, setpoint vs. operating envelope, historical activation statistics (rate, chattering, flood participation, operator response times), linked SIF/LOPA data if any.
- **Noul:** "If the operator takes no action, there is a documented, significant consequence." (ISA-18.2's qualifying question)
- **Choice:** proposed priority {emergency/high/medium/low/journal-only} per the site priority matrix.
- **Noul:** "Another existing alarm already annunciates the same root cause." (duplicate detection)
- **Score:** expected operator-actionability.
- Composition: Jev drafts the full master-alarm-database row; the cross-functional workshop reviews exceptions only.

**Why latency/cost matters:** Latency is secondary here, cost is decisive: 5,000 alarms × ~10 questions = 50,000 judgments ≈ a few dollars, versus months of senior-engineer workshop time. Re-runs after every MOC become trivial.

**Evidence:** ISA-18.2 lifecycle & workshop rates[^10^]; rationalization eliminates "30 to 60 percent" of configured alarms and "<5% Priority 1" guidance[^10^]; AI-assisted rationalization practice emerging commercially[^12^]. **Confidence: High.**

---

## 8. Soft-Sensor Plausibility & Health Checks

**One-liner:** Before a soft sensor's prediction is used for control or quality decisions, Jev judges whether the prediction is currently trustworthy.

**Current practice & bottleneck:** Soft sensors (inferentials) are established for predicting lab-rate qualities online[^11^]. Their Achilles heel is maintenance and trust: "Currently most of the Soft Sensors do not provide any automated mechanisms for their maintenance … there is often no objective measure for assessing the Soft Sensor quality level and the judgement if a model works well or not is dependent on the model operator subjective perception based on visual interpretation of the deviation."[^11^] Data pathologies — missing values, outliers, drifting data, co-linearity, multi-rate sampling — are documented as the core difficulty[^11^].

**Primitive design:**
- **State:** soft-sensor prediction, input-tag health flags, recent lab-vs-prediction errors, operating-region novelty metrics, last recalibration/retrain date.
- **Noul:** "The current prediction is inside the model's validated operating envelope."
- **Noul:** "Input data quality right now is sufficient for this prediction to be used."
- **Choice:** {"trust prediction", "trust with caution — flag", "fall back to lab schedule", "trigger model maintenance/retrain"}.
- **Score:** prediction-confidence rubric for display next to the value on the HMI.

**Why latency/cost matters:** A site runs tens to hundreds of inferentials, each scanned every control cycle (seconds–minutes). Health verdicts must be effectively free and continuous so that *every* displayed inferential carries a live trust flag — this is the difference between operators trusting or ignoring the whole soft-sensor fleet.

**Evidence:** Kadlec, Gabrys & Strandt, "Data-driven Soft Sensors in the Process Industry," *Computers & Chemical Engineering* 2009 (verbatim maintenance-trust gap above)[^11^]. **Confidence: High.**

---

## 9. Process Data Reconciliation — Gross-Error Anomaly Triage

**One-liner:** Triage reconciliation residuals: which gross errors are real instrument faults, which are legitimate process events (leaks, rerouting, tank moves), and which should be excluded before reconciliation re-runs.

**Current practice & bottleneck:** Data reconciliation + gross-error detection is a mature field (Narasimhan & Jordache, *Data Reconciliation and Gross Error Detection: An Intelligent Use of Process Data*, 2000)[^14^], with commercial packages and standard statistical tests (measurement test, nodal tests, serial elimination)[^14^]. The persistent pain: statistical tests flag *suspects*, but humans must adjudicate them daily — is the imbalance a leaking valve, a slipped tank line-up, a failed flowmeter, or bad data around a known transient? RTO practice explicitly depends on getting this right: "Data reconciliation adjusts measurements to satisfy mass and energy balances, while gross error detection flags instruments whose readings are unreliable before they corrupt the optimization."[^15^]

**Primitive design:**
- **State:** reconciliation residuals per node/measurement, recent line-up and LIMS changes, maintenance records, analyzer status, event logs.
- **Choice:** gross-error attribution {"flowmeter bias", "analyzer fault", "leak/loss", "line-up/operational cause", "model topology error", "spurious — transient artifact"}.
- **Noul:** "This measurement should be excluded from the next reconciliation run."
- **Score:** instrumentation-work-order priority.

**Why latency/cost matters:** Reconciliation runs plant-wide, daily (yield accounting) to hourly (RTO support), over thousands of measurements. Every run produces a suspect list; adjudicating each suspect at $0.04/Mtoken beats an engineer-hour per anomaly by orders of magnitude.

**Evidence:** Narasimhan & Jordache 2000[^14^]; gross-error test literature lineage (Mah, Tamhane, Tong & Crowe)[^14a^]; RTO dependency on validated data[^15^]. **Confidence: High.**

---

## 10. Energy & Utility System Optimization Advisory (Steam/Power Balance)

**One-liner:** Turn the utility optimizer's LP/SQP recommendations into judged, context-aware operator advice: which moves to make now, which to defer, which look wrong given current constraints.

**Current practice & bottleneck:** On-line energy management systems are established practice: Visual MESA (Soteica, now Yokogawa/KBC) monitors and optimizes steam/fuel/power site-wide, with "overall benefit in the range of 2% to 5% of the total energy cost … Expected project payback is always less than one year"[^16^], deployed at 100+ industrial sites including Repsol Tarragona, Petronor, TOTAL Feyzin, ENAP Aconcagua[^16^][^17^]. The documented bottleneck is *recommendation adoption*: optimizers run open-loop, and operators cherry-pick advice under time pressure because the optimizer doesn't know the operational context (a boiler is fouled, a turbine is derated pending maintenance, a contract gas limit is active today).

**Primitive design:**
- **State:** optimizer recommendation set, current utility header balances, equipment availability/derates, fuel-gas imbalance, electricity contract position, emissions margins.
- **Noul:** "This recommendation is operable right now given current equipment status."
- **Choice:** {"implement now", "queue for next shift", "reject — optimizer missing constraint X", "escalate — recommendation looks inconsistent"}.
- **Score:** estimated savings capture confidence.

**Why latency/cost matters:** Utility prices and imbalances move continuously; the advisory layer must re-judge recommendations every optimization cycle (minutes) across a site-wide system with dozens of degrees of freedom — continuous, cheap, fast judgment is the adoption-enabling layer between optimizer and board operator.

**Evidence:** Yokogawa/Visual MESA documented deployments & 2–5% benefit range[^16^]; ENAP Aconcagua case (PTQ/DigitalRefining)[^17^]; Soteica/KBC open-vs-closed-loop practice[^16a^]. **Confidence: Medium-High.**

---

## 11. Catalyst & Equipment Health Triage

**One-liner:** Periodic gut-check on catalyst and major-equipment health indicators: normal aging vs. accelerated deactivation vs. instrumentation artifact — and the right response window.

**Current practice & bottleneck:** Catalyst state is tracked indirectly and expensively: FCC catalyst deactivation (hydrothermal degradation, metals, coke — 80% of surface-area loss in first 24h in documented Shell tagged-catalyst experiments[^18^]), hydrocracker bed ΔT monitoring where escalation from first deviation to catastrophe can take minutes (Tosco incident; bed ΔT thresholds of 5–60°F staging operator actions)[^18a^]. Today these indicators are watched by specialists in weekly reviews; early deviations hide in trend noise until they become rate/yield losses or emergencies.

**Primitive design:**
- **State:** activity proxies (E-cat MAT results, bed ΔT profile, WABT trend, H₂ consumption, yields), regeneration conditions, metals on catalyst, feed quality changes, recent upsets.
- **Noul:** "Observed deactivation rate exceeds normal aging for this catalyst/feed combination."
- **Choice:** {"normal aging — continue", "accelerated deactivation — investigate metals/regenerator", "instrumentation artifact — verify thermocouples", "approaching end-of-run — plan catalyst change", "thermal excursion risk — immediate operator review"}.
- **Score:** remaining-run-length confidence band for planning.

**Why latency/cost matters:** Triage questions are cheap and recur daily across every reactor system on site; catching accelerated deactivation a week earlier or avoiding one unnecessary catalyst change is worth orders of magnitude more than the compute. Latency matters for the ΔT-excursion branch (minutes-scale).

**Evidence:** FCC catalyst deactivation mechanisms (DigitalRefining/PTQ)[^18^]; FCC zeolite catalysis review (PMC)[^18b^]; hydrocracker ΔT staging practice[^18a^]. **Confidence: Medium** (indicators well-grounded; Jev packaging is our synthesis).

---

## 12. Production Scheduling & Grade-Transition Advisory

**One-liner:** Human-in-the-loop judgments around the scheduler: is a proposed grade transition or rush-order insertion actually advisable given current plant state, inventories, and equipment condition?

**Current practice & bottleneck:** Refinery/petrochemical short-term scheduling is an established MILP domain (crude unloading → tank farm → CDU charging with flow, residence-time, and dewatering constraints)[^28^]. Solvers produce schedules, but *event-driven re-judgments* — a rush order arrives, a unit trips, a crude cargo is late — bounce back to planners who re-run or hand-patch. The semantic questions ("is this transition sequence acceptable given the crude in tank 12?", "does inserting this order blow the dewatering residence time anywhere?") recur many times a day.

**Primitive design:**
- **State:** current schedule, tank inventory/quality positions, unit status/health verdicts (from Usages 1–3, 11), pending order book, constraint violations flagged by the scheduler.
- **Choice:** {"accept proposed schedule change", "accept with modification — flag conflict", "reject — violates constraint X"}.
- **Noul:** "This grade transition can start now without quality-giveaway or flaring risk."
- **Score:** schedule-robustness rubric (how fragile is the plan to a 6h unit outage?).

**Why latency/cost matters:** Every ad-hoc question to the scheduler currently costs planner time and often a full re-solve; a judgment layer answers the 80% routine questions in milliseconds at negligible cost, leaving true re-optimization for genuine disruptions.

**Evidence:** Crude-oil short-term scheduling MILP literature (state-task network, continuous-time formulations)[^28^]; refinery scheduling-with-MPC disturbance-response practice[^28^]. **Confidence: Medium.**

---

## 13. Shift-Handover Log Classification & Prioritization

**One-liner:** Turn raw shift-log entries into classified, severity-scored, deduplicated handover packages so the incoming crew sees the five things that matter, not fifty chronological notes.

**Current practice & bottleneck:** Poor handover is a documented incident precursor in the process industries; the UK HSE commissioned a foundational literature review (Lardner, "Effective Shift Handover," OTO 96 003, 1996)[^29^] identifying communication failures at shift change as a recurring causal factor, with IChemE symposium work on "Safe communication at shift handover: setting and implementing standards"[^29^]. Modern electronic logbooks capture entries but don't judge them: critical equipment degradations and informal workarounds are buried in free text.

**Primitive design:**
- **State:** shift log entries + alarm/event history + standing instructions + work permits open.
- **Choice (per entry):** class {"safety-relevant", "equipment health", "production/quality", "housekeeping", "informational"}.
- **Score:** must-know severity for the incoming operator (rubric).
- **Noul:** "This entry describes an abnormal condition that is still active/unresolved."
- Composition: the top-Score items form the handover brief; cross-checked against live plant state (Usage 6 state builder).

**Why latency/cost matters:** Every console, every shift, every day, across a multi-unit site; classification must be instant (logs are written up to handover time) and cheap enough to run on every entry, not a sample.

**Evidence:** HSE/Keil Centre shift-handover literature review[^29^]; ASM human-factors context (42% people/work-context contribution to abnormal situations)[^9^]. **Confidence: Medium-High.**

---

## 14. MES/EBR Data-Quality Verdicts & Review-by-Exception Support (Pharma)

**One-liner:** Pre-judge electronic batch record exceptions and data-integrity flags so QA reviewers focus on true anomalies — industrializing "review by exception."

**Current practice & bottleneck:** MES/EBR practice in GMP manufacturing already targets review-by-exception: "Review-by-exception: system flags deviations, QA focuses on exceptions," with ALCOA+ data-integrity expectations under 21 CFR Part 11 / EU Annex 11[^30^]. Documented gains include "40–60% improvement in batch record review efficiency … through automated data compilation and exception-based review" and "20–30% decrease in the time scales of releasing batches"[^31^]. The bottleneck: exception flagging is rule-based and over-fires; QA still triages hundreds of flagged-but-benign exceptions per batch (missing signatures, timestamp quirks, transcription artifacts)[^32^].

**Primitive design:**
- **State:** exception record (type, step, values, timestamps), batch context, operator history, equipment state at the time, historian cross-checks.
- **Noul:** "This flagged exception reflects a real process/documentation problem rather than a benign system artifact."
- **Choice:** disposition suggestion {"close as benign artifact", "minor deviation — document", "investigate — potential GMP deviation", "data-integrity concern — escalate"}.
- **Score:** review-priority ordering for the QA queue.

**Why latency/cost matters:** Batch release is on the critical path to revenue; a site reviews dozens of batches in parallel, each with tens-to-hundreds of exceptions. Cheap parallel judgments shrink QA triage from days to hours; latency keeps verdicts synchronous with the review UI.

**Evidence:** MES/EBR review-by-exception practice and quantified benefits[^30^][^31^]; batch-record data-integrity failure taxonomy[^32^]; PAS-X GMP/ALCOA+ implementation study[^31a^]. **Confidence: Medium-High.**

---

## 15. Permit-to-Work Semantic Checks (Control of Work)

**One-liner:** Advisory cross-checks on permits: conflicting SIMOPs, isolation-consistency doubts, and permit-condition vs. live-plant-state mismatches surfaced to the issuer before signature.

**Current practice & bottleneck:** ePTW systems digitize the control-of-work lifecycle and are documented to catch structural conflicts: "System blocks approval if conflicting permits exist, required isolations are incomplete, or safety conditions are unmet"[^33^], and "This live tracking helps avoid conflicting permits, such as hot work and flammable material handling in the same area."[^34^] But rule-based checks only catch configured conflicts; semantic mismatches (permit text says "line drained and flushed," but historian shows the drain valve cycled 2 minutes ago; gas-test validity window vs. actual entry time; a nearby unit in an abnormal state from Usage 6) need judgment.

**Primitive design:**
- **State:** permit content (type, location, isolations, gas tests, validity), all active permits in the area, live plant state/alarm posture, isolation point statuses.
- **Noul:** "The declared isolations are consistent with the current state of the tagged equipment."
- **Noul:** "No active SIMOP conflict exists between this permit and other live work in the area."
- **Choice:** {"issue", "issue with added precaution", "hold for field verification", "reject — conflict"}.
- **Score:** residual-risk rubric for the area authority.

**Why latency/cost matters:** A large site issues hundreds of permits/day across shifts and contractors; every issuance gets every check, instantly. Advisory only — the human issuer signs; nothing here touches SIS or interlocks.

**Evidence:** ePTW documented practice and SIMOP/conflict-checking capability[^33^][^34^]; PTW weaknesses in chemical plants (IChemE Symp. survey cited in HSE handover review)[^29^]. **Confidence: Medium** (ePTW practice established; the semantic cross-check layer is our synthesis).

---

## Cross-Cutting Observations

1. **Common architecture:** numeric layer (PCA/MPCA, reconciliation, optimizers, rule engines) → Jev semantic verdict layer (Choice/Noul/Score) → human decision. Every usage preserves the existing safety/validation posture; Jev never writes to control outputs.
2. **Composability:** verdicts from Usages 1–3, 8, 11 feed the state of Usages 6, 12, 15 — the "decompose and compose in code" pattern.
3. **Economics:** at ~$0.04/Mtoken, a site-wide deployment running ~100k typed judgments/day costs on the order of a few dollars/day — trivially justified against ASM-documented abnormal-situation losses of 3–8% of capacity[^8^].
4. **Explicit exclusion:** none of these usages belongs in an IEC 61511 SIS; advisory positioning follows the same reasoning as published decision-support architectures: "POST does not modify SIS logic or safety integrity levels."[^23^]

---

## References

[^1^]: Qin, S.J.; Badgwell, T.A. "A survey of industrial model predictive control technology." *Control Engineering Practice* 11(7):733–764, 2003. https://www.semanticscholar.org/paper/0fc6c9dcd7a850e7a0d3796d32e6771353154fd9
[^2^]: Badwe, A.S.; Gudi, R.D.; Patwardhan, R.S.; Shah, S.L.; Patwardhan, S.C. "Detection of model-plant mismatch in MPC applications." *J. Process Control* 19(8):1305–1313, 2009. Via https://arxiv.org/html/2502.00976v1 (ref. [11])
[^3^]: Harris, T.J. "Assessment of closed loop performance." *Can. J. Chem. Eng.* 67:856–861, 1989; surveyed in "From Static and Dynamic Perspectives: A Survey on Historical Data Benchmarks of Control Performance Monitoring," *IEEE/CAA J. Automatica Sinica*, 2024. https://www.ieee-jas.net/article/doi/10.1109/JAS.2024.124902
[^4^]: Venkatasubramanian, V.; Rengaswamy, R.; Yin, K.; Kavuri, S.N. "A review of process fault detection and diagnosis: Parts I–III." *Computers & Chemical Engineering* 27(3):293–346, 2003. https://www.semanticscholar.org/paper/305f5ec83b51363de07dfcad19534b561d4a1a5e
[^5^]: Qin, S.J. "Survey on data-driven industrial process monitoring and diagnosis." *Annual Reviews in Control* 36(2):220–234, 2012. (Cited via https://www.preprints.org/frontend/manuscript/c901ca3cf421f0053dd4ce29bc771355/download_pub)
[^6^]: Nomikos, P.; MacGregor, J.F. "Monitoring batch processes using multiway principal component analysis." *AIChE Journal* 40(8):1361–1375, 1994. https://hero.epa.gov/reference/5735813/
[^7^]: Nomikos, P.; MacGregor, J.F. "Multivariate SPC charts for monitoring batch processes." *Technometrics* 37(1):41–59, 1995. https://literature.learnche.org/item/34/multivariate-spc-charts-for-monitoring-batch-processes
[^8^]: ASM Consortium, "Improve safety and performance — ASM Consortium celebrates 20 years," Honeywell white paper, 2014. Verbatim: "abnormal situations caused a 3%-8% loss in productive capacity … economic impact of at least $20 B annually in the petrochemical industry alone." https://process.honeywell.com/content/dam/process/en/documents/document-lists/doc_asm-consortium/white-papers/October%201%202014%20-%20Improve%20safety%20and%20performance%20Abnormal%20Situation%20Management%20Consortium%20celebrates%2020%20years.pdf
[^9^]: iFactory, "Abnormal Situation Management ASM Consortium Guidelines Applied" (secondary; cites ASM finding that 42% of abnormal situations trace to people/work-context). https://ifactoryapp.com/industries/oil-and-gas/abnormal-situation-management-asm-consortium-guidelines
[^9a^]: Zhou, Y.; Kazantzis, N.; Mannan, M.; West, H.H.; Rogers, W.J. "Abnormal Situation Management: a Process Dynamics Approach," Mary Kay O'Connor Process Safety Center, Texas A&M. https://oaktrust.library.tamu.edu/server/api/core/bitstreams/a363b0cf-88a4-4d3f-ba96-f46304026176/content
[^9b^]: Bullemer, P.T.; Reising, D.V.C.; Tolsma, M.; Laberge, J.C. "Towards Improving Operator Alarm Flood Responses: Alternative Alarm Presentation Techniques," ASM Consortium/Honeywell, 2011. https://process.honeywell.com/content/dam/process/en/documents/document-lists/doc_asm-consortium/white-papers/October%2031%202011%20-%20Towards%20Improving%20Operator%20Alarm%20Flood%20Responses%20Alternative%20Alarm%20Presentation%20Techniques.pdf
[^10^]: "Alarm Management and Rationalization: ISA-18.2 Explained" (secondary; verbatim workshop rate "30-50 alarms per day", "<5% Priority 1", "30 to 60 percent" elimination). https://www.instrumentationblog.in/alarm-management-isa-18-2/ ; corroborating: https://www.processcontrolguide.com/isa-18-2-alarm-management/
[^11^]: Kadlec, P.; Gabrys, B.; Strandt, S. "Data-driven Soft Sensors in the Process Industry." *Computers & Chemical Engineering* 33(4):795–814, 2009. http://eprints.bournemouth.ac.uk/8498/1/CACE_KadlecGabrysStrandt_2008.pdf
[^12^]: iFactory, "Power Plant Alarm Management & Rationalization — AI-Driven Optimization & ISA-18.2 Compliance" (secondary; verbatim "doing it manually across thousands of alarm points is one of the reasons so many plants start the effort and never finish it"). https://ifactoryapp.com/industries/power-plant/power-plant-alarm-management-rationalization-ai-optimization
[^13^]: Yokogawa/KBC, "Visual MESA: Your Energy Watchdog" (vendor white paper; verbatim "Sustainability Program which ensures that their model is 'evergreen'…"). https://www.yokogawa.com/cn/library/resources/white-papers/visual-mesa-your-energy-watchdog/
[^14^]: Narasimhan, S.; Jordache, C. *Data Reconciliation and Gross Error Detection: An Intelligent Use of Process Data.* Gulf Professional Publishing, 2000. (Cited via https://publications.polymtl.ca/56589/1/2023_Thibault_Industrial_Data_Driven_Processing_Framework.pdf, ref. 47)
[^14a^]: Gross-error test lineage (Mah, Stanley & Downing 1976; Tamhane, Jordache & Mah; Tong & Crowe 1995) surveyed in "Development of a heuristic methodology for precise sensor network design," *Computers & Chemical Engineering*. https://www.sciencedirect.com/science/article/pii/S0098135407000488
[^15^]: iFactory, "Real Time Optimization RTO for Refinery Margin Improvement" (secondary; verbatim data-reconciliation/gross-error role before optimization). https://ifactoryapp.com/industries/oil-and-gas/real-time-optimization-rto-refinery-margin
[^16^]: Yokogawa, Visual MESA deployment summaries (verbatim "overall benefit in the range of 2% to 5% of the total energy cost … payback … less than one year"). https://www.yokogawa.com/tr/industries/oil-gas-downstream/refining/
[^16a^]: KBC, "Visual MESA Energy Management System" ("Run in open or closed-loop mode"). https://www.kbc.global/energy-transition/technology/visual-mesa-energy-management-system/
[^17^]: "Online real-time optimisation helps identify energy gaps" (ENAP Aconcagua / Soteica Visual MESA case), *Petroleum Technology Quarterly*. https://www.digitalrefining.com/article/1000517/online-real-time-optimisation-helps-identify-energy-gaps
[^18^]: "Deactivation of FCC catalysts," DigitalRefining/PTQ (verbatim Shell tagged-catalyst finding). https://www.digitalrefining.com/article/1003121/deactivation-of-fcc-catalysts
[^18a^]: iFactory, "Hydrocracker Temperature Runaway Prevention and Quench System" (secondary; ΔT staging thresholds, Tosco 7-minute escalation). https://ifactoryapp.com/industries/oil-and-gas/hydrocracker-temperature-runaway-prevention-quench
[^18b^]: "Fluid catalytic cracking: recent developments on the grand old lady of zeolite catalysis," PMC4594121. https://pmc.ncbi.nlm.nih.gov/articles/PMC4594121/
[^19^]: "ISA-88 Formalization. A Step Towards its Integration with…" CEUR-WS Vol-1333 (verbatim "Approved by lab" transition condition). https://ceur-ws.org/Vol-1333/fomi2014_4.pdf
[^20^]: "ISA-88 (S88) – Batch Control Standard" (secondary; procedural/physical/recipe models, exception-rate KPIs). https://sgsystemsglobal.com/glossary/isa-88-s88-batch-control-standard/
[^21^]: Greg Stanley & Associates / Optegrity white paper (verbatim "control loops … increased from two hundred to eight hundred per operator"; G2 abnormal-condition-management practice). https://gregstanleyandassociates.com/optegrity_white_paper.pdf
[^22^]: "Abnormal Situations – The solution is not a product. It is a system." (AEGIS description; verbatim "Operators must interpret 2,000–5,000 data points under stress"). https://mycontrolroom.com/abnormal-situations-the-solution-is-not-a-product-it-is-a-system/
[^23^]: "Predictive Operational Safety Engineering, Part I," *Processes* 14(15):2462, MDPI (verbatim decision-support-vs-IEC 61511 positioning). https://www.mdpi.com/2227-9717/14/15/2462
[^24^]: "Where Fault Detection and Diagnosis Meets MPC Performance Assessment: Review and Case Study of an Integrated Framework," Preprints 2026 (incl. Botelho et al. 2016 unmeasured-disturbance-vs-MPM diagnosis). https://www.preprints.org/manuscript/202605.1971
[^25^]: "Bridging the Gap in Chemical Process Monitoring: Beyond Algorithm-Centric Research Toward Industrial Deployment," *Processes* 13(12):3809, MDPI, 2025. https://www.mdpi.com/2227-9717/13/12/3809
[^26^]: Kourti, T.; Nomikos, P.; MacGregor, J.F. "Analysis, monitoring and fault diagnosis of batch processes using multiblock and multiway PLS." *J. Process Control* 5(5):277–284, 1995. (Cited via https://learnche.org/pid/product-development-product-improvement/batch-process-monitoring)
[^27^]: Kourti, T.; Lee, J.; MacGregor, J.F. "Experiences with industrial applications of projection methods for multivariate statistical process control." *Comput. Chem. Eng.* 20, Suppl., S745–S750, 1996. (Cited via https://repository.kulib.kyoto-u.ac.jp/dspace/bitstream/2433/77915/1/D_Kano_Manabu.pdf)
[^28^]: Li, J. et al. crude-oil short-term scheduling MILP (state-task network) and MPC-based refinery scheduling under disturbances, surveyed in "Energy Efficiency Optimization in Scheduling Crude Oil Operations of Refinery." https://www.researchgate.net/publication/318805226
[^29^]: Lardner, R. "Effective Shift Handover — A Literature Review," UK HSE Offshore Technology Report OTO 96 003, 1996 (The Keil Centre; incl. IChemE Symp. refs on handover standards and PTW surveys). https://humanfactors101.com/wp-content/uploads/2016/04/effective-shift-handover-a-literature-review.pdf
[^30^]: "MES & EBR in Pharma: A Guide to GMP Compliance & Efficiency" (secondary; verbatim review-by-exception and ALCOA comparison table). https://intuitionlabs.ai/articles/mes-ebr-pharma-compliance
[^31^]: Pharmaceutical MES integration study (verbatim "40–60% improvement in batch record review efficiency", "20–30% decrease in … releasing batches"). https://eudoxuspress.com/index.php/pub/article/download/5074/3804/10286
[^31a^]: "Enhancing Data Integrity and Regulatory Compliance in Biomanufacturing Using PAS-X MES," *IJAM*, 2025. https://ijamjournal.org/ijam/publication/index.php/ijam/article/view/471
[^32^]: "Data Integrity in Pharma Batch Records" (secondary; failure-type taxonomy). https://gmppros.com/data-integrity-issues-in-pharmaceutical-batch-records/
[^33^]: iFactory, "Digital EHS Work Permit Management System" (secondary; verbatim conflict/isolation blocking). https://ifactoryapp.com/ehs-management/work-permit-management-system-ai
[^34^]: "Electronic Permit to Work (ePTW): A Smarter Way to Control High-Risk Jobs" (secondary; verbatim SIMOP conflict example). https://ehs4safety.com/electronic-permit-to-work-eptw-a-smarter-way-to-control-high-risk-jobs/
