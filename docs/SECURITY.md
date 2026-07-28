# Plainly — Security Notes

This document records known security concerns in the current implementation, the existing
mitigations, and the preferred future direction for each issue. It is updated as the
security posture of the application changes.

**None of the issues documented here are claimed to be fixed unless explicitly marked as
resolved with a date.**

---

## SEC-001 — GitHub OAuth Token Stored in Browser localStorage

**Status:** Open — mitigated but not resolved  
**Severity:** High  
**First documented:** 2025-07-11

### What is happening

After a successful GitHub OAuth sign-in, `useAuth.js` stores the raw GitHub access token
in the browser's `localStorage` under the key `plainly_token`:

```js
// src/hooks/useAuth.js
localStorage.setItem('plainly_token', newToken)
```

The token is subsequently read on every page load and passed directly to all GitHub API
calls in `src/api/github.js` via the `Authorization: Bearer <token>` header.

The token carries the `repo` scope, which grants full read and write access to all of
the authenticated user's repositories — both public and private — including the ability
to create, modify, and delete repositories and their contents.

### Risks

**Cross-Site Scripting (XSS):** `localStorage` is readable by any JavaScript executing
on the page. A successful XSS attack — through a malicious dependency, a browser
extension with page-access, or an injected script — could silently read the token and
exfiltrate it. The attacker would then have full `repo`-scope access to all of the
user's GitHub repositories until the token is manually revoked.

**Token persistence:** Unlike a session cookie, a `localStorage` item has no expiry.
Once set, it persists indefinitely across browser sessions and tabs until explicitly
cleared. A stolen token remains valid until the user revokes it on GitHub or the OAuth
App is deleted.

**No server-side revocation:** Plainly has no mechanism to invalidate or rotate the
stored token. Signing out removes the item from `localStorage` in the current browser,
but does not call GitHub's token-revocation endpoint. If the token was already copied,
sign-out provides no protection.

### Existing Mitigations

The following mitigations reduce but do not eliminate the risk:

- **HTTPS in production:** The token is only transmitted over encrypted connections in
  a properly deployed instance. It cannot be intercepted in transit.
- **Markdown sanitization (added 2025-07-11):** DOMPurify now sanitizes all
  Markdown-rendered HTML before insertion into the DOM, closing the most likely
  XSS vector available to a user's own content. See SEC-002.
- **No third-party scripts:** The application loads no advertising, analytics, or
  third-party tracking scripts that could harvest the token.
- **No eval, no dynamic script injection:** The application does not use `eval()` or
  dynamically inject `<script>` tags, limiting the attack surface.
- **Dependency count is low:** The number of runtime npm dependencies is small,
  reducing the supply-chain risk compared to typical React applications.

These mitigations reduce the practical risk substantially. They do not make
`localStorage` token storage architecturally safe.

### Preferred Future Architecture

The preferred direction is to move the token entirely off the client:

1. **Exchange code for token server-side** — the current OAuth exchange already happens
   server-side (in `server.js` / `api/oauth/exchange.js`). The improvement is to not
   return the raw token to the browser at all.

2. **Issue an encrypted, HttpOnly session cookie** — after the token exchange, the
   server sets a session cookie with `HttpOnly` (inaccessible to JavaScript),
   `Secure` (HTTPS only), and `SameSite=Strict` or `SameSite=Lax`. The cookie holds
   the GitHub token encrypted with a server-held key.

3. **Proxy GitHub API calls through the server** — instead of calling
   `api.github.com` directly from the browser, all GitHub operations go through a
   thin Plainly server layer. The server decrypts the session cookie, attaches the
   GitHub token, and forwards the request. The browser never sees the token.

4. **Add a sign-out endpoint** — the server deletes the session cookie on sign-out
   and optionally calls GitHub's token-revocation endpoint.

### Files Involved in a Future Migration

