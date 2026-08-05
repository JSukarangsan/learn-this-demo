# Engineering

Read on top of `../CLAUDE.md`.

Next.js, deployed on Vercel. Postgres behind the enrollment and billing services.

**There is no architecture overview in this folder, deliberately.** You can read the
code, and you'll be faster at it than any document we could keep current. What you
cannot read is why the code is shaped this way, what we tried that didn't work, and
which things look safe to change and aren't.

That's what's here:

- `constraints.md` — the things that must not happen. Read it before proposing any
  change to enrollment or payments.

## Review bar

Two approvals for anything touching enrollment or money. One for everything else.
A PR that changes a decision needs an entry in `../product/decisions/` before it merges.
