Verdict: coherent
Mode: PRODUCT-DISCOVERY
Initiative: INIT-0014
Story set reviewed: round 1: REQ-0001 (rev 1, draft), REQ-0002 (rev 1, draft), REQ-0003 (rev 1, draft). Round 2: the same three at rev 2 (repair commit `8315eb3`)
Authorising decision: PD-0005 (option B), with the rulings of PD-0006
Assessment round relied on: 1
Reviewed: 2026-11-06
Round: 2 of 2 — delta re-check (round 1 was the full pass; its findings are kept below)

Evidence (both rounds): [capability-scan.md](capability-scan.md), [impact.md](impact.md),
[assessment.md](assessment.md) (round 1). Code read on `main` at `b6591be`.
Source lines cited below are evidence only, not design.

## Per-story checks

| REQ- id | Independently verifiable? | Sequencing note consistent? | Assumed capability | Result |
| --- | --- | --- | --- | --- |
| REQ-0001 | Yes. Every AC can be checked through migration on a copied store, a prompt check, `/note` and the HTTP API, with no surface from REQ-0002 or REQ-0003. | Yes on order: the server (S1-S6) is upstream of the surfaces (U1-U4) in impact.md, and it comes first. No: it says nothing about the time after it ships and before REQ-0002 and REQ-0003 replace the old surfaces (defect 1). | Creates every server capability the scan marked absent or partial: one brief, archived Decisions, migration that marks rooms done, the transition-line marker, stale-save refusal, per-save timeline note, archive-on-omit for Tidy, and limits on new text only. None is assumed. | Defect 1 (blocking), defect 4 (non-blocking) |
| REQ-0002 | Yes, once REQ-0001 is done, as stated. | Yes: `depends_on: [REQ-0001]`, and it matches the dependency direction. | "What agents see" (scanned absent) and the merge suggestion (absent) are created here. The length counter (partial) is fixed here and in REQ-0001 under C-10. The preview needs the delivery composition run on unsaved form contents. That server work belongs to this story under C-02, but its Scope says it "ends at the surfaces" (defect 3). | Defect 3 (non-blocking) |
| REQ-0003 | No. AC 3 ("with unsaved Brief tab edits open … `Save brief` saves both") and Behavior 4 need the Brief tab, which REQ-0002 creates. | No: it says "Independent of REQ-0002" (defect 2). | Pin on a message and on the agreed decision card both exist today (`ui/app.js:1015`, `:5120-5163`). The Pin suggestion exists. None is assumed beyond the Brief tab. | Defect 2 (blocking), defect 5 (non-blocking) |

**Round 2 (delta re-check, rev 2 of all three stories).**

| REQ- id | Independently verifiable? | Sequencing note consistent? | Assumed capability | Result |
| --- | --- | --- | --- | --- |
| REQ-0001 | Yes, unchanged. Still verified alone on an isolated port with a copy of the store (prompt check, `/note`, HTTP API). The new "Released together" paragraph says so. | Yes. It now says the three ship together, with one restart and one repackage after all three are on `main`. The restart is the requester's (impact.md:58), so it can be held back; nothing forces it earlier. The edge to REQ-0002 and REQ-0003 still runs server to surfaces. | No change. Scope now names `/note` and hands the client half of C-10 to REQ-0002. | Defects 1 and 4 fixed |
| REQ-0002 | Yes, once REQ-0001 is done. | Yes: `depends_on: [REQ-0001]`; it says REQ-0003 comes after it; `rollout: coordinated`. | "What agents see" (absent) is created here, server side included. It runs the composition REQ-0001 delivers on unsaved form contents, and REQ-0001 comes first. C-10 is listed here, and its client half is covered by the length behavior and the "Save stays enabled" criterion. | Defects 1 and 3 fixed |
| REQ-0003 | Yes, once REQ-0001 and REQ-0002 are done. AC 3 needs the Brief tab and its outdated-edit check, and both are now upstream. | Yes: `depends_on: [REQ-0001, REQ-0002]`, matching its Sequencing text; `rollout: coordinated`. No cycle: REQ-0001 → REQ-0002 → REQ-0003. | None beyond the Brief tab. | Defects 1, 2 and 5 fixed |

