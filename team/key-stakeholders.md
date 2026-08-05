# Webapp — key stakeholders

> Refresh on reorgs, new hires, departures. Stale entries here are worse than no entries.
> **For "who owns which system," see `ownership.md`.** That's a routing table.
> This is who decides things and what they push on.

## The team

| | Role | Note |
|---|---|---|
| **Wren** | Engineering lead | Also the person who actually unblocks Billing reviews, which is not in any org chart |
| **Tobias** | Senior engineer, video | The only person who has debugged the vendor SDK. Escalation path for anything live-session. |
| **Marguerite** | Instructor Tools PM | Not on this team. Owns the content model, so she is on the critical path for more of our work than anyone expects. |

## Who decides what

| Decision | Who settles it | What they push on |
|---|---|---|
| Anything touching the content model | Marguerite (Instructor Tools) | Whether it forces content versioning. If yes, it's a quarter of work, not a sprint. |
| Refunds, seat math, billing behavior | Finance | Manual cost. They will ask "how many times a month" and the answer needs to be real. |
| Live session reliability bar | Tobias, in practice | Nobody has written the bar down. This is a genuine gap. |
| Whether something ships during a cohort wave | Support lead | Will say no in late August. Plan around it. |
| Public copy and naming | Design owns empty states, PM owns everything else | See `../design/CLAUDE.md` |

## What each one predictably asks

Worth knowing before the meeting rather than after:

- **Finance** — what's the manual cost per month, and does this change it?
- **Marguerite** — does this need a content model change? If you can't answer that, the
  meeting will end there.
- **Support** — what does this do to ticket volume in the first two weeks?
- **Legal** — only ever about the one-click exit path. They have not asked about anything
  else in two years, and they will ask about that every time.

## The undocumented part

Knowing *which forum* to bring something to is held by two people and written nowhere
except here:

- Content-model questions go to the Instructor Tools weekly sync, not Slack. Asked in
  Slack, they sit.
- Anything touching money goes to Finance in writing first, then a meeting. Reverse that
  order and you get a no.
- Reliability questions go directly to Tobias. There is no forum for this and there
  probably should be.
