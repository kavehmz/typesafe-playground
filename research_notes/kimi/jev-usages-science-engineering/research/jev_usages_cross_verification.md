# Cross-Verification of Jev "System One" Usage Catalogs (Dimensions 01–13)

**Purpose.** Aggregate the ~190 individual usages in `jev_usages_dim01.md`–`jev_usages_dim13.md` at the level of **usage clusters**, classify each cluster into a confidence tier, and surface every cross-dimension conflict. Per-usage confidence assigned by the dimension agents is respected; this document does not re-judge individual usages.

**Tier definitions.**
- **HIGH** — the same usage *pattern* was found independently by ≥2 dimension agents with independent primary evidence (different sources, different domains). Partially-shared citations are flagged where independence is imperfect.
- **MEDIUM** — found by 1 agent, but grounded in authoritative primary sources (standards, deployed systems, peer-reviewed literature).
- **LOW / EXPLORATORY** — design synthesis, thin or indirect precedent, or an acknowledged extrapolation beyond published practice.
- **CONFLICT ZONE** — agents disagree (explicitly or implicitly) on feasibility, positioning, or competitiveness.

**Dimension map.** dim01 = capability grounding (vendor docs); dim02 = software engineering; dim03 = systems & infrastructure; dim04 = control systems/robotics/industrial automation; dim05 = asset-intensive engineering (PdM/grid/aero/auto/SHM/rail/maritime); dim06 = HEP & nuclear physics; dim07 = astronomy & experimental physics; dim08 = math: theorem proving & formal verification; dim09 = math: symbolic computation & optimization; dim10 = chemical process operations; dim11 = chemistry-industry laboratory & QC; dim12 = chemical safety/regulatory/compliance; dim13 = cross-cutting theory & economics.

---

## 1. HIGH-CONFIDENCE CLUSTERS (≥2 agents, independent evidence)

