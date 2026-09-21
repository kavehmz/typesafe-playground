# Jev usages in the chemical industry, subtopic A: process safety, operations, asset integrity, GMP, regulatory, stewardship, supply chain

Reader notes:

- 40 usages, numbered U1 to U40, grouped under the 9 key questions. The last section holds Top 5, Poor fits, New roles, and latency fit.
- Each usage has the 7 brief fields: name and subfield (heading), Practice, Pain, Jev fit, Why cheap+fast, Evidence, Rating.
- Source status legend:
  - No mark: URL opened, or returned by search with a matching summary, in this session (Sept 2026).
  - † : well-known landing page cited from memory. Not opened this session. Verify before publishing.
  - "unverified": detail recalled from memory (authors, year). Title and URL are real unless stated.
- Cost figures are my arithmetic from the brief's price ($0.04 per million input tokens). They are estimates, not vendor quotes.
- Safety rule used everywhere: Jev is advisory, screening, or second-check. A person signs. Jev is never a credited barrier.

---

## KQ1. Hazard studies: HAZOP, LOPA, bow-tie, What-If, SIL determination

### Takeaway
HAZOP automation has a 30-year history and recent LLM trials show fluent but mostly invalid scenarios (19-37% valid). The gap is a cheap verifier and pruner, which is a closed-set judgment. BERT-class classifiers already predict HAZOP severity, deviations, and recommendation classes from worksheet text.

