# Jev ("System One" typed-judgment model) — Usage Catalog: Astronomy & Experimental Physics (ex-HEP)

**Scope:** Evidence-grounded usages for a fast, cheap, non-generative typed-judgment model (Choice / Noul / Score primitives over a JSON "state"; sub-100 ms latency; ~$0.04/Mtoken; many atomic questions per call, parallel over the same state). Each usage: (1) name + one-liner; (2) current practice & bottleneck; (3) concrete Jev primitive design; (4) why latency/cost matters; (5) evidence with verbatim excerpts; plus a confidence rating.

**Technology fit (recurring pattern):** These pipelines are built from thousands-to-billions of *small, stereotyped verdicts* ("is this alert real?", "is this crossmatch the right host?", "is this glitch a Blip?", "is this shot disruptive?", "is this spectrum phase X?") that today are handled by brittle hand-tuned thresholds, bespoke CNN/RF classifiers that need retraining per instrument, or scarce human attention. Jev's value proposition is a *generic, cheap, sub-100 ms, calibrated* verdict service decomposed into atomic gut-check questions and composed in code — advisory-first, not replacing precision physics algorithms.

**Cost arithmetic (worked example, Rubin scale):** ~10M alerts/night [^1^]. A compact alert-summary state (~500–1,000 tokens) + 3 atomic questions ≈ 1.5 kT/alert → 15 GT/night ≈ **$600/night** for *every* alert; restricting to the ~1M/night that survive cheap quality cuts ≈ $60/night. Compare: Fink measures ~10 alerts/s/core total throughput for its science modules, i.e., 10 s to process 10,000 alerts on 100 cores [^4^] — Jev-class inference at sub-100 ms/alert comfortably fits inside this real-time budget.

---

## A. Time-domain astronomy: survey alert brokers (Rubin/LSST, ZTF)

### A1. First-alert real–bogus & coarse transient typing
*One-liner: Noul/Choice gut-check on each new alert — "is this a real astrophysical source?" and "which of 5 coarse classes?" — to gate downstream compute and human attention.*

**Current practice & bottleneck.** Rubin/LSST will emit "up to 10 million alerts per night. This data volume makes manual inspection impossible" [^1^]; seven community brokers (ALeRCE, AMPEL, ANTARES, Babamul, Fink, Lasair, Pitt-Google) "depend on in-house and community-driven algorithms to filter, classify, and prioritize the LSST alert stream in real-time" [^1^]. ALeRCE runs a CNN "stamp classifier" on the first alert's science/reference/difference cutouts + metadata, classifying into AGN/SN/VS/asteroid/bogus with "~94%" balanced-test accuracy; from it ALeRCE "reported 6846 SN candidates … of which 971 have been confirmed spectroscopically" [^5^]. Bottleneck: bespoke CNNs per survey, retraining at survey start "when only a small number of observations per object are available, and training data is scarce" [^36^]; classifiers must be "fast to process the alerts in real-time" [^36^].

**Primitive design.**
- Noul: "This alert is a genuine astrophysical source (not an artifact/bogus)." (p + confidence) — gate for all downstream stages.
- Choice (5-way): {SN, AGN, variable star, asteroid, bogus} with probabilities — mirror of the ALeRCE taxonomy [^5^].
- Noul: "This candidate warrants same-night follow-up." — feeds TNS-report queues like SN Hunter.
- State: alert metadata (mag, seeing, RB score, crossmatch hits) + textual description of stamps; many questions per call over the same state.

**Why latency/cost.** Alerts must be triaged within the ~37 s between LSST visit batches (10,000 alerts/37 s at LSST scale [^4^]). At ~$0.04/Mtoken, whole-stream gut-checks cost tens-to-hundreds of dollars/night vs. dedicated GPU inference clusters per bespoke model; a Jev layer is cheap enough to *also* run on the 75–80% of alerts Fink finds are "either new transients, transients not previously in this catalogue or spurious detections" [^4^].

**Evidence.** [^1^] [^4^] [^5^] [^36^]. **Confidence: HIGH** — exact task shape (5-class first-alert verdict) is deployed practice today.

### A2. Contextual cross-match verdicts (host association, known-source veto)
*One-liner: Noul verdicts on candidate catalog associations — "is this transient genuinely associated with galaxy G?" — replacing/augmenting radius-rule heuristics.*

**Current practice & bottleneck.** Lasair's Sherlock cross-matches each alert's position against ~40 catalogs and assigns one of 7 classes (VS, CV, BS, NT, SN, AGN, ORPHAN) via "an intelligent ranking algorithm … a boosted decision tree" [^7^]. But "the process of attempting to associate a transient with a catalogued galaxy is relatively nuanced compared with other cross-matches as there are often a variety of data assigned to the galaxy that help to more reliably inform the decision to associate the transient with the galaxy or not" [^7^] — a fixed rule base that needs expert curation per catalog; in community practice ambiguous host assignments surface as user confusion (e.g., "'The Koala', ZTF18abvkwla … I cannot make heads or tails of the sherlock association" [^37^]).

**Primitive design.**
- Per candidate association (parallel over same alert state): Noul — "Transient T is physically associated with catalog object X (host/lens/progenitor)." 
- Choice over the top-k associations: "Which association is most plausible?" 
- Choice over Sherlock's 7 classes as a second opinion to flag rule-base edge cases.
- Noul: "This is a known-catalog source (variable star/AGN) — suppress from transient stream." (Variable stars "will make up a majority of LSST alerts" [^7^].)

