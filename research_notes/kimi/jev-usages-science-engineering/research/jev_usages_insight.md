# Cross-Dimension Insights — Jev "System One" Typed-Judgment Model

Patterns that are only visible by comparing the 13 dimension catalogs (`jev_usages_dim01.md`–`jev_usages_dim13.md`). Each insight: statement, derived-from (dimension refs + original sources), rationale, implications, confidence. Companion document: `jev_usages_cross_verification.md` (cluster tiers and conflicts).

---

## I1. The universal loop: "generate expensively, judge cheaply"

**Statement.** In every dimension, the winning architecture pairs Jev with an expensive component and moves the *filter/route/rank/verify* decision into a sub-100ms typed call: the expensive resource (frontier LLM, ATP run, SMT query, what-if call, spectrograph hour, GPU serving, human expert) is invoked only for items the cheap judgment cannot settle.

**Derived from.** [dim01] SDE cascade cookbook (mini-model extracts → Jev verifies → reasoning model on flagged fields; "most of a ≈$0.10/extraction's quality at a fraction of its cost"); [dim02] guardrail/RCA two-tiers (79s RCLAgent vs 8ms PRISM; escalate to LLM judge only on low confidence); [dim03] index-advisor pre-filtering of multi-second what-if calls; [dim08] explicit observation #1 ("generate expensively, judge cheaply": premise filtering before ATP, candidate pruning before SMT); [dim09] SMAC surrogate pre-filtering, hint selection over authored content; [dim11] BO candidate pre-filtering before acquisition evaluation, review-by-exception; [dim13] FrugalGPT (98% cost reduction), RouteLLM (85% cost cut at 95% quality), speculative cascades.

**Rationale.** Five independent research communities (LLM-serving economics, databases, theorem proving, laboratory automation, process operations) converged on the identical two-stage topology without reference to each other. The decider's *calibration*, not its power, is the binding constraint in every version [dim13 §1].

**Implications.** Jev's market is not "tasks LLMs do badly" but "the judgment layer inside systems that already exist." Evaluators should benchmark Jev as a cascade component (cost-quality Pareto of the whole system), never as a standalone classifier. The vendor's own SDE cookbook [dim01 ^18^] is the reference implementation.

**Confidence: Very high** (convergent across ≥6 dimensions + peer-reviewed theory).

---

## I2. The ubiquitous three-layer stack: deterministic/statistical layer → semantic adjudication → gated human

**Statement.** Independently of domain, catalogs converge on the same insertion point: a numeric/rule layer (thresholds, PCA/T², PCA-class detectors, rules engines, CAMEO tables, statistical tests) produces signals; Jev supplies the *semantic adjudication* those signals raise (is it real? which class? who acts?); deterministic gates and humans retain consequential action. Jev composes *with* classical ML; it does not replace it.

**Derived from.** [dim05] cross-cutting thesis: "semantic adjudication layer" above ISO 13374 blocks; [dim03] five recurring gaps classical models structurally cannot fill (text the features drop; intent vs. mechanism); [dim10] cross-cutting #1: "numeric layer → Jev semantic verdict layer → human decision… Jev never writes to control outputs"; [dim12] composition pattern: "deterministic rules/data + Jev semantic verdicts + confidence-gated human escalation"; [dim04] validator-gated ASM architecture (derived quantities upstream, model judgment middle, programmatic validation downstream); [dim06] advisory layer around deterministic classifiers (frozen blinded cuts preserved).

**Rationale.** The same bottleneck appears verbatim in each literature: detectors detect but cannot interpret context that lives in text (tickets, alarm text, maintenance notes, SDS prose, rule manuals) — DeCaf's own future work asks for NLP on unstructured logs [dim03 ^16^]; Kadlec et al. document the operator-interpretation gap in process monitoring [dim10 ^11^].

**Implications.** Product positioning should be "the missing middle layer," sold against the documented *deployment gap* of classical monitoring systems (Processes 2025 "Bridging the Gap" review [dim10]; DoD IG finding that PdM was never operationalized [dim05]) — a much stronger pitch than competing head-on with trained classifiers (see Conflict K2).

**Confidence: Very high.**

---

