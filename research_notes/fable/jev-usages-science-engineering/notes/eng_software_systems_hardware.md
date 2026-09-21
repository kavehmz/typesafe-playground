# Jev usages in engineering, subtopic B: software, systems, requirements, hardware/EDA verification, network and IT operations

Researcher notes. Current to 21 September 2026.

**How to read this file**

- Seven sections follow the lead's key questions. An eighth holds Top 5, poor fits, and new roles.
- Each section has: Takeaway, Cited Findings, Inferences, Gaps.
- The usage catalogue (40 usages, U1 to U40) sits under **Inferences**, because "how Jev fits" is my inference. Each usage carries its own evidence links.
- **†** marks a citation I gave from memory and did not re-open this session. Verify before publishing. Everything without † came from a search result or page fetch in this session.
- "Search snippet" means I saw the number in a search summary, not in the paper itself.
- All cost sums are my own arithmetic from the brief's price ($0.04 per million input tokens). I assume about 1,000 tokens per judgment unless stated.

---

## 1. Requirements engineering (ISO/IEC/IEEE 29148, INCOSE GtWR, EARS, smells, FR/NFR, traceability)

### Takeaway

Requirements work is the cleanest fit in this subtopic. The rules are published and closed (29148 characteristics, INCOSE rules, EARS patterns). Fine-tuned BERT already reaches about 90% F1 on FR/NFR. Rule-based smell tools reach only 59% precision, so a semantic judge has clear room to help.

### Cited Findings