**Why latency/cost.** Cross-match verdicts run per alert × per candidate match; at 10M alerts/night × ~3 matches, rule-based ranking is fast but wrong in the long tail — a $0.04/Mtoken Noul layer only on ambiguous cases (Score the rule-base confidence first) costs ≪$100/night and runs inside the broker's per-alert latency budget.

**Evidence.** [^7^] [^37^]. **Confidence: HIGH** — task exists (Sherlock decision tree); Jev offers a generalizable, uncertainty-aware substitute/complement.

### A3. Follow-up & spectroscopic-target prioritization advisory
*One-liner: Score/Choice ranking of candidates for scarce follow-up telescope time — "how worth a spectrum is this candidate, tonight?"*

**Current practice & bottleneck.** "It will be impossible to follow-up all transient candidates spectroscopically or even a subset such as all type Ia supernovae" [^2^]; follow-up "will be a scarce resource" [^38^]; the LSST TVS Roadmap repeatedly demands broker filters + ML triage to drive ToO decisions ("machine learning tools to identify this class of object … will be essential" [^35^]). Fink runs real-time active learning (ALORN) to pick targets that maximize classifier information gain [^2^]. Today each science team hand-writes filters; ranking rationale is opaque and per-team.

**Primitive design.**
- Score (rubric: must-observe / observe-if-free / monitor / drop) per candidate against a stated science goal ("early SN Ia for cosmology", "kilonova candidates").
- Noul batch: "Is this candidate's light curve consistent with a young SN Ia?" / "…with a kilonova?" / "Is it rising?"
- Choice: "Which follow-up resource fits best: {2m spectroscopy, 8m spectroscopy, photometric monitoring, none}?"
- Compose: nightly ranked observing list with probabilities + calibrated confidences.

**Why latency/cost.** Follow-up decisions must be made within minutes of the alert to catch rising transients ("70% of the reported SNe occurred within one day after the first detection" [^5^]). Telescope time is the expensive resource (hours of 8-m time); a sub-dollar advisory layer that raises purity of ToO triggers has enormous asymmetric ROI.

**Evidence.** [^2^] [^5^] [^35^] [^38^]. **Confidence: HIGH** — active-learning target selection is published practice [^2^]; Jev recasts it as composed typed judgments.

---

## B. Gravitational-wave & multi-messenger triage

### B1. GW candidate triage: astro vs. terrestrial advisory + DQ escalation
*One-liner: Noul ("astrophysical?") + Choice (BNS/NSBH/BBH/Terrestrial) second-opinion on low-latency GW candidates to cut human-vetting delay and false follow-ups.*

**Current practice & bottleneck.** LVK's Low-Latency Alert Infrastructure must send alerts "within 30 s of merger time" [^8^]; candidates get p_astro over {BNS, NSBH, BBH, Terrestrial} from pipeline-specific FGMC-style calculations [^8^][^9^], then pass automated DQ checks and a *human* advocate: "Once the event(s) have been created, there is a request for human vetting of the alert, called the Advocate Request; we find a median (90%) latency of 12.7 s (40.1 s) to notify the advocate" [^8^] and GCN preliminary median 29.5 s (90%: 171.8 s) [^8^]. During O3, many public candidates were later retracted or found marginal: events "with data-quality issues identified in real time are labeled as 'retracted'" and "with a probability of astrophysical origin p_astro < 50% after further analysis … as 'marginal'" [^39^]. GWSkyNet showed an ML second-opinion on public products "could identify noise candidates without the delay of human-based retractions or analysis updates" (93.5% test accuracy) [^10^].

**Primitive design.**
- Noul: "This candidate is astrophysical" (given p_astro vector, FAR, DQ flags, glitch context) — a GWSkyNet-style verdict as a cheap service for *every* external follow-up team, not just LVK.
- Choice: {BNS, NSBH, BBH, Terrestrial} cross-check against pipeline classification; disagreement → flag for advocate.
- Score: "Follow-up worthiness for an EM telescope with X deg² FOV."
- Noul: "DQ state near this trigger is suspicious (glitch coincidence)."

**Why latency/cost.** Follow-up telescopes decide within tens of seconds whether to slew; every retraction/marginal event burns real telescope time (SAGUARO Sankey: of O3 alerts only a handful yielded viable NS-containing follow-ups [^39^]). Event rate is low (O3: ~80 alerts/run), so cost is trivial — latency and 24/7 reliability are the binding constraints; sub-100 ms verdicts fit before human vetting returns.

**Evidence.** [^8^] [^9^] [^10^] [^39^]. **Confidence: HIGH** — GWSkyNet is a direct existence proof of the second-opinion verdict pattern.

### B2. Glitch classification & citizen-science routing (Gravity Spy)
*One-liner: Choice over ~23–27 glitch morphological classes + Score of classification confidence to route glitches between machine, novice, and expert volunteers.*

**Current practice & bottleneck.** LIGO data are plagued by "transient, non-Gaussian bursts of noise … known as glitches" [^12^]. Gravity Spy couples a CNN classifier with Zooniverse volunteers; since 2016 it "has analysed almost 2 million individual glitches and has accumulated over 5.7 million classifications by more than 27,000 registered Zooniverse users" [^12^], with 23 classes in recent models [^13^]. Critically, routing is confidence-driven: "Based on the machine learning confidence of the classification of each image, it is routed either to beginning, intermediate, or advanced workflows" [^11^]; the ML "can struggle when new types of glitches appear" [^40^]. Bottleneck: the CNN is bespoke per era/detector; well-calibrated confidence is what drives the whole socio-computational system.

