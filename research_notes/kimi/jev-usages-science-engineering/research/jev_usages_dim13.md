# Cross-Cutting Theory & Economics Foundation — Sub-100ms Typed-Judgment Models
**Catalog dimension 13: When is a fast, cheap, typed judgment model (e.g., TypeSafe AI's Jev — non-generative, JSON state + typed questions → Choice/Noul/Score with probabilities + confidence, sub-100ms latency, ~$0.04/Mtoken, 32K context) the right tool vs. rules, classical ML, generative LLMs, or humans?**

Scope note: All citations are primary or near-primary sources; quantitative claims are quoted verbatim where available. Benchmark numbers are workload-specific and should be read as shapes of tradeoffs, not guarantees.

---

## 1. Model-Cascade & Routing Literature: Cheap Judge in Front of Expensive Models

### FrugalGPT (Chen, Zaharia, Zou, Stanford 2023, arXiv:2305.05176)
The foundational paper on cost-aware LLM deployment. Introduces the **LLM cascade**: a learned scorer evaluates a cheap model's answer and escalates to a more expensive model only when the cheap answer is likely wrong.

- **Quantitative findings:** "up to 98% cost reduction compared to always using the best LLM API, with the same output quality"; reductions of **4–98× in API cost** at equivalent or better quality across benchmarks [^1^][^2^].
- Key mechanism: "The cascade tries cheaper models in sequence, stops when one produces a confident-enough answer, and only calls the expensive model if all others fail the threshold" [^2^].
- Caveat: gains are "strongest on classification and structured-output tasks where correctness is definable and the score distribution is well-separated. For open-ended generation, the gains are more modest" [^3^].
- **Relevance to Jev:** FrugalGPT's cascade scorer *is* the job a typed-judgment model does natively — output a calibrated score + confidence on which to threshold an accept/escalate decision. A purpose-built judgment model replaces an ad-hoc distilled scorer with sub-100ms latency and explicit probabilities.

### RouteLLM (Ong et al., LMSYS/Berkeley, ICLR 2025, arXiv:2406.18665)
Learns routers from preference data between a strong (GPT-4) and weak (Mixtral-8x7B) model.

- **Quantitative findings:** "our router models significantly reduce costs—by over 2x—without substantially compromising quality" [^4^]. On MT-Bench, the matrix-factorization router achieves **~85% cost reduction while maintaining 95% of GPT-4 performance, routing only ~14% of queries to GPT-4**; 45% reduction on MMLU, 35% on GSM8K [^5^][^6^].
- Verbatim (LMSYS blog framing): "All queries that can be handled by weaker models should be routed to these models, with all other queries routed to stronger models, minimizing cost while maintaining response quality" [^5^].
- Router overhead economics: rule-based routing <1ms, embeddings ~5ms, ML classifiers 50–100ms — against LLM response times of 500–2000ms, "the router is never your latency bottleneck" [^7^].
- **Relevance:** RouteLLM's router is itself a small typed classifier producing a [0,1] score thresholded for routing — exactly Jev's output contract (Score + confidence). Jev is a router/judge that understands language context (32K window) rather than embedding similarity.

### LLM Cascades with Mixture-of-Thoughts (Yue et al., ICLR 2024, arXiv:2310.03094)
Uses answer-consistency of a weak LLM (GPT-3.5) as the deferral signal for GPT-4 escalation.

- **Quantitative finding:** "approaches based on a mixture of thought representations achieved comparable task performance with only **40% of the cost of GPT-4**" [^8^].

### Language Model Cascades: Token-Level Uncertainty and Beyond (Gupta et al., Google DeepMind, ICLR 2024)
Formalizes token-level uncertainty deferral rules in cascades; companion work "When does confidence-based cascade deferral suffice?" (Jitkrittum et al., NeurIPS 2024) analyzes when a cheap-model confidence score is an adequate deferral signal — the theoretical basis for confidence-thresholded triage [^9^].

### Faster Cascades via Speculative Decoding / Speculative Cascades (Narasimhan et al., Google DeepMind, ICLR 2025, arXiv:2405.19261)
Combines cascades (sequential deferral on hard inputs) with speculative decoding (parallel verify) and characterizes the **optimal deferral rule**.

- Verbatim: "cascades offer better cost-quality trade-offs, often even outperforming the large model, while theoretically, speculative decoding offers a guarantee of quality-neutrality. In this paper, we leverage the best of both… Experiments with Gemma and T5 models… show that our approach yields better cost quality trade-offs than cascading and speculative decoding baselines" [^10^].
- Speculative decoding itself (Leviathan et al., Google, ICML 2023) achieves 2–3× speedups by having a small drafter propose tokens the large model verifies in parallel [^11^].
- **Relevance:** Even *inside* a single inference stack, the field has converged on "small fast model first, defer/verify by rule." A typed-judgment model generalizes that deferral rule to arbitrary semantic judgments, not just token confidence.

### Takeaway (Section 1)
Every serious cost/latency optimization of LLM serving converges on the same architecture: a cheap, fast decider in front of expensive capacity, gated by a **calibrated threshold**. Reported savings: 2–10× cost reduction typical, up to 98% at matched quality on structured tasks. The decider's quality and calibration — not its raw power — is the binding constraint. That is precisely the component a sub-100ms typed-judgment model industrializes.

---

## 2. LLM-as-a-Judge: Biases, Costs, and the Rise of Small Specialized Judges

### The large-judge baseline and its biases (Zheng et al., NeurIPS 2023, "Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena", arXiv:2306.05685)
- GPT-4 as judge reaches "**over 80% agreement** with human preferences — the same level of agreement between humans" [^12^].
- But the same paper documents systematic biases: **position bias** (up to ~75% preference for the first-presented response in some configurations), **verbosity bias** (favoring longer answers), **self-enhancement bias** (GPT-4 favored its own outputs ~10% higher win rate; Claude-v1 ~25%) [^12^][^13^].
- Follow-up work catalogs seven+ bias types (CALM, Ye et al. 2024), familiarity/low-perplexity bias (Stureborg et al. 2024), and social/stylistic biases (Chen et al. 2024) [^14^][^15^].
- Cost & operational issues with proprietary judges: "closed-source nature, uncontrolled versioning, and prohibitive costs" (Prometheus abstract) [^16^].

### Small specialized judges matching large generative judges
- **Prometheus** (Kim et al., 2023, arXiv:2310.08491): a 13B open evaluator LLM trained on 100K rubric-graded feedback instances. "Prometheus scores a **Pearson correlation of 0.897 with human evaluators**… which is **on par with GPT-4 (0.882)**, and greatly outperforms ChatGPT (0.392)" [^16^]. Prometheus 2 (8B Llama-3.1 base) supports direct assessment and pairwise ranking [^17^].
- **JudgeLM** (Zhu et al., 2023, arXiv:2310.17631): fine-tuned 7B–33B judges; "**JudgeLM-7B only needs 3 minutes to judge 5K samples with 8 A100 GPUs**"; "achieving an agreement **exceeding 90% that even surpasses human-to-human agreement**" with the GPT-4 teacher judge [^18^].
- **PandaLM** (Wang et al., 2023, arXiv:2306.05087): "PandaLM-7B achieves **93.75% of GPT-3.5's evaluation ability and 88.28% of GPT-4's** in terms of F1-score" [^19^].
- **PAJAMA** (Huang, Qiu, Sala, 2025–26): reward models distilled from cheap programmatic judges "outperform those trained on proprietary GPT-4 labels on RewardBench, at **45–50× lower labeling cost**" ($6.49–$7.21 one-time vs. $296–$364 per 20K labels) [^20^].
- **LlamaGuard** (Inan et al., Meta, 2023, arXiv:2312.06674): a Llama2-7B safety classifier that "matches or exceeds… currently available content moderation tools" (incl. OpenAI Moderation API) on ToxicChat/OpenAI eval sets; outputs a **binary safe/unsafe decision whose "classifier score can be read off from the probability of the first token"** — a typed judgment with a probability, i.e., the same output contract as Jev [^21^]. LlamaGuard-3-1B / Guard-4-12B continue the small-guard line; LlamaGuard 4 12B serves at **$0.18/M token** [^22^].
- Caveat (Huang et al., Findings of ACL 2025): "Fine-tuned judge models are task-specific classifiers" — small judges match large ones **within their training distribution** but don't substitute for GPT-4 as a *general* judge [^23^]. This argues for typed, task-scoped judgment models (exactly Jev's design) rather than general-purpose small judges.

