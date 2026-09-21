# Jev usages in Engineering C: civil/construction, mechanical design, manufacturing quality, automotive safety, aerospace, power equipment, robotics

How to read these notes:

- 41 usages, grouped by subfield (C 9, M 7, Q 8, A 3, E 5, P 3, R 6). IDs: C = civil, M = mechanical, Q = manufacturing quality, A = automotive, E = aerospace, P = power, R = robotics.
- Each usage has the 7 fields from the brief: name, practice, pain, Jev fit, why cheap and fast, evidence, fit rating.
- Citation flags:
  - **[V]** = I fetched the page this session and checked the claim.
  - **[S]** = seen in search results (title or snippet) only. Full text not opened. Several publishers (ScienceDirect, MDPI) blocked fetches.
  - **[M]** = named from my memory. Not checked this session. Verify before publishing.
- Cost sums are my own arithmetic from the brief's price ($0.04 per million input tokens). Token counts per document are my assumptions and are stated.
- Every usage states what code or another model must do first, because Jev is text-only and weak at numerics.

---

## 1. Civil, structural and construction

### Takeaway
Construction has the deepest NLP track record in this subtopic: 15+ years of automated code checking research, mature accident-narrative classifiers, and BERT-era contract work. Jev fits as the per-clause yes/no judge and the per-report coder. Code (IFC queries, geometry engines) must own all dimensions and quantities.

