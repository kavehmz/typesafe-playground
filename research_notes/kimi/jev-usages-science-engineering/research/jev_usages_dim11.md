# Jev "System One" Typed-Judgment Usages — Chemistry-Industry Laboratory & Quality Domain

**Scope:** analytical QC labs, LIMS/ELN, lab automation / self-driving labs, formulation R&D, cheminformatics support layers.
**Technology premise:** TypeSafe AI "Jev" — non-generative typed-judgment model. JSON state + typed questions → Choice / Noul / Score judgments with probabilities & confidence; many questions per call; sub-100 ms latency (roadmap sub-10 ms); ~$0.04/Mtoken; 32K context. Design pattern: atomic gut-check questions decomposed and composed in code.
**Method note:** 24 independent web searches (6 coarse-to-fine batches); primary sources prioritized (FDA guidance, ICH Q1E, USP <621>, PIC/S, Nature papers, NIST literature). Inline citations [^N^]; verbatim excerpts quoted.

Each usage: (1) name + one-liner; (2) current practice & bottleneck; (3) concrete Jev primitive design; (4) why latency/cost matters; (5) evidence; (6) confidence.

---

## 1. OOS/OOT result triage & investigation routing

**One-liner:** Given a flagged result plus its analytical context, Jev issues Noul verdicts ("is there a documented assignable laboratory error?") and Choice routing ("close at Phase I / escalate to Phase II / request re-injection"), pre-structuring the mandatory investigation.

**Current practice & bottleneck.** FDA's OOS guidance (2006, rev. 2022) requires a two-phase investigation whenever a result falls outside specification: Phase I laboratory investigation (analyst + supervisor), Phase II full-scale production investigation if no assignable lab error is found [^1^][^2^]. The regulatorily load-bearing judgments — was SOP followed, were instruments calibrated, was integration applied correctly, is invalidation scientifically justified — are today made manually under time pressure. "Manual data collection and review slow down the investigation process… Incomplete documentation… increases the risk of missing information" [^3^]. OOS-related citations "appear consistently across drug and device inspection reports year after year" [^2^]. OOT adds a parallel judgment layer: a result within specification that "shows a statistically significant deviation from historical data or the expected trend" [^2^].

**Primitive design.** State: result value, specification, method/SST record, instrument calibration status, analyst qualification, sample prep log, historical trend window. Questions (one call, many Noul/Choice):
- Noul: "A transcription or calculation error is present in the reported result."
- Noul: "All SST injections passed pre-defined acceptance criteria."
- Noul: "The documented evidence supports a specific assignable laboratory error."
- Score (1–5): "Strength of evidence that this is a lab aberration vs. product failure."
- Choice: routing ∈ {close-as-lab-error, re-inject retained solution, escalate Phase II, trend-watch}.
Jev does not close investigations; it emits a consistent first-pass adjudication the supervisor confirms — directly matching the guidance requirement that review be "thorough, timely, unbiased, well-documented and scientifically sound" [^4^].

**Why latency/cost matters.** QC labs run thousands of results/day; every flag competes for scarce supervisor time, and FDA expects Phase I completion within ~20 business days [^2^]. Per-result adjudication at sub-100 ms and ~$0.04/Mtoken makes "every result gets a documented first-pass triage" economically feasible; generative-LLM pricing/latency would restrict coverage to a sample of flags.

**Evidence.** [^1^][^2^][^3^][^4^][^5^] — **Confidence: High.**

---

## 2. Chromatogram peak-integration review-by-exception

**One-liner:** Noul verdicts on each integration ("is this auto-integration acceptable?", "does this manual re-integration look justified?") so reviewers only open the chromatograms Jev flags.

**Current practice & bottleneck.** "Manual review of LC-MS data is often the biggest bottleneck in the modern analytical lab." Automated QC flagging enables "'review by exception,' where only flagged data requires human intervention, reducing the review workload significantly" [^6^]. Manual integration itself is a known data-integrity flashpoint: FDA's 2018 data-integrity guidance allows it only "with appropriate justification and audit trails," and MHRA requires manual interventions to be "fully justified, traceable, and recorded in the audit trail" [^7^]. Regulators accept review-by-exception scoped to "manual integrations, reprocessing events, deletions/exclusions, and configuration changes" rather than reading every entry [^8^].

**Primitive design.** State: integration parameters, peak metrics (asymmetry, resolution, S/N, baseline description), audit-trail delta (old→new value, user, reason), method context. Questions:
- Noul: "The automatic integration is acceptable as-is."
- Noul: "The stated reason for manual re-integration is consistent with the chromatographic evidence (e.g., shoulder/noise)."
- Noul: "The re-integration changed the reportable result beyond the method's normal variability."
- Choice: severity ∈ {auto-approve, analyst recheck, supervisor review, DI investigation}.

**Why latency/cost matters.** A CDS instance generates "thousands of timestamped entries a day" [^8^]; per-injection judgment must be cheaper than the analyst minute it saves. Sub-100 ms Noul calls can run inline at sequence completion — effectively real-time — where a slow model would batch-delay batch release.

**Evidence.** [^6^][^7^][^8^] — **Confidence: High.**

---

## 3. System-suitability adjudication (USP <621>)

**One-liner:** Score/Choice verdicts on SST runs ("does this system meet suitability on the day of analysis?") plus triage of borderline failures before sample data is generated.

