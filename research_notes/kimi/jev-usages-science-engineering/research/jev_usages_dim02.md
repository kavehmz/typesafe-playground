# Jev in Software Engineering: Evidence-Grounded Usage Catalog

**Dimension 02 — Software Engineering usages of a fast, cheap, typed-judgment ("System One") model.**

**The technology (as documented).** TypeSafe AI's Jev (launched 2026-09-15) is a non-generative decision model: the caller supplies a `state` (string / JSON object / array) plus a map of typed questions, and receives, in a single parallel pass, per-question answers of three primitives — **Choice** (pick 1 of ≤255 developer-defined options; returns full probability distribution + confidence), **Score** (position on a 2–10-level ordered rubric; distribution + confidence), and **Noul** (yes/no proposition; calibrated probability 0–1). Reported end-to-end latency 70–500 ms (vendor-measured), pricing $0.042/M input tokens with output free ("too cheap to meter"), 32K-token state context, 1,200 req/min rate limit. Trained with "RLCD — Reinforcement Learning for Calibrated Decisions," which "explicitly optimizes for calibration — a model that says '70% confident' should be right about 70% of the time."[^25^][^26^][^27^] Vendor workflow evals: Jev $0.0004/case vs Opus-class $0.176/case, 67.8% accuracy ≈ Sonnet-tier, 0.4 s vs 78.1 s.[^27^] Design rule of thumb from TypeSafe: "a good question is something a knowledgeable person could decide in a few seconds once given the right context."[^28^]

**Why this primitive matters for SE workflows.** Across the literature below, the recurring pattern is: (a) high-volume, low-latency-budget decision points where rules are too brittle and full LLM calls are too slow/expensive/unparseable; (b) decisions that are intrinsically *typed* (a verdict, a severity level, a route) rather than textual; (c) value from calibrated probability + confidence to threshold auto-action vs. human escalation. Jev sits exactly in this gap: cheaper and ~100–1000× faster than an LLM-judge, more semantically flexible than a hand-tuned classifier, and schema-safe by construction ("No improvised label can appear outside the options you supplied"[^28^]).

Research method: 28 web searches (5 coarse-to-fine waves), primary sources prioritized. Confidence per usage reflects strength of direct evidence that the *judgment task itself* is real, valuable, and automatable at this speed/cost point.

---

## 1. SAST / static-analysis alert verdict triage (false-positive suppression)

**One-liner:** Ask Jev "is this static-analysis warning a genuine defect?" on every analyzer finding, auto-suppressing high-confidence false positives before they hit a developer queue.

**Current practice & bottleneck.** SAST tools are notorious for false-positive-heavy output; teams either hand-tune rulesets, pay humans to triage, or ignore findings entirely. Recent work uses LLMs as the triage judge. ZeroFalse (arXiv, Oct 2025) systematically evaluated LLMs for exactly this verdict task and concluded: "LLMs can substantially reduce false positives in static analysis by automating alert triage… easing developer workload by suppressing spurious reports," with the caveat that "effective triage depends critically on LLM design" and smaller models sacrifice recall.[^1^]

**Primitive design.** State: the flagged code hunk ± surrounding function, CWE/rule ID, tool name, dataflow summary. Questions (parallel, one call): `Noul` "This warning describes a genuinely exploitable/real defect"; `Choice` verdict ∈ {true_positive, false_positive, needs_human}; `Score` severity on a 4-level rubric. Code policy: confidence > 0.95 & FP → auto-dismiss with audit log; TP → route to remediation; low confidence → human queue.

**Why sub-100ms / $0.04/Mtok / typed matters.** Large repos produce thousands of findings per scan; a per-finding GPT-class call (seconds, ~$0.01+) makes whole-repo scans unaffordable and slow, and free-text verdicts need parsing/validation. Jev's closed verdict space eliminates malformed labels; the calibrated Noul probability *is* the suppression threshold knob. A 32K state fits a full function context. At ~$0.042/Mtok, triaging a 10k-finding scan costs cents.

**Evidence:** ZeroFalse[^1^]; broader LLM-triage framing in incident/SOC analogs.[^2^]
**Confidence: High** (the verdict task is published, benchmarked, and directly shaped like a Jev Noul/Choice).

---

## 2. Secret-scanning alert verification (GitHub-style LLM verification stage)

**One-liner:** Replace or front GitHub's LLM "is this flagged string a real leaked credential?" verification stage with a Jev Noul per finding.

**Current practice & bottleneck.** Pattern/entropy-based secret scanners are noisy: a 2023 benchmark of 9 tools found top precision of only 75% (GitHub Secret Scanner), 46% (Gitleaks), 25% (a commercial tool); "false positives are due to employing generic regular expressions and ineffective entropy calculation."[^21^] GitHub's production answer (June 2026, with Microsoft Security's Agents Offense team) was an LLM contextual-verification stage that examines "variable names, surrounding code, comments, and file paths" — cutting customer-confirmed false positives by **75.76%**.[^22^]

