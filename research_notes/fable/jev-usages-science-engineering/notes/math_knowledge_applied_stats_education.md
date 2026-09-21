# Jev usages in mathematics, subtopic B: knowledge management, applied maths, statistics, OR, education

Reader notes:

- Source marks. **✓** = seen in a search or fetch this session. **◇** = cited from memory; URL or number not re-checked this session. Treat ◇ as unverified.
- Finding IDs (K, P, S, D, O, N, E, H) are local to each section. Usages cite them.
- Usage IDs: A = knowledge management, B = peer review, C = statistics, D = data plumbing, E = operations research, F = numerical analysis, G = education, H = model-risk documentation. 41 usages in total (A 8, B 3, C 8, D 7, E 4, F 3, G 6, H 2).
- Every "Jev fit" line is my inference. No source tested Jev. Jev's fluency with heavy LaTeX is unverified everywhere below.
- Cost lines use the brief's price ($0.04 per million input tokens). Volumes are illustrative, and I did the arithmetic by hand.
- Out of scope (another researcher): theorem proving, proof search, SAT/SMT, computer algebra heuristics.

## 1. Mathematical knowledge management

### Takeaway
Most of this field is already framed as closed-set classification or pair matching (MSC codes, relevance grades, duplicate pairs, symbol-to-description links), so Jev fits well. The main unknown is how well Jev reads formula-heavy text.