### Takeaway (Section 2)
The evidence base says: for a **defined judgment task with a defined rubric**, a specialized small judge matches or beats a frontier generative judge at 10–100× lower cost and latency — but only when (a) the judgment is typed/scoped and (b) calibration/bias are managed. Generative judges carry position/verbosity/self-preference biases and high cost; a non-generative typed judge with explicit probabilities avoids the decoding-time biases (no verbosity channel, no position swapping) and is cheap enough to run on *every* item, not just samples.

---

## 3. Historical Precedent: BERT-Era and Earlier Industrial Judgment Models

### Gmail spam filtering — tiny-model judgment at planetary scale
Google has run ML judgment models on effectively all inbound email for a decade: "Gmail's AI-powered defenses stop more than 99.9% of spam, phishing and malware from reaching inboxes and block nearly 15 billion unwanted emails every day" (Google, Oct 2023) [^24^]. In Dec 2024 Google added an LLM-based filter that "blocks 20% more spam and processes 1,000 times more user-reported spam each day" — notably, even Gmail still layers a *judgment LLM on top of* its cheap classifiers rather than replacing them [^25^]. Industry-standard architecture: rule-based pre-filter (~60–70% of obvious spam, no ML cost) → lightweight ML (LightGBM/TF-IDF) for ~95% of remaining traffic → distilled BERT only for low-confidence cases [^26^]. This is the canonical three-tier rules → classical ML → language-model cascade.