**Primitive design.** State: matched string, ±20 lines of context, file path, variable name, file type (docs/test/config/src), commit message. Questions: `Noul` "This string is a live credential, not a placeholder/example/test fixture"; `Choice` context-type ∈ {documentation, test-fixture, example-code, real-config, source-code}; `Noul` "Appears in a file path suggesting non-production use". Compose verdicts in code.

**Why it matters.** GitHub scans "billions of pushes" — 39M secret leaks detected in public repos in 2024.[^22^] At that volume, a frontier-LLM verification call per finding is a serious cost/latency line item; Jev's ~$0.0004/case vs $0.03–0.18/case for frontier models[^27^] is a ~100–400× saving on a workload GitHub has already proven is a judgment (not generation) task. Typed verdict also gives a cleaner audit trail than parsed prose.

**Evidence:** tool-precision study[^21^]; GitHub LLM-verification deployment.[^22^]
**Confidence: High** (deployed-at-scale precedent for exactly this judgment; Jev is a cost/latency-optimized substitute for the same stage).

---

## 3. Flaky-test judgment in CI failure triage

**One-liner:** When a CI test fails, Jev judges "is this failure flakiness or a real regression?" to gate retry/quarantine vs. blocking the merge.

**Current practice & bottleneck.** Flaky tests "cause false failures, increased triage effort, delayed releases, and reduced confidence in automation"; naive retries "mask symptoms rather than addressing root causes."[^7^] Research predictors exist: FlakeFlagger (ICSE 2021) predicts flakiness from test/code features *without rerunning*[^8^]; Flakify (IEEE TSE 2022, CodeBERT fine-tune) beat it by +10pp precision / +18pp recall.[^9^] **Critical caveat:** Lampel et al. (ESEC/FSE 2023) ran a SOTA predictor on Chromium CI — 99.2% precision at flagging flaky tests, yet it "misclassified 76.2% of genuine fault-triggering failures as flaky."[^9^] Aggressive suppression masks real regressions — so this judgment needs calibrated probabilities and conservative thresholds, not a hard classifier.

**Primitive design.** State: test name + failure stack/log tail, recent history (fail-rate, last N outcomes), diff summary of the triggering commit. Questions: `Noul` "This failure is consistent with known flaky behavior of this test"; `Noul` "The failing assertion plausibly relates to code changed in this commit" (change-relevance check — the Lampel failure mode); `Choice` action ∈ {rerun, quarantine, block_merge, human_review}.

**Why it matters.** This decision fires on every red build — thousands/day in large CI fleets, on the critical path of developer feedback. A 3–300 s LLM call per failure is untenable; a sub-100ms calibrated Noul with an explicit, tunable threshold directly encodes the asymmetry the Chromium study warns about (never auto-dismiss on low confidence). Typed action output plugs straight into CI orchestration.

**Evidence:** FlakeFlagger[^8^]; Flakify & Chromium caveat[^9^]; flaky-CI motivation.[^7^]
**Confidence: High** (active research area + documented production failure mode that a calibrated, confidence-gated judge directly addresses).

---

## 4. Test selection & prioritization in CI (per-test failure-risk scoring)

**One-liner:** Per commit, Jev Scores each test's likelihood of exposing a fault, ordering the suite for fastest fault detection under a compute budget.

**Current practice & bottleneck.** "Running all tests can be time-consuming and resource-intensive" at CI frequency; the ML-based TSP literature (SLR: 29 primary studies, 2006–2020) uses RL, clustering, ranking models, and NLP features to predict per-test failure probability.[^4^] Comprehensive re-evaluation (Zhao et al., 2023) found pretrained ranking models produce the optimal sequence on 80% of subjects vs 50% for the prior best.[^5^] Commit-aware TCP (2026) shows diff-structure features matter: removing them causes "a systematic collapse of classification performance."[^6^] Bottleneck: per-project training pipelines, feature engineering, cold start.

**Primitive design.** State (per test or per test-class batch): diff summary, files touched, test history stats, coverage relation. Questions: `Score` "likelihood this test fails on this commit" (5-level rubric); `Noul` "This test exercises code changed in this commit." Rank tests by score; execute top-k within budget. Many tests can be batched per call (32K state), and questions parallelize.

**Why it matters.** TCP scoring must run between "push" and "first test starts" — latency budget is seconds for the whole suite ordering. Thousands of tests × an LLM is prohibitive; Jev's ~1k-token-per-test judgment at $0.042/Mtok scores a 5k-test suite for well under a cent. Typed Score + distribution gives a principled cutoff (execute until cumulative probability mass) rather than an opaque rank.

**Evidence:** TSP SLR[^4^]; Zhao et al.[^5^]; commit-aware TCP[^6^]; CI-skip RL framing.[^23^]
**Confidence: Medium–High** (task proven; Jev-as-zero-shot-ranker accuracy vs. trained rankers is the open question).

