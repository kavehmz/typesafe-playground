# Physics, subtopic A: Jev usages in experimental physics and big-science facility operations

Scope: particle physics, accelerators, observatories, gravitational-wave detectors, fusion devices, light and neutron sources, university labs.
Out of scope (another researcher): theory, simulation, literature, physics education.

How to read these notes:

- Each section is one key question. It has Takeaway, Cited Findings, Inferences, Gaps.
- The usages (U1 to U40) sit under **Inferences**. Each usage follows the 7-field format of the brief.
- Every usage is my inference. The cited papers show that the practice exists and that NLP or LLMs work on it. No paper tests Jev itself.
- "Unverified" means I did not open the source in this session. I recall it from training knowledge.
- Cost figures are my own estimates. I use $0.04 per million input tokens from the brief.
- Standing rule for all usages: **code or another model owns numbers, timestamps, waveforms, images, and spectra. Jev only sees text, named flags, and named buckets.**

---

## 1. Control-room and operations text: logbooks, shift handover, fault coding, operator assistants

### Takeaway
Accelerator labs already run NLP and RAG pilots on electronic logbooks, and they report the same blockers everywhere: jargon, acronyms, and poor entry quality. Almost all published work is retrieval plus text generation. Cheap closed-set judgment (tagging, fault coding, routing, gating) is the open gap, and it matches Jev well.

