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
| `--purple` | `#6C5CE7` | primary actions, active nav, links |
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

**There is exactly one navigation in the app**, `AppShell`. No page renders its own nav.
This is worth stating because it was broken once: two screens kept an old sidebar and the
app showed two side by side.

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

Every route resolves. No dead links, no 404s. Old routes redirect to their designed
replacement rather than disappearing.

## 11. If you're an AI changing this app

- Match the tokens above; don't introduce new colours or sizes.
- Copy is the product. If a screen's wording is specified, use it exactly.
- Put new work in an existing screen before inventing a new one.
- Anything you can't compute for real, render as the honest fallback and say so in your
  report back.
- Don't reintroduce a second navigation, and don't add a chatbot.
