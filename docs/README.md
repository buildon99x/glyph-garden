# Project Documents

`docs/` stores project documents meant to be shared, reviewed, or referenced by humans.

Use `.context/` for internal knowledge base items such as ADRs, lessons learned, and playbooks.

## Structure

| Path | Purpose |
|------|---------|
| `docs/specs/` | Product, feature, system, and behavior specs |
| `docs/plans/` | Implementation plans, rollout plans, and investigation plans |
| `docs/raw/` | Raw source material such as logs, transcripts, copied references, and unprocessed notes |
| `docs/glossary.md` | Shared product and project terms |
| `docs/release-checklist.md` | Human-facing release review checklist |

Existing project notes may live at the `docs/` root. Move them into `specs/` or `plans/` when they become part of an active workflow.

## Rules

- Keep specs outcome-focused and current.
- Keep plans dated and execution-focused.
- Keep raw material unedited except for redacting secrets or private data.
- Link raw material from specs/plans instead of duplicating it.