### Smart Reply (Kannan et al., Google, KDD 2016)
Production Gmail/Inbox response suggestion: an LSTM scorer fronted by a **separate cheap feedforward "triggering model"** that "decides whether or not to suggest responses… we have the option to use a computationally cheaper architecture than what is used for the scoring model; this keeps the system scalable" [^27^]. Also uses semantic clustering ("semantic intent" clusters) because lexical rules "would not be sufficient to capture the wide variability" of meaning — the semantic-nuance gap small keyword classifiers couldn't cross in 2016 [^27^]. Result: 10% of mobile replies composed with Smart Reply.

### DistilBERT (Sanh et al., Hugging Face, 2019, arXiv:1910.01108)
The canonical compressed judgment model: "reduce the size of a BERT model by 40%, while retaining **97% of its language understanding capabilities and being 60% faster**" [^28^]; 71% faster on-device (iPhone 7 Plus); within 0.6% of BERT on IMDb sentiment [^29^]. Established that a distilled language model can carry most of a big model's judgment quality at a fraction of serving cost — the direct ancestor of today's distilled routers (RouteLLM trains DistilBERT-style classifiers as routers).

### Where the BERT era failed — the gap a language-native judgment model fills
Pre-LLM classifiers (Naive Bayes, TF-IDF+LR, even fine-tuned BERT) required per-task labeled datasets, broke on distribution shift and obfuscation, and had no notion of instructions/rubrics or zero-shot semantic judgment ("Misses semantic meaning, no cross-feature interactions" for TF-IDF models) [^26^]. BERT-era judges couldn't (a) take a typed question + state in natural language/JSON, (b) generalize to new judgment criteria without retraining, or (c) emit calibrated probabilities+confidence natively. A language-native typed-judgment model keeps DistilBERT-class economics (small, fast, cheap) while inheriting instruction-following and semantic nuance from LLM pretraining.

