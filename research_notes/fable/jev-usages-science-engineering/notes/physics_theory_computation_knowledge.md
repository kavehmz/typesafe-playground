# Jev usages in physics, subtopic B: theory, computation, knowledge, materials text mining, education

Researcher notes. Current to September 2026. 44 usages (U1 to U44), grouped by key question.

Reading guide:

- Each key question has four parts: Takeaway, Cited Findings, Inferences (the usages, in the 7-field format of the brief), Gaps.
- "Not fetched" means I cite the paper from memory and did not open the URL in this session. Treat the URL as likely right, not checked.
- "Title only" means the paper showed up in search results and I did not read it.
- Cost sums use the brief's price: $0.04 per million input tokens (Mtok). Token counts per item are my assumptions and are stated each time.
- Rate-limit sums use the brief's limits: 250,000 tokens per second, 1,200 requests per minute.

---

## 1. Literature and knowledge: arXiv, INSPIRE-HEP, PhySH, screening, claim checks, quantity selection, knowledge graphs

### Takeaway

Physics already runs deployed text classifiers for paper routing (arXiv) and hand curation for the rest (INSPIRE core records, PhySH tags). These are closed-set semantic judgments at high volume, so they fit Jev well. Jev's edge over the supervised baselines is zero retraining when the taxonomy changes, plus calibrated probabilities that set a recall target or sort a human queue.

### Cited Findings

