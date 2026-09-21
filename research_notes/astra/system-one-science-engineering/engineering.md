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