**Current practice & bottleneck.** USP <621> defines SST parameters — resolution, %RSD of replicate injections, tailing factor, theoretical plates, S/N — with monograph-specific acceptance criteria [^9^][^10^]. Typical criteria: "Tailing factor ≤1.2; theoretical plates ≥2500; %CV of peak areas <2.0%" [^11^]. SST is a point-of-use fitness check, "not a test for instrument qualification" [^10^]. Modern CDS "allow users to define acceptance criteria for SST injections. If one or more of SST injections fail these criteria, then the run stops automatically" [^12^] — but the pass/fail is a hard threshold; borderline and interacting-parameter cases (e.g., Rs pass + tailing trend + RT drift) still need human judgment on whether to proceed, adjust within <621> allowances, or halt.

**Primitive design.** State: SST injection metrics across replicates, trends vs. historical SST for the same method/column, allowed-adjustment bounds. Questions:
- Noul: "All SST criteria pass with adequate margin."
- Score (rubric: clearly-pass / marginal / clearly-fail) per parameter and overall.
- Choice: action ∈ {proceed, adjust within <621> allowance, replace column, stop run and investigate}.

**Why latency/cost matters.** SST verdict gates every sequence; an inline sub-100 ms adjudication at run start prevents wasting a full sequence (hours of instrument time, dozens of sample results that would be invalidated). Cheap enough to run per injection as ongoing suitability monitoring, not just at sequence start.

**Evidence.** [^9^][^10^][^11^][^12^] — **Confidence: High.**

---

## 4. Second-person review & audit-trail/ALCOA+ assistance

**One-liner:** Jev acts as a tireless pre-reviewer: Noul checks for ALCOA+ completeness/consistency on each record and audit-trail entry, focusing the human second reviewer on genuine exceptions.

**Current practice & bottleneck.** GxP expects independent second-person review of records and audit trails before batch release: FDA Q7 of the data-integrity guidance — "the people responsible for record review under CGMP should review the audit trails that capture changes to data"; PIC/S PI-041 §9.5 requires audit trails "independently reviewed with all other records related to the batch and prior to the batch's release" [^13^]. FDA's own framing: "Audit trail review is similar to assessing cross-outs on paper when reviewing data" [^8^]. Literal full review is "operationally impossible, and neither FDA's nor PIC/S's guidance asks for it" [^8^]; CDS issues are "consistently among the most common sources of audit trail and data integrity citations in FDA warning letters" — trial/unofficial injections, shared logins, disabled audit trails [^14^]. ALCOA+ (Attributable, Legible, Contemporaneous, Original, Accurate + Complete, Consistent, Enduring, Available) is the standard checklist [^15^].

**Primitive design.** State: record metadata (timestamps, user IDs, signatures), audit-trail deltas, cross-references (notebook vs. CDS vs. LIMS). Questions:
- Noul: "This entry is complete (all required fields present)."
- Noul: "Timestamps are contemporaneous and internally consistent across systems."
- Noul: "Every injection run is represented in the reviewed record."
- Noul: "All changes are attributable to unique, authorized users."
- Choice: escalate ∈ {clean, minor documentation gap, potential DI finding}.

**Why latency/cost matters.** Second-person review scales linearly with batch throughput and is a pure-labor cost center; a cheap always-on pre-review converts the human role from "read everything" to "confirm flagged exceptions," matching exactly the review-by-exception model regulators accept [^8^].

**Evidence.** [^8^][^13^][^14^][^15^] — **Confidence: High.**

---

## 5. MS/NMR spectrum & structure verification support

**One-liner:** Verdicts on library hit lists and proposed structures ("is the top NIST hit a defensible identification?", "is this structure consistent with the 1H/13C NMR?") as a support layer under the expert analyst, never the final authority.

**Current practice & bottleneck.** Library search returns ranked hit lists with match factors (NIST: ≥900 excellent, 800–900 good, 700–800 fair), but "a match score is not a universal confidence percentage… The hit list begins the identification decision" [^16^]. NIST's own guidance: "Any identification of a nontargeted compound by GC-MS requires verification by an expert" [^17^]; good practice holds that "tentative identifications based on mass spectral matching are always substantiated by comparative spectrum plots" and below MF ~700 "the probability of correctly identifying a compound primarily based upon MF is extremely low" [^18^]. On the NMR side, commercial verification tools (Mnova Verify, ACD/Structure Elucidator) exist: Mnova Verify "automatically checks a proposed structure against a set of analytical data, LCMS or GCMS and/or 1D NMR and/or 2D NMR" and is used "to quickly reject incorrect structures prior to submission to company compound repositories" [^19^][^20^].

**Primitive design.** State: top-N hit list with scores, RI deltas, forward/reverse match gap, sample context (matrix, expected chemistry); or structure + predicted-vs-experimental shift deviations. Questions:
- Noul: "The top hit is a defensible tentative identification given score separation and RI agreement."
- Noul: "The MF–RMF gap indicates co-elution/contamination rather than a wrong hit." (The gap "is itself informative — a wide gap is a purity flag" [^16^].)
- Choice: ID confidence tier ∈ {confirmed (orthogonal evidence present), tentative, partial, unidentified}.
- Score: structure–spectrum consistency (for verification workflow).

**Why latency/cost matters.** Untargeted and extractables/leachables workflows generate hundreds of spectra per sample set; expert time is the constraint. A sub-100 ms verdict per hit list lets software auto-clear the unambiguous tail (e.g., 900+ with RI agreement) and route only the 600–850 gray zone to scarce experts.

**Evidence.** [^16^][^17^][^18^][^19^][^20^] — **Confidence: High.**

---

## 6. Raw-material identity verification (FTIR/Raman/NIR) verdicts

