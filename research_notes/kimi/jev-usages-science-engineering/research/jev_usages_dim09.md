# Jev ("System One" Typed-Judgment Model) — Usage Catalog, Dimension 09: MATHEMATICS
## Symbolic computation, optimization, and math-adjacent applications

**Scope.** Jev is a non-generative, typed-judgment model: input = JSON "state" + typed questions; output = structured judgments — **Choice** (pick an option, with probabilities + confidence), **Noul** (is a statement true; probability), **Score** (ordered rubric position). Sub-100ms latency (roadmap sub-10ms), ~$0.04/Mtoken, 32K context, many questions per call. The recurring pattern below: mathematical software is full of **heuristic choice points that affect performance but not correctness** — exactly the "safe" locus where the ML-for-symbolic-computation literature has repeatedly shown learned judgment beats hand-crafted heuristics. Jev is positioned as a cheap, in-loop replacement for those bespoke ML models and heuristics.

**Method.** 26 web searches (coarse-to-fine: survey-level → primary papers). Primary sources prioritized; verbatim excerpts quoted. Confidence given per usage.

---

## A. Computer Algebra Systems (CAS)

### Usage 1 — Variable-ordering selection for Cylindrical Algebraic Decomposition (CAD)
**One-liner:** Jev's `Choice` picks the variable ordering (or which heuristic to trust) before a CAD run — the single highest-leverage decision in quantifier elimination.