### Cited Findings
- A joint paper from DESY, BESSY, Fermilab, BNL, SLAC, LBNL, and CERN tests RAG on accelerator logbooks. It names "highly technical" entries and heavy acronym use as the main hurdles. — [Sulc et al., "Towards Unlocking Insights from Logbooks Using AI", 2024](https://arxiv.org/abs/2406.12881)
- Fermilab's logbook (ADEL) holds "nearly one million user-generated entries" since 2013. Operators found semantic search more useful than keyword search. — [Sulc et al. 2024](https://arxiv.org/html/2406.12881)
- BNL used a Doc2Vec model to find topics that serve as tags for grouping entries. SLAC explores auto-generated shift summaries. DESY explores topic modelling and root cause analysis. — [Sulc et al. 2024](https://arxiv.org/html/2406.12881)
- CERN's AccGPT left logbooks out at first because of "potentially lower data quality". — [Sulc et al. 2024](https://arxiv.org/html/2406.12881)
- A 2025 follow-up covers Fermilab, Jefferson Lab, LBNL, and SLAC. It evaluates RAG tools for eLog retrieval and integration with control systems (IPAC'25, 4 pages). — [Sulc, Hellert et al., "eLog analysis for accelerators: status and future outlook", 2025](https://arxiv.org/abs/2506.12949)
- AccGPT is CERN's knowledge-retrieval chatbot for control-room help, coding aid, and documentation. With Llama 3.1 it reaches 68% accuracy, within 1% of GPT-4o. — [AccGPT, CHEP 2024 proceedings](https://www.epj-conferences.org/articles/epjconf/pdf/2025/22/epjconf_chep2025_01279.pdf); [CHEP contribution](https://indico.cern.ch/event/1338689/contributions/6010661/)
- GAIA at DESY is a multi-expert RAG agent. It helps operators retrieve knowledge, can act on the machine, and writes control scripts. — [GAIA: A General AI Assistant for Intelligent Accelerator Operations, 2024](https://arxiv.org/abs/2405.01359v1)
- An agentic system at the Advanced Light Source uses an LLM to select capabilities from a closed toolkit. It uses human approval and write-access limits. — [Hellert et al., "Agentic AI for Multistage Physics Experiments at a Large-Scale User Facility Particle Accelerator", 2025](https://arxiv.org/pdf/2509.17255); [Phys. Rev. Research version](https://journals.aps.org/prresearch/abstract/10.1103/jtqy-9jz1)
- LLMs can tune an accelerator subsystem from a natural-language prompt alone (proof of principle). — [Kaiser, Lauscher, Eichler, Science Advances, 2025](https://www.science.org/doi/10.1126/sciadv.adr4173)
- CERN's Accelerator Fault Tracker (AFT) logs faults with start and end times for all CERN accelerators. Experts then review the faults for consistency. The project started in February 2014 and has served the LHC since 2015. — [LHC Accelerator Fault Tracker – First Experience, IPAC 2016](https://accelconf.web.cern.ch/AccelConf/ipac2016/papers/tupmb040.pdf); [AFT slides, CERN BE-CO](https://indico.cern.ch/event/561968/contributions/2270191/attachments/1347630/2034427/7_AFT.pdf)
- AFT's purpose is to find recurring equipment failures and real root causes, and to trigger consolidation work. — [AFT, IPAC 2016](https://accelconf.web.cern.ch/AccelConf/ipac2016/papers/tupmb040.pdf)
- ATLAS runs chATLAS, a RAG assistant over wikis, code docs, agendas, JIRA, and more, for about 6,000 members. — [chATLAS, CERN Document Server](https://cds.cern.ch/record/2935252)
- NIST coined "Technical Language Processing": stock NLP fails on short, jargon-heavy maintenance text, so the pipeline must be domain-driven. — [Brundage et al., NIST, 2021](https://www.nist.gov/publications/technical-language-processing-unlocking-maintenance-knowledge)
- LLMs were tested for failure-mode classification of maintenance work orders. — [Large Language Models for Failure Mode Classification: An Investigation, 2023](https://arxiv.org/pdf/2309.08181)
- NIST compared expert labelling, text classification, and AI-assisted tagging of work orders for computing failure rates. — [NIST, KPI Extraction from Maintenance Work Orders](https://www.nist.gov/publications/kpi-extraction-maintenance-work-orders-comparison-expert-labeling-text-classification)

### Inferences

Usages, subfield **accelerator and detector operations**.

#### U1. Logbook entry auto-tagging
1. **Name / subfield**: multi-label tagging of eLog entries (system, entry type, severity). Accelerator and detector operations.
2. **Practice today**: operators write free-text entries in ELOG-style systems. Tags are optional and uneven ([Sulc et al. 2024](https://arxiv.org/abs/2406.12881)).
3. **Pain point**: a million untagged entries. Keyword search breaks on acronyms. Doc2Vec topics are coarse.
4. **How Jev fits**: *screening at scale* and *feature extractor*. `state` = entry text, author group, machine mode, plus a lab glossary. One Noul per tag, all in parallel. Example: Choice "Which system does this entry concern?" {RF, magnets, vacuum, cryogenics, controls, beam instrumentation, injector, safety, other}.
5. **Why cheap and fast**: a full ADEL backfill (about 1M entries at about 800 tokens per request) costs about $30. Re-tagging after a taxonomy change costs the same again. Tags can be set live as the operator types.
6. **Evidence**: [Sulc et al. 2024](https://arxiv.org/abs/2406.12881) (Doc2Vec tags at BNL); [eLog analysis 2025](https://arxiv.org/abs/2506.12949).
7. **Fit**: Strong. Risk: jargon. The glossary in `instructions` must carry local acronyms.

#### U2. Fault and downtime cause coding
1. **Name / subfield**: assign each fault to a system and cause class, AFT-style. Accelerator availability.
2. **Practice today**: operators enter faults in AFT. Experts review them, often weekly, for consistency ([AFT, IPAC 2016](https://accelconf.web.cern.ch/AccelConf/ipac2016/papers/tupmb040.pdf)).
3. **Pain point**: expert review time. Coding differs between shifts and machines.
4. **How Jev fits**: *triage / router*. `state` = fault description, linked eLog entries, and interlock names found by code. Choice over the fault-system taxonomy. Noul "Is the root cause stated in the text?". Low confidence goes to the reviewer queue.
5. **Why cheap and fast**: every fault gets a first-pass code at entry time. Reviewers only see disagreements and low-confidence cases.
6. **Evidence**: [LLMs for failure mode classification](https://arxiv.org/pdf/2309.08181); [NIST KPI extraction](https://www.nist.gov/publications/kpi-extraction-maintenance-work-orders-comparison-expert-labeling-text-classification); [TLP, NIST](https://www.nist.gov/publications/technical-language-processing-unlocking-maintenance-knowledge). No published NLP work on AFT itself was found.
7. **Fit**: Strong. Risk: multi-hop cause chains (parent and child faults). Code must pass the candidate parent faults by time window.

#### U3. Recurring-fault linker
1. **Name / subfield**: decide whether two fault records or entries describe the same underlying problem. Availability analysis.
2. **Practice today**: AFT aims to "identify and quantify recurring equipment failures" ([AFT](https://accelconf.web.cern.ch/AccelConf/ipac2016/papers/tupmb040.pdf)). HeyLIGO groups related logbook content with TF-IDF and Word2Vec ([Mukund et al. 2018](https://iopscience.iop.org/article/10.3847/1538-4365/aaadb2)).
3. **Pain point**: the same fault gets many wordings. Embedding similarity alone gives no calibrated yes or no.
4. **How Jev fits**: *entity / record alignment*. Code retrieves the top-k similar past faults. Jev answers Noul "Do these two records describe the same failure mode on the same equipment?" per pair.
5. **Why cheap and fast**: k pairwise checks per new fault cost a fraction of a cent. Calibrated probabilities feed a clustering step.
6. **Evidence**: [HeyLIGO](https://iopscience.iop.org/article/10.3847/1538-4365/aaadb2); [Sulc et al. 2024](https://arxiv.org/abs/2406.12881) (DESY root-cause interest).
7. **Fit**: Strong. Risk: equipment naming needs exact lookup in code.

#### U4. Shift-handover completeness check
1. **Name / subfield**: check a shift summary against a fixed checklist. Control-room practice.
2. **Practice today**: written shift summaries in the eLog. SLAC explores generating them ([Sulc et al. 2024](https://arxiv.org/html/2406.12881)).
3. **Pain point**: items get left out at 6 a.m. The next crew lacks open-issue context.
4. **How Jev fits**: *verifier* and *clause-by-clause compliance check*. One Noul per required item. Example: "Does the summary state every open fault and its owner?" (yes/no probability).
5. **Why cheap and fast**: the check runs at submit time, under a second, and also checks LLM-written summaries.
6. **Evidence**: only indirect ([Sulc et al. 2024](https://arxiv.org/html/2406.12881)). No evaluation found.
7. **Fit**: Medium. Risk: the model reads literally. An item may be implied, not stated.

#### U5. Entry-to-expert router
1. **Name / subfield**: decide whether an entry needs an on-call expert, and which one. Operations.
2. **Practice today**: the shift leader decides and phones. The CMS DAQExpert was built to cut on-call demand ([DAQExpert](https://iopscience.iop.org/article/10.1088/1742-6596/1085/3/032021)).
3. **Pain point**: scarce experts. Both over-calling and under-calling cost beam time.
4. **How Jev fits**: *triage / router*. Choice {no action, note for day crew, call system expert, call run coordinator}. Score for urgency on described levels.
5. **Why cheap and fast**: every entry can be scored. Thresholds can be tuned per system from the calibrated probabilities.
6. **Evidence**: [DAQExpert](https://zenodo.org/records/3598860) shows that expert-demand reduction is a stated goal. No text-router study found.
7. **Fit**: Medium. Risk: safety-relevant escalation must stay with people.

#### U6. Relevance and answerability gate for logbook RAG
1. **Name / subfield**: filter retrieved chunks and decide when to abstain. Operator assistants (AccGPT, GAIA, chATLAS).
2. **Practice today**: vector retrieval plus a generative LLM ([AccGPT](https://www.epj-conferences.org/articles/epjconf/pdf/2025/22/epjconf_chep2025_01279.pdf); [GAIA](https://arxiv.org/abs/2405.01359v1); [chATLAS](https://cds.cern.ch/record/2935252)).
3. **Pain point**: AccGPT reports 68% accuracy. Wrong answers in a control room are costly.
4. **How Jev fits**: *select, do not generate* and *verifier*. Per chunk: Noul "Does this passage answer the question?". Per answer sentence: Noul "Is this sentence supported by the passage?".
5. **Why cheap and fast**: scoring 50 chunks in parallel adds about 100 ms and almost no cost. A generative reranker would cost far more.
6. **Evidence**: [AccGPT](https://www.epj-conferences.org/articles/epjconf/pdf/2025/22/epjconf_chep2025_01279.pdf); [eLog analysis 2025](https://arxiv.org/abs/2506.12949).
7. **Fit**: Strong. Risk: large, noisy chunks lower accuracy. Keep chunks small.

#### U7. Capability router and action gate for agentic control
1. **Name / subfield**: choose the tool, and block unsafe actions, in LLM-agent frameworks. Accelerator and beamline control.
2. **Practice today**: a large LLM picks capabilities from a closed toolkit. Humans approve writes ([Hellert et al. 2025](https://arxiv.org/pdf/2509.17255); [GAIA](https://arxiv.org/abs/2405.01359v1)).
3. **Pain point**: each agent step costs seconds and cents. Safety checks rely on the same model that proposes the action.
4. **How Jev fits**: *triage / router* and *semantic predicate in a rule engine*. Choice over the tool set. Independent Noul "Does this planned step change a machine setting?" as a second, cheap check before execution.
5. **Why cheap and fast**: the gate runs on every step without slowing the loop. It is an independent model, so it does not share the agent's errors.
6. **Evidence**: [Hellert et al. 2025](https://arxiv.org/pdf/2509.17255); [Kaiser et al. 2025](https://www.science.org/doi/10.1126/sciadv.adr4173); [AI agents that learn on the job](https://arxiv.org/pdf/2509.00098).
7. **Fit**: Medium. Risk: adversarial or odd text in the plan. The gate must be one layer among hard interlocks, never the only one.

### Gaps
- I could not read the AFT IPAC 2016 PDF body. Fault counts per year and the exact review cadence are not confirmed.
- No paper was found that classifies accelerator faults from text with a modern LLM.
- No figures were found for eLog entries per day at CERN, DESY, or SLAC.
- No evaluation of shift-handover quality checks was found.

---

## 2. Data-quality monitoring (DQM) and run certification

### Takeaway
LHC experiments state that DQM is labour-heavy and error-prone, and ML work targets the numeric histogram side. The final step is still a human semantic judgment over named defects, flags, and comments. That step is closed-set and text-based, so it fits Jev.

### Cited Findings
- ATLAS offline DQ shifters make a first assessment. DQ experts upload named defects to the defect database. Detector experts sign off. The end product is the Good Runs List of certified luminosity blocks. — [ATLAS data quality operations and performance for 2015–2018 data-taking, JINST 15 P04003, 2020](https://arxiv.org/abs/1911.04632)
- ATLAS stores DQ problems as named defects in a dedicated database. — [The ATLAS data quality defect database system, EPJC, 2012](https://link.springer.com/content/pdf/10.1140/epjc/s10052-012-1960-y.pdf)
- CMS says the manual DQM and certification workflow "is not granular enough and prone to human errors", with bottlenecks from manual steps. — [ML applications for DQM and Data Certification within CMS, J. Phys. Conf. Ser. 2438, 2023](https://iopscience.iop.org/article/10.1088/1742-6596/2438/1/012098)
- CMS DQM GUIs hold "hundreds of histograms for each CMS subdetector system". Visual comparison is "fatiguing and error-prone". — [Anomaly Detection for Automated DQM in the CMS Detector (AutoDQM), 2025](https://arxiv.org/abs/2501.13789)
- Each year a few percent of CMS data, a dozen or more hours of beam time, is marked bad. — [AutoDQM, 2025](https://arxiv.org/abs/2501.13789)
- AutoDQM shows only anomalous histograms to shifters. People keep the final decision. — [AutoDQM, 2025](https://arxiv.org/html/2501.13789)
- Autoencoders spot anomalies at a time granularity that human certification could not reach. — [CMS ML DQM, 2023](https://iopscience.iop.org/article/10.1088/1742-6596/2438/1/012098)

### Inferences

Usages, subfield **collider data quality**.

#### U8. Run-certification verdict support
1. **Name / subfield**: propose good, bad, or needs-expert per run or luminosity block. DQ certification.
2. **Practice today**: shifters, experts, then sign-off, feeding the Good Runs List ([ATLAS DQ 2020](https://arxiv.org/abs/1911.04632)).
3. **Pain point**: manual, slow, coarse, error-prone ([CMS 2023](https://iopscience.iop.org/article/10.1088/1742-6596/2438/1/012098)).
4. **How Jev fits**: *supervisory layer over numeric control*. Code computes all checks. `state` = named defects, bucketed anomaly scores ("pixel occupancy: high"), and shifter comments. Choice {good, bad, needs expert review}.
5. **Why cheap and fast**: a verdict per luminosity block, not per run, becomes affordable. People then review only disagreements.
6. **Evidence**: [ATLAS DQ 2020](https://arxiv.org/abs/1911.04632); [AutoDQM](https://arxiv.org/abs/2501.13789). No text-model study found.
7. **Fit**: Medium. Risk: numeric. Buckets must be defined by detector experts, and sign-off stays human.

#### U9. Defect selection from shifter comments
1. **Name / subfield**: map a free-text comment to the right named defect. ATLAS-style defect database.
2. **Practice today**: DQ experts read shifter notes and upload defects ([ATLAS DQ 2020](https://arxiv.org/abs/1911.04632)).
3. **Pain point**: hundreds of defect names. New shifters pick the wrong one or none.
4. **How Jev fits**: *select, do not generate*. Code shortlists defects for the subsystem. Jev picks one or "none of these" by Choice.
5. **Why cheap and fast**: a suggestion appears as the shifter types. Old comments can be backfilled.
6. **Evidence**: [ATLAS defect database, 2012](https://link.springer.com/content/pdf/10.1140/epjc/s10052-012-1960-y.pdf).
7. **Fit**: Strong. Risk: defect descriptions must be written out in `criteria`.

#### U10. Comment-versus-flag consistency audit
1. **Name / subfield**: find runs where the comment and the flag disagree. DQ bookkeeping.
2. **Practice today**: spot checks during sign-off ([ATLAS DQ 2020](https://arxiv.org/abs/1911.04632)).
3. **Pain point**: a run flagged good while the comment describes a problem can reach physics analyses.
4. **How Jev fits**: *verifier*. Noul "Does the comment describe a detector problem that affects data?". Code compares the answer with the flag.
5. **Why cheap and fast**: a full audit of all past runs costs a few dollars.
6. **Evidence**: indirect only ([CMS 2023](https://iopscience.iop.org/article/10.1088/1742-6596/2438/1/012098) notes human error).
7. **Fit**: Strong. Risk: low. The output is a review list.

#### U11. Triage of automated DQM alarms
1. **Name / subfield**: sort anomaly alarms into known-benign, known-issue, or new. Online DQM.
2. **Practice today**: AutoDQM shows anomalous histograms to the shifter ([AutoDQM](https://arxiv.org/html/2501.13789)).
3. **Pain point**: shifters rotate often and lack history. Known issues live in wikis and eLogs.
4. **How Jev fits**: *triage / router*. `state` = histogram name, bucketed score, run conditions, and the known-issues list. Choice {matches known issue A, B, ..., new: call expert}.
5. **Why cheap and fast**: every alarm gets matched against the full known-issues list in real time.
6. **Evidence**: [AutoDQM](https://arxiv.org/abs/2501.13789).
7. **Fit**: Medium. Risk: needs non-text input. The histogram shape must be described in words by code.

#### U12. Label cleaning for DQM machine learning
1. **Name / subfield**: turn historical comments into training labels for anomaly detectors. DQM ML.
2. **Practice today**: ML models train on run-level good or bad flags ([CMS 2023](https://iopscience.iop.org/article/10.1088/1742-6596/2438/1/012098)).
3. **Pain point**: run-level labels are coarse. The cause sits in free text.
4. **How Jev fits**: *feature extractor* for weak supervision. Nouls such as "Comment blames the high-voltage system". Probabilities become soft labels.
5. **Why cheap and fast**: the whole comment history can be relabelled whenever the label scheme changes.
6. **Evidence**: none direct. Marked as my inference.
7. **Fit**: Speculative. Risk: sparse, terse comments.

### Gaps
- No published numbers were found for shifter hours per run or defects per year.
- LHCb and ALICE DQM papers were not read. One CMS and ALICE ML paper exists ([ResearchGate entry](https://www.researchgate.net/publication/337751304_Using_Machine_Learning_techniques_for_Data_Quality_Monitoring_in_CMS_and_ALICE_experiments)) but I did not open it.
- No study was found that applies a text model to DQ comments or defects.

---

## 3. Hardware triggers (poor fit) and where a 10-100 ms semantic layer fits instead

### Takeaway
Hardware triggers are a poor fit. The Level-1 trigger works at 40 MHz with about 4 µs latency on numeric detector data, so Jev is thousands of times too slow and has the wrong input type. The right home is the seconds-scale layer: DAQ expert systems, alarm handling, slow control, and recovery procedures.

### Cited Findings
- The Level-1 trigger runs at 40 MHz on custom FPGA hardware, with a fixed latency of about 4 µs, and selects about 100 kHz of events. — [Ultra-low latency recurrent neural network inference on FPGAs with hls4ml, 2022](https://arxiv.org/pdf/2207.00559)
- hls4ml CNNs reached 5 µs inference latency on FPGAs. — [Fast convolutional neural networks on FPGAs with hls4ml, MLST 2021](https://iopscience.iop.org/article/10.1088/2632-2153/ac0ea1)
- hls4ml is the standard tool for L1 trigger ML. — [hls4ml repository](https://github.com/fastmachinelearning/hls4ml); see also [Review of ML for Real-Time Analysis at ALICE, ATLAS, CMS and LHCb, 2025](https://arxiv.org/pdf/2506.14578)
- The CMS DAQExpert is a rule-based expert system. It analyses monitoring data "updated every few seconds", pinpoints data-flow problems, and suggests or runs recoveries. By the end of Run 2 it triggered fully automatic recoveries. — [DAQExpert, J. Phys. Conf. Ser. 1085, 2018](https://iopscience.iop.org/article/10.1088/1742-6596/1085/3/032021); [DAQExpert service paper](https://zenodo.org/records/3598860); [code](https://github.com/cmsdaq/DAQExpert)
- DAQExpert aims to raise data-taking efficiency, cut human error, and cut on-call expert demand. — [DAQExpert](https://zenodo.org/records/3598860)
- Paranal Observatory fine-tuned a BERT model to detect anomalies in single log lines, because manual log inspection is impractical. — [Advanced log analysis for operations at Paranal Observatory, SPIE 13101, 2024](https://www.spiedigitallibrary.org/conference-proceedings-of-spie/13101/131010D/Advanced-log-analysis-for-operations-at-Paranal-Observatory/10.1117/12.3016349.short); [Sentiment Analysis based Error Detection for Large-Scale Systems](https://www.researchgate.net/publication/353788067_Sentiment_Analysis_based_Error_Detection_for_Large-Scale_Systems)
- Fermilab is writing a human-system interface style guide for its new ACORN control system. — [HSI Style Guide for ACORN, 2026](https://arxiv.org/pdf/2605.18828)

### Inferences

- Latency gap, my arithmetic: 100 ms is about 25,000 times the 4 µs L1 budget. The planned 10 ms is still about 2,500 times too slow. Input is also numeric, so there are two independent blockers.
- A DAQ expert system with a refresh of a few seconds leaves room for many 100 ms calls per cycle.

Usages, subfield **slow control, alarms, run control**.

#### U13. Semantic predicates in a DAQ or run-control expert system
1. **Name / subfield**: rule conditions that read error text. DAQ operations.
2. **Practice today**: hand-written rules over numeric monitoring in DAQExpert ([DAQExpert](https://iopscience.iop.org/article/10.1088/1742-6596/1085/3/032021)).
3. **Pain point**: error messages from thousands of applications vary in wording. Regex rules break on software updates.
4. **How Jev fits**: *semantic predicate in a rule engine*. Noul "Does this error message indicate a configuration mismatch, not a hardware failure?". The rule fires above a threshold.
5. **Why cheap and fast**: a predicate can run on every message each cycle. Rules survive rewording.
6. **Evidence**: [DAQExpert](https://zenodo.org/records/3598860); [Paranal BERT log model](https://www.spiedigitallibrary.org/conference-proceedings-of-spie/13101/131010D/Advanced-log-analysis-for-operations-at-Paranal-Observatory/10.1117/12.3016349.short).
7. **Fit**: Strong. Risk: terse machine text with codes. Code must expand codes into words.

#### U14. Recovery-procedure selection
1. **Name / subfield**: pick the recovery action from a closed list. Run control.
2. **Practice today**: DAQExpert gives recovery suggestions, then automates them with operator approval ([DAQExpert](https://zenodo.org/records/3598860)).
3. **Pain point**: every new failure mode needs a new hand-written rule (knowledge-acquisition bottleneck).
4. **How Jev fits**: *supervisory layer over numeric control*. `state` = named symptoms from code plus recent operator notes. Choice {restart subsystem X, reconfigure, pause and resume run, call expert}. Low confidence means "call expert".
5. **Why cheap and fast**: the answer arrives within one monitoring cycle, so it shortens downtime.
6. **Evidence**: [DAQExpert](https://iopscience.iop.org/article/10.1088/1742-6596/1085/3/032021) shows that closed-set recovery works and pays off.
7. **Fit**: Medium. Risk: safety-critical if it runs without approval. Keep operator confirmation for anything that touches hardware.

#### U15. Alarm and log-message triage
1. **Name / subfield**: sort alarm and log text into ignore, watch, notify, or call. Slow control at accelerators and observatories.
2. **Practice today**: alarm lists with static priorities. Paranal uses a BERT log-anomaly model ([Paranal 2024](https://www.spiedigitallibrary.org/conference-proceedings-of-spie/13101/131010D/Advanced-log-analysis-for-operations-at-Paranal-Observatory/10.1117/12.3016349.short)).
3. **Pain point**: log volume makes manual reading impractical. Fine-tuned models need retraining per site.
4. **How Jev fits**: *triage / router*. Choice {routine, degraded but safe, needs operator now, needs expert}. No fine-tuning. Site knowledge goes in `instructions`.
5. **Why cheap and fast**: at 250,000 tokens per second, a whole facility's log stream fits. Cost stays in dollars per day.
6. **Evidence**: [Paranal 2024](https://www.spiedigitallibrary.org/conference-proceedings-of-spie/13101/131010D/Advanced-log-analysis-for-operations-at-Paranal-Observatory/10.1117/12.3016349.short); [Sentiment-based error detection](https://www.researchgate.net/publication/353788067_Sentiment_Analysis_based_Error_Detection_for_Large-Scale_Systems).
7. **Fit**: Medium. Risk: alarm floods need correlation across messages. That is multi-hop, so code must group alarms first.

#### U16. Pre-run configuration check in words
1. **Name / subfield**: check the run plan text against the machine state. Run control.
2. **Practice today**: shift checklists and run-control state machines. No single published standard was found.
3. **Pain point**: mismatches between the plan ("cosmics run") and the state ("stable beams") get caught late.
4. **How Jev fits**: *clause-by-clause compliance check*. One Noul per checklist line over plan text plus named state.
5. **Why cheap and fast**: runs at every state transition without delaying the start.
6. **Evidence**: none found. My inference.
7. **Fit**: Speculative. Risk: most such checks are exact comparisons, which code does better.

### Gaps
- The ACORN abstract does not mention alarm standards. I could not confirm which alarm-management standard (for example ISA-18.2 or IEC 62682) accelerator labs follow.
- The first hls4ml paper reports about 100 ns latency (Duarte et al., JINST 2018, [arXiv:1804.06913](https://arxiv.org/abs/1804.06913)). Unverified in this session.
- No published use of a text model inside a trigger or DAQ expert system was found.

---

## 4. Astronomy: alerts and circulars, follow-up, proposals, bibliographies, citizen science, brokers

### Takeaway
Text circulars are the best-proven area: two 2026 papers show LLMs classify and extract from GCN Circulars at 96-99% accuracy. Proposal sorting has worked since 2017 with Naive Bayes, so closed-set text judgment is accepted practice. Alert-stream brokers are numeric and image-based, so they are poor fits unless code turns features into named buckets.

### Cited Findings
- The GCN Circulars archive holds more than 40,500 human-written Circulars from three decades. — [Sharma et al., "LLM-driven Analysis of GCN Circulars", ApJS 283, 2026](https://arxiv.org/abs/2511.14858)
- The same team classified Circulars by wave band and messenger with topic modelling and contrastive fine-tuning. An open Mistral model extracted GRB redshifts with 97.2% accuracy. RAG retrieval found 96.8% of redshift Circulars. — [Sharma et al. 2026](https://iopscience.iop.org/article/10.3847/1538-4365/ae2e9c)
- Astro-COLIBRI turns Circulars into structured records with gpt-5.4-mini and a gpt-5.5 fallback. Output: 68,393 observations from 26,811 reports on 5,787 events. — [Schüssler et al., Aug 2026](https://arxiv.org/html/2608.23270)
- Astro-COLIBRI audits: 99.80% field-level precision, 96.5% of reports fully correct, 91.6% redshift agreement with GRBweb. Timing and facility attribution were the most error-prone fields. — [Schüssler et al. 2026](https://arxiv.org/html/2608.23270)
- Its schema has closed-set fields: detection vs upper limit vs non-detection, spectroscopic flag, and report type. — [Schüssler et al. 2026](https://arxiv.org/html/2608.23270)
- TDAC is the first annotated corpus of GCN Circulars, ATels, and TNS AstroNotes. The authors say report volume saturates how astrophysicists read and classify. — [TDAC, WIESP 2022](https://aclanthology.org/2022.wiesp-1.15/)
- SkyPortal hosts an open circular-extraction tool. — [Circex](https://github.com/skyportal/Circex)
- PACMan sorts Hubble proposals into science categories with Naive Bayes. It matched the human sorting 87% of the time, and above 95% with more training cycles. — [Strolger et al., AJ 2017](https://iopscience.iop.org/article/10.3847/1538-3881/aa6112); [PACMan2](https://arxiv.org/pdf/2303.04220)
- ESO tested distributed peer review with NLP: topics inferred from proposal text, expertise from publications. 167 applicants each reviewed eight proposals. — [Kerzendorf et al., Nature Astronomy 2020](https://www.nature.com/articles/s41550-020-1038-y)
- ALMA published an ML plus optimisation method for reviewer assignment. — [PASP 2025](https://iopscience.iop.org/article/10.1088/1538-3873/adb5c1)
- Counter-evidence: for finding expert reviewers, TF-IDF put a labelled expert in the top 25 in 79.5% of cases. GPT-4o mini reached 51.5%. The authors blame "semantic smoothing". — [Amado Olivo et al., 2026](https://arxiv.org/abs/2605.18752)
- AstroReview, an LLM multi-agent reviewer, identified accepted proposals with 87% accuracy. — [AstroReview, 2025](https://arxiv.org/abs/2512.24754)
- astroBERT is a 110M-parameter model from NASA ADS. Variants do named-entity recognition and a 7-category SciX classifier. — [astroBERT paper](https://arxiv.org/abs/2112.00590); [model card](https://huggingface.co/adsabs/astroBERT/blob/main/README.md)
- Hanny's Voorwerp was first recorded in the Galaxy Zoo forum. Talk was built to bring promising posts to the science team. — [Marshall, Lintott, Fletcher, "Ideas for Citizen Science in Astronomy"](https://arxiv.org/pdf/1409.4291)
- An NLTK toolkit exists for Zooniverse Talk comment dumps. — [NLTalk](https://github.com/ttfnrob/NLTalk)
- Seven full-stream brokers will process the Rubin alert stream: ALeRCE, AMPEL, ANTARES, Babamul, Fink, Lasair, Pitt-Google. — [Rubin: Alerts and brokers](https://rubinobservatory.org/for-scientists/data-products/alerts-and-brokers)
- ALeRCE's light-curve classifier is a balanced random forest over computed variability features and colours, with 15 classes. — [Sánchez-Sáez et al., AJ 2021](https://iopscience.iop.org/article/10.3847/1538-3881/abd5c1)
- Rubin runs a Target-of-Opportunity system for gravitational-wave events, neutrinos, hazardous asteroids, and more. — [Rubin ToO System in the First Year of Operations, 2026](https://arxiv.org/abs/2607.00217)
- Rubin documents fault reporting for observatory operations. — [Rubin Observatory Operations: Fault Reporting](https://obs-ops.lsst.io/Communications/fault-reporting.html)

### Inferences

Usages, subfield **time-domain and observatory operations**.

#### U17. Circular and telegram classification
1. **Name / subfield**: label each GCN Circular, ATel, or AstroNote. Time-domain astronomy.
2. **Practice today**: people read them. LLM pipelines now exist ([Sharma et al. 2026](https://arxiv.org/abs/2511.14858); [Astro-COLIBRI](https://arxiv.org/html/2608.23270)).
3. **Pain point**: volume saturates readers ([TDAC](https://aclanthology.org/2022.wiesp-1.15/)). Follow-up windows last hours.
4. **How Jev fits**: *triage / router*. Parallel questions per Circular: Choice report type {detection, upper limit, non-detection, spectrum or redshift, retraction, other}; Choice messenger or wave band; Noul "Does it report a counterpart candidate?".
5. **Why cheap and fast**: the full 40,500-Circular archive costs under $2 to relabel. New Circulars get labels in about 100 ms, so brokers can act on them.
6. **Evidence**: [Sharma et al. 2026](https://iopscience.iop.org/article/10.3847/1538-4365/ae2e9c); [Astro-COLIBRI 2026](https://arxiv.org/html/2608.23270); [TDAC](https://aclanthology.org/2022.wiesp-1.15/).
7. **Fit**: Strong. Risk: low. The schema is already closed-set in deployed systems.

#### U18. Select-style value extraction from circulars
1. **Name / subfield**: pick the right number among candidates. Time-domain astronomy.
2. **Practice today**: generative LLMs with JSON schemas ([Astro-COLIBRI](https://arxiv.org/html/2608.23270)).
3. **Pain point**: timing and facility attribution errors. Generative models can invent values.
4. **How Jev fits**: *select, do not generate*. Code finds all redshift-like or magnitude-like spans. Jev answers Choice "Which span is the redshift the authors report for this event?" {span 1, span 2, ..., none}.
5. **Why cheap and fast**: it can run as a second opinion on every generative extraction. Disagreement flags a human audit.
6. **Evidence**: [Sharma et al. 2026](https://arxiv.org/abs/2511.14858) (97.2%); [Astro-COLIBRI](https://arxiv.org/html/2608.23270) (99.80% field precision).
7. **Fit**: Strong as a verifier, Medium as the sole extractor. Risk: numeric. Jev must never compare the values themselves.

#### U19. Circular-to-event alignment
1. **Name / subfield**: decide which event a report refers to. Multimessenger bookkeeping.
2. **Practice today**: event names in subject lines. Annotated coreference data exists (astroECR, cited in [Sharma et al. 2026](https://arxiv.org/pdf/2511.14858)).
3. **Pain point**: one source gets many names across GCN, TNS, and surveys.
4. **How Jev fits**: *entity / record alignment*. Code shortlists events by sky position and time. Jev answers Noul "Does this report discuss event X?".
5. **Why cheap and fast**: every new report can be checked against all open events.
6. **Evidence**: [TDAC](https://aclanthology.org/2022.wiesp-1.15/); [Sharma et al. 2026](https://arxiv.org/abs/2511.14858) (separating GW clusters from counterpart reports).
7. **Fit**: Medium. Risk: coordinates and times need code. Jev only judges the text.

#### U20. Follow-up action choice from a closed set
1. **Name / subfield**: choose trigger, queue, monitor, or ignore. ToO operations.
2. **Practice today**: programme rules plus human judgment. Rubin runs a formal ToO system ([Rubin ToO 2026](https://arxiv.org/abs/2607.00217)).
3. **Pain point**: decisions at night, in minutes, by few people.
4. **How Jev fits**: *supervisory layer over numeric control*. `state` = bucketed facts from code ("localisation: small", "distance: near", "observable tonight: yes") plus Circular labels from U17. Choice over the programme's action list.
5. **Why cheap and fast**: the policy can be re-evaluated every time a new notice or Circular arrives.
6. **Evidence**: [Rubin ToO 2026](https://arxiv.org/abs/2607.00217) (abstract only). No study of text-model triggering found.
7. **Fit**: Speculative. Risk: numeric. Most trigger criteria are thresholds, which code should apply.

#### U21. Proposal science-category sorting
1. **Name / subfield**: sort proposals into panels. Time allocation (HST, JWST, ESO, ALMA, light sources).
2. **Practice today**: PACMan Naive Bayes at STScI ([Strolger et al. 2017](https://iopscience.iop.org/article/10.3847/1538-3881/aa6112)). ESO used NLP topics ([Kerzendorf et al. 2020](https://www.nature.com/articles/s41550-020-1038-y)).
3. **Pain point**: PACMan needs last cycle's labelled proposals to train. Categories change.
4. **How Jev fits**: *triage / router*. Choice over panel names with written descriptions. No training set needed.
5. **Why cheap and fast**: cost is trivial at this volume. The gain is zero-shot category changes and calibrated confidence for borderline proposals.
6. **Evidence**: [PACMan](https://iopscience.iop.org/article/10.3847/1538-3881/aa6112) (87% to above 95%); [ALMA 2025](https://iopscience.iop.org/article/10.1088/1538-3873/adb5c1); [ESRF topic classification](https://journals.iucr.org/s/issues/2026/05/00/ye5084/index.html).
7. **Fit**: Strong for category sorting. Poor for fine expert matching (see [Amado Olivo et al. 2026](https://arxiv.org/abs/2605.18752)).

#### U22. Proposal compliance pre-screen
1. **Name / subfield**: check format rules before review. Time allocation.
2. **Practice today**: observatory staff check proposals by hand. Dual-anonymous rules at STScI are from my memory (unverified).
3. **Pain point**: a thousand or more proposals per cycle at large facilities (unverified figure).
4. **How Jev fits**: *clause-by-clause compliance check*. Nouls such as "Does the text reveal the identity of the team?" and "Does it state the requested instrument modes?".
5. **Why cheap and fast**: proposers could get instant feedback before the deadline.
6. **Evidence**: [AstroReview](https://arxiv.org/abs/2512.24754) shows LLM proposal assessment is active research. No compliance-check study found.
7. **Fit**: Medium. Risk: adversarial. Proposal text is written by an interested party and could try to steer the model.

#### U23. Facility bibliography curation
1. **Name / subfield**: decide whether a paper used data from a given telescope. Observatory metrics.
2. **Practice today**: librarians read papers. ADS uses astroBERT for entities and categories ([astroBERT](https://arxiv.org/abs/2112.00590)).
3. **Pain point**: a facility mention is not the same as data use. Keyword search over-counts.
4. **How Jev fits**: *screening at scale*. Noul "Does this paragraph state that the authors analysed data from facility X?".
5. **Why cheap and fast**: a million 2,000-token papers cost about $84 (brief's figure).
6. **Evidence**: [astroBERT](https://arxiv.org/abs/2112.00590); [SciX categorizer](https://huggingface.co/adsabs/astroBERT/blob/main/README.md).
7. **Fit**: Strong. Note: this borders on the literature scope of another researcher.

#### U24. Citizen-science comment triage
1. **Name / subfield**: surface Talk posts that need a scientist. Zooniverse projects.
2. **Practice today**: moderators and science teams skim Talk. Hanny's Voorwerp came from a forum post ([Marshall et al.](https://arxiv.org/pdf/1409.4291)).
3. **Pain point**: comment volume is far above team capacity. Rare finds hide in chatter.
4. **How Jev fits**: *triage / router*. Choice {possible unusual object, question for the team, bug report, social chatter}. Score "how specific is the claim".
5. **Why cheap and fast**: all comments on all projects can be scored. Volunteers can be answered faster.
6. **Evidence**: [NLTalk](https://github.com/ttfnrob/NLTalk) (sentiment only); [Hunting for new glitches with community science, 2025](https://arxiv.org/pdf/2508.13923).
7. **Fit**: Strong. Risk: low. A miss costs nothing beyond today's baseline.

#### U25. Observatory night-log and fault-report coding
1. **Name / subfield**: code night-log entries and fault reports by system and time-loss cause. Observatory operations.
2. **Practice today**: operators file fault reports ([Rubin fault reporting](https://obs-ops.lsst.io/Communications/fault-reporting.html)). Paranal analyses logs with NLP ([Paranal 2024](https://www.spiedigitallibrary.org/conference-proceedings-of-spie/13101/131010D/Advanced-log-analysis-for-operations-at-Paranal-Observatory/10.1117/12.3016349.short)).
3. **Pain point**: same as U2. Time-loss statistics depend on consistent coding.
4. **How Jev fits**: *triage / router*. Choice {weather, telescope, instrument, software, operations, other}.
5. **Why cheap and fast**: many years of night logs can be recoded in one pass for trend studies.
6. **Evidence**: [Paranal 2024](https://www.spiedigitallibrary.org/conference-proceedings-of-spie/13101/131010D/Advanced-log-analysis-for-operations-at-Paranal-Observatory/10.1117/12.3016349.short).
7. **Fit**: Strong.

### Gaps
- I read only the abstract of the Rubin ToO paper. The trigger inputs and action set are not confirmed.
- No peer-reviewed study of Zooniverse Talk triage with modern NLP was found.
- ATel-specific and TNS-specific LLM work beyond TDAC was not found.
- The ALMA paper's authors and accuracy numbers were not checked.
- A&A 2026 has an ALeRCE text-to-SQL system ([link](https://www.aanda.org/articles/aa/full_html/2026/07/aa58221-25/aa58221-25.html)). It is generative, so it is outside Jev's envelope.

---

## 5. Gravitational waves: aLOG mining, data-quality flags, glitch labels, event validation

### Takeaway
LIGO has had NLP search over its logbooks since 2017, and event validation already runs as a set of automated checks with named outcomes. Jev fits after the numeric and image tools: it judges the named results and the text around them.

### Cited Findings
- HeyLIGO indexes the logbooks of LIGO Hanford, LIGO Livingston, GEO 600, and Virgo. It uses TF-IDF and Word2Vec and retrains as entries arrive. — [Mukund et al., ApJS 2018](https://iopscience.iop.org/article/10.3847/1538-4365/aaadb2); [arXiv](https://arxiv.org/pdf/1710.05350)
- The aLOG is LIGO's fork of the Virgo logbook software. — [ligo-logbook / alog](https://git.ligo.org/ligo-logbook/alog)
- Gravity Spy classifies glitches by time-frequency image with ML and volunteers. In O3 it labelled 233,981 Hanford and 379,805 Livingston glitches. Scattered Light and Fast Scattering were common at Livingston. — [Glanzer et al., Gravity Spy O3 classifications](https://arxiv.org/abs/2208.12849v1); [Gravity Spy overview](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5927381/)
- Volunteers help find new glitch classes. — [Hunting for new glitches in LIGO data using community science, 2025](https://arxiv.org/pdf/2508.13923)
- Data Quality Reports are sets of automated checks triggered by each significant candidate. The rapid response team reads them to confirm or retract a public alert. GraceDB is the central candidate database that triggers them. — [LIGO-Virgo DetChar: from O3 to O4](https://arxiv.org/pdf/2204.03566); [LIGO DetChar in O2 and O3](https://arxiv.org/pdf/2101.11673)
- In O4, the DQRbuild toolkit validated all low-latency candidates across LIGO, Virgo, and KAGRA. Tasks return p-values, pass or fail, or plots. Outcomes: no DQ issue, DQ warning, or retraction. — [Davis et al., DQRbuild toolkit, 2026](https://arxiv.org/html/2605.16183)
- Manual vetting took at least 24 minutes in O3. In a retrospective scenario, 24% of candidates would need no human input. — [Davis et al. 2026](https://arxiv.org/html/2605.16183)

### Inferences

Usages, subfield **gravitational-wave detector characterisation**.

#### U26. aLOG entry tagging and issue linking
1. **Name / subfield**: tag aLOG entries and link them to known detector issues. Commissioning and DetChar.
2. **Practice today**: HeyLIGO search ([Mukund et al. 2018](https://iopscience.iop.org/article/10.3847/1538-4365/aaadb2)).
3. **Pain point**: TF-IDF and Word2Vec need retraining. They rank but give no calibrated answer.
4. **How Jev fits**: *screening at scale* and *entity / record alignment*. Choice subsystem {suspension, seismic isolation, laser, squeezer, calibration, environment, ...}. Noul "Does this entry describe the same issue as entry Y?".
5. **Why cheap and fast**: four observatories' full history can be relabelled for tens of dollars (my estimate).
6. **Evidence**: [HeyLIGO](https://arxiv.org/pdf/1710.05350).
7. **Fit**: Strong. Risk: jargon.

#### U27. Event-validation verdict support
1. **Name / subfield**: propose the validation outcome for each candidate. Low-latency alerts.
2. **Practice today**: DQR tasks plus a human rapid response team ([Davis et al. 2026](https://arxiv.org/html/2605.16183)).
3. **Pain point**: at least 24 minutes of manual vetting. People get called at any hour.
4. **How Jev fits**: *supervisory layer over numeric control*. Code buckets each p-value. `state` = named task results plus recent aLOG entries near the event time (chosen by code). Choice {no DQ issue, DQ warning: needs mitigation, recommend retraction: call human}.
5. **Why cheap and fast**: the verdict is ready seconds after the last DQR task ends. It can also explain which named check drove it, through per-check Nouls.
6. **Evidence**: [Davis et al. 2026](https://arxiv.org/html/2605.16183) (24% automatable already with thresholds).
7. **Fit**: Medium. Risk: numeric and high-stakes. A retraction must stay a human decision.

#### U28. Glitch class to probable cause
1. **Name / subfield**: map a glitch label plus context to a cause hypothesis. DetChar.
2. **Practice today**: Gravity Spy gives the morphology class. Experts link classes to causes by study ([Glanzer et al.](https://arxiv.org/abs/2208.12849v1)).
3. **Pain point**: over 600,000 glitches in O3. Expert time is scarce.
4. **How Jev fits**: *semantic predicate* after an upstream image classifier. `state` = Gravity Spy class, named witness channels from code, site conditions in buckets ("microseism: high"), and aLOG notes. Choice over a cause list with "unknown".
5. **Why cheap and fast**: all O3 glitches cost about $15 to process (my estimate at 600 tokens each).
6. **Evidence**: [Gravity Spy O3](https://arxiv.org/abs/2208.12849v1). No text-model study found.
7. **Fit**: Speculative. Risk: needs non-text input, and the cause knowledge must be written into `criteria`.

#### U29. Data-quality flag rationale audit
1. **Name / subfield**: check that each DQ flag or veto has a stated instrumental reason. DetChar bookkeeping.
2. **Practice today**: flags are defined and documented by DetChar groups ([LIGO DetChar O2-O3](https://arxiv.org/pdf/2101.11673)).
3. **Pain point**: documentation is spread over aLOG, wikis, and papers.
4. **How Jev fits**: *verifier*. Noul "Does the linked text give an instrumental or environmental cause for this flag?".
5. **Why cheap and fast**: a full audit before each catalogue release becomes routine.
6. **Evidence**: none direct.
7. **Fit**: Speculative.

### Gaps
- No LLM work on the aLOG beyond HeyLIGO was found.
- GraceDB label names and the annotation workflow were not checked in this session.
- O4 candidate counts are not in the DQRbuild paper summary.

---

## 6. Fusion: shot logbooks, disruption-cause labels, real-time prediction

### Takeaway
LLM RAG over shot logs is deployed at DIII-D and Alcator C-Mod, and the 10-minute gap between shots makes a fast model valuable. Disruption-cause labelling is still manual and ambiguous, so it suits closed-set support. Real-time disruption prediction is numeric and runs inside the plasma control system, so it is a poor fit.

### Cited Findings
- Princeton, CMU, and MIT built RAG chatbots over DIII-D and Alcator C-Mod text logs. They tested semantic search of experiments, device-specific operations help, and general tokamak questions. — [LLMs as Tools for Searching and Explaining Tokamak Shot Logs, IAEA workshop 2023](https://conferences.iaea.org/event/335/contributions/29396/); [Mehta et al., "Towards LLMs as Operational Copilots for Fusion Reactors", NeurIPS workshop 2023](https://openreview.net/forum?id=yGVChrbJ4E)
- DIII-D researchers have about 10 minutes between shots to find information and adjust. — [Princeton Engineering news, 2023](https://engineering.princeton.edu/news/2023/12/20/leveraging-language-models-fusion-energy-research)
- A 2024 review covers foundation models for experimental fusion tasks. — [Frontiers in Physics, 2024](https://www.frontiersin.org/journals/physics/articles/10.3389/fphy.2024.1531334/full)
- At JET, each disruption was analysed by hand and given a class from its chain of events. The paper calls the manual classification "rather ambiguous". — [Automatic Disruption Classification based on Manifold Learning, EUROfusion preprint](https://scipub.euro-fusion.org/wp-content/uploads/2014/11/EFDP13010.pdf)
- ADITYA shots were mostly labelled disruptive or not by hand. — [Automated labelling for ADITYA, 2024](https://www.tandfonline.com/doi/full/10.1080/10420150.2024.2378410)
- DECAF automates finding event chains that lead to disruptions. — [Disruption event characterization and forecasting in tokamaks, Phys. Plasmas 2023](https://pubs.aip.org/aip/pop/article/30/3/032506/2881804/Disruption-event-characterization-and-forecasting)
- DEFUSE builds the standard EUROfusion disruption database with an automated workflow. — [Pau et al., DEFUSE](https://infoscience.epfl.ch/server/api/core/bitstreams/970cd5cc-a409-43ed-ab92-7e86c2b9f169/content)
- DPRF, a random forest, ran in real time in the DIII-D plasma control system for more than 900 discharges. It gives a few hundred milliseconds of warning on average. — [Rea et al., Nuclear Fusion 2019](https://iopscience.iop.org/article/10.1088/1741-4326/ab28bf)
- New devices still build numeric real-time predictors. — [Real-time disruption prediction for EXL-50U, 2026](https://arxiv.org/html/2608.22720)

### Inferences

Usages, subfield **fusion operations**.

#### U30. Shot-log tagging and between-shot lookup gate
1. **Name / subfield**: tag shot-log entries and gate RAG answers. Tokamak session operations.
2. **Practice today**: RAG chatbots at DIII-D and C-Mod ([Mehta et al. 2023](https://openreview.net/forum?id=yGVChrbJ4E)).
3. **Pain point**: 10 minutes between shots. A generative answer takes many seconds and may be wrong.
4. **How Jev fits**: *screening at scale* and *select, do not generate*. Noul per past shot note: "Does this note describe the same problem as the current one?". Tags: Choice {H-mode access issue, impurity event, locked mode, diagnostics fault, ...}.
5. **Why cheap and fast**: thousands of past notes can be scored inside the shot gap.
6. **Evidence**: [IAEA 2023 talk](https://conferences.iaea.org/event/335/contributions/29396/); [Mehta et al. 2023](https://openreview.net/forum?id=yGVChrbJ4E).
7. **Fit**: Strong. Risk: shot numbers and times need exact lookup by code.

#### U31. Disruption-cause labelling
1. **Name / subfield**: assign a cause class to each disruption. Disruption databases.
2. **Practice today**: manual classes at JET ([EUROfusion preprint](https://scipub.euro-fusion.org/wp-content/uploads/2014/11/EFDP13010.pdf)). DECAF and DEFUSE automate the numeric event detection ([DECAF](https://pubs.aip.org/aip/pop/article/30/3/032506/2881804/Disruption-event-characterization-and-forecasting)).
3. **Pain point**: manual labels are ambiguous and slow. Operator notes go unused.
4. **How Jev fits**: *feature extractor* and *triage*. `state` = DECAF event-chain names in order (from code) plus operator notes. Choice over the class list {impurity influx, density limit, locked mode, vertical displacement event, ...}.
5. **Why cheap and fast**: whole multi-machine databases can be relabelled when the class scheme changes. Probabilities show where labels are ambiguous.
6. **Evidence**: [DECAF](https://pubs.aip.org/aip/pop/article/30/3/032506/2881804/Disruption-event-characterization-and-forecasting); [DEFUSE](https://infoscience.epfl.ch/server/api/core/bitstreams/970cd5cc-a409-43ed-ab92-7e86c2b9f169/content); [ADITYA](https://www.tandfonline.com/doi/full/10.1080/10420150.2024.2378410).
7. **Fit**: Medium. Risk: needs non-text input. Event order matters, which is mild multi-hop.

#### U32. Between-shot next-step choice
1. **Name / subfield**: suggest the next session action. Session leadership.
2. **Practice today**: the session leader decides from the plan, the last shot, and memory.
3. **Pain point**: time pressure and scarce experts.
4. **How Jev fits**: *supervisory layer*. Choice {repeat shot, go to next plan step, adjust gas or heating group, call expert}.
5. **Why cheap and fast**: it fits in the shot gap with time to spare.
6. **Evidence**: none beyond [Mehta et al. 2023](https://openreview.net/forum?id=yGVChrbJ4E) on copilots.
7. **Fit**: Speculative. Risk: the real decision depends on numeric traces.

### Gaps
- No NLP study on disruption-cause labels from operator notes was found.
- No source on fusion experiment-proposal triage was found. U21 and U33 cover the generic case.
- I did not find the plasma control system cycle time. "Sub-ms to ms" in the assignment stays unverified.

---

## 7. Synchrotron, neutron, and XFEL user facilities: proposals, safety forms, autonomous experiments

### Takeaway
ESRF has published a proposal topic classifier with honest, modest numbers, which shows both demand and headroom. Safety-form review is universal, manual, and closed-set, but I found no NLP paper on it. LLM beamline assistants exist and contain a routing step that Jev could own.

### Cited Findings
- ESRF classified experiment proposals with the OpenAlex topic model and plans a live service. Reviewer agreement had Krippendorff's alpha 0.572. 74.2% of proposals had at least one topic all reviewers accepted. Proposal-level precision was 56.0%, so the authors advise human oversight. — [Topic classification of synchrotron experiment proposals, J. Synchrotron Rad. 2026](https://journals.iucr.org/s/issues/2026/05/00/ye5084/index.html); [PubMed](https://pubmed.ncbi.nlm.nih.gov/42545790/)
- APS manages safety review through the Experiment Safety Assessment Form (ESAF), tied to a proposal and beam time request. — [APS Experiment Safety Overview](https://www.aps.anl.gov/Users-Information/Safety-Training/Experiment-Safety-Overview)
- ALS uses an ESAF as well. — [ALS ESAF](https://als.lbl.gov/experiment-safety-assessment-form-esaf/)
- NSLS-II Safety Approval Forms list materials, equipment, people, and a risk analysis. They are due 14 days before the experiment. Safety staff review them for hazards and controls. — [NSLS-II User Guide](https://www.bnl.gov/nsls2/userguide/before-arrival.php)
- VISION is a modular LLM assistant at NSLS-II beamline 11-BM. It ran the first voice-controlled experiment at an X-ray scattering beamline. — [VISION, MLST 2025](https://iopscience.iop.org/article/10.1088/2632-2153/add9e4); [BNL news](https://www.bnl.gov/newsroom/news.php?a=122449); [prototype paper](https://arxiv.org/html/2312.17180v1)
- Newer platforms make beamline control LLM-addressable or agent-driven. — [Lightfall, 2026](https://arxiv.org/html/2606.06711); [EAA, 2026](https://arxiv.org/pdf/2602.15294); [Modular framework for human-AI multi-beamline experiments, 2025](https://arxiv.org/pdf/2509.22959)
- Autonomous experiments close the loop with ML-based online analysis. — [Closing the loop, 2023](https://arxiv.org/pdf/2306.11899)

### Inferences

Usages, subfield **user-facility operations**.

#### U33. Beam-time proposal topic and panel routing
1. **Name / subfield**: label proposals by topic, technique, and panel. User office.
2. **Practice today**: user-office staff and panels. ESRF pilots the OpenAlex model ([ESRF 2026](https://journals.iucr.org/s/issues/2026/05/00/ye5084/index.html)).
3. **Pain point**: 56.0% proposal-level precision is too low for automation.
4. **How Jev fits**: *triage / router*. One Noul per candidate topic with a written definition. Calibrated thresholds trade precision for recall.
5. **Why cheap and fast**: a live service can answer while the user fills the form.
6. **Evidence**: [ESRF 2026](https://journals.iucr.org/s/issues/2026/05/00/ye5084/index.html); [PACMan](https://iopscience.iop.org/article/10.3847/1538-3881/aa6112).
7. **Fit**: Strong. Risk: hundreds of topics. Code should shortlist first.

#### U34. Experiment safety form hazard screening
1. **Name / subfield**: flag hazard classes in safety forms and route to the right reviewer. Facility safety.
2. **Practice today**: ESAF or SAF per experiment, read by safety staff ([APS](https://www.aps.anl.gov/Users-Information/Safety-Training/Experiment-Safety-Overview); [NSLS-II](https://www.bnl.gov/nsls2/userguide/before-arrival.php)).
3. **Pain point**: every experiment needs one. Deadlines are fixed. Few safety officers.
4. **How Jev fits**: *triage / router* and *clause-by-clause compliance check*. Nouls per hazard: "Describes a nanomaterial", "Uses flammable or toxic gas", "Involves biological material", "Uses a high-pressure cell", "Uses a Class 3B or 4 laser". Score for overall review level.
5. **Why cheap and fast**: users get instant feedback at submit time. Reviewers get a sorted queue. Cost is near zero.
6. **Evidence**: practice pages only. **No NLP study on facility safety forms was found.**
7. **Fit**: Strong as a pre-screen. Risk: safety-critical. A human reviewer must still approve every form. Jev may only add flags, never remove review.

#### U35. Declared-versus-described sample hazard check
1. **Name / subfield**: compare tick boxes with the free-text sample description. Facility safety.
2. **Practice today**: reviewers read both and ask the user.
3. **Pain point**: users under-declare by mistake. For example, a text names a toxic compound but the "toxic" box is empty.
4. **How Jev fits**: *verifier*. Noul "Does the description imply a hazard of class X?". Code compares the result with the box.
5. **Why cheap and fast**: every form, every revision.
6. **Evidence**: none found. Chemical hazard lookup (CAS numbers, GHS classes) must be done by code.
7. **Fit**: Medium. Risk: exact lookups are outside Jev.

#### U36. Supervisory next-action choice in autonomous experiments
1. **Name / subfield**: choose the next step from a closed set. Beamline automation.
2. **Practice today**: Bayesian optimisation or ML analysis loops ([Closing the loop](https://arxiv.org/pdf/2306.11899)). LLM agents plan in VISION-like tools ([VISION](https://iopscience.iop.org/article/10.1088/2632-2153/add9e4)).
3. **Pain point**: a large LLM per step is slow and costly. Scans produce decisions every few seconds.
4. **How Jev fits**: *supervisory layer over numeric control*. Code and ML produce named results ("peak found: yes", "signal-to-noise: low", "beam damage sign: yes"). Choice {continue scan, raise exposure, move to next sample, stop and ask the user}.
5. **Why cheap and fast**: a decision per frame is possible without slowing the scan.
6. **Evidence**: [VISION](https://iopscience.iop.org/article/10.1088/2632-2153/add9e4); [EAA](https://arxiv.org/pdf/2602.15294); [Lightfall](https://arxiv.org/html/2606.06711).
7. **Fit**: Medium. Risk: needs non-text input. The value depends on good upstream buckets.

#### U37. Intent router for natural-language beamline assistants
1. **Name / subfield**: classify the user's spoken or typed request. Beamline assistants.
2. **Practice today**: VISION is modular, and a step decides which module handles the input ([VISION](https://iopscience.iop.org/article/10.1088/2632-2153/add9e4); module details are from memory, unverified).
3. **Pain point**: latency matters in voice control. A wrong route can run the wrong command.
4. **How Jev fits**: *triage / router*. Choice {instrument operation, data analysis, note for the logbook, question, unclear}. Noul "Would this command move hardware?".
5. **Why cheap and fast**: under 100 ms keeps voice control fluid.
6. **Evidence**: [VISION](https://iopscience.iop.org/article/10.1088/2632-2153/add9e4); [prototype](https://arxiv.org/html/2312.17180v1).
7. **Fit**: Strong.

### Gaps
- No count of safety forms per year at any facility was found.
- CALMS (an APS LLM assistant) appeared only in a search summary. I did not confirm its paper or URL.
- No neutron-facility-specific source was found. The usages carry over by analogy.

---

## 8. General lab practice: lab notebooks, equipment faults, calibration records, FAIR metadata

### Takeaway
The evidence base is thinner here and comes mostly from neighbouring fields (maintenance engineering, chemistry ELNs). The tasks are still clean fits: short text, closed answer sets, large backlogs, and a person in the loop.

### Cited Findings
- LISTER extracts metadata semi-automatically from annotated eLabFTW experiment notes. — [LISTER, J. Chem. Inf. Model. 2023](https://pubs.acs.org/doi/abs/10.1021/acs.jcim.3c00744)
- Physics-LLM is a German ErUM-Data project. It aims at AI-supported metadata enrichment and semantic search across research data and electronic lab notebooks. — [Lamarr Institute news](https://lamarr-institute.org/news/physics-llm/)
- Physics lab courses now teach ELNs and FAIR data handling. — [Eur. J. Phys. article](https://iopscience.iop.org/article/10.1088/1361-6404/ae7489)
- INSPIRE is adding ML to content selection with TIB, and keeps human experts in the loop for quality-sensitive tasks. It links HEPData records to papers. — [Ensuring continued operation of INSPIRE, 2025](https://arxiv.org/abs/2505.03860)
- Technical Language Processing was used to classify failure events for safety-critical equipment. — [PHM Society European Conference paper](https://papers.phmsociety.org/index.php/phme/article/view/2792)
- MITRA is a RAG assistant for knowledge retrieval in physics collaborations. — [MITRA, 2026](https://arxiv.org/html/2603.09800)

### Inferences

Usages, subfield **laboratory practice**.

#### U38. Lab-notebook entry tagging and metadata completeness
1. **Name / subfield**: tag ELN entries and check required metadata. University and facility labs.
2. **Practice today**: eLabFTW-style ELNs with manual tags. LISTER needs author annotations ([LISTER](https://pubs.acs.org/doi/abs/10.1021/acs.jcim.3c00744)).
3. **Pain point**: people skip metadata. FAIR reuse then fails.
4. **How Jev fits**: *feature extractor* and *compliance check*. Nouls: "States the sample identifier", "States the instrument settings", "States the calibration used". Choice for experiment type.
5. **Why cheap and fast**: the check runs on save. A whole group's notebook history costs cents.
6. **Evidence**: [LISTER](https://pubs.acs.org/doi/abs/10.1021/acs.jcim.3c00744); [Physics-LLM](https://lamarr-institute.org/news/physics-llm/).
7. **Fit**: Strong.

#### U39. Equipment fault and maintenance work-order coding
1. **Name / subfield**: code maintenance tickets by failure mode. Lab and facility technical services.
2. **Practice today**: free-text work orders. TLP methods from NIST ([TLP](https://www.nist.gov/publications/technical-language-processing-unlocking-maintenance-knowledge)).
3. **Pain point**: failure-rate statistics need consistent codes. Expert labelling is slow ([NIST KPI study](https://www.nist.gov/publications/kpi-extraction-maintenance-work-orders-comparison-expert-labeling-text-classification)).
4. **How Jev fits**: *triage / router*. Choice over failure modes {leak, electrical, mechanical wear, controls or software, contamination, operator error, unknown}.
5. **Why cheap and fast**: backfill of decades of tickets. Live coding at ticket entry.
6. **Evidence**: [LLMs for failure mode classification](https://arxiv.org/pdf/2309.08181); [PHM Society paper](https://papers.phmsociety.org/index.php/phme/article/view/2792).
7. **Fit**: Strong. Overlaps with the Engineering field.

#### U40. Calibration-record and procedure compliance check
1. **Name / subfield**: check that records contain every required element. Calibration and quality systems.
2. **Practice today**: ISO/IEC 17025 lists required content for calibration reports (unverified in this session, recalled from the standard). Quality staff audit samples.
3. **Pain point**: audits cover a sample only.
4. **How Jev fits**: *clause-by-clause compliance check*. One Noul per required element: "Identifies the method used", "States the measurement uncertainty", "Identifies the item calibrated".
5. **Why cheap and fast**: 100% of records get checked, not a sample.
6. **Evidence**: none found for physics labs.
7. **Fit**: Medium. Risk: numeric. Jev checks that a value is stated. Code checks that the value is within tolerance.

Also noted, not counted as a separate usage:
- **HEPData and Zenodo submission checks**: Nouls such as "Does the table description name the observable and the units?". INSPIRE's human-in-the-loop ML stance supports this pattern ([INSPIRE 2025](https://arxiv.org/abs/2505.03860)). Fit: Medium. No NLP study on HEPData curation was found.

### Gaps
- No physics-specific study of ELN tagging with LLMs was found.
- The ISO/IEC 17025 clause content was not checked online.
- No HEPData curation workload numbers were found.

---

## 9. Cross-cutting deliverables: Top 5, Poor fits, New roles

### Takeaway
The best value sits where facilities already pay experts to read short technical text and pick from a fixed list: fault coding, run certification, circulars, safety forms, and logbooks. The poor fits all fail on the same two points: numeric or image input, and latency below a millisecond.

### Cited Findings
- L1 triggers need about 4 µs latency at 40 MHz. — [hls4ml RNN paper](https://arxiv.org/pdf/2207.00559)
- Broker classifiers work on computed light-curve features and image stamps. — [ALeRCE light-curve classifier](https://iopscience.iop.org/article/10.3847/1538-3881/abd5c1); [ALeRCE stamp classifier](https://iopscience.iop.org/article/10.3847/1538-3881/ac0ef1)
- Real-time disruption predictors run inside the plasma control system on numeric signals. — [Rea et al. 2019](https://iopscience.iop.org/article/10.1088/1741-4326/ab28bf)
- Gravity Spy classifies time-frequency images. — [Gravity Spy](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5927381/)
- DQM anomaly detection uses autoencoders and statistical tests on histograms. — [AutoDQM](https://arxiv.org/abs/2501.13789)
- TF-IDF beat GPT-4o mini at finding expert reviewers (79.5% vs 51.5%). — [Amado Olivo et al. 2026](https://arxiv.org/abs/2605.18752)
- The most error-prone fields in LLM circular extraction were timing and facility attribution. — [Astro-COLIBRI 2026](https://arxiv.org/html/2608.23270)

### Inferences

**Top 5 by likely value**

1. **U2 + U3, fault and downtime cause coding with recurring-fault linking.** Machine availability is the main cost driver of big facilities. The text is short, the taxonomy is closed, and expert review already exists as the safety net.
2. **U8 + U9 + U10, run-certification support over named defects and comments.** The experiments themselves call the workflow manual and error-prone. The answer set is tiny, and human sign-off stays.
3. **U17 + U18, circular classification and select-style extraction.** Two 2026 papers prove the task at 96-99% with generative LLMs. Jev can do the closed-set part faster and cheaper, and can verify the rest.
4. **U34, safety form hazard screening.** Every experiment at every user facility needs one. Hazard classes are closed. Jev only adds flags, so errors are recoverable. Evidence is thin, so this is a bet on a clean fit.
5. **U1 + U6 + U26 + U30, logbook tagging and RAG gating across accelerators, GW detectors, and tokamaks.** Million-entry corpora, a backfill for about $30, and a direct answer to the jargon and accuracy problems the labs report.

Runners-up: U27 (GW event validation), U7 (action gate for agents), U13 (semantic predicates in DAQ expert systems).

**Poor fits**

- **Hardware triggers (L1, FPGA, hls4ml).** Budget is about 4 µs. Jev needs 100 ms today, which is about 25,000 times too slow. Input is numeric detector data, so it fails twice.
- **High-level trigger event selection.** Input is numeric event data. No text exists to judge.
- **Alert-broker classification (ALeRCE, Fink, ANTARES, Lasair, AMPEL).** Input is light-curve features and image stamps. Bucketing the features into words would discard the information the random forests use. Only the fusion of several brokers' named outputs could suit Jev, and that is speculative.
- **Real-time disruption prediction.** Numeric signals inside the control loop. Warning times are hundreds of milliseconds, so a 100 ms call would eat the margin.
- **DQM histogram anomaly detection and glitch image classification.** Numeric and image input. Jev belongs after these tools, not in place of them.
- **Beam tuning and optimisation.** This is numeric search. Kaiser et al. show LLMs can do it, but I recall they did not beat Bayesian optimisation or reinforcement learning (unverified).
- **Machine protection, interlocks, and personnel safety systems.** These must be deterministic and certified. A probabilistic text model has no place there.
- **Anything that compares times.** Examples: "Which entry falls inside the fault window?" or "Was the calibration still valid?". Jev is weak at date and time comparison. Code must do it.
- **Fine-grained reviewer expertise matching.** TF-IDF beat a generative model because subfield vocabulary matters more than meaning. Use Jev for panel sorting and conflict flags only.
- **Scientific-merit ranking of proposals.** The text comes from an interested party, so it is adversarial by nature. Fairness rules also require human judgment.
- **Reading numeric values out of circulars unaided.** Jev does not generate text. Code must find the spans, and Jev may only select among them.

**New roles the catalogue lacks**

- **Abstention gate for RAG assistants.** A Noul decides whether the retrieved text answers the question at all. Below the threshold, the assistant says "no answer found" and escalates. Control rooms need this more than fluent answers (U6).
- **Declared-versus-described consistency auditor.** Compare a structured field (tick box, flag, category) with the free text beside it. Examples: safety forms (U35), DQ flags versus comments (U10). It is a verifier, but the target is a record, not an output.
- **Action gate for agentic control.** An independent, cheap model checks every step an LLM agent plans before it touches hardware (U7). It works because it does not share the agent's failure modes.
- **Post-classifier interpreter.** Jev sits after a numeric or image model and turns its named labels plus context text into a cause or an action (U11, U28, U36). This is a specific, repeatable form of the supervisory layer.

### Gaps
- No source in this subtopic tests a small, calibrated, closed-set text model against a generative LLM on the same task. All fit ratings are my inference.
- Calibration claims for Jev come from the brief. I did not test them.
- I exceeded the suggested tool-call budget because the scope covered eight subfields. Several sources were read as abstracts or search summaries only. These are marked in each section's Gaps.
