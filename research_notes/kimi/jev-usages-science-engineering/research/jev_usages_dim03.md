# Jev "System One" Usages — Dimension 03: Systems & Infrastructure Engineering

**Purpose:** Evidence-grounded catalog of 15 distinct usages for a fast, cheap, typed-judgment model (TypeSafe AI "Jev") in systems & infrastructure engineering. Jev is non-generative: input is a JSON "state" plus typed questions; output is structured judgments — **Choice** (pick an option; probabilities + confidence), **Noul** (is a statement true; probability), **Score** (ordered rubric position; probabilities + confidence). Many questions per call, parallelized over the same state. Sub-100ms latency (roadmap sub-10ms), ~$0.04/Mtoken, 32K/32K context. Design philosophy: atomic gut-check questions decomposed and composed in code.

**Method:** Coarse-to-fine web research — 7 search batches, ~45 independent queries (≥15 required), prioritizing primary sources (conference papers via arXiv/USENIX/ACM, vendor engineering blogs). Verbatim excerpts quoted inline. Each usage includes a confidence rating reflecting strength of evidence that (a) the judgment point exists in established practice and (b) a semantic-judgment model plausibly adds value.

**Why this domain fits Jev:** Systems components already make thousands of cheap, local, typed decisions per second — classify this flow, admit this object, inline this call site, route this query, escalate this alert. Classical ML is deployed at many of these points (documented below), but classical models consume only hand-built numeric feature vectors. Jev's differentiator is *semantic judgment*: it can read raw log lines, SQL text, config snippets, ticket text, and alert context, and answer a typed gut-check question with probabilities and confidence — cheaply enough to sit on hot paths, and in a typed schema that composes directly in code with existing heuristics and classical ML.

---

## Usage 1 — Encrypted Traffic & Application Classification

**One-liner:** Label network flows (application, OS, device type) with a semantic gut-check when classical classifiers are uncertain.

**Current practice & bottleneck.** ML-based traffic classification is established: nPrint/nPrintML provide a standard packet representation plus AutoML, applied to "three common network traffic classification problems: operating system detection, device fingerprinting, and application identification," and "models trained on nPrint achieve higher performance than the state-of-the-art tools for these tasks, without relying on manually engineered rules or features" [^1^]. The paper concedes open problems: "many open problems exist such as automated timeseries analysis and classification involving multiple flows" [^1^]. Bottleneck: classifiers see packet bits and statistics, not semantics (DNS names, TLS SNI, cert strings, JA3 context, service banners); ambiguous flows get a forced hard label with no escalation path.

**Primitive design.**
- *State:* 5-tuple + flow stats, DNS query name, TLS SNI/ALPN, certificate subject strings, first-payload n-gram summary, known-service registry excerpt.
- *Questions (per flow, batched):* Choice "Which application family best explains this flow?" {cdn-video, web-browsing, api-call, backup-sync, c2-like, unknown} • Noul "Is this flow consistent with the declared SNI/service?" • Score "How much does this flow deserve DPI/deeper inspection?" (rubric: none / sample / full).
- *Composition:* classical classifier (nPrint-style) decides high-confidence cases; Jev adjudicates the low-confidence tail where SNI/DNS semantics matter.