**Verdict-drift check (whole set; round 1, re-confirmed in round 2).** The set matches option B as assessed:
the Brief tab replaces the Direction tab, the Room tab loses its note field,
and the server work is S1-S6. The PD-0006 rulings are each the option the
assessment recommended and costed (RQ-1 to RQ-6, option a). RQ-3a keeps the
band at `multi-component`. No story needs work the assessment never assessed,
and C-13 (option A only) is correctly absent. The PD-0005 constraints are all
assigned: C-01 to C-12, C-14 and C-15. Not `regression-required`.
Round 2: the repair only moved scope wording, added one dependency edge and
set rollout to `coordinated`. It adds no work the assessment did not cost, so
the check still holds.

## Defects

| # | REQ- id | Check failed | Blocking? | Disposition | Resolvable in decomposition? | Note |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | REQ-0001 (affects REQ-0002, REQ-0003) | Independence / sequencing — hidden coupling at release | blocking | fixed | Yes | After REQ-0001 ships, the old note and direction are "never read or sent again" (Behavior 6). The old surfaces are still in place until REQ-0002 and REQ-0003 replace them: the Direction tab, the Direction tab's Tidy, the pin dialog and the Room tab's note field. Until then: (a) the Direction tab and the pin save the old direction (`ui/app.js:5153-5155`), so goal and pin edits are silently ignored; (b) the Room tab's footer Save always resends the note field (`ui/app.js:4841`). That field is filled once, when Settings opens (`:4733`). If an old-style note save becomes a Rules save, as `/note` needs (Behavior 10), then any Room tab save, even one that only changes the mode, writes that copy over Rules. Both break PD-0002 item 8 ("nothing lost"). No story says the three ship together, or that the old surfaces keep writing into the brief until they are replaced. C-15's desktop repackage, listed on REQ-0001 only, has the same problem: a package built after REQ-0001 alone bundles the old UI. The PM picks one repair by editing the stories: either the stories state they release together (one restart, one repackage), or REQ-0001 states what an old-shape save does until replaced. That choice is about rollout, not product behaviour. This check does not pick it. **Round 2: fixed.** REQ-0001 Sequencing and Rollout now say the stories are never released alone: one restart, one repackage, only after all three are on `main`. REQ-0002 and REQ-0003 carry `rollout: coordinated` and their own Rollout sections. That is the first of the two repairs round 1 allowed. The old-surface writes (Direction tab, Tidy, pin dialog, Room tab note field) are replaced by REQ-0002 and REQ-0003 before anything runs on the live server. The restart is the requester's, so it can be held back (impact.md:58). The old-tab version skew after the restart is the already-accepted risk R-4, reload tabs, and is not part of this defect. |
| 2 | REQ-0003 | Independence — hidden prerequisite | blocking | fixed | Yes | Behavior 4 and AC 3 test a pin joining unsaved **Brief tab** edits with no outdated-edit message. The Brief tab and its stale-save message are REQ-0002 (Behavior 3). The Sequencing section says "Independent of REQ-0002", and `depends_on` names only REQ-0001. REQ-0003 cannot pass AC 3 unless REQ-0002 ships first. Without REQ-0002, the pin would join the old Direction tab's edits, which save to the unread direction (defect 1). Repair: depend on REQ-0002 for that behaviour, or move Behavior 4 and AC 3 into REQ-0002. **Round 2: fixed.** REQ-0003 `depends_on` is now `[REQ-0001, REQ-0002]`, and its Sequencing says Behavior 4 and AC 3 need REQ-0002's Brief tab and outdated-edit check. REQ-0002 says REQ-0003 comes after it. No cycle. |
| 3 | REQ-0002 | Assumed capability — scope wording | non-blocking | fixed | Yes | "What agents see" is scanned absent. Under C-02 it must come from the delivery composition, run on the form's unsaved contents. So part of this story's work is on the server. The obligation is already bound to this story by C-02 and Behavior 2, but the Scope line "Ends at the surfaces" says otherwise. Clarifying only. **Round 2: fixed.** REQ-0002 Scope now owns the server side of "What agents see": the composition run on the form's unsaved contents (C-02). |
| 4 | REQ-0001 | Scope wording | non-blocking | fixed | Yes | The Scope line says "Ends at the server", but the story owns `/note`, which the browser handles (`ui/app.js:3908-3912`). It also lists C-10, whose client half (the Save gate on the Direction tab) is removed by REQ-0002. Clarifying only; neither changes what gets built. **Round 2: fixed.** REQ-0001 Scope names the `/note` command, and the client half of C-10 (the browser's 2,000 Save gate) is given to REQ-0002. |
| 5 | REQ-0003 | Sequencing note wording | non-blocking | fixed | Yes | Behavior 4 says the pinned line "joins them and is saved with them (as today)". Today the pin is saved at once **and** added to the open edit (`ui/app.js:5155-5158`). AC 2 (an unconditional save with its timeline note) settles it the same way. Read alone, though, Behavior 4 could mean the pin is saved only by `Save brief`, and then `Discard changes` would drop it. Suggest wording: "saved at once, and also added to the open edit". **Round 2: fixed.** REQ-0003 Behavior 4 and AC 3 now read: saved at once and also added to the open edit; `Save brief` keeps it with no outdated-edit message; `Discard changes` keeps it because it is saved. This matches today's behavior and AC 2. |
| 6 | REQ-0002, REQ-0003 (new in round 2) | Scope wording | non-blocking | open | Yes | The new Rollout sections of REQ-0002 and REQ-0003 cite the desktop repackage (C-15), but neither lists C-15 in its `constraints`. Only REQ-0001 does. With `coordinated` rollout the single repackage is one step after all three stories land, so nothing built or shipped changes. Clarifying only. |

Counts after round 2: 0 blocking open, 1 non-blocking open (defect 6), 5 fixed
(defects 1 to 5), 0 carried-accepted. Round 1 counts were: 2 blocking open,
3 non-blocking open, 0 fixed, 0 carried-accepted. No `carried-accepted`
disposition existed in round 1, so none is carried forward.

## Questions raised

| Q- id | What it blocks |
| --- | --- |
| none | No defect needs a product answer. Defects 1 and 2 were sequencing and rollout repairs the PM made by editing the stories. No `Q-` file was written; each dispatch allowed one file. |

## Round declaration

Round 1 of 2, full pass over REQ-0001, REQ-0002 and REQ-0003. The verdict
has 2 open blocking defects, so a delta re-check (round 2) may run, under
size rule §9d.3. It covers only the repaired stories (REQ-0001, REQ-0003 and,
if defect 2 is repaired by moving AC 3 there, REQ-0002) and the dependency
edges touching them. Defects 3-5 are non-blocking. They do not hold the
verdict open, and they need no round 2 of their own. Round 2 is the last
round against this set (skill rule 10); no round 3 runs.

### Round 2 declaration

Round 2 of 2, delta re-check (`planner`), covering REQ-0001, REQ-0002 and
REQ-0003 at revision 2 and the edges REQ-0001 → REQ-0002 → REQ-0003 only. The
rest of the set was not re-read. Result: all five round 1 defects are fixed,
one non-blocking defect (6) is new and open, and there are 0 open blocking
defects, so the verdict is `coherent`. This is the last round against this
draft set (skill rule 10): no round 3 runs. Defect 6 does not hold the
verdict open and may be carried forward as `carried-accepted` or repaired in
passing by the PM.
