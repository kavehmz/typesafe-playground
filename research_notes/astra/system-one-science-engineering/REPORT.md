# Fast typed judgments in engineering, physics, mathematics and the chemical industry

Research date: **21 September 2026**. This assessment contains **72 concrete application hypotheses**, separated into four domain chapters. It draws on original papers, authors' project documentation, official engineering guidance and current TypeSafe documentation. It is a broad research map, not a systematic review of every paper or a claim of exhaustive coverage.

**Main finding:** very inexpensive semantic judgments could make existing scientific and engineering methods easier to apply continuously, at greater coverage, and with less manual coordination. The strongest opportunities combine a small learned decision with a domain model, algorithm, experiment or checker that does the substantive work. Published successes of specialist classifiers establish the architectural opportunity; they do not establish the capability of current Jev.

The central question is therefore: **Where does an existing method need a judgment that is hard to write as a rule, cheap enough to ask frequently, and useful even though it can be wrong?**

## Read the research

- [Engineering: 18 applications](engineering.md): requirements, maintenance, test selection, robotics, manufacturing, scheduling, buildings and digital twins.
- [Physics: 18 applications](physics.md): experimental acquisition, detector operations, quantum devices, atomistic simulation and physical inference.
- [Mathematics: 18 applications](mathematics.md): theorem proving, formalization, counterexamples, solver portfolios, symbolic computation and optimization.
- [Chemistry and chemical industry: 18 applications](chemistry-industry.md): research data, autonomous labs, formulation, analytical quality, manufacturing and plant records.

Every application includes a proposed input, question type, downstream mechanism, economic or timing rationale, validation target and limitation. The separate domains share methods, but have different evidence standards: physical measurement, formal proof, engineering qualification and chemical characterization are not interchangeable.

## What is actually available now