## I3. The review-by-exception isomorphism: pharma QC ≡ SOC triage ≡ FOQA ≡ alarm rationalization

**Statement.** Structurally identical workflows appear in regulated labs, security operations, aviation safety, and process plants: a high-volume flag stream, a scarce qualified reviewer, an asymmetric cost of missed true positives, and an accepted operating rule of "auto-clear the confident benign, escalate the rest." Jev's confidence field *is* the exception router in each case.

**Derived from.** [dim11] chromatogram integration review + audit-trail pre-review (FDA/PIC-S explicitly accept review-by-exception; "operationally impossible" to review everything); [dim02]/[dim03] SOC alert triage (AACT: 61% of alerts auto-closed at 1.36% FNR; TP/FP/BTP taxonomy); [dim05] FOQA exceedance validation (FAA AC 120-82 gatekeeper workflow) and SHM false-alarm adjudication (BDC two-stage); [dim04]/[dim10]/[dim12] alarm rationalization (ISA-18.2 workshops at 30–50 alarms/day vs. ~50k atomic judgments for a few dollars); [dim10] MES/EBR review-by-exception (40–60% review-efficiency gain documented); [dim13] conformal triage for medical imaging — the same pattern with statistical guarantees.

**Rationale.** The isomorphism is exact: same verdict types (genuine/artifact/uncertain), same routing (auto-close/queue/escalate), same governance (thresholds set by asymmetric error costs, mandatory sampling of auto-closed items). Lessons transfer across industries — e.g., AACT's mandatory-sampling guardrail [dim02] is directly applicable to OOS triage [dim11] and alarm auto-suppression [dim04].

**Implications.** One reference architecture (flag → typed verdict → thresholded disposition → sampled audit) addresses all these markets; validation methodology (risk-coverage curves + audit sampling) can be shared. This is the strongest near-term commercial cluster because the incumbent is *human reading*, not a trained model.

**Confidence: Very high.**

---

## I4. Regulated industries ship their judgment taxonomies pre-encoded: standards are ready-made question banks

**Statement.** A pattern unique to the chemistry-industry/industrial dimensions: standards and regulations (ISA-18.2, EEMUA 191, USP <621>, ICH Q1E, ISA-88, IEC 61511, GHS/CLP, API RP 754, 21 CFR, ALCOA+, OSHA 1910.119) already encode atomic, rubric-ordered judgments with defined consequence/priority matrices — i.e., the criteria text for Noul/Score/Choice questions exists as published clause language, and documented non-compliance rates supply ground-truth classes.

**Derived from.** [dim04] observation #2 ("Standards create ready-made question banks"); [dim10] alarm rationalization vs. ISA-18.2, S88 phase consistency; [dim11] SST adjudication vs. USP <621>, stability logic vs. ICH Q1E, ALCOA+ checks; [dim12] SDS/GHS classification (Health Canada 17.49% Section-4 inconsistency rate; ECHA audit stats), MOC replacement-in-kind triage against statutory text, TRI error taxonomies, LOPA IPL three-tests.

**Rationale.** No equivalent exists in the engineering or physics dimensions — there, rubrics must be authored. In regulated industries, the rubric *is the law*, so (a) question authoring cost vanishes, (b) verdicts are auditable against clause text, (c) documented violation rates give measurable baselines (SDS discrepancy 38.2% [dim12 ^9^]; 5–15% false-reject rates [dim04]).

**Implications.** Chemistry-industry compliance/QC is the lowest-friction beachhead: typed judgments map 1:1 onto mandatory checklists, the output format (documented first-pass adjudication with probabilities) is exactly what inspectors ask to see ("contemporaneous records of OOT adjudications" [dim11 ^25^]), and the human-final-authority posture is regulatorily pre-approved.

**Confidence: High.**

---

## I5. The safe-choice-point principle: from proof search to chemical plants, value concentrates where errors are recoverable

**Statement.** The strongest usages across all dimensions share one property: Jev is positioned at decision points where a wrong judgment costs *time or money, never correctness or safety* — heuristic selection (which solver, which premise, which tactic), triage (which queue, which review), and advisory layers with deterministic gating downstream. This principle was articulated independently in mathematics ("choices which have no effect on mathematical correctness… are good candidates for ML application") and in process safety (advisory-only, validators/interlocks untouched).

