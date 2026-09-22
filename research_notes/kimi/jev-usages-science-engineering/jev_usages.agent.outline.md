# The Judgment Layer: A Comprehensive Catalog of System One Typed-Judgment Model Usages Across Engineering, Physics, Mathematics, and the Chemical Industry

## Executive Summary (~600 words — written in Round 2 after all chapters)
### Key Findings
#### ~190 cataloged usages across four domains, with 11 high-confidence usage clusters independently cross-verified
#### The dominant pattern: "generate expensively, judge cheaply" — a sub-100ms, ~$0.04/Mtok typed-judgment layer gating escalation to expensive reasoning or human review
#### Honest limits: vendor-reported specs, text-only input, advisory-only positioning in safety contexts, zero-shot vs trained-classifier validation gap

## 1. The System One Paradigm: Typed Judgments as Software Primitives (~1500 words, 2 tables)
### 1.1 From Text Generation to Typed Judgment
#### 1.1.1 The structural mismatch of using generative LLMs for code-consumed decisions (prompt-and-parse fragility) and the System One alternative
#### 1.1.2 The three primitives — Choice, Noul, Score: return types, probability distributions, confidence semantics, parallel question evaluation (table: primitive reference)
### 1.2 The Economic and Latency Envelope
#### 1.2.1 Vendor-reported operating point: ~70–500ms latency, $0.042/Mtok input with free output, batching multipliers (13 questions ≈ 12× cheaper, 10× faster) — explicitly flagged as vendor-published figures
#### 1.2.2 Positioning against the four alternatives: hard rules, classical trained ML, generative LLM calls, human judgment (table: five-way comparison on latency, cost, semantic depth, calibration, setup cost)

## 2. Decision Framework: When a Fast Typed Judgment Wins (~2000 words, 2 tables)
### 2.1 The Cascade and Routing Evidence Base
#### 2.1.1 Model-cascade economics: FrugalGPT (up to 98% cost reduction at matched quality), RouteLLM (85% cost cut at 95% GPT-4 quality), speculative cascades
#### 2.1.2 Small specialized judges approaching generative-judge quality: Prometheus-13B (Pearson 0.897 vs GPT-4's 0.882), JudgeLM-7B (>90% teacher agreement), LlamaGuard as production precedent for typed probability judgments
### 2.2 Calibration as the Enabling Property
#### 2.2.1 Selective prediction and Chow's reject rule: why calibrated probabilities make thresholded automation safe; conformal triage connection
### 2.3 Selection Criteria
#### 2.3.1 Five conditions favoring typed fast judgments; four conditions favoring rules, classical ML, generative LLMs, or humans (table: decision matrix)

## 3. Engineering Usages I: Software Engineering and Systems Infrastructure (~2800 words, 2 tables)
### 3.1 Software Engineering Workflows
#### 3.1.1 Alert and finding triage: SAST false-positive suppression, secret-scanning verification (GitHub's LLM stage cut false positives 75.76%), log-anomaly verdicts
#### 3.1.2 Test and CI/CD intelligence: flaky-test judgment, CI failure triage, commit-aware test prioritization
#### 3.1.3 Incident and security operations: SOC alert triage (AACT: 61% alert reduction at 1.36% false-negative rate), phishing classification at the 89ms real-time bar, incident correlation and runbook routing
#### 3.1.4 Code workflow routing: duplicate bug detection, reviewer routing, LLM routing, guardrail/injection classification, code-search reranking
### 3.2 Systems and Infrastructure
#### 3.2.1 Networking and cloud: traffic/DDoS verdicts, configuration verification (Batfish precedent), autoscaler signal judgment, VM placement
#### 3.2.2 Data and compiler systems: query routing/hint steering, index advisory, cache admission; MLGO inlining and NeuroVectorizer phase-ordering precedents, EDA DRC/QoR triage
#### 3.2.3 Summary table of 30 usages with primitive mapping and confidence

## 4. Engineering Usages II: Industrial Automation and Asset-Intensive Operations (~2800 words, 2 tables)
### 4.1 Alarm Management and Abnormal Situation Management
#### 4.1.1 Alarm flood triage and root-cause shortlisting against ISA-18.2/EEMUA 191 baselines (Milford Haven: 275 alarms in 11 minutes)
#### 4.1.2 Alarm rationalization copilot and state-based alarming inference; operator procedure selection
### 4.2 Robotics and Manufacturing Execution
#### 4.2.1 Precondition/postcondition and success verification: DoReMi (IROS 2024) binary-VLM questions "cost less than 0.1 second" as direct precedent; recovery-policy selection; SayCan-style affordance judgments
#### 4.2.2 MES quality adjudication: vision false-reject verdicts, andon classification, line-clearance checklists; explicit non-SIF advisory boundary per IEC 61511
### 4.3 Asset-Intensive Operations
#### 4.3.1 Predictive maintenance: work-order/log triage (<50ms/note spec), failure-mode routing, RUL-regime selection per ISO 13374/13381
#### 4.3.2 Power grids, aerospace, automotive, SHM: PMU event labeling, FOQA exceedance validation, ATA/JASC defect routing, SHM false-alarm adjudication, track-geometry severity
#### 4.3.3 Summary table of ~31 usages with primitive mapping and confidence