### C1. Alert / alarm triage and false-positive adjudication
The single most convergent cluster in the swarm. Found as: SAST verdict triage and secret-scanning verification [dim02, ZeroFalse arXiv:2510.02534; GitHub production LLM verification cutting FPs 75.76%]; SOC alert triage [dim02 AACT — 61% alert reduction at 1.36% FNR in live deployment; dim03 TP/FP/BTP taxonomy from SOC practice]; DDoS flash-crowd-vs-attack verdicts [dim03, Cloudflare Gatebot/dosd]; process alarm-flood triage [dim04 ISA-18.2/EEMUA 191; dim05 Milford Haven 275 alarms/11 min; dim05 maritime Lloyd's Register 197% alarm growth]; PMU/DFR event triage [dim05, IEEE PES, Kezunovic DFR expert system]; FOQA exceedance validation [dim05, FAA AC 120-82 workflow]; SHM false-alarm adjudication [dim05, MSSP 2024 Binomial Distribution Classifier]; DQM shifter verdicts and beam-loss classification [dim06, deployed CERN tool since Nov 2023]; Rubin real-bogus and GW astro-vs-terrestrial triage [dim07, ALeRCE stamp classifier, GWSkyNet]; process-safety KPI anomaly triage [dim12, API RP 754].
- **Evidence basis:** 7+ dimensions, dozens of independent primary sources, including multiple *deployed* systems (AACT, GitHub secret scanning, Cloudflare, CERN BLM tool, ALeRCE). Verdict-with-confidence (Noul/Choice + calibrated probability) is the native shape in every case.
- **Tier: HIGH — strongest cluster in the catalog.**

### C2. FDD verdict / routing layer above statistical detectors
A semantic jury above existing detection statistics: is this a real fault, which class, who acts. Found as: FDD verdict layer above PCA/QDA/observer banks [dim04 U5; dim10 U3 — both cite Venkatasubramanian et al. 2003 reviews, *partially shared source*]; CLPM oscillation diagnosis (stiction vs. tuning vs. disturbance) [dim04 U6, OptiControls/Srinivasan-Rengaswamy]; condition-monitoring alert disposition [dim04 U7, PdM false-alarm trust-erosion sources]; MPC model-plant-mismatch triage [dim10 U1, Harris 1989 / Badwe 2009 / Qin & Badgwell 2003]; gross-error anomaly adjudication in data reconciliation [dim10 U9, Narasimhan & Jordache 2000]; soft-sensor trust verdicts [dim10 U8, Kadlec et al. 2009]; turbofan health-state adjudication [dim05 C3, N-CMAPSS PHM Challenge]; RUL operating-regime gating [dim05 A3, ISO 13374/13381].
- **Evidence basis:** 3 dimensions, distinct literatures (process-control FDD, PHM/ISO standards, MPC maintenance). The deployment-gap framing is independently documented ("Bridging the Gap… Toward Industrial Deployment," Processes 2025 [dim10]; DoD IG finding that PdM is not operationalized [dim05]).
- **Tier: HIGH.**

### C3. Review-by-exception QC (regulated labs and manufacturing)
Pre-judging flagged items so humans review only exceptions: chromatogram integration review [dim11 U2, FDA 2018 data-integrity guidance]; OOS/OOT investigation triage [dim11 U1, FDA OOS guidance]; second-person/audit-trail ALCOA+ pre-review [dim11 U4, PIC/S PI-041]; MES/EBR review-by-exception support [dim10 U14, 40–60% review-efficiency gains documented]; line-clearance verification [dim04 U13, 21 CFR 211.130]; machine-vision false-reject adjudication [dim04 U11, 5–15% false-reject rates].
- **Evidence basis:** 3 dimensions, independent regulatory anchors (FDA, PIC/S, ICH, 21 CFR). Regulators explicitly accept the review-by-exception operating model [dim11 ^8^].
- **Tier: HIGH.**

### C4. Retrieval-shortlist reranking (cross-encoder-grade relevance judgment)
Found as: CLERC legal re-ranking cookbook [dim01 ^16^, vendor-run but published with code/numbers]; code-search reranking [dim02 U15, "recall before rerank" benchmark]; premise selection/reranking for hammers [dim08 U1, dim09 U10 — *shared Magnushammer/ENIGMA sources, so the two math dims count as one independent line*]; math formula-retrieval reranking [dim09 U15, Approach0/Tangent literature]; mathlib library-search reranking [dim08 U12, LeanSearch v2 nDCG 0.62]; MS/NMR library hit-list adjudication [dim11 U5, NIST match-factor guidance]; cross-match/host-association verdicts [dim07 A2, Lasair Sherlock].
- **Evidence basis:** 5 dimensions; the two-stage retrieve→rerank asymmetry is documented independently in IR, code search, theorem proving, chemistry, and astronomy.
- **Tier: HIGH.**

### C5. Routing & cascade gating (cheap judge in front of expensive capacity)
Found as: intent routing / model routing [dim01 patterns + RouteLLM/FrugalGPT; dim02 U13]; RCA gating before 79s agentic runs [dim02 U12, RCAgent/PRISM 79s-vs-8ms]; query routing/engine & queue selection [dim03 U7, Redshift Stage — production system with explicit 100ms latency budget]; query-optimizer hint steering [dim03 U5/U6, Bao, AI-Meets-AI]; solver portfolio selection [dim09 U5, SATzilla/AutoFolio]; backend routing for hammers [dim08 U4, MaLeS/BliStrTune]; LLM-guardrail escalation tiers [dim02 U14, guardrail archetypes]; the entire theory base [dim13 §1: FrugalGPT 98% cost reduction, RouteLLM 85% cost cut at 95% quality, speculative cascades].
- **Evidence basis:** 6 dimensions + dedicated theory dimension; converges on identical architecture from serving economics (dim13), databases (dim03), agents (dim02), and solvers (dim09).
- **Tier: HIGH.**

### C6. Confidence-gated escalation / calibrated abstention as the control policy
Found as: vendor confidence bands (act/confirm/route-to-human) [dim01 ^6^]; AACT-style auto-close thresholds + mandatory sampling [dim02]; flaky-test asymmetric-cost warning (Lampel: 99.2% precision yet 76.2% of real faults misclassified) [dim02]; Stage's local→global uncertainty trigger [dim03]; KnowNo conformal ask-for-help [dim04]; FOQA gatekeeper and CBM+ sign-off [dim05]; advisory-only blinded-cut posture in rare-event physics [dim06]; Gravity Spy confidence-routed volunteer workflows [dim07]; Chow's rule, selective prediction, conformal risk control [dim13 §5].
- **Evidence basis:** 7 dimensions; both empirical practice and decision-theoretic foundations independently arrived at the same threshold policy.
- **Tier: HIGH.** (See Conflict K5 on whether vendor calibration is strong enough to carry this.)

### C7. Maintenance / incident / log free-text classification & routing
Found as: work-order failure-mode triage (<50 ms/note spec) [dim05 A1]; aircraft defect reports → ATA/JASC [dim05 C2, multiple peer-reviewed demos, f1-macro 0.762]; warranty claim routing [dim05 D2]; shift-handover log classification [dim10 U13, HSE Lardner review]; control-room logbook triage [dim06 U13, Fermilab ADEL ~1M entries]; incident/near-miss narrative coding to API RP 754 [dim12 U9, SVM/CNN 0.90–0.91 on OSHA corpora]; andon call classification [dim04 U12]; log-anomaly semantic triage [dim02 U10, dim03 U11, DeepLog/LogBERT].
- **Evidence basis:** 6 dimensions, all anchored on the same documented gap: decisive evidence lives in text while classical stacks consume numeric features.
- **Tier: HIGH.**

### C8. Standards-and-rules conformance checking ("regulations as question banks")
Typed compliance verdicts against documented rubrics: alarm rationalization vs. ISA-18.2/EEMUA 191 [dim04 U2; dim10 U7; dim12 U10 — three agents independently; workshop rate 30–50 alarms/day and <5% P1 rules cited]; system-suitability adjudication vs. USP <621> [dim11 U3]; stability/shelf-life logic vs. ICH Q1E [dim11 U7]; S88 phase-state consistency [dim10 U5]; SDS GHS classification + cross-section consistency [dim12 U1/U2, Health Canada 17.49% inconsistency rate; ECHA audit stats]; MOC replacement-in-kind triage [dim12 U7, OSHA 1910.119 text]; TRI/Tier II data-quality screening [dim12 U14]; HAZOP completeness / LOPA IPL plausibility [dim12 U5/U6]; COA-vs-results verification [dim11 U8]; SDS cross-supplier discrepancy adjudication [dim12 U3, 38.2% discrepancy rate].
- **Evidence basis:** 4 dimensions. Standards pre-encode exactly the atomic, rubric-ordered judgments Noul/Score/Choice express; documented non-compliance rates supply ground-truth classes.
- **Tier: HIGH.**

### C9. Execution / outcome verification of autonomous loops
Atomic pre/postcondition and success verdicts on each step of an automated workflow: robot skill verification [dim04 U8, DoReMi binary constraint detector at <0.1s/query — the closest existing artifact to a Jev Noul]; recovery-strategy selection [dim04 U9]; quantum-processor calibration step verdicts [dim07 D2, 112-qubit agent bring-up 4.7h vs 18–24h]; self-driving-lab experiment-outcome verdicts [dim11 U10, A-Lab 355 experiments; the Palgrave critique shows outcome adjudication is the most consequential judgment in the loop]; beamline steering verdicts [dim07 F1, ORNL autonomous diffraction]; qubit readout drift/calibration triage [dim07 D1].
- **Evidence basis:** 3 dimensions, independent literatures (robotics, quantum computing, autonomous labs) converging on binary-question decomposition as the winning monitoring pattern.
- **Tier: HIGH.**

### C10. Guardrails / safety screening of LLM inputs & outputs
Found as: vendor guardrails cookbook (Noul hazard battery + harm Score) [dim01 ^17^]; prompt-injection/jailbreak gate with escalation tier [dim02 U14, guardrail archetype survey + 100%-evasion bypass study]; small-guard-model literature (Llama Guard family, <200ms in-path budget) [dim01 §5, dim13 §2].
- **Evidence basis:** vendor cookbook + 2 independent dimensions. Tempered by the vendor's own admission that Jev "does not treat [state] as hostile by default" [dim01 ^8^] and by published evasion of all guardrail classes [dim02 ^32^].
- **Tier: HIGH on the pattern; adversarial robustness explicitly unresolved (see Conflict K4).**

### C11. Document internal-consistency verification (units, cross-references, generated-vs-source)
Found as: vendor citation-verification and SDE-cascade cookbooks [dim01 ^14^^18^]; physics paper/unit cross-checks [dim06 U14]; COA document-vs-record verification [dim11 U8]; SDS cross-section contradiction detection [dim12 U2]; autoformalization faithfulness checking [dim08 U10, ProofNetVerif benchmark of exactly this binary judgment].
- **Evidence basis:** 4 dimensions + vendor cookbook; one cluster member is literally a published benchmark task (ProofNetVerif).
- **Tier: HIGH.**

---

## 2. MEDIUM-CONFIDENCE CLUSTERS (1 agent, authoritative sources)

| Cluster | Dim | Authoritative grounding |
|---|---|---|
| Anomaly-trigger stream triage (AXOL1TL/CICADA second layer) | dim06 | CMS explicitly exploring "a second anomaly-detection layer… to improve the purity of the anomaly stream" |
| Compiler heuristic replacement (inlining, regalloc, phase ordering, vectorization) | dim03 | MLGO shipped in upstream LLVM (7% size cut, ~1% compile-time overhead); CompilerGym/NeuroVectorizer |
| Learned database operations beyond routing (index advisors, autoscaling, VM placement) | dim03 | Autopilot (EuroSys'20), Protean (OSDI'20), WRED (SIGMOD'24) |
| Network config intent verification (Batfish findings vs. ticket intent) | dim03 | Batfish NSDI'15 + CI/CD pre-change practice |
| CI flaky-test & test-selection judgments | dim02 | FlakeFlagger/Flakify + Chromium production caveat; TSP SLR (29 studies) |
| Follow-up resource prioritization (spectroscopy, telescope time) | dim07 | Fink ALORN active learning; LSST TVS Roadmap; CFHT grading practice |
| Tokamak disruption advisory layer | dim07 | DPRF/J-TEXT/FRNN deployed predictors; ITER >95% accuracy requirement |
| Citizen-science pre-classification & effort routing | dim07 | Zooniverse Caesar, Camera CATalogue 43% effort reduction, Galaxy Zoo |
| Cryo-EM / microscopy triage | dim07 | XCryoNet, SmartScope |
| Solver parameter/configuration advisory (SMAC surrogate filtering) | dim09 | SMAC/Hydra-MIP lineage (250k CPU-days training cost documented) |
| Step-level grading / process-reward judging | dim09, dim08* | PRM800K, Math-Shepherd (*dims 08 and 09 share these sources — one independent line) |
| Math education verdicts (equivalence, hints, difficulty) | dim09 | STACK deployed practice, Hint Factory >80% |
| SDS authoring / GHS classification first-pass | dim12 | HazChemNet 91.9% accuracy; QSAR ~95% correct-or-conservative; UL Solutions 8h→45min case |
| Export-control / denied-party adjudication | dim12 | AEB >95% ECCN assistant; Fed working paper 92% FP reduction |
| Emergency-response model/LOC selection | dim12 | ALOHA/ERPG/AEGL documented selection guidance |
| Retrosynthesis step-feasibility scoring | dim11 | Segler filter network, RetroGFN RFM, PaRoutes |
| ADMET "Tier Zero" flag triage | dim11 | ADMET Predictor/ADMET-AI practice; endpoint-maturity framing |
| Excipient compatibility verdicts | dim11 | ICH Q1A basis; FormulationDE 0.75 acc / 0.82 AUC |
| Batch golden-trajectory verdicts | dim10 | Nomikos & MacGregor MPCA (established 30-year method) |
| Energy/utility optimizer recommendation adoption | dim10 | Visual MESA 100+ deployments, 2–5% energy benefit |
| Wildfire/PSPS per-line advisories | dim05 | NSF/multistage stochastic optimization literature |
| CBM+ advisory generation | dim05 | DoDI 4151.22 + DoD IG audit |
| Duplicate bug-report / same-incident pair judgments | dim02 | two-stage retrieval+classification literature; Forrester MTTR figures |

---

## 3. LOW / EXPLORATORY CLUSTERS (design synthesis, thin precedent)

- **Semantic oversubscription & per-VM placement adjudication** [dim03 U9] — production architecture documented, but the semantic per-VM judgment is an unevidenced extension.
- **EDA rule-text / DRC-waiver semantic adjudication** [dim03 U14] — ML prediction slots validated industrially; the rule-text-reading layer is speculative.
- **Zero-shot affordance (SayCan-style "can" without trained value functions)** [dim04 U10] — architecture proven; zero-shot quality unvalidated per domain (agent's own Medium rating).
- **Safety-interlock "pre-trip" advisory** [dim04 U14] — architecturally precedented (validator-gated ASM) but requires rigorous governance to keep the advisory boundary clean; no deployment precedent.
- **Particle-ID trust advisory for domain shift** [dim06 U10, agent-rated Medium-Low] — problem documented; the advisory layer is extrapolation.
- **Analysis-level systematic-uncertainty Noul batteries** [dim06 U8] — components established; packaged semantic checklists are a proposal.
- **ODE stiffness/method selection** [dim09 U8], **AMR marking advisory** [dim09 U9], **free-text dimensional-consistency checks** [dim09 F1], **statistical-test selection** [dim09 F3] — agent itself flags "cheap judgment where none was affordable," i.e., no learned baseline exists to anchor accuracy claims.
- **Chemical storage compatibility semantic layer** [dim12 U11] and **process-safety KPI anomaly context judgment** [dim12 U15] — rule substrates exist (CAMEO CRW; API RP 754) but mixture/trade-name semantics and site baselining are unvalidated.
- **Permit-to-work semantic checks** [dim12 U8, dim10 U15] — structural checks are commercial; the *semantic* adequacy layer (rescue-plan meaningfulness, described-work-vs-permit-type match) is novel and needs site validation.
- **Maritime alarm triage** [dim05 F1] — problem authoritatively documented (Lloyd's Register), ship-specific deployment evidence thin.
- **Sample-login/test-routing AI judgment** [dim11 U9] — deterministic LIMS routing documented; AI judgment at accessioning is an extrapolation.

---

## 4. CONFLICT ZONES (contradictions are signal)

### K1. Latency feasibility at in-path decision points — the sharpest disagreement
- **dim06 (timescale discipline, explicit):** LHC L1 hardware trigger is ns–µs (AXOL1TL needs 50 ns; CMS L1T 3.8 µs) — "**L1 is NOT a fit for Jev**"; synchronous HLT at ~451 ms/event mean is "**marginal** — parallel side-channel only"; clear fit only in buffered/parked/scouting paths and offline.
- **dim02:** cites the ~89 ms production bar for inline phishing ensembles and asserts sub-100ms Jev "meets" it — but dim01's vendor numbers are **70–500 ms end-to-end**, so Jev meets the 89 ms bar only at the favorable end of its own distribution. The claim "sub-100ms… meets every [published latency bar]" is optimistic for p99.
- **dim03:** claims sub-100ms "fits inside" the query-optimization budget — while its own cited source (Redshift Stage) rules out models with ~100 ms inference because that exceeds total query latency for 40% of queries. dim03 partially concedes this (OLAP vs. OLTP amortization) but rates the usage High.
- **dim04:** robot servo loops excluded; DoReMi-style 5–10 Hz monitoring is "necessary and sufficient" for sub-100ms — consistent with dim06's tiering.
- **dim07:** tokamak actuation ("decisions every millisecond") stays on embedded RF/NN; Jev advisory/between-shot only — consistent with dim06.
- **dim09:** B&B per-node branching is "**the most latency-critical usage**… depends on roadmap sub-10ms"; dim08 likewise says given-clause guidance needs sub-10ms to compete with XGBoost ENIGMA.
- **Net:** there is a consistent three-tier structure (excluded ns–µs / marginal ~100ms in-path / comfortable supervisory+batch), but dimensions differ in how aggressively they claim the middle tier. Treat all "inline/in-path" usages (phishing gateway, query routing, HLT side-channel, per-node branching) as **conditional on measured p50/p99 latency, not the marketing sub-100ms figure** — and note the underlying latency numbers are themselves vendor-reported (K6).

### K2. Zero-shot Jev vs. trained bespoke classifiers — where does Jev actually win on accuracy?
- **dim02 (cautious):** explicitly warns that where trained-on-your-data classifiers set hard accuracy bars (test prioritization, JIT defect prediction, flaky prediction), "Jev's zero-shot accuracy vs. these baselines is the key experiment"; several usages rated Medium for exactly this reason.
- **dim03 (aggressive):** rates 10/15 usages High despite classical ML being *already deployed* at nearly every judgment point (nPrint, Bao, Stage XGBoost, Autopilot, MLGO) — the High rating reflects the documented judgment point, not evidence Jev matches the incumbent's accuracy.
- **dim08/dim09:** sidestep the fight via the correctness-invariance principle — Jev is proposed at heuristic choice points where errors cost runtime, not correctness — but ENIGMA's XGBoost is microsecond-cheap *and* trained on proof-search logs; Jev's edge there is zero-training and semantic context, not accuracy or speed.
- **dim13 (theory):** small fine-tuned judges match large judges only *within their training distribution* (Huang et al. 2025) — supporting task-scoped typed judges, but Jev is zero-shot/general, i.e., the theory does **not** guarantee Jev beats a per-task trained classifier.
- **Net:** genuine unresolved tension. Strong consensus that Jev wins on **no-training, instant-taxonomy-edit, calibrated-abstention, semantic-text** axes; no dimension produced evidence that zero-shot Jev beats a well-trained per-task classifier on raw accuracy. Claims of superiority over deployed classical ML (dim03 Highs) should be read as "viable competitor pending benchmarking."

### K3. Safety positioning — unanimous on paper, with one implicit pressure point
- dims 04, 10, 12 are unanimous and emphatic: **advisory-only, never in a SIF/SIS, no risk-reduction credit under IEC 61508/61511, human sign-off preserved** (dim12: "human engineer sign-off on PHA, HAZOP, and MOC remains a regulatory requirement"; dim04: Non-SIF register; dim10: "POST does not modify SIS logic").
- The pressure point: dim02's guardrails and SOC usages envision Jev *auto-closing/auto-blocking* content (with AACT's 1.36% FNR precedent), and dim04 U14's interlock-advisory layer deliberately walks up to the safety boundary. These are different regulatory regimes (enterprise software vs. process safety), so this is not a logical contradiction — but a reader merging the catalogs could mistakenly import SOC-style auto-action posture into process-safety contexts. **The catalogs are consistent only if the advisory/auto-action line is drawn per regulatory domain, not per capability.**
- Vendor-side tension: dim01 documents that Jev "does not treat [state] as hostile by default" — an awkward property for a model proposed as a guardrail (C10) and as a safety-adjacent advisory layer.

### K4. Guardrail robustness — deployable layer vs. known-bypassable component
- dim01 presents the guardrails cookbook as a differentiator (policy-in-criteria, one-call input+output screening).
- dim02 rates the same usage Medium and warns: Hackett et al. 2025 achieved up to 100% evasion on at least some guardrail systems, and "adversarial robustness of a generic judge vs. tuned classifiers is an open, serious question."
- dim13 positions Jev as avoiding generative-judge biases but says nothing that resolves adversarial steering; dim01's jaggedness page confirms steerability.
- **Net:** consensus on the two-tier architecture (cheap screen → hardened judge), explicit disagreement-in-emphasis on whether Jev's screen is a security boundary. It is not, per current evidence.

### K5. Calibration: load-bearing everywhere, guaranteed at group level only
- Nearly every cluster (C1–C11) wires Jev's probability/confidence into thresholds; dim13 supplies the decision theory (Chow, selective prediction, conformal risk control) that makes this principled *if calibration holds*.
- dim01 documents the vendor's own caveat: calibration is a **population property, "not a guarantee about any single answer,"** and cross-question arithmetic identities do not hold (noul 0.72 vs. negation 0.47).
- dim04's KnowNo pattern and dim13's conformal triage implicitly concede the point: the guarantee must come from an external wrapper, not the model's raw outputs.
- **Net:** no agent claims per-answer calibration, but many primitive designs (especially dim12 safety, dim11 OOS) consume per-item probabilities as if trustworthy. Required mitigation consistently supported across dims: per-deployment calibration validation + conformal/selective-prediction wrappers + mandatory sampling of auto-actions (AACT pattern).

### K6. Vendor-reported specifications underpin everything
- dim01 flags that **all** Jev latency (70–500 ms), price ($0.042/Mtok), accuracy (67.8% Sonnet-tier, "193.6× faster / 444.6× cheaper"), and calibration claims are vendor-published with self-acknowledged bias; "no independent third-party evaluation of Jev was found."
- dims 02–12 build latency/cost fit arguments directly on these numbers; dim07's Rubin $600/night arithmetic and dim10's "few dollars per day" plant-wide sweeps inherit the caveat.
- **Net:** a single-point-of-failure caveat for the entire catalog's quantitative claims. Independent benchmarking of Jev is the highest-value validation action for the whole research program.

### K7. Text-only input vs. multimodal-dependent usages
- dim01: "Images, audio, and video are not supported (yet)."
- Several proposed usages implicitly require perception: robot scene verification [dim04 U8 — agent acknowledges a vision front-end is needed], cryo-EM/micrograph triage [dim07 E2], XRD patterns [dim07 E1], chromatograms and spectra [dim11 U2/U5/U6], machine-vision rejects [dim04 U11].
- The dims handle this by assuming an upstream encoder producing structured state — legitimate, but it moves the hard ML problem (and its error modes) into an unscoped component. Engineering/text-native clusters (C1, C7, C8) carry no such dependency; perception-adjacent clusters should be discounted accordingly.

### K8. Redundant coverage weakens apparent independence
- dim08 and dim09 both cover premise selection (shared Magnushammer/ENIGMA/Sledgehammer citations) and process-reward step judging (shared PRM800K/Math-Shepherd) — these count as **one** independent evidence line, not two.
- dim04 and dim10 share Venkatasubramanian FDD reviews and ISA-18.2/EEMUA 191 sources for alarm/FDD clusters; dim05 adds genuinely independent sources (ISO 13374, Milford Haven, FAA), keeping C1/C2 High, but the swarm's effective number of independent confirmations is smaller than a naive dim-count suggests.
- Multiple dims (02, 10, 12) rely on the same secondary aggregator (iFactory blog posts) for industrial KPIs — a low-authority shared source to treat with care.

---

## 5. Aggregate confidence picture

- **Strongest validated territory:** triage/verdict/rerank/review-by-exception patterns where the baseline is **human attention** (alerts, QC review, logs, compliance documents) — clusters C1, C2, C3, C7, C8, C11. Here even modest Jev accuracy is valuable because the alternative is unaided human reading or brittle rules.
- **Contested territory:** usages where a **trained per-task model is the incumbent** (systems/databases/compilers, test prioritization, phishing ensembles) — C5 partially, dim03's Highs. The judgment point is proven; Jev's competitive accuracy is not.
- **Conditionally unlocked territory:** in-loop, per-node, per-event-hot-path judgments (given-clause, B&B branching, inline gateway, HLT side-channel) — viable only at measured sub-100ms p99 today, and genuinely unlocked by the sub-10ms roadmap (see insight I7).
- **Excluded territory (consensus):** hardware-trigger/servo/plasma-control timescales (ns–µs), SIF/SIS safety functions, exact arithmetic/counting/date computation, open-ended generation — consistent with the vendor's own jaggedness page [dim01 ^8^].
