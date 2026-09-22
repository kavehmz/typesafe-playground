# Jev ("System One" typed-judgment model) — Usage Catalog
## Dimension 08: Mathematics — Theorem Proving, Proof Assistants, Formal Verification

**Model profile assumed throughout:** non-generative; input = JSON state + typed questions; output = Choice (probabilities + confidence), Noul (truth probability), Score (ordered rubric position); many questions per call in parallel over the same state; sub-100ms latency (roadmap sub-10ms); ~$0.04/Mtoken; 32K context. Role: heuristic-guidance and verification layer *inside* theorem-proving loops, not a proof generator.

Research method: 22 independent web searches (coarse-to-fine), prioritizing primary sources (arXiv, conference proceedings, theses). Verbatim excerpts quoted. Confidence rating per usage.

---

### Usage 1 — Premise selection / premise reranking for hammers and large-theory ATP
**One-liner:** Given a conjecture/proof state and a candidate premise, Jev answers Noul("would this premise be used in a proof of this goal?") or Score over a candidate batch — a fast, cheap neural relevance filter/reranker.

**Current practice & bottleneck.** Premise selection is the established first stage of every hammer. Sledgehammer "selects about 1,000 lemmas out of tens of thousands of premises" using "heuristics (Meng and Paulson, 2009) and machine learning techniques (Kühlwein et al., 2013) like naive Bayes" [^5^]. Learning-based selectors are decades deep: MaLARea interleaved proving with naive-Bayes learning over the Mizar library [^1^]; DeepMath applied deep sequence models to the same task (NeurIPS 2016) [^2^]; Magnushammer runs a two-stage pipeline — "we first retrieve the most relevant premises according to the cosine similarity ... We then re-rank these with a model that encodes each proof state and premise pair, outputting a relevance score (RERANK)" [^3^] — the RERANK stage is literally a cross-encoder judgment model. "Sledgehammer's performance hinges on the relevance filtering scheme, a suite of methods based on handcrafted heuristics ... or classical machine learning ... Such approaches are unlikely to efficiently utilize the constantly growing body of proof data" [^3^]. The Isabelle ENIGMA work uses a GNN for premise selection because it was "the strongest method" in the Mizar evaluation, improving E by 25.3% [^4^].

**Primitive design.** State = {conjecture text, local context, available premise}. Per premise: Noul("premise is used in some proof of the conjecture") — exactly ENIGMA's positive/negative supervision scheme ("clauses that appear in the final proof [are labeled] positive ... the remaining ... negative" [^7^]); Score(rubric: used-directly / used-indirectly / irrelevant) to rank batches; Choice over cutoff sizes. Batched over the same state in one call.

**Why latency/cost matters.** Every hammer call scores hundreds–thousands of premises ("For all problems we pre-selected 512 relevant premises using the heuristic MePo filter" [^4^]); inside tactic-level proof search this repeats at every node, so 10⁴–10⁶ judgments per theorem attempt. Sub-100ms calls with many parallel questions map directly onto the Magnushammer RERANK stage, which currently requires a full transformer forward pass per (state, premise) pair.

**Evidence.** [^1^][^2^][^3^][^4^][^5^][^6^] — Confidence: **Very high** (the exact judgment task is already the state of the art).

---

### Usage 2 — Given-clause selection (internal guidance of saturation ATPs)
**One-liner:** Inside E/Vampire's given-clause loop, Jev judges each generated clause: Noul("does this clause belong to the final proof?") → clause weight — a semantic, context-aware ENIGMA.

**Current practice & bottleneck.** "Clause selection is a crucial part of saturation-style automated theorem provers (ATPs) such as E, Vampire, and Prover9" [^7^]. ENIGMA trains classifiers from E's proof-search logs: "Each processed clause which is present in the final proof is classified as positive ... clauses not present in the final proof was redundant, hence they are classified as negative" [^8^]. "The strongest setting currently uses manually engineered clause features and fast non-neural state-of-the-art gradient boosted trees libraries such as XGBoost ... the model M yields the probability that C represents a positive clause" [^8^]. GNN-ENIGMA instead judges clauses "in larger batches and with respect to a large number of already selected clauses (context)" [^7^] — a structural match to Jev's many-questions-over-one-shared-state API.

**Primitive design.** State = {conjecture + processed-clause context (truncated)}. Questions: Score/Noul per candidate generated clause (batched); optional Choice("which of the k highest-scoring clauses next?"). Output probabilities → E weight function (ENIGMA precedent: weight 1.0 if p≥0.5 else 10.0 [^8^]).