- NoRBERT fine-tunes BERT for requirements classification. It reaches up to 92% F1 on PROMISE NFR (over 90% for FR, 93% for NFR). The most frequent NFR subclasses get 87% average F1. It was tested on projects unseen in training. — [Hey, Keim, Koziolek, Tichy, RE 2020](https://ieeexplore.ieee.org/document/9218141/); [code](https://github.com/tobhey/NoRBERT)
- A 2025 study ran over 400 experiments with three generative LLMs (Bloom, Gemma, Llama) on PROMISE NFR, Functional-Quality, and SecReq. Prompt design and model architecture mattered everywhere. Dataset effects depended on task difficulty. The abstract gives no single F1. — [Alhoshan, Ferrari, Zhao, 2025](https://arxiv.org/abs/2504.16768)
- The Smella tool detects requirement smells taken from ISO/IEC/IEEE 29148 language criteria. It uses hand-made dictionaries. Average precision is 59%, recall 82%. Practitioners said it helps the author but cannot be the main quality check. — [Femmer et al., JSS 2017](https://arxiv.org/pdf/1611.08847)
- Deep-learning and multi-label smell classifiers exist and report better results than dictionaries on their own datasets. — [Detecting Requirements Smells With Deep Learning, 2021](https://arxiv.org/pdf/2108.03087); [Multi-label requirement smells classification, Scientific Reports 2025](https://www.nature.com/articles/s41598-025-86673-w); [NALABS, 2022](https://arxiv.org/html/2202.05641)
- EARS and Rupp template conformance can be checked automatically. The templates become BNF grammars over text-chunking annotations. — [Arora, Sabetzadeh, Briand, Zimmer, IEEE TSE 2015](https://people.svv.lu/sabetzadeh/pub/TSE15.pdf)
- NLP defect patterns were applied to railway requirements in an industrial study. — [Rosadini, Ferrari et al., EMSE 2018](https://dl.acm.org/doi/10.1007/s10664-018-9596-7)
- DO-178C high-level requirements are often written in EARS. To automate a requirements review, the team must first define writing rules that an NLP tool can process. — [AdaCore, "A Fresh Take on DO-178C Software Reviews"](https://www.adacore.com/blog/a-fresh-take-on-do-178c-software-reviews)
- Some INCOSE GtWR rules (banned words and phrases) can be checked with string matching inside a SysML tool. Others need judgment. — [INCOSE paper 568, "Automating Rule-Checking to Identify SysML Modeling Errors"](https://www.incose.org/wp-content/uploads/2026/01/paper_568.pdf)
- LLM-based traceability link recovery is active. TraceLLM uses prompt engineering and demonstration selection. Another line classifies requirement parts first, to drop parts that are irrelevant to code links. Labelled data is scarce. — [TraceLLM, Requirements Engineering journal 2026](https://link.springer.com/article/10.1007/s00766-026-00460-1); [Requirements Classification for TLR, RE 2024](https://ieeexplore.ieee.org/document/10628507/); [LLM data augmentation for requirement-to-code links, IST 2026](https://arxiv.org/pdf/2509.20149)
- An LLM approach recovers links between security requirements and goal models. — [EASE 2024](https://dl.acm.org/doi/10.1145/3661167.3661261)

### Inferences

#### Usage catalogue: requirements engineering

**U1. Requirement smell and quality-rule check** (RE)
- Practice today: ISO/IEC/IEEE 29148:2018 requirement characteristics† ([ISO page](https://www.iso.org/standard/72089.html)); INCOSE Guide to Writing Requirements rules†; tools such as Smella, QVscribe, NALABS.
- Pain point: dictionary rules give 59% precision. Reviewers are scarce. Reviews are inconsistent between people.
- How Jev fits: clause-by-clause compliance check. One Noul per rule, all in one request. `state` = the requirement plus glossary. Example: "Does this requirement contain a vague quantifier with no measurable bound?" yes/no. Score for verifiability: `not verifiable / verifiable with effort / directly testable`.
- Why cheap and fast: 10,000 requirements × 40 rules = 400,000 judgments, about $16. The check can run on every save in DOORS, Jama, or a Markdown editor.
- Evidence: [Femmer et al. 2017](https://arxiv.org/pdf/1611.08847) (59% precision, 82% recall); [smells with deep learning](https://arxiv.org/pdf/2108.03087); [INCOSE paper 568](https://www.incose.org/wp-content/uploads/2026/01/paper_568.pdf).
- Fit: **Strong**. Risk: double negatives and literal reading. Flag "shall not fail to" for a person, do not interpret it.

**U2. EARS pattern classification and template conformance** (RE)
- Practice today: EARS, Mavin et al., RE 2009† ([IEEE](https://ieeexplore.ieee.org/document/5328509)); grammar-based conformance checkers.
- Pain point: grammar checkers see syntax only. They cannot tell whether the "when" clause is a real trigger or a state.
- How Jev fits: Choice over `ubiquitous / event-driven / state-driven / unwanted behaviour / optional feature / complex / not EARS`. Noul: "Is the trigger a discrete event, not a continuing state?"
- Why cheap and fast: live feedback while typing. Bulk conversion audits of legacy specs.
- Evidence: [Arora et al., TSE 2015](https://people.svv.lu/sabetzadeh/pub/TSE15.pdf); [AdaCore DO-178C note](https://www.adacore.com/blog/a-fresh-take-on-do-178c-software-reviews).
- Fit: **Strong**. Risk: low. Grammar tools already cover the easy part, so value is the semantic part.

**U3. Functional vs non-functional and NFR subclass classification, including security-relevant requirements** (RE)
- Practice today: ISO/IEC 25010 quality model†; PROMISE NFR dataset (Cleland-Huang et al., 2007†); SecReq dataset.
- Pain point: manual tagging of thousands of requirements. Labels drift between analysts.
- How Jev fits: triage / router. Choice over the 11 PROMISE classes or the 25010 characteristics. No training needed, class definitions go in `criteria`.
- Why cheap and fast: re-tag a whole repository when the taxonomy changes. Cost is cents.
- Evidence: [NoRBERT](https://ieeexplore.ieee.org/document/9218141/) 92% F1 binary, 87% frequent NFR classes; [Alhoshan et al. 2025](https://arxiv.org/abs/2504.16768).
- Fit: **Strong**. Risk: rare classes (portability, legal) have few examples in any benchmark.

**U4. Ambiguity detection** (RE)
- Practice today: 29148 "unambiguous" characteristic; manual inspection; Ezzini et al., ICSE 2022 on anaphoric ambiguity†.
- Pain point: ambiguity is the most common requirement defect and needs a careful reader.
- How Jev fits: Noul per ambiguity type (pronoun with two possible referents, vague adjective, open-ended list, passive with no actor). Code proposes candidate spans. Jev judges each.
- Why cheap and fast: every sentence of every spec, on every change.
- Evidence: [Rosadini, Ferrari et al. 2018](https://dl.acm.org/doi/10.1007/s10664-018-9596-7); [Femmer 2017](https://arxiv.org/pdf/1611.08847).
- Fit: **Medium**. Risk: people disagree on what is ambiguous, so ground truth is soft. Calibrated probability helps here.

**U5. Completeness check against a domain checklist** (RE)
- Practice today: 29148 "complete" characteristic; domain checklists; Luitel, Hassani, Sabetzadeh on LLM completeness aid (RE journal 2024†).
- Pain point: missing requirements are found late. Reviewers cannot hold the whole checklist in mind.
- How Jev fits: clause-by-clause. For each checklist item: "Does any requirement in this section address loss of power?" `state` = one section at a time, to keep noise low.
- Why cheap and fast: checklist × sections grid runs in seconds.
- Evidence: only the † citation above. I found no benchmark this session.
- Fit: **Medium**. Risk: large state with irrelevant detail lowers accuracy. Chunk the spec.

**U6. Traceability link recovery and requirement-to-test coverage** (RE, V&V)
- Practice today: trace matrices required by DO-178C (objectives in Annex A†), ISO 26262-8†, ISO/IEC/IEEE 29148. Built by hand or with IR (TF-IDF, LSI).
- Pain point: links rot. Manual upkeep is costly. IR methods give low precision.
- How Jev fits: entity / record alignment. Embeddings shortlist candidates. Jev gives Noul per pair: "Does this test case verify this requirement?" Score: `not related / partly covers / fully covers`.
- Why cheap and fast: 2,000 requirements × 20 candidates = 40,000 pairs, about $2. Re-run on each merge.
- Evidence: [TraceLLM 2026](https://link.springer.com/article/10.1007/s00766-026-00460-1); [RE 2024 classification for TLR](https://ieeexplore.ieee.org/document/10628507/); [IST 2026](https://arxiv.org/pdf/2509.20149).
- Fit: **Strong to Medium**. Risk: requirement-to-code has a large concept gap. Requirement-to-test is easier. Coverage percentages must be computed in code.

**U7. Conflict and duplicate detection between requirement pairs** (RE)
- Practice today: 29148 "consistent" set characteristic; manual cross-reading.
- Pain point: pairs grow with n². No one reads all pairs.
- How Jev fits: entity alignment. Choice per pair: `duplicate / conflict / refines / unrelated`.
- Why cheap and fast: blocking plus Jev makes all-pairs within a subsystem affordable.
- Evidence: Malik et al., transfer learning for conflict and duplicate detection, 2022†. Not verified this session.
- Fit: **Medium**. Risk: numeric conflicts ("within 5 s" vs "within 3 s") need code to extract and compare the numbers.

**U8. User-feedback and app-review classification for elicitation** (RE)
- Practice today: crowd-based RE; Maalej and Nabil, RE 2015†: bug report / feature request / user experience / rating.
- Pain point: millions of reviews and support messages. Keyword filters miss most.
- How Jev fits: screening at scale. Choice on type, Score on severity, Noul "mentions a regulated or safety topic".
- Why cheap and fast: one million reviews of 200 tokens cost about $8.
- Evidence: † only. No source opened this session.
- Fit: **Strong**. Risk: non-English reviews.

### Gaps

- I did not open the standards themselves (29148, INCOSE GtWR v4, EARS paper). Clause numbers are not quoted.
- No published test of a calibrated, no-fine-tune classifier on PROMISE NFR. Jev's own accuracy here is unknown.
- † items in this section: EARS paper, ISO 29148 URL, Cleland-Huang 2007, Ezzini 2022, Luitel 2024, Malik 2022, Maalej and Nabil 2015, ISO 25010.

---

## 2. Software maintenance and CI (bug triage, duplicates, issues, commits, static-analysis alerts, flaky tests, review comments, vulnerabilities, secrets, semantic linting)

### Takeaway

Every task here already has a published text classifier, and most reach 70 to 97% on their own benchmarks. The best fits have closed, standard answer sets (CVSS metrics, CWE, issue type). The worst fits need deep code reasoning: static-alert triage was shown to be inflated by data leakage, and function-level vulnerability detection is near random.

### Cited Findings

- NLBSE tool competition: 1.4 million labelled issues in 2023 (bug, enhancement, question, documentation). The 2024 edition used 3,000 issues from 5 projects. The 2024 SetFit baseline scored 0.827 F1. Top entries scored about 0.857 (search snippet). — [NLBSE'23 repo](https://github.com/nlbse2023/issue-report-classification); [NLBSE'24 repo](https://github.com/nlbse2024/issue-report-classification); [NLBSE'24 tools page](https://nlbse2024.github.io/tools/)
- Duplicate bug report detection: deep learning helps as binary classification, but real use is ranking. A simple technique already used in practice matched recent research tools on industrial data. Cupid (ChatGPT plus a traditional ranker) reports state of the art on recall-rate@10. — [Does deep learning improve duplicate detection?, JSS 2023](https://www.sciencedirect.com/science/article/abs/pii/S016412122300002X); [Cupid](https://arxiv.org/html/2308.10022v3); [textual dissimilarity study](https://arxiv.org/pdf/2212.09976)
- ML for actionable warning identification: survey of 51 primary studies (2000 to 2023). It names LLMs as a future direction. — [Ge et al., ACM Computing Surveys](https://arxiv.org/abs/2312.00324); earlier SLR: [Heckman and Williams, IST 2011](https://www.sciencedirect.com/science/article/abs/pii/S0950584910002235)
- The "golden features" for static-analysis false alarms suffered from data leakage and duplication. Labels leaked into features. Reported near-perfect results were over-optimistic. The labelling heuristic also disagreed with human judges. — [Kang, Aw, Lo, ICSE 2022](https://arxiv.org/abs/2202.05982)
- A 2025 follow-up argues that "actionable" is not enough and recommends valid actionable warnings with weak supervision. — [arXiv 2511.12229](https://arxiv.org/pdf/2511.12229)
- FlakyCat classifies flaky tests by root-cause category (concurrency, async wait, time, and so on) from test code. CodeBERT plus few-shot Siamese network. Weighted F1 70%. — [Akli et al., 2022/2023](https://arxiv.org/abs/2208.14799); related: [FlaKat](https://arxiv.org/html/2403.01003)
- FlaXifyer predicts intermittent CI job failure categories from job logs at TELUS. 84.3% macro F1, 92.0% top-2 accuracy, only 12 labelled examples per category, 2,458 failures. Its LogSift tool cut review effort by 74.4%. — [Aïdasso, Bordeleau, Tizghadam, 2026](https://arxiv.org/abs/2601.22264)
- An MLP classifier assigned CI test-failure root-cause categories correctly 88.9% of the time. — [Aalto University thesis](https://aaltodoc.aalto.fi/items/032dbbf0-124b-4330-90f0-00c44d4c1826)
- Code review comment classification into 17 categories: best LLMs average 46.2% F1. Other work uses a nine-label taxonomy (six comment smells, three useful intents) on 448 labelled comments, and LLM-as-judge pipelines for usefulness. — [Fine-grained review comment classification, 2025](https://arxiv.org/pdf/2508.09832); [Automated classification of human review comments, 2026](https://arxiv.org/abs/2604.23667); [Curation pipeline, 2026](https://arxiv.org/html/2607.09524)
- CVSS-BERT trains one BERT classifier per CVSS metric and predicts the full vector from the description. Computed scores were close to expert scores. — [Shahid and Debar, 2021](https://arxiv.org/pdf/2111.08510); earlier: [Elbaz, Rilling, Morin, ARES 2020](https://dl.acm.org/doi/10.1145/3407023.3407038)
- VLAI is a RoBERTa severity classifier deployed in a public vulnerability lookup service and updated continuously. — [VLAI, 2025](https://arxiv.org/pdf/2507.03607)
- V2W-BERT maps CVE to CWE. Up to 97% accuracy on random splits, 94% on time-ordered splits. Handles rare classes. — [Das et al., 2021](https://arxiv.org/abs/2102.11498)
- Four frontier LLMs were tested on the four SSVC decision points with 384 vulnerabilities and 165,000 queries. Gemini led on three points. Only DeepSeek reached "fair agreement" on weighted metrics. All models over-predicted risk. Conclusion: LLMs do not replace expert judgment. — [Al Haddad et al., 2025](https://arxiv.org/abs/2510.18508)
- VulFixMiner finds silent vulnerability-fix commits from code changes alone with fine-tuned CodeBERT. Successors: VFFinder, VFDelta. — [Zhou et al., ASE 2021](https://ieeexplore.ieee.org/document/9678720/); [VFFinder](https://arxiv.org/pdf/2309.01971); [VFDelta](https://arxiv.org/pdf/2409.16606)
- PrimeVul: a 7B code model scored 68.26% F1 on BigVul but 3.09% F1 on the realistic PrimeVul set. GPT-3.5 and GPT-4 were close to random guessing in the strictest setting. — [Ding et al., 2024](https://arxiv.org/abs/2403.18624)
- Secrets: regex and entropy scanners give many false positives. Regex plus a voting classifier reached 84% precision, 89% recall. A fine-tuned LLM reports 0.985 F1. A regex-then-LLM design removed 80% of false positives (search snippet). An LLM-embedding classifier gained 13% F1 over prior work. — [Saha et al., COMSNETS 2020](https://ieeexplore.ieee.org/document/9027350/); [Secret breach detection with LLMs, 2025](https://arxiv.org/html/2504.18784v1); [Biringa and Kul, 2025](https://arxiv.org/abs/2506.13090); [Learning to detect hardcoded secrets, EMSE 2026](https://link.springer.com/article/10.1007/s10664-026-10929-w)
- SATD detection: a BERT model beat all earlier methods on 19 of 20 projects in cross-project tests. Within-project data stays too thin. — [Measuring Improvement of F1-Scores in Detection of SATD, 2023](https://arxiv.org/abs/2303.09617); [decade review, JSEP 2026](https://onlinelibrary.wiley.com/doi/10.1002/smr.70104)
- Meta's Diff Risk Score is a fine-tuned Llama model. It predicts the chance that a diff causes a production incident. Example operating point: flag 10% of diffs and catch 60% of incident-causing ones. It powers about 20 features, including code-freeze unlock and reviewer choice. — [Engineering at Meta, 6 Aug 2025](https://engineering.fb.com/2025/08/06/developer-tools/diff-risk-score-drs-ai-risk-aware-software-development-meta/)
- Meta's RADAR auto-reviews low-risk diffs with gates, heuristics, the Diff Risk Score, LLM review, and deterministic checks. It reviewed 535,000+ diffs and landed 331,000+. Revert rate is one third and incident rate one fiftieth of other diffs. Moving the risk threshold from P25 to P50 raised approvals to 60.31%. — [Adams et al., 2026](https://arxiv.org/abs/2605.30208); similar at Prime Video: [arXiv 2607.06766](https://arxiv.org/pdf/2607.06766)

### Inferences

#### Usage catalogue: software maintenance and CI

**U9. Issue report classification** (maintenance)
- Practice today: GitHub/Jira labels. Herzig, Just, Zeller, ICSE 2013† found about a third of "bugs" are not bugs.
- Pain point: wrong labels distort metrics and defect-prediction data. Maintainers label by hand.
- How Jev fits: triage / router. Choice `bug / feature / question / documentation`. `state` = title plus body.
- Why cheap and fast: label at submit time. Re-label the full history (1.4 million issues × 300 tokens is about $17).
- Evidence: [NLBSE'24](https://nlbse2024.github.io/tools/) baseline 0.827 F1, top about 0.857.
- Fit: **Strong**. Risk: project-specific label meanings. Put them in `criteria`.

**U10. Bug triage: component or team assignment, severity and priority** (maintenance)
- Practice today: triage meetings; Anvik, Hiew, Murphy, ICSE 2006†; Lamkanfi et al., MSR 2010† on severity.
- Pain point: reassignment ("bug tossing") delays fixes. Severity is set inconsistently.
- How Jev fits: Choice over components (each with a one-line description). Score for severity with described levels. Low confidence goes to a person.
- Why cheap and fast: no model retraining when teams re-organise. Edit the option list instead.
- Evidence: industrial analogue [DeepTriage at Azure](https://arxiv.org/abs/2012.03665), 82.9% F1. Bug-tracker papers are † only.
- Fit: **Strong to Medium**. Risk: hundreds of components. Use a two-level Choice (area, then component).

**U11. Duplicate bug report detection** (maintenance)
- Practice today: BM25-style search in the tracker; REP; Siamese networks.
- Pain point: text of true duplicates often differs a lot. Rankers miss them.
- How Jev fits: entity alignment. Retrieval gives top-k. Jev gives Noul per pair: "Do these two reports describe the same defect?"
- Why cheap and fast: check 50 candidates per new report for about $0.002, while the reporter is still typing.
- Evidence: [JSS 2023](https://www.sciencedirect.com/science/article/abs/pii/S016412122300002X) (simple baseline is hard to beat); [Cupid](https://arxiv.org/html/2308.10022v3); [dissimilarity study](https://arxiv.org/pdf/2212.09976).
- Fit: **Medium**. Risk: gains over simple rankers are unproven. Stack traces and version numbers need code-side matching.

**U12. Bug-report quality gate at submission** (maintenance)
- Practice today: issue templates; Bettenburg et al., FSE 2008† ("What makes a good bug report?"); Chaparro et al., FSE 2017† on missing information.
- Pain point: reports lack steps to reproduce, expected behaviour, or observed behaviour. Maintainers ask and wait days.
- How Jev fits: verifier. Three Nouls: "States observed behaviour?", "States expected behaviour?", "Gives steps to reproduce?" The form shows which are missing.
- Why cheap and fast: 100 ms means feedback before the user clicks Submit.
- Evidence: † only.
- Fit: **Strong**. Risk: low. Wrong answers only cost a nudge.

**U13. Commit classification and commit-message quality** (maintenance)
- Practice today: Swanson's maintenance categories (corrective, adaptive, perfective), 1976†; Levin and Yehudai, 2017†; Conventional Commits; Tian et al., ICSE 2022† ("what" and "why" in messages).
- Pain point: release notes, audit trails, and defect datasets depend on commit type. Keyword rules ("fix") are brittle.
- How Jev fits: Choice on type. Noul "message explains why". Noul "diff matches the message" (small diffs only).
- Why cheap and fast: a pre-commit hook returns in 100 ms. 1,000 commits a day × 5 questions × 2,000 tokens is about $0.40 a day.
- Evidence: † only for classifiers. [VulFixMiner](https://ieeexplore.ieee.org/document/9678720/) shows commit-level transformers work.
- Fit: **Strong**. Risk: large diffs exceed useful context. Summarise by file in code.

**U14. Static-analysis alert triage (actionable alert identification)** (CI)
- Practice today: SpotBugs, Coverity, CodeQL, clang-tidy. Teams suppress rules or ignore the tool.
- Pain point: high share of unactionable alerts.
- How Jev fits: verifier and feature extractor. `state` = alert text, rule description, code slice. Noul "is this a true positive?" The probability feeds a ranker with history features.
- Why cheap and fast: every alert on every commit, not a weekly batch.
- Evidence: [Ge et al. survey](https://arxiv.org/abs/2312.00324); warning from [Kang, Aw, Lo 2022](https://arxiv.org/abs/2202.05982) that past results were inflated; [weak supervision 2025](https://arxiv.org/pdf/2511.12229).
- Fit: **Medium**. Risk: multi-hop data flow across functions. Jev reads literally and will miss it.

**U15. Flaky-test and CI job-failure categorisation** (CI)
- Practice today: rerun and quarantine; Luo et al. flaky root-cause taxonomy, FSE 2014†.
- Pain point: engineers read long job logs to tell infrastructure failures from code failures.
- How Jev fits: triage. Code trims the log to the failure window. Choice over `infrastructure / dependency / timeout / test-order / async wait / concurrency / real regression`. Auto-retry only on the infrastructure classes.
- Why cheap and fast: decide retry-or-page within the pipeline step. No labelled data needed per company.
- Evidence: [FlaXifyer](https://arxiv.org/abs/2601.22264) 84.3% macro F1 with 12 examples per class; [FlakyCat](https://arxiv.org/abs/2208.14799) 70% weighted F1; [Aalto thesis](https://aaltodoc.aalto.fi/items/032dbbf0-124b-4330-90f0-00c44d4c1826) 88.9%.
- Fit: **Strong**. Risk: log noise. Trimming in code is essential.

**U16. Code-review comment classification** (code review)
- Practice today: Bosu et al., MSR 2015† (useful reviews at Microsoft); ToxiCR, TOSEM 2023† (toxicity).
- Pain point: review bots produce noise. Teams cannot measure review quality.
- How Jev fits: Choice on type (defect, design, style, question, praise). Noul "actionable". Score on civility. Filter AI-review comments before posting.
- Why cheap and fast: filter every bot comment inline. Audit years of review history.
- Evidence: [17-class study](https://arxiv.org/pdf/2508.09832) best F1 46.2%; [LLM classification 2026](https://arxiv.org/abs/2604.23667); [curation pipeline 2026](https://arxiv.org/html/2607.09524).
- Fit: **Medium**. Risk: fine-grained taxonomies are hard even for large LLMs. Use few, well-described classes.

**U17. Security bug report and silent vulnerability-fix detection** (security)
- Practice today: coordinated disclosure; security labels set by reporters; FARSEC, Peters et al., TSE 2019†.
- Pain point: security bugs hide among normal bugs. Fixes land silently before CVEs.
- How Jev fits: screening at scale. Noul "describes a security weakness". On commits: Noul "fixes a memory-safety or input-validation flaw".
- Why cheap and fast: scan every commit of every dependency. 1 million commits × 1,500 tokens is about $60.
- Evidence: [VulFixMiner](https://ieeexplore.ieee.org/document/9678720/); [VFFinder](https://arxiv.org/pdf/2309.01971); [VFDelta](https://arxiv.org/pdf/2409.16606).
- Fit: **Medium**. Risk: needle in haystack, so false positives dominate. Adversarial commit text can steer the model.

**U18. CVE intake: CWE assignment, CVSS vector elements, SSVC decision points** (security)
- Practice today: [MITRE CWE](https://cwe.mitre.org/); [FIRST CVSS v4.0](https://www.first.org/cvss/v4-0/); CISA SSVC†. Analysts at NVD and vendors fill these by hand.
- Pain point: backlog at disclosure time. Inconsistent scoring between analysts.
- How Jev fits: one Choice per CVSS metric (Attack Vector: `network / adjacent / local / physical`), all in one request. Code computes the numeric score from the vector. Choice over a CWE view.
- Why cheap and fast: the answer sets are exactly Jev's primitives. Whole-NVD re-scoring costs a few dollars. Calibrated probabilities give per-metric confidence.
- Evidence: [CVSS-BERT](https://arxiv.org/pdf/2111.08510); [V2W-BERT](https://arxiv.org/abs/2102.11498) 94 to 97%; [VLAI](https://arxiv.org/pdf/2507.03607) deployed; caution from [SSVC study](https://arxiv.org/abs/2510.18508) (LLMs over-predict risk).
- Fit: **Strong** for CWE and CVSS base metrics. **Medium** for SSVC, which needs deployment context. Risk: hierarchy of 900+ CWEs needs a staged Choice.

**U19. Secret-candidate and licence checks** (supply chain)
- Practice today: gitleaks, TruffleHog, GitHub secret scanning (regex plus entropy); [SPDX](https://spdx.dev/) identifiers, ScanCode; LiDetector, TOSEM 2023† for licence terms.
- Pain point: false positives make teams switch scanners off. Custom licence text defeats exact matching.
- How Jev fits: select, do not generate. Regex finds candidates. Jev gives Noul "is this a live credential, not a placeholder or test fixture?" using nearby code. For licences: Choice over SPDX families, Noul per obligation ("requires source disclosure").
- Why cheap and fast: runs in the pre-commit hook on every candidate string.
- Evidence: [Saha et al. 2020](https://ieeexplore.ieee.org/document/9027350/) 84% precision, 89% recall; [LLM secrets 2025](https://arxiv.org/html/2504.18784v1) 0.985 F1; [Biringa and Kul 2025](https://arxiv.org/abs/2506.13090). Licence evidence is † only.
- Fit: **Strong** for secrets. **Medium** for licences. Risk: random-string judgement is partly non-semantic, so keep the entropy check in code.

**U20. Semantic linting: comment-code mismatch, self-admitted technical debt, log-message quality** (CI, IDE)
- Practice today: linters check syntax and style. Panthaplackel et al., AAAI 2021† on comment-code inconsistency; SATD literature.
- Pain point: rules cannot read meaning. "TODO hack" variants evade keywords.
- How Jev fits: semantic predicate in a rule engine. Each lint rule is a Noul: "Does this comment describe behaviour the function no longer has?"
- Why cheap and fast: under 100 ms allows on-save IDE checks. Under 10 ms would allow per-keystroke.
- Evidence: [SATD BERT 2023](https://arxiv.org/abs/2303.09617) best on 19 of 20 projects; [SATD review 2026](https://onlinelibrary.wiley.com/doi/10.1002/smr.70104).
- Fit: **Medium to Strong**. Risk: comment-code checks need code understanding. High-level languages only.

**U21. Change-risk features for per-commit gating** (release engineering)
- Practice today: just-in-time defect prediction, Kamei et al., TSE 2013†; Meta Diff Risk Score; change-advisory boards.
- Pain point: metadata features miss what the change means. Fine-tuned LLMs are costly to run and keep current.
- How Jev fits: feature extractor. Nouls such as "touches authentication", "changes a default", "alters a schema", "removes a check" become calibrated features in a gradient-boosted risk model with history features.
- Why cheap and fast: every diff, every revision of the diff. Thresholds can be tuned like Meta's percentile gates.
- Evidence: [Meta DRS](https://engineering.fb.com/2025/08/06/developer-tools/diff-risk-score-drs-ai-risk-aware-software-development-meta/); [RADAR](https://arxiv.org/abs/2605.30208); [Prime Video](https://arxiv.org/pdf/2607.06766).
- Fit: **Medium**. Risk: Meta's result came from fine-tuning on its own incident history. Jev cannot be fine-tuned, so it supplies features, not the risk model.

### Gaps

- I found no study of per-keystroke semantic checks in an IDE. The latency claim is an inference.
- The 85.66% fine-tuned GPT-4o figure for NLBSE'24 came from a search snippet. I did not open the paper.
- Licence-compliance classifier evidence was not searched in depth.
- † items: Herzig 2013, Anvik 2006, Lamkanfi 2010, Bettenburg 2008, Chaparro 2017, Swanson 1976, Levin and Yehudai 2017, Tian 2022, Luo 2014, Bosu 2015, ToxiCR, FARSEC, LiDetector, Panthaplackel 2021, Kamei 2013, SSVC page.

---

## 3. Operations and AIOps (log classification, incident routing, alert correlation, root-cause category, postmortems)

### Takeaway

Industrial papers from Microsoft and others show text classifiers already run in production for incident routing (82.9% F1) and root-cause category (0.766 accuracy). Zero-shot LLMs reach 0.82 to 0.91 F1 on log anomalies with no labels. Existing systems ration LLM calls because of cost. Jev removes that ration.

### Cited Findings

- DeepTriage recommends the responsible team for an incident. It ensembles gradient-boosted trees, clustering, and deep networks. 82.9% F1 overall, 76.3 to 91.3% on high-impact incidents. Deployed in Azure since October 2017, used by thousands of teams daily. — [Pham et al., 2020](https://arxiv.org/abs/2012.03665)
- Microsoft studied incident triage across 20 large online services. — [ICSE-SEIP 2019](https://dl.acm.org/doi/10.1109/ICSE-SEIP.2019.00020). A newer multi-LLM-agent triage system exists. — [Triangle, Microsoft Research, 2025](https://www.microsoft.com/en-us/research/publication/triangle-empowering-incident-triage-with-multi-agents/)
- RCACopilot routes incidents to handlers by alert type, gathers diagnostics, then predicts the root-cause category with an LLM and few-shot past incidents. It includes an "unseen incident" option. Accuracy up to 0.766, macro-F1 0.533 (search snippet), about 4.2 s per incident. The collection part ran at Microsoft for over four years. — [Chen et al., EuroSys 2024](https://arxiv.org/abs/2305.15778)
- Alert storms occur about once a week at a large bank. Several engineers need about an hour each time. — [Zhao et al., ICSE-SEIP 2020](https://netman.aiops.org/~peidan/ANM2020/12.IncidentManagement/LectureCoverage/2020ICSE_SEIP_AlertSummary.pdf)
- COLA aggregates alerts with a hybrid: correlation mining first, and only uncertain pairs go to an LLM. F1 0.901 to 0.930 on a large cloud platform. — [Kuang et al., ICSE-SEIP 2024](https://arxiv.org/abs/2403.06485)
- Linked-incident identification at Microsoft. — [Chen et al., ESEC/FSE 2020](https://dl.acm.org/doi/abs/10.1145/3368089.3409768)
- A 2026 benchmark on HDFS, BGL, Thunderbird, and Spirit: fine-tuned BERT/RoBERTa reach 0.96 to 0.99 F1. Prompted GPT-3.5, GPT-4, and LLaMA-3 reach 0.82 to 0.91 F1 zero-shot, with no labelled anomalies. Single-author arXiv preprint, not peer reviewed. — [Patel, 2026](https://arxiv.org/abs/2604.12218)
- Other log resources: LogEval benchmark suite; review of LLM log parsing; systematic review of LLM log anomaly detection. — [LogEval](https://arxiv.org/pdf/2407.01896); [LLM log parsing review](https://arxiv.org/html/2504.04877v2); [AIOps SLR 2025](https://www.sciencedirect.com/science/article/pii/S2667305325001346); [LogParser-LLM, KDD 2024](https://dl.acm.org/doi/abs/10.1145/3637528.3671810)
- Knowledge extraction from incident text at Microsoft. — [Neural Knowledge Extraction From Cloud Service Incidents, 2020](https://arxiv.org/pdf/2007.05505)

### Inferences

#### Usage catalogue: operations

**U22. Log-template and log-window anomaly classification** (AIOps)
- Practice today: parse with Drain (He et al., ICWS 2017†), then DeepLog† or LogBERT†; datasets from [LogHub](https://github.com/logpai/loghub).
- Pain point: supervised models need labelled anomalies per system. They break when log formats change.
- How Jev fits: screening at scale. Code parses lines into templates. Jev classifies each **new template** once: Choice `normal / warning / failure / security-relevant`, Noul "indicates data loss". Windows of template IDs go to classical sequence models.
- Why cheap and fast: zero labels. Classify a never-seen line within 100 ms of first sight. Cost note: raw per-line use on 1 billion lines a day (50 tokens each) is about $2,000 a day and exceeds the 250,000 tokens per second limit. Per-template use costs cents.
- Evidence: [2026 benchmark](https://arxiv.org/abs/2604.12218) zero-shot 0.82 to 0.91 F1; [LogEval](https://arxiv.org/pdf/2407.01896).
- Fit: **Medium to Strong**. Risk: sequence and count anomalies are numeric. Leave them to code.

**U23. Incident routing to the owning team** (AIOps)
- Practice today: on-call routing rules; ITIL incident management†; DeepTriage at Azure.
- Pain point: each wrong transfer adds time to mitigate. Trained routers lag re-organisations.
- How Jev fits: triage / router. Choice over teams with one-line charters in `criteria`. Confidence below threshold falls back to the incident commander.
- Why cheap and fast: re-route on every incident update, not just at creation.
- Evidence: [DeepTriage](https://arxiv.org/abs/2012.03665) 82.9% F1 in production; [Triangle](https://www.microsoft.com/en-us/research/publication/triangle-empowering-incident-triage-with-multi-agents/).
- Fit: **Strong**. Risk: thousands of teams. Needs staged Choice. Ownership knowledge must be in the option text.

**U24. Alert correlation and incident linking** (AIOps)
- Practice today: topology and time-window rules; COLA hybrid; linked-incident models.
- Pain point: alert storms. COLA sends only uncertain pairs to an LLM because LLM calls cost too much.
- How Jev fits: entity alignment. Noul per pair: "Are these two alerts symptoms of the same failure?" Code supplies time gap and topology distance as named buckets.
- Why cheap and fast: all pairs become affordable. 1,000 alerts give about 500,000 pairs × 300 tokens, about $6. The 1,200 requests per minute limit means many pairs must share one request.
- Evidence: [COLA](https://arxiv.org/abs/2403.06485) F1 0.90 to 0.93; [alert storm study](https://netman.aiops.org/~peidan/ANM2020/12.IncidentManagement/LectureCoverage/2020ICSE_SEIP_AlertSummary.pdf); [linked incidents](https://dl.acm.org/doi/abs/10.1145/3368089.3409768).
- Fit: **Strong**. Risk: time comparison is a Jev weak spot. Pass time gaps as buckets.

**U25. Root-cause category prediction** (AIOps)
- Practice today: RCACopilot-style handler plus LLM; runbooks.
- Pain point: 4.2 s and LLM cost per incident. Categories drift.
- How Jev fits: Choice over root-cause categories plus "unseen". `state` = diagnostic summary built by handlers. The result picks the runbook (supervisory layer).
- Why cheap and fast: re-classify as each new diagnostic arrives. Run every category as a parallel Noul and rank by probability.
- Evidence: [RCACopilot](https://arxiv.org/abs/2305.15778) accuracy 0.766, macro-F1 0.533.
- Fit: **Medium to Strong**. Risk: RCACopilot relies on retrieved similar incidents. Retrieval stays outside Jev. Rare categories score low (macro-F1 0.533).

**U26. Postmortem and incident-database mining** (SRE)
- Practice today: blameless postmortems ([Google SRE book](https://sre.google/sre-book/postmortem-culture/)); manual tagging; Ghosh et al., SoCC 2022† on production incidents.
- Pain point: thousands of free-text postmortems. Tags are missing or inconsistent. Trend analysis is manual.
- How Jev fits: screening at scale and feature extractor. Choice on root cause class, detection method, mitigation type. Noul "a missing alert delayed detection".
- Why cheap and fast: 50,000 postmortems × 3,000 tokens is about $6. Re-run whenever the taxonomy changes.
- Evidence: [Neural knowledge extraction, Microsoft 2020](https://arxiv.org/pdf/2007.05505).
- Fit: **Strong**. Risk: long documents. Chunk by section.

### Gaps

- I found no Google or Meta paper on root-cause category prediction this session. Meta's public work found was change risk (section 2).
- The RCACopilot macro-F1 and timing came from a search snippet.
- The 2026 log benchmark is a single-author preprint. Treat its numbers as indicative.
- † items: Drain, DeepLog, LogBERT, ITIL, Ghosh 2022.

---

## 4. Systems engineering and safety assurance (MBSE, GSN safety cases, STPA, DO-178C, ISO 26262, ICDs)

### Takeaway

Evidence here is thin and mostly exploratory. LLM studies on STPA and safety cases say the output needs expert review. Jev's role is a pre-screen and consistency checker, never the credited reviewer. SysML v2 helps because its textual notation makes models readable as text.

### Cited Findings

- ChatGPT was tested on STPA for automatic emergency braking and electricity demand-side management. Without human intervention it was inadequate due to reliability issues. With careful design it could outperform human experts. — [Qi et al., 2023/2025](https://arxiv.org/abs/2304.01246)
- Another study asked whether LLMs can assist hazard analysis. — [Diemert and Weber, 2023](https://arxiv.org/pdf/2303.15473). LLMs were also applied to STPA and FRAM. — [Safety Science, 2025](https://www.sciencedirect.com/science/article/pii/S0925753525001857)
- STPA elements (losses, hazards, control actions, unsafe control actions, loss scenarios, mitigations) can each inform a goal in a GSN safety case. — [Combining GSN and STPA, Springer 2019](https://link.springer.com/chapter/10.1007/978-3-030-26250-1_1)
- CoDefeater uses LLMs to find defeaters in assurance cases. On two systems it found known and new feasible defeaters. — [Gohar et al., ASE 2024 NIER](https://arxiv.org/abs/2407.13717). GPT-4 was also explored for safety-case generation. — [arXiv 2312.05696](https://arxiv.org/pdf/2312.05696)
- INCOSE work automates rule checks inside SysML tools. String-matchable INCOSE rules are checked by script, with Satisfy and Violate links added to the model. — [INCOSE paper 568](https://www.incose.org/wp-content/uploads/2026/01/paper_568.pdf)
- A SysML profile was extended to follow the INCOSE Guide to Writing Requirements and ISO/IEC/IEEE 29148 templates. — [arXiv 2410.21288](https://arxiv.org/pdf/2410.21288)
- A 2026 framework localises semantic faults in SysML v2 models with a knowledge-graph-augmented LLM and a human in the loop. — [arXiv 2606.23395](https://arxiv.org/pdf/2606.23395)
- DO-178C lists objectives, activities, and evidence per lifecycle process. Requirement reviews check verifiability, accuracy, and consistency. — [AdaCore](https://www.adacore.com/blog/a-fresh-take-on-do-178c-software-reviews); [IST 2026 on formal methods for DO-178C](https://www.sciencedirect.com/science/article/pii/S0950584926000571)

### Inferences

#### Usage catalogue: systems engineering and safety

**U27. MBSE model review and interface-control-document consistency** (systems engineering)
- Practice today: ISO/IEC/IEEE 15288†; SysML v2 textual notation†; modelling-rule validation suites; ICDs kept in Word and Excel.
- Pain point: scripts catch only syntactic rule breaks. Interface mismatches appear at integration.
- How Jev fits: clause-by-clause check per model element ("Does this block's description state its function, not its implementation?"). Entity alignment across two ICDs: "Do `ENG_OIL_PRESS` in ICD-A and `OilPressure` in ICD-B denote the same signal?" Code compares units, ranges, and rates.
- Why cheap and fast: run on every model commit. All-pairs signal alignment across large ICDs.
- Evidence: [INCOSE paper 568](https://www.incose.org/wp-content/uploads/2026/01/paper_568.pdf); [SysML v2 fault localisation 2026](https://arxiv.org/pdf/2606.23395). I found **no** published work on ICD consistency checking by NLP.
- Fit: **Medium** for model review. **Speculative** for ICDs. Risk: numeric fields, and graphical models must first be serialised to text.

**U28. STPA support: unsafe-control-action typing and scenario screening** (safety)
- Practice today: STPA Handbook, Leveson and Thomas, 2018†. Four UCA types: not provided, provided, wrong timing or order, stopped too soon or applied too long.
- Pain point: STPA is labour-heavy and subjective. LLM-generated UCAs need checking.
- How Jev fits: verifier. Choice of UCA type for each candidate. Noul "Does this UCA link to hazard H-2 as defined?" Noul "duplicate of an earlier UCA". Filters LLM or workshop output before expert review.
- Why cheap and fast: control actions × contexts × four types gives thousands of cells. All can be screened.
- Evidence: [Qi et al.](https://arxiv.org/abs/2304.01246) (LLM alone is inadequate); [Diemert and Weber](https://arxiv.org/pdf/2303.15473); [Safety Science 2025](https://www.sciencedirect.com/science/article/pii/S0925753525001857).
- Fit: **Medium**. Risk: safety-critical. Missed hazards are not recoverable, so Jev may only add candidates or sort them, never remove them.

**U29. Safety-case (GSN) review: claim-evidence support and defeater screening** (safety)
- Practice today: GSN Community Standard v3†; ISO 26262 safety case; UL 4600†; assurance-case reviews by independent assessors.
- Pain point: large arguments. Reviewers check each claim-evidence link by reading.
- How Jev fits: verifier. Per link, Score: `evidence does not address claim / addresses partly / addresses directly`. Noul "claim uses an undefined term". Rank LLM-proposed defeaters by plausibility.
- Why cheap and fast: re-check the whole case on every evidence update (continuous assurance).
- Evidence: [CoDefeater](https://arxiv.org/abs/2407.13717); [GPT-4 safety cases](https://arxiv.org/pdf/2312.05696); [GSN plus STPA](https://link.springer.com/chapter/10.1007/978-3-030-26250-1_1).
- Fit: **Speculative to Medium**. Risk: multi-hop argument chains. Keep each judgment to one link.

**U30. DO-178C and ISO 26262 review-checklist pre-screen** (certification)
- Practice today: DO-178C review objectives†; ISO 26262-8 clause 6 requirement attributes†; signed checklists with independence.
- Pain point: reviews are slow and costly. Reviewers spend time on trivial findings.
- How Jev fits: clause-by-clause. Each checklist line is a Noul over the artefact ("Does each low-level requirement name its parent?"). Output is a pre-filled checklist with probabilities. The human reviewer keeps authority.
- Why cheap and fast: every artefact revision gets a pre-screen before the formal review.
- Evidence: [AdaCore](https://www.adacore.com/blog/a-fresh-take-on-do-178c-software-reviews); [Rosadini, Ferrari et al. 2018](https://dl.acm.org/doi/10.1007/s10664-018-9596-7) for a rail analogue.
- Fit: **Medium**. Risk: certification credit needs tool qualification (DO-330†). Without it Jev is advisory only.

### Gaps

- No benchmark exists for UCA typing, GSN link checking, or ICD alignment. All three are my inference.
- No published evidence on classifiers for ISO 26262 ASIL-related text checks found this session.
- † items: 15288, SysML v2 spec, STPA Handbook, GSN standard, UL 4600, DO-178C and DO-330, ISO 26262 clause numbers.

---

## 5. Hardware and EDA verification (regression log triage, failure bucketing, lint waivers, spec-to-RTL)

### Takeaway

Regression failure triage is an accepted pain in chip verification and already uses classical ML on log signatures. That part fits Jev well. Waveform-based triage and formal checks do not. I found no published work on lint-waiver review.

### Cited Findings

- A DVCon paper automates regression triage with Random Forest models that predict the owner of each test failure and assign failure signatures. — [Automating Regression Triage in Design Verification, DVCon](https://dvcon-proceedings.org/wp-content/uploads/1058.pdf)
- Failure triage was called "the neglected debugging problem". The flow: nightly regressions, a signature per error, failures grouped into bins, bins sent to engineers. — [DVCon paper](https://dvcon-proceedings.org/wp-content/uploads/failure-triage-the-neglected-debugging-problem.pdf); [Failure Triage in RTL Regression Verification, IEEE TCAD 2018](https://dl.acm.org/doi/abs/10.1109/TCAD.2017.2783303)
- VCDiag classifies failing waveforms (VCD files) to likely failing modules. Over 94% top-3 accuracy, with 120× data reduction through signal selection and statistical compression. — [Luu et al., 2025](https://arxiv.org/abs/2506.03590)
- AssertLLM generates SystemVerilog assertions from specification documents. 89% of generated assertions were correct in syntax and function, checked with Cadence JasperGold. — [AssertLLM, ASP-DAC 2025](https://arxiv.org/abs/2402.00386); benchmark: [AssertLLM2, 2026](https://arxiv.org/pdf/2605.27472)
- Survey chapter on ML in hardware functional verification. — [Springer 2022](https://link.springer.com/chapter/10.1007/978-3-031-13074-8_14)

### Inferences

#### Usage catalogue: hardware and EDA

**U31. Simulation and regression log triage: failure bucketing and owner prediction** (design verification)
- Practice today: UVM (IEEE 1800.2†) testbenches; nightly regressions; regex signatures; manual bin assignment.
- Pain point: thousands of failing tests per night. One root cause shows many signatures. Regex bins split or merge wrongly.
- How Jev fits: triage plus entity alignment. Code extracts the first error and UVM message context. Choice on failure class (`testbench / DUT functional / assertion / timeout / infrastructure / licence or tool`). Noul per pair "same root cause as bin B-17?" Choice on owning block.
- Why cheap and fast: 10,000 failures × 1,500 tokens is about $0.60 a night. Engineers see bins when they arrive.
- Evidence: [DVCon regression triage](https://dvcon-proceedings.org/wp-content/uploads/1058.pdf); [TCAD 2018](https://dl.acm.org/doi/abs/10.1109/TCAD.2017.2783303); software analogue [FlaXifyer](https://arxiv.org/abs/2601.22264).
- Fit: **Strong to Medium**. Risk: logs carry hex values and timestamps. Jev should see the message text, with code handling the numbers.

**U32. Lint and CDC waiver review** (RTL sign-off)
- Practice today: SpyGlass or similar lint and clock-domain-crossing checks; waiver files with free-text reasons; sign-off audits.
- Pain point: thousands of waivers. Reasons are copy-pasted. Auditors sample only a few.
- How Jev fits: clause-by-clause. `state` = violation text, rule description, waiver reason. Score: `reason does not address the rule / generic reason / specific and technically relevant`.
- Why cheap and fast: audit 100% of waivers on every release candidate.
- Evidence: **none found**. This is my inference from the static-alert literature ([Ge et al.](https://arxiv.org/abs/2312.00324)).
- Fit: **Speculative**. Risk: Jev can judge whether the reason is relevant, not whether it is true.

**U33. Spec-sentence to assertion consistency screen** (formal and simulation)
- Practice today: engineers hand-write SVA (IEEE 1800†) from the spec; LLM assertion generators; formal tools prove them.
- Pain point: 11% of LLM-generated assertions are wrong (AssertLLM). Each costs a formal run and debug time. Spec coverage by assertions is tracked by hand.
- How Jev fits: verifier and entity alignment. Noul "Does this assertion express this spec sentence?" before the formal run. Noul "Is any assertion linked to spec sentence S-41?" for coverage.
- Why cheap and fast: pre-filter thousands of candidates at near-zero cost. Formal tools see fewer bad properties.
- Evidence: [AssertLLM](https://arxiv.org/abs/2402.00386); [AssertLLM2](https://arxiv.org/pdf/2605.27472).
- Fit: **Speculative to Medium**. Risk: temporal operators (`##[1:3]`, `|=>`) carry numeric and ordering meaning. Jev's docs say high-level languages work better, and SVA timing is a weak spot.

### Gaps

- No published work found on NLP for lint or CDC waiver review.
- No evidence found on text-based bug localisation in RTL from log text alone. VCDiag uses waveforms, which are non-text.
- I did not open the DVCon PDFs. Details come from search summaries.
- † items: IEEE 1800, IEEE 1800.2.

---

## 6. Telecom and network operations (trouble tickets, alarms, intent-based networking)

### Takeaway

Ticket and alarm classification is a direct fit, with large volumes and few dominant classes. Intent-based networking needs a closed-set classifier at the front door, and a recent paper already says light conflict filtering should run inline while heavy reasoning runs asynchronously.

### Cited Findings

- Large mobile network incident centres count alarms in the hundreds of thousands per day. Over 90% of tickets come from fewer than 30 common alarm types. Search snippet from a patent or 3GPP draft; I did not open the source. — [3GPP draft TR on alarm management](https://www.3gpp.org/ftp/tsg_sa/wg5_tm/Draft_Specs/32.cde%20on%20Alarm%20Management/TR%2032.cde%20Study%20on%20alarm%20management.doc); [US patent 12231285](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/12231285)
- A TF-IDF plus SVM ticket classifier (network outage, service complaint, technical issue, billing) cut manual classification effort by 75%. Low-tier source. — [ResearchGate 2025](https://www.researchgate.net/publication/391423910_Leveraging_Natural_Language_Processing_NLP_for_Intelligent_Incident_Ticket_Classification)
- Real-time ML classification of syslog messages from mixed testbed clusters. It uses a taxonomy of actionable categories and filters "noise" messages. — [Heterogeneous Syslog Analysis: There Is Hope, SC Workshops 2023](https://dl.acm.org/doi/fullHtml/10.1145/3624062.3624128)
- IBN work: IBNBench offers four datasets for intent translation and conflict detection on ODL and ONOS controllers. Lumi uses rules plus a Random Forest for conflicting intents. A 2026 paper states that light validation and conflict filtering should run inline and heavy reasoning asynchronously. — [NetInspector, 2026](https://arxiv.org/html/2609.21103); [Intent drift detection, 2026](https://arxiv.org/pdf/2606.05076); [AI-driven IBN, 2026](https://arxiv.org/html/2603.23772)
- Intent detection with LLMs compared with embedding classifiers. — [Intent Detection in the Age of LLMs, 2024](https://arxiv.org/html/2410.01627v1)

### Inferences

#### Usage catalogue: telecom and network operations

**U34. Trouble-ticket classification and routing** (NOC)
- Practice today: TM Forum and ITIL ticket flows†; tier-1 agents pick category and queue.
- Pain point: volume. Wrong queue means SLA breach. Free text mixes customer words and engineer shorthand.
- How Jev fits: triage / router. Choice on fault domain (`RAN / transport / core / CPE / power / billing`). Score on urgency. Noul "customer reports total loss of service".
- Why cheap and fast: classify during the call or chat. Re-classify on every diary entry.
- Evidence: [ticket classifier, 2025](https://www.researchgate.net/publication/391423910_Leveraging_Natural_Language_Processing_NLP_for_Intelligent_Incident_Ticket_Classification) (weak source); cloud analogue [DeepTriage](https://arxiv.org/abs/2012.03665).
- Fit: **Strong**. Risk: vendor shorthand and non-English text.

**U35. Alarm and syslog classification with noise filtering** (NOC)
- Practice today: ITU-T X.733 alarm types and severities†; [RFC 5424](https://www.rfc-editor.org/rfc/rfc5424) syslog; vendor rule bases in fault managers.
- Pain point: rule bases need upkeep for every vendor and firmware release. Most alarms are noise.
- How Jev fits: semantic predicate in a rule engine. Per new message template: Choice `hardware / link / config change / security / environmental / noise`. Noul "needs a ticket". Correlation and counting stay in code.
- Why cheap and fast: a new vendor message is classed on first sight, with no rule authoring.
- Evidence: [Heterogeneous Syslog Analysis 2023](https://dl.acm.org/doi/fullHtml/10.1145/3624062.3624128); alarm volumes from the [3GPP draft](https://www.3gpp.org/ftp/tsg_sa/wg5_tm/Draft_Specs/32.cde%20on%20Alarm%20Management/TR%2032.cde%20Study%20on%20alarm%20management.doc) (snippet).
- Fit: **Strong to Medium**. Risk: terse codes such as `%LINK-3-UPDOWN` carry little natural language. Put a vendor glossary in `instructions`.

**U36. Intent classification and conflict pre-check in intent-based networking** (network automation)
- Practice today: [RFC 9315](https://www.rfc-editor.org/rfc/rfc9315) IBN concepts; LLM intent translators; formal config verification (Batfish-style†).
- Pain point: free-text intents must map to a closed set of policy types before translation. Conflicts must be caught inline.
- How Jev fits: triage and verifier. Choice on intent type (`QoS / ACL / routing / slicing / monitoring`). Noul per existing policy "Does the new intent contradict this policy?" Noul "Does the generated config summary match the intent?"
- Why cheap and fast: inline check in the intent API path. Matches the "light inline, heavy async" design.
- Evidence: [NetInspector 2026](https://arxiv.org/html/2609.21103); [intent drift 2026](https://arxiv.org/pdf/2606.05076); [intent detection 2024](https://arxiv.org/html/2410.01627v1).
- Fit: **Medium**. Risk: real conflicts depend on address ranges and rule order, which are numeric and multi-hop. Formal tools must stay the final check.

### Gaps

- I found no peer-reviewed benchmark for telecom trouble-ticket classification this session. Sources are patents and a low-tier paper.
- The alarm volume figures are from a search snippet. I did not open the document.
- IEEE TNSM and SIGCOMM/NSDI were not searched directly.
- † items: TM Forum, ITIL, ITU-T X.733, Batfish, Lumi (USENIX ATC 2021).

---

## 7. LLM and agent harness engineering (routing, tool-call verification, guardrails, trace classification, step checking)

### Takeaway

This is where published evidence most directly supports "a small classifier does it well". RouteLLM and FrugalGPT use small routers. Guardrail classifiers run in milliseconds. Learned verifiers lift SWE-bench Verified by 7 to 10 points. One paper states that verifier **calibration** matters for RL, which maps to Jev's main claim.

### Cited Findings

- RouteLLM trains routers on human preference data to pick a strong or weak model per query. Up to 3.66× cost cut (search snippet) while keeping 95% of GPT-4 quality on MT-Bench. Routers transfer to model pairs unseen in training. Router overhead is under 0.4% of GPT-4 generation cost (search snippet). — [Ong et al., ICLR 2025](https://arxiv.org/abs/2406.18665); [LMSYS blog](https://www.lmsys.org/blog/2024-07-01-routellm/)
- FrugalGPT's LLM cascade matches GPT-4 with up to 98% lower cost, or gains 4% accuracy at equal cost. — [Chen, Zaharia, Zou, 2023](https://arxiv.org/abs/2305.05176)
- SWE-Gym trains outcome verifiers that score the chance an agent trajectory solved the task. Re-ranking samples with the verifier scales test-time performance. — [Pan et al., 2024/2025](https://arxiv.org/pdf/2412.21139)
- SWE-RM is an execution-free reward model (30B mixture-of-experts, 3B active). It lifts Qwen3-Coder-Flash from 51.6% to 62.0% and Qwen3-Coder-Max from 67.0% to 74.6% on SWE-bench Verified. The authors found classification accuracy **and calibration** decide RL results: two verifiers with similar test-time scaling gave very different RL outcomes. — [Shum et al., 2025](https://arxiv.org/abs/2512.21919)
- SWE-TRACE uses a rubric-based process reward model that gives dense feedback on intermediate steps. — [arXiv 2604.14820](https://arxiv.org/html/2604.14820v1)
- MAST taxonomy of multi-agent failures: 14 failure modes in 3 categories, from 150 traces, human kappa 0.88. An LLM-as-judge (OpenAI o1) reaches 94% accuracy and 0.77 Cohen's kappa against experts. Dataset of 1,600+ annotated traces across 7 frameworks. — [Cemri et al., NeurIPS 2025](https://arxiv.org/abs/2503.13657)
- LlamaFirewall has three parts: PromptGuard 2 (a jailbreak detector), AlignmentCheck (audits agent reasoning for injection and goal drift), and CodeShield (static analysis). — [Chennabasappa et al., Meta, 2025](https://arxiv.org/abs/2505.03574)
- OpenAI's guardrails library runs prompt-injection checks at two points: before tool calls execute (does the call align with the user's goal?) and after tool output returns. — [OpenAI Guardrails docs](https://openai.github.io/openai-guardrails-python/ref/checks/prompt_injection_detection/)
- Latency figures: a BERT-size guard takes about 12 ms per sample on GPU. A local 8B judge takes p50 13.7 s on a laptop. 2026 targets: over 90% detection with under 5% false positives. — [Adversarial Prompt Evaluation, 2025](https://arxiv.org/pdf/2502.15427); [guardrail-layer repo](https://github.com/rishrav/guardrail-layer); [Future AGI guide 2026](https://futureagi.com/blog/top-5-ai-guardrailing-tools-2025/); [Artificial Analysis guardrail benchmark](https://artificialanalysis.ai/articles/guardrail-safety-benchmark)

### Inferences

#### Usage catalogue: LLM and agent harness

**U37. Model routing and cascade gating** (LLM ops)
- Practice today: RouteLLM, FrugalGPT, vendor "auto" modes.
- Pain point: routers need preference data and retraining when models change.
- How Jev fits: triage / router. Score on query difficulty with described levels. Noul "needs multi-step reasoning", "needs code execution". After a cheap model answers: Noul "answer fully addresses the question" to accept or escalate.
- Why cheap and fast: about 100 ms and $0.00004 is tiny next to any LLM call. Calibrated output lets a team set an exact cost-quality point.
- Evidence: [RouteLLM](https://arxiv.org/abs/2406.18665); [FrugalGPT](https://arxiv.org/abs/2305.05176).
- Fit: **Strong**. Risk: Jev cannot be trained on local preference data. Its zero-shot difficulty estimate is untested against trained routers.

**U38. Per-tool-call verification and guardrails** (agent safety)
- Practice today: LlamaFirewall, OpenAI Guardrails, policy engines with allow-lists.
- Pain point: LLM judges add seconds per step. Regex policies miss meaning.
- How Jev fits: semantic predicate in a rule engine. Before each call: Noul "Is this tool call within the user's stated goal?", Noul "Does it delete or exfiltrate data?" After each result: Noul "Does the tool output contain instructions aimed at the agent?"
- Why cheap and fast: a 100-step run × 2,000 tokens costs about $0.008 and adds about 100 ms per step. Checking every call becomes normal, not sampled.
- Evidence: [LlamaFirewall](https://arxiv.org/abs/2505.03574); [OpenAI Guardrails](https://openai.github.io/openai-guardrails-python/ref/checks/prompt_injection_detection/); [latency data](https://arxiv.org/pdf/2502.15427).
- Fit: **Strong to Medium**. Risk: adversarial. The brief says Jev can be steered by hostile text in `state`. Use it as one layer beside allow-lists and sandboxing, never alone.

**U39. Process-reward-style step checking for coding agents** (agent quality)
- Practice today: unit tests as outcome reward; learned verifiers (SWE-Gym, SWE-RM); rubric process reward models (SWE-TRACE).
- Pain point: tests are missing or slow. Large verifiers are costly per step.
- How Jev fits: verifier / process-reward model and heuristic inside a search loop. Per step, rubric Nouls: "Did the agent read the failing test before editing?", "Does the diff touch only files related to the issue?" Score on progress. Use for best-of-k selection and early stop of bad runs.
- Why cheap and fast: scoring every step of every sampled run becomes affordable. Calibrated scores matter for RL ([SWE-RM](https://arxiv.org/abs/2512.21919)).
- Evidence: [SWE-RM](https://arxiv.org/abs/2512.21919) +7.6 to +10.4 points; [SWE-Gym](https://arxiv.org/pdf/2412.21139); [SWE-TRACE](https://arxiv.org/html/2604.14820v1).
- Fit: **Medium**. Risk: published verifiers are trained on trajectories. A zero-shot rubric checker is unproven. Long trajectories exceed the 32k state, so check step by step.

**U40. Agent trace and failure-mode classification** (observability)
- Practice today: manual trace reading; LLM-as-judge with frontier models; MAST taxonomy.
- Pain point: millions of traces. A frontier judge per trace is too costly.
- How Jev fits: screening at scale. One Noul per MAST failure mode (14 in parallel) per trace segment. Output feeds dashboards and regression alarms.
- Why cheap and fast: 1 million traces × 8,000 tokens is about $320. Judge 100% of production traffic.
- Evidence: [MAST](https://arxiv.org/abs/2503.13657): o1 judge reaches 94% accuracy, kappa 0.77.
- Fit: **Strong**. Risk: long traces with irrelevant detail. Segment first.

### Gaps

- No paper found that tests a general zero-shot calibrated classifier as a router or step verifier. All evidence is for trained models.
- I did not get PromptGuard 2's size or AgentDojo results from the abstract.
- FrugalGPT's scorer is a small DistilBERT-class model†. Not confirmed this session.

---

## 8. Cross-cutting: where 10-100 ms and near-zero cost unlock something new, Top 5, poor fits, new roles

### Takeaway

Low cost removes sampling: teams can check 100% of requirements, waivers, alerts, traces, and tool calls. Low latency moves checks to the moment of authoring or action. The best uses have closed, standard answer sets and a human or formal tool behind them.

### Cited Findings

- Existing systems ration model calls because of cost. COLA sends only uncertain alert pairs to an LLM. — [COLA](https://arxiv.org/abs/2403.06485)
- RCACopilot takes about 4.2 s per incident (search snippet). A local 8B guard judge takes p50 13.7 s. A BERT-size guard takes about 12 ms. — [RCACopilot](https://arxiv.org/abs/2305.15778); [guardrail-layer](https://github.com/rishrav/guardrail-layer); [Adversarial Prompt Evaluation](https://arxiv.org/pdf/2502.15427)
- IBN research states that light validation should run inline and heavy reasoning asynchronously. — [NetInspector 2026](https://arxiv.org/html/2609.21103)
- Meta gates landing of diffs on a calibrated risk percentile. — [RADAR](https://arxiv.org/abs/2605.30208)
- Pre-filtering text before an expensive step pays off: LogSift cut log review effort by 74.4%, and requirement-part classification removes irrelevant parts before trace linking. — [FlaXifyer/LogSift](https://arxiv.org/abs/2601.22264); [RE 2024](https://ieeexplore.ieee.org/document/10628507/)
- Function-level vulnerability detection fails under realistic evaluation (3.09% F1). — [PrimeVul](https://arxiv.org/abs/2403.18624)
- Static-alert classifiers looked near perfect only because of data leakage. — [Kang, Aw, Lo 2022](https://arxiv.org/abs/2202.05982)
- LLMs over-predict vulnerability risk on SSVC decisions. — [Al Haddad et al. 2025](https://arxiv.org/abs/2510.18508)

### Inferences

#### What speed and cost unlock

| Moment | Latency need | Usages | What is new |
|---|---|---|---|
| Per keystroke or on save in an editor | under 100 ms, better under 10 ms | U1, U2, U4, U12, U13, U20 | The author gets the review before the artefact exists. |
| Per commit or pre-commit hook | under 1 s total | U13, U14, U19, U20, U21 | 20 semantic checks per commit for about $0.002. |
| Per new log template or alarm type | under 1 s | U22, U35 | No rule authoring for new vendor messages. |
| Per incident update | under 1 s | U23, U24, U25 | Re-route and re-correlate on every update, not once. |
| Per tool call in an agent | under 100 ms | U38, U39 | 100% of calls checked, not sampled. |
| Whole-corpus re-run | cost only | U3, U6, U9, U18, U26, U32, U40 | Change the taxonomy, re-label everything for dollars. |
| All-pairs comparison | cost only | U7, U11, U24, U27 | No need to ration pairs. Blocking still helps the request limit. |

Limits from the brief that shape designs:
- 250,000 tokens per second is about 21.6 billion tokens a day, or about $864 a day at most. Raw per-line classification of a billion log lines a day does not fit. Per-template does.
- 1,200 requests a minute means pairwise and rule-grid jobs must pack many questions into each request.

#### Top 5 by likely value

1. **Incident routing plus alert correlation (U23, U24).** Production systems already prove value (DeepTriage since 2017, COLA). Outage minutes are expensive. Jev removes the LLM rationing.
2. **Requirement quality and classification at authoring time (U1, U2, U3).** Rule sets are published and closed. Reviewers are scarce in regulated industries. Rule tools sit at 59% precision.
3. **Agent harness checks (U37, U38, U40).** Volume grows fastest here. Evidence for small classifiers is direct. Calibration is named as the deciding property for RL verifiers.
4. **CI signal triage (U15, U19, U14).** Flaky and job-failure categories reach 84% macro F1 with 12 examples. Secret false-positive filtering is proven. Runs on every commit.
5. **CVE intake: CWE and CVSS vector elements (U18).** The answer sets are exactly Choice primitives. V2W-BERT reaches 94 to 97%. Code computes the score, so Jev's numeric weakness does not matter.

Runner-up: EDA regression log triage (U31). High value per engineer-hour, but a smaller market.

#### Poor fits

- **Function-level vulnerability detection in code.** Needs multi-hop data-flow reasoning. PrimeVul shows 3.09% F1 for a 7B model and near-random GPT-4.
- **Static-alert triage that depends on inter-procedural context.** Past high scores came from leakage. Jev reads literally and cannot trace flows.
- **Waveform or VCD-based failure triage.** Not text. VCDiag needs numeric compression first.
- **Network configuration verification** (reachability, ACL shadowing). Depends on address ranges and rule order. Formal tools own this.
- **Proving assertions or spec-RTL equivalence.** Formal tools own proof. Jev can only pre-screen wording.
- **ICD units, ranges, rates, bit widths.** Numeric comparison. Code must do it.
- **SLA breach, log timestamp ordering, time-to-mitigate.** Date and time comparison is a named weak spot.
- **Coverage percentages, complexity counts, "at most N" rules.** Counting is a named weak spot.
- **Root cause from a raw 100,000-line log.** Large noisy state lowers accuracy. Trim in code first.
- **Requirements with double negatives or nested exceptions.** Flag them for a person. Do not trust the reading.
- **Sole defence against prompt injection or hostile commits.** Jev can be steered by text in `state`. Use as one layer only.
- **Credited certification reviewer under DO-178C or ISO 26262.** Independence and tool qualification rules apply. Jev stays advisory.
- **Code, SVA, SysML, or config generation and repair.** Out of scope by design. Jev only verifies or routes.
- **SSVC-style decisions that need deployment context.** LLMs over-predict risk. Context must be supplied as facts or the task stays with analysts.

#### New roles the catalogue is missing

- **Authoring-time gate.** A verifier that runs while a person writes (requirement, bug report, commit message, intent). The output is a nudge, not a verdict. Only possible under 100 ms. Usages U1, U2, U12, U13.
- **Cascade gate (accept or escalate).** Jev judges whether a cheap model's answer, or its own confidence, is good enough, and escalates the rest. It differs from routing because it acts after the first answer. Basis: FrugalGPT. Usages U37, U25.
- **Context pruner.** Jev selects which log lines, requirement parts, files, or alerts are relevant before a costly LLM or a person sees them. Basis: LogSift (74.4% less review effort), requirement-part filtering for trace links. Usages U6, U15, U22.
- **Label factory (variant of feature extractor).** Jev labels a large sample. A tiny in-house model trained on those labels then runs at volumes beyond Jev's rate limit, such as per log line at billions a day. Usage U22.
- **Waiver and justification auditor.** Jev checks that a free-text justification addresses the rule it waives (lint waivers, static-alert suppressions, risk acceptances). It is a special case of clause-by-clause check, but the object is the excuse, not the artefact. Usages U32, U14.

### Gaps

- None of these roles has been tested with Jev. All fit ratings are my judgment from published results with other models.
- Jev's billing for many questions over one state is unknown to me. Cost sums assume about 1,000 tokens per judgment and may be high.
- Sources not searched directly: DAC, IEEE TNSM, SIGCOMM/NSDI, ISSTA. EDA and telecom evidence is thinner than software evidence for that reason.
- Every † citation in this file needs a check before it goes into the final report.