---

## 5. Code review triage & reviewer routing

**One-liner:** For each incoming PR, Jev picks the best reviewer(s), flags risk, and sets review urgency — replacing similarity-heuristic recommenders and manual triage.

**Current practice & bottleneck.** ML reviewer recommendation is established: RevFinder ranks candidates by file-path similarity of past reviews; CORMS adds features + SVM.[^10^] Limitations: shallow lexical/path signals, no semantic understanding of the change, fairness issues, and per-repo retraining. Humans still hand-route in most teams; LLM routing is too slow/costly to run on every PR event.

**Primitive design.** State: PR title, description, diff stat + key hunks, touched paths, author, recent reviewer load. Questions: `Choice` reviewer ∈ team roster (up to 255 options fits most orgs; criteria = each reviewer's areas); `Score` review-rigor need ∈ {rubber-stamp … deep-review} (5 levels); `Noul` "Touches security- or safety-sensitive code"; `Noul` "Likely authored/trivially mechanical (format, bump, generated)". Policy: low-rigor + mechanical → auto-approve path candidate; sensitive → require domain owner.

**Why it matters.** PR events are high-frequency and latency-irrelevant for humans but volume-heavy; the win is semantic routing quality at rule-engine cost. Typed Choice over an enumerated roster is exactly Jev's native shape (TypeSafe's own quickstart example is team routing).[^26^] Confidence drives escalation: low-confidence routing → round-robin fallback.

**Evidence:** RevFinder/CORMS description[^10^]; Dependabot-style crowd-sourced merge-confidence precedent.[^24^]
**Confidence: Medium** (task established; semantic-Jev vs. path-similarity head-to-head untested).

---

## 6. Just-in-time defect / merge-risk prediction for PRs and dependency bumps

**One-liner:** Score every commit/PR (including bot dependency updates) for defect risk, gating CI depth and review intensity.

**Current practice & bottleneck.** JIT defect prediction is a mature research line used "at large software companies": DeepJIT (CNN over commit message + code change) outputs a defect probability; CC2Vec pretrains distributed change representations and improves on it.[^11^][^12^] For dependency updates, GitHub's Dependabot computes a "compatibility score" — "the percentage of CI runs that passed when updating the dependency between the same origin and target versions" — a crowd-sourced heuristic that requires ≥5 candidate updates and is often "unknown" for less-common packages.[^24^]

**Primitive design.** State: diff, commit message, author/history stats, touched-module criticality; for dep-bumps: package, version delta, changelog excerpt, breaking-change hints, repo's usage sites. Questions: `Noul` "This change is likely to introduce a defect"; `Score` risk ∈ 5 levels; `Noul` "This dependency update likely contains breaking changes affecting this repo's usage"; `Choice` recommended CI depth ∈ {smoke, standard, extended}.

**Why it matters.** Fires on every commit — must be near-free and sub-second to sit in the push path. Jev replaces per-project model training (DeepJIT/CC2Vec need training data pipelines) with a prompted judgment, and fills Dependabot's "unknown-score" gap with a semantic read of changelogs. Typed Score = direct gate threshold.

**Evidence:** DeepJIT/CC2Vec formulation[^11^][^12^]; Dependabot compatibility-score study.[^24^]
**Confidence: Medium** (task proven; accuracy of generic judgment vs. trained JIT models unverified).

---

## 7. Duplicate bug report detection (triage-time dedup judgment)

**One-liner:** Given a new bug report and the top-k retrieval candidates, Jev judges "is this the same underlying defect?" to auto-link duplicates.

**Current practice & bottleneck.** "Rule and Query-based solutions recommend a long list of potential similar bug reports with no clear ranking… triage engineers are less motivated to spend time going through an extensive list."[^13^] State of practice is two-stage: embedding retrieval (BERT/MiniLM/MPNet) to shortlist, then a classifier (XGBoost/SVM/LR) on pairs.[^14^] Bottleneck: pairwise classification at scale, and the final "same root cause?" call is semantic — summaries describe different symptoms of one defect.

**Primitive design.** Retrieval (cheap embeddings) shortlists 5 candidates — unchanged. State: new report + one candidate report (title, description, STR, stack trace, affected components). Questions (one call per candidate pair, parallel): `Noul` "These two reports describe the same underlying defect"; `Choice` relation ∈ {duplicate, same_component_different_bug, unrelated}; `Score` similarity confidence rubric. Threshold Noul ≥ 0.9 → auto-mark duplicate; 0.5–0.9 → show to triager ranked.

**Why it matters.** Duplicate triage is a volume task (Juniper-scale trackers: thousands of reports[^13^]) where each pair judgment is tiny. An LLM per pair is too slow/expensive for every inbound report; a classic classifier lacks semantics. Jev's calibrated Noul gives the precision/recall dial triage teams need, at cents per thousand judgments.

