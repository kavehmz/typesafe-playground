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
