# Jev (TypeSafe AI "System One" Typed-Judgment Model) — Usage Catalog
## Dimension 12: Chemical Industry Safety, Regulatory & Compliance

**Scope note (applies to every usage below).** All usages are *advisory / decision-support only*. A qualified human (regulatory specialist, PHA facilitator, permit issuer, export-control officer) remains the final authority and signatory. None of these usages are, or should be, safety instrumented functions: Jev output must never be wired into a SIF/SIS trip path under IEC 61511, never auto-approve a permit, and never auto-file a regulatory report. Industry guidance on AI in process safety is explicit that "OSHA PSM and equivalent international standards require human-qualified analysis… human engineer sign-off on PHA, HAZOP, and MOC remains a regulatory requirement" [^45^]. Jev's role is to make the *pre-screening, completeness-checking, and consistency-checking* that today consumes most expert time fast, cheap, and exhaustive — so human judgment is spent only where it is needed.

**Primitives used.** `Choice` (pick option; probabilities + confidence), `Noul` (is statement true; probability), `Score` (ordered rubric position; probabilities + confidence). Many questions per call, parallel over the same JSON state; sub-100 ms latency, ~$0.04/Mtoken, 32K/32K context. The design pattern throughout: decompose a judgment-heavy workflow into atomic gut-check questions, run them in parallel at machine speed, compose the answers in deterministic code, and route only low-confidence or high-consequence items to humans.

---

## Usage 1 — SDS authoring support: GHS hazard-classification verdicts from composition + tox data

**One-liner:** Given a mixture's composition and component toxicology, Jev renders per-endpoint GHS category verdicts (Choice over categories; Noul on each bridging/cutoff rule) as a first-pass classification for expert review.

**Current practice & bottleneck.** GHS/CLP classification of mixtures requires applying the ATE mixture formula, concentration cutoffs, and additivity rules endpoint-by-endpoint — the core cost driver in SDS authoring. Manual SDS authoring "consumes 4.3 hours per document"; a UL Solutions case study found automation cut per-document creation time "from 8 hours to 45 minutes" [^5^]. Even with authoring software, "if any errors occur during the hazard classification of the product, the user of the software bears the consequences," and automatically generated SDSs "must always be reviewed by a human specialist" [^2^].

**Primitive design.** State: JSON of component list (CAS, wt%), component ATEs/LD50/LC50, harmonized classifications, physical data. Questions (parallel, per endpoint): Noul "Is ATE_mix ≤ 50 mg/kg (Cat 1/2 band)?"; Choice "Acute oral toxicity category {1,2,3,4,5,NC}"; Noul "Does any CMR component exceed its generic concentration limit?"; Score "confidence that component tox data are sufficient {adequate / marginal / inadequate→expert}". Compose into a draft Section 2 classification with per-verdict confidence; low-confidence endpoints route to the toxicologist.

**Why latency/cost matters.** Classification must be re-checked at every formulation tweak, supplier substitution, and ATP revision. At ~$0.04/Mtoken and <100 ms, an R&D team can re-verify classification verdicts on *every* formulation iteration inside the ELN/LIMS workflow, rather than batching SDS work into quarterly expert review. Portfolio-scale re-baselining (e.g., 25,000 SDSs across 40 countries [^5^]) becomes a batch job costing dollars, not an FTE-year.

**Evidence.** ML prediction of GHS-aligned hazard categories is established: HazChemNet, a deep-learning model for hazardous-chemical classification, reports "mean accuracy of 91.9 ± 1.3%, F1-score of 91.4 ± 1.3%, and AUC of 92.9 ± 1.1%" [^1^]. A systematic review reports acute-oral-toxicity QSAR models "correctly or conservatively predicted GHS toxicity categories for approximately 95 percent of tested compounds" with "balanced accuracy across all hazard categories… 80 percent" [^3^]; a mechanistic QSAR model explicitly targets "GHS categories 1 or 2" with sensitivity optimized "to minimize the likelihood of under-predicting the toxicity" [^4^]. Commercial SDS platforms already market "AI [to] help classify complex mixtures into the correct hazard classes… thereby supporting quick and accurate GHS classification" [^2^].

**Confidence: High** — direct ML literature on the exact classification task + commercial precedent + deterministic rules (ATE formula) for Jev to check rather than invent.

---

## Usage 2 — SDS internal-consistency QC: cross-section contradiction detection

**One-liner:** For a drafted or incoming SDS, Jev answers dozens of pairwise Noul questions ("Is the first-aid advice in Section 4 consistent with the H-statements in Section 2?") to flag contradictions before release.

**Current practice & bottleneck.** SDS quality audits show cross-section inconsistency is endemic and is found today only by slow expert reading. A Health Canada audit of 188 SDSs found "17.49% of the SDSs lacked consistency in Section 4: First-Aid measures, where the instructions were not consistent with the hazard and precautionary statements outlined in Section 2," and "13.94%… contained contradictory information in Section 11" [^6^]. An ECHA study of 197 SDSs found "in 20% of the SDSs assessed, information on recommended/identified uses was missing; and in 66%… 'uses advised against' was missing," plus "34% of the SDSs contained vague and generic information" in Section 7 [^6^]. Lisam's SDS indexing service reports routine discovery of "Outdated Documents… Inconsistencies Across Languages… Regional Classification Errors… Mismatches in hazard (H) statements or precautionary (P) statements" [^7^].

**Primitive design.** State: parsed SDS JSON (16 sections, H/P statements, composition, exposure limits). Parallel Noul battery: "Section 4 first-aid measures address every H3xx route-specific hazard in Section 2"; "Section 7 storage conditions match Section 10 incompatibilities"; "Section 8 OELs exist for every component with a harmonized limit"; "Signal word is consistent with the most severe category assigned"; "Revision date ≤ 3 years old and post-dates latest relevant ATP." Score each section pair on coherence {consistent / questionable / contradictory}. Output: exception list, not a rewritten SDS.

