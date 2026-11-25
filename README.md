# Cognition-Gated Development

[中文](./README.zh-CN.md) · v1.0 · MIT

**Let AI write the code. Keep the project yours.**

A drop-in set of guardrails for AI coding agents. A spec defines *what to build, what the shared names are, and what "done" means*; scripts check that the code follows it; and you decide at only two points: **freezing the spec** and **reviewing the result**.

## Why

After a few rounds of agent-written code, it's common that:
- the code runs, but you can no longer explain its structure;
- files name things independently, so HTML and CSS (or frontend and backend) disagree;
- the docs say one thing and the code does another;
- rules like "don't touch the directory layout" or "no new dependencies" live only in a prompt, and the model may ignore them.

This project doesn't rely on the model's good behavior. It turns the key constraints into **a visible spec** and **checks you can run**.

## What's inside

| Piece | Role |
| :--- | :--- |
| `AGENTS.md` | Rules for the agent: triage into S/M/L, red lines that force a stop, a green zone for direct fixes, risk-sized testing. Read automatically by most coding agents |
| `@cognition-architect` | Writes the spec `COGNITION.md`: intent, an **interface contract table**, executable acceptance criteria |
| `@dispatcher` | Splits large work across parallel subagents, each owning its files exclusively; also runs the debug fast-track and syncs code changes back into the spec |
| `check_contract.py` | Verifies the code against the contract table, and flags unregistered shared names, dangling ID/class references, and broken file references |
| `check_redlines.py` | Checks git changes for new dependencies, structure changes, and credential files |

Both skills use the open SKILL.md format and aren't tied to Trae, Claude Code, or any model. Model choice lives in `AGENTS.md` as "reasoning tier / coding tier".

## Flow

Triage first; process weight follows the size of the change:

```
[Request] → triage S / M / L
   S ──→ edit directly ───────────────────────────────→ [acceptance + diff review]
   M ──→ COGNITION.md ─→ human freeze ─→ implement ────→ [acceptance + diff review]
   L ──→ COGNITION.md ─→ human freeze ─→ DISPATCH.md ─→ human approve
            ─→ parallel subagents (file ownership + shared contract) ─→ [acceptance + diff review]
```

Execution, retries, and self-healing are left to the agent. Crossing a red line (structure changes, public interface changes, new dependencies, data or production risk) makes the agent stop and hand back to you.

## In practice: the tetris example

[examples/tetris/](./examples/tetris/) walks through the M-tier flow end to end:

- the spec has 38 interface contracts and 6 acceptance criteria;
- the contract check passes 84 verifications, all 12 automated tests pass, plus 2 manual checks;
- it found and fixed 2 bugs from the old version (all keys were intercepted so F5 didn't work; a new piece dropped a row right after a hard drop);
- the old version's "HTML and CSS used different class names" failure is now caught directly by `check_contract.py`.

The original v0 record is kept in `examples/tetris/v0-record/` for comparison.

## Quick start

```bash
# Install rules, skills, and check scripts into your project (--tool trae for Trae, --tool claude for Claude Code)
python scripts/install_skills.py <your-project> --tool agents
```

Edit §7 (project commands) and §8 (capability tiers) in the target project's `AGENTS.md`, then:

```
@cognition-architect I want to build ...
```

## Relationship to Spec-Driven Development

Same idea as AWS Kiro and GitHub spec-kit: spec first. If you already use them, you can borrow just the pieces added here: **executable interface contracts**, **file-ownership parallel splits**, **red-line checks**, and **reverse sync** from code to spec.

## More

- [docs/HOW_TO_START.md](./docs/HOW_TO_START.md): full guide and FAQ (Chinese)
- [docs/ENFORCEMENT.md](./docs/ENFORCEMENT.md): making red lines actually enforced (Chinese)
- [CHANGELOG.md](./CHANGELOG.md)

Docs and skills are written in Chinese (the author's working language); the workflow itself is language-agnostic.

## License

MIT