**Primitive design.**
- Choice: glitch class over the current taxonomy (probabilities + confidence) from spectrogram-derived state.
- Score: "How novel/anomalous is this morphology?" (rubric: known-class-clean → known-class-odd → likely-new-class) — feeds "None of the Above" discovery workflow.
- Choice: routing verdict {retire-as-classified, send-to-beginners, send-to-advanced, escalate-to-experts} — exactly the workflow logic of [^11^].
- Noul: "Auxiliary channel X shows the coupling origin of this glitch." (the new aux-channel investigation direction [^36b^]).

**Why latency/cost.** Omicron triggers arrive continuously during observing runs; classification must keep pace with the live stream. Volunteer time is the scarce resource — better calibrated first-pass verdicts directly reduce wasted human classifications (the Caesar/Camera CATalogue result: model+2-volunteer agreement "reduc[ed] human effort by 43% while maintaining overall accuracy" [^30^]).

**Evidence.** [^11^] [^12^] [^13^] [^30^] [^40^]. **Confidence: HIGH** — the confidence-routed human/machine loop is the published Gravity Spy architecture.

### B3. High-energy neutrino alert triage (IceCube Gold/Bronze ecosystem)
*One-liner: Noul/Score on each IceCube alert — "astrophysical?" and "worth a ToO?" — calibrated to the follow-up community's actual decision rules.*

**Current practice & bottleneck.** IceCube issues ~30 alerts/yr classified by "signalness" = N_sig/(N_sig+N_bkg): Gold ≳50% mean astrophysical purity, Bronze ~30% [^14^][^15^]. But the stream label is a poor decision variable: "individual Bronze alerts have been reported with signalness values greater than 50% … and Gold alerts … with signalness values less than 15%. We therefore ignore the labelling of these streams, and select exclusively based on the signalness and localisation" [^16^] — i.e., every follow-up group re-implements its own ad-hoc triage on signalness + 90% area + catalog coincidences (Fermi-LAT follow-up found 44/101 alerts had no 4FGL counterpart candidate [^41^]).

**Primitive design.**
- Score: follow-up worthiness rubric combining signalness, localization area, Galactic plane veto, catalog-coincidence context (blazar in error box?).
- Noul: "A plausible EM counterpart candidate exists within the 90% region."
- Choice: {Gold-like, Bronze-like, sub-threshold-ignore} recalibrated per facility's resource cost.

**Why latency/cost.** Alerts arrive ~min after detection and counterparts fade fast; IACTs/ToO programs decide in minutes. Only ~30 events/yr — cost is irrelevant; the value is a *shared, calibrated* verdict replacing per-group hand-rolled cuts, and extending triage to the much larger sub-threshold stream (IceCat-1 archival reprocessing [^14^]) where cheap judgment at volume matters.

**Evidence.** [^14^] [^15^] [^16^] [^41^]. **Confidence: MEDIUM-HIGH** — decision pattern is documented; Jev fit is as advisory layer, not the signalness computation itself.

---

## C. Fusion & plasma experiments

### C1. Disruption-prediction advisory layer (tokamaks)
*One-liner: Noul ("disruption within Δt?") + Choice (likely disruption cause) as a redundant, cheap second opinion alongside PCS-embedded predictors.*

**Current practice & bottleneck.** Disruptions threaten machine safety; ML predictors are deployed in plasma control systems: DIII-D's DPRF "embedded … directly into the plasma control system, achieving warning times of several hundred milliseconds over more than 900 discharges" [^17^]; J-TEXT's hybrid NN closes density-feedback loops "when a disruption is predicted, the gas puffing control valve is closed immediately … average warning time of about 40 ms" [^17^]; FRNN (Nature 2019) targets cross-machine prediction [^18^]; KSTAR/EAST run real-time RF predictors [^17^]. Key requirement: ">95% predictive accuracy to provide advanced warning for disruption avoidance/mitigation" [^19^]. Bottlenecks: machine-specific retraining, false-alarm/mitigation tradeoff, and operator trust — an advisory layer that explains *why* in verdict form is missing.

**Primitive design.**
- Noul (per ~ms–s control cycle, advisory): "Current discharge trajectory is heading toward disruption within 100 ms / 500 ms."
- Choice: dominant risk channel {density limit, tearing mode/NTM, vertical instability, radiative collapse, H–L back-transition} — mirrors mode-identification literature (AE classification, MHD recognizers [^42^]).
- Score: "Shot quality / proximity to safe-operating boundary" post-shot verdict for run-day planning (cf. "real-time estimation of the safe operating region and disruption proximity" [^43^]).
- Noul: "This shot's diagnostics are anomalous — flag for review before next shot."

**Why latency/cost.** "Important decisions must be made every millisecond to control a plasma" [^44^] — hard real-time actuation stays on embedded RF/NN; Jev's sub-100 ms roadmap (sub-10 ms) suits the *advisory/second-opinion and between-shot* loop, where today humans "examine the system, make a judgement, and perform an action" [^45^]. Thousands of shots/year/device × cheap verdicts = negligible cost; value is cross-machine generality without retraining a bespoke model per diagnostic set.

**Evidence.** [^17^] [^18^] [^19^] [^42^] [^43^] [^44^] [^45^]. **Confidence: MEDIUM-HIGH** — prediction is established; the *composable advisory verdict layer* is the novel-but-natural fit.

---

## D. Quantum experiments

### D1. Qubit readout discrimination support & multiplexed-state verdicts
*One-liner: Choice over qubit-state assignments {0,1,leakage} with calibrated probabilities as a software-layer discriminator and sanity check.*

