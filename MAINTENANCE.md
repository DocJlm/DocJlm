# BABEL / AGENT HARNESS — local maintenance

Repository: DocJlm/DocJlm · base master · local branch design/theresa-babel-profile.
This delivery is local only. No push, PR, hosted Actions run, avatar change or website change.

## Reproduce

Node 20+, Python 3, FFmpeg and Gifsicle are required. The delivery was rendered with Node 24 and Gifsicle 1.98, @napi-rs/canvas 0.1.80 and Spine core 3.8.99. Menlo is used on macOS, with a system monospace fallback elsewhere; display type uses the bundled Anton.

```sh
npm ci --ignore-scripts
npm run demo
npm run build:harness
npm run build:preview
npm test
```

The demo is offline and deterministic: a tool times out, the scripted agent enables one retry, the second call succeeds, and a checkpoint records the result. It uses no API keys, language model or shell command execution. `python3 scripts/harness_demo.py --failures 100` exercises the failed-retry path; `--max-retries 0` disables retries. No failure is labelled as success.

The build renders 360 frames at 15 fps over 24 seconds from one shared timeline. Desktop is 1536×1024; mobile is a separately composed 768×1408. `assets/harness/` contains GIF/PNG pairs and build-info.json. The still selects the repair phase at 10.6 seconds. The final second crossfades to the initial state to avoid an abrupt seam. Portrait/body art stays still while game skeletons, execution overlays and independent spell sprites animate.

```sh
node scripts/build_harness.mjs --still
node scripts/build_harness.mjs --desktop
node scripts/build_harness.mjs --mobile
node scripts/build_harness.mjs --encode-only
node scripts/build_preview.mjs /absolute/path/profile-preview.html
python3 scripts/package_delivery.py /absolute/path/delivery-folder
```

`--still` creates static proofs only. `--encode-only` requires complete existing frame sequences. Scratch frames under ignored `.preview/harness/` are intentionally excluded from source packages. Frames and GIFs use an opaque composition; transparent GIF delta rectangles are only encoding optimization. File-size targets are 20 MB desktop and 12 MB mobile, with visual quality prioritized over a hard limit. Actual byte counts are recorded in build-info.json.

## Source layers and editing

- `assets/source/harness/`: approved concept, transparent illustrated portrait, empty architectural plates, error cube and spell sprites; manifest identifies the built-in image-generation origins and hashes.
- `assets/source/battle/`: pinned original combat skeletons/atlases/textures and game portrait cards. Theresa's pinned original skeleton remains under assets/source/squad/theresa.
- `scripts/harness_timeline.mjs`: shared 24-second phases, code lines, real animation names and `visualAt()` containment/patch cues. Both console layouts and the battlefield consume these cues; edit this shared function when changing repair timing.
- `scripts/harness_demo.py`: executable local trace and bounded retry behavior. The renderer refuses to present a success story if the expected demo does not pass.
- `scripts/build_harness.mjs`: responsive compositions, code typography, alpha compositing, effects, frames and encoding.

Use actual supported model actions; do not translate a static actor to simulate walking. The renderer supports the region/mesh attachments in these pinned models, checks Spine 3.8.99 and rejects unsupported clipping attachments. Original PMA textures are unpremultiplied in memory, never overwritten. Original game copyrights and runtime licenses remain in CREDITS.md.

The previous hero/squad build commands and assets remain for historical reproducibility; they are not used in the current README.

## Offline preview

The preview embeds all images and GitHub Markdown styling into one HTML file, and substitutes local snapshots for output-branch contribution URLs. Controls select light/dark page background, desktop/375px/320px article width, and system/on/reduced motion. Width and motion conditions are evaluated together. The README itself uses only Markdown, picture, source and image elements; the preview's testing JavaScript is not embedded in the GitHub profile.

## Real contribution data

The preserved local calendar has 3,742 contributions across 369 displayed days, 2025-10-19 through 2026-10-22. Language/radar/Stars/Forks remain Awaiting first sync, without invented ratios or zero values. The local SVGs are flagged data-preview-unavailable and rejected by production preparation. Their authenticity is independent of the scripted hero animation.

```sh
python3 scripts/prepare_artwork.py --snake-dir snake-art --city-dir profile-3d-contrib --output-dir dist
```

Only intentional local snapshots may use --preview. The daily/manual/master workflow uses pinned actions and built-in GITHUB_TOKEN, generates the cyan snake and complete light city, validates all three derived outputs, then publishes in one final step. Any earlier failure skips publication and keeps the previous output branch intact. It never rebuilds the hero animation.

## Publication status

Published on 2026-10-22 after explicit user authorization. The public profile loaded desktop/mobile images and the first full contribution workflow succeeded: https://github.com/DocJlm/DocJlm/actions/runs/39880648912. See VALIDATION.md for exact release/output commits and data. The bundled offline preview is the historical pre-publication data snapshot; use the public profile for current daily data.
