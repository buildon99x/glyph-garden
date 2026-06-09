# Playbook: Change Verification

## When to Use

Use this after code changes and before saying work is complete.

## Steps

1. For TypeScript changes, run:

   ```sh
   npm run check
   ```

2. For release, dependency, bundling, or broad UI changes, run:

   ```sh
   npm run build
   ```

3. For UI changes, start the app when practical:

   ```sh
   npm run dev
   ```

4. Inspect command output. Do not report success from a command you did not read.

## Verification

- `npm run check` exits successfully for TypeScript changes.
- `npm run build` exits successfully before shipping or release work.
- UI work has a local browser/manual verification target.

## Related Knowledge

- `docs/code-quality-plan.md`
- `AGENTS.md`