**Current practice & bottleneck.** "Qubit readout is one of the most error-prone and slowest operations on a superconducting quantum processor … readout errors can range from 1–10%" [^21^]. State of the art embeds small NNs on FPGAs (96% fidelity at 32 ns inference on QICK/hls4ml [^20^]; HERQULES matched-filter+NN [^21^]; trapped-ion CNN: 99.5% fidelity in 171 µs [^22^]) precisely because "the overhead of software-based classification … the resulting latency often exceeds the qubit coherence time. Therefore, readout discriminators must be implemented on dedicated hardware" [^21b^]. Bottleneck for software/hybrid layers: threshold discriminators drift and per-qubit classifiers need frequent re-calibration [^46^].

**Primitive design.**
- NOT the ns-scale in-loop discriminator (that stays on FPGA). Jev layer = per-shot-batch verdicts:
- Choice: {ground, excited, leakage/out-of-spec} per qubit from IQ-blob statistics + recent calibration state.
- Noul: "Readout discriminator for qubit i has drifted out of spec — recalibrate." 
- Choice: which calibration action next {re-threshold, re-run Rabi, re-run readout-amplitude sweep, flag qubit bad}.
- Parallel over all qubits of a chip in one call pattern (many questions, same state).

**Why latency/cost.** Verdicts run per calibration cycle / per experiment batch (ms–s scale), not per single shot; but they run *constantly* across 100+ qubit devices — cheap, parallel atomic questions map exactly onto per-qubit/per-parameter checks. Calibrated probabilities feed automated bring-up agents that currently burn expert hours (next usage).

**Evidence.** [^20^] [^21^] [^22^] [^46^]. **Confidence: MEDIUM-HIGH.**

### D2. Calibration campaign verdicts & anomaly triage for quantum processors
*One-liner: Score/Noul gut-checks on every calibration step's output — "did this fit converge? is this trace anomalous?" — the judgment fabric for autonomous bring-up agents.*

**Current practice & bottleneck.** Bring-up of large processors is human-limited: scripted routines "cannot diagnose anomalous signals or adapt to drift … forcing experts to remain in the loop to interpret noisy traces, fit weak signals, and track parameter drift" [^23^]. An LLM-agent demonstration calibrated a 112-qubit processor in 4.7 h vs. "18–24 h" for an expert, "with the 4–5× speedup stem[ming] primarily from the agent's continuous, non-stop run and sub-second anomaly diagnosis" [^23^]. Bottleneck: each step's decision logic ("validate ADC trace", "accept/reject spectroscopy peak", "is this Rabi oscillation real?") is a small judgment, today hard-coded per lab or expensive-LLM-per-step.

**Primitive design.**
- Noul per step: "Fit converged to a physically sensible value." / "This spectrum contains a genuine qubit peak." / "Coherence time degraded vs. baseline — investigate."
- Score: per-qubit health grade (A–F rubric) assembled from the step verdicts.
- Choice: next-action routing in the calibration decision tree {accept & proceed, retry with wider sweep, deprioritize qubit, escalate to human}.
- Atomic decomposition = exactly the "decision tree rather than a flat script" structure of [^23^], but with each node a $0.04/Mtoken, sub-100 ms typed verdict instead of a generative call.

**Why latency/cost.** A full bring-up involves ~10⁴–10⁵ micro-verdicts; at generative-LLM prices/latencies this dominates the 4.7 h session — at Jev prices it's ~$1-scale and sub-second, keeping the agent's "sub-second anomaly diagnosis" advantage while slashing cost and variance.

**Evidence.** [^23^]. **Confidence: HIGH** — published agent workflow explicitly decomposes calibration into stepwise accept/reject decisions.

---

## E. Materials characterization & microscopy

### E1. XRD phase-identification support verdicts
*One-liner: Noul per candidate phase ("is phase X present in this pattern?") + Choice over shortlisted phases, composing into a multiphase verdict before refinement.*

**Current practice & bottleneck.** "Automated phase identification remains challenging, particularly for multiphase samples with overlapping peaks and experimental artifacts" [^24^]; classical search-match is "largely manual, time-consuming, error-prone and not scalable" [^25^]. GALAXI decouples the task "into independent one-versus-all binary classifiers that each specialize in recognizing a single phase" then uses Rietveld refinement on the shortlist — reaching micro-F1 0.935 on experimental patterns, robust to "low impurity phase fractions, small crystallite size, peak shifts, sample displacement, and texture" [^24^]. The XCA agent performs "autonomous phase identifications from XRD data while it is measured" [^25^].

**Primitive design.**
- Parallel Noul battery: "Pattern contains phase X?" for the top-k candidate phases from a fast retrieval step — a drop-in semantic replacement for GALAXI's one-vs-all heads, with probabilities + confidence.
- Choice: "Which single phase dominates?" 
- Noul: "This pattern has artifacts (preferred texture/displacement) — downweight verdict." 
- Choice: route {auto-accept shortlist, send to Rietveld, send to human expert}.

**Why latency/cost.** High-throughput material libraries generate patterns continuously at beamlines; per-pattern verdicts must keep pace with acquisition ("while it is measured" [^25^]) — sub-100 ms verdicts and ~$0.04/Mtoken pricing make one-vs-all Noul batteries (k≈10–50) cost cents per sample.

**Evidence.** [^24^] [^25^]. **Confidence: HIGH** — GALAXI's one-vs-all decomposition is isomorphic to a parallel Noul battery.

### E2. Cryo-EM / microscopy image triage routing
*One-liner: Score/Choice on grids, squares, holes, and micrographs — "is this worth imaging/processing?" — the multi-level reject/keep funnel.*