**One-liner:** Noul on incoming-material spectra vs. reference library ("does this spectrum confirm the labeled material?") with confidence-aware escalation of borderline matches.

**Current practice & bottleneck.** FTIR-ATR is a compendial identity tool (USP <854>, EP 2.2.24, ICH Q7 context): "The instrument software automatically compares the unknown spectrum against the reference library, calculating a similarity score… Based on a pre-defined similarity threshold, the software provides a definitive pass/fail result" [^21^]. Vendor practice reports "rapid material verification—often in less than a minute per sample" and a CMO reporting "40% reduction in raw material testing time" [^21^]. ML chemometrics (PCA/PLS + SVM/LDA/KNN classifiers) are established for FTIR classification in pharmaceutical applications [^22^]. The brittle step is the single hard threshold near warehouse-scale throughput: borderline lots (moisture variation, polymorph form differences, storage degradation [^21^]) force either false rejects (delays) or rubber-stamping (risk).

**Primitive design.** State: similarity score, score gap to runner-up class, spectral-quality indicators, lot/COA metadata, supplier history. Questions:
- Noul: "Spectrum confirms labeled identity with adequate margin."
- Noul: "Observed deviations are consistent with benign causes (moisture, particle size) rather than wrong material."
- Choice: disposition ∈ {release to production, hold for confirmatory test (HPLC/wet chem), reject/quarantine}.

**Why latency/cost matters.** Verdicts are needed at the receiving dock, in line with sub-minute measurement; per-lot judgment at fractions of a cent keeps 100%-testing economically sound vs. skip-lot sampling.

**Evidence.** [^21^][^22^] — **Confidence: Medium-High** (vendor/practice sources; compendial basis solid, specific deployments less documented).

---

## 7. Stability-data evaluation & shelf-life/OOT verdicts (ICH Q1E)

**One-liner:** Score/Noul judgments over stability pulls ("does this attribute show a significant trend?", "is this point OOT?", "does the accelerated arm show significant change?") feeding ICH Q1E-conformant shelf-life logic.

**Current practice & bottleneck.** ICH Q1E: shelf life is estimated "by determining the earliest time at which the 95 percent confidence limit for the mean intersects the proposed acceptance criterion," with regression as the primary tool, ANCOVA poolability testing across batches, and bounded extrapolation conditioned on "significant change" at accelerated/intermediate conditions [^23^][^24^]. The mechanical math is automatable; the judgment calls — trend vs. noise, poolability acceptability, outlier handling, extrapolation justification — are expert tasks. Inspectors "routinely probe whether the site can explain trend logic, demonstrate consistent application, and produce contemporaneous records of OOT adjudications" [^25^]. Improper outlier handling "is a common finding during GMP audits" [^26^].

**Primitive design.** State: attribute time series per batch/condition, spec limits, regression diagnostics, chamber telemetry. Questions:
- Noul: "The slope for this attribute is statistically and practically significant."
- Noul: "This pull is OOT against the pre-specified prediction interval."
- Noul: "Batches are poolable (common slope/intercept) for this attribute."
- Score (rubric): extrapolation defensibility ∈ {none / 1.5×+6mo / 2×+12mo per Q1E decision tree [^24^]}.
- Choice: action ∈ {continue study, trigger OOT investigation, shorten shelf life}.

**Why latency/cost matters.** Stability programs run for years across hundreds of attribute×batch×condition cells; each pull event needs a documented adjudication. Cheap per-cell judgments make continuous, contemporaneous trending feasible instead of periodic manual review campaigns.

**Evidence.** [^23^][^24^][^25^][^26^] — **Confidence: High.**

---

## 8. COA / report verification (does the generated document match the results?)

**One-liner:** A Noul gate before release: "Does this generated COA accurately reflect the underlying LIMS results and specifications?" — catching transcription, unit, and template errors.

**Current practice & bottleneck.** LIMS auto-generate COAs: "After approval, the LIMS generates test reports or Certificates of Analysis (CoAs)"; QA review "compares results against predefined specifications… flagged for review and approval" [^27^]. COA verification practice demands that "the product name, lot number, testing date, methods, and results should agree" between document and record [^28^]. AI-assisted COA review is an emerging vendor category: "automated comparison of COA data against customer specifications, flagging of out-of-specification results, anomaly detection… most mature in the pharmaceutical and specialty chemical sectors" [^29^]. Today the final read-through is human, per document, per lot.

**Primitive design.** State: generated COA (structured fields), underlying result records, specification table, customer/regulatory template requirements. Questions:
- Noul: "Every reported value on the COA matches the approved result record (value, unit, rounding)."
- Noul: "Every specification-required test appears on the COA."
- Noul: "All pass/fail statements are consistent with the specification limits."
- Noul: "Lot identity metadata (number, dates, methods) is internally consistent."
- Score: release-readiness of the document.

**Why latency/cost matters.** High-volume labs issue hundreds–thousands of COAs/week; a ~ms, fraction-of-a-cent Noul gate per document turns 100% verification (vs. sampled proofreading) into default practice, directly addressing a classic transcription-error vector.

**Evidence.** [^27^][^28^][^29^] — **Confidence: Medium-High.**

---

## 9. Sample login, test routing & lab-ops compliance gating

**One-liner:** Choice verdicts at accessioning ("which tests/routes does this sample need?") and Noul checks on operational prerequisites (reagent validity, chain-of-custody completeness).