**Why latency/cost matters.** A full pairwise consistency battery is ~50–150 questions per SDS; at sub-100 ms and fractions of a cent, it runs on *every* SDS at intake, at revision, and before shipment — replacing sampling-based audits (which today review tens of SDSs) with 100% coverage.

**Evidence.** [^6^][^7^] above; SDS software vendors already describe "AI-powered data extraction and validation… verified its classifications" and validation tools that "flag documents that are out of date, missing key information, or aren't compliant with current GHS standards" (nextsds, see ref list [^46^]).

**Confidence: High** — published non-compliance rates define the ground truth classes; task is pure consistency checking, squarely a typed-judgment workload.

---

## Usage 3 — Cross-supplier SDS discrepancy adjudication (same substance, conflicting classifications)

**One-liner:** When two suppliers' SDSs for the same CAS disagree, Jev renders Noul/Score verdicts on which divergence is material (different data vs. different interpretation vs. stale document) to focus expert reconciliation.

**Current practice & bottleneck.** Procurement and EHS teams receive conflicting SDSs for identical substances and must adjudicate manually. Documented evidence: for concentrated sulfuric acid, "Among the seven chemical suppliers featured… no two agree on the classification" [^8^]. A hospital pharmacy study evaluating 113 SDSs from two suppliers for 59 raw materials "found discrepancies in 13 RM (38.2%): 2/13 (15.4%) were hazardous by only one supplier… 2/13 (15.4%) had completely different [human health hazards]… 9/13 (69.2%) had more [hazards] assigned by one supplier" [^9^]. Global SDS compliance guidance confirms "The same chemical can be classified differently in each country" [^47^].

**Primitive design.** State: two parsed SDSs + harmonized classification (if any) from ECHA C&L inventory. Questions: Noul "Both cite the same purity/impurity profile relevant to classification"; Noul "Divergence X is explained by a jurisdictional GHS adoption difference (e.g., aquatic pictogram non-mandatory in US)"; Noul "Divergence X is explained by a newer ATP/ATP-mandated harmonized classification in the more recent document"; Choice "Most defensible classification basis {harmonized / supplier A self-class / supplier B self-class / escalate}"; Score "materiality of divergence to our downstream mixture classification {none / low / high}". 

**Why latency/cost matters.** Discrepancy screening must run at intake for every supplier-SDS pair (thousands per year for a formulator); cheap parallel verdicts turn a reconciliation backlog into a triage queue where only the ~10–40% material divergences [^9^] consume expert time.

**Evidence.** [^8^][^9^][^47^]; ECHA's revamped C&L Inventory ("7 million registration entries, covering ~350,000 substances," "4,400+ EU-harmonised classifications," API access planned) provides the authoritative state Jev verdicts can be checked against [^10^].

**Confidence: High** — quantified real-world discrepancy rates; clear decomposition into typed judgments.

---

## Usage 4 — REACH/CLP regulatory-change impact triage (SVHC, ATP, harmonized-classification updates)

**One-liner:** On each ECHA/EU regulatory update, Jev answers per-product Noul questions ("Does product P contain substance S above 0.1% w/w? Is S newly on the Candidate List?") to generate a product-by-action impact queue.

**Current practice & bottleneck.** Regulatory-intelligence teams manually map list updates (SVHC additions, CLP ATPs, restriction entries) onto product portfolios of 1,000+ substances. A documented case: "A chemical manufacturer with 1,200 substance registrations needed proactive compliance with REACH requirements amid frequent updates to toxicology data, classification rules, and evolving ECHA guidance" [^11^]. Commercial platforms exist precisely because of this load: 3E markets monitoring of "REACH, TSCA, CLP, GHS, OSHA HazCom, and 3,200+ regulatory lists across 150+ countries" [^12^].

**Primitive design.** State: regulatory delta (new/changed list entries as structured JSON) + product substance index (CAS, concentration, tonnage band). Per (product × change) parallel Nouls: "Contains listed substance above disclosure threshold"; "Existing classification now conflicts with new harmonized classification → SDS revision triggered"; "Tonnage band triggers new dossier requirement"; Score "business impact {none / documentation / reformulation / market-exit risk}". Compose into the impact queue with probabilities; the regulatory-affairs expert confirms.

**Why latency/cost matters.** The cross-product of "3,200+ lists" × thousands of products is exactly where per-question cost dominates. Jev's pricing makes exhaustive pairwise screening routine; sub-100 ms latency allows same-day impact assessment when a list drops, rather than a weeks-long manual review cycle.

**Evidence.** [^11^][^12^]; ECHA CHEM database scale (7M classifications; APIs forthcoming) [^10^]; industry guidance that ECHA inspections target "SDS and labels… fully updated and compliant" and that monitoring "restricted and authorised substances" is core preparation (epy.it, ref [^48^]).

**Confidence: High** — threshold checks are rule-anchored; Jev adds the semantic layer (interpreting product/change descriptions) above the join.

---

## Usage 5 — HAZOP support: deviation completeness and cause/consequence plausibility checks

**One-liner:** For each (node × guideword), Jev answers "Is this cause list plausibly complete?" and "Is cause C credible for deviation D in this node?" — flagging gaps and implausible rows for the team's attention before sign-off.

**Current practice & bottleneck.** HAZOP completeness depends on facilitator experience; omissions are a known failure mode. The DT/AI HAZOP literature review frames the augmentation principle: "DT-AI should strengthen expert-led hazard analysis as a decision-support layer, not replace human judgment," and lists among AI-supported tasks "deviation generation, knowledge retrieval, consistency checking, documentation, and scenario suggestion" [^13^]. On completeness specifically: "Traditional HAZOP relies on the structured, systematic application of guidewords to every process node to provide completeness assurance," and proposed mitigations include "applying uncertainty quantification to identify nodes or parameters where the AI system has low confidence, triggering enhanced human review" [^13^] — precisely Jev's confidence-typed output. Commercial practice concurs: "The HAZOP team owns the study. AI provides suggestions, not decisions" [^15^].

