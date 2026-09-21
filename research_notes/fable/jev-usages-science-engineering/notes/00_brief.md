# Shared brief: what we are researching and why

Every researcher reads this first. The report writer reads it too.

## The question

Where could a System One model like **Jev** improve, better automate, or enhance
established work in four separate fields?

1. Engineering
2. Physics
3. Mathematics
4. Chemical industry

Each usage must rest on an established theory, standard, practice, or published paper.
The final product is a comprehensive, grounded list of usages per field.

## What Jev is (capability envelope)

Jev is TypeSafe's first "System One" model. Docs: https://docs.typesafe.ai/llms.txt

- Input: text only. A `state` (string, JSON object, or array of text) plus typed questions.
- Output: no generated text. Only three typed answers, each with probabilities:
  - **Choice**: pick one option from a defined set. Returns a probability per option plus confidence.
  - **Noul**: probability that a yes/no condition holds.
  - **Score**: position on ordered, described levels. Returns a probability per level.
- Probabilities are trained to be calibrated (RLCD training). They can be thresholded,
  weighted, or fed to a classical ML model as features.
- Many independent questions over one state run in parallel in one request. They cannot see each other.
- Same weights for everyone. No fine-tuning. Domain knowledge goes into `state`, `instructions`, and `criteria`.
- Price: about $0.04 per million input tokens. Output is free.
  A 1,000-token judgment costs about $0.00004, so about 24,000 judgments per dollar.
  One million 2,000-token documents cost about $84.
- Speed: under 100-150 ms per request today. Under 10 ms is planned.
- Context: 64k tokens per request, 32k for state plus the longest question. 1M is possible later.
- Rate limit today: 250,000 tokens per second, 1,200 requests per minute.

## Known weak spots (be honest about these)

- Not a calculator. Weak at arithmetic, counting, numeric precision, comparing raw numbers.
- Weak at date and time comparison.
- Weak at multi-hop indirection and double negatives. It reads literally.
- Accuracy drops when the state is large and full of irrelevant detail.
- Can be steered by adversarial text inside the state.
- Does not generate text, code, proofs, or explanations.
- Text only. Images, spectra, waveforms, and raw sensor streams must first be turned into
  text, named buckets, or structured fields by code or by another model.
- English is strongest.

Consequence: code (or another tool) must own numerics, physics solvers, signal processing, and
exact lookups. Jev supplies the semantic judgment in between.

## Fit test for a usage

A usage is a good fit when most of these hold:

- The decision is a semantic judgment over text or structured state, not arithmetic.
- The answer space is closed: one of N, yes/no probability, or a graded level.
- Numeric parts can be computed in code and passed in as named facts or buckets.
- Today the task is blocked by volume, latency, cost, scarce experts, or brittle keyword rules.
- A wrong answer is recoverable: low confidence escalates to a person or a reasoning model.

## Roles Jev can play (pattern catalogue)

Use these names when you describe how Jev fits. Add new roles if you find them.

- **Triage / router**: classify and route reports, alarms, tickets, alerts, papers.
- **Screening at scale**: map-reduce one judgment over a huge corpus (literature, patents, incident databases, logs).
- **Semantic predicate in a rule engine**: a rule's condition is a Noul instead of a keyword match.
  Links to expert systems, fuzzy logic, production systems, and the knowledge-acquisition bottleneck.
- **Heuristic inside a search loop**: policy prior or value estimate that prunes a search tree
  (premise selection, tactic choice, route pruning, design-space pruning). Only viable because a call
  costs almost nothing and takes milliseconds.
- **Verifier / process-reward model**: check each step of a human or LLM output against a rule or source.
- **Feature extractor**: turn free text into calibrated numeric features for classical ML, weak supervision, or active learning.
- **Supervisory layer over numeric control**: code senses and computes; Jev picks the mode, procedure, or manoeuvre from a closed set.
- **Entity / record alignment**: decide whether two records, names, or descriptions mean the same thing.
- **Clause-by-clause compliance check**: judge a document or design description against each requirement of a code or standard.
- **Select, do not generate**: code finds candidate values or spans; Jev selects the right one.

## What each researcher must deliver

Aim for breadth first, then depth on the best ones. Target 25 to 40 distinct usages in your subtopic.
Group them by subfield. For each usage give:

1. **Name** and subfield.
2. **Established practice today**: the standard, method, theory, or workflow it sits in. Cite it.
3. **Pain point**: volume, latency, cost, scarce experts, inconsistency, brittle rules.
4. **How Jev fits**: role from the catalogue, primitive(s), what goes in `state`, an example question with its answer set.
5. **Why cheap and fast matters here**: what becomes possible at $0.04/Mtok and 10-100 ms that was not before.
6. **Evidence**: papers, benchmarks, or deployed systems showing that text classifiers, NLP, or LLMs already work
   (or fail) on this task. Give title, authors or body, year, and URL. Do not invent citations. Mark anything you could not verify.
7. **Fit rating**: Strong, Medium, or Speculative. Name the main risk (numeric, multi-hop, safety-critical, adversarial, needs non-text input, and so on).

Also deliver:

- **Top 5** usages in your subtopic by likely value, with one line of reasoning each.
- **Poor fits**: tasks in your subtopic that look tempting but break on Jev's weak spots. Say why.
- Any **new role** that the catalogue above is missing.

Sources to prefer: peer-reviewed papers, arXiv preprints, standards bodies (ISO, IEC, ISA, IEEE, API, ASME, NFPA, ASTM, INCOSE, IUPAC, ECHA, OSHA, CSB),
textbooks, and authoritative industry guidance. Research is current to September 2026.