## 5. Physics Usages (~2200 words, 2 tables)
### 5.1 High-Energy and Nuclear Physics
#### 5.1.1 Timescale discipline: L1 triggers (50ns–4µs FPGA) as explicit non-fit; HLT (~451ms/event at CMS) as marginal side-channel only; DQM, certification, and operations as clear fits
#### 5.1.2 Catalog: anomaly-trigger output triage (AXOL1TL/CICADA), DQM shifter verdicts, run classification, LHC beam-loss triage (CERN tool deployed Nov 2023), data-vs-MC validation, logbook triage (Fermilab ADEL)
### 5.2 Astronomy and Experimental Physics
#### 5.2.1 Survey alert brokers at Rubin/LSST scale: real-bogus, typing, cross-match, follow-up prioritization — the $600/night full-stream economics tipping point (10M alerts/night)
#### 5.2.2 Gravitational-wave and multi-messenger triage (GraceDB, Gravity Spy), fusion disruption advisory, quantum calibration verdicts (112-qubit decision-tree isomorphism), XRD phase identification as a parallel-Noul battery, cryo-EM triage, Zooniverse routing (43% effort saving)

## 6. Mathematics Usages (~2200 words, 2 tables)
### 6.1 Theorem Proving and Formal Verification
#### 6.1.1 Premise selection and given-clause guidance: MaLARea/ENIGMA lineage, Magnushammer (59.5% vs 38.3% vs Sledgehammer) — the strongest-validated judgment slot in mathematics
#### 6.1.2 Tactic selection, ATP strategy scheduling (MaLeS/BliStrTune), proof-state critics, lemma/conjecture filtering, interestingness scoring (HR), step-level verification (Math-Shepherd PRM precedent), autoformalization faithfulness judging (3–29pp compile-faithfulness gap)
### 6.2 Symbolic Computation, Optimization, and Education
#### 6.2.1 Algorithm-selection points in computer algebra: CAD variable ordering (Florescu–England "safe choice point"), Gröbner preconditioning, Maple integration sub-algorithm selection (TreeLSTM 84.6% vs 60.5%)
#### 6.2.2 Solver ecosystems: Z3 tactic probes (Z3alpha, +42.7% on QF_BV), SATzilla-style portfolio choice, SMAC/Hydra-MIP configuration advisory; ODE stiffness judgment; the sub-10ms roadmap unlocking in-loop branching
#### 6.2.3 Math education: STACK equivalence verdicts, misconception classification, Hint Factory-style hint selection; formula retrieval reranking

## 7. Chemistry-Industry Usages (~2800 words, 3 tables)
### 7.1 Process Operations and Control
#### 7.1.1 APC/MPC supervisory layer: controller performance-monitoring verdicts, constraint-status interpretation, soft-sensor plausibility (Qin–Badgwell 4,600+ MPC installs as the install base)
#### 7.1.2 Fault detection and diagnosis verdict layer above PCA/PLS; golden-batch verdicts; ASM operator decision support (3–8% documented capacity losses); ISA-18.2 rationalization drafting; scheduling advisory
### 7.2 Laboratory, Analytical Quality, and Self-Driving Labs
#### 7.2.1 Review-by-exception in regulated QC: OOS/OOT triage per FDA guidance, chromatogram integration verdicts (USP <621>), ALCOA+ data-integrity checks
#### 7.2.2 Self-driving lab loops: experiment-outcome verdicts feeding Bayesian optimization (A-Lab, mobile robotic chemist precedents); cheminformatics triage (reaction feasibility, retrosynthesis plausibility, ADMET flags)
### 7.3 Safety, Regulatory, and Compliance
#### 7.3.1 SDS/GHS classification verdicts (~95% ML category-accuracy literature), cross-supplier SDS discrepancy adjudication (Health Canada audit: 17.5% Section-4 inconsistency), REACH/CLP change triage
#### 7.3.2 HAZOP/LOPA support, MOC replacement-in-kind triage, permit-to-work semantic verification, incident classification (API RP 754), dual-use/ECCN screening (92% false-positive reduction precedent) — all advisory-only, explicitly outside SIF/SIS per IEC 61511

## 8. Cross-Domain Synthesis and Adoption Guidance (~2000 words, 2 tables — Round 2)
### 8.1 Recurring Architecture Patterns
#### 8.1.1 The three-layer stack: deterministic pre-filter → semantic judgment layer → expensive reasoning/human escalation
#### 8.1.2 Isomorphisms across domains: review-by-exception (pharma QC ≡ SOC ≡ FOQA); standards-as-question-banks (ISA-18.2, ISO 13374, ICH); batch-Noul as the killer primitive
### 8.2 Honest Limits and Conflict Zones
#### 8.2.1 The eight conflict zones: latency realism (70–500ms vendor range vs sub-100ms claims), zero-shot vs trained baselines, text-only scope, calibration caveats, safety-boundary positioning
### 8.3 Adoption Guidance
#### 8.3.1 Prioritization heuristic: baseline type (human/rules/trained ML) predicts where the judgment layer wins first; decision-theoretic expected-value framing (Elkan cost-sensitive thresholds)
#### 8.3.2 What the sub-10ms roadmap unlocks — and what it does not

# References
## jev_usages.agent.outline.md
- **Type**: Report outline
- **Description**: This outline file
- **Path**: /mnt/agents/output/jev_usages.agent.outline.md

## Research artifacts
- **Type**: 13 dimension reports + cross-verification + insights
- **Description**: /mnt/agents/output/research/jev_usages_dim01.md … dim13.md, jev_usages_cross_verification.md, jev_usages_insight.md
- **Path**: /mnt/agents/output/research/
