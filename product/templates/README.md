# Templates

Copy-ready artifact skeletons. Copy, rename per `../architecture/identifiers.md`,
fill in, and add the index row in the same commit.

Placeholders use `<angle-brackets>`. A template copied without its placeholders
replaced is a `draft` and must not be marked authoritative.

`product-state.md` is the product manager's per-initiative phase file; it is
copied to `initiatives/INIT-nnnn-<slug>/product/state.md` at INTAKE and updated
in every later phase.

`technical-assessment.md` is the architect's per-initiative discovery findings;
it is copied to `initiatives/INIT-nnnn-<slug>/technical/assessment.md` when the
architect is first consulted, and its siblings in that directory take the same
frontmatter. Only `ROLE-planner` writes it.

`working-context-packet.md` is the exception to the rule above: it is the shape
of a **session-local** structure, not of an artifact. A filled copy is never
committed, never indexed, and never stored under `product/`.

`product-definition-contract.md` and `solution-contract.md` are required
phase-exit artifacts of PRODUCT_DEFINITION and SOLUTION_CONVERGENCE
respectively (`product-manager-orchestrator.md` §12.4, §12.6). Both are
drafted by a sonnet drafting child and validated by the product manager
against the raw sources they cite, never accepted unread. Both carry the
same rule: a contract cites raw sources, it never supersedes them.