**Current practice & bottleneck.** CAD is doubly exponential and hyper-sensitive to ordering: "some problems [are] infeasible with one variable ordering but easy with another."[^1^] Human heuristics (Brown's, sotd, ndrr) are imperfect. A decade of ML work shows learned selection beats them: an SVM choosing among heuristics "outperform[ed] each of the separate heuristics"[^1^]; later, KNN/MLP/DT/SVM selecting the ordering directly found "all of the ML approaches outperformed the human made heuristics, some by a large margin."[^3^] A 2023 NeurIPS RL approach (GRL-SVO) "outperform[s] state-of-the-art learning-based heuristics and [is] competitive with the best expert-based heuristics."[^5^] Bottleneck: each deployment trains, features, and ships a bespoke classifier per CAS/dataset; "data pollution" and feature engineering remain pain points.[^4^][^6^]

**Primitive design.** State = polynomial system (degrees, term counts per variable, support structure) + optional candidate orderings. Questions: `Choice` over the n! candidate orderings (or over the 3 named heuristics); `Noul`: "will ordering X complete within budget B?"; `Score`: rank candidate orderings by predicted cell count. Compose: ask per-variable elimination-first questions and assemble the ordering in code.

**Why latency/cost matters.** The ML judgment sits on the critical path *before* a potentially hours-long computation; the verdict itself must be negligible. Florence & England's pipeline explicitly frames this as a generic "software pipeline to use [ML] to pick the variable ordering for an algorithm that acts on a polynomial system"[^4^] — Jev is that pipeline as a service, with zero per-site model training. Cheap calls also enable the per-branching-step usage of GRL-SVO(UP) ("a branching heuristic integrated with CAD"[^5^]) inside the decomposition loop.

**Evidence.** [^1^][^2^][^3^][^4^][^5^][^6^] **Confidence: HIGH** — most extensively validated ML-in-CAS result in the literature; direct analog of `Choice`.

---

### Usage 2 — Gröbner-basis preconditioning verdict & monomial-order selection
**One-liner:** Jev's `Noul` answers "would GB preconditioning help this CAD instance?"; `Choice` picks the monomial order (grevlex/lex/weighted) for a basis computation.

**Current practice & bottleneck.** Huang et al.'s second CAD case study used ML "to identify when a CAD problem instance would benefit from Gröbner Basis preconditioning... the machine learned choice outperforms human developed heuristics."[^2^] On the GB side, monomial order dominates runtime; recent RL work "Learning Fast Monomial Orders for Gröbner Basis Computations" has an agent output a weight vector per problem family,[^7^] and NeurIPS 2024 work demonstrates "Learning to compute Gröbner bases" end-to-end.[^8^] Bottleneck: hand-tuned order defaults; RL agents are expensive to train and narrow per domain.

**Primitive design.** State = ideal generators (supports, degrees, coefficient field). `Noul`: "Is grevlex→lex conversion (FGLM) cheaper than direct lex?" / "Will GB preconditioning reduce CAD cell count?" `Choice`: pick from {grevlex, lex, weighted-w, eliminate-block} orders.

**Why latency/cost matters.** GB computations routinely run minutes–days; the advisory call is noise. But in *preconditioning loops* (many candidate systems tested per CAD), the verdict is called per candidate — sub-100ms, sub-cent judgment keeps the meta-loop cheap. A $0.04/Mtoken judge replaces per-site RL training entirely for the binary gut-checks.

**Evidence.** [^2^][^7^][^8^] **Confidence: HIGH** (preconditioning Noul — direct published precedent); **MEDIUM** (monomial-order Choice — strong recent RL evidence, less mature).

---

### Usage 3 — Symbolic-integration sub-algorithm selection
**One-liner:** Jev's `Choice` picks which of a CAS's ~12 integration sub-algorithms (Risch, rischNorman, pattern-match rules, etc.) will return the best-form answer fastest.

**Current practice & bottleneck.** Maple's integrator is a meta-algorithm over many sub-algorithms; "choosing the right sub-algorithm for a given problem is challenging."[^9^] Barket, England & Gerhard (2024, with Maplesoft) trained LSTM and TreeLSTM selectors: TreeLSTM reached **84.6%** optimal-subalgorithm accuracy vs **60.5%** for "Maple's existing approach" and 56.8% for a flat LSTM — "able to produce better outputs than Maple's current state-of-the-art meta-algorithm."[^9^][^10^] Bottleneck: expression representation engineering (tree vs. string) and per-CAS retraining.

**Primitive design.** State = integrand (string + expression-tree digest), answer-length preference, time budget. `Choice` over sub-algorithms with probabilities; `Noul` per sub-algorithm: "will sub-algorithm k succeed within t seconds?" — the binary-relevance framing used by the TreeLSTM paper maps one-to-one onto a batch of Nouls in one call.

**Why latency/cost matters.** `int()` is called interactively and inside larger symbolic pipelines; the selection overhead must be far below the integration itself. Many Nouls per call matches the paper's multi-label design exactly, at ~zero marginal cost per extra algorithm.

**Evidence.** [^9^][^10^] **Confidence: HIGH** — peer-reviewed, industrial (Maplesoft) validation; binary-relevance = Noul batch.

---

## B. SMT / SAT / Theorem Proving

### Usage 4 — SMT tactic & strategy selection (Z3 strategy language)
**One-liner:** Jev evaluates strategy probes (`Noul`: "is this instance pseudo-boolean?") and picks tactic sequences (`Choice`) — i.e., it *is* the `if`-combinator of the Z3 strategy language, learned instead of hand-written.

**Current practice & bottleneck.** "It has long been observed that no single solver or algorithm excels across all instances... modern SMT solvers, such as Z3, offer user-controllable strategies."[^11^] A strategy "selects, sequences, and parameterizes tactics" using built-in probes, e.g. `(if is-pb (then propagate-values sat) smt)`.[^11^][^12^] Customization is traditionally done "by human experts through extensive experimentation"; Z3alpha (IJCAI 2024) automates it with layered/staged MCTS and "on a challenging QF_BV benchmark set... solves 42.7% more instances than the default strategy."[^11^] Bottleneck: strategy search is offline and instance-class-specific; probes are brittle hand-written predicates.

**Primitive design.** State = formula features (logic fragment, counts, theory mix). `Noul` = learned probe predicates ("is-pb", "is mostly linear", "contains arrays"); `Choice` over candidate tactic chains; `Score` = predicted runtime rubric per tactic. Z3's `if`/`or-else`/`try-for` combinators compose Jev's verdicts exactly as they compose probes today.

**Why latency/cost matters.** Probes run per instance at solve start — must be milliseconds. Batch Nouls (one call, many probe questions over the same state) mirrors how strategies evaluate several probes before committing. Sub-cent cost makes per-instance (not per-benchmark-class) strategy adaptation economical, where today only offline MCTS synthesis is affordable.

**Evidence.** [^11^][^12^][^13^] **Confidence: HIGH** — strategy language is shipping Z3 infrastructure; learned-probe replacement is a direct substitution.

---

### Usage 5 — Per-instance solver portfolio selection (SATzilla lineage → MILP/CP/SMT)
**One-liner:** Jev's `Choice` selects which solver from a portfolio to run on this instance — the classic Algorithm Selection Problem (Rice 1976).

**Current practice & bottleneck.** "Rice (1976) formalized this as a mapping from instance features to algorithm performance... SATzilla (Xu et al., 2008) pioneered feature-based algorithm selection for SAT. This was later automated by AutoFolio (Lindauer et al., 2015). The ASlib benchmark library (Bischl et al., 2016) provides a standardized evaluation framework."[^14^] SATzilla2012 "won 3 out of the 4 categories for which [it] was eligible."[^15^] Bottleneck today: "domain-specific feature engineering... SATzilla's probing features run SAT solvers internally and can time out or crash... the original tool failed to extract features from over 20% of modern SAT competition instances."[^14^] Recent work (ZeroFolio) abandons features for raw-text embeddings + kNN.[^14^]

**Primitive design.** State = serialized instance (CNF/MPS/MiniZinc/SMT2 text or digest) + solver metadata. `Choice` over portfolio with calibrated probabilities; `Noul`: "will solver s beat timeout T?"; compose in code: run predicted-best, fall back on low confidence (probability+confidence outputs are designed for exactly this gating).

**Why latency/cost matters.** Selection happens once per instance before a solve that may take minutes–hours — the selector's own runtime is budgeted in SATzilla-style systems (feature extraction is already a line item). A ~100ms, sub-cent `Choice` replaces the whole feature-extraction + model-serving stack, and confidence-aware fallback costs nothing extra.

**Evidence.** [^14^][^15^][^16^] **Confidence: HIGH** — 50-year-old formalized problem with competition-winning precedent.

---

### Usage 6 — Solver parameter/configuration advisory (SMAC / Hydra-MIP heritage)
**One-liner:** Jev's `Choice`/`Score` recommends per-instance solver parameter settings (CPLEX/Gurobi/SCIP knobs), replacing or warm-starting expensive offline configurators.

**Current practice & bottleneck.** "State-of-the-art solvers for mixed integer programming (MIP) problems are highly parameterized"; automated configuration (ParamILS, SMAC, GGA++) "yields substantial improvements to the performance of three MIP solvers: CPLEX, GUROBI, and LPSOLVE... outperform[ing] the CPLEX special-purpose automated tuning tool."[^17^][^18^] SMAC (LION 2011) iteratively fits an empirical performance model and races challenger configurations against an incumbent.[^18^][^19^] Hydra-MIP does per-instance configuration selection.[^20^] Bottleneck: "training these parameter configuration models is computationally intensive. Hydra-MIP... required over 250,000 CPU days of runtime."[^21^]

**Primitive design.** State = instance features + candidate configurations. `Score` each of k curated configurations on predicted-runtime rubric; `Choice` picks; `Noul`: "will config c beat the default on this instance?" Use Jev online as a zero-training proxy, or as the surrogate *proposal* filter inside a SMAC-style loop (Jev screens 10,000 candidate configs down to a racing shortlist).

**Why latency/cost matters.** Inside SMAC's loop, the surrogate is queried tens of thousands of times per configuration run ("10,000 points drawn at random... sorted by acquisition score"[^22^]); a cheap typed judge as pre-filter slashes surrogate-query and evaluation cost. Per-instance advisory at solve time must be milliseconds.

**Evidence.** [^17^][^18^][^19^][^20^][^21^][^22^] **Confidence: HIGH** (per-instance config selection — Hydra-MIP precedent); **MEDIUM** (Jev-as-surrogate-filter — novel composition, plausible).

---

## C. Inside the Optimization Loop

### Usage 7 — Branching-variable judgments in branch-and-bound
**One-liner:** Jev's `Choice` picks which fractional variable to branch on at each B&B node — a learned strong-branching surrogate.

**Current practice & bottleneck.** "The efficiency of B&B algorithm mainly depends on branching variable selection and node selection... choosing good variables to branch on can lead to a dramatic reduction in terms of the number of nodes."[^23^] Strong branching gives "the smallest search tree currently known. However, it increases the computation significantly"; pseudocost branching is cheap but "relies on human intuition and extensive engineering."[^23^] The literature imitates strong branching with ML (imitation learning, then RL); CP solvers likewise learn value-selection heuristics: "Imitation learning has for instance been used to replicate the expensive strong branching strategy."[^24^] Bottleneck: strong branching is too slow to run per node; learned surrogates need per-problem-class GNN training.

**Primitive design.** State = LP relaxation at node (candidate variable values, bounds, pseudocost history). `Choice` over candidate branching variables; `Score` = predicted subtree-size rubric per candidate; `Noul`: "is candidate v likely to yield bound improvement ≥ δ?" Ask all candidates' Nouls in one parallel call.

**Why latency/cost matters.** This is the most latency-critical usage in the catalog: B&B touches thousands–millions of nodes, and the decision is made *per node*. Sub-100ms (roadmap sub-10ms) is the difference between feasible and absurd. At $0.04/Mtoken, per-node judgments on large trees stay in the cents range — versus strong branching's order-of-magnitude node-level slowdown.

**Evidence.** [^23^][^24^][^25^] **Confidence: HIGH** (value of the decision — canonical ML4CO result); **MEDIUM** (Jev at per-node latency — depends on roadmap sub-10ms; today viable at root/cut-loop depth or as strong-branching candidate screener).

---

### Usage 8 — Numerical ODE/PDE method selection & stiffness verdict
**One-liner:** Jev's `Noul` answers "is this system stiff (now)?" and `Choice` picks the integrator (explicit RK vs. BDF vs. Rosenbrock vs. RK-Chebyshev) — a learned LSODA-style switch, and a chooser for DifferentialEquations.jl-style algorithm dispatch.

**Current practice & bottleneck.** Stiffness detection drives method switching in classic codes: "LSODA added the ability to automatically switch between Adams (for non-stiff equations) methods and BDF methods using a stiffness detection estimate."[^26^] Modern suites expose dozens of algorithms and the choice is expert knowledge: for "semi-stiff equations with cheap derivative calls, Runge-Kutta Chebyschev methods can be the most efficient by avoiding factorizations altogether," while very stiff systems favor Rosenbrock-W or FIRK.[^26^] Misclassifying stiffness is catastrophic: explicit RK on a stiff van der Pol (μ=1000) makes "the training... unstable... ultimately leading to a halt."[^27^] Bottleneck: classical stiffness estimators are crude and conservatively trigger expensive implicit solves.

**Primitive design.** State = RHS structure summary, Jacobian spectral proxies, step history, tolerance. `Noul`: "is the current regime stiff?" / "will the explicit method remain stable at step h?" `Choice` over integrator family; `Score`: efficiency rubric per method. Compose: hysteresis logic in code (switch only on high-confidence, sustained verdicts) to avoid chattering.

**Why latency/cost matters.** The verdict runs inside a timestepping loop or at regime boundaries — millions of potential call sites in long simulations; cheap Nouls permit polling every k steps. Julia-style `solve(prob)` with no algorithm hint is a mass-market entry point where a sub-cent advisory call replaces user expertise.

**Evidence.** [^26^][^27^][^28^] **Confidence: MEDIUM** — established classical practice (LSODA switching) + clear failure modes; no large ML-selection literature yet for general ODE dispatch (opportunity, not precedent).

---

### Usage 9 — Adaptive mesh refinement (AMR) marking advisory
**One-liner:** Jev scores element batches for refinement (`Noul`: "does this element cluster need refinement?") or picks the marking strategy (`Choice`: Dörfler vs. maximum vs. threshold) each AMR cycle.

**Current practice & bottleneck.** The SOLVE→ESTIMATE→MARK→REFINE loop computes error indicators η and "a marking strategy selects regions with large error... This process is then repeated until a desired convergence criterion is met."[^29^] Classical indicators (residual, jump, recovery, goal-oriented; Babuška–Rheinboldt, Ainsworth–Oden) are the standard; recent PINN-residual indicators give "a 3.20× DOF reduction" over uniform refinement on a Burgers test but are "problem-dependent,"[^30^] so indicator *selection* itself is a judgment call. Bottleneck: cheap indicators mis-mark on singularities/multiphysics; accurate estimators cost PDE solves.

**Primitive design.** State = per-element indicator summaries, solution gradient statistics, cycle history. `Noul` per spatial batch of elements ("does batch j contain the error hotspot?") to zoom cheaply, then classical indicators only inside flagged batches; `Choice` over marking strategy per cycle; `Score`: predicted error-reduction-per-DOF rubric.

**Why latency/cost matters.** MARK runs once per refinement cycle (tens–hundreds of cycles per simulation); batched Nouls over the same mesh state fit Jev's many-questions-per-call design. The advisory replaces auxiliary PDE solves for goal-oriented estimates — huge FLOP savings if the judgment is milliseconds and sub-cent.

**Evidence.** [^29^][^30^] **Confidence: MEDIUM** — AMR loop and marking strategies are textbook; ML/PINN indicators are active research; Jev's role (cheap triage + strategy choice) is an inference, not a published system.

---

### Usage 10 — Premise selection & hammer routing in interactive theorem proving
**One-liner:** Jev's `Noul` judges premise relevance ("is lemma ℓ useful for goal g?") at scale, and `Choice` routes goals to the right backend (ATP vs. SMT vs. builtin tactic).

**Current practice & bottleneck.** Hammers (Sledgehammer, CoqHammer, LeanHammer) "first select a moderate number of premises from the library... Then one translates the premises and the goal into the language of powerful external automated theorem provers."[^31^] Sledgehammer "usually selects about 1,000 lemmas out of tens of thousands of premises," using "heuristics (Meng and Paulson, 2009) and machine learning techniques (Kühlwein et al., 2013) like naive Bayes."[^32^] Neural premise selection is state of the art: Magnushammer lifts PISA proof rate from 38.3%→59.5%,[^33^] and the Isabelle ENIGMA's learned guidance "improves the best previous version of E by 25.3% in 15 seconds."[^34^] Bottleneck: premise relevance must be scored for ~10⁴ candidates per goal — neural rerankers (cross-encoder over each (state, premise) pair) are compute-hungry.

**Primitive design.** State = goal + local context. `Noul` per candidate premise in one batched call (mirror of Magnushammer's RERANK stage, which scores each pair for "probability of relevance"[^35^]); `Choice` over backends {Vampire, E, Z3, cvc5, metis/Aesop/Duper}; `Score`: predicted proof-success rubric per backend. Low-confidence routing triggers parallel portfolio dispatch.

**Why latency/cost matters.** Hammers fire interactively on every subgoal ("with one mouse click... jobs are run in the background"[^36^]); relevance scoring must cover thousands of premises in well under a second to feel instant. Batched Nouls in a single sub-100ms call are architecturally ideal, and $0.04/Mtoken makes per-subgoal neural reranking affordable where cross-encoder GPU inference is not.

**Evidence.** [^31^][^32^][^33^][^34^][^35^][^36^] **Confidence: HIGH** — premise selection is a 15-year ML success story; Jev's batch-Noul matches the two-stage retrieve-then-rerank architecture precisely.

---

## D. Math Education & Assessment

### Usage 11 — Algebraic answer-equivalence & partial-credit verdicts (beyond exact match)
**One-liner:** Jev's `Noul` judges "is the student's expression mathematically equivalent to the target?" and `Score` places the response on a partial-credit rubric — augmenting CAS-based systems like STACK where equivalence is borderline or feedback must be semantic.

**Current practice & bottleneck.** STACK "relies on computer algebra to interpret mathematical expressions, recognise equivalent forms, and define validation rules for full- and partial-credit responses... it requires careful authoring, testing of validation logic, feedback design, and technical support."[^37^] Authoring burden is the bottleneck: "the scoring logic does not require the teacher to enumerate every acceptable textual form," but answer tests must still be hand-built per question.[^37^] And "math equations are particularly challenging to evaluate and give feedback on because equivalent mathematical expressions can have different string representations... the notation itself can be ambiguous" (e.g. "y(x+5)" as function application vs. multiplication).[^38^]

**Primitive design.** State = question spec + target answer + student expression (+CAS answer-test result when available). `Noul`: "are these expressions equivalent?" / "is the response dimensionally/type correct?"; `Score`: rubric position {correct, correct-but-unusual-form, partially correct, wrong-sign error, off-by-constant, wrong}; compose with deterministic CAS checks — Jev arbitrates only when the CAS verdict is ambiguous or unauthored.

**Why latency/cost matters.** Verdicts are per-student-per-attempt at institutional scale (millions of attempts/semester); per-student economics demand sub-cent judgments, and interactive submissions need ~100ms feedback. Jev layers on top of CAS checks only for the hard residue, keeping cost negligible.

**Evidence.** [^37^][^38^] **Confidence: MEDIUM-HIGH** — deployed practice (STACK) proves the verdict surface; Jev's marginal role is ambiguity-resolution and unauthored-question coverage (inference, not precedent).

---

### Usage 12 — Step-level grading & misconception classification (process verdicts)
**One-liner:** Jev's `Noul` grades each step of a worked solution ("is this step correct given the previous steps?") and `Choice` classifies the error/misconception type — a lightweight process reward model for tutoring and grading.

**Current practice & bottleneck.** "Let's Verify Step by Step" showed process reward models "trained to score each intermediate step... significantly outperform outcome reward models... reaching 78% on a representative MATH subset," releasing "PRM800K... 800,000 step-level human feedback labels."[^39^][^40^] Human step labeling is the bottleneck; Math-Shepherd auto-labels via Monte-Carlo rollouts (a step is good if completions from it often succeed),[^40^] OmegaPRM cuts cost via divide-and-conquer MCTS with "over 1.5M process annotations without human effort."[^40^] Current PRMs are 7B-scale generative models — too heavy for per-step, per-student deployment in tutoring products; benchmarks also find "current PRMs show weak transfer and miss fine-grained implicit process errors."[^41^]

**Primitive design.** State = problem + steps 1..k. `Noul`: "is step k correct?" (product/min aggregation = solution score, per the PRM800K convention[^42^]); `Choice` over a misconception taxonomy {sign error, wrong operation, illegal cancellation, dropped assumption, arithmetic slip, none}; `Score`: step quality rubric. All steps' verdicts in one parallel call.

**Why latency/cost matters.** A tutoring session emits a step verdict per keystroke-batch; a classroom of 30 students × 20 steps × live feedback is thousands of calls/hour. At $0.04/Mtoken with batched questions, per-step grading is fractions of a cent per student-hour — the enabling economics vs. running a 7B PRM per step.

**Evidence.** [^39^][^40^][^41^][^42^] **Confidence: HIGH** — PRM paradigm is established with public datasets/benchmarks; Jev = same judgment type at ~1000× lower serving cost (accuracy to be validated against PRM800K).

---

### Usage 13 — Next-step hint selection in intelligent tutoring systems
**One-liner:** Jev's `Choice` selects which hint/intervention to show (and `Noul` decides *whether* to hint now) given the student's current solution state — a learned Hint-Factory policy.

**Current practice & bottleneck.** The Hint Factory mines historical student solution graphs, converts them to an MDP, and picks the highest-value next state to hint toward; it "could provide correct next-step hints towards the problem solution over 80% of the time."[^43^] ITSs "rely heavily on expert design and hand-crafted rules to generate system interventions, which makes them difficult to build and transfer across domains"; the Korbit ITS picks interventions "by an ensemble of machine learning models based on the student's learning profile and last solution attempt."[^44^] Bottleneck: MDP value iteration needs dense historical data per problem; hand-authored hint sequences don't scale.

**Primitive design.** State = problem + student state + hint history + available hint ladder. `Noul`: "is the student stuck/off-path?" (hint timing); `Choice` over candidate hints/intervention types {generic prompt, waypoint, next-step, misconception-targeted, worked example}; `Score`: predicted helpfulness rubric per hint. Compose: only reveal, never generate — Jev selects from authored/mined hint content (safe for a non-generative model).

**Why latency/cost matters.** Hint decisions are interactive (student waiting) and high-volume (every inner-loop step of every student). Cheap, fast selection from a hint inventory is precisely the system-1 role; generative hint *writing* stays offline.

**Evidence.** [^43^][^44^][^45^] **Confidence: MEDIUM-HIGH** — Hint Factory/MDP precedent strong; Jev-as-policy is a direct substitution but unvalidated on learning outcomes.

---

## E. Math Perception, Retrieval & Math-Adjacent Advisory

### Usage 14 — Handwritten/OCR math-expression triage
**One-liner:** Jev triages HMER output — `Noul`: "is this recognized expression trustworthy?" — and arbitrates symbol/relation ambiguities via `Choice`, routing low-confidence reads to a stronger model or human.

**Current practice & bottleneck.** HMER is "foundational for educational technologies, enabling applications like digital note-taking and automated grading," but state-of-the-art expression accuracy on CROHME-2023 is ~61–74%, and encoder-decoder systems "lack explicit symbol-to-trace alignment – a critical limitation for error analysis."[^46^] Structural systems decouple "segmentation (99.75% accuracy), classification (99.30%), and relation prediction (98.37%)" yet still err on "visually similar sub-expressions."[^46^] Bottleneck: no good per-expression confidence signal to decide accept vs. escalate.

**Primitive design.** State = candidate LaTeX + per-symbol confidences + structural graph summary + (optional) downstream parse/CAS check result. `Noul`: "is the transcription usable for grading/search?"; `Choice` over top-k candidate parses or ambiguous-symbol classes {× vs. x, 2 vs. z, ∫ vs. Σ}; compose: accept / rerank / escalate policy on the confidence output.

**Why latency/cost matters.** Triage sits per-expression in live note-taking and batch grading pipelines (thousands of pages); a sub-100ms, sub-cent gate avoids running heavy second-pass models on the easy 90%.

**Evidence.** [^46^][^47^] **Confidence: MEDIUM** — error structure well documented; the confidence-triage role is standard engineering practice but not a named published system.

---

### Usage 15 — Formula-retrieval reranking (math search)
**One-liner:** Jev's `Score` reranks candidate formulas from a first-stage retriever (Approach0/Tangent-style), judging structural+semantic relevance to the query.

**Current practice & bottleneck.** Math search engines use two-stage pipelines: leaf-root-path or tuple-based retrieval (Approach0, Tangent-S/CFTED), then alignment-based rescoring (Maximum Sub-tree Similarity) or learning-to-rank fusion.[^48^][^49^] Ensembles help: "Ensembling and learning-to-rank approaches... TanApp, FORTE-App, and MathApp... provide better effectiveness compared to each of the individual models."[^48^] Bottleneck: structural alignment scoring (subtree matching, tree edit distance) is expensive per candidate, and hand-weighted linear combinations generalize poorly.

**Primitive design.** State = query formula (OPT digest) + text context. For each of top-k candidates: `Noul` "does candidate c satisfy the query intent?" batched in one call; `Score`: relevance rubric per candidate; `Choice`: best answer for direct-hit display. Compose with BM25/path scores as a learned reranker layer.

**Why latency/cost matters.** Reranking is per-query, online, over ~100–1000 candidates; interactive math search budgets <1s total. Batched Nouls/Scores in a single call fit the latency envelope where per-candidate TED alignment strains it.

**Evidence.** [^48^][^49^] **Confidence: MEDIUM** — two-stage retrieve+rerank is established MIR architecture; Jev as the reranker is a plausible substitution with no published head-to-head.

---

## F. Condensed Additional Candidates (secondary, math-adjacent)

**F1 — Unit/dimensional-consistency verdicts (`Noul`).** Practice: deterministic checkers (MATLAB `checkUnits`, Pint, Boost.Units, UFL-based frameworks) and famous failures — "NASA's Mars Climate Orbiter... was lost... due to a units mismatch."[^50^] Jev's niche: *informal* contexts — equations in PDFs, notebooks, student answers — where units are implicit and symbolic checkers can't run: "does this equation look dimensionally consistent given the quantities described?" Bottleneck: no tools for free-text/natural-language dimensional sanity checks. Evidence: [^50^][^51^]. **Confidence: MEDIUM.**

**F2 — Problem-difficulty scoring (`Score`).** Practice: ML difficulty estimators "simulat[e] the human calculation process and count[] the number of applying formulas during the optimal path," achieving MAE ≈0.57 on a 1–5 scale for differential calculus problems.[^52^] Jev: `Score` places a textbook/exam item on a difficulty rubric for question-bank tagging and adaptive sequencing; per-item sub-cent cost vs. teacher labeling ("reduce the teacher workload in the question bank construction"[^52^]). Evidence: [^52^]. **Confidence: MEDIUM-HIGH.**

**F3 — Statistical-test selection & assumption verdicts (`Noul`/`Choice`).** Practice: parametric tests require assumption checks — normality (Shapiro–Wilk, K-S), homogeneity of variance (Levene) — and "violation of these assumptions changes the conclusion of the research"; guidance is rule-of-thumb ("samples >30 or 40... we can ignore the distribution").[^53^][^54^] Deterministic pipelines (e.g., AutoStat) automate diagnostics but not judgment.[^55^] Jev: `Noul` "are these residuals plausibly normal enough for a t-test given n, skew, outliers?"; `Choice` among {t-test, Welch, Mann–Whitney, bootstrap}. In-loop inside notebooks/AutoML stats pipelines; per-dataset sub-cent advisory. Evidence: [^53^][^54^][^55^]. **Confidence: MEDIUM** (adjacent to core math; strong practice grounding, thin ML literature).

---

## Cross-cutting observations

1. **The correctness-invariance principle.** The strongest grounding across all usages: "choices which have no effect on the mathematical correctness of the software, but do impact its performance" are "good candidates for ML application."[^4^] Jev's entire value proposition is concentrated at these choice points — selection, routing, verdicts — never producing mathematical content itself. This matches its non-generative design and bounds the blast radius of errors (a bad Choice costs runtime; a Noul verdict is always checkable downstream).
2. **Batch-Noul is the killer primitive.** Binary-relevance integration selection,[^10^] strategy probes,[^12^] premise relevance reranking,[^35^] per-step grading,[^42^] and per-element AMR marking are all *families of binary verdicts over one shared state* — exactly Jev's many-questions-per-call shape.
3. **Confidence outputs enable safe composition.** Portfolio fallback (Usage 5), hint timing (13), OCR escalation (14), and hysteresis in stiffness switching (8) all key off Jev's calibrated probability+confidence rather than bare labels.
4. **Where the literature is thin** (numerical method selection, AMR marking, unit checks in free text), Jev's pitch is "cheap judgment where none was affordable," not replacing a learned baseline — flagged as MEDIUM confidence accordingly.

---

## References

[^1^]: Huang, England, Wilson, Davenport, Paulson, Bridge — "Applying machine learning to the problem of choosing a heuristic to select the variable ordering for cylindrical algebraic decomposition," CICM 2014. https://arxiv.org/abs/1404.6369
[^2^]: Huang, England, Wilson, Bridge, Davenport, Paulson — "Using Machine Learning to Improve Cylindrical Algebraic Decomposition," Math. Comput. Sci. 13, 461–488 (2019). https://arxiv.org/pdf/1804.10520
[^3^]: England, Florescu — "Comparing machine learning models to choose the variable ordering for cylindrical algebraic decomposition," CICM 2019. https://arxiv.org/abs/1904.11061
[^4^]: Florescu, England — "A machine learning based software pipeline to pick the variable ordering for algorithms with polynomial inputs," 2020. https://arxiv.org/pdf/2005.11251
[^5^]: Jia, Dong, Liu, Huang, Ma, Zhang — "Suggesting Variable Order for Cylindrical Algebraic Decomposition via Reinforcement Learning," NeurIPS 2023. https://papers.nips.cc/paper_files/paper/2023/hash/efcb5b06ce8bb672ffa26b9dc5cdd0f9-Abstract-Conference.html
[^6^]: Pickering, del Río Almajano, England, Cohen — "Explainable AI Insights for Symbolic Computation: A case study on selecting the variable ordering for CAD," J. Symbolic Computation 123, 102276 (2024). https://www.sciencedirect.com/science/article/pii/S0747717123000901
[^7^]: "Learning Fast Monomial Orders for Gröbner Basis Computations," arXiv 2026. https://arxiv.org/html/2602.02972v1
[^8^]: Kera, Ishihara, Kambe, Vaccon, Yokoyama — "Learning to compute Gröbner bases," NeurIPS 2024 (Adv. NeurIPS 37, 33141–33187); bibliographic record via https://arxiv.org/pdf/2601.13731
[^9^]: Barket, England, Gerhard — "Symbolic Integration Algorithm Selection with Machine Learning: LSTMs vs Tree LSTMs," CICM 2024. https://arxiv.org/pdf/2404.14973
[^10^]: Review/summary with quantitative results (84.6% TreeLSTM vs 60.5% Maple meta-algorithm vs 56.8% LSTM). https://www.themoonlight.io/en/review/symbolic-integration-algorithm-selection-with-machine-learning-lstms-vs-tree-lstms
[^11^]: Lyu et al. — "Layered and Staged Monte Carlo Tree Search for SMT Strategy Synthesis" (Z3alpha), IJCAI 2024 extended version. https://arxiv.org/html/2401.17159v2
[^12^]: Z3 strategy language description (probes, if/or-else/try-for combinators): "Novel tree-search method for synthesizing SMT strategies," Acta Informatica (2025). https://link.springer.com/article/10.1007/s00236-025-00495-x
[^13^]: De Moura, Bjørner — Z3 system description (as cited within [^11^]); strategy language: De Moura & Passmore 2013.
[^14^]: "Algorithm Selection with Zero Domain Knowledge via Text Embeddings" (ZeroFolio) — intro surveys Rice 1976, SATzilla 2008, AutoFolio 2015, ASlib 2016. https://arxiv.org/html/2604.19753v2
[^15^]: SATzilla2012 results note, UBC/Freiburg ML lab publications. https://ml.informatik.uni-freiburg.de/publications/
[^16^]: Xu, Hutter, Hoos, Leyton-Brown — SATzilla lineage; AutoFolio: Lindauer et al. 2015, https://pdfs.semanticscholar.org/4fd7/08e3b98ba1b8c21595deed961774cd3733d3.pdf
[^17^]: "Configuring Mixed-Integer Programming Solvers for Large-Scale Instances" (related work: ParamILS on CPLEX/Gurobi/LpSolve, AClib, Hydra, ISAC, DASH). https://link.springer.com/article/10.1007/s43069-024-00327-7
[^18^]: Hutter, Hoos, Leyton-Brown — "Sequential Model-Based Optimization for General Algorithm Configuration" (SMAC), LION 2011. https://dl.acm.org/doi/10.1007/978-3-642-25566-3_40
[^19^]: SMAC3 documentation (algorithm description, citations). https://automl.github.io/SMAC3/v1.4.0/
[^20^]: Xu, Hutter, Hoos, Leyton-Brown — "Hydra-MIP: Automated Algorithm Configuration and Selection for Mixed Integer Programming," IJCAI-RCRA 2011 (listing). https://ml.informatik.uni-freiburg.de/profile/hutter/
[^21^]: "Configuring MIP solvers with natural language" (Hydra-MIP training cost: 250,000 CPU days, 500 instances). https://arxiv.org/html/2412.12038v2
[^22^]: SMAC description in French AutoML survey (10,000 random candidates sorted by acquisition per iteration). https://inria.hal.science/hal-04921796v1/document
[^23^]: "An Improved Reinforcement Learning Algorithm for Learning to Branch" (background on SB/PC/RB branching rules). https://arxiv.org/pdf/2201.06213v1
[^24^]: "Learning a Generic Value-Selection Heuristic Inside a Constraint Programming Solver" (related work: imitation learning of strong branching). https://arxiv.org/html/2301.01913v3
[^25^]: Zarpellon — "Machine learning algorithms in Mixed-Integer Programming" (survey table of learned branching settings). https://publications.polymtl.ca/5332/1/2020_Zarpellon%2C_Giulia.pdf
[^26^]: Rackauckas — "Differences Between Methods for Solving Stiff ODEs" (LSODA stiffness switching; method-selection guidance). https://www.stochasticlifestyle.com/differences-between-methods-for-solving-stiff-odes/
[^27^]: "Neural ODEs for Stiff Systems: Implicit Single-Step Methods" (explicit RK fails on stiff van der Pol μ=1000). https://arxiv.org/html/2410.05592v1
[^28^]: "A deep learning-based ODE solver for chemical kinetics" (stiffness/dimensionality difficulty). https://arxiv.org/abs/2012.12654
[^29^]: "Marking strategies for adaptive mesh refinement" (AMR loop; marking strategies). https://arxiv.org/html/2605.05234v1
[^30^]: "Physics-Informed Residuals for Adaptive Mesh Refinement in Finite-Difference PDE Solvers" (PINN indicator; 3.20× DOF reduction; classical indicator baselines). https://arxiv.org/html/2606.02475v2
[^31^]: "Premise Selection for a Lean Hammer" (hammer pipeline: premise selection → translation → reconstruction). https://arxiv.org/html/2506.07477v2
[^32^]: "The Fusion of Large Language Models and Formal Methods for Trustworthy AI Agents: A Roadmap" (Sledgehammer selects ~1,000 of tens of thousands; naive Bayes; Magnushammer +13%). https://arxiv.org/html/2412.06512v1
[^33^]: Mikuła et al. — "Magnushammer: A Transformer-Based Approach to Premise Selection" (59.5% vs 38.3% PISA). https://www.alphaxiv.org/@lukasz-kucinski
[^34^]: Goerzel, Jakubův, Kaliszyk, Olšák, Piepenbrock, Urban — "The Isabelle ENIGMA," ITP 2022. https://arxiv.org/html/2205.01981v1
[^35^]: Magnushammer two-stage SELECT/RERANK description (pairwise relevance probability). https://chatpaper.com/paper/6623
[^36^]: Avigad — "A Sledgehammer for Dependent Type Theory" (slides; interactive usage pattern). https://www.andrew.cmu.edu/user/avigad/Talks/sledgehammer.pdf
[^37^]: "A Psychometric and Practical Comparison of Standard Moodle-Based and STACK-Based Step-by-Step Tests in University Calculus" (STACK symbolic validation, authoring burden). https://arxiv.org/html/2607.11382v1
[^38^]: Kochmar et al. — "Automated Data-Driven Generation of Personalized Pedagogical Interventions in Intelligent Tutoring Systems," IJAIED (2021) (ambiguous math notation y(x+5); ML ensemble picks interventions). https://link.springer.com/article/10.1007/s40593-021-00267-x
[^39^]: Lightman et al. — "Let's Verify Step by Step" (PRM800K; PRM beats ORM; 78%). https://arxiv.org/pdf/2305.20050
[^40^]: "Artificial Intelligence for Mathematical Reasoning: An Integrated Survey" (PRMs; Math-Shepherd; OmegaPRM 1.5M annotations). https://arxiv.org/html/2606.08728v4
[^41^]: "Process Reward Models vs Outcome Reward Models for Reasoning" (PRM benchmark/transfer caveats). https://www.opentrain.ai/blog/process-reward-models-vs-outcome-reward-models/
[^42^]: "Let's Verify Step by Step" pipeline summary (solution score = product of per-step probabilities). https://papers.lunadong.com/paper/4718
[^43^]: Koedinger et al. — "New Potentials for Data-Driven Intelligent Tutoring System Hints and Scaffolding" (Hint Factory; MDP; >80% correct next-step hints; cited 337). https://learninganalytics.upenn.edu/ryanbaker/New%20potentials%20for%20ITS-source.pdf
[^44^]: Tithi — "Data-Driven Hints in Intelligent Tutoring Systems" (chapter; Hint Factory, Interaction Networks, hint timing). https://arxiv.org/abs/2603.07311
[^45^]: "Automated Data-Driven Hint Generation in Intelligent Tutoring Systems for Code-Writing" (survey; ITS inner/outer loop). https://online-journals.org/index.php/i-jet/article/download/8023/5158/0
[^46^]: "The Return of Structural Handwritten Mathematical Expression Recognition" (CROHME-2023 74.14%; decoupled subtask accuracies). https://arxiv.org/html/2508.19773v1
[^47^]: CROHME competition background and ExpRate benchmarks. https://www.researchgate.net/publication/339019612
[^48^]: "Mathematical Information Retrieval" survey, Ch. 4 Formula Search (Approach0, Tangent family, learning-to-rank ensembles). https://arxiv.org/html/2408.11646v1
[^49^]: "Learning to Rank for Mathematical Formula Retrieval," SIGIR 2021. https://terpconnect.umd.edu/~oard/pdf/sigir21.pdf
[^50^]: "Physical units in UFL/FEM framework" (Mars Climate Orbiter units failure; dimensional consistency verification; Buckingham Pi). https://arxiv.org/pdf/2601.06535
[^51^]: MathWorks — "Dimensional Analysis" (checkUnits 'Compatible' workflow). https://www.mathworks.com/discovery/dimensional-analysis.html
[^52^]: "Difficulty level estimation of mathematics problems using machine learning," ICIVSP 2022 (MAE ≈0.57 of 1–5 scale). https://dl.acm.org/doi/10.1145/3531232.3531266
[^53^]: Ghasemi, Zahediasl — "Normality Tests for Statistical Analysis: A Guide for Non-Statisticians," PMC. https://pmc.ncbi.nlm.nih.gov/articles/PMC3693611/
[^54^]: Statistics Solutions — "Testing of Assumptions" (normality, Levene, Box's M). https://www.statisticssolutions.com/free-resources/directory-of-statistical-analyses/testing-of-assumptions/
[^55^]: Ardelion Intelligence — AutoStat product description (deterministic assumption-diagnostics pipeline). https://www.ardelionintelligence.com/