### Cited Findings
- **K1 ✓** AutoMSC (Schubotz, Scharpf, Teschke, Kühnemund, Breitinger, Gipp; CICM 2020). zbMATH and Mathematical Reviews use MSC labels to organise abstracting and reviewing. A supervised coarse primary-MSC classifier reaches F1 above 77%. The human baseline (agreement between zbMATH and MR) is F1 81%. Using model confidence cuts manual coarse-classification effort by 86% while keeping 81% precision. — [arXiv 2005.12099](https://arxiv.org/abs/2005.12099); [Springer](https://link.springer.com/chapter/10.1007/978-3-030-53518-6_15)
- **K2 ◇** MSC2020 has 63 two-digit, 529 three-digit, and 6,006 five-digit classes. — [msc2020.org](https://msc2020.org/) (counts from memory)
- **K3 ✓** ARQMath-3 (CLEF 2022, final year). Task 1 answer retrieval, Task 2 formula search, Task 3 open-domain QA pilot. Topics come from 2021 Math StackExchange questions; the collection is answers from 2010-2018. Nine teams; 33, 19, and 13 runs. — [Overview, Springer](https://link.springer.com/chapter/10.1007/978-3-031-13643-6_20); [CEUR working notes](https://ceur-ws.org/Vol-3180/paper-01.pdf)
- **K3b ◇** ARQMath assessors graded relevance on four levels (High, Medium, Low, Not relevant). — same overview (from memory)
- **K4 ✓** MIRB (2025) is a maths IR benchmark. It includes duplicate-question retrieval sets for Math StackExchange and MathOverflow. The stated challenge: questions that differ in phrasing or notation but mean the same thing. — [arXiv 2505.15585](https://arxiv.org/pdf/2505.15585)
- **K5 ✓** SemEval-2022 Task 12 "Symlink": extract symbols and descriptions from the LaTeX source of arXiv papers and link them. Over 31,000 entities and 20,000 relations. Seven teams, 59 submissions. The winner used machine reading comprehension plus span-pair classification. — [arXiv 2202.09695](https://arxiv.org/abs/2202.09695); [ACL Anthology](https://aclanthology.org/2022.semeval-1.230/); [winner code](https://github.com/zizun/symlink)
- **K6 ✓** Mishra, Gauquier, Senellart (JCDL 2024). Theorem-like environments and proofs are extracted from PDFs as paragraph classification over text, font, and image features, with a sliding-window transformer across paragraphs. No LaTeX source is needed at inference. — [arXiv 2307.09047](https://arxiv.org/abs/2307.09047); [ACM](https://dl.acm.org/doi/10.1145/3677389.3702540)
- **K7 ✓** "Extracting Definienda in Mathematical Scholarly Articles with Transformers" (2023): finds the term being defined inside definitions. — [arXiv 2311.12448](https://arxiv.org/pdf/2311.12448)
- **K8 ✓** Mayeux (June 2026, revised August 2026): proposes a relational "bridge database" that aligns zbMATH Open / MathSciNet metadata with Lean mathlib artifacts. Adds a paper-level "formalization score" and a "correctness profile" (certified, corrected, uncorrected, open, untested). Feasibility study only. — [arXiv 2606.11430](https://arxiv.org/abs/2606.11430)
- **K9 ✓** TheoremGraph (2026): recovers 18.3 million dependencies from arXiv and Lean community sources. Links informal and formal statements in a shared embedding space and reports 47,952 "LLM-affirmed" (informal, formal) matches. — [arXiv 2606.25363](https://arxiv.org/pdf/2606.25363) (search snippet only; paper not opened)
- **K10 ◇** OEIS editors review every submission against a style sheet. Entries carry keywords with written definitions (nice, easy, hard, more, base, less, and others). — [OEIS style sheet](https://oeis.org/wiki/Style_Sheet); [keyword definitions](https://oeis.org/eishelp2.html)
- **K11 ◇** Grcar, "Errors and Corrections in Mathematics Literature", Notices of the AMS 60(4), 2013: maths journals publish corrections at a lower rate than other sciences. — [AMS Notices](https://www.ams.org/notices/201304/rnoti-p418.pdf) (URL from memory)
- **K12 ◇** scite (Nicholson et al., Quantitative Science Studies, 2021): a classifier labels citation statements as supporting, contrasting, or mentioning, at corpus scale. — [QSS](https://doi.org/10.1162/qss_a_00146) (DOI from memory)

### Inferences

#### Usages

**A1. MSC 2020 classification and reviewer routing** (knowledge management)
- **Practice:** Editors at zbMATH Open and MathSciNet assign primary and secondary MSC codes. Codes drive reviewer assignment (K1, K2).
- **Pain:** High volume, scarce editor time, and humans only agree at F1 81% (K1).
- **Jev fit:** Triage / router, plus the new role "taxonomy descent" (section 9). `state` = title, abstract, reference titles. Choice: "Which MSC2020 top-level class is the primary subject?" over the 63 classes with their official descriptions. Then a second Choice inside the chosen class, then a third. Secondary codes: one Noul per shortlisted class ("Does this paper also belong substantially to 35, Partial differential equations?"). Auto-accept above a confidence threshold; send the rest to an editor. Reviewer routing: Noul "Does this reviewer's stated expertise cover this paper?" over candidates that code shortlists by MSC overlap.
- **Cheap + fast:** 150,000 items a year ◇ × 1,500 tokens ≈ 225 Mtok ≈ $9 a year for the coarse pass. Re-coding a back catalogue of 4.5 million items ◇ after an MSC revision ≈ 6,750 Mtok ≈ $270.
- **Evidence:** K1 shows confidence-gated automation already works with a supervised model. I found no zero-shot LLM study on MSC.
- **Fit: Strong** at the two-digit level. **Medium** at the five-digit level: 6,006 classes do not fit one option set, so it needs descent plus retrieval. Risk: formula-heavy abstracts; per-class calibration is untested.

**A2. Math-aware answer re-ranking** (maths information retrieval)
- **Practice:** Retrieve-then-rerank pipelines, tested at NTCIR Math ◇ and ARQMath (K3).
- **Pain:** Strong rerankers are slow, so systems rerank only a short candidate list.
- **Jev fit:** Select, do not generate. `state` = question plus one candidate answer. Score: "How well does this answer address the question?" with levels Not / Low / Medium / High, which mirror ARQMath's grades (K3b). Rank by expected level.
- **Cheap + fast:** Rerank the top 1,000, not the top 50: 1,000 × 800 tokens = 0.8 Mtok ≈ $0.03 per query.
- **Evidence:** K3. ARQMath teams used fine-tuned cross-encoders ◇ (not re-checked).
- **Fit: Medium.** Risk: notation-heavy answers. Judging whether an answer is mathematically *correct* is multi-hop; keep the question to topical relevance.

**A3. Duplicate-question detection on Math StackExchange and MathOverflow**
- **Practice:** Community moderators close duplicates by vote. MIRB has benchmark sets for both sites (K4).
- **Pain:** Moderator load. The same problem appears with different wording and different symbols.
- **Jev fit:** Entity / record alignment. Embeddings shortlist old questions. `state` = new question plus one old question. Noul: "Would a full answer to question B also fully answer question A?"
- **Cheap + fast:** At 10-100 ms the site can show "possible duplicate" while the person is still typing.
- **Evidence:** K4 for the task; CQADupStack ◇ for the general method.
- **Fit: Medium.** Risk: the same meaning under renamed variables; LaTeX fluency unverified.

**A4. Symbol disambiguation and definition linking**
- **Practice:** Symlink-style extraction (K5). Needed for maths-aware search, screen readers, and formula semantics.
- **Pain:** The same symbol means different things across papers and even across sections.
- **Jev fit:** Select, do not generate. Code extracts each symbol and candidate description spans from nearby sentences. Choice: "Which span states what \kappa denotes here?" with the spans plus "none of these". Or a sense Choice: "\Gamma here denotes: gamma function / Christoffel symbol / a curve / a group / other."
- **Cheap + fast:** One question per symbol, all in parallel over one paragraph. A whole-arXiv pass becomes a small batch job.
- **Evidence:** K5: the winning systems were span-pair classifiers, which is the same shape of task.
- **Fit: Medium to Strong.** Risk: definitions that sit many pages earlier need code to fetch them; LaTeX fluency.

**A5. Definition / theorem / proof block typing** (structure recovery)
- **Practice:** K6 and K7. LaTeX theorem environments vary by author; PDFs lose them entirely.
- **Pain:** No structured corpus of mathematical results exists at scale.
- **Jev fit:** Feature extractor. Choice per paragraph: definition / theorem-like statement / proof / example / remark / other. Noul: "Does this paragraph begin a proof?" Code smooths the per-paragraph probabilities over the sequence, as K6 does with its sliding window.
- **Cheap + fast:** 1 million papers × 10,000 tokens = 10,000 Mtok ≈ $400.
- **Evidence:** K6, K7.
- **Fit: Strong.** Risk: text-only input loses the font and layout cues that K6 uses.

**A6. Linking papers to formal-library entries**
- **Practice:** K8 and K9. The goal is to know which published results are formalised in mathlib or similar.
- **Pain:** Candidate pairs number in the millions. K9 had to "LLM-affirm" each one.
- **Jev fit:** Entity alignment. Embeddings shortlist. `state` = informal statement plus the docstring and pretty-printed formal statement. Noul: "Do these two statements assert the same result?"
- **Cheap + fast:** Affirming 10 million pairs at 500 tokens ≈ 5,000 Mtok ≈ $200.
- **Evidence:** K9 shows the embed-then-affirm pattern in use.
- **Fit: Medium.** Risk: two statements that differ only in one hypothesis; Lean syntax fluency unverified. Alignment only. Proving belongs to another researcher.

**A7. OEIS submission triage and keyword tagging**
- **Practice:** K10.
- **Pain:** A small volunteer editor pool reviews every edit.
- **Jev fit:** Clause-by-clause check on the prose fields (NAME, COMMENTS, FORMULA text). Noul per style rule: "Is the name understandable without reading the comments?" Noul per keyword: "Does the definition depend on base-10 digits?" (keyword `base`).
- **Cheap + fast:** Instant pre-check for the submitter before an editor sees it.
- **Evidence:** None found.
- **Fit: Speculative.** Risk: the numeric terms themselves are off-limits for Jev; prose fields only.

**A8. Correction signals in citation contexts**
- **Practice:** Maths has few formal errata (K11). Errors often surface only in later prose, such as "the proof of Lemma 3 in [7] has a gap". scite classifies citation function at scale (K12).
- **Pain:** Nobody reads every citing sentence.
- **Jev fit:** Screening at scale. `state` = the citing sentence plus context. Choice: uses the result / extends it / reports an error or gap / says a gap was filled / background mention. Output feeds review notes and K8's corrected/uncorrected profile.
- **Cheap + fast:** Every citing sentence in the maths literature is a one-off batch.
- **Evidence:** K12 for the method. I found no maths-specific study.
- **Fit: Medium.** Risk: the target class is rare, so precision matters; a person confirms each hit.

### Gaps
- No zero-shot LLM study of MSC classification found. AutoMSC is supervised.
- No published reviewer-matching method for zbMATH or MathSciNet found.
- No NLP work on OEIS curation found.
- ARQMath ended in 2022. I found no later shared task with LLM-era baselines; MIRB partly fills this.
- NTCIR Math task overviews were not re-checked this session.
- No test of any small classifier model on formula-dense text with calibrated outputs was found.

## 2. Peer review and error detection in mathematics

### Takeaway
Jev can check literal, single-hop properties of a manuscript (is this symbol defined, is this hypothesis mentioned, is the tolerance reported). It cannot judge whether a proof is valid, and current evidence says even frontier LLMs grade proofs too generously.

### Cited Findings
- **P1 ✓** "Proof or Bluff? Evaluating LLMs on 2025 USA Math Olympiad" (Petrov, Dekoninck, Baltadzhiev, Drencheva, Minchev, Balunović, Jovanović, Vechev; 2025). With human expert grading, only Gemini-2.5-Pro reached 25%; the others scored below 5%. Answer-only benchmarks overstate proof ability. — [arXiv 2503.21934](https://arxiv.org/abs/2503.21934)
- **P2 ✓ (snippet only)** A search summary reports that LLM proof graders "consistently overestimate solution quality… inflating scores by a factor of up to 20". I believe this comes from P1's grader experiment. The abstract does not confirm it. — [arXiv 2503.21934](https://arxiv.org/pdf/2503.21934)
- **P3 ✓** RefGrader (2025): agentic workflows derive a problem-specific rubric from reference solutions, then grade competition proofs. — [arXiv 2510.09021](https://arxiv.org/pdf/2510.09021)
- **P4 ◇** ACM TOMS Replicated Computational Results initiative (Heroux, 2015): an independent reviewer replicates a paper's computational results. — [ACM TOMS 41(3)](https://doi.org/10.1145/2743015) (DOI from memory)
- **P5** Symbol-to-description linking works as supervised classification (K5 above).

### Inferences

#### Usages

**B1. Undefined-symbol and undefined-term check** (manuscript lint)
- **Practice:** Referees check that notation is defined before use. No formal standard exists; the closest benchmark is Symlink (K5).
- **Pain:** Tedious for referees; authors miss it after many edits.
- **Jev fit:** Verifier. Code lists each symbol and its first use from the LaTeX source, and skips a whitelist of standard symbols. `state` = the text before and including the first use. Noul per symbol: "Is the symbol X given a meaning in this text at or before its first use?" Output = ranked list of likely-undefined symbols.
- **Cheap + fast:** Runs as an editor lint on every save. All symbols run in parallel.
- **Evidence:** K5 for feasibility. No deployed lint found.
- **Fit: Medium.** Risk: long-range definitions, LaTeX macros, notation fluency.

**B2. Cited-theorem hypotheses-stated check**
- **Practice:** A proof step that invokes a theorem should show that its hypotheses hold. Referees check this by hand.
- **Pain:** Slow. A missed hypothesis is a common source of errors.
- **Jev fit:** Verifier, single hop only. A one-time step (person or LLM) splits the cited theorem into a hypothesis list. `state` = the local passage. Noul per hypothesis: "Does the passage state or cite that f is continuous on the closed interval?" The flag is "never mentioned". Jev does **not** judge whether the hypothesis is true.
- **Cheap + fast:** Every theorem invocation in a paper can be checked, not a sample.
- **Evidence:** None direct. P1 and P2 argue for keeping the question literal.
- **Fit: Speculative to Medium.** Risk: the hypothesis follows from an earlier lemma (multi-hop), which creates false alarms. Treat output as hints.

**B3. Computational-reproducibility checklist for numerical papers**
- **Practice:** TOMS RCR (P4) and journal reproducibility badges.
- **Pain:** Replication reviewers are scarce. Missing details block replication.
- **Jev fit:** Clause-by-clause compliance check. Nouls: "Does the paper state the stopping tolerance of the iterative solver?", "Is code availability stated?", "Are library versions and hardware given?", "Is the number of random runs or the seed reported?"
- **Cheap + fast:** Runs at submission; the author fixes gaps before review starts.
- **Evidence:** By analogy, the reporting-guideline results in section 3 (S7, S9). No maths-specific study found.
- **Fit: Medium to Strong.** Risk: low. "Present" is easier than "adequate".

### Gaps
- No evaluation found of any model that detects gaps in research-level proofs with calibrated outputs.
- No maths-specific retraction or erratum NLP study found. K11 is a bibliometric study, not an NLP one.
- P2's "20×" figure needs confirmation from the paper body.

## 3. Statistics practice

### Takeaway
This is the richest subfield. Screening, reporting-guideline checks, spin detection, and test selection already have LLM studies with numbers. They are all closed-set judgments, and reviewers now ask for calibrated, priced error rates, which is what Jev outputs.

### Cited Findings
- **S1 ◇** ASReview (van de Schoot et al., Nature Machine Intelligence, 2021): open-source active learning for title/abstract screening. — [Nature MI](https://www.nature.com/articles/s42256-020-00287-7)
- **S2 ◇** O'Mara-Eves et al. (Systematic Reviews, 2015): text mining may cut screening workload by 30-70%, sometimes with about 5% loss of relevant studies. — [Systematic Reviews 4:5](https://systematicreviewsjournal.biomedcentral.com/articles/10.1186/2046-4053-4-5)
- **S3 ✓** "Compact large language models for title and abstract screening" (Research Synthesis Methods): high sensitivity (up to 100%) and low precision (below 10%) against full-text inclusion, with large workload cuts at reasonable cost and time. — [Cambridge Core](https://www.cambridge.org/core/journals/research-synthesis-methods/article/compact-large-language-models-for-title-and-abstract-screening-in-systematic-reviews-an-assessment-of-feasibility-accuracy-and-workload-reduction/CB00FD70434780029EF6C027055331BA)
- **S4 ✓** LLM4SCREENLIT (2025): of 29 papers on LLM screening, 10% reported MCC and 24% gave full confusion matrices. None of the five papers that claimed workload savings put a price on false negatives. — [arXiv 2511.12635](https://arxiv.org/html/2511.12635v2)
- **S5 ✓** Thoracic-surgery study: title/abstract screening by LLM reached sensitivity 0.73, specificity 0.99, AUC 0.97. — [PubMed 40068152](https://pubmed.ncbi.nlm.nih.gov/40068152/)
- **S6 ✓** Two-tier screening (J. Healthcare Informatics Research, 2026): a low-cost LLM screens first; a strong LLM re-judges the low-confidence cases. Tested on 10 reviews. — [Springer](https://link.springer.com/article/10.1007/s41666-026-00246-8)
- **S7 ✓** AutoReporter (JAMIA 2026; medRxiv 2025): zero-shot o3-mini reached accuracy 90.09% on CONSORT and 92.07% on SPIRIT; Cohen's κ 0.70 and 0.77 against humans. — [medRxiv](https://www.medrxiv.org/content/10.1101/2025.04.18.25326076v2); [JAMIA](https://academic.oup.com/jamia/article-abstract/33/3/724/8403434)
- **S8 ✓** An LLM audit of 21,041 open-access RCTs (1966-2024): CONSORT compliance rose from 27% before 1990 to 57% after 2010, and ranged 35-63% by discipline. — [PMC12395317](https://pmc.ncbi.nlm.nih.gov/articles/PMC12395317/)
- **S9 ✓** PRISMA 2020 adherence checking (Kataoka et al., 2025): giving the model a structured checklist yields 78.7-79.7% accuracy; manuscript-only input yields 45.21%. Ten LLMs ranged 70.6-82.8%. Qwen3-Max on the full set: sensitivity 95.1%, specificity 49.3%. The authors say human verification remains essential. — [arXiv 2511.16707](https://arxiv.org/abs/2511.16707)
- **S10 ✓** A cross-sectional study reports mean CONSORT compliance rates of 81% (ChatGPT-4o), 68% (Claude Sonnet 4), and 55% (Gemini 2.5 Pro). I did not check whether these are assigned rates or accuracies. CONSORT was updated in 2025. — [medRxiv 2025.10.03.25337291](https://www.medrxiv.org/content/10.1101/2025.10.03.25337291v1.full.pdf)
- **S11 ✓** statcheck (Nuijten et al., Behavior Research Methods, 2016): over 250,000 p-values from eight psychology journals, 1985-2013. Half of NHST papers had at least one inconsistent p-value. One in eight had a gross inconsistency. Gross inconsistencies were more common in results reported as significant. — [Springer](https://link.springer.com/article/10.3758/s13428-015-0664-2)
- **S12 ✓** Nuijten and Wicherts (AMPPS, 2024): journals that ran statcheck during peer review saw a steep decline in inconsistencies. — [SAGE](https://journals.sagepub.com/doi/10.1177/25152459241258945)
- **S13 ✓** Spin. An LLM method detects spin in psychiatric abstracts. GPT models detect spin in oncology RCTs by comparing the conclusion with the full abstract; errors cluster where the primary endpoint result is missing, subgroup gains are stressed, or primary and secondary endpoints blur. — [PMC11822530](https://pmc.ncbi.nlm.nih.gov/articles/PMC11822530/); [JMIR Cancer](https://doi.org/10.2196/78221)
- **S14 ✓ / ◇** "Caught in the Web of Words: Do LLMs Fall for Spin in Medical Literature?" (2025). Title verified. From memory: LLMs were more swayed by spin than human readers. — [arXiv 2502.07963](https://arxiv.org/pdf/2502.07963)
- **S15 ◇** Boutron et al. (JAMA, 2010) defined spin strategies in RCTs with non-significant primary outcomes. — [JAMA](https://doi.org/10.1001/jama.2010.651)
- **S16 ✓** Test selection. Pilot with 27 vignettes: concordance with the expert key was 85.19% (ChatGPT 3.5), 77.78% (Bard), 96.3% (Bing Chat), 85.19% (Perplexity); "acceptable" answers 96.3-100%. A later study compares six LLMs on 20 scenarios. — [PMC11584160](https://pmc.ncbi.nlm.nih.gov/articles/PMC11584160/); [PMC12627256](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12627256/)
- **S17 ◇** Textbook decision tables map design features to a test, for example UCLA's "Choosing the Correct Statistical Test". — [UCLA OARC](https://stats.oarc.ucla.edu/other/mult-pkg/whatstat/)
- **S18 ◇** Language and assumption studies: Hoekstra, Kiers, Johnson 2012 (assumptions are rarely checked) — [Frontiers](https://doi.org/10.3389/fpsyg.2012.00137). Greenland et al. 2016 (25 misreadings of p-values, CIs, power) — [Eur J Epidemiol](https://doi.org/10.1007/s10654-016-0149-3). ASA statement, Wasserstein and Lazar 2016 — [TAS](https://doi.org/10.1080/00031305.2016.1154108). Yu, Li, Wang 2019, "Detecting Causal Language Use in Science Findings" (EMNLP) — [ACL Anthology](https://aclanthology.org/D19-1473/) (ID from memory). Haber et al. 2022, causal language in observational health research — [AJE](https://doi.org/10.1093/aje/kwac137) (DOI from memory).
- **S19 ◇** COMPare (Goldacre et al., Trials, 2019): checked 67 trials in five top journals against their registries and found widespread outcome switching. — [Trials 20:118](https://doi.org/10.1186/s13063-019-3173-2) (trial count from memory)
- **S20 ◇** RobotReviewer (Marshall, Kuiper, Wallace; JAMIA 2016): ML predicts Cochrane risk-of-bias judgments and extracts supporting sentences. — [JAMIA](https://doi.org/10.1093/jamia/ocv044)
- **S21 ◇** Official statistics coding. Gweon et al. 2017, "Three Methods for Occupation Coding Based on Statistical Learning" — [J. Official Statistics](https://doi.org/10.1515/jos-2017-0006). Measure 2014, BLS autocoder for worker injury narratives — [BLS](https://www.bls.gov/osmr/research-papers/2014/pdf/st140040.pdf) (URL from memory). UNECE HLG-MOS "Machine Learning for Official Statistics", 2021 — [UNECE](https://unece.org/statistics/publications/machine-learning-official-statistics) (URL from memory).
- **S22 ◇** Reporting guidelines: CONSORT 2025, PRISMA 2020, STROBE, ARRIVE 2.0, TRIPOD+AI; Gamble et al. 2017 on SAP content. — [EQUATOR Network](https://www.equator-network.org/); [JAMA SAP guideline](https://doi.org/10.1001/jama.2017.18556)

### Inferences

#### Usages

**C1. Systematic-review title and abstract screening**
- **Practice:** Two humans screen thousands of records. ASReview and Abstrackr ◇ add active learning (S1, S2).
- **Pain:** Volume. Savings claims rarely price missed studies (S4).
- **Jev fit:** Screening at scale plus feature extractor. One Noul per eligibility criterion: "Is this a randomised trial?", "Are participants adults with type 2 diabetes?". Code combines the criteria. The calibrated probabilities become features or priors for the active learner, and they set an explicit recall target. The uncertain band goes to a person or a strong LLM, as in S6.
- **Cheap + fast:** 10,000 records × 8 criteria × 600 tokens ≈ 48 Mtok ≈ $1.92, even if each criterion re-bills the abstract. Re-screening after a criteria change is free in practice. Living reviews can re-run daily.
- **Evidence:** S3, S5, S6. S4 shows the field lacks exactly what calibrated outputs provide.
- **Fit: Strong.** Risk: criteria with numeric thresholds ("age ≥ 65", "follow-up ≥ 12 months") need code or a person. Recall must be validated per review.

**C2. Reporting-guideline clause check** (CONSORT, PRISMA, STROBE, ARRIVE, TRIPOD+AI, SAP content)
- **Practice:** Journals require checklists (S22). Editors rarely verify them.
- **Pain:** Only 57% compliance even after 2010 (S8). Manual audits do not scale.
- **Jev fit:** Clause-by-clause compliance check. `state` = the relevant manuscript section. One Noul per item, with the item text and its explanation as `criteria`: "Does the text describe how the random allocation sequence was generated?" S9 shows that giving the model the structured checklist is what makes accuracy jump.
- **Cheap + fast:** 30 items × 8,000 tokens ≈ 0.24 Mtok ≈ $0.01 per manuscript. Every submission to a publisher can be checked, and S8-style audits of 21,000 papers cost a few hundred dollars.
- **Evidence:** S7, S8, S9, S10.
- **Fit: Strong.** Risk: long manuscripts dilute accuracy, so code should route each item to its section. Authors can write to please the checker (adversarial). S9's 49% specificity warns that "reported" is over-called.

**C3. Semantic layer on statcheck**
- **Practice:** statcheck recomputes p from the test statistic and degrees of freedom (S11, S12).
- **Pain:** The code cannot read context: one-tailed tests, corrections for multiple testing, or whether the prose claim matches the number. These cause false flags ◇.
- **Jev fit:** New role "interpreter of exact-check failures" (section 9). Code extracts and recomputes. `state` = the sentence and paragraph around a flagged result. Nouls: "Does the text say this test is one-tailed?", "Does the text say a multiple-comparison correction was applied?" Choice: "How do the authors describe this result in words: significant / marginal or trend / not significant / no claim."
- **Cheap + fast:** A corpus of 250,000 results (S11) × 500 tokens ≈ 125 Mtok ≈ $5.
- **Evidence:** S11, S12. I found no paper that pairs statcheck with a language model.
- **Fit: Strong.** Numerics stay in code. Risk: low.

**C4. Spin and outcome-switching detection**
- **Practice:** Boutron's spin taxonomy (S15). COMPare compared registry entries with papers by hand (S19).
- **Pain:** Expert readers only; spin is common.
- **Jev fit:** Verifier plus entity alignment. Spin: Noul per strategy, "Does the conclusion stress a secondary or subgroup result while the primary outcome was not significant?" Code supplies the primary-outcome p-value as a named fact. Switching: Choice "Which registered outcome, if any, matches this reported primary outcome?" with the registry outcomes plus "none".
- **Cheap + fast:** Every new RCT abstract can be scored. Journals can run it at submission.
- **Evidence:** S13. S14 warns that language models can themselves be swayed by spin.
- **Fit: Medium to Strong.** Risk: needs two-document alignment; timepoint and threshold differences are numeric; the abstract is written to persuade, which is a mild adversarial input.

**C5. Statistical-language and assumption-reporting checks**
- **Practice:** ASA statement and Greenland's 25 misreadings; causal-language audits; assumption-check surveys (S18).
- **Pain:** Statistical reviewers are scarce in most journals.
- **Jev fit:** Semantic predicate in a rule engine. Nouls: "Does this sentence treat a non-significant result as proof of no effect?", "Does this sentence make a causal claim?" (code supplies design = observational), "Does the methods text say the normality assumption was checked?", "Is the result called 'marginally significant' or 'a trend'?"
- **Cheap + fast:** Sentence-level checks over a full paper cost well under one cent. Can run inside a writing tool as the author types.
- **Evidence:** S18: Yu et al. trained sentence classifiers for causal language; Haber et al. did the audit by hand.
- **Fit: Strong.** Risk: double negatives around "fail to reject" are a known Jev weak spot. Test before trusting.

**C6. Choosing the test or model family from a study description**
- **Practice:** Textbook decision tables (S17).
- **Pain:** Non-statisticians pick wrong tests. Consulting statisticians are scarce.
- **Jev fit:** Triage / router that walks the decision table. Parallel Choices: outcome type (continuous / binary / count / ordinal / time-to-event); number of groups (one / two / more); pairing (independent / paired or repeated / clustered). Code maps the answers to a test family and shows the uncertain branches to a person.
- **Cheap + fast:** Instant advice inside analysis software. Audit of "test used versus design described" across a journal's archive.
- **Evidence:** S16: chat LLMs agree with experts on 78-96% of vignettes.
- **Fit: Medium to Strong.** Risk: sample-size and distribution conditions are numeric and must come from code. Textbook vignettes are easier than real protocols.

**C7. Risk-of-bias domain judgments**
- **Practice:** Cochrane RoB tool; RobotReviewer (S20).
- **Pain:** Two reviewers per trial; agreement between reviewers is modest ◇.
- **Jev fit:** Score per domain: "Risk of bias from the randomisation process: low / some concerns / high", with the tool's signalling questions as separate Nouls.
- **Cheap + fast:** Pre-fills the form for every included trial. The human confirms.
- **Evidence:** S20.
- **Fit: Medium.** Risk: "not reported" versus "done badly" needs care; the full text is long.

**C8. Coding open text to official classifications** (occupation, industry, product, injury)
- **Practice:** Statistical offices code survey answers to SOC, ISCO, NAICS, COICOP. ML autocoders are in production (S21).
- **Pain:** Millions of responses; human coders disagree; rules are brittle.
- **Jev fit:** Taxonomy descent plus select, do not generate. Code or embeddings shortlist 10-20 codes. Choice over the shortlist with official descriptions, plus "none of these". Low confidence goes to a human coder.
- **Cheap + fast:** 1 million responses × 800 tokens ≈ 800 Mtok ≈ $32. A revised classification can be re-applied to old data.
- **Evidence:** S21.
- **Fit: Strong.** Risk: label sets with hundreds of codes need the shortlist step; non-English answers.

### Gaps
- No paper found that pairs statcheck with a language model for context reading.
- No LLM benchmark found for test selection on real protocols; S16 uses 20-27 short vignettes.
- ASReview and Abstrackr details were not re-checked this session.
- I did not find LLM studies on STROBE or ARRIVE specifically.
- No study found on automatic detection of p-hacking or other questionable research practices from text alone. The numeric side (p-curve and similar) belongs to code.

## 4. Data science plumbing

### Takeaway
The database community already runs LLMs as yes/no matchers, type pickers, and semantic filters, and its main complaint is cost. A cheap calibrated classifier drops straight into these systems as the matcher, the reranker, or the low-cost proxy in a cascade.

### Cited Findings
- **D1 ✓** Column type annotation baselines. Sherlock was trained on over 675,000 columns for 78 semantic types. Sato adds column dependencies with a CRF. Doduo feeds the whole table to BERT and used over 397,000 tables for training. — [ArcheType paper](https://arxiv.org/html/2310.18208); [Doduo, arXiv 2104.01785](https://arxiv.org/pdf/2104.01785)
- **D2 ✓** ArcheType (VLDB 2024): zero-shot LLM column typing. New state of the art on zero-shot benchmarks. Beats Doduo on fine-tuned SOTAB when combined with classical techniques. — [PVLDB](https://www.vldb.org/pvldb/vol17/p2279-freire.pdf)
- **D3 ✓** Korini and Bizer (2023): column type annotation with ChatGPT. — [arXiv 2306.00745](https://arxiv.org/pdf/2306.00745v2)
- **D4 ✓** Peeters and Bizer, "Entity Matching using Large Language Models": on unseen data LLMs score at least 8% F1 above the best transferred fine-tuned model; GPT-4 beats the best transferred PLM by 40-68%. Zero-shot ChatGPT matches or beats RoBERTa fine-tuned on 2,000 pairs. — [arXiv 2310.11244](https://arxiv.org/html/2310.11244v4); [arXiv 2305.03423](https://ar5iv.labs.arxiv.org/html/2305.03423)
- **D5 ✓** AnyMatch (2024) notes that API cost forced the MatchGPT study to cut test sets to at most 1,250 pairs. It proposes a small model for zero-shot matching. — [arXiv 2409.04073](https://arxiv.org/html/2409.04073v1)
- **D6 ✓** Related titles (not opened): "Confidence Calibration in Large Language Model-Based Entity Matching" — [arXiv 2509.19557](https://arxiv.org/pdf/2509.19557); "Match, Compare, or Select?" — [arXiv 2405.16884](https://arxiv.org/html/2405.16884v3.pdf); "CaRL-EM: Cost-Aware Reinforcement Learning for Entity Matching with LLMs" — [arXiv 2609.01195](https://arxiv.org/html/2609.01195)
- **D7 ◇** Ditto (Li et al., VLDB 2020) — [arXiv 2004.00584](https://arxiv.org/abs/2004.00584). Magellan (Konda et al., VLDB 2016) — [PVLDB](http://www.vldb.org/pvldb/vol9/p1197-pkonda.pdf) (URL from memory).
- **D8 ✓** Schema matching. Parciak et al. (2024) test off-the-shelf LLMs using only names and descriptions. Magneto (VLDB 2025): a small model retrieves candidate matches and an LLM reranks them; LLM-only approaches underperform on large target schemas and cost too much. — [arXiv 2407.11852](https://arxiv.org/html/2407.11852v1); [arXiv 2412.08194](https://arxiv.org/abs/2412.08194)
- **D9 ✓** Narayan, Chami, Orr, Ré (VLDB 2023): GPT-3 on entity matching and error detection (both as Yes/No) and imputation. With 10 demonstrations it matches or beats the state of the art on 7 of 10 benchmarks. — [arXiv 2205.09911](https://arxiv.org/pdf/2205.09911)
- **D10 ✓** Semantic operators. LOTUS optimises semantic filter, join, group-by, and top-k by moving work from an expensive "gold" algorithm to a cheaper proxy while giving statistical accuracy guarantees. DocETL uses LLM-driven rewrites and optimises quality only. Abacus is a cost-based optimiser. SemBench benchmarks these engines. — [LOTUS, arXiv 2407.11418](https://arxiv.org/pdf/2407.11418); [PVLDB 18](https://www.vldb.org/pvldb/vol18/p4171-patel.pdf); [Abacus](https://arxiv.org/html/2505.14661v1); [SemBench](https://arxiv.org/pdf/2511.01716)
- **D11 ✓** Smith et al., "Language Models in the Loop": prompted LMs act as labeling functions; Snorkel denoises them. On the WRENCH benchmark this cuts errors by 19.5% on average against zero-shot use, and matches or beats hand-written rules. — [arXiv 2205.02318](https://arxiv.org/abs/2205.02318); [ACM/IMS JDS](https://dl.acm.org/doi/10.1145/3617130)
- **D12 ◇** Snorkel (Ratner et al., VLDB 2017). — [arXiv 1711.10160](https://arxiv.org/abs/1711.10160)
- **D13 ✓** Text to features. A two-phase LLM framework for clinical notes reaches F1 0.968-0.983; its Brier score improved from 0.087 to 0.036 while expected calibration error rose from 0.060 to 0.147. TEDEM-LLM extracts tabular features with an LLM, then uses decision trees and logistic regression for interpretable predictions. — [JMIR Med Inform 2025](https://medinform.jmir.org/2025/1/e78432); [arXiv 2306.05052](https://arxiv.org/pdf/2306.05052)

### Inferences

#### Usages

**D1. Column type annotation**
- **Practice:** Sherlock, Sato, Doduo, ArcheType (D1-D3). Used in data catalogues, PII discovery, and AutoML.
- **Pain:** Supervised models need hundreds of thousands of labelled columns and a fixed type list. LLM calls per column are costly at data-lake scale.
- **Jev fit:** Triage / router. `state` = column header, 10 sampled values, neighbour headers. Choice: "What does this column hold?" over the organisation's own type list. Noul: "Does this column hold personal data?"
- **Cheap + fast:** 10 million columns × 300 tokens ≈ 3,000 Mtok ≈ $120. A custom type list needs no training.
- **Evidence:** D2, D3.
- **Fit: Strong.** Risk: purely numeric columns carry little text signal; code should add summary statistics as named buckets.

**D2. Entity resolution matcher**
- **Practice:** Blocking then pairwise matching (Magellan, Ditto; D7). LLM matchers generalise better to unseen data (D4).
- **Pain:** Cost. D5 reports test sets cut to 1,250 pairs to afford API calls.
- **Jev fit:** Entity / record alignment. Noul: "Do these two records describe the same real-world product?" The calibrated probability feeds transitive-closure clustering and sets the clerical-review band. Design note: put record A in `state` and ask one question per candidate B, so one request covers a whole block.
- **Cheap + fast:** 10 million candidate pairs × 300 tokens ≈ $120. Looser blocking raises recall because more pairs are affordable.
- **Evidence:** D4, D5, D6, D9.
- **Fit: Strong.** Risk: records that differ only in numbers (model numbers, sizes, versions) hit Jev's numeric weakness; code should compare those fields and pass the result in.

**D3. Schema matching reranker**
- **Practice:** Retrieve then rerank (Magneto, D8).
- **Pain:** LLM-only matching fails on large schemas and costs too much (D8).
- **Jev fit:** Select, do not generate. Choice: "Which target attribute matches source attribute `pt_dob`?" over the top-k candidates with descriptions and sample values, plus "none".
- **Cheap + fast:** Jev replaces the LLM reranker stage; whole-warehouse matching becomes routine.
- **Evidence:** D8.
- **Fit: Strong.** Risk: cryptic abbreviations with no description.

**D4. Error detection and cleaning decisions**
- **Practice:** Rule-based and ML cleaners; GPT-3 as Yes/No error detector (D9).
- **Pain:** Rules are brittle. Semantic errors (city does not match country) escape constraints.
- **Jev fit:** Semantic predicate in a rule engine. Noul per cell or row: "Is this value implausible given the rest of the row?" Choice among code-generated repair candidates (select, do not generate).
- **Cheap + fast:** Row-level checks on tables with 100 million rows become thinkable (≈ $400 at 100 tokens a row).
- **Evidence:** D9.
- **Fit: Medium.** Risk: numeric outliers and date logic belong to code; Jev cannot impute free values.

**D5. Backend for semantic operators** (filter, join, top-k, classify)
- **Practice:** LOTUS, Palimpzest, DocETL (D10).
- **Pain:** Token cost dominates. Optimisers exist mainly to avoid LLM calls.
- **Jev fit:** New role "cascade proxy" (section 9). Jev is the cheap proxy in a LOTUS-style cascade, or the only model for filter, classify, and pairwise-compare operators. Its calibrated probability is what the cascade threshold needs. `sem_filter` = Noul; `sem_classify` = Choice; `sem_topk` = Score or pairwise Noul; `sem_join` = Noul over blocked pairs.
- **Cheap + fast:** Interactive semantic SQL over a million rows. Map and aggregate operators that need generated text still go to an LLM.
- **Evidence:** D10 (cheap proxies with guarantees already work).
- **Fit: Strong.** Risk: operators that must generate text are out of scope.

**D6. Labeling functions for weak supervision**
- **Practice:** Snorkel (D12); prompted LMs as labeling functions (D11).
- **Pain:** Writing heuristic labeling functions is slow; LLM labeling of millions of rows is costly.
- **Jev fit:** Feature extractor. Each Noul is one labeling function. The probability gives a soft vote, and a low-confidence band means "abstain". The label model combines many Nouls, then a small end model is trained.
- **Cheap + fast:** 20 labeling functions × 1 million examples × 300 tokens ≈ 6,000 Mtok ≈ $240.
- **Evidence:** D11: 19.5% average error reduction on WRENCH.
- **Fit: Strong.** Risk: Nouls from one model have correlated errors, which breaks the label model's independence assumption.

**D7. Text to calibrated features for tabular models**
- **Practice:** Free-text fields (notes, complaints, descriptions) are dropped or turned into bag-of-words.
- **Pain:** Embeddings are opaque. LLM extraction is costly and poorly calibrated (D13: ECE got worse).
- **Jev fit:** Feature extractor. Ten to fifty named Nouls or Scores per record ("mentions a prior claim", "severity: none / minor / major") become columns for gradient boosting or logistic regression. Features stay interpretable.
- **Cheap + fast:** Features can be recomputed when definitions change. Real-time scoring fits in 100 ms.
- **Evidence:** D13.
- **Fit: Strong.** Risk: leakage if feature definitions are tuned on test data; drift if Jev's weights change.

### Gaps
- No benchmark found that reports calibration for column typing or schema matching.
- I did not open the D6 papers, so their results are not reported here.
- No study found of correlated errors when many labeling functions come from one model.

## 5. Operations research and optimisation

### Takeaway
Formulating a model is text generation and is not Jev's job. Jev fits around it: recognise the problem class, check that each stated requirement has a matching constraint, pick a solver or heuristic, and sort the constraints in an infeasible subset.

### Cited Findings
- **O1 ✓** NL4Opt (NeurIPS 2022 competition): subtask 1 tags the semantic parts of a problem description (entity recognition); subtask 2 generates a logical form for an LP. — [Semantic Scholar](https://www.semanticscholar.org/paper/NL4Opt-Competition:-Formulating-Optimization-Based-Ramamonjison-Yu/c9a9735216915e9afa0fc97b02b57148a0491bdd); [arXiv 2303.08233](https://arxiv.org/abs/2303.08233) (ID from memory ◇)
- **O2 ✓** OptiMUS-0.3: modular LLM agents formulate and solve MILPs from natural language; over 12% better than prior methods on easy datasets and more on hard ones. — [arXiv 2402.10172](https://arxiv.org/pdf/2402.10172)
- **O3 ✓** Kerschke, Hoos, Neumann, Trautmann, "Automated Algorithm Selection: Survey and Perspectives", Evolutionary Computation 27(1):3-45, 2019. Per-instance selection has produced major gains in SAT, AI planning, and other discrete problems. — [MIT Press](https://direct.mit.edu/evco/article/27/1/3/1083/Automated-Algorithm-Selection-Survey-and)
- **O4 ◇** Rice, "The Algorithm Selection Problem", Advances in Computers 15, 1976. — [DOI](https://doi.org/10.1016/S0065-2458(08)60520-3) (from memory)
- **O5 ✓** Burke et al., "Hyper-heuristics: a survey of the state of the art", JORS 64(12):1695-1724, 2013. Two classes: heuristic selection and heuristic generation; constructive versus perturbative. — [Springer](https://link.springer.com/article/10.1057/jors.2013.71)
- **O6 ✓** OptiChat (INFORMS Journal on Data Science, 2025): GPT-4 plus a solver. The solver finds the Irreducible Infeasible Subset (IIS). The system sorts user queries into five types: diagnosing, retrieval, sensitivity, what-if, why-not. Pyomo only. Earlier paper: "Diagnosing infeasible optimization problems using LLMs" (INFOR, 2024). — [arXiv 2501.08406](https://arxiv.org/html/2501.08406v2); [INFORMS](https://pubsonline.informs.org/doi/10.1287/ijds.2025.0074); [arXiv 2308.12923](https://arxiv.org/abs/2308.12923)
- **O7 ◇** Problem taxonomies used for solver choice: the NEOS Guide optimisation taxonomy and Mittelmann's "Decision Tree for Optimization Software". — [NEOS Guide](https://neos-guide.org/guide/types/); [plato.asu.edu](https://plato.asu.edu/guide.html)
- **O8 ✓ / ◇** "Evaluating Real-World Generalizability of Algorithm Selection Models" (2026), title only — [arXiv 2606.02016](https://arxiv.org/pdf/2606.02016). From memory ◇: Wu et al., LLM-enhanced algorithm selection, IJCAI 2024 — [arXiv 2311.13184](https://arxiv.org/abs/2311.13184); Lawless et al., LLMs for cold-start cutting-plane separator configuration, 2024 — [arXiv 2412.12038](https://arxiv.org/abs/2412.12038).

### Inferences

#### Usages

**E1. Problem-class recognition and routing**
- **Practice:** Analysts place a problem in a taxonomy (O7) before they choose a modelling pattern and solver. NL4Opt subtask 1 tags the parts (O1).
- **Pain:** Scarce OR experts. Business users cannot tell a knapsack from a scheduling problem.
- **Jev fit:** Triage / router with taxonomy descent. Parallel Choices: decision variables (continuous / integer / binary / mixed); structure (assignment / network flow / routing / scheduling / packing / blending / other); uncertainty (deterministic / stochastic / robust). Code maps the answers to a template and a solver class; an LLM or a person writes the model.
- **Cheap + fast:** Instant routing in a self-service modelling tool. Mining a company's ticket backlog for optimisation opportunities.
- **Evidence:** O1, O2 (both generative; the classification sub-step is my inference).
- **Fit: Medium to Strong.** Risk: linear versus nonlinear often hides in one phrase ("cost grows with the square of…").

**E2. Formulation coverage check** (requirement to constraint)
- **Practice:** Model validation. OptiMUS-style agents self-check constraints (O2).
- **Pain:** LLM-written models silently drop or distort a requirement.
- **Jev fit:** Verifier / process-reward model, and new role "cross-document consistency audit". `state` = one natural-language requirement plus the list of generated constraints with their comments. Choice: "Which constraint, if any, enforces this requirement?" plus "none". Noul: "Does this constraint's direction (at most / at least) match the requirement?"
- **Cheap + fast:** Runs on every LLM draft inside the agent loop, so the agent can retry before a person sees it.
- **Evidence:** O2 for the need. No direct test found.
- **Fit: Medium.** Risk: algebraic fluency; coefficients are numeric and belong to code; the "at most / at least" check touches Jev's negation weakness.

**E3. Algorithm, configuration, and heuristic selection with textual context**
- **Practice:** Per-instance algorithm selection from numeric instance features (O3, O4). Selection hyper-heuristics choose a low-level heuristic at each step (O5).
- **Pain:** Numeric features are costly to compute and ignore what the modeller knows ("set covering from crew scheduling, heavy symmetry").
- **Jev fit:** Supervisory layer over numeric control, or heuristic inside a search loop. `state` = model description, constraint-family names, code-computed buckets (size: large; density: sparse; integrality gap after root: wide). Choice: "Which search emphasis suits this instance?" feasibility / optimality / bound / balanced. For hyper-heuristics: a Choice over low-level heuristics, given a textual run log (stagnation: 40 iterations; last improving move: swap).
- **Cheap + fast:** A 10 ms call is cheap next to a solver run. Inside a hyper-heuristic loop, 10 ms per step only pays when each move is expensive.
- **Evidence:** O3 for value. O8 items are from memory or title only. I found no verified study that uses text features.
- **Fit: Speculative to Medium.** Risk: numeric features carry most of the signal; Jev's probabilities work best as extra features for a classical selector.

**E4. Infeasibility triage over the IIS**
- **Practice:** Solvers compute an IIS. Analysts read it. OptiChat explains it with GPT-4 (O6).
- **Pain:** IIS output is cryptic. Planners need an answer in minutes.
- **Jev fit:** Triage / router. `state` = one IIS constraint with its name, docstring, and data source. Choice: physical or legal hard limit / business preference / likely data-entry error / unknown. Code then relaxes only the "preference" constraints. Also route the user's query with a Choice over OptiChat's five types (O6).
- **Cheap + fast:** Interactive what-if sessions; every failed nightly run is triaged automatically.
- **Evidence:** O6.
- **Fit: Medium.** Risk: needs well-named constraints; the explanation text must come from elsewhere.

### Gaps
- No verified study found that uses textual instance descriptions in algorithm selection.
- No evidence found for language-model heuristic *selection* (as opposed to heuristic *generation*, which is an active LLM topic and is not a Jev task).
- NL4Opt arXiv ID and the O8 memory items need checking.

## 6. Numerical analysis as algorithm selection

### Takeaway
Solver choice is a long-studied classification problem, but today it uses only numeric matrix features. Jev's new contribution would be to read the problem's origin in words (PDE type, discretisation, physics) and walk the routine-selection trees that NAG and NIST already publish. This is mostly untested.

### Cited Findings
- **N1 ✓** Lighthouse: a searchable taxonomy of dense and sparse linear algebra software. Machine-learning classifiers on matrix features choose among PETSc preconditioned iterative solvers. — [arXiv 1408.1363](https://arxiv.org/pdf/1408.1363); [SC15 poster](https://sc15.supercomputing.org/sites/all/themes/SC15images/tech_poster/poster_files/post172s2-file3.pdf)
- **N2 ✓** Sood, "Iterative Solver Selection Techniques for Sparse Linear Systems", PhD thesis, University of Oregon, 2019. — [thesis PDF](https://www.cs.uoregon.edu/Reports/PHD-201905-Sood.pdf)
- **N3 ✓** "A Survey on Intelligent Iterative Methods for Solving Sparse Linear Algebraic Equations": SALSA selects iterative methods from matrix features and also picks the sparse storage format. — [arXiv 2310.06630](https://arxiv.org/pdf/2310.06630)
- **N4 ✓** Liu Weng, Bungartz, Dietrich (June 2026): 621 matrices × 101 PETSc solver configurations. An embedding method built from cheap numeric features gives 17% better top-prediction accuracy, 37% lower MAPE, and 46% lower top-prediction error than classical models. — [arXiv 2606.13255](https://arxiv.org/abs/2606.13255)
- **N5 ✓** SolverSet (2026): a large benchmark dataset for auto-selecting solver and preconditioner combinations (title only). — [World Scientific](https://www.worldscientific.com/doi/10.1142/S0218126626500209)
- **N6 ✓** DifferentialEquations.jl has had automatic stiffness detection and switching since version 4.3 (2018). Overhead is under 5%, and it is the default (for example `AutoTsit5(Rosenbrock23())`). The idea dates to Petzold's LSODA (1983). — [SciML news](https://sciml.ai/news/2018/04/09/AutoSwitch/); [solver docs](https://docs.sciml.ai/DiffEqDocs/stable/solvers/ode_solve/); [Petzold 1983](https://doi.org/10.1137/0904010) (DOI from memory ◇)
- **N7 ◇** NIST's Guide to Available Mathematical Software (GAMS) indexes routines under a tree-shaped problem taxonomy (Boisvert, Howe, Kahaner, ACM TOMS 1985). NAG Library chapter introductions include decision trees for routine choice. — [gams.nist.gov](https://gams.nist.gov/); [TOMS](https://doi.org/10.1145/6187.6188) (DOI from memory)

### Inferences

#### Usages

**F1. Routine selection down published decision trees** (GAMS, NAG, PETSc, SciPy)
- **Practice:** N7. Users answer a chain of questions ("Is the matrix symmetric? Banded? Do you need all eigenvalues?") to reach a routine.
- **Pain:** Scientists who are not numerical analysts pick poor defaults. Library experts are scarce.
- **Jev fit:** Taxonomy descent. `state` = the user's description of the problem plus code-computed facts as named buckets (symmetric: yes; size: 10^6; sparsity: 0.01%; spectrum wanted: few smallest). One Choice per tree node. The answers are printed as the path taken, which gives a readable reason without generating text.
- **Cheap + fast:** Runs inside an IDE or notebook on every solver call. Also audits a codebase for mismatched routines.
- **Evidence:** N1 (Lighthouse is this idea with keyword search). No language-model study found.
- **Fit: Medium.** Risk: users describe problems vaguely; numeric facts must come from code.

**F2. Linear-solver and preconditioner family selection**
- **Practice:** N1-N5: classifiers on numeric matrix features.
- **Pain:** Features such as spectrum estimates are costly. The best preconditioner depends on where the matrix came from (elliptic PDE: multigrid; saddle point: block methods), and numeric features do not carry that.
- **Jev fit:** Supervisory layer over numeric control plus feature extractor. `state` = text provenance ("mixed finite-element Stokes flow, 3D, unstructured mesh") plus buckets (symmetric: no; definite: indefinite; diagonal dominance: weak; condition estimate: very high). Choice: Krylov family (CG / MINRES / GMRES / BiCGStab). Choice: preconditioner family (Jacobi / ILU / algebraic multigrid / geometric multigrid / block or Schur complement / domain decomposition). Jev's probabilities join N4-style numeric features in one selector.
- **Cheap + fast:** A call costs far less than one failed solve.
- **Evidence:** N1-N5 for numeric-only selection. Adding text is untested.
- **Fit: Speculative to Medium.** Risk: solve time is numeric; Jev gives a prior and measured performance must correct it.

**F3. ODE and PDE method-class routing from text or LaTeX**
- **Practice:** Textbook rules: parabolic and stiff problems need implicit or IMEX time stepping; hyperbolic problems need upwind or shock-capturing schemes; elliptic problems pair with multigrid. Stiffness is detected at run time (N6).
- **Pain:** Novices start with the wrong class and lose days. Runtime switching (N6) already solves stiff versus non-stiff for ODEs.
- **Jev fit:** Triage / router for the *setup*. `state` = the equation in LaTeX plus the prose around it. Choices: PDE type (elliptic / parabolic / hyperbolic / mixed / not a PDE); linearity (linear / semilinear / quasilinear / fully nonlinear); stiffness prior from origin (chemical kinetics, circuits: likely stiff); conserved quantity to preserve (energy / mass / symplectic structure / none).
- **Cheap + fast:** Tags every equation in a paper, a model library, or a repository.
- **Evidence:** None found. For a second-order linear PDE with known coefficients, code computes the type exactly from the discriminant, so Jev only adds value when the coefficients are described in words.
- **Fit: Speculative.** Risk: heavy LaTeX (fluency unverified); type can change across the domain, which needs reasoning.

### Gaps
- No study found that adds text provenance to solver selection.
- No study found of PDE-type classification from LaTeX by any language model.
- N5 and N7 details were not opened or re-checked.

## 7. Mathematics education

### Takeaway
Tutoring research says step-level feedback is what works, and open-ended steps are where rule-based tutors break. A classifier that answers in 10-100 ms and costs almost nothing can sit in the tutor's inner loop, as long as a computer algebra system owns correctness and a rubric or misconception list closes the answer space.

### Cited Findings
- **E1 ✓** Eedi "Mining Misconceptions in Mathematics" (Kaggle, 2024): predict which misconception explains each wrong option (distractor) of a multiple-choice diagnostic question. Metric MAP@25. $55,000 in prizes, including separate efficiency prizes. — [Kaggle](https://www.kaggle.com/competitions/eedi-mining-misconceptions-in-mathematics)
- **E2 ◇** NeurIPS 2020 Education Challenge on Eedi data (Wang et al.): predict answers, question quality, and personalised question choice. — [arXiv 2007.12061](https://arxiv.org/abs/2007.12061)
- **E3 ✓** MathDial (Macina et al., Findings of EMNLP 2023): about 2,800-3,000 one-to-one tutoring dialogues on GSM8k problems with a taxonomy of teacher moves (Focus, Probing, and others). LLMs solve well but tutor badly: they give wrong feedback and reveal the solution too early. — [arXiv 2305.14536](https://arxiv.org/abs/2305.14536); [ACL Anthology](https://aclanthology.org/2023.findings-emnlp.372/)
- **E4 ✓** VanLehn. 2006: tutors have an outer loop (pick the task) and an inner loop (feedback on each step). 2011: step-based tutors reach an effect size of d = 0.76, close to human tutoring and above answer-only systems. — [IJAIED 2006](https://journals.sagepub.com/doi/abs/10.3233/IRG-2006-16(3)02); [Educational Psychologist 2011](https://doi.org/10.1080/00461520.2011.611369) (DOI from memory ◇)
- **E5 ✓** ASSISTments open responses: Baral et al., "Improving Automated Scoring of Student Open Responses in Mathematics" (EDM 2021); Botelho et al. (J. Computer Assisted Learning, 2023); an LLM comparison for open-ended responses (EDM 2024 poster; arXiv 2411.08910). Student answers mix words, formulas, and drawings. — [ERIC](https://files.eric.ed.gov/fulltext/ED615565.pdf); [arXiv 2411.08910](https://arxiv.org/pdf/2411.08910)
- **E6 ✓** Proof and exam grading: P1-P3 in section 2. "LLMs as Teaching Assistants for Mathematics Exam Grading" (2026, title and snippet only): partial-credit rubrics are hard to apply consistently at scale. — [arXiv 2607.01247](https://arxiv.org/html/2607.01247)
- **E7 ✓** Knowledge-component and standards tagging. An ICCE paper tags maths word problems with GPT-4o mini plus sentence embeddings; it says manual tagging is slow and inconsistent, and that generative output and compute cost hinder use in tutoring systems. Other work: multi-label tagging (Expert Systems with Applications, 2024); multilingual skill tagging (BJET, 2024). KMP-Bench tags each problem with up to four K-8 Common Core standards. — [ICCE](https://library.apsce.net/index.php/ICCE/article/view/5574); [ESWA](https://www.sciencedirect.com/science/article/abs/pii/S0957417424030999); [BJET](https://bera-journals.onlinelibrary.wiley.com/doi/full/10.1111/bjet.13465); [arXiv 2603.02775](https://arxiv.org/html/2603.02775v1)
- **E8 ✓ / ◇** BEA 2024 shared task (NBME): predict item difficulty and response time from item text alone. From memory ◇: most systems beat a mean baseline on difficulty only by a small margin. Survey: Benedetto et al., ACM Computing Surveys 2023 ◇. — [Findings](https://aclanthology.org/anthology-files/pdf/bea/2024.bea-1.39.pdf); [task page](https://sig-edu.org/sharedtask/2024); [survey DOI](https://doi.org/10.1145/3556538)
- **E9 ◇** Bridge (Wang et al., NAACL 2024): expert tutors' decisions modelled as closed sets (error type, strategy, intention) improve LLM remediation of maths mistakes — [arXiv 2310.10648](https://arxiv.org/abs/2310.10648). Daheim et al. (EMNLP 2024): stepwise verification of student solutions reduces wrong tutor feedback — [arXiv 2407.09136](https://arxiv.org/abs/2407.09136). Both IDs from memory.
- **E10 ◇** Classroom discourse: TalkMoves dataset (Suresh et al., 2022) — [arXiv 2204.09652](https://arxiv.org/abs/2204.09652); NCTE maths classroom transcripts (Demszky and Hill, 2023) — [arXiv 2211.11772](https://arxiv.org/abs/2211.11772); conversational uptake (Demszky et al., ACL 2021) — [arXiv 2106.03873](https://arxiv.org/abs/2106.03873). IDs from memory.
- **E11 ◇** STACK (Sangwin): a computer algebra system (Maxima) tests algebraic equivalence and answer properties; "potential response trees" map the test results to feedback. — [stack-assessment.org](https://stack-assessment.org/)
- **E12 ◇** Knowledge tracing (Corbett and Anderson, 1994) — [UMUAI](https://doi.org/10.1007/BF01099821). Feedback timing review (Shute, 2008) — [RER](https://doi.org/10.3102/0034654307313795). "Gaming the system" detection (Baker et al., CHI 2004) — [ACM](https://doi.org/10.1145/985692.985741).

### Inferences

#### Usages

**G1. Misconception diagnosis**
- **Practice:** Diagnostic questions with one misconception per distractor (E1, E2).
- **Pain:** Experts tag by hand. Eedi's list holds thousands of misconceptions ◇. Kaggle winners used large LLM pipelines, and the efficiency prize shows that cost matters.
- **Jev fit:** Select, do not generate. Embeddings retrieve 25 candidates. Choice or per-candidate Noul: "Which misconception best explains choosing 13 for 3 + 2 × 5?" For free-text answers: the same question over the student's typed working.
- **Cheap + fast:** 25 candidates × 300 tokens = 7,500 tokens ≈ $0.0003 per distractor. The whole item bank can be re-tagged whenever the misconception list changes. Diagnosis of a live answer fits inside the tutor's inner loop.
- **Evidence:** E1.
- **Fit: Strong** for retrieve-then-select. Risk: Jev must not be asked to do the arithmetic that leads to the wrong answer. Code should compute what each misconception would produce and pass it in as a fact.

**G2. Rubric scoring of open responses and proofs**
- **Practice:** Teachers score explanations on a 0-4 scale (E5); partial-credit rubrics for proofs (E6, P3).
- **Pain:** Grading load and inconsistency. LLM graders over-score proofs (P2).
- **Jev fit:** Verifier plus Score. One Noul per rubric line ("States the induction hypothesis", "Base case is checked"); code adds up the points. Or one Score with described levels. Low confidence goes to the teacher.
- **Cheap + fast:** A class set of 30 scripts × 10 rubric lines costs well under one cent. Students can get instant formative scores.
- **Evidence:** E5, E6, P3. Summing per-line Nouls avoids a single holistic judgment, which is where P2's over-scoring appears (my inference).
- **Fit: Medium to Strong** for short explanations. **Medium to weak** for proofs: "is present" is checkable, "is valid" is multi-hop. Risk: a student can write text aimed at the grader (adversarial); handwriting needs OCR first.

**G3. Step-level verifier in the tutor's inner loop**
- **Practice:** Model-tracing and example-tracing tutors give feedback per step (E4). A computer algebra system checks equivalence (E11).
- **Pain:** Rule sets cover only expected steps. LLM tutors are slow, give wrong feedback, and leak answers (E3).
- **Jev fit:** Verifier / process-reward model and new role "interpreter of exact-check failures". The algebra system says step *n* does not follow from step *n-1*. `state` = both steps plus the result of the check. Choice: sign error when moving a term / distributed over only one term / divided only one side / arithmetic slip / valid but unhelpful step / other. The tutor shows its pre-written hint for that class.
- **Cheap + fast:** 10-100 ms keeps feedback immediate. A year of step checks for one student costs cents.
- **Evidence:** E9 (closed-set error types help; stepwise verification cuts wrong feedback), E4.
- **Fit: Strong**, provided the algebra system owns correctness. Risk: Jev alone must never decide that a step is mathematically right.

**G4. Knowledge-component and curriculum-standard tagging**
- **Practice:** Items are tagged to Common Core or local skill maps. Knowledge tracing depends on these tags (E7, E12).
- **Pain:** Manual tagging is slow and inconsistent; curricula change (E7).
- **Jev fit:** Taxonomy descent: grade, then domain, then cluster, then standard. One Choice per level, or Nouls over a shortlist for multi-label tags.
- **Cheap + fast:** 1 million items × 1,000 tokens ≈ $40. Crosswalks between two curricula become a batch job.
- **Evidence:** E7.
- **Fit: Strong.** Risk: neighbouring standards differ by number ranges ("within 100" versus "within 1,000"), which touches the numeric weakness; code should extract the number range.

**G5. Item difficulty features**
- **Practice:** Difficulty is calibrated by pre-testing on students; text-based estimates aim to cut pre-test sample sizes (E8).
- **Pain:** Pre-testing is slow and exposes items.
- **Jev fit:** Feature extractor. Scores: "reading load: low / medium / high", "number of solution steps implied: one / two to three / more", "has a distractor that matches a common misconception". These feed a regression with response data.
- **Cheap + fast:** Every draft item gets features as the author writes it.
- **Evidence:** E8: text alone gives weak signal ◇.
- **Fit: Medium to weak.** Risk: counting steps is a counting task; expect small gains.

**G6. Tutor-dialogue move classification and answer-leak guard**
- **Practice:** Talk-move and uptake coding for teacher coaching (E10). MathDial's move taxonomy (E3).
- **Pain:** Human coding of transcripts is slow. LLM tutors reveal answers too early (E3).
- **Jev fit:** Feature extractor and verifier. Choice per teacher turn: Focus / Probing / Telling / Generic, or the TalkMoves classes. Guard on an LLM tutor's draft reply: Noul "Does this reply state the final answer or the full next step?" with the known solution in `state`; block and regenerate above a threshold.
- **Cheap + fast:** The guard adds about 100 ms to each tutor turn. Every lesson transcript in a district can be coded.
- **Evidence:** E3, E10.
- **Fit: Strong.** Risk: speech-to-text errors upstream; English only for now.

#### What changes with 10-100 ms per-keystroke feedback (inference)
- Today's step-based tutors wait for a submitted step, because rules need a complete expression. LLM tutors take seconds, so they work per turn.
- At 10-100 ms and near-zero cost, a judgment can run on each pause in typing. That allows: (a) a misconception flag before the student submits; (b) a live duplicate hint on a forum (A3); (c) help-abuse and guessing detection (E12, Baker) from the text log as it grows; (d) a live rubric meter while the student writes an explanation.
- Caution: the feedback literature does not say faster is always better (E12, Shute). Instant correction can cut productive struggle. The design choice is *when to show* the judgment, not only when to compute it. Computing early and showing late is cheap with Jev.
- Partial expressions are malformed LaTeX or ASCII maths. Jev's behaviour on these is unverified.

### Gaps
- No published latency requirement for tutor feedback was found; "immediate" is not quantified in the sources I saw.
- The Eedi misconception count and BEA 2024 baseline margins are from memory.
- E9 and E10 arXiv IDs need checking.
- No study found of classifier-based answer-leak guards on LLM tutors.

## 8. Actuarial, financial, and engineering model documentation

### Takeaway
SR 11-7 is no longer current: US regulators replaced it with SR 26-2 on 17 April 2026. The new guidance is principles-based and excludes generative AI, but model documentation, assumption registers, and validation reports remain long texts checked by scarce validators, which suits clause checks.

### Cited Findings
- **H1 ✓** On 17 April 2026 the Federal Reserve, OCC, and FDIC issued revised model risk guidance (SR 26-2; OCC Bulletin 2026-13). It rescinds SR 11-7 / OCC 2011-12, OCC 1997-24, OCC 2021-19 (SR 21-8), and the Comptroller's Handbook booklet. It takes a risk-based approach tailored to the bank's model risk profile. It covers model development and testing, validation and monitoring (conceptual soundness, outcomes analysis), and governance. It says generative AI and agentic AI "are not within the scope of this guidance". It also says non-compliance "will not result in supervisory criticism". — [OCC Bulletin 2026-13](https://www.occ.gov/news-issuances/bulletins/2026/bulletin-2026-13.html); [SR 26-2 PDF](https://www.federalreserve.gov/supervisionreg/srletters/SR2602.pdf)
- **H2 ✓** A consultancy summary says SR 26-2 is built around six high-level concepts that scale with a model's materiality. Secondary source. — [Sia Partners](https://www.sia-partners.com/en/insights/publications/sr-11-7-vs-sr-26-2-model-risk-management-modernization)
- **H3 ◇** Other regimes: UK PRA SS1/23 "Model risk management principles for banks" — [Bank of England](https://www.bankofengland.co.uk/prudential-regulation/publication/2023/may/model-risk-management-principles-for-banks-ss). Actuarial Standard of Practice No. 56 "Modeling" — [ASB](https://www.actuarialstandardsboard.org/asops/modeling-3/). URLs from memory.
- **H4 ◇** SR 11-7 defined a model as "a quantitative method, system, or approach that applies statistical, economic, financial, or mathematical theories, techniques, and assumptions to process input data into quantitative estimates". Quote from memory; I did not check whether SR 26-2 keeps this wording. — [SR 11-7](https://www.federalreserve.gov/supervisionreg/srletters/sr1107.htm)

### Inferences

#### Usages

**H1. Model documentation and assumption-register clause check**
- **Practice:** Validators read development documents against the firm's MRM policy, which is derived from H1 or H3. Actuaries document assumptions under ASOP 56.
- **Pain:** Documents run to hundreds of pages. Validators are scarce. Quality varies by team.
- **Jev fit:** Clause-by-clause compliance check. Code splits the document by section. Nouls: "Does the document state the model's intended use and its limits?", "Is a rationale given for each key assumption?", "Are known limitations listed?", "Is an outcomes-analysis or back-testing method described?", "Is there an owner for this assumption?" Code handles dates ("last review within 12 months").
- **Cheap + fast:** A 200-page document × 40 clauses routed to sections costs a few cents. The whole model inventory can be re-checked each quarter or after a policy change.
- **Evidence:** No direct study found. By analogy: reporting-guideline results S7 and S9.
- **Fit: Medium to Strong.** Risk: "present" is not "adequate"; tables and formulas in PDFs need conversion to text; review dates and thresholds stay in code.

**H2. Model-inventory triage** ("is this tool a model, and which tier?")
- **Practice:** Firms must find every model, including spreadsheets and vendor tools, and tier them by materiality (H1, H2, H4).
- **Pain:** Thousands of end-user computing tools; central teams cannot interview every owner.
- **Jev fit:** Triage / router. `state` = the owner's free-text description of the tool. Nouls on each part of the firm's model definition: "Does it apply statistical, economic, financial, or mathematical theory?", "Does it produce quantitative estimates?", "Do its outputs feed a business decision or a financial report?" Score for materiality with the firm's level descriptions.
- **Cheap + fast:** Re-run the triage on the whole tool inventory after a definition change such as H1.
- **Evidence:** None found.
- **Fit: Medium.** Risk: owners have a reason to under-describe a tool (adversarial input). Note: Jev emits no text, so it looks like an ordinary ML classifier and would itself fall inside model risk scope when a bank uses it (my inference from H1's scope line).

### Gaps
- I did not read the SR 26-2 PDF itself, only the OCC bulletin page and a consultancy summary.
- No published study found on NLP or LLM checks of model-risk documents.
- Solvency II, IFRS 17, and engineering-model documentation standards were not researched.

## 9. Cross-cutting: Top 5, poor fits, and new roles

### Takeaway
The best uses pair an existing closed answer set (a checklist, a taxonomy, a misconception list, a match/no-match decision) with a volume or latency barrier. The worst ones ask Jev to judge mathematical truth, do arithmetic, or chain inferences.

### Cited Findings
- Reuses findings cited above: K1, S3, S4, S7, S9, D4, D5, D10, E1, E3, E4, E9, P1, P2, N6, E8.

### Inferences

#### Top 5 by likely value
1. **C2 Reporting-guideline clause check.** Direct LLM evidence (S7: κ 0.70-0.77; S9: structured checklists lift accuracy from 45% to about 79%). Every journal submission is a customer, and one manuscript costs about one cent.
2. **C1 Systematic-review screening.** Two decades of text-mining evidence. The field's open problem is priced, calibrated error (S4), which is Jev's output format.
3. **G3 + G1 Step-level verifier and misconception diagnosis.** Step-level feedback is what works (E4: d = 0.76). LLM tutors are too slow and unreliable (E3). An algebra system plus Jev closes the gap at near-zero cost per student.
4. **D5 + D2 Semantic-operator backend and entity resolution.** Cost is the documented blocker (D5). LOTUS already proves the value of a cheap proxy with guarantees (D10). Largest raw volume of calls.
5. **A1 + C8 Taxonomy coding** (MSC codes, occupation and industry codes). AutoMSC cut effort by 86% with a supervised model (K1). A zero-shot model removes retraining when the taxonomy changes.
- Runner-up: **C3** semantic layer on statcheck. It is a small market but a clean example of "code computes, Jev reads".

#### Poor fits
- **Judging proof validity or finding gaps.** Multi-hop by nature. Frontier LLMs fail at it and over-score as graders (P1, P2).
- **Deciding whether a theorem's hypotheses actually hold.** Needs inference. Only the literal "is it stated" check is viable (B2).
- **Recomputing statistics.** statcheck arithmetic, GRIM-style checks, effect sizes, and sample-size sums across tables are code tasks.
- **Checklist items that need counting or dates.** Examples: participant-flow numbers that must add up; "reviewed in the last 12 months".
- **Formula search by structure** (ARQMath Task 2). Needs tree matching over formula structure, not prose judgment.
- **Algebraic equivalence of student answers.** An algebra system does this exactly (E11).
- **Writing formulations, hints, feedback, or explanations.** Jev emits no text (NL4Opt generation, OptiChat explanations, tutor replies).
- **Knowledge tracing itself.** It is a numeric sequence model. Jev can only supply tags and features.
- **Item difficulty from text alone.** Weak signal even for trained models (E8 ◇).
- **Runtime stiffness detection and spectral estimates.** Numeric code already does this with under 5% overhead (N6).
- **One flat Choice over thousands of labels** (6,006 MSC codes, full SOC). Needs a shortlist or descent.
- **OEIS term matching or next-term prediction.** Numeric.
- **Settings with a motive to game the checker.** Student answers, manuscripts, and tool self-descriptions can contain text aimed at the model. Use Jev for hints and triage there, not for final decisions.

#### New roles the catalogue is missing
- **Taxonomy descent (hierarchical coder).** Walk a published classification tree level by level, one Choice per level, carry the probability down, and stop and escalate when confidence drops. A variant asks independent facet questions in parallel and lets code look the answer up in a decision table. Seen in A1, C6, C8, E1, F1, G4.
- **Cascade proxy with an accuracy target.** Jev answers the confident cases; the uncertain band goes to a reasoning LLM or a person; thresholds are set from a labelled sample to meet a stated recall or precision. This is more specific than triage. Seen in C1 (S6) and D5 (D10).
- **Interpreter of exact-check failures.** A symbolic or numeric checker gives an exact verdict; Jev classifies *what kind* of failure it is from the surrounding text. It is the symbolic cousin of "supervisory layer over numeric control". Seen in C3 and G3.
- **Cross-document consistency audit.** Align each item in document A (registry, analysis plan, requirement list) with an item in document B (paper, model), then ask a Noul about each aligned pair. It combines entity alignment with a clause check. Seen in C4, E2, A6.

### Gaps
- None of the 41 usages has been tested with Jev. Every fit rating is a judgment from analogous LLM or classifier results.
- Jev's handling of LaTeX, Lean syntax, malformed partial expressions, and algebraic constraints is unverified. This affects A2-A6, B1, B2, E2, F3, and G3.
- Items marked ◇ need a citation check before publication.