**Primitive design.** State: node description (equipment, design intent, materials, conditions) + the worksheet's current causes/consequences/safeguards for a deviation. Parallel Nouls: "Cause C can physically produce deviation D given stated design intent"; "Consequence Q follows from D absent safeguards"; "Safeguard S is effective against cause C"; "Common-cause link exists between S and C"; Choice "Which standard deviation set (flow/pressure/temperature/level/composition/…) has not been applied to this node but should be"; Score "worksheet row quality {adequate / vague / defective}". Aggregated per node into a completeness heat map for the facilitator.

**Why latency/cost matters.** A full HAZOP generates thousands of (node × guideword) cells; a completeness pass over all cells must be nearly free to be run at every revision and after every MOC, not once per 5-year revalidation. Jev lets the completeness check become continuous rather than episodic.

**Evidence.** Knowledge-graph completeness tooling exists in the literature (HAZOPCT: "a HAZOP analysis completeness tool based on knowledge graph reasoning") [^14^]; reviews confirm "AI-assisted HAZOP is best positioned as expert augmentation rather than full replacement" and caution that "A safeguard that appears adequate in a worksheet may be ineffective if it is not independent… These judgments… cannot be fully delegated" [^13^] — supporting a flag-and-escalate design, not auto-approval.

**Confidence: Medium-High** — strong literature on the workflow and precedent tools; judgment-check accuracy must be validated per-company before reliance.

---

## Usage 6 — LOPA support: scenario screening and IPL plausibility/credit checks

**One-liner:** Jev triages HAZOP outputs into LOPA candidates and sanity-checks claimed IPLs (independence, effectiveness, auditability) so analysts spend workshop time on contested scenarios.

**Current practice & bottleneck.** LOPA is the standard semi-quantitative bridge between HAZOP and SIL assignment: "LOPA was formalized by the Center for Chemical Process Safety (CCPS) in their 2001 book… IEC 61511-3, Annex F (informative) incorporates it as a recognized semi-quantitative method" [^16^]. Scenario selection is judgment-heavy: "Scenarios are selected from studies that precede LOPA, such as PHA, using screening criteria, for example, scenarios with the highest risk ranking" [^17^]. Each IPL must pass "three tests of independence, effectiveness, and auditability" [^49^].

**Primitive design.** State: HAZOP rows (cause, consequence, safeguards) + corporate risk matrix + site IPL rules. Questions: Score "scenario severity band {Negligible/Marginal/Critical/Catastrophic}" against the corporate severity definitions; Noul "Consequence warrants LOPA per screening criteria"; Noul "Claimed safeguard S satisfies independence from initiating event and from other credited IPLs"; Noul "S is auditable (testable/inspectable with documented proof-test)"; Choice "initiating event class {BPCS loop failure / human error / utility loss / external}" to look up standard IEF. Output: screening queue + per-IPL credit flags; the LOPA leader decides.

**Why latency/cost matters.** Pre-screening hundreds of scenarios before a workshop compresses days of facilitation; re-running screening after each design change is only practical if each verdict costs fractions of a cent and returns in milliseconds inside the PHA tool.

**Evidence.** [^16^][^17^][^49^]; severity-anchored tolerable-risk targets are standardized in practitioner tooling (e.g., "Catastrophic — TRT: 1×10⁻⁵/yr… Critical — 1×10⁻⁴/yr") [^50^], providing the rubric ladder for Score primitives.

**Confidence: Medium-High** — criteria are well-documented; Jev checks application of documented rules, humans keep risk decisions.

---

## Usage 7 — Management of Change triage: "change" vs. "replacement in kind" verdicts

**One-liner:** For each proposed modification, Jev renders a Choice verdict {RIK / minor change / MOC-required / ambiguous→engineer} with confidence, so nothing safety-relevant slips through as "like-for-like."

**Current practice & bottleneck.** The statutory line is fine and judgment-laden: "change includes all modifications to equipment, procedures, raw materials and processing conditions other than 'replacement in kind,'" and replacement in kind is "a replacement that satisfies the design specification" [^18^]. Gray areas are the documented failure point: "Equipment that is functionally equivalent but from a different manufacturer, procedure changes that do not affect safe operating limits, temporary modifications. Define how these will be evaluated" [^19^]. MOC guidance catalogs hidden changes: "equipment configuration; materials of construction; installation of temporary facilities; temporarily bypassing or disabling equipment… operating a control valve with the handjack engaged" [^20^].

**Primitive design.** State: change description (free-text + structured fields: tag, design spec, deviation from spec, process chemistry, operating envelope). Parallel Nouls: "Any design specification parameter altered (materials, rating, model)"; "Operating conditions move outside documented safe operating limits"; "Alarm/interlock/SIS logic touched"; "Temporary in nature → time limit defined"; "PHA/PSI documents require update." Choice "routing {RIK—log only / streamlined review / full MOC}"; Score "safety relevance {none / low / high}". Deterministic code escalates any high-severity or low-confidence verdict to the MOC coordinator.

**Why latency/cost matters.** MOC volume at a mid-size site is hundreds to thousands of requests/year; under time pressure is exactly when misclassification happens. Instant, near-free first-pass verdicts at the point of work request (inside the CMMS) catch RIK-misclassification *before* work starts, not at audit.

**Evidence.** [^18^][^19^][^20^]; MOC software vendors already build "Impact assessment forms: Built-in checklists ensure every MOC evaluates impacts on PSI, procedures, training, PHAs, and mechanical integrity" [^19^] — Jev automates the checklist judgment itself.

**Confidence: High** — the decision boundary is statute-anchored text with abundant worked examples.

---

## Usage 8 — Permit-to-work semantic verification (hot work / confined space / isolation)

**One-liner:** Before a permit reaches the issuer, Jev verifies semantic adequacy of the package: checklist completeness, gas-test recency/sequence, SIMOPs conflict likelihood, rescue-plan adequacy — flagging, never approving.

