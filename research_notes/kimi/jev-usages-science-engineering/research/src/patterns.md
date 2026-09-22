> ## Documentation Index
> Fetch the complete documentation index at: https://docs.typesafe.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Patterns

> Architectural patterns for building systems with TypeSafe.

TypeSafe is designed to sit within a larger system, powering decisions with AI. Learning to think in terms of discrete, atomic decisions that compose into complex system behavior is a key skill for getting the most out of TypeSafe.

This section assumes you know the [TypeSafe primitives](/primitives) and understand [how confidence works](/confidence). If not, read those first.

## The patterns

| Pattern                                                  | What it does                                                                                               | Benefits                 |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------ |
| [Speculative Fan-Out](/patterns/fan-out)                 | Send many questions in a single call, including speculative ones, and let your code decide what's relevant | Cost, Speed              |
| [Confidence-Gated Routing](/patterns/confidence-routing) | Utilize confidence as a second decision axis to build safer systems                                        | Reliability, Safety      |
| [Composite Scoring](/patterns/composite-scoring)         | Combine several dimensions of analysis into a single score                                                 | Cost, Reliability, Speed |
| [Intent Routing](/patterns/intent-routing)               | Classify a user's intent and route to the appropriate handler                                              | Cost, Speed              |

<Tip>
  We're always keen to learn how people are making use of our primitives. If you've found a killer use case you think should be mentioned here, feel free to drop us a note!
</Tip>
