# Knowledge Base

This knowledge base is for durable project context that should survive across sessions.

## Areas

- `adr/`: decisions that affect architecture, dependencies, workflow, or module boundaries.
- `lrn/`: lessons learned from debugging, failed approaches, verification gaps, and user corrections.
- `playbook/`: step-by-step procedures for repeated work.
- `archive/`: retired knowledge that remains searchable but no longer guides active work.

## Naming

Use lowercase kebab-case filenames:

- ADR: `0001-short-decision-title.md`
- Learning: `YYYY-MM-DD-short-topic.md`
- Playbook: `short-workflow-name.md`

## Update Triggers

Add or update an entry when:

- a decision will constrain future implementation,
- a bug or failed approach teaches a reusable lesson,
- a workflow is repeated twice,
- the user corrects the project process,
- a release, deployment, or verification flow changes.
