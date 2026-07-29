# Plainly — design instructions

This is the file Plainly hands to an AI. When you press **Continue with AI**, this document
is packed into the handoff as "your project instructions", so anything written here is what
an AI will follow when it changes this app.

Keep it true. If something here stops matching the code, fix one of them.

Source of truth for values: `src/styles/tokens.css` (redesign tokens) and `src/index.css`
(original brand values). `docs/DESIGN.md` is the older, longer description of the
pre-redesign system — this file supersedes it for anything they disagree on.

---

## 1. What this app is for

Plainly sits on top of a GitHub account and does one job: tell you where you left off,
what changed, and what to do next — without the jargon.

Every screen answers one of those three questions. If a screen answers none of them, it
probably shouldn't exist.

---

## 2. Colour

Nothing in the interface uses a colour outside this list. There is no blue in Plainly —
links are purple.

| Token | Value | Used for |
|---|---|---|
| `--purple` | `#6C5CE7` | the wordmark, primary actions, active nav, links |
| `--purple-dark` | `#5849c4` | primary hover |
| `--ink` | `#1C1B22` | headings, body |
| `--ink-soft` | `#4A4753` | body copy inside cards |
| `--ink-mid` | `#5C5866` | neutral pill text |
| `--canvas` | `#FBFAF8` | page background |
| `--grey` | `#8A8794` | secondary text, labels |
| `--grey-light` | `#ECEAF4` | card borders |
| `--grey-border` | `#D8D6E3` | input and secondary-button borders |
| `--lilac-bg` | `#F4F2FB` | guidance strips, selected chips |
| `--lilac-border` | `#E4E0F7` | emphasised card borders |
| `--lilac-soft` | `#C9C2F0` | folder glyphs, chevrons, hover borders |
| `--panel` | `#FBFAFE` | inset panel inside the hero card |
| `--amber` / `--amber-bg` / `--amber-edge` | `#A3702A` / `#FAF1E1` / `#E3B14C` | attention: text, pill, 4px left border |
| `--red` / `--red-bg` / `--red-border` | `#8C3A33` / `#FBEBEA` / `#F3D9D6` | destructive and conflict |
| `--success` / `--green-deep` / `--green-bg` | `#00B894` / `#008B70` / `#E6F9F4` | saved, all-clear |

**Meaning is fixed.** Amber means *something is waiting for you*. Red means *this can lose
work*. Green means *it's in GitHub*. Purple means *this is the thing to press*. Never use a
colour for decoration that carries one of those meanings.

## 3. Type

Inter, loaded at 400/500/600/700. Monospace (`'Courier New', ui-monospace, monospace`) is
only for real file names, repository addresses and commit shas — never for prose.

| Role | Size / weight |
|---|---|
| Page title | 30px / 700 / -.03em |
| Hero update title | 34px / 700 / -.03em |
| Section heading | 22px / 700 / -.02em |
| Card title | 16.5px / 600 |
| Body | 15–16.5px / 1.5 |
| Meta, secondary | 13.5–14px, `--grey` |
| Uppercase label | 12px / 600 / .08em, `--grey` |
| Status pill | 12.5px / 600 |

Never below 13px.

## 4. Shape and depth

`--radius-card: 14px` for cards and list rows, `--radius-hero: 18px` for the one hero card
per screen, `--radius-pill: 99px` for status pills, 10–12px for buttons and inputs.

Two shadows only: `--shadow-card` for hover lift, `--shadow-hero` for the single most
important card on a screen. Nothing else casts a shadow.

## 5. Layout

248px white sidebar, sticky, `border-right: 1px solid --grey-light`. Content area
`padding: 44px 48px 64px` with a max-width per screen (660–1000px). Use the `.screen-padded`
class plus a per-screen `max-width`.

**On a phone** (≤720px) the sidebar folds into a menu: a sticky bar with the wordmark and a
**Menu** button, opening the same nav with the same groups and headings. Still one `<nav>`.
It used to become a horizontal scrolling strip with the headings hidden, which put up to
twenty-one items in a sideways swipe — Project Files was genuinely unreachable.

