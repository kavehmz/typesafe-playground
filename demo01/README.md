# Demo 01 — Decision Lab

A small, live experiment with TypeSafe: a support message becomes six independent judgments in one API request. Plain JavaScript composes those answers into a **routing preview**. No support ticket is sent and no refund is issued.

## Run in Docker or Podman

From this directory:

```sh
docker compose up --build -d
```

Open **http://localhost:3001**. The Compose file also works with an existing Podman Compose provider (`podman compose`). No host packages or dependencies are installed. The Node image runs a dependency-free HTTP server and serves the frontend.

The parent `../.env` is injected at container runtime. Your existing `TYPESAFE_API` name is supported, as is the standard `TYPESAFE_API_KEY` (which takes precedence). Optional `TYPESAFE_MODEL` defaults to `jev-latest`. The credential is never sent to the browser, logged, or included in the image. The image build context is only `demo01`, with an explicit file allowlist.

If port 3001 is taken:

```sh
DEMO_PORT=3002 docker compose up --build -d
```

After changing the credential:

```sh
docker compose up -d --force-recreate
```

Stop this demo:

```sh
docker compose down
```

## First experiment

1. Evaluate **Double charge**. Inspect the owning team and refund signal.
2. Try **A human, please**. An explicit human request overrides automatic team routing.
3. Try **Missing context**. The `other` option avoids forcing an unsuitable team.
4. Move the confidence slider. Routing changes locally without another model request.
5. Open the distributions and **Under the hood** to inspect the full question definitions, state, response, token counts, measured duration and policy result.
6. Run the sample suite: six live requests compare selected teams with six hand-written labels. Synthetic examples are a smoke test, not a claim of general accuracy.

Text submitted for evaluation is sent to TypeSafe's HTTPS API. Results live in browser memory, with no database, analytics or persistent ticket history. Editing the input clears previous results to prevent stale decisions.

## What this tests

| Primitive | Judgment | How code uses it |
| --- | --- | --- |
| Choice | Owning team | Route only above the configured confidence threshold; `other` always goes to review. |
| Noul | Human requested | Explicit yes overrides automatic routing; an uncertain value goes to review. |
| Noul | Refund requested | Flag only on an automatically routed billing case; never authorize a refund. |
| Noul | Reproduction steps | Flag only on an automatically routed technical case. |
| Score | Urgency, four levels | Normalize to 0–1, gate on confidence, then compare to the high-priority threshold. |
| Score | Frustration, three levels | Visible for observation; deliberately excluded from urgency and routing. |

A **confirmed service incident** supplied by the user makes an automatically routed technical case high priority. Account plan is included as context for inspection but grants no routing preference. The browser labels signals as used, unused, or observe based on the current code path. Uncertainty in unused branches does not block a decision.

Confidence describes distribution concentration, not probability that the whole workflow is correct. Noul has no separate confidence; at the default 80% threshold, values above or equal to 80% mean yes, below or equal to 20% mean no, and the middle needs clarification. These thresholds are experimental, not validated business rules.

## Measurements and limits

- Timing covers the server's TypeSafe request, response validation and any retry backoff; it is not pure model inference time. It excludes browser-to-server transport.
- Actual API input/output tokens and HTTP attempts are shown. There is no dollar estimate because pricing may depend on the model/account.
- The app sends all six questions in one request. Only HTTP 429/529 retry automatically (at most three total attempts, bounded backoff); 20-second per-attempt timeout. Attempts including retries appear in the UI.
- The configured key badge means only that a key exists. An evaluation verifies live access.
- Model output is validated before making any decision. A service failure shows an error; there are no invented fallback model answers.
- The service is bound to the Mac's loopback interface and permits one evaluation at a time. This is a local demo, not an authenticated production service.

## Test inside the container

```sh
docker compose run --rm app node --test tests/*.test.mjs
```

The tests use synthetic responses to test application behavior independently of model quality: human handoff, uncertainty, unused branches, no-match handling, incident policy, stale/invalid inputs, response validation, batched requests, bounded retry behavior and credential isolation. The live sample suite tests the actual API separately.

## Files

- `questions.mjs`: question design, sample messages and expected labels.
- `server.mjs`: same-origin HTTP server, validation, timeouts and authenticated API calls.
- `public/policy.mjs`: pure, inspectable decision logic; no network calls.
- `public/app.mjs`: interactive client, local threshold controls and sample suite.
- `compose.yaml` / `Dockerfile`: container runtime and image.

## Source guidance

Built using the [TypeSafe skill](https://github.com/typesafe-ai/skills/blob/main/skills/typesafe-ai/SKILL.md) as session-only guidance. The skill was not installed.

Current contracts and design guidance were checked against the [HTTP API](https://docs.typesafe.ai/api), [Choice](https://docs.typesafe.ai/primitives/choice), [Noul](https://docs.typesafe.ai/primitives/noul), [Score](https://docs.typesafe.ai/primitives/score), [fan-out pattern](https://docs.typesafe.ai/patterns/fan-out) and [parallel questions cookbook](https://docs.typesafe.ai/cookbooks/parallel_questions).
