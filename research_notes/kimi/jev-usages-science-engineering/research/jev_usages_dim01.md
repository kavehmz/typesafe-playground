# Capability Grounding Brief — TypeSafe AI "Jev" (System One Model)

**Purpose:** Ground what Jev can and cannot do (from primary sources), catalog its documented
patterns, and derive general criteria for when a sub-100ms typed judgment beats (a) hard rules,
(b) classical ML, (c) generative LLM calls. Intended to anchor a catalog of industrial/scientific
usages. All doc pages fetched live from docs.typesafe.ai on 2026-09-21 (Mintlify `.md` endpoints);
cookbooks and the launch blog are vendor self-published — flagged as such throughout.

---

## 1. What Jev is (primary-source grounding)

Jev is TypeSafe AI's flagship model and "the first System One model." The docs define the class:

> "System One models are a class of AI models built to make fast, structured decisions that software
> can use directly. A System One model evaluates a state and returns typed answers and probabilities."
> … "Like an LLM, a System One model understands natural-language input. It returns typed decisions
> and probabilities rather than generated text." [^3^]

Founder Diogo Almeida (OpenAI, RLHF co-inventor per the blog) frames it as:

> "Think of Jev as a frontier-intelligence function call: unstructured state in, typed probabilistic
> decisions out." [^19^]

**Training claim (vendor):** a third post-training path alongside RLHF and RLVR, called RLCD —
"Reinforcement Learning for Calibrated Decisions — trains TypeSafe to return decisions and
calibrated probabilities instead of generated text." [^9^] Calibration target (group-level, explicitly
not per-answer): "Outcomes assigned a probability of `0.8` should occur about 80% of the time…
These rates describe groups of predictions, not a guarantee about any single answer." [^9^]

### API shape (exact)

- Single endpoint: `POST https://api.typesafe.ai/v1/systemone` (Bearer auth); also Python/JS SDKs
  (`client.system_one(state=..., questions={...})`). [^2^][^13^]
- Request: `{ "state": <string | JSON object | array>, "model": "jev-latest", "questions": { <id>: {
  "type": "choice" | "score" | "noul", "instructions": <string|object|array>, "criteria": ... } } }`.
  Question IDs are client-side only: "The key is not sent to the underlying model and is not used in
  inference." [^13^]
- **Choice:** criteria = map of option→description; max **255 options**. Returns `choice`,
  `probabilities` (full distribution over options), `confidence` (0–1). [^13^]
- **Score:** criteria = ordered array of 2–**10** level descriptions. Returns `score` (a position that
  "can fall between two" levels), `legend`, `probabilities`, `confidence`. [^5^][^13^]
- **Noul:** yes/no statement; returns `noul` = "The probability that the answer is yes. Near 1 is a
  strong yes, near 0 a strong no, near 0.5 uncertain. Noul has no separate `confidence`." [^5^]
- Parallelism: "All three question types can be mixed in a single API call. Every question is
  evaluated in parallel and in isolation against the same state in one go. Adding questions barely
  changes the response time. Each question is evaluated independently, so adding more questions does
  not create context-rot." [^1^]

### Confidence semantics

- "`confidence` is a statistic computed from the probability distribution the answer already gives
  you" — a peakedness measure over the distribution (approx. `(n·p_max − 1)/(n − 1)`), not a
  separate model output; "We provide `confidence` as a convenient measure… you are never locked into
  our definition." [^6^]
- Documented usage: three bands — high → act automatically; medium → confirm/flag/gather; low →
  "Route to a human, request clarification, or fall back to a different system." And: "A confidence
  threshold is not one number. Different actions within the same system should be gated at different
  levels depending on the consequences of getting it wrong." [^6^]

### Performance, price, limits (as documented, jev-1.13)

- Latency: "Most queries complete in about 100 ms." [^10^] Launch blog: "End-to-end response time is
  70ms-500ms for TypeSafe. This can range from 40x-200x faster [than frontier LLMs]" and "100ms
  speeds means you can use AI in your applications where UX is critical." [^19^] (The "sub-100ms
  today / sub-10ms roadmap" framing is consistent with these vendor numbers; all latency figures are
  vendor-reported "from our laptops on the West Coast." [^19^])