### Cited Findings
- Zhang & El-Gohary (2016, J. Comput. Civ. Eng. 30(2)) extract requirements from regulatory text with hand-built pattern-matching rules plus conflict-resolution rules, using syntactic and semantic text features. [S] — [ASCE](https://ascelibrary.org/doi/10.1061/%28ASCE%29CP.1943-5487.0000346)
- CODE-ACCORD corpus (Hettiarachchi et al., 2024): 862 self-contained sentences from the building regulations of England and Finland, with 4,297 entities and 4,329 relations annotated by hand. Built for text classification, entity and relation extraction toward automatic compliance checking. [V] — [arXiv 2403.02231](https://arxiv.org/abs/2403.02231)
- Fuchs, Witbrock, Dimyadi, Amor (2024): GPT-3.5 and GPT-4 translate building regulations into LegalRuleML with few-shot prompts. "GPT-3.5 can learn the basic structure of the format." This is a generation task. [V] — [arXiv 2407.21060](https://arxiv.org/abs/2407.21060)
- "Large Language Model-Driven Code Compliance Checking in BIM" (Electronics 14(11):2146, 2025): LLMs (GPT, Claude, Gemini, Llama) linked to Revit interpret codes and generate Python checking scripts. Semi-automated. Case studies on a residential and an office building. [S] — [arXiv 2506.20551](https://arxiv.org/abs/2506.20551)
- Geometry-heavy checks need a separate graph-based spatial reasoning layer, not just an LLM (2026 preprint, title only). [S] — [arXiv 2606.12065](https://arxiv.org/pdf/2606.12065)
- Active 2026 work continues: reinforcement learning to improve LLM-based code compliance systems [S] — [arXiv 2606.22402](https://arxiv.org/pdf/2606.22402); AI floor-plan compliance checks for residential buildings [S] — [arXiv 2607.00015](https://arxiv.org/pdf/2607.00015); prompt-based transformation of building code information [S] — [Automation in Construction 2024](https://www.sciencedirect.com/science/article/abs/pii/S0926580524005533).
- Tixier et al. (2016, Automation in Construction): a rule-and-dictionary NLP system scans unstructured injury reports for 101 attributes and outcomes with over 95% accuracy (precision 95%, recall 97%). It took 4 tuning rounds, each with 7 researchers reviewing 140 reports. [S] — [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0926580515002265)
- Goh & Ubeynarayana (2017): six classical classifiers on OSHA construction accident narratives; SVM was best. Motivation: classifying accident and near-miss narratives in large safety databases is time-consuming. [S] — [PubMed 28865927](https://pubmed.ncbi.nlm.nih.gov/28865927/)
- J. Constr. Eng. Manage. 148(9), 2022: 10 shallow and 5 deep methods compared on 4,770 OSHA construction accident reports. [S] — [ASCE](https://ascelibrary.org/doi/10.1061/%28ASCE%29CO.1943-7862.0002354)
- J. Constr. Eng. Manage. 150(9), 2024: INSTRUCTOR embeddings with class-imbalance treatment reach F1 82.22% on a 1,000-narrative OSHA benchmark. [S] — [ASCE](https://ascelibrary.org/doi/10.1061/JCEMD4.COENG-14515)
- Baker, Hallowell, Tixier: injury precursors can be learned from text, and safety outcomes predicted from attributes. [S] — [arXiv 1907.11769](https://arxiv.org/pdf/1907.11769), [arXiv 1908.05972](https://arxiv.org/html/1908.05972)
- LLM-assisted categorisation of highway construction accidents is a 2026 journal topic (Eng. Appl. of AI; title only). [S] — [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0952197626010808)
- Feng et al. (2023, Structural Control and Health Monitoring): NLP plus ML predicts highway bridge condition ratings straight from inspection report text; reported accuracy 89%. [S] — [Wiley](https://onlinelibrary.wiley.com/doi/10.1155/2023/9761154)
- "Mapping textual descriptions to condition ratings to assist bridge inspection… using hierarchical attention" (Automation in Construction, 2021). [S] — [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0926580521002521)
- "Automated standardization of bridge inspection data using generative AI" (Engineering Structures, 2025; title only). [S] — [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0141029625022953)
- Construction contract NLP: BERT detects contractual risk clauses in construction specifications (Automation in Construction, 2022) [S] — [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0926580522003387); knowledge-augmented language model for contract risk identification [S] — [arXiv 2309.12626](https://arxiv.org/pdf/2309.12626); deep learning detection of missing clauses (ECAM) [S] — [Emerald](https://www.emerald.com/insight/content/doi/10.1108/ecam-02-2023-0172/full/html); risk and responsibility assessment (Computers in Industry, 2025) [S] — [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0166361525000168).
- Search snippets report seven contract risk categories (payment, temporal, procedure, safety, role and responsibility, definition, reference), multi-label clause accuracy up to 93%, and that rule-based detectors struggle with long contracts. Exact paper attribution not confirmed. [S] — [Automation in Construction 2022](https://www.sciencedirect.com/science/article/pii/S0926580522003387); [Computers in Industry 2025](https://www.sciencedirect.com/science/article/pii/S0166361525000168)
- RFIs: ML predictive models for RFI management [S] — [ResearchGate](https://www.researchgate.net/publication/396704103_Enhancing_RFI_management_in_construction_through_machine_learning-driven_predictive_models); an RFI recommender for pre-construction design review using NLP, ChatGPT and vision (ASCE, 2024) [S] — [ASCE](https://doi.org/10.1061/9780784485224.020)
- Specifications: extracting structured requirements from unstructured building technical specifications for BIM (2025). [S] — [arXiv 2508.13833](https://arxiv.org/pdf/2508.13833)
- Cost documents: ML classification of construction cost documents into the International Construction Measurement Standard. [S] — [arXiv 2211.07705](https://arxiv.org/pdf/2211.07705)
- Borehole logs: GEOBERTje (Ghorbanfekr, Kerstens, Dirix, 2024), a domain-adapted model on Flemish (Dutch) borehole descriptions, classifies main, second and third lithology and "outperforms both a rule-based approach and GPT-4". [V] — [arXiv 2407.10991](https://arxiv.org/abs/2407.10991)
- Borehole descriptions are short, heterogeneous, and written in specialist vocabulary; word embeddings were used to map them in 3D (Computers & Geosciences, 2020). Deep learning text classification of borehole logs produced regional hydrofacies models (Po Plain, 2024). [S] — [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0098300419306533), [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S2214581824005068)

### Inferences

#### Usages

**C1. Clause-by-clause building code compliance over BIM-derived facts** *(civil / code checking)*
- Practice: Automated code compliance checking (ACC). Eastman et al. 2009 framed the four stages: rule interpretation, model preparation, rule execution, reporting [M]. Rules are hand-coded per clause (Solibri-style) or extracted with NLP (Zhang & El-Gohary 2016).
- Pain: Hand-coded rules are brittle and cover only a slice of the code. Each code revision or local amendment needs recoding. Scarce experts.
- Jev fit: **Clause-by-clause compliance check** plus **semantic predicate in a rule engine**. Code queries the IFC model and computes every number (widths, areas, travel distances), then passes named facts. State = clause text + facts for one element. Noul: "Does this stair, as described, satisfy this clause?" Second Noul: "Does this clause apply to this element at all?"
- Cheap and fast: A full code of about 5,000 clauses at 1,000 tokens each is 5M tokens, about $0.20 per full design pass (my assumption on clause count). That allows a re-check on every model save, not once per design stage.
- Evidence: [Zhang & El-Gohary 2016](https://ascelibrary.org/doi/10.1061/%28ASCE%29CP.1943-5487.0000346) [S]; [LLM-driven BIM checking 2025](https://arxiv.org/abs/2506.20551) [S]; [CODE-ACCORD](https://arxiv.org/abs/2403.02231) [V] as a test bed.
- Fit: **Strong** for qualitative and applicability clauses; **Medium** for clauses with nested exceptions. Main risks: multi-hop exceptions ("except where… unless…"), numeric comparisons must stay in code, geometry needs a separate engine ([arXiv 2606.12065](https://arxiv.org/pdf/2606.12065)).

**C2. Clause typing and routing before rule authoring** *(civil / code checking)*
- Practice: Before automating a code, engineers sort clauses: computable or not, quantitative or qualitative, which building element, which discipline. CODE-ACCORD kept only "self-contained" sentences for this reason.
- Pain: Codes have thousands of clauses. Manual sorting is slow. It repeats per jurisdiction and per edition.
- Jev fit: **Screening at scale** and **entity alignment**. State = one clause. Choice: {quantitative requirement, qualitative requirement, definition, exception, reference to another clause, administrative}. Noul: "Is this clause self-contained?" Choice over IFC entity classes for the clause subject.
- Cheap and fast: Whole national code sets, all editions, all local amendments, typed for cents. Enables diffing editions: "does the 2024 clause mean the same as the 2021 clause?" as a Noul.
- Evidence: [CODE-ACCORD](https://arxiv.org/abs/2403.02231) [V]; [Fuchs et al. 2024](https://arxiv.org/abs/2407.21060) [V] show LLMs carry building-regulation knowledge. Salama & El-Gohary 2016 on semantic text classification of clauses [M].
- Fit: **Strong**. Risk: clause references are multi-hop; resolve references in code and inline the target text.

**C3. Accident, injury and near-miss narrative coding** *(construction safety)*
- Practice: OSHA narratives and company incident reports are coded by cause, energy source, body part, and precursors. Tixier's 101-attribute framework is the research standard for attribute-based safety risk.
- Pain: Manual coding is slow and inconsistent. Tixier's rule system reached 95% but needed 4 tuning rounds with 7 reviewers, and dictionaries need upkeep. Supervised models need labels and reach about 82% F1.
- Jev fit: **Feature extractor** and **triage**. State = one narrative. Choice: accident type (fall, struck-by, caught-in, electrocution, …). 101 parallel Nouls, one per Tixier attribute ("Was work at height involved?"). Score: severity potential {no injury, first aid, medical case, lost time, fatality potential} for near-misses. Probabilities feed the injury-prediction models of Baker/Hallowell/Tixier.
- Cheap and fast: 4,770 reports × 101 attributes × about 400 tokens is about 193M tokens, under $8 even if every question is billed separately. No dictionary upkeep. Near-miss reports can be scored at submission time on a phone, so a high-potential near-miss reaches the safety manager the same hour.
- Evidence: [Tixier 2016](https://www.sciencedirect.com/science/article/abs/pii/S0926580515002265) [S]; [Goh & Ubeynarayana 2017](https://pubmed.ncbi.nlm.nih.gov/28865927/) [S]; [JCEM 2024, F1 82.22%](https://ascelibrary.org/doi/10.1061/JCEMD4.COENG-14515) [S]; [LLM highway accidents 2026](https://www.sciencedirect.com/science/article/pii/S0952197626010808) [S]; [leading indicators via text classification](https://doi.org/10.1061/9780784482872.053) [S].
- Fit: **Strong**. Risk: short, jargon-heavy, misspelt narratives; class imbalance on rare fatal types. Errors are recoverable.

**C4. Bridge inspection narrative versus NBI condition rating** *(infrastructure)*
- Practice: US bridge inspectors rate deck, superstructure, substructure on the 0–9 NBI scale and write narrative notes (FHWA NBIS / SNBI [M]). Ratings drive repair funding and load posting.
- Pain: Ratings vary between inspectors. Narrative and rating can disagree. Reviewing every report by a senior engineer does not scale.
- Jev fit: **Consistency auditor** (new role, see section 8) and **feature extractor**. State = component narrative + the rating definitions as Score levels. Score: NBI level 0–9 with described levels. Code compares Jev's distribution with the inspector's rating and flags large gaps. Noul per defect: "Does the text report section loss?", "exposed rebar?", "active scour?". Also **entity alignment** to map legacy free-text defects to element-level defect codes.
- Cheap and fast: About 620,000 US bridges [M] × 2,000 tokens is about 1.2B tokens, about $50 for a national QA pass. A state DOT can audit every report every cycle instead of sampling.
- Evidence: [Feng et al. 2023, 89%](https://onlinelibrary.wiley.com/doi/10.1155/2023/9761154) [S]; [hierarchical attention mapping text to ratings, 2021](https://www.sciencedirect.com/science/article/abs/pii/S0926580521002521) [S]; [gen-AI standardisation of inspection data, 2025](https://www.sciencedirect.com/science/article/pii/S0141029625022953) [S].
- Fit: **Strong** as an audit layer; **Medium** as the primary rater. Risk: ratings depend on photos and measurements that are not in the text; quantities ("30% section loss") must be bucketed by code.

**C5. Contract clause risk classification and missing-clause check** *(construction contracts)*
- Practice: Contract review against standard forms (FIDIC, AIA, NEC [M]) for risk allocation: payment, time, liability, indemnity, notice periods.
- Pain: Long bespoke contracts. Scarce legal and commercial reviewers at bid time. Rule-based tools break on long clauses.
- Jev fit: **Clause-by-clause compliance check** and **screening**. State = one clause. Choice over risk categories (payment, temporal, procedure, safety, role and responsibility, definition, reference). Score: risk to contractor {neutral, mild, onerous, unacceptable}. Missing-clause check: one Noul per required topic over a clause list ("Is there a clause that grants time extension for unforeseen ground conditions?").
- Cheap and fast: A 300-page contract costs well under a cent. Bid teams can screen every tender document, every addendum, the same day.
- Evidence: [BERT on specification risk clauses 2022](https://www.sciencedirect.com/science/article/pii/S0926580522003387) [S]; [knowledge-augmented LM](https://arxiv.org/pdf/2309.12626) [S]; [missing clauses](https://www.emerald.com/insight/content/doi/10.1108/ecam-02-2023-0172/full/html) [S]; [risk and responsibility 2025](https://www.sciencedirect.com/science/article/pii/S0166361525000168) [S].
- Fit: **Strong** for category and presence; **Medium** for risk grading. Risks: double negatives and carve-outs in legal drafting; adversarial drafting by the other party; day-count and date logic must go to code.

**C6. RFI, submittal and change-order triage** *(construction project controls)*
- Practice: RFIs and submittals are logged, routed to the right discipline, answered, and tracked. Standard workflow in AIA/CSI practice [M].
- Pain: Large projects create thousands of RFIs. Misrouting adds days. Some RFIs hide a cost or schedule claim.
- Jev fit: **Triage / router**. State = RFI text + spec section list. Choice: discipline (structural, MEP, architectural, civil, …). Noul: "Does this RFI imply a change in scope or cost?" Noul: "Is this RFI a duplicate of RFI #123?" (**record alignment**). Score: urgency {routine, affects work within 2 weeks, work stopped}, with the look-ahead dates resolved by code.
- Cheap and fast: Every incoming item routed in under a second. Duplicate detection against the whole log becomes affordable (N × log size pairs after an embedding pre-filter).
- Evidence: [RFI ML predictive models](https://www.researchgate.net/publication/396704103_Enhancing_RFI_management_in_construction_through_machine_learning-driven_predictive_models) [S]; [RFI recommender, ASCE 2024](https://doi.org/10.1061/9780784485224.020) [S].
- Fit: **Strong**. Risk: RFIs point to drawings; the referenced sheet or detail must be resolved to text by another tool.

**C7. Specification review and submittal-versus-spec check** *(construction documents)*
- Practice: Reviewers check that a product submittal meets each requirement in the spec section (CSI MasterFormat structure [M]). Designers check specs for conflicts and outdated standards.
- Pain: Tedious line-by-line reading. Junior staff do it. Misses cause rework.
- Jev fit: **Clause-by-clause compliance check** and **select, do not generate**. Code splits the spec into requirement sentences and extracts candidate values from the product data sheet. State = one requirement + the matching data-sheet excerpt. Noul: "Does the submitted product data address this requirement?" Choice: {meets, does not meet, not addressed, needs numeric check}. Numeric limits are compared in code.
- Cheap and fast: Every requirement against every submittal page for cents. Review on receipt instead of after a 2-week queue.
- Evidence: [structured requirements from building specs, 2025](https://arxiv.org/pdf/2508.13833) [S]; [BERT on spec clauses](https://www.sciencedirect.com/science/article/pii/S0926580522003387) [S].
- Fit: **Medium**. Risks: numeric equivalence and units; the supplier writes the state, so adversarial or marketing text can steer a "meets" answer.

**C8. Borehole log description to soil or lithology class** *(geotechnical)*
- Practice: Driller and geologist descriptions are mapped to a classification (USCS per ASTM D2487, or a national lithology scheme [M]) to build ground models.
- Pain: Legacy archives hold hundreds of thousands of free-text logs with inconsistent vocabulary. Manual recoding blocks regional 3D models.
- Jev fit: **Feature extractor** and **entity alignment**. State = one interval description. Choice: main lithology class. Second and third Choice for secondary components. Noul: "Does the description indicate organic content?", "fill or made ground?".
- Cheap and fast: National archives recoded in one batch. Re-run whenever the target scheme changes.
- Evidence: [GEOBERTje beats rules and GPT-4](https://arxiv.org/abs/2407.10991) [V]; [word embeddings for 3D lithology](https://www.sciencedirect.com/science/article/pii/S0098300419306533) [S]; [Po Plain hydrofacies](https://www.sciencedirect.com/science/article/pii/S2214581824005068) [S].
- Fit: **Medium**. Risks: many archives are not in English (GEOBERTje is Dutch); a domain-adapted model beat GPT-4, so a no-fine-tune model may trail; percent-based rules ("more than 12% fines") belong in code.

**C9. Cost and document classification to a standard breakdown** *(construction cost / document control)*
- Practice: Bills of quantities and cost lines are mapped to ICMS, Uniclass or MasterFormat [M] for benchmarking.
- Pain: Every firm uses its own descriptions. Mapping is manual.
- Jev fit: **Entity / record alignment**. State = line description + candidate codes pre-filtered by embeddings. Choice over the top candidates (select, do not generate).
- Cheap and fast: Millions of historic cost lines mapped for a few dollars, which unlocks benchmarking data.
- Evidence: [ML classification into ICMS](https://arxiv.org/pdf/2211.07705) [S].
- Fit: **Strong**. Risk: large code lists need a hierarchical or retrieve-then-choose design.

### Gaps
- Eastman, Lee, Jeong, Lee (2009) "Automatic rule-based checking of building designs", Automation in Construction 18(8), is the canonical ACC reference. I did not fetch it this session. [M]
- Salama & El-Gohary (2016) semantic text classification of regulatory clauses: from memory, not verified. [M]
- I could not open full texts on ScienceDirect or MDPI (HTTP 403). Accuracy figures marked [S] come from search snippets.
- A search summary mentioned a semi-supervised YAKE + guided-LDA approach with F1 0.66 on OSHA narratives. I could not confirm which paper. It would support the claim that label-free methods are weak today.
- No benchmark yet tests a closed-answer, calibrated classifier (Jev-style) on CODE-ACCORD or on OSHA narratives. That is a cheap experiment.
- FHWA SNBI details and the US bridge count are from memory. [M]

---

## 2. Mechanical and product design

### Takeaway
Evidence is thinner here than in construction. Patent screening and TRIZ classification have real literature. DFM, change requests, rationale capture, and standards applicability are plausible but lightly evidenced. Geometry must be turned into text features by CAD code first.

### Cited Findings
- "LLM-Aided Design for Manufacturing" (Sept 2026): a multi-agent system with multimodal Gemini reviews CAD parts for CNC manufacturability and redesigns them while keeping design intent; 46-part benchmark; relies on image feedback loops. [S] — [arXiv 2609.05559](https://arxiv.org/abs/2609.05559)
- DFM feedback to designers is given as text and graphics; its effect on designers has been studied (J. Mech. Des. 139(9), 2017). [S] — [ASME](https://asmedigitalcollection.asme.org/mechanicaldesign/article/139/9/094503/383801/Evaluation-of-Design-Feedback-Modality-in-Design)
- Grandi, Jain, Groom, Cramer, McComb (2024), "Evaluating Large Language Models for Material Selection": LLM recommendations "often vary significantly from those of human experts"; parallel prompting helps; two failure modes noted. [V] — [arXiv 2405.03695](https://arxiv.org/abs/2405.03695)
- MSEval: a dataset for material selection in conceptual design, for evaluating algorithmic models. [S] — [arXiv 2407.09719](https://arxiv.org/html/2407.09719v1)
- Ashby's method: performance indices plotted on property charts select candidate materials. [S] — [Materials Selection in Mechanical Design](https://www.sciencedirect.com/book/monograph/9781856176637/materials-selection-in-mechanical-design)
- Loh et al. (2006): automatic classification of patents by TRIZ inventive principle. TRIZ users search by solution principle, not application field. kNN, decision tree, SVM, naive Bayes were compared. [S] — [World Patent Information](https://www.sciencedirect.com/science/article/abs/pii/S0172219005001171)
- Of Altshuller's 40 inventive principles, 7 were judged "obscure" and 33 "distinct" for automatic classification; grouping principles helps. [S] — [Expert Systems with Applications](https://www.sciencedirect.com/science/article/abs/pii/S0957417406003307)
- TRIZ "level of invention" of a patent has been estimated with NLP, knowledge-transfer metrics and citations (Computer-Aided Design, 2012). [S] — [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0010448511003228)
- Patent classification: PatentSBERTa reached F1 0.66 on 663 CPC subclass labels; PatenTEB offers 15 tasks and 2.06M examples. [S] — [arXiv 2601.23200](https://arxiv.org/html/2601.23200)
- 22 embedding models were benchmarked on patent retrieval, classification and clustering (2026). [S] — [arXiv 2605.24297](https://arxiv.org/html/2605.24297)
- Vendor claim: CPC-based search has a theoretical recall limit near 67%, since a third of key prior art shares no CPC group with the target. [S, vendor blog] — [Amplified](https://www.amplified.ai/en/blog/07042026/benchmarking-components-llms/)
- CPC-aware neural retrieval with LLM query expansion (2026). [S] — [Springer](https://link.springer.com/article/10.1007/s42488-026-00165-8)

### Inferences

#### Usages

**M1. DFM rule check over text feature descriptions** *(design for manufacturing)*
- Practice: DFM guidelines per process (Boothroyd–Dewhurst DFMA [M]; machining, moulding, sheet-metal rules). CAD plug-ins check simple geometric rules.
- Pain: Many DFM rules are semantic ("avoid features that need a second setup", "tolerance tighter than the process needs"). Rule coverage in tools is narrow. Manufacturing engineers review late.
- Jev fit: **Semantic predicate in a rule engine**. CAD code extracts features and computes ratios, then buckets them ("hole depth-to-diameter: above 10"). State = feature list in text + process + material. Noul per guideline: "Does this part need more than one machining setup?" Score: manufacturability concern {none, minor, major, not makeable}.
- Cheap and fast: Runs on every CAD save, like a linter. Hundreds of guideline Nouls per part for a fraction of a cent.
- Evidence: [LLM-aided DFM 2026](https://arxiv.org/abs/2609.05559) [S] needs a multimodal model and image loops, which shows the text-only limit. [DFM feedback modality](https://asmedigitalcollection.asme.org/mechanicaldesign/article/139/9/094503/383801/Evaluation-of-Design-Feedback-Modality-in-Design) [S].
- Fit: **Medium**. Main risk: needs non-text input. Quality depends fully on the feature-to-text step. Spatial relations between features are hard to state in text.

**M2. Engineering change request triage and impact class** *(configuration management)*
- Practice: ECR/ECO workflow under configuration management (ISO 10007, CMII [M]). A change board classifies each request by reason, affected function, and class (form-fit-function or minor).
- Pain: Thousands of ECRs per programme. Slow boards. Similar past changes are hard to find.
- Jev fit: **Triage / router** and **record alignment**. State = ECR text + product structure labels. Choice: reason {design error, cost reduction, supplier change, regulatory, customer request, manufacturability}. Noul: "Does this change affect form, fit or function?" Noul: "Is this ECR about the same problem as ECR-X?" Score: likely impact breadth {single part, assembly, cross-system}.
- Cheap and fast: Whole ECR history compared pairwise after an embedding pre-filter. Instant pre-classification before the board meets.
- Evidence: Weak this session. Search returned only patents on change-request similarity and risk prediction [S] — [US 12361030](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/12361030). Arnarsson et al. applied NLP search to Volvo ECR databases [M].
- Fit: **Medium**. Risk: impact depends on product structure (multi-hop); pass in BOM neighbours as text.

**M3. Design rationale capture** *(design knowledge management)*
- Practice: Rationale models IBIS, QOC, DRL [M] record issues, options, arguments, decisions. In practice rationale stays buried in emails, meeting notes and review comments.
- Pain: Nobody fills rationale tools by hand. Knowledge is lost when staff leave.
- Jev fit: **Feature extractor**. State = one sentence or comment with its thread context. Choice: {issue, alternative, argument for, argument against, decision, requirement, none}. Noul: "Does this sentence state why an option was rejected?"
- Cheap and fast: Every email, PLM comment and review note tagged as it is written. Cost is negligible, so capture becomes passive.
- Evidence: Not searched in depth. Rationale mining from documents exists in software engineering literature [M]. No mechanical-design benchmark found.
- Fit: **Medium / Speculative**. Risk: sentence meaning depends on thread context; long noisy threads hurt accuracy.

**M4. Patent prior-art relevance screening and CPC/IPC pre-classification** *(IP in product design)*
- Practice: Freedom-to-operate and novelty searches. Examiners grade documents X (novelty-destroying alone), Y (in combination), A (background) in search reports [M]. Offices assign CPC/IPC codes.
- Pain: Huge candidate lists from keyword and CPC search. CPC misses about a third of key art (vendor claim). Searchers are expensive.
- Jev fit: **Screening at scale**. State = the invention's key claim features + one candidate abstract or claim. Score: {discloses all features, discloses most, same field only, unrelated}. One Noul per claim feature: "Does this document disclose a spring-loaded latch?" Feature-level Nouls give a claim chart for free. CPC: hierarchical Choice, section then class then subclass.
- Cheap and fast: 10,000 candidates × 1,500 tokens is 15M tokens, about $0.60 per search. A designer can run a prior-art screen per concept sketch, not per project.
- Evidence: [patent classification with LLMs and encoders, 2026](https://arxiv.org/html/2601.23200) [S]; [22-model embedding benchmark](https://arxiv.org/html/2605.24297) [S]; [CPC-aware retrieval](https://link.springer.com/article/10.1007/s42488-026-00165-8) [S].
- Fit: **Strong** for relevance screening; **Medium** for CPC (663+ labels need a hierarchy). Risk: claim language is dense and multi-hop; legal novelty judgment stays with a professional.

**M5. TRIZ principle and contradiction classification** *(systematic innovation)*
- Practice: TRIZ (Altshuller): map a problem to a contradiction between 39 parameters, look up the matrix, apply some of 40 inventive principles. Patent sets are tagged by principle to find analogies across fields.
- Pain: Manual tagging of patents by principle is rare and slow. Supervised models only covered the first six principles in Loh et al.
- Jev fit: **Screening at scale** and **heuristic inside a search loop**. State = patent abstract or problem statement. 40 parallel Nouls, one per principle with its textbook description as criteria. Choice for improving and worsening parameter (39 options each). Matrix lookup stays in code. Score: level of invention 1–5.
- Cheap and fast: Tagging 1M patents × 40 principles becomes a batch job of tens of dollars. That builds the cross-domain analogy index TRIZ always wanted.
- Evidence: [Loh et al. 2006](https://www.sciencedirect.com/science/article/abs/pii/S0172219005001171) [S]; [grouping of principles](https://www.sciencedirect.com/science/article/abs/pii/S0957417406003307) [S]; [level of invention estimation](https://www.sciencedirect.com/science/article/abs/pii/S0010448511003228) [S].
- Fit: **Medium**. Risk: 7 principles are "obscure" even to human raters, so ground truth is soft; calibrated probabilities help here.

**M6. Materials selection semantic pre-filter** *(Ashby method)*
- Practice: Ashby: translate function, constraints, objectives; screen; rank by performance index; check documentation. Tools: Ansys Granta Selector [M].
- Pain: Numeric ranking is solved. Qualitative constraints (corrosion medium, food contact, joinability, supply risk, process fit) live in handbooks and notes.
- Jev fit: **Semantic predicate** after numeric screening. Code ranks by index. State = requirement text + one material's qualitative datasheet notes. Noul: "Is this material suitable for continuous seawater immersion?" Choice: process compatibility.
- Cheap and fast: Every shortlisted material × every qualitative constraint checked in parallel in one request.
- Evidence: [Grandi et al. 2024](https://arxiv.org/abs/2405.03695) [V]: open-ended LLM picks diverge from experts. That supports a closed-answer, screen-only role. [MSEval](https://arxiv.org/html/2407.09719v1) [S].
- Fit: **Medium / Speculative**. Risk: answers rest on world knowledge, not on the state, unless datasheet text is supplied; numeric property comparison must stay in code.

**M7. Standards applicability screening** *(design compliance)*
- Practice: Engineers decide which clauses of ASME BPVC, ASME B31.3, ISO 12100, the EU Machinery Regulation and similar apply to a design before any check starts [M].
- Pain: Scope and exemption clauses are wordy. Missing an applicable clause is a common audit finding. Experts are scarce.
- Jev fit: **Applicability filter** (new role, see section 8). State = design description (fluid, pressure bucket, temperature bucket, service) + one scope or clause text. Noul: "Does this clause apply to this design?" Output is a ranked checklist for a human.
- Cheap and fast: All clauses of all candidate standards screened per design revision.
- Evidence: None found for mechanical standards. The building-code literature (C1, C2) is the nearest proof.
- Fit: **Speculative → Medium**. Risks: scope rules hinge on numeric thresholds (pressure, volume) that need code; nested exemptions are multi-hop; copyright limits putting standard text in state.

### Gaps
- No peer-reviewed NLP work on engineering change requests surfaced; only patents. Arnarsson et al. (Volvo ECR search) is from memory. [M]
- No literature found on automated standards-applicability screening for ASME/ISO mechanical standards.
- Design rationale mining in mechanical design: not verified.
- EPO X/Y/A categories, Boothroyd–Dewhurst, ISO 10007 and Granta are named from memory. [M]
- The 67% CPC recall limit is a vendor blog claim, not peer reviewed.

---

## 3. Manufacturing and quality

### Takeaway
Warranty and complaint text mining is the most proven area: years of published work from the automotive sector and a public 1M+ record data set (NHTSA). NCR, 8D and certificate checks fit Jev's shape well but have thin public evidence, mostly vendor material.

### Cited Findings
- Rajpathak (2013, Computers in Industry 64(5):565–580): an ontology-based text mining system for automotive warranty and service diagnosis data. [S] — [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0166361513000456)
- Failure modes mined from unstructured repair verbatims were fused with warranty failure data to improve component reliability estimates. [S] — [Knowledge and Information Systems](https://link.springer.com/article/10.1007/s10115-014-0806-3)
- An integrated framework learns an ontology automatically from unstructured automotive repair text for fault detection and isolation (Computers in Industry, 2021). [S] — [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0166361520305728)
- Ghazizadeh, McDonald, Lee (2014, Human Factors): text mining of NHTSA vehicle owner complaints extracts problem clusters and trends, and "can extend human analysis capabilities for large free-response databases to support earlier detection of problems". [S] — [SAGE](https://journals.sagepub.com/doi/abs/10.1177/0018720813519473)
- The NHTSA complaint database held more than 1.37 million reports as of 1 June 2017. [S] — [ResearchGate figure page, Das et al.](https://www.researchgate.net/figure/Top-Categories-under-Major-Complaints-in-NHTSA-Compliant-Databases_tbl5_323945901)
- NHTSA ODI uses complaints with manufacturer data (warranty claims, crashes, injuries, part sales) to decide if a defect trend exists. Data are public via APIs. [S] — [NHTSA](https://www.nhtsa.gov/resources-investigations-recalls), [NHTSA datasets](https://www.nhtsa.gov/nhtsa-datasets-and-apis)
- 49 CFR Part 573 governs defect and noncompliance reports. [S] — [eCFR](https://www.ecfr.gov/current/title-49/subtitle-B/chapter-V/part-573)
- Viellieber & Aßenmacher (2020): BERT continually pre-trained on ODI complaints answers fill-in probes with P@1 above 60% and P@5/P@10 above 80%, up to 90%. [V] — [arXiv 2012.02558](https://arxiv.org/abs/2012.02558)
- Customer complaint text can reveal emerging reliability issues. [S] — [arXiv 1607.07745](https://arxiv.org/pdf/1607.07745)
- 8D is the standard structured problem-solving method in automotive supply chains. [S] — [ASQ](https://asq.org/quality-resources/eight-disciplines-8d)
- A big-data root cause analysis system used TF-IDF features from quality problem reports and supervised classifiers to predict root causes (Computers & Industrial Engineering, 2021). [S] — [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0360835221004848)
- NCRs carry free-text defect description, severity class, disposition (use-as-is, rework, scrap, return), root cause, and corrective action. [S] — [SimplerQMS](https://simplerqms.com/non-conformance-report/)
- A US patent covers an associative-memory agent that analyses free-text manufacturing non-conformance records. [S] — [US 10410146](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/10410146)
- Hierarchical labelling of imbalanced customer complaint text with BERT (first level) and semantic matching (deeper levels). [S] — [PMC8178387](https://pmc.ncbi.nlm.nih.gov/articles/PMC8178387/)
- LLMs plus knowledge graphs have been used to extract and validate textual test data and check compliance across heterogeneous formats. [S] — [arXiv 2408.01700](https://arxiv.org/pdf/2408.01700)
- Vendor claims on mill test certificates (EN 10204): manual offshore review takes 24–72 hours and costs $1.50–$4.00 per certificate; AI agents extract fields, cross-check against specs, and route low-confidence items to engineers. [S, vendors] — [DocumentIQ](https://documentiq.algoscale.com/blog/automating-mill-test-certificate-mtc-mtr-extraction-metals-manufacturing), [Datagrid](https://datagrid.com/blog/ai-agents-material-test-report-validation), [Customiser on EN 10204](https://www.customiser.ai/news/mill-test-certificate-verification-en-10204)
- Vision-language anomaly work: WinCLIP does zero/few-shot anomaly classification with text prompts [S] — [arXiv 2303.14814](https://arxiv.org/pdf/2303.14814); GenAU (2026) adds textual defect analysis in one framework [S] — [arXiv 2607.01049](https://arxiv.org/html/2607.01049); "Detect, Classify, Act" categorises industrial anomalies with multimodal LLMs (CVPR workshop 2025) [S] — [CVF](https://openaccess.thecvf.com/content/CVPR2025W/VAND/papers/Mokhtar_Detect_Classify_Act_Categorizing_Industrial_Anomalies_with_Multi-Modal_Large_Language_CVPRW_2025_paper.pdf)

### Inferences

#### Usages

**Q1. Non-conformance report coding and disposition routing** *(quality management)*
- Practice: Control of nonconforming output under ISO 9001 clause 8.7 and AS9100; Material Review Board decides disposition [M].
- Pain: Free-text defect descriptions. Inconsistent defect codes across plants. MRB engineers are a bottleneck. Pareto charts are only as good as the codes.
- Jev fit: **Triage / router** and **feature extractor**. State = NCR text + part family. Choice: defect class (dimensional, surface, material, assembly, documentation, damage). Choice: likely origin (supplier, internal process, handling, design). Noul: "Does this affect a key or safety characteristic?" Score: {cosmetic, minor, major, critical}.
- Cheap and fast: Code at entry, on the shop-floor terminal, with instant prompts for missing detail. Recode the full legacy NCR base under one taxonomy for a few dollars.
- Evidence: Thin. [NCR content](https://simplerqms.com/non-conformance-report/) [S]; [US 10410146](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/10410146) [S]. The warranty and accident-narrative results transfer by analogy.
- Fit: **Strong** on task shape, weak on public evidence. Risk: measured values versus tolerance must be compared in code; shop jargon and part numbers.

**Q2. 8D / CAPA root-cause category coding and quality check** *(problem solving)*
- Practice: 8D (Ford origin), CAPA under ISO 13485 / FDA 21 CFR 820 [M]. Root causes are grouped with Ishikawa 6M categories. Customers audit 8D quality.
- Pain: Thousands of 8D reports with uncoded root causes. Weak 8Ds ("operator error", "retrained operator") slip through. Lessons are not reused.
- Jev fit: **Feature extractor** and **verifier**. State = the D4 root-cause text and the D5 action. Choice: {man, machine, method, material, measurement, environment} or a finer company taxonomy. Noul: "Does the stated root cause explain the failure mechanism, or only restate the symptom?" Noul: "Does the corrective action address the stated root cause?" Noul: "Is this the same root cause as 8D-X?"
- Cheap and fast: Every supplier 8D scored on receipt. Weak reports bounce back in seconds, not after a supplier quality engineer finds time.
- Evidence: [big-data RCA system, 2021](https://www.sciencedirect.com/science/article/abs/pii/S0360835221004848) [S]; [ASQ 8D](https://asq.org/quality-resources/eight-disciplines-8d) [S].
- Fit: **Strong**. Risk: causal adequacy is a judgment call; treat as screen with human appeal. Suppliers write the state, so adversarial wording is possible.

**Q3. Warranty claim verbatim coding** *(automotive and durable goods)*
- Practice: Dealers enter customer complaint, cause, correction ("3C") text plus labour and part codes. OEMs mine them for early warning. US TREAD Act reporting sits on top [M].
- Pain: Millions of claims per year. Labour codes are often wrong or generic. Ontology and dictionary systems need constant upkeep.
- Jev fit: **Feature extractor**, **consistency auditor**, **record alignment**. State = 3C text. Choice: symptom class; Choice: failure mode; Noul: "Does the technician text agree with the claimed labour code description?"; Noul: "No trouble found?"; Noul: "Safety-related (fire, loss of motive power, brakes, steering, airbag)?".
- Cheap and fast: 10M claims × 300 tokens is 3B tokens, about $120 per full pass (my assumption on size). Daily re-coding under a new taxonomy becomes routine. Probabilities feed the classical early-warning statistics as features.
- Evidence: [Rajpathak 2013](https://www.sciencedirect.com/science/article/abs/pii/S0166361513000456) [S]; [fused reliability model](https://link.springer.com/article/10.1007/s10115-014-0806-3) [S]; [ontology learning from repair text 2021](https://www.sciencedirect.com/science/article/abs/pii/S0166361520305728) [S].
- Fit: **Strong**. Risk: terse technician shorthand, mixed languages, part numbers.

**Q4. NHTSA complaint mining and defect early warning** *(vehicle safety)*
- Practice: NHTSA ODI screens owner complaints for defect trends. OEMs watch the same public data. 49 CFR 573 governs defect reports.
- Pain: 1.37M+ free-text complaints. The owner-picked component field is noisy. Analysts are few.
- Jev fit: **Screening at scale** and **feature extractor**. State = complaint narrative. Parallel Nouls: "vehicle was moving", "fire or smoke", "loss of steering control", "airbag did not deploy", "occurred after a recall repair". Choice: component system. Score: hazard level. Code aggregates calibrated probabilities per model-year and runs trend statistics.
- Cheap and fast: 1.37M × 500 tokens is 685M tokens, about $27 for the full history. New hypotheses ("unintended acceleration after software update") can be tested over the whole corpus in minutes, as a new Noul.
- Evidence: [Ghazizadeh et al. 2014](https://journals.sagepub.com/doi/abs/10.1177/0018720813519473) [S]; [Viellieber & Aßenmacher 2020](https://arxiv.org/abs/2012.02558) [V]; [emerging reliability issues](https://arxiv.org/pdf/1607.07745) [S].
- Fit: **Strong**. Public data makes it an ideal demo. Risk: counting and trend maths stay in code; emotional, rambling narratives.

**Q5. Customer complaint coding and reportability flag** *(quality / regulatory)*
- Practice: Complaint handling under ISO 10002, and for medical devices 21 CFR 820.198 with reportability under 21 CFR 803 [M].
- Pain: Volume, many channels, imbalanced classes, reporting deadlines.
- Jev fit: **Triage / router**. Choice: product area and defect family (hierarchical). Noul: "Does the text allege an injury?" Noul: "Does the text allege a malfunction that could cause harm if it recurs?" Low confidence escalates.
- Cheap and fast: Every email, call transcript and review screened in real time. A cheap second pass over old "closed" complaints finds missed reportables.
- Evidence: [hierarchical BERT labelling of imbalanced complaints](https://pmc.ncbi.nlm.nih.gov/articles/PMC8178387/) [S].
- Fit: **Strong**. Risk: a missed reportable event has regulatory cost, so tune thresholds for recall and keep a human in the loop.

**Q6. Supplier document checks: CoC, mill test certificates, PPAP** *(supplier quality)*
- Practice: EN 10204 inspection documents; certificates of conformance; AIAG PPAP with 18 elements [M]. Receiving inspection checks the documents against the PO and spec.
- Pain: Varied layouts, scanned PDFs, manual checks at $1.50–$4.00 and 24–72 hours each (vendor claim).
- Jev fit: **Clause-by-clause compliance check** and **select, do not generate**. OCR and code extract fields; code compares chemistry and mechanical values with limits. Jev does the semantic part. Noul: "Does the certificate state the same material grade and condition as the PO?" (grade naming varies). Choice: certificate type {2.1, 2.2, 3.1, 3.2}. Noul per PPAP element: "Is a process FMEA present in this package?" Noul: "Does the conformance statement cover the ordered revision?"
- Cheap and fast: Check at the receiving dock in seconds, on-site, with no data leaving to an outsourcer.
- Evidence: [LLM + knowledge graph validation of test data](https://arxiv.org/pdf/2408.01700) [S]; vendor deployments ([Datagrid](https://datagrid.com/blog/ai-agents-material-test-report-validation), [DocumentIQ](https://documentiq.algoscale.com/blog/automating-mill-test-certificate-mtc-mtr-extraction-metals-manufacturing)) [S].
- Fit: **Medium / Strong**. Risks: numeric limits (code), OCR errors, and fraud. A forged certificate is adversarial text.

**Q7. Work instruction checks** *(manufacturing engineering)*
- Practice: Controlled work instructions under ISO 9001 clause 7.5 / IATF 16949; aerospace uses ASD-STE100 Simplified Technical English [M].
- Pain: Thousands of instructions. Reviews look at format, not clarity. Ambiguous steps cause defects.
- Jev fit: **Verifier**. State = one step + the control plan line. Noul: "Does this step state a verifiable acceptance criterion?" Noul: "Does this step name the tool or torque setting that the control plan requires?" Noul: "Does this step contain more than one action?" Score: clarity.
- Cheap and fast: Lint every instruction on each revision, like a spell checker.
- Evidence: None found this session. No published benchmark.
- Fit: **Speculative → Medium**. Risk: instructions rely on pictures; step order logic is sequential reasoning.

**Q8. Visual inspection: caption to plant defect taxonomy and disposition** *(inspection)*
- Practice: Automated optical inspection plus acceptance standards such as IPC-A-610 classes or AWS D1.1 weld acceptance [M].
- Pain: Vision models give generic labels or free-text captions. Each plant has its own defect codes and accept/rework/scrap rules.
- Jev fit: **Caption-to-taxonomy bridge** (new role, see section 8). A vision-language model writes the defect description. Code adds measured size buckets. Jev: Choice over the plant's defect codes; Choice: {accept, rework, scrap, escalate} given the acceptance criteria text in state.
- Cheap and fast: Adds 10–100 ms and almost no cost per part, so it fits inline at line rate. New defect classes need a new text description, not retraining.
- Evidence: [WinCLIP](https://arxiv.org/pdf/2303.14814) [S]; [GenAU 2026](https://arxiv.org/html/2607.01049) [S]; [Detect, Classify, Act](https://openaccess.thecvf.com/content/CVPR2025W/VAND/papers/Mokhtar_Detect_Classify_Act_Categorizing_Industrial_Anomalies_with_Multi-Modal_Large_Language_CVPRW_2025_paper.pdf) [S].
- Fit: **Medium**. Risk: needs non-text input; errors of the upstream captioner pass straight through.

### Gaps
- No peer-reviewed study of NCR text classification surfaced. Only a patent and vendor pages.
- I could not confirm the authors of the 2021 Computers & Industrial Engineering RCA paper (HTTP 403).
- Work instruction quality checking with NLP: no sources found.
- MES and operator shift-log triage was left out on purpose. It overlaps with maintenance work orders, which another researcher covers.
- Mill certificate cost and turnaround numbers are vendor claims.
- The 1.37M NHTSA figure is from 2017. The current count is higher; I did not fetch it.
- ISO 9001, AS9100, IATF 16949, AIAG PPAP, ISO 10002, 21 CFR 820/803, IPC-A-610, AWS D1.1, ASD-STE100 are named from memory. [M]

---

## 4. Automotive functional safety (ISO 26262 HARA, SOTIF, ODD)

### Takeaway
S, E and C ratings map exactly onto Jev's Score primitive, but a benchmark published four days before this note (SAFARI, 17 Sept 2026) shows nine frontier LLMs do badly at it: best macro-F1 is 0.51 for Severity and 0.26 for Controllability. Chain-of-thought made it worse. So Jev fits as a calibrated second rater and consistency auditor, not as the rater of record.

### Cited Findings
- ISO 26262 HARA: engineers identify hazardous events, assign Severity, Exposure and Controllability, then derive the ASIL. [V] — [SAFARI, arXiv 2609.20584](https://arxiv.org/abs/2609.20584)
- SAFARI (Wu, Wang, Zhang, Wang, Xu; submitted 17 Sept 2026) is "the first industrial benchmark for LLM-assisted automotive HARA": 3,000 de-identified industrial cases on "unintended drive force or torque output", from HARA workshops by certified functional-safety engineers. [V] — [arXiv 2609.20584](https://arxiv.org/html/2609.20584)
- SAFARI best macro-F1 across nine frontier LLMs: Severity 0.514 (GPT-5.5 few-shot), Exposure 0.318 (Qwen3.5-397B few-shot), Controllability 0.261, derived ASIL 0.261. [V] — [arXiv 2609.20584](https://arxiv.org/html/2609.20584)
- SAFARI: "CoT prompting provides limited benefit and often degrades categorical risk assessment." The false-QM rate on ASIL A/B/C cases rose from 14.9% to 41.0% under chain-of-thought. [V] — [arXiv 2609.20584](https://arxiv.org/html/2609.20584)
- SAFARI: Controllability is hardest; "models frequently miscalibrate the driver's ability to avoid or mitigate the hazardous event". Authors say expert oversight should focus on context omissions and controllability misjudgments. [V] — [arXiv 2609.20584](https://arxiv.org/html/2609.20584)
- Abbaspour, Arab, Mousavi (2024): generative AI support cut HARA time and widened risk coverage, and helped brainstorming. It complemented experts. [V] — [arXiv 2410.23207](https://arxiv.org/abs/2410.23207)
- Fraunhofer IESE describes LLM–human co-engineering for HARA; LLMs are not yet reliable enough to work alone. [S] — [Fraunhofer IESE blog](https://www.iese.fraunhofer.de/blog/safety-engineers-conducting-hara-with-lasar/)
- SOTIF (ISO 21448): a triggering condition is a scenario condition that activates a functional insufficiency. Methods to discover them exist for perception. [S] — [arXiv 2303.04037](https://arxiv.org/pdf/2303.04037), [arXiv 2407.21569](https://arxiv.org/pdf/2407.21569)
- ODD: operating domain and ODD have been formalised for automated vehicles. [S] — [arXiv 2408.14481](https://arxiv.org/pdf/2408.14481)
- LLMs convert ODD descriptions into executable simulation scenarios, splitting the ODD into environmental, scenery and dynamic elements. [S] — [Electronics 14(16):3177](https://www.mdpi.com/2079-9292/14/16/3177)

### Inferences

#### Usages

**A1. HARA second rater and cross-project consistency audit** *(ISO 26262-3)*
- Practice: Workshop teams rate each hazardous event: S0–S3, E0–E4, C0–C3, using the class definitions and example tables of ISO 26262-3. ASIL comes from a fixed table.
- Pain: Hundreds to thousands of hazardous events per item. Ratings drift between teams, projects and years. Assessors spot-check only.
- Jev fit: **Consistency auditor** and **verifier**. State = one hazardous event: malfunction + driving situation + the rater's rationale. Three Score questions with the standard's level descriptions as levels. Code looks up the ASIL. Code flags rows where the human rating has low probability under Jev. **Record alignment** Noul: "Do these two rows from different projects describe the same hazardous event?" then compare their ratings.
- Cheap and fast: 3,000 cases × 3 questions × 800 tokens is 7.2M tokens, about $0.29. A company can audit its whole HARA archive at each standards update. In the workshop, a 100 ms answer gives a live "you rated similar events differently" prompt.
- Evidence: [SAFARI](https://arxiv.org/html/2609.20584) [V] is the key test bed and a warning: best C macro-F1 0.261. Chain-of-thought hurt, so a non-reasoning calibrated classifier is a fair thing to test, but it is untested. [Abbaspour et al. 2024](https://arxiv.org/abs/2410.23207) [V] shows value as an assistant.
- Fit: **Medium** as auditor; **Speculative** as primary rater. Main risks: safety-critical; Controllability needs vehicle-dynamics judgment; Exposure is about frequency, close to numeric. Never let Jev lower an ASIL without human sign-off.

**A2. SOTIF triggering-condition coding of field and test reports** *(ISO 21448)*
- Practice: Disengagement reports, test-driver notes and incident reports are reviewed to find triggering conditions and functional insufficiencies, using taxonomies from the ISO 21448 annexes.
- Pain: Fleets produce very many short free-text reports. Known versus unknown unsafe scenarios must be tracked.
- Jev fit: **Feature extractor** and **triage**. State = report text + logged context as named buckets. Parallel Nouls: "low sun or glare involved?", "road works?", "unusual object?", "sensor blockage?". Choice: insufficiency class {perception, prediction, planning, HMI, none}. Noul: "Does this match a known triggering condition in the list?" A low match is the interesting signal: possible unknown scenario.
- Cheap and fast: Every fleet event coded within the day. Whole-archive re-runs when the taxonomy grows.
- Evidence: No LLM or NLP paper on triggering-condition classification surfaced. Nearest: [discovery of perception triggering conditions](https://arxiv.org/pdf/2303.04037) [S].
- Fit: **Medium / Speculative**. Risk: reports are terse; sensor data must be pre-bucketed by code.

**A3. ODD attribute tagging and ODD-exit screening from text sources** *(automated driving)*
- Practice: ODD taxonomies (ISO 34503, BSI PAS 1883 [M]) list scenery, environment and dynamic attributes. Scenario databases are tagged for coverage arguments. Vehicles monitor ODD limits at run time.
- Pain: Scenario libraries have free-text or uneven tags. Run-time ODD facts sometimes arrive as text: traffic messages, road-works notices, weather alerts.
- Jev fit: Offline **screening at scale**: tag scenario descriptions with ODD attributes (parallel Choice per attribute). Online **semantic predicate**: Noul "Does this road-works notice describe a condition outside the ODD?" with the ODD text in state. Numeric limits (speed, rain rate, visibility) stay in code.
- Cheap and fast: Millions of scenarios tagged for dollars. Online, 10–100 ms fits a 1–10 Hz ODD monitor.
- Evidence: [ODD formalisation](https://arxiv.org/pdf/2408.14481) [S]; [LLM ODD-to-scenario generation](https://www.mdpi.com/2079-9292/14/16/3177) [S].
- Fit: **Medium** offline, **Speculative** online. Risk: safety-critical; most run-time ODD checks are plain comparisons that code does better.

### Gaps
- Nouri et al. (2024) published LLM-based HARA and safety-requirement prototypes with Volvo/Zenseact; from memory, not verified. [M]
- SAFARI does not report model calibration. Whether calibrated probabilities make expert routing effective on this task is untested.
- No literature found on NLP or LLM classification of SOTIF triggering conditions from text.
- ISO 34503 and PAS 1883 are from memory. [M]
- Direct ASIL assignment is a table lookup. It belongs in code, so it is listed under Poor fits.

---

## 5. Aerospace

### Takeaway
Aviation has long-running, labelled text archives (ASRS, NTSB, maintenance logs with ATA codes) and published classifiers at 85–90% accuracy. Jev fits coding, repeat-defect matching, and safety-report triage. AD applicability and DO-178C checks are possible but carry multi-hop and safety-critical risk.

### Cited Findings
- ATA 100 chapters, mirrored in the FAA JASC code table, are the standard system for coding aircraft systems in maintenance records. [S] — [Wikipedia: ATA 100](https://en.wikipedia.org/wiki/ATA_100), [PHM Society 2019](https://papers.phmsociety.org/index.php/phmconf/article/download/818/phmc_19_818)
- Scott, Kirkpatrick, Verhagen, Kekoc, Teunisse, Zhang, Fayek, Marzocca (ICAS 2024, RMIT and Australian DSTG): an NLP framework over maintenance and pilot reports for a mixed fleet over two years detects recurrent defects and early lead indicators. Reports today "require manual and often difficult analysis". [V, PDF text extracted] — [ICAS 2024](https://www.icas.org/icas_archive/icas2024/data/papers/icas2024_0083_paper.pdf)
- A search snippet describes a study comparing CountVectorizer + LinearSVC, TF-IDF and Word2Vec + logistic regression, and fine-tuned DistilBERT for 30 ATA chapter–section classes. Paper attribution not confirmed; likely the PHM Asia-Pacific 2025 paper. [S] — [PHMAP 2025](http://papers.phmsociety.org/index.php/phmap/article/download/4652/phmap_25_4652)
- NLP clustering finds recurring defects that ATA-chapter analysis alone misses. [S] — [Savostin et al. 2025](http://nvngu.in.ua/jdownloads/pdf/2025/6/06_2025._Savostin.pdf)
- Nanyonga, Wasswa, Turhan, Molloy, Wild: on 27,000 NTSB reports, RNN-family models classify aircraft damage level (4 classes) from narrative; all above 87.9% accuracy, best 90%. [V] — [arXiv 2501.06490](https://arxiv.org/abs/2501.06490)
- ASRS is a voluntary, confidential reporting system used for human-factors research. LLMs have been applied to classify primary problem type (human versus non-human factors) and to summarise narratives. [S] — [UMD](https://www.cs.umd.edu/content/large-language-models-aviation-safety-enhancing-incident-analysis-through-summarization-asrs), [arXiv 2605.12332](https://arxiv.org/pdf/2605.12332)
- HaGen (Aug 2026) generates traceable hazard scenarios grounded in ASRS reports. [S] — [arXiv 2608.04697](https://arxiv.org/abs/2608.04697)
- HFACS-based LLM reasoning has been applied to UAV accident reports (Drones, 2025). [S] — [MDPI](https://doi.org/10.3390/drones9100704)
- A risk-level identification model for aviation safety reports (Eng. Appl. of AI, 2024). [S] — [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0952197624010595)
- FAA: AD applicability sections list affected models and special considerations such as installed part numbers or modifications; owners must search ADs for the product and every installed appliance. [S] — [FAA](https://www.faa.gov/aircraft/air_cert/continued_operation/ad/app_comp)
- Vendor claim: over 60% of MROs and airlines still track AD applicability in spreadsheets or paper. [S, vendor] — [OxMaint](https://oxmaint.com/industries/aviation-management/airworthiness-directive-ad-compliance-tracking-cmms)
- DO-178C and DO-278A compliance is commonly shown with review checklists; a published set exists (Computer Standards & Interfaces, 2017). [S] — [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0920548916301520)

### Inferences

#### Usages

**E1. ATA / JASC coding of pilot write-ups and maintenance log entries** *(continuing airworthiness)*
- Practice: Each defect and action is coded by ATA chapter–section. Reliability programmes and service difficulty reports (FAA SDR, 14 CFR 121.703 [M]) depend on these codes.
- Pain: Technicians pick wrong or generic chapters. Reliability engineers recode by hand. Terse, abbreviation-heavy text.
- Jev fit: **Triage** and **consistency auditor**. State = write-up + corrective action text. Hierarchical Choice: chapter, then section. Noul: "Does the entered ATA code match the described system?" Noul: "Is this a deferred defect under the MEL?".
- Cheap and fast: Suggest the code while the technician types (100 ms). Recode 10 years of fleet history for a few dollars to clean reliability statistics.
- Evidence: [ICAS 2024](https://www.icas.org/icas_archive/icas2024/data/papers/icas2024_0083_paper.pdf) [V]; [PHM 2019 equipment taxonomy](https://papers.phmsociety.org/index.php/phmconf/article/download/818/phmc_19_818) [S]; [DistilBERT on 30 chapter–section classes](http://papers.phmsociety.org/index.php/phmap/article/download/4652/phmap_25_4652) [S].
- Fit: **Strong**. Risk: heavy abbreviations ("R ENG BLD VLV INOP"); put a glossary in instructions.

**E2. Repeat-defect and recurrent-fault matching** *(reliability programmes)*
- Practice: Operators must find repeat defects (same fault on the same aircraft within N flights or days) and fleet-wide recurring defects. Reliability programme guidance: FAA AC 120-17 [M].
- Pain: Same fault, different words, different ATA code. Keyword matching misses them.
- Jev fit: **Entity / record alignment**. Code selects candidate pairs by tail number and time window (dates handled in code). Noul: "Do these two write-ups describe the same underlying fault?" Noul: "Did the earlier corrective action target the same component?"
- Cheap and fast: Every new write-up compared with the aircraft's last 50 entries at sign-off time, for about $0.002.
- Evidence: [ICAS 2024](https://www.icas.org/icas_archive/icas2024/data/papers/icas2024_0083_paper.pdf) [V] targets exactly this; [Savostin 2025](http://nvngu.in.ua/jdownloads/pdf/2025/6/06_2025._Savostin.pdf) [S].
- Fit: **Strong**. Risk: date windows must be computed by code, not by Jev.

**E3. Safety report coding: ASRS, NTSB, operator SMS reports** *(safety management)*
- Practice: ICAO Annex 19 safety management; occurrence categories (CICTT/ADREP), HFACS for human factors [M]. Analysts code each report.
- Pain: Large volume and few analysts. Multi-label, imbalanced classes.
- Jev fit: **Feature extractor** and **triage**. State = narrative. Parallel Nouls per contributing factor ("fatigue mentioned?", "communication breakdown with ATC?"). Choice: occurrence category. Score: risk level using the operator's risk-matrix descriptions.
- Cheap and fast: Whole ASRS-scale archives re-coded under a new taxonomy in an afternoon. SMS reports triaged on submission.
- Evidence: [NTSB damage level, ~90%](https://arxiv.org/abs/2501.06490) [V]; [ASRS LLM work](https://www.cs.umd.edu/content/large-language-models-aviation-safety-enhancing-incident-analysis-through-summarization-asrs) [S]; [HFACS-LLM](https://doi.org/10.3390/drones9100704) [S]; [risk level identification](https://www.sciencedirect.com/science/article/abs/pii/S0952197624010595) [S].
- Fit: **Strong**. Risk: HFACS levels need causal inference across the narrative (multi-hop); keep questions literal.

**E4. Airworthiness directive and service bulletin applicability screening** *(continuing airworthiness)*
- Practice: For each new AD or SB, engineers decide if it applies to each aircraft, engine, propeller and appliance, by model, serial range, part number and modification status (14 CFR Part 39 [M]).
- Pain: Applicability text is semi-structured prose with conditions and exceptions. Many operators still use spreadsheets (vendor claim).
- Jev fit: **Applicability filter** plus **select, do not generate**. Code resolves serial ranges and part-number matches into named facts. State = AD applicability paragraph + aircraft configuration facts. Choice: {applies, does not apply, applies only if condition X, needs engineer}. Noul: "Does the AD exempt aircraft that already incorporate SB-123?"
- Cheap and fast: Each new AD × each tail × each installed appliance, screened the day it is published.
- Evidence: [FAA applicability guidance](https://www.faa.gov/aircraft/air_cert/continued_operation/ad/app_comp) [S]. No peer-reviewed NLP study found. Vendor tools claim a 90% cut in assessment time ([OxMaint](https://oxmaint.com/industries/aviation-management/airworthiness-directive-ad-compliance-tracking-cmms)) [S, vendor].
- Fit: **Medium**. Risks: safety-critical; serial ranges and compliance times are numeric and date logic; exceptions are multi-hop. Use to pre-sort, with a human decision on every "does not apply".

**E5. DO-178C / DO-254 review checklist pre-screen** *(certification)*
- Practice: Reviews of requirements, design, code and tests use checklists tied to DO-178C objectives.
- Pain: Reviewer time. Checklist fatigue.
- Jev fit: **Verifier**. State = one artefact (for example one high-level requirement) + one checklist item. Noul: "Is this requirement verifiable as written?" "Does it contain design detail?" "Does it use an undefined term?"
- Cheap and fast: Every requirement × every checklist item on every baseline.
- Evidence: [published checklists](https://www.sciencedirect.com/science/article/abs/pii/S0920548916301520) [S]. No LLM study found for DO-178C.
- Fit: **Speculative**. This overlaps with software and requirements engineering, which another researcher covers. Noted here only for completeness. Risk: certification credit needs tool qualification (DO-330 [M]).

### Gaps
- The 30-class DistilBERT ATA result could not be tied to a paper with certainty.
- No peer-reviewed work found on NLP for AD or SB applicability.
- No LLM work found on DO-178C or DO-254 checklist automation.
- 14 CFR 121.703, AC 120-17, Part 39, ICAO Annex 19, CICTT and DO-330 are named from memory. [M]

---

## 6. Electrical and power equipment

### Takeaway
The pattern is clean: code computes the standard diagnostics (gas ratios, Duval zones, relay event parsing), then Jev adds the judgment that needs text: inspection notes, crew remarks, context. One published study already grades defect notes on a four-level scale, which is a direct Score match.

### Cited Findings
- A 2025 study grades power equipment defects (Levels I–IV, assigned by certified engineers) from natural-language defect descriptions. It uses two-stage retrieval with a fine-tuned Sentence-BERT plus chain-of-thought prompting, zero-shot, on 218 inspection records. [S] — [Electronics 14(15):3101](https://doi.org/10.3390/electronics14153101)
- DGA is the main technique for incipient transformer faults. Traditional interpretation uses IEC codes, Rogers ratios and the Duval triangle; their accuracy is often lacking, so hybrid rule-plus-ML systems are used. [S] — [Scientific Reports 2024](https://www.nature.com/articles/s41598-024-78293-7)
- LLM knowledge distillation has been applied to DGA-based transformer diagnosis (2025). [S] — [Springer](https://link.springer.com/chapter/10.1007/978-981-95-2581-2_22)
- Combining DGA with physical inspection confirmed DGA fault predictions in practice (Electric Power Systems Research, 2025). [S] — [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0378779625012568)
- Outage cause identification guides restoration; outage data are today checked by hand, which is slow, and much waveform data goes unprocessed. [S] — [OSTI 1972556](https://www.osti.gov/servlets/purl/1972556)
- Industry commentary: LLMs can categorise trouble tickets and sensor reports to prioritise utility response. [S] — [Utility Analytics Institute](https://utilityanalytics.com/large-language-models-grid-analytics/)
- Knowledge-graph plus LLM fault diagnosis has been proposed for VSC-HVDC systems and substations. [S] — [AIP Advances 2025](https://pubs.aip.org/aip/adv/article/15/11/115330/3373210/Knowledge-graph-enhanced-and-LLM-guided-fault), [arXiv 2311.13708](https://arxiv.org/pdf/2311.13708)
- PNNL catalogued AI use cases for power systems (report PNNL-38003). [S] — [PNNL](https://www.pnnl.gov/main/publications/external/technical_reports/PNNL-38003.pdf)

### Inferences

#### Usages

**P1. Defect severity grading from inspection notes** *(asset management)*
- Practice: Utilities grade each recorded defect on a severity scale (for example Levels I–IV, or critical / serious / general) under company and national rules. The grade sets the repair deadline.
- Pain: Large numbers of free-text defect records. Grading rules are long documents. Graders differ.
- Jev fit: **Triage** with **Score**. State = defect description + equipment type + the matching grading rule text (retrieved by code). Score: Level I–IV with each level described. Low confidence goes to an engineer.
- Cheap and fast: Grade at entry on the inspector's tablet. Re-grade the full backlog when rules change.
- Evidence: [Electronics 2025](https://doi.org/10.3390/electronics14153101) [S] did this zero-shot with retrieval plus chain-of-thought. Test whether Jev matches it without generated reasoning.
- Fit: **Strong**. Risk: rules contain numeric thresholds (temperature rise, leak rate); code must bucket them. Source data in that study are probably Chinese; English is Jev's best language.

**P2. DGA interpretation layer: from computed category to action** *(transformer diagnostics)*
- Practice: IEEE C57.104 and IEC 60599 [M]: compute gas levels, rates, ratios, Duval zone; assign a status; choose an action (resample interval, further tests, take out of service).
- Pain: Numeric methods disagree and ignore context: recent oil processing, tap-changer type, load history, past repairs, nameplate notes. Experts who weigh this are retiring.
- Jev fit: **Supervisory layer over numeric diagnostics**. Code computes every ratio and zone and passes them as named facts ("Duval zone: T3", "C2H2 trend: rising fast"). State adds maintenance notes. Choice: next action from a closed set. Noul: "Do the notes give a benign explanation for the gas rise (for example recent degassing or oil top-up)?"
- Cheap and fast: Run across the whole fleet after each sample batch. Online DGA monitors can trigger it on each reading.
- Evidence: [hybrid DGA systems](https://www.nature.com/articles/s41598-024-78293-7) [S]; [LLM distillation for DGA](https://link.springer.com/chapter/10.1007/978-981-95-2581-2_22) [S]; [DGA plus inspection](https://www.sciencedirect.com/science/article/abs/pii/S0378779625012568) [S].
- Fit: **Medium**. Risk: numeric core must stay in code; a wrong "benign" call on a failing transformer is costly, so use Jev to rank for review and never to clear an alarm alone.

**P3. Relay event report and outage cause coding** *(protection and reliability)*
- Practice: After a fault, engineers read relay event records (COMTRADE, IEEE C37.111 [M]) and crew notes, then assign a cause code for reliability reporting (IEEE 1366 indices, IEEE 1782 cause categories [M]).
- Pain: Manual review is slow. "Unknown" is the most used cause code. Waveform files go unread.
- Jev fit: **Feature extractor** and **triage**. Code parses the record into named facts: fault type, phases, duration bucket, reclose result, weather feed, time of day. State adds crew notes and customer call text. Choice: cause {vegetation, animal, lightning, equipment failure, vehicle, public, unknown}. Noul: "Did protection operate as expected for this fault description?" goes to a protection engineer when low.
- Cheap and fast: Every event coded within minutes. Fewer "unknown" codes means better vegetation and animal-guard spending.
- Evidence: [OSTI outage cause classification](https://www.osti.gov/servlets/purl/1972556) [S] (waveform-based, shows the pain); [Utility Analytics](https://utilityanalytics.com/large-language-models-grid-analytics/) [S]. No paper found on text classification of relay event reports.
- Fit: **Medium**. Risk: waveform analysis is signal processing; Jev sees only what code extracts. Time comparisons stay in code.

### Gaps
- The Electronics 2025 accuracy figures could not be read (HTTP 403).
- No literature found on NLP for protection relay event reports.
- IEEE C57.104, IEC 60599, IEEE C37.111, IEEE 1366 and IEEE 1782 are named from memory. [M]
- Industrial alarm management and maintenance work orders are left to other researchers, as instructed.

---

## 7. Robotics and autonomy

### Takeaway
This is the one subfield where speed changes the design, not just the cost. SayCan already uses the language model only as a scorer over a closed skill list, which is Jev's native shape. Today's LLMs answer in 1–2 seconds, so they run outside the control loop. At 10–100 ms a semantic layer can run at 10–100 Hz beside the planner, if the network hop is removed.

### Cited Findings
- SayCan (Ahn et al., 2022) picks the next skill by combining "probabilities from a language model (representing the probability that a skill is useful for the instruction)" with "probabilities from a value function (representing the probability of successfully executing said skill)". It repeats until a terminate step. [V] — [say-can.github.io](https://say-can.github.io/), [arXiv 2204.01691](https://arxiv.org/abs/2204.01691)
- PaLM-SayCan reached 84% plan success and 74% execution success on 101 natural-language tasks in kitchen settings. [V] — [say-can.github.io](https://say-can.github.io/)
- LLM4AD survey: "the latency for the most responsive LLM falls between approximately 1.2 to 1.8 seconds" (GPT-4 in Talk2Drive). LLMs suit "high-level decisions or modifying driving behaviors in response to human commands", not millisecond control. [V] — [arXiv 2410.15281](https://arxiv.org/html/2410.15281v3)
- Reason–Imagine–Act (Sun et al., May 2026): the LLM chooses from a closed set of action templates (stop; speed up, down, maintain; lane change left, right; normal), a world model rolls out about 1 second, and a safety scorer selects the final action. [V] — [arXiv 2605.24004](https://arxiv.org/html/2605.24004v1)
- Chekam et al. (2025): an LLM selects behaviours from a predefined set and activates behaviour-tree nodes through plugins; about 94% cognition-to-execution accuracy in real-world tests. [V] — [arXiv 2508.09621](https://arxiv.org/abs/2508.09621)
- LLMs also generate behaviour trees for task planning. [S] — [LLM-as-BT-Planner, arXiv 2409.10444](https://arxiv.org/html/2409.10444v2)
- Edge robotics work reports that LLM inference latency conflicts with the millisecond-to-second response times that safe navigation needs. One design keeps a stable 50 Hz control loop and runs the LLM asynchronously with a validation layer and deterministic fallback on a Jetson Orin. Exact paper attribution not confirmed. [S] — [MAKE 8(2):49](https://doi.org/10.3390/make8020049), [arXiv 2601.14921](https://arxiv.org/pdf/2601.14921)
- Sub-1.5B quantized models (SmolLM2-135M, Gemma3-1B, TinyLlama-1.1B) have been benchmarked for natural-language mobile robot control on edge hardware (2026). [S] — [Applied Sciences 16(14):7267](https://www.mdpi.com/2076-3417/16/14/7267)
- Intent recognition for human–robot interaction works zero-shot with LLMs on transcribed speech; extensive fine-tuning is not always needed. [S] — [zero-shot intent retrieval in HRI](https://www.researchgate.net/publication/381548253_Zero-shot_Retrieval_of_User_Intent_in_Human-Robot_Interaction_with_Large_Language_Models), [LLMs as zero-shot human models, arXiv 2303.03548](https://arxiv.org/abs/2303.03548), [NVP-HRI](https://www.sciencedirect.com/science/article/pii/S0957417424032275)
- LLM plus knowledge graph improves intention prediction in service robots. [S] — [Scientific Reports 2024](https://www.nature.com/articles/s41598-024-77916-3)
- LLM task planning with exception handling has been built for general-purpose service robots. [S] — [arXiv 2405.15646](https://arxiv.org/html/2405.15646v1)

### Inferences

#### What latency do these loops need, and what changes at 10 ms

- Servo and motor control: about 1 kHz. Motion control and collision avoidance: 50–100 Hz. Never Jev's job.
- Behaviour layer (behaviour-tree ticks, mode choice): typically 10–50 Hz [M].
- Task planning and human interaction: 0.1–2 Hz. People notice delays above a few hundred ms.
- Today: LLM planners answer in 1.2–1.8 s ([LLM4AD](https://arxiv.org/html/2410.15281v3)). So designs run them at low rate, asynchronously, with a deterministic fallback.
- At 100–150 ms (Jev today): a 5–10 Hz semantic layer. Enough for intent recognition, task-level re-planning, and ODD or context checks.
- At 10 ms (planned): Jev can sit inside a 50–100 Hz behaviour-tree tick. Semantic conditions can be re-checked every tick. Every skill can be scored every step. Jev can serve as a heuristic inside plan search (hundreds of node evaluations per second).
- Cost at rate: 10 Hz × 500 tokens is 18M tokens per hour, about $0.72 per robot-hour. At 100 Hz it is about $7.20 per robot-hour. Cheap for industrial robots, high for consumer ones; send only changed state.
- Two blockers: (1) today's rate limit is 1,200 requests per minute, which is 20 Hz per account; (2) a cloud round trip adds tens of ms, so sub-10 ms only matters with on-premise or on-robot serving. Whether Jev can be deployed at the edge is unknown.

#### Usages

**R1. SayCan-style skill scoring** *(task planning)*
- Practice: SayCan: score = LLM usefulness probability × affordance value from a learned value function. Pick the top skill, append, repeat.
- Pain: Scoring every skill with a large LLM each step is slow and costly. It needs big models.
- Jev fit: **Heuristic inside a search loop**. State = instruction + steps done so far + scene objects as text (from a perception model). One Choice over the skill list, or one Noul per skill: "Is 'pick up the sponge' a useful next step?" Code multiplies Jev's calibrated probability by the affordance value. Calibration matters, because the product of two probabilities is only meaningful if both are calibrated.
- Cheap and fast: All skills scored in one parallel request in 10–100 ms. Re-plan at every step, or after every disturbance, instead of once.
- Evidence: [SayCan](https://say-can.github.io/) [V]: 84% plan success with exactly this scoring structure.
- Fit: **Strong** on structure. Risk: long-horizon plans need multi-step reasoning, which Jev does greedily, one step at a time; scene must arrive as text.

**R2. Semantic condition nodes and node selection in behaviour trees** *(robot control architecture)*
- Practice: Behaviour trees (Colledanchise & Ögren [M]) tick condition and action nodes. Conditions are hand-coded booleans.
- Pain: Conditions such as "the person seems to need help" or "the area looks unsafe to enter" cannot be hand-coded.
- Jev fit: **Semantic predicate in a rule engine** and **supervisory layer**. State = structured world state as text. A condition node calls a Noul and compares it with a threshold. A selector node calls a Choice over its children.
- Cheap and fast: At 10 ms the Noul can be evaluated every tick. At 100 ms it must be cached and refreshed at 5–10 Hz.
- Evidence: [Chekam et al. 2025, ~94%](https://arxiv.org/abs/2508.09621) [V]; [LLM-as-BT-Planner](https://arxiv.org/html/2409.10444v2) [S].
- Fit: **Strong / Medium**. Risk: perception-to-text quality; flapping near the threshold (add hysteresis in code).

**R3. Intent and command classification for human–robot interaction** *(HRI)*
- Practice: Speech goes through ASR to text; then intent is classified and slots are filled. Classic intent classifiers need training data per deployment.
- Pain: New sites, new commands, new phrasing. Retraining cost. Cloud LLM delay breaks natural dialogue.
- Jev fit: **Triage / router**. State = transcript + robot status. Choice over the command set, including {none of these, unclear}. Noul: "Is the person asking the robot to stop?" as a separate high-recall safety question. Score: urgency.
- Cheap and fast: 100 ms keeps dialogue natural. Every partial transcript can be scored as the person speaks, so a stop request is caught early.
- Evidence: [zero-shot intent in HRI](https://www.researchgate.net/publication/381548253_Zero-shot_Retrieval_of_User_Intent_in_Human-Robot_Interaction_with_Large_Language_Models) [S]; [NVP-HRI](https://www.sciencedirect.com/science/article/pii/S0957417424032275) [S]; [LLM + KG intention prediction](https://www.nature.com/articles/s41598-024-77916-3) [S].
- Fit: **Strong**. Risk: ASR errors; non-English speech; slot values (distances, counts) should be parsed by code.

**R4. High-level manoeuvre or mode selection for automated driving** *(autonomy)*
- Practice: Hierarchical planning: a behaviour planner picks a manoeuvre from a finite set; a trajectory planner and controller execute it. Recent work puts an LLM in the behaviour slot.
- Pain: LLMs take 1–2 s. So they run at reduced rate and cannot react.
- Jev fit: **Supervisory layer over numeric control**. Perception and prediction produce a text scene summary with bucketed distances and speeds. Choice over {keep lane, change left, change right, slow, stop, yield, pull over}. A world model and safety scorer still vet the choice, as in Reason–Imagine–Act.
- Cheap and fast: 10–100 ms allows 10 Hz re-evaluation, the usual behaviour-planner rate [M]. Cost about $0.72 per vehicle-hour at 10 Hz.
- Evidence: [LLM4AD latency](https://arxiv.org/html/2410.15281v3) [V]; [Reason–Imagine–Act closed action set](https://arxiv.org/html/2605.24004v1) [V].
- Fit: **Speculative**. Risks: safety-critical; spatial reasoning through text is lossy; adversarial text on signs could enter the state; certification.

**R5. Failure classification and recovery selection** *(robot operations)*
- Practice: Robots detect a failure (grasp failed, path blocked, timeout), then run a recovery behaviour or call an operator. Fleet operators triage logs.
- Pain: Hand-written recovery tables cover few cases. Remote operators are costly.
- Jev fit: **Triage** and **supervisory layer**. State = failed step + error codes + scene text. Choice: cause {object moved, object absent, obstruction, perception error, hardware fault, human interference}. Choice: recovery {retry, re-perceive, re-plan, ask human, abort}.
- Cheap and fast: Decide in-line in 100 ms instead of waiting for a teleoperator. Fleet-wide log coding for pennies.
- Evidence: [LLM planning with exception handling](https://arxiv.org/html/2405.15646v1) [S].
- Fit: **Medium**. Risk: needs good failure descriptions from the robot stack.

**R6. Step verifier for LLM-generated robot plans** *(safety layer)*
- Practice: A large LLM writes a plan; rule layers or formal monitors check it against constraints before execution.
- Pain: Formal constraints cover only what was formalised. A second large-LLM check doubles the delay.
- Jev fit: **Verifier / process-reward model**. State = one plan step + world state + one safety rule. Noul per rule: "Does this step move a liquid container over electronics?" Any high-probability violation blocks the step or forces a re-plan.
- Cheap and fast: Every step × every rule in parallel within 100 ms, so checking adds no noticeable delay.
- Evidence: Constraint "safety chip" modules for LLM-driven robots exist [M]. Not verified this session.
- Fit: **Medium**. Risk: a literal reader misses indirect hazards; keep hard safety in code and hardware.

### Gaps
- The SayCan skill count and per-step LLM cost were not visible on the pages fetched.
- The 50 Hz control loop plus asynchronous LLM design came from a search summary; I could not tie it to one paper.
- Behaviour-tree tick rates and behaviour-planner rates are from memory. [M]
- Yang et al. (2023) "Plug in the Safety Chip" is from memory. [M]
- No public information on running Jev on-premise or on-robot. Without that, the 10 ms figure is eaten by network delay.
- No study yet tests a calibrated classifier in the "Say" slot of SayCan. That is a cheap, high-signal experiment.

---

## 8. Cross-cutting: Top 5, poor fits, new roles

### Takeaway
The best near-term value is in high-volume text coding with existing labelled archives (warranty, NHTSA, OSHA, aviation logs) and in per-clause compliance with code-computed facts. The most novel use is the 10 ms semantic layer in robotics. The clearest warning is SAFARI: a graded scale that looks like a perfect Score fit can still be too hard.

### Cited Findings
- Frontier LLMs reach only 0.26–0.51 macro-F1 on HARA S/E/C classes, and chain-of-thought makes it worse. — [SAFARI](https://arxiv.org/html/2609.20584) [V]
- A hand-tuned rule system reached 95% on 101 construction injury attributes, at high tuning cost. — [Tixier 2016](https://www.sciencedirect.com/science/article/abs/pii/S0926580515002265) [S]
- A domain-adapted small model beat GPT-4 on borehole description classification. — [GEOBERTje](https://arxiv.org/abs/2407.10991) [V]
- Open-ended LLM material picks diverge from experts. — [Grandi et al. 2024](https://arxiv.org/abs/2405.03695) [V]
- LLM planners for driving run at 1.2–1.8 s. — [LLM4AD](https://arxiv.org/html/2410.15281v3) [V]
- Regulation-to-rule translation (LegalRuleML) is a generation task. — [Fuchs et al. 2024](https://arxiv.org/abs/2407.21060) [V]
- Geometry-intensive BIM checks need a dedicated spatial reasoning framework. — [arXiv 2606.12065](https://arxiv.org/pdf/2606.12065) [S]

### Inferences

#### Top 5 usages by likely value

1. **Q3 + Q4: Warranty verbatim and NHTSA complaint coding.** Millions of records, proven NLP track record, public demo data (about $27 for the full NHTSA history), errors are recoverable, and earlier defect detection has direct recall-cost value.
2. **C1 + C2: Clause-by-clause code compliance over code-computed facts.** Fifteen years of research stalled on brittle hand-written rules. A Noul per clause removes that bottleneck. About $0.20 per full design pass allows checking on every save.
3. **C3 + E3: Safety narrative coding (OSHA, ASRS, NTSB).** 101 parallel attribute questions per report match Jev's parallel-question design exactly. It replaces dictionary upkeep. Benchmarks and labels already exist.
4. **E1 + E2: ATA coding and repeat-defect matching.** Scarce reliability engineers, terse text, a direct airworthiness and cost benefit, and a human sign-off already in the loop.
5. **R1 + R2: SayCan-style skill scoring and semantic behaviour-tree conditions.** The only place where 10 ms changes the architecture. SayCan already uses the language model as a pure scorer. Calibration is needed for the probability product.

Honourable mention: **A1 HARA consistency audit.** High value and a perfect Score shape, but SAFARI shows the task is hard. Treat it as a research bet and benchmark Jev on SAFARI first.

#### Poor fits

- **Structural and code numeric checks** (span-to-depth, egress distance, load combinations). Arithmetic. Code must do it.
- **Geometry-intensive BIM checks, GD&T and tolerance stack-ups, drawing reading.** Not text, and spatial. Need geometry engines or vision models.
- **Writing rules from code text** (LegalRuleML, checking scripts), inspection reports, 8D reports. Generation. Jev cannot.
- **Direct ASIL assignment.** It is a table lookup from S, E, C. Put it in code. The S/E/C rating itself is hard (SAFARI).
- **AD compliance-time tracking** (hours, cycles, calendar limits). Date and number comparison is a named weak spot.
- **DGA ratios, Duval zones, SPC control-chart rules, relay waveform classification.** Numeric and signal processing.
- **Switching orders and lockout-tagout sequence checks.** Sequential, multi-hop, safety-critical.
- **Low-level robot control and collision avoidance.** Hard real-time at 50 Hz–1 kHz. Jev is supervisory only.
- **Final materials ranking by performance index.** Numeric. Jev only screens qualitative constraints.
- **Patent novelty and claim construction.** Multi-hop legal reasoning; Jev only screens relevance.
- **Non-English archives** (Dutch borehole logs, Chinese grid defect records). English is strongest; a domain-tuned model beat GPT-4 there.
- **Supplier-written or counterparty-written state** (certificates, 8Ds, submittals, contracts). Not a poor fit outright, but the author gains from a "pass". Adversarial steering is a live risk. Strip instructions-like text and keep human sampling.

#### New roles missing from the catalogue

- **Consistency auditor (second rater).** Compare a human-assigned code or grade with Jev's calibrated distribution and flag big gaps. Used in C4 (NBI ratings), Q3 (labour codes), E1 (ATA codes), A1 (S/E/C). It differs from "verifier": it audits labels in legacy databases, not steps of an output. It links to inter-rater reliability practice and to label-noise detection.
- **Applicability filter.** Before any compliance check, decide which clauses, directives or standards apply to this object. Used in C1, M7, E4. It is the step that makes clause-by-clause checking affordable and is often the harder expert judgment.
- **Caption-to-taxonomy bridge.** Map free-text output of an upstream perception model (vision-language captions, ASR transcripts, scene summaries) onto a site-specific closed taxonomy. Used in Q8, R2, R4, A3. New classes need a new description, not retraining.

### Gaps
- None of these usages has been tested with Jev itself. All fit ratings are judgments from task shape and from results with other models.
- Cheap first experiments with public data and labels: SAFARI (HARA), CODE-ACCORD (code clauses), OSHA narratives, NHTSA complaints, NTSB narratives, SayCan task set.
- Jev's calibration under domain shift (technician shorthand, legal drafting) is unknown and decides how well the "low confidence escalates" pattern works.