### Takeaway (Section 3)
For 25 years, production systems have put small judgment models (rules → naive Bayes → BERT → distilled transformers) on every message at enormous scale, escalating only the hard residue. The pattern is settled engineering; what changed is that a ~sub-100ms *language-native* judge now closes the semantic-nuance gap that forced escalation to humans or frontier LLMs.

---

## 4. Systems-Theory Framing: System 1/System 2 and Internal Gating

### Dual-process theory (Kahneman, "Thinking, Fast and Slow", 2011)
"System 1 operates automatically and quickly, with little or no effort and no sense of voluntary control. System 2 allocates attention to the effortful mental activities that demand it, including complex computations" [^30^]. The design lesson widely cited in AI: run System 1 by default; let it escalate to System 2 when its confidence or a metacognitive check fails.

### Thinking Fast and Slow in AI (Booch et al., IBM, AAAI 2021)
Formalizes the SOFAI (Slow-and-Fast AI) architecture with **metacognitive arbitration** between a fast solver and a slow reasoner — the template for verifier-layer architectures [^31^].

### Talker-Reasoner (Christakopoulou, Mourad, Matarić, Google DeepMind, 2024, arXiv:2410.08328)
"A 'Talker' agent (System 1) that is fast and intuitive… and a 'Reasoner' agent (System 2) that is slower, more deliberative, and more logical… We describe the new Talker-Reasoner architecture and discuss its advantages, including **modularity and decreased latency**" [^32^]. Deployed in a sleep-coaching agent and later clinical intake systems.

### Production instantiation (Rows "Kahneman Architecture", 2026)
A small fast classifier "looks at the request and decides: is this simple or complex?… the AI equivalent of a gut check… takes less than one second"; System 1 tasks median 6s vs System 2 tasks 69s [^33^].

### MoE gating as the internal precedent
- **Jacobs et al. 1991** ("Adaptive Mixtures of Local Experts"): gating network assigns inputs to specialized experts [^34^].
- **Shazeer et al., ICLR 2017** ("Outrageously Large Neural Networks: The Sparsely-Gated MoE Layer"): "We introduce a Sparsely-Gated Mixture-of-Experts layer (MoE), consisting of up to thousands of feed-forward sub-networks. A **trainable gating network determines a sparse combination of these experts to use for each example**… achieving greater than 1000x improvements in model capacity with only minor losses in computational efficiency" [^35^]. Gating runs a tiny softmax classifier per token per layer — i.e., frontier models already make millions of cheap typed judgments internally per forward pass.
- Switch Transformer (Fedus et al., 2021): top-1 routing per token, trillion-parameter scale at constant FLOPs [^36^].
- **Relevance:** MoE proves that per-input learned routing by a cheap gate is *how the largest models themselves* allocate compute. An external typed-judgment model is the same gating function, lifted from inside the network to the system level — routing whole requests, actions, or content items instead of tokens.

### Takeaway (Section 4)
Both cognitive theory and the internals of frontier models endorse the same architecture: a fast, cheap, always-on judgment layer whose confidence decides whether to act immediately or escalate to slow deliberation. A sub-100ms typed-judgment model is the explicit, inspectable, system-level realization of the System-1/gating function.

---

## 5. Calibration Literature: Why Probabilities + Confidence Enable Thresholds

