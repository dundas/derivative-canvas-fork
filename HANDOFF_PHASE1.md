# Phase 1 Handoff: Framework Restructure and TypeScript Alignment

This handoff summarizes current issues, blockers, the steps already taken, key learnings, and recommended next actions for completing Phase 1 of the `derivative-canvas` restructure.

## Summary of Phase 1 Goal

- Cleanly separate the Derivative Canvas framework from the Excalidraw fork by moving the framework package to `framework/derivative-canvas/` within the monorepo.
- Keep Excalidraw packages under `packages/` intact.
- Ensure the framework can be built independently and documented, and the monorepo remains healthy (install, typecheck, lint, build).

## What's Been Done

- Repository structure and workspaces

  - Moved framework to `framework/derivative-canvas/`.
  - Updated root `package.json` workspaces (`framework/*`).
  - Committed changes on branch `chore/restructure-framework-boundary`.

- TypeScript configuration

  - Root `tsconfig.json`: initially included `framework/`, then temporarily excluded it to avoid cross-workspace type resolution issues while we finalize boundaries. Also excluded all `**/dist/**` from root typecheck to prevent type identity mismatches with emitted declarations.
  - Framework `tsconfig.json`: created with isolated `baseUrl`, paths, and includes. Added minimal local shims to avoid importing Excalidraw sources at build time.

- Framework package

  - Builds independently with `yarn --cwd ./framework/derivative-canvas build`.
  - `layouts/ExcalidrawLayout.tsx`: switched to `React.lazy` + `Suspense` to handle SSR and heavy initial bundles.
  - `core/types.ts`: uses minimal local types (avoids `@excalidraw/excalidraw/types`) to prevent dragging Excalidraw source into the framework build.
  - `plugins/ai-chat/AIChatPlugin.tsx`: refactored component declarations (use function declarations) to fix TS ordering issues.
  - `utils/auth-adapters/nextauth.ts`: removed usage of `this` within object methods to fix strict TS checks.

- Documentation
  - Added `dev-docs/docs/framework/overview.mdx` (Framework Overview).
  - Updated `dev-docs/sidebars.js` to include Framework section.
  - Installed `@tsconfig/docusaurus` and fixed `dev-docs/tsconfig.json` editor error.

## Current Issues

- Root typecheck errors due to type identity mismatches in Excalidraw tests

  - Example errors:
    - `Type '.../packages/excalidraw/types'.AppState is not assignable to type '.../packages/excalidraw/dist/types/excalidraw/types'.AppState`
    - Occurs in multiple test files under `packages/excalidraw/tests/*`.
  - Likely cause: mixing of source-resolved types (`packages/excalidraw/*`) and published-declaration-resolved types (`packages/excalidraw/dist/types/*`) within the same TS program. This can happen because:
    - Root `tsconfig.json` path aliases point to `packages/excalidraw/*` (source).
    - `packages/excalidraw/package.json` advertises `"types"` and `"exports".types` pointing to `dist/types/...`. TS can choose those in some resolution paths (e.g., from d.ts imports or when a module boundary is crossed), resulting in distinct type identities.

- Framework at root typecheck temporarily disabled
  - We excluded `framework/` at the root while we finalize TypeScript boundaries to prevent the framework build from pulling in Excalidraw sources via deep type imports.

## Blockers

- Type identity split between source (`packages/excalidraw`) and emitted declarations (`packages/excalidraw/dist/types/...`) for the same logical modules (e.g., `AppState`). This blocks `yarn test:typecheck` at the root.

## Key Learnings

- Avoid importing internal subpaths or source-only types from `@excalidraw/excalidraw` in external packages. Treat it as a peer dependency and import only the public API.
- In a monorepo, path aliases and package `types/exports.types` must be carefully aligned. Mixing them can fracture type identities ( `src` vs `dist/types`).
- For a framework layered over Excalidraw:
  - Build the framework independently.
  - Use minimal local types or ambient shims to avoid compiling Excalidraw sources.
  - Lazy-load Excalidraw in UI components to handle SSR/client boundaries.

## Recommended Next Actions (Proposed Plan)

1. Implement TypeScript Project References

   - Convert packages to `"composite": true` and define clear `rootDir` / `outDir`.
   - Root `tsconfig.json`: replace broad `include` with explicit `references` to workspaces (`packages/common`, `packages/element`, `packages/utils`, `packages/excalidraw`, `excalidraw-app`, `framework/derivative-canvas`, and optionally `dev-docs` if needed).
   - Build with `tsc -b` in dependency order (packages → framework → app). This ensures a single source of truth per type and prevents mixing src and dist declarations in the same program.

2. Normalize Type Resolution for Excalidraw within the repo

   - Approach A (preferred): rely on root path aliases to `packages/excalidraw/*` and make sure tests and consumers never resolve into `dist/types/*` during workspace dev.
     - During workspace development, avoid using the `types` and `exports.types` from package.json for intra-repo resolution by ensuring TS path aliases take precedence.
     - Keep `**/dist/**` excluded from root TS program (already done).
   - Approach B: make tests consistently consume built outputs
     - Build `packages/excalidraw` first (`yarn build:excalidraw`), then configure tests/tsconfig to only read from `dist/types/` consistently. This trades faster inner-loop for clarity.

3. Re-enable framework in root typecheck

   - After references are in place, bring `framework/` back into root typecheck.
   - Ensure `framework` does not import internal Excalidraw subpaths. Keep `@excalidraw/excalidraw` as a peer, lazy load the component, and use local minimal types.

4. CI and Scripts Hygiene

   - Add scripts for `tsc -b` project reference builds.
   - Sequence: build packages → build framework → typecheck app → lint → tests.

5. Documentation follow-ups
   - Add a short "Build Architecture" doc: how TS references, path aliases, and lazy-loading work together in this monorepo.
   - Highlight that the framework treats Excalidraw as a peer dependency.

## Concrete Task List

- Root TS references

  - Create a root `tsconfig.build.json` with `references` to:
    - `packages/common`, `packages/element`, `packages/utils`, `packages/math`, `packages/excalidraw`
    - `framework/derivative-canvas`
    - `excalidraw-app` (as a leaf consumer)
  - Update scripts to run `tsc -b -v -f` on this build file.

- Per-package tsconfig updates

  - Add `"composite": true` where missing.
  - Ensure each has clean `rootDir` and `outDir`.

- Excalidraw test resolution

  - Decide on Approach A (prefer src) or Approach B (prefer built types) and adjust tsconfig/tests accordingly.

- Re-enable framework at root
  - After references are stable, add `framework/` back to the root's typecheck.

## Current Commands

- Framework build: `yarn --cwd ./framework/derivative-canvas build`
- Build packages: `yarn build:packages`
- App build: `yarn build`
- Typecheck (root): `yarn test:typecheck` (currently fails due to type identity mismatch; see Issues)

## Open Questions

- Do we want tests in `packages/excalidraw` to consume source or built declarations? (Approach A vs B)
- Should we add TS project references for `dev-docs/` or leave it editor-only?

## References

- Root: `tsconfig.json`
- Framework: `framework/derivative-canvas/tsconfig.json`, `core/types.ts`, `layouts/ExcalidrawLayout.tsx`
- Excalidraw package: `packages/excalidraw/package.json` (types/exports), tests under `packages/excalidraw/tests/*`
- Docs: `dev-docs/docs/framework/overview.mdx`, `dev-docs/sidebars.js`, `dev-docs/tsconfig.json`
