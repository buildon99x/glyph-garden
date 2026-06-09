# Plan: Project Knowledge Management

- Status: Completed
- Date: 2026-06-09
- Owner: Project maintainers

## Objective

Create a lightweight knowledge management structure for project context and project documents.

## Steps

1. Add `.context/kb/adr/`, `.context/kb/lrn/`, and `.context/kb/playbook/`.
2. Add `docs/specs/`, `docs/plans/`, and `docs/raw/`.
3. Add README files with purpose, naming guidance, templates, and indexes.
4. Seed the knowledge base with current project decisions and lessons.
5. Update AGENTS.md so coding agents know when to read or update the knowledge base.

## Risks

- Risk: Documentation becomes stale.
  - Mitigation: Keep README indexes short and update entries when new files are added.
- Risk: Agents write everything into `.context`.
  - Mitigation: Keep the distinction clear: `.context` is durable working knowledge, `docs` is shareable project documentation.
- Risk: Raw material leaks private data.
  - Mitigation: Redact secrets and private data before committing raw files.

## Verification

- Directory structure exists.
- Template README files exist.
- `npm run check` passes.

## References

- `docs/specs/project-knowledge-management.md`
- `.context/README.md`
- `AGENTS.md`