**Evidence:** NLP auto-labelling paper (70% recall@5)[^13^]; two-stage retrieval+classification preprint.[^14^]
**Confidence: High** (the pair-verdict stage is a documented bottleneck with the exact Noul shape).

---

## 8. SOC security-alert triage (benign-close / escalate verdicts)

**One-liner:** Per SIEM alert, Jev returns TP/FP verdict + severity + next-action, auto-closing high-confidence benign alerts.

**Current practice & bottleneck.** Analysts drown in benign alerts ("alert fatigue"); triage takes 5–15 min/alert, most are FPs.[^15^] The strongest production evidence: **AACT** (Sophos/Flare, arXiv May 2025), which learns from analyst triage actions and "predicts triage decisions in real time, allowing benign alerts to be closed automatically" — live deployment **reduced alerts shown to analysts by 61% over six months with a 1.36% false-negative rate over millions of alerts**.[^2^] Calibration research warns that "probabilistic outputs… are frequently miscalibrated" and that thresholds must reflect asymmetric costs (missed attack ≫ false alarm).[^16^]

**Primitive design.** State: alert rule name, raw event JSON, asset criticality, user context, enrichment (IP/domain reputation), related recent alerts. Questions: `Noul` "This alert reflects genuinely malicious activity"; `Choice` disposition ∈ {auto_close_benign, close_benign_true_positive, investigate, escalate_incident}; `Score` severity P1–P5; `Choice` MITRE ATT&CK tactic (≤255 options). Policy mirrors AACT guardrails: auto-close only above a strict benign threshold; mandatory sampling of auto-closed alerts.

**Why it matters.** SOCs process thousands–millions of alerts/day; "mean time to triage (MTTT)… near-zero for non-genuine alerts" is the stated goal.[^15^] Sub-100ms verdicts at $0.042/Mtok make 100% alert coverage (vs sampled review) economical. The calibration requirement in the SOC literature[^16^] is precisely RLCD's design target. Typed output feeds SOAR playbooks without parsing.

**Evidence:** AACT[^2^]; decision-aware calibration framework[^16^]; SOC workflow/metrics.[^15^]
**Confidence: High** (deployed precedent with hard numbers; Jev is the cheap-fast-calibrated version of the same judgment).

---

## 9. Phishing / malicious-email & URL classification at the gateway

**One-liner:** Real-time phishing verdicts on inbound emails/URLs — Noul "is this phishing?" plus category Choice — inline in the mail/web path.

**Current practice & bottleneck.** Blacklists fail on zero-day domains; ML detectors are standard but "either slow or brittle to obfuscation," and deep models are "unsuitable for real-time browser-side deployment."[^17^] A production-grade ensemble (XGBoost+LightGBM+BiLSTM+BERT, 287-dim features, 2.8M URLs) reports 99.6% accuracy with "**real-time classification latency averages 89 milliseconds per sample, satisfying production-grade deployment requirements**"[^18^] — i.e., the field itself has established ~100ms as the latency bar for inline classification.

**Primitive design.** State: email headers (SPF/DKIM/DMARC results), sender, subject, body excerpt, extracted URLs, URL lexical features. Questions: `Noul` "This message is a phishing/social-engineering attempt"; `Choice` category ∈ {legit, phishing, spam, BEC, malware-lure}; `Score` urgency-pressure rubric (credential-harvest lures use urgency); `Noul` "Requests credentials, payment, or gift cards." Compose: block / banner-warn / deliver.

**Why it matters.** This is an inline, every-message decision: latency budget is the published 89ms bar, and volume makes per-message LLM cost absurd. Sub-100ms Jev (roadmap sub-10ms) with $0.042/Mtok meets both. Multi-question parallelism lets one call return verdict+category+urgency, replacing a multi-model pipeline.

**Evidence:** real-time latency + accuracy numbers[^18^]; lightweight-vs-deep tradeoff[^17^]; comparative review noting "real-time latency constraints."[^19^]
**Confidence: Medium–High** (task and latency bar are documented; Jev phishing accuracy vs. specialized ensembles needs benchmarking).

---

## 10. Log anomaly triage: parse → classify → explainability routing

**One-liner:** After Drain-style parsing and DeepLog-style detection flag an anomalous log sequence, Jev judges severity, likely subsystem, and whether it warrants a page.

**Current practice & bottleneck.** The standard pipeline is Drain (online parse tree; "highly efficient when processing a large volume of log data") → sequence anomaly model (LogBERT: 2-layer Transformer over log keys, evaluated against DeepLog/LogAnomaly/PCA/iForest).[^20^] Detection ≠ triage: anomaly scores don't say *what kind* of problem or *who should care*, so humans read flagged sequences. LLM summarizers are too slow for per-anomaly use at log volume.

**Primitive design.** State: the anomalous log-key sequence + raw template instances, service name, recent deploy/config-change context, correlated metric anomaly flags. Questions: `Choice` anomaly class ∈ {resource_exhaustion, dependency_failure, config_error, deploy_regression, security_relevant, benign_noise}; `Score` severity 1–5; `Noul` "Consistent with the deploy/config change in the last hour"; `Noul` "Warrants paging the on-call."

