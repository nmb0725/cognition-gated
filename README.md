# Cognition-Gated Development

A human-in-the-loop AI development workflow built around **developer sovereignty**: AI writes most of the code, but you decide the architecture, the interfaces, and what "done" means, and you can still read the result.

```
[Request] → triage S / M / L
   S ──→ edit directly ───────────────────────────────→ [acceptance + diff review]
   M ──→ COGNITION.md ─→ human freeze ─→ implement ────→ [acceptance + diff review]
   L ──→ COGNITION.md ─→ human freeze ─→ DISPATCH.md ─→ human approve
            ─→ parallel subagents (file ownership + shared contract) ─→ [acceptance + diff review]
```

## Philosophy

The faster AI edits code, the easier it is to lose understanding of your own project. This workflow puts human gates only where direction is decided:

1. **Spec freeze**: you approve intent, interface contracts, and acceptance criteria.
2. **Result review**: you review acceptance results and the diff, instead of watching every line being written.

Execution, retries, and self-healing are left to the agent. Red lines (structure changes, interface changes, new dependencies, data or production risk) force the agent to stop.

## Relationship to Spec-Driven Development

This project belongs to the same family as AWS Kiro and GitHub spec-kit. What it adds:

- **Executable interface contract + file ownership**: all shared names (DOM IDs, CSS classes, exports, paths) go into a contract table that `check_contract.py` verifies against the code, including a reverse check for unregistered shared names; parallel tasks own their files exclusively.
- **Complexity triage**: no ceremony for S-tier work; the full flow only for L-tier.
- **Red lines / green zone**: green-zone fixes can be batched during debugging; red lines halt the agent.
- **Reverse sync**: `@dispatcher sync` writes real code changes back into the spec so docs and code don't drift.

## Quick start

```bash
# Install rules and skills into your project (use --tool trae for Trae)
python scripts/install_skills.py <your-project> --tool agents
```

Edit §7 (project commands) and §8 (capability-tier mapping) in the target project's `AGENTS.md`, then:

```
@cognition-architect I want to build ...
```

| File | Role |
| :--- | :--- |
| `AGENTS.md` | Triage, red lines, green zone, acceptance, command policy. Read automatically by most coding agents |
| `.agents/skills/cognition-architect/` | Turns requests into a reviewable, testable spec `COGNITION.md` |
| `.agents/skills/dispatcher/` | L-tier decomposition and dispatch, debug fast-track, sync |
| `scripts/check_contract.py` | Verifies code against the contract table in COGNITION.md and flags unregistered shared names |
| `scripts/check_redlines.py` | Checks git changes against red lines, independent of the model |

Skills use the open SKILL.md format and are not tied to any tool or model. Model choice lives in `AGENTS.md` §8 as capability tiers.

## More

- [docs/HOW_TO_START.md](./docs/HOW_TO_START.md): full guide and FAQ (Chinese)
- [docs/ENFORCEMENT.md](./docs/ENFORCEMENT.md): making red lines actually enforced (Chinese)
- [examples/tetris/](./examples/tetris/): a full v1 M-tier walkthrough (with the original v0 record for comparison)
- [CHANGELOG.md](./CHANGELOG.md)

Docs and skills are written in Chinese (the author's working language); the workflow itself is language-agnostic.

## License

MIT