| File | Change required |
|---|---|
| `server.js` | Add session middleware, replace token-return with cookie-set, add GitHub API proxy routes |
| `api/oauth/exchange.js` | Same pattern for Vercel; may need a different session approach (e.g. encrypted JWT in cookie) |
| `src/hooks/useAuth.js` | Remove all `localStorage` reads/writes; replace with a session-check endpoint call (`GET /api/session`) |
| `src/api/github.js` | Change base URL from `https://api.github.com` to `/api/github` (proxied); remove manual `Authorization` header construction |
| `src/pages/AuthCallback.jsx` | Remove token extraction from JSON response; rely on cookie being set by server |
| `vite.config.js` | Expand proxy to forward `/api/github/*` to the Express server in development |

**Estimated scope:** Medium. This is a significant architectural change to authentication
and data flow but does not require changes to any UI components, page layout, or the
GitHub API call signatures beyond the base URL. It should be done as a dedicated,
focused task after the product is otherwise stable.

---

## SEC-002 — Unsanitized Markdown Rendered via dangerouslySetInnerHTML

**Status:** Resolved — 2025-07-11  
**Severity:** High (before fix); Resolved  

### What was happening

`src/pages/Files.jsx` passed the output of `marked.parse(content)` directly to
`dangerouslySetInnerHTML` without sanitization:

```jsx
// Before fix
<div dangerouslySetInnerHTML={{ __html: marked.parse(content || '') }} />
```

`marked` is a Markdown-to-HTML converter, not an XSS sanitizer. Markdown content
containing raw HTML tags, `javascript:` href values, or event handler attributes
would be inserted into the DOM verbatim and could execute in the user's browser.

Because Plainly users write their own content, the direct impact is self-inflicted
(the user cannot attack other users this way with the current single-user model).
However, the vulnerability represents bad practice and would become a real
cross-user risk if any collaboration or shared-file feature were added.

### Fix Applied

DOMPurify was added as a dependency and is applied to all Markdown output before
rendering:

```jsx
// After fix — src/pages/Files.jsx
import DOMPurify from 'dompurify'
// ...
<div
  className="markdown-preview"
  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(content || '')) }}
/>
```

DOMPurify is the industry-standard browser-native HTML sanitizer, maintained by the
OWASP Sanitizer project. It preserves all safe Markdown output (headings, paragraphs,
lists, links, emphasis, blockquotes, code) and strips executable content.

---

## SEC-003 — OAuth Scope Broader Than Required

**Status:** Open  
**Severity:** Medium  
**First documented:** 2025-07-11

### What is happening

The OAuth authorization URL in `src/pages/SignIn.jsx` requests the `repo` scope:

```js
const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo`
```

The `repo` scope grants full access to all of a user's repositories (public and private),
including settings, webhooks, deploy keys, and deletion. Plainly only needs to read and
write file contents and repository metadata for repositories it creates.

### Preferred Future Direction

Use the minimum scope sufficient for the product's operations:

- For users who only need to work with Plainly-created repositories: `public_repo`
  if repositories are public, or a GitHub Fine-Grained Personal Access Token scoped
  to specific repositories.
- For the current private-by-default repository model, a custom OAuth scope narrowing
  is limited by GitHub's coarse OAuth scope options. A practical improvement is to
  clearly communicate to the user at sign-in what access is being requested and why.

**This scope change should be coordinated with the SEC-001 authentication rework.**

---

## SEC-004 — New Repositories Previously Defaulted to Public

**Status:** Resolved — 2025-07-11  
**Severity:** Medium (before fix); Resolved  

### What was happening

`createRepo` in `src/api/github.js` hardcoded `private: false`:

```js
// Before fix
body: JSON.stringify({ name, auto_init: true, private: false })
```

A user who created a new Plainly project without realizing the implications would
have their writing published publicly on GitHub under their own account.

### Fix Applied

Changed to `private: true`:

```js
// After fix
body: JSON.stringify({ name, auto_init: true, private: true })
```

This matches the principle of least surprise: a user managing personal writing documents
should not have those documents public by default. The user can change a project to
public via the Project Settings modal in the Files page if they choose.
