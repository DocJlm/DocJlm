# Artwork & credits

## Theresa / Arknights

Theresa and the Arknights character artwork belong to Hypergryph. This personal profile is an unofficial fan presentation and does not imply endorsement.

The preserved reference is `assets/source/theresa.png`, obtained on 2026-10-22 from a community collection of Arknights character sprites and story illustrations:

- [Collection and attribution context](https://www.bilibili.com/opus/920244864025624583)
- [Original downloaded image](https://i0.hdslb.com/bfs/article/3673a0f8b807b4ae5769818d4b492e55289482901.png)

This is a community mirror, not a first-party distribution endpoint. No open-source license is asserted for the game artwork.

The two hero banners are **AI-assisted adaptations**, created with the built-in OpenAI image-generation tool using the preserved reference. They are not unmodified official screenshots or pixel-identical copies of the original sprite. Original profile typography, layout, atmospheric scenery and palette were developed for this profile. See `ART-DIRECTION.md` for the production brief.

## Contribution visualizations

- [Platane/snk](https://github.com/Platane/snk) — snake path and SVG animation. Workflow pinned to `d8f6715049803e982ee5ff501b6b9b7d5deeb09b`.
- [yoshi389111/github-profile-3d-contrib](https://github.com/yoshi389111/github-profile-3d-contrib) — MIT; isometric contribution rendering. Workflow pinned to `e235d118909be71eb7edb05482a3de4e76156df3`.

The original city geometry, complete radar/language/summary panels and available contribution values are retained. Post-processing applies a coordinated language palette and derives a stacked mobile layout. The city palette is configured in `config/city-themes.json`.

The bundled `assets/generated/` files are a local preview snapshot from DocJlm's public GitHub contribution calendar, fetched on 2026-10-22: 369 displayed days, 2025-10-19 through 2026-10-22, 3,742 contributions. These calendar values are actual public values, not example data. The complete language, radar, Stars and Forks data are unavailable in this local-only delivery and explicitly marked `Awaiting first sync`; no fabricated chart segments or values are shown. The production workflow fetches fresh GitHub data with the repository's built-in token. Visibility may differ according to GitHub's token access and contribution rules.

## Historical squad animation sources

The earlier scene used original Arknights Spine models mirrored by [Ark-Models](https://github.com/isHarryh/Ark-Models), pinned to commit `e65fb9147846b64bcf2df956b8cd8da77a51b9b8`. Downloaded on 2026-10-22. The exact URLs and SHA-256 hashes are in `assets/source/squad/manifest.json`; the original atlas, skeleton and texture files are preserved there.

| Character | Source model | Actions used |
| --- | --- | --- |
| Theresa | `models_enemies/3007_lrssia/enemy_3007_lrssia` | `C1_Idle` |
| Amiya | `models/002_amiya/build_char_002_amiya` | `Relax`, `Interact` |
| Kal'tsit | `models/003_kalts/build_char_003_kalts` | `Relax`, `Interact` |
| W | `models/113_cqbw/build_char_113_cqbw` | `Relax`, `Interact` |

Theresa is the character named 特蕾西娅，“演出” in the model index; this is not a relabeled Civilight Eterna model. Only her neutral idle is used, without story or combat effects.

The [Babel emblem](https://prts.wiki/w/文件:Logo_巴别塔.png) and [Rhodes Island emblem](https://prts.wiki/w/文件:Logo_罗德岛.png) are game artwork mirrored by PRTS. Exact image URLs and hashes are also in the manifest. The marks are presented as white game emblems on small dark plaques.

### Rendering tools

The export approach was informed by [Nattsu39/spine-exporter](https://github.com/Nattsu39/spine-exporter). Its legacy native canvas/WebGL dependency was incompatible with the installed Mac runtime, so this project uses the same `@node-spine-runtimes/core-3.8.99` runtime (0.1.1) with an original CPU canvas mesh renderer, `@napi-rs/canvas` (0.1.80), FFmpeg and Gifsicle. The Spine runtime license is retained as `assets/source/squad/SPINE-RUNTIME-LICENSE.txt`; game artwork remains © Hypergryph and is not relicensed by the tooling.

Original PMA textures are converted to straight alpha only in memory during rendering. Exported scenes have opaque cool-white backgrounds. GIF frame optimization may use transparent unchanged pixels internally; composited playback remains opaque. Both GIFs have corresponding static PNGs for reduced motion.


## OPERATION / COMPILE revision — 2026-10-22

The selected first concept and all four derived hero/scenery compositions are archived in `assets/source/operation/`, with SHA-256 records in its manifest. They were produced using the built-in image generation tool, guided by the selected reference. These are AI-assisted fan illustrations of Theresa and Babel-inspired industrial architecture, not official Hypergryph promotional assets. Hero mobile is a separate composition; scenery contains no painted stand-in characters. The actual animated characters retain the pinned Ark-Models sources documented above.

The station roles BRANCH / DEBUG / BUILD / DEPLOY and dialogue are original fan-made developer metaphors, not canonical story events, live telemetry or statements of the user's favorite supporting characters. The scenic city is decorative; contribution statistics appear in a separate real chart.

- [Tabler Icons](https://github.com/tabler/tabler-icons/tree/v3.34.1), version 3.34.1: bug and cube, MIT license bundled in `assets/source/icons/LICENSE`. Used as small animated developer UI symbols.
- [Barlow Condensed](https://github.com/google/fonts/tree/main/ofl/barlowcondensed): Bold font, SIL Open Font License bundled in `assets/source/fonts/OFL.txt`. Rasterized into scene labels, no visitor font download required.

Generation brief: preserve the selected image's cool-white industrial isometric platforms, dark structure, cyan code routes and orange deployment gate; prepare four empty standing pads for real Spine actors. Mobile uses two distinct levels. Hero pairs exact DocJlm lettering and existing tagline with Theresa, preserving complete horns and facial identity. See ART-DIRECTION.md and the bundled source compositions for visual intent; `npm run build:hero` and `npm run build:squad` reproduce delivery images from those sources.

Earlier pastel/dark hero files remain historical assets and are not referenced by the current README.


## Current BABEL / AGENT HARNESS — 2026-10-22

The current README uses the selected **BABEL / AGENT HARNESS** concept in `assets/source/harness/selected-concept.png`. The large Theresa portrait, desktop/mobile architectural plates, crystalline error cube and three spell effects are **AI-assisted fan illustrations**, generated independently as compositing layers with the selected concept as reference. They are not official illustrations. The background plates contain no painted operators; the animated squad is rendered from genuine game skeletons. Exact local generation origins and hashes are preserved in `assets/source/harness/manifest.json`.

Amiya, Kal’tsit and W combat models and portrait cards come from the community mirror [fexli/ArknightsResource](https://github.com/fexli/ArknightsResource), pinned to `de6cfb30ed1d41d9102d93e8ea400fc0cefc8ff7`. Exact download URLs and hashes are in `assets/source/battle/manifest.json`.

| Character | Current model | Current actions |
| --- | --- | --- |
| Theresa | Ark-Models `enemy_3007_lrssia` | `C1_Idle`, `C1_Skill_3` |
| Amiya | ArknightsResource `char_002_amiya/Front` | `Idle`, `Attack` |
| Kal’tsit | ArknightsResource `char_003_kalts/Front` | `Idle`, `Attack` |
| W | ArknightsResource `char_113_cqbw/Front` | `Idle`, `Skill_3` |

All four are Spine 3.8.99. Character assignments are original developer-story metaphors, not canonical events or claims about favorite characters. Code, UI labels, routing overlays, timing and effects are composed separately. The deterministic Python harness is a scripted offline illustration of a ReAct-style loop; no live LLM, Claude Code service or private project activity is connected.

Tabler Icons 3.34.1 supplies terminal, code, eye, tool, save, check, alert, branch, play and cube symbols under the bundled MIT license. [Anton](https://github.com/google/fonts/tree/main/ofl/anton), with its bundled SIL OFL license and source hashes, supplies current display typography. Barlow Condensed remains in historical artwork. Menlo, when available on the rendering Mac, supplies rasterized code text; the OS font is not redistributed, and viewers need no external font download. A system monospace fallback is available on other render hosts.

Current generation: `npm run build:harness`. Earlier hero, squad and OPERATION / COMPILE assets remain historical sources and are not referenced by the README.
