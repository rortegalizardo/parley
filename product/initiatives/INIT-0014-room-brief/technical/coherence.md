Verdict: defects-open
Mode: PRODUCT-DISCOVERY
Initiative: INIT-0014
Story set reviewed: REQ-0001 (rev 1, draft), REQ-0002 (rev 1, draft), REQ-0003 (rev 1, draft)
Authorising decision: PD-0005 (option B), with the rulings of PD-0006
Assessment round relied on: 1
Reviewed: 2026-11-06
Round: 1 of 2 — full pass

Evidence: [capability-scan.md](capability-scan.md), [impact.md](impact.md),
[assessment.md](assessment.md) (round 1). Code read on `main` at `b6591be`.
Source lines cited below are evidence only, not design.

## Per-story checks

| REQ- id | Independently verifiable? | Sequencing note consistent? | Assumed capability | Result |
| --- | --- | --- | --- | --- |
| REQ-0001 | Yes. Every AC can be checked through migration on a copied store, a prompt check, `/note` and the HTTP API, with no surface from REQ-0002 or REQ-0003. | Yes on order: the server (S1-S6) is upstream of the surfaces (U1-U4) in impact.md, and it comes first. No: it says nothing about the time after it ships and before REQ-0002 and REQ-0003 replace the old surfaces (defect 1). | Creates every server capability the scan marked absent or partial: one brief, archived Decisions, migration that marks rooms done, the transition-line marker, stale-save refusal, per-save timeline note, archive-on-omit for Tidy, and limits on new text only. None is assumed. | Defect 1 (blocking), defect 4 (non-blocking) |
| REQ-0002 | Yes, once REQ-0001 is done, as stated. | Yes: `depends_on: [REQ-0001]`, and it matches the dependency direction. | "What agents see" (scanned absent) and the merge suggestion (absent) are created here. The length counter (partial) is fixed here and in REQ-0001 under C-10. The preview needs the delivery composition run on unsaved form contents. That server work belongs to this story under C-02, but its Scope says it "ends at the surfaces" (defect 3). | Defect 3 (non-blocking) |
| REQ-0003 | No. AC 3 ("with unsaved Brief tab edits open … `Save brief` saves both") and Behavior 4 need the Brief tab, which REQ-0002 creates. | No: it says "Independent of REQ-0002" (defect 2). | Pin on a message and on the agreed decision card both exist today (`ui/app.js:1015`, `:5120-5163`). The Pin suggestion exists. None is assumed beyond the Brief tab. | Defect 2 (blocking), defect 5 (non-blocking) |

**Verdict-drift check (whole set).** The set matches option B as assessed:
the Brief tab replaces the Direction tab, the Room tab loses its note field,
and the server work is S1-S6. The PD-0006 rulings are each the option the
assessment recommended and costed (RQ-1 to RQ-6, option a). RQ-3a keeps the
band at `multi-component`. No story needs work the assessment never assessed,
and C-13 (option A only) is correctly absent. The PD-0005 constraints are all
assigned: C-01 to C-12, C-14 and C-15. Not `regression-required`.

## Defects

| # | REQ- id | Check failed | Blocking? | Disposition | Resolvable in decomposition? | Note |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | REQ-0001 (affects REQ-0002, REQ-0003) | Independence / sequencing — hidden coupling at release | blocking | open | Yes | After REQ-0001 ships, the old note and direction are "never read or sent again" (Behavior 6). The old surfaces are still in place until REQ-0002 and REQ-0003 replace them: the Direction tab, the Direction tab's Tidy, the pin dialog and the Room tab's note field. Until then: (a) the Direction tab and the pin save the old direction (`ui/app.js:5153-5155`), so goal and pin edits are silently ignored; (b) the Room tab's footer Save always resends the note field (`ui/app.js:4841`). That field is filled once, when Settings opens (`:4733`). If an old-style note save becomes a Rules save, as `/note` needs (Behavior 10), then any Room tab save, even one that only changes the mode, writes that copy over Rules. Both break PD-0002 item 8 ("nothing lost"). No story says the three ship together, or that the old surfaces keep writing into the brief until they are replaced. C-15's desktop repackage, listed on REQ-0001 only, has the same problem: a package built after REQ-0001 alone bundles the old UI. The PM picks one repair by editing the stories: either the stories state they release together (one restart, one repackage), or REQ-0001 states what an old-shape save does until replaced. That choice is about rollout, not product behaviour. This check does not pick it. |
| 2 | REQ-0003 | Independence — hidden prerequisite | blocking | open | Yes | Behavior 4 and AC 3 test a pin joining unsaved **Brief tab** edits with no outdated-edit message. The Brief tab and its stale-save message are REQ-0002 (Behavior 3). The Sequencing section says "Independent of REQ-0002", and `depends_on` names only REQ-0001. REQ-0003 cannot pass AC 3 unless REQ-0002 ships first. Without REQ-0002, the pin would join the old Direction tab's edits, which save to the unread direction (defect 1). Repair: depend on REQ-0002 for that behaviour, or move Behavior 4 and AC 3 into REQ-0002. |
| 3 | REQ-0002 | Assumed capability — scope wording | non-blocking | open | Yes | "What agents see" is scanned absent. Under C-02 it must come from the delivery composition, run on the form's unsaved contents. So part of this story's work is on the server. The obligation is already bound to this story by C-02 and Behavior 2, but the Scope line "Ends at the surfaces" says otherwise. Clarifying only. |
| 4 | REQ-0001 | Scope wording | non-blocking | open | Yes | The Scope line says "Ends at the server", but the story owns `/note`, which the browser handles (`ui/app.js:3908-3912`). It also lists C-10, whose client half (the Save gate on the Direction tab) is removed by REQ-0002. Clarifying only; neither changes what gets built. |
| 5 | REQ-0003 | Sequencing note wording | non-blocking | open | Yes | Behavior 4 says the pinned line "joins them and is saved with them (as today)". Today the pin is saved at once **and** added to the open edit (`ui/app.js:5155-5158`). AC 2 (an unconditional save with its timeline note) settles it the same way. Read alone, though, Behavior 4 could mean the pin is saved only by `Save brief`, and then `Discard changes` would drop it. Suggest wording: "saved at once, and also added to the open edit". |

Counts: 2 blocking open, 3 non-blocking open, 0 fixed, 0 carried-accepted.

## Questions raised

| Q- id | What it blocks |
| --- | --- |
| none | No defect needs a product answer. Defects 1 and 2 are sequencing and rollout repairs the PM makes by editing the stories. No `Q-` file was written; this dispatch allowed one file. |

## Round declaration

Round 1 of 2, full pass over REQ-0001, REQ-0002 and REQ-0003. The verdict
has 2 open blocking defects, so a delta re-check (round 2) may run, under
size rule §9d.3. It covers only the repaired stories (REQ-0001, REQ-0003 and,
if defect 2 is repaired by moving AC 3 there, REQ-0002) and the dependency
edges touching them. Defects 3-5 are non-blocking. They do not hold the
verdict open, and they need no round 2 of their own. Round 2 is the last
round against this set (skill rule 10); no round 3 runs.