Controls a thumb aims at are at least **44px** tall on phones. The 12–12.5px sizes above are
uppercase labels, pills and badges, and they stay — the 13px floor is about prose. Anything
laid out as columns on a desktop stacks, and the glossary stops being a table and becomes
one card per word, because three columns in 390px clipped the meaning entirely.

The mobile rules live at the **end of `tokens.css`**, the last stylesheet `main.jsx` imports.
A media query carries no extra specificity, so an override only wins by loading after the
rule it overrides. Half of them did nothing when they sat in `index.css`.

**There is exactly one navigation in the app**, `AppShell`. No page renders its own nav.
This is worth stating because it was broken once: two screens kept an old sidebar and the
app showed two side by side.

The sidebar has two conditional groups, both built from the same `NavItem`: the project nav
appears inside `/p/:repo`, and **Help topics** appears inside `/help`. A group is a grey
uppercase heading followed by indented rows — no icons anywhere in the sidebar.

## 6. Buttons

One primary purple button per screen — the recommended next step. Everything else is white
with a `--grey-border`; on hover the border and text go purple.

Use `.pl-btn-primary` and `.pl-btn`. They work on `<button>` and on react-router `<Link>`.

## 7. The words

The plain word is the label. GitHub's word may appear as grey secondary explanation, inside
"Show technical details", in the glossary, or when the Account setting *Show technical
GitHub words* is on. **Never in a button.**

| Show this | Never as a primary label |
|---|---|
| Project | repository, repo |
| Save Point | commit |
| What changed? | commit message |
| Save to GitHub | push |
| Get latest version | pull, fetch |
| Separate version | branch |
| Main version | main, master, default branch |
| See what changed | diff |
| Restore an earlier version | revert, reset |
| Changes not saved yet | uncommitted changes |
| Project files | tree, blob |

Write for someone who has never used GitHub and is not stupid. Short sentences. Say what a
thing does before naming it. Every destructive action says what will happen and what will
survive.

## 8. Honesty rules

These are design rules, not engineering ones. Breaking them makes the product lie.

- **Never invent a number, filename, date or status.** Every value on screen comes from the
  GitHub API or from Plainly's own stored memory.
- **When something can't be computed yet, say so** — use the honest fallback sentence, or
  the dashed `.pl-todo` "Requires implementation" badge. Never print "Yes" for a check that
  never ran.
- **No pill beats a wrong pill.** A status only appears when stored records back it.
- **A toggle that changes nothing is worse than no toggle.** If a control is on screen, it
  must do something visible.
- **Nothing reaches GitHub without the user pressing a button that says so.** Edits are
  drafts on this computer until Review and save.

## 8a. Updates and Save Points are different things

An **update** is something Plainly followed start to finish: you described it, it went to an
AI, changes came back, you reviewed and saved. A **Save Point** is something GitHub recorded,
however it got there — pushed from an editor, from an AI tool, from another machine.

Most work arrives the second way. So the project screens show both, and never blur them: a
Save Point is never rendered as an update, never counted in "updates in progress", and never
fed to `heroFor()`. When Plainly has no update of its own, Project Home leads with **Recently
saved to GitHub** rather than a sentence about nothing, and Updates carries a **Saved to
GitHub** list underneath its own.

## 8b. A commit message is a title and one line

Commit messages are written for git: a subject, then paragraphs, then trailers like
`Co-Authored-By:`. Printing all of it is how What Changed became a wall of text.

`src/utils/commitText.js` is the only place that decides: the first line is the title, the
first paragraph becomes a one-line summary cut at a word boundary, everything else goes
behind **See details** along with the sha and the file list. Trailers never appear on screen
at all. Every screen showing a Save Point uses it, so one commit reads the same way
everywhere.

## 8c. Version numbers are counted, not stored

