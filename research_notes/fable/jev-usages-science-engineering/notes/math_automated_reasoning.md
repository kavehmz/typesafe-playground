# Jev usages in Mathematics, subtopic A: automated reasoning, theorem proving, formal verification, SAT/SMT, computer algebra

Researcher notes. Current to September 2026. 38 usages (U1-U38), then Top 5, Poor fits, New roles.

**Citation legend**
- **[V]** = I saw this URL or fact in a search or fetch during this session.
- **[M]** = from memory. Paper exists to my knowledge, but I did not re-fetch it. Numbers marked [M] need a check before publication.

**Usage field order** (brief's 7 fields; field 1 is the heading): Practice, Pain, Jev fit, Why cheap/fast, Evidence, Rating.

**Three facts that shape every rating below**
- Jev is not trained on any prover's data. Most published guidance models are. A zero-shot classifier will likely lose to a fine-tuned one on the same narrow task. Jev wins on: no training, new libraries, calibrated output, price.
- Jev's rate limit today is 1,200 requests/min = 20 requests/s. One request can carry many questions over one state. So design for "one state, many questions", not "one request per node".
- Jev's fluency with Lean, Isabelle, TPTP, SMT-LIB and LaTeX is unverified. Every rating that reads formal syntax carries this risk.

---

## KQ1. Premise selection: history, results, accuracy, candidate counts, latency

### Takeaway
Premise selection is a per-pair relevance judgment (goal, lemma). It maps directly to Jev's Noul or Score. The proven design is two stages: a cheap retriever picks about 1,000 from 100k+, then a pair-wise reranker scores them. Jev fits the rerank stage. It will not replace the retriever.

### Cited Findings
- Magnushammer: Select stage retrieves 1,024 premises from a 433K-premise database. Rerank stage scores each (proof state, premise) pair with cross-attention. 59.5% proof rate on PISA vs Sledgehammer 38.3%. Thor + Magnushammer 71.0% vs 57.0%. miniF2F 34.0% vs 20.9%. — [Magnushammer, Mikuła et al., ICLR 2024](https://arxiv.org/abs/2303.04488) [V]
- LeanHammer (Zhu, Clune, Avigad, Jiang, Welleck, 2025): LeanPremise is trained for hammer use in dependent type theory. It adapts to user context and recommends premises from libraries outside training data and user-defined lemmas. It lets LeanHammer solve 21% more goals than existing premise selectors. — [Premise Selection for a Lean Hammer](https://arxiv.org/abs/2506.07477) [V]
- LeanDojo (Yang et al., NeurIPS 2023): benchmark of 98,734 theorems from Lean's math library. ReProver trains in one GPU week. — [LeanDojo](https://arxiv.org/abs/2306.15626) [V]. ReProver retrieves 100 premises per state; Pass@1 51.2% (random split) and 26.3% (novel_premises split) [M].
- DeepMath (Alemi, Chollet, Een, Irving, Szegedy, Urban, 2016): first large-scale deep learning for premise selection, on the Mizar corpus, two-stage approach. — [DeepMath](https://arxiv.org/abs/1606.04442) [V]. Pairwise classification accuracy about 80.9% [M].
- Alama, Heskes, Kühlwein, Tsivtsivadze, Urban, "Premise Selection for Mathematics by Corpus Analysis and Kernel Methods", J. Automated Reasoning 2014. — [arXiv:1108.3446](https://arxiv.org/abs/1108.3446) [M]
- LeanSearch v2 frames "global premise retrieval for Lean 4 theorem proving" (2026). — [LeanSearch v2](https://arxiv.org/abs/2605.13137) [V, title only]
- Lean Copilot offers `select_premises` next to `suggest_tactics` and `search_proof`, running inside Lean. — [Lean Copilot](https://arxiv.org/abs/2404.12534) [V]

### Inferences

#### U1. Hammer premise reranker — premise selection
- Practice: Hammers (Sledgehammer, CoqHammer, LeanHammer) pick 32-1,024 library facts, translate to an ATP, reconstruct the proof. Filters: MePo, MaSh (k-NN / naive Bayes) [M], Magnushammer, LeanPremise.
- Pain: Trained selectors go stale when the library changes. They are blind to a user's new project lemmas. Training needs proof data per prover.
- Jev fit: Heuristic inside a search loop. State = goal plus local context. One Noul or Score per candidate lemma: "Is this lemma likely to be used in a proof of this goal?" Levels: irrelevant / same topic / likely used. Code retrieves top 256-1,024 by embeddings or symbols first.
- Why cheap/fast: 1,024 pairs × ~300 tokens ≈ 0.3 Mtok ≈ $0.012 per goal. About 10 requests of ~100 questions each. About 1-2 s at today's throughput, inside a 10-30 s hammer budget.
- Evidence: Magnushammer's rerank stage is exactly this pair judgment and lifts PISA from 38.3% to 59.5% [V]. LeanHammer shows value of adapting to unseen libraries [V].
- Rating: **Medium.** Risk: a trained 38M-86M reranker will likely beat zero-shot Jev on a known library. Jev's edge is cold start and no training. Formal-syntax fluency unverified.

#### U2. Informal-query to formal-lemma search reranker — library search
- Practice: Moogle, LeanSearch, LeanExplore, Lean Finder, LeanDex give semantic search over Mathlib. Loogle gives exact pattern search.
- Pain: Users phrase queries informally. Top-k lists hold near misses (wrong direction, extra hypothesis). Users read 20 results by hand.
- Jev fit: Select, do not generate. State = query plus each candidate's formal statement and its informal gloss. Score per hit: exact match / more general / special case / related / unrelated.
- Why cheap/fast: 50 hits × 400 tokens = $0.0008 per query. Interactive at <150 ms.
- Evidence: LeanSearch pairs each Mathlib theorem with an informal description; embedding models reach nDCG@20 0.733 and Recall@10 0.913 on its benchmark. — [A Semantic Search Engine for Mathlib4](https://arxiv.org/abs/2403.13310) [V]. Intent-aware search: [Lean Finder](https://arxiv.org/abs/2510.15940) [V]. [LeanExplore](https://arxiv.org/abs/2506.11085) [V]. Community overview: [Searching for theorems in Mathlib](https://leanprover-community.github.io/blog/posts/searching-for-theorems-in-mathlib/) [V].
- Rating: **Strong.** Text on both sides, closed answer set, recoverable errors. Risk: subtle generality differences (typeclass assumptions) are multi-hop.

#### U3. Low-frequency axiom and symbol relevance weights for saturation provers — ATP guidance (slow path)
- Practice: E and Vampire use SInE-style axiom selection and conjecture-symbol clause weights. NeuroCore calls a network rarely and uses the result to re-focus a fast heuristic [M: Selsam & Bjørner, arXiv:1903.04671].
- Pain: Per-clause neural calls are too slow (see KQ3). Static symbol weights ignore meaning.
- Jev fit: Feature extractor. Once per problem (or every few seconds), Score each axiom or symbol name for relevance to the conjecture. Code turns scores into clause-weight multipliers.
- Why cheap/fast: One batch of a few hundred judgments costs <$0.01 and <2 s. The prover's inner loop never waits on Jev.
- Evidence: NeuroCore pattern [M]. Premise selection evidence above. No direct study of LLM-scored symbol weights found.
- Rating: **Speculative.** Risk: TPTP symbol names are often opaque (e.g. `k1_xboole_0` in Mizar exports); then Jev has nothing to read.

### Gaps
- I did not re-verify the DeepMath 80.9% figure or ReProver's 51.2% / 26.3% in this session.
- No published test of a general-purpose zero-shot classifier as a premise reranker was found. All strong results use models trained on proof data.
- Typical Sledgehammer premise counts and timeouts (hundreds of facts, 30 s) are from memory, not re-checked.

---

## KQ2. Tactic and proof-step guidance: closed tactic set vs free-form generation

### Takeaway
Older systems (HOList, TacticToe, Tactician, Proverbot9001) predict a tactic from a closed set, then pick arguments by premise scoring. That shape suits Jev. Frontier systems since 2020 (GPT-f, HTPS, ReProver, AlphaProof, DeepSeek-Prover, Kimina, Seed-Prover) generate free-form tactics or whole proofs. There Jev cannot be the policy. It can only rerank, route, or act as a critic.

### Cited Findings
- HTPS (Lample et al., NeurIPS 2022): a policy model samples tactics for a goal; a critic model estimates provability. Both guide the search. Calls are batched across nodes with virtual loss for throughput. Training is AlphaZero-like with asynchronous provers. Metamath held-out accuracy 65.4% → 82.6% with online training. — [HTPS](https://arxiv.org/abs/2205.11491) [V]
- AlphaProof (Nature, Nov 2025): RL in Lean plus tree search. For the hardest problems it uses test-time RL: it generates and learns from millions of related problem variants at inference time. — [Olympiad-level formal mathematical reasoning with reinforcement learning](https://www.nature.com/articles/s41586-025-09833-y) [V]
- InternLM2.5-StepProver uses critic-guided search. — [arXiv:2410.15700](https://arxiv.org/abs/2410.15700) [V, title]
- DeepSeek-Prover-V1.5 uses proof-assistant feedback and tree search (RMaxTS). — [arXiv:2408.08152](https://arxiv.org/abs/2408.08152) [V, title]
- Lean Copilot runs LLM inference natively in Lean (CTranslate2 via FFI). `suggest_tactics` type-checks each suggestion and marks ones that close or advance the goal. — [Lean Copilot](https://arxiv.org/abs/2404.12534) [V]
- HOList / DeepHOL: policy = classifier over a fixed tactic set (41 tactics [M]) plus a premise scorer for tactic arguments. — [HOList, Bansal et al., ICML 2019, arXiv:1904.03241](https://arxiv.org/abs/1904.03241) [M]
- TacticToe: k-NN over recorded tactics plus MCTS with policy and value; proves 66.4% of 7,164 HOL4 theorems in 60 s [M]. — [arXiv:1804.00596](https://arxiv.org/abs/1804.00596) [M]
- GPT-f: free-form generation; 56.22% on Metamath test [M]. — [arXiv:2009.03393](https://arxiv.org/abs/2009.03393) [M]
- Other closed-set or hybrid systems: Tactician [arXiv:2008.00120] [M], Proverbot9001 [arXiv:1907.07794] [M], ASTactic/CoqGym [arXiv:1905.09381] [M], Graph2Tac [arXiv:2401.02949] [M].
- DeepSeek-Prover-V2: a large model decomposes a theorem into subgoals; a smaller prover closes them [M]. — [arXiv:2504.21801](https://arxiv.org/abs/2504.21801) [M]

### Inferences

#### U4. Tactic-family prior — interactive theorem proving
- Practice: HOList, TacticToe, Tactician predict one of a fixed tactic set, then fill arguments.
- Pain: Generators waste samples on the wrong family (e.g. rewriting when induction is needed). Each wrong sample costs a Lean execution.
- Jev fit: Heuristic in search loop. State = goal and hypotheses. Choice: {induction, case split, rewrite/simp, apply library lemma, arithmetic decision procedure, unfold definition, construct witness, contradiction}. Code uses probabilities to set the generator's prompt or sampling mix.
- Why cheap/fast: One ~500-token call per node = $0.00002. At 10 ms it costs less than one tactic execution.
- Evidence: HOList's 41-way tactic classifier [M]; TacticToe and Tactician k-NN over closed tactic sets [M].
- Rating: **Medium.** Risk: the right family often needs look-ahead (multi-hop). 20 requests/s caps search speed today.

#### U5. Automation selector per goal — interactive theorem proving
- Practice: Lean `hint`, Isabelle `try0`, and Sledgehammer try a fixed portfolio: simp, aesop, omega, linarith, nlinarith, ring, norm_num, positivity, decide, hammer.
- Pain: Some members take seconds (nlinarith, polyrith, hammers at 10-30 s). Running all wastes CPU in bulk proving.
- Jev fit: Select among algorithms. Choice over the portfolio, or one Noul per member: "Could `omega` close this goal?" Code runs members in probability order.
- Why cheap/fast: $0.00002 per goal against seconds of CPU per failed attempt.
- Evidence: Lean Copilot's `search_proof` combines aesop with learned suggestions [V]. Algorithm-selection theory: Rice 1976 [M]. No direct study of a learned order for `hint` found.
- Rating: **Medium.** Risk: for cheap members, just running them beats asking. Value is only in ordering the expensive ones. Goal fragments (linear vs non-linear arithmetic) are syntactic; code can detect many.

#### U6. Candidate-tactic reranker before execution — neural theorem proving
- Practice: Step provers sample k tactics per node (GPT-f: 32 per expansion [M]; ReProver: beam of 64 [M]) and run each in the proof assistant.
- Pain: Most samples fail or do nothing. Execution dominates wall-clock in CPU-bound setups.
- Jev fit: Select, do not generate. State = goal. Score each candidate: likely error / no progress / progress / closes goal. Code executes top-m only.
- Why cheap/fast: 64 candidates in one request, ~$0.0001.
- Evidence: HTPS and StepProver show a critic helps search [V]. `suggest_tactics` already filters by type-checking [V], which is ground truth and often fast.
- Rating: **Speculative.** Risk: Lean's own check is exact; Jev only pays off when execution is slow. Predicting tactic success is near multi-hop reasoning.

#### U7. Proof-state value estimate (critic) — neural theorem proving
- Practice: HTPS critic, GPT-f value function, StepProver critic estimate "can this goal be proved?" to order the search frontier.
- Pain: Critics need on-policy training data and GPUs.
- Jev fit: Heuristic in search loop. Noul: "Is this goal provable from these hypotheses?" or Score: closer / same / further than parent.
- Why cheap/fast: One call per frontier node; batch siblings in one request.
- Evidence: Trained critics help [V: HTPS, StepProver]. No evidence that an untrained general classifier gives a useful value signal.
- Rating: **Speculative.** Risk: multi-hop; false goals often look plausible. Use counterexample tools (Nitpick, Quickcheck, `plausible`) first.

#### U8. Sketch and subgoal decomposition selector — neural theorem proving
- Practice: Draft-Sketch-Prove [M: arXiv:2210.12283] and DeepSeek-Prover-V2 [M] let a large model propose proof sketches; a prover fills gaps.
- Pain: Each sketch costs minutes of prover time. Many sketches are circular or skip the hard step.
- Jev fit: Verifier. Parallel Nouls per sketch: "Does any subgoal restate the theorem?", "Does the last step follow from the listed subgoals?", "Is a needed case missing?" Code ranks sketches by the scores.
- Why cheap/fast: 10 sketches × 1,500 tokens = $0.0006 vs minutes of GPU per sketch.
- Evidence: Subgoal decomposition drives V2's results [M]. No study of cheap sketch filters found.
- Rating: **Speculative-Medium.** Risk: multi-hop.

#### U9. Search-budget router across theorems — neural theorem proving
- Practice: Bulk runs (Mathlib gaps, benchmark sweeps, RL data generation) give every theorem the same budget.
- Pain: Compute is the limit. AlphaProof-style test-time RL is very costly per problem [V].
- Jev fit: Triage / router. Score difficulty: closes by automation / short tactic proof / needs lemma search / needs new idea. Code maps levels to budgets and provers.
- Why cheap/fast: $84 per million statements screened.
- Evidence: Indirect only: compute scaling results in AlphaProof and HTPS [V].
- Rating: **Speculative-Medium.** Risk: difficulty is hard to read from a statement. Calibrated probabilities help because the router only needs a ranking.

### Gaps
- A search summary said AlphaProof solves 45% of a benchmark at 1,000 simulations and 50% at 16,000, without test-time RL. I could not confirm which paper this comes from. Do not cite without a check.
- Per-node inference cost for HTPS, GPT-f, AlphaProof: papers report GPU-heavy setups, but I found no clean ms-per-node numbers this session.
- Trend note (inference): since 2025, top provers (Kimina, Seed-Prover, DeepSeek-Prover-V2) lean on whole-proof generation with long reasoning and compiler feedback. That shrinks the room for a per-node classifier at the frontier. Room remains in step-level provers and interactive tools.

---

## KQ3. Given-clause selection and other ATP internals: where Jev is too slow

### Takeaway
Classifiers already guide saturation provers, but they run at microsecond-to-millisecond cost per clause. Even purpose-built neural guidance slows E to about 6-7% of baseline speed. Jev at 10-100 ms per call is far too slow for per-clause work. Jev can only act outside the inner loop: per problem, or every few seconds.

### Cited Findings
- ENIGMA line: neural clause evaluation runs at about 6-7% of the baseline strategy's speed; linear models at about 60%; tree models at about 40%. Without caching, neural speed drops from 7.1% to 3.6% of baseline. — search summary of the ENIGMA papers, most likely [ENIGMA-NG, Chvalovský, Jakubův, Suda, Urban, CADE 2019](https://arxiv.org/abs/1903.03182) [V for URL; exact paper attribution of the numbers not confirmed]
- "Fast and Slow Enigmas and Parental Guidance" (Goertzel, Chvalovský, Jakubův, Olšák, Urban, 2021): adds a GPU evaluation server, a fast model that pre-filters clauses for the slow model, and "parental guidance" that rejects an inference before it produces a clause. Evaluated on Mizar. — [arXiv:2107.06750](https://arxiv.org/abs/2107.06750) [V]
- Suda, "Improving ENIGMA-style clause selection while learning from history" (Vampire, CADE 2021). — [arXiv:2102.13564](https://arxiv.org/abs/2102.13564) [V, title]
- Suda, "Efficient Neural Clause-Selection Reinforcement" (CADE 2025): deep integration of neural evaluation with ATP data structures amortizes cost; structure-aware GNNs avoid the quadratic cost of off-the-shelf transformers, which "would decrease evaluation speed by orders of magnitude". — [Springer](https://link.springer.com/chapter/10.1007/978-3-031-99984-0_22) [V via search summary]
- MizAR 60 for Mizar 50 (large-scale ATP + ML on Mizar). — [arXiv:2303.06686](https://arxiv.org/abs/2303.06686) [V, title]
- rlCoP: MCTS-guided connection tableau with gradient-boosted trees; 42.1% more test problems than the leanCoP baseline under the same inference limit [M]. — [Kaliszyk, Urban, Michalewski, Olšák, NeurIPS 2018, arXiv:1805.07563](https://arxiv.org/abs/1805.07563) [M]
- MaLeS and BliStr tune and select ATP strategies per problem class. — [MaLeS, arXiv:1308.2116](https://arxiv.org/abs/1308.2116) [M]; [BliStr, arXiv:1301.2683](https://arxiv.org/abs/1301.2683) [M]

### Inferences
- Budget comparison (estimate, not cited): a saturation prover evaluates thousands to hundreds of thousands of clauses per second. That is 10-1,000 µs per clause. Jev at 10 ms is 10-1,000× slower; at 100 ms, 100-10,000× slower. The 20 requests/s rate limit makes it worse.
- ENIGMA's "fast and slow" split is the right template. Jev could at most be a very slow third tier for a handful of decisions per run.

#### U10. ATP strategy and schedule selection per problem — automated theorem proving
- Practice: E's auto-schedule, Vampire's CASC mode, MaLeS and BliStr pick strategies from syntactic problem features.
- Pain: Schedules are tuned on TPTP. They transfer poorly to new domains (hammer exports, software verification conditions).
- Jev fit: Select among algorithms. State = code-computed features as named buckets (clause count bucket, equality share, Horn or not) plus problem source text. Choice over 5-20 named strategies, each described in words.
- Why cheap/fast: One 100 ms call against 10-300 s runs.
- Evidence: MaLeS, BliStr [M]. SMT-Select shows text descriptions add signal to syntactic features for solver choice (see KQ6) [V].
- Rating: **Speculative-Medium.** Risk: strategy behaviour is hard to describe in words; a trained classical selector on numeric features is the strong baseline.

### Gaps
- I did not find a published wall-clock figure for "clauses evaluated per second" in E or Vampire this session. The µs estimate above is mine.
- rlCoP inference budgets (e.g. playouts per step) are from memory and not stated here.

---

## KQ4. Step verification: can a Noul act as a process reward model?

### Takeaway
Yes in form, doubtful in strength. A PRM is a per-step validity probability, which is a Noul. But ProcessBench shows small discriminative PRMs generalize badly to olympiad-level steps, and large reasoning critics do much better. Use Jev for non-numeric, local checks and as a cheap first filter. Let code check arithmetic. Escalate low-confidence steps.

### Cited Findings
- ProcessBench (Zheng et al., 2024): 3,400 cases, competition and olympiad level, expert-annotated first-error step. Average F1: Qwen2.5-Math-7B-PRM800K 56.5; Skywork-PRM-7B 42.1; Skywork-PRM-1.5B 36.4; Math-Shepherd-PRM-7B 31.5; RLHFlow-PRM-Mistral-8B 28.4; RLHFlow-PRM-Deepseek-8B 26.6. Critics: o1-mini 87.9; QwQ-32B-Preview 71.5; GPT-4o 61.9; Qwen2.5-72B-Instruct 61.2. — [ProcessBench](https://arxiv.org/abs/2412.06559) [V]
- Same paper: PRMs "typically fail to generalize to more challenging math problems beyond GSM8K and MATH". Best PRM by subset: GSM8K 68.2, MATH 62.6, OlympiadBench 50.7, Omni-MATH 44.3. Smaller critic models do much worse than larger ones. — [ProcessBench](https://arxiv.org/abs/2412.06559) [V]
- "The Lessons of Developing PRMs" (Qwen team, 2025): Monte-Carlo-estimated labels generalize worse than LLM-judge or human labels; a consensus filter fixes much of it. — [arXiv:2501.07301](https://arxiv.org/abs/2501.07301) [V]
- ActPRM reaches average F1 0.750 on ProcessBench, 1.5% above Qwen2.5-Math-PRM-7B. So a well-trained 7B PRM reaches the mid 70s. — [Efficient PRM Training via Active Learning](https://arxiv.org/abs/2504.10559) [V]
- Error-typed PRMs: [Error Typing for Smarter Rewards](https://arxiv.org/abs/2505.19706) [V, title]. Survey: [A Survey of Process Reward Models](https://arxiv.org/abs/2510.08049) [V, title].
- Lightman et al., "Let's Verify Step by Step" (2023): PRM800K has about 800K human step labels; the PRM-ranked best-of-N solves 78% of a MATH test subset [M]. — [arXiv:2305.20050](https://arxiv.org/abs/2305.20050) [M]
- Math-Shepherd: automatic step labels from rollouts; used for verification and for PPO. — [arXiv:2312.08935](https://arxiv.org/abs/2312.08935) [M]
- Natural-language proof grading: ProofBench has 145 problems (EGMO, USAMO, IMO, TST, APMO, Putnam 2022-2025) and 435 LLM solutions with expert grades; strong backbones, problem-specific marking schemes, and ensembling matter. — [Reliable Fine-Grained Evaluation of Natural Language Math Proofs](https://arxiv.org/abs/2510.13888) [V]
- On a 200-case sample of IMO-GradingBench, three cheap judges (GPT-OSS-120B, DeepSeek-V4-Flash, Gemma-4-31B) match human pass/fail as well as frontier models. — [Cost-Effective Automated Judging of Natural-Language Mathematical Proofs](https://arxiv.org/abs/2608.00004) [V via search summary]
- "Proof or Bluff?": best model scored under 25% on USAMO 2025; failure modes were flawed logic, unjustified assumptions, lack of creativity. — [arXiv:2503.21934](https://arxiv.org/abs/2503.21934) [V]
- Generative verifiers for proof selection: [Scaling Generative Verifiers](https://arxiv.org/abs/2511.13027) [V, title]. IMO-ProofBench auto-grader correlates with humans at r = 0.93. — [Towards Robust Mathematical Reasoning, arXiv:2511.01846](https://arxiv.org/abs/2511.01846) [V via search summary]

### Inferences

#### U11. Non-numeric step validity check (PRM) — informal proof verification
- Practice: PRMs score each step of an LLM solution; used for best-of-N, search, and RL reward (Lightman 2023; Math-Shepherd).
- Pain: Trained PRMs are 7B-72B, cost GPU time per step, and generalize poorly beyond their training distribution [V].
- Jev fit: Verifier / PRM. State = problem plus steps 1..k-1. Noul: "Does step k follow from the problem and earlier steps?" One question per step, all in one request.
- Why cheap/fast: 20 steps × 1,500 tokens ≈ $0.0012 per solution. One million solutions ≈ $1,200. Fast enough to sit inside a sampling loop.
- Evidence: ProcessBench numbers above. Small PRMs score 27-57 F1; good 7B PRMs reach the mid 70s; reasoning critics reach 88.
- Rating: **Medium for gross errors, Speculative for olympiad-level.** Risk: multi-hop and numeric. Jev has no "thinking" budget, so it sits in the weak group unless tests show otherwise. Must be benchmarked on ProcessBench before any claim.

#### U12. Hybrid PRM: code checks the arithmetic, Jev checks the justification — informal proof verification
- Practice: Tool-augmented verification: parse equations and check with SymPy or a CAS; judge the prose separately.
- Pain: LLM judges miss arithmetic slips; CAS cannot read prose.
- Jev fit: Verifier. Code extracts each equation and passes "equation 3: verified by CAS / failed / not checkable" into state as named facts. Jev answers parallel Nouls: "Is a theorem cited?", "Are its hypotheses stated as met?", "Is the case split exhaustive as written?", "Does the step assume the conclusion?"
- Why cheap/fast: Several Nouls per step still cost <$0.0001 per step.
- Evidence: Brief's design rule (code owns numerics). Error-typed PRM work [V, title]. "Proof or Bluff" failure modes are mostly non-numeric (unjustified assumptions) [V].
- Rating: **Medium.** Risk: "hypotheses met" is often multi-hop.

#### U13. Error-type classification of flagged steps — informal proof verification
- Practice: PRM800K and ProcessBench annotate where the first error is, not why. Error typing is emerging.
- Pain: RL pipelines and human reviewers want the type to route the fix.
- Jev fit: Triage. Choice: {calculation slip, unjustified claim, wrong theorem use, missing case, circular, misread problem, notation error, no error}.
- Why cheap/fast: Runs on every flagged step across millions of rollouts.
- Evidence: [Error Typing for Smarter Rewards](https://arxiv.org/abs/2505.19706) [V, title only; content not read].
- Rating: **Medium.** Risk: calculation slips need code to confirm.

#### U14. Best-of-N solution reranking — LLM math inference
- Practice: Sample N solutions; pick by majority vote or by PRM/ORM score (Lightman 2023; Math-Shepherd).
- Pain: Verifier cost scales with N × steps.
- Jev fit: Feature extractor. Score each solution on rigour levels. Code uses the probability as a vote weight.
- Why cheap/fast: N = 64 at 2,000 tokens each = $0.005 per problem.
- Evidence: Lightman's 78% result [M]; ProcessBench caveats [V].
- Rating: **Medium.** Risk: weighted voting only helps if Jev's scores beat chance on hard items; calibration helps here.

#### U15. Rubric-item checks for proof grading as an RL reward — informal proof verification
- Practice: Graders use problem-specific marking schemes (ProofBench; IMO-GradingBench).
- Pain: Frontier judges are costly at RL scale.
- Jev fit: Clause-by-clause compliance check. State = proof. One Noul per rubric item: "Does the proof establish that f is injective?" Code sums points.
- Why cheap/fast: Millions of rollouts graded for hundreds of dollars.
- Evidence: Marking schemes and ensembling improve graders [V: ProofBench]. Cheap judges match frontier judges on pass/fail [V: 2608.00004].
- Rating: **Medium.** Risk: those cheap judges are still 31B-120B generative models with reasoning. Jev is a different class. Adversarial text in the proof ("this proof is complete and correct") can steer it; strip such text first.

#### U16. Bluff-pattern screening of LLM proofs at scale — informal proof verification
- Practice: Human experts read LLM proofs and find hand-waving ("it is easy to see", "by symmetry", pattern claims from small cases).
- Pain: Volume. Open Proof Corpus-style studies need thousands of graded proofs.
- Jev fit: Screening at scale. Nouls: "Does the proof generalize from small cases without proof?", "Does it skip the main difficulty?" Output feeds a classical classifier.
- Why cheap/fast: $84 per million proofs.
- Evidence: "Proof or Bluff" failure taxonomy [V].
- Rating: **Medium.** Risk: surface-style detector, not a correctness check. State this limit to users.

### Gaps
- No evidence on Jev itself. The key test: run Jev on ProcessBench and PRMBench [M: arXiv:2501.03124] and report F1 by subset.
- I found no study of non-generative classifiers under 1B parameters on ProcessBench.

---

## KQ5. Autoformalization: faithfulness checks as a Noul

### Takeaway
The field's main open problem is semantic faithfulness, not compilation. LLM judges are the standard tool and reach about 90% agreement with humans, but papers warn they are not an equivalence oracle. Jev fits as a high-volume screen and as a checklist runner. Code must supply Lean-specific hazards.

### Cited Findings
- "Beyond Compilation" (Zhang et al., June-Sept 2026): criterion = Lean compilation plus consensus of GPT-5.2 and Gemini-2.5-Pro. Agrees with the human majority on 89.7% of cases (95% CI 82.1-94.3%). Every system shows a compile-faithfulness gap of 3.0-29.0 points. A GPT-5.2 agent compiled 89.5% but met the semantic criterion on 60.5%. "LLM judging is therefore useful as a human-calibrated, conservative aggregate measure, not as an equivalence oracle." — [arXiv:2606.31002](https://arxiv.org/abs/2606.31002) [V]
- CriticLean (Peng et al., 2025): trains critic models (CriticLeanGPT) to judge whether a Lean 4 formalization keeps the semantic intent; introduces CriticLeanBench; critics beat strong open and closed baselines. — [arXiv:2507.06181](https://arxiv.org/abs/2507.06181) [V]
- FormalAlign (2024): automated alignment evaluation; evaluation takes under 2 minutes vs about 3 hours of expert review; reports that plain LLM-as-judge had the lowest precision among compared methods. — [arXiv:2410.10135](https://arxiv.org/abs/2410.10135) [V via search summary]
- "Faults in Our Formal Benchmarking" (Ammanamanchi, Bhat, Biderman, June 2026): audit of five Lean benchmarks found 4,833 findings, 398 mechanically certified (counterexamples, vacuous theorems, unsound axioms). Semantic defects: missing hypotheses, problem simplification, incomplete or wrong translations, Lean-specific hazards. Defects both inflate and deflate prover scores. Proposes checkers and audit prompts. — [arXiv:2606.29493](https://arxiv.org/abs/2606.29493) [V]
- ReForm (2025): reflective autoformalization with semantic self-checks. — [arXiv:2510.24592](https://arxiv.org/abs/2510.24592) [V, title]
- Wu et al. 2022, "Autoformalization with Large Language Models": Codex formalized 25.3% of MATH competition problems perfectly into Isabelle [M]. — [arXiv:2205.12615](https://arxiv.org/abs/2205.12615) [M]
- Lean Workbook: pipeline filters candidates by compile check plus back-translation and an NLI-style consistency check [M]. — [arXiv:2406.03847](https://arxiv.org/abs/2406.03847) [M]
- ProofNet benchmark. — [arXiv:2302.12433](https://arxiv.org/abs/2302.12433) [M]

### Inferences

#### U17. Faithfulness gate for autoformalized statements — autoformalization
- Practice: Pipelines generate many Lean statements per informal problem, keep those that compile, then judge semantic match with an LLM (Lean Workbook, CriticLean, Kimina-style pipelines).
- Pain: Judge cost dominates when building corpora of 10^5-10^7 statements. Compile rate over-states quality by up to 29 points [V].
- Jev fit: Verifier. State = informal statement + Lean statement. Noul: "Does the formal statement say the same thing as the informal one?"
- Why cheap/fast: 10 M pairs × 600 tokens ≈ $240. Every candidate can be judged, not a sample.
- Evidence: 89.7% human agreement for a two-judge consensus [V]; CriticLean shows trained critics help [V]; FormalAlign reports low precision for naive LLM judging [V].
- Rating: **Strong as a first-pass screen, Medium as final arbiter.** Risk: multi-hop (quantifier order, implicit coercions), unverified Lean fluency.

#### U18. Decomposed faithfulness checklist with static hazards — autoformalization
- Practice: Audits list recurring defect classes: missing hypothesis, weakened conclusion, answer leaked into statement, ℕ truncated subtraction, division by zero conventions, wrong domain [V: Faults paper].
- Pain: One global "is it faithful?" judgment hides which defect applies.
- Jev fit: Clause-by-clause compliance check. Code detects hazards by static analysis (ℕ subtraction present, division present, `sorry`, axioms) and adds them to state as named facts. Jev answers 8-12 parallel Nouls: "Is every informal hypothesis present?", "Is the quantifier order the same?", "Do variable domains match?", "Does the statement contain the answer it should ask for?"
- Why cheap/fast: All questions ride on one state in one request.
- Evidence: Defect taxonomy and audit prompts in [Faults in Our Formal Benchmarking](https://arxiv.org/abs/2606.29493) [V]. Elaboration feedback is the largest validity lever but does not remove semantic drift [V: Beyond Compilation].
- Rating: **Strong-Medium.** Risk: quantifier-order questions are multi-hop; needs testing.

#### U19. Back-translation compare (English vs English) — autoformalization
- Practice: Informalize the Lean statement with an LLM, then compare the two English statements (Lean Workbook [M]).
- Pain: The compare step runs on every candidate.
- Jev fit: Entity / record alignment. State = original and back-translated statement. Score: same / formal is stronger / formal is weaker / different.
- Why cheap/fast: Same as U17, and it avoids the formal-syntax fluency risk.
- Evidence: Lean Workbook pipeline [M]; NLI is a mature classifier task.
- Rating: **Strong.** Risk: back-translation can hide errors (it may "repair" the statement in English). Pair with U18.

#### U20. Select among k candidate formalizations — autoformalization
- Practice: Sample k formalizations, keep one by self-consistency or judge score.
- Pain: k × judge cost.
- Jev fit: Select, do not generate. Score each candidate (U17), pick the top; ties go to a reasoning model.
- Why cheap/fast: k = 16 costs $0.0004.
- Evidence: Candidate selection by symbolic equivalence and semantic consistency [M: arXiv:2410.20936]; [FormalEvolve](https://arxiv.org/abs/2603.19828) [V, title].
- Rating: **Medium.**

#### U21. Benchmark and corpus audit at scale — autoformalization
- Practice: Manual audits of miniF2F, ProofNet, PutnamBench and synthetic corpora.
- Pain: 4,833 findings in five benchmarks show audits are needed and costly [V].
- Jev fit: Screening at scale. Choice of defect class per item, plus U18 checklist. Low-confidence items go to a human.
- Why cheap/fast: Whole corpora re-audited on every Mathlib bump for a few dollars.
- Evidence: [Faults in Our Formal Benchmarking](https://arxiv.org/abs/2606.29493) [V].
- Rating: **Strong.** Recoverable errors, closed answer set, real volume.

#### U22. Blueprint drift check — formalization projects
- Practice: Large Lean projects (blueprint tool, used by PFR, FLT, sphere eversion [M]) keep an informal LaTeX statement next to each Lean declaration.
- Pain: The two drift apart as the Lean side is refactored. Nobody re-reads hundreds of nodes.
- Jev fit: Entity alignment in CI. Noul per node: "Does the LaTeX statement still match the Lean statement?"
- Why cheap/fast: A 1,000-node blueprint costs about $0.04 per CI run.
- Evidence: Same judge evidence as U17. No blueprint-specific study found.
- Rating: **Medium-Strong.** Risk: research-level statements are long and definition-heavy.

#### U23. Informal-step to formal-step alignment — proof autoformalization
- Practice: Proof autoformalization maps each informal step to a `have` or tactic block.
- Pain: Models "game" the task by proving something easier; robustness is poor.
- Jev fit: Verifier. Noul per pair: "Does this `have` state what informal step k claims?"
- Why cheap/fast: One request per proof.
- Evidence: [Evaluating the Robustness of Proof Autoformalization in Lean 4](https://www.alphaxiv.org/abs/2606.14867) [V, title]; [Do LLMs Game Formalization?](https://arxiv.org/abs/2604.19459) [V, title].
- Rating: **Medium.** Risk: formal-syntax fluency.

### Gaps
- CriticLeanBench accuracy numbers were not on the abstract page; not reported here.
- The Lean Workbook pipeline details and arXiv:2410.20936 are from memory.
- No evidence on small non-generative classifiers as alignment judges.

---

## KQ6. SAT/SMT/MIP algorithm selection and configuration: where is the input textual?

### Takeaway
Algorithm selection is a one-shot Choice per instance with seconds-to-hours at stake, so latency is not the issue. The issue is input: classical selectors use numeric features. New 2025-2026 work shows text adds signal: SMT benchmark descriptions, high-level model text, and algorithm documentation. Per-node branching is out of reach.

### Cited Findings
- MachSMT (Scott, Niemetz, Preiner, Nejati, Ganesh, TACAS 2021): supports all of SMT-LIB; learns empirical hardness models and pairwise ranking on syntactic features; up to 198.4% PAR-2 improvement over competition winners in some logics (SMT-COMP 2019/2020 data). — [Springer](https://link.springer.com/chapter/10.1007/978-3-030-72013-1_16) [V]; journal version [STTT 2023](https://link.springer.com/article/10.1007/s10009-023-00696-0) [V]
- SMT-Select (Lu et al., 2026): adds embeddings of natural-language benchmark descriptions to syntactic features. On SMT-COMP 2024 data across 9 logics, description features improve 7 logics. — [Learning SMT Algorithm Selection with High-Level Natural-Language Descriptions](https://link.springer.com/chapter/10.1007/978-3-032-21540-6_23) [V via search summary]; follow-up [Learning Unified Graph and Language Representations for SMT Algorithm Selection, CP 2026](https://drops.dagstuhl.de/entities/document/10.4230/LIPIcs.CP.2026.41) [V, title]
- LLM hidden-layer representations of combinatorial optimization instances predict as well as traditional features for algorithm selection; direct feature querying is only moderate. — [Behavior and Representation in LLMs for Combinatorial Optimization](https://arxiv.org/abs/2512.13374) [V]
- LLMs embed algorithm source code and documentation for selection. — [LLM-Enhanced Algorithm Selection, Wu et al.](https://arxiv.org/abs/2311.13184) [V]
- [Algorithm Selection with Zero Domain Knowledge via Text Embeddings](https://arxiv.org/abs/2604.19753) [V, title]; [GRIMIP: Instance-Specific Configuration of MIP Solvers Using LLMs](https://arxiv.org/abs/2606.23299) [V, title]; [Synthesizing Feature Extractors: An Agentic Approach for Algorithm Selection](https://arxiv.org/abs/2608.17170) [V, title]
- Foundations [M]: Rice 1976, "The algorithm selection problem", Advances in Computers 15; SATzilla (Xu, Hutter, Hoos, Leyton-Brown, JAIR 2008); Khalil et al., "Learning to Branch in MIP", AAAI 2016; Gasse et al. 2019, [arXiv:1906.01629](https://arxiv.org/abs/1906.01629); Bengio, Lodi, Prouvost, [arXiv:1811.06128](https://arxiv.org/abs/1811.06128); NeuroSAT [arXiv:1802.03685](https://arxiv.org/abs/1802.03685); FastSMT (Balunović, Bielik, Vechev, NeurIPS 2018).

### Inferences

#### U24. SMT solver selection from benchmark descriptions — SMT
- Practice: Portfolios and MachSMT rank solvers (Z3, cvc5, Bitwuzla, Yices) per formula from syntactic features.
- Pain: Syntactic features miss where a formula comes from (symbolic execution, hardware BMC, termination), which predicts solver behaviour.
- Jev fit: Select among algorithms. State = SMT-LIB header (`:source`, `:category`, logic) + code-computed buckets (size, quantifier share, theory mix). Choice over solvers, or per-solver Noul "solves within timeout?"; feed probabilities into MachSMT-style models.
- Why cheap/fast: Selection overhead must be tiny against 1-1,200 s timeouts; one 100 ms call is.
- Evidence: SMT-Select: descriptions help in 7 of 9 logics [V]. MachSMT [V].
- Rating: **Medium.** Risk: evidence uses trained embeddings, not zero-shot choice. Many production formulas have no description.

#### U25. Instance-family tagging as features for portfolios — SAT/SMT/MIP
- Practice: SAT Competition tracks and SATzilla-style portfolios know that family (crypto, BMC, planning, scheduling) drives solver choice [M].
- Pain: Family labels are missing on user instances. File names, comments, variable names, and generator metadata hold the signal, but keyword rules are brittle.
- Jev fit: Feature extractor. State = file header comments, variable-name sample, source description. Choice over 10-20 families. Output probabilities become features for a classical selector.
- Why cheap/fast: Runs on every job in a solver farm.
- Evidence: LLM representations match hand features for selection [V: 2512.13374]. Text-embedding selection [V, title: 2604.19753].
- Rating: **Medium.** Risk: raw CNF has no text; usage only works where metadata or a high-level model exists.

#### U26. Preset configuration choice per instance — MIP/SAT/SMT
- Practice: Solver vendors ship presets (emphasis on feasibility, bound, numerics). Automated configurators (SMAC, irace) tune per distribution [M].
- Pain: Per-instance tuning is too slow; users leave defaults.
- Jev fit: Select among algorithms. State = model description (AMPL/MiniZinc/JuMP source or docs) + code-computed buckets. Choice over named presets, each with a text description.
- Why cheap/fast: One call per instance.
- Evidence: GRIMIP [V, title]; LLM-enhanced algorithm representation [V].
- Rating: **Speculative-Medium.** Risk: numeric structure (coefficient ranges, degeneracy) drives MIP behaviour. Overlaps with the OR researcher's scope; keep brief.

### Gaps
- I could not open the SMT-Select paper (Springer login). Numbers are from the search summary only.
- SAT-encoding selection from problem descriptions (I recall Ulrich-Oltean, Nightingale, Walker, Constraints 2023) was not verified. Left out as a usage.
- No evidence found for zero-shot text classifiers beating trained selectors on any SAT/SMT benchmark.

---

## KQ7. Computer algebra heuristics

### Takeaway
CAS heuristic choice is an active ML topic with closed answer sets, which suits Jev's shape. But the inputs are polynomials and expression trees, and the published winners are models trained on those structures. Jev fits best where the decision depends on recognizable expression form (integrand class, problem type) and worst where it depends on degrees and counts (CAD, Gröbner).

### Cited Findings
- Huang, England, Wilson, Davenport, Paulson (CICM 2014): an SVM picks among three human heuristics for CAD variable ordering. — [arXiv:1404.6369](https://arxiv.org/abs/1404.6369) [V]
- England & Florescu (CICM 2019): ML picks the ordering directly; compares several model types. — [arXiv:1904.11061](https://arxiv.org/abs/1904.11061) [V]
- Pickering, del Río, England et al.: explainable-AI analysis of the CAD ordering models yields a new human-readable heuristic. — [J. Symbolic Computation 2024](https://www.sciencedirect.com/science/article/pii/S0747717123000901) [V, title]
- Jing, Zhao, Chen (2026): pre-train a Transformer on related tasks with cheap labels, fine-tune for CAD ordering; predictions are "significantly better than those suggested by the best heuristic methods". — [arXiv:2601.13731](https://arxiv.org/abs/2601.13731) [V]
- Survey: [Recent Developments in Real Quantifier Elimination and CAD](https://arxiv.org/abs/2407.19781) [V, title]
- Barket, England, Gerhard (ICMS 2024): ML selects Maple's symbolic-integration sub-algorithm. A TreeLSTM beats an LSTM and beats Maple's current meta-algorithm. — [arXiv:2404.14973](https://arxiv.org/abs/2404.14973) [V]; follow-up [Tree-Based Deep Learning for Ranking Symbolic Integration Algorithms](https://arxiv.org/abs/2508.06383) [V, title]
- Equality saturation: [Machine Learning Guided Equality Saturation, EGRAPHS 2025](https://pldi25.sigplan.org/details/egraphs-2025-papers/6/Machine-Learning-Guided-Equality-Saturation) [V]; ASPEN uses an LLM agent to pick a relevant subset of rewrite rules before running egglog — [ASPEN, MLCAD 2025](https://www.csl.cornell.edu/~zhiruz/pdfs/aspen-mlcad2025.pdf) [V]; [Aurora: RL + equality saturation](https://arxiv.org/abs/2407.12794) [V]; [Sketch-Guided Equality Saturation](https://arxiv.org/abs/2111.13040) cuts e-graphs from 10^6 to 10^4 e-nodes [V].
- Gröbner bases: [Letting Homogeneity Entropy Select S-Pairs in Buchberger's Algorithm](https://arxiv.org/abs/2606.07321) [V, title]; Peifer, Stillman, Halpern-Leistner, "Learning selection strategies in Buchberger's algorithm", ICML 2020, [arXiv:2005.01917](https://arxiv.org/abs/2005.01917) [M].
- Contrast: Lample & Charton 2020 generate antiderivatives with a seq2seq model. That is generation, outside Jev's envelope. — [arXiv:1912.01412](https://arxiv.org/abs/1912.01412) [M]

### Inferences

#### U27. Integration method selection — symbolic computation
- Practice: Maple's `int` tries sub-algorithms in a fixed order (Risch, Trager, MeijerG, derivative-divides, and others).
- Pain: Wrong order wastes time and gives longer answers. The meta-algorithm is hand-tuned.
- Jev fit: Select among algorithms. State = integrand as text plus code-computed tags (rational, algebraic, has special functions). Choice over the method list, each described in words.
- Why cheap/fast: 100 ms is small against failed attempts that take seconds.
- Evidence: TreeLSTM beats Maple's meta-algorithm [V]. It is trained on expression trees; Jev is not.
- Rating: **Speculative-Medium.** Risk: expression fluency unverified; long expressions hurt.

#### U28. Problem-type routing to a CAS command — symbolic computation
- Practice: CAS front ends classify input (ODE type, recurrence, sum, limit, inequality). Maple's `odeadvisor` classifies ODEs by algorithm [M].
- Pain: Users and LLM agents write problems in LaTeX or prose. Routing to the right command and options is brittle.
- Jev fit: Triage / router. State = the user's problem text. Choice: {separable ODE, linear ODE, Bernoulli, exact, Riccati, none}; or command family {solve, dsolve, rsolve, sum, limit, QE}.
- Why cheap/fast: Every agent tool call can be routed for $0.00001.
- Evidence: Classification by form is what `odeadvisor` does by rule [M]. No LLM study verified.
- Rating: **Medium.** Risk: exact class tests (e.g. exactness) are computations; code must confirm.

#### U29. Rule-group selection for equality saturation — term rewriting
- Practice: egg/egglog users choose rule sets by hand; e-graphs blow up with associativity and commutativity rules.
- Pain: Resource exhaustion; hand-tuned schedules.
- Jev fit: Heuristic in search loop (outer). One Noul per rule group: "Is this group relevant to this expression?" Code runs saturation with the chosen groups.
- Why cheap/fast: One request per optimization run.
- Evidence: ASPEN's LLM rule-selection agent [V]; ML-guided equality saturation [V].
- Rating: **Speculative-Medium.**

#### U30. CAD ordering heuristic choice from code-computed features — real algebraic geometry
- Practice: Pick among Brown, sotd, ndrr, gmods heuristics, or pick the ordering directly (Huang 2014; England & Florescu 2019).
- Pain: A bad ordering can change runtime from seconds to timeouts (doubly exponential worst case).
- Jev fit: Choice over heuristics with features passed as named buckets.
- Why cheap/fast: Irrelevant; a small trained model is cheaper still.
- Evidence: SVMs and transformers trained on features or polynomials work [V].
- Rating: **Speculative, near Poor.** Risk: numeric. The decision rests on degrees and counts. A trained classical model on the same features is the right tool. Listed for completeness.

### Gaps
- No study found of text classifiers or zero-shot LLMs for CAS heuristic choice. All evidence uses trained structural models.
- Side-condition checks on simplification steps (branch cuts, x > 0 assumptions) look like a Noul, but I found no evidence this session. Not listed as a usage.
- Maple `odeadvisor` reference is from memory.

---

## KQ8. Conjecture generation and filtering; library search and duplicates

### Takeaway
Generators (Graffiti, Ramanujan Machine, FunSearch, AlphaEvolve, LeanConjecturer, Lemmanaid) produce far more candidates than people can read. Truth tests are numeric and belong to code. The open gap is semantic: "is this already known?" and "is this interesting?". Current novelty filters catch only syntactic duplicates.

### Cited Findings
- MathlibLemma: its novelty filter rejects only duplicate declarations and statements that default `aesop` solves; it "cannot detect semantic restatements of existing lemmas". — [MathlibLemma, arXiv:2602.02561](https://pith.science/paper/2602.02561) [V via search summary]
- AXLE's merge tool detects duplicate declarations by α-equivalence of types, optionally definitional equality. — [AXLE](https://arxiv.org/abs/2606.26442) [V via search summary]
- Fermat (NeurIPS 2025 spotlight): RL environment for theory formation; learns an interestingness measure with an LLM-based evolutionary method. — [Learning Interestingness in Automated Mathematical Theory Formation](https://arxiv.org/abs/2511.14778) [V]
- A 2026 LLM framework scores candidate conjectures on foundationality, novelty, and significance, then checks Lean syntax, "library-level absorption", and automatic triviality. — [arXiv:2607.28632](https://arxiv.org/abs/2607.28632) [V via search summary]
- OpenConjecture uses LLMs to estimate tractability and interest of conjectures mined from papers. — [OpenConjecture blog](https://davisrbrown.com/blog/openconjecture) [V via search summary]
- [LeanConjecturer](https://arxiv.org/abs/2506.22005) [V, title]; [Lemmanaid](https://arxiv.org/abs/2504.04942) [V, title]; [Conjecturing: An Overlooked Step in Formal Mathematical Reasoning](https://arxiv.org/abs/2510.11986) [V, title]; [Formal Conjectures benchmark](https://arxiv.org/abs/2605.13171) [V, title]
- "Maintaining a Library of Formal Mathematics" (van Doorn, Ebner, Lewis, 2020) describes Mathlib linters and upkeep. — [arXiv:2004.03673](https://arxiv.org/abs/2004.03673) [V, title]
- Foundations [M]: Fajtlowicz's Graffiti (1988); Ramanujan Machine (Raayoni et al., Nature 2021); FunSearch (Romera-Paredes et al., Nature 2024); AlphaEvolve (2025, arXiv:2506.13131); Davies et al., Nature 2021.

### Inferences

#### U31. Known-ness and restatement filter for generated conjectures — automated conjecturing
- Practice: Generate, test on examples, drop syntactic duplicates, drop what automation proves (Graffiti's Dalmatian heuristic [M]; LeanConjecturer; MathlibLemma).
- Pain: Semantic restatements of library lemmas pass the filter [V] and waste prover and human time.
- Jev fit: Entity alignment. Code retrieves top-k library lemmas per conjecture. Noul per pair: "Is the conjecture a restatement or direct special case of this lemma?"
- Why cheap/fast: 10^6 conjectures × 20 pairs × 300 tokens ≈ $240.
- Evidence: Gap stated in MathlibLemma [V]; "library-level absorption" check in 2607.28632 [V].
- Rating: **Strong-Medium.** Risk: "direct special case" can be multi-hop; formal-syntax fluency.

#### U32. Interestingness score for conjectures and lemmas — automated conjecturing
- Practice: Hand-made interestingness measures (Colton's HR, Graffiti) and learned ones (Fermat).
- Pain: Humans can read tens, generators give millions.
- Jev fit: Feature extractor. Parallel Scores on rubric axes: generality, surprise, links two areas, likely useful as a lemma. Code combines with numeric evidence.
- Why cheap/fast: Ranking a million candidates costs tens of dollars.
- Evidence: Fermat [V]; OpenConjecture [V]; 2607.28632 [V].
- Rating: **Speculative-Medium.** Risk: subjective target; no ground truth. Use for ranking, not acceptance.

#### U33. OEIS match adjudication — experimental mathematics
- Practice: Compute terms, look up in OEIS, read the hits by hand.
- Pain: Short sequences match many entries. Batch pipelines (conjecture generators, program synthesis on sequences) cannot read hits.
- Jev fit: Select, do not generate. Code does the exact numeric lookup. State = the object's description + each hit's OEIS name and comments. Score: same object / plausibly related / coincidence.
- Why cheap/fast: Thousands of lookups per run.
- Evidence: OEIS-based program synthesis (Gauthier & Urban [M: arXiv:2202.11908]). No study of LLM adjudication of OEIS hits found.
- Rating: **Medium.** Risk: none numeric if code owns term matching.

#### U34. Semantic duplicate detection for new library declarations — library hygiene
- Practice: Mathlib review plus syntactic duplicate checks (α-equivalence in AXLE [V]).
- Pain: The same fact lands twice with different variable order, implicit arguments, or phrasing. Reviewers catch it by memory.
- Jev fit: Entity alignment in CI. For each new declaration, code retrieves top-k similar. Score: identical / one generalizes the other / different.
- Why cheap/fast: Runs on every PR for well under a cent.
- Evidence: Limits of syntactic filters [V]. Semantic search recall 0.913@10 means the true duplicate is usually in the top 10 [V: LeanSearch].
- Rating: **Strong-Medium.** Risk: generality differences hide in typeclass assumptions.

#### U35. Candidate-program family tagging in evolutionary search — program-search mathematics
- Practice: FunSearch and AlphaEvolve keep a program database with islands for diversity; an LLM mutates; code evaluates [M].
- Pain: Populations collapse to variants of one idea.
- Jev fit: Feature extractor. Choice: idea family of each program (greedy, local search, algebraic construction, symmetry-based). Noul: "Is this a trivial variant of its parent?" Code uses tags for diversity quotas.
- Why cheap/fast: Millions of candidates per run.
- Evidence: None direct. FunSearch/AlphaEvolve papers describe the database design [M].
- Rating: **Speculative.** Risk: reads code, not mathematics; fluency unverified.

### Gaps
- No benchmark found for semantic duplicate detection in Mathlib.
- I did not verify FunSearch/AlphaEvolve internals this session.

---

## KQ9. Proof engineering: errors, repair triage, lint, reviewer routing

### Takeaway
This is the most conventional fit: text in, labels out, high volume, recoverable errors. Mathlib already automates area labels and reviewer suggestions by rule and reports a backlog of about 300 PRs. Jev fits routing, labelling, and semantic lint. It does not fit judging merge-readiness, where even LLM agents fail.

### Cited Findings
- "Growing Mathlib" (2025): each new PR gets an automatic area label; a file of reviewers' interests drives automatic reviewer suggestions with capacity; a custom dashboard groups PRs by status; about 300 PRs wait in backlog with median wait about two weeks; a triage team exists. — [arXiv:2508.21593](https://arxiv.org/abs/2508.21593) [V]; [queueboard](https://github.com/leanprover-community/queueboard) [V]; [dashboard](https://leanprover-community.github.io/queueboard/) [V]
- MathlibPR (May 2026): benchmark from real Mathlib4 PR histories. "Both LLM models and LLM agents struggle to distinguish merge-ready PRs from build-passing PRs." Tested DeepSeek, Qwen, Goedel, Kimina, Codex, Claude Code. — [arXiv:2605.07147](https://arxiv.org/abs/2605.07147) [V]
- APRIL (Feb 2026): 260,000 tuples of failed Lean proof + compiler diagnostics + repair + explanation. A fine-tuned 4B model beats the strongest open baseline at single-shot repair. — [Learning to Repair Lean Proofs from Compiler Feedback](https://arxiv.org/abs/2602.02990) [V]
- Error taxonomies for LLM Lean output include library/API grounding errors (hallucinated or renamed lemmas) and formal-representation errors (type mismatch, coercion, missing typeclass). — search summary over [CAM-Bench](https://arxiv.org/abs/2605.17255) and related [V via search summary; exact source paper not confirmed]
- Baldur: LLM whole-proof generation and repair for Isabelle. — [arXiv:2303.04910](https://arxiv.org/abs/2303.04910) [M]

### Inferences

#### U36. Error-message classification and repair routing — proof engineering
- Practice: Repair loops feed the raw compiler error back to an LLM (APRIL, MA-LoT, Baldur).
- Pain: Every failure costs a full LLM call, though many have a fixed fix (renamed lemma, deprecated syntax, heartbeat limit, missing import).
- Jev fit: Triage / router. State = error text + failing line. Choice: {unknown identifier / renamed, type mismatch / coercion, missing instance, timeout, unsolved goals, syntax / deprecation, universe, other}. Each class maps to a fixed tool: rename table, `exact?`, import fixer, LLM.
- Why cheap/fast: A Mathlib bump can break thousands of downstream lines. Classifying all costs cents and runs in CI time.
- Evidence: APRIL shows compiler feedback carries enough signal for a 4B model [V]. Error taxonomies exist [V].
- Rating: **Strong.** Risk: low. Regex handles the easy half; Jev handles the rest.

#### U37. Mathlib PR triage and reviewer routing — proof engineering
- Practice: Rule-based area labels from file paths; reviewer suggestions from an expertise file; human triage team [V].
- Pain: About 300 PRs in backlog; median wait about two weeks [V]. Path-based labels miss content (a PR in `Analysis/` that is really measure theory).
- Jev fit: Triage / router. State = PR title, description, diff summary. Parallel questions: Choice of area; Noul "easy review?"; Noul "touches core API?"; Noul "description explains motivation?"; Choice of best-matching reviewer profile.
- Why cheap/fast: Re-run on every push; cost is negligible.
- Evidence: Growing Mathlib [V]. MathlibPR shows merge-readiness judging fails [V], so keep Jev on routing only.
- Rating: **Strong for routing, Poor for merge-readiness.**

#### U38. Semantic lint: docstring, name, and file placement — proof engineering
- Practice: Mathlib linters check syntax-level rules. Naming and style guides are prose ([naming](https://leanprover-community.github.io/contribute/naming.html), [style](https://leanprover-community.github.io/contribute/style.html)) [M]. Reviewers enforce the rest.
- Pain: Reviewer time goes to "docstring does not match statement" and "name does not follow convention".
- Jev fit: Semantic predicate in a rule engine. Nouls: "Does the docstring describe this statement?", "Does the name follow the convention given the conclusion?", "Does this lemma belong in this file's topic?"
- Why cheap/fast: Every declaration in every PR.
- Evidence: Linter practice in [Maintaining a Library of Formal Mathematics](https://arxiv.org/abs/2004.03673) [V, title] and Growing Mathlib [V]. No LLM-lint study found.
- Rating: **Medium.** Risk: naming rules are partly algorithmic; code should do that part.

### Gaps
- MathlibPR's numeric results were not in the abstract.
- No published evaluation of error-class routing (as opposed to end-to-end repair) was found.

---

## Cross-cutting: Top 5, Poor fits, New roles

### Takeaway
Jev's best uses in this subtopic sit around the prover, not inside its inner loop: faithfulness screening, corpus audits, library search and duplicates, repair routing, premise reranking. The "heuristic inside a search loop" idea holds for coarse loops (one call per goal or per problem) and fails for fine loops (per clause, per branch node).

### Cited Findings
- All evidence is cited in the sections above. Key anchors: [Beyond Compilation](https://arxiv.org/abs/2606.31002), [Faults in Our Formal Benchmarking](https://arxiv.org/abs/2606.29493), [Magnushammer](https://arxiv.org/abs/2303.04488), [ProcessBench](https://arxiv.org/abs/2412.06559), [ENIGMA-NG](https://arxiv.org/abs/1903.03182), [Growing Mathlib](https://arxiv.org/abs/2508.21593), [MathlibPR](https://arxiv.org/abs/2605.07147).

### Inferences

**Top 5 by likely value**
1. **U17 + U18 + U19 Faithfulness screening for autoformalization.** Biggest current bottleneck in AI-for-math data; volume is 10^5-10^7 pairs; LLM judges already reach ~90% human agreement; errors are recoverable by escalation.
2. **U21 Benchmark and corpus audit.** 4,833 findings in five benchmarks prove the need; pure screening at scale; closed defect taxonomy exists.
3. **U36 Error-message classification and repair routing.** Classic triage; cuts LLM repair calls; low risk.
4. **U2 + U34 + U31 Library search rerank, semantic duplicates, known-ness filter.** One alignment primitive serves three jobs; syntactic tools provably miss semantic restatements.
5. **U1 Hammer premise reranker.** Direct test of the "heuristic in a search loop" idea; fits hammer time budgets; strongest published precedent (Magnushammer's rerank stage). Value depends on a head-to-head test against trained selectors.

Honourable mention: **U37 Mathlib PR triage and reviewer routing** (real backlog, simple integration) and **U12 hybrid PRM** (follows the brief's "code owns numerics" rule).

**Poor fits**
- **Given-clause selection in E or Vampire.** Budgets are µs-ms per clause. Purpose-built neural guidance already cuts E to 6-7% of baseline speed. Jev at 10-100 ms and 20 requests/s is orders of magnitude too slow.
- **Per-node branching in MIP or SAT (Khalil 2016; Gasse 2019; NeuroSAT).** Inputs are numeric LP and graph features; decisions run thousands of times per second.
- **S-pair selection in Buchberger; Gröbner monomial ordering.** Microsecond loop, numeric structure.
- **CAD variable ordering on raw polynomials (U30).** Decision rests on degrees and counts; trained classical models already win.
- **Tactic policy for frontier provers.** GPT-f, HTPS, ReProver, AlphaProof, DeepSeek-Prover, Kimina, Seed-Prover generate free-form tactics with arguments or whole proofs. Jev cannot generate.
- **Final proof-correctness verdicts.** Lean's kernel is exact and cheap. Never replace a formal check with a probability. For informal proofs, ProcessBench shows small verifiers fail on olympiad-level steps.
- **Arithmetic-heavy step checks.** "Is 17 × 23 = 391?" belongs to code.
- **Equivalence oracle for formal statements.** Papers say even frontier judges are not one. Use Jev to screen, then use a prover-based equivalence check (e.g. BEq-style [M]) or a human for the rest.
- **Merge-readiness of Mathlib PRs.** LLM agents already fail this (MathlibPR).
- **Counterexample finding, truth of conjectures, numeric conjecture testing.** Code (Nitpick, Quickcheck, `plausible`, high-precision arithmetic) owns this.
- **Hardness or runtime prediction from raw CNF/SMT.** Numeric; empirical hardness models on computed features are the right tool.

**New roles missing from the catalogue**
- **Algorithm selector (per-instance portfolio choice).** Rice 1976 framing. Choose a solver, strategy, preset, decision procedure, or integration method from a closed portfolio before an expensive run. Distinct from "heuristic inside a search loop" because it is one shot, outside the loop, and the payoff is runtime, not pruning. Covers U5, U10, U24, U26, U27.
- **Slow-path advisor in a fast/slow pair.** A fast native heuristic runs the inner loop. Jev runs rarely (per problem or every few seconds) and re-weights the fast heuristic. Templates: NeuroCore's periodic refocusing and ENIGMA's fast/slow split. Covers U3.
- **Generator-output gate (novelty / known-ness filter).** Sits after a generator (conjecturer, autoformalizer, evolutionary search) and before an expensive evaluator. Drops duplicates, restatements, and trivial items. Close to "screening at scale" but placed inside a generate-test loop. Covers U20, U31, U35.
- **Compute-budget router.** Predict difficulty class to set search budget and prover tier. Covers U9.

### Gaps
- Nobody has published a test of a calibrated, non-generative, general-purpose classifier on any task in this subtopic. Every rating above is an inference from results with trained or generative models.
- Suggested first experiments, cheapest first: (1) ProcessBench and PRMBench F1; (2) agreement with human labels on CriticLeanBench or the "Beyond Compilation" set; (3) rerank stage swap-in on a LeanHammer or Magnushammer-style pipeline; (4) error-class routing accuracy on APRIL.
- Jev's fluency with Lean 4, Isabelle, TPTP, and SMT-LIB syntax is unverified. Usages that avoid formal syntax (U19, U16, U15, U37) carry less risk.
