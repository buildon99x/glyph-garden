# Spec: Project Knowledge Management

- Status: Accepted
- Date: 2026-06-09
- Owner: Project maintainers

## Problem

Glyph Garden needs a durable way to preserve project decisions, lessons, playbooks, specs, plans, and raw source material so future contributors and coding agents can work from shared context.

## Goals

- Separate internal project context from public/shareable project documents.
- Make it clear where ADRs, lessons learned, playbooks, specs, plans, and raw materials belong.
- Provide templates so new entries are consistent.
- Keep knowledge discoverable through README indexes.

## Non-goals

- Replace Git history.
- Replace source code comments where local code explanation is needed.
- Create a heavy documentation process for every small change.

## Requirements

- `.context/kb/adr/` stores architecture decision records.
- `.context/kb/lrn/` stores lessons learned and troubleshooting notes.
- `.context/kb/playbook/` stores repeatable workflows.
- `docs/specs/` stores specs.
- `docs/plans/` stores implementation and investigation plans.
- `docs/raw/` stores raw source materials, logs, transcripts, and unprocessed notes.
- Each directory has a README with purpose, template, and index.

## Acceptance Criteria

- The requested directories exist.
- Each directory has a README explaining how to use it.
- At least one ADR, one learning, and one playbook exist as examples.
- AGENTS.md points agents to the knowledge system.
- Additional support documents exist for glossary, release checklist, gameplay-rule debugging, and archived knowledge.

## Added Support Documents

- `docs/glossary.md`: shared terms for glyphs, goals, runes, world rules, and release language.
- `docs/release-checklist.md`: human-facing release review checklist.
- `.context/kb/playbook/debug-gameplay-rule.md`: gameplay-rule debugging workflow.
- `.context/kb/archive/`: retired ADRs, obsolete plans, stale lessons, and retired playbooks.

## Open Questions

- Should future issue/PR templates require linking to specs or ADRs?
- Should raw logs be pruned on a schedule?
