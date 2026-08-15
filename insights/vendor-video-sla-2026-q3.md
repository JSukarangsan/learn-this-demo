# Vendor video SLA — Q3 2026 export

**This file is a copy, and that is deliberate.** The canonical SLA lives in the vendor
portal, which is SSO-only with no API — `context-manifest.yaml` says so, and marks it
`reachable: false`. So once a quarter a person opens the portal and pastes the numbers
here. That makes this file the copy of record for anything downstream.

**Exported by:** Tobias Ferro · **Covering:** 2026-07-01 → 2026-09-30 (partial, through Aug 4)
**Next export due:** first week of October

---

## Committed

| | Commitment | Measured at |
|---|---|---|
| Live session uptime | 99.9% | Per session, vendor-side |
| Recording availability | Within 4 hours of session end | Per recording |
| Support response | 24 hours | Business days only |
| Player start time | Under 2s at p95 | Vendor's measurement, not ours |

## Actual, quarter to date

| | Actual | Against commitment |
|---|---|---|
| Live session uptime | 99.94% | met |
| Recording availability | 3h 10m median, **9h 40m at p95** | **missed at p95** |
| Support response | 19h median | met |
| Player start time | 2.4s p95 | **missed** |

## The two that matter

**Recordings at p95.** The median is fine and the tail is not. A learner who missed a
Thursday evening session and expects the recording on Friday morning is inside that tail
often enough to notice. This is the complaint that reaches instructors, who raise it in
NPS as a platform problem rather than a vendor one.

**Player start time.** Missed on the vendor's own measurement, which means our number is
probably worse. We don't measure it independently and should.

## What the SLA does not cover

- Anything about the **pinned SDK version.** There is no commitment to backwards
  compatibility, which is why an upgrade requires a full session-recording regression pass
  rather than a version bump. See `../engineering/constraints.md`.
- Storage retention beyond 12 months. Currently a commercial conversation, not a
  contractual one — and it is the input to the open question about whether recordings move
  to our own storage.

## Why this isn't automated

The portal has no API and SSO can't be scripted. Someone opens it, reads four numbers, and
updates this file — about ten minutes a quarter. Writing down that this is manual, and
that the manual copy is authoritative, is the honest version. A pipeline that pretends to
refresh this would be worse than a person who knows they have to.