The current [model specification](https://docs.typesafe.ai/models) lists Jev 1.13 at **$0.042/M input tokens**, with **free outputs**. It accepts text, including JSON-structured text. The request limits are **64K total for state and all questions**, with **32K for state plus the longest question**. These are not separate 32K input/output windows. The documented limits are 250,000 tokens/second and 1,200 requests/minute, explicitly subject to change. Customer fine-tuning is not currently offered.

The [API reference](https://docs.typesafe.ai/api) limits a Choice to 255 options and a Score to 10 ordered levels. Large scientific candidate spaces therefore need retrieval, hierarchical selection or batched per-candidate judgments. A Score is a distribution-weighted position over the supplied levels, not a general-purpose numerical predictor.

The company's [launch article](https://typesafe.ai/blog/introducing-system-one-models-and-jev) reports **70–500 ms end-to-end**, with published evaluations generally run from US West Coast laptops. The user's approximately 100 ms premise remains a useful design scenario; sub-10 ms and a 1M-token context are future scenarios, not verified capabilities or commitments. No latency or accuracy benchmark was run for this research.

The [known-limitations page](https://docs.typesafe.ai/model-jaggedness/jev-1.13) describes weaknesses in numerical precision, counting, indirection, distracting context and consistency across independently worded questions. This makes semantics over compact evidence a stronger current fit than raw arrays, molecular structures or deep mathematical reasoning.

## Six established mechanisms behind the opportunity

### 1. Turn observations into usable variables

Engineering and science contain vast amounts of information whose vocabulary is inconsistent: maintenance notes, experimental observations, solver logs, informal hypotheses and procedural exceptions. Ordinary software needs stable categories and relations to act on it.

A classifier can map “this run was never measured” to a missing-observation flag, connect an operator's equipment nickname to an asset register, or distinguish a measured yield from a reported conversion. The downstream statistical or operational system then has a better-defined input.

The relevant precedent is technical language processing and structured scientific data, including [NIST maintenance-language research](https://www.nist.gov/publications/technical-language-processing-unlocking-maintenance-knowledge) and the [Open Reaction Database](https://pubmed.ncbi.nlm.nih.gov/34727496/). My inference is that an inexpensive programmable judgment interface could lower the effort of building and maintaining such mappings. Whether it outperforms a dictionary, embedding classifier or domain-trained extractor is empirical.

### 2. Choose expensive work rather than perform it

Many mathematical systems already know how to execute a valid operation. The difficult choice is which operation to try next: a premise, tactic, solver, branch, cut, search neighborhood or elimination order.

The learned component need only improve the allocation of computation. [DeepMath](https://arxiv.org/abs/1606.04442), [SATzilla](https://arxiv.org/abs/1111.2249) and [learned MIP branching](https://proceedings.neurips.cc/paper/2019/hash/d14c2267d848abeb81fd590f371d39bd-Abstract.html) supply concrete precedents. Jev could be tested as a semantic selector at coarse decision points; these papers mostly used specialized training and representations.

The distinction matters: a poor tactic choice usually wastes time when a proof kernel checks the result. An invalid pruning decision can remove the correct solution. Preserve sound inference, admissible bounds, legal moves and the underlying search's required exploration. An exact checker only checks the problem actually submitted; it does not certify that an informal requirement was translated correctly.

### 3. Allocate scarce measurements

In experimental science the expensive item is often a beamline minute, a chemical experiment, a device cooldown or an analytical instrument slot. Active learning and Bayesian experimental design decide which observation to obtain next.

A semantic model can help identify a contextual restriction, distinguish an invalid observation from a genuine low result, or select an appropriate measurement procedure. A quantitative model should still calculate information gain, physical constraints and uncertainty. [Autonomous scattering](https://www.nature.com/articles/s41598-020-57887-x) and [Bayesian chemistry optimization](https://pubmed.ncbi.nlm.nih.gov/33536653/) ground that architecture.

The potential gain is improved experimental allocation and fewer unusable runs. It is not established by making a plausible choice on a historical log. A changed measurement policy needs counterfactual evidence from a validated simulator or a prospective controlled experiment.

### 4. Use a cheap first stage and escalate selectively

Process familiar cases through a bounded workflow and send ambiguous cases to an expensive specialist. This is related to selective classification, where increased acceptance coverage trades against error among accepted predictions. [Geifman and El-Yaniv](https://arxiv.org/abs/1705.08500) provide a principled foundation.

This can operate on document fields, simulation exceptions, analytical investigation packets and candidate scientific evidence. It becomes useful when the cost avoided exceeds the first-stage cost plus the damage from misses and unnecessary escalation. Rare positives make simple accuracy especially misleading.

A reject option is necessary but insufficient: an overconfident model can still miss an unfamiliar case. Measure rare-case recall, errors on automatically accepted cases and time/device/project holdouts. Do not infer independence merely because many questions are evaluated in parallel.

### 5. Supply learned preferences to constrained software

For a robot, “this skill is relevant to the request” and “this skill can execute here” are different questions. [SayCan](https://arxiv.org/abs/2204.01691) combines semantic relevance with grounded affordance/value functions. The same division appears in scheduling, formulation and scientific workflow selection.

Jev could supply a soft preference or semantic constraint candidate. A planner, optimizer, controller or checker determines admissibility. [Simplex-style runtime assurance](https://arxiv.org/abs/2102.12981) shows how advanced control components can be placed within an analysed protective architecture. Merely copying its shape does not inherit its safety proof.

No physical quantity should be smuggled into a qualitative Score. A “promising” candidate, a “likely” statement and a feasible action need explicit, different definitions.

### 6. Turn judgments into reusable scientific or industrial features

Instead of asking one opaque “good or bad?” question, generate interpretable fields: a reported process deviation, stated measurement invalidity, missing hypothesis, or a link to an equipment condition. Existing statistical models can learn how those features relate to observed outcomes.

[Snorkel](https://arxiv.org/abs/1711.10160) provides a precedent for programmatic weak supervision; [NIST maintenance-KPI research](https://www.nist.gov/publications/discovering-critical-kpi-factors-natural-language-maintenance-work-orders) provides a domain example of turning text into variables that guide further investigation. A Jev output would be a noisy label or feature, not new ground truth. Independent measured outcomes remain essential.

This also creates a deployment path: use rich contextual judgments offline to help develop a smaller local model for a stable task, subject to provider terms and proper evaluation. The online system may not need a remote semantic call indefinitely.

## What the low cost changes

These are arithmetic illustrations using the verified input price, not measured bills or performance promises. They exclude retrieval, OCR, serialization, storage, failed calls, human review, specialist models and instrument operation.

| Total input tokens per request | Input cost per request | Input cost for 1 million requests |
|---:|---:|---:|
| 1,000 | $0.000042 | $42 |
| 5,000 | $0.000210 | $210 |
| 32,000 | $0.001344 | $1,344 |
| 64,000 | $0.002688 | $2,688 |

Suppose 32 independent questions share 4,000 state tokens and each question adds 80 tokens. One batched request uses about 6,560 input tokens, costing **$0.00027552**, or **$0.00000861 per judgment**. Sending them separately repeats the state, using 130,560 tokens and costing **$0.00548352**—approximately **19.9 times more**. Actual tokenization and API accounting must be measured. Batching amortizes the shared state; it does not make input unlimited or eliminate output serialization.

This price can make it reasonable to inspect all candidate evidence rather than a tiny sample, add several distinct checks to every event, rebuild historical semantic features after improving a definition, and cheaply compare many candidate branches before a costly action. The new economic possibility is comprehensive *semantic coverage*, not the disappearance of all engineering expense.

There are two important scaling limits:

- **Continuous control has enormous volume.** One 5K-token request at 10 Hz costs about **$181.44 per day per device**, before other costs. At 100 Hz, it is about $1,814.40/day; that hypothetical rate also exceeds both currently documented nominal quotas. Event-triggered checks, compact inputs and batching are often better designs.
- **Service capacity can dominate speed.** The documented 1,200 requests/minute is 20 requests/second. At the hypothetical 6,560-token batch, the request quota would bind before the 250K-token/second quota: at most roughly 640 independent question answers/second for 32-question batches under those limits. This is a nominal arithmetic ceiling, not guaranteed throughput; dynamic limits and latency tails still matter.

An existing decision tree, parser, physics rule or local specialist network may cost effectively nothing per call. The right comparison includes those alternatives. Jev's advantage must come from useful semantic flexibility or reduced development/maintenance cost, not simply being cheaper than a large generative model.

## What 100 ms, 10 ms and 1M context would change

**Latency:** 100 ms versus 10 ms is valuable for an interactive authoring check, a quick robot subtask transition or a chain containing many genuinely dependent semantic steps. For a two-hour simulation, both are negligible if the selected workflow is useful. For a ten-minute experiment, removing 90 ms changes total duration by only 0.015%; avoiding a failed experiment is the much bigger gain.

For a native solver that makes millions of tiny decisions, even 10 ms may be unacceptable. Before adding a call, estimate:

`net time saved = expensive downstream work avoided − feature/inference/checking overhead − expected recovery work`.

This expression is a workload accounting rule, not a performance prediction. Measure the entire application and its tail latency. For physical systems, observe freshness: a result for an old state must not silently apply after the apparatus changes.

**Context:** a decision packet with a relevant procedure, recent observations, constraints and a few candidates often fits well below 32K. A million-token window could help some unusually document-heavy judgments, but does not provide a better sensor representation, a bigger legal candidate set or stronger mathematical reasoning. Retrieve and preserve exact evidence first. At unchanged pricing, a hypothetical 1M-token request would cost $0.042, a thousand times the cost of a 1K-token request.

## Eight initial experiments worth prioritizing

These are my engineering judgments about testability and likely fit, not externally measured rankings.

| Priority candidate | Why it is a good test | Evidence that would establish value |
|---|---|---|
| Maintenance work-order structuring | Text is abundant; output taxonomy is bounded | Better coding/coverage and less review time on unseen sites |
| Requirements-to-test linkage | Semantic relationship with independently inspectable evidence | Fewer missed impacted tests at fixed review burden |
| DFT workflow exception routing | Expensive downstream compute; short, contextual logs | More valid converged jobs with less wasted compute |
| Scientific result comparability checks | Errors can contaminate whole datasets | Higher incompatible-record recall with acceptable false exclusions |
| Mathematical premise reranking | Clear selector/checker separation | More checked proofs within the same total time budget |
| Formalization assumption linting | Explicit missing conditions are auditable | Better recall of literal mismatch, without accepting equivalence claims |
| Chemical observation-status labeling | Invalid/missing/censored data can mislead optimization | Better downstream experimental efficiency in prospective tests |
| Certificate/method evidence reconciliation | Frequent structured records with semantic exceptions | Fewer missed discrepancies and reduced quality-review effort |

The more ambitious second wave is experimental scheduling with semantic context, robot skill relevance, constrained synthesis-route screening, adaptive characterization and coarse solver portfolio control. Per-clause proof decisions, per-node MIP branching, raw spectra interpretation, raw quantum readout and physical safety functions require stronger reasons to use this product rather than specialized local methods.

## The evaluation needed to turn an idea into evidence

1. **Define the decision and the downstream consequence.** For example, retain a useful lemma, flag an incomplete measurement, or route a failed calculation. State the cost of both types of error.
2. **Assemble independent reference outcomes.** Use checked proofs, confirmed repairs, expert-adjudicated text labels and valid measurements. Do not call agreement with another model ground truth by default.
3. **Partition by the source of generalization.** Hold out devices, material families, projects, theorem dependencies, sites and later time periods. Avoid near-duplicate rows across splits.
4. **Compare real alternatives.** Include current rules, retrieval alone, a small supervised classifier, and an appropriate stronger model. In a fast mathematical workflow, compare with trying all cheap candidates directly.
5. **Measure the whole workflow.** Include reviewer time, scientific yield, verified outcomes, instrument/solver time, rare misses, p50/p95/p99 latency, input volume and fallback frequency. Per-question accuracy alone is inadequate.
6. **Fit acceptance criteria on separate data.** Report risk–coverage curves, calibration and uncertainty on rare failure rates. [Calibration research](https://proceedings.mlr.press/v70/guo17a.html) and [risk-controlling prediction sets](https://arxiv.org/abs/2101.02703) provide relevant methods. Method-specific sampling and loss assumptions must hold: for example, the cited RCPS procedure assumes i.i.d. target-distribution calibration data, a nested predictor family, a monotone loss and valid confidence bounds. Generic thresholds cannot guarantee performance after arbitrary distribution shift.
7. **Audit what the selector excludes.** Preserve a randomized or otherwise statistically designed sample of rejected candidates. Otherwise filtering can hide new phenomena and make a bad model look successful.
8. **Progress from replay to prospective evidence.** Replay can establish record interpretation. Claims about different experiments, schedules or searches require suitable counterfactual coverage, validated simulation or controlled prospective tests.

For perspective, consider one million events with 0.1% true anomalies. A detector with 95% sensitivity and 99% specificity produces about 950 true alarms and 9,990 false alarms: only **8.7% of alarms are true**. Low token prices do not remove the cost of reviewing those false alarms. This is a calculated example, not a Jev measurement.

Cost-sensitive decision theory therefore matters more than a universal confidence cutoff. Choose an action by its estimated consequences, including review and recovery costs, while retaining hard domain constraints. [Elkan's cost-sensitive-learning paper](https://cseweb.ucsd.edu/~elkan/rescale.pdf) supplies the formal foundation. Individual Noul values do not automatically form a coherent joint probability model; Choice confidence is not an instrument uncertainty, a mathematical certificate or a proof of a safe action.

## Research boundary and deliverables

This assessment verifies source-backed methods and proposes where Jev might fit. No TypeSafe skill or software package was installed. No credentials, private scientific datasets or paid model calls were used. The only new workspace material is this research package. No listed application has been validated on Jev in this investigation.

The credible long-term hypothesis is that cheap semantic judgments reduce the number of places where software must stop and wait for a person to interpret context. The test is whether those judgments improve verified outcomes in a particular workflow at an acceptable total cost. The four chapters provide 72 specific places to run that test.


---

# Engineering: 18 opportunities for inexpensive typed judgments

Research date: 21 September 2026. This chapter proposes applications; it does not report Jev benchmark results. Engineering here includes systems, mechanical/manufacturing, electrical/building, robotics and software engineering. Physics and the chemical industry have separate chapters.

**Reading the evidence.** A reference establishes a practice or a related learned method. It does not establish that Jev can perform that method. **Pilot** means the proposed judgment is primarily about supplied text or semantic metadata and is a plausible present-day experiment. **Research** means the useful judgment requires substantial domain validation or capabilities demonstrated only by specialist models. Neither label means production-ready. C = Choice; N = Noul; S = Score.

## E01. Requirements ambiguity and contradiction screening — Pilot

**Existing practice:** engineers review requirements for clarity, completeness, consistency and verifiability. NASA provides explicit checklists and verification matrices [E1].

**Proposed insertion:** supply one requirement, its definitions, operating mode and a short list of related clauses. Use separate N questions for unspecified actors, undefined terms, qualitative criteria without a test, and apparent conflict with each retrieved clause. Use C to distinguish a contradiction from different operating conditions or insufficient context. Exact numbers, units and cross-reference resolution remain in code.

**Why cheap judgments matter:** review every edit during authoring, rather than wait for a periodic document review. Batch related checks and retain the flagged source spans.

**Measure:** defect recall against engineer-adjudicated reviews, false alarms per requirement and editing time. A suspicious sentence is a review item, not proof of inconsistency; retrieval omissions must be audited.

## E02. Requirements-to-test traceability and change impact — Pilot

**Existing practice:** requirements, design items and verification evidence are linked so that changes can be traced [E1].

**Proposed insertion:** retrieval produces candidate requirement/test pairs. C asks whether a test directly verifies, partly covers, merely mentions, or does not address the requirement. Separate N judgments identify whether the changed behavior falls within a linked test's stated coverage. A graph database stores accepted links; dependency traversal and coverage counts are deterministic.

**Why cheap judgments matter:** relationships can be reconsidered on every change instead of allowing a traceability matrix to become stale. Candidate retrieval prevents an uncontrolled all-pairs workload.

**Measure:** missed impacted tests and link precision/recall, alongside reviewer minutes. A textual description of coverage is weaker evidence than an executable test that actually asserts the requirement.

## E03. Maintenance work-order coding — Pilot

**Existing evidence:** NIST's technical-language-processing work treats maintenance records as a distinct engineering language with abbreviations, incomplete descriptions and specialist vocabulary [E2, E3].

**Proposed insertion:** given a work order, asset hierarchy and site dictionary, select the component, symptom category, reported action and unresolved status through C/N. Candidate names come from the asset register. Dates, part numbers and durations are extracted or validated in code. Multi-component jobs receive multiple independent labels rather than a forced single category.

**Why cheap judgments matter:** an entire maintenance history can become queryable, with coding updated as records arrive. The same labels can support reliability analysis, spare-parts planning and technician handovers.

**Measure:** agreement with reliability engineers, unknown/abstention coverage, site transfer and downstream data completeness. A label such as “bearing problem” is not a measured failure probability.

## E04. Failure-case retrieval and diagnostic checklist selection — Pilot

**Existing foundation:** structured maintenance knowledge and systematic failure analysis [E2, E4].

**Proposed insertion:** a vibration model or operator first reports an anomaly. Retrieve past cases and approved inspection procedures. S ranks similarity of the *reported symptoms and operating context*, while C selects an applicable checklist or “no adequate match.” Code verifies equipment identity, applicable revision and prerequisites before displaying it.

**Why cheap judgments matter:** diagnosis support becomes available for ordinary work orders as well as expensive escalations. Newly arriving observations can change the ranking promptly.

**Measure:** diagnostic steps to confirmed root cause, time to repair, and rate of irrelevant or inapplicable procedures. Do not let familiar wording suppress an unusual fault; preserve an exploration/escalation path. This is diagnostic support, not remaining-useful-life prediction from raw signals.

## E05. Keeping FMEA/FMECA current after changes — Pilot

**Existing practice:** NASA's FMECA guidance treats the analysis as a living document that changes with designs, materials and operations [E4].

**Proposed insertion:** compare an engineering change or confirmed incident with existing failure-mode entries. N flags whether an assumption, effect, mitigation or detection method may be affected. C links an observed failure to candidate entries or identifies a potential gap. Engineers decide whether to revise the analysis; physical causality, criticality and failure-rate calculations use proper engineering models.

**Why cheap judgments matter:** a previously intermittent review becomes an event-triggered maintenance process for the risk register.

**Measure:** known impacted entries recovered, missed effects, reviewer workload and time from incident to review. Similarity cannot establish completeness: an unseen failure mode is precisely what an existing catalogue may omit.

## E06. Incident and log-context triage — Pilot

**Existing evidence:** DeepLog demonstrates learned anomaly detection on log sequences, using a trained sequence model [E5].

**Proposed insertion:** retain the existing telemetry detector. Give Jev selected abnormal messages, recent deployment changes and relevant runbooks. C distinguishes likely application, dependency, infrastructure or instrumentation context; N assesses whether a supplied runbook addresses the observed symptom. Code performs time ordering, topology correlation and numerical anomaly calculations.

**Why cheap judgments matter:** contextual routing can accompany many small alerts before an incident grows. It can also attach semantic features to an existing statistical detector.

**Measure:** correct escalation destination, time to useful investigation, incident recall and false closures. DeepLog does not establish that Jev can replace sequence modelling. Correlated alerts must not be counted as independent confirmation.

## E07. Regression-test prioritization — Pilot

**Existing evidence:** Machalica et al. report production predictive test selection using historical change/test outcomes [E6].

**Proposed insertion:** create N/S features relating a change description, diff excerpt, requirement and test description: same behavior, same boundary condition, or affected error path. Feed these features alongside dependency and historical failure data to a trained selector. The test runner supplies the ground truth; code retains mandatory suites and periodic full runs.

**Why cheap judgments matter:** semantic features become affordable per change/test candidate pair, especially where file-path dependence misses a behavioral relationship.

**Measure:** faulty-change recall and time to first failing test at a fixed compute budget. Compare against the current selector, retrieval alone and a small supervised classifier. Faster selection that misses more regressions can be a net loss.

## E08. Test-failure clustering and investigation routing — Pilot

**Existing foundation:** failure-sequence analysis and measured test flakiness [E5, E7].

**Proposed insertion:** use N to compare candidate failure pairs for the same underlying *reported* symptom; use C for environment/setup, assertion behavior, timeout or insufficient evidence. Combine labels with shared stack frames, timestamps and rerun outcomes. Engineers review representative failures from each cluster.

**Why cheap judgments matter:** recurring failures can be grouped at CI speed rather than manually collapsed after hundreds of reports accumulate.

**Measure:** cluster purity, distinct bugs accidentally merged, time to diagnosis and incorrect flaky-test dismissals. Jev should not infer “flaky” from a familiar phrase alone; repeated measurements establish nondeterminism. Pairwise similarities need not be transitive, so clustering constraints belong in code.

## E09. Defensive security alert and ATT&CK mapping — Pilot

**Existing practice:** MITRE ATT&CK organizes observed adversary behaviors into a shared taxonomy [E8].

**Proposed insertion:** supply normalized detection evidence and a retrieved shortlist of techniques. Use one N per technique when multiple may apply, plus separate questions for missing evidence and an approved investigation route. Preserve the original telemetry and detection rule; semantic classification adds searchable context.

**Why cheap judgments matter:** every alert can receive consistent enrichment and prioritization instead of only a small manually reviewed sample.

**Measure:** technique-mapping precision, missed meaningful alerts and analyst time. An ATT&CK label is neither proof of compromise nor a reason to suppress an alert. Logs may contain attacker-controlled text, so evaluate deliberately misleading inputs.

## E10. Selecting among established robot skills — Research

**Existing evidence:** SayCan combines language-based relevance with learned affordance estimates for available robot skills [E9].

**Proposed insertion:** a task planner enumerates bounded skills; perception supplies observed objects and locations. S assesses each skill's relevance to the present subgoal, or C chooses among a small admissible set. Separate robotic value/feasibility models and motion planning determine whether it can actually execute. Include “clarify,” “wait” and “no applicable skill.”

**Why cheap judgments matter:** the semantic part of selection can be reconsidered at subtask boundaries or after an interruption without a long text-generation cycle.

**Measure:** task completion, invalid skill suggestions, interventions and wall-clock time. SayCan's results do not transfer automatically to Jev. A relevance score must not be mistaken for collision-free reachability or execution-success probability.

## E11. Interpreting human interruptions in supervised automation — Pilot

**Existing foundation:** grounded robot skills [E9] and runtime-assurance architectures [E10].

**Proposed insertion:** given an operator message, current step and approved actions, C distinguishes a pause request, changed goal, clarification or unrelated remark. N identifies which named object or constraint the instruction concerns. A state machine owns transitions. Hardwired stops and formally analysed monitors remain independent of language interpretation.

**Why cheap judgments matter:** the user can correct a running workflow with little conversational delay. Bounded interpretation can be much simpler than replanning the entire task.

**Measure:** interruption-intent recall, erroneous continuation, response time and stale-state handling. A cloud call—even a fast one—is not the emergency-stop circuit. Runtime-assurance guarantees depend on the actual monitor, dynamics and implementation, not merely a similar block diagram.

## E12. Production scheduling with semantic exceptions — Pilot

**Existing evidence:** job-shop scheduling uses dispatching rules; learned dispatch policies have been demonstrated on graph representations [E11].

**Proposed insertion:** extract semantic constraints from job notes, maintenance notices and customer exceptions: requires a particular certified process, incompatible setup family, or depends on an unavailable inspection. N/C produces proposed constraint flags with supporting text. An optimizer handles precedence, resources, deadlines and feasible schedules.

**Why cheap judgments matter:** schedule inputs can stay aligned with changing human instructions. This addresses constraints that may never enter a structured planning database.

**Measure:** missing-constraint recall, schedule feasibility, tardiness and planner corrections. Letting Jev choose a dispatch heuristic is a separate research experiment; the graph-trained scheduling paper is not evidence for language-based numerical optimization.

## E13. Supplier and replacement-part evidence screening — Pilot

**Existing foundation:** controlled engineering verification and worst-case component analysis [E1, E12].

**Proposed insertion:** parser and database retrieval create a shortlist of parts. N checks whether supplied documents state required certification, environment, lifecycle status or compatibility conditions. C distinguishes equivalent wording from conflicting or missing evidence. Units, ratings, tolerances and fit are checked by deterministic tools and engineering analysis.

**Why cheap judgments matter:** more alternatives and document revisions can be screened without proportional procurement-engineering effort.

**Measure:** incompatible alternatives missed, unsupported equivalence claims and review time. The output routes a candidate for qualification; it does not approve substitution. Two similar product descriptions can conceal a crucial physical or certification difference.

## E14. Manufacturing nonconformance and rework routing — Pilot

**Existing foundation:** technical-language extraction [E2] and explicit verification methods [E1].

**Proposed insertion:** a validated inspection system provides measurements and defect observations. C maps the narrative to an existing defect family and approved review path. Separate N questions identify an affected specification, missing traceability or a previously unresolved corrective action. Quality rules decide hold/review; qualified personnel approve rework and release.

**Why cheap judgments matter:** consistent classification can happen at each inspection station and supply useful structured feedback to process improvement.

**Measure:** defect-family accuracy, false release recommendations, repeat-defect detection and disposition cycle time. Jev's input is the evidence description, not an unprocessed surface image. Optical metrology and dimensional tolerances retain their specialist tools.

## E15. Engineering analysis setup and assumption checks — Pilot / Research

**Existing foundation:** NASA distinguishes analysis, inspection, demonstration and test as verification methods, and requires evidence for applicable requirements [E1, E12].

**Proposed insertion:** supply a design requirement, analyst notes and known solver templates. N checks whether an explicitly stated assumption is supported by the supplied specification: prescribed boundary condition or required environmental case. This literal matching is the Pilot. Inferring an unstated material regime or selecting the appropriate analysis family is Research. Code performs configured mesh-quality and setup checks, units checks and solver-setting validation; mesh adequacy still requires convergence studies and engineering verification.

**Why cheap judgments matter:** inexpensive preflight checks can catch documentation/setup mismatches before long simulation jobs begin.

**Measure:** setup defects found, unnecessary reruns avoided and false warnings. This is a proposed workflow extension, not evidence Jev understands arbitrary finite-element models. Stress, thermal response and convergence still require numerical computation and verification.

## E16. BIM requirements mapped to machine-checkable properties — Pilot

**Existing practice:** buildingSMART IDS defines information requirements that IFC validators can check [E13].

**Proposed insertion:** retrieve candidate IFC entities, properties and IDS templates for a natural-language requirement. C selects the appropriate known field and requirement template; N asks whether required values are explicit or absent. A deterministic compiler creates the machine-readable specification, then schema and model validators check it.

**Why cheap judgments matter:** requirements can be translated and checked as design information changes, reducing repetitive manual mapping.

**Measure:** correct entity/property mapping, valid generated specifications and agreement with a BIM specialist. IDS checking does not cover every geometric or building-code rule; separate geometric analysis is required. Choosing from templates also means an unrepresented requirement must be reported as unsupported.

## E17. Sensor and asset metadata harmonization — Pilot

**Existing evidence:** Brick represents equipment, points and their relationships so building applications can work across heterogeneous metadata [E14].

**Proposed insertion:** give Jev point names, descriptive notes, equipment context and candidate ontology classes. C selects a class; N checks candidate relations such as “measures this equipment” or “belongs to this room.” Unit compatibility, identifiers and graph constraints are validated separately.

**Why cheap judgments matter:** semantic mapping can become an affordable ingestion step across many buildings, machines or digital twins. Downstream analytics then operate on a stable schema.

**Measure:** class and relation accuracy, graph consistency, unmapped coverage and time to deploy a known diagnostic. A structured graph populated with wrong relations is still wrong; relation proposals need provenance and review where consequential.

## E18. Building-operation context and supervisory mode selection — Research

**Existing foundation:** Brick supports interoperable building applications, including operational analytics; runtime assurance separates advanced decisions from protective mechanisms [E14, E10].

**Proposed insertion:** deterministic schedules and occupancy sensors establish facts. Jev interprets event descriptions, operator notes and comfort complaints into bounded contextual labels—normal use, unusual occupancy, suspected maintenance conflict or review needed. A validated HVAC optimizer or state machine considers these labels when selecting a permitted operating mode.

**Why cheap judgments matter:** informal context can reach automation while it is still useful, rather than becoming a note reviewed the next day.

**Measure:** comfort violations, unnecessary overrides, normalized energy consumption and operator interventions. Sensor-only baselines may already perform better; test added value. Continuous control, freeze protection and equipment limits remain outside the language model.

## What the engineering opportunities have in common

The most defensible immediate role is translating engineering language into an established schema, evidence relationship or workflow branch. Low cost makes repeated interpretation possible; it does not remove the need for the schema, data quality or independent validation. Start with work orders, requirements-to-test links or asset metadata because their outputs are inspectable and historical labels can be obtained.

For robotics and scheduling, separate semantic suitability from physical feasibility or numerical optimization. A fast classifier may provide the former. Existing planners, controllers, schedulers and measurements provide the latter. A deployed specialist classifier, regular expression or database rule may already be faster and cheaper; include those baselines.

## Primary references and what they establish

- **E1. NASA, Systems Engineering Handbook, Appendix.** Requirements quality, traceability and verification/validation practices. [Official handbook](https://www.nasa.gov/reference/system-engineering-handbook-appendix/).
- **E2. Brundage et al. (2020), Technical Language Processing: Unlocking Maintenance Knowledge.** Domain-specific engineering text needs representations, dictionaries and validation tailored to its use. [NIST publication](https://www.nist.gov/publications/technical-language-processing-unlocking-maintenance-knowledge).
- **E3. Sharp et al. (2021), Discovering Critical KPI Factors from Natural Language in Maintenance Work Orders.** A case study connecting extracted maintenance concepts with investigation of KPIs; not a universal anomaly detector. [NIST publication](https://www.nist.gov/publications/discovering-critical-kpi-factors-natural-language-maintenance-work-orders).
- **E4. NASA GSFC-HDBK-8004 (2024).** FMECA as a maintained engineering risk-assessment process. [Official standard record](https://standards.nasa.gov/node/12367).
- **E5. Du et al. (2017), DeepLog.** Learned sequence-based anomaly detection and diagnosis using system logs. [Author-hosted paper](https://nlp.cs.utah.edu/assets/pdfs/du2017deeplog.pdf).
- **E6. Machalica et al. (2019), Predictive Test Selection.** Historical outcomes can support production test selection with a measured detection/computation tradeoff. [Paper](https://arxiv.org/abs/1810.05286).
- **E7. Machalica et al. (2020), Probabilistic flakiness.** Measuring the reliability of tests using their observed outcomes. [Meta engineering report](https://engineering.fb.com/2020/12/10/developer-tools/probabilistic-flakiness/).
- **E8. MITRE ATT&CK.** A maintained taxonomy of observed adversarial behavior for defensive analysis. [Official introduction](https://attack.mitre.org/resources/).
- **E9. Ahn et al. (2022), Do As I Can, Not As I Say.** Combining language-based skill relevance with grounded affordance/value functions. [Paper](https://arxiv.org/abs/2204.01691); [authors' project](https://say-can.github.io/).
- **E10. Mehmood et al. (2021), The Black-Box Simplex Architecture.** Runtime assurance using a decision mechanism around advanced and baseline control. [Paper](https://arxiv.org/abs/2102.12981).
- **E11. Zhang et al. (2020), Learning to Dispatch for Job Shop Scheduling via Deep Reinforcement Learning.** A learned dispatch policy using graph representations. [NeurIPS paper](https://proceedings.neurips.cc/paper/2020/hash/11958dfee29b6709f48a9ba0387a2431-Abstract.html).
- **E12. NASA, Circuit Analysis guidance.** Component stress, tolerance, worst-case and failure-mode analyses remain engineering calculations. [Official guidance](https://s3vi.ndc.nasa.gov/ssri-kb/topics/20/).
- **E13. buildingSMART, Information Delivery Specification.** Computer-interpretable requirements and IFC information validation. [Official specification overview](https://technical.buildingsmart.org/projects/information-delivery-specification-ids/).
- **E14. Balaji et al. (2018), Brick: Metadata schema for portable smart building applications.** A semantic infrastructure representation evaluated across multiple buildings and applications. [Paper](https://brickschema.org/papers/Brick-AppliedEnergy-2018-Balaji.pdf).


---

# Physics opportunities for a fast typed judgment model

Research date: 21 September 2026. Scope: experimental and computational physics, including astrophysics, condensed matter, quantum devices, accelerator science and plasma physics. All proposed TypeSafe applications below are **design hypotheses**. The cited work demonstrates the underlying scientific method or a specialist implementation, not Jev's performance on that task.

## Central finding

The strongest immediate opportunity is to put inexpensive semantic decisions **between established scientific components**: a detector's numerical analysis, its experimental protocol, a simulation workflow, a measurement scheduler and the scientist's intent. A fast text classifier can interpret heterogeneous context, choose a recognized situation or nominate a documented next procedure. Numerical software should compute quantities, constraints, uncertainty and actuator commands.

This distinction is particularly consequential in physics. A phase classifier trained on spin configurations, a Gaussian process over beam parameters and a detector CNN are very different systems from a general text judgment model. Their success establishes that a decision is useful and sometimes learnable. It does not establish that Jev can make that decision from serialized measurements.

Current official TypeSafe documentation, verified during the parent research, describes text-only input, $0.042 per million input tokens and free outputs. Its limits are 64k tokens across state and all questions, with 32k across state plus the longest question; customer fine-tuning is not currently offered. Jev's documented difficulties include numerical precision, counting, distractors and logical consistency across independent questions. Consequently every proposal assumes exact feature computation outside Jev, explicit evidence in a compact state, and a reject or unknown option. Sources: [models](https://docs.typesafe.ai/models), [Jev 1.13 limitations](https://docs.typesafe.ai/model-jaggedness/jev-1.13).

The user's sub-100 ms premise is useful for design, while sub-10 ms is a future scenario. Neither implies bounded worst-case network latency. Most opportunities below are at experiment, batch or observation timescales; several remain valuable even at 500 ms. At 2,000 input tokens, a decision costs about $0.000084, or $84 per million decisions before infrastructure costs. That permits broad evaluation and routine contextual checks, but an existing local classifier or arithmetic rule may still be faster and cheaper.

## Mechanisms that make the opportunities credible

**Active learning and experimental design.** A numerical model selects a measurement expected to reduce uncertainty or improve an objective. A semantic judgment can establish which experimental context or scientific objective applies, without pretending its confidence is the experiment's posterior. Noack's scattering work explicitly includes measurement cost; ANDiE uses physical hypotheses in neutron diffraction. [Noack et al.](https://www.nature.com/articles/s41598-020-57887-x), [McDannald et al.](https://www.nist.gov/publications/fly-autonomous-control-neutron-diffraction-physics-informed-bayesian-active-learning).

**Selective prediction and escalation.** Common recognizable situations can enter an approved procedure; unfamiliar or inconsistent observations retain the original data and go to specialist analysis. The useful outcome is lower scientist workload at an acceptable missed-event rate. Accuracy averaged over abundant normal cases is insufficient.

**Multifidelity computation.** Cheap approximations can reduce expensive simulation work when the estimator retains a mathematically justified correction. Selecting only apparently promising samples changes the sampling distribution and can bias results. The model can help choose a workflow; numerical allocation and correction remain explicit. [Peherstorfer, Willcox and Gunzburger](https://dspace.mit.edu/entities/publication/f104683d-44c4-40ec-bd06-47502c5c0bfd).

**Scientific workflow orchestration.** State machines can combine exact exit codes and residual tests with interpretation of unfamiliar textual logs. All decisions, input versions and resulting calculations belong in the provenance record. AiiDA supplies an established example of automated workflows and provenance, rather than proof that a classifier's proposed recovery is correct. [AiiDA 1.0](https://www.nature.com/articles/s41597-020-00638-4).

Maturity labels below describe the proposed Jev component: **Near-term** means mainly contextual or textual classification with an obtainable reference set; **Hybrid** means a specialist numerical or perceptual component is essential; **Research** means the scientific decision itself needs substantial validation. None means production-ready or demonstrated by TypeSafe.

## Eighteen distinct applications

### P1. Context-aware beamline scan steering — Hybrid

**Established basis.** Autonomous X-ray scattering has used Gaussian-process uncertainty and measurement cost to select subsequent observations. [Noack et al., 2020](https://www.nature.com/articles/s41598-020-57887-x).

**Proposed input and judgment.** Supply the experiment objective, sample notes, specialist fit summaries, acquisition status and a small menu of next scans. `Choice`: broad exploration, refine a feature, repeat with a reference sample, or request review. The GP or acquisition optimizer calculates exact coordinates, dwell times and expected information gain; the instrument controller checks the command.

**Why cheap and fast helps.** Interpret context after every scan instead of only at campaign setup. A short supervisor call can fit between measurements and share several independent quality questions.

**Limit and test.** A semantic preference must not replace uncertainty estimates or discard unexpected features. Compare time to a specified map error, beamtime consumed, missed narrow features and performance on entirely held-out samples. Benefit must exceed the existing autonomous acquisition baseline.

### P2. Ambiguity resolution in X-ray diffraction — Hybrid

**Established basis.** Szymanski and colleagues coupled a specialist phase-identification model to a diffractometer to steer measurements toward informative features. [Adaptive XRD, 2023](https://www.nature.com/articles/s41524-023-00984-y).

**Proposed input and judgment.** A diffraction package supplies competing phase matches, fitted residual categories, candidate diagnostic reflections and sample history. `Choice`: measure a diagnostic peak, extend angular coverage, change a documented acquisition setting, or retain ambiguity. Code chooses numerical settings and runs the approved refinement routine.

**Why cheap and fast helps.** Every ambiguous pattern can receive contextual routing; low latency allows a follow-up while the sample is still mounted.

**Limit and test.** Jev cannot see an unencoded diffraction image, infer reliable peak positions or prove a phase exists. Validate trace-phase recall, false phase assignments, measurement time and robustness to texture, overlapping peaks and instrument changes. Keep an explicit unidentified-phase branch so the candidate library does not exclude discovery by construction.

### P3. Adaptive mapping of materials phase boundaries — Hybrid

**Established basis.** CAMEO integrated active learning with synchrotron measurements to connect phase mapping with property optimization. Its published experimental loop operated on seconds-to-minutes timescales. [Kusne et al., 2020](https://www.nature.com/articles/s41467-020-19597-w).

**Proposed input and judgment.** Supply phase-map summaries, candidate boundary regions, measurement quality flags and the scientific goal. `Choice`: explore an unmeasured region, resolve a phase boundary, measure a property, or repeat for reproducibility. A physical/statistical model computes the next composition or temperature and acquisition value.

**Why cheap and fast helps.** The campaign can reassess its scientific objective after each observation with little added delay; short contextual judgments can replace frequent manual switching between measurement modes.

**Limit and test.** Jev confidence is not phase probability. Hold out material families and test boundary localization error, property optimization regret, rare-phase recall and reproducibility. A discovery-oriented allocation must preserve some exploration independent of the classifier's expectations.

### P4. Screening condensed-matter simulations for candidate phase transitions — Research

**Established basis.** Specialist neural networks have identified phases and transitions in condensed-matter Hamiltonians. [Carrasquilla and Melko, 2017](https://www.nature.com/articles/nphys4035).

**Proposed input and judgment.** Code calculates order parameters, susceptibilities, correlation summaries, finite-size trends and equilibration flags. `Choice`: likely crossover, candidate discontinuity, finite-size ambiguity, or insufficient equilibration. The result allocates additional temperature points, lattice sizes or independent simulation seeds; established finite-size scaling and statistical tests determine the scientific conclusion.

**Why cheap and fast helps.** A sweep containing millions of jobs can receive structured triage without a researcher reading every report.

**Limit and test.** Hand-selected summaries may erase the relevant physics; Jev is not the network demonstrated in the paper. Test transition recall and localization, false discoveries, generalization across Hamiltonians and whether routed simulations preserve the final scaling result. Include physical novelty cases outside the candidate taxonomy.

### P5. Choosing the next cold-atom experimental procedure — Hybrid

**Established basis.** Gaussian-process online optimization has improved Bose–Einstein-condensate production by learning from experimental runs. [Wigley et al., 2016](https://www.nature.com/articles/srep25890).

**Proposed input and judgment.** Supply established fit outputs, run annotations, laser-lock status, trap-loading flags and the current objective. `Choice`: continue evaporation optimization, rerun a diagnostic, restore a reference sequence, or investigate drift. The optimizer changes approved parameters; exact numerical limits and pulse timing remain in experiment-control software.

**Why cheap and fast helps.** Reassess after every experimental shot without consuming appreciable time relative to preparation and measurement. This could prevent an optimizer learning from runs corrupted by a contextual fault.

**Limit and test.** Separate low scientific yield from malfunction without excluding unusual but real behavior. Measure usable experiments per hour, atom-number or temperature target attainment, invalid-run contamination and erroneous interruptions. Compare with existing numerical fault flags and a fixed diagnostic schedule.

### P6. Routing quantum-dot autotuning failures — Hybrid

**Established basis.** Moon and colleagues demonstrated automatic tuning of quantum-dot devices over up to eight gate-voltage dimensions using a dedicated statistical algorithm. [Moon et al., 2020](https://www.nature.com/articles/s41467-020-17835-9).

**Proposed input and judgment.** A dedicated current-map or charge-sensing analyzer reports charge-state candidates and quality; supply these alongside device history and attempted tuning procedures. `Choice`: coarse search, barrier adjustment routine, charge-sensor recalibration, or expert review. Existing tuners compute voltages and enforce limits.

**Why cheap and fast helps.** Device arrays generate many routine exceptions. A contextual supervisor can reduce manual restarts and update the branch at each tuning stage.

**Limit and test.** Text cannot substitute for the original transport-image classifier. Test full tuning success on unseen devices and cooldowns, time to usable configuration, number of failed retries and preserved qubit quality. Customer fine-tuning of Jev is not currently available; any required image model remains a separate component.

### P7. Selecting qubit calibration work between experiments — Hybrid

**Established basis.** Adaptive characterization has been investigated for spatially varying fields and errors in qubit registers. [Adaptive characterization, 2020](https://www.nature.com/articles/s41534-020-0286-0).

**Proposed input and judgment.** Supply numerical drift alarms, calibration age, recent operations, dependency relationships and maintenance notes. `Choice`: frequency calibration, amplitude calibration, cross-talk characterization, or no extra calibration. A scheduler respects the dependency graph; experiment code estimates the actual quantities and verifies the result.

**Why cheap and fast helps.** Frequent contextual decisions can replace a single expensive calibration schedule with checks tied to actual use and maintenance events.

**Limit and test.** This is calibration management on experiment timescales. Quantum readout and error-correction decoding require specialist fast hardware/software. Measure calibration overhead versus independently measured gate error, unnecessary recalibrations and undetected drift. Evaluate across device sessions and hardware changes, rather than random rows from one stable run.

### P8. Accelerator characterization with contextual constraints — Hybrid

**Established basis.** Constrained Bayesian active learning has been experimentally used to explore accelerator parameters and beam phase-space measurements. [Roussel et al., 2021](https://www.nature.com/articles/s41467-021-25757-3).

**Proposed input and judgment.** Supply a proposed scan's purpose, diagnostic availability, specialist beam summaries and operational notes. `Choice`: suitable diagnostic procedure, substitute approved procedure, or unavailable. Numeric optimization still chooses parameters. A deterministic validator establishes exact admissibility, and independent machine protection remains authoritative.

**Why cheap and fast helps.** The optimizer can cheaply account for changing diagnostic context and avoid otherwise valid but scientifically unusable measurements.

**Limit and test.** A classifier must never certify beam safety or infer precise loss limits. Validate usable characterization points per unit beamtime, diagnostic mismatch rate, recovery workload and correct identification of unsupported states. Run initially on recorded campaigns with the original measurement sequence available as a baseline.

### P9. Between-shot plasma experiment diagnosis — Near-term/Hybrid

**Established basis.** Degrave and colleagues demonstrated specialist reinforcement-learning magnetic control on TCV; that required a simulator, numerical sensing and a controller deployed to the real-time system. [Tokamak control, 2022](https://www.nature.com/articles/s41586-021-04301-9).

**Proposed input and judgment.** After a discharge, supply equilibrium reconstruction status, instability classifications from domain models, subsystem flags and operator notes. `Choice`: diagnostic fault, scenario mismatch, repeat required, promising physical variation, or unresolved. This selects the next analysis workflow or a previously approved experimental scenario for review.

**Why cheap and fast helps.** Every shot gets consistent triage while the team prepares the next experiment; many independent diagnostics can be assessed together.

**Limit and test.** This proposal does not replace magnetic feedback, disruption protection or physical reconstruction. Measure correct fault routing, time spent interpreting shots, lost diagnostic opportunities and agreement with later expert investigation. Separate classification usefulness from any claim of improved plasma performance.

### P10. Astronomical alert prioritization under a specific science program — Near-term/Hybrid

**Established basis.** Fink ingests, annotates, classifies and redistributes transient alerts using dedicated pipelines. [Möller et al., 2021](https://arxiv.org/abs/2009.10185).

**Proposed input and judgment.** Supply specialist light-curve classifications, crossmatches, exact age/visibility calculations and a program's observation policy. `Choice`: request spectrum, request another photometric observation, continue monitoring, or insufficient evidence. A scheduling optimizer allocates telescope time after code checks observability and constraints.

**Why cheap and fast helps.** An observatory can economically apply numerous different program policies to the same evolving alert and respond before short-lived features disappear.

**Limit and test.** Jev cannot replace image artifact rejection or a calibrated transient classifier. Validate time to useful follow-up, science yield per telescope hour, rare-event recall and selection bias. Current API quotas, not advertised single-request latency alone, determine whether an entire survey stream is feasible.

### P11. Gravitational-wave noise investigation routing — Near-term/Hybrid

**Established basis.** Gravity Spy classifies detector glitches from time-frequency morphology to support detector characterization. Its data products have been used to investigate environmental and instrumental noise. [LIGO O1–O3 analysis](https://dcc.ligo.org/LIGO-P2200238/public).

**Proposed input and judgment.** Supply the existing glitch class, auxiliary-channel coincidence results, detector configuration and maintenance logs. `Choice`: likely instrumental family requiring a documented investigation, environmental investigation, known recurring issue, or unknown. Specialist correlation and coupling analyses test the nominated explanation.

**Why cheap and fast helps.** The volume of routine glitches makes per-event contextual review costly for humans; grouping by likely investigation can reduce repeated work.

**Limit and test.** A text model cannot classify an unseen spectrogram, establish causal coupling or autonomously veto a candidate gravitational wave. Evaluate confirmed-cause retrieval, analyst effort, missed novel glitch families and astrophysical signal preservation using injection studies and strict time-separated evaluation.

### P12. High-energy physics run-quality triage — Near-term/Hybrid

**Established basis.** CMS has studied machine learning for run certification and anomalous detector-region identification. [CMS DP-2023/032](https://cds.cern.ch/record/2860924/files/DP2023_032.pdf).

**Proposed input and judgment.** Supply specialist histogram anomaly summaries, detector status, calibration version and shifter notes. `Choice`: expected configuration change, known detector issue, new anomaly, or review required. A deterministic quality workflow records the candidate issue and routes it to subsystem certification procedures.

**Why cheap and fast helps.** Numerous detector subsystems and runs can receive consistent context-sensitive triage without requiring every shifter to interpret all notes manually.

**Limit and test.** Run-quality support is separate from collision-event triggering. Assess problematic-run recall, unnecessary review rate, certification delay and bias in control distributions. Retain complete records; the model's category is not sufficient evidence to delete data or modify an analysis selection.

### P13. Recovering failed electronic-structure calculations — Near-term

**Established basis.** AiiDA supports automated scientific workflows, error handling and provenance; common workflows coordinate different quantum engines. [AiiDA 1.0](https://www.nature.com/articles/s41597-020-00638-4), [common quantum-engine workflows](https://www.nature.com/articles/s41524-021-00594-6).

**Proposed input and judgment.** Supply parsed exit codes, convergence flags, concise solver logs, material category and previous retries. `Choice`: documented mixing recovery, restart from checkpoint, increase a permitted convergence budget, incompatible configuration, or expert review. Each selected branch is a tested workflow with exact input validation and bounded retries.

**Why cheap and fast helps.** Large DFT campaigns can inspect nearly every exception with negligible inference cost relative to the failed computation, reducing researcher interruptions.

**Limit and test.** The model must not silently change the physical problem or relax scientific acceptance tolerances. Measure recovered valid calculations, wasted compute, repeated-failure rate and agreement of final physical observables with independently converged references.

### P14. Checking whether physical results are comparable before aggregation — Near-term

**Established basis.** AiiDA represents calculation inputs and outputs in provenance graphs, enabling reproducible computational science. [AiiDA 1.0](https://www.nature.com/articles/s41597-020-00638-4).

**Proposed input and judgment.** Supply paired calculation metadata and method notes: boundary conditions, spin assumptions, geometry constraints, pseudopotential identity, temperature ensemble and reference-energy convention. Code directly compares exact fields. `Noul` or `Choice` assesses whether the remaining descriptive assumptions describe the same intended physical comparison or require review.

**Downstream and economics.** A dataset assembly job rejects unresolved comparisons or requests a defined harmonization calculation. Code defines compatible groups using explicit provenance constraints; pairwise semantic similarity need not be transitive and cannot define an equivalence relation by itself. Low cost makes residual descriptive-mismatch checks routine rather than an audit applied only to published tables.

**Limit and test.** Jev should not compute unit conversions or energy offsets. Test incompatible-comparison recall, needless exclusions and downstream changes to phase rankings or reported trends. Provenance completeness is a prerequisite; missing context cannot be recovered through confidence alone.

### P15. Managing atomistic active-learning labeling queues — Hybrid

**Established basis.** DP-GEN iterates exploration, expensive labeling and model training to construct interatomic potentials. [Zhang et al., 2020](https://arxiv.org/abs/1910.12690).

**Proposed input and judgment.** Numerical models provide disagreement metrics, structure descriptors and stability checks. Add simulation intent and known workflow issues. `Choice`: send candidate for first-principles labeling, investigate a setup error, collect a diversity representative, or retain for review. The existing acquisition algorithm controls exact sampling and the labeling budget.

**Why cheap and fast helps.** Millions of candidate configurations can generate confusing exception queues; contextual routing reduces expensive labels wasted on known setup failures.

**Limit and test.** Jev does not predict forces or certify out-of-distribution detection. Do not equate ensemble agreement with correctness. Measure physical coverage, withheld energy/force error, trajectory stability and achieved accuracy per expensive label. Always audit some rejected candidates to detect an exclusion bias.

### P16. Choosing a computational physics fidelity workflow — Hybrid/Research

**Established basis.** Multifidelity Monte Carlo can combine expensive physical models with cheaper surrogates using a corrected estimator and optimized allocation. [Peherstorfer et al., 2016](https://dspace.mit.edu/entities/publication/f104683d-44c4-40ec-bd06-47502c5c0bfd).

**Proposed input and judgment.** Supply a simulation's scientific question, regime flags computed by code, model validity documentation and known solver failures. `Choice`: one of a few validated fidelity portfolios, such as continuum plus kinetic correction or coarse plus fine resolution. Numerical software determines model allocation, controls error and computes the final statistic.

**Why cheap and fast helps.** Contextual portfolio selection can occur across large heterogeneous campaigns instead of imposing one expensive workflow on all tasks.

**Limit and test.** An attractive low-fidelity prediction must not justify skipping all corrective calculations. Validate error and interval coverage for the final physical observable, cost at fixed error and behavior near regime boundaries. Any adaptive sampling must preserve the estimator's assumptions.

### P17. Selecting numerical approximations for physical inverse problems — Research

**Established basis.** Delayed-acceptance MCMC uses an inexpensive approximation before an expensive evaluation, with a corrected acceptance rule under stated conditions. Christen and Fox demonstrate the method using a physical inverse-problem example. [Christen and Fox, 2005](https://www.tandfonline.com/doi/abs/10.1198/106186005X76983).

**Proposed input and judgment.** Before sampling, supply the observation model, parameter regime, solver diagnostics and validated approximation menu. `Choice` selects a candidate coarse model or preconditioning workflow. Numerical pilots validate it; sampling then uses the actual corrected kernel and exact numerical likelihood evaluations.

**Why cheap and fast helps.** Many distinct inverse problems can receive inexpensive configuration advice; better approximation selection could improve effective samples per expensive solve.

**Limit and test.** This is a weaker fit than text-log triage. Jev's probability must not substitute for a likelihood or Metropolis acceptance ratio. Test posterior coverage, effective samples per second and agreement with a trusted baseline. Arbitrary state-dependent changes during sampling can invalidate correctness.

### P18. Selecting discriminating neutron-scattering measurements — Hybrid

**Established basis.** ANDiE used physics-informed Bayesian active learning to steer neutron diffraction. The cited study used a post-processing hypothesis test to distinguish candidate transition models; it did not establish the proposed online contextual model-discrimination policy below. [McDannald et al., 2022](https://www.nist.gov/publications/fly-autonomous-control-neutron-diffraction-physics-informed-bayesian-active-learning).

**Proposed input and judgment.** A physical fitting engine supplies candidate hypotheses, diagnostic disagreements and proposed measurements. Add experimental notes and sample-history context. `Choice`: the applicable hypothesis family or an unresolved-confound category; optionally `Score` the relevance of each predefined follow-up to the stated question. A numerical design routine computes the measurement with greatest discriminating value.

**Why cheap and fast helps.** Each expensive neutron measurement can receive a consistent contextual check while scheduling remains responsive.

**Limit and test.** A semantic relevance score is neither Bayes evidence nor an information-gain estimate. Validate experiments required to resolve a hypothesis, mistaken model exclusions and robustness to unmodeled backgrounds. Maintain an out-of-model option and compare against the existing physics-informed acquisition routine alone.

## Where the attractive analogy breaks

1. **Latency is relative to the apparatus.** A 10 ms call remains 800 times longer than a 12.5 μs hardware trigger budget. CMS documents that order of latency for its upgraded Level-1 trigger. A recent superconducting error-correction demonstration reports 1.1 μs cycles and a 63 μs average decoder latency. These are concrete counterexamples to calling a text API suitable for all real-time physics. [CMS trigger note](https://cds.cern.ch/record/2801639/files/NOTE2022_001.pdf), [quantum error correction](https://www.nature.com/articles/s41586-024-08449-y).

2. **A typed probability is not a physical probability.** A Noul output is not automatically a posterior over hypotheses, a calibrated detector false-alarm rate, a p-value or a transition probability. Establish calibration for the exact event definition and operating distribution. Independent answers may contradict one another; constraints and mutually exclusive states belong in code.

3. **Physical accuracy does not follow from semantic plausibility.** Exact units, conservation laws, symmetry, numerical convergence and uncertainty propagation need computation. A 1M-token context would not make raw waveforms, images or huge lattice configurations natural inputs to this text model. More context can also add distracting information and cost.

4. **Selection alters what science sees.** A good-looking filter can erase new phenomena, bias populations and corrupt estimated rates. Retain raw data, maintain deliberate exploration, audit rejected cases and record selection probabilities when the analysis requires them. This is a scientific validity requirement, not merely software observability.

5. **Cheap inference can be irrelevant to total benefit.** Existing Gaussian processes, tree models and simple rules are often already cheap. The incremental case for Jev is strongest when each observation includes changing textual procedures, inconsistent logs or contextual exceptions that numeric pipelines do not easily express.

## Recommended first five experiments

The clearest initial tests are **P13 DFT failure recovery**, **P14 comparability checks**, **P12 run-quality triage**, **P10 program-specific astronomical alert routing**, and **P11 noise-investigation routing**. These have concrete text/context inputs and obtainable expert outcomes. They can be evaluated on recorded data before any physical action. Beamline and quantum-device orchestration are attractive second-stage projects after the classifier demonstrates useful incremental accuracy.

Use time-separated replay with three baselines: the current rules, a simple local classifier when suitable, and the full proposed hybrid. Replay can establish label and routing quality. It cannot by itself establish improved scientific yield from changed adaptive measurement decisions when counterfactual outcomes are missing; those claims need a validated simulator or prospective controlled comparison. Report total scientific utility and compute or instrument time, as well as selective error, rare-case recall, calibration, latency percentiles and abstention rate. Evaluation must preserve unfamiliar devices, changed configurations and new physical regimes as genuine holdouts.

## Primary-source bibliography

- Noack et al. (2020), **Advances in Kriging-Based Autonomous X-Ray Scattering Experiments**, Scientific Reports 10, 1325. Experimental acquisition with uncertainty and measured cost. https://doi.org/10.1038/s41598-020-57887-x
- Szymanski et al. (2023), **Adaptively driven X-ray diffraction guided by machine learning for autonomous phase identification**, npj Computational Materials 9, 31. Specialist model guides diffraction acquisition. https://doi.org/10.1038/s41524-023-00984-y
- Kusne et al. (2020), **On-the-fly closed-loop materials discovery via Bayesian active learning**, Nature Communications 11, 5966. CAMEO phase mapping and property optimization. https://doi.org/10.1038/s41467-020-19597-w
- Carrasquilla and Melko (2017), **Machine learning phases of matter**, Nature Physics 13, 431–434. Dedicated neural networks classify phases in model systems. https://doi.org/10.1038/nphys4035
- Wigley et al. (2016), **Fast machine-learning online optimization of ultra-cold-atom experiments**, Scientific Reports 6, 25890. GP-based optimization of condensate production. https://doi.org/10.1038/srep25890
- Moon et al. (2020), **Machine learning enables completely automatic tuning of a quantum device faster than human experts**, Nature Communications 11, 4161. Specialized quantum-dot tuning. https://doi.org/10.1038/s41467-020-17835-9
- **Adaptive characterization of spatially inhomogeneous fields and errors in qubit registers** (2020), npj Quantum Information 6, 53. Adaptive characterization for calibration contexts. https://doi.org/10.1038/s41534-020-0286-0
- Roussel et al. (2021), **Turn-key constrained parameter space exploration for particle accelerators using Bayesian active learning**, Nature Communications 12, 5612. Experimental constrained exploration. https://doi.org/10.1038/s41467-021-25757-3
- Degrave et al. (2022), **Magnetic control of tokamak plasmas through deep reinforcement learning**, Nature 602, 414–419. Specialist numerical real-time controller, a boundary on analogies to text classification. https://doi.org/10.1038/s41586-021-04301-9
- Möller et al. (2021), **Fink, a new generation of broker for the LSST community**, MNRAS 501, 3272–3288. Alert ingestion, annotation, classification and dissemination. https://arxiv.org/abs/2009.10185
- **Data quality up to the third observing run of Advanced LIGO: Gravity Spy glitch classifications** (2023). Primary collaboration data-analysis publication and release. https://dcc.ligo.org/LIGO-P2200238/public
- CMS (2023), **Machine Learning Techniques for JetMET Data Certification of the CMS Detector**, DP-2023/032. Official results on offline run certification using 2018 collision data. https://cds.cern.ch/record/2860924?ln=en
- Huber et al. (2020), **AiiDA 1.0, a scalable computational infrastructure for automated reproducible workflows and data provenance**, Scientific Data 7, 300. Scientific workflow automation and provenance. https://doi.org/10.1038/s41597-020-00638-4
- **Common workflows for computing material properties using different quantum engines** (2021), npj Computational Materials. Reproducible quantum-engine workflows. https://doi.org/10.1038/s41524-021-00594-6
- Zhang et al. (2020), **DP-GEN: A concurrent learning platform for the generation of reliable deep learning based potential energy models**, Computer Physics Communications 253, 107206. Exploration, labeling and training loop. https://arxiv.org/abs/1910.12690
- Peherstorfer, Willcox and Gunzburger (2016), **Optimal Model Management for Multifidelity Monte Carlo Estimation**, SIAM Journal on Scientific Computing 38(5), A3163–A3194. Corrected estimation and numerical allocation. https://doi.org/10.1137/15M1046472
- Christen and Fox (2005), **Markov chain Monte Carlo Using an Approximation**, Journal of Computational and Graphical Statistics 14(4), 795–810. Corrected delayed acceptance for expensive inverse problems. https://doi.org/10.1198/106186005X76983
- McDannald et al. (2022), **On-the-fly autonomous control of neutron diffraction via physics-informed Bayesian active learning**, Applied Physics Reviews. Autonomous acquisition and physical hypothesis discrimination. https://doi.org/10.1063/5.0082956


---

# Mathematical uses of a fast, inexpensive typed judgment model

Research date: 21 September 2026. Scope: mathematical research, formal reasoning, symbolic computation, optimization, and numerical mathematics. This is a research map and experiment proposal, not a claim that Jev has passed these tasks. No model calls or benchmarks were run.

The strongest general opportunity is **choosing which mathematical computation to attempt next, while leaving the computation and its checks to mathematical software**. A theorem prover may have thousands of plausible lemmas, a computer algebra system several elimination orders, and an optimizer many possible search decisions. A cheap judgment can be useful when it changes that allocation of effort. It need not calculate the answer itself.

There is a substantial literature demonstrating this architecture. The transfer to the present TypeSafe model is the uncertain part: most cited systems trained specialized policies on proof traces, graph structure, or numerical solver features. Their results do not establish equivalent ability in an off-the-shelf text classifier.

## What the current product changes—and does not establish

The official model page lists **$0.042 per million input tokens**, free outputs, text-only input, 64K total request tokens, and a 32K limit for state plus the longest question. These are not separate 32K input/output windows. Customer fine-tuning or LoRA adaptation is not currently offered. The documentation lists dynamic throughput limits, which must be included in capacity planning. [TypeSafe models](https://docs.typesafe.ai/models)

The official limitations explicitly discourage mathematical logic and counting in the model, numerical reconstruction from Score levels, and reliance on logical identities across separately asked questions. Complex indirection and irrelevant context also hurt performance. These warnings make semantic routing a materially stronger present-day hypothesis than numerical or symbolic reasoning. [Jev 1.13 limitations](https://docs.typesafe.ai/model-jaggedness/jev-1.13)

For the analysis below, sub-100 ms is the user's present performance assumption; sub-10 ms is a future scenario, not a measured result of this investigation. At the verified price, 1,000 input tokens cost $0.000042; one million such decisions cost $42 before other infrastructure. Five thousand tokens per decision increases that to $210. These are arithmetic illustrations, not throughput or accuracy claims.

Three readiness labels are used:

- **Pilot:** a plausible present-day evaluation because the judgment is largely semantic, uses a short candidate list, and has a clear downstream check. Not already validated.
- **Research:** the architecture is supported by prior work, but useful Jev accuracy on the mathematical representation remains unproven; specialized training was often central in that work.
- **Hot-loop concern:** a research candidate whose existing decision frequency may make even 10 ms too slow. Apply at coarse checkpoints or compare against local policies.

## The mathematical architecture

Let `s` be the current problem state and `A(s)` the finite set of actions that code has established are legal. A model chooses or prioritizes an action in `A(s)`; an ordinary algorithm executes it. The aim is to reduce total cost:

`feature extraction + judgment + mathematical computation + checking + recovery`.

This is a version of the classical **algorithm selection problem**, rather than a new mathematical decision procedure. The selector should beat the best fixed method on the actual workload, including its own overhead. The oracle that retrospectively chooses the best solver for every instance is a useful upper bound on potential improvement. Rice introduced the framework; SATzilla later demonstrated successful per-instance solver portfolios. [Rice, technical report, 1975](https://docs.lib.purdue.edu/cstech/99/), [SATzilla, 2008](https://arxiv.org/abs/1111.2249)

The primitives map naturally onto this architecture. **Choice** selects an existing tactic, solver, candidate expression, or search neighborhood. **Noul** asks whether a candidate is relevant enough to try; it does not establish mathematical truth. **Score** gives an ordinal preference such as weak/moderate/strong promise under an explicit rubric. Residual norms, polynomial degrees, feasibility, dimensions, distances, and exact numerical objectives belong in code. A Choice option must have an unambiguous identifier; large candidate pools should first be reduced by retrieval or conventional heuristics.

Correctness and search success are different. If a model ranks proof steps and a kernel checks the final proof, poor ranking usually wastes time. If it permanently removes a necessary premise, it may destroy completeness without making any accepted proof false. In optimization, unjustified pruning can also invalidate an optimality claim: never prune a feasible branch because a model says it looks unpromising. Keep valid bounds, certificate checks, and the underlying algorithm's required scheduling rules. Lean's kernel and validation documentation illustrate why a checked proof term, its assumptions, and its actual statement matter separately. [Lean elaboration and kernel](https://lean-lang.org/doc/reference/latest/Elaboration-and-Compilation/), [Lean proof validation](https://lean-lang.org/doc/reference/latest/ValidatingProofs/)

Confidence can decide when to fall back, but must be evaluated on the mathematical workload. Selective prediction studies the tradeoff between coverage and error among accepted decisions; it does not turn a confidence value into a proof. For a router, confidence should predict routing benefit, not merely label accuracy. [SelectiveNet, 2019](https://proceedings.mlr.press/v97/geifman19a.html)

## Eighteen concrete uses

### 1. Find useful premises in a mathematical library — Pilot / Research

**Established:** DeepMath learned premise relevance for automated theorem proving on the Mizar corpus. Its model was trained for the task; it was not an unadapted general language classifier. [DeepMath, 2016](https://arxiv.org/abs/1606.04442)

**Proposed adapter:** retrieve 20–100 candidate lemmas using a conventional index; provide the target statement, explicit hypotheses, and short candidate statements. Ask one Noul per candidate: “Does this lemma directly address the relation or object in this goal?” Keep a high-recall shortlist; a prover attempts the proof.

**Why inexpensive judgments matter:** many relevance decisions can share the same goal state. A low-cost reranker may remove expensive, irrelevant prover attempts. Measure proof success at fixed total time, recall of useful premises, and improvement over retrieval alone. The semantic version is a reasonable first pilot; raw formal syntax and nested dependencies are research. A rejected premise must remain available to a fallback search.

### 2. Select a tactic or decision procedure — Pilot / Research

**Established:** TacticToe learned tactic selection and premise use inside HOL4. In its reported experiment it re-proved 39% of 7,902 theorems within five seconds, compared with 32% for the stated HOL(y)Hammer baseline. This is a historical, task-specific result. [TacticToe, 2018](https://arxiv.org/abs/1804.00595)

**Proposed adapter:** code exposes a short legal menu such as simplification, linear arithmetic, polynomial normalization, induction, or a selected library tactic. Choice uses the current goal, hypothesis summaries, and recent failures. The proof assistant executes the chosen tactic and checks the resulting proof.

Cheap routing permits trying several inexpensive tactics before invoking a costly prover or generative model. Measure proofs per second, wasted tactic calls, and timeouts. Start with tool-family routing; fine-grained tactic arguments and difficult induction choices are substantially harder. Never interpret “use linear arithmetic” as a judgment that the theorem is true.

### 3. Allocate proof-search effort across open states — Research

**Established:** HOList provides a machine-learning environment and a learned automated prover over HOL Light; TacticZero learns proof-search strategies as well as tactics and arguments in HOL4. [HOList, 2019](https://arxiv.org/abs/1904.03241), [TacticZero, 2021](https://arxiv.org/abs/2102.09756)

**Proposed adapter:** given several already-generated proof states and their measured search histories, ask Choice which state should receive the next bounded computation budget. Alternatively Score each state on an explicitly ordinal “likely progress from another tactic batch” rubric. The search engine retains the full frontier and validates every completed proof.

The gain is allocation, not proof generation: less time spent extending bad branches. Sub-100 ms can make sense before seconds-long tactic batches; it is unattractive before trivial reductions. Measure solved theorems under identical compute budgets, including selector latency. Preserve exploration so apparent dead ends are not permanently starved. Training traces are likely more valuable than longer prompts.

### 4. Rank clauses in saturation-based theorem proving — Research; hot-loop concern

**Established:** ENIGMA learns a clause-ranking heuristic from proof participation and integrates it tightly with the E prover. This is direct evidence that classification can improve a deductive search engine. [ENIGMA, 2017](https://arxiv.org/abs/1701.06532)

**Proposed adapter:** at a coarse checkpoint, send a small set of clause summaries, goal information, and search statistics. Choice selects a heuristic configuration or a batch of clauses to prioritize; the prover alone performs inference.

The narrow judgment is “worth exploring soon,” not “logically valid.” Validate theorem success, inferences performed, and wall-clock time against the existing given-clause strategy. The original success depended on efficient feature extraction and tight integration. A remote call for every generated clause is likely to dominate runtime even at 10 ms. This is better viewed as a possible supervisory selector, or as motivation for a separate specialized local classifier, than an immediate Jev replacement.

### 5. Triage candidate formalizations and missing hypotheses — Pilot / Research

**Established:** autoformalization research demonstrates translating informal mathematics to formal statements, while also exposing substantial translation errors. Wu et al. reported perfect formal specification translations for a subset of their competition problems, not universal semantic equivalence. [Autoformalization with Large Language Models, 2022](https://arxiv.org/abs/2205.12615)

**Proposed adapter:** a parser, template system, or generative model produces candidates. For each candidate, ask independent literal questions: “Was positivity assumed?”, “Is the quantifier universal?”, “Does the conclusion concern existence or uniqueness?” Code compares the answers with explicit structure and routes discrepancies to review. Pilot applies only to explicit assumption/quantifier extraction and mismatch flags; general mathematical semantic-equivalence checking is Research.

Low cost supports checks on every generated statement rather than a sample. Measure expert-audited semantic mismatch recall and review burden. Compilation and successful proof are insufficient: a wrong translation may be easy to prove. Use the classifier to prioritize review, with mathematically trained review or equivalence checking for consequential acceptance. Complex implicit hypotheses remain difficult.

### 6. Prioritize conjectures or construction programs for evaluation — Research

**Established:** FunSearch combined a generative model, evolutionary search, and an executable evaluator, producing new cap-set constructions and bin-packing heuristics. Its evaluator and program generation were essential; it did not show that a classifier alone discovers proofs. [FunSearch, Nature, 2023/2024](https://www.nature.com/articles/s41586-023-06924-6)

**Proposed adapter:** code or another model supplies conjecture candidates or construction programs. Use Noul to filter superficial duplicates or rubric violations and Choice to allocate the next expensive test. Exact code checks combinatorial constraints and computes objective values.

The opportunity exists when evaluation is costly and there are many proposals; a cheap prefilter may increase verified discoveries per compute dollar. Evaluate against random and diversity-based selection, with identical evaluators and budgets. Preserve an exploration sample to estimate valuable candidates lost by filtering. Numerical plausibility scores cannot certify a conjecture; testing many examples cannot establish an unrestricted theorem.

### 7. Choose a counterexample search strategy — Pilot / Research

**Established:** Isabelle's Nitpick is a counterexample generator built on relational model finding; Quickcheck-style execution and model finding suit different forms of conjecture. [Nitpick project and papers](https://wwwbroy.in.tum.de/~blanchet/nitpick.html)

**Proposed adapter:** inputs are the proposed statement, explicit domains, and previous tool outcomes. Choice selects randomized testing, finite-model search, bounded enumeration, an SMT encoding, or expert review. A second judgment can identify which already-enumerated assumption should be tested first.

A fast router can run before every expensive proof attempt and avoid spending minutes on a false statement. Code constructs tests and validates reported witnesses against the original conjecture. Measure time to the first genuine counterexample and false-alarm rate. Failure to find a counterexample means unknown. A bounded model check is not a universal proof; spurious or approximate tool results require independent checking.

### 8. Select a SAT/SMT solver portfolio — Pilot / Research

**Established:** SATzilla selects solvers per instance using empirical hardness models and demonstrated strong competition results. Its evidence is for learned instance features and particular portfolios, not semantic prompting. [SATzilla project](https://www.cs.ubc.ca/labs/algorithms/Projects/SATzilla/)

**Proposed adapter:** code extracts syntax, theory use, structural statistics, and short probe outcomes; include semantic provenance such as arithmetic constraints or bit-vector verification. Choice selects one solver, preset, or short schedule from a tested portfolio. Check satisfying assignments and, where supported, unsatisfiability proofs.

One small call can be amortized over a seconds-to-hours solve. Measure solved-instance rate, penalized runtime including timeouts, and regret against the best fixed solver. Compare directly with a decision tree on the same numerical features. A text model needs to demonstrate added value from semantic information; there is little rationale for replacing a fast existing numeric selector without such evidence.

### 9. Choose MIP solver configurations per problem family — Pilot / Research

**Established:** Hydra-MIP combined automated configuration and portfolio selection for mixed-integer programming. Configurations of one solver can have complementary strengths. [Hydra-MIP, 2011](https://www.cs.ubc.ca/~kevinlb/papers/2011-HYDRA-MIP.pdf)

**Proposed adapter:** provide the mathematical formulation's semantic description, code-derived size and sparsity, known structure, objective type, and a short measured probe. Choice selects among previously benchmarked configurations emphasizing feasibility search, bound improvement, or a conservative default.

This makes more practical use of language than asking a model to read a giant coefficient matrix. Low price allows decisions for every submitted instance; latency is negligible on sufficiently long solves. Measure primal and dual progress over time, time to requested gap, and difficult-tail regressions. Keep validity-related solver settings fixed. Do not infer a valid optimality certificate from confidence, and do not automatically extrapolate configuration performance to a new problem distribution.

### 10. Select a branching variable in branch-and-bound — Research; hot-loop concern

**Established:** Gasse et al. trained graph convolutional policies to imitate strong branching using the variable–constraint bipartite graph of mixed-integer programs. They demonstrated improvements on studied problem families and larger instances. [Exact Combinatorial Optimization with Graph Convolutional Neural Networks, 2019](https://proceedings.neurips.cc/paper/2019/hash/d14c2267d848abeb81fd590f371d39bd-Abstract.html)

**Proposed adapter:** code shortlists legal fractional variables and calculates all numerical features. Choice prioritizes a candidate; branch-and-bound creates the branches and retains valid bounds.

It is attractive only if judgment saves more LP work than it adds. Measure total solving time and optimality gap, not just fewer search nodes. Serialization loses the original graph model's structural advantages. Large variable lists and very frequent decisions make the present text API a weak default. A root-node or rare-checkpoint experiment is more defensible than replacing every branching decision. Required legal branches must not disappear.

### 11. Select already-valid cutting planes — Research

**Established:** Tang et al. used reinforcement learning for adaptive cut selection and demonstrated benefits on their integer-programming tasks and branch-and-cut integrations. [Learning to Cut, 2020](https://proceedings.mlr.press/v119/tang20a.html)

**Proposed adapter:** the solver generates valid candidate cuts and computes efficacy, sparsity, numerical conditioning indicators, and overlap. Choice picks a candidate cut family or a bounded subset policy. The solver retains responsibility for validity and numerical acceptance.

The potential benefit is a tighter relaxation without excessive LP size. Batch-level selection can amortize a short inference call. Measure wall time, relaxation progress, LP growth, and numerical failures. The original learned policy is not evidence of zero-shot text understanding of polyhedra. Never ask Noul whether an arbitrary inequality is valid and insert it solely on that basis: an invalid cut can remove the optimum while leaving an apparently successful optimization run.

### 12. Select large neighborhoods for combinatorial improvement — Research; promising coarse timescale

**Established:** learned large-neighborhood search selects a subset of variables to reconsider, while an ordinary MIP solver repairs or improves the solution. Sonnerat et al. evaluated this architecture on five real-world MIP datasets. [Learning a Large Neighborhood Search Algorithm for Mixed Integer Programs, 2021](https://arxiv.org/abs/2107.10201)

**Proposed adapter:** code constructs meaningful candidate neighborhoods—one connected subgraph, one scheduling block, one resource cluster—and provides measured constraint pressure and current search history. Choice allocates the next repair solve to a neighborhood.

This is a more credible latency fit than per-node branching because each repair may take substantial time. Semantic descriptions may convey structure omitted by simple numeric rules. Measure feasible objective improvement per second and primal integral under identical repair budgets. Feasibility is checked by the solver; global optimality requires separate evidence. Avoid claiming that successful heuristics preserve exact optimization guarantees by themselves.

### 13. Choose a variable order for cylindrical algebraic decomposition — Research

**Established:** England and Florescu studied ML selection of CAD variable orderings using polynomial features. On their NLSAT-derived dataset, the examined ML approaches outperformed the compared human-designed heuristics. The result is distribution-specific. [CAD variable ordering, 2019](https://arxiv.org/abs/1904.11061)

**Proposed adapter:** code computes polynomial degrees, supports, elimination constraints, and candidate ordering summaries. Choice selects a legal full order from a shortlist; a CAD implementation performs the real-algebraic calculation.

A single low-latency choice can change a very expensive computation. Measure total runtime, memory and cell count, counting feature and inference costs. There are factorially many orders, so do not expose all permutations; use established heuristics to create candidates. Logical quantifier constraints restrict permissible orders. This is an excellent demonstration of the abstract typed-selector concept but a weak assumption about current Jev's numerical representation competence.

### 14. Select S-pairs in Gröbner-basis computation — Research; hot-loop concern

**Established:** Peifer, Stillman, and Halpern-Leistner trained reinforcement-learning policies for S-pair selection in Buchberger's algorithm. Their proof of concept studied random binomial systems and improved polynomial-addition counts in certain domains. It did not establish universal acceleration of arbitrary polynomial systems. [Learning Selection Strategies in Buchberger's Algorithm, 2020](https://proceedings.mlr.press/v119/peifer20a.html)

**Proposed adapter:** code derives pair features and offers a shortlist; Choice selects the next pair or, more practically, the heuristic to use for the next batch. Exact polynomial arithmetic and valid pair-elimination criteria remain in the algebra system.

Measure full runtime as well as arithmetic operations and memory. The payoff may be large when reductions are expensive. If each decision is cheap, remote inference loses immediately. Preserve the algorithm's necessary pair processing; a negative Noul judgment is not a mathematical criterion for discarding a pair.

### 15. Route sparse linear systems to solvers and preconditioners — Pilot / Research

**Established:** Lighthouse integrated PETSc and Trilinos iterative solvers with a machine-learning workflow for classifying solver performance on sparse linear systems. [Lighthouse, SIAM, 2016](https://epubs.siam.org/doi/10.1137/15M1028406)

**Proposed adapter:** supply code-verified matrix properties, sparsity summaries, application provenance, available memory, and residual history. Choice selects an admissible solver/preconditioner combination from a maintained menu. Numerical software constructs the preconditioner and solves the system.

Language adds potential value where provenance describes operator structure; it should not replace cheap matrix diagnostics. Check residuals and suitable error/backward-error criteria, with robust fallback on stagnation. Measure setup plus solve time at the same achieved accuracy. A small residual alone need not imply a small forward error for an ill-conditioned problem. No model-derived “positive definite” label should replace an appropriate admissibility check for a method that requires it.

### 16. Route difficult integrals to appropriate numerical treatment — Pilot / Research

**Established:** QUADPACK-based routines already distinguish finite versus infinite limits, known trouble spots, oscillatory weights, and Cauchy principal values. This is an established algorithm portfolio, not evidence that ML improves it. [SciPy quad documentation](https://docs.scipy.org/doc/scipy/reference/generated/scipy.integrate.quad.html)

**Proposed adapter:** provide a parsed integrand, textual derivation, code-derived singularity candidates, and diagnostic messages. Choice picks a legal treatment such as a weighted oscillatory routine, interval splitting at verified points, transformed infinite-domain integration, or escalation.

Fast semantic routing can recover difficult research computations with less manual intervention. Benchmark verified error and evaluations per integral against current automatic dispatch. Deterministic rules win when the structure is already explicit; the possible model contribution is interpreting incomplete descriptions and tool failures. Numerical error estimates are not universal certificates. Principal value and ordinary improper integration are different questions and must never be silently exchanged.

### 17. Select equivalent formulations that a convex modeling system can certify — Pilot

**Established:** disciplined convex programming uses composition rules to certify curvature. CVXPY documents expressions that are convex but fail its initial syntax-based test and become certifiable after an equivalent rewrite. [CVXPY DCP](https://www.cvxpy.org/tutorial/dcp/)

**Proposed adapter:** a library of pre-proved rewrite templates offers candidate norm forms, epigraph forms, perspective patterns, or explicit domain declarations. Choice selects which template to attempt from the expression and modeling intent. Code checks the template's exact applicability and side conditions; the DCP checker validates the resulting formulation. Arbitrary symbolic equivalence checking is not assumed available. An unrepresented transformation requires mathematical review or a separate verified derivation.

The model's role is recognizing a pattern, not deciding global convexity. Low cost supports this on every modeling error, with rapid interactive feedback. Measure accepted equivalent reformulations and human correction time. A DCP success only certifies the submitted formulation: an incorrect transformation can solve a different problem. Numeric convexity tests and a high Noul value are not replacements for the equivalence and domain checks.

### 18. Prioritize symbolic-regression expression families — Research

**Established:** deep symbolic regression has used learned policies to generate mathematical expressions evaluated against data, recovering exact expressions on benchmark tasks. This demonstrates a search architecture, not unrestricted scientific-law discovery. [Deep Symbolic Regression, 2019/2021](https://arxiv.org/abs/1912.04871)

**Proposed adapter:** code or another model proposes expression families. Choice selects which already-defined family receives optimization budget; Noul can check a semantic constraint such as whether the description matches a stated symmetry. CAS and numerical code enforce actual symmetry, domains, dimensions, fitting and complexity penalties.

Cheap judgments help only when they save costly fitting or keep useful diversity. Measure recovery on synthetic ground truth, held-out prediction, and search cost versus standard symbolic search. Do not let the classifier produce coefficients through Score interpolation. Observational fit does not establish an identity, a causal relation, or out-of-domain validity; exact claims require separate mathematical verification.

## An evaluation plan that could falsify the idea

Start with three small pilots rather than all eighteen: premise relevance, formalization mismatch triage, and convex-rewrite routing. They exploit language and have interpretable errors. Add one portfolio task with measured solver runtimes to test whether semantic metadata contributes beyond ordinary features.

For every pilot, retain four baselines: current deterministic workflow, a random or simple heuristic selector, a cheap trained classical classifier where labels exist, and a stronger generative model when appropriate. For tactic routing also compare with simply running all cheap shortlisted tactics: inference can cost more than the work it avoids. Compare the entire workflow at equal time or cost, not just isolated classification accuracy. A selector that correctly names a theorem family but slows the prover is not a successful mathematical tool.

Partition data by theorem dependencies, problem families, or generator settings, not merely random rows. Near-duplicate proof states and minor perturbations of the same optimization instance can create misleading success. Record prompt, model version, selected option, confidence, latency, fallback reason, checked result, and full downstream compute cost. Include notation variations, missing hypotheses, negation, numerical boundary cases, and unfamiliar domains.

Preserve a sample of low-scored candidates for evaluation. Otherwise the system cannot discover which useful directions it has suppressed. For acceptance thresholds, report risk–coverage curves and confidence intervals on failures. For search priorities, report total solved tasks and performance tails. Confirm that accuracy survives the actual batch shape and state size; a larger context window is not evidence that dumping an entire library or matrix improves decisions.

## Strongest five opportunities and three traps

The strongest **current-model experiments** are: (1) semantically rerank retrieved lemmas; (2) detect explicit mismatches between informal and formal statements; (3) route goals to a bounded tactic/tool menu; (4) select checked convex-reformulation templates; and (5) choose long-running numerical or combinatorial solver configurations using semantic provenance plus code-derived features. These are priorities for testing, not validated capabilities.

The strongest **longer-term architectural examples** include cut selection, large-neighborhood search, CAD ordering, and proof-frontier allocation. Their mathematical literature is substantial, but task-trained policies and structural representations may remain the right implementations. Cheap generic inference does not automatically outperform a local specialized model.

Three traps are decisive. First, transferring a paper's learned heuristic result to Jev without testing representation and training differences. Second, confusing typed output or high confidence with a proof, valid cut, admissible method, or optimum. Third, treating 10 ms as fast everywhere: it is excellent before a costly solve and potentially thousands of times too slow inside a native arithmetic or search loop. The useful unit is **mathematical work saved per judgment**, not judgments per second alone.


---

# Chemistry R&D and the chemical industry: 18 uses for fast, inexpensive typed judgments

Research date: 21 September 2026. This is a research and opportunity assessment, not evidence that TypeSafe has already achieved these chemistry results. No TypeSafe calls or installations were made. Each application below separates an established scientific or industrial practice from a proposed integration.

The strongest opportunity is to make experimental and operational knowledge machine actionable at the point where software needs a small decision. A cheap classifier could repeatedly label observations, select applicable records, identify missing evidence, and route exceptions. Chemical calculations, molecular models, optimization, measured assays, and accountable release decisions remain separate components.

## Scope and scientific basis

The current vendor documentation specifies Jev 1.13 at $0.042 per million **input** tokens, with free output tokens, text-only inputs, 64k tokens for the whole request, and 32k for state plus the longest question. There is no customer fine-tuning or LoRA. These are a current vendor specification, not independently measured performance. Sub-100-ms response time is the user's working premise here; sub-10-ms is a future scenario. Neither establishes worst-case response time for an industrial controller. [TypeSafe model specification](https://docs.typesafe.ai/models)

The three useful interfaces are **Choice** for a bounded category, **Noul** for support for a specific proposition, and **Score** for a defined qualitative ordering. Noul is not automatically a calibrated probability of reaction success, hazard occurrence or assay validity; validate the exact question against domain outcomes. Score should not stand in for concentration, yield, solubility, temperature, free energy, uncertainty in an assay, or a calibrated failure probability. The vendor explicitly documents weaknesses in arithmetic, numeric precision, indirection, large irrelevant contexts, and logical consistency between separately worded questions. [Jev limitations](https://docs.typesafe.ai/model-jaggedness/jev-1.13)

Five established ideas explain the fit:

1. **Representations determine what can be learned.** ChemDataExtractor demonstrates structured chemical information extraction; the Open Reaction Database defines a shared reaction schema. A semantic classifier can help map heterogeneous records into these structures. Neither proves that a general text model understands arbitrary molecular graphs. [Swain and Cole, 2016](https://pubs.acs.org/doi/10.1021/acs.jcim.6b00207); [Kearnes et al., 2021](https://pubmed.ncbi.nlm.nih.gov/34727496/)
2. **Search can separate proposals from judgments.** Retrosynthetic search has combined policy networks, filtering, and Monte Carlo tree search. That architecture motivates inexpensive judgment functions around a search procedure; its demonstrated chemistry comes from specialist networks and reaction data. [Segler et al., 2018](https://www.nature.com/articles/nature25978)
3. **Experimental design separates utility from feasibility.** Bayesian optimization learns from expensive experiments and allocates the next measurements. A text classifier can identify applicable documented constraints and censored observations, while the surrogate model and acquisition function perform the quantitative optimization. [Shields et al., 2021](https://pubmed.ncbi.nlm.nih.gov/33536653/)
4. **Automation benefits from explicit state and typed actions.** Chemical execution systems have translated literature into an intermediate representation and compiled it against a hardware graph. A classifier can help identify action types and ambiguities before compilation. [Mehr et al., 2020](https://pubmed.ncbi.nlm.nih.gov/33004517/)
5. **An anomaly and its explanation are different objects.** Multivariate batch monitoring detects departures from normal trajectories. A semantic layer can associate those departures with recorded interventions and process phases, without replacing the numerical detector. [Nomikos and MacGregor, 1994](https://aiche.onlinelibrary.wiley.com/doi/10.1002/aic.690400809)

Maturity labels below mean **Near-term candidate**: a narrow text judgment that is reasonably testable with current Jev; **Integration research**: substantial domain evaluation and surrounding engineering required; **Specialist required**: the direct scientific task needs a validated chemistry-specific model, with Jev only serving an adjacent semantic role. None means deployment readiness has been established.

## Research, formulation, and laboratory operations

**1. Convert literature and ELN fragments into trustworthy experimental labels — Near-term candidate.**

Input: one source passage, extracted entities, and candidate fields in an ELN or ORD record. Ask Choice: “Does this value describe isolated yield, analytical yield, conversion, or something unstated?” Ask Noul: “Does this paragraph report an experiment that was actually performed?” Code attaches the original span, parses values and units, and validates the schema; a chemist reviews uncertain assignments. This matters because a correctly typed number assigned to the wrong scientific quantity can silently corrupt a dataset. Cheap decisions permit checking every field instead of a sampled audit; latency supports capture while the scientist is still entering the record. Measure field-level precision/recall, missing-data detection, and expert correction time, with document-level train/test separation. The grounded precedent is chemistry-aware extraction and structured reaction records, not successful Jev chemistry extraction. [ChemDataExtractor](https://pubs.acs.org/doi/10.1021/acs.jcim.6b00207); [ORD](https://pubmed.ncbi.nlm.nih.gov/34727496/)

**2. Distinguish failed chemistry from failed measurement and missing observations — Near-term candidate.**

Input: experiment status, assay report, and a short operator note. Choice distinguishes “experiment not run,” “measurement invalid,” “below detection limit,” “valid measured result,” and “unclear.” A second explicit question detects an operator-reported execution deviation. Code decides whether a record is missing, censored, or eligible for an optimization dataset; quantitative censoring models handle detection limits. This prevents a broken injector or an unperformed experiment from being treated as zero chemical performance. Low cost makes it practical to classify every experimental row, including old failed runs; speed helps a laboratory scheduler keep incomplete measurements out of the next optimization cycle. Validate against expert adjudication and measure downstream optimizer performance with and without these labels. This is a proposed data-quality layer around existing reaction optimization workflows. [Bayesian reaction optimization](https://pubmed.ncbi.nlm.nih.gov/33536653/)

**3. Lint protocols before translating them into executable laboratory programs — Near-term candidate.**

Input: a protocol step, candidate action types, nearby steps, and available equipment descriptions. Choice selects a documented action category; Noul flags an unresolved reference, unspecified material identity, or ambiguity requiring the author. A deterministic parser or separate generator creates candidate intermediate code; a compiler checks units, prerequisites, equipment compatibility, and execution order. The classifier does not invent missing amounts or produce unreviewed machine instructions. Low latency enables live checks as a scientist edits a protocol; low cost permits several narrowly worded checks per step. Metrics: action-class accuracy, ambiguity recall, false warnings, and correct execution after expert approval. The architectural precedent is literature-to-code synthesis execution, which included hardware-aware compilation rather than a free-form language model directly controlling apparatus. [Mehr et al., 2020](https://pubmed.ncbi.nlm.nih.gov/33004517/)

**4. Add operational constraints to retrosynthetic route search — Integration research.**

Input: candidate routes from a specialist planner, human-readable step annotations, stock metadata, and documented project restrictions. Ask Noul per candidate: “Does the supplied route explicitly require an unavailable equipment class?” Choice can select the applicable internal review category; Score can rank completeness of supporting process evidence. Exact inventory checks, graph validity, chemical feasibility, and cost calculations run in code or specialist models. The opportunity is earlier triage of routes that are synthetically plausible but inconvenient for the actual organization. Cheap fan-out can inspect many branches, and fast judgment avoids making text review a serial search bottleneck. Validate top-k retention of chemist-approved routes, inappropriate rejection rate, and total planning time. Retrosynthetic MCTS is established; replacing its reaction-feasibility network with Jev is unsupported. [Segler et al., 2018](https://www.nature.com/articles/nature25978)

**5. Route chemical records by reaction family — Specialist required for structural chemistry.**

Input: a reaction description, a specialist-generated reaction representation, or known catalog annotations. Choice can map an explicitly described transformation to a bounded taxonomy for retrieval, reporting, or selecting a specialist predictor. Cases requiring inference from reaction SMILES alone should be handled by an evaluated chemistry model unless Jev itself passes a suitable benchmark. A reaction-trained transformer has demonstrated reaction-class prediction and useful fingerprints, which shows that classification is a scientifically meaningful primitive. It does not transfer that demonstrated accuracy to an unrelated text classifier. Cheap labels can improve catalog coverage and route many records to suitable tools. Metrics: macro-F1 across rare classes, scaffold/time-split performance, abstention coverage, and routing improvement. A “miscellaneous/unknown” category is essential. [Schwaller et al., 2021](https://www.nature.com/articles/s42256-020-00284-w)

**6. Connect laboratory narrative constraints to Bayesian experimental design — Integration research.**

Input: a proposed experiment, equipment state, project restrictions, and a finite catalog of validated constraint IDs. Noul asks whether each written restriction applies; Choice maps a stated limitation to its corresponding constraint ID. Code then computes actual feasibility and the optimizer selects among feasible candidates. For example, a scientist's note that a particular analytical method is unavailable should change the available measurement choices, not become a fabricated numerical penalty. This could improve active-learning campaigns where practical constraints are scattered across notes and scheduling systems. Low cost supports screening many candidate experiments; sub-100-ms judgment may be adequate because physical experiments are much slower. Measure constraint recall, useful-candidate retention, experiments-to-target, and wasted instrument slots. Established Bayesian optimization provides the quantitative method; natural-language constraint interpretation is the proposed addition. [Constrained chemistry optimization paper](https://arxiv.org/abs/2203.17241)

**7. Turn formulation observations into additional learning targets — Near-term candidate for reported observations.**

Input: formulator notes, measured properties, and candidate defect labels. Choice classifies explicitly reported outcomes such as phase separation, poor handling, visible defect, or no reported defect; Score grades the clarity of the evidence, not actual material quality. Code joins labels with measured viscosity, strength, dissolution, or other endpoints. A formulation model can learn which regions meet multiple requirements. This is useful for coatings, adhesives, detergents, polymer blends, battery formulations, and pharmaceutical tablets, although each domain needs its own evaluation. Low cost recovers qualitative outcomes from many historical trials; speed captures labels during the experiment. Metrics: agreement on observed defect class and improved prospective success per experiment. Integrated formulation models and autonomous tableting have already been demonstrated; transferring a typed text layer across industries remains a proposal. [Abbas et al., 2026](https://www.nature.com/articles/s41467-026-71204-6)

**8. Handle nonhazardous workflow exceptions in self-driving laboratories — Integration research.**

Input: instrument status text, scheduler state, and an operator-maintained list of permissible recovery categories. Choice selects “retry data transfer,” “await consumable,” “request operator,” “reschedule analysis,” or “unclassified.” Deterministic state machines verify preconditions and bounded retry counts. Physical recovery requiring altered chemistry or bypassing protections goes to an operator. Fast decisions can remove gaps between instrument tasks, and inexpensive repeated checks can make smaller laboratories economical to integrate. Validate unattended useful operating time, unnecessary stoppages, incorrect recoveries, and recovery completeness. A mobile robotic chemist and later modular robotic laboratory demonstrate the surrounding automation, not a general model's ability to safely recover any exception. Useful speed comes from avoiding minutes of coordination delay; it does not make a slow chemical transformation intrinsically faster. [Burger et al., 2020](https://www.nature.com/articles/s41586-020-2442-2)

## Analytical quality, manufacturing, and scale-up

**9. Reconcile supplier certificates and incoming-material specifications — Near-term candidate.**

Input: parsed certificate-of-analysis fields, supplier method descriptions, and approved internal specifications. Choice maps terminology to an internal test name or “not equivalent”; Noul flags a qualification statement or an explicitly different reporting basis. Code verifies lot identities, arithmetic, units, dates, numerical limits, and mandatory fields. Quality personnel determine acceptability and any additional testing. The model's value is recognizing semantic mismatches that simple column matching misses. Low cost allows per-lot checking and multiple questions for every reported property; low latency supports immediate feedback during receipt. Metrics: false acceptance of mismatched methods, discrepancy recall, and review time. API GMP guidance provides the existing quality framework, but it is not evidence that automated semantic matching alone is sufficient for material release. [FDA Q7A](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/q7a-good-manufacturing-practice-guidance-active-pharmaceutical-ingredients)

**10. Triage out-of-specification investigations without rewriting results — Near-term candidate.**

Input: an OOS event, instrument log, method checklist, and analyst narrative. Choice selects the relevant investigation queue; Noul determines whether the supplied record documents a particular required check. Software preserves the original measurement and audit trail, opens missing-evidence tasks, and leaves invalidation, retesting, and batch decisions with the established quality process. The model should never relabel a failing assay as acceptable from contextual optimism. Low cost supports checking every case against several explicit evidence questions; speed shortens administrative delays in starting the appropriate investigation. Metrics: mandatory-check omission rate, correct routing, investigation lead time, and false claims that a cause was established. FDA's OOS guidance defines the established investigation problem; this proposed classifier helps organize evidence. [FDA OOS guidance, 2022](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/investigating-out-specification-oos-test-results-pharmaceutical-production-level-2-revision)

**11. Decide which additional characterization evidence is missing — Integration research.**

Input: specialist-produced summaries of chromatographic, mass-spectrometric, and NMR analyses, their validity flags, and a finite set of approved follow-up categories. Noul asks whether the documented evidence addresses a specific identification criterion; Choice selects “sufficient for this research gate,” “repeat invalid measurement,” “request orthogonal evidence,” or “chemist review.” Code enforces the experiment-specific gate; analytical systems process the raw data. Cheap repeated judgments could support richer branching than a single yield threshold. Measure agreement with chemists, false advancement, novelty missed, and unnecessary assays. Dai et al. demonstrated autonomous decisions using orthogonal measurements and explicit heuristics. The transfer is contextual evidence routing, not a claim that Jev can infer molecular identity from raw spectra. [Dai et al., 2024](https://www.nature.com/articles/s41586-024-08173-7)

**12. Check analytical method changes against their documented validation scope — Near-term candidate.**

Input: a proposed method edit, validation summary, analytical target description, and approved change categories. Choice classifies the edit's stated purpose; Noul asks whether an affected characteristic is explicitly covered by supplied evidence. Rules calculate numerical parameter-range changes, and an analytical scientist chooses required validation work. This can identify documentation gaps before routine method transfer or maintenance, especially when method names remain constant while the actual procedure changes. Low cost supports frequent small-change reviews; fast feedback fits document authoring and laboratory systems. Metrics: missed validation gaps, expert agreement, and time to a complete review packet. ICH Q14 provides a scientific, lifecycle approach to analytical procedure development; Q2(R2) addresses validation, including spectroscopic analytical uses. Neither makes a general classifier an analytical validation method. [FDA Q14](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/q14-analytical-procedure-development)

**13. Explain process-monitoring alerts using recorded operating context — Integration research.**

Input: numerical detector outputs, named residual patterns, process-phase labels, maintenance records, and the current operator note. Choice selects a bounded explanatory category such as planned transition, instrument work, known procedure deviation, or unresolved. Code retains all alarms and computes trends; validated statistical or mechanistic models continue monitoring. The classifier can help prioritize an engineer's investigation and retrieve the relevant procedure. Low latency is valuable for fresh advisory context, while low cost supports many tags or batches. Measure alert-to-diagnosis time, missed genuine upsets, nuisance-review workload, and performance on previously unseen operating modes. PAT and multiway process monitoring ground the application. Benchmarking can begin on Tennessee Eastman simulations, but simulated fault classification does not establish plant deployment safety. [FDA PAT](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/pat-framework-innovative-pharmaceutical-development-manufacturing-and-quality-assurance); [Downs and Vogel, 1993](https://www.sciencedirect.com/science/article/pii/009813549380018I)

**14. Find knowledge gaps during scale-up and technology transfer — Near-term candidate.**

Input: one unit-operation description from development, its corresponding manufacturing description, and a checklist of transfer evidence. Noul asks whether a changed operation is explicitly covered by a characterization study; Choice maps an unresolved item to mixing, heat transfer, material variability, sampling, analytical transfer, or another bounded engineering owner. Engineers perform dimensionless analysis, mass/energy balances, calorimetry interpretation, and scale-up calculations independently. A classifier is useful for detecting that a documented condition or assumption has changed, not proving that scale-up is safe. Cheap comparisons allow scanning every relevant pair of records as revisions arrive; speed supports interactive gap closure. Metrics: critical-gap recall, incorrect equivalence claims, and transfer-review effort. Existing process-quality and change-management practices supply the operational basis. [FDA Q7A](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/q7a-good-manufacturing-practice-guidance-active-pharmaceutical-ingredients)

## Plant knowledge, maintenance, and environmental records

**15. Prepare and quality-check HAZOP evidence packets — Near-term candidate for support.**

Input: a reviewed process-node description, existing HAZOP entries, and approved guideword/category definitions. Choice groups already stated concerns; Noul checks whether the supplied record explicitly contains a cause, consequence, safeguard reference, and action owner. Code checks missing fields and references; the multidisciplinary team performs hazard analysis and judges adequacy. Cheap per-entry checks make it practical to catch omissions continuously rather than during a large final review. Evaluate missed documentation gaps, false assurances of completeness, reviewer workload, and whether supporting references actually entail the claim. This cannot establish that all hazards have been identified. OSHA's framework explicitly requires an appropriately experienced team for process hazard analysis; the classifier's proposed role is preparation and evidence checking. [OSHA 1910.119(e)](https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.119)

**16. Map a proposed change to the documents and teams that need review — Near-term candidate.**

Input: a change description and candidate process information, procedures, training records, and equipment documents. Noul judges each candidate document's relevance to the stated change; Choice assigns a review discipline. Code tracks versions, deadlines, dependencies, and approvals. This can expose overlooked connections when a modest equipment or procedure change affects several records. It does not autonomously declare a change to be “replacement in kind” or authorize startup. Low cost makes broad candidate matching practical, and low latency updates the review packet as the proposal evolves. Measure recall of affected records, unnecessary review burden, and reopened changes caused by omissions. Management-of-change documentation and review are established industrial practices; semantic candidate filtering is the proposed improvement. [OSHA PSM compliance guidance](https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.119AppC)

**17. Preserve unresolved maintenance and operating conditions across handovers — Near-term candidate.**

Input: a maintenance note or logbook entry, equipment ID candidates, and current work-order states. Choice classifies “open work,” “observation,” “awaiting verification,” or “closed with stated evidence”; Noul identifies whether a handover-relevant condition is explicitly unresolved. Exact identity resolution, timestamps, work permits, and closure rules remain in the maintenance system. The classifier highlights items for a two-way human handover and retains original text. Low cost supports every entry, including repetitive notes; rapid updates keep the handover packet current between shifts. Metrics: missed open conditions, false closures, correct equipment association, and handover preparation time. HSE emphasizes preparation, exchange, and incoming-personnel cross-checking; an automatically generated digest cannot replace those activities. [HSE shift handover guidance](https://www.hse.gov.uk/humanfactors/topics/shift-handover.htm)

**18. Check waste and environmental records for classification evidence gaps — Near-term candidate.**

Input: waste-stream descriptions, source-process records, approved profiles, laboratory results, and candidate administrative categories. Choice maps an entry to a known profile candidate or “unmatched”; Noul asks whether the supplied documentation establishes a named fact or shows that the source process changed. Code reconciles quantities, identifiers, dates, and reporting formulas. Environmental specialists make legal determinations and request testing where necessary. Cheap classification can audit all streams or shipments instead of sampled records; latency enables correction before an incomplete packet progresses. Metrics: incorrect profile matches, missed process changes, missing-evidence recall, and rework. EPA explicitly distinguishes documented knowledge from testing when knowledge is inadequate. This supports evidence triage, not inferring a mixture's hazardous properties from a fluent description. [EPA generator-rule guidance](https://www.epa.gov/hwgenerators/frequent-questions-about-implementing-hazardous-waste-generator-improvements-final)

## What the low price and speed actually change

At the stated current input price, a 1,000-token judgment request costs about $0.000042; one million such requests cost $42 in model input charges. A 32,000-token input costs about $0.001344. These arithmetic examples exclude retrieval, OCR, storage, integration, retries, human review, instruments, and any separate specialist model. Shared-state question batching can reduce repeated context, but request size and published rate limits still matter.

In chemistry, the economic effect is often larger than the latency effect. Physical experiments can take minutes to days. Making the classifier ten times faster rarely makes the experiment ten times faster. It can make semantic checks ubiquitous, reduce waiting between systems, support more candidate screening, and allow incremental checks while people work. The useful target is **more valid experiments and fewer preventable errors per scientist-hour**, not tokens processed per second.

A 32k state is ample for many single-event decisions. Large historical collections should remain searchable databases. Retrieve the relevant protocol, exact passage, or recent window and ask literal questions. A hypothetical million-token context does not remove the costs of distraction, stale records, contradictory procedures, or lost provenance.

Validation should use held-out projects, time periods, suppliers, equipment versions, and uncommon failure modes. Compare against rules, a small conventional classifier, and normal human review. Preserve an unknown/abstain route. Evaluate the whole workflow's false advancement rate, missed issues, throughput, and correction burden rather than accuracy alone. Log model version, criteria, source IDs, and downstream disposition. Repeated probabilities are useful features, but correlated or logically inconsistent answers are not independent evidence.

For process equipment, speed is not functional safety. A safety instrumented system has specification, design, installation, operation, and maintenance requirements under IEC 61511. None of the cited TypeSafe material establishes suitability for a safety function. The proposed applications place semantic interpretation above validated control and protection layers. [IEC 61511-1:2016](https://webstore.iec.ch/en/publication/24241)

## Five strongest starting points and three traps

The best first pilots are **experimental-data labeling**, **protocol ambiguity checks**, **certificate/specification reconciliation**, **OOS evidence routing**, and **maintenance/handover completeness checks**. They have bounded outputs, recoverable mistakes, abundant historical text, and clear expert labels. For a more ambitious scientific pilot, use the classifier to distinguish valid, missing, and censored measurements in an existing Bayesian optimization campaign and test whether prospective experiment efficiency improves.

Three traps are decisive. First, **chemical tokens are not chemical competence**: accepting SMILES as text does not establish molecular reasoning, and even specialist reaction predictors can exploit dataset shortcuts. [Reaction-prediction bias study](https://www.nature.com/articles/s41467-021-21895-w) Second, **a Score is not a physical quantity**: numerical outputs cannot replace validated assays, thermodynamics, kinetics, or concentration calculations. Third, **faster repeated judgment can propagate the same mistake more widely**: cheap fan-out needs validated boundaries, provenance, and abstention, especially when a false acceptance enters a physical or regulatory workflow.