**Current practice & bottleneck.** LIMS automate the deterministic core: "Based on predefined testing protocols, the LIMS automatically determines which analyses are required and routes the sample" [^27^]. The judgment residue — ambiguous test requests, non-standard sample types, priority triage under capacity constraints — falls to front-desk staff. On the compliance side, reagent validity is a hard gate: modern systems "automatically block titration operations… when the titrant exceeds its expiration date," because expired reagents invalidate results and breach GLP/GMP [^30^]; barcode/lot/expiration traceability is standard audit practice [^31^].

**Primitive design.** State: sample manifest (matrix, customer request text-as-tags, TAT, regulatory class), lab capacity snapshot, reagent lot/expiry data. Questions:
- Choice: test-package assignment among candidate protocols.
- Choice: priority lane ∈ {routine, expedite, hold-for-clarification}.
- Noul: "All reagents/consumables required for this test package are in-date and released."
- Noul: "Chain-of-custody/documentation for this sample is complete enough to start testing."

**Why latency/cost matters.** Login is the highest-throughput judgment point in the lab (every sample, every day); ms-class verdicts keep accessioning a flow-through operation, and cheap checks make per-test reagent gating universal rather than dependent on instrument-vendor features.

**Evidence.** [^27^][^30^][^31^] — **Confidence: Medium** (deterministic LIMS routing is well documented; AI judgment at login is an extrapolation).

---

## 10. Self-driving-lab experiment-outcome verdicts

**One-liner:** Noul/Score verdicts on raw analytical output ("did this experiment produce the target?", "how successful was this run?") that close the loop for active-learning/Bayesian optimization agents.

**Current practice & bottleneck.** Autonomous labs live or die on automated outcome adjudication. A-Lab: 355 experiments in 17 days, 41/58 targets (71%), enabled by "ML interpretation of experimental data" — CNN phase identification from XRD — plus "an active-learning algorithm that improves on failed synthesis procedures" [^32^]. The subsequent controversy (critics argued "no new materials were discovered" because the ML XRD interpretations were flawed [^33^]) shows outcome verdicts are the single most consequential judgment in the loop. The mobile robotic chemist ran "688 experiments within a ten-variable experimental space, driven by a batched Bayesian search algorithm," finding photocatalysts "six times more active" [^34^]. Only "37% of the 355 synthesis recipes tested by the A-Lab produced the desired targets" [^35^] — failed-run adjudication drives most loop decisions.