- Price: **$0.042 / Mtok input ($42/Btok); output tokens free**; rate limits 250k tokens/s, 1,200
  req/min. [^7^] Blog compares to LLMs at "$0.20 to $10 / MTok" input with output ~5× input. [^19^]
- Context: "64k tokens per request; 32k tokens for `state` plus the longest question." [^7^]
- Input: **text only** — "Images, audio, and video are not supported (yet)." English primary; other
  languages "handled but not equally well." [^3^][^7^]
- No fine-tuning: "Jev is not fine-tuned or LoRA-adapted with customer data… You shape its answers
  to your domain through the request rather than through per-account weights." ZDR for enterprise. [^7^]
- Headline efficiency claims (vendor, self-flagged as biased): "193.6x faster, 444.6x cheaper" on
  internal workflow evals, with an explicit "Nuance" section admitting reference-answer and
  wrapper biases. [^19^]

---

## 2. What Jev can do — honestly

Grounded in docs + worked cookbooks (vendor-run but published with code, cached responses, and numbers):

1. **Closed-set classification & routing at scale.** One Choice question classifies into ≤255
   classes with a full distribution. Evidence: SEC 10-Ks into 75 industry groups with
   confidence-based fall-up to broader divisions [^14^]; deep patent/retail/biomedical/code
   taxonomies via parallel beam search over Choice probabilities [^14^]; intent routing pattern. [^12^]
2. **Detection / yes-no probabilities (Noul) as soft signals.** PII presence, urgency, refund
   intent, jailbreak/hazard batteries — one call carries many independent Nouls. Guardrails
   cookbook: "A battery of `Noul` questions hands you the probability that each hazard holds, and a
   `Score` question rates how much harm complying would do… 'Ignore your instructions' scores as a
   jailbreak instead of working as one." [^17^]
3. **Rubric scoring with distributions.** Severity, frustration, relevance — with a probability
   over levels, not just a point estimate. [^5^]
4. **Re-ranking / cross-encoding shortlists.** Cookbook: BM25 shortlists (30 passages × 40 CLERC
   legal queries) re-ranked by one question per pair; "top-1 accuracy from 5% to 18% and top-10
   accuracy from 38% to 62%"; 1,200 calls ≈ $0.0645. [^16^]
5. **Semantic search over line/chunk IDs in one call.** GitHub ToS: one Choice over 218 line IDs +
   one Noul for answer presence. [^14^]
6. **Verification of other models' outputs.** Citation support checking against source documents
   with confidence-gated human review [^14^]; SDE cascade where Jev is the verifier rung (see §4). [^18^]
7. **High-cardinality, parallel feature extraction for classical ML.** AutoResearch cookbook: Jev
   questions become numeric features for a CatBoost regressor, iterated against ground truth. [^14^]
8. **Entity resolution / knowledge-graph alignment.** 450 candidate pairs across two beer
   catalogs; one 3-level Score (merge / leave / curate) "carries the whole decision… There is no
   threshold to fit." [^14^]
9. **Closed-set extraction.** Date extraction (Choice over months/days/years with "not stated"
   option, arithmetic in code) [^14^]; pre-parsed value extraction (regex finds candidates, Jev picks
   the right span) [^14^]; function calling (map NL requests onto typed function names + closed-set
   arguments) [^14^]; structure recovery / autoformat [^14^]; skill selection over 182-agent-skill
   catalogs with an explicit "reject all" path [^14^].
10. **Extreme fan-out economics.** 13-question regulatory briefing over the GDPR article: one
    batched call vs 13 calls — "12.2x cheaper, 10.0x faster" ($0.000497 / 0.27s vs $0.006090 /
    2.71s) "with no change in answers"; run-to-run std dev "exactly 0.0" for most answers across 5
    repeats. [^15^] Consistency cookbooks quantify agreement and route residual uncertainty to
    humans. [^14^]
11. **Real-time/interactive use.** Doom bot at ~10 queries/sec (~$7/hour); wikiracing with
    hundreds-to-thousands of link options per step (2-stage score-then-choose for >255 cardinality). [^19^]

## 3. What Jev cannot do — stated limits (docs' own "jaggedness" page)

The vendor maintains an explicit failure-mode page for jev-1.13 (last reviewed 2026-09-17). Verbatim
headlines and fixes: [^8^]