**Why it matters.** Log volumes are extreme; anomaly streams in big fleets can be thousands/hour during incidents. The judgment must cost nothing relative to the ingestion pipeline and return in ms to sit inside streaming alerting. Typed class output maps directly to routing tables and suppression rules; Noul-calibrated page/no-page reduces alert fatigue with an auditable probability.

**Evidence:** Drain/LogBERT pipeline and efficiency claims.[^20^]
**Confidence: Medium** (detection stage is well-evidenced; Jev's added triage layer is a natural but unbenchmarked extension).

---

## 11. Incident alert correlation & severity assignment (AIOps triage)

**One-liner:** Jev decides whether two alerts belong to one incident and what severity the incident is — augmenting fingerprint/time-window correlation with semantics.

**Current practice & bottleneck.** Industry correlation methods each have known failure modes: fingerprint dedup "doesn't link different alerts from one root cause"; time-window clustering is "prone to false grouping"; ML similarity clustering has "opaque grouping logic, needs tuning to avoid over-merging." Forrester-cited ML-assisted triage cuts mean-time-to-triage 25–40% "once historical incident data is applied."[^29^] Severity assignment is still largely manual or rule-of-thumb.

**Primitive design.** State: two alerts (or alert vs. incident summary): rule, service, message, labels, timing, topology distance. Questions: `Noul` "These alerts share a common root cause"; `Choice` relation ∈ {same_incident, cascading_from, coincidental}; then for the merged incident: `Score` severity SEV1–SEV4; `Choice` owning team. Run pair-judgments in parallel per candidate pair from a time-window shortlist.

**Why it matters.** Correlation runs continuously on the alert stream — thousands of pair judgments per outage. Latency must be far below alert arrival rate; cost must be negligible vs. paging a human. Typed Noul + probability distribution over "same incident" gives a tunable merge threshold (avoiding the documented over-merging failure) — exactly where calibration beats a hard clustering cutoff.

**Evidence:** correlation-method taxonomy + Forrester figure.[^29^]
**Confidence: Medium** (practice and bottleneck documented; semantic pair-judgment superiority needs validation).

---

## 12. Incident root-cause triage & runbook/remediation selection (cheap System-1 layer before expensive RCA agents)

**One-liner:** Before (or instead of) a 79-second LLM RCA agent run, Jev classifies the incident signature, selects the runbook/troubleshooting guide, and judges whether full agentic RCA is warranted.

**Current practice & bottleneck.** LLM RCA agents work but are heavy: RCAgent (Alibaba Cloud, tool-augmented, deployed) reports 72.67%/69.25% win rates over ReAct on root-cause/solution prediction[^30^]; Microsoft's RCACopilot uses GPT-4 + RAG over human-written troubleshooting guides "based on the assumption that incidents with similar root causes recur"; PACE-LM adds confidence calibration to "mitigate hallucinations and reduce false recommendations."[^30^] Cost/latency is stark: "**RCLAgent requires 79 seconds per failure case compared to PRISM's 8 milliseconds, a 9,700× difference**," and these methods "incur substantial latency" and depend on call graphs and heterogeneous data.[^31^]

**Primitive design.** State: incident title, top alerts, anomaly summary, recent-change context, service metadata. Questions: `Choice` most-applicable runbook ∈ runbook catalog (criteria = runbook intents); `Choice` root-cause class ∈ {deploy_regression, capacity, dependency, config, cert/DNS, unknown}; `Noul` "Matches a known recurring incident pattern"; `Noul` "Novel enough to warrant full agentic RCA (spend the 79 s)".

**Why it matters.** This is a routing/selection judgment — the recurring-incident assumption in RCACopilot is literally a classification decision currently done by retrieval heuristics or expensive models. Jev turns the "which guide / which agent / is-this-novel" decision into a sub-100ms, ~$0.0004 gate in front of the heavy machinery, saving the 79s×$LLM run for genuinely novel cases.

**Evidence:** RCAgent[^30^]; RCACopilot/PACE-LM descriptions[^30^]; 79s-vs-8ms latency contrast.[^31^]
**Confidence: Medium** (component judgments are documented inside existing systems; standalone Jev gate is a design proposal).

---

## 13. LLM request routing & cascade gating (which model handles this request)

**One-liner:** Jev as the router: per request, choose cheap-model vs. frontier-model (or specialist agent), replacing trained router artifacts with a zero-shot calibrated judge.

**Current practice & bottleneck.** RouteLLM (LMSYS) formalizes routing as a win-probability estimate between strong ($$$) and weak ($) models, with a cost threshold α converting probability → routing decision; results: ">2x cost savings… without substantially compromising quality," and on MT Bench the matrix-factorization router held 95% of GPT-4 quality while sending only 14% of queries to GPT-4 (~85% cost cut).[^3^] Routers today are trained artifacts (matrix factorization, BERT classifier, causal-LLM classifier) needing preference data, training pipelines, and recalibration per model pair.

**Primitive design.** State: the user request (+ task metadata). Questions: `Score` task difficulty 1–5; `Choice` task type ∈ {chat, code, math, extraction, creative, tool-use…}; `Noul` "A small/cheap model will answer this satisfactorily"; `Noul` "Requires long-horizon reasoning or current knowledge." Code maps (difficulty, type) → model tier, thresholded on the Noul — the direct analog of RouteLLM's α-threshold rule.

**Why it matters.** The router sits in the hot path of *every* request; it must add ≪ the latency difference between tiers and cost ~nothing — that's the whole business case for routing. Jev's sub-100ms/$0.0004 profile fits, and calibration is exactly what a win-probability threshold needs. The advantage vs. RouteLLM: no training data or retraining when model tiers change — update the question criteria instead.

**Evidence:** RouteLLM formulation + savings.[^3^]
**Confidence: Medium–High** (routing economics proven; Jev-router win-rate vs. trained routers needs measurement).

---

## 14. Guardrails: prompt-injection / jailbreak / policy classification for LLM apps and agents

**One-liner:** A Jev Noul gate — "does this input/tool-output contain an injection or policy violation?" — as the always-on guardrail layer, with escalation to an LLM judge only on low confidence.

**Current practice & bottleneck.** Production guardrails fall into archetypes: regex/keyword (µs, brittle), classifier models (Llama Prompt Guard 2, ProtectAI DeBERTa, Azure Prompt Shield — "inference takes tens to low hundreds of milliseconds… bounded by their training data"), and LLM-as-judge ("a full model inference call per evaluation, which at scale becomes a latency and budget problem… the escalation layer that classifiers feed").[^32^] All get bypassed: Hackett et al. 2025 achieved up to 100% evasion on at least some systems via character injection/AML evasion.[^32^] Detection-based IPI defense "essentially establishes a binary classifier."[^33^]

**Primitive design.** State: user input or tool output, system-prompt intent summary, conversation role metadata. Questions: `Noul` "Contains instructions aimed at overriding the system's intended behavior"; `Noul` "Requests policy-violating content/action"; `Choice` threat ∈ {benign, direct_injection, indirect_injection, jailbreak_framing, data_exfiltration_attempt}; `Score` risk 1–5. Policy: risk ≥ 4 → block; middle band → escalate to hardened LLM judge (the documented two-tier pattern).

**Why it matters.** Guardrails run on *every* request and tool result in an agent loop — an agent making 20 tool calls/run needs 20+ verdicts; LLM-judge cost/latency per verdict is the documented blocker, and regex misses paraphrase. Jev matches the classifier tier's latency profile but with semantic judgment and a calibrated confidence that cleanly implements "escalate when unsure" — the exact defense-in-depth topology the literature recommends.

**Evidence:** guardrail archetypes + latency bands + bypass study[^32^]; IPI defense taxonomy.[^33^]
**Confidence: Medium** (layer architecture proven; adversarial robustness of a generic judge vs. tuned classifiers is an open, serious question — defense needs adversarial eval before deployment).

---

## 15. Code search & retrieval reranking (relevance judgment over shortlists)

**One-liner:** Jev Scores query↔snippet relevance over a bi-encoder's top-k, delivering cross-encoder-grade reranking at trivial cost.

**Current practice & bottleneck.** Neural code retrieval is dominated by bi-encoders (CodeBERT, UniXcoder, CodeRankEmbed, CodeT5 family) because they precompute embeddings; cross-encoders/LLM judges rank better but don't scale. A 2026 benchmark of 17 models (125M–30B params) for code-to-code retrieval frames the standard architecture as "recall before rerank": cheap recall stage, then a more expensive relevance model over the shortlist.[^34^] The rerank stage is exactly a bounded relevance judgment.

**Primitive design.** State: natural-language query (or code fragment) + one candidate snippet with file path/symbol context. Questions: `Score` relevance 0–4 rubric (irrelevant → exact match for intent); `Noul` "This snippet implements or directly enables the requested behavior"; `Choice` relation ∈ {implementation, usage-example, test, config, unrelated}. Batch top-20 candidates as parallel calls (or pack several short candidates per state) and sort by Score distribution mean.

**Why it matters.** Reranking must complete within an IDE search interaction (~100ms total). A frontier-LLM rerank of 20 candidates (seconds, parse-prone) breaks the UX; Jev's parallel sub-100ms judgment fits inside the keystroke budget at ~$0.0004/candidate set. Typed Score distribution also supports interleaving/exploration policies.

**Evidence:** recall-then-rerank benchmark + model taxonomy.[^34^]
**Confidence: Medium** (architecture slot is documented; Jev reranking quality vs. fine-tuned cross-encoders unmeasured).

---

## Cross-cutting observations

1. **The verdict-with-confidence shape is everywhere.** SAST FP verdicts, SOC dispositions, flaky-vs-real, duplicate-vs-distinct, same-incident-vs-not, inject-vs-benign — all are Noul/Choice judgments where the *calibrated probability is the product* (thresholds encode asymmetric costs). RLCD's explicit calibration target[^25^] is the differentiator vs. both hand-tuned classifiers (no usable probability) and LLM judges (verbose, slow, expensive, parsing-fragile).
2. **The two-tier pattern recurs:** cheap fast judge first, expensive reasoning (LLM judge, agentic RCA, human) only on low confidence — documented in guardrails,[^32^] SOC triage,[^2^] and RCA.[^31^] Jev is purpose-built for tier 1.
3. **Latency bars are published:** ~89ms for inline phishing,[^18^] sub-second for CI gating, "near-zero MTTT" in SOC,[^15^] 79s-vs-8ms contrast in RCA.[^31^] Sub-100ms (roadmap sub-10ms) Jev meets every one; frontier LLMs meet none.
4. **Where Jev should NOT be assumed to win:** tasks where trained-on-your-data classifiers set hard accuracy bars (TCP rankings,[^5^] JIT defect prediction,[^12^] flaky prediction with its 76.2% real-fault misclassification trap[^9^]). Jev's zero-shot accuracy vs. these baselines is the key experiment in each case; its structural advantages are no training pipeline, instant taxonomy edits, and calibrated abstention.
5. **Known Jev limits to respect in design** (vendor-documented): text-only input; keep arithmetic/counting/date comparisons in code; Score levels are weak for precise numeric magnitudes; Choice is relative (include `other`/escalate options); Noul ≈ 0.5 means "unsure," not "medium."[^27^][^28^]

---

## References

[^1^]: *ZeroFalse: Improving Precision in Static Analysis with LLMs* — https://arxiv.org/html/2510.02534v1 (2025-10-02)
[^2^]: *Automated Alert Classification and Triage (AACT)*, Labrèche (Sophos), Paquette (Flare) — https://arxiv.org/html/2505.09843v1 (2025-05-14)
[^3^]: *RouteLLM: Learning to Route LLMs with Preference Data*, Ong et al. (LMSYS) — https://arxiv.org/abs/2406.18665 (2024-05-21; v4 2024-09-29); production figures via https://effloow.com/articles/routellm-hybrid-model-routing-cost-optimization-poc-2026 (2026-08-21)
[^4^]: *Test Case Selection and Prioritization Using Machine Learning: A Systematic Literature Review*, Pan, Bagherzadeh, Ghaleb, Briand — https://arxiv.org/abs/2106.13891 (2021-06)
[^5^]: *Revisiting Machine Learning based Test Case Prioritization for Continuous Integration*, Zhao, Hao, Zhang — https://arxiv.org/abs/2311.13413 (2023-11-22)
[^6^]: *Commit-Aware Learning-Based Test Case Prioritization for Continuous Integration* — https://arxiv.org/html/2604.25363v1 (2026-04-28)
[^7^]: *flaky-test-prediction-ml* (supervised flaky-test prediction framework, problem statement) — https://github.com/srivastava-rajeev/flaky-test-prediction-ml (accessed 2026)
[^8^]: *FlakeFlagger: Predicting Flakiness Without Rerunning Tests*, Alshammari, Morris, Hilton, Bell, ICSE 2021 — https://doi.org/10.1109/ICSE43902.2021.00140 (cited in https://arxiv.org/html/2401.15788v1, 2024-01-28)
[^9^]: *Flaky Tests in E2E Suites: Detection & Fixes* (summarizing Flakify, IEEE TSE 2022, and Lampel et al., ESEC/FSE 2023 Chromium study) — https://wopee.io/blog/flaky-tests-complete-guide/ (2026-05-02)
[^10^]: *A First Look at Fairness of Machine Learning Based Code Reviewer Recommendation* (RevFinder & CORMS descriptions) — https://arxiv.org/html/2307.11298v1 (2023-07-21)
[^11^]: *CC2Vec: Distributed Representations of Code Changes* (DeepJIT formulation) — https://arxiv.org/abs/2003.05620 (2020-03)
[^12^]: *A Study on the Impact of Pre-trained Model on Just-In-Time Defect Prediction* — https://arxiv.org/pdf/2309.02317v1 (2023-09)
[^13^]: *Auto-labelling of Bug Report using Natural Language Processing*, Patil (Juniper Networks), Jadon — https://arxiv.org/abs/2212.06334 (2022-12-13)
[^14^]: *Detecting Duplicates in Bug Tracking Systems with Artificial Intelligence: A Combined Retrieval and Classification Approach* — https://www.preprints.org/manuscript/202511.1068 (2025-11-13)
[^15^]: *SOC Alert Triage: Streamlining Cybersecurity Operations with AI* — https://www.networkintelligence.ai/blogs/soc-alert-triage/ (2026-02-19); workflow timings via https://case-studies.ai/use-cases/risk-and-compliance/RC-002-soc-alert-triage/ (2026-04-11)
[^16^]: *Decision-Aware Trust Signal Alignment for SOC Alert Triage*, Chowdhury & Tanvir — https://arxiv.org/html/2601.04486 (2026-01-08)
[^17^]: *Lightweight ML-Based Phishing Website Detection* — https://www.ijcrt.org/papers/IJCRT25A1341.pdf (2025)
[^18^]: *Real-Time Phishing Detection and Prevention System (hybrid ensemble; 89 ms latency, 99.6% accuracy, 2.8M URLs)* — https://ijsred.com/volume9/issue2/IJSRED-V9I2P305.pdf (2026)
[^19^]: *Structured Comparative Review of ML/DL Phishing Detection* — https://www.ijcrt.org/papers/IJCRT2605978.pdf (2026)
[^20^]: *LogBERT: Log Anomaly Detection via BERT* (Drain parsing, Loglizer baselines) — https://arxiv.org/abs/2103.04475 (2021-03); Drain details via https://digitalcommons.usu.edu/context/etd/article/9253/viewcontent/COMSetd2021Aug_Guo_Haixuan.pdf
[^21^]: *A Comparative Study of Software Secrets Reporting by Secret Detection Tools* — https://arxiv.org/html/2307.00714v1 (2022-11-28)
[^22^]: *GitHub cuts secret-scanning false positives by ~76% with context-aware LLM verification* — https://news.lavx.hu/article/github-cuts-secret-scanning-false-positives-by-76-with-context-aware-llm-verification (2026-06-11; source: GitHub Blog); cf. https://logicity.in/en/blog/github-cuts-secret-scanning-false-positives-by-94-with-llms
[^23^]: *Detecting Continuous Integration Skip: A Reinforcement Learning-based Approach* (incl. Xia & Li build-failure prediction, TravisTorrent) — https://arxiv.org/html/2405.09657v1 (2024-05-15)
[^24^]: *Leveraging the Crowd for Dependency Management: An Empirical Study on the Dependabot Compatibility Score* — https://arxiv.org/html/2403.09012v1 (2024-03-14)
[^25^]: *TypeSafe AI Launches Jev: A "System One Model" That Never Hallucinates* (RLCD, parallel-pass design) — https://explainx.ai/blog/typesafe-ai-jev-system-one-models-launch-2026 (2026-09-21)
[^26^]: *TypeSafe AI Releases Jev: A System One Model That Returns Typed, Calibrated Decisions Instead of Text* (API, primitives, quickstart) — https://www.marktechpost.com/2026/09/19/typesafe-ai-releases-jev/ (2026-09-19)
[^27^]: *What is Jev?* (specs: price, limits, workflow evals, documented limitations) — https://madewithjev.com/what-is-jev (2026-09-19); cf. https://atomicbot.ai/blog/what-is-jev (2026-09-19)
[^28^]: *TypeSafe Jev: a System One decision model for software, not chat* — https://www.oguzhan.co/typesafe-jev-system-one-decision-model/ (2026-09-20); *Jev explained: bounds & failure shapes* — https://www.refix.ai/news/jev-typesafe-ai-explained/ (2026-09-18)
[^29^]: *Incident Correlation: How to Auto-Group Related Alerts* (method taxonomy; Forrester 25–40% MTT-triage figure) — https://middleware.io/blog/incident-correlation/ (2026-08-04)
[^30^]: *RCAgent: Cloud Root Cause Analysis by Autonomous Agents with Tool-Augmented LLMs* (incl. RCACopilot & PACE-LM descriptions) — https://arxiv.org/abs/2310.16340 (2023-10)
[^31^]: *PRISM* (lightweight RCA; latency contrast: RCLAgent 79 s vs PRISM 8 ms; RCACopilot/Stratus/OpenRCA survey) — https://www.arxiv.org/pdf/2601.21359 (2026-01)
[^32^]: *LLM Guardrails: Comparing Tools and Implementation Patterns* (archetypes, latency bands, Hackett et al. arXiv:2504.11168 bypass results) — https://guardml.io/posts/llm-guardrails-2/ (2026-05-11)
[^33^]: *Taxonomy, Evaluation and Exploitation of IPI-Centric LLM Agent Defense Frameworks* — https://arxiv.org/html/2511.15203v1 (2025-11-19)
[^34^]: *Recall Before Rerank: Benchmarking Deep Learning Models for Large-Scale Code-to-Code Retrieval* — https://arxiv.org/html/2606.27401v1 (2026-06-24)

*Catalog compiled 2026; 28 search queries across 5 coarse-to-fine waves. Vendor performance figures (Jev latency/price/accuracy) are TypeSafe-reported and should be re-measured before production commitments.*
