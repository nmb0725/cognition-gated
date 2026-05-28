# Cognition-Gated Development

A human-in-the-loop AI-assisted development workflow that prioritizes **developer control over automation speed**.

```
[Vague Requirements]
     ↓
[Cloud Architect] ──→ COGNITION.md (architecture plan)
     ↓
[Human Review] ──→ Freeze
     ↓
[Local Router] ──→ DISPATCH.md (task dispatch)
     ↓
[Human Review] ──→ Approve
     ↓
[Executors] ──→ Production Code
```

## Philosophy

Current AI coding tools (Cursor, Trae Solo, etc.) push an "end-to-end autonomous agent" model that black-boxes your project architecture. This workflow instead uses a **document-driven serial state machine** with mandatory human review gates at every stage.

The core idea: **AI should amplify your intelligence, not replace your understanding of your own code.**

## How It Works (3 Files, No Setup Required)

Copy these 3 files to any project root:

| File | Role |
| :--- | :--- |
| `.trae/skills/cognition-architect/SKILL.md` | Cloud architect - turns fuzzy requirements into detailed `COGNITION.md` |
| `.trae/skills/local-router/SKILL.md` | Local router - decomposes plan into executable tasks as `DISPATCH.md` |
| `.ai_rules` | Permission boundary enforcement |

No local models, no hardware, no dependencies. The entire workflow runs on your existing AI platform via Skill constraints.

## Workflow (7 Steps)

1. **Propose** — `@cognition-architect I want to build ...`
2. **Review** — Read the generated `docs/plans/COGNITION.md`
3. **Route** — `@local-router COGNITION.md is frozen. Decompose.`
4. **Review** — Read the generated `docs/dispatch/DISPATCH.md`
5. **Execute** — Approve and let executors work per dispatch
6. **Handle errors** — Layered recovery (self-heal → router → cloud query → you)
7. **Verify** — Confirm output matches plan

## Example

The `examples/tetris/` directory contains a complete run-through: a pixel-style Tetris game built entirely through this workflow — from architecture plan through dispatch to final code.

## Language

Documentation and skill descriptions are in Chinese (the author's working language). The workflow itself is language-agnostic — use any language for your projects.

## License

MIT