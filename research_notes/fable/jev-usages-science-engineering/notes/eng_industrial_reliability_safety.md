# Jev usages in ENGINEERING, subtopic A: industrial automation, control, reliability, maintenance, safety

Scope notes for the report writer:

- 40 usages, grouped under the six key questions. IDs: A = alarms, M = maintenance/reliability, S = safety reporting, F = fault diagnosis/supervisory control, P = power/grid/ICS, FS = functional safety.
- Each usage uses the brief's 7 fields: name + subfield, practice today, pain, Jev fit, why cheap/fast matters, evidence, rating + main risk.
- Chemical-plant topics (HAZOP, LOPA, PSM, GHS) are left out on purpose.
- "Verified" = I opened the page or PDF. "Snippet" = seen only in a search-result summary; treat numbers as unconfirmed.
- Cost maths uses the brief's price: $0.04 per million input tokens.
- The final section holds Top 5, Poor fits, and New roles.

---

## KQ1. Alarm management (ISA-18.2, IEC 62682, EEMUA 191): where does semantic judgment sit?

### Takeaway
Rationalization is a per-alarm semantic check against the alarm philosophy (is a response needed, what cause, what consequence, what action). It is done by scarce expert teams, alarm by alarm. That is a clean Noul/Choice/Score job. Flood analysis and setpoint work are numeric or sequence problems and must stay in code. I found no published LLM work on rationalization itself, so this is high value but unproven.

