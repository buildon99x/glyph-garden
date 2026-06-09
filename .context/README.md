# Project Context

`.context/` stores project knowledge for maintainers and coding agents. Keep it concise, current, and operational.

Use this area for knowledge that helps future work:

- decisions that constrain implementation,
- lessons learned from mistakes or experiments,
- repeatable playbooks for common tasks.

Do not put product-facing specs here. Use `docs/` for documents that should be read as project artifacts.

## Structure

| Path | Purpose |
|------|---------|
| `.context/kb/adr/` | Architecture Decision Records |
| `.context/kb/lrn/` | Lessons learned and troubleshooting notes |
| `.context/kb/playbook/` | Repeatable workflows and operating procedures |

## Rules

- Add a short index entry when adding a new knowledge item.
- Prefer one focused file over one growing catch-all document.
- Use dates in filenames for chronological knowledge.
- Keep entries factual: what happened, why it mattered, what to do next time.
