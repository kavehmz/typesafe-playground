# Verification — 2026-09-17

The demo was built and run with the existing Podman engine through Docker Compose, bound to `127.0.0.1:3001`. No packages were installed on the Mac.

## Application checks

All **13 containerized tests passed** on the final build. Coverage includes explicit human handoff, uncertain human requests, unused speculative answers, threshold recomposition, no-match handling, incident priority, response/input validation, retry handling, credential isolation, HTTP integration and missing configuration.

## Live TypeSafe sample run

These are observed results from one run of six synthetic examples using the configured API credential and `jev-latest`. They are not a representative accuracy benchmark or a latency guarantee.

| Sample | Expected team | Observed team | Confidence | API round trip |
| --- | --- | --- | --- | --- |
| Double charge | Billing | Billing | 100% | 715 ms |
| Checkout is down | Technical support | Technical support | 100% | 355 ms |
| A human, please | Billing | Billing | 100% | 418 ms |
| Lost password | Account support | Account support | 100% | 570 ms |
| Plan comparison | Sales | Sales | 100% | 308 ms |
| Missing context | General review | General review | 91% | 328 ms |

All six team selections matched their hand-written labels. Each case used one HTTP attempt with all six questions together. Timing is measured by the server around the API call; it includes network time.

## Browser checks

- A separate double-charge evaluation returned Billing, a 99% refund-request probability, 955 input / 135 output tokens and 920 ms round trip.
- Raising the yes/no threshold from 80% to 99% changed that saved result to Human review; the raw answers and request metrics were unchanged. Restoring the threshold restored the original policy.
- Selecting a different sample cleared the prior results before a new evaluation.
- On the final build, the human-handoff example returned 99% probability of requesting a human, 98% probability of requesting a refund and Billing as the owning team. Code chose **Human support**, marked team and refund signals unused on that path, and separately flagged priority for review because urgency confidence was 26%.
- The final handoff evaluation used 965 input / 135 output tokens, one HTTP attempt, and 853 ms API round trip.
- The normal desktop page layout was visually inspected. No browser console warnings or errors appeared in the checked session.

The app previews decisions only. No real ticket routing, refund, email or external workflow action was performed.