**Derived from.** [dim09] correctness-invariance principle (Florescu & England) + observation #1; [dim08] heuristic guidance inside proving loops — the kernel still checks every proof; [dim04]/[dim10]/[dim12] advisory-only positioning with deterministic validators, IEC 61511 Non-SIF framing; [dim06] physics cuts remain frozen and blinded; [dim05] confidence-gated human sign-off on all high-severity paths.

**Rationale.** This resolves the apparent tension between ambitious usage counts and modest per-usage accuracy evidence: at safe choice points, even a 70–80%-accurate judge is economically transformative (a wrong CAD variable ordering costs compute; a missed alarm goes to a human anyway). It also explains why the *unsafe* mirror-usages (auto-actuation, SIF credit, unsupervised release decisions) were excluded by every industrial dimension independently.

**Implications.** A clean screening rule for new usage proposals: (1) enumerate the blast radius of a wrong verdict; (2) require a deterministic or human backstop for anything above "wasted compute"; (3) threshold confidence on asymmetric costs (Elkan cost-sensitive thresholds [dim13]). This single rule reproduces the swarm's safety consensus.

**Confidence: High.**

---

## I6. Economics tipping point: at ~$0.04/Mtok, 100% coverage displaces sampling — worked at Rubin scale ($600/night)

**Statement.** Multiple dimensions independently compute the same phase transition: once a typed judgment costs ≲$0.001, the default operating mode flips from *sampled review* to *universal adjudication*. The cleanest worked example is Rubin/LSST: 10M alerts/night × ~1.5kT ≈ 15 GT/night ≈ **$600/night for a multi-question verdict on every alert** (≈$60/night after cheap quality cuts) — absurd for generative models, routine for Jev-class pricing.

**Derived from.** [dim07] Rubin cost arithmetic + Zooniverse 100M-subject triage ≈ $1.2k; [dim10] whole-plant sweep ~100k judgments/day ≈ few dollars vs. ASM-documented 3–8% capacity losses ($20B/yr industry-wide); [dim11] thousands of audit-trail entries/day, hundreds of COAs/week — 100% verification replacing sampled proofreading; [dim12] 5,000 alarms × 8 questions or millions of SDS pair-checks for dollars; [dim02] 10k-finding SAST scan triaged for cents; [dim13] value-of-information framing: call cost → 0 makes break-even error-reduction tiny.

**Rationale.** The recurring documented bottleneck is per-event *human* cost (FOQA analysts, PMU labelers, QA reviewers, SOC analysts, workshop facilitators), and the recurring failure mode is sampled coverage (only flagged/suspicious items reviewed). Universal cheap judgment converts every such workflow to 100%-coverage-with-exception-routing — the same flip FrugalGPT/RouteLLM document for LLM serving [dim13 §1].

**Implications.** The sales metric should be "cost of 100% coverage per day" against "cost of one missed event," not per-call price comparisons. Note the caveat: these economics inherit vendor-reported pricing; a 2× price error does not change the conclusion, a 20× error would (Conflict K6).

**Confidence: High** (arithmetic is simple and repeatedly derived; vendor price is the single assumption).

---

## I7. The sub-10ms roadmap partitions the catalog: it converts the entire "marginal" tier into fits, and only physics-of-the-stack exclusions remain