`v18` means *the 18th Save Point GitHub currently lists on the main version*. It is counted
at read time by `getSavePointCount()` — ask for one commit, read the `rel="last"` page number
out of the `Link` header, which GitHub exposes to browsers via
`Access-Control-Expose-Headers`.

When the count can't be made it is `null`, and **nothing is rendered** — not `v0`, not `vNaN`.
Guard with `version > 0 ? … : null`, never `version && …`: JSX renders a bare `0`.

## 9. One status, four sentences

`src/utils/heroFor.js` turns an update's status into exactly four fields: *where you left
off*, *what's happened since*, *what to do next*, and the primary button's label and route.

Home, Project Home and the update workspace all call it. **Do not compute those sentences
anywhere else** — that is how screens end up contradicting each other, telling you to keep
working on something already saved.

Update statuses, in order: `planned → ready_for_ai → sent_to_ai → changes_detected →
waiting_for_review → ready_to_save → saved`, plus `needs_correction` and `paused`.

## 10. The screens

Signed out: **Welcome**. Signed in, global: **Home**, **My Projects**, **Recent Activity**,
**Account**, **Help**, **Start a new project**. Inside a project: **Project Home**,
**Updates**, **Make an Update**, **Project Files**, **file editor**, **Review and save**,
**What Changed**, **Save Points**, **Separate Versions**, **Who Can See It**, **Continue
with AI**, and per update: **workspace**, **Return from AI**, **Review AI changes**.

**Help is a section, not a page.** Six routes — `/help` (getting started), `/help/how-it-works`,
`/help/tasks`, `/help/glossary`, `/help/troubleshooting`, `/help/contact` — so every topic can
be linked to, and search results can land on the exact answer. The writing lives in
`src/help/content.js`; the section pages are layout only. Anything Help describes must be
something the app actually does — where it doesn't, Help says so (see §8).

**Continue with AI works without an update.** `/p/:repo/ai` opens the handoff for the project
itself and asks what you want the AI to do; the update record is created when you mark it as
sent, not before. `/p/:repo/u/:id/ai` is the same screen scoped to an update in flight.

**Signing out disconnects.** It revokes the GitHub authorization, not just Plainly's copy of
the token, so the next sign-in asks you to allow access again — otherwise Account's promise
that "you can disconnect any time" would be false. Your files stay in GitHub and unsaved
drafts stay on the computer; the screen says both before you press it. If the revoke can't
reach GitHub you are still signed out here, and Welcome says GitHub may still list Plainly
and where to remove it.

This is the *only* way to make GitHub ask again. GitHub's own rule: someone who has already
authorized these scopes "won't be shown the OAuth authorization page … this step of the flow
will automatically complete". So a silent sign-in is not a bug in Plainly — it means the
authorization is still there. Sign-in also sends `prompt=select_account`, which forces the
account picker every time, and Account states whether GitHub still lists Plainly by asking
GitHub rather than by assuming it — with "couldn't check" as its own answer, never rendered
as connected.

**A project URL carries its owner:** `/p/:owner/:repo`. Not the signed-in user — the
account the project actually belongs to, because a project shared with you or owned by a
team belongs to somebody else and every GitHub call needs to know whose. Screens read the
pair from `useProject()`, lists link with `ownerOf(repo)`, and stored memory is keyed by
the project's owner. Links from before this shape redirect (`ProjectArea` in `App.jsx`).

The one ambiguity — a project genuinely named `settings` or `files` — resolves by treating
a first segment that matches the signed-in user as the new shape, which it always is.

Every route resolves. No dead links, no 404s. Old routes redirect to their designed
replacement rather than disappearing.

## 11. If you're an AI changing this app

- Match the tokens above; don't introduce new colours or sizes.
- Copy is the product. If a screen's wording is specified, use it exactly.
- Put new work in an existing screen before inventing a new one.
- Anything you can't compute for real, render as the honest fallback and say so in your
  report back.
- Don't reintroduce a second navigation, and don't add a chatbot.
