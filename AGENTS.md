# Agent Instructions for Plainly

Read this file before making any change to this repository.

---

## What Plainly Is

Plainly is an existing, deployed product. It is a **plain-language interface for GitHub**
built for nontechnical users. It translates GitHub concepts — repositories, commits, file
contents, history — into ordinary words that non-developers can understand and act on.

The current writing editor (create file, edit, save point, history, restore) is **one
workflow** within Plainly. It is not the full definition of the product. Plainly's intended
scope includes project creation, editing, saving, history, restoring, collaboration,
publishing, and AI-assisted project work — all surfaced in plain language.

---

## What You Must Not Do

- **Do not reinitialize this project.** It is already initialized. Do not run `npm init`,
  `create-react-app`, `create-vite`, or any scaffolding tool.
- **Do not rewrite the application** from scratch or migrate to a different framework
  without an explicit, written instruction from the owner in the current conversation.
- **Do not migrate to Next.js.** The decision to keep React + Vite is deliberate and
  recorded in `docs/DECISIONS.md`.
- **Do not replace the existing GitHub authentication flow.** The OAuth exchange in
  `server.js` and `api/oauth/exchange.js` must be preserved exactly as is unless a
  specific change is requested.
- **Do not change existing routes** (`/`, `/p/:repo`, `/p/:repo/h/*`, `/auth/callback`,
  `/help`) without explicit instruction.
- **Do not change the behavior of existing GitHub API calls** in `src/api/github.js`
  unless a specific bug fix or feature addition is requested.
- **Do not create a nested project or a separate application** (e.g. a "Relay" app)
  inside this repository.
- **Do not deploy, push, or commit** unless explicitly asked.

---

## Architecture Constraints

- **Frontend:** React 18, Vite 6, React Router v6. Keep this stack.
- **Backend:** Node.js + Express (`server.js`) for local development. Vercel serverless
  function (`api/oauth/exchange.js`) for production. Keep both.
- **Styling:** Plain CSS in `src/index.css` using CSS custom properties. Do not introduce
  Tailwind, CSS-in-JS, or a component library unless explicitly requested.
- **State:** React `useState` and `useEffect`. Do not introduce Redux, Zustand, or a
  global store unless explicitly requested.
- **No new dependencies** without explicit instruction. Check `package.json` before
  importing anything.

---

## Language and Terminology Rules

GitHub terminology must be translated into plain language wherever it appears in the
user interface. The following translations are already established in the product:

| GitHub term | Plainly equivalent |
|---|---|
| Repository | Project |
| Commit | Save point |
| Commit message | What changed / label |
| File history / git log | History |
| Restore a commit | Go back to this version |
| Branch (main) | Not surfaced |
| SHA / ref | Not surfaced |

When adding new UI that touches a GitHub concept, use the plain-language equivalent.
Never expose raw GitHub API terms, SHAs, branch names, or error messages directly
to the user without translation.

---

## Required Maintenance

### After every substantial task

Update `docs/STATUS.md` to reflect:
- What was changed
- What is now working
- What is still incomplete or broken
- Any new technical risks introduced

### After every major product or architecture decision

Update `docs/DECISIONS.md` with:
- The decision made
- The reason
- The date (use ISO format: YYYY-MM-DD)
- Any alternatives that were considered and rejected

---

## Verification Standards

Before claiming work is complete:

1. Re-read every file you changed.
2. Check that imports resolve to files that actually exist.
3. Check that any new component is wired into the correct parent.
4. Run the applicable project validation (lint, type-check, or build) and confirm it passes.
5. If a build or test command is unavailable, state that explicitly — do not assume success.

**Describe errors honestly.** If something does not work, say so clearly. Do not mark a
task complete if there are unresolved errors, missing wires, or untested paths.

---

## Continuation Records

If you stop work before a task is fully complete, leave a continuation record inside
`docs/STATUS.md` under a `## In Progress` heading that includes:

- What was completed
- What step was reached
- What must happen next
- Any context the next agent needs to continue without re-reading the whole conversation
