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

## Relationship to Spec-Driven Development

This project is an independent, philosophy-first take on what the industry now calls **Spec-Driven Development (SDD)** — the same family as AWS **Kiro**, GitHub **spec-kit**, and other "spec-first" agent workflows. We reinvented the wheel from principles, and that's a validation: the concept is sound.

What this project adds beyond generic SDD:

- **Cross-file interface contract** — explicitly unifies naming (DOM IDs, CSS classes, module exports) *before* parallel executors run, preventing the classic "HTML and CSS disagreed on class names" failure.
- **Layered error recovery** — self-heal → router fix → cloud query (via a minimal-context "three-piece" debug protocol) → human final review.
- **Complexity triage** — not every task deserves the full dual-document + dual-review ceremony (see below).

## Complexity Triage (scale-adaptive)

The biggest weakness of rigid spec-driven workflows is over-ceremony. This project grades every request before choosing a process weight:

| Tier | When | Process |
| :---: | :--- | :--- |
| **S — Light** | Single file, style/copy/config, < 100 lines | Short plan inline, execute directly. No docs, no gates. |
| **M — Standard** | 2–5 files, clear module boundary | Trimmed `COGNITION.md` → review → execute inline (skip `DISPATCH.md`). |
| **L — Complex** | > 5 files, multi-module, external deps, parallel executors | Full flow: `COGNITION.md` → review → `DISPATCH.md` → review → execute. |

The router skill is **only invoked for L-tier** tasks. S and M stay lightweight.

## How It Works (3 Files, No Setup Required)

Copy these 3 files to any project root:

| File | Role |
| :--- | :--- |
| `.trae/skills/cognition-architect/SKILL.md` | Cloud architect - turns fuzzy requirements into detailed `COGNITION.md` |
| `.trae/skills/local-router/SKILL.md` | Local router - decomposes plan into executable tasks as `DISPATCH.md` |
| `.ai_rules` | Permission boundary enforcement |

No local models, no hardware, no dependencies. The entire workflow runs on your existing AI platform via Skill constraints.

## Workflow

> Start by triaging: **S** = skip straight to a short inline plan; **M** = one `COGNITION.md` + review; **L** = the full 7 steps below.

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