**Current practice & bottleneck.** Cryo-EM acquisition is "a highly iterative and empirical screening process … This arduous, multi-step data acquisition process represents a bottleneck for obtaining a high throughput data collection" [^26^]. Tools: XCryoNet scores low-mag square images [^26^]; SmartScope "employs deep-learning-based object detection to identify and classify features suitable for imaging … in a fully automated manner" [^27^]; micrograph quality curation "scales poorly to large datasets and often misclassifies images" (prismPYP motivation [^27b^]); automated pipelines remove bad micrographs with no user input [^47^].

**Primitive design.**
- Score per grid square / hole / micrograph: quality rubric (excellent → unusable) from image-derived features + metadata.
- Noul: "Ice too thick / contaminated / crystalline." / "Particle density adequate." 
- Choice: routing {collect here, collect at lower priority, skip, re-screen}.
- Noul: "CTF estimate trustworthy?" — gating downstream processing.

**Why latency/cost.** Modern Krios + direct detectors produce thousands of micrographs/session and microscope time is ~$50–100+/h; every kept-bad or dropped-good micrograph is direct money. Screening verdicts must be near-real-time during collection; cheap atomic verdicts let facilities re-score *every* image rather than subsample.

**Evidence.** [^26^] [^27^] [^27b^] [^47^]. **Confidence: HIGH.**

---

## F. Neutron/muon & photon facilities

### F1. Beamline experiment steering & data-reduction routing
*One-liner: Choice/Noul verdicts on each new measurement — "did the phase transition occur? keep scanning or move?" and "which reduction pipeline applies?"*

**Current practice & bottleneck.** ORNL commissioned "autonomous neutron powder diffraction experiments … at the NOMAD and POWGEN beamlines" where ML navigated a magnetic phase transition (Morin temperature of hematite), built on INTERSECT / DIALED active-learning infrastructure, with the goal of "significant reduction in experimental time required for neutron diffraction experiments and better exploration of parameter space with the constraint of finite beamtime" [^28^]. ML is also used to invert and cluster neutron-scattering data automatically, "tolerant of artifacts in untreated data" [^29^]. Bottleneck: beamtime is oversubscribed and decisions between measurements are expert-driven; reduction-path choices (event-mode binning, corrections) are manual presets.

**Primitive design.**
- Noul per measurement: "Signal of interest detected (transition crossed / feature resolved)." 
- Choice: next action {refine grid locally, jump region, increase counting time, stop measurement}.
- Choice: data-reduction routing {standard pipeline, event-mode custom reduction, flag for manual}.
- Score: per-run data-quality grade for the proposal's final dataset.

**Why latency/cost.** Verdicts must land between acquisitions (seconds–minutes) to steer the experiment; each steering decision saves expensive beam minutes. Cheap composed verdicts make always-on advisory loops feasible for general-user programs without per-experiment ML engineering [^28^].

**Evidence.** [^28^] [^29^]. **Confidence: MEDIUM-HIGH.**

---

## G. Citizen science & telescope operations

### G1. Citizen-science pre-classification & effort routing (Zooniverse-scale)
*One-liner: Noul/Choice first-pass on every subject + routing verdict — auto-retire easy cases, send only informative ones to humans.*

**Current practice & bottleneck.** Zooniverse integrates ML via Caesar: Supernova Hunters auto-rejects low-confidence subjects offline; Camera CATalogue "considers an image classified if the first two volunteers agree with the model's prediction, reducing human effort by 43% while maintaining overall accuracy" [^30^]; Galaxy Zoo's "Enhanced Workflow" retrains a Bayesian CNN weekly, which "quickly becomes expert at classifying the simplest galaxies, while identifying more complex galax[ies] which need to be shown to the human volunteers" [^31^], and ZooBot "pre-screens images, auto-labelling simple cases and flagging complex ones" [^32^]. Simulations show "at least a factor of eight increase in the classification rate" from near-real-time active learning [^30^]. Bottleneck: each project must train/deploy its own model; many small projects lack ML expertise [^30^].

**Primitive design.**
- Choice: subject class with calibrated probabilities (per project taxonomy).
- Score: "How informative is this subject for a human to see?" (retire / 1-volunteer-confirm / full-crowd / expert).
- Noul: "Machine+first-volunteer agreement is trustworthy — retire now."
- A *generic* verdict service any Zooniverse project can adopt without training a bespoke CNN — the stated gap in [^30^].

**Why latency/cost.** Zooniverse hosts hundreds of millions of subjects; per-subject cost must be ~$0 to be viable — $0.04/Mtoken makes whole-corpus pre-triage economically sane for the first time (e.g., 100M subjects × ~300 T ≈ $1.2k).

**Evidence.** [^30^] [^31^] [^32^]. **Confidence: HIGH.**

### G2. Telescope operations: exposure quality verdicts & scheduling advisory
*One-liner: Score per exposure ("grade 1–5, validate or repeat?") + Choice on conditions — the night assistant's gut check.*

**Current practice & bottleneck.** At CFHT, after each exposure the remote observer "assigns a grade to the exposure (ranging from 1 to 5 in order of decreasing quality) … if the exposure is not validated due to poor quality, the RO has to repeat the exposure", and a morning QC re-examines everything, noting "there is a certain degree of 'fuzziness' in both the grading and the validation of exposures" [^33^]. All-sky cloud monitoring for scheduling is automated in places: PSO+XGBoost on all-sky images hit "96.91%" accuracy with "classification time … 0.975 s … met the real-time requirements of the telescope scheduling program" [^34^]. Bottleneck: human-in-the-loop grading all night; scheduling reacts to conditions on minute timescales.

**Primitive design.**
- Score: exposure-quality grade (1–5 rubric) from IQ/attenuation/sky-background + PI requirements — mirroring the CFHT scheme [^33^].
- Noul: "Repeat this exposure now." / "Conditions degraded below program threshold."
- Choice: scheduler advisory {continue queue, switch program, close for clouds, switch to backup targets}.
- Noul: all-sky image clear/cloudy/moon verdicts as scheduling inputs (à la [^34^]).