**Why latency/cost/typed output matters.** Flow labeling runs at line rate; only a sampled, uncertain subset can afford a model call. Sub-100ms keeps it off the data path (async enrichment like Cloudflare's out-of-path detection [^2^]); ~$0.04/Mtoken makes per-flow adjudication on millions of flows feasible only because each judgment is a few hundred tokens; typed Choice/Score drops straight into flow tables and policy engines.

**Evidence:** nPrint/nPrintML (CCS'21, arXiv:2008.02695) [^1^]; Cloudflare's documented out-of-path sampling/analysis architecture [^2^]. **Confidence: High** (judgment point and classical-ML baseline well documented; semantic tail is the paper's own stated open problem).

---

## Usage 2 — DDoS Detection Verdicts & Mitigation-Layer Selection

**One-liner:** When anomaly detectors fire on a traffic spike, give a fast verdict — attack vs. flash crowd — and choose where/how to mitigate.

**Current practice & bottleneck.** Cloudflare documents three automated systems: Gatebot (centralized, ~1/8000 packet sampling), dosd (per-server, ~1/100 sampling), flowtrackd (TCP state). "Once detected, rules are automatically generated, propagated, and applied at the optimal location in 10 seconds or less" (paraphrased in [^2^]: "They look for attack patterns and traffic anomalies. When found, a mitigation rule with a dynamically crafted attack signature is generated in real-time. Rules are propagated to the most optimal place for cost-effective mitigation. For example, an L7 HTTP flood might be dropped at L4 to reduce the CPU consumption") [^2^]. Bottleneck: signature/anomaly engines are statistical; the hard calls are semantic — is this spike a product launch / breaking-news flash crowd or an L7 attack mimicking one? False mitigation punishes real customers.

**Primitive design.**
- *State:* anomaly descriptor (vector, rate deltas, source dispersion), origin error-rate metrics, customer context (plan, recent announcements/marketing campaigns if available), HTTP metadata histogram (UA, paths), recent threat intel snippets.
- *Questions:* Noul "Is this anomaly malicious (attack) rather than a legitimate flash crowd?" • Choice "Best mitigation posture?" {observe, rate-limit, JS-challenge, drop-at-L4, propagate-global} • Score "Confidence that dosd's local rule generalizes globally (promote to Gatebot)?" 
- *Composition:* sits between detection (existing) and rule generation (existing), gating propagation and challenge-vs-drop choice with confidence thresholds.

**Why latency/cost/typed output matters.** Attack verdicts are worth seconds: automated systems today react in ≤10s [^2^]; a sub-100ms adjudication layer lets every *candidate* rule get a sanity verdict before propagation, at near-zero marginal cost. Typed Noul+Choice means the verdict is a config diff, not prose.

**Evidence:** Cloudflare Gatebot/dosd/flowtrackd engineering blog (verbatim above) [^2^]. **Confidence: High** (documented automated detection + rule-propagation judgment point; semantic flash-crowd-vs-attack adjudication is the known hard case).

---

## Usage 3 — Security Alert Triage Verdicts (SOC / NDR)

**One-liner:** First-pass TP/FP/BTP verdict on every alert, with escalation routing, replacing tier-1 analyst gut-checks.

**Current practice & bottleneck.** Tier-1 triage is explicitly a three-way verdict process: "True positive (TP): the activity is malicious… False positive (FP): the rule fired correctly but the activity is not malicious. Benign true positive (BTP): the activity is exactly what the rule describes, it is real, and it is not an attack… False positives are where most of your queue lives" [^3^]. Practitioner guidance is to "train it on historical analyst dispositions (true positive vs. false positive close codes from your SIEM or SOAR)" with gradient-boosted trees over alert metadata [^4^]. Autonomous-SOC vendors claim "auto-close 70–85% of confirmed false positives" (UnderDefense pipeline, secondary) [^3-note]. Bottleneck: GBDTs use only structured fields; the evidence analysts actually read is text — process command lines, alert descriptions, runbook notes, asset-owner context.

**Primitive design.**
- *State:* alert rule name + description, firing entity context (asset role, user, business criticality), raw triggering evidence (command line, log excerpt), related-alert cluster summary, historical disposition stats for the rule.
- *Questions:* Choice "Verdict?" {true-positive, false-positive, benign-true-positive} • Score "Severity for this environment?" (rubric sev1–sev4) • Noul "Is this alert a duplicate/known-expected pattern?" • Choice "Disposition?" {auto-close, queue-tier1, escalate-tier2, page-oncall}.
- *Composition:* batch many questions per alert in one call; low-confidence verdicts fall through to humans (matching the practice: "A low-confidence prediction routed to analyst review can use a different threshold from a prediction that automatically blocks" [^4-adjacent]).

**Why latency/cost/typed output matters.** SOCs face thousands of alerts/day; sub-100ms × ~$0.04/Mtoken makes verdict-on-every-alert (not just sampled alerts) economically trivial. Typed verdict + probability feeds SOAR playbooks directly and supports per-action confidence thresholds.

**Evidence:** SOC triage methodology (TP/FP/BTP) [^3^]; ML triage practice with GBDTs on dispositions [^4^]. **Confidence: High** (established verdict taxonomy + existing classical-ML practice; semantic evidence fields are the documented gap).

---

## Usage 4 — Network Configuration & Routing-Policy Verification Triage

**One-liner:** Semantic pre-change risk verdicts on config diffs and verification findings — which Batfish alarms actually violate intent?

**Current practice & bottleneck.** Static verification is established: Batfish "can find errors proactively, before the configuration is applied, and answer 'what if' questions… check a broad range of forwarding properties and produce actual packets that violate checked properties" [^5^]. Deployed practice is CI/CD pre-flight checks (Batfish/pyATS) [^5-adjacent]. Bottleneck: verifiers check formal properties, not *intent*. A change that breaks reachability to a decommissioned subnet is formally an alarm and operationally fine; intent lives in change tickets, commit messages, and design docs — text that formal tools cannot read. Teams triage findings manually.

**Primitive design.**
- *State:* config diff (vendor-neutral parse + raw lines), verification findings (failed reachability/policy queries with counterexample packets), change ticket text, commit message, topology/service descriptions.
- *Questions:* Noul "Does this config diff implement the stated intent in the ticket?" • Noul "Does this verification finding represent a real policy violation vs. an intended change?" • Score "Blast radius if deployed?" (rubric: none / single-site / multi-site / global) • Choice "Gate decision?" {auto-approve, canary, human-review, block}.
- *Composition:* formal verifier generates findings; Jev performs intent-vs-diff adjudication and risk scoring before merge.

**Why latency/cost/typed output matters.** Pre-change windows are minutes; sub-100ms lets every diff hunk and every finding get a verdict in the CI pipeline. Typed Noul/Choice makes the CI gate programmable; near-zero cost means findings can be adjudicated in bulk (thousands of nodes' diffs) rather than sampled.

**Evidence:** Batfish NSDI'15 (verbatim abstract) [^5^]; Batfish CI/CD pre-change validation practice [^5-adjacent refs in reference list]. **Confidence: High** (formal verification judgment point well established; intent-reading is the documented manual gap).

---

## Usage 5 — Query Optimizer Hint / Plan Steering (Learned Query Optimization)

**One-liner:** Per-query gut-check over a small menu of optimizer hints, replacing or augmenting bandit/tree-convolution models.

**Current practice & bottleneck.** Bao (SIGMOD'21) is the canonical learned steering system: "Bao takes advantage of the wisdom built into existing query optimizers by providing per-query optimization hints. Bao combines modern tree convolutional neural networks with Thompson sampling… [and] can quickly (an order of magnitude faster than previous approaches) learn strategies that improve end-to-end query execution performance, including tail latency" [^6^]. Bottleneck: the learned model featurizes plans numerically; it cannot read the SQL text's semantics (e.g., a correlated subquery that is obviously selective, a holiday-date literal) and needs retraining as workloads drift.

**Primitive design.**
- *State:* SQL text, optimizer's chosen plan summary (operators, estimated rows/cost), table/statistics snapshot, recent execution-feedback summary for similar query templates.
- *Questions:* Choice "Which hint set likely yields the best execution?" {default, hint-set-A…E} • Noul "Is the optimizer's cardinality estimate for this predicate plausible?" • Score "How risky is deviating from the default plan?" (rubric: safe / moderate / tail-risk).
- *Composition:* one Jev call per query (multiple questions) at optimization time; confidence gates whether to override the default plan, with a Bao-style feedback loop logging outcomes.

**Why latency/cost/typed output matters.** Query optimization budget is milliseconds-to-tens-of-ms per query; sub-100ms fits inside it for OLAP and is amortizable for OLTP (plan caching keyed by template + Jev verdict). ~$0.04/Mtoken makes per-query calls viable even at high QPS. Typed Choice over a fixed hint menu is exactly the action space Bao uses [^6^].

**Evidence:** Bao (arXiv:2004.03814) [^6^]; Redshift's note that expensive models (~100ms) exceed the total latency of 40% of queries — "higher than the total query latency for 40% of the queries!" — motivating hierarchical/cheap prediction [^11^]. **Confidence: High** (learned steering is proven; the cheap-latency-constrained slot is explicitly documented).

---

*Continued in file — usages 6–15, cross-cutting analysis, and references below.*

## Usage 6 — Index Advisor Benefit Judgments

**One-liner:** Cheap pairwise verdict — "will this candidate index actually make this query faster?" — filtering what-if calls and avoiding regression-prone recommendations.

**Current practice & bottleneck.** Industrial index tuners (SQL Server DTA, Azure SQL auto-indexing) enumerate candidates and rely on the optimizer's what-if API. Two documented bottlenecks: (a) accuracy — "in a significant fraction of cases, an index estimated to improve a query's execution cost… makes that worse when implemented" [^7^]; (b) cost — "what-if calls constitute a major bottleneck of index tuning… even with small workloads and few what-if calls, tuning can still take hours" [^8^]. Microsoft's fix for (a) is itself a classifier: "our key insight is that formulating it as a classification task in machine learning results in significantly higher accuracy… up to 5x reduction in the errors in identifying the cheaper plan in a pair, which eliminates almost all query execution cost regressions" [^7^]. A large DRL/bandit/MCTS advisor literature (DQN, DBA bandits, AutoIndex, budget-aware RL) exists [^9^].

**Primitive design.**
- *State:* SQL text, plan-without-index vs. plan-with-candidate-index summaries, table size/selectivity stats, maintenance-cost context (write amplification), workload description.
- *Questions:* Noul "Will materializing index I improve query Q's real execution time?" • Noul "Could I cause a regression for another important query in the workload?" • Choice "Which of the top-k candidate indexes is worth a what-if call?" • Score "Overall value of this index for the workload?" (rubric: drop / neutral / create / create+monitor).
- *Composition:* Jev pre-filters candidates before expensive what-if calls (attacking bottleneck (b)) and sanity-checks optimizer-cost comparisons (attacking (a)), mirroring the AI-Meets-AI classifier slot but with SQL-semantics awareness.

**Why latency/cost/typed output matters.** Tuning enumerates thousands of (query, index) pairs; a sub-100ms, near-zero-cost pairwise judgment replaces a large fraction of multi-second what-if calls. Typed Noul with probability is literally the "cheaper-plan classifier" interface Microsoft integrated "with minimal modifications" [^7^].

**Evidence:** AI Meets AI, SIGMOD'19 (verbatim above) [^7^]; WRED, SIGMOD'24 (verbatim above) [^8^]; advisor literature list [^9^]. **Confidence: High** (the pairwise-classifier judgment point is a published, production-motivated design).

---

## Usage 7 — Query Routing: Engine Selection & Workload-Manager Queue Assignment

**One-liner:** On query arrival, pick the right engine/queue (OLTP vs. OLAP replica, short-query vs. long-query queue) from a semantic read of the SQL.

**Current practice & bottleneck.** (a) Federated/polyglot systems route queries across engines; RL-based "Cognitive Query Routing" research explicitly frames "selecting target engines for incoming queries based on learned policies" with a policy network that "must handle high-dimensional state spaces while maintaining low inference latency" [^10^]. (b) Amazon Redshift's workload manager routes queries to queues by predicted execution time; production constraints are explicit: "Most Redshift queries execute in under 100ms. This rules out exclusively using some modern advanced models, which could have inference times as high as 100ms (higher than the total query latency for 40% of the queries!)" [^11^]. Their Stage predictor (cache → local XGBoost → fleet-wide GNN only when uncertain and long) "can improve the average query execution latency by 20%… compared to the prior query performance predictor" [^11^]. Bottleneck: lightweight models are inaccurate on novel queries; heavyweight models are too slow for the hot path.

**Primitive design.**
- *State:* SQL text, plan summary, current queue depths, tenant/SLO tags, recent latency percentiles per engine.
- *Questions:* Choice "Route to which engine/queue?" {oltp-primary, analytics-replica, short-queue, long-queue, throttle} • Score "Expected execution-time band?" (rubric: <10ms / <100ms / <1s / <10s / >10s) • Noul "Is this query materially different from anything this tenant has run recently (cold-start)?" 
- *Composition:* Score-band replaces/augments the exec-time regressor (an ordinal judgment is often all WLM needs); Noul cold-start verdict decides when to pay for a heavier model — exactly Stage's hierarchical trigger [^11^].

**Why latency/cost/typed output matters.** This is the single most latency-constrained slot in the catalog: the decision is on the critical path of every query, and the incumbent requirement is inference well under the query's own latency [^11^]. Sub-100ms (roadmap sub-10ms) plus ~$0.04/Mtoken is the difference between "verdict on every query" and "model only where amortizable." Typed Score-band maps directly onto WLM queue thresholds.

**Evidence:** CQR (GJETA 2025) [^10^]; Stage, SIGMOD'24 (verbatim above) [^11^]. **Confidence: High** (production system with an explicit latency budget and an explicit uncertainty-gated escalation design).

---

## Usage 8 — Autoscaler Signal Judgment

**One-liner:** Distinguish real demand shifts from noise/flash anomalies before scaling, and pick scale-out/scale-in/hold with confidence.

**Current practice & bottleneck.** Default autoscalers are reactive thresholds: "most default autoscaling mechanisms remain reactive because scaling actions are triggered after resource utilization or external metrics exceed predefined thresholds. This reactive behavior can cause cold-start delay, over-provisioning, under-provisioning, SLO violations" [^13^]. Research applies LSTM/Prophet/Transformer forecasting and RL (PPO, DQN, actor-critic) [^13^]. Google Autopilot (production) uses "machine learning algorithms applied to historical data about prior executions of a job, plus a set of finely-tuned heuristics"; results: "Autopiloted jobs have a slack of just 23%, compared with 46% for manually-managed jobs" and "reduces the number of jobs severely impacted by OOMs by a factor of 10" [^12^]. Bottleneck: numeric forecasters can't see *why* metrics moved (a deploy, a retry storm, a cron job, a marketing event in the change calendar), and oscillation control is hand-tuned.

**Primitive design.**
- *State:* recent metric window summary (CPU/mem/RPS/latency, forecast values), deploy/change events, incident feed, calendar context (known campaigns), historical reaction outcomes.
- *Questions:* Noul "Is the current pressure a genuine sustained demand increase?" • Noul "Is the current spike an artifact (retry storm, deploy, telemetry glitch)?" • Choice "Action?" {scale-out-fast, scale-out-slow, hold, scale-in} • Score "Oscillation risk of acting now?" 
- *Composition:* forecaster predicts magnitude (existing); Jev vets the *interpretation* and action, gating actuation on confidence — a semantic stabilizer on top of HPA/VPA/Autopilot-style loops.

**Why latency/cost/typed output matters.** Scaling loops run every 15–60s per workload; thousands of workloads per cluster mean cheap repeated judgments. Sub-100ms keeps the verdict inside the control-loop period; typed Choice+Noul composes with existing HPA/VPA APIs without restructuring controllers.

**Evidence:** Autopilot, EuroSys'20 (verbatim abstract incl. slack 23% vs 46%, 10x OOM reduction, ">48% of Google's fleet-wide resource usage") [^12^]; ML-K8s autoscaling reviews (reactive bottleneck quote) [^13^]. **Confidence: High** (production precedent + active research area; the signal-vetting judgment is the documented weak point).

---

## Usage 9 — VM Placement & Capacity/Oversubscription Triage

**One-liner:** Per-allocation verdicts — which candidate server, and is this VM safe to oversubscribe/co-locate — using request metadata classical packers ignore.

**Current practice & bottleneck.** Azure Protean (production) uses "a flexible rule-based Allocation Agent (AA)… to efficiently address multiple constraints and performance criteria," achieving "turnaround times of few milliseconds" and "85-90% on a key utilization metric" [^14^]. Resource Central (SOSP'17) established predicting VM workloads from historical telemetry for oversubscription/resource management [^15^]. Bottleneck: rule-based placement scores resources numerically; it can't weigh semantic signals in the request — VM SKU family, customer workload hints, deployment-purpose tags, historical complaint/incident text for a tenant — and oversubscription decisions are fleet-wide policies rather than per-VM judgments.

**Primitive design.**
- *State:* VM request (SKU, size, tenancy hints, customer workload description where available), candidate server summaries (utilization forecast, neighbor mix, hardware health flags), Resource-Central-style per-VM class predictions, current capacity posture (crunch conditions [^14^]).
- *Questions:* Choice "Best candidate server among top-k?" • Noul "Is this VM a safe oversubscription candidate?" • Noul "Would co-locating these tenants create a noisy-neighbor risk?" • Score "Eviction/preemption risk of this placement?" 
- *Composition:* rule-based AA shortlists candidates (existing); Jev adjudicates top-k with semantic context; oversubscription Noul runs per-VM rather than per-fleet.

**Why latency/cost/typed output matters.** Protean's allocation path is "few milliseconds" with multi-layer caching [^14^]; a sub-100ms judgment fits as an asynchronous second opinion or on the cached slow path, and near-zero cost allows per-allocation calls at Azure-scale request rates. Typed Choice over a candidate list plugs directly into the policy/mechanism separation Protean documents [^14^].

**Evidence:** Protean, OSDI'20 (verbatim abstract) [^14^]; Resource Central, SOSP'17 [^15^]. **Confidence: Medium-High** (judgment points and production architecture well documented; semantic per-VM oversubscription is a reasonable extension, less directly evidenced).

---

## Usage 10 — Incident Triage, Severity Scoring & Ownership Routing (AIOps)

**One-liner:** When a KPI regression fires, route it to the right team with a severity score and a likely-cause class — in seconds, from log + ticket text.

**Current practice & bottleneck.** Microsoft's DeCaf (deployed on 2 large cloud services, one handling "O(100B) requests every day… O(100) terabytes of logs daily") "uses machine learning along with pattern mining to help service owners automatically root cause and triage performance issues," and "successfully diagnosed 10 known and 31 unknown issues. DeCaf also automatically triages the identified issues by leveraging historical data" [^16^]. Microsoft's IcM BRAIN is an "AIOps framework towards intelligent incident management" [^17^]; DeepTriage (Azure incident categorization) reportedly reached 82.9% F1 in production [^17-note]. Bottleneck: triage/routing leans on structured predicates and historical labels; novel incidents need semantic reading of error text, deployment descriptions, and runbook language — and wrong routing wastes the most expensive minutes of an outage.

**Primitive design.**
- *State:* firing KPI + threshold, DeCaf-style predicate set (candidate root-cause slices), top correlated log excerpts, recent deploys, service dependency snapshot, historical similar-incident summaries.
- *Questions:* Choice "Which team/service owns this?" • Choice "Likely cause class?" {deploy-regression, dependency-failure, capacity, config-change, external} • Score "Severity (sev1–sev4) given customer impact signals?" • Noul "Is this a recurrence of a known issue with an existing runbook?" 
- *Composition:* pattern mining produces candidate predicates (existing); Jev consumes the semantic residue (raw log lines, deploy notes) to finalize routing/severity, and its confidence decides auto-page vs. queue.

**Why latency/cost/typed output matters.** MTTR is measured in minutes; sub-100ms triage verdicts at incident-fire time are effectively free relative to the outage cost they shave. Typed team/severity outputs write directly into IcM ticketing fields — no parsing of prose.

**Evidence:** DeCaf, ICSE-SEIP'20 (verbatim above) [^16^]; IcM BRAIN / incident-management practice at Microsoft [^17^]. **Confidence: High** (production-deployed triage systems; semantic novel-incident gap documented: DeCaf's future work explicitly wants NLP on unstructured logs [^16^]).

---

*Continued — usages 11–15, cross-cutting analysis, and references below.*

## Usage 11 — Log Anomaly Detection & Semantic Triage

**One-liner:** Sequence-level gut-checks on log windows — anomalous or not, known-benign or worth paging — reading logs as language, not just template IDs.

**Current practice & bottleneck.** DeepLog (CCS'17) established deep log anomaly detection: it models "a system log as a natural language sequence… automatically learn log patterns from normal execution, and detect anomalies when log patterns deviate from the model trained from log data under normal execution" [^18^]. Follow-ons (LogRobust, LogAnomaly, self-attentive classifiers) improve robustness [^18-adjacent]. Bottleneck: template-based pipelines collapse semantics into log-key IDs; novel templates and unseen-but-benign messages (new deploy's log lines) produce false alarms, and models "need frequent retraining" as log statements evolve (documented limitation of DeepLog in surveys [^18-adjacent]). The judgment that a scary-looking new message is benign ("cache warmup complete, ignoring stale entries") is a reading-comprehension task.

**Primitive design.**
- *State:* window of raw log lines (not just keys), service + version + deploy context, host role, recent alert state, prior verdicts on similar windows.
- *Questions:* Noul "Does this window indicate a real fault requiring action?" • Noul "Is this message pattern consistent with a normal deploy/startup/restart?" • Score "Operational urgency?" (rubric: noise / watch / investigate / page) • Choice "Which known failure signature, if any, does this match?" 
- *Composition:* template/LSTM detectors flag candidate windows (existing); Jev reads the raw text for the adjudication layer — replacing retraining-heavy robustness hacks with semantic judgment.

**Why latency/cost/typed output matters.** Log volumes are enormous, but flagged *windows* are a small, bursty subset; sub-100ms and near-zero cost allow adjudicating every flagged window and even sampling unflagged ones for recall auditing. Typed Noul/Score feeds alert pipelines directly.

**Evidence:** DeepLog, CCS'17 (arXiv:1709.07229; verbatim abstract) [^18^]; survey-documented retraining/instability limitations [^18-adjacent]. **Confidence: High** (canonical judgment point; "logs as natural language" is the founding premise of the literature — a semantic-judgment model is the native fit).

---

## Usage 12 — Compiler Heuristic Replacement: Inlining & Register-Allocation Eviction

**One-liner:** Per-call-site / per-live-range typed verdicts inside production compilers, in the same slots where LLVM already runs learned models.

**Current practice & bottleneck.** MLGO is the landmark: "the first full integration of ML in a complex compiler pass in a real-world setting… replacing the heuristics-based inlining-for-size optimization in LLVM with machine learned models… achieve[s] up to 7% size reduction, when compared to state of the art LLVM -Oz," with "negligible (~1%) compile-time overhead" [^19^] [^28^]. MLGO recasts inlining as an MDP with an 11-dimensional feature vector per call site and a binary inline/no-inline action; a second learned model handles regalloc eviction, both shipped in the main LLVM repo with AOT-compiled inference [^19^] [^20^]. Bottleneck: features are hand-picked numerics; the model cannot see identifiers, comments, or code structure semantics, and training requires RL infrastructure most teams can't operate.

**Primitive design.**
- *State:* caller/callee IR excerpts or summaries, call-site features (existing 11-d vector), size/perf counters, profile data hints, function names/comments (semantic signal).
- *Questions:* Noul "Will inlining this call site reduce size without hurting hotness?" • Choice "Which eviction candidate live-range should spill?" • Score "How confident should the advisor be (fall back to default heuristic below τ)?" 
- *Composition:* Jev as a drop-in InlineAdvisor-style policy; per-decision confidence enables safe fallback to the stock heuristic, exactly the deployment story MLGO needed AOT compilation to achieve [^20^].

**Why latency/cost/typed output matters.** A large build makes millions of inline decisions; only a sub-ms-to-100ms, near-zero-cost advisor is viable, and binary typed answers match the pass interface. The 7% size win at ~1% compile-time overhead shows the value ceiling of getting these micro-judgments right [^19^] [^28^].

**Evidence:** MLGO (arXiv:2101.04808) [^19^]; LLVM MLGO docs (inliner + regalloc-eviction models shipped upstream) [^20^]; Emergent Mind MLGO summary (verbatim MDP design) [^28^]. **Confidence: High** (production-integrated learned-decision slots with typed binary actions).

---

## Usage 13 — Compiler Phase Ordering & Vectorization Decisions

**One-liner:** Sequence-level pass-selection and per-loop vectorization-factor judgments, where RL research already proves headroom but deployment is impractical.

**Current practice & bottleneck.** Phase ordering is a proven-hard combinatorial problem: CompilerGym provides "environments for three compiler optimization problems: LLVM phase ordering, GCC flag selection, and CUDA loop nest generation" and reports generalization across program domains as the key challenge ("3 of the 4 algorithms achieve positive results when generalizing… only PPO is able to achieve a positive score on two of the 13 other datasets") [^21^]. NeuroVectorizer: "Compilers are designed today to use fixed-cost models that are based on heuristics to make vectorization decisions on loops. However, these models are unable to capture the data dependency, the computation graph, or the organization of instructions"; their deep RL approach shows "1.29×−4.73× performance speedup compared to baseline and only 3% worse than the brute-force search" [^22^]. Bottleneck: RL training cost, generalization gaps, and no deployment path into production compilers.

**Primitive design.**
- *State:* IR/function summary, features + action histogram (CompilerGym-style observation), loop nest excerpt with data-dependency notes, target µarch description, optimization goal (size vs. speed).
- *Questions:* Choice "Next most promising pass?" (or Choice "Vectorize / interleave / leave scalar?" plus Score "Likely best vectorization factor band?") • Noul "Will further passes on this function yield meaningful improvement (early-exit)?" 
- *Composition:* instead of a monolithic RL policy, compose atomic Jev verdicts per decision point with heuristic defaults — trading peak RL performance for zero-training, explainable, confidence-gated deployment.

**Why latency/cost/typed output matters.** Pass selection fires thousands of times per compilation; a cheap typed advisor is the only way to get learned-quality decisions without shipping an RL stack. Ordinal Score bands for VF match how cost models actually consume the decision.

**Evidence:** CompilerGym (arXiv:2109.08267) [^21^]; NeuroVectorizer, CGO'20 (verbatim abstract) [^22^]. **Confidence: Medium-High** (judgment points and ML headroom proven; replacing RL wholesale with judgment calls is a design hypothesis, though MLGO's production success de-risks the pattern [^19^]).

---

## Usage 14 — EDA: Routability/DRC Hotspot Prediction & Synthesis QoR Triage

**One-liner:** Early-stage verdicts on where detailed routing will break design rules and which synthesis recipes will hit QoR — before hours of tool runtime.

**Current practice & bottleneck.** Chan et al. (ISPD'17, UCSD+Synopsys, industrial sub-14nm): "DRC violations after detailed routing prevent a design from being taped out… in sub-14nm processes… DRCs arising from multiple patterning and pin-access constraints drastically weaken the correlation between global-route congestion and detailed-route DRC violations"; their ML method "predicts the locations of 74% of the detailed-route DRCs (with false positive prediction rate below 0.2%) and automatically reduces the number of detailed-route DRC violations by up to 5x" [^23^]. In logic synthesis, ML-guided flows and QoR predictors (e.g., LSOformer) predict "the trajectory of Quality of Results" from circuit graphs and optimization sequences [^24^]. Bottleneck: predictors consume geometric/graph features; they cannot read constraint files, designer annotations, or methodology intent, and each new node/design needs retraining.

**Primitive design.**
- *State:* region/placement summary + congestion map stats, cell/net names and hierarchy context, relevant DRC rule text (design-rule manual excerpt), designer annotations/waivers, synthesis recipe description.
- *Questions:* Score "DRC risk of this region after detailed routing?" (rubric bands) • Noul "Is this flagged hotspot likely a true violation or a waivable/false pattern?" • Choice "Which of k synthesis recipes is most promising for this block?" • Noul "Is this DRC waiver consistent with the rule's stated intent?" 
- *Composition:* classical predictors produce hotspot maps (existing); Jev adds rule-text/designer-intent adjudication and recipe selection; low-confidence hotspots escalate to detailed-route spot-checks.

**Why latency/cost/typed output matters.** A full place-and-route is hours-to-days; a sub-100ms per-region verdict that kills even a fraction of doomed iterations pays for itself immediately — the ISPD'17 5x violation reduction quantifies the ceiling [^23^]. Typed Score maps onto the placer's congestion-cost knobs; near-zero cost allows per-tile granularity.

**Evidence:** Chan et al., ISPD'17 (verbatim abstract) [^23^]; LSOformer (arXiv:2409.10653) [^24^]. **Confidence: Medium-High** (ML prediction slots industrially validated; semantic rule-text/waiver adjudication is a plausible, less-validated extension).

---

## Usage 15 — Cache Admission/Eviction, Tiering & Prefetch Judgments (Storage / CDN)

**One-liner:** Per-object admit/evict/prefetch verdicts using request semantics (URLs, content types, tenant) that classical features drop.

**Current practice & bottleneck.** CDN cache admission is a proven learned-classification slot: Berger's LFO "learns a caching policy that maps features to those of OPT, essentially predicting whether an object should be admitted to the cache. LFO achieves high accuracy with negligible delay, constituting a feasible alternative for production," while RL-Cache "trains a neural network that decides upon an object request, whether it is to be admitted to the cache or not" (survey summary) [^25^]. MAT shows the cost problem: "state-of-the-art ML caches require many predictions to make an eviction decision, making them impractical for high-throughput caching systems… MAT reduces the number of costly ML predictions-per-eviction from 63 to 2" across "8 production workloads, spanning storage, in-memory caching, and CDNs" [^26^]. Learned prefetching classifiers predict "whether the next request will follow a sequential, random, or non-existent pattern" and only prefetch on a sequential verdict [^27^]. Bottleneck: prediction cost per decision, and features that ignore semantics (content type, URL path structure, tenant SLAs) that humans use to judge cacheability.

**Primitive design.**
- *State:* object metadata (URI path, content-type, size, tenant), recent access pattern summary, cache pressure, origin fetch cost, popularity-class hints.
- *Questions:* Noul "Will this object be re-requested before eviction?" (admit verdict) • Choice "Which of the k MAT-shortlisted candidates should be evicted?" • Noul "Is this access sequence genuinely sequential (prefetch) or random (don't pollute)?" • Score "Tier placement?" (rubric: RAM / NVMe / HDD / archive).
- *Composition:* heuristic filters shortlist (MAT pattern [^26^]); Jev renders the final judgment with semantic metadata; typed verdicts plug into admission/eviction hooks.

**Why latency/cost/typed output matters.** This is the literature's own constraint: ML caching fails in production when predictions-per-decision are costly [^26^]. A single cheap typed call per shortlisted candidate (sub-100ms off the critical path for CDNs/storage; per-request for warm tiers) is exactly the "minimal overhead" regime MAT engineers toward — plus semantic features no GBDT consumes.

**Evidence:** Berger HotNets'18 / RL-Cache via survey (verbatim summary) [^25^]; MAT (arXiv:2301.11886, verbatim abstract) [^26^]; MDPI online-ML prefetching (algorithm description) [^27^]. **Confidence: High** (cost-per-prediction is the documented blocker; binary admit/evict/prefetch verdicts are the established interface).

---

## Cross-Cutting Analysis: Where Classical ML Already Runs vs. Where Semantic Judgment Adds

**Classical ML is already deployed or production-proven at nearly every judgment point above** — nPrint/AutoML (traffic) [^1^], GBDT alert triage [^4^], Bao (query hints) [^6^], AI-Meets-AI classifiers + what-if advisors (indexes) [^7^] [^8^], Stage's XGBoost/GNN hierarchy (WLM) [^11^], Autopilot (autoscaling) [^12^], Protean rule-based AA + Resource Central prediction (placement) [^14^] [^15^], DeCaf/IcM BRAIN/DeepTriage (incidents) [^16^] [^17^], DeepLog (logs) [^18^], MLGO (compilers) [^19^] [^20^], ISPD'17 routability ML (EDA) [^23^], LFO/RL-Cache/MAT (caching) [^25^] [^26^]. This validates the decision interfaces: they are already typed, confidence-gated, and latency-constrained.

**The semantic-judgment delta** is concentrated in five recurring gaps the sources themselves name:
1. **Text the features drop:** SQL text (usages 5–7), log lines (10–11), alert evidence strings (3), config+ticket text (4), DRC rule text (14). DeCaf's own future work asks for "NLP techniques" on unstructured logs [^16^]; the runtime-prediction paper notes "Semantic features derived from TF-IDF embeddings of the SQL text further improved generalization" [^29^].
2. **Cost-per-prediction ceilings:** Redshift's 100ms rule-out [^11^], MAT's 63→2 predictions [^26^], what-if call bottlenecks [^8^] — all argue for a *single cheap typed judgment* per decision.
3. **Uncertainty-gated escalation hierarchies:** Stage's local→global trigger [^11^], MLGO's fallback advisor [^20^], SOC confidence thresholds [^4^] — Jev's built-in probabilities+confidence natively implement these gates.
4. **Cold start / drift:** Redshift cold-start [^11^], DeepLog retraining on new log templates [^18-adjacent], Bao retraining overhead [^6^] — a pretrained semantic judge transfers without per-system training data.
5. **Intent vs. mechanism:** Batfish findings vs. ticket intent [^5^], DRC waivers vs. rule text [^23^] — judgments classical numeric models structurally cannot make.

**Overall catalog confidence:** 10 usages High, 5 Medium-High. No usage lacks a documented judgment point; Medium-High ratings reflect the semantic-extension step beyond published classical-ML deployments.

---

## References

[^1^] Holland, Schmitt, Feamster, Mittal — "New Directions in Automated Traffic Analysis" (nPrint/nPrintML), ACM CCS 2021 / arXiv:2008.02695. https://arxiv.org/abs/2008.02695 (submitted 2020-08-06; v6 2021-10-19).
[^2^] Cloudflare — "Moobot vs. Gatebot: Cloudflare Automatically Blocks Botnet DDoS Attack Topping At 654 Gbps." https://blog.cloudflare.com/moobot-vs-gatebot-cloudflare-automatically-blocks-botnet-ddos-attack-topping-at-654-gbps/ (2024-10-09).
[^3^] SOC Simulator — "Alert Triage: Real Threats vs False Positives" (TP/FP/BTP methodology). https://www.socsimulator.com/blog/alert-triage-guide (2026-06-12, retrieved). [^3-note] UnderDefense — "Autonomous SOC Guide" (auto-close 70–85% FP claim). https://underdefense.com/blog/autonomous-soc/ (2026-03-30).
[^4^] GTK Cyber — "How to Reduce False Positives in Security Alerts with Machine Learning." https://gtkcyber.com/blog/reducing-false-positives-security-alerts-machine-learning/ (2026-06-03). [^4-adjacent] Adaptive Security — "AI Phishing Detection False Positives…" https://www.adaptivesecurity.com/blog/ai-phishing-detection-false-positives (2026-08-21).
[^5^] Fogel, Fung, Pedrosa, Walraed-Sullivan, Govindan, Mahajan, Millstein — "A General Approach to Network Configuration Analysis" (Batfish), USENIX NSDI 2015. Project page: https://pedrosa.2y.net/Projects/Batfish ; paper: https://www.usenix.org/conference/nsdi15/technical-sessions/presentation/fogel (2015-05). [^5-adjacent] NetworkToCode — "How Batfish Fits into Your Network Automation Plan." https://networktocode.com/blog/batfish-fits-network-automation-plan/ (2026-07-15); Pluralsight — "Proactive Network Verification and CI/CD Pipeline Integration." https://www.pluralsight.com/labs/aws/proactive-network-verification-and-cicd-pipeline-integration (2026-04-13).
[^6^] Marcus, Negi, Mao, Tatbul, Alizadeh, Kraska — "Bao: Learning to Steer Query Optimizers," arXiv:2004.03814 (SIGMOD 2021). https://ui.adsabs.harvard.edu/abs/2020arXiv200403814M/abstract (2020-04).
[^7^] Ding, Das, Marcus, Wu, Chaudhuri, Narasayya — "AI Meets AI: Leveraging Query Executions to Improve Index Recommendations," SIGMOD 2019. https://www.microsoft.com/en-us/research/wp-content/uploads/2019/04/regression_sigmod2019_CR.pdf (2019-05).
[^8^] Brucato, Siddiqui, Wu, Narasayya, Chaudhuri — "WRED: Workload Reduction for Scalable Index Tuning," Proc. ACM Manag. Data (SIGMOD 2024). https://dl.acm.org/doi/10.1145/3639305 (2024-03-26).
[^9^] TsinghuaDatabaseGroup — AIDB reading list, Index Advisor section (DQN/bandit/MCTS advisors: Lan et al. CIKM'20; DBA Bandits ICDE'21; AutoIndex ICDE'22; Budget-aware RL SIGMOD'22). https://github.com/TsinghuaDatabaseGroup/AIDB (retrieved).
[^10^] GJETA — "Cognitive Query Routing (CQR): Reinforcement learning for query routing." https://gjeta.com/sites/default/files/fulltext_pdf/GJETA-2025-0330.pdf (2025-11-17).
[^11^] Wu, Marcus, Liu, Negi, Nathan, Pfeil, Saxena, Rahman, Narayanaswamy, Kraska — "Stage: Query Execution Time Prediction in Amazon Redshift," SIGMOD 2024 Companion, arXiv:2403.02286. https://arxiv.org/abs/2403.02286 (2024-03-04).
[^12^] Rzadca et al. — "Autopilot: workload autoscaling at Google," EuroSys 2020. https://arxiv.org/abs/1806.08657 (2020; abstract via author bib page https://www.mimuw.edu.pl/~krzadca/pubs_bib.html).
[^13^] "Kubernetes Autoscaling: A Comprehensive Review on Machine Learning Techniques," Preprints 202606.1094. https://www.preprints.org/manuscript/202606.1094 (2026-06-13); companion review: https://www.preprints.org/manuscript/202607.0944 (2026-07-11).
[^14^] Hadary, Marshall, Menache, Pan, Greeff, Dion, Dorminey, Joshi, Chen, Russinovich, Moscibroda — "Protean: VM Allocation Service at Scale," USENIX OSDI 2020. https://www.usenix.org/system/files/osdi20-hadary.pdf (2020-11).
[^15^] Cortez, Bonde, Muzio, Russinovich, Fontoura, Bianchini — "Resource Central: Understanding and Predicting Workloads for Improved Resource Management in Large Cloud Platforms," ACM SOSP 2017, DOI 10.1145/3132747.3132772. https://www.microsoft.com/en-us/research/publication/resource-central-understanding-predicting-workloads-improved-resource-management-large-cloud-platforms/ (2017-10).
[^16^] Bansal, Asudani, Midy et al. — "DeCaf: Diagnosing and Triaging Performance Issues in Large-Scale Cloud Services," ICSE-SEIP 2020, arXiv:1910.05339. https://arxiv.org/abs/1910.05339 (2019-10; ICSE 2020).
[^17^] "Enhancing reliability in AI inference services: An empirical study on real production incidents" (related work describing DeCaf, Chen et al. 2020 IcM BRAIN, Triangle), arXiv:2511.07424. https://arxiv.org/html/2511.07424v1 (2025-10-17). [^17-note] IJRAI — "AI-Augmented ITSM: Autonomous Incident Triage" (DeepTriage 82.9% F1, SoftNER, multi-modal triage). https://ijrai.org/index.php/ijrai/article/download/82/79 (retrieved).
[^18^] Du, Li, Zheng, Srikumar — "DeepLog: Anomaly Detection and Diagnosis from System Logs through Deep Learning," ACM CCS 2017, arXiv:1709.07229. https://arxiv.org/abs/1709.07229 (2017). [^18-adjacent] Survey notes on DeepLog retraining/template-instability limitations (LogRobust etc.): https://word.baidu.com/view/ef6ff8e8142de2bd960590c69ec3d5bbfd0ada0e.html (2025-10-31); DeepLog summary: https://training.continuumlabs.ai/disruption/logging/deeplog (2024-07-30).
[^19^] Trofin, Qian, Brevdo, Lin, Choromanski, Li — "MLGO: a Machine Learning Guided Compiler Optimizations Framework," arXiv:2101.04808. https://arxiv.org/abs/2101.04808 (2021-01-13).
[^20^] LLVM Project — "Machine Learning - Guided Optimization (MLGO)" documentation (inliner + regalloc eviction models, AOT release mode). https://llvm.org/docs/MLGO.html (retrieved).
[^21^] Cummins et al. — "CompilerGym: Robust, Performant Compiler Optimization Environments for AI Research," arXiv:2109.08267. https://arxiv.org/abs/2109.08267 (2021-09).
[^22^] Haj-Ali, Ahmed, Willke, Shao, Asanovic, Stoica — "NeuroVectorizer: End-to-End Vectorization with Deep Reinforcement Learning," CGO 2020, DOI 10.1145/3368826.3377928, arXiv:1909.13639. https://dl.acm.org/doi/abs/10.1145/3368826.3377928 (2020).
[^23^] Chan, Ho, Kahng, Saxena — "Routability Optimization for Industrial Designs at Sub-14nm Process Nodes Using Machine Learning," ISPD 2017. https://home.engineering.iastate.edu/~cnchu/ISPD2017/pdfs/p15.pdf (2017).
[^24^] "Logic Synthesis Optimization with Predictive Self-Supervision via Causal Transformers" (LSOformer), arXiv:2409.10653. https://arxiv.org/abs/2409.10653 (2024-09-16).
[^25^] Berger — "Towards Lightweight and Robust Machine Learning for CDN Caching," ACM HotNets 2018 (LFO); Kirilin et al. — "RL-Cache: Learning-Based Cache Admission for Content Delivery" (NeurIPS Workshop 2019). Summary via "Machine Learning for Computer Systems and Networking: A Survey" reading note: http://www.baidu.com/link?url=-WcURu3PYHzCNPvPk-U0t3NqnH06b7N010Cy7flNOY0Be3arosNDmV8sos2SmbJINdSkdl4sxe1c06SDNtRPuQpg0SxYCj1IumAoQ3D6ecC (2023-03-26); Berger reference confirmed in arXiv:2212.13671 ref list: https://arxiv.org/html/2212.13671v1 (2022-12-28).
[^26^] Yang et al. — "A Learned Cache Eviction Framework with Minimal Overhead" (MAT), arXiv:2301.11886. https://arxiv.org/abs/2301.11886 (2023-01-27).
[^27^] "Adaptive Data Prefetching for File Storage Systems Using Online Machine Learning," Big Data Cogn. Comput. 10(1):28. https://www.mdpi.com/2504-2289/10/1/28 (2026-01-10).
[^28^] Emergent Mind — "LLVM Function Inlining Advances" (MLGO MDP design details: 11-d features, binary action, 7% size reduction, ~1% overhead). https://www.emergentmind.com/topics/llvm-function-inlining (2026-01-31).
[^29^] Pathak, Mankodi — "Redefining Cost Estimation in Database Systems: The Role of Execution Plan Features and Machine Learning," arXiv:2510.05612. https://arxiv.org/abs/2510.05612 (2025-10-07).

*Research completed: 7 search batches (~45 queries) covering networking, databases, cloud/orchestration, compilers, EDA, storage, CDN; 29 primary/secondary sources cited. Generated for TypeSafe AI Jev usage-catalog, dimension 03 (Systems & Infrastructure).*
