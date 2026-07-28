# Plainly — AI Handoff Reference

This file is for AI tools continuing work on the Plainly codebase.
Read it before making any changes. It supplements `AGENTS.md`.

---

## What Plainly Is

Plainly is a **plain-language interface for GitHub**. It lets nontechnical people
create, open, edit, review, save, restore, and manage GitHub projects without needing
to understand Git, GitHub terminology, terminals, or deployment pipelines.

**The full product loop:**
```
Understand → Decide → Send to AI → Receive changes → Review → Save → Continue later
```

GitHub is the storage and version system. AI tools are the builders. Plainly is the
**control center** that lets an ordinary person use both confidently.

---

## Architecture (four layers)

```
┌───────────────────────────────────────────┐
│              User Interface               │
│      (Plain English Workspace)            │
├───────────────────────────────────────────┤
│          Project Intelligence             │
│  Memory • Tasks • AI • Recommendations    │
├───────────────────────────────────────────┤
│          GitHub Translation Layer         │
│ Projects • Save Points • Versions         │
├───────────────────────────────────────────┤
│                 GitHub API                │
└───────────────────────────────────────────┘
```

---

## Key files

| File | Purpose |
|---|---|
| `src/App.jsx` | Route definitions — do not change existing routes |
| `src/hooks/useAuth.js` | Auth state — do not change |
| `src/api/github.js` | All GitHub REST API calls — do not change signatures |
| `src/pages/Projects.jsx` | Dashboard: "continue where you left off" + project list |
| `src/pages/Files.jsx` | File editor, save points, task panel, AI modal trigger |
| `src/pages/History.jsx` | File version timeline + diff + restore |
| `src/pages/ProjectTimeline.jsx` | Project-level story: commits + memory + tasks |
| `src/pages/Help.jsx` | Goal-based help, GitHub translation, walkthroughs |
| `src/pages/SignIn.jsx` | Sign-in page — do not change |
| `src/pages/AuthCallback.jsx` | OAuth callback — do not change |
| `src/components/ProjectAIModal.jsx` | "Continue with Another AI" modal |
| `src/utils/aiPrompt.js` | Pure function: builds project context prompt string |
| `src/utils/projectMemory.js` | localStorage: per-project memory (last file, save, AI) |
| `src/utils/taskMemory.js` | localStorage: task CRUD for each project |
| `src/utils/time.js` | Relative time formatting + commit label helpers |
| `src/index.css` | All styles — CSS custom properties, no Tailwind |
| `server.js` | Local dev Express server — OAuth exchange only — do not change |
| `api/oauth/exchange.js` | Vercel serverless OAuth exchange — do not change |
| `docs/DECISIONS.md` | All major product and architecture decisions |
| `docs/STATUS.md` | Current project state — update after every substantial task |
| `docs/SECURITY.md` | Security concerns and mitigations |
| `docs/ARCHITECTURE.md` | Verified architecture documentation |

---

## GitHub terminology translation (enforce in all UI)

| GitHub term | Plainly UI wording |
|---|---|
| Repository | Project |
| Commit | Save point |
| Commit message | What changed |
| File history | History |
| Revert | Go back to this version |
| Diff | See what changed / Compare with now |
| Push | Save to GitHub (implicit in save point) |
| Pull request | Review proposed changes |
| Branch | Separate version |
| Issue | Task or problem |
| Deploy | Publish the project |
| Environment variable | Private project setting |
| Clone | Open a project on this computer |
| Fork | Make your own copy |
| Star | Bookmark / favourite |

**Rule:** Raw GitHub/Git terms must never appear in labels, buttons, or messages visible to the user.

---

## Data storage

| Data | Location | Key pattern |
|---|---|---|
| GitHub OAuth token | `localStorage` | `plainly_token` |
| Project memory | `localStorage` | `plainly_memory_${owner}_${repo}` |
| Tasks | `localStorage` | `plainly_tasks_${owner}_${repo}` |
| Font size preference | `localStorage` | `plainly_font_size` |
| Word goal preference | `localStorage` | `plainly_word_goal` |

There is no Plainly database. All user data lives in GitHub repositories and browser localStorage.

---

## Current working features

- GitHub OAuth sign-in
- Project list (GitHub repos as "Projects")
- Create / delete / settings for projects
- File editor with Markdown preview, font size, focus mode
- Save points (named commits) with auto-save
- File history timeline with diff and restore
- Project Timeline page (`/p/:repo/timeline`)
- "Continue with Another AI" modal — builds project context prompt
- Project memory (localStorage) — records last file, save, AI handoff
- Task system (localStorage) — create / edit / delete tasks per project
- "Continue where you left off" dashboard card
- Recommended next action (computed from real memory)
- Goal-based Help page with GitHub translation table

---

## What requires backend work before it can be built

| Capability | What's needed |
|---|---|
| Memory persists across devices | Server-side storage |
| AI session history across devices | Same |
| Return detection (changes made outside Plainly) | Server webhook or polling |
| In-platform AI | API key management + server-side proxy |
| Multi-user tasks / collaboration | Server-side task storage |
| Publishing / deploy | GitHub Pages or Cloudflare integration |

---

## Build and validation

```bash
npm run dev     # starts Vite (port 5173) + Express OAuth server (port 3001)
npm run build   # production build — must pass with 0 errors before any task is done
```

The build must pass before any task is reported complete.
After every substantial change, update `docs/STATUS.md`.
After every architecture or product decision, update `docs/DECISIONS.md`.

---

## Absolute constraints

- Do NOT change `server.js` or `api/oauth/exchange.js`
- Do NOT change `src/hooks/useAuth.js`
- Do NOT change `src/pages/AuthCallback.jsx`
- Do NOT change `src/pages/SignIn.jsx` (except the `missingConfig` guard already present)
- Do NOT change existing route paths in `src/App.jsx`
- Do NOT fabricate project state or fake AI functionality
- Do NOT expose credentials
- Do NOT commit, push, merge, or deploy unless explicitly instructed
- Do NOT install new npm packages without a clear reason
- Preserve all existing GitHub API call signatures in `src/api/github.js`
- All new CSS must use existing design tokens — no hardcoded colours

---

## Continuation record

**Last updated:** 2025-07-11
**Last task completed:** Help page redesign (goal-based, GitHub translation, walkthroughs) + HANDOFF.md created
**Build status:** 70 modules, 0 errors (verified before this update)
**Next planned work:** No task currently in progress — repository is stable and ready