### Cited Findings
- ISA-18.2 defines an alarm as "an audible and/or visible means of indicating to the operator an equipment malfunction, process deviation, or abnormal condition requiring a response." (verified in PDF text) — [ISA / PAS, Understanding and Applying ANSI/ISA-18.2](https://www.isa.org/getmedia/55b4210e-6cb2-4de4-89f8-2b5b6b46d954/PAS-Understanding-ISA-18-2.pdf)
- ISA-18.2 lifecycle stages include Philosophy, Identification, Rationalization, Detailed Design, Implementation, Operation, Monitoring. Rationalization is "the process of ensuring an alarm meets the requirements set forth in the alarm philosophy, including the tasks of prioritization, classification, settings determination, and documentation." Mandatory documentation covers operator action, consequences, priority, class. (verified) — [same ISA/PAS paper](https://www.isa.org/getmedia/55b4210e-6cb2-4de4-89f8-2b5b6b46d954/PAS-Understanding-ISA-18-2.pdf)
- In justification, each existing or potential alarm is "systematically compared to the criteria for alarms set forth in the alarm philosophy"; if it passes, type, setpoint, cause, consequence, and operator action are documented, then it is prioritized and classified. — [Emerson white paper, Alarm Rationalization, 2019](https://www.emerson.com/documents/automation/white-paper-alarm-rationalization-deltav-en-56654.pdf)
- ISA-TR18.2.2-2016 is the dedicated technical report on alarm identification and rationalization. — [ISA](https://www.isa.org/products/isa-tr18-2-2-2016-alarm-identification-and-rationa)
- ISA-18.2 flood threshold: alarm rate above 10 alarms per 10 minutes per operator; the system "should be in flood for less than ~1% of the time." Targets: about 1 alarm per 10 minutes average, 2 manageable; priority split about 80/15/5 low/medium/high (snippet). — [TiPS Inc., Taming Alarm Floods](https://tipsweb.com/taming-alarm-floods/)
- ISA-18.2 monitoring metrics include average and peak alarm rates, floods, frequently occurring alarms, chattering and fleeting alarms, stale alarms, priority distribution, unauthorized suppression. (verified) — [ISA/PAS paper](https://www.isa.org/getmedia/55b4210e-6cb2-4de4-89f8-2b5b6b46d954/PAS-Understanding-ISA-18-2.pdf)
- Alarm-flood research is dominated by sequence methods: similarity analysis and pattern matching of alarm sequences, with real-time ranking of similar historical floods as operator decision support. — [Similarity Analysis of Industrial Alarm Flood Data, IEEE, 2013](https://ieeexplore.ieee.org/document/6419854/); [Review of alarm flood analysis methods, 2024](https://www.researchgate.net/publication/387342238_A_review_of_alarm_flood_analysis_methods_in_industrial_processes_pattern_recognition_and_similarity_analysis)
- Recent flood classifiers: convolutional-kernel ensemble on alarm time series; deterministic fingerprinting with combinatorial hashing for online use. — [Data-Centric Engineering (Cambridge)](https://www.cambridge.org/core/product/4CCF870F136462D432578EF309B6EC97/core-reader); [Chem. Eng. Research and Design, 2025](https://www.sciencedirect.com/science/article/abs/pii/S0263876225006252)
- Alarm root-cause analysis has its own review; deep learning on alarm data is used to point operators to the root-cause alarm. — [Review of alarm RCA, 2022](https://www.sciencedirect.com/science/article/abs/pii/S0263876222006062); [Alarm-Based RCA Using Deep Learning, arXiv 2203.11321](https://arxiv.org/abs/2203.11321)
- Plant connectivity plus alarm logs can cut redundant alerts: a single disturbance causes many consequent alarms that overload the operator. — [J. Process Control, 2013](https://www.sciencedirect.com/science/article/abs/pii/S0959152413000541)

### Usages

#### A1. Alarm rationalization pre-screen and master-alarm-database QA — *alarm management*
- **Practice today:** ISA-18.2 / IEC 62682 rationalization. A team reviews every configured alarm against the alarm philosophy and fills the master alarm database (cause, consequence, operator action, priority, class).
- **Pain:** Scarce experts. Alarm-by-alarm workshops take weeks. Legacy databases hold empty or copy-pasted fields.
- **Jev fit:** Clause-by-clause compliance check + verifier. `state` = one alarm record (tag, description, setpoint bucket, documented cause, consequence, action) + philosophy excerpt. Noul: "The documented operator action is a concrete action, not 'monitor' or 'inform supervisor'." Noul: "This condition requires an operator response." Choice: {keep as alarm, change to alert/event, remove, needs team review}.
- **Why cheap/fast:** A full database sweep (say 20,000 alarms × 10 questions × 800 tokens = 160 Mtok) costs about $6. It can rerun on every management-of-change edit.
- **Evidence:** No published LLM or NLP study on rationalization found (gap). Practice basis is solid: [ISA/PAS](https://www.isa.org/getmedia/55b4210e-6cb2-4de4-89f8-2b5b6b46d954/PAS-Understanding-ISA-18-2.pdf), [Emerson](https://www.emerson.com/documents/automation/white-paper-alarm-rationalization-deltav-en-56654.pdf).
- **Rating:** Medium. Risk: unproven; safety-related alarms (highly managed class) must stay with the team; Jev only sorts and flags.

#### A2. Priority and class suggestion from documented consequence — *alarm management*
- **Practice today:** Priority comes from a severity × time-to-respond matrix in the philosophy (ISA-18.2, EEMUA 191).
- **Pain:** Severity grading of free-text consequences is inconsistent between teams and sites.
- **Jev fit:** Score. `state` = consequence text + the site's severity level descriptions. Score over {none, minor, major, severe} per impact category (safety, environment, cost). Code reads time-to-respond (numeric) and does the matrix lookup.
- **Why cheap/fast:** Calibrated level probabilities show which alarms sit on a boundary; only those go to the workshop.
- **Evidence:** None specific to alarms. Analogue: severity/accident-code classification with uncertainty in [conformal-prediction DSS, 2025](https://www.sciencedirect.com/science/article/abs/pii/S0957582025014016).
- **Rating:** Medium. Risk: consequence text is often too thin to grade; priority distribution targets (80/15/5) are arithmetic, keep in code.

#### A3. Nuisance / bad-actor alarm review triage — *alarm management*
- **Practice today:** Monitoring stage of ISA-18.2: weekly "top 10 most frequent", chattering, stale alarm lists; an engineer picks a fix (deadband, delay, re-engineer, remove).
- **Pain:** Lists are numeric, but the choice of fix needs the alarm's purpose, operator comments, shelving reasons, and maintenance history, which are text.
- **Jev fit:** Triage. Code computes counts and chatter flags as named buckets. `state` = buckets + alarm record + operator shelving comments + open work orders. Choice: {instrument fault → raise work order, tuning issue → deadband/delay review, process change → re-rationalize, valid alarm → no change}.
- **Why cheap/fast:** Every bad actor gets a first-pass disposition each week, not just the top 10.
- **Evidence:** Practice described in [ISA/PAS](https://www.isa.org/getmedia/55b4210e-6cb2-4de4-89f8-2b5b6b46d954/PAS-Understanding-ISA-18-2.pdf). No NLP study found.
- **Rating:** Medium. Risk: numeric (rates, durations) must be bucketed upstream.

#### A4. Alarm-flood triage against known scenario families — *alarm management / operator support*
- **Practice today:** Sequence similarity and classifiers match an ongoing flood to historical floods ([IEEE 2013](https://ieeexplore.ieee.org/document/6419854/), [2024 review](https://www.researchgate.net/publication/387342238_A_review_of_alarm_flood_analysis_methods_in_industrial_processes_pattern_recognition_and_similarity_analysis)).
- **Pain:** Pure sequence methods ignore what alarms mean. They break when tags are renamed or when a new unit has no history.
- **Jev fit:** Select, do not generate. Code finds top-k similar historical floods and summarises the live flood as text ("first-out: low suction pressure P-101; then 14 alarms on compressor K-1 lube system"). Choice over the k candidate scenario labels + "none of these".
- **Why cheap/fast:** A flood is >10 alarms in 10 minutes; a 100 ms re-rank every few seconds is easily inside the operator's time scale.
- **Evidence:** Flood classification works with numeric ML ([Cambridge DCE](https://www.cambridge.org/core/product/4CCF870F136462D432578EF309B6EC97/core-reader), [ChERD 2025](https://www.sciencedirect.com/science/article/abs/pii/S0263876225006252)). No evidence for a text re-ranker on top.
- **Rating:** Speculative. Risk: time order matters and Jev is weak at it; code must encode order explicitly. Advisory only.

#### A5. Redundant and consequential alarm grouping by meaning — *alarm management*
- **Practice today:** Connectivity analysis and correlation find alarms that always fire together ([J. Process Control 2013](https://www.sciencedirect.com/science/article/abs/pii/S0959152413000541)).
- **Pain:** Statistical pairs need an engineer to say whether the two alarms describe the same event (duplicate), cause and effect, or coincidence.
- **Jev fit:** Entity / record alignment. `state` = two alarm records + equipment context. Choice: {same condition duplicated, A is consequence of B, B is consequence of A, unrelated}.
- **Why cheap/fast:** Pairwise checks grow as n²; only a near-free call makes a full pairwise sweep of correlated pairs practical.
- **Evidence:** None direct. Basis: redundancy reduction literature above.
- **Rating:** Speculative. Risk: needs process topology knowledge that may not be in the text.

#### A6. Offline proposal of state-based alarming rules — *advanced alarming*
- **Practice today:** ISA-18.2 "advanced alarming": suppress or change alarms by plant state (startup, shutdown, equipment out of service). Rules are hand-written.
- **Pain:** Rule sets are incomplete; engineers must decide per alarm whether it is meaningful in each operating mode.
- **Jev fit:** Semantic predicate, used offline. For each (alarm, mode) pair, Noul: "This alarm still requires operator action when unit is in mode X." High-confidence "no" answers become candidate suppression rules for human approval. The deterministic rule, not Jev, runs in the DCS.
- **Why cheap/fast:** alarms × modes is a big grid (10,000 × 8 = 80,000 judgments ≈ $3).
- **Evidence:** None found.
- **Rating:** Speculative. Risk: safety-critical if a wrong suppression is approved; never suppress live on Jev's output.

### Inferences
- The closest proven analogue to rationalization is clause-by-clause document checking; the alarm record is short, structured text, which suits Jev's "small, relevant state" sweet spot.
- Alarm databases hold thousands to tens of thousands of records per plant (general industry knowledge, not cited here), so sweep cost is a few dollars.
- Anything about rates, timers, deadbands, setpoints is numeric and belongs to code.

### Gaps
- No peer-reviewed or vendor evidence found for LLM/NLP in alarm rationalization or master alarm database QA. Searches returned only traditional process descriptions and vendor marketing.
- I could not open the Cambridge DCE flood-classification paper (HTTP 403), so no accuracy numbers.
- IEC 62682 and EEMUA 191 texts are paywalled; claims about them rely on ISA-18.2 summaries.

---

## KQ2. Maintenance and reliability: work orders, ISO 14224 coding, FMEA/FTA/RCM, root-cause taxonomies

### Takeaway
This is the best-evidenced area. NIST's Technical Language Processing programme, the Hodkiewicz group, SINTEF, and wind-energy groups all show that classifiers can code maintenance text, and that label quality and expert disagreement are the real limits. Zero-shot general LLMs were weak in 2023 (F1 0.46), so Jev must prove itself against the public failure-mode dataset before claims are made.

### Cited Findings
- NIST defines Technical Language Processing (TLP) as a domain-driven approach to NLP for engineering text; off-the-shelf NLP pipelines "suffer from a lack of verification, validation, and ultimately, personnel trust." — [Brundage, Sexton et al., Technical Language Processing: Unlocking Maintenance Knowledge, NIST / Manufacturing Letters, 2021](https://www.nist.gov/publications/technical-language-processing-unlocking-maintenance-knowledge)
- NIST lists standards needs for work-order data: collection and storage, cleaning and parsing, analysis. — [Sexton & Brundage, Standards Needs for Maintenance Work Order Analysis in Manufacturing](https://www.nist.gov/publications/standards-needs-maintenance-work-order-analysis-manufacturing)
- NIST Nestor is a public-domain tool for "tagging" work orders (structured extraction with minimal annotation time). — [NIST Nestor](https://www.nist.gov/services-resources/software/nestor)
- Failure-mode classification with ISO 14224 codes: fine-tuned GPT-3.5 F1 = 0.80, baseline text classifier F1 = 0.60, out-of-the-box GPT-3.5 F1 = 0.46 (verified from abstract). Data: 502 train / 62 validation / 62 test observation–label pairs, 22 ISO 14224 failure-mode codes (snippet from ar5iv). — [Stewart, Hodkiewicz, Li, Large Language Models for Failure Mode Classification: An Investigation, 2023](https://arxiv.org/abs/2309.08181)
- A 2026 SPE paper describes a RAG system that classifies work orders to ISO 14224 with a vector store of 64 standardized failure modes (snippet). — [AI-Powered ISO 14224 Chatbot, SPE / OnePetro, 2026](https://onepetro.org/SPEOGWA/proceedings-abstract/26OPES/26OPES/D021S024R001/799105)
- SINTEF built ISO 14224-based taxonomies to classify failure notifications for safety-critical equipment (e.g. shutdown valves) as dangerous or safe, tested expert annotation agreement, and found several annotation pitfalls (verified in PDF). — [Ottermo, Håbrekke, Hauge, Bodsberg, TLP for Efficient Classification of Failure Events for Safety Critical Equipment, PHM Society European Conf., 2021](https://papers.phmsociety.org/index.php/phme/article/download/2792/1803)
- Wind-turbine work orders: text classification reached macro F1 0.75 and weighted F1 0.85; AI-assisted tagging cut tagging time by 88% versus expert labeling (snippet). — [KPI Extraction from Maintenance Work Orders, Energies 16(24):7937, 2023](https://doi.org/10.3390/en16247937); [arXiv 2311.04064](https://arxiv.org/pdf/2311.04064); [NIST listing](https://www.nist.gov/publications/kpi-extraction-maintenance-work-orders-comparison-expert-labeling-text-classification)
- Classifier-standardised maintenance data changes computed reliability figures. — [Walgern et al., IET Renewable Power Generation, 2024](https://ietresearch.onlinelibrary.wiley.com/doi/10.1049/rpg2.13151)
- LLM benchmark on wind maintenance logs: "calibration varies dramatically" across models; models agree more on objective component identification than on interpretive maintenance actions; authors recommend human-in-the-loop (verified from abstract). — [Malyi, Shek, McDonald, Biscaya, A Comparative Benchmark of LLMs for Labelling Wind Turbine Maintenance Logs, 2025](https://arxiv.org/abs/2509.06813)
- A 2026 follow-up uses LLMs to correct wrong legacy labels and extract taxonomies from historical logs (snippet). — [Wind Turbine Maintenance Log Labelling Framework, arXiv 2605.31281](https://arxiv.org/html/2605.31281)
- Data quality limits work-order analysis (historical HVAC case). — [NIST, Impact of Data Quality on MWO Analysis](https://www.nist.gov/publications/impact-data-quality-maintenance-work-order-analysis-case-study-historical-hvac)
- FMEA + LLM papers exist and mostly generate tables with RAG: Design Science 2025 (GPT-4, GPT-4o, Gemini compared); Springer 2026 RAG framework; 2024 open-source LLM + RAG. One claims "up to 99% accuracy" extracting failure information (snippet, unverified). — [AI-driven FMEA: integration of LLMs for faster and more accurate risk analysis, Design Science, 2025 (authors not verified)](https://www.cambridge.org/core/journals/design-science/article/aidriven-fmea-integration-of-large-language-models-for-faster-and-more-accurate-risk-analysis/22F110A2BF0DB4D01A69472CF17A0B43); [Int. J. System Assurance Eng. Mgmt, 2026](https://link.springer.com/article/10.1007/s13198-026-03171-6); [Enhance FMEA with LLMs, 2024](https://www.researchgate.net/publication/384978860_Enhance_FMEA_with_Large_Language_Models_for_Assisted_Risk_Management_in_Technical_Processes_and_Products); [Integrating LLMs for improved FMEA](https://www.researchgate.net/publication/380643557_Integrating_large_language_models_for_improved_failure_mode_and_effects_analysis_FMEA_a_framework_and_case_study)
- FTA + LLM: human-led FTA with LLM suggesting sub-causes (SAFECOMP 2025 workshop); troubleshooting trees from FMEA (IEEE 2025); fine-tuned NuLLM-FTG for nuclear fault trees (ICONE31); JFTA-Bench tests LLMs on tracking malfunctions with fault trees (2026). — [Springer SAFECOMP 2025](https://link.springer.com/chapter/10.1007/978-3-032-02018-5_38); [IEEE 11062049](https://ieeexplore.ieee.org/document/11062049/); [ASME ICONE31](https://asmedigitalcollection.asme.org/ICONE/proceedings-abstract/ICONE31/88308/1208397); [arXiv 2603.22978](https://arxiv.org/pdf/2603.22978)
- SAE JA1011 sets the minimum criteria for an RCM process: seven questions plus decision logic; failures fall into four consequence categories (hidden, safety/environmental, operational, non-operational) (snippet). — [SAE JA1011](https://www.sae.org/standards/ja1011_199908-evaluation-criteria-reliability-centered-maintenance-rcm-processes); [Tractian glossary](https://tractian.com/en/glossary/sae-ja1011)
- Vehicle service and complaint text: NLP + deep learning classifies free-text service reports to departments; cause-effect extraction on NHTSA ODI complaints reached F1 84.1% (snippet). — [arXiv 2111.14977](https://arxiv.org/pdf/2111.14977); [arXiv 2208.00249](https://arxiv.org/pdf/2208.00249); [Text mining NHTSA complaints, 2014](https://pubmed.ncbi.nlm.nih.gov/25277026/)
- Aviation maintenance text: CAMB benchmark includes a 10-class ATA chapter (21–30) localisation task; an ICAS 2024 paper clusters defect reports beyond ATA-chapter trend analysis; one study reports TF-IDF + logistic regression F1-macro 0.762 beating neural models on short technical texts (snippet; attribution to the third link not verified). — [CAMB, arXiv 2508.20420](https://arxiv.org/pdf/2508.20420); [ICAS 2024](https://www.icas.org/icas_archive/icas2024/data/papers/icas2024_0083_paper.pdf); [Savostin et al., 2025](http://nvngu.in.ua/jdownloads/pdf/2025/6/06_2025._Savostin.pdf)
- Building automation: Brick has 936 point classes; Brick-DICL (retrieval of 15 examples, narrowing to 20 candidate classes, then top-3) reaches roughly 85–90% Hits@1 versus roughly 50–55% for fine-tuned RoBERTa (values read from figures; approximate). — [Qian et al., Brick-DICL, arXiv 2606.17637, 2026](https://arxiv.org/abs/2606.17637)
- Industry 4.0: ECLASS is the recommended semantic dictionary for Asset Administration Shells; fine-tuned LLMs are used as generative and encoding-based classifiers for entity matching between AAS properties and ECLASS entries; LLM agents reach up to 78% pass rate generating AAS elements. — [ECLASS](https://eclass.eu/en/application/asset-administration-shell); [Dual data mapping with fine-tuned LLMs and AAS, RCIM, 2024](https://www.sciencedirect.com/science/article/pii/S0736584524001248); [arXiv 2403.17209](https://arxiv.org/pdf/2403.17209); [LLM as decision core for AAS capability check, IJAMT, 2026](https://link.springer.com/article/10.1007/s00170-026-18632-2)

### Usages

#### M1. ISO 14224 failure-mode coding of work orders — *reliability data*
- **Practice today:** ISO 14224 controlled vocabularies per equipment class; technicians pick a code or leave free text; reliability engineers recode for RAM studies (OREDA-style).
- **Pain:** Volume (millions of legacy records), inconsistent codes, scarce reliability engineers.
- **Jev fit:** Triage + screening at scale. `state` = work-order short text + long text + equipment class. Choice over that class's failure-mode list (e.g. {ELP external leakage process medium, FTS fail to start, BRD breakdown, ... , unknown}). Low confidence → human queue.
- **Why cheap/fast:** 1M work orders × ~500 tokens ≈ $20. Recode the whole CMMS whenever the taxonomy changes. Code at entry time in 100 ms so the technician confirms while still on the job.
- **Evidence:** [Stewart et al. 2023](https://arxiv.org/abs/2309.08181): fine-tuned 0.80 vs zero-shot 0.46 F1 — a warning for no-fine-tune models. [SPE 2026](https://onepetro.org/SPEOGWA/proceedings-abstract/26OPES/26OPES/D021S024R001/799105) (RAG, 64 modes).
- **Rating:** Strong on fit, with a caveat: Jev cannot be fine-tuned, so code definitions and examples must carry the domain knowledge. Risk: jargon and abbreviations ("repl brg DE"), English-only strength.

#### M2. Work-order tagging: item, problem, action — *technical language processing*
- **Practice today:** NIST Nestor tagging; Sexton, Hodkiewicz, Brundage, Smoker (2018) mapping informal text to computable tags (cited inside the [PHME 2021 paper](https://papers.phmsociety.org/index.php/phme/article/download/2792/1803)).
- **Pain:** Tagging still needs a person per vocabulary term; vocabulary drifts by site.
- **Jev fit:** Select, do not generate. Code tokenises and proposes candidate spans or dictionary terms. Choice per token or phrase: {item, problem, solution/action, ambiguous, irrelevant}.
- **Why cheap/fast:** Token-level judgments are many and tiny; only viable when each costs micro-dollars.
- **Evidence:** [NIST Nestor](https://www.nist.gov/services-resources/software/nestor); [Energies 2023](https://doi.org/10.3390/en16247937) 88% tagging-time reduction with AI-assisted tagging.
- **Rating:** Medium. Risk: very short, abbreviated text gives little context.

#### M3. Failure vs non-failure event flag for KPI calculation — *reliability KPIs*
- **Practice today:** MTBF, failure rate, availability need each work order classed as failure, preventive, inspection, modification, or non-maintenance.
- **Pain:** Work-order type fields are unreliable; miscounts distort KPIs ([Walgern 2024](https://ietresearch.onlinelibrary.wiley.com/doi/10.1049/rpg2.13151)).
- **Jev fit:** Feature extractor. Noul: "This record describes a functional failure of the asset." Choice: {corrective, preventive, condition-based, modification, administrative}. Code then computes KPIs, optionally weighting by probability.
- **Why cheap/fast:** Calibrated probabilities allow expected-count KPIs with error bars instead of hard labels.
- **Evidence:** [Energies 2023](https://doi.org/10.3390/en16247937) macro F1 0.75 / weighted 0.85; [Walgern 2024](https://ietresearch.onlinelibrary.wiley.com/doi/10.1049/rpg2.13151).
- **Rating:** Strong. Risk: date logic (downtime duration) stays in code.

#### M4. Dangerous vs safe failure classification for safety-critical equipment — *SIS operational follow-up*
- **Practice today:** IEC 61511 / IEC 61508 operation-phase follow-up: each failure notification on SIS equipment is classed (dangerous undetected, dangerous detected, safe, non-critical) to update failure rates (SINTEF PDS method).
- **Pain:** Done by a few specialists once a year; experts disagree ([PHME 2021](https://papers.phmsociety.org/index.php/phme/article/download/2792/1803)).
- **Jev fit:** Triage + second coder. `state` = notification text + equipment group + detection method. Choice: {DU, DD, safe, non-critical, cannot tell}.
- **Why cheap/fast:** Classify at notification time, not a year later; low-confidence items go to the specialist.
- **Evidence:** [Ottermo et al. 2021](https://papers.phmsociety.org/index.php/phme/article/download/2792/1803) built the taxonomy and annotation study; automated accuracy not reported there.
- **Rating:** Medium. Risk: safety-critical data; keep a human sign-off. This is analysis of records, not part of the safety function.

#### M5. Legacy label audit and CMMS hygiene — *data quality*
- **Practice today:** Periodic manual data-quality reviews; duplicate notifications and wrong asset tags are common ([NIST HVAC case](https://www.nist.gov/publications/impact-data-quality-maintenance-work-order-analysis-case-study-historical-hvac)).
- **Pain:** Nobody re-reads millions of closed work orders.
- **Jev fit:** Verifier + entity alignment. Noul: "The recorded failure code is consistent with the text." Noul on candidate pairs from code: "These two notifications describe the same fault on the same asset."
- **Why cheap/fast:** Full-history audit for tens of dollars.
- **Evidence:** [arXiv 2605.31281](https://arxiv.org/html/2605.31281) (LLM corrects wrong legacy labels); BLS uses its neural coder "to identify suspicious codes for review" (snippet) — [UNECE/BLS](https://statswiki.unece.org/download/attachments/285216428/ML_WP1_CC_USA-BLS.pdf?version=2&modificationDate=1605171512748&api=v2).
- **Rating:** Strong. Risk: low; errors only create review work.

#### M6. FMEA worksheet consistency and rubric checks — *FMEA (IEC 60812, SAE J1739, AIAG-VDA)*
- **Practice today:** Teams fill function → failure mode → effect → cause → controls; rate severity, occurrence, detection from rubric tables.
- **Pain:** Common errors: cause written in the failure-mode column, effects at the wrong level, severity not matching the rubric. Reviews are manual.
- **Jev fit:** Verifier / clause check. Noul: "This entry describes a failure mode, not a cause or an effect." Score: severity on the 1–10 rubric text given the effect description; flag when it differs from the team's rating by more than a band (the comparison is code).
- **Why cheap/fast:** Runs on every row at edit time; an FMEA with 2,000 rows costs cents.
- **Evidence:** LLM-FMEA papers focus on generation ([Design Science 2025](https://www.cambridge.org/core/journals/design-science/article/aidriven-fmea-integration-of-large-language-models-for-faster-and-more-accurate-risk-analysis/22F110A2BF0DB4D01A69472CF17A0B43), [Springer 2026](https://link.springer.com/article/10.1007/s13198-026-03171-6)). No study of a pure checker found.
- **Rating:** Medium. Risk: RPN and action-priority arithmetic stay in code; Jev cannot write the FMEA.

#### M7. Linking field failures to FMEA rows — *closed-loop reliability*
- **Practice today:** FRACAS (failure reporting, analysis, corrective action) should feed occurrence ratings back to the FMEA; in practice the link is manual or absent.
- **Pain:** Field text and FMEA wording differ; no shared key.
- **Jev fit:** Entity alignment. Code retrieves candidate FMEA rows for the asset. Choice: {row 1 … row k, not covered by FMEA}. "Not covered" hits are new failure modes.
- **Why cheap/fast:** Every new work order or warranty claim is matched as it arrives.
- **Evidence:** [IEEE 2025 troubleshooting trees from FMEA](https://ieeexplore.ieee.org/document/11062049/) shows FMEA as machine-usable input. No direct study found.
- **Rating:** Medium. Risk: FMEA rows can be vague; many-to-many matches.

#### M8. RCM decision-logic predicates — *RCM (SAE JA1011 / JA1012)*
- **Practice today:** For each failure mode, the facilitator answers the decision diagram: is the failure hidden or evident, is the consequence safety, environmental, operational, or non-operational, is a task technically feasible.
- **Pain:** Facilitated workshops over thousands of failure modes; very expensive.
- **Jev fit:** Semantic predicate in a rule engine. The decision tree is code. Each node is a Noul or Choice over the failure-mode and effect text, e.g. Noul: "Under normal conditions the operating crew would notice this failure on its own."
- **Why cheap/fast:** Pre-answers the whole tree for every failure mode; the workshop reviews only low-confidence nodes.
- **Evidence:** Standard structure: [SAE JA1011](https://www.sae.org/standards/ja1011_199908-evaluation-criteria-reliability-centered-maintenance-rcm-processes). No LLM study found (gap).
- **Rating:** Speculative. Risk: multi-hop (each node depends on earlier answers and on unstated plant context); safety consequences need human sign-off.

#### M9. FTA and troubleshooting-tree support — *FTA (IEC 61025)*
- **Practice today:** Analysts build trees by hand; troubleshooting guides are derived from FMEA/FTA.
- **Pain:** Slow; error-prone for complex systems.
- **Jev fit:** Heuristic inside a search loop + entity alignment. A generator (LLM or library) proposes sub-causes; Noul: "This proposed event is a direct, necessary-or-sufficient cause of the parent event" prunes them. For incidents: Choice maps an observed symptom to an existing basic event.
- **Why cheap/fast:** Thousands of candidate nodes pruned for cents, so a big generator can over-propose.
- **Evidence:** [SAFECOMP 2025 workshop](https://link.springer.com/chapter/10.1007/978-3-032-02018-5_38), [NuLLM-FTG](https://asmedigitalcollection.asme.org/ICONE/proceedings-abstract/ICONE31/88308/1208397), [JFTA-Bench](https://arxiv.org/pdf/2603.22978).
- **Rating:** Speculative. Risk: gate logic and cut sets are formal/numeric; Jev sees one edge at a time.

#### M10. Root-cause taxonomy coding of RCA, 8D and non-conformance reports — *quality / RCA*
- **Practice today:** Cause codes from a fixed tree (e.g. equipment, procedure, training, management system) are assigned to each investigation; 8D reports and NCRs are filed as free text.
- **Pain:** Trend analysis needs consistent codes; coders drift.
- **Jev fit:** Multi-label fan-out: one Noul per cause category over the report summary; or hierarchical Choice down the tree.
- **Why cheap/fast:** Recode the full archive when the taxonomy changes.
- **Evidence:** Only vendor material found for 8D/NCR ([Siemens 8D page](https://www.siemens.com/en-us/technology/8d-report/)). Peer-reviewed evidence exists in adjacent domains (see KQ3, KQ5).
- **Rating:** Medium. Risk: long reports dilute accuracy; feed the summary and cause sections only.

#### M11. Warranty claim and complaint coding — *automotive / product reliability*
- **Practice today:** OEMs code technician comments to component and failure mode; NHTSA receives free-text owner complaints and early-warning data.
- **Pain:** Huge volume; early detection of emerging defects depends on coding speed.
- **Jev fit:** Triage + feature extractor. Choice: component group; Noul: "Describes a safety-relevant loss of function (braking, steering, fire)."
- **Why cheap/fast:** Code every claim on arrival; the calibrated safety flag feeds statistical early-warning models.
- **Evidence:** [arXiv 2111.14977](https://arxiv.org/pdf/2111.14977); [arXiv 2208.00249](https://arxiv.org/pdf/2208.00249) (F1 84.1%, snippet); [NHTSA text mining 2014](https://pubmed.ncbi.nlm.nih.gov/25277026/).
- **Rating:** Strong. Risk: multilingual dealer text.

#### M12. Aviation logbook / squawk coding to ATA chapters — *aviation maintenance*
- **Practice today:** ATA 100 / iSpec 2200 chapters structure reliability trend reports; squawks are often free text without ATA tags.
- **Pain:** Manual classification of historical squawks is expensive and inconsistent.
- **Jev fit:** Hierarchical Choice (chapter, then section).
- **Why cheap/fast:** Fleet-wide back-coding for small operators with no data-science team.
- **Evidence:** [CAMB benchmark](https://arxiv.org/pdf/2508.20420); [ICAS 2024](https://www.icas.org/icas_archive/icas2024/data/papers/icas2024_0083_paper.pdf); F1-macro 0.762 for TF-IDF + LR (snippet, attribution unverified).
- **Rating:** Medium. Risk: heavy abbreviations; classical baselines are already decent when labels exist.

#### M13. Text features for prognostics and downtime models — *PHM*
- **Practice today:** Survival and duration models use structured fields; text is ignored.
- **Pain:** Text holds the cause and repair difficulty.
- **Jev fit:** Feature extractor. A fixed panel of 20–50 Nouls per record ("mentions leak", "part on order", "repeat failure") gives calibrated numeric features.
- **Why cheap/fast:** A 50-question panel per record is still one cheap request.
- **Evidence:** [NIST, Discovering Critical KPI Factors from Natural Language in MWOs](https://www.nist.gov/publications/discovering-critical-kpi-factors-natural-language-maintenance-work-orders); outage-duration prediction improves when NLP on field reports is added, 15 years of records — [arXiv 1804.01189](https://arxiv.org/pdf/1804.01189).
- **Rating:** Strong. Risk: low.

#### M14. Building-automation point names to Brick / Haystack classes — *building automation*
- **Practice today:** Integrators map vendor point names ("AHU1.SAT.SP") to a semantic model by hand before fault detection or analytics can run.
- **Pain:** 936 Brick classes; thousands of points per building; manual mapping blocks deployments.
- **Jev fit:** Select, do not generate. Code or embeddings narrow to ~20 candidate classes; Choice picks one; low confidence → integrator.
- **Why cheap/fast:** A 50,000-point campus for under a dollar; rerun on every controller change.
- **Evidence:** [Brick-DICL 2026](https://arxiv.org/abs/2606.17637) (~85–90% Hits@1, approximate); earlier [transducer LM](https://arxiv.org/pdf/2212.01964), [unified tagging architecture](https://arxiv.org/pdf/2003.07690).
- **Rating:** Strong. Risk: cryptic names need unit and neighbour context in `state`.

#### M15. AAS / ECLASS / spare-part master data matching — *Industry 4.0 interoperability*
- **Practice today:** Asset Administration Shell submodels reference ECLASS / IEC 61360 properties; mapping vendor properties and material-master entries is manual.
- **Pain:** Same name, different domain definitions; duplicates in material masters.
- **Jev fit:** Entity alignment. Noul: "Property A and ECLASS entry B denote the same characteristic" over names, definitions, units.
- **Why cheap/fast:** Pairwise matching across catalogues is quadratic.
- **Evidence:** [RCIM 2024](https://www.sciencedirect.com/science/article/pii/S0736584524001248); [IJAMT 2026](https://link.springer.com/article/10.1007/s00170-026-18632-2); [hybrid graph matching for AAS, arXiv 2601.06613](https://arxiv.org/pdf/2601.06613).
- **Rating:** Medium. Risk: unit and value-range comparison is numeric; do it in code.

### Inferences
- The 2023 zero-shot result (F1 0.46) is the key risk for Jev: no fine-tuning means the code list, definitions, and few-shot examples in `instructions` must do the work. The public failure-mode dataset is a ready benchmark.
- Expert disagreement (SINTEF) and "calibration varies dramatically" (Malyi) make calibrated probabilities the differentiator, more than raw accuracy.
- Most generation-focused FMEA/FTA papers leave checking to humans; a cheap checker is the open slot.

### Gaps
- No LLM/NLP evidence found for RCM decision logic, FMEA row checking, or FRACAS-to-FMEA linking.
- IEC 60812, IEC 61025, SAE J1739, SAE JA1012 texts not opened (paywalled); descriptions follow common summaries.
- Could not verify the "99% extraction accuracy" FMEA claim or the ATA F1 0.762 attribution.

---

## KQ3. Safety reporting: ASRS, HFACS, NRC LERs, rail, mining, OSHA/BLS narratives

### Takeaway
Narrative coding is proven and deployed. BLS has auto-coded injury narratives since 2014 and its neural coder beats trained humans. Nuclear, rail, mining, construction, and pipeline all have published classifiers. The hard part is deep causal coding (HFACS exact match stays low), which suits a per-category Noul fan-out rather than one big answer.

### Cited Findings
- BLS SOII collects about 300,000 injury narratives a year; each gets 6 codes (SOC occupation + 5 OIICS codes). Auto-coding began with 2014 data; BLS was "on pace to automatically assign nearly half of all non-secondary SOII codes for 2016 data" (verified in PDF). — [Measure, Deep neural networks for worker injury autocoding, BLS, 2017](https://www.bls.gov/iif/automated-coding/deep-neural-networks.pdf)
- The BLS neural coder makes "24% fewer errors than our logistic regression autocoders" and "an estimated 39% fewer errors than our manual coding process." Accuracy (human / LR / NN): occupation 68.3 / 75.0 / 78.6; nature 80.4 / 88.3 / 91.1; part 84.4 / 88.4 / 91.9; event 52.4 / 61.3 / 69.8; source 62.8 / 66.7 / 75.8 (verified; numbers read from chart text). — [same BLS paper](https://www.bls.gov/iif/automated-coding/deep-neural-networks.pdf)
- Later BLS material says nearly two-thirds of SOII codes are auto-assigned and the neural models flag suspicious codes for review (snippet). — [UNECE / BLS](https://statswiki.unece.org/download/attachments/285216428/ML_WP1_CC_USA-BLS.pdf?version=2&modificationDate=1605171512748&api=v2); [Machine Learning in Official Statistics, arXiv 1812.10422](https://arxiv.org/pdf/1812.10422)
- HFACS has four levels: unsafe acts, preconditions, unsafe supervision, organizational influences. — [Int. J. Aerospace Psychology, 2023 (GA pilots' ASRS narratives coded with HFACS)](https://www.tandfonline.com/doi/abs/10.1080/24721840.2023.2232387)
- Automated HFACS with GRPO-tuned Llama-3.1 8B: exact-match accuracy rose from 0.0400 to 0.1800; partial match 0.8800; it beat GPT-5-mini and Gemini-2.5-flash on key metrics (verified from abstract). — [Ahmadi, Sharif, Banad, 2025, arXiv 2508.21201](https://arxiv.org/abs/2508.21201)
- HFACS-guided chain-of-thought LLM reasoning for general-aviation accident investigation; HFACS-LLM for UAV accidents. — [Expert Systems with Applications, 2025](https://www.sciencedirect.com/science/article/abs/pii/S0957417425000442); [Drones, 2025](https://doi.org/10.3390/drones9100704)
- Maritime: domain-adapted NLP pipeline for human-factors classification of accidents. — [Ocean Engineering, 2026](https://www.sciencedirect.com/science/article/pii/S0029801826014599)
- ASRS: multi-label classification of contributing factors from self-reported narratives; the ASRS taxonomy gives 18 labels for primary problem and contributing factors (snippet). — [Safety (MDPI) 4(3):30, 2018](https://www.mdpi.com/2313-576X/4/3/30)
- ASRS 2026 work: topic modelling + knowledge graphs for risks and policy gaps; traceable LLM-generated hazard scenarios from ASRS reports. — [Safety Science, 2026](https://www.sciencedirect.com/science/article/pii/S0925753526001219); [arXiv 2608.04697](https://arxiv.org/abs/2608.04697)
- NTSB: recurrent networks classify 27,000 occurrence reports into four damage levels with accuracy above 87.9% (verified from abstract). — [Nanyonga et al., arXiv 2501.06490](https://arxiv.org/abs/2501.06490)
- NRC LERs: LERCause labels 10,608 sentences causal / non-causal; BERT-family models beat all others. — [LERCause, PLOS One, 2024](https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0308155)
- LER causality extraction: corpus of 20,129 text samples; deep learning detection + knowledge-based extraction. — [arXiv 2404.05656 (INL)](https://arxiv.org/abs/2404.05656)
- Shutdown initiating-event classification for PRA: 10,928 events; prescreen with 44 text patterns removes over 97% of non-events; fine-tuned BERT reaches 93.4% average accuracy on four types (verified from abstract). — [Xian, Wang, Zhang, Xu, Ma, arXiv 2410.00929, 2024](https://arxiv.org/abs/2410.00929)
- Nuclear corrective action programme: INL's MIRACLE screens condition reports and gives a confidence score for "condition adverse to quality"; claimed saving equals several full-time staff per plant. EPRI published a 2022 report on automating CAP. — [INL MIRACLE](https://inlsoftware.inl.gov/product/miracle); [EPRI 3002023821](https://restservice.epri.com/publicdownload/000000003002023821/0/Product)
- Rail: FRA accident reports have a primary-cause field with 389 codes plus a narrative; deep learning predicts cause from narrative; a BERT + DNN variant improved on it. — [Analysis of Railway Accidents' Narratives Using Deep Learning, arXiv 1810.07382, 2018](https://arxiv.org/abs/1810.07382); [J. Transportation Safety & Security, 2022](https://www.tandfonline.com/doi/full/10.1080/19439962.2022.2128956)
- Mining: nine random-forest models on MSHA narratives; 96% accuracy when applied to a mine's own non-MSHA narratives; MineBERT adapts BERT. — [Minerals 11(7):776, 2021](https://doi.org/10.3390/min11070776); [Minerals 13(6):770, 2023](https://doi.org/10.3390/min13060770)
- Uncertainty-aware hierarchical accident-code classification with conformal prediction, built to assist human coders. — [Process Safety and Environmental Protection, 2025](https://www.sciencedirect.com/science/article/abs/pii/S0957582025014016)
- Construction (OSHA reports): SVM best of six; average precision 0.73, recall 0.63, F1 0.67 over 11 accident types, F1 range 0.45–0.92 (snippet). — [Goh & Ubeynarayana, Accident Analysis & Prevention, 2017](https://pubmed.ncbi.nlm.nih.gov/28865927/); deep vs shallow comparison: [ASCE JCEM 2022](https://ascelibrary.org/doi/10.1061/%28ASCE%29CO.1943-7862.0002354)
- Pipelines: 3,587 PHMSA incident narratives mined with clustering and co-occurrence networks for contributory factors; PHMSA uses seven apparent cause categories. — [Process Safety and Environmental Protection, 2021](https://www.sciencedirect.com/science/article/abs/pii/S0957582021002779)
- Systematic review of text analytics for occupational injury causal factors. — [PMC9521307](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9521307/)
- SPAR-H uses eight performance shaping factors with level multipliers; critics say PSF definitions overlap and hurt inter-rater reliability. — [NUREG/CR-6883](https://www.nrc.gov/reading-rm/doc-collections/nuregs/contract/cr6883/cr6883.pdf); [Reliability Engineering & System Safety, 2016](https://www.sciencedirect.com/science/article/abs/pii/S0951832015002276)

### Usages

#### S1. Occupational injury narrative coding (OIICS, SOC) — *occupational safety statistics*
- **Practice today:** BLS codes SOII narratives to OIICS v2.01 and SOC; employers, insurers, and state agencies do similar coding on OSHA 300/301 logs and claims.
- **Pain:** BLS solved it with its own labelled data. Everyone else (companies, insurers, smaller agencies) lacks training data and ML staff.
- **Jev fit:** Triage with hierarchical Choice (2-digit division, then detail code) per code type; five code types run as parallel questions.
- **Why cheap/fast:** 300,000 narratives × 6 codes × 800 tokens ≈ 1.4 Btok ≈ $58 per year. No training set needed.
- **Evidence:** [BLS 2017](https://www.bls.gov/iif/automated-coding/deep-neural-networks.pdf): NN beats humans (e.g. event 69.8% vs 52.4%). Construction: [Goh 2017](https://pubmed.ncbi.nlm.nih.gov/28865927/).
- **Rating:** Strong. Risk: large code sets need hierarchical descent; a trained in-house model may still win where labels exist.

#### S2. ASRS report triage and contributing-factor tagging — *aviation safety*
- **Practice today:** NASA ASRS analysts read and code voluntary reports (primary problem, contributing factors, anomaly type).
- **Pain:** Expert time; long narratives; class imbalance.
- **Jev fit:** Multi-label fan-out: one Noul per contributing factor (18 labels) in one request; Choice for primary problem; Score for severity potential.
- **Why cheap/fast:** Airlines can run the same coding over their internal safety reports (ASAP-type) daily.
- **Evidence:** [MDPI Safety 2018](https://www.mdpi.com/2313-576X/4/3/30); [Safety Science 2026](https://www.sciencedirect.com/science/article/pii/S0925753526001219); [arXiv 2608.04697](https://arxiv.org/abs/2608.04697). Exact LLM accuracy on ASRS primary problem not verified.
- **Rating:** Strong. Risk: long narratives with irrelevant detail reduce accuracy; chunk or summarise first.

#### S3. HFACS coding of incident narratives — *human factors*
- **Practice today:** Investigators map findings to HFACS categories across four levels.
- **Pain:** Needs trained human-factors analysts; inter-rater variation; upper levels (supervision, organisation) are inferred, not stated.
- **Jev fit:** One Noul per HFACS category ("Narrative gives evidence of a skill-based error"), all in parallel; results shown with probabilities to the analyst.
- **Why cheap/fast:** Per-category probabilities across a whole archive enable trend statistics with uncertainty.
- **Evidence:** [Ahmadi et al. 2025](https://arxiv.org/abs/2508.21201): exact match only 0.18, partial 0.88 — full-set coding is hard even for tuned models. [ESWA 2025](https://www.sciencedirect.com/science/article/abs/pii/S0957417425000442); [maritime 2026](https://www.sciencedirect.com/science/article/pii/S0029801826014599).
- **Rating:** Medium. Risk: multi-hop inference to latent organisational causes; Jev reads literally.

#### S4. NRC Licensee Event Report screening and causal-sentence selection — *nuclear safety / PRA*
- **Practice today:** INL and NRC analysts read LERs to classify initiating events and extract causes for PRA data.
- **Pain:** Tens of thousands of reports; few PRA analysts.
- **Jev fit:** Screening at scale + select. Noul per sentence: "This sentence states a cause of the event." Choice: initiating-event type from the closed PRA list.
- **Why cheap/fast:** Whole LER corpus for a few dollars; rerun whenever PRA categories change.
- **Evidence:** [LERCause 2024](https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0308155); [Xian et al. 2024](https://arxiv.org/abs/2410.00929) 93.4%; [arXiv 2404.05656](https://arxiv.org/abs/2404.05656).
- **Rating:** Strong. Risk: regulatory acceptance; keep analyst review of positives.

#### S5. Corrective-action-programme condition report screening — *nuclear operations*
- **Practice today:** Every condition report is screened daily by a committee: is it a condition adverse to quality, what significance level, which department.
- **Pain:** Thousands of reports per plant per year; screening committees cost several staff.
- **Jev fit:** Triage / router. Noul: "Condition adverse to quality." Score: significance level. Choice: owning department.
- **Why cheap/fast:** Instant screening at submission; committee sees only uncertain items.
- **Evidence:** Deployed precedent: [INL MIRACLE](https://inlsoftware.inl.gov/product/miracle); [EPRI 2022](https://restservice.epri.com/publicdownload/000000003002023821/0/Product); [INL feature story](https://inl.gov/feature-story/artificial-intelligence-in-nuclear-how-computer-and-data-scientists-are-enhancing-the-industry/).
- **Rating:** Strong. Risk: 10 CFR 50 Appendix B quality context means false negatives matter; tune threshold for recall.

#### S6. Regulator cause coding in rail, mining, pipelines — *transport and extractive safety*
- **Practice today:** FRA (389 cause codes), MSHA accident classes, PHMSA (7 apparent causes) each pair a coded field with a narrative.
- **Pain:** Coded field is often wrong or too coarse; narratives hold more detail.
- **Jev fit:** Hierarchical Choice (FRA group → code); second-coder audit of submitted codes (Noul: "Narrative supports the submitted cause code").
- **Why cheap/fast:** Regulators and operators can audit every filing, not samples.
- **Evidence:** Rail [arXiv 1810.07382](https://arxiv.org/abs/1810.07382), [JTSS 2022](https://www.tandfonline.com/doi/full/10.1080/19439962.2022.2128956); mining [Minerals 2021](https://doi.org/10.3390/min11070776) (96% on site narratives), [MineBERT 2023](https://doi.org/10.3390/min13060770); pipeline [PSEP 2021](https://www.sciencedirect.com/science/article/abs/pii/S0957582021002779); misclassified crash narratives [arXiv 2507.03066](https://arxiv.org/pdf/2507.03066).
- **Rating:** Strong. Risk: 389-way choice must be decomposed; short cryptic rail narratives.

#### S7. Calibrated abstention for accident-code assignment — *safety data quality*
- **Practice today:** Coders assign codes; QA samples them.
- **Pain:** Automation is trusted only if it knows when it is unsure.
- **Jev fit:** Triage with thresholds: auto-accept above a confidence level, send the rest to a person. Jev's calibrated probabilities replace a bolt-on conformal layer.
- **Why cheap/fast:** The accept/route dial can be tuned per code family at no retraining cost.
- **Evidence:** [Conformal-prediction DSS, PSEP 2025](https://www.sciencedirect.com/science/article/abs/pii/S0957582025014016); BLS partial auto-coding policy in [BLS 2017](https://www.bls.gov/iif/automated-coding/deep-neural-networks.pdf).
- **Rating:** Strong. Risk: calibration must be re-checked on each domain's text.

#### S8. SPAR-H performance-shaping-factor levels from event narratives — *human reliability analysis*
- **Practice today:** Analysts rate eight PSFs (time, stress, complexity, experience, procedures, ergonomics, fitness, work processes) on described levels; multipliers then give the human error probability.
- **Pain:** Overlapping definitions, low inter-rater reliability ([RESS 2016](https://www.sciencedirect.com/science/article/abs/pii/S0951832015002276)).
- **Jev fit:** Score per PSF with the NUREG level descriptions as `criteria`; eight parallel questions. Code applies multipliers.
- **Why cheap/fast:** Rate every historical event the same way to build an empirical PSF database.
- **Evidence:** Method: [NUREG/CR-6883](https://www.nrc.gov/reading-rm/doc-collections/nuregs/contract/cr6883/cr6883.pdf). No NLP/LLM study found (gap).
- **Rating:** Speculative. Risk: narratives rarely state PSF evidence; HEP arithmetic stays in code.

#### S9. Near-miss and safety-observation screening — *occupational and operational safety*
- **Practice today:** Sites collect large numbers of observation cards and near-miss reports; a safety officer skims them.
- **Pain:** Volume buries the few reports with serious-injury potential.
- **Jev fit:** Triage. Score: credible worst-case severity {first aid, recordable, lost time, serious/fatal}. Choice: hazard type. Noul: "Describes an energy source that was uncontrolled."
- **Why cheap/fast:** Real-time screening as the card is submitted; supervisor alerted within seconds.
- **Evidence:** [Systematic review, PMC9521307](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9521307/); mining site narratives [Minerals 2021](https://doi.org/10.3390/min11070776). Severity-potential classification evidence not specifically verified.
- **Rating:** Medium. Risk: very short cards; "potential" severity is a counterfactual judgment.

### Inferences
- Where a regulator already has decades of labels (BLS, FRA, MSHA), trained models exist; Jev's edge is for the many organisations without labels, for taxonomy changes, and for auditing human codes.
- HFACS results suggest: do not ask for the whole causal chain. Ask one literal question per category and let the analyst assemble.
- Narrative authors are insiders, so adversarial-text risk is low here.

### Gaps
- No verified accuracy figure for a general LLM on ASRS primary-problem coding (search snippet mentions such work but I could not locate the paper).
- HFACS category count (commonly 19) not re-verified in this session.
- No NLP study found for SPAR-H PSF rating.

---

## KQ4. Fault diagnosis and supervisory control: Jev as semantic rule evaluator; which time scales fit?

### Takeaway
The expert-system tradition already splits diagnosis into numeric-to-symbolic conversion plus symbolic reasoning. Jev can take the symbolic half: code buckets the signals, Jev evaluates rule conditions or picks a mode from a closed set. Two 2026 papers show LLMs doing this above basic control and below the safety system, with deterministic validation. Jev's latency fits ISA-95 Level 2 (seconds) and Level 3 (minutes and up), not Level 0/1 loops.

### Cited Findings
- Venkatasubramanian, Rengaswamy, Kavuri (2003) review qualitative models (causal models such as signed digraphs, abstraction hierarchies) and search strategies (topographic, symptomatic). "The major disadvantage is the generation of spurious solutions." — [Computers & Chemical Engineering 27:313–326, Part II](https://www.sciencedirect.com/science/article/abs/pii/S0098135402001618)
- The ASM Consortium (Honeywell + major petrochemical firms) put preventable losses from abnormal situations at "at least $20B annually" for the US economy; a NIST-funded $16.6M programme built the AEGIS collaborative decision support prototype (snippet of Honeywell white papers). — [Honeywell ASM white paper, 1996](https://process.honeywell.com/content/dam/process/en/documents/document-lists/doc_asm-consortium/white-papers/January%2024%201996%20-%20Abnormal%20Situation%20Manageent.pdf); [ASM in the big data era, 2016](https://www.sciencedirect.com/science/article/abs/pii/S0098135416301077)
- Large reasoning models as closed-loop supervisors on the Tennessee Eastman process (41 measurements, 12 manipulated variables): plant kept within all hard constraints in 39 of 39 episodes versus 15 failures under basic regulatory control; safety-critical fault diagnosis 15/15 correct (a scripted rule table found the root cause in 2 of 15); model cost $0.07–$2.32 per 39-episode campaign; decision latency modelled at 0.05 h; the model sits above basic control and below the safety instrumented system; every action is statically validated and forward-simulated first (verified via page fetch). — [Alhazmi, Large reasoning models for abnormal situation management, arXiv 2608.19819, 2026](https://arxiv.org/html/2608.19819)
- LLM agents for fault-tolerant control on a batch mixing module and a CSTR: GPT-4o-mini and GPT-4.1-mini produced valid recovery decisions "within latency budgets compatible with the respective process dynamics"; actions are "validated deterministically against interlocks, envelopes, and dynamic feasibility before any actuation"; timeout hands control to a safety fallback (verified from abstract). — [Vyas, Gill, Markaj, Gehlhoff, Mercangöz, arXiv 2606.28011, 2026](https://arxiv.org/abs/2606.28011)
- Hybrid explainable diagnosis: SVDD anomaly detector + SHAP attributions + LLM that turns attributions into operator-readable fault origin. — [Springer chapter, 2026](https://link.springer.com/chapter/10.1007/978-3-032-29292-6_32)
- Reviews of LLMs for fault diagnosis exist (smart manufacturing; LLM + knowledge graph). — [ScienceDirect review, 2026](https://www.sciencedirect.com/science/article/pii/S2667305326000888); [Applied Soft Computing SLR, 2026](https://www.sciencedirect.com/science/article/pii/S156849462600356X)
- ISA-95 time scales: "Level 4 plans in months, weeks and days; Level 3 works in days, shifts, hours and minutes; Levels 0–2 react in seconds and milliseconds." Level 2 supervisory: seconds to minutes (snippet). — [Symestic ISA-95 overview](https://www.symestic.com/en-us/blog/mes/isa95); [Purdue reference architecture](https://en.wikipedia.org/wiki/Purdue_Enterprise_Reference_Architecture)
- Nuclear control rooms use computer-based procedures with levels of automation; automation lowers workload but can harm situation awareness and trust calibration. LLM-based procedure support agents are being proposed. — [Safety (MDPI) 11(1):22, 2025](https://www.mdpi.com/2313-576X/11/1/22); [PubMed 34261893](https://pubmed.ncbi.nlm.nih.gov/34261893/); [NuHF Claw, arXiv 2604.14160](https://arxiv.org/pdf/2604.14160)

### Usages

#### F1. Semantic rule evaluator over bucketed signals — *rule-based diagnosis / expert systems*
- **Practice today:** Real-time expert systems and ASHRAE-style AFDD rules fire on hard thresholds and tag patterns. Knowledge acquisition and rule maintenance are the bottleneck.
- **Pain:** Brittle rules; every new unit needs rule rewrites; operator notes and maintenance status are invisible to rules.
- **Jev fit:** Semantic predicate in a rule engine. Code converts each signal to a named bucket and trend ("suction pressure: low, falling"). `state` = buckets + active alarms + equipment status + latest shift-log lines. Each rule condition is a Noul, e.g. "Evidence is consistent with loss of lube-oil supply rather than instrument failure." Many rules = many parallel questions in one request.
- **Why cheap/fast:** 200 rule predicates every 10 s on a unit ≈ 1.7M requests/day if sent singly; batched per state it is ~8,600 requests/day at a few thousand tokens each ≈ $1/day.
- **Evidence:** [Venkatasubramanian Part II](https://www.sciencedirect.com/science/article/abs/pii/S0098135402001618); [Alhazmi 2026](https://arxiv.org/html/2608.19819) (scripted rules found root cause in 2/15, reasoning model 15/15); [hybrid SVDD+SHAP+LLM](https://link.springer.com/chapter/10.1007/978-3-032-29292-6_32).
- **Rating:** Medium. Risk: multi-hop causal reasoning is exactly where the large reasoning models won; Jev answers one literal predicate at a time, so rule design carries the reasoning. Advisory first.

#### F2. Spurious-candidate filter for qualitative-model diagnosis — *signed digraphs, causal models*
- **Practice today:** SDG and qualitative simulation return many fault candidates, several spurious.
- **Pain:** Operators get a long list.
- **Jev fit:** Heuristic inside a search loop. For each candidate from code, Noul: "This fault explains the observed symptom pattern without contradicting any listed observation." Rank by probability.
- **Why cheap/fast:** Candidate lists can be re-ranked every scan of the supervisory layer.
- **Evidence:** Problem stated in [Part II review](https://www.sciencedirect.com/science/article/abs/pii/S0098135402001618). No study of an LLM re-ranker on SDG output found.
- **Rating:** Speculative. Risk: contradiction checks involve double negatives and indirection, a known Jev weak spot.

#### F3. Supervisory mode and recovery-path selection from a closed set — *fault-tolerant / supervisory control*
- **Practice today:** Operators choose the response: continue, reduce load, switch to standby equipment, hold batch, controlled shutdown. State machines (ISA-88, PackML) define the legal moves.
- **Pain:** Slow or wrong choice in the first minutes of an upset causes trips.
- **Jev fit:** Supervisory layer over numeric control. Code lists the legal transitions from the current state. Choice over them + "no change". Deterministic validator checks interlocks and envelopes before anything executes; low confidence → operator.
- **Why cheap/fast:** Reasoning models took minutes of modelled latency (0.05 h) and up to dollars per campaign; a 100 ms, near-free call can re-decide every few seconds and run on every unit.
- **Evidence:** [Vyas et al. 2026](https://arxiv.org/abs/2606.28011); [Alhazmi 2026](https://arxiv.org/html/2608.19819).
- **Rating:** Medium. Risk: safety-critical; published successes used generative reasoning models, and Jev has not been tested; must stay below the SIS with a validator.

#### F4. Procedure entry-condition matching — *computer-based procedures, ISA-106-style procedure automation*
- **Practice today:** Operators match plant symptoms to the right abnormal or emergency procedure and check entry conditions.
- **Pain:** High workload in the first minutes; wrong procedure selection is a known human error mode.
- **Jev fit:** Select, do not generate. Code pre-filters procedures by unit and mode. Noul per entry condition; Choice of best-matching procedure, shown as advice with probabilities.
- **Why cheap/fast:** Continuous background matching; the suggestion is ready before the operator asks.
- **Evidence:** Automation effects studied in [MDPI Safety 2025](https://www.mdpi.com/2313-576X/11/1/22); LLM procedure agents proposed in [arXiv 2604.14160](https://arxiv.org/pdf/2604.14160). No accuracy data for entry-condition matching found.
- **Rating:** Speculative. Risk: entry conditions are often numeric (code must evaluate those); trust miscalibration in control rooms.

### Inferences
- Time-scale fit (mix of cited ISA-95 scales and general engineering knowledge, PLC figures not cited): motion and PID loops run at about 1–100 ms cycles with hard determinism, so they are out of scope even at 10 ms. Level 2 supervisory decisions (seconds to minutes) fit today's 100–150 ms. A sub-10 ms Jev could sit inside a slow PLC task as an advisory input, but a network call is not deterministic, so it still cannot be in the control path without a fallback.
- OT networks are segmented (Purdue levels, IEC 62443 zones). A cloud-only API is a deployment barrier for Level 2 use; an on-premises or edge option would be needed. The brief does not say Jev offers one.
- The strongest published results used generative reasoning models. Jev's chance is the pattern "reasoning model writes the rule set offline, Jev evaluates it online at scan rate".

### Gaps
- No experiment found with a classifier-only model (no text generation) as supervisory layer.
- No cited source here for typical PLC scan times or ISA-106 details.
- ASM loss figures are 1990s numbers; no recent update found.

---

## KQ5. Power, grid, SCADA/ICS: outage cause coding, operator logs, protection events, ICS security triage, NERC reporting

### Takeaway
Utilities and NERC run cause-coding processes that mirror the safety-reporting ones, with less NLP published. ICS security triage has active LLM research, but one careful 2026 study shows LLM labels agree with experts only about 0.39 on CVE-to-ATT&CK mapping, and log text is attacker-controlled. Use Jev as a first-pass filter here, never as ground truth.

### Cited Findings
- NERC events arrive via EOP-004 or DOE OE-417; event analysis ends with lessons learned and cause coding. NERC publishes an ERO Cause Code Assignment Process manual (January 2025). — [Texas RE, Events Analysis slides](https://www.texasre.org/Documents/Presentations/Reliability%20101%20and%20201/Reliability%20201%20-%20Reliability%20Services%20Events%20Analysis.pdf); [NERC CCAP Manual 2025](https://www.nerc.com/pa/rrm/ea/EA%20Program%20Document%20Library/CCAP_Manual_2025_Final.pdf); [EOP-004-4](https://www.nerc.com/standards/reliability-standards/eop/eop-004-4)
- MIDAS is NERC's database of protection system misoperations (PRC-004); common causes include miscoordination, wrong CT ratio, incorrect logic (snippet). — [NERC MIDAS](https://www.nerc.com/comm/PC/Pages/MIDASWG.aspx); [Keentel PRC-004-6 guide](https://keentelengineering.com/nerc-compliance-services-prc-004-6-midas-reporting); [ORNL NERC MISOPS report](https://www.osti.gov/servlets/purl/1836418)
- Outage duration prediction improves when NLP reads incoming field reports; 15 years of outage records; "language processing identifies phrases that point to outage causes and repair steps." — [arXiv 1804.01189](https://arxiv.org/pdf/1804.01189)
- Outage cause classification with ML on real utility data (ORNL); data-mining cause identification for momentary outages; 2026 multi-agent analysis of outage causes (titles verified, details not). — [ORNL](https://impact.ornl.gov/en/publications/outage-cause-classification-of-power-distribution-systems-with-ma/); [Sustainable Cities and Society, 2021](https://www.sciencedirect.com/science/article/abs/pii/S2210670721008520); [J. Eng. Applied Science, 2026](https://link.springer.com/content/pdf/10.1186/s44147-026-00960-5.pdf)
- LLMs (ChatGPT, Gemini) were tested on classifying IDS alerts as attack vs false positive and linking them to attack techniques. — [Let the Alerts Speak, Springer, 2026](https://link.springer.com/chapter/10.1007/978-3-032-35579-9_19)
- CVE → ATT&CK mapping: gold set of 1,207 CVEs; RoBERTa multi-label recall@5 0.673 (zero-shot baseline 0.322), macro-F1 0.177; LLM labels with about 0.39 agreement with experts "produce no reliable improvement" and "degrade rare-technique coverage"; ICS-tagged CVEs were excluded (verified via page fetch). — [Bonhomme & Dulaunoy (CIRCL), arXiv 2607.25572, 2026](https://arxiv.org/html/2607.25572v1)
- Open-source LLMs evaluated for multi-label ATT&CK technique classification on CTI reports; CritBench maps LLM cyber tasks in IEC 61850 substations to ATT&CK for ICS. — [arXiv 2606.18166](https://arxiv.org/pdf/2606.18166); [arXiv 2604.06019](https://arxiv.org/pdf/2604.06019)
- A meta-alert pipeline (GNN + LLM summaries + ATT&CK mapping) claims about 98% fewer analyst-facing triage items (snippet). — [Int. J. Information Security, 2026](https://link.springer.com/article/10.1007/s10207-026-01254-w)
- ATT&CK for ICS design document. — [MITRE, 2020](https://attack.mitre.org/docs/ATTACK_for_ICS_Philosophy_March_2020.pdf)

### Usages

#### P1. Distribution outage cause coding from crew and dispatcher notes — *distribution reliability (SAIDI/SAIFI reporting)*
- **Practice today:** Crews pick a cause code (vegetation, animal, equipment, weather, public, unknown) in the outage management system; reliability engineers clean it later.
- **Pain:** "Unknown" and wrong codes distort reliability indices and vegetation or asset budgets.
- **Jev fit:** Triage + second coder. `state` = crew remarks + dispatcher notes + weather bucket from code. Choice over utility cause codes; Noul: "Remarks contradict the recorded cause code."
- **Why cheap/fast:** Every outage ticket checked at close-out; millions of historical tickets recoded for tens of dollars.
- **Evidence:** [arXiv 1804.01189](https://arxiv.org/pdf/1804.01189); [ORNL](https://impact.ornl.gov/en/publications/outage-cause-classification-of-power-distribution-systems-with-ma/).
- **Rating:** Strong. Risk: terse crew shorthand.

#### P2. NERC event and misoperation cause coding — *bulk power reliability*
- **Practice today:** ERO cause-code assignment on event reports; entities submit misoperation cause categories to MIDAS.
- **Pain:** Small expert teams; consistency across regions.
- **Jev fit:** Hierarchical Choice down the CCAP cause tree; multi-label Nouls for contributing causes; audit of entity-submitted MIDAS categories.
- **Why cheap/fast:** Whole event archive recoded whenever the code tree is revised.
- **Evidence:** Process documents only: [CCAP 2025](https://www.nerc.com/pa/rrm/ea/EA%20Program%20Document%20Library/CCAP_Manual_2025_Final.pdf), [MIDAS](https://www.nerc.com/comm/PC/Pages/MIDASWG.aspx). No NLP study found.
- **Rating:** Medium. Risk: event reports are long and multi-hop; feed the sequence-of-events summary.

#### P3. Protection event report triage — *protection engineering*
- **Practice today:** Engineers review relay event records after every operation to confirm correct operation (PRC-004).
- **Pain:** Many routine operations; few protection engineers.
- **Jev fit:** Triage. Code parses the relay record into named facts (elements asserted, fault type, clearing-time bucket, breaker sequence, reclose result). Choice: {correct operation, likely misoperation — settings, — logic, — communication, — CT/VT, needs engineer}.
- **Why cheap/fast:** Every operation screened within seconds.
- **Evidence:** None found for text or LLM classifiers. Misoperation categories from [NERC MIDAS material](https://keentelengineering.com/nerc-compliance-services-prc-004-6-midas-reporting).
- **Rating:** Speculative. Risk: mostly numeric and waveform-based; value depends on how good the upstream fact extraction is.

#### P4. ICS / OT alert triage with ATT&CK for ICS tagging — *OT security operations*
- **Practice today:** SOC analysts triage IDS and anomaly alerts, map them to ATT&CK for ICS techniques.
- **Pain:** Alert volume; few analysts know both IT and OT.
- **Jev fit:** Triage / router. `state` = normalised alert + asset role (historian, engineering workstation, PLC) + maintenance-window flag. Noul: "Likely benign engineering activity." Choice over a short list of candidate techniques supplied by code.
- **Why cheap/fast:** Inline scoring of every alert at line rate (250k tokens/s limit); sub-second response.
- **Evidence:** [Let the Alerts Speak 2026](https://link.springer.com/chapter/10.1007/978-3-032-35579-9_19); caution from [CIRCL 2026](https://arxiv.org/html/2607.25572v1) (0.39 expert agreement for LLM technique labels); [SOC LLM survey](https://arxiv.org/pdf/2509.10858).
- **Rating:** Medium. Risk: adversarial — attackers control strings in logs and can steer the model; technique mapping accuracy is low in the literature.

#### P5. ICS advisory relevance screening against the asset inventory — *vulnerability management (IEC 62443, NERC CIP)*
- **Practice today:** Staff read each new CISA ICS advisory and vendor bulletin and check if the site runs the affected product.
- **Pain:** Product naming differs between advisories and inventories.
- **Jev fit:** Entity alignment. Noul: "Advisory product and inventory item are the same product line." Version-range comparison stays in code.
- **Why cheap/fast:** Advisories × assets is a large cross product, run daily.
- **Evidence:** NLP over ICS advisories and ATT&CK procedures exists ([arXiv 2512.18714](https://arxiv.org/pdf/2512.18714), snippet). No direct product-matching study verified.
- **Rating:** Medium. Risk: version logic is numeric; vendor rebranding.

### Inferences
- Outage and NERC cause coding are structurally the same task as BLS/FRA coding, so the strong evidence there likely transfers.
- For security, Jev should rank and filter, and code should sanitise or delimit attacker-controlled fields before they enter `state`.

### Gaps
- No published NLP work found on control-room operator logs, switching orders, or NERC cause coding.
- ORNL and 2026 outage papers not opened; no accuracy numbers.
- No ICS-specific accuracy for ATT&CK for ICS mapping found.

---

## KQ6. Functional safety limits: IEC 61508, IEC 61511, ISO 13849 and AI classifiers

### Takeaway
Current functional-safety practice does not let an ML classifier implement a safety function. IEC 61508-3 marks AI fault correction as not recommended above SIL 1. ISO/IEC TR 5469:2024 frames acceptable use by "usage level". Jev belongs in non-safety or advisory roles (levels C/D), with an independent, conventional safety layer untouched.

### Cited Findings
- "In terms of current practice in accordance with IEC 61508, although AI components may not be used to directly implement safety-related applications, the impact of using AI on safety must still be considered." An AI system "might itself increase the number of demands to which a safety-related system must respond." (verified in PDF) — [IET, The Application of Artificial Intelligence in Functional Safety, 2024](https://electrical.theiet.org/media/ifbjt25i/the-application-of-artificial-intelligence-in-functional-safety-v9.pdf)
- Sector standards (IEC 62061, ISO 13849-1, IEC 61511) "do not currently address solutions generated by AI and, indeed, in the past have deterred its application"; "there is no generally agreed body of knowledge as to what constitutes a sufficient process for assurance." (verified) — [same IET document](https://electrical.theiet.org/media/ifbjt25i/the-application-of-artificial-intelligence-in-functional-safety-v9.pdf)
- ISO/IEC TR 5469:2024 covers (i) AI inside a safety function, (ii) non-AI safety functions protecting AI-controlled equipment, (iii) AI used to develop safety functions. ISO/IEC TS 22440 (requirements) was approved for development in 2023 with planned publication in 2026. (verified in IET PDF) — [IET 2024](https://electrical.theiet.org/media/ifbjt25i/the-application-of-artificial-intelligence-in-functional-safety-v9.pdf); [ISO/IEC TR 5469:2024](https://www.iso.org/standard/81283.html)
- TR 5469 usage levels: A = AI in the safety function (A1 automated decision, A2 not), B = AI used in development (B1/B2), C = non-safety function that could interfere with safety functions, D = interference-free (snippet). — [Springer chapter, Compliance with Regulations, AI, and Functional Safety](https://link.springer.com/content/pdf/10.1007/978-3-031-80504-2_8); [ACM Computing Surveys](https://dl.acm.org/doi/10.1145/3626314)
- IEC 61508-3 Table A.2: AI for fault correction is "not recommended" above SIL 1 and neither recommended nor not recommended at SIL 1; rationale: complexity (snippet; page fetch timed out). — [Analog Devices EngineerZone](https://ez.analog.com/ez-blogs/b/engineerzone-spotlight/posts/functional-safety-and-artificial-intelligence-268912509); [arXiv 2108.11844](https://arxiv.org/pdf/2108.11844)
- Published LLM supervisory designs keep the SIS independent and validate every AI action deterministically. — [Alhazmi 2026](https://arxiv.org/html/2608.19819); [Vyas et al. 2026](https://arxiv.org/abs/2606.28011)
- LLM-drafted hazard analyses are unreliable: ChatGPT gave useful and correct STPA answers 64% of the time; another study found GPT-4 "unable to provide correct and satisfactory unsafe control actions." — [Can LLMs assist in Hazard Analysis?, arXiv 2303.15473](https://arxiv.org/pdf/2303.15473); [STPA using ChatGPT, 2025](https://www.sciencedirect.com/science/article/pii/S2666827025000052); [LLM-powered STPA and FRAM, Safety Science 2025](https://www.sciencedirect.com/science/article/pii/S0925753525001857)

### Usages

#### FS1. Functional-safety document checks (development-side use, TR 5469 level B2) — *IEC 61508 / IEC 61511 / ISO 13849 lifecycle*
- **Practice today:** Assessors check safety requirement specifications, safety manuals, proof-test procedures, and bypass logs against clause lists.
- **Pain:** Long checklists; assessor time is expensive; omissions are found late.
- **Jev fit:** Clause-by-clause compliance check. One Noul per required item, e.g. "The specification states the safe state for this function", "The bypass entry gives a reason, an approver, and a time limit." A human assessor decides; Jev only flags gaps.
- **Why cheap/fast:** Check every document revision and every bypass entry, not audit samples.
- **Evidence:** No study found. Basis: TR 5469 allows AI as a development aid with human decision (level B2) per [Springer chapter](https://link.springer.com/content/pdf/10.1007/978-3-031-80504-2_8).
- **Rating:** Medium. Risk: presence of a statement is not correctness; numeric claims (PFDavg, test intervals) need code or a person.

### Inferences
- Acceptable placements for Jev: records analysis (M4, S-series), development-side checks (FS1), operator advice (A4, F4), and supervisory choices that a deterministic validator and an independent SIS can override (F3). Not acceptable: any role inside a SIF, interlock, or alarm suppression executed live.
- Any advisory system can raise the demand rate on the safety system if operators follow bad advice; this must be part of the hazard analysis (IET point above).
- "Offline rule distillation" respects the standards best: Jev (or a bigger model) helps label history and propose rules; the approved rule runs in conventional, certifiable logic.

### Gaps
- IEC 61508-3 Table A.2 wording not verified at source (standard is paywalled; blog fetch timed out).
- Status of ISO/IEC TS 22440 in September 2026 not checked.
- ISO 13849 and IEC 61511 say nothing specific on ML that I could cite beyond the IET summary.

---

## Synthesis: Top 5, Poor fits, New roles

### Takeaway
Best value sits where (a) a closed taxonomy already exists, (b) volumes are large, (c) a wrong answer only creates review work. That points to maintenance and incident coding first, alarm rationalization QA second, and supervisory control last.

### Top 5 usages by likely value
1. **M1 + M5: ISO 14224 failure coding and legacy label audit.** Millions of records per operator, direct published benchmarks, feeds every reliability KPI; errors only cause review.
2. **S1 + S6 + S7: incident and injury narrative coding with calibrated abstention.** Government-scale precedent (BLS beats human coders); Jev removes the need for labelled data and ML staff.
3. **S5 + S4: nuclear condition-report and LER screening.** Deployed precedent (INL MIRACLE), stated savings of several staff per plant, 93.4% published accuracy on initiating events.
4. **A1: alarm rationalization pre-screen and master alarm database QA.** Every process plant must do it under ISA-18.2; expert workshops are the cost; no competitor evidence yet, so both high upside and unproven.
5. **F1 + F3: semantic rule evaluator and mode selection above basic control, below the SIS.** New capability that only a millisecond, near-free model makes continuous; 2026 papers show the architecture works with generative models; needs validation for a classifier-only model.
- Runner-up: **M14** building point mapping (936 classes, ~85–90% Hits@1 published) and **P1** outage cause coding.

### Poor fits
- **Anything inside a safety function (SIF, interlock, machine guard logic).** IEC 61508 practice excludes AI there; network latency is not deterministic.
- **Level 0/1 control loops (PID, motion).** Millisecond determinism and numeric maths.
- **Alarm setpoints, deadbands, delay timers, alarm-rate KPIs.** Pure numeric.
- **Raw alarm-sequence similarity.** Order and timing matter; Jev is weak on time comparison. Only a code-made summary is usable.
- **Quantitative reliability maths:** cut sets, PFDavg, Weibull fits, MTBF, RPN. Code owns these.
- **Generating FMEA, FTA, STPA content.** Jev does not generate; and evidence shows even generative LLMs are unreliable on unsafe control actions (64% useful).
- **Full causal-chain reconstruction from long investigation reports.** HFACS exact match of 0.18 for a tuned 8B model shows the difficulty; ask per-category questions instead.
- **Waveform, vibration, thermography, relay oscillography.** Non-text; needs an upstream model to produce named facts.
- **CVE or alert to ATT&CK technique labels used as ground truth.** Expert agreement about 0.39 in the literature; log text is attacker-controlled.
- **Live alarm suppression or shelving decisions.** Safety-relevant and hard to recover from.
- **Sequence-of-events timing checks, permit expiry, test-interval overdue.** Date arithmetic; do it in code.

### New roles to add to the catalogue
- **Second coder / label auditor.** Re-read records that humans already coded and flag likely miscodes. Seen at BLS (neural coder flags suspicious codes) and in wind-log label correction. Distinct from "verifier", which checks LLM or human reasoning steps.
- **Selective autocoder (accept / route dial).** Auto-accept above a calibrated threshold, route the rest. BLS codes only part of the workload automatically; conformal-prediction DSS papers do the same. Calibration is the product feature here.
- **Taxonomy walker.** Descend a large code tree level by level with small Choice calls (FRA 389 codes, OIICS, ATA chapters, Brick 936 classes, NERC cause tree), with code or retrieval narrowing candidates at each level.
- **Multi-label fan-out.** One Noul per label over the same state in one request (HFACS categories, ASRS contributing factors, SPAR-H PSFs, FMEA column checks). Matches Jev's parallel independent questions.
- **Offline rule distiller.** Label historical episodes cheaply, then turn stable, high-confidence patterns into deterministic rules that run in certified logic. This is the route that fits functional-safety constraints.

### Gaps
- No head-to-head test of a calibrated classifier-only model on any of the public datasets named here (failure-mode dataset from Stewart et al., LERCause, MSHA, FRA, OSHA construction). These are the obvious first benchmarks for Jev.
- Deployment constraint not resolved: OT and nuclear networks often cannot call a cloud API.
