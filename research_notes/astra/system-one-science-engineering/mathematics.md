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
