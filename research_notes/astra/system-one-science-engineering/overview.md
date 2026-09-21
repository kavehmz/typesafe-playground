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