**Primitive design.** State: characterization summaries (XRD phase-match metrics, UPLC-MS/NMR assay output), recipe, target definition, prior attempts. Questions:
- Noul: "The target phase/product is present above the detection threshold."
- Score: outcome quality (yield/purity/activity rubric) for the surrogate model update.
- Noul: "This run is a valid datapoint (no instrument/handling fault) and should update the optimizer."
- Choice: failure class ∈ {kinetics, thermodynamics, execution error} to steer active learning (mirroring A-Lab's finding that fixing slow-kinetics failures would raise success 71%→74% [^32^]).

**Why latency/cost matters.** SDLs run 20+ experiments/day/lab with no human in the loop; every datapoint needs a verdict before the optimizer can propose the next batch. Latency directly sets loop cycle time; cost scales with experiment count (hundreds–thousands per campaign), so ~$0.04/Mtoken judgments are enabling while per-call LLM pricing would dominate reagent costs.

**Evidence.** [^32^][^33^][^34^][^35^] — **Confidence: High.**

---

## 11. Next-experiment selection advisory (Bayesian optimization / DoE)

**One-liner:** Choice/Score judgments that rank candidate conditions or pick between optimizer proposals — a cheap prior/guardrail layer around Bayesian reaction optimization.

**Current practice & bottleneck.** BO is established for reaction optimization: EDBO found 99%-yield conditions "in only four rounds, totaling 40 experiments" for a Mitsunobu reaction, and EDBO+ extends to multi-objective spaces [^36^]. BO "estimates the next parameters to be examined… by maximizing the acquisition function" over a GP surrogate [^37^]; hybrid GNN+BO systems match expert chemists with "approximately 5–10 times less time" [^38^]. Pain points documented in the literature: cold-start ("randomize the initial experiment without considering the difficulty of the reaction"), constraint handling, and condition-space pruning [^39^]. Gryffin and constrained variants handle hardware/safety constraints by rejection sampling [^40^].

**Primitive design.** State: candidate condition sets, descriptor summaries, campaign history, constraint list, cost model. Questions:
- Score per candidate: "chemical plausibility/feasibility of this condition set for this transformation" (pre-filter before expensive acquisition evaluation).
- Noul: "This candidate violates a practical constraint (solubility, safety, hardware)."
- Choice: which of the optimizer's top-k proposals to actually run, given cost/convenience trade-offs ("EDBO's ability to deliver a suite of distinct optimized conditions… enables chemists to choose between several options based on additional factors such as cost and operational convenience" [^36^]).

**Why latency/cost matters.** The advisory runs per candidate per iteration — potentially thousands of cheap pre-filter judgments per campaign, in-loop with robotic platforms. Sub-100 ms keeps the advisory off the critical path of autonomous platforms (RoboChem, Synbot [^40^]).

**Evidence.** [^36^][^37^][^38^][^39^][^40^] — **Confidence: Medium-High.**

---

## 12. Retrosynthesis step plausibility & route feasibility scoring

**One-liner:** Score/Noul per single-step reaction ("is this disconnection chemically plausible and executable with available reagents?"), composed into route-level feasibility rankings.

**Current practice & bottleneck.** Route quality evaluation is a recognized gap: "evaluating the quality of synthetic routes remains a significant challenge" and "no standardized metric exists to assess the feasibility of retrosynthetic routes" [^41^]. The Reaction Feasibility Model (RFM) from RetroGFN outputs "a feasibility score between 0 and 1" per step, averaged into Route Feasibility [^41^]. PaRoutes provides benchmark route-quality/diversity metrics [^42^]; Syntheseus and expert review remain the gold standard — "experimental validation or quality assessment by chemists is the most appropriate method" [^43^]. Segler et al.'s MCTS system used "a filter network to pre-select the most promising retrosynthetic steps" and in a double-blind test chemists rated computer routes "equivalent to reported literature routes" [^44^]. Feasibility filtering per step is exactly an atomic typed judgment, and solvability ≠ feasibility: "High solvability suggests a reaction is likely achievable, but if feasibility is low, the probability of success is limited" [^41^].

**Primitive design.** State: product/reactant structures (descriptors/SMILES-features), template class, conditions context, stock availability, precedent statistics. Questions:
- Score (0–1 rubric): single-step feasibility (chemoselectivity, conditions realism, reagent availability).
- Noul: "This step has meaningful literature precedent for this substrate class."
- Choice: rank candidate steps to expand next in the search tree (guide MCTS/Retro*).
- Composition: average step scores → route ranking (mirrors RFM averaging rationale [^41^]).

**Why latency/cost matters.** Multi-step planners expand thousands of nodes per target; feasibility scoring must run per node expansion without dominating search time. Sub-100 ms, fraction-of-a-cent calls make feasibility-guided search practical inside the planner loop.

**Evidence.** [^41^][^42^][^43^][^44^] — **Confidence: High.**

---

## 13. Tautomer & protonation-state selection

**One-liner:** Choice among enumerated microstates ("which tautomer/protonation state is dominant at pH 7.4?") for ligand preparation and dataset curation.

**Current practice & bottleneck.** Protonation/tautomer state assignment is a mandatory, error-prone ligand-prep step: "The affinity of a ligand for a given binding site is strictly dependent on the protonation state of the ligand" [^45^]. Tools span rule-based enumeration (Dimorphite-DL), pKa-ranking workflows (SPORES with ChemAxon microspecies distributions [^46^]; Schrödinger Epik/Macro-pKa, which "enumerates the protonation states… used to rank the protonation states by energy" [^47^]), and ML pipelines (QupKake: tautomer search → site enumeration → micro-pKa prediction, using GFN2-xTB to identify the most stable tautomer [^48^]). Each approach disagrees at the margins; selection among candidate states is an atomic ranking judgment done millions of times in library-scale prep.

**Primitive design.** State: enumerated microstates with predicted micro-pKa/energy features, target pH, downstream use (docking vs. dataset curation). Questions:
- Choice: dominant microstate among top-k candidates at given pH.
- Noul: "This tautomer is within ~1.5 kcal/mol of the minimum (worth carrying forward)."
- Score: confidence tier for flagging structures needing physics-based re-check.

**Why latency/cost matters.** Virtual libraries are 10⁵–10⁹ structures; exhaustive DFT/pKa ranking per microstate is prohibitive ("exhaustiveness… comes at a larger time and resource cost" [^47^]). A ms-class, near-free Choice judgment can triage the bulk and reserve expensive methods for flagged cases.

**Evidence.** [^45^][^46^][^47^][^48^] — **Confidence: Medium-High.**

---

## 14. ADMET flag triage ("Tier Zero" screening support)

**One-liner:** Noul/Score verdicts that consolidate multi-endpoint model outputs into triage decisions ("is this compound developable enough to synthesize?", "does this flag warrant an assay now?").

**Current practice & bottleneck.** In-silico ADMET is standard "Tier Zero" practice: "ADMET Predictor enables discovery teams to triage thousands of compounds virtually before synthesis or in vivo testing" [^49^]; ADMET-AI predicts 41 endpoints with risk flags [^50^]. Endpoint maturity varies — CYP inhibition and hERG "have matured to the point where a discovery team can reasonably deprioritize a compound based on the prediction alone, at least as a triage step," while sparse-data endpoints "function better as prioritization signals than as pass or fail gates" [^51^]. The judgment layer — weighing flags against potency/series context, deciding advance/optimize/hold/remove — is human: "Advance, optimize, hold, or remove" [^52^].

**Primitive design.** State: endpoint predictions + uncertainty/applicability-domain flags, structural alerts, series context, project thresholds. Questions:
- Noul per liability: "This flag is credible enough to act on (within applicability domain, well-supported endpoint)."
- Score: overall developability tier.
- Choice: triage ∈ {advance, optimize-with-flag, hold for assay, drop}.

**Why latency/cost matters.** Design cycles triage thousands of virtual analogs per week; judgments must run at enumeration speed. Cheap typed verdicts let every sketched analog get a consistent multi-endpoint gut-check before consuming medchem review time.

**Evidence.** [^49^][^50^][^51^][^52^] — **Confidence: High.**

---

## 15. Excipient compatibility & formulation stability verdicts

**One-liner:** Noul/Score judgments on preformulation evidence ("is this API–excipient pair compatible?", "does this DSC/FTIR/PXRD readout indicate interaction?") to triage formulation candidates.

**Current practice & bottleneck.** Drug–excipient compatibility screening is a required preformulation activity under ICH Q1A(R2)/Q1B [^53^]: "Incompatibilities may lead to physical changes such as polymorphic transitions or chemical reactions that degrade the API… Preformulation screening employs a combination of thermal, spectroscopic and diffraction methods" (DSC, TGA, FTIR, PXRD, chemometrics/PCA) [^54^]. ML prediction exists but is mid-accuracy: FormulationDE trained on 1,105 curated compatibility entries (579 compatible / 526 incompatible) achieves "accuracy of 0.75… AUC of 0.82" with SHAP-based functional-group risk rationales [^55^] — good enough to triage, not to decide. Interpretation of each thermal/spectroscopic readout is expert judgment per sample.

**Primitive design.** State: API/excipient structures & functional-group flags, DSC/TGA shift metrics, FTIR band changes, PXRD crystallinity deltas, stress conditions, ML compatibility prior. Questions:
- Noul: "The DSC thermogram shows evidence of interaction (shifted/new/deleted transitions)."
- Noul: "FTIR shows functional-group band shifts consistent with chemical interaction."
- Score: compatibility risk tier (compatible / monitor / incompatible) combining evidence streams.
- Choice: next action ∈ {accept excipient, orthogonal confirmatory test, drop excipient}.

**Why latency/cost matters.** Preformulation matrices pair one API against dozens of excipients × conditions × time points; each cell generates multiple readouts needing a verdict. Cheap composed judgments triage the matrix so costly confirmatory studies are spent only on ambiguous cells.

**Evidence.** [^53^][^54^][^55^] — **Confidence: Medium-High.**

---

## Cross-cutting observations

1. **The dominant pattern is "review by exception."** Across CDS audit trails [^8^], LC-MS QC flagging [^6^], library search hit lists [^16^], and ADMET triage [^51^], established practice already routes only flagged items to humans. Jev's typed judgments (Noul/Score with probabilities+confidence) are a native fit: the confidence field IS the exception router.
2. **Regulated contexts require support-layer positioning.** OOS invalidation [^2^], MS identification [^17^][^18^], and structure verification [^19^] all mandate qualified human final authority. Jev designs here emit documented first-pass adjudications, which also happens to be what inspectors want to see ("contemporaneous records of OOT adjudications" [^25^]).
3. **Economics enable 100% coverage.** The recurring bottleneck math (thousands of audit-trail entries/day [^8^]; hundreds of spectra/sample set [^17^]; 688–355-experiment autonomous campaigns [^34^][^32^]; 10⁵+ compound libraries [^49^]) is what makes sub-100 ms latency and ~$0.04/Mtoken pricing the actual product requirement, rather than marginal convenience.

---

## References

[^1^]: FDA, *Investigating Out-of-Specification (OOS) Test Results for Pharmaceutical Production* — guidance availability notice. https://downloads.regulations.gov/FDA-1998-D-0019-0001/content.pdf
[^2^]: Cloudtheapp, *What Is Out-of-Specification (OOS)? FDA Guidance and Investigation Requirements* (two-phase framework; 20-business-day Phase I target; OOS/OOT/OOE definitions; inspection-citation frequency). https://www.cloudtheapp.com/blog/what-is-out-of-specification-oos-fda-guidance-and-investigation-requirements
[^3^]: Amplelogic, *How Modern LIMS Improves OOS and OOT Investigation Management* (manual-process delays, incomplete documentation). https://www.amplelogic.com/blog/laboratory-information-management-system
[^4^]: ComplianceQuest, *OOS Investigation* (21 CFR 211.192; "thorough, timely, unbiased, well-documented, scientifically sound"). https://www.compliancequest.com/lab-investigations/oos-out-of-specification-investigation/
[^5^]: McDowall, *Are You Invalidating Out-of-Specification (OOS) Results into Compliance?*, LCGC/Chromatography Online (Phase 1/2a/2b detail; CDS SST auto-stop). https://www.chromatographyonline.com/view/are-you-invalidating-out-specification-results-compliance
[^6^]: Lab Manager, *Automating LC-MS Data Analysis: How to Solve Post-Acquisition Bottlenecks* (manual review as biggest bottleneck; review-by-exception; real-time monitoring). https://www.labmanager.com/automating-lc-ms-data-analysis-how-to-solve-post-acquisition-bottlenecks-34937
[^7^]: Visconti, *Limitations of manual integration of HPLC chromatograms* (FDA 2018 & MHRA 2021 expectations; justification/traceability/audit-trail/QA review). https://www.linkedin.com/posts/dr-antonio-visconti-b9132713_what-are-the-limitations-of-manual-integration-activity-7348600019744108544-qWwW
[^8^]: CASRAI, *Chromatography Data System Audit Trails* (FDA Dec-2018 Q&A quotes; review-by-exception acceptance; thousands of entries/day). https://casrai.org/guides/chromatography-data-system-audit-trails
[^9^]: MTC-USA, *System Suitability Requirements for USP HPLC Methods* (resolution, %RSD, tailing, plates). https://www.mtc-usa.com/kb-article/aa-03965
[^10^]: McDowall, *Are You Sure You Understand USP <621>?*, LCGC (S/N as SST parameter; point-of-use fitness). https://www.chromatographyonline.com/view/are-you-sure-you-understand-usp-621-
[^11^]: *Metrological Evaluation of Metopimazine HPLC Assay*, Pharmaceutics 17(10):1316 (typical SST acceptance criteria aligned to USP <621>/Ph.Eur. 2.2.46). https://www.mdpi.com/1999-4923/17/10/1316
[^12^]: See [^5^] (CDS auto-stop on SST failure; validation requirement).
[^13^]: McDowall, *The Why, What, and How of CDS Audit Trail Review*, LCGC (FDA Q7; PIC/S PI-041 §9.5). https://www.chromatographyonline.com/view/why-what-and-how-cds-audit-trail-review
[^14^]: madhadi.com, *LIMS, CDS, ELN, MES, CTMS — A Complete Map* (CDS warning-letter patterns: testing into compliance, trial injections, shared logins, disabled audit trails). https://www.madhadi.com/articles/gxp-systems-overview
[^15^]: Lockbox LIMS evaluation summary (ALCOA+ enumeration; IQ/OQ/PQ). https://www.rfp.wiki/specialty-industries/healthcare-life-sciences/healthcare/laboratory-information-management-systems/lockbox-lims
[^16^]: CASRAI, *NIST Library Match Factor, Explained*; and Rombo, *How Spectral Matching and Library Search Work* (MF/RMF semantics; NIST 900/800/700 bands; "a match score is not a universal confidence percentage"). https://casrai.org/guides/nist-mass-spectral-library-match-factor-interpretation ; https://rombo.ai/blog/spectral-matching-library-search-compound-identification
[^17^]: Stein, *New Library-Based Methods for Nontargeted Compound Identification by GC-EI-MS*, PMC11844893 ("Any identification of a nontargeted compound by GC-MS requires verification by an expert"). https://pmc.ncbi.nlm.nih.gov/articles/PMC11844893/
[^18^]: Nelson Labs, *Good Identification Practices for Organic Extractables & Leachables, Part 2* (MF>800 vs <700 guidance; expert mirror-plot review). https://www.nelsonlabs.com/wp-content/uploads/2020/10/Good-ID-Practices_Part2FINAL141020.pdf
[^19^]: Bruker/Mestrelab, *Mnova Verify — Structure Verification* (automatic structure-vs-data checks; reject incorrect structures pre-repository). https://www.bruker.com/it/products-and-solutions/mr/nmr-software/mnova-suite-chemist/mnova-nmr-verify.html
[^20^]: Elyashberg et al., *ACD/Structure Elucidator: 20 Years in the History of Development*, PMC8588187 (CASE expert system; 13C shift deviation ranking). https://pmc.ncbi.nlm.nih.gov/articles/PMC8588187/
[^21^]: NGS Technology, *Pharmaceutical Raw Material Analysis with FTIR-ATR* (USP <854>/EP 2.2.24/ICH Q7; <1 min/sample; similarity-threshold pass/fail; 40% testing-time reduction at a CMO). https://ngs-technology.com/pharmaceutical-raw-material-analysis/
[^22^]: *Versatile machine learning algorithms for FTIR spectroscopy*, Springer (PCA/PLS + SVM/LDA/DT classification pipelines; pharma applications). https://link.springer.com/article/10.1007/s43621-025-01146-4
[^23^]: ICH, *Q1E Evaluation of Stability Data* (95% confidence-limit intersection; regression; poolability). https://www.ema.europa.eu/en/documents/scientific-guideline/ich-q-1-e-evaluation-stability-data-step-5_en.pdf
[^24^]: CovaSyn, *ICH Q1E Shelf Life Calculation from Accelerated Data* (extrapolation decision table: 2×/+12 mo; 1.5×/+6 mo; none). https://covasyn.com/en/blog/ich-q1e-shelf-life-calculation-accelerated-data
[^25^]: PharmaStability, *FDA Expectations for OOT/OOS Trending* (validated trend detection; contemporaneous OOT adjudication records). https://www.pharmastability.com/oot-oos-handling-in-stability/fda-expectations-for-oot-oos-trending/
[^26^]: StabilityStudies.in, *ICH Q1E-Based Statistical Criteria for Stability Data Evaluation* (OOT investigation; outlier handling as common audit finding). https://www.stabilitystudies.in/ich-q1e-based-statistical-criteria-for-stability-data-evaluation/
[^27^]: CloudLIMS, *What is a LIMS?* (accessioning, routing, QA review vs. specifications, COA generation). https://cloudlims.com/what-is-a-lims/
[^28^]: Nivo Labs, *How to Verify a Certificate of Analysis Step by Step* (name/lot/date/method/results agreement). https://shopnivolabs.com/how-to-verify-a-certificate-of-analysis-step-by-step/
[^29^]: Contract Laboratory, *What Is a Certificate of Analysis? Complete Guide* (AI-assisted COA review: spec comparison, OOS flagging, anomaly detection). https://contractlaboratory.com/certificate-of-analysis-coa-understanding-its-importance-and-key-components/
[^30^]: GMP Insiders, *Karl Fischer Titration* (expiration warnings; titration blocking for expired reagents; GLP/GMP/ISO compliance). https://gmpinsiders.com/karl-fischer-titration-for-water-content-analysis/
[^31^]: Fishbowl, *Laboratory Inventory Management* (barcode lot/expiration traceability for audits). https://www.fishbowlinventory.com/blog/laboratory-inventory-management
[^32^]: Szymanski et al., *An autonomous laboratory for the accelerated synthesis of novel materials*, Nature 624, 86–91 (2023) (355 experiments/17 days; 41/58; ML XRD interpretation; active learning; 71%→74% kinetics fix). https://doi.org/10.1038/s41586-023-06734-w
[^33^]: Chemistry World, *New analysis raises doubts over autonomous lab's materials 'discoveries'* (Palgrave critique of ML XRD interpretations). https://www.chemistryworld.com/news/new-analysis-raises-doubts-over-autonomous-labs-materials-discoveries/4018791.article
[^34^]: Burger et al., *A mobile robotic chemist*, Nature 583, 237–241 (2020) (688 experiments/8 days; batched Bayesian search; 6× activity). https://doi.org/10.1038/s41586-020-2442-2
[^35^]: Kim et al., *Machine Learning for Accelerating Energy Materials Discovery*, Adv. Energy Mater. review (only 37% of 355 A-Lab recipes produced targets). https://scholarworks.unist.ac.kr/bitstream/201301/88748/2/
[^36^]: arXiv:2510.16293 review of Bayesian reaction optimization (EDBO Mitsunobu 99% in 40 experiments; EDBO+ multi-objective; choice among optimized conditions). https://arxiv.org/pdf/2510.16293
[^37^]: *Bayesian Optimization-Assisted Screening… Spiro-Dithiolane Synthesis*, PMC10343712 (BO/GP/acquisition-function mechanics; DoE complement). https://pmc.ncbi.nlm.nih.gov/articles/PMC10343712/
[^38^]: *Exploring Optimal Reaction Conditions Guided by Graph Neural Networks and Bayesian Optimization*, ACS Omega (HDO; 5–10× less time vs. experts; cold-start mitigation). https://pubs.acs.org/doi/10.1021/acsomega.2c05165
[^39^]: Seoul National University dissertation on BO reaction optimization (five challenges incl. cold start, condition correlation). https://s-space.snu.ac.kr/bitstream/10371/196488/1/000000177548.pdf
[^40^]: *Bayesian Optimization for Chemical Synthesis in the Era of AI*, Processes 13(9):2687 (constrained Gryffin; RoboChem; Synbot SDLs). https://www.mdpi.com/2227-9717/13/9/2687
[^41^]: *Retrosynthetic crosstalk between single-step reaction prediction and route planning*, PMC12392614 (RFM 0–1 feasibility; Route Feasibility averaging; solvability≠feasibility). https://pmc.ncbi.nlm.nih.gov/articles/PMC12392614/
[^42^]: Genheden & Bjerrum, *PaRoutes: towards a framework for benchmarking retrosynthesis route predictions*, RSC Digital Discovery 2022 (10,000-route benchmarks; quality/diversity metrics). https://pubs.rsc.org/en/content/articlehtml/2022/dd/d2dd00015f
[^43^]: Hamburg dissertation citing Syntheseus/Maziarz et al. ("experimental validation or quality assessment by chemists is the most appropriate method"). https://ediss.sub.uni-hamburg.de/bitstream/ediss/11437/1/Dissertation.pdf
[^44^]: Segler, Preuss & Waller, *Planning chemical syntheses with deep neural networks and symbolic AI*, Nature 555, 604–610 (2018) (filter network; double-blind equivalence to literature routes; cited in [^38^]). https://pubs.acs.org/doi/10.1021/acsomega.2c05165
[^45^]: TUM dissertation on ligand preparation (bond-order assignment; protomer generation; affinity dependence on protonation state; Dimorphite-DL, OpenBabel). https://mediatum.ub.tum.de/doc/1631703/document.pdf
[^46^]: ten Brink & Exner, *pKa based protonation states and microspecies for protein-ligand docking* (SPORES; ChemAxon MARVIN microspecies distributions; PLANTS docking validation). https://kops.uni-konstanz.de/bitstreams/bf17a82c-5937-4605-b548-dd1cc2d387b7/download
[^47^]: Schrödinger, *Solutions for Small Molecule Protonation State Enumeration and pKa Prediction* (Epik/Jaguar pKa/Macro-pKa; enumeration + energy ranking; cost of exhaustiveness). https://www.schrodinger.com/wp-content/uploads/2023/10/Schrodinger-solutions-for-small-molecule-protonation-state-enumeration-and-pKa-prediction.pdf
[^48^]: QupKake, ChemRxiv 2023 (tautomer search → site enumeration → micro-pKa; GFN2-xTB most-stable-tautomer selection). https://chemrxiv.org/doi/pdf/10.26434/chemrxiv-2023-gxplb
[^49^]: Pharmaron, *ADMET Predictor: In Silico Screening* ("Tier Zero" triage of thousands of compounds). https://www.pharmaron.com/knowledge-center/admet-predictor-in-silico-ml/
[^50^]: SciRouter/ADMET-AI v2 documentation (41 TDC endpoints; risk flags: hERG, AMES, DILI, CYP). https://scirouter.ai/tools/admet-ai/
[^51^]: Drug Discovery News, *AI-Powered ADMET prediction* (endpoint-dependent maturity; triage vs. gate distinction). https://www.drugdiscoverynews.com/ai-powered-admet-prediction-how-machine-learning-is-changing-drug-candidate-selection-17356
[^52^]: ComputaBio, *Small Molecule Druggability Prediction* ("Advance, optimize, hold, or remove" triage action framing; SwissADME/pkCSM cases). https://www.computabio.com/omnidesignai/small-molecules-druggability-prediction.html
[^53^]: PharmaStability, *Excipient Compatibility Studies* (ICH Q1A(R2)/Q1B regulatory basis; physical/chemical/biological compatibility). https://www.pharmastability.com/api-excipient-drug-substance-stability/excipient-compatibility-studies/
[^54^]: Nature Index topic summary, *Drug-Excipient Compatibility Assessment in Pharmaceutical Formulations* (DSC/TGA/FTIR/PXRD; chemometrics/PCA; 2023–2024 screening studies). https://www.nature.com/nature-index/topics/l4/drug-excipient-compatibility-assessment-in-pharmaceutical-formulations
[^55^]: FormulationDE (PharmaExcipients summary) (1,105-entry database; ML accuracy 0.75, AUC 0.82; SHAP functional-group risk). https://www.pharmaexcipients.com/news/formulation-de-ai/