**Why latency/cost matters.** "The method needs to be efficient because it is internally applied to every generated clause" [^8^] — the given-clause loop generates 10³–10⁶ clauses per problem; judgment throughput is the binding constraint. This is the single most latency-critical usage in the catalog: sub-10ms roadmap latency is what makes neural-quality guidance affordable per clause; the ENIGMA literature is essentially a history of *making the judgment model cheaper* (linear models → XGBoost → batched GNN).

**Evidence.** [^7^][^8^][^4^] — Confidence: **Very high** (ENIGMA's efficiency requirement is stated verbatim; Jev is a drop-in weight function).

---

### Usage 3 — Tactic selection / tactic-class guidance in Lean, Coq, HOL4, Isabelle
**One-liner:** Given a goal state, Jev scores which tactic (or tactic class) is promising — Choice over tactic families, Score over generated candidates — complementing generative tactic models.

**Current practice & bottleneck.** TacticToe "learns from human proofs which mathematical technique is suitable in each proof situation" and proves 66.4% of 7,164 HOL4 theorems in 60s vs E prover's 34.5% [^9^]. Tactician for Coq: "our predictor can identify the correct tactic to be applied to a proof state 23.4% of the time. Our proof searcher can fully automatically prove 39.3% of the lemmas" [^10^]. ReProver "retrieves a handful of potentially useful premises and generates a tactic ... When proving theorems, the model generates multiple tactic candidates at each step, which are used in a standard best-first search" [^11^]. Bottleneck: generative policy models give token-level likelihoods, not calibrated state–action utility; top-1 accuracy is low (23.4%), so search breadth explodes.

**Primitive design.** State = {pretty-printed goal, local hypotheses, proof history}. Questions: Score per candidate tactic ("will this tactic make real progress / close a subgoal / loop?"); Choice over tactic classes ({simp-family, rewrite, induction, apply-lemma, hammer-call}); Noul("does this state merit a Sledgehammer/hammer call?"). Judgments prune/rerank the generator's beam before execution.

**Why latency/cost matters.** Best-first/MCTS proof search visits 10²–10⁵ states per theorem and expands dozens of candidates per state; a judgment layer that is 100× cheaper than an extra generator pass lets one afford "judge every candidate at every node" instead of trusting raw LM logprobs.

**Evidence.** [^9^][^10^][^11^][^12^] — Confidence: **High** (direct analogy to established learned tactic ranking; Jev complements rather than replaces generators).

---

### Usage 4 — ATP strategy & schedule selection per problem
**One-liner:** Given problem features, Jev answers Choice("which strategy/schedule to run?") and Score("expected success of strategy s on this problem") — learned portfolio selection, the MaLeS/BliStr paradigm.

**Current practice & bottleneck.** "Many current ATPs use strategy scheduling to define their default configuration. Some use a single schedule for every problem ... Others define classes of similar problems and use different schedules" [^13^]. MaLeS "defines a runtime prediction function ... uses the features of a problem to predict the time the ATP running strategy s needs to solve the problem. The strategy schedule for the problem is created from these predictions" [^13^]. BliStrTune invents strategies hierarchically; "E 1.9 with the best protocol scheduler constructed from BliStrTune protocols ... outperforms state-of-the-art ATP Vampire 4.0 on independent testing problems by more than 5%" [^14^]. The Isabelle ENIGMA also develops "targeted strategies for E" [^4^]. Bottleneck: feature engineering and offline tuning per problem class; runtime prediction is a hard regression where an ordinal/categorical judgment suffices.

**Primitive design.** State = {problem text/formula stats}. Questions: Choice over a library of strategies or schedules; Score per strategy (rubric: solves-fast / solves-slow / fails); Noul("will strategy s solve within t seconds?") asked for many s in parallel — yielding a predicted-solve vector to compose a custom schedule.

**Why latency/cost matters.** Judgment happens once per problem (or per restart), but it sits in front of multi-second-to-minutes ATP runs; a 100ms, $0.0001-level pre-judgment that reallocates seconds of prover time has enormous ROI, and Noul-batching over 50 strategies in one call replaces 50 regression models.

**Evidence.** [^13^][^14^][^4^] — Confidence: **High** (established "learning to select a good heuristic" literature, e.g., Bridge/Holden/Paulson, MaLeS, BliStrTune).

---

### Usage 5 — Proof-state value estimation ("critic") for proof search
**One-liner:** Noul("is this goal provable from here?") as a search critic for MCTS/best-first proving — the HTPS critic and GPT-f value function, at 1/100th the serving cost.

**Current practice & bottleneck.** HTPS trains a critic where decoding is restricted "to the two tokens PROVABLE and UNPROVABLE, and evaluate the critic with cθ(g)=P(PROVABLE|g, CRITIC)" [^15^]; the critic is essential: "using hard critic targets gives worse performances than having no critic model at all" [^15^]. DT-Solver uses "dynamic tree sampling guided by proof-level value function" [^16^]. GPT-f iteratively trained a value function on verifier-annotated search data [^17^]. Bottleneck: critics are full encoder-decoder transformers co-trained with the policy; evaluating every node expansion with them dominates inference budget, so systems under-sample search.

**Primitive design.** State = {goal, partial proof sketch, depth, available tactics}. Questions: Noul("provable within remaining budget?"); Score(rubric: closed / one-step-away / promising / dead-end) — maps to HTPS's solved/invalid/internal targets [^15^]; Choice over which frontier node to expand next (batch of frontier states in one call).

**Why latency/cost matters.** The critic is queried at every internal node of an expanding hypertree — thousands of calls per proof attempt. A dedicated cheap judge turns "critic-guided search" from a GPU-serving problem into an API call, enabling deeper search per dollar; expert-iteration loops (HTPS, InternLM StepProver) then regenerate training data for the next critic.

**Evidence.** [^15^][^16^][^17^] — Confidence: **High** (the Noul question is verbatim the HTPS critic head).

---

### Usage 6 — Filtering machine-generated lemmas & conjectures (plausibility + usefulness)
**One-liner:** Generative systems (QuickSpec/Hipster, neural conjecturers, LLM lemma proposers) flood downstream provers; Jev answers Noul("is this conjecture true/plausible?") and Noul("is it useful for the stuck goal?") before paying for proof attempts.

**Current practice & bottleneck.** HipSpec's two-stage pipeline "Generate a set of conjectures about the functions at hand ... Attempt to prove each of the conjectures" [^18^]; Hipster notes bottom-up generation "succeeds in finding lemmas that the top-down critics based approach fails to find, at the cost of possibly also finding a few extra lemmas" [^18^] and that "conjectures with trivial proofs are ... quickly filtered out" [^18^] — filtering is the acknowledged pain point. Neural conjecturing over Mizar generates plausible statements at scale [^19^][^20^]. Bottleneck: each false/useless conjecture costs an ATP call or a proof-assistant tactic run; model finding to reject false ones (Nitpick/QuickSpec testing) doesn't scale to rich theories ("counter-example checking ... is often too slow for use in an interactive setting" [^18^]).

**Primitive design.** State = {background theory summary, stuck goal (if any), candidate conjecture}. Questions: Noul("statement is true"), Noul("statement is non-trivial / not an instance of an existing lemma"), Score("usefulness for discharging the stuck goal": enables-induction / bridges-gap / irrelevant). Compose: attempt proofs only for candidates passing all three gates.

**Why latency/cost matters.** Conjecture generators emit thousands of candidates per theory-exploration run; gating each with a sub-100ms judgment before invoking induction provers (seconds–minutes each) reorders the whole economics of theory exploration.

**Evidence.** [^18^][^19^][^20^] — Confidence: **High** (filtering stage exists in every conjecturing pipeline; currently testing/ATP-based, not learned-fast).

---

### Usage 7 — Conjecture/concept "interestingness" scoring for automated theory formation
**One-liner:** Score("how interesting is this entity?") as the search heuristic of theory-formation systems — a learned, cheap stand-in for HR's hand-designed interestingness measures.

**Current practice & bottleneck.** Colton's HR "employs a best first search by building new concepts from the most interesting old ones. To enable this, HR has various measures which estimate the interestingness of a concept"; it invokes Otter to prove conjectures and MACE to find counterexamples, and "information ... arising from the attempt to settle a conjecture is used to assess the concepts involved ... which fuels the heuristic search" [^21^]. Recent work makes interestingness itself a learned function: "we define the interestingness measure to be a function ℐ:ℳ×𝒮→ℝ, where ℐ(m,S) provides an estimate of the value of a mathematical entity m in the context of the current theory S" and uses it as an RL intrinsic reward [^22^]. Bottleneck: hand-crafted measures (invariance, parsimony, novelty) are brittle; learning requires a scorer callable at every search step.

**Primitive design.** State = {current theory inventory, entity/conjecture, provenance}. Questions: Score on a rubric (surprising / general / connects-domains / trivial-but-useful / uninteresting); Choice over which entity to expand next; Noul("would settling this conjecture change the theory's structure?").

**Why latency/cost matters.** Best-first theory formation scores every frontier entity at every iteration (10³–10⁵ judgments per run); a cheap typed Score primitive is exactly the "interestingness function" these systems call.

**Evidence.** [^21^][^22^] — Confidence: **Medium-high** (established paradigm, smaller community; primitive fit is exact).

---

### Usage 8 — Counterexample-seeking triage (which conjectures to attack, which way)
**One-liner:** Noul("is this statement likely false?") to route conjectures to model-finders (Nitpick/MACE/quickcheck) instead of provers, and Choice("which conjecture is cheapest to refute?") — saving wasted prover time on false goals.

**Current practice & bottleneck.** Standard practice mutates theorems to create non-theorems and runs counterexample generators: on "400 mutated theorems of 13 theories ... running the counterexample generators ... with a liberal time limit of 30 seconds," Nitpick and testing each found only a fraction of genuine counterexamples [^23^]. HR "will invoke the MACE model generator to attempt to disprove the conjecture by finding a counterexample" when proving fails [^21^]. Nitpick has exposed real bugs, e.g., a planted flaw in an information-flow soundness proof: "because we planted a bug in the definition ..., Nitpick finds a counterexample" [^24^]. Bottleneck: provers and model-finders are both expensive and both incomplete on hard statements; blindly running both on everything doubles cost.

**Primitive design.** State = {statement, theory context, prior failure info}. Questions: Noul("statement is true as written") — low probability routes to counterexample search first; Choice over refutation tools (Nitpick / quickcheck / narrowing / SMT-model); Score("refutability difficulty") to order the attack queue.

**Why latency/cost matters.** Interactive users hit this on every failed proof step (Isabelle runs nitpick/quickcheck automatically on `sorry`-free failures); batch triage over mutated-theorem suites or LLM-conjectured batches (Usages 6–7) turns 30s-per-candidate model finding into 0.1s routing + targeted search.

**Evidence.** [^23^][^24^][^21^] — Confidence: **High** (dual prove/disprove routing is established practice; learned triage is the natural upgrade).

---

### Usage 9 — Step-level proof verification / process-reward judging
**One-liner:** Noul("does this step follow from the context?") per proof step — a cheap step verifier (process reward model) for reranking and guiding generated proofs, formal or informal.

**Current practice & bottleneck.** Process reward models beat outcome-only scoring: Math-Shepherd "assigns a reward score to each step of math problem solutions" with labels built automatically — "breaking the bottleneck of heavy reliance on manual annotation"; used for "(1) Verification: Math-shepherd is utilized for reranking multiple outputs generated by Large Language Models (LLMs)" it lifted Mistral-7B from 28.6%→33.0% on MATH, and to 43.5% with verification [^25^]. OpenAI's "Let's Verify Step by Step" (PRM800K) established that step-level supervision is more reliable [^26^]. Bottleneck: PRMs are multi-billion-parameter models queried per step per candidate; "reliance on large-scale sampling makes it computationally expensive" [^27^]. In the formal world, the kernel checks syntax but cannot judge *semantic progress* of an informal-to-formal step.

**Primitive design.** State = {goal, preceding steps, candidate step (tactic or NL inference)}. Questions: Noul("step is logically valid in context"), Noul("step makes progress toward the goal"), Score(rubric: correct-and-progress / correct-but-circular / unjustified / wrong). Batch over all candidates × steps of a tree in one call for best-of-n reranking.

**Why latency/cost matters.** Verification reranking multiplies calls by (candidates × steps): 64 candidates × 20 steps = 1,280 judgments per problem. At PRM-scale this needs a GPU cluster; at Jev-scale it is a few API calls — directly targeting the documented PRM cost bottleneck [^27^].

**Evidence.** [^25^][^26^][^27^] — Confidence: **High** (the Noul/Score per step is the definition of a PRM; formal-step variant extends Coq/Lean tactic validity beyond kernel checking to progress judgment).

---

### Usage 10 — Autoformalization faithfulness checking (does the formal statement capture informal intent?)
**One-liner:** Noul("does this Lean declaration express the same mathematical claim as the informal text?") — a fast semantic judge to close the compile–faithfulness gap, batched over pipeline outputs.

**Current practice & bottleneck.** "Lean verifies that a generated declaration is well typed, but not that it expresses the statement a user intended" [^28^]. Measured gap: "every system has a nonzero compile–faithfulness gap, whose observed magnitude ranges from 3.0 to 29.0 percentage points. The full GPT-5.2 tool-augmented agent ... compil[es] 89.5% while satisfying the semantic criterion on 60.5%" [^28^]. Current judges are frontier LLMs: a two-model consensus "agrees with human majority on 89.7% of cases (Wilson 95% CI: 82.1–94.3%)" [^28^]. Roundtrip verification formalizes–back-translates–checks equivalence, raising equivalence from 45–61% to 83–85%, with an "LLM judge [that] examines all four pipeline artifacts ... to identify the responsible stage" [^29^]. Benchmarks exist for exactly this binary judgment: "ProofNetVerif, a new benchmark of 3752 formal-informal pairs with human-annotated binary semantic equivalence labels" [^30^]. Bottleneck: frontier-LLM judging is slow and expensive at pipeline scale.

**Primitive design.** State = {informal statement x, formal candidate y, retrieved definitions}. Questions: Noul("y is a faithful formalization of x"); Score(rubric: faithful / faithful-modulo-style / missing-hypothesis / wrong-concept / ill-typed); Choice("which of k candidate formalizations is most faithful?"). In roundtrip pipelines: Choice over which stage failed (formalize / back-translate / re-formalize) — mirroring the diagnosis step [^29^].

**Why latency/cost matters.** Autoformalization agents iterate with compiler feedback; "elaboration feedback is the largest validity intervention, yet does not eliminate semantic drift" [^28^] — so the semantic check runs every iteration, not once. Bulk corpus formalization (thousands of statements) makes per-item judge cost the dominant line item.

**Evidence.** [^28^][^29^][^30^] — Confidence: **Very high** (the exact Noul question is the benchmark task of ProofNetVerif; human-agreement levels for LLM judges set a reachable bar).

---

### Usage 11 — Proof repair verdicts & repair-candidate ranking
**One-liner:** When definitions/types change and proofs break, Jev scores proposed repairs (Score) and picks repair strategies (Choice), and judges whether a repaired subgoal is equivalent to the original (Noul).

**Current practice & bottleneck.** Proof repair is an established subfield: PUMPKIN Pi "combin[es] a configurable proof term transformation with a decompiler from proof terms to suggested tactic scripts" for "automatically repairing broken proofs in the Coq proof assistant in response to changes in types" [^31^]. Whole-proof generators loop on failure: Baldur's proof "is then verified by Isabelle/HOL, and in the case of failure, the error message is used to post-prompt the LLM for proof repair" [^32^]; COPRA likewise feeds "incorrect steps along with the error message ... for regeneration" [^32^]. Bottleneck: repair attempts are blind regeneration; there is no cheap judgment of *which* repair dimension to attack (statement drift vs. tactic failure vs. missing lemma) or whether a candidate repair preserves the original intent.

**Primitive design.** State = {failing proof script, kernel error message, diff of changed definitions}. Questions: Choice over repair classes (transport-equivalence / adjust-tactic-args / insert-intermediate-lemma / re-hammer / give-up-to-human); Score per candidate repaired script (fixes-error / compiles-but-wrong-goal / no-change / regression); Noul("repaired subgoal is logically equivalent to the original subgoal under the type change").

**Why latency/cost matters.** Large proof bases (mathlib, seL4-style projects) face breakage on every refactor; repair loops are generate→check→regenerate cycles where each LLM regeneration is the expensive step — a cheap judge that picks the right repair class and filters bad candidates before kernel-checking cuts whole cycles.

**Evidence.** [^31^][^32^] — Confidence: **Medium-high** (repair tooling is established; learned verdict/routing layer is a clear but less-benchmarked extension).

---

### Usage 12 — Library search reranking (mathlib/AFP retrieval)
**One-liner:** Given a natural-language or goal-state query and retrieved candidates, Jev reranks: Noul("does this declaration match the user's intent?") / Score per candidate — the reranker stage of modern Mathlib search.

**Current practice & bottleneck.** An ecosystem of semantic search exists (Moogle, LeanSearch, Loogle, LeanExplore, Lean Finder) [^33^]; LeanSearch v2 "applies a hierarchy-informalized Mathlib corpus with an embedding–reranker pipeline, achieving state-of-the-art single-query retrieval ... (nDCG@10 of 0.62 vs. 0.53 for the next-best system)" [^34^]. The bottleneck is the classic retrieve-then-rerank asymmetry: "semantic search isn't an exact science, so the results you are looking for will not always top the result list" [^35^]. Cross-encoder rerankers are the accuracy lever but are expensive per (query, candidate) pair.

**Primitive design.** State = {query (NL or proof state), one candidate declaration with docstring+type}. Questions: Score(rubric: exact-match / right-lemma-wrong-form / related / irrelevant) per candidate, batched 100–1000 per call; Noul("would applying this lemma close/simplify the current goal?") for goal-conditioned reranking (bridges to Usage 1).

**Why latency/cost matters.** Interactive latency budget for search is ~1s end-to-end; reranking 500 candidates must fit inside it. Agentic provers (Usage 3, 5) also issue retrieval calls at every search node — throughput again dominates.

**Evidence.** [^33^][^34^][^35^] — Confidence: **High** (reranker is already the accuracy-determining component; Jev is a cheaper cross-encoder with typed outputs).

---

### Usage 13 — Loop-invariant & lemma candidate ranking in software verification
**One-liner:** In ICE/Houdini-style invariant inference, Jev ranks synthesized invariant/lemma candidates (Score) and judges inductiveness plausibility (Noul) before SMT checks.

**Current practice & bottleneck.** Invariant inference is "one of the most challenging problems in program verification. It is highly desired to incorporate machine learning when inferring" [^36^]. The landscape is candidate-generation + SMT-validation: LimICE integrates an LLM into the ICE framework with an explicit LemmaValidator/LemmaSynthesizer loop and beats Code2Inv, ICE-DT, LoopInvGen etc. (349/367 linear benchmarks solved vs 195 for Code2Inv; mean 15.2s vs 59.5s) [^37^]; LIPuS uses "RL-based pruning and SMT solving to generate candidate invariants efficiently" [^36^]. Bottleneck: each candidate validation is an SMT query; bad candidate ordering wastes solver calls — pruning/ordering *is* the learned component.

**Primitive design.** State = {loop/program snippet, current counterexample set, candidate invariant}. Questions: Noul("candidate is inductive"), Noul("candidate implies the post-condition"), Score(rubric: strong-and-simple / likely-inductive / too-weak / too-strong / spurious); Choice over which candidate to validate next with the SMT solver.

**Why latency/cost matters.** ICE loops iterate dozens–hundreds of times per benchmark, each with multiple SMT validations; a 0.1s judgment that discards 80% of candidates before Z3 calls compounds across verification campaigns (thousands of functions).

**Evidence.** [^36^][^37^] — Confidence: **Medium-high** (learned candidate ranking is proven (RL pruning, LLM generation); a typed judgment layer for ordering/validation-gating is a direct fit).

---

### Usage 14 — Static-analyzer alarm triage (true bug vs. false alarm)
**One-liner:** Noul("is this analyzer alarm a genuine defect?") + Score("severity") to rank/triage alarms from tools like Frama-C, Astrée-style abstract interpreters, and Clang Analyzer — before humans or deductive-verification effort is spent.

**Current practice & bottleneck.** False-positive rates are brutal: measured on benchmark suites, "Clang Analyzer ... FP Rate 0.84 ... Copecheck ... 0.92 ... Frama-C ... 0.43" [^38^]. ML triage is established: "Ranking warnings from multiple source code static analyzers via ensemble learning" builds classifiers from labeled warnings to rank actionable ones [^38^]; deep-learning alarm processing methods classify "actionable warnings and false alarms" with precision/recall/F1 evaluation [^39^]. Bottleneck: human audit of alarm backlogs is the dominant cost of deploying sound static analysis; classical ML triage needs per-tool feature engineering and labeled data.

**Primitive design.** State = {alarm message, code context slice, analyzer name/rule, project history}. Questions: Noul("alarm indicates a real bug"), Score(severity rubric: exploitable / crash / benign-violation / false), Choice over disposition (fix / verify-deductively / suppress / escalate-to-human). Batch thousands of alarms per release in a few calls.

**Why latency/cost matters.** One verification campaign can emit 10⁴–10⁵ alarms (Frama-C alone: 15,717 warnings in the cited study [^38^]); per-alarm cost must be near-zero for triage to be run on every CI build rather than quarterly audits. Typed confidences enable risk-based thresholding (only low-confidence alarms go to humans).

**Evidence.** [^38^][^39^] — Confidence: **High** (ML alarm classification is established practice; Jev removes feature-engineering and enables text-aware judgments cheaply).

---

## Cross-cutting observations
1. **The dominant pattern is "generate expensively, judge cheaply."** Every usage above pairs Jev with an expensive component (ATP run, kernel check, SMT query, LLM generation, frontier-LLM judge) and moves the *filtering/routing/ranking* decision into a sub-100ms typed call. This mirrors the two-stage retrieve→rerank architecture already proven by Magnushammer [^3^] and LeanSearch v2 [^34^].
2. **Noul's semantics = "P(in proof / true / faithful / real-bug)".** ENIGMA [^8^], the HTPS critic [^15^], Math-Shepherd [^25^], and ProofNetVerif [^30^] all train or evaluate exactly such binary probabilistic judges — strong precedent that the question types are learnable with calibrated probabilities.
3. **Confidence outputs enable cost-aware thresholding.** Hammer cutoff sizes, critic-guided pruning, and alarm escalation all benefit from calibrated confidence rather than raw logits — a differentiator vs. ad-hoc LM scoring.
4. **Latency tiers:** Usage 2 (given-clause) needs the sub-10ms roadmap to be competitive with XGBoost ENIGMA; Usages 1, 3, 5, 9, 12 are comfortable at sub-100ms; Usages 4, 6–8, 10, 11, 13, 14 are batch-oriented where cost-per-judgment dominates.

## References
[^1^] J. Urban, "MaLARea: a Metasystem for Automated Reasoning in Large Theories," ESARLT 2007, CEUR Vol-257. http://ceur-ws.org/Vol-257/05_Urban.pdf
[^2^] A. A. Alemi, F. Chollet, G. Irving, C. Szegedy, J. Urban, "DeepMath — Deep Sequence Models for Premise Selection," NeurIPS 2016. https://arxiv.org/abs/1606.04442
[^3^] M. Mikuła et al., "Magnushammer: A Transformer-Based Approach to Premise Selection," ICLR 2024. https://arxiv.org/pdf/2303.04488
[^4^] J. Jakubův, C. Kaliszyk, M. Olšák, J. Piepenbrock, J. Urban, "The Isabelle ENIGMA," ITP 2022. https://arxiv.org/abs/2205.01981
[^5^] "The Fusion of Large Language Models and Formal Methods for Trustworthy AI Agents: A Roadmap," §4.2.1. https://arxiv.org/html/2412.06512v1
[^6^] T. Zhu, J. Clune, J. Avigad, S. Welleck et al., "Premise Selection for a Lean Hammer." https://arxiv.org/abs/2506.07477
[^7^] J. Piepenbrock, J. Jakubův, M. Olšák, J. Urban et al., "Learning Theorem Proving Components." https://arxiv.org/pdf/2107.10034
[^8^] J. Jakubův, J. Urban et al., ENIGMA guidance overview (arXiv:1905.09565); see also "Enhancing ENIGMA Given Clause Guidance," CICM 2018. https://arxiv.org/pdf/1905.09565
[^9^] T. Gauthier, C. Kaliszyk, J. Urban, R. Kumar, M. Norrish, "TacticToe: Learning to Prove with Tactics," JAR/LPAR. https://arxiv.org/abs/1804.00596
[^10^] L. Blaauwbroek, J. Urban, H. Geuvers, "Tactic Learning and Proving for the Coq Proof Assistant" (Tactician), LPAR-23, EPiC 73. https://easychair.org/publications/paper/JLdB/open
[^11^] K. Yang et al., "LeanDojo: Theorem Proving with Retrieval-Augmented Language Models," NeurIPS 2023 D&B. https://arxiv.org/abs/2306.15626
[^12^] "Learning Rules Explaining Interactive Theorem Proving Tactic Prediction" (Coq tactic prediction; TacticToe orthogonalization discussion). https://arxiv.org/html/2411.01188v1
[^13^] D. Kühlwein, J. Urban, "MaLeS: A Framework for Automatic Tuning of Automated Theorem Provers," JAR 2015. https://arxiv.org/pdf/1308.2116
[^14^] J. Jakubův, J. Urban, "Hierarchical Invention of Theorem Proving Strategies" (BliStrTune), AI Communications. https://arxiv.org/pdf/1611.08733
[^15^] G. Lample et al., "HyperTree Proof Search for Neural Theorem Proving," NeurIPS 2022. https://arxiv.org/pdf/2205.11491
[^16^] H. Wang et al., "DT-Solver: Automated Theorem Proving with Dynamic-Tree Sampling Guided by Proof-Level Value Function," ACL 2023 (as described in FIMO dataset paper, arXiv:2309.04295).
[^17^] S. Polu, I. Sutskever, "Generative Language Modeling for Automated Theorem Proving" (GPT-f), 2020. https://arxiv.org/abs/2009.03393
[^18^] M. Johansson, D. Rosén, N. Smallbone, K. Claessen, "Hipster: Integrating Theory Exploration in a Proof Assistant," CICM 2014. https://arxiv.org/pdf/1405.3426
[^19^] J. Urban, J. Jakubův, "First Neural Conjecturing Datasets and Experiments," CICM 2020. arXiv:2005.14664 (cited via https://arxiv.org/html/2503.01389v1)
[^20^] "Learning Conjecturing from Scratch," 2025. https://arxiv.org/html/2503.01389v1
[^21^] S. Colton, "Automated Theory Formation in Pure Mathematics" (HR system; Otter + MACE settling loop), PhD thesis, Univ. of Edinburgh. https://era.ed.ac.uk/items/907e65a9-0410-4e9f-9923-58e572aec62d
[^22^] "Learning Interestingness in Automated Mathematical Theory Formation," 2025. https://arxiv.org/html/2511.14778v1
[^23^] J. C. Blanchette, "Counterexample Generation for Higher-Order Logic Using Semantic and Syntactic Approaches" (PhD thesis; 400 mutated theorems, 30s limit evaluation). https://d-nb.info/1033891142/34
[^24^] J. C. Blanchette, T. Nipkow, "Nitpick: A Counterexample Generator for Higher-Order Logic Based on a Relational Model Finder," ITP 2010. https://easychair.org/publications/paper/zXQs/open
[^25^] P. Wang, L. Li et al., "Math-Shepherd: Verify and Reinforce LLMs Step-by-step without Human Annotations," ACL 2024. https://aclanthology.org/2024.acl-long.510/ (arXiv:2312.08935)
[^26^] H. Lightman et al., "Let's Verify Step by Step," ICLR 2024. arXiv:2305.20050 (cataloged in https://github.com/RyanLiu112/Awesome-Process-Reward-Models)
[^27^] Process-reward survey excerpt on Math-Shepherd/AutoPSV cost. https://arxiv.org/pdf/2604.25039
[^28^] "Beyond Compilation: Evaluating Faithful Natural-Language-to-Lean Statement Formalization," 2026. https://arxiv.org/html/2606.31002v2
[^29^] J. Lopez, C. Barrett, "Faithful Autoformalization via Roundtrip Verification and Repair," 2026. https://arxiv.org/html/2604.25031v1
[^30^] "Reliable Evaluation and Benchmarks for Statement Autoformalization" (BEq+, ProofNetVerif, ProofNet#, RLM25). https://arxiv.org/abs/2406.07222
[^31^] T. Ringer, R. Porter, N. Yazdani, J. Leo, D. Grossman, "Proof Repair across Type Equivalences" (PUMPKIN Pi), PLDI 2021. https://arxiv.org/abs/2010.00774
[^32^] E. First et al., "Baldur: Whole-Proof Generation and Repair with Large Language Models," FSE 2023; COPRA (Thakur et al., 2024) — as surveyed in "Mathematics and Machine Creativity," https://arxiv.org/pdf/2412.16543
[^33^] "A Semantic Search Engine for Mathlib4" (LeanSearch ecosystem overview); LeanExplore, arXiv:2506.11085. https://arxiv.org/html/2506.11085v1
[^34^] "Global Premise Retrieval for Lean 4 Theorem Proving" (LeanSearch v2). https://arxiv.org/abs/2605.13137
[^35^] Leanprover Community blog, "Searching for Theorems in Mathlib." https://leanprover-community.github.io/blog/posts/searching-for-theorems-in-mathlib/
[^36^] L. Yu et al., "Loop Invariant Inference through SMT Solving Enhanced Reinforcement Learning" (LIPuS), ISSTA 2023. https://dl.acm.org/doi/abs/10.1145/3597926.3598047
[^37^] "Integrating LLM into ICE Framework for Efficient Loop Invariant Inference" (LimICE). https://arxiv.org/html/2607.27606v1
[^38^] "Ranking Warnings from Multiple Source Code Static Analyzers via Ensemble Learning." https://ccsl.ime.usp.br/files/publications/files/2020/Ranking%20warnings%20from%20multiple%20source%20code%20static%20analyzers%20via%20ensemble%20learning.pdf
[^39^] "A Method for Processing Static Analysis Alarms Based on Deep Learning," Applied Sciences 14(13):5542, 2024. https://www.mdpi.com/2076-3417/14/13/5542
