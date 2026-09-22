# Kimi K3 swarm: Jev usages in science and engineering

Research output from a Kimi K3 agent swarm, run on 2026-09-21. Same question as
the `astra/` and `fable/` folders: where can a System One model like Jev improve
or automate work in engineering, physics, mathematics and the chemical industry.

All 71 original files are kept unchanged, with their original names. Only this
README and `REPORT.md` are new.

## Start here

- `REPORT.md` — the final report as Markdown. Converted from
  `docx/Judgment_Layer_Jev_Usage_Catalog.docx` with pandoc, then cleaned up.
  About 42,000 words, 8 chapters, 17 tables, 21 equations, 391 footnoted
  references and one figure. Nothing from the docx was dropped: every paragraph,
  footnote, number and table cell was checked against the docx text.
- `jev_usages.agent.outline.md` — the plan the swarm wrote before researching.
- `jev_usages_ref.md` — the 391 references as a plain numbered list.
- `jev_usages_citation.jsonl` — the same references as one JSON object per line.

## Folders

| Folder | What it holds |
|---|---|
| `docx/` | The three Word originals, each with a Markdown twin of the same name. All three hold the same report text (checked paragraph by paragraph); they differ only in citation format. `Judgment_Layer_Jev_Usage_Catalog.docx` is the final version and is what `REPORT.md` comes from. `jev_usages.agent.final.footnote.docx` is the same build with footnotes. `jev_usages.agent.final.base.docx` has superscript citation numbers in the text and no footnote list. |
| `drafts/` | The swarm's own Markdown of the final report, with `[^N^]` citation marks. Same text as `REPORT.md`; only the citation format and equation markup differ. |
| `sections/` | Chapters 1 to 8 as separate drafts, `jev_usages_sec01.md` to `jev_usages_sec08.md`. |
| `research/` | The 13 research "dimensions" the swarm ran in parallel, `jev_usages_dim01.md` to `jev_usages_dim13.md`, plus `jev_usages_insight.md` (cross-dimension patterns) and `jev_usages_cross_verification.md` (confidence tiers and conflicts). |
| `research/src/` | Snapshots of the TypeSafe docs, cookbooks and launch blog the swarm read, fetched 2026-09-21. |
| `media/` | `jev_sec04_alarm_rates.png`, the one figure, used in chapter 4. |

## Dimension map

| File | Topic |
|---|---|
| dim01 | Capability grounding from vendor docs |
| dim02 | Software engineering |
| dim03 | Systems and infrastructure |
| dim04 | Control systems, robotics, industrial automation |
| dim05 | Asset-intensive engineering: maintenance, grid, aero, auto, rail, maritime |
| dim06 | High-energy and nuclear physics |
| dim07 | Astronomy and experimental physics |
| dim08 | Mathematics: theorem proving and formal verification |
| dim09 | Mathematics: symbolic computation and optimisation |
| dim10 | Chemical process operations |
| dim11 | Chemistry laboratory and QC |
| dim12 | Chemical safety, regulatory, compliance |
| dim13 | Cross-cutting theory and economics |

## How the Markdown files were made

`REPORT.md` and the two `docx/*.md` twins were each converted with pandoc in a
container:

```sh
docker run --rm -u 0 -v "$PWD":/data -w /data pandoc/core:latest \
  -f docx -t gfm --wrap=none --markdown-headings=atx --extract-media=media \
  -o REPORT.md docx/Judgment_Layer_Jev_Usage_Catalog.docx
```

Then a small script:

- replaced the extracted figure with a link to `media/jev_sec04_alarm_rates.png`
  (the same bytes);
- removed pandoc's `\[` `\]` escapes around `[J]`, `[EB/OL]` and numbered
  references, and `\_` escapes inside URLs;
- dropped bold markers inside headings.

Equations use GitHub's math syntax (`` $`...`$ `` and ```` ```math ```` blocks).
Dollar amounts stay escaped as `\$` so GitHub does not read them as math.