**Current practice & bottleneck.** PTW failures are a persistent incident cause: "7% of Incidents [have] root cause linked to permit-to-work system failures — persistent across 25 years of industrial safety data," with "50.7% Error Rate… human error in atmospheric gas testing at confined space entries" and "85% [of] confined space entry deaths preventable through proper training, permitting procedures, and atmospheric verification" [^21^]. Digital PTW systems already do structural checks ("Before it ever reaches an approver, the request is checked against every other active permit for spatial and time overlap") [^22^] — but not semantic ones (does the *described* work match the permit type? is the rescue plan meaningful for *this* space?).

**Primitive design.** State: permit JSON (type, location, scope text, gas readings + timestamps, isolation points, active neighboring permits, equipment involved). Parallel Nouls: "Scope description is consistent with requested permit type"; "Gas test sequence (O₂→LEL→toxics) and values meet site limits and are within validity window"; "Fire watch assigned for hot work within required radius of combustibles"; "Rescue plan names retrievable means appropriate to space geometry"; "Simultaneous-operation conflict plausible with permit #X (hot work near confined-space entry)"; Score "permit package readiness {issue-ready / deficient / escalate}". All output advisory to the area authority, who signs.

**Why latency/cost matters.** Permits are issued at shift start under time pressure; verification must complete inside the mobile PTW app in well under a second or it will be bypassed. Large sites "run 40–60 concurrent hot work permits daily" [^21^] — per-permit cost must be negligible to check every one, every time.

**Evidence.** [^21^][^22^]; OSHA 1910.146 testing parameters enforced in current digital systems ("O₂ 19.5–23.5%, combustible gas ≤25% LEL") [^21^] give the numeric rubric Jev verdicts compose over.

**Confidence: Medium-High** — structural checks proven in market; semantic checks are the novel Jev contribution and need site validation.

---

## Usage 9 — Incident & near-miss report classification + similar-incident retrieval verdicts

**One-liner:** Jev codes incoming incident/near-miss narratives into PSM/API RP 754 taxonomies (Choice over tier and cause codes) and renders Noul verdicts on candidate similar past incidents, routing learning to the right reviewers.

**Current practice & bottleneck.** Incident coding is manual and inconsistent; yet ML classification of free-text safety narratives is well established: unsupervised ML on OSHA injury narratives shows "pertinent information can be extracted from unstructured free-text data, enabling an effective categorization" [^23^]; classifiers on 4,770 OSHA construction accident reports achieved "high accuracy rates of 0.91 and 0.90 using SVM and CNN models" [^24^]; chemical-industry theses apply supervised NLP to pipeline and process-incident narratives to extract "underlying causes and contributory factors" [^25^]. Severity tiering itself is standardized: API RP 754 Tier 1/2 lagging LOPC definitions and Tier 3/4 leading indicators [^26^].

**Primitive design.** State: incident narrative + structured fields (unit, chemicals, consequences, quantities). Questions: Choice "API RP 754 tier {1,2,3,4,not-LOPC}" against threshold definitions; Choice "primary causal factor code"; Noul "Reportable under site/regulatory definition X"; Noul "Candidate past incident #k describes the same failure mechanism" (run against top-k retrieved similar incidents); Score "investigation depth warranted {learning-only / standard / formal root-cause}". Output: proposed coding + similarity links for the incident review board to confirm.

**Why latency/cost matters.** Near-miss reports arrive continuously and die in triage queues; instant coding at submission enables same-shift feedback. Pairwise similarity verdicts against a 10-year incident archive are computationally trivial at Jev pricing but prohibitive at frontier-LLM pricing.

**Evidence.** [^23^][^24^][^25^][^26^]; CSB/PSID-style learning-from-incidents practice presumes exactly this taxonomy-and-retrieval backbone [^25^].

**Confidence: High** — the single most literature-supported usage in this catalog.

---

## Usage 10 — Alarm philosophy compliance audit support (ISA-18.2 / IEC 62682)

**One-liner:** Jev audits the master alarm database against the site's alarm philosophy: per-alarm Noul verdicts on justification completeness, priority-rule conformance, and documentation adequacy.

**Current practice & bottleneck.** ISA-18.2 requires rationalization and periodic audit of every alarm; manually "doing it manually across thousands of alarm points is one of the reasons so many plants start the effort and never finish it" [^28^]. The standard defines rationalization as reviewing "potential alarms using the principles of the alarm philosophy… and document the rationale for each alarm" [^27^], and audits repeatedly find priority inflation: "fewer than 5 percent of all alarms should ever be Priority 1. If your system's priority distribution looks flatter than that, priority inflation is very likely the root cause" [^29^]. Performance targets are numeric: "<150/day EEMUA 191 manageable threshold for average alarms per operator per day — <20/day for well-performing systems" [^28^].

**Primitive design.** State: alarm philosophy (priority matrix, classification rules) + MADB rows (tag, setpoint, stated cause/consequence/response/priority). Parallel Nouls per alarm: "Documented consequence exists and matches philosophy format"; "Assigned priority equals philosophy-matrix output for (consequence severity × time-to-respond)"; "Operator response documented and actionable"; "Alarm duplicates function of another tag"; Score "rationalization record completeness {complete / gaps / missing}". Compose distribution-level metrics (priority mix vs. <5% P1 rule) plus per-alarm exception list for the rationalization team.

**Why latency/cost matters.** Auditing 2,000–5,000 alarms (typical mid-size site [^51^]) is a ~5,000 × ~8-question batch — trivially cheap and fast, enabling continuous audit instead of a periodic project; live re-checks after every alarm MOC keep the MADB clean.

**Evidence.** [^27^][^28^][^29^][^51^]; the Rockwell white paper defines audit as the third entry point of the 18.2 lifecycle "for verifying alarm system integrity" [^27^].

**Confidence: High** — rules are documented per-site; Jev checks conformance of documentation to rules, classic typed-judgment work.