**Statement.** Cross-dimension, latency requirements stratify into exactly three tiers: (i) **excluded** ns–µs regimes (LHC L1 triggers, robot servo loops, plasma control, FPGA qubit readout) — unreachable at any plausible roadmap; (ii) **marginal at ~100ms** in-path decisions (given-clause selection, B&B per-node branching, inline phishing gateway at the 89ms bar, query routing against Redshift's 100ms rule-out, synchronous HLT side-channels, compiler per-call-site advice); (iii) **comfortable** supervisory/batch regimes (everything else, >80% of the catalog). A credible sub-10ms Jev moves tier (ii) wholesale into tier (iii); nothing moves tier (i).

**Derived from.** [dim06] explicit fit table (L1 No / HLT marginal / buffered Yes / offline clear fit); [dim08] given-clause "needs the sub-10ms roadmap to be competitive with XGBoost ENIGMA"; [dim09] B&B branching "depends on roadmap sub-10ms; today viable at root/cut-loop depth"; [dim02] phishing's published 89ms ensemble bar; [dim03] Redshift Stage's "100ms rules out modern models" production constraint; [dim04] latency tiering (1–10Hz robot monitoring OK; servo excluded); [dim07] tokamak ms-scale actuation stays embedded.

**Rationale.** Tier (ii) is precisely where today's *learned* incumbents are microsecond-cheap (XGBoost ENIGMA, strong-branching surrogates, Redshift's local XGBoost) — Jev cannot win there at 100ms but becomes a zero-training, semantic-aware competitor at 10ms. Meanwhile tier (i) exclusions are unanimous across dims, an unusually clean consensus.

**Implications.** Two roadmap messages: (a) sub-10ms latency is the single highest-leverage product improvement — it roughly doubles the addressable usage count and moves the most prestigious technical logos (provers, solvers, triggers) into reach; (b) marketing should stop implying tier (i) is approachable — the catalogs show every serious evaluator in HEP/robotics/fusion applies a hard timescale filter first. All tier-(ii) claims remain hostage to *measured* p50/p99 latency, since current figures are vendor-reported "from our laptops" [dim01 ^19^].

**Confidence: High.**

---

## I8. Calibration is the product — and the known single point of failure