### Cited Findings
- HAZOP finds deviations from design intent, their causes, and consequences. It is slow, knowledge-heavy, and prone to human error, so automation has a strong incentive. — [Ekramipooya et al., PSEP 2023 (authors unverified)](https://www.sciencedirect.com/science/article/abs/pii/S0957582023004846)
- Four LLMs (GPT-4o, GPT-4o-mini, Llama, Gemini) ran full HAZOP without human help. Text similarity to expert output was high. Only 19-37% of generated accident scenarios were valid. Safeguards were mostly procedural. Conclusion: support tool, not replacement. — ["Can large language models automate the HAZOP process without human intervention?", Safety Science 2025 (authors not verified)](https://www.sciencedirect.com/science/article/abs/pii/S0925753525002644)
- An IChemE Hazards 34 paper reviewed 18 HAZOP software tools for automation level and AI use (LLMs, prompt engineering, qualitative reasoning). Named challenges: hallucination, reduced accuracy, time, cost. — [Elhosary et al., "Evaluation of AI-assisted HAZOP Software Tools", Hazards 34 paper 175 (year 2024 unverified)](https://www.icheme.org/media/27631/hazards-34-paper-175-elhosary-revised.pdf)
- NLP plus ML classifiers predict the deviation field of a HAZOP worksheet from other fields. Performance depends on the quality of past HAZOP reports. — [PSEP 2023](https://www.sciencedirect.com/science/article/abs/pii/S0957582023004846)
- BERT embeddings plus clustering and classification predict the recommendation class from cause and consequence text. — ["Predicting possible recommendations ... BERT, clustering, and classification", J. Loss Prev. Process Ind. 2024](https://www.sciencedirect.com/science/article/abs/pii/S0950423024000688)
- BERT-based models have classified the severity of consequences in HAZOP reports. — ["Application of natural language processing in HAZOP reports", PSEP 2021](https://www.sciencedirect.com/science/article/abs/pii/S0957582021004675)
- A 2026 paper builds an explainable expert system that sets HAZOP risk level from worksheet text using sentiment analysis. — [J. Loss Prev. Process Ind. 2026](https://www.sciencedirect.com/science/article/pii/S0950423026001749)
- A 2025 open-access paper compares NLP algorithms for HAZOP. — ["Evaluating Natural Language Processing Algorithms for Improved Hazard and Operability Analysis", 2025](https://www.sciencedirect.com/science/article/pii/S3050483X25000255)
- An IPL must be independent of other layers and its function must be capable of validation. Its strength is a PFD number. — [Wikipedia, Layers of protection analysis](https://en.wikipedia.org/wiki/Layers_of_protection_analysis)
- A knowledge graph plus a constrained LLM generated cause-and-effect matrices, interlocks, and alarm rationalization tables for a modular plant. — [Vyas, Gill, Mercangöz, arXiv 2606.31614, June 2026](https://arxiv.org/abs/2606.31614)
- A multi-agent LLM control architecture maps to IEC 61511 and LOPA. Its verification agent acts "IPL-like" but the authors say it must not be credited as a formal IPL or given a SIL without certification. — ["Safe integration of Large Language Models into industrial process control", Autonomous Intelligent Systems 2026 (search summary only; page not opened)](https://link.springer.com/article/10.1007/s43684-026-00136-1)
- Vendors already ship LLM HAZOP assistants. — [Kenexis webinar](https://www.kenexis.com/recorded-webinar-using-large-language-models-ai-for-hazop-automation-and-augmentation-tool/); [AIChE 2025 talk on knowledge-graph-enhanced LLM for HAZOP conclusions](https://aiche.confex.com/aiche/2025/prelim.cgi/Paper/711372)
- Review of earlier automation. — ["Automated HAZOP revisited", PSEP 2017 (author J.R. Taylor, unverified)](https://www.researchgate.net/publication/319984309_Automated_HAZOP_revisited)
- Standards: HAZOP guide IEC 61882 — [Wikipedia HAZOP †](https://en.wikipedia.org/wiki/Hazard_and_operability_study); SIS lifecycle IEC 61511 — [Wikipedia IEC 61511 †](https://en.wikipedia.org/wiki/IEC_61511).

### Inferences

History, from memory and unverified: HAZOPExpert (Venkatasubramanian and Vaidhyanathan, AIChE J. 1994), signed-digraph HAZOP models (Vaidhyanathan and Venkatasubramanian, 1995), PHASuite (Zhao, Bhushan, Venkatasubramanian, PSEP 2005). All used hand-built qualitative causal models. Their limit was the knowledge-acquisition bottleneck and over-generation of implausible scenarios. That is the slot for a semantic pruner.

#### U1. HAZOP cause-plausibility pruning (hazard studies)
- Practice: Team applies guidewords per node under IEC 61882. Auto-HAZOP tools (digraph, PHASuite-style) enumerate deviation-cause pairs.
- Pain: Enumeration over-generates. LLM generation is only 19-37% valid. Expert time is the scarce resource.
- Jev fit: Heuristic inside a search loop. State: node description, equipment list, and fluid as text (code or another model converts the P&ID first). Noul: "Can 'control valve FV-101 fails closed' credibly cause 'no flow' in this node?" Keep high-probability pairs for the team.
- Why cheap+fast: 100 nodes × 20 deviations × 50 candidate causes = 100k judgments. At 1k tokens each that is about $4. Re-run after every design revision.
- Evidence: Safety Science 2025 validity gap; PSEP 2023 deviation prediction. Links above.
- Rating: Medium. Risks: needs non-text input (P&ID), missed credible causes. Use as ranker, never as filter of record. Team owns the worksheet.

#### U2. Consequence severity category (hazard studies)
- Practice: Each scenario gets a severity level from the company risk matrix (IEC 61882, CCPS LOPA).
- Pain: Levels drift between teams, sites, and years. Revalidation (5-yearly under OSHA PSM) inherits the drift.
- Jev fit: Score over the matrix's described levels. State: consequence text plus named buckets from code (inventory bucket, toxicity class, occupancy). Question: "Which severity level fits this consequence?" Compare with the team's level. Flag gaps of 2+ levels.
- Why cheap+fast: Whole legacy PHA library (tens of thousands of rows) re-scored for a few dollars. Gives a consistency audit no one staffs today.
- Evidence: BERT severity classification of HAZOP text (PSEP 2021); sentiment-based risk level system (JLPPI 2026).
- Rating: Strong as consistency check. Risk: severity often hinges on numbers (release size). Code must bucket them.

#### U3. HAZOP and What-If worksheet verifier (hazard studies)
- Practice: Facilitator and scribe QA the worksheet. CCPS and IEC 61882 list quality criteria (safeguard must act on the stated cause-consequence pair; recommendation must be specific and actionable).
- Pain: QA is manual and skipped under time pressure. LLM-drafted rows add volume.
- Jev fit: Verifier / process-reward model. Independent Nouls per row: "Does this safeguard prevent or mitigate this specific consequence?", "Is the safeguard the same device as the cause (not independent)?", "Is the recommendation specific enough to close out?", "Is a similar node elsewhere missing this scenario?"
- Why cheap+fast: 5 Nouls × 5,000 rows is a few dollars and minutes. Can run live in the meeting as the scribe types (100 ms).
- Evidence: Recommendation-class prediction (JLPPI 2024); LLM validity gap (Safety Science 2025); Hazards 34 tool review lists hallucination as the main risk.
- Rating: Strong. Risk: multi-hop (safeguard acts upstream of the node). Keep each Noul single-hop.

#### U4. LOPA IPL independence and validity second-check (hazard studies)
- Practice: CCPS LOPA credits a layer only if it is independent, specific, dependable, auditable.
- Pain: Double-counting is a classic LOPA error (BPCS loop credited as both initiating cause and IPL; shared sensor or valve).
- Jev fit: Clause-by-clause compliance check. State: scenario row with tag lists extracted by code. Nouls per IPL rule. Code does the PFD arithmetic and tag-overlap lookup. Jev judges the semantic cases ("operator response to alarm" credited with no stated time to respond).
- Why cheap+fast: Every LOPA row at every revalidation, not a sample.
- Evidence: No direct published NLP-on-LOPA study found. IPL rules are well defined ([LOPA](https://en.wikipedia.org/wiki/Layers_of_protection_analysis)).
- Rating: Medium. Risks: numeric (PFD, SIL gap stay in code), safety-critical. Output is a review flag only.

#### U5. SIF and cause-and-effect specification consistency (SIL / IEC 61511)
- Practice: IEC 61511 needs a safety requirements specification per SIF. C&E matrices and alarm tables are built by hand from PHA outputs.
- Pain: Hand transfer causes mismatches between HAZOP safeguard text, SRS, and C&E.
- Jev fit: Entity / record alignment plus clause check. Nouls: "Does SRS entry X describe the same function as HAZOP safeguard Y?", "Does the SRS state the safe state?", "Does it state the response time requirement?" (presence, not value).
- Why cheap+fast: All-pairs matching across thousands of rows is cheap.
- Evidence: Vyas et al. 2026 automate C&E and alarm tables from a knowledge graph plus constrained LLM ([arXiv 2606.31614](https://arxiv.org/abs/2606.31614)).
- Rating: Medium. Risk: safety-critical. IEC 61511 requires competent-person verification and functional safety assessment. Jev adds a check; it replaces none.

### Gaps
- No paper found that tests a calibrated classifier as a verifier of LLM-generated HAZOP rows. This is an open experiment.
- Authors of the Safety Science 2025 paper and year of Hazards 34 not verified (ScienceDirect returned 403; PDF was binary).
- "The Competence Shadow: Theory and Bounds of AI Assistance in Safety Engineering" ([arXiv 2603.25197](https://arxiv.org/pdf/2603.25197)) appeared in search. Not opened. May hold limits relevant to AI-assisted PHA.
- No evidence found for NLP on bow-tie barrier quality.

---

## KQ2. Management of change and PSM: replacement in kind, PSSR, permits, procedures, handover, audits

### Takeaway
"Is this a replacement in kind?" is a regulated yes/no gate that is often misjudged and applies to every work order. It is the cleanest Jev fit in this subtopic. Published NLP evidence for MOC, permits, and handover is thin, so ratings rest on analogy to work-order and incident NLP.

### Cited Findings
- OSHA PSM requires written procedures to manage changes, except replacements in kind, to process chemicals, technology, equipment, procedures, and facilities. — [29 CFR 1910.119](https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.119)
- "Replacement in kind" means a replacement that satisfies the design specification. — [29 CFR 1910.119(b)](https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.119)
- Practitioner guidance calls misclassifying a change as replacement in kind one of the most common MOC failures, and says auditors challenge that determination first. — [Ecesis PSM MOC guide (vendor source)](https://www.ecesis.net/PSM-Software/management-of-change-psm.aspx)
- A worked industry example debates whether a condenser change is a replacement in kind. — [TAO Compliance](https://taocompliance.com/?p=1008)
- OSHA has issued interpretation letters on MOC scope, including organizational change. — [OSHA interpretation 2009-03-31](https://www.osha.gov/laws-regs/standardinterpretations/2009-03-31-0)
- Hot work is involved in more than 50% of large chemical and hazardous-chemical accidents in China. A BERT classifier of hot-work accident causes reached accuracy 0.9878 and macro-F1 0.7792. — ["Cause analysis of hot work accidents based on text mining and deep learning", JLPPI 2022](https://www.sciencedirect.com/science/article/abs/pii/S0950423022000249)
- A permit-to-work form covers scope, hazards, controls, isolations, roles, validity, and handover rules. Permit and shift handover must be coordinated. — [DNV guide to PTW systems](https://www.dnv.com/article/a-complete-guide-to-permit-to-work-ptw-systems/); [IntelliPERMIT](https://www.intellipermit.com/blog/shift-handover-and-the-permit-to-work/)
- A 2026 paper re-examines permit-to-work, procedures, and communication as risk controls and finds gaps in handover communication. — ["When more becomes less", 2026 (search summary only)](https://www.sciencedirect.com/science/article/pii/S2949926726000181)
- EU major-hazard sites fall under Seveso III. — [Directive 2012/18/EU †](https://eur-lex.europa.eu/eli/dir/2012/18/oj). CCPS Risk Based Process Safety lists 20 elements. — [CCPS RBPS †](https://www.aiche.org/ccps/resources/publications/books/guidelines-risk-based-process-safety)

### Inferences

#### U6. Replacement-in-kind screen and MOC impact routing on every work order (MOC)
- Practice: 1910.119(l), Seveso III safety management system, CCPS RBPS "management of change". A person decides RIK or not. If not, a checklist routes the change to reviews (PHA update, PSI update, procedures, training, PSSR).
- Pain: The gate sits on thousands of maintenance work orders per site per year. Misjudged RIK bypasses hazard review.
- Jev fit: Semantic predicate in a rule engine. State: work-order text, old and new item specs as fields (code diffs the numeric specs and passes "rating: same / lower / higher"). Noul: "Does the new item meet the original design specification in every stated respect?" Then parallel Nouls for routing: "Does this change alter operating limits?", "Does it touch a safety instrumented function?", "Does it change materials of construction?"
- Why cheap+fast: 1M work orders × 300 tokens is about $12. Screen 100% of orders at creation time (100 ms inside the CMMS form). Threshold set so "RIK" needs high probability; everything else goes to the MOC coordinator.
- Evidence: No published NLP study on RIK found. Failure-mode classification on work-order text works: fine-tuned GPT-3.5 F1 0.80 vs baseline 0.60 vs zero-shot 0.46 ([Stewart, Hodkiewicz, Li 2023](https://arxiv.org/abs/2309.08181)).
- Rating: Strong. Risks: numeric spec comparison (keep in code), terse work-order jargon, safety-critical. Jev can only add MOC reviews, never waive one without a person.

#### U7. Pre-startup safety review and PSM audit evidence check (PSM)
- Practice: 1910.119(i) PSSR confirms construction per design, procedures in place, PHA done, training done. 1910.119(o) needs a compliance audit at least every 3 years.
- Pain: Auditors sample. Evidence packs are large and textual.
- Jev fit: Clause-by-clause compliance check. State: one evidence item plus one requirement. Noul: "Does this document show that operators were trained on the change before startup?" Score: evidence strength (none / weak / adequate).
- Why cheap+fast: Check every MOC and every PSSR, not a 5% sample. Continuous audit readiness.
- Evidence: No domain paper found. Analogous clause classification in regulation text: GPT-4o fine-tuned 89% precision, 87% recall ([Hassani, Sabetzadeh, Amyot 2025](https://arxiv.org/abs/2501.14683)).
- Rating: Medium. Risk: dates ("before startup") are a Jev weak spot. Code compares dates and passes "training date: before startup".

#### U8. Permit-to-work conflict and SIMOPS screen (operations)
- Practice: Permit issuer checks each new permit against live permits, isolations, and area hazards.
- Pain: Conflicts are semantic (hot work near an open line-break; isolation removed while a job depends on it). Keyword rules miss them. Piper Alpha is the textbook case (from memory, unsourced).
- Jev fit: Entity / record alignment, pairwise. Code pre-filters by area and time window. Noul per pair: "Could job A create an ignition source, release, or loss of isolation that endangers job B?"
- Why cheap+fast: 200 live permits means up to 19,900 pairs per refresh. After area pre-filter, a few hundred pairs at under 1 cent. Re-check on every permit change in real time.
- Evidence: Hot-work accident cause classification with BERT (JLPPI 2022, above). No PTW-conflict NLP paper found.
- Rating: Medium. Risks: location reasoning is weak in text; safety-critical. Advisory flag to the issuer only.

#### U9. Operating-procedure quality and completeness check (PSM)
- Practice: 1910.119(f) lists required procedure content: each operating phase, operating limits, consequences of deviation, steps to correct, safety systems. Annual certification that procedures are current.
- Pain: Thousands of procedures per site. Annual certification is often a signature exercise.
- Jev fit: Clause-by-clause check per procedure section. Nouls: "Does this procedure state the consequence of exceeding the limit?", "Does any step hold more than one action?", "Is a warning placed after the step it applies to?"
- Why cheap+fast: Full library re-checked after each MOC for cents.
- Evidence: No process-industry paper found. Regulatory-provision classification results (Hassani 2025) are the nearest analogue.
- Rating: Strong. Risk: long documents; chunk per section to avoid large-state accuracy loss.

#### U10. Shift-handover and operator-log triage (operations)
- Practice: Structured shift handover is standard guidance (HSE HSG48, CCPS conduct of operations; from memory, unsourced).
- Pain: Logs are free text. Bypassed safeguards, standing alarms, and temporary fixes get buried.
- Jev fit: Triage / router plus feature extractor. Nouls per entry: "Does this entry report a bypassed or inhibited safety device?", "Does it describe an abnormal condition still open at end of shift?" Probabilities feed a leading-indicator dashboard.
- Why cheap+fast: Score each entry as typed. Prompt the writer at once when a bypass is mentioned with no authorisation reference.
- Evidence: 2026 paper reports persistent handover communication gaps ([link](https://www.sciencedirect.com/science/article/pii/S2949926726000181)). No NLP study on chemical-plant logs found.
- Rating: Medium. Risk: jargon, abbreviations, non-English text.

### Gaps
- No published dataset or benchmark for MOC / RIK decisions. A labelled set would be a first.
- No source opened for HSE HSG48 or CCPS conduct-of-operations guidance.
- The 3-year audit interval and PSSR content are from 1910.119 text as I recall it; the OSHA page was returned by search but not opened.

---

## KQ3. Incident learning: classification and retrieval across CSB, eMARS, IChemE, ARIA, company near-miss data

### Takeaway
This is the best-evidenced area. BERT-class models already code causes in chemical accident text with high accuracy, and a 2025 paper adds conformal prediction for trustworthy codes, which matches Jev's calibrated output. The unmet need is matching lessons to planned work at the moment of planning.

### Cited Findings
- Public databases (eMARS, IChemE, EPA RMP, OSHA, CSB) each lack fields and score severity inconsistently. None supports full analysis alone. — ["Factors contributing to US chemical plant process safety incidents from 2010 to 2020", JLPPI 2021](https://www.sciencedirect.com/science/article/abs/pii/S0950423021001212)
- A study of CSB investigations coded 17 causal factors: 12 chemical indicators and 5 process indicators. — ["What can the trove of CSB incident investigations teach us?", JLPPI 2021](https://www.sciencedirect.com/science/article/abs/pii/S0950423021000012)
- NLP and text mining identified causes and contributing factors in pipeline incident narratives. — [PSEP 2021](https://www.sciencedirect.com/science/article/abs/pii/S0957582021002779)
- BERT classification of hot-work accident causes: accuracy 0.9878, macro-F1 0.7792. — [JLPPI 2022](https://www.sciencedirect.com/science/article/abs/pii/S0950423022000249)
- A RoBERTa-BiLSTM-Attention-CRF pipeline mines hazardous-chemical accident reports. — ["Automated information mining in hazardous chemical accident reporting", JLPPI 2025](https://www.sciencedirect.com/science/article/abs/pii/S0950423025001184)
- Risk factors were extracted from Chinese chemical accident reports. — [Chinese J. Chem. Eng. 2023](https://www.sciencedirect.com/science/article/abs/pii/S1004954123000848)
- NLP found hazard patterns across severe chemical accidents in China, 2011-2023. — [Gao et al., Process Safety Progress 2025](https://aiche.onlinelibrary.wiley.com/doi/10.1002/prs.70013?af=R)
- A decision-support system couples accident narratives with conformal prediction for trustworthy accident-code classification. — [PSEP 2025](https://www.sciencedirect.com/science/article/abs/pii/S0957582025014016)
- BERT embeddings predict "elements of incident path" from process safety reports. — [Springer chapter](https://link.springer.com/chapter/10.1007/978-981-95-6179-7_5)
- NLP was applied to spill and leak reports in an E&P company to find causes and cut spill frequency. — [PSEP 2024](https://www.sciencedirect.com/science/article/abs/pii/S0957582024002118)
- Scoping review: NLP can classify occurrence reports and extract causes and consequences. — [Safety (MDPI) 2023](https://www.mdpi.com/2313-576X/9/2/22)
- US context: 197 substantial property-damage cases, 227 serious injuries, 57 fatalities from accidental releases between April 2020 and July 2024. — [ChEmREF, arXiv 2511.10027](https://arxiv.org/pdf/2511.10027)
- Sources: [CSB †](https://www.csb.gov/), [eMARS †](https://emars.jrc.ec.europa.eu/), [API RP 754 †](https://www.api.org/oil-and-natural-gas/health-and-safety/refinery-and-plant-safety/process-safety/process-safety-standards/rp-754).

### Inferences

#### U11. Causal-factor and RBPS-element coding of incidents and near-misses (incident learning)
- Practice: Investigators code each event against a taxonomy (CCPS RBPS elements, company cause trees, the 17 CSB-derived factors).
- Pain: Coding is inconsistent and slow. Near-miss volumes are large. Taxonomies change, and old records never get re-coded.
- Jev fit: Feature extractor plus screening at scale. One Noul per causal factor over the narrative, run in parallel. Output is a calibrated probability vector per record.
- Why cheap+fast: 500k records × 600 tokens is about $12. Re-code the whole history each time the taxonomy changes. Low-confidence records go to a person.
- Evidence: JLPPI 2022 BERT; JLPPI 2025; PSEP 2025 conformal; PSEP 2021 pipeline. Links above.
- Rating: Strong. Risk: long reports (CSB reports run 100+ pages). Code chunks by section.

#### U12. Lessons-learned matching to planned work (incident learning)
- Practice: CCPS RBPS "incident investigation" and "measurement and metrics" call for sharing lessons. In practice, lessons sit in databases and bulletins.
- Pain: Keyword search fails ("line break" vs "opening process equipment"). Nobody searches at the moment of need.
- Jev fit: Entity / record alignment. Code retrieves top-k candidates by embedding. Noul per pair: "Is the failure in this past incident credible for this planned job / MOC / HAZOP node?" Surface the top 3 on the permit or MOC form.
- Why cheap+fast: 50 candidates × every permit, MOC, and HAZOP node costs fractions of a cent per job and returns in under a second.
- Evidence: Incident-path prediction with BERT (Springer chapter); Kenexis-type tools surface "relevant incidents" in HAZOP ([Hazards 34 paper](https://www.icheme.org/media/27631/hazards-34-paper-175-elhosary-revised.pdf)).
- Rating: Strong. Risk: relevance is graded, so alert fatigue. Use Score (not relevant / related / directly applicable) and show only the top level.

#### U13. Process-safety-event tier pre-classification and severity potential (metrics)
- Practice: API RP 754 and CCPS metrics define Tier 1 to 4 events. Tier 1 and 2 rest on loss of primary containment plus numeric thresholds.
- Pain: Sites under-report or mis-tier. "Was this a loss of primary containment?" and "Was the release to a safe location?" are semantic. Thresholds are numeric.
- Jev fit: Semantic predicate in a rule engine. Nouls: "LOPC occurred?", "Relief device discharged to atmosphere?", "Could this have been a major accident under slightly different conditions?" (Score for potential). Code applies quantity thresholds.
- Why cheap+fast: Every EHS record screened daily. Corporate gets consistent tiering across sites.
- Evidence: Public databases score severity inconsistently (JLPPI 2021 above); accident-code classification with uncertainty (PSEP 2025).
- Rating: Medium. Risk: numeric thresholds and units must stay in code.

### Gaps
- No benchmark found that compares zero-shot classifiers against fine-tuned BERT on a public chemical-incident set (eMARS, CSB). Most high scores come from Chinese-language, fine-tuned models.
- ARIA (France) and IChemE lessons-learned database were not searched for NLP studies.
- Exact record counts for eMARS and CSB not verified.

---

## KQ4. Alarm and abnormal-situation management; fault-diagnosis rule bases; loop time scales

### Takeaway
Alarm rationalization is a documented matrix lookup wrapped around semantic judgments (consequence, operator action), so Jev fits the judgment and code does the matrix. Alarm-flood research already treats alarm sequences as text (TF-IDF, word embeddings). Jev fits supervisory and advisory time scales (seconds to minutes), never the SIS trip path.

### Cited Findings
- ISA-18.2 rationalization reviews and documents each alarm to confirm it is needed and supports operator diagnosis and response. — [ISA-18 series](https://www.isa.org/standards-and-publications/isa-standards/isa-18-series-of-standards); [Emerson white paper 2019 (not opened)](https://www.emerson.com/documents/automation/white-paper-alarm-rationalization-deltav-en-56654.pdf)
- The master alarm database records setpoint, priority, class, cause, consequence, and operator action for each alarm. — [processcontrolguide.com (practitioner site)](https://processcontrolguide.com/isa-18-2-alarm-management/)
- ISA-18.2 defines an alarm flood as more than 10 alarms in 10 minutes. — [ifactory ISA-18.2 guide (vendor site)](https://ifactoryapp.com/industries/oil-and-gas/alarm-management-isa-18-2-rationalization-flooding)
- Vendor claim: rationalization removes 30-60% of configured alarms. — [ifactory (vendor, weak source)](https://ifactoryapp.com/blog/alarm-management-scada-isa-18-2)
- Alarm floods are matched with a modified Smith-Waterman sequence alignment. — [Chem. Eng. Res. Des. 2013](https://www.sciencedirect.com/science/article/abs/pii/S0263876212004261)
- Online matching predicts incoming floods against a pattern database. — [J. Process Control 2017](https://www.sciencedirect.com/science/article/abs/pii/S0959152417300100)
- Floods are classified in real time with modified TF-IDF, a text method. — [Control Engineering Practice 2025](https://www.sciencedirect.com/science/article/abs/pii/S0967066125002473)
- Flood sequences are matched "via word processing and sequence alignment". — [ResearchGate record, 2021](https://www.researchgate.net/publication/352954510_Generalized_Pattern_Matching_of_Industrial_Alarm_Flood_Sequences_via_Word_Processing_and_Sequence_Alignment)
- Review of flood pattern recognition and similarity methods. — [2024 review](https://www.researchgate.net/publication/387342238_A_review_of_alarm_flood_analysis_methods_in_industrial_processes_pattern_recognition_and_similarity_analysis)
- Venkatasubramanian et al. 2003 review, Computers & Chemical Engineering vol. 27: Part I quantitative model-based (pp. 293-311), Part II qualitative models and search strategies (pp. 313-326), Part III process-history methods (pp. 327-346). — [Part I](https://www.semanticscholar.org/paper/A-review-of-process-fault-detection-and-diagnosis:-Venkatasubramanian-Rengaswamy/305f5ec83b51363de07dfcad19534b561d4a1a5e); [Part II](https://www.semanticscholar.org/paper/A-review-of-process-fault-detection-and-diagnosis:-Venkatasubramanian-Rengaswamy/9e24fc75c4dba9121aba46c63bb6d35310cc4643); [Part III record](https://www.mindat.org/reference.php?id=6607098)
- Alarm rationalization tables were generated from a knowledge graph plus constrained LLM. — [arXiv 2606.31614](https://arxiv.org/abs/2606.31614)
- LLM advisory layer at BPCS level must not be credited as an IPL or given a SIL. — [Autonomous Intelligent Systems 2026 (summary only)](https://link.springer.com/article/10.1007/s43684-026-00136-1)
- EEMUA 191 is the companion alarm guide. — [Wikipedia, Alarm management †](https://en.wikipedia.org/wiki/Alarm_management)

### Inferences

#### U14. Alarm rationalization pre-fill and consistency audit (alarm management)
- Practice: ISA-18.2 / EEMUA 191. A team reviews each alarm: valid? cause, consequence, action, time to respond. Priority comes from a severity × response-time matrix.
- Pain: 10k-50k configured alarms per plant (typical range, from domain knowledge). Team-weeks of expert time. Like alarms get unlike priorities.
- Jev fit: Score for consequence severity per impact category (safety, environment, cost) from the consequence text. Nouls: "Does the documented operator action address the stated cause?", "Is the consequence avoidable by operator action?" (if no, it is not an alarm under ISA-18.2). Code computes priority from the matrix and the response-time bucket.
- Why cheap+fast: 20,000 alarms × 1.5k tokens is about $1.20 per pass. Run it on every alarm MOC. Audit the whole master alarm database weekly.
- Evidence: KG plus LLM alarm tables (arXiv 2606.31614). No classifier study on rationalization text found.
- Rating: Strong as pre-fill and audit. Risks: response time is numeric (code buckets it); highest-priority alarms tied to SIFs need the IEC 61511 process.

#### U15. Alarm-flood episode labelling (abnormal situations)
- Practice: Post-event analysis groups floods by cause using sequence alignment or TF-IDF.
- Pain: Similarity methods need historic pattern libraries and break when tags are renamed or plants differ.
- Jev fit: Triage / router. Code turns a flood window into text: ordered alarm tag descriptions with relative time buckets. Choice: "Which upset class best explains this flood?" from a closed list (compressor trip, loss of cooling water, feed loss, instrument air failure, power dip, unknown).
- Why cheap+fast: 100 ms labelling while the flood is live lets the HMI show "likely: loss of cooling water, 0.81". 10 ms allows re-labelling on every new alarm.
- Evidence: TF-IDF real-time classification (CEP 2025); word-processing approach (2021). Both show flood text carries the signal.
- Rating: Medium. Risks: ordering and timing are weak spots; tag descriptions are cryptic. Needs good descriptors in state.

#### U16. Semantic rule evaluator for fault diagnosis over bucketed process states (fault diagnosis)
- Practice: Qualitative and rule-based diagnosis (Venkatasubramanian 2003 Part II): expert rules, signed digraphs, qualitative trend analysis.
- Pain: Knowledge-acquisition bottleneck. Rules are brittle and need exact symbol matches.
- Jev fit: Semantic predicate in a rule engine. Code converts trends to named buckets ("reflux drum level: falling fast", "FIC-203 output: saturated high"). Each rule condition is a Noul in plain language: "Is this state consistent with condenser fouling?" Calibrated probabilities rank hypotheses.
- Why cheap+fast: Hundreds of rules per unit evaluated each advisory cycle (1-10 s) at under 100 ms each in parallel. At 10 ms, per-scan evaluation becomes possible.
- Evidence: 2003 review names the rule-base bottleneck. No study found with LLM classifiers as rule predicates on bucketed chemical-process state.
- Rating: Speculative to Medium. Risks: needs non-text input; multi-hop causal chains; never in the SIS.

#### U17. Operator advisory with a closed action set (abnormal situations)
- Practice: ASM Consortium guidance and ISA-18.2 alarm response procedures give the operator documented actions per abnormal state (ASM source not opened).
- Pain: Finding the right procedure under flood conditions is slow.
- Jev fit: Supervisory layer over numeric control, advisory only. State: bucketed plant state plus active alarms. Choice over the unit's response procedures: "Which procedure applies now?" Below a confidence threshold, show nothing.
- Why cheap+fast: Sub-second refresh while the upset evolves. Cost is nil.
- Evidence: Multi-agent LLM control paper keeps the LLM at advisory level with deterministic verification (AIS 2026). ChEmREF tests LLMs on chemical emergency response ([arXiv 2511.10027](https://arxiv.org/pdf/2511.10027)).
- Rating: Medium. Risks: safety-critical, automation bias. Operator decides. No credit in LOPA.

Time-scale fit (from domain knowledge, no source opened):
- SIS trip path (milliseconds to seconds, deterministic, SIL-certified): never Jev.
- Regulatory control loops (scan 100 ms to 1 s): numeric. Not Jev.
- Alarm annunciation enrichment and flood labelling (seconds): fits 100 ms.
- Operator advisory and procedure selection (seconds to minutes; ISA-18.2 response times are usually minutes): fits 100 ms.
- Per-scan semantic rule sweeps over hundreds of rules: needs 10 ms or heavy parallel batching.
- Rate limit of 1,200 requests per minute means one unit can run about 20 requests per second. Batch many questions into each request.

### Gaps
- No opened source for ASM Consortium guidance or for typical alarm counts per plant.
- Could not open ScienceDirect pages for flood papers; authors not listed here.
- No public benchmark maps alarm-flood text to cause labels.

---

## KQ5. Asset integrity: RBI, damage-mechanism screening, inspection findings, FFS triage

### Takeaway
API 571 screening is a per-mechanism yes/no over process and metallurgy descriptions, which is a natural parallel-Noul job. The best evidence is on maintenance work-order text: a domain-tuned LLM reached F1 0.80 for failure-mode coding, and zero-shot reached only 0.46. That is a warning for Jev's no-fine-tuning model.

### Cited Findings
- API RP 571 describes over 60 damage mechanisms. First published 2003; third edition March 2020. — [Inspectioneering](https://inspectioneering.com/tag/api+rp+571); [API](https://www.api.org/products-and-services/individual-certification-programs/certifications/api571)
- Damage mechanism reviews link mechanisms to inspection methods and strategy. — [ABS Group, How to Perform a Damage Mechanism Review](https://www.abs-group.com/Knowledge-Center/Insights/How-to-Perform-a-Damage-Mechanism-Review/)
- Failure-mode classification from work orders: fine-tuned GPT-3.5 F1 0.80; baseline text classifier 0.60; out-of-box GPT-3.5 0.46. — [Stewart, Hodkiewicz, Li 2023](https://arxiv.org/abs/2309.08181)
- SINTEF built an ISO 14224-based concept hierarchy to classify failures of safety-critical equipment (gas detectors, shutdown valves) as critical vs degraded and dangerous vs safe. They hold several thousand hand-classified notifications. — [Ottermo, Håbrekke, Hauge, Bodsberg, PHM Europe 2021](https://papers.phmsociety.org/index.php/phme/article/view/2792)
- Technical Language Processing adapts NLP to short, jargon-heavy maintenance text. — [Brundage et al. 2021, NIST](https://www.nist.gov/publications/technical-language-processing-unlocking-maintenance-knowledge)
- NIST compared expert labelling, text classification, and AI-assisted tagging for failure-rate KPIs from work orders. — [NIST](https://www.nist.gov/publications/kpi-extraction-maintenance-work-orders-comparison-expert-labeling-text-classification)
- RBI standards API 580/581. — [Wikipedia, Risk-based inspection †](https://en.wikipedia.org/wiki/Risk-based_inspection)

### Inferences

#### U18. API 571 damage-mechanism screening per corrosion loop (asset integrity)
- Practice: API 580/581 RBI starts with a damage mechanism review per corrosion loop, using API 571 criteria (material, temperature range, species present).
- Pain: Scarce corrosion specialists. 60+ mechanisms × hundreds of loops. Reviews go stale after process changes.
- Jev fit: Clause-by-clause check, one Noul per mechanism. State: loop description, metallurgy, and code-made buckets ("temperature: inside 260-425 C sulfidation range: yes"). Question: "Is high-temperature sulfidation credible for this loop?" Criteria text holds the API 571 susceptibility factors.
- Why cheap+fast: 67 mechanisms × 300 loops × 1.5k tokens is about $1.20. Re-screen on every MOC or crude-slate change.
- Evidence: No NLP study on API 571 screening found. ABS Group describes the manual method.
- Rating: Medium. Risks: numeric ranges (must be bucketed in code); false negatives matter. Use as a second check against the specialist's list.

#### U19. Inspection-report finding classification and anomaly triage (asset integrity)
- Practice: API 510/570/653 inspections produce free-text findings. Integrity engineers sort them into anomaly types and urgency. API 579 sets which FFS part applies to a flaw type.
- Pain: Backlogs of reports. Findings in PDFs never reach the RBI database.
- Jev fit: Triage / router. Choice: finding type (general thinning, local thinning, pitting, crack-like, blister, dent, coating failure, CUI sign, none). Score: urgency. Choice: which API 579 Part applies. All numeric FFS work stays in code.
- Why cheap+fast: Decades of legacy reports back-coded for tens of dollars.
- Evidence: Work-order failure-mode results (Stewart 2023); TLP (Brundage 2021).
- Rating: Medium. Risks: terse technical language, photos and thickness grids are not text.

#### U20. Work-order failure coding for SIS reliability data (asset integrity / functional safety)
- Practice: IEC 61511 asks operators to check real failure rates against SIL assumptions. ISO 14224 defines failure taxonomy. Each notification must be coded dangerous vs safe, detected vs undetected.
- Pain: Manual coding of thousands of notifications. SINTEF names this effort directly.
- Jev fit: Feature extractor. Choice: ISO 14224 failure mode. Noul: "Would this failure have prevented the valve from closing on demand?" Code counts and computes rates.
- Why cheap+fast: All notifications coded at entry. Low-confidence ones go to the reliability engineer.
- Evidence: Ottermo et al. 2021; Stewart et al. 2023.
- Rating: Strong for screening. Risk: zero-shot weakness on jargon (0.46 F1 for out-of-box GPT-3.5). Put the taxonomy definitions and site abbreviations in `criteria`.

### Gaps
- No study found of NLP on API 571 / RBI text or on corrosion-loop reviews.
- IEC 61511 operating-experience clause not opened; stated from memory.
- FFS triage has no evidence base; treat as speculative.

---

## KQ6. Quality and GMP: batch records, deviations, CAPA, complaints, CoA, change control, audits, data integrity

### Takeaway
GMP work is dense with closed-set text judgments and review-by-exception is already the accepted pattern. A 2026 regulator study shows a BERT classifier whose confidence tracks accuracy (r = 0.927), which is the exact property Jev sells. Validation and change control for a shared-weights model are the main adoption barrier.

### Cited Findings
- Singapore HSA trained BERT on 13,830 product-defect reports (2010-2021), 21 MedDRA-HSA classes in 3 severity levels. Top-1 accuracy 86%, top-3 96%, macro-F1 72%. Confidence correlated with accuracy (r = 0.927). At a 0.78 threshold: 91% accuracy with 14.3% of cases left uncertain. Intended as first-pass triage. — [Sancenon et al., Scientific Reports 2026](https://pmc.ncbi.nlm.nih.gov/articles/PMC13121759/)
- BERT triage of adverse drug reaction reports came close to human level. — [PMC10699587](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10699587/)
- ISPE describes batch disposition built on rules, risk models, and AI signals. NLP helps reviewers read deviation narratives and change descriptions; AI clusters related deviations. — [ISPE Pharmaceutical Engineering, Autonomous Batch Disposition](https://ispe.org/pharmaceutical-engineering/ispeak/autonomous-batch-disposition-transforming-pharmaceutical)
- A vendor framework splits deviation AI into report-quality scoring, root-cause category prediction, retrieval of similar past deviations, and categorization. — [Entefy (vendor blog)](https://www.entefy.com/blog/a-multi-model-ai-framework-for-a-more-robust-deviation-management-in-pharma-manufacturing/)
- EFPIA (2024) sees a role for AI in root-cause identification and CAPA through pattern recognition over past deviations. — [AAPS Journal 2026 review](https://link.springer.com/article/10.1208/s12248-026-01283-2)
- Deviations are classed by risk (commonly minor / major / critical). — [GMP Insiders](https://gmpinsiders.com/deviation-management-process/)
- Misjudging what counts as a complaint is a common weakness and delays quality signals. — [GMP Insiders, complaints](https://gmpinsiders.com/complaints-management-in-pharmaceutical-industry/)
- Aggregator statistics: most-cited 483 item in FY2024 was 21 CFR 211.22(d), 184 times. Drug and biologics warning letters rose from 190 (FY2024) to 303 (FY2025). — [IntuitionLabs (aggregator; verify against FDA data)](https://intuitionlabs.ai/articles/fda-form-483-warning-letter-statistics)
- A trade article reports FDA's first warning letter citing non-compliant AI use in manufacturing. — [ProPharma (not opened)](https://www.propharmagroup.com/thought-leadership/ai-cgmp-fdas-1st-warning-letter-non-compliant-manufacturing)
- Rules: [21 CFR 211 †](https://www.ecfr.gov/current/title-21/chapter-I/subchapter-C/part-211); [ICH quality guidelines Q7-Q10 †](https://www.ich.org/page/quality-guidelines); [21 CFR 314.70 †](https://www.ecfr.gov/current/title-21/chapter-I/subchapter-D/part-314/subpart-B/section-314.70); [FDA data-integrity guidance †](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/data-integrity-and-compliance-drug-cgmp-questions-and-answers).

### Inferences

#### U21. Deviation classification, root-cause coding, and similar-deviation match (GMP)
- Practice: 21 CFR 211.100 and 211.192 require deviations to be recorded, justified, and investigated. Sites class them minor / major / critical and code root cause. ICH Q10 asks for CAPA and trend review.
- Pain: Thousands of deviations per site per year. Classes vary by author. Recurrence is missed because past records are hard to search.
- Jev fit: Score (minor / major / critical with described levels). Choice (root-cause category). Record alignment: code retrieves candidates; Noul "Is this the same failure as deviation D-1234?" flags recurrence and failed CAPAs.
- Why cheap+fast: Classify at entry (100 ms in the QMS form). Re-trend the whole history for a few dollars.
- Evidence: Sancenon 2026 (calibrated triage works on defect text); Entefy (vendor); EFPIA via AAPS J. 2026.
- Rating: Strong. Risk: GMP validation. Model updates need change control because weights are shared and not under the site's control.

#### U22. Batch-record review by exception: comment and annotation triage (GMP)
- Practice: 21 CFR 211.188 and 211.192 require batch record review before release. Electronic batch records allow review by exception.
- Pain: Numeric exceptions are easy for code. Free-text comments, corrections, and operator notes still need a full human read.
- Jev fit: Triage. Nouls per comment: "Does this comment describe an unplanned event?", "Does it imply a step was done out of order?", "Does it need a deviation that is not referenced?" Code handles all values, limits, and timestamps.
- Why cheap+fast: Every comment in every batch scored as written. QA reads only flagged ones.
- Evidence: ISPE article describes NLP for deviation narratives in disposition.
- Rating: Strong. Risks: date and sequence logic (code), large state (chunk per step).

#### U23. Product complaint triage (GMP / post-market)
- Practice: 21 CFR 211.198 requires complaint files and review. Some complaints trigger field alerts or adverse-event reporting.
- Pain: Volume, many languages, mixed intake (quality defect vs adverse event vs inquiry vs suspected counterfeit).
- Jev fit: Triage / router. Choice: complaint class. Nouls: "Mentions patient harm?", "Suggests contamination or sterility failure?", "Suggests tampering or counterfeit?" Score: severity.
- Why cheap+fast: Instant routing at intake. High-severity cases reach QA in seconds.
- Evidence: Sancenon 2026 (86% top-1; confidence gating); ADR triage near human level.
- Rating: Strong. Risk: non-English text. Missed adverse events carry regulatory clocks, so threshold for recall.

#### U24. Certificate-of-analysis semantic check (quality)
- Practice: Incoming CoAs are checked against the material specification (21 CFR 211.84; ISO 9001 supplier control).
- Pain: Numbers are easy. Mismatched test method, grade, unit, spec version, or a "conforms" with no value are semantic.
- Jev fit: Entity / record alignment. Code parses values and compares them. Nouls: "Is test method on the CoA equivalent to the method in the spec?", "Does the CoA product name and grade match the ordered material?"
- Why cheap+fast: Every CoA line checked at goods receipt.
- Evidence: None found specific to CoAs. SDS field-extraction benchmark shows parsing such documents is feasible at 79-84% ([arXiv 2606.11204](https://arxiv.org/abs/2606.11204)).
- Rating: Medium. Risk: numeric and unit handling must stay in code.

#### U25. Change-control impact and filing-category pre-assessment (GMP / regulatory CMC)
- Practice: 21 CFR 314.70 sorts changes into major (prior approval), moderate (CBE-30 / CBE-0), minor (annual report). EU uses Type IA / IB / II variations. ICH Q10 and Q12 cover change management.
- Pain: Regulatory affairs is a bottleneck. Categories vary between assessors.
- Jev fit: Choice over the filing categories with guidance text in `criteria`. Parallel Nouls for impact areas: "Affects validated state?", "Affects registered detail?", "Needs stability data?"
- Why cheap+fast: Pre-assess every change request at creation. Screen the full backlog against a new guidance.
- Evidence: Regulatory-provision classification (Hassani 2025). No CMC-specific study found.
- Rating: Medium. Risk: multi-hop rules (category depends on dosage form and change type together). Decompose in code.

#### U26. Audit finding grading and clause mapping (quality)
- Practice: Internal, supplier, and regulator audits grade findings critical / major / minor and cite a clause (21 CFR 211.x, ISO 9001, EU GMP).
- Pain: Grading varies by auditor. Trending across sites needs a common scale.
- Jev fit: Score with described levels. Choice over clause list. Run over public 483s and warning letters to benchmark own findings.
- Why cheap+fast: Re-grade years of findings on one scale for cents.
- Evidence: Volume and clause statistics exist (IntuitionLabs). No NLP paper on 483 text found in this search.
- Rating: Medium. Risk: grading needs context not in the finding text.

#### U27. ALCOA+ checks on audit-trail reasons and corrections (data integrity)
- Practice: FDA and MHRA data-integrity guidance expect attributable, legible, contemporaneous, original, accurate records. Audit trails need review.
- Pain: Audit-trail review is high volume and dull. "Reason for change" fields hold junk ("error", "update").
- Jev fit: Verifier. Noul: "Does this reason explain why the value changed?" Score: adequacy. Code checks who, when, and sequence.
- Why cheap+fast: Review 100% of audit-trail entries instead of a sample.
- Evidence: None found. Marked as unverified opportunity.
- Rating: Medium. Risk: timestamps are a weak spot; keep them in code.

### Gaps
- No peer-reviewed benchmark on GMP deviation text (data is proprietary). Evidence is vendor or analogue.
- Not opened: FDA guidance pages, ICH pages, the ProPharma warning-letter article.
- How regulators would view a shared, non-fine-tuned classifier under computer software assurance is an open question. No source found.

---

## KQ7. Regulatory affairs and product stewardship: SDS, GHS, REACH, TSCA, transport, tariff, regulatory change, export control

### Takeaway
Tariff and SDS tasks have fresh LLM benchmarks that show general LLMs are useful but not reliable alone (SDS extraction 79-84%; HTS 10-digit 40%). Both papers call for calibration and human checks. Jev's best slot is "select among code-retrieved candidates" and section-to-section consistency checks, with list lookups and mixture arithmetic in code.

### Cited Findings
- SDS extraction benchmark over 50,000+ fields: Gemini 1.5 Pro 84%, GPT-4o 81%, Claude 3.7 Sonnet 79% (Llama 3.1-70B also tested). Text input beat multimodal. Authors call for calibration and human-in-the-loop. — [Grill, Bayer, Berlinger, arXiv 2606.11204, April 2026](https://arxiv.org/abs/2606.11204)
- ATLAS benchmark: a fine-tuned model reached 40% fully correct 10-digit HTS codes and 57.5% correct at 6 digits. — [arXiv 2509.18400](https://arxiv.org/abs/2509.18400)
- Earlier HTS benchmark. — [arXiv 2412.14179](https://arxiv.org/pdf/2412.14179). 2026 review of ML, DL, and LLM methods for HS codes. — [Discover Computing 2026](https://link.springer.com/article/10.1007/s10791-026-10428-y)
- A patent uses chemical constituents to predict the HS prefix and claims over 95% full-code accuracy. — [US 12299586 (patent claim, not peer reviewed)](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/12299586)
- Patents describe ML classification of dangerous goods from product attributes turned into text. They note it is an expert manual task at thousands of shipments per day. — [US 12125075](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/12125075)
- UN numbers are four-digit IDs set by the UN Model Regulations. — [NZ EPA](https://www.epa.govt.nz/hazardous-substances/classification/un-numbers/)
- LLM classification of provisions in food-safety regulations: fine-tuned GPT-4o 89% precision and 87% recall; few-shot 97% recall and 65% precision. Transfers from Canadian to US rules. — [Hassani, Sabetzadeh, Amyot 2025](https://arxiv.org/abs/2501.14683)
- EU reporting-obligation extraction benchmark. — [EURO-5K, arXiv 2606.02971](https://arxiv.org/pdf/2606.02971). Multi-framework regulatory gap detection. — [ComplianceNLP, arXiv 2604.23585](https://arxiv.org/pdf/2604.23585)
- CLP hazard classes trigger duties in many other EU laws; CMR classes trigger the most. — [PMC11484064](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11484064/)
- Reported: a January 2026 draft to extend REACH Annex XVII restrictions to newly classified CMR substances. — [Certivo (vendor blog; verify)](https://www.certivo.com/blog-details/reach-annex-xvii-cmr-substances-update-2026-what-manufacturers-must-know-about-new-chemical-restrictions)
- OPCW is drafting Know-Your-Customer guidelines for chemical sales, aimed at dual-use chemicals. Workshop February 2025; zero draft 2024. The article lists no red flags and no publication date. — [OPCW, March 2025](https://www.opcw.org/media-centre/news/2025/03/strengthening-chemical-security-how-opcws-new-guidelines-will-help)
- CWC schedules. — [OPCW Annex on Chemicals](https://www.opcw.org/chemical-weapons-convention/annexes/annex-chemicals/annex-chemicals)
- Environmental-claim detection: ClimateBERT F1 0.838, accuracy 0.909. — [Greenwashing NLP survey, arXiv 2502.07541](https://arxiv.org/html/2502.07541v2)
- Frameworks: [GHS †](https://unece.org/about-ghs); [ECHA Candidate List †](https://echa.europa.eu/candidate-list-table); [TSCA inventory †](https://www.epa.gov/tsca-inventory); [UN TDG / ADR †](https://unece.org/transport/dangerous-goods); [WCO HS †](https://www.wcoomd.org/en/topics/nomenclature/overview/what-is-the-harmonized-system.aspx); [BIS red flags †](https://www.bis.doc.gov/index.php/all-articles/23-compliance-a-training/51-red-flag-indicators).

### Inferences

#### U28. SDS and label consistency QA (product stewardship)
- Practice: GHS / CLP / OSHA HazCom set the 16-section SDS. Classification in Section 2 must agree with composition (3), toxicology (11), and transport (14). Labels must match Section 2.
- Pain: Large portfolios × languages × jurisdictions. Supplier SDSs are often inconsistent.
- Jev fit: Verifier. Code extracts sections and computes mixture classification. Nouls: "Does Section 2 list a hazard class that Section 11 data does not support?", "Does the Section 14 proper shipping name match the Section 2 hazards?", "Does the label carry every Section 2 H-statement?" (code can do the exact H-code match; Jev judges free-text cases).
- Why cheap+fast: 1M SDSs at 2k tokens cost about $84 per question set. Re-check a whole portfolio after each ATP to CLP.
- Evidence: Grill et al. 2026.
- Rating: Strong. Risks: mixture arithmetic and cut-offs stay in code; long SDSs need section chunking.

#### U29. Substance-name alignment for SVHC, REACH, TSCA, and CWC list screening (regulatory)
- Practice: Screen formulations, BOMs, and supplier declarations against regulated lists (REACH Candidate List, Annex XIV/XVII, TSCA, CWC schedules).
- Pain: CAS lookup is exact and easy. Names are not: trade names, group entries ("lead compounds", "PFAS"), salts, synonyms.
- Jev fit: Entity / record alignment. Noul: "Is 'C9-11 alcohol ethoxylate phosphate, potassium salt' covered by group entry X?" Code does CAS and EC lookups first; Jev handles the leftovers.
- Why cheap+fast: Millions of BOM lines × hundreds of group entries is viable only at this price.
- Evidence: No direct study found. Related cheminformatics work belongs to the other researcher.
- Rating: Medium. Risk: chemistry knowledge depth; structure-based group membership is better done by cheminformatics code.

#### U30. Regulatory-change applicability triage (regulatory affairs)
- Practice: Teams watch ECHA, EPA, OSHA, and national gazettes and decide which items touch which products and sites.
- Pain: Volume and keyword noise. Missed changes cost market access.
- Jev fit: Triage / router. State: one change notice plus one business profile. Noul: "Does this change create a duty for a maker of solvent-based coatings sold in the EU?" Choice: duty type (registration, restriction, labelling, reporting, none).
- Why cheap+fast: 10k items × 20 profiles × 3k tokens is about $24 per month.
- Evidence: Hassani 2025; EURO-5K; ComplianceNLP.
- Rating: Strong. Risks: multi-hop applicability (tonnage bands, exemptions) and dates. Decompose into single-hop Nouls; code does dates and tonnage.

#### U31. Transport classification pre-check (ADR / IMDG / IATA)
- Practice: Classifier picks UN number, proper shipping name, class, and packing group from the Dangerous Goods List per UN Model Regulations.
- Pain: Expert manual task at high daily volume. Generic "N.O.S." entries need judgment.
- Jev fit: Select, do not generate. Code computes class and packing group from flash point and toxicity data, then shortlists UN entries. Choice: "Which entry best describes this product?"
- Why cheap+fast: Every new product and every shipment description checked, including undeclared-DG screening of order text.
- Evidence: Patents US 12125075 and US 11663635 (deployed intent, not peer reviewed).
- Rating: Medium. Risks: numeric criteria (code), safety-critical mis-declaration. DG safety adviser signs.

#### U32. HS / CN tariff classification of chemicals (trade compliance)
- Practice: WCO Harmonized System with General Interpretative Rules. Chapters 28-38 cover chemicals. Chapter notes decide defined compound vs mixture vs preparation.
- Pain: Large catalogues. Classification is hierarchical and rule-bound. Errors mean duty and penalty risk.
- Jev fit: Select, do not generate, stepwise down the hierarchy. Choice per level: chapter, heading, subheading, with candidates and legal notes in state. Low confidence goes to a customs specialist.
- Why cheap+fast: 4-6 Choice calls per product cost almost nothing. Re-classify the full catalogue on each HS revision.
- Evidence: ATLAS (40% at 10 digits, 57.5% at 6); Discover Computing 2026 review; patent claim of 95%+ using constituents.
- Rating: Medium. Risks: hard task even for tuned LLMs; multi-hop legal notes.

#### U33. Export-control and CWC-precursor order screening (stewardship / security)
- Practice: CWC schedules, Australia Group lists, and national export rules require licences and end-use checks. BIS publishes red-flag indicators. OPCW is drafting KYC guidelines.
- Pain: Screening is list-based. Red flags are behavioural and textual (odd end-use, cash payment, freight forwarder as consignee, product does not fit the buyer's business).
- Jev fit: Semantic predicate in a rule engine. One Noul per red flag over order plus customer record. Probabilities feed a risk score. List matching stays in code.
- Why cheap+fast: 1M order lines at 1k tokens is about $40 per year. Every order screened inline.
- Evidence: OPCW KYC work confirms the need. No published classifier study found.
- Rating: Medium. Risk: adversarial. Buyers write the text. Jev is one signal among several; never the release decision.

### Gaps
- Could not verify the OPCW KYC guideline publication status after March 2025.
- BIS red-flag URL not opened; BIS changed its site, so the link may have moved.
- GHS weight-of-evidence judgments overlap with toxicology (other researcher). Not covered here.
- No study found on SDS section-to-section consistency checking, only on extraction.

---

## KQ8. Environmental and sustainability: permits, spill and emission reports, LDAR, waste codes, ESG

### Takeaway
RCRA listed-waste codes depend on the process that made the waste, which is a text match, while characteristic codes are numeric. That split maps cleanly onto Jev plus code. LDAR is mostly numeric and date-driven and is a poor fit.

### Cited Findings
- RCRA has four lists (F, K, P, U). A waste is compared with the listing description; if it matches, it is listed hazardous waste. — [EPA, Defining Hazardous Waste](https://www.epa.gov/hw/defining-hazardous-waste-listed-characteristic-and-mixed-radiological-wastes); [40 CFR 261](https://www.ecfr.gov/current/title-40/chapter-I/subchapter-I/part-261)
- For listed wastes, the generating process or industry matters more than measured properties. — [EPA training module](https://www.epa.gov/sites/default/files/2015-09/documents/hwid05.pdf)
- A patent covers ML prediction of waste class codes. — [US 12020219](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/12020219)
- NLP on spill and leak reports found causes and contributing factors in an E&P company. — [PSEP 2024](https://www.sciencedirect.com/science/article/abs/pii/S0957582024002118)
- EPA lists what must be reported to the National Response Center. — [EPA](https://www.epa.gov/emergency-response/what-information-needed-when-reporting-oil-spill-or-hazardous-substance-release)
- ClimateBERT detects environmental claims with F1 0.838. A ClimateBERT greenwashing-risk model reached 86.34% accuracy and F1 0.67. — [arXiv 2502.07541](https://arxiv.org/html/2502.07541v2)
- LLM scoring of corporate climate disclosures has been studied. — [arXiv 2502.15094](https://arxiv.org/pdf/2502.15094)
- LDAR practice. — [EPA LDAR best practices guide †](https://www.epa.gov/compliance/leak-detection-and-repair-best-practices-guide)

### Inferences

#### U34. Permit-condition compliance check (environmental)
- Practice: Title V (US) and IED (EU) permits hold hundreds of conditions: limits, monitoring, record-keeping, reporting.
- Pain: Conditions are prose. Mapping logs and reports to each condition is manual.
- Jev fit: Clause-by-clause check. Code compares numbers. Nouls: "Does this monthly record satisfy condition 4.2's record-keeping duty?", "Does this event description count as a deviation under condition 7.1?"
- Why cheap+fast: Every record against every relevant condition, every day.
- Evidence: EURO-5K and ComplianceNLP on obligation extraction (KQ7).
- Rating: Medium. Risks: numeric limits and averaging periods (code), dates.

#### U35. Spill, release, and transport-incident report coding and reportability triage (environmental / logistics)
- Practice: CERCLA / EPCRA release reporting, eMARS reporting under Seveso III, ADR 1.8.5 occurrence reports.
- Pain: Fast clocks (immediate NRC notice). Reportability mixes quantity thresholds (numeric) with semantics (left the site? reached water? secondary containment held?).
- Jev fit: Semantic predicate in a rule engine. Nouls for the semantic parts. Choice for cause and equipment codes. Code applies reportable quantities.
- Why cheap+fast: Decision support within seconds of the first field report.
- Evidence: PSEP 2024 spill NLP.
- Rating: Medium. Risk: numeric thresholds; legal consequences of a miss. EHS lead decides.

#### U36. Hazardous-waste code determination for listed wastes (environmental)
- Practice: 40 CFR 261 subpart D. F and K listings match on source process. D codes need test values.
- Pain: Listing descriptions are long and conditional. Generators misapply them.
- Jev fit: Clause-by-clause. One Noul per candidate listing: "Does this waste stream description match listing F005 (spent non-halogenated solvents ...)?" Code handles D-code thresholds and the 10% solvent rule arithmetic.
- Why cheap+fast: Every waste profile × every listing for cents. Re-run on each process change.
- Evidence: EPA describes the match logic. Patent US 12020219 shows ML interest. No peer-reviewed study found.
- Rating: Medium. Risks: exclusions and "derived-from" rules are multi-hop.

#### U37. ESG and sustainability disclosure coverage and claim checks (sustainability)
- Practice: CSRD / ESRS, GRI, and green-claims rules require specific disclosures and substantiated claims.
- Pain: Long reports, many datapoints, claim inflation.
- Jev fit: Screening at scale. Nouls per paragraph: "Is this an environmental claim?", "Is the claim specific and quantified?", "Does this paragraph address datapoint E2-4?"
- Why cheap+fast: Check own drafts and all peer reports each season.
- Evidence: ClimateBERT (F1 0.838); greenwashing survey; LLM disclosure scoring.
- Rating: Strong. Risk: low. Not chemistry-specific, so less distinctive.

### Gaps
- No NLP evidence found for permit-condition checking or LDAR records.
- CSRD / ESRS datapoint references are from memory; no source opened.

---

## KQ9. Commercial and supply chain: technical service, product selection, supplier documents

### Takeaway
These are standard classifier jobs with low risk and clear value, but little chemistry-specific evidence. They earn a place because cost and speed let them run inline in CRM and ERP.

### Cited Findings
- NLP plus ML sorted technical-service repair records into real quality issues vs non-issues. — [Swedish AI Society paper](https://ecp.ep.liu.se/index.php/sais/article/view/721)
- Complaint classification systems with priority assignment exist in general industry. — [Triago, Zenodo](https://zenodo.org/records/19514976)
- SDS field extraction by LLMs reaches 79-84%, so supplier documents can be parsed but need checks. — [arXiv 2606.11204](https://arxiv.org/abs/2606.11204)

### Inferences

#### U38. Technical-service ticket routing and quality-signal detection (commercial)
- Practice: Customer tickets go to technical service, quality, regulatory, or logistics. ISO 9001 clause 9.1.2 asks for customer feedback monitoring (from memory).
- Pain: Misrouted tickets. Quality signals hide in "how do I" questions.
- Jev fit: Triage / router. Choice: team. Noul: "Does this ticket imply the product was off-spec?"
- Why cheap+fast: Inline routing in 100 ms.
- Evidence: Swedish AI Society paper; Triago.
- Rating: Strong. Risk: low.

#### U39. Product-selection matching (commercial)
- Practice: Sales engineers match a customer need (substrate, cure conditions, food-contact status, region) to a grade from technical data sheets.
- Pain: Large catalogues. Expert time. Regulatory fit is often missed.
- Jev fit: Select, do not generate. Code filters numeric properties. Noul per candidate: "Is this grade suitable for indirect food contact in the EU per its TDS and declarations?"
- Why cheap+fast: Score every grade for every inquiry.
- Evidence: None found specific to chemicals.
- Rating: Medium. Risk: numeric property comparison must stay in code.

#### U40. Supplier qualification document check (supply chain)
- Practice: Supplier questionnaires, ISO certificates, GMP or Responsible Care declarations, conflict-mineral and REACH statements are reviewed at onboarding and renewal.
- Pain: Hundreds of suppliers × many documents × expiry cycles.
- Jev fit: Clause-by-clause check. Nouls: "Does this certificate cover the manufacturing site we buy from?", "Does this statement confirm absence of SVHCs above 0.1%?" Code checks expiry dates.
- Why cheap+fast: Full re-check of all supplier files each quarter.
- Evidence: SDS extraction benchmark as analogue.
- Rating: Medium. Risks: scanned PDFs need OCR first; forged documents (adversarial).

### Gaps
- No chemistry-specific studies found for ticket routing or product matching.
- Logistics incident coding is covered under U35.

---

## Cross-cutting: Top 5, poor fits, new roles

### Takeaway
The highest-value usages are high-volume gates where a wrong "no review needed" is the costly error and calibrated thresholds let the site set that error rate: MOC screening, lessons matching, GMP triage, PHA verification, and regulatory applicability. Poor fits cluster around numerics, dates, the SIS trip path, and anything needing generated text.

### Cited Findings
- General LLMs are fluent but unreliable alone in this domain: HAZOP validity 19-37% ([Safety Science 2025](https://www.sciencedirect.com/science/article/abs/pii/S0925753525002644)); SDS extraction 79-84% ([arXiv 2606.11204](https://arxiv.org/abs/2606.11204)); HTS 10-digit 40% ([arXiv 2509.18400](https://arxiv.org/abs/2509.18400)).
- Confidence gating works on regulated text: 91% accuracy with 14.3% deferred at a 0.78 threshold ([Sancenon 2026](https://pmc.ncbi.nlm.nih.gov/articles/PMC13121759/)).
- Zero-shot models underperform on jargon: F1 0.46 vs 0.80 fine-tuned on work orders ([Stewart 2023](https://arxiv.org/abs/2309.08181)).
- An LLM layer must not be credited as an IPL or given a SIL ([AIS 2026, summary only](https://link.springer.com/article/10.1007/s43684-026-00136-1)).

### Inferences

Top 5 by likely value:
1. U6 Replacement-in-kind and MOC routing screen. Regulated yes/no gate on every work order; misjudgment is a known top MOC failure; no competing automation found.
2. U12 Lessons-learned matching to planned work (with U11 coding). Strongest evidence base; fixes the "lessons not learned" problem at the moment of planning.
3. U21-U23 GMP deviation, batch-comment, and complaint triage. High volume, closed sets, review-by-exception already accepted, confidence gating proven by a regulator.
4. U3 HAZOP worksheet verifier (with U1 pruning). LLM HAZOP tools are arriving with 19-37% validity; a cheap calibrated verifier is the missing part.
5. U30 Regulatory-change applicability triage (with U28 SDS QA). Clear volume problem, good analogue evidence, recoverable errors.

Runners-up: U14 alarm rationalization audit, U18 API 571 screening, U20 SIS failure coding.

Poor fits:
- Anything in the SIF trip path or credited as an IPL. IEC 61511 needs deterministic, certified functions.
- LOPA arithmetic, PFD, SIL calculation, risk-matrix math. Numeric.
- GHS mixture calculations (additivity, ATE), cut-off comparisons. Numeric.
- API 581 probability and consequence calculations, API 579 assessments, remaining life, inspection intervals. Numeric.
- LDAR: ppm readings against leak definitions, repair deadlines. Numeric plus dates.
- CoA value vs spec limits; batch yield reconciliation; ALCOA "contemporaneous" timestamp checks. Numeric plus dates.
- Exact list membership by CAS number (SVHC, TSCA, CWC). Use a lookup. Jev only for name ambiguity.
- Reading P&IDs, trends, spectra, thickness maps directly. Not text. Convert first.
- Writing HAZOP rows, SDS text, CAPA plans, investigation narratives. Jev does not generate.
- Root-cause determination as a conclusion. It needs multi-step reasoning. Jev can only code causes already stated.
- Multi-hop regulatory applicability (substance in annex AND tonnage band AND no exemption). Decompose in code or use a reasoning model.
- Whole CSB reports, 300-page batch records, or full permits as one state. Accuracy drops. Chunk first.
- Regulatory control loops under 1 s. Numeric control.
- Order screening as the sole export-control barrier. Buyer-written text is adversarial.
- Dispersion, relief sizing, reaction hazard evaluation. Physics and numerics.

New roles the catalogue lacks:
- Exemption gatekeeper. A Noul decides whether a costly process may be skipped (RIK skips MOC; "minor" skips full investigation; "not applicable" skips regulatory review). The value is the asymmetric, site-set threshold on a calibrated probability. Seen in U6, U21, U30.
- Cross-document consistency checker. Pairwise judgment that two statements in different controlled documents agree (HAZOP safeguard vs SRS vs C&E; SDS Section 2 vs 14; procedure vs alarm response). Differs from record alignment: the question is contradiction, not identity. Seen in U5, U28.
- Taxonomy back-coder. Re-code a whole legacy corpus whenever the taxonomy changes, because a full pass costs dollars. Makes taxonomies cheap to revise. Seen in U11, U19, U26.
- Tireless third reader. GMP and PSM already demand a second-person check. Jev adds a third read on 100% of records and flags where it disagrees with the two humans. It replaces neither. Seen in U2, U22, U27.
- Calibrated audit sampler. Use probabilities to pick which records people review (risk-based sampling in the spirit of ICH Q9), rather than random 5% samples. Seen in U7, U27.

Cross-cutting adoption issues (inference, no source):
- GMP and IEC 61511 both need tool validation and change control. Jev's shared weights with no fine-tuning help reproducibility, but a vendor model update is a change the site must assess.
- Zero-shot weakness on site jargon is the main accuracy risk. Mitigation: put glossaries and taxonomy definitions in `criteria`, and measure against a labelled site sample before use.
- English-first is a limit for multi-site chemical firms (German, Chinese, Portuguese logs).

### Gaps
- No published test of a calibrated, non-generative classifier on any chemical-industry task. All evidence is from BERT-class fine-tuned models or generative LLMs.
- No source found on how regulators (OSHA, FDA, ECHA, competent authorities under Seveso) view AI screening in these workflows, beyond the unopened ProPharma article.