---

## Usage 11 — Chemical storage compatibility & segregation semantic layer

**One-liner:** Above the deterministic reactivity tables, Jev answers semantic Nouls ("Given these SDS storage sections and this storage-group assignment, is co-location of A and B defensible?") to catch inventory-placement risks rule tables miss.

**Current practice & bottleneck.** Segregation is governed by compatibility storage-group systems and incompatibility charts; practitioners are pointed to "the NOAA Chemical Reactivity Worksheet and the NOAA CAMEO Chemicals" plus group systems such as Princeton's "Compatible Chemical Storage Group Classification System" [^30^]. Rule tables handle pure chemicals well but struggle with mixtures, trade-name products, and conflicting SDS Section 7/10 statements — where judgment is currently exercised ad hoc by lab/EHS staff.

**Primitive design.** State: inventory JSON (product, composition from SDS, assigned storage group, quantity, location) + site segregation scheme. Per (item × storage-location or item-pair) Nouls: "Any component of mixture M belongs to a group incompatible with group G"; "SDS Section 7 'storage' or Section 10 'incompatible materials' text indicates a conflict not captured by group codes"; "Quantity/condition (e.g., peroxide former age) elevates segregation class." Choice "segregation action {compatible as placed / secondary containment / separate cabinet / separate room}"; Score "confidence". Exceptions go to the chemical hygiene officer.

**Why latency/cost matters.** Pairwise checks scale quadratically with inventory size; a 5,000-item inventory implies millions of pair-checks on each inventory refresh — feasible only at near-zero marginal cost, and fast enough to run inside the inventory-management UI at the moment a storage location is assigned.

**Evidence.** [^30^]; SDS Section 2↔7/10 inconsistency rates [^6^] motivate the semantic double-check above group codes.

**Confidence: Medium** — strong rule substrate (CAMEO CRW) to compose over; mixture/trade-name semantics need per-site tuning and validation.

---

## Usage 12 — Emergency-response advisory: dispersion-model applicability & level-of-concern selection

**One-liner:** Jev answers typed questions that guide responders/planners to the right model and LOC set ("Is ALOHA applicable to this release scenario? Should LOCs be AEGL, ERPG, or TEEL?") — advisory input to the on-scene or planning expert, never an automated protective action.

**Current practice & bottleneck.** Tools and thresholds exist but selection requires expertise: "ALOHA allows you to specify up to three toxic LOCs. So, you can choose the ERPG-1, ERPG-2, and ERPG-3 values" [^31^]. Guidance is nuanced: "Any of these three sources may be appropriate for a LOC comparison. For releases with an impact area extending well beyond the site, AEGLs are often preferentially used, but modeling against AEGLs has been shown to predict lower concentrations at a closer distance than ERPG values" [^32^]. ERPGs cover only ~150 chemicals [^33^]; TEELs fill gaps. "ERPGs are referenced in EPA's risk management program rule and are built into widely used tools like the CAMEO suite and… ALOHA" [^33^].

**Primitive design.** State: release scenario JSON (chemical, phase, release type, terrain, building wake, duration) + available LOC sets. Parallel Nouls: "Substance within ALOHA chemical library and property limits"; "Dense-gas behavior likely → heavier-than-air modeling path required"; "ERPG set exists for this chemical; if not, TEEL fallback"; "Scenario duration consistent with 1-hour LOC basis"; Choice "LOC hierarchy to use {AEGL / ERPG / TEEL}" per DOE-style preference logic; Score "model-result reliability for this scenario {adequate for planning / indicative only / do not use}". Composed into an advisory panel for the responder/planner.

**Why latency/cost matters.** In an incident, minutes matter; advisory verdicts must return in milliseconds alongside the model run. In planning mode, thousands of scenario×substance combinations (RMP offsite-consequence analyses) can be pre-screened cheaply.

**Evidence.** [^31^][^32^][^33^]; ALOHA/CAMEO is the established free toolchain ("ALOHA is an atmospheric dispersion model used for evaluating releases of hazardous chemical vapors") [^52^].

**Confidence: Medium** — selection heuristics are documented; embedding them as advisory verdicts is straightforward, but scenario-applicability judgments need validation with hazmat planners.

---

## Usage 13 — Trade compliance: dual-use/ECCN/CWC classification triage & denied-party fuzzy-match adjudication

**One-liner:** Jev pre-classifies chemical products against export-control lists (Choice over ECCN/CWC schedule status) and adjudicates screening hits (Noul "is this fuzzy name match the same entity?"), shrinking expert review queues.

**Current practice & bottleneck.** Chemical exporters must screen against the Australia Group Common Control Lists ("All participating countries have licensing measures covering over 60 CW precursors" plus dual-use equipment lists) [^34^] and CWC Schedules — Schedule 3 alone covers "approximately 17 chemicals… produced globally in large commercial quantities (phosgene, thionyl chloride, methyl chloroformate, phosphorus oxychloride)" with per-destination authorization/notification workflows [^35^]. Commercial tools already automate parts: "AEB Export Control includes an AI-powered classification assistant that assigns ECCNs from technical data with accuracy above 95%" [^36^]. On the party-screening side, false positives dominate workload; a Federal Reserve working paper found LLMs "reduced false positives by 92% while increasing detection rates by 11%" versus fuzzy matching alone [^37^]. OFAC's own search uses "edit-distance, Jaro-Winkler and Soundex matching alongside exact-name searches" [^38^].

**Primitive design.** (a) Classification triage. State: product technical description, composition, end-use statement, destination. Nouls: "Contains any CWC Schedule 1/2/3 chemical above its low-concentration threshold"; "Contains AG precursor above mixture de-minimis (e.g., <30 wt% rule)"; Choice "ECCN family candidate {1C350/1C351/EAR99/…, escalate}"; Score "classification confidence". (b) Match adjudication. State: screening alert (query name/DOB/address vs. list entry + similarity score). Nouls: "Identifiers (DOB/nationality/address) contradict same-entity hypothesis"; "Name similarity explainable by transliteration alone"; Choice "disposition {clear false positive / potential true match—escalate}"; Score "match-materiality".