**Statement.** Every high-confidence cluster's value proposition reduces to *thresholding a calibrated probability* (auto-close above τ, escalate below τ). The swarm's theoretical dimension shows this is provably well-founded (Chow's reject option, selective prediction, conformal risk control); the vendor's own documentation limits the guarantee to group-level calibration with no cross-question invariants; and the strongest deployments in the evidence base (AACT, Gravity Spy, KnowNo) all wrap the judge in an external control (sampling audits, conformal prediction) rather than trusting raw outputs.

**Derived from.** [dim01] RLCD calibration target ("group-level… not a guarantee about any single answer"; noul 0.72 vs negation 0.47 non-invariance); [dim02] AACT's strict thresholds + mandatory sampling; flaky-test Lampel trap (99.2% precision yet 76.2% real-fault misclassification — the canonical miscalibration disaster); [dim04] KnowNo conformal wrapper; [dim07] Gravity Spy confidence-routed workflows; [dim13] §5–6 calibration/decision theory.

**Rationale.** The difference between Jev and a free-text LLM judge is not speed alone — it is that "the calibrated probability is the product" [dim02 observation #1]. If real-world calibration diverges from vendor claims, clusters C1–C11 degrade from "automation with guarantees" to "heuristic screening," a materially smaller value proposition.

**Implications.** (a) Any deployment guide must mandate per-domain calibration validation and an external wrapper (conformal/selective prediction + audit sampling) for auto-action thresholds — this is supported by evidence in ≥5 dims, not optional hygiene. (b) Independent third-party calibration measurement is the highest-value evaluative experiment for the entire research program (ties to Conflict K5/K6).

**Confidence: High.**

---

## I9. The competitive baseline differs systematically by dimension — and it predicts where Jev wins

**Statement.** Across dimensions, the incumbent Jev must beat falls into exactly three classes, and the confidence tiers track them almost perfectly: (1) **human attention** (QC review, log triage, compliance documents, alarm workshops, logbooks, shift handovers) — Jev wins on coverage/consistency even at modest accuracy; (2) **brittle rules** (guardrails regex, LIMS routing, alarm suppression matrices, Sherlock cross-match rules) — Jev wins on semantic robustness, the documented "Smart Reply gap" [dim13 §3]; (3) **trained per-task ML** (ENIGMA XGBoost, phishing ensembles, TCP rankers, JIT defect models, Stage predictor) — Jev's accuracy is unproven and every dimension flags benchmarking as the open experiment.

**Derived from.** [dim02] observation #4 (trained-baseline caveat) vs. High-rated human-baseline usages; [dim03] classical ML deployed at nearly every judgment point (High ratings rest on the judgment point, not accuracy); [dim05] "semantic gap is systematic" — decisive context in text that numeric stacks drop; [dim13] §3 BERT-era history (rules → classical ML → language-model cascade) and Huang et al. 2025 (small judges match large ones only in-distribution); [dim12]/[dim11] human-reading baselines throughout compliance.

**Rationale.** This explains the tier structure of the cross-verification without any per-usage re-judging: High clusters are exactly baseline-classes (1) and (2); the contested/conflict clusters are class (3).

**Implications.** Go-to-market and research sequencing should follow the baseline map: human-baseline usages need no accuracy proof beyond calibration; rule-baseline usages need paraphrase/robustness demos; trained-ML-baseline usages need head-to-head benchmarks, which should be commissioned first for the highest-volume targets (SOC, SAST, query routing).

**Confidence: High.**

---

## I10. Batch-Noul over one shared state is the distinctive, repeatedly re-discovered primitive

**Statement.** The API's most differentiated capability — many independent typed questions over the same state in one call, "barely changes the response time" [dim01 ^1^] — maps onto decompositions that practitioners invented independently in several fields: one-vs-all phase classifiers (GALAXI XRD), binary-relevance sub-algorithm selection (Maple integration), parallel strategy probes (Z3), ENIGMA batched clause judgment, per-checklist-item verification (line clearance, ALCOA+, HAZOP completeness), and per-cause flood adjudication. Question batteries, not single judgments, are where the cost/latency arithmetic is most extreme.

**Derived from.** [dim01] parallel-questions cookbook (13 questions: 12.2× cheaper, 10× faster, std-dev 0.0 across repeats) + speculative fan-out pattern; [dim07] GALAXI one-vs-all isomorphism (agent's words: "isomorphic to a parallel Noul battery"); [dim09] observation #2 ("Batch-Noul is the killer primitive"); [dim08] GNN-ENIGMA's batched context judgment; [dim04]/[dim10]/[dim12] per-alarm, per-permit, per-checklist batteries; [dim11] per-injection, per-entry Noul batteries.

**Rationale.** Fan-out amortizes the state encoding and converts N separate model calls into one — the vendor's 12.2×/10× numbers, if they hold, mean the marginal question is ~free. This is a structural advantage over both per-item LLM calls (N× cost, N× latency) and per-item classical inference (no shared-state batching semantics).

**Implications.** Usage designs should prefer question-battery decomposition (one state, many atomic questions) over sequential judgment chains; the SDE-cookbook design criteria (narrow, grounded, bad=TRUE framing, per-field max-aggregation) [dim01 ^18^] are the transferable engineering rules for writing such batteries. It also concentrates risk: prompt-injection or context-rot in the shared state corrupts all answers at once [dim01 ^8^ jaggedness].

**Confidence: Medium-High** (pattern convergence is clear; magnitude rests on vendor cookbook numbers).

---

## I11. The multimodal dependency is the catalog's quiet scope-limit

**Statement.** Jev is text-only [dim01], yet a recurring subset of high-value usages in robotics, microscopy, spectroscopy, and process inspection presumes image/spectrum content. Every such usage silently inserts an upstream perception encoder; the judgment layer's cost/latency advantage is real, but the system's hard problem (and its failure modes) migrates into that unscoped component.

**Derived from.** [dim01] "Images, audio, and video are not supported (yet)"; [dim04] robot scene verification (acknowledged need for vision front-end), machine-vision reject adjudication; [dim07] cryo-EM/micrograph triage, XRD patterns, all-sky cloud images; [dim11] chromatograms, MS/NMR spectra, FTIR identity checks.

**Rationale.** Where the state is already structured (scene graphs, integration metrics, spectral match scores), Jev fits cleanly — and several dims show the perception stage is already solved separately (SmartScope, GALAXI, vendor CDS software). The dependency is therefore architectural, not fatal — but it means ~15–20% of proposed usages are really proposals for a *two-model system* whose unscoped half is the harder one.

**Implications.** Roadmap-wise, native multimodality (or a sanctioned encoder-partner pattern with defined state contracts) unlocks the perception-adjacent clusters; until then, text-native clusters (C1, C7, C8, C11) should be weighted highest in confidence.

**Confidence: High.**