- **Literal reading:** "answers the question you wrote, not the one you meant. Scoping words,
  negations, and implied conditions are read at face value." → state exact conditions; boundary
  cases in criteria.
- **Math and numbers:** "Jev is not a calculator… does not count reliably… the error grows with the
  size of the thing being counted." Also: score expectations are "weak in numerical calibration" —
  do not interpolate exact magnitudes between levels. → count/compute in code; iterate candidates
  and ask one Noul each.
- **Dates/times:** "reads dates as text, not as ordered quantities." → extract parts as Choices,
  compare in code.
- **Indirection:** "A question about a property of a property or something that requires multiple
  hops of reasoning costs accuracy." → fewer hops, name the state fields.
- **Context rot:** "Accuracy falls as the state grows with content unrelated to the decision." →
  filter first (classical retrieval or a Noul relevance gate), send only what's needed.
- **Adversarial content:** "does not treat [state] as hostile by default. Content written to
  adversarially steer the model… can move the answer." → precise criteria; test before deploying.
  (Note: a guardrail screener that is itself steerable needs layering — see §4.)
- **No cross-question invariants:** Noul-vs-Choice and question-vs-negation probabilities do not
  obey arithmetic identities (documented example: `noul=0.72` and its negation `0.47`, sum 1.19).
  "Don't carry a threshold tuned on a Noul over to a Choice, and don't hold the model to arithmetic
  identities between separate questions." [^8^]
- **No generation:** "is not trained to generate text… when the answer space is bounded, turn
  extraction into a Choice over the options… If you really need to generate text… there are other
  models for that." [^8^]