**Why latency/cost matters.** Screening runs on every order and every list update; adjudication queues at large shippers run to thousands of alerts. Sub-100 ms verdicts embedded in the order pipeline prevent shipment delays; near-zero per-alert cost enables 100% adjudication-assist coverage instead of sampling.

**Evidence.** [^34^][^35^][^36^][^37^][^38^]; US rules text (EAR amendments implementing AG/CWC) supplies the threshold logic [^53^].

**Confidence: Medium-High** — classification has commercial precedent at >95%; adjudication has a strong quantitative result [^37^]; both need documented human-final-authority controls for regulatory defensibility.

---

## Usage 14 — Environmental reporting validation: Tier II / TRI data-quality screening

**One-liner:** Before submission, Jev runs a Noul battery over EPCRA Tier II and TRI Form R drafts to catch the error classes EPA cites most: missing chemicals, wrong EHS flags, threshold arithmetic, inconsistent cross-site naming.

**Current practice & bottleneck.** The recurring error classes are well documented: Encamp's Top-10 list includes "Chemicals are reported inconsistently across sites/facilities," "Certain chemicals aren't reported when they should be," "Chemicals are incorrectly-marked as extremely hazardous substances (EHSs)," "Out-of-date Safety Data Sheets," and "Mixture components are incorrect" [^39^]. EPA defines TRI "data quality errors" requiring correction, including "Failure to identify all appropriate categories of chemical use" and "Failure to use all readily available information" [^40^]. TRI-specific pitfalls: "Estimating threshold determinations instead of doing the math," "Ignoring SARA 313 chemicals that are in alloys or mixtures," "Failing to report coincidental manufacturing" [^41^]. Enforcement is real: penalties of $108,900 and $170,261 for missed TRI/Tier II filings [^54^].

**Primitive design.** State: facility chemical inventory + SDS library + draft Tier II / Form R data. Parallel Nouls: "Every inventory chemical exceeding TPQ/10,000-lb threshold appears in the report"; "EHS designation matches EPA List of Lists for each entry"; "Mixture-component decompositions sum correctly (1% / 0.1% carcinogen rules)"; "Reported hazard codes match current SDS Section 2"; "Year-over-year release-estimate change >X% lacks documented cause"; "Cross-site naming consistent (no 'muriatic acid' vs 'hydrochloric acid' splits)" [^39^]. Score "submission readiness {ready / fix-list / expert review}".

**Why latency/cost matters.** Validation must run continuously as inventory changes, not once before the March 1 / July 1 deadlines; cheap verdicts make "compliance-as-you-go" feasible across hundreds of facilities.

**Evidence.** [^39^][^40^][^41^][^54^].

**Confidence: High** — error classes are enumerable and rule-anchored; Jev supplies the semantic matching (names, SDS cross-references) around the arithmetic.

---

## Usage 15 — Process safety KPI anomaly triage (API RP 754 leading-indicator stream)

**One-liner:** Jev converts raw KPI anomalies (SOL excursions, SIF demands, bypass activity, proof-test deferrals, alarm rates) into triage verdicts — Score severity, Noul "is this a genuine Tier 3/4 precursor?" — for daily review instead of weekly batch reports.

**Current practice & bottleneck.** The four-tier structure exists precisely to drive attention downward: "Tier 1 and Tier 2 events confirm what already failed; Tier 3 and Tier 4 indicators reveal what's currently degrading, while there's still room to intervene" [^42^]. The recommended KPI set is established: "Tier 1 and Tier 2 process safety events (per API RP 754), safe operating limit exceedances, safety instrumented function demand rate, proof-test completion, override and bypass activity, alarm rate per operator, and near-miss reporting" [^43^]. Dashboard guidance emphasizes that "Per API 754, Tier 3 and Tier 4 metrics function as leading indicators for more severe Tier 1 and Tier 2 process safety events" and refresh "under 60 seconds" [^44^]. The volume problem: dozens of plants × dozens of KPIs × daily events = more anomalies than engineers can eyeball.

**Primitive design.** State: KPI event JSON (tag, type, magnitude, duration, plant context, recent related events, maintenance/bypass status). Parallel Nouls: "Event represents a true demand on a safety system (vs. test/spurious)"; "Event correlates with an active bypass or deferral (compound risk)"; "Event is recurrent vs. prior 90-day baseline for this tag"; Score "precursor severity {routine / watch / escalate to PSM engineer}"; Choice "most likely contributing category {equipment degradation / procedural / instrumentation / operating-mode}". Composed into the morning PSM triage list; nothing auto-closes.

**Why latency/cost matters.** Leading indicators only prevent incidents if reviewed *before* they compound; per-event verdicts in milliseconds at negligible cost make continuous, every-event triage possible, replacing sampled weekly review.

**Evidence.** [^42^][^43^][^44^].

**Confidence: Medium** — KPI definitions are standardized; anomaly-context judgment needs site-specific baselining and a validation period against engineer-labeled history.

---

## Cross-cutting design notes

1. **Composition pattern.** Every usage above is: deterministic rules/data (ATE formulas, List of Lists, philosophy matrices, CAMEO CRW, threshold tables) **+** Jev semantic verdicts (consistency, plausibility, materiality, similarity) **+** confidence-gated human escalation. Jev never replaces the rule layer; it replaces the unaided-expert reading between rules.
2. **Batch economics.** Most usages are embarrassingly parallel question batteries (per SDS, per alarm, per pair, per alert). At ~$0.04/Mtoken, full-population screening (100% coverage) displaces sample-based auditing throughout the compliance stack.
3. **Regulatory posture.** Outputs are drafted as *recommendations with probabilities* consumed inside existing qualified-person workflows (SDS author, PHA facilitator, permit issuer, export-control officer, PSM coordinator). This matches documented industry norms: AI "strengthens compliance posture but does not substitute for the formal activities OSHA requires under 29 CFR 1910.119" [^45^].
4. **Explicit exclusion.** No usage feeds a safety instrumented function, an automated trip, an automatic permit approval, or an unreviewed regulatory filing. IEC 61511 SIL allocation/verification decisions remain with competent persons; Jev may prepare inputs to them but is not an IPL and earns no risk-reduction credit.

