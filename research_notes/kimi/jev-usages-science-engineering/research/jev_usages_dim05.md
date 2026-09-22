# Jev "System One" Typed-Judgment Usages in Asset-Intensive Engineering

**Scope:** Catalog of evidence-grounded usage patterns for a fast, cheap, non-generative typed-judgment model (TypeSafe AI "Jev": JSON state + typed questions → Choice / Noul / Score judgments with probabilities and confidence; many parallel questions per call; sub-100 ms latency, ~$0.04/Mtoken, 32K/32K context) across predictive maintenance, power grids, aerospace, automotive, structural health monitoring, rail, and maritime.

**Method:** 25 independent web searches (coarse → fine), prioritizing primary sources (IEEE/PHM Society papers, ISO standards, DoD guidebooks, FAA advisory circulars, peer-reviewed journals). Each usage gives: (1) name + one-liner; (2) current practice & bottleneck; (3) concrete primitive design; (4) why latency/cost matters; (5) evidence citations; plus a confidence rating.

**Cross-cutting design thesis:** Classical condition-monitoring stacks (ISO 13374's State Detection → Health Assessment → Prognostic Assessment → Advisory Generation blocks [^1^][^2^]) are strong on numeric signal features but weak wherever the decisive evidence is *semantic* — technician free text, work-order narratives, operator comments, relay event text, FOQA analyst context. A typed-judgment model is the missing, cheap "semantic adjudication layer" that can be called per-event, per-asset, per-question without generative-model cost/latency, and whose outputs (probabilities + confidence) slot directly into thresholding, routing, and escalation logic.

---

## A. Predictive Maintenance / CBM+

### A1. Work-Order & Maintenance-Log Triage: Failure-Mode Routing from Free Text
**One-liner:** Classify incoming work orders / technician notes into failure category, severity, and correct specialist queue in real time.

- **Current practice & bottleneck:** Maintenance text is noisy — "5–180 tokens (median: 32)... abbreviations, misspellings, equipment codes, timestamps, and copied alarm strings" — and real deployments target classes like `power_loss`, `sensor_fault`, `communication_issue`, `mechanical_issue`, `scheduled_maintenance` with *"Inference must run in <50 ms per note"* and macro-F1 ≥ 0.80 [^3^]. Today this is either manual dispatcher triage or bespoke TF-IDF/SVM/mini-transformer pipelines that must be retrained per site and break on new operators/sites [^3^][^4^]. NER extraction of component/action/failure-mode triples from notes like "replaced bearing on motor 3A due to excessive wear" is established practice but typically batch [^4^].
- **Primitive design:** State = note text + asset tag + recent sensor/alarm summary + asset class metadata. Per note, fire parallel questions: **Choice** "failure mode ∈ {electrical, mechanical, sensor, comms, process, external, none}"; **Choice** "route to crew ∈ {electrical, mechanical, I&C, planner}"; **Score** "urgency on rubric {monitor / next-planned-outage / within-week / immediate}"; **Noul** "this note describes a genuine new fault (vs. duplicate/template/boilerplate)". Compose in code: route = f(mode, urgency, is-genuine).
- **Why latency/cost matters:** Utilities and plants process hundreds of thousands of notes (the reference scenario cites 420,000 historical records [^3^]); per-note economics demand fractions of a cent, and triage must keep pace with shift-handoff bursts. $0.04/Mtoken means triaging a 100-token note costs ≈ 4×10⁻⁶ $ — effectively free vs. a misrouted work order.
- **Evidence:** [^3^] industrial log-classification deployment spec (classes, latency, F1 targets); [^4^] NLP-for-PdM practice review (classification/NER on maintenance logs).
- **Confidence: High** — established task family with explicit latency/cost constraints; Jev's primitives map 1:1.

### A2. Alarm Rationalization & Flood Triage (Control-Room Semantic Layer)
**One-liner:** Real-time per-alarm judgments — actionable vs. nuisance vs. consequential — during alarm floods, using alarm text + plant context.

- **Current practice & bottleneck:** EEMUA 191 / ISA-18.2 define an alarm flood as >10 alarms per 10 minutes; un-rationalized DCS can generate "100 to 500 alarms within the first minute" of a trip; the Texaco Milford Haven explosion (1994) saw "275 alarms" in the last eleven minutes, mostly irrelevant [^5^][^6^]. EEMUA 191's manageable target is ~144 alarms/operator/hour; ~70% of alarm-related incidents are linked to poor configuration, not operators [^6^]. Rationalization is a manual, periodic, documented per-alarm decision process [^7^] — it cannot adapt in real time to *which* of the flooding alarms matter *now*.
- **Primitive design:** State = alarm tag, alarm text, priority, plant mode, recent alarm burst window, related measurements. Parallel: **Noul** "this alarm requires an operator action in the current plant state"; **Noul** "this alarm is a cascade/consequence of alarm X already annunciated"; **Choice** "first-out root cause candidate ∈ {list}"; **Score** "suppression-safe severity rubric". Compose: dynamic re-prioritization and consequence-alarm grouping during floods.
- **Why latency/cost matters:** Floods arrive at 10–500 alarms/min; judgment must be per-alarm in milliseconds at trivial cost — 500 alarms × ~10 questions in a burst is still pennies. Human analysis cannot scale to burst rate; generative LLM per-alarm calls are too slow and too expensive at flood tempo.
- **Evidence:** [^5^] EEMUA 191 flood definition & Milford Haven case; [^6^] alarm-system KPIs (144/hr, flood phases, 70% configuration-linked); [^7^] rationalization as documented decision per alarm.
- **Confidence: Medium-High** — the flood problem and its human bottleneck are rigorously documented; real-time semantic adjudication is a novel-but-natural extension of rationalization doctrine.

### A3. RUL Model / Operating-Regime Selection for Prognostics
**One-liner:** Choose *which* prognostic model/regime applies before scoring RUL — a cheap typed gate that classical pipelines handle with brittle hand-rules.

- **Current practice & bottleneck:** ISO 13381-1 defines the prognostics process [^1^]; ISO 13374's blocks include State Detection ("determining the operational state of the machine, for example high speed operation and low speed operation") and Health/Prognostic Assessment [^2^]. The IMS Center adaptation explicitly "recommends sorting data into operating regimes... distinguished by speeds, loads, and even mechanical failure modes... labeled with the regime name" because downstream models are regime-specific [^2^]. Benchmark evidence: C-MAPSS sub-datasets FD002/FD004 (multiple operating conditions/fault modes) are markedly harder than FD001/FD003, and "a performance decline is observed in models when confronted with multiple operating [conditions]" [^8^][^9^]. Regime misassignment silently corrupts RUL.
- **Primitive design:** State = recent sensor window summary + operating settings + maintenance history snippet. Parallel: **Choice** "active operating regime ∈ {R1..Rk}"; **Choice** "dominant suspected failure mode ∈ {F1..Fm}"; **Noul** "the RUL model trained on regime R_i is valid for this asset right now"; **Score** "degradation stage rubric {healthy / early / advanced / imminent}". Compose: dispatch to the matching RUL model, or flag "no-valid-model" for human review.
- **Why latency/cost matters:** Regime gating runs per asset per scoring cycle across fleets of thousands of engines/machines; it must add <100 ms and negligible cost to each RUL update or it will simply be skipped (as it often is today).
- **Evidence:** [^2^] ISO 13374 SD/HA/PA blocks + IMS multi-regime practice (verbatim above); [^8^] C-MAPSS benchmark structure/performance decline under multiple conditions; [^9^] FD-subset condition/fault-mode complexity.
- **Confidence: High** — regime sorting is documented standard practice; Jev replaces hand-crafted rules with learned semantic gating.

### A4. CBM+ Advisory Generation & Maintenance-Action Selection
**One-liner:** Turn health/prognostic outputs into the actual advisory — repair now, defer, monitor, cannibalize parts — as a composed set of typed judgments.

- **Current practice & bottleneck:** DoD's CBM+ strategy (DoDI 4151.22) mandates "decision-support software to assess equipment operating reliability and availability... The objective is to predict problems or failures in time to take remedial action" [^10^]. Yet the 2022 DoD IG audit found "the Services had not fully implemented predictive maintenance strategies" and the DoD "has not fully implemented predictive maintenance on any of its weapon systems" [^11^] — the advisory/decision layer is precisely where implementations stall. Advisory Generation is a named ISO 13374 block [^2^]; CBM+ doctrine emphasizes "maintenance performed based on evidence of need" [^10^].
- **Primitive design:** State = HA/PA outputs (health index, RUL estimate + uncertainty), mission schedule, parts availability, cost rules. Parallel: **Choice** "recommended action ∈ {return-to-service, schedule-at-next-opportunity, expedite, ground/idle}"; **Noul** "evidence of need is sufficient to justify intervention (P–F logic)"; **Score** "mission-impact risk rubric". Compose: advisory = argmax over expected cost with confidence-gated human escalation (low confidence → human review).
- **Why latency/cost matters:** Fleet-scale CBM+ means advisories per asset per day across thousands of tail numbers/vehicles; the DoD IG finding shows the bottleneck is operationalizing decisions, not algorithms — a sub-cent, sub-100 ms judgment layer is the difference between a dashboard nobody reads and an automated work-queue.
- **Evidence:** [^10^] CBM+ Guidebook (decision support definition, P–F curve, evidence-of-need); [^11^] DoD IG DODIG-2022-103 audit findings; [^2^] ISO 13374 Advisory Generation block.
- **Confidence: Medium** — strong doctrinal grounding; direct evidence of per-advisory typed classification is indirect (the gap itself is documented).

---

## B. Power Grids

### B1. PMU Disturbance Event Semantic Labeling & Triage
**One-liner:** Convert detected PMU/PMU-derived disturbance events into labeled, routed, confidence-scored event records for operators and post-event analysts.

- **Current practice & bottleneck:** Deep classifiers (CNN/LSTM/BiLSTM/SNN) reach ~97–100% accuracy distinguishing generator trips, line outages, self-clearing faults, oscillations, and load shedding from PMU streams [^12^][^13^][^14^]. But "they typically rely on large quantities of labeled data, often requiring thousands of confirmed events... obtaining high-quality event labels is not only time-consuming but also labor-intensive, as it often involves manual verification by experts" [^15^]. Class imbalance and unforeseen event types degrade supervised detectors in real grids [^14^].
- **Primitive design:** State = classifier output + signal-feature summary + SCADA context + substation metadata + (optionally) relay event text. Parallel: **Choice** "event type ∈ {generator trip, line outage, fault, oscillation, load event, data corruption, unknown}"; **Noul** "classifier label is trustworthy given data-quality flags"; **Choice** "data-corruption pattern ∈ {dropout, spike, drift, none}" (cf. data-quality-robust classification [^16^]); **Score** "operator-attention rubric {log-only / trend-watch / investigate / emergency}". Compose: semantic event record written to the disturbance database; low-confidence events queued for expert labeling (active-learning triage of the labeling bottleneck itself).
- **Why latency/cost matters:** PMU streams run 30–50 Hz per device across thousands of devices; event verdicts must be emitted in operator-timeframes, and continuous data-quality/label-confidence checking per event is only economical at ~10⁻⁵ $/event.
- **Evidence:** [^12^] BiLSTM event classification, 97.8% total efficiency (generator outage/line outage/self-clearing fault + data-corruption class); [^15^] labeled-data/manual-verification bottleneck (verbatim); [^14^] class imbalance and open-set limits of supervised PMU event detection; [^16^] disturbance classification robust to PMU data-quality issues.
- **Confidence: High.**

### B2. Protective-Relay / DFR Event Report Triage
**One-liner:** Instant verdict on each digital fault recorder / relay event — fault type, line, validity — routed to dispatcher vs. protection engineer vs. archive.

- **Current practice & bottleneck:** DFRs capture pre/fault/post windows on every trigger across the fleet; expert-system automation of DFR analysis is decades-old — "a new data file is copied from a recorder and immediately analyzed... the whole process takes less than a minute, so valuable information is available to the system dispatcher" with reports containing "fault type, fault location, and transmission line involved" [^17^]. Yet rule-based expert systems are brittle; engineers still manually review waveforms for misoperations, and volume far exceeds review capacity (disturbance identification *and* localization remain active research problems [^18^]).
- **Primitive design:** State = relay/DFR event metadata + waveform feature summary + relay target flags + line/topology context + recent weather. Parallel: **Choice** "fault type ∈ {SLG, LL, LL-G, 3-phase, switching, inrush, CT/VT issue, misoperation}"; **Noul** "protection operated correctly as designed"; **Noul** "event warrants protection-engineer review"; **Score** "severity/urgency rubric". Compose: auto-close valid events, escalate suspected misoperations, batch correlated events into one incident.
- **Why latency/cost matters:** A storm can generate thousands of event records fleet-wide in hours; per-record verdicts at sub-100 ms and ~10⁻⁵ $ let utilities auto-triage 100% of events instead of sampling. The <1-minute expert-system precedent [^17^] shows the value of speed; Jev makes that speed cheaply available with semantic judgment instead of hand-built rules.
- **Evidence:** [^17^] automated DFR analysis expert system (verbatim timing/report contents); [^18^] disturbance detection/identification/localization taxonomy and ML classifier survey.
- **Confidence: Medium-High** — automation value proven by legacy expert systems; typed-judgment replacement is an extrapolation.

### B3. Wildfire / PSPS Operational Advisory Judgments
**One-liner:** Per-line, per-decision-window risk advisories combining fire weather, equipment condition, and operational context for PSPS and dispatch decisions.

- **Current practice & bottleneck:** Utilities must balance ignition risk vs. service continuity; research formalizes this as multistage stochastic optimization where "whether a line is proactively de-energized through a PSPS decision" changes ignition probabilities downstream [^19^], and NSF-funded work builds per-line risk surrogates from "meteorological data, such as wind speed and humidity, and structural characteristics" integrated into operational planning [^20^]. These optimizations are too slow/opaque for real-time per-line calls; operators need fast advisory judgments.
- **Primitive design:** State = line segment features (vegetation, age, equipment, prior faults) + weather nowcast + grid loading + recent inspection notes. Parallel: **Score** "ignition-risk rubric {normal / elevated / high / extreme}"; **Noul** "risk exceeds the utility's PSPS consideration threshold"; **Choice** "recommended posture ∈ {normal patrol, enhanced monitoring, de-energize consideration, immediate crew dispatch}". Compose: feed typed advisories into the formal optimizer as constraints/priors; confidence gating for human sign-off.
- **Why latency/cost matters:** A utility has 10⁴–10⁵ line segments × hourly decision windows during fire season; advisories must be recomputed continuously — only feasible at millisecond latency and micro-cost per segment-window.
- **Evidence:** [^19^] multistage decision-dependent wildfire/PSPS optimization; [^20^] NSF wildfire risk quantification per power line + operational planning speed-up via ML.
- **Confidence: Medium** — strong need and active research; per-segment typed advisory is a design synthesis.

---

## C. Aerospace

### C1. FDM/FOQA Exceedance Validation & Triage
**One-liner:** Per-exceedance verdict — valid event vs. bad data vs. justified-by-context — before human safety-analyst review.

- **Current practice & bottleneck:** FOQA systems flag exceedances against SOP limits (hard landing, excessive bank, speed deviations [^21^]); then "an analyst will review the parameter values surrounding the event and other information to determine if the exceedance was valid or if the exceedance was based on bad data, a faulty sensor or some other invalidating factor" — e.g., an excessive-rudder event deemed invalid because "the aircraft was making a crosswind landing" [^22^]. FAA AC 120-82 describes exceedance levels and FMT/gatekeeper workflows [^23^]. Analyst time per exceedance is the binding constraint; fleets generate thousands of events.
- **Primitive design:** State = exceedance type + parameter traces summary + flight phase + airport/runway/weather + pilot-report text if any. Parallel: **Noul** "this exceedance reflects a genuine operational deviation (not sensor/data artifact)"; **Noul** "context plausibly justifies the deviation (e.g., crosswind, avoidance)"; **Choice** "event category ∈ {unstable approach, energy management, configuration, weather response, data artifact}"; **Score** "severity rubric aligned to operator's level scheme". Compose: auto-dismiss artifacts, severity-sort the remainder for the gatekeeper.
- **Why latency/cost matters:** Airline fleets log 10⁴–10⁶ flights/year with dozens of monitored parameters [^21^]; validating every exceedance in near-real-time (vs. weekly analyst batches) tightens the safety feedback loop at trivial per-event cost.
- **Evidence:** [^22^] FOQA analyst validation workflow incl. crosswind example (verbatim); [^23^] FAA AC 120-82 exceedance analysis and risk-based levels; [^21^] event-detection as core of FDM/FOQA systems.
- **Confidence: High** — manual validation step is explicitly documented; judgment structure is naturally typed.

### C2. Aircraft Maintenance Log / Defect-Report Classification & ATA-JASC Routing
**One-liner:** Auto-classify defect narratives into ATA/JASC codes, risk-rank them, and route to the right maintenance action.

- **Current practice & bottleneck:** Demonstrated research: MRO fault-log classification with NLP/ML "to classify faults and predict the category of maintenance action" (IEEE Access, UK commercial MRO data) [^24^]; classification across 30 Chapter–Section categories achieving f1-macro 0.762 with a prototype "capable of processing the main flow of daily defect reports, reducing the time required for manual processing" [^25^]; fleet-scale NLP "process large amounts of aircraft textual reports in minutes... supporting qualitative human intuition and maintainer heuristic decision-making" with risk ratings [^26^]; airlines explore NLP "to identify which ATA codes should be used to classify faults" [^27^]; JASC-code automation on open defect-report datasets [^28^].
- **Primitive design:** State = defect narrative + aircraft type + recent defect history + flight-phase context. Parallel: **Choice** "ATA/JASC chapter-section"; **Choice** "maintenance action category ∈ {inspect, repair, replace, defer (MEL), monitor}"; **Score** "risk rating rubric {low/medium/high}"; **Noul** "this defect is recurrent vs. previously reported (lead-indicator match)". Compose: routing + recurrent-defect surfacing.
- **Why latency/cost matters:** Line maintenance generates defect reports continuously across global fleets; per-report classification must be instant (turnaround-time-critical) and cheap enough to run on every report, not sampled.
- **Evidence:** [^24^] IEEE fault-log classification for decision support; [^25^] 30-category classification with prototype; [^26^] ICAS fleet NLP with risk ratings; [^27^] American Airlines ATA-code NLP exploration; [^28^] JASC automation.
- **Confidence: High** — multiple independent peer-reviewed demonstrations.

### C3. Turbofan Health-State & Failure-Mode Adjudication (N-CMAPSS-style)
**One-liner:** Typed health verdicts — current health state, eventual failing component, confidence — feeding RUL models and maintenance planning.

- **Current practice & bottleneck:** The 2021 PHM Data Challenge (N-CMAPSS) shows joint prediction of "1) the current health state; 2) the eventual failing component(s); and 3) the RUL" with AUROC/AUPR > 0.95 for classification outputs; motivation: "Being able to accurately predict and isolate the reason for failure has important implications on maintenance decision-making, equipping operators with the capability to dispatch the appropriate experts and resources in a timely manner" [^29^]. Today these are bespoke per-fleet DL models; the semantic context (maintenance notes, pilot reports) is unused.
- **Primitive design:** State = sensor-window health features + fleet history + maintenance log excerpts. Parallel: **Noul** "unit is in unhealthy operation"; **Choice** "eventual failure component ∈ {Fan, LPC, HPC, HPT, LPT, none-visible}"; **Score** "degradation stage rubric". Compose: gate which RUL head runs, pre-stage parts/experts per verdict, confidence-based escalation.
- **Why latency/cost matters:** Per-engine-per-flight updates across thousands of engines; typed verdicts at ~10⁻⁴ $ each vs. GPU inference of bespoke multi-head models; latency enables post-flight immediate triage.
- **Evidence:** [^29^] N-CMAPSS unified health-state/failure-component/RUL prediction (verbatim motivation, AUROC > 0.95).
- **Confidence: Medium-High.**

---

## D. Automotive / Fleet

### D1. DTC Verdict Triage & Fleet Maintenance Prioritization
**One-liner:** Per-DTC-per-vehicle verdict — real fault vs. transient/nuisance, severity, and service-window recommendation — across connected fleets.

- **Current practice & bottleneck:** Telematics platforms stream "real-time diagnostic trouble code (DTC) and rich engine data" and use AI "comparing it against hundreds of thousands of data points... to pick out patterns that have led to distinct failures in the past, potentially weeks before the failure occurs"; workshop managers then "triage minor issues in the necessary order to maximise fleet health and reduce... vehicles off the road (VOR)" [^30^]. Raw DTC volume is enormous, many codes are transient or context-dependent, and human triage doesn't scale to 10⁵-vehicle fleets.
- **Primitive design:** State = DTC code + freeze-frame summary + vehicle history + recent repair notes + duty cycle. Parallel: **Noul** "this DTC indicates a genuine developing fault (vs. transient/self-clearing)"; **Choice** "subsystem ∈ {powertrain, aftertreatment, brakes, electrical, body, tires}"; **Score** "VOR-risk rubric {drive-on / next-service / within-days / stop-now}". Compose: fleet-wide priority queue for the workshop.
- **Why latency/cost matters:** A 100k-vehicle fleet can emit millions of DTC events/month; per-event judgment must cost micro-dollars and return in milliseconds to be applied universally instead of heuristically filtered.
- **Evidence:** [^30^] fleet predictive-maintenance DTC triage practice (verbatim).
- **Confidence: Medium-High** — strong commercial practice evidence; nuisance/transient adjudication is the key value-add and is well-known but less formally published.

### D2. Warranty Claim Classification & Coverage Routing
**One-liner:** Classify claim narratives by true failure type, judge coverage eligibility, and route — replacing manual routing by product type.

- **Current practice & bottleneck:** "NLP classifies the failure type based on the actual description text, not just the product category, and an ML coverage model determines whether the claim is eligible"; "Warranty costs average 2-5% of revenue, and misrouted claims add real delay and cost overrun... a claim routed to the wrong team just sits until someone catches the error" [^31^].
- **Primitive design:** State = claim text + product/vehicle data + service history. Parallel: **Choice** "failure type ∈ {electrical, mechanical, user error, wear-and-tear, manufacturing defect}"; **Noul** "claim is covered under applicable warranty terms"; **Noul** "claim shows anomaly/fraud indicators"; **Choice** "route ∈ {service, engineering, supplier recovery, deny-with-explanation}". Compose: routing + automated explanation payload for denied claims.
- **Why latency/cost matters:** OEMs process 10⁵–10⁶ claims/year; every claim touched at ~10⁻⁵ $ vs. minutes of human triage; instant routing removes the "sits until someone catches the error" delay.
- **Evidence:** [^31^] warranty triage workflow and 2–5%-of-revenue cost basis.
- **Confidence: Medium-High.**

---

## E. Structural Health Monitoring / Infrastructure

### E1. SHM Damage-Alert Confirmation (False-Alarm Adjudication)
**One-liner:** Second-stage verdict on threshold-exceeding damage indices — real structural change vs. environmental/operational variability — before issuing alarms.

- **Current practice & bottleneck:** Vibration-based SHM tracks damage indices against thresholds; environmental/operational variability (temperature, wind, traffic) "can significantly influence structural modal frequencies" and causes "false alarm (false positive) and mis-detection (false negative) errors" [^32^]. State of practice adds statistical second stages — e.g., a Binomial Distribution Classifier over alert windows that "drastically reduc[es] the probability of sending false alarms while keeping the probability of detecting structural damage unchanged" [^33^]; separating "normal changes caused by varying environmental conditions... humidity, wind and most important, temperature" from damage is the canonical problem [^34^]. These statistical layers use *no semantic context* (weather logs, inspection notes, maintenance events, known construction activity).
- **Primitive design:** State = DI time-series summary + modal-feature deltas + concurrent weather/traffic/construction logs + recent inspection text. Parallel: **Noul** "the alert is explained by environmental/operational variability"; **Noul** "a plausible benign explanation exists (maintenance, sensor fault)"; **Choice** "alert cause ∈ {damage-like, thermal, sensor/instrumentation, loading event, unknown}"; **Score** "escalation rubric {suppress / continue-observing / inspect / close-or-restrict}". Compose: sits alongside the BDC-style statistical layer, adding semantic evidence it can't see.
- **Why latency/cost matters:** Large bridge/building fleets stream DIs continuously; every alert adjudicated in milliseconds lets operators run lower statistical thresholds (higher POD) without drowning in false alarms — per-alert cost is negligible vs. one unnecessary bridge inspection ($10⁴–10⁵).
- **Evidence:** [^33^] BDC two-level alert/alarm false-alarm reduction (verbatim); [^32^] EOV-induced false alarms in bridge SHM; [^34^] separating environmental from damage changes (verbatim).
- **Confidence: High.**

### E2. Inspection / NDT Report Routing & Verdict Support
**One-liner:** Triage inspector narratives and NDT findings — severity, defect class, re-inspection interval — into asset-management systems.

- **Current practice & bottleneck:** Track/infrastructure inspection generates defect classifications requiring expert review — e.g., railway acoustic inspection "requires a railway engineer as a domain expert to differentiate between different rail tracks' faults, which is cumbersome, laborious, and error-prone" [^35^]. Threshold-based inspection systems generate false positives: "issues such as measurement error, and sensor failure can result in false positives... False alarms can result in costly ineffective interventions, are hazardous and impact the network availability" [^36^].
- **Primitive design:** State = inspection finding (text + measurement summary) + asset history + prior findings at same location. Parallel: **Choice** "defect class"; **Score** "severity rubric aligned to the governing standard (e.g., alert/action/immediate-action limits)"; **Noul** "finding is consistent with prior history (genuine trend vs. measurement artifact)"; **Choice** "recommended action ∈ {no action, re-inspect, schedule repair, emergency speed restriction/closure}". Compose: CMMS work-order pre-fill + human sign-off gate by severity.
- **Why latency/cost matters:** National networks produce 10⁴+ findings per inspection campaign; per-finding verdicts in milliseconds compress the survey-to-work-order loop from weeks to minutes (cf. automated CMMS work-order generation practice [^37^]).
- **Evidence:** [^35^] expert-dependence of manual inspection (verbatim); [^36^] false-positive costs in track inspection; [^37^] automated defect classification → CMMS work-order pipeline.
- **Confidence: Medium-High.**

### E3. Rail Track-Geometry Fault Severity Classification & False-Alarm Reduction
**One-liner:** Classify geometry-car exceedances by fault severity and validity so tamping/maintenance is dispatched only on real, prioritized faults.

- **Current practice & bottleneck:** "Current fault diagnosis or parameter deviation relies on simple threshold comparison... Data threshold exceedances enact maintenance actions automatically. However, issues such as measurement error, and sensor failure can result in false positives" — PHM Society Europe 2024 proposes CNN-based severity classification to fix this [^36^]. ML classification of track segments into deteriorated/improved/no-change reached 77.5–88.9% per class [^38^]; deep multi-task CNNs classify fasteners/ties at ~95% [^39^].
- **Primitive design:** State = geometry channel summaries (gauge, cant, twist, alignment, profile) + sensor-health flags + weather + traffic tonnage. Parallel: **Choice** "fault severity class"; **Noul** "exceedance is a sensor/misalignment artifact"; **Choice** "intervention ∈ {tamping, grinding, gauge adjustment, none}"; **Score** "derailment-risk rubric". Compose: risk-weighted priority queue (matching emerging industry practice of trajectory-based prioritization [^37^]).
- **Why latency/cost matters:** Geometry cars survey thousands of miles; per-mile/per-defect verdicts must keep pace with survey speed and be cheap enough to run on every exceedance, not just worst-case samples.
- **Evidence:** [^36^] PHM Europe false-alarm-reduction CNN for track geometry (verbatim bottleneck); [^38^] ANN segment classification; [^39^] deep multi-task track inspection.
- **Confidence: High.**

---

## F. Maritime

### F1. Ship Bridge/Engine-Room Alarm Triage Under Alarm Flooding
**One-liner:** Per-alarm relevance/priority verdicts for watchkeepers facing documented alarm floods on bridges and in engine control rooms.

- **Current practice & bottleneck:** Lloyd's Register: "the number of bridge alarms have increased by 197% in less than two decades, creating often critical alarm flooding which can lead to poor decision making"; the 'alarm problem' is "widespread across the maritime industry, even among well-performing vessels"; recommended remedies include "eliminating 'stale alarms' to reduce clutter" [^40^]. Engine-room alarm systems (ERAMS) log everything but prioritization is static [^41^].
- **Primitive design:** State = alarm text/tag + vessel state (underway/anchored/maneuvering) + concurrent alarm window + machinery parameters. Parallel: **Noul** "this alarm is actionable by the watchkeeper now"; **Noul** "this is a stale/standing alarm safe to declutter"; **Choice** "alarm consequence group (which root event it belongs to)"; **Score** "criticality rubric". Compose: dynamic decluttering + flood-mode re-prioritization, mirroring A2 ashore.
- **Why latency/cost matters:** Floods peak during casualties — exactly when verdicts must be <100 ms; per-alarm cost must be negligible since flood volumes are 10–100× normal.
- **Evidence:** [^40^] LR alarm-flooding report (197% increase, verbatim); [^41^] ERAMS alarm categories and logging practice.
- **Confidence: Medium** — problem is authoritatively documented; ship-specific deployment evidence is thin.

---

## Summary Matrix

| # | Usage | Domain | Primary Primitives | Key Bottleneck Evidence | Confidence |
|---|-------|--------|--------------------|--------------------------|------------|
| A1 | Work-order/log triage & routing | PdM | Choice, Score, Noul | <50 ms/note, 420k-note scale [^3^] | High |
| A2 | Alarm-flood triage | PdM/process | Noul, Choice, Score | 100–500 alarms/min; Milford Haven [^5^][^6^] | Med-High |
| A3 | RUL regime/model selection | PdM | Choice, Noul, Score | ISO 13374 SD block; IMS regimes [^2^] | High |
| A4 | CBM+ advisory generation | PdM/defense | Choice, Noul, Score | DoD IG: PdM not operationalized [^11^] | Medium |
| B1 | PMU event semantic labeling | Grid | Choice, Noul, Score | Manual expert labeling bottleneck [^15^] | High |
| B2 | Relay/DFR event triage | Grid | Choice, Noul | <1-min expert-system precedent [^17^] | Med-High |
| B3 | Wildfire/PSPS advisories | Grid | Score, Noul, Choice | Per-line risk × optimizer latency [^19^][^20^] | Medium |
| C1 | FOQA exceedance validation | Aero | Noul, Choice, Score | Analyst-per-exceedance review [^22^][^23^] | High |
| C2 | Defect-report ATA/JASC routing | Aero | Choice, Score, Noul | 30-class f1 0.762; manual flow [^25^] | High |
| C3 | Engine health-state adjudication | Aero | Noul, Choice, Score | N-CMAPSS joint health/failure/RUL [^29^] | Med-High |
| D1 | DTC verdict triage | Auto/fleet | Noul, Choice, Score | Fleet-scale DTC triage practice [^30^] | Med-High |
| D2 | Warranty claim classification | Auto | Choice, Noul | 2–5% revenue; misrouting cost [^31^] | Med-High |
| E1 | SHM alert confirmation | SHM | Noul, Choice, Score | EOV false alarms; BDC two-stage [^33^] | High |
| E2 | Inspection/NDT report routing | SHM/rail | Choice, Score, Noul | Expert-dependent, error-prone [^35^] | Med-High |
| E3 | Track-geometry severity classification | Rail | Choice, Noul, Score | Threshold false positives [^36^] | High |
| F1 | Shipboard alarm-flood triage | Maritime | Noul, Choice, Score | 197% alarm growth; LR report [^40^] | Medium |

## Cross-Cutting Observations

1. **The semantic gap is systematic.** In every domain, the classical stack (thresholds, statistical classifiers, bespoke DL) operates on numeric features while decisive context lives in text: technician notes, pilot reports, alarm text, relay targets, weather logs. Jev's typed judgments are a natural "semantic adjudication layer" *composing with* — not replacing — those stacks (e.g., Noul "is this alert explained by context X?" on top of a BDC statistical stage [^33^]).
2. **Triage economics are universal.** Documented bottlenecks are per-event human review (FOQA analysts [^22^], PMU labelers [^15^], protection engineers [^17^], warranty routers [^31^], watchkeepers [^40^]). At ~$0.04/Mtoken and <100 ms, 100%-coverage adjudication replaces sampling heuristics.
3. **Confidence-gated escalation is the safety pattern.** All usages keep humans on high-severity/low-confidence paths (FOQA gatekeeper [^23^], EEMUA response doctrine [^5^], CBM+ sign-off [^10^]); Jev's native probability+confidence outputs map directly to these gates.
4. **Standards hooks exist.** ISO 13374's State Detection/Health Assessment/Advisory Generation blocks [^2^], ISO 13381 prognostics [^1^], EEMUA 191 / ISA-18.2 alarm KPIs [^5^][^6^], and DoDI 4151.22 CBM+ decision support [^10^] provide named insertion points for a typed-judgment layer.

## References

[^1^]: A Survey of Predictive Maintenance: Systems, Purposes and Approaches (incl. ISO 13381-1:2015 prognostics, ISO 13374 parts), arXiv:1912.07383. https://arxiv.org/html/1912.07383v2
[^2^]: PHM Society 2011 Proceedings / PHM 2023 — ISO 13374 six-block architecture (DA, DM, SD, HA, PA, AG), IMS Center multi-regime adaptation. https://phmsociety.org/wp-content/uploads/2011/09/PHM11Proceeding.pdf ; https://papers.phmsociety.org/index.php/phmconf/article/download/2023/1030
[^3^]: Dataford interview scenario, "Classify Maintenance Logs by Failure Type" (NorthGrid Energy; classes, <50 ms, macro-F1 targets, 420k records). https://dataford.io/questions/classify-maintenance-logs-by-failure-type
[^4^]: Aiventic, "NLP Algorithms for Predictive Maintenance" (text classification, NER on maintenance logs). https://www.aiventic.ai/blog/nlp-algorithms-for-predictive-maintenance
[^5^]: Open Exam Prep / Cyntech — EEMUA 191 alarm flood definition (>10 alarms/10 min; 100–500 alarms first minute; Milford Haven 275 alarms/11 min). https://open-exam-prep.com/study-guides/nebosh-hse-process-safety/process-hazard-control/alarm-management-eemua191 ; https://cyntech.io/kb/alarm-rationalisation
[^6^]: iFactory — EEMUA 191 / ISA 18.2 KPIs (144 alarms/hr; flood phases; ~70% configuration-linked). https://ifactoryapp.com/industries/oil-and-gas/alarm-rationalization-hmi-upgrade-operator-error-reduction
[^7^]: Cyntech — "Rationalisation is a documented decision per alarm, captured in a master alarm database." https://cyntech.io/kb/alarm-rationalisation
[^8^]: Chaoub, "Deep learning representations for prognostics and health management" (C-MAPSS benchmark; performance decline under multiple operating conditions). https://hal.univ-lorraine.fr/tel-04687618/file/DDOC_T_2024_0057_CHAOUB.pdf
[^9^]: NASA C-MAPSS dataset description (FD001–FD004 conditions/fault modes), IEEE DataPort. https://ieee-dataport.org/documents/c-mapss-dataset
[^10^]: DoD Condition-Based Maintenance Plus Guidebook (Aug 2024; DoDI 4151.22 definitions, decision support, P–F curve). https://www.waru.edu/sites/default/files/2024-08/CBM+%20Guidebook%20August%202024%20-%20Stamped.pdf
[^11^]: DAU summary of DoD IG DODIG-2022-103, "Audit of the DoD's Implementation of Predictive Maintenance Strategies..." https://www.dau.edu/blogs/new-dod-ig-report-cbm-and-predictive-maintenance
[^12^]: IEEE PES GM 2019 — BiLSTM classification of generator trips, line outages, self-clearing faults, data corruption; 97.8% total efficiency. https://ewh.ieee.org/soc/pes/sasc/file/PES%20GM%202019_BookOfAbstract.pdf
[^13^]: "Power System Disturbance Classification with Online Event-Driven Neuromorphic Computing," arXiv:2006.06682. https://arxiv.org/html/2006.06682v3
[^14^]: NOJA Power Intelligent Switchgear final report (ARENA) — supervised PMU event detection limits, class imbalance, open-set events. https://www.arena.gov.au/assets/2021/09/noja-power-intelligent-switchgear-final-report.pdf
[^15^]: "Online Power System Event Detection via Bidirectional GANs" (UCR) — thousands of confirmed labels needed; manual expert verification. https://intra.ece.ucr.edu/~nyu/papers/2022-Event_Detection_Bi-AnoGAN.pdf (also eScholarship qt8cp9r27q)
[^16^]: "A Power System Disturbance Classification Method Robust to PMU Data Quality Issues," IEEE (UTCN-DAE/MTCDN). https://www.researchgate.net/publication/350452038
[^17^]: Kezunovic et al., "Practical Applications of Automated Fault Analysis" (Texas A&M) — DFR expert system, <1-minute analysis, fault type/location/line report. https://kezunovic.engr.tamu.edu/wp-content/uploads/sites/282/2023/04/prac_appl_auto_fault_anal.pdf
[^18^]: "Influence of nuisance variables on the PMU-based disturbance classification in power transmission systems," at-Automatisierungstechnik (De Gruyter) — detection/identification/localization taxonomy; SSN classifiers. https://www.degruyterbrill.com/document/doi/10.1515/auto-2023-0023/html
[^19^]: "Enhancing Operational Grid Resilience Against Wildfires" (multistage decision-dependent PSPS optimization), arXiv:2608.02978. https://arxiv.org/pdf/2608.02978v1
[^20^]: NSF Award 2302015, "ERI: Resilient Operational Planning of Electricity Grid under the Risk of Wildfire" (per-line risk surrogate + ML speed-up). https://ui.adsabs.harvard.edu/abs/2023nsf....2302015M/abstract
[^21^]: Scaled Analytics, "FOQA and Flight Data Monitoring Series Part 3: Analyzing the Data" (event/exceedance detection core). https://scaledanalytics.com/2018/06/23/foqa-flight-data-monitoring-series-part-3-analyzing-flight-data/
[^22^]: Flight Safety Foundation, Flight Safety Digest Jul–Sep 1998 — FOQA exceedance validation workflow; crosswind rudder example. https://flightsafety.org/fsd/fsd_jul-sept98.pdf
[^23^]: FAA Advisory Circular AC 120-82, Flight Operational Quality Assurance (exceedance analysis, risk-based levels, gatekeeper). https://www.faa.gov/documentLibrary/media/Advisory_Circular/AC_120-82.pdf
[^24^]: Mishra & Njoku, "Fault Log Text Classification Using NLP and ML for Decision Support," IEEE Access 2022 (UK MRO fault logs). https://ieeexplore.ieee.org/document/10029587/
[^25^]: "Comprehensive analysis of aviation maintenance text reports using NLP methods," Naukovyi Visnyk NGU 2025(6):157–167 (30 CS categories, f1-macro 0.762, prototype). https://www.nvngu.in.ua/index.php/en/publication-ethics-new/1929-engcat/archive/2025/content-6-2025/7400-157
[^26^]: ICAS 2024-0083, "Application of Natural Language Processing [to aircraft textual reports for fleet management]" (risk ratings, lead-indicator defects). https://www.icas.org/icas_archive/icas2024/data/papers/icas2024_0083_paper.pdf
[^27^]: Aviation Week, "AI Fever Sweeps MRO" (American Airlines ATA-code NLP; AFI KLM E&M MRO Lab). https://aviationweek.com/mro/emerging-technologies/ai-fever-sweeps-mro-will-excitement-last
[^28^]: "Automating Aircraft Defect Report Code Classification [JASC]..." SAGE ATDE. https://journals.sagepub.com/doi/10.3233/ATDE251104
[^29^]: "Fault Prognosis of Turbofan Engines: Eventual Failure..." (N-CMAPSS; health state, eventual failure components, RUL; AUROC/AUPR > 0.95), arXiv:2303.12982. https://arxiv.org/pdf/2303.12982
[^30^]: Geotab, "How predictive maintenance reduces downtime and costs for large fleets" (DTC streaming, AI pattern matching, workshop triage, VOR). https://www.geotab.com/uk/blog/predictive-maintenance-fleet/
[^31^]: eZintegrations Goldfinch, "Intelligent Warranty Triage" (NLP failure-type classification, coverage model, 2–5% of revenue). https://ezintegrations.ai/product/warranty-claim-ai-triage/
[^32^]: "Removal of freezing effects from modal frequencies of civil structures for SHM," Engineering Structures 2024 (EOV → false alarms/mis-detection), cited in [^33^].
[^33^]: "Reducing false alarms in structural health monitoring systems by exploiting time information via Binomial Distribution Classifier," MSSP 2024. https://www.sciencedirect.com/science/article/abs/pii/S0888327023008464
[^34^]: Deraemaeker et al. / Kullaa — "Vibration-based structural health monitoring using output-only measurement under changing environment" (environmental vs. damage changes). https://www.researchgate.net/publication/256349035
[^35^]: "Railway Track Inspection Using Deep Learning Based [Acoustic]..." PMC 2022 (expert-dependent manual inspection). https://pmc.ncbi.nlm.nih.gov/articles/PMC8914836/
[^36^]: Durazo-Cardenas et al., "False alarm reduction in railway track quality inspections using machine learning," PHM Society Europe 2024. https://papers.phmsociety.org/index.php/phme/article/view/4113
[^37^]: iFactory, "AI Track Geometry Monitoring for Rail Safety" (defect classification, severity frameworks, automated CMMS work orders). https://ifactoryapp.com/industries/infrastructure-management/ai-track-geometry-monitoring-rail-safety
[^38^]: "Data-driven track geometry fault localisation using unsupervised machine learning," Construction & Building Materials 2023 (77.5%/88.9% class accuracies). https://www.sciencedirect.com/science/article/abs/pii/S095006182300853X
[^39^]: Gibert, Patel, Chellappa, "Deep Multi-task Learning for Railway Track Inspection," IEEE T-ITS (95.02% material classification). https://engineering.jhu.edu/vpatel36/wp-content/uploads/2018/08/ITS_Multitask_v6.pdf
[^40^]: Safety4Sea / Lloyd's Register, "Effective Alarm Management in the Maritime Industry" (197% alarm increase; alarm flooding; stale alarms). https://safety4sea.com/lr-report-highlights-need-for-minimizing-alarm-flooding/
[^41^]: Edge in Control, "Guide to Marine Monitoring and Control Systems" (ERAMS alarm categories, logging). https://edgeincontrol.com/marine-monitoring-control-systems-guide/