- **Platt scaling** (Platt, 1999): fits a sigmoid on raw classifier scores to yield calibrated probabilities, P(y=1|f) = 1/(1+exp(A·f+B)) [^37^]. Extensions: isotonic regression (Zadrozny & Elkan 2002), temperature scaling for DNNs (Guo et al., ICML 2017), which showed modern nets are systematically overconfident and correctable by a one-parameter scale [^38^]. Lesson: **a threshold policy is only as good as the calibration of the score it thresholds** — a judgment model that emits well-calibrated probabilities+confidence can be wired directly into accept/escalate rules without a post-hoc recalibration stage.
- **Classification with a reject option** (Chow, 1970): the optimal reject rule is a confidence threshold that minimizes expected risk given a cost of abstention — the original decision-theoretic license for triage [^39^].
- **Selective prediction** (El-Yaniv & Wiener, JMLR 2010; Geifman & El-Yaniv, NeurIPS 2017): risk-coverage tradeoff — "our method allows a user to set a desired risk level… For example, using our method an unprecedented 2% error in top-5 ImageNet classification can be guaranteed with probability 99.9%, and almost 60% test coverage" [^40^]. SelectiveNet (ICML 2019) trains an integrated reject head [^41^]. For LLM-era judges, softmax confidence thresholding gives smooth risk-coverage curves — i.e., "automate the confident 60–90%, route the rest" is a *provably well-founded* operating mode, and the value of a judge scales with how calibrated its confidence is.
- **Conformal prediction** (Vovk et al.; Angelopoulos & Bates 2021, arXiv:2107.07511): distribution-free prediction sets with finite-sample coverage guarantees; **conformal risk control** (Angelopoulos et al., ICLR 2024) tunes any threshold to bound expected loss [^42^]. **Conformal triage for medical imaging** (Angelopoulos et al., medRxiv 2024) operationalizes the exact pattern: calibrated model scores triage which cases need human/expensive review under capacity constraints with statistical guarantees [^43^].
- **Relevance:** Jev's probabilities+confidence output is the direct input to Chow/El-Yaniv threshold policies and conformal risk control. A judgment model whose confidence is calibrated converts "should we automate this item?" from a heuristic into an expected-value computation with guarantees.

---

## 6. Decision-Theoretic Framing: Value of a Judgment

The economics of any judgment call reduce to:

**Automate when:** E[cost of error] × P(error | model judgment) + cost_of_call < cost of the next-best alternative (expensive model, human).

- **Cost-sensitive learning** (Elkan, IJCAI 2001, "The Foundations of Cost-Sensitive Learning"): the optimal classification threshold is not 0.5 but a function of the ratio of false-positive to false-negative costs; "class probability thresholds should shift based on misclassification costs" [^44^]. A typed judgment model emitting calibrated probabilities makes this threshold policy computable per deployment.
- **Chow's rule** (1970) similarly prices abstention: escalate when the cost of a possible error exceeds the cost of escalation [^39^].
- **Value of information** (classical decision theory; Howard 1966): a cheap judgment is worth buying iff its cost < expected reduction in decision loss. At ~$0.04/Mtoken and sub-100ms, the call cost approaches zero, so the break-even error-reduction is tiny — the model is justified even for very low-stakes per-item decisions, which is precisely the regime where humans ($0.01–$1+/item, seconds-to-minutes latency) and generative LLMs (100× token cost, seconds of latency) are uneconomic.
- Implication of RouteLLM/FrugalGPT numbers (§1): most production traffic is "easy," so expected error avoided per expensive call is low; a cheap calibrated judge captures 50–98% of the cost saving by correctly *not* escalating [^1^][^5^].
- **Relevance:** The decision-theoretic frame yields crisp selection criteria (below): automation is justified where volume × per-item stakes × judge accuracy clears the (near-zero) call cost, and escalation is justified exactly where the judge's own confidence says error risk exceeds escalation cost.

---

## Synthesis: Selection Criteria — Typed Fast Judge vs. Rules vs. Classical ML vs. Generative LLM vs. Human