- arXiv runs an automated classifier at submission time. It reads title and abstract, compares with hosted papers "in real time", and proposes another category when the author's pick does not match. It uses ULMFiT and fastText models trained on over 1.6 million abstracts and 120 thousand full texts. — [arXiv blog, 2020](https://blog.arxiv.org/2020/10/05/new-classifier-adds-transparency-to-arxiv-submission-process)
- Before 2020 only moderators saw the classifier output. arXiv moved it into the submission form to cut moderator workload and cut holds caused by wrong categories. Moderators are volunteer subject experts. — [arXiv blog, 2020](https://blog.arxiv.org/2020/10/05/new-classifier-adds-transparency-to-arxiv-submission-process); [arXiv moderation help](https://info.arxiv.org/help/moderation/index.html)
- On arXiv abstract classification, a light Attention-GRU with GloVe vectors reached Macro-F1 0.920 and beat SciBERT (F1 0.867). So cheap supervised models already do well when labels are plentiful and the label set is stable. — [Scientific Reports, 2026](https://www.nature.com/articles/s41598-026-48795-7)
- PhySH (Physics Subject Headings) is the American Physical Society scheme that replaced PACS in January 2016. APS uses it for all journals and meetings. It is hierarchical. — [PhySH, Wikipedia](https://en.wikipedia.org/wiki/PhySH); [ISKO encyclopedia, Smith 2020](https://www.isko.org/cyclo/physh); [PhySH GitHub](https://github.com/physh-org/PhySH/)
- A public PhySH tag recommender exists. It was trained on over 40,000 Physical Review B abstracts (volumes 93 to 110, January 2016 to December 2024) and covers condensed matter only. — [PhySH-Tank, GitHub](https://github.com/swetlanas/PhySH-Tank)
- Turrisi (2023) clustered SciBERT embeddings of arXiv abstracts with K-Means and argues the clusters capture subject information better than arXiv's own labels. No accuracy figures in the abstract. — [arXiv 2309.07020](https://arxiv.org/abs/2309.07020)
- INSPIRE-HEP splits records into CORE (directly relevant to high-energy physics, fully hand curated by cataloguers) and NON-CORE (minimal curation). — [INSPIRE content policy](https://help.inspirehep.net/knowledge-base/content-policy/); [INSPIRE blog, 2012](https://blog.inspirehep.net/2012/12/the-life-of-arxiv-paper-on-inspire/)
- The HEP-ML Living Review was frozen and archived on 1 June 2026. A community "Living Guide" replaced it and moved from an exhaustive list to a selective, curated one. It used INSPIRE keyword queries ("machine learning", "deep learning", "neural network") to find papers. — [The Living Guide of ML for Particle Physics, arXiv 2608.09531](https://arxiv.org/abs/2608.09531)
- LLM title and abstract screening: tuned GPT-4 prompts reached weighted sensitivity 97.7% (range 86.7% to 100%) and specificity 85.2% (range 68.3% to 95.9%). — [Annals of Internal Medicine, 2025](https://doi.org/10.7326/annals-24-02189)
- Open models vary widely on the same screening task. Sensitivity/specificity pairs: FlanT5 94.48%/31.78%, Mixtral 81.93%/75.19%, Platypus 2 97.58%/38.34%. — [PMC11180407, 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11180407/)
- A 2026 study tests compact LLMs for title and abstract screening and reports on feasibility, accuracy and workload cut. Title only. — [PubMed 41635943](https://pubmed.ncbi.nlm.nih.gov/41635943/)
- SciFact frames claim checking as a 3-way label per (claim, abstract) pair: SUPPORTS, REFUTES, NOINFO. Claims come from citation sentences. — [SciFact, Wadden et al. 2020, arXiv 2004.14974](https://arxiv.org/abs/2004.14974) (not fetched); described in [DeepSciVerify, arXiv 2605.27710](https://arxiv.org/html/2605.27710v1)
- DeepSciVerify (2026) checks claim-to-citation alignment in two stages: abstract first, then it escalates to passages when the abstract is not enough. Some small models show "blind trust": high recall but poor detection of fabricated citations. — [arXiv 2605.27710](https://arxiv.org/html/2605.27710v1)
- SuperCon2 holds 40,324 material and property records from 37,700 papers. Grobid-superconductors built it, with a separate Grobid "quantity" model that finds measurements, and a linking step that ties a critical temperature to a material. — [Foppiano et al. 2023, STAM Methods](https://www.tandfonline.com/doi/full/10.1080/27660400.2022.2153633)
- MatKG is a materials knowledge graph built by NLP: over 70,000 entities and 5.4 million unique triples. — [Scientific Data, 2024](https://www.nature.com/articles/s41597-024-03039-z)
- SciCite defines a closed set of citation intents (background, method, result comparison). — [Cohan et al. 2019, arXiv 1904.01608](https://arxiv.org/abs/1904.01608) (not fetched)

### Inferences: usages

#### U1. arXiv category and cross-list check (literature routing)

1. **Name / subfield**: arXiv primary-category suggestion and cross-list check. Literature infrastructure.
2. **Established practice**: arXiv's submission classifier (ULMFiT plus fastText) plus volunteer moderators who reclassify. [arXiv blog](https://blog.arxiv.org/2020/10/05/new-classifier-adds-transparency-to-arxiv-submission-process)
3. **Pain point**: moderator time; holds from wrong categories; a supervised model needs retraining when categories are added or split.
4. **How Jev fits**: Triage / router. `state` = title plus abstract. Choice over the physics archive list, then Choice inside the archive. One Noul per candidate cross-list: "Would readers of cond-mat.supr-con expect to see this paper?" Category descriptions from arXiv's own taxonomy page go in `criteria`.
5. **Why cheap and fast**: About 500 tokens per paper. 1 million papers = 500 Mtok = $20. Under 100 ms fits inside the submission form, where arXiv already wants a live answer.
6. **Evidence**: deployed arXiv classifier (above); [Sci Rep 2026](https://www.nature.com/articles/s41598-026-48795-7) shows F1 about 0.92 for a cheap supervised model, so the task is learnable from abstracts.
7. **Fit**: Strong. Main risk: a trained baseline already exists and is good. Jev wins only on zero-shot upkeep, cross-list reasoning, and calibrated "send to moderator" thresholds.

#### U2. PhySH concept tagging by walking the hierarchy

1. **Name / subfield**: PhySH tag suggestion for APS manuscripts and meeting abstracts.
2. **Established practice**: authors and editors pick PhySH concepts by hand; PhySH is APS's scheme for all journals and meetings. [ISKO](https://www.isko.org/cyclo/physh)
3. **Pain point**: thousands of concepts; author tags are inconsistent; the one public recommender covers only Physical Review B. [PhySH-Tank](https://github.com/swetlanas/PhySH-Tank)
4. **How Jev fits**: Triage plus the new role "taxonomy walker" (see New roles). Step 1: Choice over PhySH disciplines. Step 2: Choice or parallel Nouls over the children of the chosen node, using each concept's PhySH label and scope note as the option text. Example: "Does this abstract report work on 'Topological insulators'?" → Noul. Keep concepts above a threshold.
5. **Why cheap and fast**: a tree walk needs 3 to 6 calls per paper and tens of parallel Nouls. At $0.04/Mtok that is well under $0.001 per paper. PhySH edits take effect the same day with no retraining.
6. **Evidence**: PhySH-Tank shows abstracts carry enough signal. Hierarchical classification is standard for such vocabularies. [arXiv 2309.07020](https://arxiv.org/abs/2309.07020)
7. **Fit**: Strong. Main risk: sibling concepts that differ by fine technical detail; large option lists (keep each Choice small).

#### U3. INSPIRE-HEP core / non-core triage and curation routing

1. **Name / subfield**: INSPIRE ingestion triage. HEP literature.
2. **Established practice**: cataloguers decide CORE vs NON-CORE; CORE gets full hand curation. [INSPIRE content policy](https://help.inspirehep.net/knowledge-base/content-policy/)
3. **Pain point**: scarce cataloguers; daily arXiv harvest; border areas (astro-ph, quant-ph, cond-mat, ML).
4. **How Jev fits**: Triage / router. `state` = title, abstract, arXiv categories, journal. Noul: "Is this paper of direct relevance to high-energy physics as defined in the content policy?" Choice of curation lane: {core-experiment, core-theory, core-instrumentation, non-core, reject}. Low confidence goes to a cataloguer.
5. **Why cheap and fast**: a full day of arXiv physics listings costs cents. Calibrated probability sorts the human queue by doubt.
6. **Evidence**: INSPIRE's policy text is a ready-made criteria list. arXiv's classifier shows abstract-level routing works.
7. **Fit**: Strong. Main risk: policy edge cases need cataloguer judgment; Jev should rank, not decide, near the threshold.

#### U4. Title and abstract screening for physics reviews and living reviews

1. **Name / subfield**: systematic screening. Reviews, living reviews, Particle Data Group style compilations.
2. **Established practice**: keyword queries plus hand screening. The HEP-ML Living Review used INSPIRE keyword queries and was frozen in June 2026 partly because exhaustive upkeep does not scale. [arXiv 2608.09531](https://arxiv.org/abs/2608.09531)
3. **Pain point**: keyword rules are brittle ("neural network" misses and over-matches); volume grows faster than volunteer time.
4. **How Jev fits**: Screening at scale. `state` = abstract. One Noul per inclusion criterion ("Does the paper apply machine learning to a particle-physics task?"), plus a Choice for the review's section. Set the Noul threshold to hit a recall target on a small labelled sample.
5. **Why cheap and fast**: 10,000 abstracts at 600 tokens = 6 Mtok = $0.24. A living review can re-screen the whole back catalogue each time criteria change.
6. **Evidence**: GPT-4 screening reached 97.7% sensitivity and 85.2% specificity ([Annals 2025](https://doi.org/10.7326/annals-24-02189)). Open models swing widely ([PMC11180407](https://pmc.ncbi.nlm.nih.gov/articles/PMC11180407/)), so calibration is the key property.
7. **Fit**: Strong. Main risk: evidence is biomedical; no physics screening benchmark found.

#### U5. Claim-versus-citation check

1. **Name / subfield**: does the cited paper support the sentence that cites it? Scholarly QA.
2. **Established practice**: referees spot-check by hand. SciFact defines the 3-way task. [arXiv 2004.14974](https://arxiv.org/abs/2004.14974) (not fetched)
3. **Pain point**: a paper has 50 to 150 references; nobody checks them all; LLM-written text adds fabricated or drifting citations.
4. **How Jev fits**: Verifier. Code pulls each citing sentence and the cited abstract (or retrieved passages). Choice: {supports, contradicts, not enough information}. Escalate "not enough" to passage level, then to a person. This mirrors DeepSciVerify's two stages.
5. **Why cheap and fast**: 100 citations at 700 tokens = 70k tokens = $0.003 per manuscript. A journal can check every reference of every submission.
6. **Evidence**: [DeepSciVerify 2026](https://arxiv.org/html/2605.27710v1); SciFact. DeepSciVerify also warns that small models over-trust.
7. **Fit**: Medium. Main risk: multi-hop (the claim may rest on a figure, an equation, or a result deep in the cited paper); numeric claims.

#### U6. Select the right measured quantity from code-found candidates

1. **Name / subfield**: quantity selection for data compilations (critical temperatures, band gaps, masses, cross sections stated in text).
2. **Established practice**: Grobid-quantities style taggers find numbers with units; a second model or rule links them to the entity. [Foppiano et al. 2023](https://www.tandfonline.com/doi/full/10.1080/27660400.2022.2153633)
3. **Pain point**: a paragraph holds many numbers with the same unit (Tc of the parent compound, Tc under pressure, a literature Tc, an annealing temperature). Rules mislink them.
4. **How Jev fits**: Select, do not generate. Code lists candidates with their sentence. Choice: "Which candidate is the superconducting critical temperature of 'La1.85Sr0.15CuO4' measured in this work?" Options = the candidate values plus "none of these".
5. **Why cheap and fast**: one call per (entity, property) pair. SuperCon2 scale (37,700 papers at about 8k tokens) = 302 Mtok = $12 for a full pass.
6. **Evidence**: SuperCon2 pipeline (above); ChatExtract shows yes/no follow-up questions lift precision. [Polak and Morgan 2024](https://www.nature.com/articles/s41467-024-45914-8)
7. **Fit**: Strong to Medium. Main risk: Jev must not compare the numbers; it only matches the wording around each candidate. Tables and figures need a separate parser.

#### U7. Relation and citation-intent typing for a physics knowledge graph

1. **Name / subfield**: knowledge-graph building.
2. **Established practice**: NER plus relation models build graphs such as MatKG. [Sci Data 2024](https://www.nature.com/articles/s41597-024-03039-z)
3. **Pain point**: relation models need labelled data per relation type; new relation types stall.
4. **How Jev fits**: Feature extractor / screening. Code proposes entity pairs in a sentence. Choice over a closed relation set: {material-has-property, material-made-by-method, method-measures-property, no relation}. For citations, Choice over SciCite intents.
5. **Why cheap and fast**: pair counts explode (5.4 million triples in MatKG). Only a near-free judge can type every pair.
6. **Evidence**: MatKG; [SciCite](https://arxiv.org/abs/1904.01608) (not fetched).
7. **Fit**: Medium to Strong. Main risk: relations that span sentences (multi-hop).

#### U8. Record and entity alignment

1. **Name / subfield**: preprint-to-journal matching, duplicate records, material-name normalisation, author disambiguation support.
2. **Established practice**: string rules plus hand merging in INSPIRE and ADS style systems; materials pipelines normalise names by rules. [INSPIRE blog](https://blog.inspirehep.net/2012/12/the-life-of-arxiv-paper-on-inspire/)
3. **Pain point**: titles change between preprint and journal; materials have many names ("LSCO", "lanthanum strontium cuprate").
4. **How Jev fits**: Entity / record alignment. Noul: "Do these two records describe the same paper?" or "Do these two strings name the same material family?" Code handles exact formula and stoichiometry maths first.
5. **Why cheap and fast**: alignment is quadratic in candidates. Blocking plus a near-free Noul makes it tractable.
6. **Evidence**: MatKG and SuperCon2 both needed normalisation steps (above). No physics-specific alignment benchmark found.
7. **Fit**: Medium. Main risk: formula equivalence is numeric; keep it in code.

### Gaps

- I found no public accuracy figure for arXiv's production classifier or for moderator reclassification rates.
- I found no published PhySH auto-tagging benchmark beyond the PhySH-Tank repository (not peer reviewed).
- I found no INSPIRE paper that describes an ML-based core/non-core classifier in production. It may exist internally.
- I found no LLM screening study done on physics reviews. All figures above are biomedical.

---

## 2. Materials and condensed-matter text mining

### Takeaway

Every large materials text-mining pipeline has classification steps (is this paragraph a synthesis recipe, is this sentence relevant, is this extracted value right). Today those steps run on custom-trained BERT models or on costly generative LLM calls. Jev can take the gate step before an LLM and the verify step after it, and can attach a calibrated confidence to every database record.

### Cited Findings

- Kononova et al. (2019) text-mined 19,488 solid-state synthesis recipes from 53,538 synthesis paragraphs. — [Scientific Data 6, 203, via ADS](https://ui.adsabs.harvard.edu/abs/2019NatSD...6..203K/abstract); [code](https://github.com/CederGroupHub/text-mined-synthesis_public)
- The paragraph gate in that pipeline is a classifier: Huo et al. (2019) used latent Dirichlet allocation topics plus a random forest to label paragraphs as solid-state, hydrothermal, sol-gel and so on. — [npj Computational Materials 2019](https://www.nature.com/articles/s41524-019-0204-1)
- Tshitoyan et al. (2019) showed that unsupervised word embeddings of materials abstracts capture latent knowledge and can point to candidate functional materials. — [Nature 571, 95](https://www.nature.com/articles/s41586-019-1335-8) (not fetched)
- MatSciBERT is a BERT model pre-trained on materials text for classification, NER and relation tasks. — [npj Comput. Mater. 2022](https://www.nature.com/articles/s41524-022-00784-w) (not fetched)
- Huang and Cole (2020) auto-built a battery database: 292,313 records from 229,061 papers with ChemDataExtractor. — [Scientific Data 2020](https://www.nature.com/articles/s41597-020-00602-2)
- BatteryBERT then classified and enhanced that database (210,416 records in the enhanced set). — [J. Chem. Inf. Model. 2022](https://pubs.acs.org/doi/10.1021/acs.jcim.2c00035); [dataset](https://figshare.com/articles/dataset/An_enhanced_battery_materials_database_auto-generated_using_ChemDataExtractor_and_further_classified_using_the_BatteryBERT_language_model_/18154715)
- SuperMat: 142 annotated superconductor articles, 16,052 entities, 1,398 links. SuperCon2: 40,324 records from 37,700 papers. — [SuperMat, Semantic Scholar](https://www.semanticscholar.org/paper/SuperMat:-construction-of-a-linked-annotated-from-Foppiano-Dieb/74b72d715351ad45ef1a20e76033e0740e123850); [Foppiano et al. 2023](https://www.tandfonline.com/doi/full/10.1080/27660400.2022.2153633)
- Foppiano et al. also built a semi-automatic staging area where curators check and fix machine-extracted superconductor records. — [arXiv 2309.10923](https://arxiv.org/abs/2309.10923)
- Dagdelen et al. (2024) fine-tuned GPT-3 and Llama-2 for joint entity and relation extraction on three tasks: dopant-host linking, metal-organic framework records, and general composition/phase/morphology/application records. — [Nature Communications 15, 1418](https://www.nature.com/articles/s41467-024-45563-x)
- ChatExtract (Polak and Morgan 2024) has three stages: find sentences with data, extract, then ask follow-up yes/no questions that add doubt and redundancy. Precision and recall were both close to 90% with GPT-4. — [Nature Communications 2024](https://www.nature.com/articles/s41467-024-45914-8); [arXiv 2303.05352](https://arxiv.org/abs/2303.05352)
- MatScIE extracts methods and parameters from computational materials papers to build databases. Title only. — [MatScIE](https://ouci.dntb.gov.ua/en/works/l1BE6DZ9/)
- An LLM-extracted experimental band-gap set improved band-gap prediction. Title only. — [arXiv 2311.13778](https://arxiv.org/abs/2311.13778)
- A 2026 Advanced Materials paper text-mines chemical-vapour-deposition recipes for 2D materials. Title only. — [Lu et al. 2026](https://advanced.onlinelibrary.wiley.com/doi/10.1002/adma.202509132?af=R)
- Lejaeghere et al. (2016) set the reporting bar for DFT reproducibility across codes. Papers must state functional, pseudopotentials and key numeric settings or results cannot be reproduced. — [Science 2016](https://www.science.org/doi/10.1126/science.aad3000) (not fetched); [Bosoni et al. 2023, arXiv 2305.17274](https://arxiv.org/abs/2305.17274)

### Inferences: usages

#### U9. Synthesis-paragraph type classification

1. **Name / subfield**: label each paragraph as {solid-state, hydrothermal, sol-gel, precipitation, CVD, not a synthesis}. Materials text mining.
2. **Established practice**: LDA plus random forest gate ([Huo et al. 2019](https://www.nature.com/articles/s41524-019-0204-1)) in front of recipe extraction ([Kononova et al. 2019](https://ui.adsabs.harvard.edu/abs/2019NatSD...6..203K/abstract)).
3. **Pain point**: each new synthesis family (for example CVD of 2D materials) needs new labels and a new model.
4. **How Jev fits**: Screening at scale. `state` = paragraph. Choice over the closed family list; family definitions in `criteria`. Add a family by adding an option.
5. **Why cheap and fast**: 100 million paragraphs at 200 tokens = 20,000 Mtok = $800 (my sizing, for a multi-million-paper corpus). A new family can be re-screened over the whole corpus in a day.
6. **Evidence**: Huo 2019; Kononova 2019; [CVD recipes 2026](https://advanced.onlinelibrary.wiley.com/doi/10.1002/adma.202509132?af=R) (title only).
7. **Fit**: Strong. Main risk: mixed paragraphs (synthesis plus characterisation).

#### U10. Relevance gate before LLM extraction

1. **Name / subfield**: "does this sentence or paragraph hold a value of property X?" Data extraction.
2. **Established practice**: ChatExtract stage 1 asks a generative LLM this yes/no question for every sentence. [Polak and Morgan 2024](https://www.nature.com/articles/s41467-024-45914-8)
3. **Pain point**: most sentences are irrelevant, yet each costs a full LLM call.
4. **How Jev fits**: Triage, and the new role "calibrated gate in a model cascade". Noul per property over each passage. Only passages above threshold go to the generative extractor.
5. **Why cheap and fast**: Huang and Cole's corpus (229,061 papers at about 8k tokens) = 1,832 Mtok = $73 for a full pass. At 250k tokens per second this takes about 2 hours. The LLM then sees only the few percent that matter.
6. **Evidence**: ChatExtract's stage 1 is already a yes/no classifier; BatteryBERT did document and record classification for the battery database ([JCIM 2022](https://pubs.acs.org/doi/10.1021/acs.jcim.2c00035)).
7. **Fit**: Strong. Main risk: values that live only in tables or figures.

#### U11. Verifier for LLM-extracted records

1. **Name / subfield**: check each extracted (material, property, value, unit) record against its source passage.
2. **Established practice**: ChatExtract's follow-up questions ("Are you sure the value is for this material?") with purposeful redundancy. [arXiv 2303.05352](https://arxiv.org/abs/2303.05352)
3. **Pain point**: the follow-ups multiply LLM cost; a chat model's yes/no carries no calibrated confidence.
4. **How Jev fits**: Verifier. `state` = source passage plus the record as JSON. Parallel Nouls: "Does the passage state this value for this material?", "Is the unit stated as given?", "Was the value measured in this work and not quoted from earlier work?" Store the probabilities with the record.
5. **Why cheap and fast**: four checks on a 600-token passage cost about $0.0001. Every record in a 300,000-record database can carry a confidence score for about $10.
6. **Evidence**: ChatExtract; [Dagdelen et al. 2024](https://www.nature.com/articles/s41467-024-45563-x) show LLM extraction works but needs checking; [Foppiano staging area](https://arxiv.org/abs/2309.10923) shows curators are the bottleneck.
7. **Fit**: Strong. Main risk: Jev must match wording, not compare digits; code should check the numeric string matches exactly.

#### U12. Battery and device record classification

1. **Name / subfield**: role and context of a record: {anode, cathode, electrolyte, separator, full cell}; property applicability.
2. **Established practice**: BatteryBERT classifiers on top of ChemDataExtractor output. [JCIM 2022](https://pubs.acs.org/doi/10.1021/acs.jcim.2c00035)
3. **Pain point**: a domain BERT per field (batteries, thermoelectrics, photovoltaics) means pre-training and labels each time.
4. **How Jev fits**: Screening / feature extractor. Choice over device roles; Noul: "Is this capacity a first-cycle value?"
5. **Why cheap and fast**: the whole 292,313-record base can be re-labelled for a few dollars whenever the schema changes.
6. **Evidence**: [Huang and Cole 2020](https://www.nature.com/articles/s41597-020-00602-2); BatteryBERT.
7. **Fit**: Strong. Main risk: a tuned domain model may still beat a general model on jargon.

#### U13. Superconductor Tc linking and measurement-method tagging

1. **Name / subfield**: link a Tc to a material; tag the method {resistivity, magnetic susceptibility, specific heat, calculation}; Noul for "under applied pressure".
2. **Established practice**: Grobid-superconductors with a rule-based linker; SuperCon2. [Foppiano et al. 2023](https://www.tandfonline.com/doi/full/10.1080/27660400.2022.2153633)
3. **Pain point**: linking is the weak step; pressure and method change the meaning of a Tc.
4. **How Jev fits**: Select, do not generate, plus Choice for method. `state` = sentence window, the material, the candidate Tc values.
5. **Why cheap and fast**: 37,700 papers = about $12 per full pass, so the base can be rebuilt on every schema change.
6. **Evidence**: SuperMat gold links (1,398) give a test set. [SuperMat](https://www.semanticscholar.org/paper/SuperMat:-construction-of-a-linked-annotated-from-Foppiano-Dieb/74b72d715351ad45ef1a20e76033e0740e123850)
7. **Fit**: Strong. Main risk: long-range links across paragraphs.

#### U14. Measured, computed, or quoted?

1. **Name / subfield**: provenance class of a value: {measured in this work, computed in this work, quoted from prior work, target or nominal value}.
2. **Established practice**: mostly ignored by rule pipelines; it is a known noise source when text-mined data trains property models. [arXiv 2311.13778](https://arxiv.org/abs/2311.13778) (title only)
3. **Pain point**: mixing DFT and experimental band gaps, or counting a quoted value many times, biases the data.
4. **How Jev fits**: Feature extractor. Choice over the four classes per record, with the passage as `state`.
5. **Why cheap and fast**: one more near-free question per record during U11.
6. **Evidence**: band-gap extraction study (title only); SuperCon2 tags measurement method for the same reason.
7. **Fit**: Strong to Medium. Main risk: provenance stated elsewhere in the paper.

#### U15. Text-derived features and weak labels for property models

1. **Name / subfield**: calibrated text features for materials ML and weak supervision.
2. **Established practice**: Tshitoyan-style embeddings as features ([Nature 2019](https://www.nature.com/articles/s41586-019-1335-8), not fetched); Snorkel-style labelling functions ([arXiv 1711.10160](https://arxiv.org/abs/1711.10160), not fetched).
3. **Pain point**: embeddings are opaque; labelling functions are keyword rules.
4. **How Jev fits**: Feature extractor. Nouls such as "Does this abstract report air-stable samples?" become named, calibrated columns in a classical model, or become labelling functions.
5. **Why cheap and fast**: dozens of features over millions of abstracts for tens of dollars.
6. **Evidence**: Tshitoyan 2019 shows text holds predictive signal.
7. **Fit**: Medium. Main risk: text features encode publication bias, not physics.

#### U16. Computational-methods metadata for reproducibility

1. **Name / subfield**: extract closed-set method facts from DFT and MD papers: functional family {LDA, PBE, PBEsol, SCAN, hybrid, other}, code, "DFT+U used", "spin-orbit included", "van der Waals correction used".
2. **Established practice**: reporting norms from the DFT reproducibility effort ([Lejaeghere et al. 2016](https://www.science.org/doi/10.1126/science.aad3000), not fetched; [Bosoni et al. 2023](https://arxiv.org/abs/2305.17274)); MatScIE style extraction ([MatScIE](https://ouci.dntb.gov.ua/en/works/l1BE6DZ9/), title only).
3. **Pain point**: methods sections are free text; computed values cannot be compared without the settings.
4. **How Jev fits**: Feature extractor plus clause-by-clause compliance check. `state` = methods section. Choice and Noul per field; "not stated" is always an option.
5. **Why cheap and fast**: a methods section is about 1,500 tokens. 1 million papers = 1,500 Mtok = $60.
6. **Evidence**: MatScIE (title only). Links to U36 (journal checklist).
7. **Fit**: Strong to Medium. Main risk: numeric settings (cutoffs, k-meshes) must be pulled by code, not by Jev.

#### U17. Curation-queue ranking by calibrated confidence

1. **Name / subfield**: order the human review queue for a text-mined database.
2. **Established practice**: curators review machine records in a staging area. [arXiv 2309.10923](https://arxiv.org/abs/2309.10923)
3. **Pain point**: curators see records in arbitrary order; most are fine.
4. **How Jev fits**: new role "curation-queue ranker". Use the U11 probabilities to auto-accept high-confidence records, auto-reject very low ones, and send the middle band to people. This is uncertainty sampling for active learning.
5. **Why cheap and fast**: the ranking is a by-product of U11.
6. **Evidence**: staging-area paper; ChatExtract's redundancy trick shows doubt signals matter.
7. **Fit**: Strong. Main risk: calibration may drift on out-of-domain jargon; check it on a labelled sample (SuperMat).

### Gaps

- I did not find a head-to-head cost and accuracy study of "small classifier gate plus LLM extractor" against "LLM only" in materials. The saving in U10 is my inference.
- I could not get accuracy numbers for the Huo et al. paragraph classifier from the abstract.
- MatScIE, the band-gap paper, and the CVD recipe paper are title-only. Their methods and numbers need checking before the report quotes them.

---

## 3. Simulation workflow as algorithm selection; logs, input decks, provenance

### Takeaway

Choosing a solver, closure model, or DFT policy from a problem description is the classic algorithm selection problem, and physics has a 30-year expert-system history for it (PYTHIA for PDE solvers). Jev fits best as the text-side feature source and policy checker, not as the final selector. The strongest usages are log and failure triage and rule-by-rule checks of LLM-agent set-ups, where 2026 benchmarks show agents produce runs that execute but are physically wrong.

### Cited Findings

- Kerschke, Hoos, Neumann and Trautmann (2019) survey per-instance automated algorithm selection: compute instance features, then a learned model picks the algorithm. — [Evolutionary Computation 27(1), 3–45](https://direct.mit.edu/evco/article/27/1/3/1083/Automated-Algorithm-Selection-Survey-and)
- The problem was first framed by Rice (1976), "The algorithm selection problem", Advances in Computers 15. Not fetched; cited through the survey above. — [Kerschke et al. 2019](https://direct.mit.edu/evco/article/27/1/3/1083/Automated-Algorithm-Selection-Survey-and)
- A 2026 paper tests how well algorithm-selection models hold up on real-world instances. Title only. — [arXiv 2606.02016](https://arxiv.org/abs/2606.02016)
- PYTHIA (1996) is a knowledge-based system that picks (algorithm, parameter) pairs for elliptic PDEs inside Parallel ELLPACK. It matches features of the new problem with a base of known PDEs and uses stored solver performance, given the user's error and time bounds. — [ACM TOMS 22(4)](https://dl.acm.org/doi/10.1145/235815.235820); [AAAI 1992 symposium paper](https://cdn.aaai.org/Symposia/Fall/1992/FS-92-01/FS92-01-012.pdf)
- PYTHIA-II (2000) extended it into a recommender system for scientific software with a performance database. — [ACM TOMS 26(2)](https://dl.acm.org/doi/10.1145/353474.353475)
- Hänsch et al. (2026) frame closure-model selection for multiphase CFD as a cold-start recommender. A hybrid of metadata similarity and matrix completion, tested on 13,600 simulations (136 validation cases, 100 model combinations), beats popularity-based and expert-designed reference models and cuts regret. — [arXiv 2604.09112](https://arxiv.org/abs/2604.09112)
- LLM agents now set up CFD cases end to end. Foam-Agent reports 88.2% success with Claude 3.5 Sonnet. ChatCFD reports 82.1% execution success on 315 cases but only 68.12% physical fidelity. — [Foam-Agent, arXiv 2509.18178](https://arxiv.org/html/2509.18178v1); [ChatCFD, arXiv 2506.02019](https://arxiv.org/html/2506.02019v3)
- FoamBench "Advanced" holds 16 expert-made OpenFOAM cases that need turbulence-model choice and mesh generation. — [FlamePilot, arXiv 2601.01357](https://arxiv.org/abs/2601.01357)
- OpenFOAMGPT compares GPT-4o, o1, Qwen and DeepSeek on zero-shot case set-up and turbulence-model changes, with a cost focus. — [Theor. Appl. Mech. Lett. 2025](https://www.sciencedirect.com/science/article/pii/S2095034925000558); [arXiv 2504.02888](https://arxiv.org/abs/2504.02888)
- INCARBench (2026) tests 19 model configurations on VASP INCAR generation and repair. Several models score high on semantic and policy accuracy, but task-critical correctness is much lower. Errors cluster in coupled settings: DFT+U, magnetism, correlated materials. Fixing wrong settings and keeping right ones are separate skills; keeping right ones is the harder. — [arXiv 2606.23571](https://arxiv.org/abs/2606.23571)
- DFT agent frameworks: DREAMS and TritonDFT. Titles only. — [arXiv 2507.14267](https://arxiv.org/abs/2507.14267); [arXiv 2603.03372](https://arxiv.org/abs/2603.03372)
- Numeric DFT settings are learned by numeric ML, not by language: a 2026 tool predicts k-point meshes and writes Quantum ESPRESSO inputs. — [Digital Discovery 2026](https://pubs.rsc.org/dd/article/5/7/2968/1262935/Automatic-generation-of-input-files-with-optimised)
- Antici, Borghesi and Kiziltan (2023) predict job failure on a production CINECA machine and are the first to use NLP representations of job text fields for it. The abstract gives no numbers. — [arXiv 2308.15481](https://arxiv.org/abs/2308.15481)
- Log anomaly work uses LSTM, CNN and BERT models (LogBERT); HPC jobs fail from hardware faults, software errors and user errors. — [J. Supercomputing 2023](https://link.springer.com/article/10.1007/s11227-023-05482-y)
- AiiDA records a full provenance graph for every calculation in a workflow. — [Scientific Data 2020](https://www.nature.com/articles/s41597-020-00638-4) (not fetched)

### Inferences: usages

#### U18. Turbulence and closure-model recommendation from a case description

1. **Name / subfield**: pick from a closed list {laminar, k-epsilon, k-omega SST, Spalart-Allmaras, LES, DES} or a closure set for multiphase flow. CFD set-up.
2. **Established practice**: expert rules of thumb and best-practice guides; recommender on case metadata ([Hänsch et al. 2026](https://arxiv.org/abs/2604.09112)); algorithm selection theory ([Kerschke et al. 2019](https://direct.mit.edu/evco/article/27/1/3/1083/Automated-Algorithm-Selection-Survey-and)).
3. **Pain point**: scarce experts; a wrong model wastes days of compute; a new case has no run history (cold start).
4. **How Jev fits**: Supervisory layer / feature extractor. Code computes Reynolds, Mach and Stokes numbers and passes them as named buckets ("Reynolds: fully turbulent", "Mach: low subsonic"). `state` = case text plus buckets. Nouls give metadata features: "Is large-scale separation expected?", "Is the flow wall-bounded?", "Is heat transfer at the wall the target output?" These feed the recommender's cold-start side. A direct Choice over models is a fallback prior only.
5. **Why cheap and fast**: feature questions cost nothing next to one CFD run; they can run for every case in a design sweep.
6. **Evidence**: Hänsch 2026 shows metadata-driven cold-start selection beats expert reference models; ChatCFD shows LLMs switch turbulence models from text.
7. **Fit**: Medium. Main risk: Jev holds no performance data; the pick depends on numeric regime, so buckets must carry it.

#### U19. PDE solver and preconditioner pre-selection

1. **Name / subfield**: choose a solver family from problem traits {elliptic or not, symmetric positive definite or not, stiff or not, smooth or singular solution}.
2. **Established practice**: PYTHIA and PYTHIA-II. [TOMS 1996](https://dl.acm.org/doi/10.1145/235815.235820); [TOMS 2000](https://dl.acm.org/doi/10.1145/353474.353475)
3. **Pain point**: PYTHIA needed hand-coded problem features. That is the knowledge-acquisition bottleneck.
4. **How Jev fits**: Semantic predicate in a rule engine. Nouls turn a textual or LaTeX problem statement into PYTHIA-style features ("Does the operator have discontinuous coefficients?", "Are the boundary conditions mixed?"). A rule base or a learned selector then picks the solver.
5. **Why cheap and fast**: feature extraction in milliseconds lets a problem-solving environment suggest as the user types.
6. **Evidence**: PYTHIA proves feature-then-select works for PDEs. No study yet uses a language model to produce the features (my inference).
7. **Fit**: Medium to Speculative. Main risk: many traits are mathematical and need multi-step reasoning over equations.

#### U20. DFT set-up policy check

1. **Name / subfield**: check an INCAR or Quantum ESPRESSO input against lab policy. Electronic structure.
2. **Established practice**: group checklists, Materials Project style input sets, expert review. INCARBench names the policies that matter. [arXiv 2606.23571](https://arxiv.org/abs/2606.23571)
3. **Pain point**: LLM agents and students get coupled settings wrong (DFT+U, magnetism, correlated materials).
4. **How Jev fits**: Clause-by-clause compliance check. Code parses the input file and the structure into named facts ("contains Fe, O", "ISPIN = 1", "LDAU absent"). One Noul per policy: "The system holds a 3d transition-metal oxide and the policy requires a Hubbard U. Does the set-up comply?" Keep each rule single-hop.
5. **Why cheap and fast**: every job in a high-throughput campaign is checked before it takes node-hours.
6. **Evidence**: INCARBench shows policy accuracy and task-critical correctness differ and that repairs break valid settings, so an independent checker has value.
7. **Fit**: Medium to Strong. Main risk: coupled constraints are multi-hop; most rules should stay plain code. Jev adds value only where the trigger is semantic ("is this a correlated material?", "is this a surface slab calculation?").

#### U21. Input-deck intent check

1. **Name / subfield**: does the input deck match what the user says they want to simulate? CFD, FEM, MD, Monte Carlo.
2. **Established practice**: manual review; linters catch syntax only. Agent benchmarks separate "runs" from "physically right" (ChatCFD 82.1% vs 68.12%). [arXiv 2506.02019](https://arxiv.org/html/2506.02019v3)
3. **Pain point**: a deck that runs but models the wrong physics burns compute and misleads.
4. **How Jev fits**: Verifier. `state` = the user's problem text plus a code-made summary of the deck (boundary types per patch, material models, steady or transient, ensemble, thermostat). Nouls: "The user describes an open outlet. Is any boundary set as an outlet?" "The user asks for constant temperature. Is a thermostat on?"
5. **Why cheap and fast**: runs at every submit, like a pre-commit hook.
6. **Evidence**: ChatCFD fidelity gap; INCARBench.
7. **Fit**: Medium. Main risk: the deck summariser does the heavy lifting; units and magnitudes stay in code.

#### U22. Simulation-log and job-failure triage

1. **Name / subfield**: classify why a job failed. HPC operations for simulation groups.
2. **Established practice**: users read log tails; centres mine scheduler logs; ML on logs (LogBERT and others). [J. Supercomputing 2023](https://link.springer.com/article/10.1007/s11227-023-05482-y); [Antici et al. 2023](https://arxiv.org/abs/2308.15481)
3. **Pain point**: thousands of failed jobs in a campaign; regex rules break with every code version.
4. **How Jev fits**: Triage / router. `state` = last 100 lines of stdout and stderr plus scheduler exit facts. Choice: {out of memory, wall-time limit, SCF or solver did not converge, numerical blow-up (NaN, CFL), mesh or geometry error, input syntax error, file system or quota, node or network fault, licence, unknown}. The answer maps to an automatic action (resubmit with more memory, change mixing, alert admin).
5. **Why cheap and fast**: 1 million failed jobs at 1,500 tokens = 1,500 Mtok = $60. Millisecond answers let a workflow manager (AiiDA, FireWorks) recover in its loop.
6. **Evidence**: Antici 2023 first used NLP on job text; Foam-Agent and ChatCFD both contain an error-reading loop driven by a large LLM.
7. **Fit**: Strong. Main risk: logs are noisy and long; code must cut to the relevant tail first.

#### U23. Guard and process-reward step inside LLM simulation agents

1. **Name / subfield**: check each proposed edit of a CFD or DFT agent before the run.
2. **Established practice**: agent self-reflection with the same large LLM (Foam-Agent, ChatCFD, DREAMS, TritonDFT). [arXiv 2509.18178](https://arxiv.org/html/2509.18178v1)
3. **Pain point**: self-checks are costly and correlated with the error; repairs damage valid settings (INCARBench).
4. **How Jev fits**: Verifier / process-reward model. For each edit: Noul "Does this change address the error in the log?" and Noul "Does this change touch a setting the policy says must stay?" Low scores block the run and escalate.
5. **Why cheap and fast**: a guard at 10 to 100 ms adds no felt delay to an agent loop where each run takes minutes.
6. **Evidence**: INCARBench's "preservation" finding; ChatCFD fidelity gap.
7. **Fit**: Medium to Strong. Main risk: adversarial or sloppy agent text in `state` can steer Jev; pass parsed facts, not agent prose.

#### U24. Provenance tagging of workflow nodes

1. **Name / subfield**: label each stored calculation with purpose {relaxation, static, band structure, phonon, convergence test, failed trial, production}.
2. **Established practice**: AiiDA stores the graph; purpose labels are free-text or missing. [AiiDA, Sci Data 2020](https://www.nature.com/articles/s41597-020-00638-4) (not fetched)
3. **Pain point**: years of runs cannot be searched by intent; FAIR data sharing needs it.
4. **How Jev fits**: Feature extractor. `state` = code-made input summary plus user notes and directory name. Choice over the purpose list.
5. **Why cheap and fast**: back-fill millions of legacy runs for a few dollars.
6. **Evidence**: none direct; this is my inference from provenance practice.
7. **Fit**: Medium. Main risk: purpose often shows only in numeric differences between runs.

### Gaps

- I found no study that uses a language model to produce PYTHIA-style problem features. U19 is unproven.
- I looked for CFD best-practice guides as grounding (ERCOFTAC Best Practice Guidelines, AIAA and ASME verification and validation guides). I know they exist but did not fetch a URL, so I do not cite them as findings.
- Antici et al. give no performance numbers in the abstract.
- I found no paper on NLP routing of HPC help-desk tickets. It is a plain triage usage, but it lacks a physics-specific source.

---

## 4. Verification of derivations and LLM physics reasoning

### Takeaway

Be strict here. Physics benchmarks show that even frontier reasoning models fail half of undergraduate problems and most research-level ones, and that conceptual errors persist after step-level training. A System One model cannot verify a derivation. It can do narrow, single-hop checks on one step at a time when code owns algebra, units and numbers: regime and assumption checks in words, error-type labels, and red-flag screens.

### Cited Findings

- Lightman et al. (2023) showed that process supervision (a reward per step) beats outcome supervision for maths reasoning. — ["Let's Verify Step by Step", arXiv 2305.20050](https://arxiv.org/abs/2305.20050) (not fetched)
- PRMBench has 6,216 problems and 83,456 step labels and tests process-reward models on simplicity, soundness and sensitivity. The authors extended it to physics, chemistry and biology as PRMBench-STEM. — [arXiv 2501.03124](https://arxiv.org/abs/2501.03124)
- SCI-PRM (2026) is a tool-aware process-reward model for science. It scores tool choice, tool execution and result reading at each step, trained on 70K tool-interleaved traces. It supports Best-of-N selection and dense reward in RL. — [arXiv 2606.04579](https://arxiv.org/abs/2606.04579)
- UGPhysics: 5,520 undergraduate problems, 13 subjects. Best model (o1-mini) scores 49.8%. QwQ-32B scores 37.3%; Qwen2.5-Math-72B scores 39.5%. Models do well on knowledge recall and poorly on maths derivation. — [arXiv 2502.00334](https://arxiv.org/abs/2502.00334); [HTML v2](https://arxiv.org/html/2502.00334v2)
- TPBench: 57 novel theoretical-physics problems over five levels, undergraduate to research. Research-level problems are mostly unsolved by o3-mini, o1, DeepSeek-R1, GPT-4o, Llama and Qwen. It stresses auto-verifiable answers. — [Mach. Learn.: Sci. Technol. 2025](https://iopscience.iop.org/article/10.1088/2632-2153/adfcb0); [arXiv 2502.15815](https://arxiv.org/abs/2502.15815v1)
- A follow-up compares test-time scaling methods on TPBench. Title only. — [arXiv 2506.20729](https://arxiv.org/abs/2506.20729)
- PhysicsEval: 19,609 textbook problems. A multi-agent review set-up helps most on problems the model first gets wrong. — [ACL Anthology 2025](https://aclanthology.org/2025.findings-ijcnlp.43/); [arXiv 2508.00079](https://arxiv.org/html/2508.00079)
- Jaiswal et al. (2026) give step-level structured feedback to small language models on five physics benchmarks. Accuracy rises 17 to 20% over chain-of-thought. Calculation errors fall from 56.9% to 23.5%. Miscomprehension errors fall from 22.3% to 12.0%. Conceptual errors stay high: 89.7% to 68.7%. — [arXiv 2607.05199](https://arxiv.org/abs/2607.05199)
- McGinness and Baumgartner (2025): no open-source model could translate students' typed, error-containing equations (Australian Physics Olympiad) into a form for a computer algebra system at the accuracy needed, even with model consensus and solver feedback. They suggest splitting the task into smaller parts. — [Phys. Rev. Phys. Educ. Res. 2025](https://journals.aps.org/prper/abstract/10.1103/v8f8-s11v)
- SciBench and TheoremQA are college-level science and theorem benchmarks on which open models scored low at release. — [SciBench, arXiv 2307.10635](https://arxiv.org/abs/2307.10635); [TheoremQA, arXiv 2305.12524](https://arxiv.org/abs/2305.12524) (both not fetched)
- A 2026 paper fine-tunes small reasoning models for quantum field theory. Title only. — [arXiv 2604.18936](https://arxiv.org/abs/2604.18936)

### Inferences: usages

#### U25. Regime and assumption check in words

1. **Name / subfield**: does the solution use a formula outside its stated regime? Theory and problem solving.
2. **Established practice**: a referee or teacher checks assumptions first (non-relativistic, small angle, ideal gas, continuum, weak coupling). Conceptual errors are the most stubborn class for small models. [Jaiswal et al. 2026](https://arxiv.org/abs/2607.05199)
3. **Pain point**: LLM solutions apply formulas outside their validity; final-answer checks miss it.
4. **How Jev fits**: Verifier. Code computes the dimensionless numbers and passes buckets ("v/c: above 0.1", "Knudsen number: above 1", "kT compared with level spacing: much smaller"). `state` = problem text, buckets, one solution step. Choice for regime {classical, relativistic}, then Noul: "Does this step use a formula valid only in the non-relativistic regime?"
5. **Why cheap and fast**: every step of every sampled solution can be checked; with Best-of-N, that is thousands of steps per problem.
6. **Evidence**: process supervision works ([Lightman 2023](https://arxiv.org/abs/2305.20050)); SCI-PRM shows verification improves when tools own the numerics.
7. **Fit**: Medium. Main risk: spotting which formula a step uses can itself be multi-hop.

#### U26. Error-type labelling of a wrong step

1. **Name / subfield**: label a failed step as {conceptual, calculation, miscomprehension of the question, unit or dimension, sign or direction}.
2. **Established practice**: the error taxonomy in Jaiswal et al. 2026; PRMBench's soundness classes. [arXiv 2501.03124](https://arxiv.org/abs/2501.03124)
3. **Pain point**: building step-labelled training data for physics PRMs is slow and costly.
4. **How Jev fits**: Feature extractor. Code or a reference solution flags that the step is wrong. Jev only names the class. `state` = problem, reference step, model step.
5. **Why cheap and fast**: label millions of steps for PRM training data at dollars, not thousands of dollars.
6. **Evidence**: Jaiswal 2026 shows structured error-type feedback is what helps small models.
7. **Fit**: Medium. Main risk: the class boundary (conceptual vs miscomprehension) is fuzzy even for people.

#### U27. Dimensional-consistency explanation check (code does the units)

1. **Name / subfield**: units and dimension checks on derivation steps.
2. **Established practice**: dimensional analysis; computer algebra and units libraries do this exactly.
3. **Pain point**: the hard part is mapping symbols in a step to physical quantities ("what is 'k' here: wave number, spring constant or Boltzmann constant?").
4. **How Jev fits**: Select, do not generate. Choice: "In this problem, the symbol k means: {spring constant, wave number, Boltzmann constant, thermal conductivity, other}". Code then assigns dimensions and runs the check.
5. **Why cheap and fast**: symbol grounding for every symbol in every step is only viable when each call is nearly free.
6. **Evidence**: McGinness and Baumgartner 2025 show end-to-end equation parsing fails for open LLMs and suggest splitting it up. This is such a split.
7. **Fit**: Medium. Main risk: the symbol's meaning may be defined far away in the text (long context, multi-hop).

#### U28. Red-flag screen for unphysical claims

1. **Name / subfield**: flag text that claims energy from nothing, efficiency over 100%, signalling faster than light, or perpetual motion. LLM output filters, preprint moderation support, science-desk triage.
2. **Established practice**: arXiv moderators check that submissions are scientific. [arXiv moderation](https://info.arxiv.org/help/moderation/index.html)
3. **Pain point**: volume; LLM-written content adds fluent nonsense.
4. **How Jev fits**: Semantic predicate. One Noul per red flag: "Does the text claim a device puts out more energy than it takes in?" Output ranks items for a person. It never rejects alone.
5. **Why cheap and fast**: every paragraph of every LLM answer or submission can pass through ten red-flag questions for about $0.0001.
6. **Evidence**: none direct for physics; knowledge recall is the one skill benchmarks say models do well ([UGPhysics](https://arxiv.org/html/2502.00334v2)).
7. **Fit**: Medium to Speculative. Main risk: adversarial wording; real but surprising physics (apparent superluminal phase velocity) triggers false alarms.

#### U29. Cheap pre-filter for Best-of-N physics answers

1. **Name / subfield**: drop sampled solutions that fail cheap checks before a costly PRM or grader sees them.
2. **Established practice**: Best-of-N with PRMs ([SCI-PRM](https://arxiv.org/abs/2606.04579)); test-time scaling on TPBench ([arXiv 2506.20729](https://arxiv.org/abs/2506.20729), title only).
3. **Pain point**: each PRM pass over N long solutions is costly.
4. **How Jev fits**: Heuristic inside a search loop. Nouls: "Does the solution answer the quantity asked?", "Does it state a final answer with units?", "Does it use the given boundary condition?"
5. **Why cheap and fast**: prunes N = 64 samples to a handful for about $0.003.
6. **Evidence**: PhysicsEval shows review stages help.
7. **Fit**: Speculative. Main risk: these checks catch form, not physics. The benchmarks above show physics correctness is beyond small models.

### Gaps

- I found no benchmark that tests a small non-generative classifier as a physics step verifier. All PRM evidence is for generative or fine-tuned reward models.
- The UGPhysics abstract gives no 7B to 8B class scores. The per-skill table is in the full paper, which I did not read in full.
- I did not get SCI-PRM's model size or physics-only numbers.

---

## 5. Symbolic regression and model discovery

### Takeaway

Honest rating: mostly Speculative to Medium. When a physical prior can be written as an executable check (units, symmetry, limits), code does it better, and 2026 methods do exactly that. Jev adds value only for priors that exist as prose, and only because a genetic search makes millions of candidates, which rules out a large LLM as judge.

### Cited Findings

- AI Feynman uses dimensional analysis as its first step, then polynomial fits, brute force, and a neural net that finds symmetry and separability. — [Udrescu and Tegmark 2020, Science Advances](https://www.science.org/doi/10.1126/sciadv.aay2631)
- PySR supports constraints and expert knowledge; dimensional consistency can be enforced by a penalty on the loss. — [PySR GitHub](https://github.com/MilesCranmer/PySR); [PySR paper, arXiv 2305.01582](https://arxiv.org/abs/2305.01582) (not fetched)
- PhySO builds units constraints into deep symbolic regression so that only dimensionally valid expressions are sampled. — [Tenachi et al. 2023, arXiv 2303.03192](https://arxiv.org/abs/2303.03192)
- SINDy finds sparse dynamics from a library of candidate terms. — [Brunton, Proctor, Kutz 2016, PNAS](https://www.pnas.org/doi/10.1073/pnas.1517384113) (not fetched)
- LLM-SR (ICLR 2025) uses an LLM's scientific priors to propose equation skeletons inside an evolutionary search and beats baselines, most of all out of domain. — [arXiv 2404.18400](https://arxiv.org/abs/2404.18400)
- A 2026 Scientific Reports paper adds an LLM-based auxiliary scoring term so textual physics context steers the search toward plausible forms. — [Sci Rep 2026](https://www.nature.com/articles/s41598-026-35327-6); [arXiv 2509.03036](https://arxiv.org/abs/2509.03036)
- PG-SR (2026) encodes domain priors as executable constraint programs (a "Prior Constraint Checker") and anneals them in during evolution. It reports better results and robustness to poor priors and noise. — [arXiv 2602.13021](https://arxiv.org/abs/2602.13021)

### Inferences: usages

#### U30. Plausibility score for candidate expressions

1. **Name / subfield**: prune or re-rank candidates in a symbolic regression run.
2. **Established practice**: fit plus complexity (Pareto front); units penalties (PySR, PhySO); LLM scoring term ([Sci Rep 2026](https://www.nature.com/articles/s41598-026-35327-6)).
3. **Pain point**: the Pareto front holds many expressions that fit but make no physical sense; an expert reads them by hand.
4. **How Jev fits**: Heuristic inside a search loop. Code describes each candidate in words and named facts: "units: consistent", "as r grows large: tends to zero", "symmetric under x to minus x: yes", "contains nested exponentials: yes". `state` = the domain prior in prose ("a central attractive force between two bodies"). Score on levels {implausible, odd, plausible, textbook-like}. Put 100 candidates in one request as parallel questions.
5. **Why cheap and fast**: 1 million candidates at 400 tokens = 400 Mtok = $16, about 27 minutes at the token rate limit. A frontier LLM judge at that volume is not viable.
6. **Evidence**: the Sci Rep 2026 scoring-term paper shows a language prior helps; LLM-SR shows priors matter most out of domain; PG-SR shows executable priors work and code should own them.
7. **Fit**: Medium to Speculative. Main risk: Jev reads expressions weakly; the value rests on the code-made description, so much of the gain may come from the code alone.

#### U31. Library and operator pre-selection for SINDy or PySR

1. **Name / subfield**: choose candidate term families from the system description.
2. **Established practice**: the analyst picks the SINDy library or PySR operator set by hand. [SINDy](https://www.pnas.org/doi/10.1073/pnas.1517384113) (not fetched)
3. **Pain point**: a too-wide library hurts sparsity and runtime; a too-narrow one misses the law.
4. **How Jev fits**: Supervisory layer. `state` = text description of the system. One Noul per family: "Would trigonometric terms be expected?" (pendulum: yes), "Would rational terms be expected?" (central force: yes).
5. **Why cheap and fast**: only matters for automated sweeps over many systems; otherwise a person does this in seconds.
6. **Evidence**: LLM-SR's skeleton proposals are the generative form of the same prior.
7. **Fit**: Speculative. Main risk: low volume per user, so Jev's cost edge hardly matters.

### Gaps

- No paper tests a small calibrated classifier as the plausibility judge in symbolic regression. The closest is the generative-LLM scoring term in the Sci Rep 2026 paper.
- I did not read how that paper builds its score or what it costs per candidate.

---

## 6. Experimental design and autonomous discovery (lab scale; facility operations excluded)

### Takeaway

Language models can add prior knowledge to Bayesian optimisation, and 2026 work shows calibration is the missing piece. Jev's calibrated yes/no on "is this candidate promising, given what the text says" is a plausible cheap prior or feature, but it is unproven and must never replace the numeric surrogate model. Novelty checks against the literature are the most solid usage here.

### Cited Findings

- A 2026 Nature Machine Intelligence paper argues that LLMs hold rich scientific knowledge but lack calibrated uncertainty, and that training with Bayesian objectives makes them reliable optimisers guided by natural language. I could not open the paper (login redirect); this is from the search abstract. — [Nature Machine Intelligence 2026](https://www.nature.com/articles/s42256-026-01283-z)
- LABO uses an LLM to propose high-potential candidates and to produce cheap "LLM-fidelity" predictions over the search space, then fits a Kennedy-O'Hagan joint Gaussian process and gates which candidates earn a real experiment. — [arXiv 2605.22054](https://arxiv.org/abs/2605.22054)
- A sceptical 2025 study asks whether LLMs are ready for Bayesian optimisation in science. Title only. — [arXiv 2509.21403](https://www.arxiv.org/pdf/2509.21403)
- LLM-guided hypothesis learning has been tried in autonomous scanning probe microscopy. Title only. — [arXiv 2605.06839](https://arxiv.org/abs/2605.06839)
- The A-Lab autonomous synthesis study (Szymanski et al. 2023) was later criticised because several claimed new materials were not new or not well characterised (Leeman et al. 2024). Both not fetched. — [Nature 2023](https://www.nature.com/articles/s41586-023-06734-w); [PRX Energy 3, 011002](https://journals.aps.org/prxenergy/abstract/10.1103/PRXEnergy.3.011002)

### Inferences: usages

#### U32. Text-derived prior over a closed candidate set

1. **Name / subfield**: prior for the next experiment among listed candidates. Materials and device optimisation.
2. **Established practice**: Bayesian optimisation with a Gaussian process; LLM-in-the-loop variants such as [LABO](https://arxiv.org/abs/2605.22054).
3. **Pain point**: cold start; early experiments are wasted; a large LLM per candidate per round is costly and uncalibrated.
4. **How Jev fits**: Feature extractor, and the new role "cold-start prior". For each candidate, `state` = short text card (composition family, known relatives, retrieved literature snippets). Noul: "Do the snippets suggest this family reaches the target property?" The probability enters the surrogate as a prior mean or an extra feature. The acquisition function stays numeric.
5. **Why cheap and fast**: 100,000 candidates at 800 tokens = 80 Mtok = $3.20 per round, so the prior can be refreshed every round.
6. **Evidence**: LABO's low-fidelity LLM layer; the Nature MI 2026 point that calibration is what LLM optimisers lack.
7. **Fit**: Medium to Speculative. Main risk: the prior echoes literature bias; numeric structure-property links are out of Jev's reach.

#### U33. Novelty check of a claimed new material or effect

1. **Name / subfield**: "is this already reported?" before an autonomous lab or a group claims discovery.
2. **Established practice**: database lookup by composition and structure; manual literature search. The A-Lab dispute shows what happens when this is weak. [PRX Energy 2024](https://journals.aps.org/prxenergy/abstract/10.1103/PRXEnergy.3.011002) (not fetched)
3. **Pain point**: names and notations differ; exact-match lookup misses prior reports.
4. **How Jev fits**: Entity / record alignment. Retrieval finds the 50 nearest abstracts. Noul per abstract: "Does this abstract report synthesis of the same compound or a trivially substituted one?"
5. **Why cheap and fast**: every candidate in a 10,000-compound campaign gets a literature check for under $2.
6. **Evidence**: alignment need shown by the A-Lab critique; MatKG style graphs give the retrieval base.
7. **Fit**: Medium. Main risk: composition equivalence is numeric; structure identity needs crystallography code.

#### U34. Anomaly-note triage in automated campaigns

1. **Name / subfield**: sort free-text anomaly notes from simulation sweeps and bench-scale autonomous labs.
2. **Established practice**: a person reads run notes and flags; most anomalies are artefacts.
3. **Pain point**: real surprises hide among artefacts.
4. **How Jev fits**: Triage / router. `state` = note plus code-made run facts. Choice: {instrument or software artefact, sample or input preparation error, known effect, candidate new effect, cannot tell}.
5. **Why cheap and fast**: every run gets triaged, not just the ones someone has time to read.
6. **Evidence**: none direct. Inference from U22.
7. **Fit**: Medium to Speculative. Main risk: needs non-text evidence (curves, images) turned into text first. Large-facility anomaly handling belongs to another researcher.

### Gaps

- I could not read the Nature Machine Intelligence 2026 paper. Its method and numbers are unverified.
- I found no study that feeds a small classifier's calibrated probabilities into a Bayesian-optimisation prior.

---

## 7. Physics education research

### Takeaway

This is the best-evidenced area. Physics education research already has closed taxonomies (Force Concept Inventory misconceptions, 5-way short-answer labels, checklist rubrics), and 2024 to 2026 studies show GPT-4-class models grade at human-level agreement. The blockers are cost, privacy, latency, and knowing when to trust the grade. Jev's per-item calibrated probability is exactly the "grading confidence" those studies try to build by hand.

### Cited Findings

- The Force Concept Inventory tests Newtonian concepts with common-sense distractors built from known student misconceptions. — [PhysPort FCI](https://www.physport.org/assessments/FCI); Hestenes, Wells, Swackhamer, The Physics Teacher 30, 141 (1992) (from memory, no URL fetched)
- Savage and Rebello (2025) used GPT-4o to mark written explanations on three Energy and Momentum Conceptual Survey questions as right or wrong and to group misconceptions into themes. Discrepancy with human graders was 0 to 3%. — [arXiv 2508.14823](https://arxiv.org/abs/2508.14823)
- Chen and Wan (2025): GPT-4o, with no examples or reference answers, agreed with human graders on 70 to 80% of partial-credit decisions for written explanations. That equals or beats human-to-human agreement. Adding explanation text to each rubric item was key. The arXiv version adds a "grading confidence index". — [Phys. Rev. Phys. Educ. Res. 21, 010126](https://journals.aps.org/prper/abstract/10.1103/PhysRevPhysEducRes.21.010126); [arXiv 2412.06910](https://arxiv.org/abs/2412.06910)
- Kortemeyer (2023) proposed an AI-assisted workflow for grading written physics solutions with GPT-4. Follow-ups graded a handwritten thermodynamics exam (2024) and used psychometrics to estimate confidence in AI grades (Kortemeyer and Nöhl 2025). — [PRPER 19, 020163](https://journals.aps.org/prper/abstract/10.1103/PhysRevPhysEducRes.19.020163); [PRPER 20, 020144](https://link.aps.org/doi/10.1103/PhysRevPhysEducRes.20.020144); [PRPER 21, 010136](https://journals.aps.org/prper/abstract/10.1103/PhysRevPhysEducRes.21.010136)
- Tang, Ambrose and Cheng (2026): on physics exams, human-AI agreement on totals matched human inter-rater reliability. A fine-grained checklist rubric beat holistic scoring. Agreement was weakest for mid-range answers with partial credit. Rubric clarity mattered more than prompt format or temperature. — [arXiv 2604.12227](https://arxiv.org/abs/2604.12227)
- A 2026 study confirms mid-range degradation in automated short-answer scoring. Title only. — [arXiv 2605.07647](https://arxiv.org/abs/2605.07647)
- SemEval-2013 Task 7 set the standard benchmark. Beetle: about 3,000 answers to 56 questions on electricity. SciEntsBank: about 10,000 answers to 197 questions in 15 science domains. Labels: correct, partially correct incomplete, contradictory, irrelevant, non-domain. — [Dzikovska et al. 2013](https://www.researchgate.net/publication/267211799_SemEval-2013_Task_7_The_Joint_Student_Response_Analysis_and_8th_Recognizing_Textual_Entailment_Challenge); [RAG for short-answer scoring, arXiv 2408.03811](https://arxiv.org/html/2408.03811v1)
- An item-response-theory study of 17 open-weight LLMs on SciEntsBank and Beetle finds that models with similar overall scores differ sharply in how fast accuracy falls as answers get harder to grade. — [arXiv 2605.00238](https://arxiv.org/abs/2605.00238)
- VerAs grades STEM lab reports in two steps: verify that the report has content for a rubric dimension, then assess those sentences. It beats open-QA and essay-scoring baselines and also works on middle-school physics essays. — [arXiv 2402.05224](https://arxiv.org/abs/2402.05224)
- Andes gives feedback after every step of a physics derivation (vectors, axes, variables, equations). Over five years at the US Naval Academy, Andes students scored 0.61 standard deviations above controls. — [VanLehn et al. 2005, IJAIED](https://journals.sagepub.com/doi/abs/10.3233/IRG-2005-15(3)02); [Five years of evaluations](https://www.researchgate.net/publication/221297239_The_Andes_Physics_Tutoring_System_Five_Years_of_Evaluations)
- Open LLMs cannot yet parse students' faulty typed equations into computer-algebra form reliably. — [McGinness and Baumgartner 2025, PRPER](https://journals.aps.org/prper/abstract/10.1103/v8f8-s11v)
- Docktor et al. (2016) published a validated five-category rubric for written physics problem solutions (useful description, physics approach, specific application, maths procedures, logical progression). — [PRPER 12, 010130](https://journals.aps.org/prper/abstract/10.1103/PhysRevPhysEducRes.12.010130) (not fetched)

### Inferences: usages

#### U35. Misconception tagging of free-text explanations

1. **Name / subfield**: map a student's explanation to a misconception from a fixed taxonomy (impetus, "motion implies force", "heavier falls faster", and so on). Concept-inventory research and formative feedback.
2. **Established practice**: multiple-choice distractors stand in for misconceptions ([FCI](https://www.physport.org/assessments/FCI)); researchers hand-code written explanations.
3. **Pain point**: hand coding limits studies to hundreds of answers; multiple choice hides the reasoning.
4. **How Jev fits**: Feature extractor / screening. `state` = question, student text. Choice over the item's misconception list plus {correct reasoning, other, cannot tell}. Or one Noul per misconception when several may co-occur.
5. **Why cheap and fast**: 100,000 explanations at 500 tokens = 50 Mtok = $2. A class gets a misconception map before the next lecture.
6. **Evidence**: [Savage and Rebello 2025](https://arxiv.org/abs/2508.14823), 0 to 3% discrepancy with GPT-4o.
7. **Fit**: Strong. Main risk: evidence is from three questions; emergent (unlisted) misconceptions need a generative model or a person.

#### U36. Short-answer grading with the 5-way SemEval labels

1. **Name / subfield**: automated short-answer grading for conceptual physics.
2. **Established practice**: SemEval-2013 Task 7 labels and corpora; Beetle is electricity content. [Dzikovska et al. 2013](https://www.researchgate.net/publication/267211799_SemEval-2013_Task_7_The_Joint_Student_Response_Analysis_and_8th_Recognizing_Textual_Entailment_Challenge)
3. **Pain point**: large intro courses cannot hand-grade weekly free-text answers, so they fall back to multiple choice.
4. **How Jev fits**: Verifier. `state` = question, reference answer, student answer. Choice over {correct, partially correct incomplete, contradictory, irrelevant, non-domain}.
5. **Why cheap and fast**: 500 students, 10 answers, 600 tokens each = 3 Mtok = $0.12 per assignment.
6. **Evidence**: SciEntsBank and Beetle are ready-made test beds; the [IRT study](https://arxiv.org/abs/2605.00238) shows why calibrated doubt on hard answers matters.
7. **Fit**: Strong. Main risk: students can write text that tries to steer the grader; strip and screen input.

#### U37. Rubric-item partial credit with a confidence index

1. **Name / subfield**: grade written explanations of problem solving, one rubric item at a time.
2. **Established practice**: checklist rubrics ([Chen and Wan 2025](https://journals.aps.org/prper/abstract/10.1103/PhysRevPhysEducRes.21.010126)); Docktor's problem-solving rubric ([PRPER 2016](https://journals.aps.org/prper/abstract/10.1103/PhysRevPhysEducRes.12.010130), not fetched); Kortemeyer's AI-assisted workflows.
3. **Pain point**: grader time and drift; LLM graders give no native confidence, so Chen and Wan and Kortemeyer build one by hand; mid-range answers are unreliable ([Tang et al. 2026](https://arxiv.org/abs/2604.12227)).
4. **How Jev fits**: Clause-by-clause compliance check. One Noul per rubric item ("Does the student state that mechanical energy is conserved because friction is absent?"), with the item's explanation text in `criteria`. Docktor-style categories use Score levels. Items between, say, 0.3 and 0.7 go to a human.
5. **Why cheap and fast**: parallel Nouls grade a whole rubric in one request. A 1,000-student exam costs well under $1. Student data can stay within a small, fast service.
6. **Evidence**: Chen and Wan (70 to 80%, human level); Tang et al. (checklists beat holistic); [Kortemeyer and Nöhl 2025](https://journals.aps.org/prper/abstract/10.1103/PhysRevPhysEducRes.21.010136) (confidence matters).
7. **Fit**: Strong. Main risk: numeric steps and equations inside explanations; grade those by code. Handwriting needs OCR first.

#### U38. Lab-report rubric scoring, verify then assess

1. **Name / subfield**: score long lab reports on rubric dimensions (uncertainty analysis present, conclusion follows from data, comparison with theory).
2. **Established practice**: TA grading with analytic rubrics; [VerAs](https://arxiv.org/abs/2402.05224) two-stage model.
3. **Pain point**: long reports; inconsistent TAs; slow return of feedback.
4. **How Jev fits**: Screening then Score. Stage 1: Noul per paragraph, "Does this paragraph address uncertainty analysis?" Stage 2: Score with described levels on the selected paragraphs only. This keeps `state` short and free of clutter, which the brief names as a weak spot.
5. **Why cheap and fast**: a 5,000-token report with 8 dimensions costs about $0.002.
6. **Evidence**: VerAs shows verify-then-assess beats one-shot scoring.
7. **Fit**: Medium to Strong. Main risk: judging whether numbers and error bars are right is numeric; Jev judges presence and reasoning quality only.

#### U39. Real-time step feedback in a physics tutor

1. **Name / subfield**: classify each student step and pick a hint from a closed hint set. Intelligent tutoring.
2. **Established practice**: Andes checks each step with a hand-built solver and rule base and gives hints on demand; effect size 0.61. [VanLehn et al. 2005](https://journals.sagepub.com/doi/abs/10.3233/IRG-2005-15(3)02)
3. **Pain point**: Andes-style knowledge bases cost years to author per topic; LLM tutors are slow, costly per keystroke, and may give away the answer.
4. **How Jev fits**: Supervisory layer over a symbolic checker. A computer algebra system checks the equation. When it fails, Jev picks the likely cause from the problem's closed list {missing force, wrong sign convention, wrong axis component, used mass in place of weight, other} using the step plus the student's typed note. The tutor shows the pre-written hint.
5. **Why cheap and fast**: 10 to 100 ms means feedback on every step feels instant. A 30-step problem at 800 tokens per step costs about $0.001.
6. **Evidence**: Andes proves step feedback works; [McGinness and Baumgartner 2025](https://journals.aps.org/prper/abstract/10.1103/v8f8-s11v) show equation parsing must stay in code.
7. **Fit**: Medium to Strong. Main risk: diagnosing algebraic slips is numeric and multi-hop; limit Jev to the semantic cause list.

#### U40. Coding of interviews and open survey responses for physics education research

1. **Name / subfield**: qualitative coding with a fixed codebook.
2. **Established practice**: two human coders and an inter-rater statistic.
3. **Pain point**: weeks of coder time; studies stay small.
4. **How Jev fits**: Feature extractor. One Noul per code per excerpt. Calibrated output acts as a third rater and flags excerpts where it disagrees with the human code.
5. **Why cheap and fast**: a whole multi-institution data set is coded in minutes; codebook changes can be re-run at once.
6. **Evidence**: [Savage and Rebello 2025](https://arxiv.org/abs/2508.14823) theme coding.
7. **Fit**: Medium to Strong. Main risk: codes that need context across a long interview.

### Gaps

- I found no study of a non-generative, calibrated classifier on physics grading. All 2023 to 2026 evidence uses GPT-4-class generative models.
- I did not find an FCI-specific free-text misconception classifier paper; the nearest is Savage and Rebello on a different survey.
- Latency needs of tutoring systems are my inference; I found no paper that sets a millisecond target.

---

## 8. Peer review and publishing

### Takeaway

Publishing has clear clause-by-clause and triage tasks: checklist compliance, scope, reviewer-fit features, and integrity screens. A live NeurIPS trial shows authors value an LLM checklist assistant but find it too strict and sometimes wrong, which argues for calibrated, per-item probabilities and human hand-off. Judging novelty or importance is a poor fit.

### Cited Findings

- Reviewer assignment is a two-stage process: compute a paper-reviewer affinity score, then solve a constrained assignment. Affinity comes from subject areas, text similarity (Toronto Paper Matching System, SPECTER, SciNCL), and bids. — [arXiv 2301.10816](https://arxiv.org/abs/2301.10816); [OpenReview expertise](https://github.com/openreview/openreview-expertise); [SPECTER, arXiv 2004.07180](https://arxiv.org/abs/2004.07180) (not fetched)
- MERIT (2026) trains reviewer matching with rubric-informed signals. Title only. — [arXiv 2605.27865](https://arxiv.org/abs/2605.27865)
- NeurIPS 2024 ran an LLM "Checklist Assistant" on 234 volunteered papers. Over 70% of authors found it useful and 70% said they would revise. Top complaints: inaccuracy (20 of 52) and being too strict (14 of 52). — [Goldberg et al. 2024, arXiv 2411.03417](https://arxiv.org/abs/2411.03417); [NeurIPS blog](https://blog.neurips.cc/2024/12/10/results-of-the-neurips-2024-experiment-on-the-usefulness-of-llms-as-an-author-checklist-assistant-for-scientific-papers/)
- The Problematic Paper Screener flags "tortured phrases" ("signal-to-clamour ratio" for signal-to-noise ratio). It scans about 130 million publications each week, has found about 14,000 papers with such phrases, and has fed over 1,000 retractions. — [The Conversation, 2025](https://theconversation.com/problematic-paper-screener-trawling-for-fraud-in-the-scientific-literature-246317); [Cabanac et al., arXiv 2210.04895](https://arxiv.org/abs/2210.04895); [Chemistry World](https://www.chemistryworld.com/news/nineteen-journals-shut-down-by-wiley-following-delisting-and-paper-mill-problems/4019595.article)
- IOP Publishing retracted 350 papers from two 2021 proceedings (232 in Journal of Physics: Conference Series, 118 in IOP Conference Series: Materials Science and Engineering) after the screener flagged them. — [Retraction Watch 2022](https://retractionwatch.com/2022/02/23/publisher-retracts-350-papers-at-once/)
- A light DistilBERT detector of AI-written abstracts reached 99.4% in-domain accuracy. — [Scientific Reports 2026](https://www.nature.com/articles/s41598-026-35203-3)

### Inferences: usages

#### U41. Reporting-checklist and reproducibility-statement compliance

1. **Name / subfield**: check a manuscript against a journal's reporting list: data availability, code availability, DFT settings stated, uncertainty stated, software versions.
2. **Established practice**: author checklists and editor spot checks; NeurIPS LLM assistant trial ([arXiv 2411.03417](https://arxiv.org/abs/2411.03417)); DFT reporting norms ([Lejaeghere et al. 2016](https://www.science.org/doi/10.1126/science.aad3000), not fetched).
3. **Pain point**: editors cannot read every methods section against every item; the NeurIPS LLM was "too strict" and sometimes wrong.
4. **How Jev fits**: Clause-by-clause compliance check. `state` = relevant section (code finds it). One Noul per item: "Does the paper name the exchange-correlation functional?" "Does it state where the raw data can be obtained?" Only items under a threshold show as warnings.
5. **Why cheap and fast**: 30 items on a 10k-token paper costs about $0.0005. It can run on every revision and inside the authoring tool.
6. **Evidence**: the NeurIPS trial shows demand and the failure modes that calibration addresses.
7. **Fit**: Strong. Main risk: long papers dilute accuracy; feed sections, not the full text.

#### U42. Scope and section triage at submission

1. **Name / subfield**: is the manuscript in scope, and which section or editor gets it?
2. **Established practice**: editorial assistants and handling editors; PhySH tags guide routing at APS. [ISKO PhySH](https://www.isko.org/cyclo/physh)
3. **Pain point**: desk triage delay; misrouted papers.
4. **How Jev fits**: Triage / router. Choice over journal sections; Noul per scope rule taken from the journal's own scope text.
5. **Why cheap and fast**: instant feedback to the author at upload; transfer suggestions across a publisher's journals.
6. **Evidence**: arXiv's deployed classifier is the same task at preprint level.
7. **Fit**: Strong to Medium. Main risk: scope is fine; "importance" is not a Jev task (see Poor fits).

#### U43. Reviewer-fit features

1. **Name / subfield**: richer paper-reviewer affinity.
2. **Established practice**: embedding similarity plus bids ([OpenReview expertise](https://github.com/openreview/openreview-expertise)).
3. **Pain point**: similarity does not tell method fit from topic fit; conflicts and rivalries are missed.
4. **How Jev fits**: Feature extractor. For the top-k reviewers by embedding, Nouls over (submission abstract, reviewer's recent abstracts): "Has this reviewer used the same experimental technique?", "Same material system?", "Same theoretical framework?" The features enter the affinity score; the assignment solver stays as is.
5. **Why cheap and fast**: pairs scale as papers times reviewers. 10,000 papers times 50 candidates times 1,500 tokens = 750 Mtok = $30.
6. **Evidence**: [MERIT 2026](https://arxiv.org/abs/2605.27865) (title only) moves in the same rubric-based direction.
7. **Fit**: Medium. Main risk: evidence is thin; gains over embeddings are unproven.

#### U44. Integrity screen: tortured phrases and paper-mill tells

1. **Name / subfield**: research-integrity triage for physics and materials proceedings.
2. **Established practice**: the Problematic Paper Screener matches a fixed list of known tortured phrases. [arXiv 2210.04895](https://arxiv.org/abs/2210.04895)
3. **Pain point**: a fixed phrase list misses new paraphrases; this is a brittle keyword rule by design.
4. **How Jev fits**: Semantic predicate in a rule engine. Noul per sentence or per abstract: "Does this text use an odd paraphrase in place of a standard technical term?" Second Noul: "Do the title and the abstract describe different topics?" Flags go to integrity staff.
5. **Why cheap and fast**: 130 million abstracts at 300 tokens = 39,000 Mtok = $1,560 for a full pass; new submissions cost nothing to screen.
6. **Evidence**: screener results and the IOP case (above); [DistilBERT detector](https://www.nature.com/articles/s41598-026-35203-3) shows small models detect machine-made text in domain.
7. **Fit**: Medium to Strong. Main risk: adversarial; paper mills adapt. Non-native English may raise false alarms, so a person must decide.

### Gaps

- I found no APS, IOP or AIP document that describes automated scope or checklist checking in production.
- I recall 2025 press reports of hidden prompts inside arXiv manuscripts aimed at LLM reviewers. I did not verify this in this session. If true, it is direct evidence of the adversarial risk for U41 to U44.
- MERIT is title only.

---

## Top 5 usages by likely value

1. **U10 + U11 + U17: gate, verify and rank around LLM extraction for materials databases.** Every pipeline (ChatExtract, Dagdelen, SuperCon2, Huang and Cole) already has these yes/no steps; Jev cuts their cost to tens of dollars per corpus and adds a calibrated confidence to each record.
2. **U37 + U35: rubric-item grading and misconception tagging.** Human-level agreement is already shown with GPT-4o (Chen and Wan; Savage and Rebello); the open problems are cost, a trust signal, and mid-range answers, and calibrated per-item probabilities answer all three.
3. **U1 to U3: arXiv, PhySH and INSPIRE classification and curation triage.** Deployed or hand-done today, closed taxonomies, daily volume, and no retraining when the taxonomy changes.
4. **U22 + U23: job-failure triage and agent guard for simulation workflows.** High volume, closed answer set, recoverable errors; 2026 benchmarks (INCARBench, ChatCFD) show agents need an independent checker.
5. **U41 + U16: reporting-checklist compliance and methods-metadata extraction.** Clause-by-clause checks that editors cannot do by hand; the NeurIPS trial shows demand and shows that over-strict, uncalibrated answers are the main complaint.

Runners-up: U4 (screening for living reviews), U6 and U13 (quantity selection and Tc linking), U39 (real-time tutor feedback; the one usage here where sub-100 ms latency is the main enabler).

## Poor fits (tempting, but they break on Jev's weak spots)

- **Solving or end-to-end grading of physics problems.** Frontier reasoning models reach only 49.8% on UGPhysics and leave TPBench research problems unsolved. [UGPhysics](https://arxiv.org/abs/2502.00334); [TPBench](https://iopscience.iop.org/article/10.1088/2632-2153/adfcb0). A System One model is far below that. Multi-hop plus numeric.
- **Verifying a full derivation or algebraic equivalence.** Use a computer algebra system. Jev may only check one verbal claim about one step (U25 to U27).
- **Parsing students' faulty equations into machine form.** Open LLMs fail at this. [McGinness and Baumgartner 2025](https://journals.aps.org/prper/abstract/10.1103/v8f8-s11v). Keep parsing in code.
- **Comparing or de-duplicating extracted values, unit conversion, "which Tc is highest".** Numeric comparison. Code only.
- **Choosing numeric simulation settings** (k-point mesh, cutoff, time step, mesh size). Numeric ML and convergence tests do this. [Digital Discovery 2026](https://pubs.rsc.org/dd/article/5/7/2968/1262935/Automatic-generation-of-input-files-with-optimised)
- **Coupled DFT settings** (DFT+U with magnetism in correlated materials). Even frontier LLMs fail here ([INCARBench](https://arxiv.org/abs/2606.23571)); the rules are multi-constraint. Encode them in code; use Jev only for the semantic trigger.
- **Ranking symbolic-regression candidates by fit, complexity or exact units.** Code does this exactly (PhySO, PG-SR). Jev adds value only for prose priors (U30), and that is unproven.
- **Reading values from figures, spectra, phase diagrams or image tables.** Non-text input. Needs a vision or plot-digitising step first.
- **Judging novelty, importance or correctness of a research paper.** Subjective, multi-hop, high stakes, and open to adversarial text in the manuscript.
- **Cross-paper synthesis** ("do these five papers disagree about the gap symmetry?"). Multi-document, multi-hop. Jev can label each paper's stance; a reasoning model or a person must combine them.
- **Stoichiometry or formula equivalence in entity alignment.** Arithmetic. Normalise formulas in code, then let Jev handle descriptive names only.
- **Final accept or reject in integrity or moderation screens.** Adversaries adapt, and false alarms hurt real authors. Jev ranks; people decide.

## New roles the catalogue is missing

- **Calibrated gate in a model cascade.** Jev decides whether an expensive step (generative LLM call, simulation run, human look) is needed at all. It differs from triage because the output is a compute-spend decision with a tunable recall target. Seen in U10, U23, U29.
- **Taxonomy walker.** Hierarchical descent through a controlled vocabulary (PhySH, arXiv, a journal's section tree) with one small Choice per level, so option lists stay short and new concepts need no retraining. Seen in U2.
- **Curation-queue ranker (active-learning oracle).** Calibrated probabilities order human review: auto-accept the top, auto-reject the bottom, send the uncertain middle to curators, and feed their fixes back as few-shot criteria. Seen in U17, U37.
- **Cold-start prior for a recommender or Bayesian optimiser.** Text-derived calibrated probabilities act as prior mean or metadata features when no performance data exists yet; the numeric model takes over as data arrives. Seen in U18, U32.
- **Symbol and quantity grounding for symbolic tools.** Jev tells code what a symbol or number means ("k is the spring constant", "this 35 K is the Tc under pressure") so that exact tools (units libraries, computer algebra, databases) can run. It is a special case of "select, do not generate" aimed at bridging prose and formal systems. Seen in U6, U27.
