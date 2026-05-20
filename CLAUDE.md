# CLAUDE.md

Guidance for Claude Code working in this repository. Keep this file short — it loads into every conversation.

**Stack overview, dev commands, and first-time setup live in `docs/STACK.md`.** Read it before doing anything else here — this file deliberately stays stack-agnostic.

@docs/STACK.md

## How this repo was bootstrapped

This project was started from a template branch in `templates`. Shared scaffolding (`.claude/`, security workflows, `CLAUDE.md` itself, `.gitignore`, etc.) is owned by that repo's `base` branch and is not unique to this project. Stack-specific code, business logic, and `docs/STACK.md` are owned here.

If you find a rule worth applying to *every* future project, propose it for the templates repo's `base` branch — don't fork the convention locally.

## Repo-wide hard rules

- **Secrets** — All secrets live in this repo as SOPS-encrypted `*.sops` files; decryption needs `kms:Decrypt` on the project's KMS key. Plaintext siblings (`.env`, `terraform.tfvars`) are gitignored and exist transiently for local dev. Never `git add -f` a plaintext secrets file. Never add a SOPS recipient other than the project KMS key without discussing.
- **CI auth** — CI must use GitHub OIDC against AWS. Never introduce static AWS access keys in workflow files or secrets store.
- **Pre-commit hooks** — `.pre-commit-config.yaml` runs gitleaks on staged changes. Install once with `pre-commit install`. Don't bypass with `--no-verify`.

## Every code change updates tests + docs in the same change

1. Add or update tests for the workspace you touched. If something is genuinely untestable (config, infra, pure styling), say so explicitly — don't skip silently.
2. Update the relevant file in `docs/` if the change affects architecture, commands, env vars, deployment, or features. A one-line doc edit is still an edit.

Treat "code changed, docs and tests unchanged" as an incomplete task — flag it before handing back.

## Fix bugs at the source — never adjust the test to hide them

When a test fails, the only acceptable resolution paths are:

1. **The test itself is broken** (wrong fixture, missing required field, typo, race in test setup, unique-constraint collision with seed data). Fix the test.
2. **The app has a real bug or missing primitive.** Fix the app code. If the app needs a new affordance for the test to wait deterministically (a `data-ready` attribute backed by a real readiness signal, an exposed status, a broadcast handshake), add it in the app code — it's a real API, not test scaffolding.

There is no third option. These are forbidden because they ship the bug behind a green check:

- Inflating a Playwright `expect` / `toBeVisible` timeout to absorb a flake (`5_000` → `15_000` → `30_000`). Fix whatever makes the page slow.
- `await page.waitForTimeout(N)` between two actions. Wait on a real signal (DOM node, state attribute, network response).
- Bumping `--retries` (or relying on Playwright's `retries: 1`) to mask a real race.
- `test.skip(…)` / `test.fixme(…)` / `test.fail(…)` against a real bug without an open follow-up that names what's broken + when it'll be fixed.
- Loosening strict assertions (`toHaveText('Race armed')` → `toContainText(/arm|connect|ready/i)`) to "absorb variance" — the variance IS the bug.
- Replacing a real wait with a sleep "because the real signal is unreliable" — the real signal needs fixing.

If you spot a candidate fix that fits one of those patterns: stop, surface the underlying app issue, and either fix it in the same session or flag it explicitly to the operator. Don't half-mask it via the test.

## UI verification

Don't spin up the dev server to visually verify UI/frontend changes before reporting a task complete. `pnpm check` + `pnpm test` (or the stack's equivalent — see `docs/STACK.md`) are sufficient; the operator reviews visuals themselves. Only run the dev server if explicitly asked.

## Available Claude tooling

Run these as slash-commands. Each delegates to a specialised agent (`.claude/agents/`).

- `/check` — typecheck + tests + format + lint in one pass.
- `/safe-edit` — workflow for security-sensitive or load-bearing changes.
- `/polish-ui` — typography / layout polish on a target frontend surface.
- `/release-readiness` — go/no-go checklist before tagging.
- `/audit/all` — runs every audit in `audit/`; `/audit/<area>` for a single sweep (`secrets`, `infra`, `deps`, `xss`, `cost-controls`).

These ship with placeholder examples and need per-project adaptation — see `.claude/README.md`.

## Where to look

- `docs/STACK.md` — the canonical "what is this and how do I run it" doc (template-owned)
- `docs/` — additional architecture/deployment/security docs (template-owned)
- `.github/workflows/gitleaks.yml` — secret scanning (base-owned)
- `.github/workflows/audit.yml` — weekly `pnpm audit` + auto-issue (base-owned)
- `.github/workflows/codeql.yml` — CodeQL static analysis (base-owned)
- `.github/workflows/scorecard.yml` — OSSF Scorecard (base-owned)
- `.github/workflows/claude.yml` — Claude Code automation on PRs/issues (base-owned)
- `.github/workflows/dependabot-auto-merge.yml` — auto-merges minor/patch Dependabot PRs (base-owned)
- `.github/workflows/dependabot-lockfile.yml` — re-syncs pnpm lockfile on Dependabot PRs (base-owned)
- `.github/dependabot.yml` — dependency update PRs (base-owned)
- `SECURITY.md` — vulnerability reporting policy (base-owned)