**Use a sub-100ms typed-judgment model (Jev-class) when ALL of:**
1. **The judgment is typed and scopeable** — expressible as Choice/Noul/Score over a defined state (routing, gating, safety, consistency, intent, quality-threshold checks). Evidence: fine-tuned small judges match large judges *within task scope* but not generally (Huang et al. 2025; PandaLM/JudgeLM/Prometheus results) [^19^][^23^].
2. **Volume × latency makes generative calls or humans uneconomic** — per-item decisions at high throughput (routing every request, moderating every message, gating every action). At ~$0.04/Mtoken and <100ms, call cost is negligible vs. 100× token cost and seconds of latency for generative judges [^16^][^21^].
3. **A calibrated accept/escalate threshold is the control policy** — you will threshold on probability/confidence (Chow rule; selective prediction; conformal risk control), automating the confident majority and escalating the rest. The judge must emit calibrated probabilities, not just labels [^39^][^40^][^42^].
4. **Semantic nuance defeats rules/keywords but the task is well-bounded** — the Smart Reply/Gmail gap: lexical rules miss paraphrase and intent; a language-native judge closes it without paying frontier-LLM prices [^26^][^27^].
5. **Determinism, auditability, and structured output are required** — typed outputs with probabilities (no free-text parsing, no decoding-time verbosity/position biases of generative judges) [^13^][^21^].

**Prefer rules when** the decision boundary is fully enumerable and stable (blocklists, schema validation) — zero ML cost and perfect auditability; rules still handle the first 60–70% in mature pipelines [^26^].
**Prefer classical ML / fine-tuned small classifiers when** you have abundant in-domain labels, a fixed single task, and need the absolute cheapest inference — with the accepted cost of retraining per policy change and no instruction/rubric flexibility [^26^][^28^].
**Prefer a generative LLM when** the judgment requires open-ended reasoning, explanation, novel rubrics applied ad hoc, or world knowledge beyond the typed schema — accept 100× cost/latency and judge biases, mitigated by rubrics and audits [^12^][^16^].
**Prefer a human when** error costs are catastrophic and uninsurable, ground truth is contested/value-laden, or volume is low — and use the typed judge to triage *which* items reach the human (conformal-triage pattern) rather than replacing review entirely [^43^].

**The meta-criterion (from §1–§4):** production economics at every scale — MoE gating, DistilBERT, Gmail, FrugalGPT, RouteLLM, Talker-Reasoner — converge on *always-on cheap judgment + thresholded escalation*. The typed fast judge is the right default for the judgment layer; the only real design questions are its calibration, its scope, and where the escalation threshold sits on your own traffic's risk-coverage curve.

---

## References

