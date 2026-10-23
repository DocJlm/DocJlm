# Local verification — BABEL / AGENT HARNESS

2026-10-22 · branch `design/theresa-babel-profile`. The local checks below were completed before publication; the hosted verification record follows.

## Automated checks

`npm test` passed: 10 Python tests (five artwork and five Harness tests), workflow checks, and Harness source/motion/encoding integration checks. `git diff --check` passed.

The deterministic offline Harness tests cover initial timeout, repair, successful bounded retry, permanent failure, disabled retry, an immediately successful run without a fabricated repair, and an eight-decision bound for a nonterminating agent. The rendered demonstration reports two calls, one retry and a verified checkpoint. It does not call an external model or claim live production activity.

Artwork regressions cover complete statistics, true zero values, absent language data, malformed/incomplete/unsafe input, rejection of preview-only data in production, and retention of previous usable output when generation or validation fails. The workflow publishes only after both contribution generators and validation succeed. Daily Actions do not regenerate character scenes.

Pinned source SHA-256 checks passed. Fixed-position model comparisons found articulated changes for Amiya Attack (22,453 pixels), Kal'tsit Attack (17,154), W Skill_3 (18,945) and Theresa C1_Skill_3 (29,651). These compare actual skeletal animation, not whole-image translation.

## Final encoded outputs

| Output | Dimensions | Frames / duration | Actual size |
| --- | --- | --- | --- |
| Desktop GIF | 1536×1024 | 360 / 24 seconds | 20,907,630 bytes (20.91 MB) |
| Mobile GIF | 768×1408 | 360 / 24 seconds | 14,668,869 bytes (14.67 MB) |
| Desktop static PNG | 1536×1024 | REPAIR at 10.6 seconds | Opaque full-color fallback |
| Mobile static PNG | 768×1408 | REPAIR at 10.6 seconds | Opaque full-color fallback |

Both animations loop indefinitely at approximately 15 fps. GIF frame delays alternate to preserve 24 seconds. Encoding uses a 256-color palette, Bayer dithering and Gifsicle optimization. The more visible effects bring desktop to 0.91 MB above its approximate 20 MB target and mobile to 2.67 MB above 12 MB. The approved quality-first tradeoff retains resolution, all characters and the complete sequence.

The final second blends to the first frame. Aspect-preserving 384px-wide source-frame mean RGB differences (0–255 scale): desktop wrap 0.04464 vs first adjacent 0.26962; mobile wrap 0.05291 vs first adjacent 0.33579. This measures seam continuity, not a claim that every action is physically simulated.

## Browser and visual verification

Preview: http://127.0.0.1:8765/profile-preview.html. Final refinement uses explicit browser viewports 1280×900, 375×900 and 320×900 at 1× screenshot density. Measured article client widths were 958, 357 and 302 CSS px. These are actual browser breakpoint tests, not physical mobile hardware.

- Desktop and mobile GIF/PNG choices loaded at their intended dimensions. No horizontal overflow was measured.
- Reduced-motion controls selected static artwork and stopped the preview snake; README source ordering covers narrow reduced-motion views before broader sources.
- Light and dark backgrounds retained fixed-bright illustrations and charts.
- The previous revision had over 266 seconds of browser playback. The final refinement then played for over 366 seconds with phase screenshots and no browser warning/error entries. Contact sheets, actual-model checks and encoded frame validation cover the full sequence.
- No browser warning/error entries were observed.
- The personal website returned HTTP 200. Confirmed bio, site and hobbies remain; no birthday, age, contact block or project wall was added.
- Actual browser rendering was compared beside the selected concept, including a focused console comparison. See `design-qa.md` and evidence files in the task's `outputs` directory.

## Real data and deferred checks

The public calendar snapshot remains real: 3,742 contributions over the existing 2025-10-19 to 2026-10-22 date range. Language, radar, Stars and Forks remain `Awaiting first sync` or an explicitly unknown dash; no invented proportions or unknown-as-zero values were introduced. Full panel areas are retained.

Daily/manual workflow uses the built-in `GITHUB_TOKEN` and the actual `master` branch configuration, publishing complete validated contribution assets to `output`. Real remote Actions success, authenticated complete statistics and GitHub-hosted image rendering/caching are unverified because this delivery is local only.

## Reproduction and package

See `MAINTENANCE.md` for dependency, generation and preview commands; `CREDITS.md` and source manifests identify original game resources and generated fan illustration separately. `scripts/package_delivery.py` copies final assets, preview and reports and creates a CRC-checked source ZIP, excluding Git internals, dependency installations, scratch frames and environment files. Source SHA checks and current ZIP contents are verified during handoff.

## Effects refinement verification

New shared-cue assertions check that the patch is not shown before 10 seconds, error compression starts only after it, errors clear by 13 seconds, and verification does not claim success until 16 seconds. All 10 Python tests, workflow checks and the extended animation integration suite passed after rendering. Existing game models and source hashes are unchanged.

The console now promotes timeout and patch details into its main code workspace. The battlefield and mobile/desktop patch panels read the same TRACE/BIND/PATCH/CLEAR cues. Amiya's cast envelope follows the 1.7667-second Attack cycle. Pink multi-target containment, error compression and the matching highlighted operator rail were inspected in phase proofs and the browser. A mobile banner/portrait overlap found in the first proof was corrected before final rendering.

## Published verification — 2026-10-22 (America/Los_Angeles)

Published to https://github.com/DocJlm through commit `d54966b234a2dca08506f3176b28754552717711` on `master`, without rewriting existing history. The first new artwork workflow succeeded: https://github.com/DocJlm/DocJlm/actions/runs/39880648912. It atomically published output commit `093a13f11387602d55f8e7d1cb6cf13843066e4a`.

Actual public GitHub rendering loaded the 1536×1024 desktop GIF, 768×1408 mobile GIF, cyan snake, full desktop city and compact mobile city. GitHub retained all responsive and reduced-motion picture source rules. A live browser desktop screenshot and full page were saved as `outputs/github-live-desktop.png` and `outputs/github-live-full.png`; `github-live-city.png` shows the real complete chart.

The generated SVG has all four calendar/radar/language/summary panels and no Awaiting first sync marker. It reports 3,765 contributions, 23 cumulative repository Stars and 1 Fork for upstream period 2025-10-19 / 2026-10-23 (the generator uses its own date boundary). These are generated snapshot values, not permanent account totals. The offline preview retains its explicitly identified pre-publication calendar snapshot; the public GitHub page is authoritative for daily refreshed data.

Vendored source bytes are protected from Git line-ending conversion by `.gitattributes`, preserving the recorded original font-license checksum.