**Why latency/cost.** Decisions recur every exposure (~30 s–few min) all night at every telescope; a cheap, always-on, consistent verdict layer removes inter-observer grading variance ("fuzziness" [^33^]) and frees night staff. Per-observatory volume (~10³ verdicts/night) makes cost a non-issue; consistency + latency are the wins.

**Evidence.** [^33^] [^34^]. **Confidence: HIGH.**

---

## Cross-cutting observations

1. **The "verdict fabric" pattern:** In every domain, expensive assets (spectrograph hours, beamline minutes, Krios time, qubit chips, plasma shots, volunteer attention) are gated by streams of small, repeated, stereotyped judgments. Today these are bespoke per-instrument models or humans. A generic typed-judgment service commoditizes the *judgment layer*.
2. **Advisory-first safety posture:** In control loops (tokamak PCS, FPGA readout, GW public alerts) Jev fits as second opinion/router/escalator — hard actuation stays with certified embedded systems (J-TEXT valve closure [^17^], QICK 32 ns inference [^20^]).
3. **Economics flip at Rubin scale:** 10M alerts/night [^1^] makes per-alert generative-AI absurd but per-alert typed judgment at $0.04/Mtoken ≈ $10²/night — i.e., an entire new design point: *every* alert gets a reasoned multi-question verdict, not just filtered survivors.
4. **Calibration of confidence is the product:** Gravity Spy routing [^11^], Caesar retirement rules [^30^], and IceCube follow-up selection [^16^] all hinge on calibrated probabilities/confidence — native outputs of Choice/Noul/Score primitives.

---

## References