## References

[^1^] HazChemNet: A Deep Learning Model for Hazardous Chemical Prediction, PMC12524297 — https://pmc.ncbi.nlm.nih.gov/articles/PMC12524297/
[^2^] Applicability of artificial intelligence in chemical safety (SDS/CLP/REACH), msds-europe.com — https://www.msds-europe.com/artificial-intelligence-in-chemical-safety-sds-clp-reach/
[^3^] Exploring the potential of computer simulation models in drug testing and biomedical research: a systematic review, Front. Pharmacol. 2025 — https://www.frontiersin.org/journals/pharmacology/articles/10.3389/fphar.2025.1644907/full
[^4^] Wijeyesakere et al., Profiling mechanisms that drive acute oral toxicity in mammals and its prediction via machine learning, Toxicological Sciences 2023 — https://read.qxmd.com/read/36946286/
[^5^] Comprehensive Analysis of SDS Authoring: Processes, Compliance, and Best Practices, CloudSDS (UL Solutions case study) — https://cloudsds.com/sds-management/comprehensive-analysis-of-safety-data-sheet-sds-authoring-processes-compliance-and-best-practices/ ; corroborating figures: https://www.reachsafetydatasheets.com/post/enterprise-sds-authoring-transforming-chemical-safety-documentation-in-2024
[^6^] Safety Data Sheets as a Hazard Communication Tool (SDS section-consistency audits; Health Canada, ECHA), PMC11255927 — https://pmc.ncbi.nlm.nih.gov/articles/PMC11255927/
[^7^] Status of SDS Compliance in Chemical Industry (supplier SDS non-conformities), Lisam — https://www.lisam.com/news/sds-compliance-ways-to-tackle-supplier-document-non-conformities/
[^8^] There's More to the New Safety Data Sheets than a Missing "M" (sulfuric acid classification disagreement), teachchemistry.org — https://teachchemistry.org/periodical/issues/may-2017/there-s-more-to-the-new-safety-data-sheets-than-a-missing-m
[^9^] 3PC-028 Evaluation and analysis of human health hazards of raw materials… (38.2% supplier SDS discrepancies), Eur J Hosp Pharm — https://ejhp.bmj.com/content/32/Suppl_1/A30.1
[^10^] ECHA Unveils Overhauled C&L Inventory in Enhanced ECHA CHEM Database — https://pcma.org.pk/echa-unveils-overhauled-cl-inventory-in-enhanced-echa-chem-database/
[^11^] LEXAI Use Cases — REACH Compliance Management (1,200 registrations) — https://lexai.co/fi/use-cases/
[^12^] 3E Insight — Chemical Classification Services for Product Compliance — https://www.3eco.com/3e-solutions/product-stewardship/classification-services/
[^13^] Digital Twins and Artificial Intelligence for HAZOP Enhancement in Process Safety: A Critical Literature Review — https://www.preprints.org/manuscript/202606.1902
[^14^] HAZOPCT: A HAZOP analysis completeness tool based on knowledge graph reasoning — https://www.researchgate.net/publication/389795679
[^15^] AI in HAZOP: Can Generative AI Improve Hazard Identification in 2026?, SynergenOG — https://synergenog.com/ai-in-hazop-can-generative-ai-improve-hazard-identification/
[^16^] LOPA: Layer of Protection Analysis Explained (CCPS 2001; IEC 61511-3 Annex F), silsafe.net — https://silsafe.net/layer-of-protection-analysis-lopa/
[^17^] Layers of Protection Analysis (scenario screening criteria), Primatech — https://www.primatech.com/technical/layers-of-protection-analysis
[^18^] Sanders, Chemical Process Safety: Learning from Case Histories (OSHA 1910.119 MOC / replacement-in-kind text) — https://elmoukrie.files.wordpress.com/2022/06/sanders-roy-e-chemical-process-safety-fourth-edition_-learning-from-case-histories-elsevier_butterworth-heinemann-2015.pdf
[^19^] PSM Management of Change Guide, 29 CFR 1910.119(l), Ecesis — https://www.ecesis.net/PSM-Software/management-of-change-psm.aspx
[^20^] Hansen, Management of Change (facility/technology change examples), Professional Safety (ASSP) — https://aeasseincludes.assp.org/professionalsafety/pastissues/053/10/F2_Hansen_1008.pdf
[^21^] Steel Plant Permit-to-Work (7% PTW incident causation; 50.7% gas-testing error; 85% preventable), OxMaint — https://oxmaint.com/industries/steel-plant/steel-plant-permit-to-work-hot-work-confined-space-workin-at-height
[^22^] Digital Permit-to-Work: Hot Work & Confined Space (automatic conflict checks), iFactory — https://ifactoryapp.com/industries/manufacturing-plant/permit-to-work-hot-work-confined-space-digital
[^23^] Analyzing Arizona OSHA Injury Reports Using Unsupervised Machine Learning — https://www.researchgate.net/publication/301221138
[^24^] Text mining and natural language processing in construction research (Qiao et al., 0.91/0.90 accuracy on 4,770 OSHA reports), Front. Built Environ. — https://www.frontiersin.org/journals/built-environment/articles/10.3389/fbuil.2026.1815172/full
[^25^] Data-Driven Approaches for Risk Assessment in the Chemical Processing Industry (NLP of incident narratives), Memorial Univ. thesis — https://research.library.mun.ca/16277/1/thesis.pdf
[^26^] What is Loss of Primary Containment (LOPC)? API RP 754 tiers — https://www.smartqhse.com/what-is/loss-of-primary-containment
[^27^] Alarm Rationalization and Implementation (ISA-18.2 lifecycle; audit entry point), Rockwell Automation white paper — https://literature.rockwellautomation.com/idc/groups/literature/documents/wp/proces-wp015_-en-p.pdf
[^28^] Alarm Management ISA 18.2 Rationalization and Alarm Flooding (EEMUA 191 thresholds; MADB workflow), iFactory — https://ifactoryapp.com/industries/oil-and-gas/alarm-management-isa-18-2-rationalization-flooding
[^29^] Alarm Management and Rationalization: ISA-18.2 Explained (Priority 1 <5% rule) — https://www.instrumentationblog.in/alarm-management-isa-18-2/
[^30^] Chemical Storage Guidelines (compatibility storage groups; NOAA CRW/CAMEO), Princeton EHS — https://ehs.princeton.edu/laboratory-research/chemical-safety/storage
[^31^] Emergency Response Planning Guidelines (ERPGs) — how ALOHA uses ERPGs, NOAA — https://response.restoration.noaa.gov/oil-and-chemical-spills/chemical-spills/resources/emergency-response-planning-guidelines-erpgs.html
[^32^] DOE 10 CFR 1021 TSD (AEGL/ERPG/TEEL LOC selection guidance) — https://www.energy.gov/sites/default/files/2024-04/doe-10-cfr-1021-tsd-2024-04-30-final.pdf
[^33^] Celebrating 40 Years of ERPGs (150 chemicals; EPA RMP reference; CAMEO/ALOHA integration), AIHA — https://www.aiha.org/blog/celebrating-40-years-of-erpgs
[^34^] Australia Group (AG), NTI Education Center — https://www.nti.org/education-center/treaties-and-regimes/australia-group-ag/
[^35^] Chemical Weapons Convention Schedule 2/3 Export Declaration (schedule sizes, workflows), Terra Insight — https://www.terra-insight.com/insights/chemical-weapons-convention-schedule-2-3-export-declaration-indian-reconciliation/
[^36^] Top 10 Best ECCN Software (AEB AI assistant >95% accuracy), ZipDo — https://zipdo.co/best/eccn-software/
[^37^] How to Reduce False Positives in AML Screening (Federal Reserve 2025 working paper: 92% FP reduction, +11% detection), Sigma360 — https://www.sigma360.com/reduce-false-positives-in-aml-screening/
[^38^] How Fuzzy Matching Reduces AML Screening False Positives (OFAC edit-distance/Jaro-Winkler/Soundex), Binderr — https://binderr.com/resources/fuzzy-matching-guide
[^39^] EPCRA Tier II Reporting: The Top 10 Errors Checklist, Encamp — https://encamp.com/blog/epcra-tier-ii-reporting-the-top-10-errors-checklist/
[^40^] TRI Back Reporting (EPA data-quality error definitions), Trinity Consultants — https://trinityconsultants.com/resources/tri-back-reporting/
[^41^] TRI Toxic Release Inventory Reporting (common mistakes), ERA Environmental — https://www.era-environmental.com/blog/tri-toxic-release-inventory-reporting
[^42^] Process Safety Leading Indicators API RP 754 Tier 1 to 4, iFactory — https://ifactoryapp.com/industries/oil-and-gas/process-safety-leading-indicators-api-rp-754-tier
[^43^] How Automation Enhances Safety in Chemical Processing Plants (pilot KPI set), Fireballz — https://www.fireballz.ai/post/how-automation-enhances-safety-in-chemical-processing-plants
[^44^] Implementing Real-Time Risk Dashboards in Oil & Gas (leading-indicator priority), iFluids — https://ifluids.com/blog/real-time-risk-dashboards-oil-and-gas/
[^45^] AI in Process Safety Management for Oil & Gas (human sign-off remains a regulatory requirement), iFluids — https://ifluids.com/blog/ai-process-safety-management-oil-gas/
[^46^] Mastering Compliance with Safety Data Sheet Authoring Software, NextSDS — https://nextsds.com/blog/safety-data-sheet-authoring-software/
[^47^] Global Safety Data Sheet Compliance Differences by Country, SDS Quantum — https://www.sdsquantum.com/post/global-sds-compliance-differences-by-country
[^48^] REACH & CLP Inspections 2026–2027: What to Expect, EPY — https://www.epy.it/reach-clp-inspections-2026-2027-preparation/?lang=en
[^49^] What is LOPA? 2026 Complete Guide (IPL independence/effectiveness/auditability tests), SmartQHSE — https://www.smartqhse.com/safety-blog/what-is-lopa-layer-of-protection-analysis-2026
[^50^] LOPA Risk Calculator (CCPS severity–TRT ladder), Safeguard Projects — https://safeguardprojects.com/lopa-calculator.html
[^51^] ISA-18.2 Alarm Management: Practitioner Guide (2,000–5,000 alarms; weeks–months rationalization) — https://processcontrolguide.com/isa-18-2-alarm-management/
[^52^] National LEPC-TEPC Handbook (ALOHA description), mass.gov — https://www.mass.gov/doc/national-lepc-tepc-handbook/download
[^53^] Revisions and Clarifications to the EAR — Chemical and Biological Weapons Controls: Australia Group; CWC, Federal Register — https://www.federalregister.gov/documents/2002/05/31/02-13581/
[^54^] EPA Enforcement of EPCRA and General Duty Clause Requirements (TRI/Tier II penalties), EHS Daily Advisor — https://ehsdailyadvisor.com/2024/01/epa-enforcement-of-epcra-and-general-duty-clause-requirements/

*Method note: catalog grounded in 20 independent web searches (coarse-to-fine across SDS/GHS ML, HAZOP/LOPA AI, MOC, PTW, incident NLP, alarm standards, compatibility, emergency response, export control, sanctions screening, EPCRA reporting, and API RP 754 KPIs). Verbatim excerpts quoted inline with citation markers.*