[^1^]: Chen, L., Zaharia, M., Zou, J. — "FrugalGPT: How to Use Large Language Models While Reducing Cost and Improving Performance" (2023). https://arxiv.org/abs/2305.05176
[^2^]: NeuralTrust — "LLM Model Routing: Cascade routing and FrugalGPT results" (accessed 2026). https://neuraltrust.ai/blog/llm-model-routing
[^3^]: Jha, A. — "FrugalGPT: What the Paper Actually Says" (accessed 2026). https://ashwanijha.dev/blog/frugalgpt-llm-cost-optimization-what-the-paper-actually-says
[^4^]: Ong, I., Almahairi, A., et al. — "RouteLLM: Learning to Route LLMs with Preference Data" (ICLR 2025). https://arxiv.org/abs/2406.18665
[^5^]: Klymentiev — "LLM Router: RouteLLM Benchmarks, Cost Savings 30-85%" (accessed 2026). https://klymentiev.com/blog/llm-router
[^6^]: Ginger Labs — "RouteLLM vs vLLM Semantic Router" (accessed 2026). https://gingerlabs.ai/blog/routellm-vs-vllm-semantic-router
[^7^]: DigitalApplied — "LLM Model Routing 2026: Cost-Quality Optimization Engineering Guide" (accessed 2026). https://www.digitalapplied.com/blog/llm-model-routing-2026-cost-quality-optimization-engineering-guide
[^8^]: Yue, M., Zhao, J., et al. — "Large Language Model Cascades with Mixture of Thoughts Representations for Cost-efficient Reasoning" (ICLR 2024). https://arxiv.org/abs/2310.03094
[^9^]: Gupta, N., Narasimhan, H., et al. — "Language Model Cascades: Token-Level Uncertainty and Beyond" (ICLR 2024); Jitkrittum, W., et al. — "When Does Confidence-Based Cascade Deferral Suffice?" (NeurIPS 2024). https://arxiv.org/abs/2405.19261 (reference list)
[^10^]: Narasimhan, H., Jitkrittum, W., Rawat, A.S., Kim, S., Gupta, N., Menon, A.K., Kumar, S. — "Faster Cascades via Speculative Decoding" (ICLR 2025). https://arxiv.org/abs/2405.19261
[^11^]: Leviathan, Y., Kalman, M., Matias, Y. — "Fast Inference from Transformers via Speculative Decoding" (ICML 2023). https://arxiv.org/abs/2211.17192
[^12^]: Zheng, L., Chiang, W.-L., et al. — "Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena" (NeurIPS 2023). https://arxiv.org/abs/2306.05685
[^13^]: Comet — "LLM-as-a-Judge: The Ultimate Guide" (bias statistics; accessed 2026). https://www.comet.com/site/blog/llm-as-a-judge/
[^14^]: Ye, J., et al. — "Justice or Prejudice? Quantifying Biases in LLM-as-a-Judge (CALM)" (2024). https://arxiv.org/abs/2410.02736
[^15^]: "Verbosity Bias in Preference Labeling by Large Language Models" (2023). https://arxiv.org/abs/2310.10076
[^16^]: Kim, S., et al. — "Prometheus: Inducing Fine-grained Evaluation Capability in Language Models" (2023). https://arxiv.org/abs/2310.08491
[^17^]: MDPI AI — "FHIR-RAG-MEDS" (Prometheus 2 description, Llama-3.1-8B evaluator; 2026). https://www.mdpi.com/2673-2688/7/7/246
[^18^]: Zhu, L., Wang, X., Wang, X. — "JudgeLM: Fine-tuned Large Language Models are Scalable Judges" (2023). https://arxiv.org/abs/2310.17631
[^19^]: Wang, Y., et al. — "PandaLM: An Automatic Evaluation Benchmark for LLM Instruction Tuning Optimization" (2023). https://arxiv.org/abs/2306.05087
[^20^]: Huang, Qiu, Sala — "PAJAMA: Codifying the Judge" (Sprocket Lab, 2025–26). https://sprocketlab.github.io/PAJAMA/
[^21^]: Inan, H., et al. — "Llama Guard: LLM-based Input-Output Safeguard for Human-AI Conversations" (Meta, 2023). https://arxiv.org/abs/2312.06674
[^22^]: CloudPrice — "LlamaGuard 4 12B pricing & specs" (accessed 2026). https://cloudprice.net/models/deepinfra/meta-llama/Llama-Guard-4-12B
[^23^]: Huang, H., Qu, Y., et al. — "An Empirical Study of LLM-as-a-Judge for LLM Evaluation: Fine-tuned Judge Models are Task-Specific Classifiers" (Findings of ACL 2025). https://arxiv.org/abs/2403.02839
[^24^]: Google — "Gmail security update" (Oct 2023), as quoted by EmailAnalytics (accessed 2026). https://emailanalytics.com/gmail-statistics/
[^25^]: Google Blog — "Email scams surge over the holiday — here's how Gmail keeps you safe" (Dec 18, 2024). https://blog.google/products/gmail/gmail-holidays-2024-spam-scam/
[^26^]: TechInterview — "ML System Design: Build a Spam Classifier" (accessed 2026). https://www.techinterview.org/post/3233460094/ml-system-design-build-a-spam-classifier/
[^27^]: Kannan, A., Kurzweil, R., et al. — "Smart Reply: Automated Response Suggestion for Email" (KDD 2016). https://www.kdd.org/kdd2016/papers/files/Paper_1069.pdf
[^28^]: Sanh, V., Debut, L., Chaumond, J., Wolf, T. — "DistilBERT, a distilled version of BERT: smaller, faster, cheaper and lighter" (2019). https://arxiv.org/abs/1910.01108
[^29^]: EMC² NeurIPS 2019 workshop version of DistilBERT paper. https://www.emc2-ai.org/assets/docs/neurips-19/emc2-neurips19-paper-33.pdf
[^30^]: Kahneman, D. — "Thinking, Fast and Slow" (Farrar, Straus and Giroux, 2011); notes: https://grahammann.net/book-notes/thinking-fast-and-slow-daniel-kahneman
[^31^]: Booch, G., Fabiano, F., Horesh, L., et al. — "Thinking Fast and Slow in AI" (AAAI 2021). https://doi.org/10.1609/AAAI.V35I17.17765
[^32^]: Christakopoulou, K., Mourad, S., Matarić, M. — "Agents Thinking Fast and Slow: A Talker-Reasoner Architecture" (Google DeepMind, 2024). https://arxiv.org/abs/2410.08328
[^33^]: Rows — "Meet the Kahneman Architecture: How Thinking, Fast and Slow Influenced the AI Analyst" (accessed 2026). https://rows.com/blog/post/kahneman-architecture
[^34^]: Jacobs, R., Jordan, M., Nowlan, S., Hinton, G. — "Adaptive Mixtures of Local Experts" (Neural Computation, 1991). https://arxiv.org/pdf/2512.12121 (survey reference)
[^35^]: Shazeer, N., Mirhoseini, A., et al. — "Outrageously Large Neural Networks: The Sparsely-Gated Mixture-of-Experts Layer" (ICLR 2017). https://arxiv.org/abs/1701.06538
[^36^]: Fedus, W., Zoph, B., Shazeer, N. — "Switch Transformers: Scaling to Trillion Parameter Models with Simple and Efficient Sparsity" (JMLR 2022). https://arxiv.org/abs/2101.03961
[^37^]: Platt, J. — "Probabilistic Outputs for Support Vector Machines and Comparisons to Regularized Likelihood Methods" (1999); exposition: https://arxiv.org/html/2110.03120v1
[^38^]: Guo, C., Pleiss, G., Sun, Y., Weinberger, K. — "On Calibration of Modern Neural Networks" (ICML 2017). https://arxiv.org/abs/1706.04599
[^39^]: Chow, C.K. — "On Optimum Recognition Error and Reject Tradeoff" (IEEE Trans. Information Theory, 1970); cited in https://arxiv.org/html/2601.00138v2
[^40^]: Geifman, Y., El-Yaniv, R. — "Selective Classification for Deep Neural Networks" (NeurIPS 2017). https://arxiv.org/abs/1705.08500
[^41^]: Geifman, Y., El-Yaniv, R. — "SelectiveNet: A Deep Neural Network with an Integrated Reject Option" (ICML 2019). https://arxiv.org/abs/1901.09192
[^42^]: Angelopoulos, A.N., Bates, S. — "A Gentle Introduction to Conformal Prediction and Distribution-Free Uncertainty Quantification" (2021). https://arxiv.org/abs/2107.07511; Angelopoulos et al., "Conformal Risk Control" (ICLR 2024). https://arxiv.org/abs/2208.02814
[^43^]: Angelopoulos, A.N., et al. — "Conformal Triage for Medical Imaging AI Deployment" (medRxiv 2024). https://arxiv.org/html/2410.06494v2 (references)
[^44^]: Elkan, C. — "The Foundations of Cost-Sensitive Learning" (IJCAI 2001); cited in https://arxiv.org/html/2511.20944v2
[^45^]: Gu, J., Jiang, X., et al. — "A Survey on LLM-as-a-Judge" (2024). https://arxiv.org/abs/2411.15594
