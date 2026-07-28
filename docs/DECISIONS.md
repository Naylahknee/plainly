# Plainly — Decisions

This file records major product and architecture decisions: what was decided, why, and
when. Decisions are listed from most foundational to most recent.

---

## D-001 — Preserve React and Vite as the frontend stack

**Date:** 2025-01-01 (established at project inception; confirmed 2025-07-11)  
**Status:** Active

**Decision:** The frontend is built with React 18 and Vite 6. This combination is retained.

**Reason:** The application is already built and working on this stack. React's component
model maps cleanly onto the page-level structure (Projects, Files, History, Help). Vite
provides fast development iteration and a straightforward production build. Migrating to a
different framework would require rewriting every component without adding any user-facing
capability.

**Alternatives considered:**
- Next.js — rejected (see D-003)
- SvelteKit — not considered; no reason to change

---

## D-002 — Retain Node.js for tooling and the current backend

**Date:** 2025-01-01 (established at project inception; confirmed 2025-07-11)  
**Status:** Active

**Decision:** Node.js is retained for the local development OAuth server (`server.js`) and
as the Vercel serverless function runtime (`api/oauth/exchange.js`).

**Reason:** The server's only job is a single OAuth code-exchange endpoint. Node.js with
Express handles this in under 35 lines of code. The existing implementation is correct and
has no complexity that would benefit from a different runtime. Replacing it would produce
no user-facing improvement.

**Alternatives considered:**
- Python / Flask — not considered; adds an unnecessary cross-language dependency
- Deno — not considered; no advantage for a single endpoint

---

## D-003 — Do not migrate to Next.js

**Date:** 2025-07-11  
**Status:** Active

**Decision:** Plainly will not be migrated to Next.js.

**Reason:** Next.js introduces server-side rendering, a file-system-based router, and a
different deployment model. Plainly is a client-rendered application that communicates
directly with the GitHub API from the browser. There is no server-rendered page, no
database query that benefits from SSR, and no SEO requirement that cannot be met with
static HTML. Migrating would require rewriting all pages, restructuring all routes, and
changing the deployment setup without adding any capability the product needs.

**Alternatives considered:**
- Staying on React + Vite — chosen

---

## D-004 — Cloudflare is the intended future hosting platform

**Date:** 2025-07-11  
**Status:** Decided, not yet implemented

**Decision:** The intended production hosting platform for Plainly is Cloudflare (Pages
and/or Workers), not Vercel.

**Reason:** Cloudflare Pages provides global edge deployment with generous free-tier
limits. Cloudflare Workers can replace the current Express/Vercel serverless OAuth
endpoint. This gives the product a stable, long-term deployment target without
per-seat or per-execution pricing concerns at scale.

**Current state:** The application is currently configured for Vercel deployment
(`vercel.json`). The Cloudflare migration is a future infrastructure task. No
application code changes are required before the migration; the OAuth endpoint logic
can be ported directly to a Cloudflare Worker with minimal changes.

**Alternatives considered:**
- Staying on Vercel indefinitely — viable but not chosen as the long-term target
- Self-hosted VPS — considered too much operational overhead

---

## D-005 — Plainly remains primarily a plain-language interface for GitHub

**Date:** 2025-07-11  
**Status:** Active

**Decision:** The core product identity of Plainly is a plain-language interface for
GitHub. The current writing editor is one feature within that product, not the complete
definition of the product.

**Reason:** GitHub provides free, permanent, versioned, collaborative document storage.
Plainly's value is making that infrastructure accessible to people who cannot use GitHub's
native interface. Defining the product as "a writing app" would artificially limit what
Plainly can do. The same translation mission applies to collaboration, publishing, project
management, and any other GitHub capability that could serve nontechnical users.

**What this means in practice:**
- New features should ask "what GitHub capability is this exposing, and what is the plain
  English equivalent?" rather than "what writing feature can we add?"
- UI labels must continue to use plain-language equivalents for GitHub concepts
- The product should not accumulate features that have no GitHub-backed equivalent

---

## D-006 — AI-assisted project continuation will be added as one feature inside Plainly

**Date:** 2025-07-11  
**Status:** Decided, not yet implemented

**Decision:** An "AI assistance" capability will be added to the Files page (and
potentially the History page) as a feature within Plainly. The working title for the
first iteration is "Continue with Another AI."

**Scope of first iteration:**
- A "Use with AI" button in the Files page topbar, visible when a file is open
- A modal that composes a structured prompt from the file's content
- A tool selector (Claude, ChatGPT, Gemini, and a generic copy option)
- A "Copy & Open" action that writes the prompt to the clipboard and opens the AI
  tool's URL in a new tab
- No new backend infrastructure required
- No new npm dependencies required

**Reason:** Users working on documents in Plainly naturally want to continue working with
AI tools. Rather than leaving the product, they should be able to bring their current
document content into any AI context with one action. This is consistent with Plainly's
mission: reduce friction between users and capable tools.

**What this is not:**
- This is not a separate product
- This is not an integration that calls an AI API from Plainly's backend
- This is not a replacement for Plainly's own editing or saving features

**Alternatives considered:**
- Building a separate "Relay" application — rejected (see D-007)
- Calling AI APIs directly from Plainly's backend — deferred; adds cost, key management,
  and infrastructure complexity for something achievable without a backend

---

## D-007 — Do not create a separate Relay application

**Date:** 2025-07-11  
**Status:** Active

**Decision:** All features, including AI assistance, will be built inside the existing
Plainly application. A separate application ("Relay" or any similar name) will not be
created within this repository or as a companion repository.

**Reason:** A separate application would split the user experience, require separate
authentication, require separate deployment, and add coordination overhead with no benefit.
The "Continue with Another AI" feature is a modal and two utility files — it belongs
naturally within the existing Files page component and does not justify a new application
boundary.

**Alternatives considered:**
- Relay as a separate Vite app in a monorepo — rejected; unnecessary complexity
- Relay as a separate repository — rejected; out of scope and not authorized
