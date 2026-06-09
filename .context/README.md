# Project Context

`.context/` stores durable working knowledge for maintainers and coding agents. It should help future sessions understand decisions, avoid repeated mistakes, and follow proven workflows.

Do not put product-facing specs, plans, raw source material, or release-facing documents here. Use `docs/` for those project artifacts.

## Current Structure

| Path | Purpose | Index |
|------|---------|-------|
| `.context/kb/` | Knowledge base root and naming/update rules | `.context/kb/README.md` |
| `.context/kb/adr/` | Architecture Decision Records | `.context/kb/adr/README.md` |
| `.context/kb/lrn/` | Lessons learned, troubleshooting notes, and process corrections | `.context/kb/lrn/README.md` |
| `.context/kb/playbook/` | Repeatable workflows and operating procedures | `.context/kb/playbook/README.md` |
| `.context/kb/archive/` | Retired knowledge that remains searchable but no longer guides active work | `.context/kb/archive/README.md` |

## Active Knowledge

Current seeded entries:

- ADR: `.context/kb/adr/0001-use-release-please-for-changelog.md`
- Lessons:
  - `.context/kb/lrn/2026-06-09-product-only-changelog.md`
  - `.context/kb/lrn/2026-06-09-large-files-agent-risk.md`
- Playbooks:
  - `.context/kb/playbook/change-verification.md`
  - `.context/kb/playbook/debug-gameplay-rule.md`
  - `.context/kb/playbook/release-changelog.md`

## When to Use `.context/`

Use `.context/` when the knowledge is operational and should affect future work:

- a decision constrains implementation,
- a failed approach teaches a reusable lesson,
- the user corrects the project process,
- a workflow is likely to be repeated,
- an old rule should be archived instead of deleted.

Use `docs/` instead when the document is a spec, plan, raw log, glossary, checklist, or product/project artifact intended for broader reading.

## Maintenance Rules

- Add a short index entry when adding a new knowledge item.
- Prefer one focused file over one growing catch-all document.
- Use dates in filenames for chronological lessons.
- Keep entries factual: what happened, why it mattered, what to do next time.
- Move stale but still useful items to `.context/kb/archive/`; do not leave obsolete guidance in active indexes.
- Do not store secrets, credentials, private messages, or unredacted personal data here.
