# Cross-cutting theory and architectures for a System One classifier (Jev)

Scope: theory, published evidence, limits, and latency/cost budgets behind each role in the brief's pattern catalogue. Current to September 2026.

**How to read the source flags**

- **[V]** = checked this session (search or fetch of the paper, its abstract, or a named summary of it).
- **[M]** = cited from memory. The URL is the standard location, but I did not re-fetch it this session. Re-check any [M] number before it goes into the final report.
- "Inference" items are my reasoning, not published claims.

---

## 1. Dual-process framing: what do hybrid fast-judge plus slow-reasoner systems gain?

### Takeaway
The dual-process idea is well grounded in psychology and has a clear AI lineage (SOFAI, SwiftSage, Talker-Reasoner, System-1.x). Published hybrids report equal or better quality at lower time and cost, but most give few hard numbers, and the gain depends on a good controller that knows when the fast path is enough.

### Cited Findings
- Kahneman (2011) popularised System 1 (fast, automatic) and System 2 (slow, deliberate). Evans & Stanovich (2013) give the careful version: Type 1 processes are autonomous and do not need working memory; Type 2 processes need working memory and support hypothetical thinking. [M] — [Evans & Stanovich 2013, Perspectives on Psychological Science](https://journals.sagepub.com/doi/10.1177/1745691612460685)
- Booch et al. (AAAI 2021) "Thinking Fast and Slow in AI" proposes AI built from fast experience-based solvers, slow deliberate solvers, and a metacognitive controller. [V] — [arXiv 2010.06002](https://arxiv.org/abs/2010.06002); overview in [CACM 2025](https://dl.acm.org/doi/10.1145/3715709)
- SOFAI: S1 solvers are experience-based and data-driven. S2 solvers are deliberate, often symbolic. A metacognitive module picks the solver from solution quality, resources, and past S1 performance. SOFAI-v1 on planning and constrained grid navigation improved on either solver type alone and showed skill learning (S1 used more over time). [V] — [Fast, slow, and metacognitive thinking in AI, npj AI 2025](https://www.nature.com/articles/s44387-025-00027-5); [Fast and Slow Planning, arXiv 2303.04283](https://arxiv.org/pdf/2303.04283)
- SOFAI-LM (Khandelwal, Rossi et al., 2025): a fast LLM with metacognitive feedback, falling back to a large reasoning model (LRM) only when needed, "match or outperform standalone LRMs in accuracy while maintaining significantly lower inference time" on graph colouring and code debugging. Abstract gives no figures. [V] — [arXiv 2508.17959](https://arxiv.org/abs/2508.17959)
- SwiftSage (Lin et al., NeurIPS 2023): a small fine-tuned encoder-decoder (Swift, System 1) plus GPT-4 (Sage, System 2) on 30 ScienceWorld tasks. It "significantly outperforms SayCan, ReAct, and Reflexion" with higher efficiency and lower cost. [V] — [arXiv 2305.17390](https://arxiv.org/abs/2305.17390). Scores I recall from the paper: SwiftSage 84.7 vs SayCan 33.8, ReAct 36.4, Reflexion 45.3. [M — re-check]
- Talker-Reasoner (Google DeepMind, 2024): fast Talker for conversation, slow Reasoner for multi-step planning and tools. Qualitative evaluation only. [V] — [arXiv 2410.08328](https://arxiv.org/abs/2410.08328)
- System-1.x (Saha et al., ICLR 2025): a controller splits a planning problem into sub-goals, classifies each as easy or hard, and sends them to a System-1 or System-2 planner. A user-set factor tunes the mix. [V] — [arXiv 2407.14414](https://arxiv.org/abs/2407.14414)
- Critique: the two-system split is contested in psychology (features such as fast/unconscious/efficient do not always co-occur). [M] — [Melnikoff & Bargh 2018, "The Mythical Number Two", Trends in Cognitive Sciences](https://doi.org/10.1016/j.tics.2018.02.001)

### Inferences
- Design pattern licensed: **fast judge first, slow reasoner on demand, explicit controller in between**. Jev's calibrated confidence can be the controller's main input ("is S1 confident enough?").
- In every published hybrid, the System 1 part *generates* actions. Jev only *selects* from a closed set. So Jev fits as (a) the S1 solver when the action space is closed, and (b) the metacognitive gate that decides whether to wake the slow model.
- The "easy vs hard sub-goal" classifier in System-1.x is exactly a Choice call. That is a concrete, published slot for Jev.
- "System One" is a useful label, not a proof. The report should lean on the engineering evidence (cascades, selective classification), not on the psychology.

### Gaps
- No hybrid paper reports results with a non-generative, calibrated classifier as the S1 part. The closest analogues are routers (section 2) and small fact-checkers (section 5).
- Hard numbers for SOFAI and SOFAI-LM time savings were not in the abstracts I could reach (the npj AI page sits behind a login redirect).

---

## 2. Cascades and routing: reported cost savings at equal quality

### Takeaway
Cheap-first designs are one of the best-evidenced patterns in ML: 50-98% cost cuts at equal quality are reported. Recent theory adds two warnings: cascades pay the cheap model on every item, and learned routers can collapse to "always use the big model". A near-free cheap stage removes the first warning.

### Cited Findings
- Viola & Jones (CVPR 2001): a cascade of boosted classifiers rejects most image windows with very few features, enabling real-time face detection. I recall 15 frames/s on a 700 MHz CPU, 38 stages, about 10 feature evaluations per window on average. [M] — [DOI 10.1109/CVPR.2001.990517](https://doi.org/10.1109/CVPR.2001.990517)
- Early exit: BranchyNet adds side exits so easy inputs leave the network early. DeeBERT reports up to about 40% inference-time savings with small quality loss. [M] — [BranchyNet arXiv 1709.01686](https://arxiv.org/abs/1709.01686); [DeeBERT arXiv 2004.12993](https://arxiv.org/abs/2004.12993)
- FrugalGPT (Chen, Zaharia, Zou 2023): an LLM cascade "can match the performance of the best individual LLM (e.g. GPT-4) with up to 98% cost reduction or improve the accuracy over GPT-4 by 4% with the same cost". [V] — [arXiv 2305.05176](https://arxiv.org/abs/2305.05176)
- RouteLLM (Ong et al., ICLR 2025): routers trained on Chatbot Arena preference data. Matrix-factorisation router keeps 95% of GPT-4 quality on MT-Bench while sending only 14% of queries to GPT-4 (about 85% cost cut). Savings are smaller elsewhere: about 45% on MMLU and 35% on GSM8K. [V] — [arXiv 2406.18665](https://arxiv.org/pdf/2406.18665); [code and summary](https://github.com/lm-sys/routellm)
- AutoMix (Aggarwal, Madaan et al., NeurIPS 2024): few-shot self-verification plus a POMDP router; "reduces computational cost by over 50% for comparable performance". [V] — [arXiv 2310.12963](https://arxiv.org/abs/2310.12963)
- Gupta et al. (ICLR 2024): sequence-level confidence has a length bias; learned deferral rules over token-level uncertainty beat simple aggregation in FLAN-T5 cascades. [V] — [arXiv 2404.10136](https://arxiv.org/abs/2404.10136)
- Bouchard (2026) "Is Escalation Worth It?": the cost-quality frontier of a two-model cascade is piecewise concave; the optimal policy equalises marginal quality per cost across stages. Across MATH, MMLU, TriviaQA, SimpleQA, LiveCodeBench and eight models, a lightweight *pre-generation router* beat cascade policies on four of five datasets. Stated structural weakness: "Cascades pay the cheap model before any escalation decision." [V] — [arXiv 2605.06350](https://arxiv.org/abs/2605.06350)
- Lai & Ye (2026) "When Routing Collapses": as budget rises, routers "systematically default to the most capable and most expensive model even when cheaper models already suffice". Cause: routers predict scalar scores, but routing needs correct *rankings*. Their ranking-based EquiRouter cuts cost about 17% at GPT-4-level quality on RouterBench. [V] — [arXiv 2602.03478](https://arxiv.org/abs/2602.03478)
- Speculative decoding (Leviathan et al. 2023) gives 2-3x faster generation with identical outputs by letting a small model draft and a big model verify. [M] — [arXiv 2211.17192](https://arxiv.org/abs/2211.17192)

### Inferences
- Design pattern licensed: **Jev as stage 0 of every pipeline**. It answers the easy share itself (closed answer space) and routes the rest. It can also act as the *pre-generation router* that Bouchard found stronger than cascades.
- Bouchard's weakness ("pay the cheap model first") nearly vanishes when stage 0 costs $0.00004 and 10-150 ms. The cheap stage is then almost pure gain.
- Savings are workload-specific (85% on MT-Bench vs 35% on GSM8K). The report should quote a range, not one number.
- Failure modes to name: distribution shift breaks learned thresholds; router collapse; and cascade accuracy is capped by the *recall* of the cheap stage on hard cases, because a confident wrong answer never escalates.

### Gaps
- No published cascade uses a typed, non-generative classifier as the first stage for LLM workloads. MiniCheck (section 5) and LOTUS proxies (section 9) are the closest.
- Viola-Jones and DeeBERT numbers are from memory.

---

## 3. Calibration and acting on probabilities: act / escalate / abstain

### Takeaway
Decision theory gives exact rules for turning calibrated probabilities into act / escalate / abstain policies (Chow's reject rule, cost-sensitive Bayes thresholds, selective classification, conformal sets). These rules are only valid if the probabilities are calibrated *on the task at hand*. One third-party test suggests Jev is somewhat overconfident on a hard 77-class task, and that a cheap temperature fix removes most of the error.

### Cited Findings
- Guo et al. (ICML 2017): modern deep networks are miscalibrated (overconfident); a single-parameter temperature scaling fixes most of it. [M] — [arXiv 1706.04599](https://arxiv.org/abs/1706.04599)
- Platt (1999) scaling fits a sigmoid on held-out scores to produce probabilities. [M] — [Platt 1999, Advances in Large Margin Classifiers](https://www.researchgate.net/publication/2594015)
- Proper scoring rules (Brier, log score) are maximised in expectation only by reporting the true probability, so they are the right training and evaluation target for a probability-emitting model. [M] — [Gneiting & Raftery 2007, JASA](https://doi.org/10.1198/016214506000001437)
- Chow (1970): with a fixed cost for rejecting and a cost for errors, the optimal rule is to reject when the top posterior falls below a threshold set by the cost ratio. This gives the optimal error-reject trade-off. [M] — [DOI 10.1109/TIT.1970.1054406](https://doi.org/10.1109/TIT.1970.1054406)
- Cost-sensitive Bayes rule: for a binary action, act when p exceeds C_FP / (C_FP + C_FN). This holds only for calibrated p. [M] — [Elkan 2001, "The Foundations of Cost-Sensitive Learning", IJCAI](https://cseweb.ucsd.edu/~elkan/rescale.pdf)
- Selective classification (Geifman & El-Yaniv, NeurIPS 2017): given any confidence score, pick a threshold with a guaranteed risk level. Result: "2% error in top-5 ImageNet classification can be guaranteed with probability 99.9%, and almost 60% test coverage". [V] — [arXiv 1705.08500](https://arxiv.org/abs/1705.08500)
- Conformal prediction (Vovk et al.; Angelopoulos & Bates 2021): wraps any model to output a *set* of labels that contains the truth with probability at least 1-alpha, with no distributional assumptions beyond exchangeability. Needs a labelled calibration set. [M] — [arXiv 2107.07511](https://arxiv.org/abs/2107.07511)
- Kadavath et al. (2022): large LMs are well calibrated on multiple-choice and true/false questions in the right format; zero-shot P(True) self-evaluation was poorly calibrated but improved with scale; RLHF policies were badly miscalibrated, and temperature T = 2.5 largely fixed it. [V] — [arXiv 2207.05221](https://arxiv.org/pdf/2207.05221)
- Zhao et al. (ICML 2021) "Calibrate Before Use": few-shot LM classifiers carry majority-label, recency, and common-token biases. Contextual calibration with a content-free input ("N/A") raises accuracy by up to 30.0 points absolute and reduces variance across prompts. [V] — [arXiv 2102.09690](https://arxiv.org/abs/2102.09690)
- Chat-tuned LLM probabilities are miscalibrated but still predict correctness on multiple choice. [V, title and abstract only] — [arXiv 2402.13213](https://arxiv.org/pdf/2402.13213)
- Jev-specific, third-party blog, benchmark author unnamed: on Banking77 (77 intents) Jev zero-shot scored 80.1% accuracy with 88% mean confidence (overconfident by about 8 points); "temperature scaling cut the calibration error by roughly two-thirds". [V, low-reliability source] — [MindStudio blog](https://www.mindstudio.ai/blog/jev-vs-classic-classifiers-benchmark)

### Inferences
- Policy template the report can state:
  - **Act** when p clears the cost-derived threshold C_FP / (C_FP + C_FN).
  - **Escalate** (to a person or a reasoning model) when the top probability sits in the reject band (Chow), or when the conformal set has more than one label.
  - **Abstain / log** when even escalation is not worth its cost.
- "Trained to be calibrated" is a global property. Calibration on a specific domain prompt must be **measured on a small labelled set** (reliability diagram, ECE, Brier) and, if needed, fixed with one temperature parameter per question. This costs a few hundred labels, not a fine-tune.
- Selective classification turns a moderate classifier into a high-precision one on a subset. Geifman's result (2% error at 60% coverage) is the template claim: "Jev handles X% of cases at error rate Y with guarantee Z; the rest escalate."
- Conformal sets fit Choice and Score directly. For Score, an ordinal conformal set ("level 3 or 4") is a natural output for risk ranking.
- Limits: guarantees break under distribution shift; conformal coverage is marginal (not per-class) unless designed otherwise; calibration says nothing about adversarial inputs.

### Gaps
- No peer-reviewed evaluation of Jev's calibration exists that I could find. The only number is from an unnamed benchmark quoted in a vendor-adjacent blog.
- No public description of RLCD training was found; I cannot say which scoring rule it optimises.

---

## 4. Weak supervision, features, active learning, distillation

### Takeaway
A prompted model used as many noisy labelling functions, then denoised and distilled into a small classical model, is a published, working recipe. Jev fits it unusually well: many parallel closed questions per item, probabilities out, near-zero cost.

### Cited Findings
- Data programming (Ratner et al., NeurIPS 2016): users write noisy labelling functions; a generative label model estimates their accuracies and correlations without ground truth and outputs probabilistic labels. [M] — [arXiv 1605.07723](https://arxiv.org/abs/1605.07723)
- Snorkel (Ratner et al., VLDB 2017): in a user study, experts built models 2.8x faster with 45.5% better predictive performance than seven hours of hand labelling; Snorkel came within an average 3.60% of large hand-curated training sets. [M — re-check figures] — [arXiv 1711.10160](https://arxiv.org/pdf/1711.10160)
- Smith, Fries, Hancock, Bach (2022) "Language Models in the Loop": prompt an LM with several distinct questions per example, map answers to votes or abstentions, denoise with Snorkel, train an end classifier. Result: "an average 19.5% reduction in errors" on the WRENCH benchmark versus zero-shot prompting. [V] — [arXiv 2205.02318](https://arxiv.org/abs/2205.02318)
- Balek et al. (2024): an LLM (Llama 2) generates a small set of interpretable features from text (for example methodological rigour, novelty). 62 LLM features gave "similar predictive performance" to 768-dimension SciBERT embeddings on CORD-19 and M17+ and supported readable action rules. [V] — [arXiv 2409.07132](https://arxiv.org/abs/2409.07132)
- LLM embeddings as extra tabular features help tree ensembles in some settings, but raw numeric data often wins for numeric EHR fields, and gradient-boosted trees still beat LLM-based tabular models. [V, summaries] — [arXiv 2411.01645](https://arxiv.org/html/2411.01645v1); [PMC12671554](https://pmc.ncbi.nlm.nih.gov/articles/PMC12671554/)
- Active learning (Settles 2009 survey): uncertainty sampling queries the items the model is least sure about; known risks are outlier-chasing and sampling bias. [M] — [Settles 2009](https://burrsettles.com/pub/settles.activelearning.pdf)
- Distillation (Hinton et al. 2015): a small model trained on a big model's soft probabilities learns more than from hard labels. [M] — [arXiv 1503.02531](https://arxiv.org/abs/1503.02531)
- Third-party Jev test: a trained 22M-parameter encoder plus logistic regression scored 93.2% on Banking77 versus Jev zero-shot 80.1%, and ran in 8 ms on CPU. The blog's advice: use Jev to extract evidence, then a light classifier for the final decision. [V, low-reliability source] — [MindStudio blog](https://www.mindstudio.ai/blog/jev-vs-classic-classifiers-benchmark)

### Inferences
- Design patterns licensed:
  - **Labelling-function bank**: 10-50 Nouls per item, in one request, fed to a label model. Jev's "questions cannot see each other" matches the labelling-function abstraction.
  - **Interpretable feature extractor**: Nouls and Scores become named numeric columns for XGBoost or logistic regression. Balek et al. show 62 named features can match 768 opaque ones.
  - **Teacher for distillation**: Jev labels a corpus once; a tiny local model then runs in a 1-10 ms loop or on-prem. This is how Jev's judgment reaches loops it cannot sit in directly (section 10).
  - **Acquisition scorer**: calibrated uncertainty picks which items go to scarce experts.
- Limit: labelling functions from one model share errors. Snorkel models correlation, but it cannot fix a blind spot common to all prompts. Keep at least a few non-Jev signals (rules, metadata).
- Limit: numeric fields should stay numeric. The EHR evidence says text-model features do not replace raw numbers.

### Gaps
- No paper tests weak supervision with a *calibrated* prompted classifier as the labelling-function source. Smith et al. used generative LMs with hard votes. Probabilistic votes should help, but that is untested.

---

## 5. Judges, verifiers, and reward models: small specialised checkers vs large LLMs

### Takeaway
Small specialised checkers can match frontier LLMs on narrow, well-defined checks (grounded fact-checking is the best case: GPT-4 accuracy at 400x lower cost). They fail to generalise across evaluation schemes, they trail general LLM critics on hard maths steps, and they can be fooled by short adversarial strings.

### Cited Findings
- Verifiers (Cobbe et al. 2021): train a verifier to score sampled solutions and pick the best. I recall the claim that verification gives about the same boost as a 30x increase in model size on GSM8K. [M] — [arXiv 2110.14168](https://arxiv.org/abs/2110.14168)
- Process reward models (Lightman et al. 2023): step-level supervision beats outcome supervision; the PRM-guided system solves 78% of a representative MATH subset; PRM800K has 800k step labels. [M] — [arXiv 2305.20050](https://arxiv.org/abs/2305.20050)
- ProcessBench (Zheng et al. 2024): 3,400 cases, mostly competition and olympiad maths, expert-labelled first wrong step. Findings: existing PRMs "typically fail to generalize to more challenging math problems beyond GSM8K and MATH" and "underperform" general LLMs prompted as critics. [V] — [arXiv 2412.06559](https://arxiv.org/abs/2412.06559)
- LLM-as-judge (Zheng et al., NeurIPS 2023): GPT-4 agrees with human preferences over 80% of the time, the same as human-human agreement. Documented biases: position, verbosity, self-enhancement, and weak maths/reasoning grading. [V] — [arXiv 2306.05685](https://arxiv.org/abs/2306.05685)
- Small judges: Prometheus (13B, rubric-based) and JudgeLM (7-33B) report GPT-4-level agreement in-domain. [M] — [Prometheus arXiv 2310.08491](https://arxiv.org/abs/2310.08491); [JudgeLM arXiv 2310.17631](https://arxiv.org/pdf/2310.17631)
- Huang et al. (ACL Findings 2025): fine-tuned judges beat GPT-4 in-domain but "underperform GPT-4 across several dimensions, including generalizability, fairness and adaptability"; they are "task-specific classifiers". [V] — [arXiv 2403.02839](https://arxiv.org/abs/2403.02839)
- NLI-based factual consistency: SummaC applies NLI at sentence level; AlignScore (355M) unifies alignment tasks and rivals much larger LLM-based metrics. [M] — [SummaC arXiv 2111.09525](https://arxiv.org/abs/2111.09525); [AlignScore arXiv 2305.16739](https://arxiv.org/abs/2305.16739)
- MiniCheck (Tang, Laban, Durrett, EMNLP 2024): MiniCheck-FT5 (770M) "reaches GPT-4 accuracy" on the LLM-AggreFact benchmark "for 400x lower cost", trained on synthetic data that teaches checking each atomic fact and combining evidence across sentences. [V] — [arXiv 2404.10774](https://arxiv.org/abs/2404.10774); [ACL Anthology](https://aclanthology.org/2024.emnlp-main.499/)
- Attacks: short universal phrases (often 5 tokens or fewer) appended to any text push LLM judges to the top score; absolute scoring is more vulnerable than pairwise comparison; attacks transfer from a surrogate to unseen judges. [V] — [Raina, Liusie, Gales, EMNLP 2024](https://aclanthology.org/2024.emnlp-main.427/). JudgeDeceiver generates optimised injection suffixes that survive common defences. [V, summary] — [survey arXiv 2504.18333](https://arxiv.org/html/2504.18333v1)

### Inferences
- Design pattern licensed: **claim-by-claim grounded checking**. Code splits an output into steps or claims; each claim plus its source goes to a Noul ("is this claim supported by this passage?"). This is MiniCheck's setting, and it is where small models are proven.
- Where Jev should *not* be the verifier: deciding whether a hard maths or physics derivation step is *valid*. ProcessBench shows small checkers fail there. Jev can still check *form* (does the step cite a rule, does the unit label match, does the claim appear in the source).
- Huang et al.'s "task-specific classifier" critique is aimed at fine-tuned judges. Jev is not fine-tuned per task, so the risk moves to prompt/criteria wording. The same lesson holds: validate each rubric on labelled data before trusting it.
- Absolute Score outputs are the most attackable form (Raina). For any setting with untrusted text, prefer pairwise Choice, strip or quote untrusted spans, and never let Jev be the only gate.

### Gaps
- Cobbe and Lightman numbers are from memory.
- No public benchmark of Jev on LLM-AggreFact, ProcessBench, or JudgeBench was found.

---

## 6. Zero-shot classification and cross-encoders: cost and latency comparators

### Takeaway
Zero-shot text classification has a long encoder lineage (NLI entailment, cross-encoders, GLiClass, rerankers). The best open zero-shot models reach only about 0.72 macro-F1 across 22 datasets, and a small trained encoder beats any zero-shot model on a narrow task at under 10 ms on CPU. Jev's edge is zero-shot breadth, typed probabilistic outputs, and price, not raw speed against a local fine-tuned model.

### Cited Findings
- Yin, Hay, Roth (EMNLP 2019): cast zero-shot classification as textual entailment ("This text is about X"). [M] — [arXiv 1909.00161](https://arxiv.org/abs/1909.00161)
- Nogueira & Cho (2019): BERT cross-encoder re-ranking on MS MARCO reaches MRR@10 of 35.8, 27% relative above the prior state of the art. [V] — [arXiv 1901.04085](https://arxiv.org/abs/1901.04085). Later lines: monoT5 and RankLLaMA. [M] — [monoT5 arXiv 2003.06713](https://arxiv.org/abs/2003.06713); [RankLLaMA arXiv 2310.08319](https://arxiv.org/abs/2310.08319)
- GLiClass (2025): a uni-encoder that scores all labels in one forward pass; about 10x faster than cross-encoders (some model cards claim up to 50x), with only a 7-20% throughput drop from 1 to 128 labels. [V] — [arXiv 2508.07662](https://arxiv.org/html/2508.07662v1)
- BTZSC benchmark (Aarab, 2026): 22 datasets, 38 checkpoints across NLI cross-encoders, embedding models, rerankers, instruction-tuned LLMs. Best: Qwen3-Reranker-8B at macro-F1 0.72. Instruction-tuned 4-12B LLMs reach up to 0.67. NLI cross-encoders plateau as backbones grow. Embedding models give the best accuracy-latency trade-off. [V] — [arXiv 2603.11991](https://arxiv.org/abs/2603.11991)
- ModernBERT (2024) updates the encoder recipe with 8k context and faster inference. [M] — [arXiv 2412.13663](https://arxiv.org/abs/2412.13663)
- Third-party Jev comparison (unnamed benchmark): Banking77 accuracy: classic zero-shot NLI 48.8%, newer zero-shot NLI 66.7%, Jev zero-shot 80.1%, trained 22M encoder + logistic regression 93.2%. Yelp stars: Jev 67.2% vs trained local model 51.9%. Trained models won "by a wide margin" on emotion and phishing. Latency: trained BERT 8 ms on CPU; Jev about 150 ms for one question and about 150 ms for 30 questions in one call; zero-shot NLI 165 ms. Whole Banking77 run on Jev cost about 22 cents. [V, low-reliability source] — [MindStudio blog](https://www.mindstudio.ai/blog/jev-vs-classic-classifiers-benchmark)

### Inferences
- Honest positioning: **with labels and a fixed narrow task, train a small encoder.** Jev wins when labels do not exist, the question changes often, there are many different questions per item, or calibrated probabilities are needed out of the box.
- The "30 questions in about 150 ms" figure means effective latency per judgment is about 5 ms today when questions share a state. This matters for search loops (section 7) and rule bases (section 8).
- Jev as a **reranker** is a well-grounded role: BTZSC finds rerankers are the strongest zero-shot classifiers, and Nogueira & Cho show the cross-encoder gain. A Score ("how relevant is this passage to this query?") over the top-k candidates is the same pattern.

### Gaps
- No peer-reviewed Jev benchmark. No Jev entry in BTZSC. The report should say so.
- I did not verify current list prices of hosted LLMs, so I give no Jev-to-LLM price ratio. The writer should compute it from current price pages.

---

## 7. Learned heuristics inside search and optimisation: what does a 10 ms, near-free semantic evaluator change?

### Takeaway
Search quality is bounded by (budget) / (cost per node evaluation). AlphaZero showed a good learned evaluator wins with about 1,000x fewer node evaluations. In branch-and-bound, per-node inference cost is the stated bottleneck. LLM-guided tree search works but costs about $0.74 per small puzzle. A near-free, millisecond evaluator moves LLM-style semantic search from "tens of nodes" to "tens of thousands of nodes" per problem.

### Cited Findings
- AlphaGo / AlphaZero: a policy network narrows the moves considered; a value network replaces rollouts. AlphaZero searched about 80,000 positions/s versus Stockfish's about 70 million and still won the 100-game match 28-0 with 72 draws. [V] — [AlphaZero summary](https://en.wikipedia.org/wiki/AlphaZero); primary: [Silver et al., Science 2018](https://doi.org/10.1126/science.aar6404) [M]
- Algorithm selection: Rice (1976) posed choosing the best algorithm per instance; Kerschke et al. (2019) survey automated per-instance selection and its gains across SAT, TSP, MIP. [M] — [arXiv 1811.11597](https://arxiv.org/abs/1811.11597)
- Learning to branch: Khalil et al. (AAAI 2016) learn a ranking that imitates strong branching. [M] — [AAAI 2016](https://ojs.aaai.org/index.php/AAAI/article/view/10080). Gasse et al. (NeurIPS 2019) use a GNN over the variable-constraint graph, generalise to larger instances, and improve "for the first time over expert-designed branching rules implemented in a state-of-the-art solver on large problems". [V] — [arXiv 1906.01629](https://arxiv.org/abs/1906.01629)
- Per-node cost is binding: Gupta et al. (NeurIPS 2020) note the GNN needs a GPU while solvers are CPU-only; their hybrid runs the GNN once at the root and a cheap MLP at every node, which beats both SCIP's default and the pure GNN on CPU. [V] — [arXiv 2006.15212](https://arxiv.org/abs/2006.15212)
- Survey: Bengio, Lodi, Prouvost (EJOR 2021) classify ML for combinatorial optimisation: end-to-end, ML to configure an algorithm, and ML called repeatedly *inside* an algorithm. [M] — [arXiv 1811.06128](https://arxiv.org/abs/1811.06128)
- Tree of Thoughts (Yao et al., NeurIPS 2023): Game of 24 success 74% with breadth 5; about 5.5k completion tokens and about $0.74 per case at 2023 GPT-4 prices. [V] — [arXiv 2305.10601](https://arxiv.org/pdf/2305.10601). LATS and RAP add MCTS with an LLM value function or world model. [M] — [LATS arXiv 2310.04406](https://arxiv.org/abs/2310.04406); [RAP arXiv 2305.14992](https://arxiv.org/abs/2305.14992)
- Budget-aware evaluation finds that elaborate reasoning strategies often lose their edge once compared at equal token budget. [V, title; claim from memory] — [arXiv 2406.06461](https://arxiv.org/pdf/2406.06461)

### Inferences
- Simple bound: nodes evaluated N = budget / cost-per-node. At about $0.00004 per 1,000-token evaluation, 10,000 node evaluations cost about $0.40. That is below the $0.74 ToT paid for a few hundred LLM calls on one puzzle.
- Latency: at 10 ms per sequential call, 10,000 evaluations take 100 s; in parallel far less. Jev can score all children of a node in **one request** (one state, one question per candidate move), which matches its "many independent questions" design. Third-party data shows 30 questions return in about 150 ms today.
- Today's binding limit is the **rate limit**, not latency: 1,200 requests/min is 20 requests/s, so 10,000 single-question requests need over 8 minutes. Batching siblings into one request is the fix.
- Best-grounded slots for Jev in search:
  - **Policy prior** over a closed move set (Choice): tactic choice, premise selection, which design rule to relax next.
  - **Value / pruning test** (Noul or Score): "is this partial design still plausibly feasible?"
  - **Algorithm selector** (Choice over solvers, preconditioners, mesh strategies) from a text description of the instance. This follows Rice and Kerschke directly.
  - **Hybrid per Gupta**: a slow strong model at the root, Jev at every node.
- Limit: AlphaZero's and Gasse's evaluators were *trained on the task*. Jev is zero-shot. Its value estimates on exotic states may be weak or poorly calibrated, and search exploits evaluator errors (it finds the states the evaluator over-rates). Keep an exact checker (solver, proof kernel, simulator) as the final arbiter.
- Limit: state must be text. MILP node states and board positions need a text encoding; numeric features (bounds, gaps) should be bucketed by code first.

### Gaps
- I found no paper that uses a calibrated zero-shot text classifier as the per-node evaluator in tree search. Closest evidence is LLM value functions (ToT, LATS) and task-trained evaluators (AlphaZero, Gasse).
- AlphaZero used about 800 simulations per move in training, from memory; not re-verified.

---

## 8. Expert systems, fuzzy logic, neuro-symbolic: does the literature support natural-language predicates evaluated by a neural model inside a symbolic rule base?

### Takeaway
Yes. "Neural predicates inside a logic program" is an established neuro-symbolic design (DeepProbLog, Logic Tensor Networks, probabilistic soft logic, Markov logic). A 2025 position paper argues the neural part should now be a *prompted foundation model* rather than a network trained from scratch. What the literature does not yet supply is a benchmarked system with a calibrated text classifier as the predicate oracle in an industrial rule engine.

### Cited Findings
- Knowledge-acquisition bottleneck: Feigenbaum identified getting expert knowledge into rules as the limiting step for expert systems. [M] — [Feigenbaum 1977/1984 overview](https://stacks.stanford.edu/file/druid:vf069sz9374/vf069sz9374.pdf)
- MYCIN used certainty factors to combine uncertain rule conclusions; later work showed certainty factors are ad hoc and only match probability under strong independence assumptions. [M] — [Shortliffe & Buchanan 1975](https://doi.org/10.1016/0025-5564(75)90047-4); [Heckerman 1986 critique](https://arxiv.org/abs/1304.3419)
- Production systems match rules against working memory efficiently with the Rete algorithm. [M] — [Forgy 1982, Artificial Intelligence](https://doi.org/10.1016/0004-3702(82)90020-0)
- Fuzzy sets (Zadeh 1965) give graded membership to linguistic terms; Mamdani & Assilian (1975) built the first fuzzy controller from linguistic if-then rules. [M] — [Zadeh 1965](https://doi.org/10.1016/S0019-9958(65)90241-X); [Mamdani & Assilian 1975](https://doi.org/10.1016/S0020-7373(75)80002-2)
- Markov logic networks attach weights to first-order formulas. [M] — [Richardson & Domingos 2006](https://doi.org/10.1007/s10994-006-5833-1). Probabilistic soft logic uses soft truth values in [0,1] with Lukasiewicz operators and convex inference. [M] — [Bach et al. 2017, arXiv 1505.04406](https://arxiv.org/abs/1505.04406)
- DeepProbLog introduces the **neural predicate**: a neural network's output probabilities become the probabilities of facts in a ProbLog program. [M] — [Manhaeve et al. 2018, arXiv 1805.10872](https://arxiv.org/abs/1805.10872). Logic Tensor Networks ground predicates as differentiable functions with fuzzy semantics. [M] — [Badreddine et al. 2022, arXiv 2012.13635](https://arxiv.org/abs/2012.13635)
- Stein, Naik, Velingker, Naik, Wong (2025, position paper): "Supplementing foundation models with symbolic programs, which we call neuro-symbolic prompting, provides a way to use these models for complex reasoning tasks", reaching neuro-symbolic goals "without the downsides of training from scratch". No benchmarks in the abstract. [V] — [arXiv 2505.24874](https://arxiv.org/abs/2505.24874)
- LLM-plus-logic systems mostly use the LLM as a *translator* into Prolog, ASP, FOL, or SAT, with solver feedback for repair (for example LoRP, LLM + ILASP pipelines). Surveys: [IJCAI 2025 survey](https://www.ijcai.org/proceedings/2025/1195.pdf); [arXiv 2508.13678](https://arxiv.org/pdf/2508.13678). [V, summaries]
- A 2026 study warns that LLMs are unfaithful as both solvers and auto-formalisers in legal reasoning. [V, title only] — [arXiv 2606.16118](https://arxiv.org/pdf/2606.16118)
- LLMs and fuzzy reasoning: FRoG (EMNLP 2024) finds fuzzy reasoning with generalised quantifiers hard for LLMs, and reasoning-enhancement methods do not reliably help. [V] — [FRoG](https://aclanthology.org/2024.emnlp-main.411/). A 2025 framework structures fuzzy-style soft rules in prompts. [V, summary] — [arXiv 2508.06754](https://arxiv.org/html/2508.06754v1)

### Inferences
- The brief's role "semantic predicate in a rule engine" is precisely DeepProbLog's neural predicate with the network swapped for a prompted classifier. The report can cite Manhaeve et al. for the architecture and Stein et al. for the "use a foundation model instead" argument.
- This attacks the knowledge-acquisition bottleneck from a new side: experts write rule *conditions* in plain language ("the report describes a loss of containment"), and no one has to enumerate keywords or train a model per condition.
- Calibration matters more here than anywhere: MYCIN's certainty factors failed because their numbers had no sound semantics. A calibrated Noul is a real marginal probability, so it can enter ProbLog, MLN, PSL, or a Bayesian network as evidence.
- Caveat on combining: Jev's questions "cannot see each other", so outputs are **marginals, not a joint**. Combining several Nouls needs either an explicit independence assumption (noisy-OR, ProbLog facts), or a learned combiner (logistic regression over Nouls, which loops back to section 4).
- Noul versus fuzzy membership: a Noul is the probability that a crisp condition holds. A fuzzy membership is a degree of truth. They are different things. **Score** is the closer match to a fuzzy partition ("low / medium / high" with a probability per level), and its expected level plays the role of a defuzzified value feeding a Mamdani-style rule table.
- Rete-style engines assume cheap, deterministic condition tests. A remote 10-150 ms predicate needs caching, batching of all semantic conditions for one fact into one request, and versioned, logged outputs for audit.
- Keep multi-step inference in the symbolic layer. Jev reads literally and is weak at multi-hop; the rule engine supplies the chaining. This split is the main point of the neuro-symbolic design.

### Gaps
- I found no published, benchmarked system that plugs a calibrated text classifier into a production rule engine (Drools, CLIPS) or a fuzzy controller in an engineering or chemical-plant setting. This is a real novelty claim for the report, and also an evidence gap.
- The classical citations in this section are from memory; they are standard and low-risk, but page-level details were not re-checked.

---

## 9. Semantic operators and AI map-reduce over data

### Takeaway
The database community has formalised exactly Jev's "AI map-reduce" role as semantic operators (sem_filter, sem_join, sem_topk, sem_group_by) with cost-based optimisers. Their main optimisation is a cascade: a cheap proxy scores every row, and only uncertain rows reach the expensive LLM, with statistical accuracy guarantees. Reported gains reach 1,000x on single operators and 23.6x cost on full pipelines.

### Cited Findings
- LOTUS (Patel et al., VLDB 2025): semantic operators are "the first formalism for declarative and general-purpose AI-based transformations based on natural language specifications". Optimisations give "up to 1,000x" speed-ups for semantic filter, join, group-by, and top-k "while providing accuracy guarantees with respect to a gold algorithm". Full programs "match or exceed quality of recent LLM-based analytic systems by up to 170%" and run "up to 3.6x faster than the highest-quality baselines". Tested on fact-checking, biomedical multi-label classification, search, and topic analysis. [V] — [arXiv 2407.11418](https://arxiv.org/abs/2407.11418); [VLDB paper](https://www.vldb.org/pvldb/vol18/p4171-patel.pdf)
- LOTUS's filter cascade uses a proxy score per row with two learned thresholds; rows between the thresholds go to the oracle model; thresholds are set by sampling to meet precision and recall targets with a set failure probability, with multiple-testing corrections. [V, secondary review; mechanism details from memory] — [technical review](https://medium.com/@adnanmasood/lotus-semantic-operators-for-ai-powered-data-processing-a-technical-review-9f26b8182616)
- Abacus (Russo et al., VLDB 2026), the optimiser in Palimpzest: finds plans with 20.3%, 18.7%, and 39.2% better quality than DocETL- and LOTUS-optimised plans on BioDEX, CUAD, and MMQA; on BioDEX its plans are on average 23.6x cheaper and 4.2x faster than the next best system. It optimises quality, dollars, or latency under constraints on the others. [V] — [arXiv 2505.14661](https://arxiv.org/html/2505.14661v1)
- DocETL (Shankar et al. 2024): agent-rewritten pipelines for complex document processing with accuracy gains over hand-built baselines. [M] — [arXiv 2410.12189](https://arxiv.org/abs/2410.12189). SUQL (Liu et al. 2023) adds free-text operators (ANSWER, SUMMARY) to SQL over hybrid data. [M] — [arXiv 2311.09818](https://arxiv.org/abs/2311.09818)
- PLOP (2026) studies cost-based placement of semantic operators inside hybrid relational plans. [V, title only] — [arXiv 2604.09944](https://arxiv.org/pdf/2604.09944)
- Precedent from video analytics: NoScope (Kang et al., VLDB 2017) used cheap specialised models in a cascade for up to about 1,000x faster queries; "probabilistic predicates" (Lu et al., SIGMOD 2018) place cheap classifiers ahead of expensive UDFs. [M] — [NoScope arXiv 1703.02529](https://arxiv.org/abs/1703.02529); [Probabilistic Predicates](https://doi.org/10.1145/3183713.3183751)

### Inferences
- Jev fits semantic-operator systems in two ways:
  - As the **proxy model** in a LOTUS-style cascade. A calibrated Noul is a better proxy score than embedding similarity, because thresholds on calibrated probabilities transfer across queries.
  - As the **oracle itself** for filter, join-match, and top-k comparison operators whose answer space is closed. Map-style *generation* operators (extract, summarise) still need an LLM.
- sem_join is quadratic. At Jev prices a 10,000 x 10,000 join with 200-token pairs is 100M pairs x 200 tokens = 20B tokens, about $800. Blocking (embeddings or keys) to cut candidate pairs first stays essential. The brief's "entity / record alignment" role should always be described as blocking plus Jev.
- Throughput ceiling today: 250,000 tokens/s means 1M documents of 2,000 tokens take about 2.2 hours. The 1,200 requests/min cap is tighter: 1M one-document requests take about 14 hours. Packing several items per request, or a higher limit, is needed for true corpus scale.
- LOTUS's statistical guarantees (precision/recall targets with failure probability) are the right template for a "screening at scale" claim in a regulated setting: "recall of at least 0.95 with 95% confidence, validated on a labelled sample".

### Gaps
- DocETL's exact accuracy numbers are from memory and omitted.
- No semantic-operator paper evaluates a typed classifier API as the physical operator. All use generative LLMs or embeddings.

---

## 10. Control hierarchy and latency budgets: which loops can Jev sit inside at 100 ms and at 10 ms?

### Takeaway
Loop budgets span nine orders of magnitude. At 100-150 ms hosted, Jev fits human-facing and supervisory loops (seconds and up). At 10 ms it enters 100 ms machine-facing loops such as real-time bidding, but only if the network path adds a few milliseconds, which means same-region or on-prem. Hard real-time loops (PLC scans, servo control, hardware triggers, HFT) stay out of reach for any network service; Jev reaches them only through distillation or by setting their modes from above.

### Cited Findings
- Human perception: 0.1 s feels instant (direct manipulation), 1 s keeps the flow of thought, 10 s is the limit of attention. Origin: Miller (1968), Card et al.; codified by Nielsen (1993). [V] — [Nielsen, Response Time Limits](https://www.nngroup.com/articles/response-times-3-important-limits/); [Miller 1968](https://dl.acm.org/doi/10.1145/1476589.1476628)
- Real-time bidding: many exchanges, including Google's, enforce about 100 ms. After network allowance, bidders get about 72-80 ms for compute plus round trip (Xandr example: 100 ms minus 18 ms inter-DC latency minus 10 ms buffer = 72 ms). OpenRTB `tmax` includes internet latency. [V] — [Xandr FAQ, Microsoft Learn](https://learn.microsoft.com/en-us/xandr/supply-partners/faq-integration-process); [OpenRTB 3.0](https://github.com/InteractiveAdvertisingBureau/openrtb/blob/main/OpenRTB%20v3.0%20FINAL.md); [latency budget write-up](https://medium.com/@datapath_io/how-network-latency-affects-the-rtb-process-for-adtech-6ecbf29d025)
- PLC scan cycles: typically 1-100 ms; about 1-20 ms for machine control and 50-100 ms for process control. [V, vendor knowledge-base source] — [Industrial Monitor Direct](https://industrialmonitordirect.com/blogs/knowledgebase/understanding-plc-scan-cycle-complete-technical-guide)
- ISA-95 / Purdue levels: Level 0 process, Level 1 sensing and basic control, Level 2 supervisory control (PLC/HMI/SCADA), Level 3 manufacturing operations (time frame seconds to days), Level 4 business planning (days to months). [V] — [Purdue Enterprise Reference Architecture](https://en.wikipedia.org/wiki/Purdue_Enterprise_Reference_Architecture); [ISA-95](https://www.isa.org/standards-and-publications/isa-standards/isa-95-standard)
- Hardware triggers: the LHC Level-1 trigger sees 40 MHz collisions and must decide within roughly a microsecond to about 10 microseconds; ML runs on FPGAs via hls4ml. [V] — [arXiv 2101.05108](https://arxiv.org/pdf/2101.05108); [arXiv 2307.05152](https://arxiv.org/pdf/2307.05152)
- Network: Azure targets under about 2 ms round trip between zones in one region and publishes measured inter-region round-trip tables. [V] — [Azure network latency statistics](https://learn.microsoft.com/en-us/azure/networking/azure-network-latency)
- Jev measured by a third party: about 150 ms per call today, flat from 1 to 30 questions per call. [V, low-reliability source] — [MindStudio blog](https://www.mindstudio.ai/blog/jev-vs-classic-classifiers-benchmark)
- Brief figures: $0.04 per million input tokens; under 100-150 ms today; under 10 ms planned; 250,000 tokens/s and 1,200 requests/min. — [Jev docs index](https://docs.typesafe.ai/llms.txt) (as quoted in the shared brief; not re-fetched)

### Inferences

**Latency-and-cost table.** Budgets come from the sources above where cited; the verdicts are my inference. "Net" = network round trip. Light in fibre covers about 200 km per millisecond one way, so 1,000 km adds about 10 ms round trip before any routing overhead.

| Decision loop | Typical budget | Jev hosted today (100-150 ms + net) | Jev at 10 ms | Verdict and how to use Jev |
|---|---|---|---|---|
| Hardware trigger (LHC L1), protection relays | ns to about 10 µs | Out | Out | Out of reach. Only FPGA logic fits. Jev can triage trigger *menus*, logs, and shift reports offline. |
| High-frequency trading | µs (no source fetched) | Out | Out | Out of reach. |
| Servo / motion control, robot joint loops | about 1 ms (1 kHz; from memory) | Out | Out | Out. Distil into local code if needed. |
| PLC scan, machine control | 1-20 ms, deterministic | Out | Out in practice | A network call has no hard real-time guarantee. Jitter, not mean latency, rules it out. |
| PLC scan, process control; safety instrumented functions | 50-100 ms, deterministic | Out | Out | Same reason, plus functional-safety limits (section 11). |
| Game / simulation frame | 16.7 ms at 60 Hz | Out per frame | Only on-box, and tight | Run asynchronously every N frames for NPC mode choice. |
| Real-time bidding, fraud pre-auth, inline API guard | about 100 ms total, about 72-80 ms usable | Out | **In**, if same region (about 2 ms net) | First machine-speed loop that opens at 10 ms. |
| Direct-manipulation UI (autocomplete-style checks) | 100 ms | Borderline to out | **In**, even with 30-60 ms net | Inline form validation, live requirement checks while typing. |
| Tree-search node evaluation | No hard limit; throughput-bound | In: about 5 ms per sibling when 30 siblings share one call | In: about 100 sequential levels per second | Rate limit (20 requests/s) binds before latency. Batch siblings. |
| Agent step verification (check each LLM step) | LLM step takes 1-30 s | **In**; adds under 10% | In; negligible | Strong fit today. Verifier latency hides inside generation time. |
| Conversational flow | 1 s | **In**, about 5 sequential calls | In, about 50 sequential calls | Route, guard, and slot-fill inside one turn. |
| Supervisory control, alarm triage, operator advisory (Purdue L2-L3) | seconds to minutes | **In** | In | Strong fit. Jev picks mode or procedure from a closed set; code and PLCs act. |
| MES / scheduling / maintenance planning (L3) | seconds to days | In | In | Cost, not latency, is the enabler. |
| Corpus screening, sem_filter / sem_join | hours; throughput-bound | In: 1M x 2k-token docs is about $80 and about 2.2 h at the token cap, about 14 h at the request cap | Same cost; latency irrelevant | Cost is the enabler. Pack items per request. |

**Cost anchors (arithmetic on the brief's price):**
- 1,000-token judgment: $0.00004. One dollar buys about 25,000.
- 10,000-node search with 1,000-token states: about $0.40.
- 100M-pair sem_join at 200 tokens per pair: about $800. Block first.
- Checking every step of a 50-step agent run with 2,000-token context: about $0.004.

**Other inferences**
- The move from 100 ms to 10 ms matters only where the *rest* of the path is already short. For a caller 3,000 km away, network time dominates and the gain is small. The 10 ms tier therefore implies regional endpoints, on-prem, or edge deployment to be useful.
- For deterministic loops the route is indirect: (a) Jev supervises and sets modes or set-point *policies* above the loop; (b) Jev labels data and a distilled local model (8 ms on CPU per the third-party test, or far less) runs inside the loop.

### Gaps
- No fetched source for HFT, servo-loop, or robotics planning rates; values are common engineering knowledge and are marked as such.
- Specific inter-continental round-trip numbers were not extracted from the Azure table.
- No published tail-latency (p99) or jitter data for Jev. Mean latency is not enough for any loop with a deadline.
- No public statement on on-prem or edge deployment of Jev was found.

---

## 11. Assurance limits: what do safety and AI standards imply for a hosted, versioned classifier?

### Takeaway
Current functional-safety standards do not allow an ML model to *be* the safety function above the lowest integrity level, and newer guidance (ISO/IEC TR 5469) points to architectures where AI advises or is supervised by a non-AI safety function. For Jev this means: advisory or supervisory roles, a conventional barrier underneath, pinned versions, validation on a fixed test set at every change, logging, and human oversight. The EU high-risk obligations were delayed to December 2027 and August 2028.

### Cited Findings
- IEC 61508-3:2010 Annex A Table A.2 lists "artificial intelligence - fault correction" as not recommended for SIL 2 and above; at SIL 1 it carries no recommendation either way. [V, via secondary engineering source] — [Analog Devices, Functional Safety and AI](https://ez.analog.com/ez-blogs/b/engineerzone-spotlight/posts/functional-safety-and-artificial-intelligence-268912509); see also [IET, The Application of AI in Functional Safety](https://electrical.theiet.org/media/ifbjt25i/the-application-of-artificial-intelligence-in-functional-safety-v9.pdf)
- ISO/IEC TR 5469:2024 covers "the use of AI inside a safety related function", "the use of non-AI safety related functions to ensure safety for an AI controlled equipment", and "the use of AI systems to design and develop safety related functions". [V] — [ISO 81283](https://www.iso.org/standard/81283.html)
- TR 5469 usage levels: A = AI inside a safety function at run time; B = AI used in developing safety functions; C = non-safety AI that could interfere with a safety function; D = non-safety AI with no interference. A and B split into 1 (automated decision) and 2 (no automated decision). AI diagnostics are typically A2 or C. The report crosses usage level with an AI technology class (I, II, III) to rank risk. [V] — [ACM Computing Surveys 2023, AI for Safety-Critical Systems](https://dl.acm.org/doi/10.1145/3626314); [TR 5469 preview](https://cdn.standards.iteh.ai/samples/81283/a480bab0b69c4335986c2b0de971308d/ISO-IEC-TR-5469-2024.pdf)
- Technology classes, from memory: Class I can be assured with existing functional-safety standards; Class II cannot fully, but compensating methods and properties can be identified; Class III cannot. Deep networks are generally treated as Class II at best. [M — re-check]
- Critique: Ladkin (2024) argues TR 5469 treats AI parts as "oracular subsystems" whose outputs cannot be justified internally. [V, title and abstract only] — [Safety-Critical Systems eJournal](https://scsc.uk/journal/index.php/scsj/article/view/32)
- ISO 21448 (SOTIF) addresses hazards from performance limits and foreseeable misuse without any fault, and asks for systematic reduction of unknown unsafe scenarios. [M] — [ISO 77490](https://www.iso.org/standard/77490.html). UL 4600 requires a structured, evidence-based safety case for autonomous products. [M] — [UL 4600 overview](https://users.ece.cmu.edu/~koopman/ul4600/)
- EU AI Act: AI used as a safety component in managing critical digital infrastructure, road traffic, or the supply of water, gas, heating, or electricity is high-risk (Annex III). High-risk duties include risk management, data governance, logging, transparency, human oversight (Art. 14), and accuracy, robustness, and cybersecurity (Art. 15). [V] — [Orrick EU AI Act guide](https://ai-law-center.orrick.com/eu-ai-act/high-risk-ai/); [McCann FitzGerald on critical infrastructure](https://www.mccannfitzgerald.com/knowledge/construction-and-infrastructure/critical-infrastructure-spotlight-eu-ai-act-draft-guidelines-on-high-risk-ai-classification)
- Timing: the Digital Omnibus on AI moved Annex III high-risk duties from 2 August 2026 to 2 December 2027, and product-embedded (Annex I) high-risk duties to 2 August 2028. Political agreement came on 7 May 2026. Secondary sources report publication as Regulation (EU) 2026/1744 on 24 July 2026. [V, legal-firm and industry sources; regulation number not checked against the Official Journal] — [Gibson Dunn](https://www.gibsondunn.com/eu-ai-act-omnibus-agreement-postponed-high-risk-deadlines-and-other-key-changes/); [Cloud Security Alliance note](https://labs.cloudsecurityalliance.org/research/csa-research-note-eu-ai-act-high-risk-deadline-omnibus-20260/); [EP Legislative Train](https://www.europarl.europa.eu/legislative-train/package-digital-package/file-digital-omnibus-on-ai)
- NIST AI RMF 1.0 (2023): functions Govern, Map, Measure, Manage; trustworthy AI is valid and reliable, safe, secure and resilient, accountable and transparent, explainable, privacy-enhanced, and fair. Voluntary. [M] — [NIST AI RMF](https://www.nist.gov/itl/ai-risk-management-framework)
- FDA: Good Machine Learning Practice gives ten guiding principles (2021, with Health Canada and MHRA). [M] — [FDA GMLP](https://www.fda.gov/medical-devices/software-medical-device-samd/good-machine-learning-practice-medical-device-development-guiding-principles). The final guidance on Predetermined Change Control Plans (4 December 2024) lets makers pre-authorise specified model changes if they describe the changes, the validation method, and the impact assessment; it covers all AI-enabled device software functions. [V] — [Federal Register notice](https://www.federalregister.gov/documents/2024/12/04/2024-28361/marketing-submission-recommendations-for-a-predetermined-change-control-plan-for-artificial); [FDA guidance page](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/marketing-submission-recommendations-predetermined-change-control-plan-artificial-intelligence)

### Inferences
- Position Jev at TR 5469 usage level **C or A2**: it advises, ranks, routes, or pre-screens, and a conventional, separately assured function (interlock, SIS, relief device, human sign-off) remains the barrier. Avoid A1 (automated safety decision) designs in engineering and chemical-plant use.
- "Same weights for everyone, no fine-tuning" helps assurance: one artefact, one validation target, and prompts and criteria are inspectable configuration under change control. "Hosted" hurts assurance: the vendor controls versions and availability.
- Practical obligations to state in the report:
  - **Pin the model version.** Treat any version change like a PCCP-style modification: re-run a frozen, labelled golden set; compare accuracy *and* calibration; record the result.
  - **Validate per question**, not per model. Each Noul, Choice, or Score wording is its own classifier.
  - **Log** inputs, prompts, outputs, probabilities, and model version (EU AI Act logging; audit trail for GMP/GxP settings).
  - **Human oversight** by design: the reject band (section 3) is the oversight mechanism, with measured coverage and error rates.
  - **Availability and degraded mode**: define what the process does when the API is down or slow. A hosted service cannot be a single point of failure for plant operation.
  - **Data control**: plant and formulation data sent to a hosted API raise confidentiality and export-control questions outside the standards above.
- SOTIF thinking applies well: list triggering conditions for Jev's known weak spots (numbers in text, dates, double negatives, long noisy state, injected text) and test them on purpose.

### Gaps
- TR 5469 technology-class definitions are from memory. Its follow-on technical specification (ISO/IEC TS 22440, from memory) was not verified and is left out of the findings.
- The Omnibus regulation number and Official Journal date come from secondary sources.
- I found no public statement on Jev version pinning, deprecation windows, change notices, SLAs, or on-prem options. These decide whether the obligations above can be met.
- Sector rules for the chemical industry (IEC 61511 for SIS, Seveso III, OSHA PSM) were left to the domain researchers.

---

## 12. Small-model limits: evidence for an honest "poor fit" section

### Takeaway
The brief's weak spots all have published support: position effects in long contexts, distraction by irrelevant text, fragile arithmetic, a multi-hop gap that does not close with scale, weak step-level checking on hard maths, and easy steering by injected text. A trained small encoder also beats zero-shot models on narrow labelled tasks.

### Cited Findings
- Long context: "Lost in the Middle" (Liu et al., TACL 2024) shows a U-shaped curve; accuracy drops by 20 points or more when the needed passage sits mid-context. [V] — [paper](https://cs.stanford.edu/~nfliu/papers/lost-in-the-middle.arxiv2023.pdf)
- Distractors: Shi et al. (ICML 2023) build GSM-IC and show LLMs "can be easily distracted by irrelevant context". [V] — [arXiv 2302.00093](https://arxiv.org/abs/2302.00093). A 2025 controlled benchmark studies the same effect in reasoning. [V, title only] — [EMNLP 2025](https://aclanthology.org/2025.emnlp-main.674.pdf)
- Arithmetic fragility: GSM-Symbolic (Mirzadeh et al. 2024) finds accuracy falls when only numbers change, and that one seemingly relevant but useless clause cuts performance by up to 65%. [V] — [arXiv 2410.05229](https://arxiv.org/pdf/2410.05229). Contested: a 2026 paper re-examines its statistics, and a 2026 replication reports frontier models now cope well. [V, titles only] — [arXiv 2605.28700](https://arxiv.org/pdf/2605.28700); [LessWrong replication](https://www.lesswrong.com/posts/Ze4C99Dasj74YKCFh/revisiting-gsm-symbolic-do-2026-frontier-models-still-fail). These rebuttals concern frontier models, not small ones.
- Multi-hop: the "compositionality gap" (Press et al. 2022): models often answer both sub-questions yet fail the composed question, and the gap does not shrink with scale. [M] — [arXiv 2210.03350](https://arxiv.org/abs/2210.03350)
- Step checking: PRMs fail to generalise to olympiad-level problems and trail general LLM critics. [V] — [ProcessBench](https://arxiv.org/abs/2412.06559)
- Generalisation: fine-tuned judges are "task-specific classifiers". [V] — [Huang et al.](https://arxiv.org/abs/2403.02839). Best zero-shot classifiers average only about 0.72 macro-F1 over 22 datasets. [V] — [BTZSC](https://arxiv.org/abs/2603.11991)
- Injection: universal short phrases inflate judge scores and transfer across models. [V] — [Raina et al. 2024](https://aclanthology.org/2024.emnlp-main.427/). Indirect prompt injection through retrieved content is a general attack class. [M] — [Greshake et al. 2023, arXiv 2302.12173](https://arxiv.org/abs/2302.12173)
- Fuzzy quantifiers ("most", "few") are hard for LLMs. [V] — [FRoG](https://aclanthology.org/2024.emnlp-main.411/)
- Narrow tasks with labels: trained 22M encoder 93.2% vs Jev zero-shot 80.1% on Banking77; trained models also won on emotion and phishing. [V, low-reliability source] — [MindStudio blog](https://www.mindstudio.ai/blog/jev-vs-classic-classifiers-benchmark)

### Inferences
- Poor-fit list the report can use, each tied to evidence above:
  - Any judgment that turns on comparing raw numbers, units, tolerances, dates, or counts. Compute in code, pass named buckets.
  - Validity of derivation or proof steps in hard maths or physics. Use a proof kernel, CAS, or a reasoning model.
  - Questions that need two or more hops across a document. Decompose into single-hop Nouls and chain in code or rules.
  - Large, noisy states. Retrieve or slice first; put the key evidence first or last.
  - Any gate where an adversary controls part of the state (supplier documents, web text, user tickets) and the gate is the only control.
  - Narrow, stable, high-volume tasks with labels. A local fine-tuned encoder is cheaper at the margin, faster, and more accurate.
  - Hard real-time or safety-function roles (sections 10 and 11).
- Mitigations with support in the literature: contextual calibration and per-task temperature (section 3); pairwise rather than absolute scoring (Raina); retrieval and position control (Liu); decomposition into atomic checks (MiniCheck).

### Gaps
- No Jev-specific published red-team, long-context, or injection evaluation was found.
- I did not find a clean, citable study of *counting* failures in small classifiers; the brief's claim rests on vendor guidance.

---

## 13. Theory-to-pattern map, and roles the catalogue is missing

### Takeaway
Every role in the brief's catalogue has a recognisable theoretical home and at least one strong empirical analogue. Eight further roles follow from the literature; the most valuable additions are the cascade gate, the labelling-function bank and distillation teacher, the semantic database operator, the algorithm selector, and the runtime guard.

### Cited Findings
(All sources appear in sections 1-12. This table is a map, so links are repeated only for the anchor paper of each row.)

| Catalogue role | Theoretical home | Strongest published analogue | Headline evidence |
|---|---|---|---|
| Triage / router | Cascades, routing, reject option | [RouteLLM](https://arxiv.org/pdf/2406.18665), [FrugalGPT](https://arxiv.org/abs/2305.05176) | 35-85% cost cut at about 95% quality; up to 98% in best case |
| Screening at scale | Semantic operators; selective classification | [LOTUS](https://arxiv.org/abs/2407.11418), [Abacus](https://arxiv.org/html/2505.14661v1) | up to 1,000x operator speed-up with accuracy guarantees; 23.6x cheaper pipelines |
| Semantic predicate in a rule engine | Neural predicates (DeepProbLog), PSL, MLN, fuzzy rules | [DeepProbLog](https://arxiv.org/abs/1805.10872), [neuro-symbolic prompting](https://arxiv.org/abs/2505.24874) | Architecture established; no industrial benchmark yet |
| Heuristic inside a search loop | Policy/value guidance; learning to branch; algorithm selection | [AlphaZero](https://en.wikipedia.org/wiki/AlphaZero), [Gasse 2019](https://arxiv.org/abs/1906.01629), [Gupta 2020](https://arxiv.org/abs/2006.15212), [ToT](https://arxiv.org/pdf/2305.10601) | 1,000x fewer nodes with a good evaluator; per-node cost is the stated bottleneck; ToT costs about $0.74 per puzzle |
| Verifier / process-reward model | Verifiers, PRMs, NLI fact-checking | [MiniCheck](https://arxiv.org/abs/2404.10774); limits in [ProcessBench](https://arxiv.org/abs/2412.06559) | GPT-4 accuracy at 400x lower cost on grounded claims; small PRMs fail on olympiad steps |
| Feature extractor | Weak supervision; interpretable features | [Smith et al. 2022](https://arxiv.org/abs/2205.02318), [Balek et al. 2024](https://arxiv.org/abs/2409.07132) | 19.5% error cut vs zero-shot; 62 named features match 768-d embeddings |
| Supervisory layer over numeric control | Hierarchical control (Purdue L2-L3); SOFAI metacognition | [SOFAI](https://www.nature.com/articles/s44387-025-00027-5), [System-1.x](https://arxiv.org/abs/2407.14414) | Hybrid beats either solver alone; bounded by TR 5469 usage levels |
| Entity / record alignment | sem_join; cross-encoder matching | [LOTUS](https://arxiv.org/abs/2407.11418), [Nogueira & Cho](https://arxiv.org/abs/1901.04085) | Quadratic cost; needs blocking |
| Clause-by-clause compliance check | NLI entailment; grounded fact-checking | [MiniCheck](https://arxiv.org/abs/2404.10774), [Yin et al. 2019](https://arxiv.org/abs/1909.00161) | Per-claim entailment is where small models match large ones |
| Select, do not generate | Re-ranking; verifier-guided best-of-n | [Nogueira & Cho](https://arxiv.org/abs/1901.04085), [BTZSC](https://arxiv.org/abs/2603.11991) | Rerankers are the strongest zero-shot classifiers (macro-F1 0.72) |

### Inferences

**New roles to add to the catalogue**

1. **Cascade gate / metacognitive controller.** Jev decides whether the cheap path is enough or the slow model (or a person) is needed. It routes *compute*, not content. Grounding: SOFAI's metacognition, RouteLLM, Bouchard's finding that pre-generation routers beat cascades, System-1.x's easy/hard classifier. Primitive: Noul ("can this be answered from the supplied data alone?") or Choice over {fast, slow, human}.
2. **Labelling-function bank and distillation teacher.** Many Nouls per item feed a label model; the denoised labels train a tiny local model that runs where Jev cannot (1-10 ms loops, air-gapped plants). Grounding: Ratner, Smith et al., Hinton. This is the bridge from section 10's "out of reach" rows back to Jev.
3. **Semantic database operator.** sem_filter, sem_join match, sem_topk comparator, sem_group_by assignment, either as LOTUS-style proxy or as oracle, with stated precision/recall guarantees. Generalises "screening at scale" and "entity alignment".
4. **Algorithm and solver selector.** Choice over solvers, preconditioners, discretisations, or proof strategies from a text description of the instance. Grounding: Rice 1976, Kerschke 2019, Bengio et al. 2021 ("ML to configure an algorithm").
5. **Runtime guard / monitor.** Inline check of each agent action, LLM output, or operator command against policy before it executes. Differs from the verifier role because it sits in the live path and latency matters (under 100 ms to stay invisible). Must not be the sole barrier (sections 5 and 11).
6. **Reranker.** Score the top-k candidates from cheap retrieval. Grounding: Nogueira & Cho, BTZSC. Distinct from "select, do not generate" because the output is an ordering used downstream.
7. **Fuzzifier / linguistic-variable sensor.** Score maps a text or code-bucketed state onto ordered linguistic levels that feed a Mamdani-style rule table or PSL model. Grounding: Zadeh, Mamdani, PSL. Note the semantics caveat in section 8.
8. **Acquisition scorer for expert time.** Calibrated uncertainty ranks which items a scarce expert should label or review next. Grounding: Settles. Pairs with role 2.

**Cross-cutting design rules the report can state**
- Put code, solvers, and rules in charge of numbers and multi-step logic. Use Jev for single-hop semantic tests between them.
- Validate and calibrate *each question* on a small labelled set. Set thresholds from costs. Escalate the reject band.
- Batch sibling questions into one request. It cuts effective latency to a few milliseconds per judgment and eases the request cap.
- Never make Jev the only control where text is untrusted or where a safety function is at stake.
- Where a loop is too fast or too isolated for a hosted call, distil.

### Gaps
- Roles 1, 3, 4, 5, and 7 are inferred from analogues. I found no paper that tests a calibrated, typed, non-generative classifier API in those exact slots.
- Public, independent benchmarks for Jev are missing across the board (calibration, latency tails, long context, injection). This is the single biggest evidence gap for the whole report.
