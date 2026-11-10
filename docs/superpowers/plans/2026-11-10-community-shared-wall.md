# Sponsor and community shared wall

The user's correction replaces the previous outer-access design: sponsors and communities must physically share one back wall, with no alley or second wall between them. Community entrances remain on the southern outer road.

## Validated cause and scope

The live collision grid matches commit c899a10. Sponsor floors end at row80, community floors begin at85, and two two-tile wall bands surround the row82 alley. This is an authored geometry error, not an infrastructure problem. Guide routes use the central avenue and southern road; neither needs the alley.

Use a single two-tile glazed separator at rows80–81 in each block. Bring all five existing 6×4 community floors, desks, plants, logos and captions three tiles north. Their floors start immediately at82. Delete their separate back walls and the alley; shorten their sidewalls to their usable floors. Retile the released southern frontage as the outer stone walkway. Preserve sponsor floor areas, furniture, all five community identities, all164 atlas reservations, central four-tile passage, arrival and map controls. Merely filling the alley or moving two walls together would retain a doubled wall and would not satisfy the correction.

## Execution and acceptance

1. Write failing-first assertions for one horizontal wall band with adjoining sponsor/community floors and direct southern access. Existing perpendicular sidewalls meet it at their corners; they retain their original geometry so the northern guide route stays open. Update superseded alley/coordinate assertions while preserving reachability and scope checks. Run files individually under MemoryMax6G/MemorySwapMax0 in tmux.
2. Edit only the reviewed court placements and their transition recipe; rebuild native projection without repacking atlases. Refresh exact publication receipts and current release facts.
3. Run community access/logos, sponsor court/tiers, arrival, presentation and native projection tests individually. Validate all maps and build. Inspect the rendered candidate; walk all five communities and both sponsors from their correct sides, and prove the shared divider blocks crossing.
4. Obtain review-agent and code-review reviews of the exact staged changes; resolve every finding before one commit. Publish through the existing guarded uploader as htooayelwinict, preserving editor WAM state. Verify two full readbacks, live entry/exit paths, shared-wall collision and a fresh reload screenshot.

## Review focus

Check that there is no remaining alley or overlapping second wall; decorations and captions do not cover each other; all communities retain equal usable area; the central avenue and guide routes remain open; saved editor data and unrelated native controls are preserved. Completion requires the live map and visitor routes, not only passing tests or a commit.