- Architecture-level exclusions (from concept pages): no text-only-beyond-text input, no
  explanations/reasoning traces ("System One models do not write replies, produce code, or generate
  explanations of their reasoning" [^3^]), no customer fine-tuning [^7^], calibration is a population
  property, not a per-answer guarantee [^9^], and each question sees the same state independently —
  "one question's answer is not hidden context for another" (chaining requires a second request). [^5^]

---

## 4. Documented patterns and cookbooks (the design vocabulary)

Four official architectural patterns: [^12^]

| Pattern | Mechanism | Benefits (docs) |
|---|---|---|
| **Speculative fan-out** | Ask every question you might need in one call; code ignores irrelevant answers ("Asking a question you might not need is close to free" [^5^]) | Cost, speed |
| **Confidence-gated routing** | "The answer tells you what; confidence tells you whether to act"; per-action thresholds scaled to stakes (0.6 floor, 0.85 for money movement) | Reliability, safety |
| **Composite scoring** | Decompose a judgment into atomic Scores, normalize, weight in code ("When priorities shift, change a coefficient in your code rather than rewriting a prompt" [^1^]) | Cost, reliability, speed |
| **Intent routing** | Jev as front-door classifier to deterministic logic / specialist LLM / human; "the expensive resources only get invoked for the requests that actually need them" | Cost, speed |

Nineteen cookbooks operationalize these across: parallel batching [^15^], re-ranking [^16^], line-level
semantic search, Markdown structure recovery, function calling, agent-skill selection, KG entity
alignment, RAG passage filtering (keep/flag/drop, incl. prompt-injection drop), citation
verification, **LLM input/output guardrails** [^17^], a **structured-data-extraction cascade**
(mini model extracts → Jev verifies per-field → reasoning model on flagged fields; cascade Pareto
"sits up-and-left of every single model", most of a ≈$0.10/extraction, ≈0.81-quality reasoning
model's quality "at a fraction of its cost" [^18^]), date extraction, regex+select extraction,
hierarchical classification, self-consistency estimation, confidence-based classification fall-up,
and Jev-features-for-CatBoost autoresearch. [^14^]

The SDE-cookbook's verifier design criteria are the most transferable engineering guidance: checks
must be **narrow and grounded** ("one checkable yes/no about one field against the source… vague
questions give mushy, uncalibrated scores"), framed **bad = TRUE** with explicit criteria, **per-field
aggregated with max** ("one confident red flag escalates, instead of being averaged into silence"),
**independent and cheap** ("it has to be cheap, or there are no savings left to capture"), and
**separating/calibrated** so one threshold splits accept vs escalate. [^18^]

---

## 5. Adjacent established practice/theory (the niche Jev occupies)

**Semantic / LLM routing.** An established layer that decides per-request which handler/model
responds. Production shape is a two-stage cascade: embedding-similarity router as fast path with
threshold+margin checks, LLM fallback whose decisions become new labeled examples. [^25^] Learned
routers: RouteLLM (LMSYS/Berkeley, ICLR 2025) trains routers on 55k Chatbot Arena preference pairs
and reports cost reductions of "over 85% on MT Bench, 45% on MMLU, and 35% on GSM8K" while holding
95% of GPT-4 quality; ~1ms router overhead. [^20^] Jev's intent-routing pattern + skill-suggestion
cookbook are this niche, replacing the embedding router or the LLM fallback with a typed judgment.

**Model cascades & deferral economics.** FrugalGPT (Stanford 2023) formalizes cheap→expensive
cascades with a learned scorer: "FrugalGPT can match the performance of the best individual LLM
(e.g. GPT-4) with up to 98% cost reduction or improve the accuracy over GPT-4 by 4% with the same
cost." [^21^] The verifier/scorer is the cascade's weak point — TypeSafe's SDE cookbook is precisely
FrugalGPT with a dedicated calibrated verifier instead of a distilled scorer. [^18^][^21^]

**Guardrails models.** The safety niche is split rule-based vs classifier-based: "Rule-based =
explicit and auditable, but brittle. Classifier-based = flexible, but probabilistic… their scores
are likelihoods, not verdicts… a classifier gives you a number, and someone still has to decide what
number means 'block'." [^23^] Incumbents: Llama Guard family (taxonomy-in-prompt, prompt+response
classification, 8B at "roughly 30–80 ms per call" self-hosted [^24^], arXiv:2312.06674 [^22^]), OpenAI
Moderation (free, 80–150ms, fixed categories), Perspective (0–1 toxicity, sunsetting). [^24^] Jev's
guardrails cookbook differentiates on: policy written per-request in criteria (no fixed taxonomy,
no fine-tune), input+output screening in one ~100ms call, and severity+confidence gating — but with
the vendor-admitted caveat that Jev itself "does not treat [state] as hostile by default." [^8^][^17^]

**LLM-as-judge vs small judges.** GPT-4-class judges reach "~85% agreement with human annotators…
higher than the ~81% agreement humans show with each other," at seconds per judgment and cents per
call [^26^] — fine for offline evals, wrong shape for in-path, per-request decisions (latency, cost,
and the judge's own overconfidence/unstructured output). The guardrails literature quantifies the
in-path budget: "<200ms latency overhead" is a typical guardrail acceptance criterion. [^24^] NVIDIA's
"Small Language Models are the Future of Agentic AI" (arXiv:2506.02153) argues the general thesis:
most agent subtasks are narrow, repetitive, and structured — oversized for frontier LLMs. [^27^]
Jev is the extreme point of that thesis: not a small generative model, but a non-generative decision
model.

**Type-safety/hallucination framing.** TypeSafe's structural argument: "Hallucination and
type-safety are intrinsically related… Having a hallucinated tool call is inconvenient in an agent,
but is an absolute deal-breaker if it's part of a system with latency guarantees or it's buried
several layers deep in a dependency chain." Their type-error rate is "mathematically impossible… 0%"
because outputs are constrained to declared options — a claim that is true of the *schema* by
construction (the semantic answer can still be wrong; see jaggedness). [^19^][^8^]

---

## 6. Decision criteria — when a sub-100ms typed judgment wins

### vs (a) hard rules (regex, allow-lists, deterministic logic)

Use **rules** when the condition is exactly computable: Jev's own docs say "If the unit is something
a regular expression or a parser can find, the count belongs in code and the model has nothing to
add" [^8^], and "Keep deterministic work in code. It is reliable and cheap." [^10^] Rules are
"precise, predictable, auditable" but "brittle; misses anything not explicitly listed, easy to evade
with rephrasing." [^23^]
Use a **typed judgment** when the condition is semantic (paraphrase, tone, intent, policy nuance)
and the rule would be an unbounded keyword list. The sweet spot is hybrid: rules pre-filter
candidates (regex finds emails/spans/shortlists), judgment picks/verifies (pre-parsed extraction,
RAG passage filtering cookbooks). [^14^]

### vs (b) classical ML (train-a-classifier)

Classical ML wins when you have (i) labeled data, (ii) a stable label set, (iii) volume that
amortizes training+serving, and (iv) a need for per-millisecond inference. A typed judgment model
wins when: the label set or policy changes faster than retraining cycles (policy in `criteria` is
edited per request, like Llama Guard's taxonomy-in-prompt but without generative parsing [^22^][^17^]);
you have no labels (zero-shot); each item needs several heterogeneous judgments (a 13-classifier
suite = one call [^15^]); or you need calibrated probabilities out of the box rather than Platt-scaling
your own. Bridge pattern documented: use Jev probabilities as **features** for a classical model
(CatBoost) where ground truth exists — judgments as feature extractors, not replacements. [^14^]

### vs (c) generative LLM calls

Use a **generative LLM** when the output must be open-ended text (answers, code, drafts,
explanations), when the answer space is unbounded and can't be enumerated into options, or when
multi-step reasoning over the whole context is genuinely required (Jev: "System Two tasks: more
layers of indirections" are a documented anti-use [^8^]).
A sub-100ms typed judgment wins when **all** of the following hold:
1. **The output is consumed by code, not a human** — branching, routing, gating, sorting. This is
   TypeSafe's core mismatch argument: coercing a text generator into structured decisions, "then
   parsing the results back into something your code can depend on." [^1^]
2. **The answer space is enumerable** (≤255 options, ≤10 rubric levels, or yes/no). [^13^]
3. **The judgment is atomic** — "the kind of judgment a highly knowledgeable person could make in a
   few seconds given the right context." [^1^]
4. **Latency or volume excludes generation**: in-path decisions (<200ms guardrail budgets [^24^]),
   per-item map-reduce over large corpora ($0.0645 for 1,200 re-rank judgments [^16^]), or
   interactive/real-time loops (10 qps game-playing [^19^]). Frontier LLMs are "3 to 329 seconds"
   end-to-end; Jev 70–500ms; LLM judges are seconds. [^19^][^26^]
5. **You need honest uncertainty, not confident prose**: calibrated group-level probabilities +
   confidence for thresholded act/review/escalate policies, vs LLMs that "tend to be overconfident
   and inconsistent" when asked for confidence. [^19^][^9^]
6. **Reproducibility/type-safety matters**: outputs constrained to schema by construction; "Most
   answers came back identical across all 5 repeats." [^19^][^15^]

The general rule, consistent across FrugalGPT/RouteLLM economics and TypeSafe's docs: **a typed
judgment layer pays off wherever a cheap, calibrated, structured *decision* can prevent or gate an
expensive, slow, or risky *generation* (or a human)** — as router, verifier, guardrail, re-ranker,
or feature extractor. It does not replace generation, reasoning, exact computation, or human
judgment on high-stakes ambiguous cases (route those, at confidence-gated thresholds, to LLMs or
people). [^6^][^20^][^21^]

---

## 7. Source-quality caveats

- All TypeSafe capability, latency, price, and benchmark numbers are **vendor-published** (docs,
  cookbooks with shipped code+caches, launch blog). The blog's headline "193.6x faster / 444.6x
  cheaper" carries the vendor's own bias disclosures. No independent third-party evaluation of Jev
  was found in this pass. [^19^]
- Cookbook quality numbers (re-rank 5%→18% top-1, cascade Pareto, guardrail examples) are
  reproducible-in-principle (code + cached responses published) but were run by the vendor on
  jev-1.12/1.13. [^14^][^16^][^18^]
- Adjacent-theory numbers (RouteLLM 85/45/35%, FrugalGPT 98%, Llama Guard latencies) are from
  peer-reviewed/arXiv primary sources or multi-source technical reviews, as cited.

## References

[^1^]: TypeSafe AI Docs — Introduction. https://docs.typesafe.ai/introduction (accessed 2026-09-21)
[^2^]: TypeSafe AI Docs — Quick start. https://docs.typesafe.ai/introduction/quickstart (accessed 2026-09-21)
[^3^]: TypeSafe AI Docs — System One. https://docs.typesafe.ai/concepts/system-one (accessed 2026-09-21)
[^4^]: TypeSafe AI Docs — State. https://docs.typesafe.ai/concepts/state (accessed 2026-09-21)
[^5^]: TypeSafe AI Docs — Primitives (Questions). https://docs.typesafe.ai/primitives (accessed 2026-09-21)
[^6^]: TypeSafe AI Docs — Confidence. https://docs.typesafe.ai/confidence (accessed 2026-09-21)
[^7^]: TypeSafe AI Docs — Models. https://docs.typesafe.ai/models (accessed 2026-09-21)
[^8^]: TypeSafe AI Docs — Jev 1.13 jaggedness (last reviewed 2026-09-17). https://docs.typesafe.ai/model-jaggedness/jev-1.13 (accessed 2026-09-21)
[^9^]: TypeSafe AI Docs — AI primer (RLCD). https://docs.typesafe.ai/introduction/machine-learning-primer (accessed 2026-09-21)
[^10^]: TypeSafe AI Docs — How to build with TypeSafe. https://docs.typesafe.ai/concepts/how-to-build-with-system-one (accessed 2026-09-21)
[^11^]: TypeSafe AI Docs — Example use cases. https://docs.typesafe.ai/concepts/use-case-map (accessed 2026-09-21)
[^12^]: TypeSafe AI Docs — Patterns index + Speculative fan-out / Confidence-gated routing / Composite scoring / Intent routing. https://docs.typesafe.ai/patterns (accessed 2026-09-21)
[^13^]: TypeSafe AI Docs — API reference. https://docs.typesafe.ai/api (accessed 2026-09-21)
[^14^]: TypeSafe AI Docs — Documentation index incl. all cookbook summaries. https://docs.typesafe.ai/llms.txt (accessed 2026-09-21)
[^15^]: TypeSafe Cookbook — Parallel questions. https://docs.typesafe.ai/cookbooks/parallel_questions (accessed 2026-09-21)
[^16^]: TypeSafe Cookbook — Re-ranking (CLERC). https://docs.typesafe.ai/cookbooks/rerank_typesafe (accessed 2026-09-21)
[^17^]: TypeSafe Cookbook — Guardrails for LLMs. https://docs.typesafe.ai/cookbooks/llm_guardrails (accessed 2026-09-21)
[^18^]: TypeSafe Cookbook — SDE cascade. https://docs.typesafe.ai/cookbooks/sde_cascade (accessed 2026-09-21)
[^19^]: D. Almeida, "Introducing System One Models & Jev," TypeSafe AI Blog, 2026-09-15. https://typesafe.ai/blog/introducing-system-one-models-and-jev
[^20^]: I. Ong et al., "RouteLLM: Learning to Route LLMs with Preference Data," arXiv:2406.18665 (ICLR 2025). https://arxiv.org/abs/2406.18665
[^21^]: L. Chen, M. Zaharia, J. Zou, "FrugalGPT: How to Use Large Language Models While Reducing Cost and Improving Performance," arXiv:2305.05176, 2023. https://arxiv.org/abs/2305.05176
[^22^]: H. Inan et al., "Llama Guard: LLM-based Input-Output Safeguard for Human-AI Conversations," arXiv:2312.06674, 2023. https://arxiv.org/abs/2312.06674
[^23^]: TechJack Solutions, "Guardrails and Content Moderation: Complete Guide (2026)," 2026-07-23. https://techjacksolutions.com/ai-knowledge-hub/guardrails-and-content-moderation/
[^24^]: ResumeLens, "Guardrails + Content Moderation — Llama Guard, OpenAI Moderation, Perspective" (latency/provider comparison), 2026-04-24. https://www.resumelens.org/blog/ai/guardrails-and-content-moderation
[^25^]: SurePrompts, "Semantic Router: Embedding-Based Routing Without Calling an LLM," 2026-04-22. https://sureprompts.com/blog/semantic-router-implementation
[^26^]: Confident AI, "LLM-as-a-Judge Simply Explained," 2026-05-16. https://www.confident-ai.com/blog/why-llm-as-a-judge-is-the-best-llm-evaluation-method
[^27^]: P. Belcak et al., "Small Language Models are the Future of Agentic AI," arXiv:2506.02153, 2025. https://arxiv.org/abs/2506.02153