[^1^]: "Rapid Response Triggering for Radio Transients with the SKA Observatory," arXiv:2607.03024 — "up to 10 million per night. This data volume makes manual inspection impossible… brokers depend on in-house and community-driven algorithms to filter, classify, and prioritize the LSST alert stream in real-time." https://arxiv.org/html/2607.03024v1
[^2^]: "Real-Time Active Learning for optimised spectroscopic follow-up: Enhancing early SN Ia classification with the Fink broker," arXiv:2502.19555 — "It will be impossible to follow-up all transient candidates spectroscopically…" https://arxiv.org/html/2502.19555v2
[^3^]: "The ANTARES Astronomical Time-Domain Event Broker," arXiv:2011.12385 — Filter Pipeline runs on each Locus per Alert; Touchstone for training/deploying filters. https://arxiv.org/html/2011.12385v2
[^4^]: Möller et al. 2021, "Fink, a new generation of broker for the LSST community," MNRAS 501, 3272 — "The total combined throughput is about 10 alerts/second/core, that is a total latency of 10 seconds to process 10,000 alerts on 100 cores"; "10,000 alerts received every 37 seconds"; only 20–25% of alerts match known Simbad objects. https://cnrs.hal.science/hal-03045627/file/2009.10185.pdf
[^5^]: Carrasco-Davis et al. 2021, "Alert Classification for the ALeRCE Broker System: The Real-time Stamp Classifier," AJ 162, 231 (arXiv:2008.03309) — 5-class CNN (AGN/SN/VS/asteroid/bogus), ~94% balanced accuracy; 6846 SN candidates reported, 971 spectroscopically confirmed; 70% within one day of first detection. https://arxiv.org/pdf/2008.03309
[^6^]: Pignata et al. 2025, "ALeRCE light curve classifier: Tidal disruption event expansion pack," A&A — two-level BRF, 16 subclasses / 176 features; "circumvent the bottleneck created by limited spectroscopic resources." https://www.aanda.org/articles/aa/full_html/2025/04/aa51951-24/aa51951-24.html
[^7^]: "Enabling Science from the Rubin Alert Stream with Lasair," arXiv:2404.08315 — Sherlock: 7-class contextual classifier; "The process of attempting to associate a transient with a catalogued galaxy is relatively nuanced…"; "known variable stars … will make up a majority of LSST alerts." https://arxiv.org/html/2404.08315v1
[^8^]: Chaudhary et al. 2024, "Low-latency gravitational wave alert products and their performance … O4," ApJS (arXiv:2308.04545) — 30 s alert goal; CBC median latency 12.3 s; Advocate Request median 12.7 s; GCN preliminary median 29.5 s (90% 171.8 s). https://arxiv.org/html/2308.04545v4
[^9^]: IGWN Public Alerts User Guide — alert Classification block: P(BNS)/P(NSBH)/P(BBH)/P(Terrestrial) + HasNS/HasRemnant/HasMassGap. https://rtd.igwn.org/projects/userguide/en/v17.1/content.html
[^10^]: Cabero et al. 2020, "GWSkyNet: A Real-time Classifier for Public Gravitational-wave Candidates," ApJL 904, L9 — 93.5% accuracy; "could identify noise candidates without the delay of human-based retractions or analysis updates." https://iopscience.iop.org/article/10.3847/2041-8213/abc5b5/pdf
[^11^]: Zevin et al. 2017, "Gravity Spy: integrating advanced LIGO detector characterization, machine learning, and citizen science," CQG 34, 064003 — "Based on the machine learning confidence … routed either to beginning, intermediate, or advanced workflows." https://pmc.ncbi.nlm.nih.gov/articles/PMC5927381/
[^12^]: Zevin et al. 2024 (CQG, arXiv:2208.12849), "Data quality up to O3 … Gravity Spy glitch classifications" — "almost 2 million individual glitches … over 5.7 million classifications by more than 27,000 registered Zooniverse users." https://arxiv.org/pdf/2208.12849
[^13^]: Wu et al. 2025, "Advancing glitch classification in Gravity Spy: multi-view fusion with attention-based machine learning for O4," CQG — 23 glitch classes, 4 time-window spectrograms. https://iopscience.iop.org/article/10.1088/1361-6382/adf58b
[^14^]: "Identifying multiplets of IceCube alert events," arXiv:2503.03610 — Gold ≈50% / Bronze ≈30% mean signal purity; ~11 Gold events/yr; signalness definition. https://arxiv.org/html/2503.03610v1
[^15^]: NASA GCN IceCube mission page — p_astro (formerly signalness) in gcn.notices.icecube.gold_bronze_track_alerts schema. https://gcn.nasa.gov/missions/icecube
[^16^]: "Neutrino follow-up with the Zwicky Transient Facility: Results from the first 24 campaigns," arXiv:2203.17135 — "We therefore ignore the labelling of these streams, and select exclusively based on the signalness and localisation." https://arxiv.org/html/2203.17135v3
[^17^]: "A real-time disruption prediction and mitigation system for the EXL-50U spherical torus," arXiv:2608.22720 — DPRF "warning times of several hundred milliseconds over more than 900 discharges"; J-TEXT "average warning time of about 40 ms"; KSTAR/EAST real-time RF predictors; refs to Rea 2019 NF 59 096016, Hu 2021, Zheng 2018, Lee 2023/2025. https://arxiv.org/html/2608.22720v1
[^18^]: Kates-Harbeck, Svyatkovskiy & Tang 2019, "Predicting disruptive instabilities in controlled fusion plasmas through deep learning," Nature 568, 526–531 (FRNN).
[^19^]: "Applications and Techniques for Fast Machine Learning in Science" (arXiv:2110.13041) — ITER requires "better than 95% predictive accuracy to provide advanced warning for disruption avoidance/mitigation." https://arxiv.org/pdf/2110.13041v1.pdf
[^20^]: "End-to-end workflow for machine learning-based qubit readout with QICK and hls4ml," arXiv:2501.14663 — "96% single-shot fidelity with a latency of 32 ns." https://arxiv.org/html/2501.14663v1
[^21^]: Maurya et al., "HERQULES: Scaling Qubit Readout with Hardware Efficient Machine Learning Architectures," ISCA 2023 (arXiv:2212.03895) — "readout errors can range from 1–10%"; 16.4% relative accuracy improvement. https://arxiv.org/pdf/2212.03895v1.pdf
[^21b^]: KLiNQ, arXiv:2503.03544 — "the overhead of software-based classification … the resulting latency often exceeds the qubit coherence time. Therefore, readout discriminators must be implemented on dedicated hardware." https://arxiv.org/pdf/2503.03544
[^22^]: Ding et al., "Fast and High-Fidelity Readout of Single Trapped-Ion Qubit via Machine Learning Methods," arXiv:1810.07997 — 99.5% fidelity in 171 µs; NN halves detection time vs threshold/ML. https://arxiv.org/html/1810.07997v2
[^23^]: "Vibe Calibration: Autonomous Bring-up of a 112-Qubit Superconducting Quantum Processor by a Skill-Orchestrating Language Agent," arXiv:2606.22376 — 4.7 h vs 18–24 h expert; "sub-second anomaly diagnosis"; decision-tree workflows with per-step validation. https://arxiv.org/html/2606.22376v1
[^24^]: "GALAXI: Scalable machine learning framework for multiphase identification from powder X-ray diffraction," arXiv:2609.06908 — one-vs-all binary classifiers + Rietveld shortlist; micro-F1 0.935. https://arxiv.org/abs/2609.06908
[^25^]: Brookhaven/Ruhr-Bochum, "AI agent helps identify material properties faster" (XCA, Nature Communications 2021) — XRD analysis "largely manual, time-consuming, error-prone and not scalable"; XCA does "autonomous phase identifications from XRD data while it is measured." https://www.bnl.gov/newsroom/news.php?a=218824
[^26^]: "XCryoNet: Attention-guided Quality Assessment for Automated Cryo-EM Grid Screening," arXiv:2007.05593 — screening "represents a bottleneck for obtaining a high throughput data collection." https://arxiv.org/abs/2007.05593
[^27^]: Duke cryo-EM methods page — SmartScope "first framework to streamline, standardize, and automate specimen evaluation … deep-learning-based object detection to identify and classify features suitable for imaging." https://cryoem.cs.duke.edu/research/methods/cryo-em/
[^27b^]: prismPYP (Duke) — "Manual micrograph curation scales poorly to large datasets and often misclassifies images." Same URL as [^27^].
[^28^]: 2025 MRS Fall Meeting program (ORNL) — autonomous neutron powder diffraction at NOMAD/POWGEN with INTERSECT/DIALED; "significant reduction in experimental time … with the constraint of finite beamtime." https://www.mrs.org/docs/default-source/meetings-events/fall-meetings/2025/2025-mrs-fall-meeting-program.pdf
[^29^]: Samarakoon & Tennant, "Machine learning for neutron scattering" (arXiv:2011.05685) — autoencoders/clustering for automated phase-diagram extraction, "tolerant of artifacts in untreated data." https://arxiv.org/pdf/2011.05685
[^30^]: "Optimizing the Human-Machine Partnership with Zooniverse," arXiv:1809.09738 — Caesar decision engine; Camera CATalogue "reduc[ed] human effort by 43% while maintaining overall accuracy"; "at least a factor of eight increase in the classification rate" (active learning); "many research groups do not have the expertise to train these models." https://arxiv.org/html/1809.09738v1
[^31^]: "Twelve Years of Galaxy Zoo," arXiv:1910.08177 — Enhanced Workflow Bayesian CNN retrained weekly, auto-classifies simple galaxies, routes complex ones to humans. https://arxiv.org/pdf/1910.08177.pdf
[^32^]: Galaxy Zoo blog (Zoobot/Bayesian CNNs) + arXiv:2511.03016 — "ZooBot AI pre-screens images, auto-labelling simple cases and flagging complex ones for humans." https://blog.galaxyzoo.org/tag/machine-learning/ ; https://arxiv.org/pdf/2511.03016
[^33^]: "Artificial Intelligence in Autonomous Telescopes" (CFHT) — observer grades exposures 1–5, repeats unvalidated ones; "a certain degree of 'fuzziness' in both the grading and the validation of exposures." https://www.cfht.hawaii.edu/~billy/pubs/ASO_tfa_v0.pdf
[^34^]: "Automatic Classification of All-Sky Nighttime Cloud Images Based on Machine Learning," Electronics 13(8):1503 — PSO+XGBoost 96.91% accuracy, 0.975 s/image, "met the real-time requirements of the telescope scheduling program." https://www.mdpi.com/2079-9292/13/8/1503
[^35^]: "Rubin Observatory LSST Transients and Variable Stars Roadmap," arXiv:2208.04499 — "machine learning tools to identify this class of object … will be essential." https://arxiv.org/html/2208.04499v1
[^36^]: "Multiband embeddings of light curves," arXiv:2501.12499 — classifiers must "be fast to process the alerts in real-time"; cold-start "when … training data is scarce." https://arxiv.org/pdf/2501.12499
[^36b^]: Zevin et al. 2024, "Gravity Spy: lessons learned and a path forward," EPJ Plus 139:100 — Gravity Spy "now providing volunteers with more complicated data that includes auxiliary monitors of the detector to identify the root cause of glitches." https://ui.adsabs.harvard.edu/abs/2024EPJP..139..100Z/abstract
[^37^]: Rubin LSST Community forum, "Host galaxy association for ZTF alerts in Lasair" — user confusion over Sherlock associations; API needed to see all possible crossmatches. https://community.lsst.org/t/host-galaxy-association-for-ztf-alerts-in-lasair/9582
[^38^]: ESO LSST-follow-up booklet (2024) — "Dedicated rapid follow-up spectroscopic observations of transient events … will be a scarce resource." https://www.eso.org/sci/meetings/2024/LLST2024/240122_LSST_booklet.pdf
[^39^]: Lundquist et al. 2024, "SAGUARO: Time-domain Infrastructure for the Fourth Gravitational-wave Observing Run and Beyond," ApJ 966:137 — O3 alert outcomes Sankey: retracted/marginal events; few NS-containing follow-ups. https://iopscience.iop.org/article/10.3847/1538-4357/ad2170
[^40^]: "New Gravity Spy glitch classes" (arXiv:2508.13923) — ML "can struggle when new types of glitches appear"; 37,000 volunteers; new-class discovery workflow. https://arxiv.org/pdf/2508.13923
[^41^]: "Fermi-LAT follow-up observations in seven years of real-time high-energy neutrino alerts," arXiv:2401.06666 — 101 alerts (37 Gold/64 Bronze); 44 without any 4FGL-DR3 counterpart. https://arxiv.org/pdf/2401.06666v2
[^42^]: "Identification of MHD modes on EAST using a deep learning framework" — real-time ML feedback avoiding TMs/disruptions in DIII-D; TCN+LSTM MHD recognizers. https://www.researchgate.net/publication/376462773
[^43^]: "Full Shot Predictions for the DIII-D Tokamak via Deep Recurrent Networks," arXiv:2404.12416 — cites Boyer et al., "real-time estimation of the safe operating region and disruption proximity," NF 62, 026005 (2021). https://arxiv.org/html/2404.12416v1
[^44^]: PPPL news (2024) — "Important decisions must be made every millisecond to control a plasma" (Kolemen group, Nature 2024 tearing-avoidance DRL). https://www.pppl.gov/news/2024/using-artificial-intelligence-speed-up-and-improve-most-computationally-intensive-aspects
[^45^]: Tang (PPPL) IAEA TM slides — traditional control: "'Sysadmin' examines the system, makes a judgement, and performs an action"; FRNN deployment as web-like service in PCS. https://nucleus.iaea.org/sites/fusionportal/Pages/DPWS-6/TM%20Fusion%20Data%20Processing%20Validation%20and%20Analysis/5_Friday/Session%20IX%20Deep%20Learning/1045%20Tang%20W.pdf
[^46^]: Nielsen, "Statistical methods for single-shot readout discrimination in superconducting qubits" (KU bachelor project) — "there are no standardized method[s] of classifier determination"; classifiers need frequent re-calibration due to drift. https://nbi.ku.dk/english/theses/bachelor-theses/malthe-nielsen/Bachelor_project___Statistical_methods_for_single_shot_readout_discrimination_in_superconducting_qubits.pdf
[^47^]: Gittins thesis (Newcastle 2024) — automated cryo-EM pre-processing: "Bad micrographs are removed … without any user decisions or inputs necessary." https://theses.ncl.ac.uk/jspui/bitstream/10443/6436/1/GittinsO2024.pdf

---
*Research method: 18 web-search queries (coarse → fine) across brokers, GW, neutrinos, fusion, quantum, materials, microscopy, facilities, citizen science, and telescope ops; primary sources prioritized (arXiv, facility/journal pages). All quoted excerpts verbatim from cited sources.*
